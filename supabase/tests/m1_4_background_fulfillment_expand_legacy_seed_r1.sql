\set ON_ERROR_STOP on
\pset tuples_only on

-- Local disposable proof seed. Run after 0002-0015 and before 0016.
-- All values are synthetic; no Provider, Stripe, email, or remote operation occurs.
begin;

create schema m1_4_expand_proof;
create table m1_4_expand_proof.legacy_function_defs (
  identity text primary key,
  definition text not null
);
insert into m1_4_expand_proof.legacy_function_defs (identity, definition)
select identity, pg_catalog.pg_get_functiondef(identity::regprocedure)
from unnest(array[
  'public.claim_production_fulfillment_v1(uuid,uuid,timestamptz)',
  'public.mark_production_generation_started_v1(uuid,uuid,timestamptz)',
  'public.complete_production_fulfillment_v1(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)',
  'public.fail_production_fulfillment_v1(uuid,uuid,text,timestamptz)',
  'public.claim_rc2_fulfillment_job_v1(text,uuid,timestamptz,timestamptz)',
  'public.claim_rc2_fulfillment_job_by_id_v1(uuid,uuid,timestamptz,timestamptz)',
  'public.complete_rc2_fulfillment_job_v1(uuid,uuid,timestamptz)',
  'public.fail_rc2_fulfillment_job_v1(uuid,uuid,text,timestamptz)',
  'public.claim_production_notification_v1(uuid,uuid,timestamptz)',
  'public.complete_production_notification_v1(uuid,uuid,text,timestamptz)',
  'public.fail_production_notification_v1(uuid,uuid,text,timestamptz)'
]) as identity;

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
)
select
  ('11000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  format('m1-4-expand-request-%s', n),
  'production_fulfillment_runtime', format('synthetic expand fixture %s', n),
  'other', '["reply"]'::jsonb, true, 'processing',
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
from generate_series(1, 11) as n;

insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
)
select
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('11000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  encode(extensions.digest(convert_to(format('expand-idempotency-%s', n), 'UTF8'), 'sha256'), 'hex'),
  encode(extensions.digest(convert_to(format('expand-snapshot-%s', n), 'UTF8'), 'sha256'), 'hex'),
  jsonb_build_object(
    'consultationSchemaVersion', 'rc1-production-consultation-v1',
    'privacyAcknowledged', true,
    'schemaVersion', 'prepayment-safety-input-v1',
    'adultConfirmed', true,
    'currentSituation', format('synthetic expand fixture %s', n),
    'latestInboundMessage', null,
    'optionalMessage', null,
    'relationship', 'ambiguous',
    'requestedTopics', jsonb_build_array('organize_emotions'),
    'contactBoundaryState', 'no_restriction_known',
    'requestedAssistanceGoal', 'understand_and_organize',
    'clarificationAnswers', jsonb_build_object(
      'submissionCount', 0,
      'clarifiedContactBoundaryState', null,
      'practicalPermissionExplicit', null,
      'currentRequestPracticalScopeOnly', null,
      'replyExplicitlyInvited', null,
      'replyLimitedToExactSubject', null,
      'professionalScopeLimitedToNonprofessionalOrganization', null,
      'unsafeExecutionIntent', null,
      'currentSafetyStatus', null
    ),
    'scopeAcknowledgements', jsonb_build_object(
      'pauseAssessmentDisclosureAcknowledged', true,
      'boundarySupportOnlyDisclosureAcknowledged', true,
      'scopedReplyScopeAcknowledged', true,
      'businessOnlyScopeAcknowledged', true
    ),
    'attestationConfirmed', true,
    'safetyPolicyVersion', 'prepayment-safety-policy-v1'
  ),
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'purchase_ready',
  encode(extensions.digest(convert_to(format('expand-purchase-capability-%s', n), 'UTF8'), 'sha256'), 'hex'),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
  encode(extensions.digest(convert_to(format('expand-authority-%s', n), 'UTF8'), 'sha256'), 'hex'),
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
from generate_series(1, 11) as n;

-- Six RC-1 chains exist before 0016. Rows 1-4 are legacy generating owners;
-- rows 5-6 supply legacy processing notifications.
insert into public.production_purchases (
  id, preparation_id, purchase_authority_reference_hash, verified_at
)
select
  ('31000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  encode(extensions.digest(convert_to(format('expand-purchase-authority-%s', n), 'UTF8'), 'sha256'), 'hex'),
  '2026-08-23T00:00:01Z'
from unnest(array[1, 2, 3, 4, 5, 6, 11]) as n;

insert into public.production_assessment_grants (
  id, purchase_id, preparation_id, delivery_authority_reference,
  status, issued_at, completed_at
)
select
  ('41000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('31000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  format('expand-delivery-authority-%s', n),
  case when n in (5, 6) then 'completed' else 'issued' end,
  '2026-08-23T00:00:02Z',
  case when n in (5, 6) then '2026-08-23T00:00:06Z'::timestamptz else null end
from unnest(array[1, 2, 3, 4, 5, 6, 11]) as n;

insert into public.production_logical_assessments (
  id, grant_id, preparation_id, assessment_request_id, status,
  owner_id, ownership_acquired_at, generation_started_at,
  attempt_count, last_error_code, recovery_state,
  created_at, completed_at, updated_at
)
select
  ('51000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('41000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('11000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  case when n in (5, 6) then 'completed'
       when n = 11 then 'pending'
       else 'generating' end,
  case when n <= 4 then ('a1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid else null end,
  case when n <= 4 then '2026-08-23T00:00:03Z'::timestamptz else null end,
  case when n = 4 then '2026-08-23T00:00:04Z'::timestamptz else null end,
  case when n = 11 then 0 else 1 end,
  null,
  case when n = 4 then 'post_provider_retryable_same_assessment'
       when n <= 3 then 'pre_provider_retryable'
       when n = 11 then 'not_started'
       else 'completed' end,
  '2026-08-23T00:00:02Z',
  case when n in (5, 6) then '2026-08-23T00:00:06Z'::timestamptz else null end,
  '2026-08-23T00:00:06Z'
from unnest(array[1, 2, 3, 4, 5, 6, 11]) as n;

insert into public.assessment_runs (
  id, request_id, status, requested_model, returned_model,
  prompt_bundle_version, schema_set_version, eligibility, decision,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at, completed_at,
  stage_topology_version, run_kind, result_json, policy_result_json
)
select
  ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('11000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  case when n in (1, 5, 6) then 'completed' else 'processing' end,
  'gpt-5.6-luna',
  case when n in (1, 5, 6) then 'gpt-5.6-luna' else null end,
  'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
  case when n in (1, 5, 6) then 'ready' else null end,
  case when n in (1, 5, 6) then 'reply_now' else null end,
  0, 0, 0, 0, 0,
  '2026-08-23T00:00:04Z',
  case when n in (1, 5, 6) then '2026-08-23T00:00:05Z'::timestamptz else null end,
  'split-base-candidate-v1', 'fulfillment_resume',
  case when n in (1, 5, 6) then '{}'::jsonb else null end,
  case when n in (1, 5, 6) then '{}'::jsonb else null end
from unnest(array[1, 3, 4, 5, 6]) as n;

insert into public.assessment_reports (
  id, run_id, report_json, decision_card_json, created_at
)
select
  ('71000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  '{}'::jsonb, '{}'::jsonb, '2026-08-23T00:00:05Z'
from unnest(array[1, 5, 6]) as n;

insert into public.production_customer_deliveries (
  id, logical_assessment_id, runtime_run_id, experience_projection_json,
  projection_sha256, delivery_authority_reference, created_at
)
select
  ('81000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('51000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('61000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  jsonb_build_object('schemaVersion', 'synthetic-expand-proof-v1'),
  encode(extensions.digest(convert_to(format('expand-projection-%s', n), 'UTF8'), 'sha256'), 'hex'),
  format('expand-delivery-authority-%s', n), '2026-08-23T00:00:06Z'
from unnest(array[5, 6]) as n;

insert into public.production_notification_outbox (
  id, delivery_id, delivery_authority_reference, status, attempt_count,
  owner_id, requested_at, processing_started_at, updated_at
)
select
  ('91000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  ('81000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  format('expand-delivery-authority-%s', n), 'processing', 1,
  ('a1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  '2026-08-23T00:00:06Z', '2026-08-23T00:00:07Z', '2026-08-23T00:00:07Z'
from unnest(array[5, 6]) as n;

-- Shared synthetic verified-email authority for four payment/job fixtures.
insert into public.production_verified_email_authorities (
  id, delivery_authority_reference, email_sha256, email_ciphertext,
  verified_at, created_at, updated_at
) values (
  'aa000000-0000-4000-8000-000000000001',
  'expand-email-authority-0001', repeat('a1', 32), 'synthetic-ciphertext',
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
);
insert into public.production_trusted_email_sessions (
  id, verified_email_authority_id, session_token_hash, issued_at, expires_at,
  created_at, updated_at
) values (
  'ab000000-0000-4000-8000-000000000001',
  'aa000000-0000-4000-8000-000000000001', repeat('a2', 32),
  '2026-08-23T00:00:00Z', '2026-08-24T00:00:00Z',
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
);
insert into public.production_preparation_email_bindings (
  preparation_id, intended_email_sha256, verified_email_authority_id,
  trusted_email_session_id, state, created_at, updated_at
)
select
  ('21000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, repeat('a1', 32),
  'aa000000-0000-4000-8000-000000000001',
  'ab000000-0000-4000-8000-000000000001', 'verified',
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
from generate_series(7, 10) as n;

do $seed$
declare
  n integer;
  intent_id uuid;
  attempt_id uuid;
  payment_id uuid;
  job_id uuid;
  status_hash text;
begin
  for n in 7..10 loop
    intent_id := ('b1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
    attempt_id := ('c1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
    payment_id := ('d1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
    job_id := ('e1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
    status_hash := encode(extensions.digest(convert_to(format('expand-status-%s', n), 'UTF8'), 'sha256'), 'hex');
    perform public.begin_rc2_purchase_intent_v1(
      intent_id,
      encode(extensions.digest(convert_to(format('expand-purchase-capability-%s', n), 'UTF8'), 'sha256'), 'hex'),
      repeat('a2', 32), status_hash,
      'purchase-delivery:' || intent_id::text,
      'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
      'test', '2026-08-23T00:01:00Z'
    );
    perform public.reserve_rc2_payment_attempt_v1(
      intent_id, attempt_id,
      encode(extensions.digest(convert_to(format('expand-attempt-%s', n), 'UTF8'), 'sha256'), 'hex'),
      '2026-08-23T00:01:01Z'
    );
    perform public.attach_rc2_checkout_session_v1(
      attempt_id, format('cs_test_expand_%s', n),
      format('https://checkout.stripe.com/c/pay/expand_%s', n),
      '2026-08-23T00:01:02Z'
    );
    perform public.record_rc2_stripe_evidence_v2(
      format('evt_expand_%s', n), 'webhook', 'checkout.session.completed',
      '2026-08-23T00:01:03Z',
      encode(extensions.digest(convert_to(format('expand-event-%s', n), 'UTF8'), 'sha256'), 'hex'),
      'test', intent_id::text, format('cs_test_expand_%s', n),
      format('pi_expand_%s', n), 'payment', 'paid', 980, 'jpy',
      'verified', null, payment_id, job_id, '2026-08-23T00:01:04Z'
    );
  end loop;
end;
$seed$;

-- Job 7 is a completed-assessment fixture used by the exact ea4 application.
select public.claim_rc2_fulfillment_job_by_id_v1(
  'e1000000-0000-4000-8000-000000000007',
  'a7000000-0000-4000-8000-000000000007',
  '2026-08-23T00:10:00Z', '2026-08-23T00:01:05Z'
);
select public.issue_rc2_production_assessment_grant_v2(
  '47000000-0000-4000-8000-000000000007',
  '37000000-0000-4000-8000-000000000007',
  '57000000-0000-4000-8000-000000000007',
  'd1000000-0000-4000-8000-000000000007',
  '21000000-0000-4000-8000-000000000007',
  encode(extensions.digest(convert_to('verified-payment:d1000000-0000-4000-8000-000000000007', 'UTF8'), 'sha256'), 'hex'),
  'purchase-delivery:b1000000-0000-4000-8000-000000000007',
  '2026-08-23T00:01:05Z'
);
select public.fail_rc2_fulfillment_job_v1(
  'e1000000-0000-4000-8000-000000000007',
  'a7000000-0000-4000-8000-000000000007',
  'SYNTHETIC_SETUP_COMPLETE', '2026-08-23T00:01:06Z'
);
insert into public.assessment_runs (
  id, request_id, status, requested_model, returned_model,
  prompt_bundle_version, schema_set_version, eligibility, decision,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at, completed_at,
  stage_topology_version, run_kind, result_json, policy_result_json
) values (
  '67000000-0000-4000-8000-000000000007',
  '11000000-0000-4000-8000-000000000007', 'completed',
  'gpt-5.6-luna', 'gpt-5.6-luna', 'prompt-bundle-runtime-v17.0.0',
  'pipeline-schema-runtime-v6.0.0', 'ready', 'reply_now', 0, 0, 0, 0, 0,
  '2026-08-23T00:01:05Z', '2026-08-23T00:01:06Z',
  'split-base-candidate-v1', 'fulfillment_resume', '{}'::jsonb, '{}'::jsonb
);
update public.assessment_requests set status = 'completed', updated_at = '2026-08-23T00:01:06Z'
  where id = '11000000-0000-4000-8000-000000000007';
update public.production_assessment_grants set status = 'completed', completed_at = '2026-08-23T00:01:06Z'
  where id = '47000000-0000-4000-8000-000000000007';
update public.production_logical_assessments set
  status = 'completed', recovery_state = 'completed', completed_at = '2026-08-23T00:01:06Z',
  updated_at = '2026-08-23T00:01:06Z'
  where id = '57000000-0000-4000-8000-000000000007';
insert into public.production_customer_deliveries (
  id, logical_assessment_id, runtime_run_id, experience_projection_json,
  projection_sha256, delivery_authority_reference, created_at
) values (
  '87000000-0000-4000-8000-000000000007',
  '57000000-0000-4000-8000-000000000007',
  '67000000-0000-4000-8000-000000000007',
  '{"schemaVersion":"synthetic-expand-proof-v1"}'::jsonb,
  encode(extensions.digest(convert_to('expand-job-seven-projection', 'UTF8'), 'sha256'), 'hex'),
  'purchase-delivery:b1000000-0000-4000-8000-000000000007',
  '2026-08-23T00:01:06Z'
);
insert into public.production_notification_outbox (
  id, delivery_id, delivery_authority_reference, status, attempt_count,
  requested_at, updated_at
) values (
  '97000000-0000-4000-8000-000000000007',
  '87000000-0000-4000-8000-000000000007',
  'purchase-delivery:b1000000-0000-4000-8000-000000000007',
  'pending', 0, '2026-08-23T00:01:06Z', '2026-08-23T00:01:06Z'
);

-- Job 9 represents an active legacy ea4 worker when 0016 is applied.
update public.production_fulfillment_jobs set
  state = 'processing', owner_id = 'a9000000-0000-4000-8000-000000000009',
  lease_expires_at = '2026-08-23T00:30:00Z', attempt_count = 1,
  updated_at = '2026-08-23T00:01:05Z'
where id = 'e1000000-0000-4000-8000-000000000009';

commit;
select 'PASS legacy rows seeded before 0016';
