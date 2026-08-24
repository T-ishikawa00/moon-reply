begin;

do $precondition$
begin
  if pg_catalog.to_regclass('public.production_purchase_intents') is null
     or pg_catalog.to_regclass('public.production_customer_ownership_bindings') is null
     or pg_catalog.to_regclass('public.production_payment_attempts') is null
     or pg_catalog.to_regclass('public.production_verified_payments') is null
     or pg_catalog.to_regclass('public.production_fulfillment_jobs') is null
     or pg_catalog.to_regclass('public.production_logical_assessments') is null
     or pg_catalog.to_regclass('public.production_customer_deliveries') is null
     or pg_catalog.to_regclass('public.production_notification_outbox') is null
     or pg_catalog.to_regclass('auth.users') is null
     or not exists (
       select 1
       from pg_catalog.pg_proc as procedure
       join pg_catalog.pg_namespace as namespace
         on namespace.oid = procedure.pronamespace
       where namespace.nspname = 'public'
         and procedure.proname = 'resolve_customer_account_history_v1'
     ) then
    raise exception 'M2_D2_MIGRATION_PRECONDITION_FAILED'
      using errcode = 'P0001';
  end if;
end;
$precondition$;

create table public.production_customer_support_cases (
  id uuid primary key,
  customer_user_id uuid not null,
  purchase_intent_id uuid,
  category text not null,
  status text not null,
  customer_note text,
  idempotency_key_hash text not null,
  case_input_sha256 text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,
  constraint production_customer_support_customer_fk
    foreign key (customer_user_id)
    references auth.users(id) on delete restrict,
  constraint production_customer_support_purchase_fk
    foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_customer_support_customer_idempotency_unique
    unique (customer_user_id, idempotency_key_hash),
  constraint production_customer_support_category check (category in (
    'result_delivery', 'payment_charge', 'refund_cancellation',
    'account_login', 'privacy_data', 'other'
  )),
  constraint production_customer_support_purchase_scope check (
    (category in ('result_delivery', 'payment_charge', 'refund_cancellation')
      and purchase_intent_id is not null)
    or (category in ('account_login', 'privacy_data', 'other')
      and purchase_intent_id is null)
  ),
  constraint production_customer_support_status check (status in (
    'open', 'in_review', 'waiting_customer', 'resolved', 'closed'
  )),
  constraint production_customer_support_note check (
    customer_note is null
    or pg_catalog.char_length(customer_note) between 1 and 1000
  ),
  constraint production_customer_support_hashes check (
    idempotency_key_hash ~ '^[0-9a-f]{64}$'
    and case_input_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint production_customer_support_resolution check (
    (status in ('open', 'in_review', 'waiting_customer')
      and resolved_at is null)
    or (status in ('resolved', 'closed') and resolved_at is not null)
  ),
  constraint production_customer_support_timestamps check (
    updated_at >= created_at
    and (resolved_at is null or resolved_at >= created_at)
  )
);

create unique index production_customer_support_active_purchase_category_idx
  on public.production_customer_support_cases(
    customer_user_id, purchase_intent_id, category
  )
  where purchase_intent_id is not null
    and status in ('open', 'in_review', 'waiting_customer');

create index production_customer_support_customer_history_idx
  on public.production_customer_support_cases(customer_user_id, created_at desc);

create table public.production_customer_support_case_events (
  id uuid primary key,
  case_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text not null,
  reason_code text,
  created_at timestamptz not null,
  constraint production_customer_support_event_case_fk
    foreign key (case_id)
    references public.production_customer_support_cases(id) on delete restrict,
  constraint production_customer_support_event_type check (
    event_type in ('submitted', 'status_transition')
  ),
  constraint production_customer_support_event_from_status check (
    from_status is null
    or from_status in (
      'open', 'in_review', 'waiting_customer', 'resolved', 'closed'
    )
  ),
  constraint production_customer_support_event_to_status check (
    to_status in (
      'open', 'in_review', 'waiting_customer', 'resolved', 'closed'
    )
  ),
  constraint production_customer_support_event_reason check (
    reason_code is null or reason_code ~ '^[A-Z0-9_]{3,128}$'
  ),
  constraint production_customer_support_event_shape check (
    (event_type = 'submitted'
      and from_status is null and to_status = 'open' and reason_code is null)
    or (event_type = 'status_transition'
      and from_status is not null and from_status <> to_status)
  )
);

create index production_customer_support_case_events_history_idx
  on public.production_customer_support_case_events(case_id, created_at, id);

create function public.create_production_customer_support_case_v1(
  p_case_id uuid,
  p_event_id uuid,
  p_customer_user_id uuid,
  p_purchase_intent_id uuid,
  p_category text,
  p_customer_note text,
  p_idempotency_key_hash text,
  p_case_input_sha256 text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  existing public.production_customer_support_cases%rowtype;
  active_case public.production_customer_support_cases%rowtype;
  owned_purchase_id uuid;
begin
  if p_case_id is null or p_event_id is null
     or p_customer_user_id is null or p_category is null
     or p_idempotency_key_hash is null or p_case_input_sha256 is null
     or p_now is null
     or p_category not in (
       'result_delivery', 'payment_charge', 'refund_cancellation',
       'account_login', 'privacy_data', 'other'
     )
     or p_idempotency_key_hash !~ '^[0-9a-f]{64}$'
     or p_case_input_sha256 !~ '^[0-9a-f]{64}$'
     or (p_customer_note is not null
       and (pg_catalog.char_length(p_customer_note) < 1
         or pg_catalog.char_length(p_customer_note) > 1000)) then
    raise exception 'M2_D2_SUPPORT_CASE_INVALID' using errcode = 'P0001';
  end if;

  if p_category in (
    'result_delivery', 'payment_charge', 'refund_cancellation'
  ) then
    if p_purchase_intent_id is null then
      raise exception 'M2_D2_SUPPORT_PURCHASE_REQUIRED' using errcode = 'P0001';
    end if;
    select intent.id into owned_purchase_id
    from public.production_purchase_intents as intent
    join public.production_customer_ownership_bindings as binding
      on binding.id = intent.customer_ownership_binding_id
      and binding.preparation_id = intent.preparation_id
    where intent.id = p_purchase_intent_id
      and binding.customer_user_id = p_customer_user_id
      and binding.state = 'active';
    if owned_purchase_id is null then
      raise exception 'M2_D2_SUPPORT_PURCHASE_NOT_OWNED'
        using errcode = 'P0001';
    end if;
  elsif p_purchase_intent_id is not null then
    raise exception 'M2_D2_SUPPORT_CASE_INVALID' using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'm2-d2-idempotency:' || p_customer_user_id::text || ':'
        || p_idempotency_key_hash,
      0
    )
  );
  select * into existing
  from public.production_customer_support_cases
  where customer_user_id = p_customer_user_id
    and idempotency_key_hash = p_idempotency_key_hash
  for update;
  if existing.id is not null then
    if existing.case_input_sha256 is distinct from p_case_input_sha256 then
      raise exception 'M2_D2_SUPPORT_IDEMPOTENCY_CONFLICT'
        using errcode = 'P0001';
    end if;
    return pg_catalog.jsonb_build_object(
      'case_id', existing.id,
      'category', existing.category,
      'status', existing.status,
      'created_at', existing.created_at,
      'disposition', 'replay'
    );
  end if;

  if p_purchase_intent_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(
        'm2-d2-active:' || p_customer_user_id::text || ':'
          || p_purchase_intent_id::text || ':' || p_category,
        0
      )
    );
    select * into active_case
    from public.production_customer_support_cases
    where customer_user_id = p_customer_user_id
      and purchase_intent_id = p_purchase_intent_id
      and category = p_category
      and status in ('open', 'in_review', 'waiting_customer')
    for update;
    if active_case.id is not null then
      return pg_catalog.jsonb_build_object(
        'case_id', active_case.id,
        'category', active_case.category,
        'status', active_case.status,
        'created_at', active_case.created_at,
        'disposition', 'active_case'
      );
    end if;
  end if;

  insert into public.production_customer_support_cases (
    id, customer_user_id, purchase_intent_id, category, status,
    customer_note, idempotency_key_hash, case_input_sha256,
    created_at, updated_at
  ) values (
    p_case_id, p_customer_user_id, p_purchase_intent_id, p_category, 'open',
    p_customer_note, p_idempotency_key_hash, p_case_input_sha256,
    p_now, p_now
  ) returning * into existing;

  insert into public.production_customer_support_case_events (
    id, case_id, event_type, from_status, to_status, reason_code, created_at
  ) values (
    p_event_id, existing.id, 'submitted', null, 'open', null, p_now
  );

  return pg_catalog.jsonb_build_object(
    'case_id', existing.id,
    'category', existing.category,
    'status', existing.status,
    'created_at', existing.created_at,
    'disposition', 'created'
  );
end;
$function$;

create function public.resolve_production_support_case_context_v1(
  p_case_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
begin
  if p_case_id is null or p_now is null then
    raise exception 'M2_D2_SUPPORT_CONTEXT_INVALID' using errcode = 'P0001';
  end if;
  select pg_catalog.jsonb_build_object(
    'case_id', support_case.id,
    'category', support_case.category,
    'support_status', support_case.status,
    'purchase_intent_id', support_case.purchase_intent_id,
    'purchase_exists', intent.id is not null,
    'purchase_owned', binding.id is not null
      and binding.state = 'active'
      and binding.customer_user_id = support_case.customer_user_id,
    'expected_product_code', intent.expected_product_code,
    'expected_amount', intent.expected_amount,
    'currency', intent.currency,
    'purchase_state', intent.state,
    'payment_attempt_state', attempt.state,
    'payment_verified', verified.id is not null,
    'fulfillment_state', job.state,
    'fulfillment_manual_review', job.state = 'manual_review'
      or logical_assessment.recovery_state = 'manual_review',
    'logical_assessment_state', logical_assessment.status,
    'logical_recovery_state', logical_assessment.recovery_state,
    'delivery_completed', job.state = 'completed' and delivery.id is not null,
    'result_available', delivery.id is not null,
    'notification_state', notification.status,
    'reconciliation_due', attempt.id is not null
      and attempt.state in ('pending', 'processing', 'unknown')
      and attempt.reconciliation_stopped_at is null
      and (attempt.reconciliation_retry_after is null
        or attempt.reconciliation_retry_after <= p_now)
      and (attempt.reconciliation_owner_id is null
        or attempt.reconciliation_lease_expires_at <= p_now),
    'reconciliation_stopped', attempt.reconciliation_stopped_at is not null
  ) into result
  from public.production_customer_support_cases as support_case
  left join public.production_purchase_intents as intent
    on intent.id = support_case.purchase_intent_id
  left join public.production_customer_ownership_bindings as binding
    on binding.id = intent.customer_ownership_binding_id
    and binding.preparation_id = intent.preparation_id
  left join public.production_payment_attempts as attempt
    on attempt.id = intent.current_payment_attempt_id
    and attempt.purchase_intent_id = intent.id
  left join public.production_verified_payments as verified
    on verified.id = intent.successful_payment_id
    and verified.purchase_intent_id = intent.id
  left join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = intent.id
  left join public.production_logical_assessments as logical_assessment
    on logical_assessment.id = job.logical_assessment_id
  left join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  left join public.production_notification_outbox as notification
    on notification.delivery_id = delivery.id
  where support_case.id = p_case_id;
  return result;
end;
$function$;

create function public.transition_production_support_case_v1(
  p_case_id uuid,
  p_event_id uuid,
  p_to_status text,
  p_reason_code text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  support_case public.production_customer_support_cases%rowtype;
begin
  if p_case_id is null or p_event_id is null or p_to_status is null
     or p_now is null
     or p_to_status not in (
       'open', 'in_review', 'waiting_customer', 'resolved', 'closed'
     )
     or (p_reason_code is not null
       and p_reason_code !~ '^[A-Z0-9_]{3,128}$') then
    raise exception 'M2_D2_SUPPORT_TRANSITION_INVALID' using errcode = 'P0001';
  end if;
  select * into support_case
  from public.production_customer_support_cases
  where id = p_case_id
  for update;
  if support_case.id is null
     or not (
       (support_case.status = 'open'
         and p_to_status in ('in_review', 'resolved', 'closed'))
       or (support_case.status = 'in_review'
         and p_to_status in ('waiting_customer', 'resolved', 'closed'))
       or (support_case.status = 'waiting_customer'
         and p_to_status in ('in_review', 'resolved', 'closed'))
       or (support_case.status = 'resolved' and p_to_status = 'closed')
     ) then
    raise exception 'M2_D2_SUPPORT_TRANSITION_INVALID' using errcode = 'P0001';
  end if;

  update public.production_customer_support_cases set
    status = p_to_status,
    updated_at = p_now,
    resolved_at = case
      when p_to_status in ('resolved', 'closed')
        then coalesce(resolved_at, p_now)
      else null
    end
  where id = support_case.id;

  insert into public.production_customer_support_case_events (
    id, case_id, event_type, from_status, to_status, reason_code, created_at
  ) values (
    p_event_id, support_case.id, 'status_transition', support_case.status,
    p_to_status, p_reason_code, p_now
  );

  return pg_catalog.jsonb_build_object(
    'case_id', support_case.id,
    'category', support_case.category,
    'status', p_to_status,
    'created_at', support_case.created_at
  );
end;
$function$;

alter table public.production_customer_support_cases enable row level security;
alter table public.production_customer_support_case_events enable row level security;

revoke all privileges on table
  public.production_customer_support_cases,
  public.production_customer_support_case_events
from public, anon, authenticated, service_role, m2_b2_stripe_ingress;

grant select, insert, update on table
  public.production_customer_support_cases
to service_role;
grant select, insert on table
  public.production_customer_support_case_events
to service_role;

revoke all on function public.create_production_customer_support_case_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.resolve_production_support_case_context_v1(
  uuid, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;
revoke all on function public.transition_production_support_case_v1(
  uuid, uuid, text, text, timestamptz
) from public, anon, authenticated, service_role, m2_b2_stripe_ingress;

grant execute on function public.create_production_customer_support_case_v1(
  uuid, uuid, uuid, uuid, text, text, text, text, timestamptz
) to service_role;
grant execute on function public.resolve_production_support_case_context_v1(
  uuid, timestamptz
) to service_role;
grant execute on function public.transition_production_support_case_v1(
  uuid, uuid, text, text, timestamptz
) to service_role;

do $acl_self_check$
declare
  invalid_table_privileges integer;
  invalid_function_executes integer;
  missing_service_executes integer;
  invalid_function_security integer;
  rls_table_count integer;
begin
  select count(*) into invalid_table_privileges
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'production_customer_support_cases',
      'production_customer_support_case_events'
    )
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'm2_b2_stripe_ingress');

  select count(*) into invalid_function_executes
  from information_schema.routine_privileges
  where specific_schema = 'public'
    and routine_name in (
      'create_production_customer_support_case_v1',
      'resolve_production_support_case_context_v1',
      'transition_production_support_case_v1'
    )
    and grantee in ('PUBLIC', 'anon', 'authenticated', 'm2_b2_stripe_ingress')
    and privilege_type = 'EXECUTE';

  select 3 - count(*) into missing_service_executes
  from information_schema.routine_privileges
  where specific_schema = 'public'
    and routine_name in (
      'create_production_customer_support_case_v1',
      'resolve_production_support_case_context_v1',
      'transition_production_support_case_v1'
    )
    and grantee = 'service_role'
    and privilege_type = 'EXECUTE';

  select count(*) into invalid_function_security
  from pg_catalog.pg_proc as procedure
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname in (
      'create_production_customer_support_case_v1',
      'resolve_production_support_case_context_v1',
      'transition_production_support_case_v1'
    )
    and (
      procedure.prosecdef
      or not coalesce(procedure.proconfig, array[]::text[])
        @> array['search_path=""']::text[]
    );

  select count(*) into rls_table_count
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname in (
      'production_customer_support_cases',
      'production_customer_support_case_events'
    )
    and relation.relrowsecurity;

  if invalid_table_privileges <> 0
     or invalid_function_executes <> 0
     or missing_service_executes <> 0
     or invalid_function_security <> 0
     or rls_table_count <> 2 then
    raise exception 'M2_D2_ACL_SELF_CHECK_FAILED' using errcode = 'P0001';
  end if;
end;
$acl_self_check$;

commit;
