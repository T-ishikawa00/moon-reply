-- RC-2 Production Activation Step B: append-only local database hardening.
-- Accepted migrations 0002 through 0011 remain byte-identical.

begin;

-- The clarification table predates the production activation migrations. Keep
-- the complete assessment surface under RLS before granting the server role.
alter table public.assessment_requests enable row level security;
alter table public.assessment_runs enable row level security;
alter table public.assessment_stage_runs enable row level security;
alter table public.assessment_reports enable row level security;
alter table public.assessment_clarifications enable row level security;

revoke all on table public.assessment_requests
  from public, anon, authenticated, service_role;
revoke all on table public.assessment_runs
  from public, anon, authenticated, service_role;
revoke all on table public.assessment_stage_runs
  from public, anon, authenticated, service_role;
revoke all on table public.assessment_reports
  from public, anon, authenticated, service_role;
revoke all on table public.assessment_clarifications
  from public, anon, authenticated, service_role;

grant select, insert, update on table public.assessment_requests
  to service_role;
grant select, insert, update on table public.assessment_runs
  to service_role;
grant select, insert, update on table public.assessment_stage_runs
  to service_role;
grant select, insert on table public.assessment_reports
  to service_role;
grant select, insert, update on table public.assessment_clarifications
  to service_role;

create function public.rc2_checkout_session_matches_environment_v1(
  p_environment text,
  p_provider_checkout_session_id text
) returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $function$
  select case p_environment
    when 'test' then
      p_provider_checkout_session_id ~ '^cs_test_[A-Za-z0-9_]+$'
    when 'live' then
      p_provider_checkout_session_id ~ '^cs_live_[A-Za-z0-9_]+$'
    else false
  end
$function$;

-- Fail closed instead of silently repairing any pre-existing cross-environment
-- rows. A failure rolls this entire migration back.
do $migration$
begin
  if exists (
    select 1
    from public.production_payment_attempts as attempt
    join public.production_purchase_intents as intent
      on intent.id = attempt.purchase_intent_id
    where attempt.provider_checkout_session_id is not null
      and not public.rc2_checkout_session_matches_environment_v1(
        intent.environment, attempt.provider_checkout_session_id
      )
  ) then
    raise exception 'RC2_EXISTING_PAYMENT_ATTEMPT_ENVIRONMENT_MISMATCH'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.production_verified_payments as payment
    join public.production_purchase_intents as intent
      on intent.id = payment.purchase_intent_id
    join public.production_payment_attempts as attempt
      on attempt.id = payment.payment_attempt_id
    where payment.environment is distinct from intent.environment
      or attempt.purchase_intent_id is distinct from intent.id
      or attempt.provider_checkout_session_id is distinct from
        payment.provider_checkout_session_id
      or not public.rc2_checkout_session_matches_environment_v1(
        payment.environment, payment.provider_checkout_session_id
      )
  ) then
    raise exception 'RC2_EXISTING_VERIFIED_PAYMENT_ENVIRONMENT_MISMATCH'
      using errcode = 'P0001';
  end if;
end;
$migration$;

alter table public.production_verified_payments
  add constraint production_verified_payment_environment_session_binding
  check (
    (environment = 'test'
      and provider_checkout_session_id ~ '^cs_test_[A-Za-z0-9_]+$')
    or
    (environment = 'live'
      and provider_checkout_session_id ~ '^cs_live_[A-Za-z0-9_]+$')
  );

create function public.enforce_rc2_purchase_intent_environment_immutable_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.environment is distinct from old.environment then
    raise exception 'RC2_PURCHASE_INTENT_ENVIRONMENT_IMMUTABLE'
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create trigger enforce_rc2_purchase_intent_environment_immutable_v1
before update of environment on public.production_purchase_intents
for each row
execute function public.enforce_rc2_purchase_intent_environment_immutable_v1();

create function public.enforce_rc2_payment_attempt_environment_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent_environment text;
begin
  select environment into intent_environment
  from public.production_purchase_intents
  where id = new.purchase_intent_id;

  if not found then
    raise exception 'RC2_PAYMENT_INTENT_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  if new.provider_checkout_session_id is not null
     and not public.rc2_checkout_session_matches_environment_v1(
       intent_environment, new.provider_checkout_session_id
     ) then
    raise exception 'RC2_PAYMENT_ENVIRONMENT_MISMATCH'
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

create trigger enforce_rc2_payment_attempt_environment_v1
before insert or update on public.production_payment_attempts
for each row
execute function public.enforce_rc2_payment_attempt_environment_v1();

create function public.enforce_rc2_verified_payment_binding_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent_environment text;
  attempt_intent_id uuid;
  attempt_checkout_session_id text;
begin
  select environment into intent_environment
  from public.production_purchase_intents
  where id = new.purchase_intent_id;

  if not found then
    raise exception 'RC2_PAYMENT_INTENT_NOT_FOUND'
      using errcode = 'P0001';
  end if;

  select purchase_intent_id, provider_checkout_session_id
    into attempt_intent_id, attempt_checkout_session_id
  from public.production_payment_attempts
  where id = new.payment_attempt_id;

  if not found
     or new.environment is distinct from intent_environment
     or attempt_intent_id is distinct from new.purchase_intent_id
     or attempt_checkout_session_id is distinct from
       new.provider_checkout_session_id
     or not public.rc2_checkout_session_matches_environment_v1(
       intent_environment, new.provider_checkout_session_id
     ) then
    raise exception 'RC2_VERIFIED_PAYMENT_BINDING_MISMATCH'
      using errcode = 'P0001';
  end if;

  return new;
end;
$function$;

create trigger enforce_rc2_verified_payment_binding_v1
before insert or update on public.production_verified_payments
for each row
execute function public.enforce_rc2_verified_payment_binding_v1();

-- Accepted SECURITY INVOKER functions lock verified-payment rows with
-- SELECT ... FOR UPDATE. PostgreSQL requires UPDATE table authority for that
-- lock even though the functions never mutate a verified payment. Grant the
-- lock authority, then make actual row mutation fail closed.
grant update on table public.production_verified_payments to service_role;

create function public.reject_rc2_verified_payment_mutation_v1()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'RC2_VERIFIED_PAYMENT_IMMUTABLE'
    using errcode = 'P0001';
end;
$function$;

create trigger reject_rc2_verified_payment_mutation_v1
before update on public.production_verified_payments
for each row
execute function public.reject_rc2_verified_payment_mutation_v1();

create or replace function public.record_rc2_stripe_evidence_v1(
  p_provider_event_id text,
  p_evidence_source text,
  p_event_type text,
  p_provider_created_at timestamptz,
  p_payload_sha256 text,
  p_environment text,
  p_purchase_reference text,
  p_provider_checkout_session_id text,
  p_provider_payment_id text,
  p_mode text,
  p_payment_status text,
  p_amount_total integer,
  p_currency text,
  p_application_disposition text,
  p_application_reason_code text,
  p_verified_payment_id uuid,
  p_fulfillment_job_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  duplicate_event public.production_stripe_event_ledger%rowtype;
  intent public.production_purchase_intents%rowtype;
  attempt public.production_payment_attempts%rowtype;
  authority public.production_verified_email_authorities%rowtype;
  preparation public.production_preparations%rowtype;
  existing_payment public.production_verified_payments%rowtype;
  existing_job_id uuid;
  terminal_success boolean;
  final_disposition text;
  final_reason text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rc2-stripe-event:' || p_provider_event_id, 0)
  );
  select * into duplicate_event from public.production_stripe_event_ledger
    where provider_event_id = p_provider_event_id;
  if duplicate_event.provider_event_id is not null then
    return jsonb_build_object(
      'disposition', 'duplicate',
      'purchase_intent_id', duplicate_event.purchase_intent_id,
      'verified_payment_id', duplicate_event.verified_payment_id,
      'fulfillment_job_id', duplicate_event.fulfillment_job_id
    );
  end if;
  insert into public.production_stripe_event_ledger (
    provider_event_id, evidence_source, event_type,
    provider_created_at, payload_sha256,
    environment, purchase_reference, provider_checkout_session_id,
    provider_payment_id, mode, payment_status, amount_total, currency,
    disposition, reason_code, received_at
  ) values (
    p_provider_event_id, p_evidence_source, p_event_type,
    p_provider_created_at, p_payload_sha256,
    p_environment, p_purchase_reference, p_provider_checkout_session_id,
    p_provider_payment_id, p_mode, p_payment_status, p_amount_total, p_currency,
    'received', p_application_reason_code, p_now
  );
  select * into intent from public.production_purchase_intents
    where id::text = p_purchase_reference for update;
  select * into attempt from public.production_payment_attempts
    where provider_checkout_session_id = p_provider_checkout_session_id for update;
  -- Preserve mismatched provider evidence in the ledger, but reject it before
  -- any payment attempt, purchase intent, verified payment, or job can advance.
  if intent.id is not null and (
    p_environment is distinct from intent.environment
    or p_provider_checkout_session_id is null
    or not public.rc2_checkout_session_matches_environment_v1(
      intent.environment, p_provider_checkout_session_id
    )
  ) then
    update public.production_stripe_event_ledger set
      disposition = 'rejected',
      reason_code = 'PAYMENT_ENVIRONMENT_MISMATCH',
      purchase_intent_id = intent.id,
      processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', 'rejected',
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  if intent.id is null or attempt.id is null
     or attempt.purchase_intent_id <> intent.id then
    final_disposition := 'rejected';
    final_reason := 'PAYMENT_BINDING_INVALID';
  elsif p_application_disposition = 'rejected' then
    final_disposition := 'rejected';
    final_reason := coalesce(p_application_reason_code, 'PAYMENT_EVIDENCE_REJECTED');
  else
    final_disposition := null;
    final_reason := null;
  end if;
  if final_disposition is not null then
    update public.production_stripe_event_ledger set
      disposition = final_disposition, reason_code = final_reason,
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  terminal_success := coalesce(p_application_disposition = 'verified'
    and p_event_type in (
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded'
    ) and p_payment_status = 'paid', false);
  if not terminal_success and (
    intent.state in ('verified', 'manual_review')
    or attempt.id <> intent.current_payment_attempt_id
    or attempt.state in ('failed', 'canceled', 'succeeded')
    or (attempt.last_provider_event_created_at is not null
      and p_provider_created_at < attempt.last_provider_event_created_at)
  ) then
    update public.production_stripe_event_ledger set
      disposition = 'stale', reason_code = 'PAYMENT_STALE_EVENT_IGNORED',
      purchase_intent_id = intent.id,
      verified_payment_id = intent.successful_payment_id,
      fulfillment_job_id = (
        select id from public.production_fulfillment_jobs
          where purchase_intent_id = intent.id
      ), processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', 'stale', 'purchase_intent_id', intent.id,
      'verified_payment_id', intent.successful_payment_id,
      'fulfillment_job_id', (
        select id from public.production_fulfillment_jobs
          where purchase_intent_id = intent.id
      )
    );
  end if;
  if not terminal_success then
    if p_application_disposition = 'pending' then
      update public.production_payment_attempts set
        state = 'processing',
        last_provider_event_created_at = greatest(
          coalesce(last_provider_event_created_at, p_provider_created_at),
          p_provider_created_at
        ), updated_at = p_now
        where id = attempt.id and state <> 'succeeded';
      update public.production_purchase_intents set
        state = 'processing', updated_at = p_now
        where id = intent.id and state not in ('verified', 'manual_review');
      final_disposition := 'pending';
    elsif p_application_disposition in ('failed', 'canceled') then
      update public.production_payment_attempts set
        state = p_application_disposition,
        last_provider_event_created_at = p_provider_created_at,
        updated_at = p_now where id = attempt.id and state <> 'succeeded';
      update public.production_purchase_intents set
        state = case when p_application_disposition = 'failed'
          then 'payment_failed' else 'canceled' end,
        updated_at = p_now
        where id = intent.id and state not in ('verified', 'manual_review');
      final_disposition := p_application_disposition;
    else
      final_disposition := 'rejected';
      final_reason := 'PAYMENT_EVENT_DISPOSITION_INVALID';
    end if;
    update public.production_stripe_event_ledger set
      disposition = final_disposition, reason_code = final_reason,
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  select * into authority from public.production_verified_email_authorities
    where id = intent.verified_email_authority_id and revoked_at is null for update;
  select * into preparation from public.production_preparations
    where id = intent.preparation_id for update;
  if authority.id is null or preparation.id is null
     or preparation.status not in ('purchase_ready', 'consumed')
     or intent.expected_product_code <> 'moon_reply_love_message_assessment_note_v1'
     or intent.expected_amount <> 980 or intent.currency <> 'jpy'
     or intent.purchase_kind <> 'one_time' or intent.provider <> 'stripe'
     or intent.environment is distinct from p_environment
     or p_application_disposition is distinct from 'verified'
     or p_event_type is null or p_event_type not in (
       'checkout.session.completed',
       'checkout.session.async_payment_succeeded'
     )
     or p_payment_status is distinct from 'paid'
     or p_mode is distinct from 'payment'
     or p_amount_total is distinct from 980
     or lower(p_currency) is distinct from 'jpy'
     or p_provider_payment_id is null then
    update public.production_stripe_event_ledger set
      disposition = 'rejected', reason_code = 'PAYMENT_DB_VERIFICATION_FAILED',
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', 'rejected', 'purchase_intent_id', intent.id,
      'verified_payment_id', null, 'fulfillment_job_id', null
    );
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'rc2-provider-payment:' || p_provider_payment_id,
      0
    )
  );
  select * into existing_payment from public.production_verified_payments
    where purchase_intent_id = intent.id for update;
  if existing_payment.id is not null then
    select id into existing_job_id from public.production_fulfillment_jobs
      where verified_payment_id = existing_payment.id;
    if existing_payment.provider_payment_id = p_provider_payment_id
       and existing_payment.provider_checkout_session_id =
         p_provider_checkout_session_id then
      final_disposition := 'duplicate';
    else
      final_disposition := 'conflict';
      update public.production_purchase_intents set
        state = 'manual_review', updated_at = p_now where id = intent.id;
    end if;
    update public.production_stripe_event_ledger set
      disposition = final_disposition,
      reason_code = case when final_disposition = 'conflict'
        then 'PAYMENT_CONFLICTING_SUCCESS' else null end,
      purchase_intent_id = intent.id,
      verified_payment_id = existing_payment.id,
      fulfillment_job_id = existing_job_id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', existing_payment.id,
      'fulfillment_job_id', existing_job_id
    );
  end if;
  if exists (
    select 1 from public.production_verified_payments
      where provider_payment_id = p_provider_payment_id
        and purchase_intent_id <> intent.id
  ) then
    update public.production_purchase_intents set
      state = 'manual_review', updated_at = p_now where id = intent.id;
    update public.production_stripe_event_ledger set
      disposition = 'conflict', reason_code = 'PAYMENT_PROVIDER_ID_CONFLICT',
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', 'conflict', 'purchase_intent_id', intent.id,
      'verified_payment_id', null, 'fulfillment_job_id', null
    );
  end if;
  insert into public.production_verified_payments (
    id, purchase_intent_id, payment_attempt_id,
    provider_checkout_session_id, provider_payment_id, provider_event_id,
    product_code, amount, currency, environment, verified_at, created_at
  ) values (
    p_verified_payment_id, intent.id, attempt.id,
    p_provider_checkout_session_id, p_provider_payment_id, p_provider_event_id,
    intent.expected_product_code, p_amount_total, lower(p_currency),
    p_environment, p_now, p_now
  );
  update public.production_payment_attempts set
    state = 'succeeded', provider_payment_id = p_provider_payment_id,
    last_provider_event_created_at = greatest(
      coalesce(last_provider_event_created_at, p_provider_created_at),
      p_provider_created_at
    ), last_error_code = null, updated_at = p_now
    where id = attempt.id;
  update public.production_purchase_intents set
    state = 'verified', current_payment_attempt_id = attempt.id,
    successful_payment_id = p_verified_payment_id, updated_at = p_now
    where id = intent.id;
  insert into public.production_fulfillment_jobs (
    id, purchase_intent_id, verified_payment_id, preparation_id,
    delivery_authority_reference, state, attempt_count, requested_at,
    created_at, updated_at
  ) values (
    p_fulfillment_job_id, intent.id, p_verified_payment_id,
    intent.preparation_id, intent.delivery_authority_reference,
    'pending', 0, p_now, p_now, p_now
  );
  update public.production_stripe_event_ledger set
    disposition = 'applied', reason_code = null,
    purchase_intent_id = intent.id,
    verified_payment_id = p_verified_payment_id,
    fulfillment_job_id = p_fulfillment_job_id, processed_at = p_now
    where provider_event_id = p_provider_event_id;
  return jsonb_build_object(
    'disposition', 'verified', 'purchase_intent_id', intent.id,
    'verified_payment_id', p_verified_payment_id,
    'fulfillment_job_id', p_fulfillment_job_id
  );
end;
$function$;

revoke all on function public.rc2_checkout_session_matches_environment_v1(
  text, text
) from public, anon, authenticated;
revoke all on function
  public.enforce_rc2_purchase_intent_environment_immutable_v1()
  from public, anon, authenticated;
revoke all on function public.enforce_rc2_payment_attempt_environment_v1()
  from public, anon, authenticated;
revoke all on function public.enforce_rc2_verified_payment_binding_v1()
  from public, anon, authenticated;
revoke all on function public.reject_rc2_verified_payment_mutation_v1()
  from public, anon, authenticated;
revoke all on function public.record_rc2_stripe_evidence_v1(
  text, text, text, timestamptz, text, text, text, text, text, text, text,
  integer, text, text, text, uuid, uuid, timestamptz
) from public, anon, authenticated;

grant execute on function public.rc2_checkout_session_matches_environment_v1(
  text, text
) to service_role;
grant execute on function
  public.enforce_rc2_purchase_intent_environment_immutable_v1()
  to service_role;
grant execute on function public.enforce_rc2_payment_attempt_environment_v1()
  to service_role;
grant execute on function public.enforce_rc2_verified_payment_binding_v1()
  to service_role;
grant execute on function public.reject_rc2_verified_payment_mutation_v1()
  to service_role;
grant execute on function public.record_rc2_stripe_evidence_v1(
  text, text, text, timestamptz, text, text, text, text, text, text, text,
  integer, text, text, text, uuid, uuid, timestamptz
) to service_role;

commit;
