begin;

do $precondition$
begin
  if pg_catalog.to_regclass('public.production_preparations') is null
     or pg_catalog.to_regclass('public.production_customer_ownership_bindings') is null
     or not exists (
       select 1
       from pg_catalog.pg_proc as procedure
       join pg_catalog.pg_namespace as namespace
         on namespace.oid = procedure.pronamespace
       where namespace.nspname = 'public'
         and procedure.proname = 'begin_production_preparation_v1'
     ) then
    raise exception 'M2_C1_MIGRATION_PRECONDITION_FAILED'
      using errcode = 'P0001';
  end if;
end;
$precondition$;

create table public.production_prepayment_execution_authorities (
  preparation_id uuid primary key,
  execution_capability_hash text not null unique,
  state text not null,
  execution_started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_prepayment_execution_preparation_fk
    foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_prepayment_execution_capability_hash check (
    execution_capability_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint production_prepayment_execution_state check (
    (state = 'awaiting_auth'
      and execution_started_at is null
      and completed_at is null
      and failed_at is null)
    or (state = 'executing'
      and execution_started_at is not null
      and completed_at is null
      and failed_at is null)
    or (state = 'awaiting_clarification'
      and execution_started_at is not null
      and completed_at is null
      and failed_at is null)
    or (state = 'completed'
      and execution_started_at is not null
      and completed_at is not null
      and failed_at is null)
    or (state = 'failed'
      and execution_started_at is not null
      and completed_at is null
      and failed_at is not null)
  )
);

create table public.production_prepayment_auth_continuations (
  id uuid primary key,
  preparation_id uuid not null,
  continuation_token_hash text not null unique,
  csrf_token_hash text not null,
  flow_kind text not null,
  state text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  expired_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_prepayment_auth_preparation_fk
    foreign key (preparation_id)
    references public.production_prepayment_execution_authorities(preparation_id)
    on delete restrict,
  constraint production_prepayment_auth_hashes check (
    continuation_token_hash ~ '^[0-9a-f]{64}$'
    and csrf_token_hash ~ '^[0-9a-f]{64}$'
    and continuation_token_hash <> csrf_token_hash
  ),
  constraint production_prepayment_auth_flow
    check (flow_kind in ('google', 'email_otp')),
  constraint production_prepayment_auth_expiry
    check (expires_at > created_at),
  constraint production_prepayment_auth_state check (
    (state = 'pending' and consumed_at is null
      and expired_at is null and revoked_at is null)
    or (state = 'consumed' and consumed_at is not null
      and expired_at is null and revoked_at is null)
    or (state = 'expired' and consumed_at is null
      and expired_at is not null and revoked_at is null)
    or (state = 'revoked' and consumed_at is null
      and expired_at is null and revoked_at is not null)
  )
);

create unique index production_prepayment_auth_one_pending_idx
  on public.production_prepayment_auth_continuations(preparation_id)
  where state = 'pending';

create table public.production_prepayment_compute_budgets (
  customer_user_id uuid not null,
  policy_version text not null,
  window_started_at timestamptz not null,
  window_expires_at timestamptz not null,
  used_provider_invocation_units integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (customer_user_id, policy_version),
  constraint production_prepayment_budget_customer_fk
    foreign key (customer_user_id)
    references auth.users(id) on delete restrict,
  constraint production_prepayment_budget_policy check (
    policy_version ~ '^[A-Za-z0-9._-]{1,64}$'
  ),
  constraint production_prepayment_budget_window check (
    window_expires_at > window_started_at
  ),
  constraint production_prepayment_budget_used check (
    used_provider_invocation_units >= 0
  )
);

create function public.begin_production_prepayment_intake_v1(
  p_preparation_id uuid,
  p_request_id uuid,
  p_idempotency_key_hash text,
  p_consultation_snapshot_sha256 text,
  p_consultation_snapshot_json jsonb,
  p_safety_authority_json jsonb,
  p_current_situation text,
  p_optional_message text,
  p_relationship text,
  p_requested_topics jsonb,
  p_execution_capability_hash text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
  target_preparation_id uuid;
  authority public.production_prepayment_execution_authorities%rowtype;
begin
  if p_preparation_id is null or p_request_id is null
     or p_idempotency_key_hash is null
     or p_consultation_snapshot_sha256 is null
     or p_consultation_snapshot_json is null
     or p_safety_authority_json is null
     or p_current_situation is null
     or p_requested_topics is null
     or p_execution_capability_hash is null
     or p_now is null
     or p_execution_capability_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'M2_C1_PREPAYMENT_INTAKE_INVALID' using errcode = 'P0001';
  end if;

  result := public.begin_production_preparation_v1(
    p_preparation_id, p_request_id, p_idempotency_key_hash,
    p_consultation_snapshot_sha256, p_consultation_snapshot_json,
    p_safety_authority_json, p_current_situation, p_optional_message,
    p_relationship, p_requested_topics, p_now
  );
  target_preparation_id := (result ->> 'preparation_id')::uuid;

  select * into authority
    from public.production_prepayment_execution_authorities
    where preparation_id = target_preparation_id
    for update;

  if result ->> 'disposition' = 'created' then
    insert into public.production_prepayment_execution_authorities (
      preparation_id, execution_capability_hash, state, created_at, updated_at
    ) values (
      target_preparation_id, p_execution_capability_hash,
      'awaiting_auth', p_now, p_now
    );
    return result || pg_catalog.jsonb_build_object(
      'execution_disposition', 'awaiting_auth'
    );
  end if;

  if authority.preparation_id is null then
    raise exception 'M2_C1_PREPAYMENT_AUTHORITY_MISSING' using errcode = 'P0001';
  end if;
  if authority.state = 'awaiting_auth' then
    update public.production_prepayment_execution_authorities set
      execution_capability_hash = p_execution_capability_hash,
      updated_at = p_now
      where preparation_id = target_preparation_id and state = 'awaiting_auth';
  end if;
  return result || pg_catalog.jsonb_build_object(
    'execution_disposition', authority.state
  );
end;
$function$;

create function public.create_production_prepayment_auth_continuation_v1(
  p_continuation_id uuid,
  p_execution_capability_hash text,
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_flow_kind text,
  p_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  authority public.production_prepayment_execution_authorities%rowtype;
  preparation public.production_preparations%rowtype;
begin
  if p_continuation_id is null or p_execution_capability_hash is null
     or p_continuation_token_hash is null or p_csrf_token_hash is null
     or p_flow_kind is null or p_expires_at is null or p_now is null then
    raise exception 'M2_C1_AUTH_CONTINUATION_INVALID' using errcode = 'P0001';
  end if;
  select * into authority
    from public.production_prepayment_execution_authorities
    where execution_capability_hash = p_execution_capability_hash
    for update;
  if authority.preparation_id is null then
    return null;
  end if;
  select * into preparation from public.production_preparations
    where id = authority.preparation_id for update;
  if authority.state <> 'awaiting_auth'
     or preparation.status <> 'preparing'
     or p_expires_at <= p_now
     or p_expires_at > p_now + interval '30 minutes'
     or p_flow_kind not in ('google', 'email_otp')
     or p_continuation_token_hash !~ '^[0-9a-f]{64}$'
     or p_csrf_token_hash !~ '^[0-9a-f]{64}$'
     or p_continuation_token_hash = p_csrf_token_hash then
    raise exception 'M2_C1_AUTH_CONTINUATION_INVALID' using errcode = 'P0001';
  end if;
  update public.production_prepayment_auth_continuations set
    state = 'expired', expired_at = p_now, updated_at = p_now
    where preparation_id = authority.preparation_id
      and state = 'pending' and expires_at <= p_now;
  update public.production_prepayment_auth_continuations set
    state = 'revoked', revoked_at = p_now, updated_at = p_now
    where preparation_id = authority.preparation_id and state = 'pending';
  insert into public.production_prepayment_auth_continuations (
    id, preparation_id, continuation_token_hash, csrf_token_hash,
    flow_kind, state, expires_at, created_at, updated_at
  ) values (
    p_continuation_id, authority.preparation_id, p_continuation_token_hash,
    p_csrf_token_hash, p_flow_kind, 'pending', p_expires_at, p_now, p_now
  );
  return pg_catalog.jsonb_build_object(
    'continuation_id', p_continuation_id,
    'preparation_id', authority.preparation_id,
    'flow_kind', p_flow_kind,
    'state', 'pending',
    'expires_at', p_expires_at,
    'purpose', 'prepayment_compute'
  );
end;
$function$;

create function public.validate_production_prepayment_auth_continuation_v1(
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_flow_kind text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  continuation public.production_prepayment_auth_continuations%rowtype;
begin
  if p_continuation_token_hash is null or p_csrf_token_hash is null
     or p_flow_kind is null or p_now is null then
    return null;
  end if;
  select * into continuation
    from public.production_prepayment_auth_continuations
    where continuation_token_hash = p_continuation_token_hash
    for update;
  if continuation.id is null
     or continuation.csrf_token_hash is distinct from p_csrf_token_hash
     or continuation.flow_kind is distinct from p_flow_kind
     or continuation.state <> 'pending' then
    return null;
  end if;
  if continuation.expires_at <= p_now then
    update public.production_prepayment_auth_continuations set
      state = 'expired', expired_at = p_now, updated_at = p_now
      where id = continuation.id and state = 'pending';
    return null;
  end if;
  return pg_catalog.jsonb_build_object(
    'continuation_id', continuation.id,
    'preparation_id', continuation.preparation_id,
    'flow_kind', continuation.flow_kind,
    'state', continuation.state,
    'expires_at', continuation.expires_at,
    'purpose', 'prepayment_compute'
  );
end;
$function$;

create function public.bind_production_prepayment_owner_v1(
  p_preparation_id uuid,
  p_binding_id uuid,
  p_ownership_reference_id uuid,
  p_customer_user_id uuid,
  p_delivery_email_sha256 text,
  p_delivery_email_ciphertext text,
  p_delivery_email_key_version text,
  p_delivery_email_verified_source text,
  p_delivery_email_verified_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  authority public.production_prepayment_execution_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
begin
  if p_preparation_id is null or p_binding_id is null
     or p_ownership_reference_id is null or p_customer_user_id is null
     or p_delivery_email_sha256 is null
     or p_delivery_email_ciphertext is null
     or p_delivery_email_key_version is null
     or p_delivery_email_verified_source is null
     or p_delivery_email_verified_at is null or p_now is null then
    raise exception 'M2_C1_CUSTOMER_BINDING_INVALID' using errcode = 'P0001';
  end if;
  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into authority from public.production_prepayment_execution_authorities
    where preparation_id = p_preparation_id for update;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = p_preparation_id for update;
  if preparation.id is null or preparation.status <> 'preparing'
     or authority.preparation_id is null or authority.state <> 'awaiting_auth' then
    raise exception 'M2_C1_CUSTOMER_BINDING_INVALID' using errcode = 'P0001';
  end if;
  if binding.id is not null then
    if binding.state = 'active'
       and binding.customer_user_id = p_customer_user_id then
      return pg_catalog.jsonb_build_object(
        'binding_id', binding.id,
        'preparation_id', binding.preparation_id,
        'customer_user_id', binding.customer_user_id,
        'state', binding.state,
        'disposition', 'existing'
      );
    end if;
    raise exception 'M2_C1_CUSTOMER_BINDING_CONFLICT' using errcode = 'P0001';
  end if;
  if p_delivery_email_sha256 !~ '^[0-9a-f]{64}$'
     or pg_catalog.char_length(p_delivery_email_ciphertext) < 16
     or p_delivery_email_key_version !~ '^[A-Za-z0-9._-]{1,32}$'
     or p_delivery_email_verified_source not in (
       'supabase_email_otp', 'google_verified_identity'
     )
     or p_delivery_email_verified_at > p_now then
    raise exception 'M2_C1_CUSTOMER_BINDING_INVALID' using errcode = 'P0001';
  end if;
  insert into public.production_customer_ownership_bindings (
    id, ownership_reference_id, customer_user_id, preparation_id,
    delivery_email_sha256, delivery_email_ciphertext,
    delivery_email_key_version, delivery_email_verified_source,
    delivery_email_verified_at, state, bound_at, created_at, updated_at
  ) values (
    p_binding_id, p_ownership_reference_id, p_customer_user_id,
    p_preparation_id, p_delivery_email_sha256, p_delivery_email_ciphertext,
    p_delivery_email_key_version, p_delivery_email_verified_source,
    p_delivery_email_verified_at, 'active', p_now, p_now, p_now
  ) returning * into binding;
  return pg_catalog.jsonb_build_object(
    'binding_id', binding.id,
    'preparation_id', binding.preparation_id,
    'customer_user_id', binding.customer_user_id,
    'state', binding.state,
    'disposition', 'created'
  );
end;
$function$;

create function public.bind_production_prepayment_owner_by_capability_v1(
  p_execution_capability_hash text,
  p_binding_id uuid,
  p_ownership_reference_id uuid,
  p_customer_user_id uuid,
  p_delivery_email_sha256 text,
  p_delivery_email_ciphertext text,
  p_delivery_email_key_version text,
  p_delivery_email_verified_source text,
  p_delivery_email_verified_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_preparation_id uuid;
begin
  if p_execution_capability_hash is null then
    raise exception 'M2_C1_CUSTOMER_BINDING_INVALID' using errcode = 'P0001';
  end if;
  select preparation_id into target_preparation_id
    from public.production_prepayment_execution_authorities
    where execution_capability_hash = p_execution_capability_hash;
  if target_preparation_id is null then
    raise exception 'M2_C1_CUSTOMER_BINDING_INVALID' using errcode = 'P0001';
  end if;
  return public.bind_production_prepayment_owner_v1(
    target_preparation_id, p_binding_id, p_ownership_reference_id,
    p_customer_user_id, p_delivery_email_sha256,
    p_delivery_email_ciphertext, p_delivery_email_key_version,
    p_delivery_email_verified_source, p_delivery_email_verified_at, p_now
  );
end;
$function$;

create function public.bind_production_prepayment_owner_from_continuation_v1(
  p_binding_id uuid,
  p_ownership_reference_id uuid,
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_customer_user_id uuid,
  p_delivery_email_sha256 text,
  p_delivery_email_ciphertext text,
  p_delivery_email_key_version text,
  p_delivery_email_verified_source text,
  p_delivery_email_verified_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  continuation public.production_prepayment_auth_continuations%rowtype;
  result jsonb;
begin
  if p_continuation_token_hash is null or p_csrf_token_hash is null
     or p_customer_user_id is null or p_now is null then
    return null;
  end if;
  select * into continuation
    from public.production_prepayment_auth_continuations
    where continuation_token_hash = p_continuation_token_hash
    for update;
  if continuation.id is null then
    return null;
  end if;
  if continuation.csrf_token_hash is distinct from p_csrf_token_hash
     or continuation.expires_at <= p_now
     or continuation.state not in ('pending', 'consumed') then
    raise exception 'M2_C1_AUTH_CONTINUATION_INVALID' using errcode = 'P0001';
  end if;
  result := public.bind_production_prepayment_owner_v1(
    continuation.preparation_id, p_binding_id, p_ownership_reference_id,
    p_customer_user_id, p_delivery_email_sha256,
    p_delivery_email_ciphertext, p_delivery_email_key_version,
    p_delivery_email_verified_source, p_delivery_email_verified_at, p_now
  );
  update public.production_prepayment_auth_continuations set
    state = 'consumed', consumed_at = coalesce(consumed_at, p_now),
    updated_at = p_now
    where id = continuation.id and state = 'pending';
  return result || pg_catalog.jsonb_build_object('purpose', 'prepayment_compute');
end;
$function$;

create function public.resolve_production_prepayment_continuation_v1(
  p_customer_user_id uuid,
  p_continuation_token_hash text,
  p_now timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_preparation_id uuid;
begin
  if p_customer_user_id is null or p_continuation_token_hash is null
     or p_now is null then
    return null;
  end if;
  select continuation.preparation_id into target_preparation_id
    from public.production_prepayment_auth_continuations as continuation
    join public.production_customer_ownership_bindings as binding
      on binding.preparation_id = continuation.preparation_id
    where continuation.continuation_token_hash = p_continuation_token_hash
      and continuation.state = 'consumed'
      and continuation.expires_at > p_now
      and binding.state = 'active'
      and binding.customer_user_id = p_customer_user_id;
  return target_preparation_id;
end;
$function$;

create function public.claim_production_prepayment_execution_v1(
  p_customer_user_id uuid,
  p_preparation_id uuid,
  p_now timestamptz
) returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  authority public.production_prepayment_execution_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
begin
  if p_customer_user_id is null or p_preparation_id is null or p_now is null then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into authority from public.production_prepayment_execution_authorities
    where preparation_id = p_preparation_id for update;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = p_preparation_id for update;
  if preparation.id is null or authority.preparation_id is null
     or binding.id is null or binding.state <> 'active'
     or binding.customer_user_id <> p_customer_user_id then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  if preparation.status = 'preparing' and authority.state = 'awaiting_auth' then
    update public.production_prepayment_execution_authorities set
      state = 'executing', execution_started_at = p_now, updated_at = p_now
      where preparation_id = p_preparation_id and state = 'awaiting_auth';
    return 'acquired';
  end if;
  if authority.state = 'executing' then
    return 'in_progress';
  end if;
  if authority.state in ('awaiting_clarification', 'completed', 'failed') then
    return 'completed';
  end if;
  raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
end;
$function$;

create function public.begin_production_prepayment_clarification_v1(
  p_customer_user_id uuid,
  p_preparation_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  authority public.production_prepayment_execution_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
begin
  if p_customer_user_id is null or p_preparation_id is null or p_now is null then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into authority from public.production_prepayment_execution_authorities
    where preparation_id = p_preparation_id for update;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = p_preparation_id for update;
  if preparation.status <> 'awaiting_clarification'
     or authority.state <> 'awaiting_clarification'
     or binding.state <> 'active'
     or binding.customer_user_id <> p_customer_user_id then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  update public.production_prepayment_execution_authorities set
    state = 'executing', execution_started_at = p_now, updated_at = p_now
    where preparation_id = p_preparation_id and state = 'awaiting_clarification';
end;
$function$;

create function public.finalize_production_prepayment_execution_v1(
  p_preparation_id uuid,
  p_status text,
  p_stop_reason text,
  p_clarification_id text,
  p_clarification_capability_hash text,
  p_clarification_question text,
  p_clarification_answer_fingerprint text,
  p_purchase_capability_hash text,
  p_purchase_ready_authority_json jsonb,
  p_purchase_ready_authority_sha256 text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_preparation_id is null or p_status is null or p_now is null
     or not exists (
       select 1 from public.production_prepayment_execution_authorities
       where preparation_id = p_preparation_id and state = 'executing'
       for update
     ) then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  perform public.finalize_production_preparation_v1(
    p_preparation_id, p_status, p_stop_reason, p_clarification_id,
    p_clarification_capability_hash, p_clarification_question,
    p_clarification_answer_fingerprint, p_purchase_capability_hash,
    p_purchase_ready_authority_json, p_purchase_ready_authority_sha256, p_now
  );
  update public.production_prepayment_execution_authorities set
    state = case when p_status = 'awaiting_clarification'
      then 'awaiting_clarification' else 'completed' end,
    completed_at = case when p_status = 'awaiting_clarification'
      then null else p_now end,
    failed_at = null,
    updated_at = p_now
    where preparation_id = p_preparation_id and state = 'executing';
end;
$function$;

create function public.fail_production_prepayment_execution_v1(
  p_preparation_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_preparation_id is null or p_error_code is null or p_now is null
     or not exists (
       select 1 from public.production_prepayment_execution_authorities
       where preparation_id = p_preparation_id and state = 'executing'
       for update
     ) then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;
  perform public.fail_production_preparation_v1(
    p_preparation_id, p_error_code, p_now
  );
  update public.production_prepayment_execution_authorities set
    state = 'failed', failed_at = p_now, updated_at = p_now
    where preparation_id = p_preparation_id and state = 'executing';
end;
$function$;

create function public.claim_production_prepayment_compute_unit_v1(
  p_customer_user_id uuid,
  p_preparation_id uuid,
  p_now timestamptz,
  p_policy_version text,
  p_window_seconds integer,
  p_max_provider_invocations integer,
  p_stage_id text,
  p_attempt_number integer
) returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  authority public.production_prepayment_execution_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
  budget public.production_prepayment_compute_budgets%rowtype;
  new_window_expires_at timestamptz;
begin
  if p_customer_user_id is null or p_preparation_id is null or p_now is null
     or p_policy_version is null or p_window_seconds is null
     or p_max_provider_invocations is null or p_stage_id is null
     or p_attempt_number is null
     or p_policy_version !~ '^[A-Za-z0-9._-]{1,64}$'
     or p_window_seconds < 60 or p_window_seconds > 2678400
     or p_max_provider_invocations < 1 or p_max_provider_invocations > 1000
     or p_stage_id not in ('PB-01', 'PB-01C', 'PB-02', 'PB-03')
     or p_attempt_number < 1 or p_attempt_number > 2 then
    raise exception 'M2_C1_COMPUTE_POLICY_INVALID' using errcode = 'P0001';
  end if;

  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into authority from public.production_prepayment_execution_authorities
    where preparation_id = p_preparation_id for update;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = p_preparation_id for update;
  if preparation.id is null
     or preparation.status not in ('preparing', 'awaiting_clarification')
     or authority.state <> 'executing'
     or binding.id is null or binding.state <> 'active'
     or binding.customer_user_id <> p_customer_user_id then
    raise exception 'M2_C1_EXECUTION_AUTHORIZATION_INVALID' using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'm2-c1-budget:' || p_customer_user_id::text || ':' || p_policy_version, 0
    )
  );
  select * into budget from public.production_prepayment_compute_budgets
    where customer_user_id = p_customer_user_id
      and policy_version = p_policy_version
    for update;
  new_window_expires_at := p_now + pg_catalog.make_interval(secs => p_window_seconds);
  if budget.customer_user_id is null then
    insert into public.production_prepayment_compute_budgets (
      customer_user_id, policy_version, window_started_at, window_expires_at,
      used_provider_invocation_units, created_at, updated_at
    ) values (
      p_customer_user_id, p_policy_version, p_now, new_window_expires_at,
      1, p_now, p_now
    );
    return 'acquired';
  end if;
  if budget.window_expires_at <= p_now then
    update public.production_prepayment_compute_budgets set
      window_started_at = p_now,
      window_expires_at = new_window_expires_at,
      used_provider_invocation_units = 1,
      updated_at = p_now
      where customer_user_id = p_customer_user_id
        and policy_version = p_policy_version;
    return 'acquired';
  end if;
  if budget.used_provider_invocation_units >= p_max_provider_invocations then
    return 'exhausted';
  end if;
  update public.production_prepayment_compute_budgets set
    used_provider_invocation_units = used_provider_invocation_units + 1,
    updated_at = p_now
    where customer_user_id = p_customer_user_id
      and policy_version = p_policy_version;
  return 'acquired';
end;
$function$;

alter table public.production_prepayment_execution_authorities enable row level security;
alter table public.production_prepayment_auth_continuations enable row level security;
alter table public.production_prepayment_compute_budgets enable row level security;

revoke all privileges on table
  public.production_prepayment_execution_authorities,
  public.production_prepayment_auth_continuations,
  public.production_prepayment_compute_budgets
from public, anon, authenticated, service_role, m2_b2_stripe_ingress;

grant select, insert, update on table
  public.production_prepayment_execution_authorities,
  public.production_prepayment_auth_continuations,
  public.production_prepayment_compute_budgets
to service_role;

revoke all on function public.begin_production_prepayment_intake_v1(
  uuid, uuid, text, text, jsonb, jsonb, text, text, text, jsonb,
  text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.create_production_prepayment_auth_continuation_v1(
  uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.validate_production_prepayment_auth_continuation_v1(
  text, text, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.bind_production_prepayment_owner_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.bind_production_prepayment_owner_by_capability_v1(
  text, uuid, uuid, uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.bind_production_prepayment_owner_from_continuation_v1(
  uuid, uuid, text, text, uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.resolve_production_prepayment_continuation_v1(
  uuid, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.claim_production_prepayment_execution_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.begin_production_prepayment_clarification_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.finalize_production_prepayment_execution_v1(
  uuid, text, text, text, text, text, text, text, jsonb, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.fail_production_prepayment_execution_v1(
  uuid, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.claim_production_prepayment_compute_unit_v1(
  uuid, uuid, timestamptz, text, integer, integer, text, integer
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;

grant execute on function public.begin_production_prepayment_intake_v1(
  uuid, uuid, text, text, jsonb, jsonb, text, text, text, jsonb,
  text, timestamptz
) to service_role;
grant execute on function public.create_production_prepayment_auth_continuation_v1(
  uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.validate_production_prepayment_auth_continuation_v1(
  text, text, text, timestamptz
) to service_role;
grant execute on function public.bind_production_prepayment_owner_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.bind_production_prepayment_owner_by_capability_v1(
  text, uuid, uuid, uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.bind_production_prepayment_owner_from_continuation_v1(
  uuid, uuid, text, text, uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.resolve_production_prepayment_continuation_v1(
  uuid, text, timestamptz
) to service_role;
grant execute on function public.claim_production_prepayment_execution_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.begin_production_prepayment_clarification_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.finalize_production_prepayment_execution_v1(
  uuid, text, text, text, text, text, text, text, jsonb, text, timestamptz
) to service_role;
grant execute on function public.fail_production_prepayment_execution_v1(
  uuid, text, timestamptz
) to service_role;
grant execute on function public.claim_production_prepayment_compute_unit_v1(
  uuid, uuid, timestamptz, text, integer, integer, text, integer
) to service_role;

do $acl_self_check$
declare
  invalid_table_privileges integer;
  invalid_function_executes integer;
begin
  select count(*) into invalid_table_privileges
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'production_prepayment_execution_authorities',
      'production_prepayment_auth_continuations',
      'production_prepayment_compute_budgets'
    )
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'm2_b2_stripe_ingress');

  select count(*) into invalid_function_executes
  from information_schema.routine_privileges
  where specific_schema = 'public'
    and routine_name in (
      'begin_production_prepayment_intake_v1',
      'create_production_prepayment_auth_continuation_v1',
      'validate_production_prepayment_auth_continuation_v1',
      'bind_production_prepayment_owner_v1',
      'bind_production_prepayment_owner_by_capability_v1',
      'bind_production_prepayment_owner_from_continuation_v1',
      'resolve_production_prepayment_continuation_v1',
      'claim_production_prepayment_execution_v1',
      'begin_production_prepayment_clarification_v1',
      'finalize_production_prepayment_execution_v1',
      'fail_production_prepayment_execution_v1',
      'claim_production_prepayment_compute_unit_v1'
    )
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'm2_b2_stripe_ingress')
    and privilege_type = 'EXECUTE';

  if invalid_table_privileges <> 0 or invalid_function_executes <> 0 then
    raise exception 'M2_C1_ACL_SELF_CHECK_FAILED' using errcode = 'P0001';
  end if;
end;
$acl_self_check$;

commit;
