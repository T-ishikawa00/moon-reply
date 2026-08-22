\set ON_ERROR_STOP on
\pset tuples_only on

do $proof$
declare
  definition text;
begin
  select pg_catalog.pg_get_constraintdef(pg_constraint.oid)
    into definition
  from pg_catalog.pg_constraint
  where conrelid = 'public.assessment_stage_runs'::regclass
    and conname = 'assessment_stage_runs_skipped_invariants';

  if definition is null
     or position('stage_id' in definition) = 0
     or position('PB-01C' in definition) = 0 then
    raise exception 'PROOF_EXPECTED_STALE_CONSTRAINT_NOT_PRESENT';
  end if;
end;
$proof$;

begin;

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values (
  '15000000-0000-4000-8000-000000000001',
  'm1-4-historical-skip-probe',
  'production_fulfillment_runtime', 'synthetic historical probe', 'other',
  '["reply"]'::jsonb, true, 'processing',
  '2026-08-22T10:00:00Z', '2026-08-22T10:00:00Z'
);

insert into public.assessment_runs (
  id, request_id, status, requested_model,
  prompt_bundle_version, schema_set_version,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at,
  stage_topology_version, run_kind
) values (
  '15000000-0000-4000-8000-000000000002',
  '15000000-0000-4000-8000-000000000001',
  'processing', 'gpt-5.6-luna',
  'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
  0, 0, 0, 0, 0, '2026-08-22T10:00:00Z',
  'split-base-candidate-v1', 'initial'
);

insert into public.assessment_stage_runs (
  id, run_id, stage_id, sequence_number, attempt_number, status,
  request_hash, prompt_hash, schema_hash,
  response_id, requested_model, returned_model,
  input_tokens, cached_tokens, output_tokens, reasoning_tokens,
  latency_ms, output_json, error_code, skip_reason, created_at
) values (
  '15000000-0000-4000-8000-000000000003',
  '15000000-0000-4000-8000-000000000002',
  'PB-01C', 2, 1, 'skipped',
  repeat('1', 64), repeat('2', 64), repeat('3', 64),
  null, 'gpt-5.6-luna', null,
  0, 0, 0, 0, 0, null, null, 'candidate_absent',
  '2026-08-22T10:00:01Z'
);

create table public.m1_4_historical_skip_probe (
  stage_run_id uuid primary key,
  prior_ctid text not null,
  prior_row jsonb not null
);

insert into public.m1_4_historical_skip_probe (
  stage_run_id, prior_ctid, prior_row
)
select id, ctid::text, to_jsonb(assessment_stage_runs)
from public.assessment_stage_runs
where id = '15000000-0000-4000-8000-000000000003';

commit;

select 'READY historical skipped row seeded before 0015';
