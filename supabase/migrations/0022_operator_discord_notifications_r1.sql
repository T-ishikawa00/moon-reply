begin;

-- Operator Discord Notifications R1. This outbox is deliberately independent
-- from payment, fulfillment, delivery, and the customer email outbox.
do $block$
begin
  if pg_catalog.to_regclass('public.production_purchase_intents') is null
     or pg_catalog.to_regclass('public.production_verified_payments') is null
     or pg_catalog.to_regclass('public.production_fulfillment_jobs') is null
     or pg_catalog.to_regclass('public.production_logical_assessments') is null
     or pg_catalog.to_regclass('public.production_customer_deliveries') is null then
    raise exception 'OPERATOR_NOTIFICATION_R1_DEPENDENCY_MISSING' using errcode = 'P0001';
  end if;
end;
$block$;

create table public.production_operator_notification_cutovers (
  environment text primary key,
  active_from timestamptz not null,
  pinned_at timestamptz not null,
  constraint production_operator_notification_cutover_environment
    check (environment in ('test', 'live')),
  constraint production_operator_notification_cutover_time
    check (active_from <= pinned_at)
);

create table public.production_operator_notification_outbox (
  id uuid primary key default extensions.gen_random_uuid(),
  event_key text not null unique,
  notification_type text not null,
  incident_code text,
  environment text not null,
  purchase_intent_id uuid not null,
  verified_payment_id uuid,
  delivery_id uuid,
  source_occurred_at timestamptz not null,
  status text not null,
  attempt_count integer not null default 0,
  owner_id uuid,
  lease_expires_at timestamptz,
  processing_started_at timestamptz,
  send_started_at timestamptz,
  retry_after timestamptz,
  sent_at timestamptz,
  provider_message_reference text,
  last_error_code text,
  requested_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_operator_notification_intent_fk
    foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_operator_notification_payment_fk
    foreign key (verified_payment_id)
    references public.production_verified_payments(id) on delete restrict,
  constraint production_operator_notification_payment_binding_fk
    foreign key (purchase_intent_id, verified_payment_id)
    references public.production_verified_payments(purchase_intent_id, id)
    on delete restrict,
  constraint production_operator_notification_delivery_fk
    foreign key (delivery_id)
    references public.production_customer_deliveries(id) on delete restrict,
  constraint production_operator_notification_type
    check (notification_type in (
      'new_purchase', 'delivery_complete', 'action_required'
    )),
  constraint production_operator_notification_incident
    check (
      (notification_type <> 'action_required' and incident_code is null)
      or (notification_type = 'action_required' and incident_code in (
        'delivery_pending_15m',
        'manual_review',
        'payment_fulfillment_retry_exhausted'
      ))
    ),
  constraint production_operator_notification_source_binding
    check (
      (notification_type = 'new_purchase'
        and verified_payment_id is not null and delivery_id is null)
      or (notification_type = 'delivery_complete'
        and verified_payment_id is not null and delivery_id is not null)
      or (notification_type = 'action_required'
        and delivery_id is null
        and (verified_payment_id is not null
          or incident_code = 'manual_review'))
    ),
  constraint production_operator_notification_event_key
    check (
      (notification_type = 'new_purchase'
        and event_key = 'new_purchase:' || verified_payment_id::text)
      or (notification_type = 'delivery_complete'
        and event_key = 'delivery_complete:' || delivery_id::text)
      or (notification_type = 'action_required'
        and event_key = 'action_required:' || purchase_intent_id::text
          || ':' || incident_code)
    ),
  constraint production_operator_notification_environment
    check (environment in ('test', 'live')),
  constraint production_operator_notification_status
    check (status in (
      'pending', 'processing', 'retryable', 'sent', 'ambiguous',
      'superseded', 'terminal_failure'
    )),
  constraint production_operator_notification_attempt_count
    check (attempt_count >= 0),
  constraint production_operator_notification_lease
    check (
      (status = 'processing'
        and owner_id is not null
        and lease_expires_at is not null
        and processing_started_at is not null
        and lease_expires_at > processing_started_at)
      or (status <> 'processing'
        and owner_id is null
        and lease_expires_at is null
        and processing_started_at is null)
    ),
  constraint production_operator_notification_send_boundary
    check (
      (status in ('pending', 'retryable', 'superseded')
        and send_started_at is null)
      or status = 'processing'
      or (status in ('sent', 'ambiguous', 'terminal_failure')
        and send_started_at is not null)
    ),
  constraint production_operator_notification_retry
    check (
      (status = 'retryable' and retry_after is not null)
      or (status <> 'retryable' and retry_after is null)
    ),
  constraint production_operator_notification_sent
    check (
      (status = 'sent'
        and sent_at is not null
        and provider_message_reference ~ '^[0-9]{17,20}$')
      or (status <> 'sent'
        and sent_at is null
        and provider_message_reference is null)
    ),
  constraint production_operator_notification_error_code
    check (
      last_error_code is null
      or last_error_code ~ '^[A-Z][A-Z0-9_]{0,127}$'
    ),
  constraint production_operator_notification_timestamps
    check (
      source_occurred_at <= requested_at
      and created_at <= updated_at
      and (send_started_at is null or send_started_at >= source_occurred_at)
      and (sent_at is null or sent_at >= send_started_at)
    )
);

create index production_operator_notification_claim_idx
  on public.production_operator_notification_outbox(
    environment, status, retry_after, source_occurred_at
  );
create index production_operator_notification_lease_idx
  on public.production_operator_notification_outbox(
    environment, status, lease_expires_at
  );
create index production_operator_notification_intent_idx
  on public.production_operator_notification_outbox(
    purchase_intent_id, notification_type, incident_code
  );

alter table public.production_operator_notification_outbox
  enable row level security;
alter table public.production_operator_notification_cutovers
  enable row level security;

create function public.claim_production_operator_notification_batch_v1(
  p_owner_id uuid,
  p_environment text,
  p_active_from timestamptz,
  p_lease_expires_at timestamptz,
  p_now timestamptz,
  p_limit integer
) returns table (
  notification_id uuid,
  notification_type text,
  incident_code text,
  purchase_intent_id uuid,
  amount integer,
  currency text,
  payment_state text,
  delivery_state text,
  fulfillment_state text,
  event_occurred_at timestamptz,
  elapsed_seconds bigint,
  attempt_count integer
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  pinned_active_from timestamptz;
begin
  if p_owner_id is null
     or p_environment is null
     or p_environment not in ('test', 'live')
     or p_active_from is null
     or p_now is null
     or p_active_from > p_now
     or p_lease_expires_at is null
     or p_lease_expires_at <= p_now
     or p_limit is null
     or p_limit < 1
     or p_limit > 4 then
    raise exception 'OPERATOR_NOTIFICATION_CLAIM_INVALID' using errcode = 'P0001';
  end if;

  insert into public.production_operator_notification_cutovers (
    environment, active_from, pinned_at
  ) values (
    p_environment, p_active_from, p_now
  ) on conflict (environment) do nothing;
  select cutover.active_from into pinned_active_from
  from public.production_operator_notification_cutovers as cutover
  where cutover.environment = p_environment;
  if pinned_active_from is distinct from p_active_from then
    raise exception 'OPERATOR_NOTIFICATION_ACTIVE_FROM_CONFLICT'
      using errcode = 'P0001';
  end if;

  -- A send that never crossed the HTTP boundary is safely retryable. A send
  -- with an expired lease after crossing that boundary is permanently
  -- ambiguous and is never automatically reclaimed.
  update public.production_operator_notification_outbox as operator_outbox
  set status = case
        when operator_outbox.send_started_at is null then 'retryable'
        else 'ambiguous'
      end,
      owner_id = null,
      lease_expires_at = null,
      processing_started_at = null,
      retry_after = case
        when operator_outbox.send_started_at is null then p_now
        else null
      end,
      last_error_code = case
        when operator_outbox.send_started_at is null
          then 'OPERATOR_NOTIFICATION_LEASE_EXPIRED_BEFORE_SEND'
        else 'OPERATOR_NOTIFICATION_OUTCOME_AMBIGUOUS'
      end,
      updated_at = p_now
  where operator_outbox.environment = p_environment
    and operator_outbox.status = 'processing'
    and operator_outbox.lease_expires_at <= p_now;

  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment,
    purchase_intent_id, verified_payment_id, delivery_id,
    source_occurred_at, status, requested_at, created_at, updated_at
  )
  select
    'new_purchase:' || verified.id::text,
    'new_purchase', null, verified.environment,
    verified.purchase_intent_id, verified.id, null,
    verified.verified_at, 'pending', p_now, p_now, p_now
  from public.production_verified_payments as verified
  where verified.environment = p_environment
    and verified.verified_at >= p_active_from
    and verified.verified_at <= p_now
  on conflict (event_key) do nothing;

  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment,
    purchase_intent_id, verified_payment_id, delivery_id,
    source_occurred_at, status, requested_at, created_at, updated_at
  )
  select
    'delivery_complete:' || delivery.id::text,
    'delivery_complete', null, verified.environment,
    job.purchase_intent_id, verified.id, delivery.id,
    delivery.created_at, 'pending', p_now, p_now, p_now
  from public.production_customer_deliveries as delivery
  join public.production_logical_assessments as logical_assessment
    on logical_assessment.id = delivery.logical_assessment_id
  join public.production_fulfillment_jobs as job
    on job.logical_assessment_id = logical_assessment.id
  join public.production_verified_payments as verified
    on verified.id = job.verified_payment_id
    and verified.purchase_intent_id = job.purchase_intent_id
  where verified.environment = p_environment
    and delivery.created_at >= p_active_from
    and delivery.created_at <= p_now
  on conflict (event_key) do nothing;

  -- C1 is lower precedence than C2/C3. It is only materialized for a paid
  -- order that remains undelivered for 15 minutes with no stronger incident.
  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment,
    purchase_intent_id, verified_payment_id, delivery_id,
    source_occurred_at, status, requested_at, created_at, updated_at
  )
  select
    'action_required:' || intent.id::text || ':delivery_pending_15m',
    'action_required', 'delivery_pending_15m', intent.environment,
    intent.id, verified.id, null,
    verified.verified_at + interval '15 minutes',
    'pending', p_now, p_now, p_now
  from public.production_purchase_intents as intent
  join public.production_verified_payments as verified
    on verified.purchase_intent_id = intent.id
  left join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = intent.id
  left join public.production_logical_assessments as logical_assessment
    on logical_assessment.id = job.logical_assessment_id
  left join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  where intent.environment = p_environment
    and verified.environment = p_environment
    and verified.verified_at >= p_active_from
    and verified.verified_at + interval '15 minutes' <= p_now
    and delivery.id is null
    and intent.state <> 'manual_review'
    and coalesce(job.state, '') <> 'manual_review'
    and coalesce(logical_assessment.recovery_state, '') <> 'manual_review'
    and coalesce(job.last_error_code, '')
      <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
    and coalesce(job.dispatch_last_error_code, '')
      <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
  on conflict (event_key) do nothing;

  -- C2 excludes the more specific retry-exhausted C3 classification.
  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment,
    purchase_intent_id, verified_payment_id, delivery_id,
    source_occurred_at, status, requested_at, created_at, updated_at
  )
  select
    'action_required:' || intent.id::text || ':manual_review',
    'action_required', 'manual_review', intent.environment,
    intent.id, verified.id, null,
    greatest(
      case when intent.state = 'manual_review' then intent.updated_at end,
      case when job.state = 'manual_review' then job.updated_at end,
      case when logical_assessment.recovery_state = 'manual_review'
        then logical_assessment.updated_at end
    ),
    'pending', p_now, p_now, p_now
  from public.production_purchase_intents as intent
  left join public.production_verified_payments as verified
    on verified.purchase_intent_id = intent.id
  left join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = intent.id
  left join public.production_logical_assessments as logical_assessment
    on logical_assessment.id = job.logical_assessment_id
  where intent.environment = p_environment
    and (verified.id is null or verified.environment = p_environment)
    and (
      intent.state = 'manual_review'
      or job.state = 'manual_review'
      or logical_assessment.recovery_state = 'manual_review'
    )
    and coalesce(job.last_error_code, '')
      <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
    and coalesce(job.dispatch_last_error_code, '')
      <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
    and greatest(
      case when intent.state = 'manual_review' then intent.updated_at end,
      case when job.state = 'manual_review' then job.updated_at end,
      case when logical_assessment.recovery_state = 'manual_review'
        then logical_assessment.updated_at end
    ) between p_active_from and p_now
  on conflict (event_key) do nothing;

  -- Current schema exposes retry exhaustion as the exact terminal authority.
  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment,
    purchase_intent_id, verified_payment_id, delivery_id,
    source_occurred_at, status, requested_at, created_at, updated_at
  )
  select
    'action_required:' || intent.id::text
      || ':payment_fulfillment_retry_exhausted',
    'action_required', 'payment_fulfillment_retry_exhausted',
    intent.environment, intent.id, verified.id, null,
    greatest(job.updated_at, job.dispatch_updated_at),
    'pending', p_now, p_now, p_now
  from public.production_purchase_intents as intent
  join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = intent.id
  join public.production_verified_payments as verified
    on verified.purchase_intent_id = intent.id
  where intent.environment = p_environment
    and verified.environment = p_environment
    and (
      job.last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
      or job.dispatch_last_error_code
        = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
    )
    and greatest(job.updated_at, job.dispatch_updated_at)
      between p_active_from and p_now
  on conflict (event_key) do nothing;

  -- Refresh unsent action incidents. C1 is superseded by delivery or by a
  -- stronger C2/C3 condition; each stronger condition has its own event key.
  update public.production_operator_notification_outbox as operator_outbox
  set status = 'superseded',
      retry_after = null,
      last_error_code = 'OPERATOR_NOTIFICATION_ACTION_RESOLVED',
      updated_at = p_now
  where operator_outbox.environment = p_environment
    and operator_outbox.notification_type = 'action_required'
    and operator_outbox.status in ('pending', 'retryable')
    and not exists (
    select 1
    from public.production_purchase_intents as intent
    left join public.production_verified_payments as verified
      on verified.purchase_intent_id = intent.id
    left join public.production_fulfillment_jobs as job
      on job.purchase_intent_id = intent.id
    left join public.production_logical_assessments as logical_assessment
      on logical_assessment.id = job.logical_assessment_id
    left join public.production_customer_deliveries as delivery
      on delivery.logical_assessment_id = logical_assessment.id
    where intent.id = operator_outbox.purchase_intent_id
      and case operator_outbox.incident_code
        when 'delivery_pending_15m' then
          verified.id is not null
          and verified.verified_at + interval '15 minutes' <= p_now
          and delivery.id is null
          and intent.state <> 'manual_review'
          and coalesce(job.state, '') <> 'manual_review'
          and coalesce(logical_assessment.recovery_state, '') <> 'manual_review'
          and coalesce(job.last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          and coalesce(job.dispatch_last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        when 'manual_review' then
          (intent.state = 'manual_review'
            or job.state = 'manual_review'
            or logical_assessment.recovery_state = 'manual_review')
          and coalesce(job.last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          and coalesce(job.dispatch_last_error_code, '')
            <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        when 'payment_fulfillment_retry_exhausted' then
          job.last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
          or job.dispatch_last_error_code
            = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        else false
      end
  );

  return query
  with candidates as (
    select operator_outbox.id
    from public.production_operator_notification_outbox as operator_outbox
    where operator_outbox.environment = p_environment
      and operator_outbox.source_occurred_at >= p_active_from
      and (
        operator_outbox.status = 'pending'
        or (operator_outbox.status = 'retryable'
          and operator_outbox.retry_after <= p_now)
      )
    order by operator_outbox.source_occurred_at, operator_outbox.id
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.production_operator_notification_outbox as operator_outbox
    set status = 'processing',
        owner_id = p_owner_id,
        lease_expires_at = p_lease_expires_at,
        processing_started_at = p_now,
        send_started_at = null,
        retry_after = null,
        attempt_count = operator_outbox.attempt_count + 1,
        last_error_code = null,
        updated_at = p_now
    from candidates
    where operator_outbox.id = candidates.id
    returning operator_outbox.*
  )
  select
    claimed.id,
    claimed.notification_type,
    claimed.incident_code,
    claimed.purchase_intent_id,
    coalesce(verified.amount, intent.expected_amount),
    coalesce(verified.currency, intent.currency),
    case when verified.id is null then 'manual_review' else 'verified' end,
    case
      when claimed.notification_type = 'new_purchase' then null
      when delivery.id is null then 'pending'
      else 'complete'
    end,
    case
      when claimed.notification_type = 'new_purchase' then null
      when claimed.notification_type = 'delivery_complete' then 'completed'
      when claimed.incident_code = 'payment_fulfillment_retry_exhausted'
        then 'retry_exhausted'
      when claimed.incident_code = 'manual_review' then 'manual_review'
      else coalesce(job.state, 'pending')
    end,
    claimed.source_occurred_at,
    case
      when claimed.notification_type = 'delivery_complete' then
        greatest(0, pg_catalog.floor(
          extract(epoch from delivery.created_at - verified.verified_at)
        ))::bigint
      when claimed.notification_type = 'action_required' then
        greatest(0, pg_catalog.floor(
          extract(epoch from p_now - coalesce(
            verified.verified_at, claimed.source_occurred_at
          ))
        ))::bigint
      else null
    end,
    claimed.attempt_count
  from claimed
  join public.production_purchase_intents as intent
    on intent.id = claimed.purchase_intent_id
  left join public.production_verified_payments as verified
    on verified.id = claimed.verified_payment_id
  left join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = claimed.purchase_intent_id
  left join public.production_logical_assessments as logical_assessment
    on logical_assessment.id = job.logical_assessment_id
  left join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  order by claimed.source_occurred_at, claimed.id;
end;
$function$;

create function public.begin_production_operator_notification_send_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_operator_notification_outbox%rowtype;
  action_active boolean;
begin
  if p_notification_id is null or p_owner_id is null or p_now is null then
    raise exception 'OPERATOR_NOTIFICATION_SEND_INVALID' using errcode = 'P0001';
  end if;
  select * into locked
  from public.production_operator_notification_outbox
  where id = p_notification_id
  for update;
  if locked.id is null
     or locked.status <> 'processing'
     or locked.owner_id is distinct from p_owner_id
     or locked.lease_expires_at is null
     or locked.lease_expires_at <= p_now then
    raise exception 'OPERATOR_NOTIFICATION_SEND_CONFLICT' using errcode = 'P0001';
  end if;
  if locked.send_started_at is not null then
    raise exception 'OPERATOR_NOTIFICATION_SEND_ALREADY_STARTED' using errcode = 'P0001';
  end if;

  if locked.notification_type = 'action_required' then
    select case locked.incident_code
      when 'delivery_pending_15m' then
        verified.id is not null
        and verified.verified_at + interval '15 minutes' <= p_now
        and delivery.id is null
        and intent.state <> 'manual_review'
        and coalesce(job.state, '') <> 'manual_review'
        and coalesce(logical_assessment.recovery_state, '') <> 'manual_review'
        and coalesce(job.last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        and coalesce(job.dispatch_last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
      when 'manual_review' then
        (intent.state = 'manual_review'
          or job.state = 'manual_review'
          or logical_assessment.recovery_state = 'manual_review')
        and coalesce(job.last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        and coalesce(job.dispatch_last_error_code, '')
          <> 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
      when 'payment_fulfillment_retry_exhausted' then
        job.last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        or job.dispatch_last_error_code
          = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
      else false
    end into action_active
    from public.production_purchase_intents as intent
    left join public.production_verified_payments as verified
      on verified.purchase_intent_id = intent.id
    left join public.production_fulfillment_jobs as job
      on job.purchase_intent_id = intent.id
    left join public.production_logical_assessments as logical_assessment
      on logical_assessment.id = job.logical_assessment_id
    left join public.production_customer_deliveries as delivery
      on delivery.logical_assessment_id = logical_assessment.id
    where intent.id = locked.purchase_intent_id;

    if not coalesce(action_active, false) then
      update public.production_operator_notification_outbox
      set status = 'superseded', owner_id = null, lease_expires_at = null,
          processing_started_at = null, retry_after = null,
          last_error_code = 'OPERATOR_NOTIFICATION_ACTION_RESOLVED',
          updated_at = p_now
      where id = locked.id;
      return pg_catalog.jsonb_build_object(
        'disposition', 'superseded',
        'operator_notification_id', locked.id,
        'notification_type', locked.notification_type,
        'incident_code', locked.incident_code
      );
    end if;
  end if;

  update public.production_operator_notification_outbox
  set send_started_at = p_now, updated_at = p_now
  where id = locked.id;
  return pg_catalog.jsonb_build_object(
    'disposition', 'ready',
    'operator_notification_id', locked.id,
    'notification_type', locked.notification_type,
    'incident_code', locked.incident_code,
    'send_started_at', p_now
  );
end;
$function$;

create function public.complete_production_operator_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_provider_message_reference text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_notification_id is null
     or p_owner_id is null
     or p_provider_message_reference is null
     or p_provider_message_reference !~ '^[0-9]{17,20}$'
     or p_now is null then
    raise exception 'OPERATOR_NOTIFICATION_COMPLETE_INVALID' using errcode = 'P0001';
  end if;
  update public.production_operator_notification_outbox
  set status = 'sent', owner_id = null, lease_expires_at = null,
      processing_started_at = null, retry_after = null,
      sent_at = p_now,
      provider_message_reference = p_provider_message_reference,
      last_error_code = null, updated_at = p_now
  where id = p_notification_id
    and status = 'processing'
    and owner_id = p_owner_id
    and lease_expires_at > p_now
    and send_started_at is not null
    and send_started_at <= p_now;
  if not found then
    raise exception 'OPERATOR_NOTIFICATION_COMPLETE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.finish_production_operator_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_outcome text,
  p_retry_after timestamptz,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_notification_id is null
     or p_owner_id is null
     or p_outcome is null
     or p_outcome not in ('retryable', 'ambiguous', 'terminal_failure')
     or p_error_code is null
     or p_error_code !~ '^[A-Z][A-Z0-9_]{0,127}$'
     or p_now is null
     or (p_outcome = 'retryable'
       and (p_retry_after is null or p_retry_after <= p_now))
     or (p_outcome <> 'retryable' and p_retry_after is not null) then
    raise exception 'OPERATOR_NOTIFICATION_FINISH_INVALID' using errcode = 'P0001';
  end if;
  update public.production_operator_notification_outbox
  set status = p_outcome,
      owner_id = null,
      lease_expires_at = null,
      processing_started_at = null,
      send_started_at = case when p_outcome = 'retryable'
        then null else send_started_at end,
      retry_after = case when p_outcome = 'retryable'
        then p_retry_after else null end,
      last_error_code = p_error_code,
      updated_at = p_now
  where id = p_notification_id
    and status = 'processing'
    and owner_id = p_owner_id
    and lease_expires_at > p_now
    and send_started_at is not null
    and send_started_at <= p_now;
  if not found then
    raise exception 'OPERATOR_NOTIFICATION_FINISH_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on table public.production_operator_notification_outbox
  from public, anon, authenticated, service_role;
revoke all on table public.production_operator_notification_cutovers
  from public, anon, authenticated, service_role;
grant select, insert, update on table public.production_operator_notification_outbox
  to service_role;
grant select, insert on table public.production_operator_notification_cutovers
  to service_role;

revoke all on function public.claim_production_operator_notification_batch_v1(
  uuid, text, timestamptz, timestamptz, timestamptz, integer
) from public, anon, authenticated, service_role;
revoke all on function public.begin_production_operator_notification_send_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.complete_production_operator_notification_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.finish_production_operator_notification_v1(
  uuid, uuid, text, timestamptz, text, timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.claim_production_operator_notification_batch_v1(
  uuid, text, timestamptz, timestamptz, timestamptz, integer
) to service_role;
grant execute on function public.begin_production_operator_notification_send_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.complete_production_operator_notification_v1(
  uuid, uuid, text, timestamptz
) to service_role;
grant execute on function public.finish_production_operator_notification_v1(
  uuid, uuid, text, timestamptz, text, timestamptz
) to service_role;

comment on table public.production_operator_notification_outbox is
  'PII-free durable outbox for Moon Reply Operator Discord Notifications R1 only.';
comment on table public.production_operator_notification_cutovers is
  'Immutable first-use ACTIVE_FROM boundary per payment environment for Operator Discord R1.';
comment on function public.claim_production_operator_notification_batch_v1(
  uuid, text, timestamptz, timestamptz, timestamptz, integer
) is
  'Materializes and claims only NEW PURCHASE, DELIVERY COMPLETE, and ACTION REQUIRED operator events after ACTIVE_FROM.';
comment on function public.begin_production_operator_notification_send_v1(
  uuid, uuid, timestamptz
) is
  'Revalidates ACTION REQUIRED immediately before recording the irreversible Discord send boundary.';

commit;
