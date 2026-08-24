\set ON_ERROR_STOP on

-- Disposable committed fixture for two concurrent local clients.
insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
) values (
  '35000000-0000-4000-8000-000000000005',
  'authenticated', 'authenticated', 'ingress-race@example.test',
  '2026-08-24T00:00:00Z',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false
);
insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values (
  '15000000-0000-4000-8000-000000000005', 'm2-b2-i1-race',
  'production_fulfillment_runtime', 'synthetic ingress race', 'other',
  '["reply"]', true, 'completed',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);
insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
) values (
  '25000000-0000-4000-8000-000000000005',
  '15000000-0000-4000-8000-000000000005', repeat('1a',32), repeat('2a',32),
  '{}', '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}',
  'purchase_ready', repeat('3a',32),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}',
  repeat('4a',32), '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);
insert into public.production_customer_ownership_bindings (
  id, ownership_reference_id, customer_user_id, preparation_id,
  delivery_email_sha256, delivery_email_ciphertext,
  delivery_email_key_version, delivery_email_verified_source,
  delivery_email_verified_at, state, bound_at, created_at, updated_at
) values (
  '45000000-0000-4000-8000-000000000005',
  '45100000-0000-4000-8000-000000000005',
  '35000000-0000-4000-8000-000000000005',
  '25000000-0000-4000-8000-000000000005', repeat('5a',32),
  'synthetic-ciphertext-race', 'v1', 'supabase_email_otp',
  '2026-08-24T00:00:00Z', 'active', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);
insert into public.production_purchase_intents (
  id, preparation_id, verified_email_authority_id,
  trusted_email_session_id, customer_ownership_binding_id,
  delivery_authority_reference, expected_product_code, expected_amount,
  currency, purchase_kind, provider, environment, state,
  status_capability_hash, final_confirmation_accepted_at,
  created_at, updated_at
) values (
  '55000000-0000-4000-8000-000000000005',
  '25000000-0000-4000-8000-000000000005', null, null,
  '45000000-0000-4000-8000-000000000005',
  'purchase-delivery:55000000-0000-4000-8000-000000000005',
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
  'stripe', 'test', 'requires_payment', repeat('6a',32),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z'
);
insert into public.production_payment_attempts (
  id, purchase_intent_id, sequence_number, state,
  provider_idempotency_key_hash, provider_checkout_session_id,
  provider_checkout_url, created_at, updated_at
) values (
  '65000000-0000-4000-8000-000000000005',
  '55000000-0000-4000-8000-000000000005', 1, 'pending', repeat('7a',32),
  'cs_test_m2_b2_i1_race',
  'https://checkout.stripe.com/c/pay/m2_b2_i1_race',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);
update public.production_purchase_intents set
  current_payment_attempt_id = '65000000-0000-4000-8000-000000000005',
  state = 'pending', updated_at = '2026-08-24T00:00:01Z'
where id = '55000000-0000-4000-8000-000000000005';

-- Local-only membership allows the credentialless migration owner to SET ROLE
-- in each concurrent client. It exists only in this disposable database.
grant m2_b2_stripe_ingress to postgres;

select 'READY M2-B2-I1 concurrent duplicate';
