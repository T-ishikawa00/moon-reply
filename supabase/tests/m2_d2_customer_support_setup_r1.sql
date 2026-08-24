\set ON_ERROR_STOP on
\pset tuples_only on

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
) values
  (
    'd2100000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'd2-a@example.test',
    '2026-08-24T00:00:00Z',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false
  ),
  (
    'd2100000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'd2-b@example.test',
    '2026-08-24T00:00:00Z',
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb,
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false
  );

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
)
select
  format('d2200000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'm2-d2-request-' || n,
  'production_fulfillment_runtime', 'synthetic d2 support fixture ' || n,
  'other', '["reply"]'::jsonb, true, 'completed',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 8) as n;

insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
)
select
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2200000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('d2-idempotency-' || n) || md5('d2-idempotency-b-' || n),
  md5('d2-snapshot-' || n) || md5('d2-snapshot-b-' || n),
  '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'purchase_ready',
  md5('d2-capability-' || n) || md5('d2-capability-b-' || n),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
  md5('d2-authority-' || n) || md5('d2-authority-b-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 8) as n;

insert into public.production_customer_ownership_bindings (
  id, ownership_reference_id, customer_user_id, preparation_id,
  delivery_email_sha256, delivery_email_ciphertext,
  delivery_email_key_version, delivery_email_verified_source,
  delivery_email_verified_at, state, bound_at, created_at, updated_at
)
select
  format('d2400000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2410000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  case when n = 8
    then 'd2100000-0000-4000-8000-000000000002'::uuid
    else 'd2100000-0000-4000-8000-000000000001'::uuid end,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('d2-email-' || n) || md5('d2-email-b-' || n),
  'synthetic-d2-ciphertext-' || n,
  'v1', 'supabase_email_otp', '2026-08-24T00:00:00Z',
  'active', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 8) as n;

insert into public.production_purchase_intents (
  id, preparation_id, verified_email_authority_id,
  trusted_email_session_id, customer_ownership_binding_id,
  delivery_authority_reference, expected_product_code, expected_amount,
  currency, purchase_kind, provider, environment, state,
  status_capability_hash, final_confirmation_accepted_at,
  created_at, updated_at
)
select
  format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  null, null,
  format('d2400000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'purchase-delivery:' ||
    format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
  'stripe', 'test', 'requires_payment',
  md5('d2-status-' || n) || md5('d2-status-b-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z'
from generate_series(1, 8) as n;

insert into public.production_payment_attempts (
  id, purchase_intent_id, sequence_number, state,
  provider_idempotency_key_hash, provider_checkout_session_id,
  provider_payment_id, provider_checkout_url,
  created_at, updated_at
)
select
  format('d2600000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  1, case when n between 2 and 6 then 'succeeded' else 'pending' end,
  md5('d2-attempt-' || n) || md5('d2-attempt-b-' || n),
  'cs_test_m2_d2_' || n,
  case when n between 2 and 6 then 'pi_m2_d2_' || n else null end,
  'https://checkout.stripe.com/c/pay/m2_d2_' || n,
  '2026-08-24T00:00:01Z', '2026-08-24T00:00:01Z'
from generate_series(1, 8) as n;

update public.production_purchase_intents as intent set
  current_payment_attempt_id = attempt.id,
  state = 'pending',
  updated_at = '2026-08-24T00:00:01Z'
from public.production_payment_attempts as attempt
where attempt.purchase_intent_id = intent.id
  and intent.id::text like 'd2500000-0000-4000-8000-%';

insert into public.production_stripe_event_ledger (
  provider_event_id, evidence_source, event_type, provider_created_at,
  payload_sha256, environment, purchase_reference,
  provider_checkout_session_id, provider_payment_id, mode, payment_status,
  amount_total, currency, disposition, purchase_intent_id,
  received_at, processed_at
)
select
  'evt_m2_d2_' || n, 'webhook', 'checkout.session.completed',
  '2026-08-24T00:00:02Z',
  md5('d2-event-' || n) || md5('d2-event-b-' || n),
  'test', format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'cs_test_m2_d2_' || n, 'pi_m2_d2_' || n, 'payment', 'paid',
  980, 'jpy', 'applied',
  format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  '2026-08-24T00:00:02Z', '2026-08-24T00:00:02Z'
from generate_series(2, 6) as n;

insert into public.production_verified_payments (
  id, purchase_intent_id, payment_attempt_id,
  provider_checkout_session_id, provider_payment_id, provider_event_id,
  product_code, amount, currency, environment, verified_at, created_at
)
select
  format('d2700000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2600000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'cs_test_m2_d2_' || n, 'pi_m2_d2_' || n, 'evt_m2_d2_' || n,
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'test',
  '2026-08-24T00:00:02Z', '2026-08-24T00:00:02Z'
from generate_series(2, 6) as n;

update public.production_purchase_intents set
  state = 'verified',
  successful_payment_id = format(
    'd2700000-0000-4000-8000-%s', right(id::text, 12)
  )::uuid,
  updated_at = '2026-08-24T00:00:02Z'
where id::text between
  'd2500000-0000-4000-8000-000000000002'
  and 'd2500000-0000-4000-8000-000000000006';

insert into public.production_fulfillment_jobs (
  id, purchase_intent_id, verified_payment_id, preparation_id,
  delivery_authority_reference, state, attempt_count,
  requested_at, created_at, updated_at
)
select
  format('d2800000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2700000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'purchase-delivery:' ||
    format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'pending', 0, '2026-08-24T00:00:02Z',
  '2026-08-24T00:00:02Z', '2026-08-24T00:00:02Z'
from generate_series(2, 6) as n;

update public.production_stripe_event_ledger as ledger set
  verified_payment_id = verified.id,
  fulfillment_job_id = job.id
from public.production_verified_payments as verified
join public.production_fulfillment_jobs as job
  on job.verified_payment_id = verified.id
where ledger.purchase_intent_id = verified.purchase_intent_id
  and ledger.provider_event_id like 'evt_m2_d2_%';

update public.production_fulfillment_jobs set
  state = 'processing',
  owner_id = 'd2810000-0000-4000-8000-000000000003',
  lease_expires_at = '2026-08-24T00:10:00Z',
  attempt_count = 1,
  updated_at = '2026-08-24T00:00:03Z'
where id = 'd2800000-0000-4000-8000-000000000003';

update public.production_fulfillment_jobs set
  state = 'manual_review',
  attempt_count = 1,
  last_error_code = 'SYNTHETIC_MANUAL_REVIEW',
  updated_at = '2026-08-24T00:00:03Z'
where id = 'd2800000-0000-4000-8000-000000000004';

insert into public.production_purchases (
  id, preparation_id, purchase_authority_reference_hash, verified_at
)
select
  format('d2900000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('d2-purchase-authority-' || n) || md5('d2-purchase-authority-b-' || n),
  '2026-08-24T00:00:02Z'
from generate_series(5, 6) as n;

insert into public.production_assessment_grants (
  id, purchase_id, preparation_id, delivery_authority_reference,
  status, issued_at, completed_at
)
select
  format('d2a00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2900000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'purchase-delivery:' ||
    format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'completed', '2026-08-24T00:00:03Z', '2026-08-24T00:00:05Z'
from generate_series(5, 6) as n;

insert into public.production_logical_assessments (
  id, grant_id, preparation_id, assessment_request_id,
  status, attempt_count, recovery_state, created_at, completed_at, updated_at
)
select
  format('d2b00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2a00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2300000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2200000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'completed', 1, 'completed', '2026-08-24T00:00:03Z',
  '2026-08-24T00:00:05Z', '2026-08-24T00:00:05Z'
from generate_series(5, 6) as n;

insert into public.assessment_runs (
  id, request_id, status, requested_model, returned_model,
  prompt_bundle_version, schema_set_version, eligibility, decision,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at, completed_at,
  stage_topology_version, run_kind, result_json, policy_result_json
)
select
  format('d2c00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2200000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'completed', 'gpt-5.6-luna', 'gpt-5.6-luna',
  'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
  'ready', 'reply_now', 1, 0, 1, 0, 0,
  '2026-08-24T00:00:04Z', '2026-08-24T00:00:05Z',
  'split-base-candidate-v1', 'fulfillment_resume', '{}'::jsonb, '{}'::jsonb
from generate_series(5, 6) as n;

insert into public.production_customer_deliveries (
  id, logical_assessment_id, runtime_run_id, experience_projection_json,
  projection_sha256, delivery_authority_reference, created_at
)
select
  format('d2d00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2b00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('d2c00000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  '{"schemaVersion":"synthetic-d2-context-v1"}'::jsonb,
  md5('d2-projection-' || n) || md5('d2-projection-b-' || n),
  'purchase-delivery:' ||
    format('d2500000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  '2026-08-24T00:00:05Z'
from generate_series(5, 6) as n;

update public.production_fulfillment_jobs as job set
  state = 'completed',
  attempt_count = 1,
  grant_id = format(
    'd2a00000-0000-4000-8000-%s', right(job.id::text, 12)
  )::uuid,
  logical_assessment_id = format(
    'd2b00000-0000-4000-8000-%s', right(job.id::text, 12)
  )::uuid,
  completed_at = '2026-08-24T00:00:05Z',
  updated_at = '2026-08-24T00:00:05Z'
where job.id::text between
  'd2800000-0000-4000-8000-000000000005'
  and 'd2800000-0000-4000-8000-000000000006';

insert into public.production_notification_outbox (
  id, delivery_id, delivery_authority_reference, status,
  attempt_count, requested_at, sent_at, provider_message_reference,
  last_error_code, updated_at
) values
  (
    'd2e00000-0000-4000-8000-000000000005',
    'd2d00000-0000-4000-8000-000000000005',
    'purchase-delivery:d2500000-0000-4000-8000-000000000005',
    'sent', 1, '2026-08-24T00:00:05Z', '2026-08-24T00:00:06Z',
    'synthetic-d2-message-5', null, '2026-08-24T00:00:06Z'
  ),
  (
    'd2e00000-0000-4000-8000-000000000006',
    'd2d00000-0000-4000-8000-000000000006',
    'purchase-delivery:d2500000-0000-4000-8000-000000000006',
    'failed', 3, '2026-08-24T00:00:05Z', null, null,
    'SYNTHETIC_EMAIL_FAILED', '2026-08-24T00:00:06Z'
  );

select 'PASS M2-D2 synthetic support context setup';
