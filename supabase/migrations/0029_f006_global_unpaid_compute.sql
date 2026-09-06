begin;

-- A single unpaid pool and 32 reusable slots bound storage independently of
-- Customer count. Paid fulfillment does not use this pool. No Customer bodies,
-- identity, Provider response, token, or cost estimate is stored here.
create table public.global_unpaid_compute_budget (
  pool text primary key check (pool = 'unpaid'),
  policy_version text not null check (policy_version = 'f006-unpaid-invocations-v1'),
  window_seconds integer not null check (window_seconds between 60 and 2678400),
  maximum_invocations integer not null check (maximum_invocations between 1 and 100000),
  maximum_concurrent integer not null check (maximum_concurrent between 1 and 32),
  window_started_at timestamptz not null,
  window_expires_at timestamptz not null,
  used_invocations integer not null check (used_invocations between 0 and 100000),
  check (window_expires_at = window_started_at + make_interval(secs => window_seconds))
);
create table public.global_unpaid_compute_slots (
  slot_number smallint primary key check (slot_number between 1 and 32),
  invocation_id uuid unique,
  lease_expires_at timestamptz,
  check ((invocation_id is null) = (lease_expires_at is null))
);
insert into public.global_unpaid_compute_slots(slot_number)
  select generate_series(1,32);
alter table public.global_unpaid_compute_budget enable row level security;
alter table public.global_unpaid_compute_slots enable row level security;
revoke all on public.global_unpaid_compute_budget, public.global_unpaid_compute_slots
  from public, anon, authenticated, service_role;

create function public.claim_global_unpaid_compute_v1(
  p_invocation_id uuid, p_customer_user_id uuid, p_preparation_id uuid,
  p_customer_policy_version text, p_customer_window_seconds integer,
  p_customer_maximum integer, p_stage_id text, p_attempt_number integer,
  p_global_window_seconds integer, p_global_maximum integer,
  p_maximum_concurrent integer
) returns jsonb language plpgsql security definer set search_path = ''
set lock_timeout = '4s' as $function$
declare
  instant timestamptz;
  budget public.global_unpaid_compute_budget%rowtype;
  selected_slot smallint;
  customer_disposition text;
  active_slots integer;
begin
  if p_invocation_id is null or p_customer_user_id is null or p_preparation_id is null
     or p_global_window_seconds is null or p_global_window_seconds not between 60 and 2678400
     or p_global_maximum is null or p_global_maximum not between 1 and 100000
     or p_maximum_concurrent is null or p_maximum_concurrent not between 1 and 32 then
    raise exception 'F006_COMPUTE_INPUT_INVALID' using errcode = 'P0001';
  end if;
  -- All claims take this single pool lock before the existing preparation and
  -- Customer locks. Releases take only slot locks. No lock is held across HTTP.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('f006:global-unpaid-compute:v1',0));
  instant := clock_timestamp();
  select * into budget from public.global_unpaid_compute_budget where pool = 'unpaid' for update;
  if budget.pool is not null and budget.window_expires_at > instant and
     (budget.window_seconds <> p_global_window_seconds or
      budget.maximum_invocations <> p_global_maximum or
      budget.maximum_concurrent <> p_maximum_concurrent) then
    raise exception 'F006_ACTIVE_POLICY_MISMATCH' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.global_unpaid_compute_slots
      where invocation_id = p_invocation_id) then
    -- A repeated receipt may be a lost-ack replay. It never grants permission
    -- to send a second time under one charged invocation.
    return jsonb_build_object('disposition','duplicate');
  end if;
  if budget.pool is not null and budget.window_expires_at > instant and
     budget.used_invocations >= budget.maximum_invocations then
    return jsonb_build_object('disposition','global_exhausted');
  end if;
  select count(*) into active_slots from public.global_unpaid_compute_slots
    where lease_expires_at > instant;
  if active_slots >= p_maximum_concurrent then
    return jsonb_build_object('disposition','concurrency_exhausted');
  end if;
  select slot_number into selected_slot from public.global_unpaid_compute_slots
    where slot_number <= p_maximum_concurrent and
      (invocation_id is null or lease_expires_at <= instant)
    order by slot_number limit 1 for update;
  if selected_slot is null then
    return jsonb_build_object('disposition','concurrency_exhausted');
  end if;
  -- The old C1 function compares authority.state with <>. A missing row gives
  -- SQL NULL, so explicitly require its presence without changing that API.
  -- Preserve C1 lock order (preparation, execution, ownership, Customer budget).
  perform 1 from public.production_preparations where id = p_preparation_id for update;
  perform 1 from public.production_prepayment_execution_authorities
    where preparation_id = p_preparation_id and state = 'executing' for update;
  if not found then
    raise exception 'F006_CUSTOMER_AUTHORITY_INVALID' using errcode = 'P0001';
  end if;
  -- Preserve the exact C1 Customer quota/ownership API. Its debit and our global
  -- unit plus slot commit together; an exception rolls all three back.
  customer_disposition := public.claim_production_prepayment_compute_unit_v1(
    p_customer_user_id, p_preparation_id, instant, p_customer_policy_version,
    p_customer_window_seconds, p_customer_maximum, p_stage_id, p_attempt_number
  );
  if customer_disposition = 'exhausted' then
    return jsonb_build_object('disposition','customer_exhausted');
  end if;
  if customer_disposition is distinct from 'acquired' then
    raise exception 'F006_CUSTOMER_AUTHORITY_INVALID' using errcode = 'P0001';
  end if;
  -- Start the lease after all potentially contended Customer locks are held.
  instant := clock_timestamp();
  insert into public.global_unpaid_compute_budget as current_budget(
    pool, policy_version, window_seconds, maximum_invocations, maximum_concurrent,
    window_started_at, window_expires_at, used_invocations
  ) values ('unpaid','f006-unpaid-invocations-v1',p_global_window_seconds,
    p_global_maximum,p_maximum_concurrent,instant,
    instant + pg_catalog.make_interval(secs => p_global_window_seconds),1)
  on conflict (pool) do update set
    window_seconds = excluded.window_seconds,
    maximum_invocations = excluded.maximum_invocations,
    maximum_concurrent = excluded.maximum_concurrent,
    window_started_at = case when current_budget.window_expires_at <= instant then instant else current_budget.window_started_at end,
    window_expires_at = case when current_budget.window_expires_at <= instant then excluded.window_expires_at else current_budget.window_expires_at end,
    used_invocations = case when current_budget.window_expires_at <= instant then 1 else current_budget.used_invocations + 1 end;
  update public.global_unpaid_compute_slots set invocation_id = p_invocation_id,
    lease_expires_at = instant + interval '240 seconds'
    where slot_number = selected_slot;
  return jsonb_build_object('disposition','acquired',
    'slot_number',selected_slot,'invocation_id',p_invocation_id,
    'lease_expires_at',instant + interval '240 seconds');
end;
$function$;

create function public.release_global_unpaid_compute_v1(p_invocation_id uuid, p_slot_number integer)
returns boolean language plpgsql security definer set search_path = '' as $function$
begin
  if p_invocation_id is null or p_slot_number is null or p_slot_number not between 1 and 32 then
    raise exception 'F006_COMPUTE_INPUT_INVALID' using errcode = 'P0001';
  end if;
  update public.global_unpaid_compute_slots set invocation_id = null, lease_expires_at = null
    where slot_number = p_slot_number and invocation_id = p_invocation_id;
  -- Delayed old-worker releases cannot clear a reassigned slot. No quota refund.
  return found;
end;
$function$;
revoke all on function public.claim_global_unpaid_compute_v1(uuid,uuid,uuid,text,integer,integer,text,integer,integer,integer,integer),
  public.release_global_unpaid_compute_v1(uuid,integer) from public, anon, authenticated, service_role;
grant execute on function public.claim_global_unpaid_compute_v1(uuid,uuid,uuid,text,integer,integer,text,integer,integer,integer,integer),
  public.release_global_unpaid_compute_v1(uuid,integer) to service_role;
comment on table public.global_unpaid_compute_budget is
  'F006 unpaid invocation units, not currency. Each successful claim consumes one C1 Customer and global unit; never refunded. Fixed window uses DB time.';
comment on table public.global_unpaid_compute_slots is
  'F006 fixed logical unpaid slots. Successful response permits early release; failure/unknown/crash retains 240s. Expiry is not proof of Provider termination. Paid uses no rows.';
commit;
