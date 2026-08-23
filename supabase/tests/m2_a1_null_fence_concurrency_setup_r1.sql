\set ON_ERROR_STOP on
\pset tuples_only on

-- Disposable committed fixtures for two independent pgbench clients. Run
-- only after the rollback-only sequential proof on the local 0002..0017 DB.
begin;

create schema m2_a1_concurrency_proof;
create table m2_a1_concurrency_proof.results (
  kind text not null,
  client_id integer not null,
  disposition text not null,
  sqlstate text,
  message text,
  recorded_at timestamptz not null default pg_catalog.clock_timestamp()
);
create table m2_a1_concurrency_proof.baselines (
  kind text primary key,
  row_json jsonb not null
);

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values (
  '11000000-0000-4000-8000-000000000012', 'm2-a1-concurrent-claim-request',
  'production_fulfillment_runtime', 'synthetic m2-a1 concurrent claim fixture',
  'other', '["reply"]'::jsonb, true, 'processing',
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
);
insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
) values (
  '21000000-0000-4000-8000-000000000012',
  '11000000-0000-4000-8000-000000000012',
  encode(extensions.digest(convert_to('m2-a1-concurrent-idempotency', 'UTF8'), 'sha256'), 'hex'),
  encode(extensions.digest(convert_to('m2-a1-concurrent-snapshot', 'UTF8'), 'sha256'), 'hex'),
  '{"consultationSchemaVersion":"rc1-production-consultation-v1","privacyAcknowledged":true,"schemaVersion":"prepayment-safety-input-v1","adultConfirmed":true,"currentSituation":"synthetic m2-a1 concurrent claim fixture","latestInboundMessage":null,"optionalMessage":null,"relationship":"ambiguous","requestedTopics":["organize_emotions"],"contactBoundaryState":"no_restriction_known","requestedAssistanceGoal":"understand_and_organize","clarificationAnswers":{"submissionCount":0,"clarifiedContactBoundaryState":null,"practicalPermissionExplicit":null,"currentRequestPracticalScopeOnly":null,"replyExplicitlyInvited":null,"replyLimitedToExactSubject":null,"professionalScopeLimitedToNonprofessionalOrganization":null,"unsafeExecutionIntent":null,"currentSafetyStatus":null},"scopeAcknowledgements":{"pauseAssessmentDisclosureAcknowledged":true,"boundarySupportOnlyDisclosureAcknowledged":true,"scopedReplyScopeAcknowledged":true,"businessOnlyScopeAcknowledged":true},"attestationConfirmed":true,"safetyPolicyVersion":"prepayment-safety-policy-v1"}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'purchase_ready',
  encode(extensions.digest(convert_to('m2-a1-concurrent-capability', 'UTF8'), 'sha256'), 'hex'),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
  encode(extensions.digest(convert_to('m2-a1-concurrent-authority', 'UTF8'), 'sha256'), 'hex'),
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
);
insert into public.production_purchases (
  id, preparation_id, purchase_authority_reference_hash, verified_at
) values (
  '31000000-0000-4000-8000-000000000012',
  '21000000-0000-4000-8000-000000000012',
  encode(extensions.digest(convert_to('m2-a1-concurrent-purchase-authority', 'UTF8'), 'sha256'), 'hex'),
  '2026-08-23T00:00:01Z'
);
insert into public.production_assessment_grants (
  id, purchase_id, preparation_id, delivery_authority_reference,
  status, issued_at
) values (
  '41000000-0000-4000-8000-000000000012',
  '31000000-0000-4000-8000-000000000012',
  '21000000-0000-4000-8000-000000000012',
  'm2-a1-concurrent-claim-delivery-authority', 'issued',
  '2026-08-23T00:00:02Z'
);
insert into public.production_logical_assessments (
  id, grant_id, preparation_id, assessment_request_id, status,
  attempt_count, recovery_state, created_at, updated_at
) values (
  '51000000-0000-4000-8000-000000000012',
  '41000000-0000-4000-8000-000000000012',
  '21000000-0000-4000-8000-000000000012',
  '11000000-0000-4000-8000-000000000012',
  'pending', 0, 'not_started',
  '2026-08-23T00:00:02Z', '2026-08-23T00:00:02Z'
);

update public.production_logical_assessments set
  owner_id = 'a1000000-0000-4000-8000-000000000002',
  ownership_acquired_at = '2026-08-23T00:10:00Z',
  generation_started_at = '2026-08-23T00:11:00Z',
  lease_expires_at = '2026-08-23T00:40:00Z',
  updated_at = '2026-08-23T00:11:00Z'
  where id = '51000000-0000-4000-8000-000000000002';
insert into public.assessment_runs (
  id, request_id, status, requested_model, returned_model,
  prompt_bundle_version, schema_set_version, eligibility, decision,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at, completed_at,
  stage_topology_version, run_kind, result_json, policy_result_json
) values (
  '62000000-0000-4000-8000-000000000002',
  '11000000-0000-4000-8000-000000000002', 'completed',
  'gpt-5.6-luna', 'gpt-5.6-luna', 'prompt-bundle-runtime-v17.0.0',
  'pipeline-schema-runtime-v6.0.0', 'ready', 'reply_now', 0, 0, 0, 0, 0,
  '2026-08-23T00:11:00Z', '2026-08-23T00:12:00Z',
  'split-base-candidate-v1', 'fulfillment_resume', '{}'::jsonb, '{}'::jsonb
);
insert into public.assessment_reports (
  id, run_id, report_json, decision_card_json, created_at
) values (
  '72000000-0000-4000-8000-000000000002',
  '62000000-0000-4000-8000-000000000002', '{}'::jsonb, '{}'::jsonb,
  '2026-08-23T00:12:00Z'
);

update public.production_notification_outbox set
  status = 'pending', owner_id = null, processing_started_at = null,
  lease_expires_at = null, attempt_count = 0, provider_message_reference = null,
  last_error_code = null, updated_at = '2026-08-23T00:10:00Z'
  where id = '91000000-0000-4000-8000-000000000006';

update public.production_notification_outbox set
  status = 'processing',
  owner_id = 'bb000000-0000-4000-8000-000000000005',
  processing_started_at = '2026-08-23T00:10:00Z',
  lease_expires_at = '2026-08-23T00:19:00Z',
  attempt_count = 3, provider_message_reference = null,
  last_error_code = 'SYNTHETIC_RETRYABLE', updated_at = '2026-08-23T00:19:00Z'
  where id = '91000000-0000-4000-8000-000000000005';
insert into m2_a1_concurrency_proof.baselines (kind, row_json)
select 'notification_reclaim', to_jsonb(notification)
from public.production_notification_outbox notification
where id = '91000000-0000-4000-8000-000000000005';

create function m2_a1_concurrency_proof.run_claim(
  p_client_id integer,
  p_kind_id integer
)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  owner_id uuid := format(
    'bc000000-0000-4000-8000-%s', lpad((20 + p_client_id)::text, 12, '0')
  )::uuid;
  result jsonb;
  result_kind text;
begin
  if p_kind_id = 1 then
    result_kind := 'logical_claim';
    result := public.claim_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000012', owner_id,
      '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
    );
  elsif p_kind_id = 2 then
    result_kind := 'notification_claim';
    result := public.claim_production_notification_v2(
      '91000000-0000-4000-8000-000000000006', owner_id,
      '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
    );
  elsif p_kind_id = 3 then
    result_kind := 'notification_reclaim';
    result := public.claim_production_notification_v2(
      '91000000-0000-4000-8000-000000000005', owner_id,
      '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
    );
  else
    raise exception 'M2_A1_CONCURRENCY_KIND_INVALID'
      using errcode = 'P0001';
  end if;

  insert into m2_a1_concurrency_proof.results (
    kind, client_id, disposition
  ) values (result_kind, p_client_id, result ->> 'disposition');
end;
$function$;

create function m2_a1_concurrency_proof.run_completion(p_client_id integer)
returns void
language plpgsql
set search_path = ''
as $function$
declare
  suffix text := lpad((20 + p_client_id)::text, 12, '0');
begin
  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000002',
      '51000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000002',
      '62000000-0000-4000-8000-000000000002',
      format('82000000-0000-4000-8000-%s', suffix)::uuid,
      '{"schemaVersion":"m2-a1-concurrent-proof-v1"}'::jsonb, repeat('6', 64),
      format('92000000-0000-4000-8000-%s', suffix)::uuid, repeat('7', 64),
      format('a2000000-0000-4000-8000-%s', suffix)::uuid,
      '2026-08-23T00:20:00Z'
    );
    insert into m2_a1_concurrency_proof.results (
      kind, client_id, disposition
    ) values ('logical_completion', p_client_id, 'completed');
  exception when sqlstate 'P0001' then
    insert into m2_a1_concurrency_proof.results (
      kind, client_id, disposition, sqlstate, message
    ) values (
      'logical_completion', p_client_id, 'conflict', sqlstate, sqlerrm
    );
  end;
end;
$function$;

commit;
select 'READY M2-A1 two-client claim and completion probes';
