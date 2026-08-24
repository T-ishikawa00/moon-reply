\set ON_ERROR_STOP on
\pset tuples_only on

begin;

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
) values (
  '37000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'i2-proof@example.test',
  '2026-08-24T00:00:00Z',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false
);

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
)
select
  format('17000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'm2-b2-i2-request-' || n,
  'production_fulfillment_runtime', 'synthetic scheduler proof ' || n,
  'other', '["reply"]'::jsonb, true, 'completed',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 12) as n;

insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
)
select
  format('27000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('17000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('i2-idempotency-' || n) || md5('i2-idempotency-2-' || n),
  md5('i2-snapshot-' || n) || md5('i2-snapshot-2-' || n),
  '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'purchase_ready', md5('i2-capability-' || n) || md5('i2-capability-2-' || n),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
  md5('i2-authority-' || n) || md5('i2-authority-2-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 12) as n;

insert into public.production_customer_ownership_bindings (
  id, ownership_reference_id, customer_user_id, preparation_id,
  delivery_email_sha256, delivery_email_ciphertext,
  delivery_email_key_version, delivery_email_verified_source,
  delivery_email_verified_at, state, bound_at, created_at, updated_at
)
select
  format('47000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('47100000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  '37000000-0000-4000-8000-000000000001'::uuid,
  format('27000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('i2-email-' || n) || md5('i2-email-2-' || n),
  'synthetic-ciphertext-i2-' || n, 'v1', 'supabase_email_otp',
  '2026-08-24T00:00:00Z', 'active', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 12) as n;

insert into public.production_purchase_intents (
  id, preparation_id, verified_email_authority_id,
  trusted_email_session_id, customer_ownership_binding_id,
  delivery_authority_reference, expected_product_code, expected_amount,
  currency, purchase_kind, provider, environment, state,
  current_payment_attempt_id, successful_payment_id, status_capability_hash,
  final_confirmation_accepted_at, created_at, updated_at
)
select
  format('57000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('27000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  null, null,
  format('47000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'purchase-delivery:' ||
    format('57000000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
  'stripe', 'test', 'requires_payment', null, null,
  md5('i2-status-' || n) || md5('i2-status-2-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z'
from generate_series(1, 12) as n;

insert into public.production_payment_attempts (
  id, purchase_intent_id, sequence_number, state,
  provider_idempotency_key_hash, provider_checkout_session_id,
  provider_checkout_url, created_at, updated_at
)
select
  format('67000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('57000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  1,
  case n
    when 2 then 'processing'
    when 3 then 'unknown'
    when 4 then 'reserved'
    when 5 then 'succeeded'
    when 6 then 'failed'
    when 7 then 'canceled'
    when 12 then 'reserved'
    else 'pending'
  end,
  md5('i2-attempt-' || n) || md5('i2-attempt-2-' || n),
  case when n in (4, 12) then null else 'cs_test_m2_b2_i2_' || n end,
  case when n in (4, 12) then null
    else 'https://checkout.stripe.com/c/pay/m2_b2_i2_' || n end,
  '2026-08-24T00:00:00Z',
  case when n = 8 then '2026-08-24T00:09:30Z'::timestamptz
    else '2026-08-24T00:00:01Z'::timestamptz end
from generate_series(1, 12) as n;

update public.production_purchase_intents as intent set
  current_payment_attempt_id = attempt.id,
  state = 'pending', updated_at = '2026-08-24T00:00:01Z'
from public.production_payment_attempts as attempt
where attempt.purchase_intent_id = intent.id
  and intent.id::text like '57000000-0000-4000-8000-%';

update public.production_payment_attempts set
  reconciliation_retry_after = '2026-08-24T00:15:00Z'
where id = '67000000-0000-4000-8000-000000000009';
update public.production_payment_attempts set
  reconciliation_owner_id = '97000000-0000-4000-8000-000000000010',
  reconciliation_lease_expires_at = '2026-08-24T00:15:00Z'
where id = '67000000-0000-4000-8000-000000000010';
update public.production_payment_attempts set
  reconciliation_stopped_at = '2026-08-24T00:05:00Z',
  reconciliation_last_error_code = 'PAYMENT_RECONCILIATION_STOPPED'
where id = '67000000-0000-4000-8000-000000000011';

create temporary table i2_first_claim as
select * from public.claim_rc2_payment_reconciliation_batch_v1(
  '97000000-0000-4000-8000-000000000001',
  '2026-08-24T00:10:24Z', '2026-08-24T00:10:00Z',
  '2026-08-24T00:08:00Z', 8, 5
);

do $proof$
begin
  if (select count(*) from i2_first_claim) <> 3 then
    raise exception 'I2_DUE_SELECTION_FAILED';
  end if;
  if (select count(*) from i2_first_claim where payment_attempt_id in (
    '67000000-0000-4000-8000-000000000001',
    '67000000-0000-4000-8000-000000000002',
    '67000000-0000-4000-8000-000000000003'
  )) <> 3 then raise exception 'I2_DETERMINISTIC_SELECTION_FAILED'; end if;
  if exists (
    select 1 from public.claim_rc2_payment_reconciliation_batch_v1(
      '97000000-0000-4000-8000-000000000002',
      '2026-08-24T00:10:24Z', '2026-08-24T00:10:00Z',
      '2026-08-24T00:08:00Z', 8, 5
    )
  ) then raise exception 'I2_ACTIVE_LEASE_OVERLAP_FAILED'; end if;
end;
$proof$;

do $proof$
begin
  begin
    perform public.finish_rc2_payment_reconciliation_v1(
      '67000000-0000-4000-8000-000000000001', null,
      'retry', '2026-08-24T00:11:00Z', 'SYNTHETIC_RETRY',
      '2026-08-24T00:10:01Z'
    );
    raise exception 'I2_NULL_OWNER_UNEXPECTED_SUCCESS';
  exception when sqlstate 'P0001' then null; end;
  begin
    perform public.finish_rc2_payment_reconciliation_v1(
      '67000000-0000-4000-8000-000000000001',
      '97000000-0000-4000-8000-000000000099',
      'retry', '2026-08-24T00:11:00Z', 'SYNTHETIC_RETRY',
      '2026-08-24T00:10:01Z'
    );
    raise exception 'I2_OWNER_MISMATCH_UNEXPECTED_SUCCESS';
  exception when sqlstate 'P0001' then null; end;
end;
$proof$;

select public.finish_rc2_payment_reconciliation_v1(
  '67000000-0000-4000-8000-000000000001',
  '97000000-0000-4000-8000-000000000001',
  'retry', '2026-08-24T00:11:00Z', 'SYNTHETIC_RETRY',
  '2026-08-24T00:10:01Z'
);
select public.finish_rc2_payment_reconciliation_v1(
  '67000000-0000-4000-8000-000000000002',
  '97000000-0000-4000-8000-000000000001',
  'stop', null, 'SYNTHETIC_PERMANENT', '2026-08-24T00:10:01Z'
);
update public.production_payment_attempts set state = 'failed'
where id = '67000000-0000-4000-8000-000000000003';
update public.production_purchase_intents set state = 'payment_failed'
where id = '57000000-0000-4000-8000-000000000003';
select public.finish_rc2_payment_reconciliation_v1(
  '67000000-0000-4000-8000-000000000003',
  '97000000-0000-4000-8000-000000000001',
  'settled', null, null, '2026-08-24T00:10:01Z'
);

-- Simulate a webhook committing while reconciliation owns the external-read
-- lease. The webhook authority must converge to one Payment/job; finishing the
-- lease must not create either side effect.
update public.production_payment_attempts set
  state = 'pending',
  provider_checkout_session_id = 'cs_test_m2_b2_i2_12',
  provider_checkout_url = 'https://checkout.stripe.com/c/pay/m2_b2_i2_12',
  updated_at = '2026-08-24T00:00:01Z'
where id = '67000000-0000-4000-8000-000000000012';
create temporary table i2_webhook_race_claim as
select * from public.claim_rc2_payment_reconciliation_batch_v1(
  '97000000-0000-4000-8000-000000000012',
  '2026-08-24T00:10:24Z', '2026-08-24T00:10:00Z',
  '2026-08-24T00:08:00Z', 1, 5
);
grant m2_b2_stripe_ingress to postgres;
set local role m2_b2_stripe_ingress;
select private_payment_ingress.record_stripe_webhook_evidence_v1(
  'evt_m2_b2_i2_race', 'checkout.session.completed',
  '2026-08-24T00:10:02Z', repeat('a1', 32), 'test',
  '57000000-0000-4000-8000-000000000012', 'cs_test_m2_b2_i2_12',
  'pi_m2_b2_i2_12', 'payment', 'paid', 980, 'jpy'
);
reset role;
select public.finish_rc2_payment_reconciliation_v1(
  '67000000-0000-4000-8000-000000000012',
  '97000000-0000-4000-8000-000000000012',
  'settled', null, null, '2026-08-24T00:10:03Z'
);
set local role m2_b2_stripe_ingress;
select private_payment_ingress.record_stripe_webhook_evidence_v1(
  'evt_m2_b2_i2_race', 'checkout.session.completed',
  '2026-08-24T00:10:02Z', repeat('a1', 32), 'test',
  '57000000-0000-4000-8000-000000000012', 'cs_test_m2_b2_i2_12',
  'pi_m2_b2_i2_12', 'payment', 'paid', 980, 'jpy'
);
reset role;

do $proof$
declare
  claim_acl regprocedure :=
    'public.claim_rc2_payment_reconciliation_batch_v1(uuid,timestamp with time zone,timestamp with time zone,timestamp with time zone,integer,integer)'::regprocedure;
  finish_acl regprocedure :=
    'public.finish_rc2_payment_reconciliation_v1(uuid,uuid,text,timestamp with time zone,text,timestamp with time zone)'::regprocedure;
begin
  if (select count(*) from i2_webhook_race_claim) <> 1 then
    raise exception 'I2_WEBHOOK_RACE_CLAIM_FAILED';
  end if;
  if (select count(*) from public.production_verified_payments
      where purchase_intent_id = '57000000-0000-4000-8000-000000000012') <> 1
     or (select count(*) from public.production_fulfillment_jobs
      where purchase_intent_id = '57000000-0000-4000-8000-000000000012') <> 1 then
    raise exception 'I2_WEBHOOK_RACE_CONVERGENCE_FAILED';
  end if;
  if not pg_catalog.has_function_privilege('service_role', claim_acl, 'EXECUTE')
     or not pg_catalog.has_function_privilege('service_role', finish_acl, 'EXECUTE')
     or pg_catalog.has_function_privilege('anon', claim_acl, 'EXECUTE')
     or pg_catalog.has_function_privilege('authenticated', claim_acl, 'EXECUTE')
     or pg_catalog.has_function_privilege('m2_b2_stripe_ingress', claim_acl, 'EXECUTE')
     or pg_catalog.has_function_privilege('m2_b2_stripe_ingress', finish_acl, 'EXECUTE') then
    raise exception 'I2_RPC_ACL_FAILED';
  end if;
  if exists (
    select 1 from pg_catalog.pg_proc
    where oid in (claim_acl::oid, finish_acl::oid)
      and (prosecdef or pg_catalog.array_to_string(proconfig, ',') <>
        'search_path=""')
  ) then raise exception 'I2_RPC_IDENTITY_FAILED'; end if;
end;
$proof$;

rollback;
select 'PASS M2-B2-I2 private reconciliation DB proof';
