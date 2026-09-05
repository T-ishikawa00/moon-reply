-- F003: a bounded followup lane for the same Stripe Checkout session.
-- Expand first. No payment/fulfillment authority or historical migration changes.
begin;

create table public.production_payment_reconciliation_followups (
  payment_attempt_id uuid primary key references public.production_payment_attempts(id) on delete restrict,
  short_stopped_at timestamptz not null,
  short_error_code text not null,
  stop_cause_code text,
  status text not null check (status in ('pending', 'processing', 'blocked', 'resolved')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_check_at timestamptz,
  owner_id uuid,
  lease_expires_at timestamptz,
  last_checked_at timestamptz,
  last_error_code text,
  first_observed_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz,
  constraint production_payment_followup_codes check (
    short_error_code ~ '^[A-Z0-9_]{3,128}$'
    and (stop_cause_code is null or stop_cause_code ~ '^[A-Z0-9_]{3,128}$')
    and (last_error_code is null or last_error_code ~ '^[A-Z0-9_]{3,128}$')
  ),
  constraint production_payment_followup_lease check (
    (status = 'processing' and owner_id is not null and lease_expires_at is not null)
    or (status <> 'processing' and owner_id is null and lease_expires_at is null)
  ),
  constraint production_payment_followup_due check (
    (status in ('pending', 'processing') and next_check_at is not null)
    or (status in ('blocked', 'resolved') and next_check_at is null)
  ),
  constraint production_payment_followup_resolved check (
    (status = 'resolved') = (resolved_at is not null)
  )
);
create index production_payment_followup_due_idx
  on public.production_payment_reconciliation_followups(status, next_check_at, payment_attempt_id);
alter table public.production_payment_reconciliation_followups enable row level security;

-- This singleton bounds overlapping/serverless workers to one provider read
-- per five-minute slot. Individual attempts wait at least one hour.
create table public.production_payment_reconciliation_followup_clock (
  singleton boolean primary key default true check (singleton),
  next_claim_at timestamptz not null
);
alter table public.production_payment_reconciliation_followup_clock enable row level security;
insert into public.production_payment_reconciliation_followup_clock values (true, '-infinity');

-- Detection does not depend on successful materialization of the bounded
-- queue. Historical ambiguous stops remain visible, without guessing payment
-- status or resetting either the short-window count or its stopped timestamp.
create view public.production_unresolved_payment_reconciliations
with (security_invoker = true) as
select attempt.id as payment_attempt_id, attempt.purchase_intent_id,
  intent.environment, attempt.state as attempt_state, intent.state as intent_state,
  attempt.reconciliation_stopped_at as short_stopped_at,
  attempt.reconciliation_last_error_code as short_error_code,
  followup.stop_cause_code,
  coalesce(followup.status, 'untracked') as followup_status,
  followup.next_check_at, followup.last_checked_at, followup.last_error_code,
  followup.attempt_count, followup.first_observed_at
from public.production_payment_attempts as attempt
join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
left join public.production_payment_reconciliation_followups as followup on followup.payment_attempt_id = attempt.id
where attempt.reconciliation_stopped_at is not null
  and attempt.state in ('reserved', 'pending', 'processing', 'unknown');

create function public.finish_rc2_payment_reconciliation_v2(
  p_payment_attempt_id uuid, p_owner_id uuid, p_outcome text,
  p_retry_after timestamptz, p_error_code text, p_stop_cause_code text,
  p_now timestamptz
) returns void language plpgsql security invoker set search_path = '' as $function$
declare
  attempt public.production_payment_attempts%rowtype;
  may_retry boolean;
begin
  if p_payment_attempt_id is null or p_owner_id is null or p_now is null
    or p_outcome is null or p_outcome not in ('retry', 'stop', 'settled') then
    raise exception 'RC2_PAYMENT_RECONCILIATION_FINISH_INVALID' using errcode = 'P0001';
  end if;
  if p_stop_cause_code is not null and p_stop_cause_code !~ '^[A-Z0-9_]{3,128}$' then
    raise exception 'RC2_PAYMENT_RECONCILIATION_STOP_CAUSE_INVALID' using errcode = 'P0001';
  end if;
  perform public.finish_rc2_payment_reconciliation_v1(
    p_payment_attempt_id, p_owner_id, p_outcome, p_retry_after, p_error_code, p_now
  );
  if p_outcome <> 'stop' then return; end if;
  select * into strict attempt from public.production_payment_attempts where id = p_payment_attempt_id;
  may_retry := attempt.reconciliation_attempt_count >= 6
    and p_error_code in ('PAYMENT_RECONCILIATION_RETRY_EXHAUSTED', 'PAYMENT_RECONCILIATION_STOPPED')
    and p_stop_cause_code in ('PAYMENT_RECONCILIATION_PENDING', 'PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE');
  insert into public.production_payment_reconciliation_followups (
    payment_attempt_id, short_stopped_at, short_error_code, stop_cause_code,
    status, next_check_at, first_observed_at, updated_at
  ) values (
    attempt.id, attempt.reconciliation_stopped_at, p_error_code, p_stop_cause_code,
    case when coalesce(may_retry, false) then 'pending' else 'blocked' end,
    case when coalesce(may_retry, false) then p_now + interval '1 hour' else null end,
    p_now, p_now
  ) on conflict (payment_attempt_id) do nothing;
end;
$function$;

create function public.claim_rc2_payment_reconciliation_followup_v1(
  p_owner_id uuid, p_now timestamptz
) returns table(payment_attempt_id uuid, provider_checkout_session_id text, reconciliation_attempt_count integer)
language plpgsql security invoker set search_path = '' as $function$
declare selected_id uuid;
begin
  if p_owner_id is null or p_now is null then
    raise exception 'RC2_PAYMENT_FOLLOWUP_CLAIM_INVALID' using errcode = 'P0001';
  end if;
  -- Old STOPPED/RETRY_EXHAUSTED records and final-read crashes have no proven
  -- transient provenance. Detect and notify them; do not reauthorize reads.
  insert into public.production_payment_reconciliation_followups (
    payment_attempt_id, short_stopped_at, short_error_code, status,
    first_observed_at, updated_at
  )
  select attempt.id, attempt.reconciliation_stopped_at,
    coalesce(attempt.reconciliation_last_error_code, 'PAYMENT_RECONCILIATION_STOP_CAUSE_UNKNOWN'),
    'blocked', p_now, p_now
  from public.production_payment_attempts as attempt
  where attempt.reconciliation_stopped_at is not null
    and attempt.state in ('reserved', 'pending', 'processing', 'unknown')
    and not exists (select 1 from public.production_payment_reconciliation_followups as f where f.payment_attempt_id = attempt.id)
  order by attempt.reconciliation_stopped_at, attempt.id
  limit 100 on conflict on constraint production_payment_reconciliation_followups_pkey do nothing;

  -- Only existing durable terminal attempt state closes a tracking record.
  -- Manual review/supersession is blocked monitoring, never a new financial state.
  with candidates as (
    select f.payment_attempt_id, attempt.state as attempt_state,
      intent.current_payment_attempt_id, intent.state as intent_state
    from public.production_payment_reconciliation_followups as f
    join public.production_payment_attempts as attempt on attempt.id = f.payment_attempt_id
    join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
    where f.status <> 'resolved'
      and (f.owner_id is null or f.lease_expires_at <= p_now)
      and (attempt.state in ('succeeded', 'failed', 'canceled')
        or (f.status <> 'blocked' and (intent.current_payment_attempt_id is distinct from attempt.id
          or intent.state not in ('pending', 'processing', 'unknown'))))
    order by f.updated_at, f.payment_attempt_id
    for update of f skip locked limit 100
  )
  update public.production_payment_reconciliation_followups as f
  set status = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then 'resolved' else 'blocked' end,
    next_check_at = null, owner_id = null, lease_expires_at = null,
    resolved_at = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then p_now else null end,
    last_error_code = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then null else 'PAYMENT_RECONCILIATION_AUTHORITY_CHANGED' end,
    updated_at = p_now
  from candidates as c where f.payment_attempt_id = c.payment_attempt_id;

  perform 1 from public.production_payment_reconciliation_followup_clock
    where singleton and next_claim_at <= p_now for update skip locked;
  if not found then return; end if;
  select f.payment_attempt_id into selected_id
  from public.production_payment_reconciliation_followups as f
  join public.production_payment_attempts as attempt on attempt.id = f.payment_attempt_id
  join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
  where f.status in ('pending', 'processing') and f.next_check_at <= p_now
    and (f.owner_id is null or f.lease_expires_at <= p_now)
    and attempt.state in ('pending', 'processing', 'unknown')
    and attempt.provider_checkout_session_id is not null
    and attempt.reconciliation_stopped_at is not null
    and intent.current_payment_attempt_id = attempt.id
    and intent.state in ('pending', 'processing', 'unknown')
  order by f.next_check_at, f.payment_attempt_id
  for update of f skip locked limit 1;
  if selected_id is null then return; end if;
  update public.production_payment_reconciliation_followup_clock set next_claim_at = p_now + interval '5 minutes' where singleton;
  return query
  update public.production_payment_reconciliation_followups as f
  set status = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_now + interval '24 seconds',
    -- Advance the durable due time before a read, so a crashed worker cannot
    -- make lease expiry into an immediate provider retry loop.
    next_check_at = p_now + pg_catalog.make_interval(secs =>
      least(86400, 3600 * pg_catalog.power(2, least(f.attempt_count, 5)))::double precision
      + (pg_catalog.get_byte(pg_catalog.decode(pg_catalog.md5(f.payment_attempt_id::text || ':' || f.attempt_count::text), 'hex'), 0) % 301)),
    attempt_count = f.attempt_count + 1, last_checked_at = p_now, updated_at = p_now
  from public.production_payment_attempts as attempt
  where f.payment_attempt_id = selected_id and attempt.id = f.payment_attempt_id
  returning f.payment_attempt_id, attempt.provider_checkout_session_id, f.attempt_count;
end;
$function$;

create function public.finish_rc2_payment_reconciliation_followup_v1(
  p_payment_attempt_id uuid, p_owner_id uuid, p_outcome text, p_error_code text, p_now timestamptz
) returns void language plpgsql security invoker set search_path = '' as $function$
declare
  followup public.production_payment_reconciliation_followups%rowtype;
  attempt public.production_payment_attempts%rowtype;
  intent public.production_purchase_intents%rowtype;
  disposition text;
begin
  if p_payment_attempt_id is null or p_owner_id is null or p_now is null
    or p_outcome is null or p_outcome not in ('retry', 'blocked', 'settled')
    or (p_outcome = 'settled' and p_error_code is not null)
    or (p_outcome <> 'settled' and (p_error_code is null or p_error_code !~ '^[A-Z0-9_]{3,128}$')) then
    raise exception 'RC2_PAYMENT_FOLLOWUP_FINISH_INVALID' using errcode = 'P0001';
  end if;
  select * into followup from public.production_payment_reconciliation_followups
    where payment_attempt_id = p_payment_attempt_id for update;
  if followup.payment_attempt_id is null or followup.status <> 'processing'
    or followup.owner_id is distinct from p_owner_id or followup.lease_expires_at <= p_now then
    raise exception 'RC2_PAYMENT_FOLLOWUP_CONFLICT' using errcode = 'P0001';
  end if;
  select * into strict attempt from public.production_payment_attempts where id = p_payment_attempt_id;
  select * into strict intent from public.production_purchase_intents where id = attempt.purchase_intent_id;
  if attempt.state in ('succeeded', 'failed', 'canceled') then
    disposition := 'resolved';
  elsif p_outcome = 'settled' then
    raise exception 'RC2_PAYMENT_FOLLOWUP_NOT_SETTLED' using errcode = 'P0001';
  elsif p_outcome = 'blocked' or intent.current_payment_attempt_id is distinct from attempt.id
    or intent.state not in ('pending', 'processing', 'unknown')
    or p_error_code not in ('PAYMENT_RECONCILIATION_PENDING', 'PAYMENT_RECONCILIATION_PROVIDER_UNAVAILABLE') then
    disposition := 'blocked';
  else disposition := 'pending';
  end if;
  update public.production_payment_reconciliation_followups
  set status = disposition, owner_id = null, lease_expires_at = null,
    next_check_at = case when disposition = 'pending' then next_check_at else null end,
    resolved_at = case when disposition = 'resolved' then p_now else null end,
    last_error_code = case when disposition = 'resolved' then null else p_error_code end,
    updated_at = p_now where payment_attempt_id = p_payment_attempt_id;
end;
$function$;

revoke all on table public.production_payment_reconciliation_followups,
  public.production_payment_reconciliation_followup_clock,
  public.production_unresolved_payment_reconciliations from public, anon, authenticated, m2_b2_stripe_ingress;
grant select, insert, update on public.production_payment_reconciliation_followups,
  public.production_payment_reconciliation_followup_clock to service_role;
grant select on public.production_unresolved_payment_reconciliations to service_role;
revoke all on function public.finish_rc2_payment_reconciliation_v2(uuid, uuid, text, timestamptz, text, text, timestamptz),
  public.claim_rc2_payment_reconciliation_followup_v1(uuid, timestamptz),
  public.finish_rc2_payment_reconciliation_followup_v1(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated, m2_b2_stripe_ingress;
grant execute on function public.finish_rc2_payment_reconciliation_v2(uuid, uuid, text, timestamptz, text, text, timestamptz),
  public.claim_rc2_payment_reconciliation_followup_v1(uuid, timestamptz),
  public.finish_rc2_payment_reconciliation_followup_v1(uuid, uuid, text, text, timestamptz) to service_role;


-- The legacy claim body below is byte-identical to 0022 except two explicit
-- exclusions for the new incident (proved by the F003 verifier). Thus an old
-- app with the expanded DB cannot claim or supersede new-incident rows.
create or replace function public.claim_production_operator_notification_batch_v1(
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
    and operator_outbox.incident_code <> 'payment_reconciliation_stopped'
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
      and operator_outbox.incident_code is distinct from 'payment_reconciliation_stopped'
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

alter table public.production_operator_notification_outbox
  add column reconciliation_attempt_id uuid,
  add constraint production_operator_notification_reconciliation_binding
    foreign key (purchase_intent_id, reconciliation_attempt_id)
    references public.production_payment_attempts(purchase_intent_id, id) on delete restrict;
alter table public.production_operator_notification_outbox
  drop constraint production_operator_notification_incident,
  drop constraint production_operator_notification_source_binding,
  drop constraint production_operator_notification_event_key;
alter table public.production_operator_notification_outbox
  add constraint production_operator_notification_incident check (
    (notification_type <> 'action_required' and incident_code is null)
    or (notification_type = 'action_required' and incident_code in (
      'delivery_pending_15m', 'manual_review', 'payment_fulfillment_retry_exhausted', 'payment_reconciliation_stopped'
    ))
  ),
  add constraint production_operator_notification_source_binding check (
    (notification_type = 'new_purchase' and verified_payment_id is not null and delivery_id is null and reconciliation_attempt_id is null)
    or (notification_type = 'delivery_complete' and verified_payment_id is not null and delivery_id is not null and reconciliation_attempt_id is null)
    or (notification_type = 'action_required' and delivery_id is null and (
      (incident_code = 'payment_reconciliation_stopped' and verified_payment_id is null and reconciliation_attempt_id is not null)
      or (incident_code <> 'payment_reconciliation_stopped' and reconciliation_attempt_id is null and (verified_payment_id is not null or incident_code = 'manual_review'))
    ))
  ),
  add constraint production_operator_notification_event_key check (
    (notification_type = 'new_purchase' and event_key = 'new_purchase:' || verified_payment_id::text)
    or (notification_type = 'delivery_complete' and event_key = 'delivery_complete:' || delivery_id::text)
    or (notification_type = 'action_required' and (
      (incident_code <> 'payment_reconciliation_stopped' and event_key = 'action_required:' || purchase_intent_id::text || ':' || incident_code)
      or (incident_code = 'payment_reconciliation_stopped' and event_key = 'action_required:' || purchase_intent_id::text || ':' || incident_code || ':' || reconciliation_attempt_id::text)
    ))
  );

create function public.claim_production_operator_notification_batch_v2(
  p_owner_id uuid, p_environment text, p_active_from timestamptz,
  p_lease_expires_at timestamptz, p_now timestamptz, p_limit integer
) returns table (
  notification_id uuid, notification_type text, incident_code text, purchase_intent_id uuid,
  amount integer, currency text, payment_state text, delivery_state text, fulfillment_state text,
  event_occurred_at timestamptz, elapsed_seconds bigint, attempt_count integer
) language plpgsql security invoker set search_path = '' as $function$
declare legacy_claimed integer;
begin
  -- Preserve the original environment/cutover checks, materialization and
  -- send-boundary lease recovery. Total old + new claims stays <= four.
  return query select * from public.claim_production_operator_notification_batch_v1(
    p_owner_id, p_environment, p_active_from, p_lease_expires_at, p_now, p_limit
  );
  get diagnostics legacy_claimed = row_count;
  insert into public.production_operator_notification_outbox (
    event_key, notification_type, incident_code, environment, purchase_intent_id,
    reconciliation_attempt_id, source_occurred_at, status, requested_at, created_at, updated_at
  )
  select 'action_required:' || intent.id::text || ':payment_reconciliation_stopped:' || f.payment_attempt_id::text,
    'action_required', 'payment_reconciliation_stopped', intent.environment, intent.id,
    f.payment_attempt_id, f.first_observed_at, 'pending', p_now, p_now, p_now
  from public.production_payment_reconciliation_followups as f
  join public.production_payment_attempts as attempt on attempt.id = f.payment_attempt_id
  join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
  where intent.environment = p_environment
    and f.first_observed_at between p_active_from and p_now
    and attempt.state in ('reserved', 'pending', 'processing', 'unknown')
    and f.status <> 'resolved'
    and not exists (select 1 from public.production_operator_notification_outbox as o where o.reconciliation_attempt_id = f.payment_attempt_id)
  order by f.first_observed_at, f.payment_attempt_id limit 100
  on conflict (event_key) do nothing;

  update public.production_operator_notification_outbox as o
  set status = 'superseded', retry_after = null,
    last_error_code = 'OPERATOR_NOTIFICATION_ACTION_RESOLVED', updated_at = p_now
  where o.environment = p_environment and o.incident_code = 'payment_reconciliation_stopped'
    and o.status in ('pending', 'retryable')
    and not exists (select 1 from public.production_payment_attempts as a
      where a.id = o.reconciliation_attempt_id and a.state in ('reserved', 'pending', 'processing', 'unknown'));
  if legacy_claimed >= p_limit then return; end if;
  return query
  with candidates as (
    select o.id from public.production_operator_notification_outbox as o
    where o.environment = p_environment and o.incident_code = 'payment_reconciliation_stopped'
      and o.source_occurred_at >= p_active_from
      and (o.status = 'pending' or (o.status = 'retryable' and o.retry_after <= p_now))
    order by o.source_occurred_at, o.id for update skip locked limit (p_limit - legacy_claimed)
  ), claimed as (
    update public.production_operator_notification_outbox as o
    set status = 'processing', owner_id = p_owner_id, lease_expires_at = p_lease_expires_at,
      processing_started_at = p_now, send_started_at = null, retry_after = null,
      attempt_count = o.attempt_count + 1, last_error_code = null, updated_at = p_now
    from candidates where o.id = candidates.id returning o.*
  )
  select c.id, c.notification_type, c.incident_code, c.purchase_intent_id,
    intent.expected_amount, intent.currency, 'unverified'::text, 'unknown'::text, 'not_authorized'::text,
    c.source_occurred_at, greatest(0, pg_catalog.floor(extract(epoch from p_now - c.source_occurred_at)))::bigint,
    c.attempt_count
  from claimed as c join public.production_purchase_intents as intent on intent.id = c.purchase_intent_id;
end;
$function$;

create function public.begin_production_operator_notification_send_v2(
  p_notification_id uuid, p_owner_id uuid, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare locked public.production_operator_notification_outbox%rowtype;
begin
  select * into locked from public.production_operator_notification_outbox where id = p_notification_id for update;
  if locked.incident_code is distinct from 'payment_reconciliation_stopped' then
    return public.begin_production_operator_notification_send_v1(p_notification_id, p_owner_id, p_now);
  end if;
  if p_owner_id is null or p_now is null or locked.status <> 'processing'
    or locked.owner_id is distinct from p_owner_id or locked.lease_expires_at <= p_now then
    raise exception 'OPERATOR_NOTIFICATION_SEND_CONFLICT' using errcode = 'P0001';
  end if;
  if locked.send_started_at is not null then
    raise exception 'OPERATOR_NOTIFICATION_SEND_ALREADY_STARTED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.production_payment_attempts as a
    where a.id = locked.reconciliation_attempt_id and a.state in ('reserved', 'pending', 'processing', 'unknown')) then
    update public.production_operator_notification_outbox
    set status = 'superseded', owner_id = null, lease_expires_at = null,
      processing_started_at = null, retry_after = null,
      last_error_code = 'OPERATOR_NOTIFICATION_ACTION_RESOLVED', updated_at = p_now where id = locked.id;
    return pg_catalog.jsonb_build_object('disposition', 'superseded');
  end if;
  update public.production_operator_notification_outbox set send_started_at = p_now, updated_at = p_now where id = locked.id;
  return pg_catalog.jsonb_build_object('disposition', 'ready');
end;
$function$;

revoke all on function public.claim_production_operator_notification_batch_v2(uuid, text, timestamptz, timestamptz, timestamptz, integer),
  public.begin_production_operator_notification_send_v2(uuid, uuid, timestamptz)
  from public, anon, authenticated, m2_b2_stripe_ingress;
grant execute on function public.claim_production_operator_notification_batch_v2(uuid, text, timestamptz, timestamptz, timestamptz, integer),
  public.begin_production_operator_notification_send_v2(uuid, uuid, timestamptz) to service_role;

commit;
