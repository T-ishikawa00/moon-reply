begin;

-- A verified payment's existing job remains the obligation and dispatch outbox.
-- Reservations are conservative upper bounds, never refunded on timeout/retry.
alter table public.production_fulfillment_jobs
  add column recovery_next_attempt_at timestamptz,
  add column recovery_reason_code text,
  add column recovery_owner text not null default 'fulfillment-operations',
  add column recovery_review_due_at timestamptz,
  add column recovery_started_at timestamptz,
  add column recovery_cycle_count integer not null default 0,
  add column recovery_operator_evidence jsonb not null default '[]'::jsonb,
  add column provider_call_count integer not null default 0,
  add column provider_reserved_cost_usd numeric not null default 0,
  add column provider_reservations jsonb not null default '[]'::jsonb,
  add constraint paid_recovery_nonnegative check (
    recovery_cycle_count >= 0 and provider_call_count >= 0
    and provider_reserved_cost_usd >= 0),
  add constraint paid_recovery_evidence_arrays check (
    jsonb_typeof(provider_reservations) = 'array'
    and jsonb_typeof(recovery_operator_evidence) = 'array');

create index paid_recovery_due_idx on public.production_fulfillment_jobs
  (recovery_next_attempt_at, state) where state <> 'completed';

-- New runtime finance fence is read-only. Refund/adjustment mutation remains
-- outside service_role's authority, as required by 0013.
grant select on public.production_payment_adjustment_ledger to service_role;

-- Historical manual blocks require investigation; initialize accountable
-- review metadata without changing their evidence or silently re-running.
update public.production_fulfillment_jobs set
  recovery_reason_code = coalesce(last_error_code,'PAID_RECOVERY_LEGACY_REVIEW_REQUIRED'),
  recovery_started_at = requested_at,
  recovery_review_due_at = now() + interval '1 hour'
where state = 'manual_review';

-- An upgrade is not a new compute budget. Prior paid-stage requests count even
-- when their response was lost. Without a stored historical upper bound, an
-- unfinished run consumes the whole conservative cap; report recovery remains
-- possible because the application inspects saved output before reserving.
with prior as (
  select j.id,
    (select count(*) from public.assessment_runs r
      join public.assessment_stage_runs s on s.run_id = r.id
      where r.request_id = p.assessment_request_id and r.run_kind = 'fulfillment_resume'
        and s.stage_id in ('PB-04','PB-05','PB-06') and s.status <> 'skipped') as calls,
    (select coalesce(sum(r.usage_derived_cost_usd),0) from public.assessment_runs r
      where r.request_id = p.assessment_request_id and r.run_kind = 'fulfillment_resume') as known_cost,
    exists (select 1 from public.assessment_runs r
      join public.assessment_stage_runs s on s.run_id = r.id
      where r.request_id = p.assessment_request_id and r.run_kind = 'fulfillment_resume'
        and r.status <> 'completed' and s.stage_id in ('PB-04','PB-05','PB-06')
        and s.status <> 'skipped') as unknown_outcome
  from public.production_fulfillment_jobs j
  join public.production_preparations p on p.id = j.preparation_id
)
update public.production_fulfillment_jobs j set
  provider_call_count = prior.calls,
  provider_reserved_cost_usd = greatest(prior.known_cost,case when prior.unknown_outcome then 2 else 0 end)
from prior where prior.id = j.id;

-- Both adjustment writers and canonical delivery insertion lock the same
-- verified-payment row. No external financial state is inferred by this fence.
create function public.lock_paid_fulfillment_financial_v1(p_logical_assessment_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype;
begin
  select * into job from public.production_fulfillment_jobs
    where logical_assessment_id = p_logical_assessment_id;
  if job.id is null then return false; end if;
  perform 1 from public.production_verified_payments where id = job.verified_payment_id for update;
  if not found then return false; end if;
  return exists (select 1 from public.production_purchase_intents
      where id = job.purchase_intent_id and state = 'verified'
      and successful_payment_id = job.verified_payment_id)
    and exists (select 1 from public.production_assessment_grants
      where id = job.grant_id and status in ('issued', 'completed'))
    and not exists (select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = job.verified_payment_id);
end;
$function$;

create function public.fence_paid_financial_adjustment_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if tg_op = 'UPDATE' and new.verified_payment_id is distinct from old.verified_payment_id then
    raise exception 'PAID_FINANCIAL_AUTHORITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  perform 1 from public.production_verified_payments where id = new.verified_payment_id for update;
  return new;
end;
$function$;
create trigger paid_financial_adjustment_fence before insert or update
on public.production_payment_adjustment_ledger for each row
execute function public.fence_paid_financial_adjustment_v1();

create function public.fence_paid_canonical_delivery_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if not public.lock_paid_fulfillment_financial_v1(new.logical_assessment_id) then
    raise exception 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
create trigger paid_canonical_financial_fence before insert
on public.production_customer_deliveries for each row
execute function public.fence_paid_canonical_delivery_v1();

create function public.schedule_paid_fulfillment_recovery_v1(
  p_fulfillment_job_id uuid, p_owner_id uuid, p_reason_code text,
  p_retryable boolean, p_next_attempt_at timestamptz, p_now timestamptz,
  p_recovery_cycle integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype;
begin
  if p_now is null or p_reason_code is null or p_retryable is null
    or p_reason_code !~ '^[A-Z][A-Z0-9_]{2,119}$'
    or (p_retryable and (p_next_attempt_at is null or p_next_attempt_at <= p_now)) then
    raise exception 'PAID_RECOVERY_ARGUMENT_INVALID' using errcode = 'P0001';
  end if;
  select * into job from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id for update;
  if job.id is null then return null; end if;
  if p_recovery_cycle is not null and p_recovery_cycle <> job.recovery_cycle_count then
    return jsonb_build_object('disposition','stale_event');
  end if;
  if job.state = 'completed' then
    if not exists (select 1 from public.production_notification_outbox n
      join public.production_customer_deliveries d on d.id = n.delivery_id
      where d.logical_assessment_id = job.logical_assessment_id and n.status <> 'sent') then
      return jsonb_build_object('disposition','completed');
    end if;
    -- Email-only failure never alters the completed grant/canonical result.
    update public.production_fulfillment_jobs set
      recovery_next_attempt_at = case when p_retryable then p_next_attempt_at else null end,
      recovery_reason_code = p_reason_code,
      recovery_review_due_at = coalesce(recovery_review_due_at,p_now + interval '1 hour'),
      recovery_cycle_count = recovery_cycle_count + 1,
      dispatch_completed_at = null, dispatch_owner_id = null, dispatch_lease_expires_at = null,
      dispatch_retry_after = case when p_retryable then p_next_attempt_at else null end,
      dispatch_updated_at = p_now, updated_at = p_now
      where id = job.id;
    return jsonb_build_object('disposition',case when p_retryable then 'notification_recovery' else 'operator_required' end,
      'recovery_cycle',job.recovery_cycle_count + 1);
  end if;
  if not exists (select 1 from public.production_purchase_intents where id = job.purchase_intent_id
      and state = 'verified' and successful_payment_id = job.verified_payment_id) then
    raise exception 'PAID_RECOVERY_PAYMENT_UNVERIFIED' using errcode = 'P0001';
  end if;
  if p_owner_id is not null and (job.state <> 'processing'
    or job.owner_id is distinct from p_owner_id or job.lease_expires_at is null
    or job.lease_expires_at <= p_now) then
    raise exception 'RC2_FULFILLMENT_JOB_CONFLICT' using errcode = 'P0001';
  end if;
  -- Exhausted old events cannot steal a live worker. The scanner picks up the
  -- durable marker if that worker dies without running catch/finally.
  if p_owner_id is null and job.state = 'processing' and job.lease_expires_at > p_now then
    update public.production_fulfillment_jobs set
      recovery_reason_code = p_reason_code,
      recovery_next_attempt_at = greatest(p_next_attempt_at, job.lease_expires_at),
      recovery_started_at = coalesce(recovery_started_at, requested_at),
      recovery_review_due_at = coalesce(recovery_review_due_at, p_now + interval '1 hour')
      where id = job.id;
    return jsonb_build_object('disposition','in_progress');
  end if;
  if job.logical_assessment_id is not null and
      not public.lock_paid_fulfillment_financial_v1(job.logical_assessment_id) then
    p_retryable := false; p_reason_code := 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED';
  elsif exists (select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = job.verified_payment_id) then
    p_retryable := false; p_reason_code := 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED';
  end if;
  -- Persist retry intent and reopen the same outbox in one transaction.
  update public.production_fulfillment_jobs set
    state = case when p_retryable then 'retryable' else 'manual_review' end,
    owner_id = null, lease_expires_at = null,
    recovery_next_attempt_at = case when p_retryable then p_next_attempt_at else null end,
    recovery_reason_code = p_reason_code, last_error_code = p_reason_code,
    recovery_started_at = coalesce(recovery_started_at, requested_at),
    recovery_review_due_at = coalesce(recovery_review_due_at, p_now + interval '1 hour'),
    recovery_cycle_count = recovery_cycle_count + 1,
    dispatch_completed_at = null, dispatch_owner_id = null, dispatch_lease_expires_at = null,
    dispatch_retry_after = case when p_retryable then p_next_attempt_at else null end,
    dispatch_updated_at = p_now, updated_at = p_now
    where id = job.id;
  update public.production_logical_assessments set
    status = 'retryable', owner_id = null, ownership_acquired_at = null, lease_expires_at = null,
    recovery_state = case when not p_retryable then 'manual_review'
      when generation_started_at is null then 'pre_provider_retryable'
      else 'post_provider_retryable_same_assessment' end,
    last_error_code = p_reason_code, updated_at = p_now
    where id = job.logical_assessment_id and status <> 'completed'
      and (status <> 'generating' or lease_expires_at <= p_now
        or (lease_expires_at is null and ownership_acquired_at <= p_now - interval '16 minutes'));
  return jsonb_build_object('disposition',case when p_retryable then 'awaiting_recovery' else 'operator_required' end,
    'recovery_cycle',job.recovery_cycle_count + 1);
end;
$function$;

create function public.refresh_paid_fulfillment_recovery_v1(
  p_environment text, p_now timestamptz, p_limit integer default 20
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype; total integer := 0;
begin
  if p_environment is null or p_environment not in ('test','live') or p_now is null
    or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'PAID_RECOVERY_ARGUMENT_INVALID' using errcode = 'P0001';
  end if;
  for job in select j.* from public.production_fulfillment_jobs j
    join public.production_purchase_intents i on i.id = j.purchase_intent_id
    where i.environment = p_environment and i.state = 'verified'
      and i.successful_payment_id = j.verified_payment_id
      and (j.state in ('pending','retryable','processing') or (j.state = 'completed'
        and (j.recovery_reason_code is null or j.recovery_next_attempt_at is not null)
        and exists (select 1 from public.production_notification_outbox n
          join public.production_customer_deliveries d on d.id = n.delivery_id
          where d.logical_assessment_id = j.logical_assessment_id and n.status <> 'sent'
            and (n.status <> 'processing' or n.lease_expires_at <= p_now))))
      and (j.state <> 'processing' or j.lease_expires_at <= p_now
        or (j.lease_expires_at is null and j.updated_at <= p_now - interval '16 minutes'))
      and (j.recovery_next_attempt_at is null or j.recovery_next_attempt_at <= p_now)
      and (j.dispatch_owner_id is null or j.dispatch_lease_expires_at <= p_now)
      and (j.state = 'processing'
        or j.dispatch_completed_at <= p_now - interval '16 minutes'
        or (j.dispatch_owner_id is not null and j.dispatch_lease_expires_at <= p_now))
    order by j.requested_at, j.id for update of j skip locked limit p_limit
  loop
    perform public.schedule_paid_fulfillment_recovery_v1(job.id, null,
      case when job.state = 'processing' then 'PAID_RECOVERY_WORKER_LEASE_EXPIRED'
        else 'PAID_RECOVERY_DISPATCH_NOT_COMPLETED' end,
      true, p_now + interval '1 second', p_now, job.recovery_cycle_count);
    total := total + 1;
  end loop;
  return jsonb_build_object('scheduled_count', total);
end;
$function$;

create function public.claim_rc2_fulfillment_job_by_id_v3(
  p_fulfillment_job_id uuid, p_owner_id uuid, p_lease_expires_at timestamptz,
  p_now timestamptz, p_recovery_cycle integer default null
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype; result jsonb;
begin
  if p_now is null or p_owner_id is null or p_lease_expires_at is null or p_lease_expires_at <= p_now then
    raise exception 'RC2_FULFILLMENT_CLAIM_INVALID' using errcode = 'P0001';
  end if;
  select * into job from public.production_fulfillment_jobs where id = p_fulfillment_job_id for update;
  if job.id is null then return null; end if;
  if (p_recovery_cycle is not null and p_recovery_cycle <> job.recovery_cycle_count)
    or job.recovery_next_attempt_at > p_now then
    return jsonb_build_object('disposition','in_progress','fulfillment_job_id',job.id);
  end if;
  if job.state = 'completed' and job.recovery_reason_code is not null
    and job.recovery_next_attempt_at is null then
    return jsonb_build_object('disposition','manual_review','fulfillment_job_id',job.id);
  end if;
  if job.state <> 'completed' and exists (select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = job.verified_payment_id) then
    perform public.schedule_paid_fulfillment_recovery_v1(job.id,null,
      'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED',false,null,p_now,job.recovery_cycle_count);
    return jsonb_build_object('disposition','manual_review','fulfillment_job_id',job.id);
  end if;
  result := public.claim_rc2_fulfillment_job_by_id_v2(job.id,p_owner_id,p_lease_expires_at,p_now);
  return result || jsonb_build_object('recovery_cycle',job.recovery_cycle_count);
end;
$function$;

create function public.list_due_paid_fulfillment_dispatch_v1(
  p_environment text, p_now timestamptz, p_limit integer default 20
) returns table(fulfillment_job_id uuid)
language plpgsql security invoker set search_path = '' as $function$
begin
  if p_environment is null or p_environment not in ('test','live') or p_now is null
    or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'PAID_RECOVERY_ARGUMENT_INVALID' using errcode = 'P0001';
  end if;
  return query select j.id from public.production_fulfillment_jobs j
    join public.production_purchase_intents i on i.id = j.purchase_intent_id
    where i.environment = p_environment and i.state = 'verified'
      and i.successful_payment_id = j.verified_payment_id
      and j.dispatch_completed_at is null and j.state <> 'manual_review'
      and (j.recovery_next_attempt_at is null or j.recovery_next_attempt_at <= p_now)
      and (j.dispatch_retry_after is null or j.dispatch_retry_after <= p_now)
      and (j.dispatch_owner_id is null or j.dispatch_lease_expires_at <= p_now)
      and (j.state <> 'processing' or j.lease_expires_at <= p_now)
      and (j.state <> 'completed' or ((j.recovery_reason_code is null or j.recovery_next_attempt_at is not null)
        and exists (select 1 from public.production_notification_outbox n
          join public.production_customer_deliveries d on d.id = n.delivery_id
          where d.logical_assessment_id = j.logical_assessment_id and n.status in ('pending','failed'))))
    order by j.requested_at,j.id limit p_limit;
end;
$function$;

create function public.claim_rc2_fulfillment_dispatch_v3(
  p_fulfillment_job_id uuid, p_dispatch_marker text, p_owner_id uuid,
  p_lease_expires_at timestamptz, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype;
begin
  if p_now is null or p_owner_id is null or p_lease_expires_at is null
    or p_lease_expires_at <= p_now or p_dispatch_marker is distinct from
      'rc2-dispatch:' || p_fulfillment_job_id::text then
    raise exception 'RC2_FULFILLMENT_DISPATCH_INVALID' using errcode = 'P0001';
  end if;
  select * into job from public.production_fulfillment_jobs where id = p_fulfillment_job_id for update;
  if job.id is null then return null; end if;
  if not exists (select 1 from public.production_purchase_intents where id = job.purchase_intent_id
      and state = 'verified' and successful_payment_id = job.verified_payment_id) then return null; end if;
  if job.state = 'manual_review' or (job.dispatch_marker is not null and job.dispatch_marker <> p_dispatch_marker) then
    return jsonb_build_object('disposition','terminal');
  end if;
  if job.state = 'completed' and ((job.recovery_reason_code is not null and job.recovery_next_attempt_at is null)
    or not exists (select 1 from public.production_notification_outbox n
      join public.production_customer_deliveries d on d.id = n.delivery_id
      where d.logical_assessment_id = job.logical_assessment_id and n.status <> 'sent')) then
    return jsonb_build_object('disposition','terminal');
  end if;
  if job.dispatch_completed_at is not null then return jsonb_build_object('disposition','dispatched'); end if;
  if job.recovery_next_attempt_at > p_now or job.dispatch_retry_after > p_now then
    return jsonb_build_object('disposition','retry_later');
  end if;
  if (job.state = 'processing' and (job.lease_expires_at > p_now
      or (job.lease_expires_at is null and job.updated_at > p_now - interval '16 minutes')))
    or (job.dispatch_owner_id is not null and job.dispatch_lease_expires_at > p_now) then
    return jsonb_build_object('disposition','in_progress');
  end if;
  if job.state <> 'completed' and exists (select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = job.verified_payment_id) then
    perform public.schedule_paid_fulfillment_recovery_v1(job.id,null,
      'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED',false,null,p_now,job.recovery_cycle_count);
    return jsonb_build_object('disposition','terminal');
  end if;
  -- An unknown earlier acceptance is harmless to canonical authority: lease
  -- owners and recovery cycle fence every worker. It is not a terminal queue.
  update public.production_fulfillment_jobs set
    dispatch_marker = p_dispatch_marker, dispatch_owner_id = p_owner_id,
    dispatch_lease_expires_at = p_lease_expires_at,
    dispatch_claimed_at = p_now, dispatch_retry_after = null,
    dispatch_attempt_count = dispatch_attempt_count + 1, dispatch_updated_at = p_now
    where id = job.id;
  return jsonb_build_object('disposition','acquired','recovery_cycle',job.recovery_cycle_count);
end;
$function$;

create function public.record_paid_fulfillment_completion_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if new.state = 'completed' and old.state <> 'completed' then
    new.recovery_next_attempt_at := null;
    new.recovery_reason_code := null;
    new.recovery_operator_evidence := new.recovery_operator_evidence || jsonb_build_array(
      jsonb_build_object('disposition','canonical_delivered','completed_at',new.completed_at,
        'logical_assessment_id',new.logical_assessment_id,'recovery_cycle',new.recovery_cycle_count));
  end if;
  return new;
end;
$function$;
create trigger paid_fulfillment_completion_audit before update
on public.production_fulfillment_jobs for each row
execute function public.record_paid_fulfillment_completion_v1();

create function public.record_paid_notification_recovery_completion_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if new.status = 'sent' and old.status <> 'sent' then
    update public.production_fulfillment_jobs j set
      recovery_next_attempt_at = null, recovery_reason_code = null,
      recovery_review_due_at = null,
      recovery_operator_evidence = recovery_operator_evidence || jsonb_build_array(
        jsonb_build_object('disposition','notification_sent','notification_id',new.id,
          'sent_at',new.sent_at,'recovery_cycle',j.recovery_cycle_count))
    from public.production_customer_deliveries d
    where d.id = new.delivery_id and j.logical_assessment_id = d.logical_assessment_id
      and j.state = 'completed';
  end if;
  return new;
end;
$function$;
create trigger paid_notification_recovery_completion after update
on public.production_notification_outbox for each row
execute function public.record_paid_notification_recovery_completion_v1();

create function public.reserve_paid_fulfillment_provider_v1(
  p_logical_assessment_id uuid, p_owner_id uuid, p_reservation_id uuid,
  p_cost_usd numeric, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype; logical public.production_logical_assessments%rowtype;
  active_count integer; environment_name text;
begin
  if p_now is null or p_owner_id is null or p_reservation_id is null
    or p_cost_usd is null or p_cost_usd <= 0 or p_cost_usd > 2 then
    raise exception 'PAID_RECOVERY_RESERVATION_INVALID' using errcode = 'P0001';
  end if;
  -- Serialize counting and inserting across purchases, without another queue.
  perform pg_catalog.pg_advisory_xact_lock(330033::bigint);
  select * into job from public.production_fulfillment_jobs
    where logical_assessment_id = p_logical_assessment_id for update;
  select * into logical from public.production_logical_assessments
    where id = p_logical_assessment_id for update;
  if job.id is null or job.state <> 'processing' or job.lease_expires_at <= p_now
    or logical.id is null or logical.status <> 'generating'
    or logical.owner_id is distinct from p_owner_id
    or logical.lease_expires_at is null or logical.lease_expires_at <= p_now then
    raise exception 'PAID_RECOVERY_OWNER_CONFLICT' using errcode = 'P0001';
  end if;
  if exists (select 1 from jsonb_array_elements(job.provider_reservations) r
      where r->>'id' = p_reservation_id::text) then
    return jsonb_build_object('disposition','reservation_already_used');
  end if;
  if not public.lock_paid_fulfillment_financial_v1(p_logical_assessment_id) then
    return jsonb_build_object('disposition','financial_review');
  end if;
  if job.provider_call_count >= 24 or job.provider_reserved_cost_usd + p_cost_usd > 2
    or job.requested_at <= p_now - interval '24 hours' then
    return jsonb_build_object('disposition','budget_exhausted');
  end if;
  select environment into environment_name from public.production_purchase_intents where id = job.purchase_intent_id;
  select count(*) into active_count from public.production_fulfillment_jobs j
    join public.production_purchase_intents i on i.id = j.purchase_intent_id
    cross join lateral jsonb_array_elements(j.provider_reservations) r
    where i.environment = environment_name and r->>'finished_at' is null
      and (r->>'lease_expires_at')::timestamptz > p_now;
  if active_count >= 2 then return jsonb_build_object('disposition','concurrency_limited'); end if;
  update public.production_fulfillment_jobs set
    provider_call_count = provider_call_count + 1,
    provider_reserved_cost_usd = provider_reserved_cost_usd + p_cost_usd,
    provider_reservations = provider_reservations || jsonb_build_array(jsonb_build_object(
      'id',p_reservation_id,'owner_id',p_owner_id,'cost_usd',p_cost_usd,
      'reserved_at',p_now,'lease_expires_at',p_now + interval '16 minutes')),
    recovery_started_at = coalesce(recovery_started_at,requested_at), updated_at = p_now
    where id = job.id;
  return jsonb_build_object('disposition','reserved','provider_call_count',job.provider_call_count + 1,
    'provider_reserved_cost_usd',job.provider_reserved_cost_usd + p_cost_usd);
end;
$function$;

create function public.complete_paid_fulfillment_provider_v1(
  p_logical_assessment_id uuid, p_owner_id uuid, p_reservation_id uuid, p_now timestamptz
) returns void language plpgsql security invoker set search_path = '' as $function$
begin
  if p_now is null or p_owner_id is null or p_reservation_id is null then
    raise exception 'PAID_RECOVERY_RESERVATION_INVALID' using errcode = 'P0001';
  end if;
  update public.production_fulfillment_jobs j set provider_reservations =
    (select jsonb_agg(case when r->>'id' = p_reservation_id::text
      and r->>'owner_id' = p_owner_id::text and r->>'finished_at' is null
      then r || jsonb_build_object('finished_at',p_now) else r end order by ordinal)
      from jsonb_array_elements(j.provider_reservations) with ordinality as items(r,ordinal))
    where j.logical_assessment_id = p_logical_assessment_id;
end;
$function$;

create function public.inspect_paid_fulfillment_recovery_v1(p_fulfillment_job_id uuid)
returns jsonb language sql security invoker set search_path = '' as $function$
  select jsonb_build_object('fulfillment_job_id',j.id,'state',j.state,
    'logical_assessment_id',j.logical_assessment_id,'recovery_cycle',j.recovery_cycle_count,
    'reason_code',j.recovery_reason_code,'owner',j.recovery_owner,
    'next_attempt_at',j.recovery_next_attempt_at,'review_due_at',j.recovery_review_due_at,
    'provider_call_count',j.provider_call_count,'provider_reserved_cost_usd',j.provider_reserved_cost_usd,
    'provider_reservations',j.provider_reservations,'operator_evidence',j.recovery_operator_evidence,
    'input_snapshot_sha256',p.consultation_snapshot_sha256,
    'purchase_ready_authority_sha256',p.purchase_ready_authority_sha256,
    'runtime_identity',p.purchase_ready_authority_json->'runtimeIdentity',
    'financial_review_required',exists(select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = j.verified_payment_id))
  from public.production_fulfillment_jobs j join public.production_preparations p on p.id = j.preparation_id
  where j.id = p_fulfillment_job_id;
$function$;

create function public.resume_paid_fulfillment_recovery_v1(
  p_fulfillment_job_id uuid, p_expected_reason_code text,
  p_reviewed_artifact_sha256 text, p_operator_reference text, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare job public.production_fulfillment_jobs%rowtype;
begin
  if p_now is null or p_reviewed_artifact_sha256 is null
    or p_reviewed_artifact_sha256 !~ '^[0-9a-f]{64}$' or p_operator_reference is null
    or char_length(p_operator_reference) not between 3 and 200 then
    raise exception 'PAID_RECOVERY_REVIEW_EVIDENCE_REQUIRED' using errcode = 'P0001';
  end if;
  select * into job from public.production_fulfillment_jobs where id = p_fulfillment_job_id for update;
  if job.id is null or (job.state <> 'manual_review' and not (job.state = 'completed'
      and job.recovery_reason_code is not null and job.recovery_next_attempt_at is null))
    or job.recovery_reason_code is distinct from p_expected_reason_code then
    raise exception 'PAID_RECOVERY_REVIEW_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.production_payment_adjustment_ledger
      where verified_payment_id = job.verified_payment_id) then
    return jsonb_build_object('disposition','financial_review');
  end if;
  update public.production_fulfillment_jobs set recovery_operator_evidence = recovery_operator_evidence
    || jsonb_build_array(jsonb_build_object('reason_code',p_expected_reason_code,
      'reviewed_artifact_sha256',p_reviewed_artifact_sha256,
      'operator_reference',p_operator_reference,'reviewed_at',p_now)),
    recovery_review_due_at = p_now + interval '1 hour'
    where id = job.id;
  return public.schedule_paid_fulfillment_recovery_v1(job.id,null,
    'PAID_RECOVERY_OPERATOR_RESUME_CONFIRMED',true,p_now + interval '1 second',p_now,job.recovery_cycle_count);
end;
$function$;

revoke all on function public.lock_paid_fulfillment_financial_v1(uuid),
  public.fence_paid_financial_adjustment_v1(), public.fence_paid_canonical_delivery_v1(),
  public.schedule_paid_fulfillment_recovery_v1(uuid,uuid,text,boolean,timestamptz,timestamptz,integer),
  public.refresh_paid_fulfillment_recovery_v1(text,timestamptz,integer),
  public.claim_rc2_fulfillment_job_by_id_v3(uuid,uuid,timestamptz,timestamptz,integer),
  public.list_due_paid_fulfillment_dispatch_v1(text,timestamptz,integer),
  public.claim_rc2_fulfillment_dispatch_v3(uuid,text,uuid,timestamptz,timestamptz),
  public.record_paid_fulfillment_completion_v1(),
  public.record_paid_notification_recovery_completion_v1(),
  public.reserve_paid_fulfillment_provider_v1(uuid,uuid,uuid,numeric,timestamptz),
  public.complete_paid_fulfillment_provider_v1(uuid,uuid,uuid,timestamptz),
  public.inspect_paid_fulfillment_recovery_v1(uuid),
  public.resume_paid_fulfillment_recovery_v1(uuid,text,text,text,timestamptz)
from public, anon, authenticated;
grant execute on function public.lock_paid_fulfillment_financial_v1(uuid),
  public.fence_paid_financial_adjustment_v1(), public.fence_paid_canonical_delivery_v1(),
  public.schedule_paid_fulfillment_recovery_v1(uuid,uuid,text,boolean,timestamptz,timestamptz,integer),
  public.refresh_paid_fulfillment_recovery_v1(text,timestamptz,integer),
  public.claim_rc2_fulfillment_job_by_id_v3(uuid,uuid,timestamptz,timestamptz,integer),
  public.list_due_paid_fulfillment_dispatch_v1(text,timestamptz,integer),
  public.claim_rc2_fulfillment_dispatch_v3(uuid,text,uuid,timestamptz,timestamptz),
  public.record_paid_fulfillment_completion_v1(),
  public.record_paid_notification_recovery_completion_v1(),
  public.reserve_paid_fulfillment_provider_v1(uuid,uuid,uuid,numeric,timestamptz),
  public.complete_paid_fulfillment_provider_v1(uuid,uuid,uuid,timestamptz),
  public.inspect_paid_fulfillment_recovery_v1(uuid),
  public.resume_paid_fulfillment_recovery_v1(uuid,text,text,text,timestamptz)
to service_role;

commit;
