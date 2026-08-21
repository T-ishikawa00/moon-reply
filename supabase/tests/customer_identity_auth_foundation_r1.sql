\set ON_ERROR_STOP on
\pset tuples_only on

begin;
insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values (
  '00000000-0000-4000-8000-000000000099',
  'customer-auth-rollback-probe',
  'production_fulfillment_runtime', 'synthetic rollback probe', 'other',
  '["reply"]'::jsonb, true, 'processing',
  '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'
);
rollback;

do $proof$
begin
  if exists (
    select 1 from public.assessment_requests
    where id = '00000000-0000-4000-8000-000000000099'
  ) then
    raise exception 'PROOF_TRANSACTION_ROLLBACK_FAILED';
  end if;
end;
$proof$;
select 'PASS transaction rollback';

begin;

insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
    'customer-a@example.test', '2026-08-21T00:00:00Z',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z', false, false),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
    'customer-b@example.test', '2026-08-21T00:00:00Z',
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb,
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z', false, false),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
    'customer-c@example.test', '2026-08-21T00:00:00Z',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z', false, false),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated',
    'customer-d@example.test', '2026-08-21T00:00:00Z',
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb,
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z', false, false);

set local role service_role;

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values
  ('10000000-0000-4000-8000-000000000001', 'customer-auth-proof-a',
    'production_fulfillment_runtime', 'synthetic A', 'other', '["reply"]',
    true, 'completed', '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('10000000-0000-4000-8000-000000000002', 'customer-auth-proof-b',
    'production_fulfillment_runtime', 'synthetic B', 'other', '["reply"]',
    true, 'completed', '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('10000000-0000-4000-8000-000000000003', 'customer-auth-proof-c',
    'production_fulfillment_runtime', 'synthetic C', 'other', '["reply"]',
    true, 'completed', '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('10000000-0000-4000-8000-000000000004', 'customer-auth-proof-d',
    'production_fulfillment_runtime', 'synthetic D', 'other', '["reply"]',
    true, 'completed', '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('10000000-0000-4000-8000-000000000005', 'customer-auth-proof-e',
    'production_fulfillment_runtime', 'synthetic E', 'other', '["reply"]',
    true, 'completed', '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z');

insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
) values
  ('20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001', repeat('1', 64), repeat('2', 64),
    '{}'::jsonb, '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
    'purchase_ready', repeat('3', 64),
    '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
    repeat('4', 64), '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002', repeat('5', 64), repeat('6', 64),
    '{}'::jsonb, '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
    'purchase_ready', repeat('7', 64),
    '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
    repeat('8', 64), '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000003', repeat('9', 64), repeat('a', 64),
    '{}'::jsonb, '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
    'purchase_ready', repeat('b', 64),
    '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
    repeat('c', 64), '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000004', repeat('d', 64), repeat('e', 64),
    '{}'::jsonb, '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
    'purchase_ready', repeat('f', 64),
    '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
    repeat('0', 64), '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000005', repeat('ab', 32), repeat('bc', 32),
    '{}'::jsonb, '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
    'purchase_ready', repeat('cd', 32),
    '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
    repeat('de', 32), '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z');

select public.create_customer_auth_continuation_v1(
  '30000000-0000-4000-8000-000000000001', repeat('3', 64),
  repeat('a1', 32), repeat('b1', 32), 'email_otp',
  '2026-08-21T00:01:00Z', '2026-08-21T00:00:00Z'
);

do $proof$
begin
  if public.validate_customer_auth_continuation_v1(
    repeat('a1', 32), repeat('b1', 32), 'email_otp',
    '2026-08-21T00:01:00Z'
  ) is not null then
    raise exception 'PROOF_CONTINUATION_EXPIRY_FAILED';
  end if;
  if not exists (
    select 1 from public.production_customer_auth_continuations
    where id = '30000000-0000-4000-8000-000000000001' and state = 'expired'
  ) then
    raise exception 'PROOF_CONTINUATION_EXPIRY_STATE_FAILED';
  end if;
end;
$proof$;

select public.create_customer_auth_continuation_v1(
  '30000000-0000-4000-8000-000000000002', repeat('7', 64),
  repeat('c1', 32), repeat('d1', 32), 'email_otp',
  '2026-08-21T00:10:00Z', '2026-08-21T00:00:00Z'
);

do $proof$
begin
  if public.validate_customer_auth_continuation_v1(
    repeat('c1', 32), repeat('ff', 32), 'email_otp',
    '2026-08-21T00:00:30Z'
  ) is not null then
    raise exception 'PROOF_CSRF_REJECTION_FAILED';
  end if;
  if not exists (
    select 1 from public.production_customer_auth_continuations
    where id = '30000000-0000-4000-8000-000000000002' and state = 'pending'
  ) then
    raise exception 'PROOF_CSRF_MUTATED_CONTINUATION';
  end if;
end;
$proof$;

do $proof$
begin
  begin
    perform public.bind_production_preparation_to_customer_v1(
      '40000000-0000-4000-8000-000000000099',
      '41000000-0000-4000-8000-000000000099',
      repeat('c1', 32), repeat('d1', 32),
      '11111111-1111-4111-8111-111111111111',
      repeat('ea', 32), 'short', 'v1', 'supabase_email_otp',
      '2026-08-21T00:00:00Z', '2026-08-21T00:00:30Z'
    );
    raise exception 'PROOF_INVALID_BIND_UNEXPECTED_SUCCESS';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'CUSTOMER_AUTH_BINDING_INVALID' then raise; end if;
  end;
  if exists (
    select 1 from public.production_customer_ownership_bindings
    where preparation_id = '20000000-0000-4000-8000-000000000002'
  ) or not exists (
    select 1 from public.production_customer_auth_continuations
    where id = '30000000-0000-4000-8000-000000000002' and state = 'pending'
  ) then
    raise exception 'PROOF_FAILED_BIND_ROLLBACK_FAILED';
  end if;
end;
$proof$;

select public.bind_production_preparation_to_customer_v1(
  '40000000-0000-4000-8000-000000000002',
  '41000000-0000-4000-8000-000000000002',
  repeat('c1', 32), repeat('d1', 32),
  '11111111-1111-4111-8111-111111111111',
  repeat('ea', 32), 'local-ciphertext-customer-a', 'v1',
  'supabase_email_otp', '2026-08-21T00:00:00Z', '2026-08-21T00:00:30Z'
);

do $proof$
declare
  replay jsonb;
begin
  replay := public.bind_production_preparation_to_customer_v1(
    '40000000-0000-4000-8000-000000000098',
    '41000000-0000-4000-8000-000000000098',
    repeat('c1', 32), repeat('d1', 32),
    '11111111-1111-4111-8111-111111111111',
    repeat('ea', 32), 'local-ciphertext-customer-a', 'v1',
    'supabase_email_otp', '2026-08-21T00:00:00Z', '2026-08-21T00:00:31Z'
  );
  if replay ->> 'disposition' <> 'existing' then
    raise exception 'PROOF_SAME_CUSTOMER_REPLAY_FAILED';
  end if;
  if public.validate_customer_auth_continuation_v1(
    repeat('c1', 32), repeat('d1', 32), 'email_otp',
    '2026-08-21T00:00:31Z'
  ) is not null then
    raise exception 'PROOF_CONTINUATION_REPLAY_FAILED';
  end if;
  begin
    perform public.bind_production_preparation_to_customer_v1(
      '40000000-0000-4000-8000-000000000097',
      '41000000-0000-4000-8000-000000000097',
      repeat('c1', 32), repeat('d1', 32),
      '22222222-2222-4222-8222-222222222222',
      repeat('eb', 32), 'local-ciphertext-customer-b', 'v1',
      'google_verified_identity', '2026-08-21T00:00:00Z',
      '2026-08-21T00:00:32Z'
    );
    raise exception 'PROOF_DIFFERENT_CUSTOMER_UNEXPECTED_SUCCESS';
  exception
    when sqlstate 'P0001' then
      if sqlerrm <> 'CUSTOMER_AUTH_BINDING_CONFLICT' then raise; end if;
  end;
end;
$proof$;

select public.begin_customer_purchase_intent_v1(
  '50000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111', repeat('7', 64), repeat('12', 32),
  'purchase-delivery:50000000-0000-4000-8000-000000000002',
  'moon_reply_love_message_assessment_note_v1', 980, 'JPY', 'one_time',
  'test', '2026-08-21T00:01:00Z'
);
select public.reserve_rc2_payment_attempt_v1(
  '50000000-0000-4000-8000-000000000002',
  '60000000-0000-4000-8000-000000000002', repeat('13', 32),
  '2026-08-21T00:01:01Z'
);
select public.attach_rc2_checkout_session_v1(
  '60000000-0000-4000-8000-000000000002', 'cs_test_local_auth_001',
  'https://checkout.stripe.com/c/pay/local_auth_001',
  '2026-08-21T00:01:02Z'
);
select public.record_rc2_stripe_evidence_v2(
  'evt_local_auth_001', 'webhook', 'checkout.session.completed',
  '2026-08-21T00:01:03Z', repeat('14', 32), 'test',
  '50000000-0000-4000-8000-000000000002', 'cs_test_local_auth_001',
  'pi_local_auth_001', 'payment', 'paid', 980, 'jpy', 'verified', null,
  '70000000-0000-4000-8000-000000000002',
  '80000000-0000-4000-8000-000000000002', '2026-08-21T00:01:04Z'
);
select public.claim_rc2_fulfillment_job_v1(
  repeat('12', 32), '99000000-0000-4000-8000-000000000002',
  '2026-08-21T00:06:00Z', '2026-08-21T00:01:05Z'
);
select public.issue_rc2_production_assessment_grant_v2(
  '90000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000002',
  '70000000-0000-4000-8000-000000000002',
  '20000000-0000-4000-8000-000000000002',
  encode(extensions.digest(
    convert_to(
      'verified-payment:70000000-0000-4000-8000-000000000002', 'UTF8'
    ), 'sha256'
  ), 'hex'),
  'purchase-delivery:50000000-0000-4000-8000-000000000002',
  '2026-08-21T00:01:06Z'
);

insert into public.assessment_runs (
  id, request_id, status, requested_model, returned_model,
  prompt_bundle_version, schema_set_version, eligibility, decision,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at, completed_at,
  stage_topology_version, run_kind, result_json, policy_result_json
) values (
  'c0000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002', 'completed',
  'gpt-5.6-luna', 'gpt-5.6-luna', 'prompt-bundle-runtime-v17.0.0',
  'pipeline-schema-runtime-v6.0.0', 'ready', 'reply_now',
  1, 0, 1, 0, 0, '2026-08-21T00:01:06Z', '2026-08-21T00:01:07Z',
  'split-base-candidate-v1', 'fulfillment_resume', '{}'::jsonb, '{}'::jsonb
);
update public.production_logical_assessments set
  status = 'completed', recovery_state = 'completed',
  completed_at = '2026-08-21T00:01:07Z', updated_at = '2026-08-21T00:01:07Z'
where id = 'b0000000-0000-4000-8000-000000000002';
insert into public.production_customer_deliveries (
  id, logical_assessment_id, runtime_run_id, experience_projection_json,
  projection_sha256, delivery_authority_reference, created_at
) values (
  'd0000000-0000-4000-8000-000000000002',
  'b0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000002',
  '{"schemaVersion":"local-customer-auth-proof-v1"}'::jsonb, repeat('15', 32),
  'purchase-delivery:50000000-0000-4000-8000-000000000002',
  '2026-08-21T00:01:07Z'
);

do $proof$
begin
  if public.resolve_customer_purchase_status_v1(
    '22222222-2222-4222-8222-222222222222', repeat('12', 32)
  ) is not null then
    raise exception 'PROOF_CROSS_CUSTOMER_STATUS_FAILED';
  end if;
  if pg_catalog.jsonb_array_length(public.resolve_customer_account_history_v1(
    '11111111-1111-4111-8111-111111111111'
  )) <> 1 or pg_catalog.jsonb_array_length(public.resolve_customer_account_history_v1(
    '22222222-2222-4222-8222-222222222222'
  )) <> 0 then
    raise exception 'PROOF_CROSS_CUSTOMER_HISTORY_FAILED';
  end if;
  if public.resolve_customer_account_result_v1(
    '11111111-1111-4111-8111-111111111111',
    'd0000000-0000-4000-8000-000000000002'
  ) is null or public.resolve_customer_account_result_v1(
    '22222222-2222-4222-8222-222222222222',
    'd0000000-0000-4000-8000-000000000002'
  ) is not null then
    raise exception 'PROOF_CROSS_CUSTOMER_RESULT_FAILED';
  end if;
end;
$proof$;

insert into public.production_verified_email_authorities (
  id, delivery_authority_reference, email_sha256, email_ciphertext,
  verified_at, created_at, updated_at
) values (
  'e0000000-0000-4000-8000-000000000004',
  'legacy-delivery-authority-0004', repeat('16', 32),
  'legacy-local-ciphertext', '2026-08-21T00:00:00Z',
  '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'
);
insert into public.production_trusted_email_sessions (
  id, verified_email_authority_id, session_token_hash,
  issued_at, expires_at, created_at, updated_at
) values (
  'e1000000-0000-4000-8000-000000000004',
  'e0000000-0000-4000-8000-000000000004', repeat('17', 32),
  '2026-08-21T00:00:00Z', '2026-08-21T01:00:00Z',
  '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'
);
insert into public.production_preparation_email_bindings (
  preparation_id, intended_email_sha256, verified_email_authority_id,
  trusted_email_session_id, state, created_at, updated_at
) values
  ('20000000-0000-4000-8000-000000000003', repeat('16', 32),
    'e0000000-0000-4000-8000-000000000004',
    'e1000000-0000-4000-8000-000000000004', 'verified',
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000004', repeat('16', 32),
    'e0000000-0000-4000-8000-000000000004',
    'e1000000-0000-4000-8000-000000000004', 'verified',
    '2026-08-21T00:00:00Z', '2026-08-21T00:00:00Z');

select public.create_customer_auth_continuation_v1(
  '30000000-0000-4000-8000-000000000003', repeat('b', 64),
  repeat('18', 32), repeat('19', 32), 'google',
  '2026-08-21T00:10:00Z', '2026-08-21T00:00:00Z'
);
select public.bind_production_preparation_to_customer_v1(
  '40000000-0000-4000-8000-000000000003',
  '41000000-0000-4000-8000-000000000003', repeat('18', 32), repeat('19', 32),
  '22222222-2222-4222-8222-222222222222', repeat('1a', 32),
  'local-ciphertext-customer-b', 'v1', 'google_verified_identity',
  '2026-08-21T00:00:00Z', '2026-08-21T00:00:10Z'
);

do $proof$
begin
  begin
    insert into public.production_purchase_intents (
      id, preparation_id, verified_email_authority_id,
      trusted_email_session_id, customer_ownership_binding_id,
      delivery_authority_reference, expected_product_code, expected_amount,
      currency, purchase_kind, provider, environment, state,
      status_capability_hash, final_confirmation_accepted_at, created_at, updated_at
    ) values (
      '50000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000003',
      'e0000000-0000-4000-8000-000000000004',
      'e1000000-0000-4000-8000-000000000004',
      '40000000-0000-4000-8000-000000000003',
      'purchase-delivery:50000000-0000-4000-8000-000000000003',
      'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
      'stripe', 'test', 'requires_payment', repeat('1b', 32),
      '2026-08-21T00:01:00Z', '2026-08-21T00:01:00Z',
      '2026-08-21T00:01:00Z'
    );
    raise exception 'PROOF_MIXED_LANE_UNEXPECTED_SUCCESS';
  exception
    when check_violation then null;
  end;
  if exists (
    select 1 from public.production_purchase_intents
    where id = '50000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'PROOF_MIXED_LANE_ROLLBACK_FAILED';
  end if;
end;
$proof$;

select public.begin_rc2_purchase_intent_v1(
  '50000000-0000-4000-8000-000000000004', repeat('f', 64), repeat('17', 32),
  repeat('1c', 32), 'purchase-delivery:50000000-0000-4000-8000-000000000004',
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
  'test', '2026-08-21T00:01:00Z'
);

do $proof$
begin
  if not exists (
    select 1 from public.production_purchase_intents
    where id = '50000000-0000-4000-8000-000000000002'
      and customer_ownership_binding_id is not null
      and verified_email_authority_id is null
      and trusted_email_session_id is null
  ) then
    raise exception 'PROOF_AUTH_PURCHASE_LANE_FAILED';
  end if;
  if not exists (
    select 1 from public.production_purchase_intents
    where id = '50000000-0000-4000-8000-000000000004'
      and customer_ownership_binding_id is null
      and verified_email_authority_id is not null
      and trusted_email_session_id is not null
  ) then
    raise exception 'PROOF_LEGACY_PURCHASE_LANE_FAILED';
  end if;
  if (select count(*) from public.production_verified_payments
      where purchase_intent_id = '50000000-0000-4000-8000-000000000002') <> 1
     or (select count(*) from public.production_assessment_grants
      where preparation_id = '20000000-0000-4000-8000-000000000002') <> 1 then
    raise exception 'PROOF_ONE_PAYMENT_ONE_GRANT_FAILED';
  end if;
end;
$proof$;

select public.create_customer_auth_continuation_v1(
  '30000000-0000-4000-8000-000000000005', repeat('cd', 32),
  repeat('1e', 32), repeat('2e', 32), 'google',
  '2026-08-21T00:10:00Z', '2026-08-21T00:00:00Z'
);

reset role;

do $proof$
begin
  begin
    delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
    raise exception 'PROOF_AUTH_USER_DELETE_UNEXPECTED_SUCCESS';
  exception
    when foreign_key_violation then null;
  end;
end;
$proof$;

set local role service_role;
select public.detach_production_customer_identity_v1(
  '11111111-1111-4111-8111-111111111111',
  'f0000000-0000-4000-8000-000000000002', '2026-08-21T00:02:00Z'
);
do $proof$
begin
  if pg_catalog.jsonb_array_length(public.resolve_customer_account_history_v1(
    '11111111-1111-4111-8111-111111111111'
  )) <> 0 or public.resolve_customer_account_result_v1(
    '11111111-1111-4111-8111-111111111111',
    'd0000000-0000-4000-8000-000000000002'
  ) is not null then
    raise exception 'PROOF_DETACHED_CUSTOMER_ACCESS_FAILED';
  end if;
end;
$proof$;
reset role;

delete from auth.users where id = '11111111-1111-4111-8111-111111111111';
do $proof$
begin
  if exists (
    select 1 from auth.users where id = '11111111-1111-4111-8111-111111111111'
  ) or not exists (
    select 1 from public.production_customer_ownership_bindings
    where id = '40000000-0000-4000-8000-000000000002'
      and state = 'identity_detached' and customer_user_id is null
  ) then
    raise exception 'PROOF_AUTH_USER_DELETE_AFTER_DETACH_FAILED';
  end if;
end;
$proof$;

commit;

do $proof$
declare
  invalid_count integer;
begin
  select count(*) into invalid_count
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname in (
      'production_customer_auth_continuations',
      'production_customer_ownership_bindings'
    ) and not relation.relrowsecurity;
  if invalid_count <> 0 then raise exception 'PROOF_RLS_FAILED'; end if;

  select count(*) into invalid_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'production_customer_auth_continuations',
      'production_customer_ownership_bindings'
    ) and grantee in ('PUBLIC', 'anon', 'authenticated');
  if invalid_count <> 0 then raise exception 'PROOF_PUBLIC_TABLE_ACL_FAILED'; end if;

  select count(*) into invalid_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'production_customer_auth_continuations',
      'production_customer_ownership_bindings'
    ) and grantee = 'service_role'
    and privilege_type not in ('SELECT', 'INSERT', 'UPDATE');
  if invalid_count <> 0 then raise exception 'PROOF_SERVICE_TABLE_ACL_FAILED'; end if;

  if pg_catalog.has_function_privilege(
    'anon',
    'public.create_customer_auth_continuation_v1(uuid,text,text,text,text,timestamptz,timestamptz)',
    'EXECUTE'
  ) or not pg_catalog.has_function_privilege(
    'service_role',
    'public.create_customer_auth_continuation_v1(uuid,text,text,text,text,timestamptz,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'PROOF_FUNCTION_ACL_FAILED';
  end if;
end;
$proof$;

begin;
set local role anon;
do $proof$
begin
  begin
    perform 1 from public.production_customer_ownership_bindings limit 1;
    raise exception 'PROOF_ANON_SELECT_UNEXPECTED_SUCCESS';
  exception
    when insufficient_privilege then null;
  end;
end;
$proof$;
rollback;

begin;
set local role authenticated;
do $proof$
begin
  begin
    update public.production_customer_auth_continuations
      set updated_at = updated_at where false;
    raise exception 'PROOF_AUTHENTICATED_UPDATE_UNEXPECTED_SUCCESS';
  exception
    when insufficient_privilege then null;
  end;
end;
$proof$;
rollback;

select 'PASS continuation expiry/replay/CSRF';
select 'PASS canonical binding and failed-bind rollback';
select 'PASS authenticated Payment-to-Grant chain';
select 'PASS mixed-lane rejection and legacy lane';
select 'PASS cross-Customer history/result/status isolation';
select 'PASS detach and Auth-user RESTRICT lifecycle';
select 'PASS exact ACL/RLS and direct-role denial';
select 'READY concurrent binding probe';
