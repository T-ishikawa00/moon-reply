\set ON_ERROR_STOP on
\pset tuples_only on

begin;

do $proof$
declare
  definition text;
  is_validated boolean;
begin
  select
    pg_catalog.pg_get_constraintdef(pg_constraint.oid),
    pg_constraint.convalidated
    into definition, is_validated
  from pg_catalog.pg_constraint
  where conrelid = 'public.assessment_stage_runs'::regclass
    and conname = 'assessment_stage_runs_skipped_invariants';

  if definition is null
     or position('stage_id' in definition) <> 0
     or position('sequence_number' in definition) <> 0
     or position('response_id IS NULL' in definition) = 0
     or position('latency_ms = 0' in definition) = 0
     or is_validated is not true then
    raise exception 'PROOF_REPLACEMENT_CONSTRAINT_INVALID';
  end if;

  if not exists (
    select 1
    from public.assessment_stage_runs as stage_run
    join public.m1_4_historical_skip_probe as probe
      on probe.stage_run_id = stage_run.id
    where stage_run.id = '15000000-0000-4000-8000-000000000003'
      and stage_run.ctid::text = probe.prior_ctid
      and to_jsonb(stage_run) = probe.prior_row
  ) then
    raise exception 'PROOF_HISTORICAL_ROW_REWRITTEN_OR_MISSING';
  end if;
end;
$proof$;

select 'PASS F historical skipped row preserved without rewrite';

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
) values (
  '15100000-0000-4000-8000-000000000001',
  'm1-4-skipped-stage-regression',
  'production_fulfillment_runtime', 'synthetic skipped-stage regression',
  'other', '["reply"]'::jsonb, true, 'processing',
  '2026-08-22T11:00:00Z', '2026-08-22T11:00:00Z'
);

insert into public.assessment_runs (
  id, request_id, status, requested_model,
  prompt_bundle_version, schema_set_version,
  total_input_tokens, total_cached_tokens, total_output_tokens,
  total_reasoning_tokens, usage_derived_cost_usd, started_at,
  stage_topology_version, run_kind
) values
  ('15100000-0000-4000-8000-000000000101',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'initial'),
  ('15100000-0000-4000-8000-000000000102',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'clarification_resume'),
  ('15100000-0000-4000-8000-000000000103',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'fulfillment_resume'),
  ('15100000-0000-4000-8000-000000000104',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'fulfillment_resume'),
  ('15100000-0000-4000-8000-000000000105',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'initial'),
  ('15100000-0000-4000-8000-000000000106',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'fulfillment_resume'),
  ('15100000-0000-4000-8000-000000000107',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'fulfillment_resume'),
  ('15100000-0000-4000-8000-000000000108',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'initial'),
  ('15100000-0000-4000-8000-000000000109',
    '15100000-0000-4000-8000-000000000001', 'processing', 'gpt-5.6-luna',
    'prompt-bundle-runtime-v17.0.0', 'pipeline-schema-runtime-v6.0.0',
    0, 0, 0, 0, 0, '2026-08-22T11:00:00Z',
    'split-base-candidate-v1', 'initial');

insert into public.assessment_stage_runs (
  id, run_id, stage_id, sequence_number, attempt_number, status,
  request_hash, prompt_hash, schema_hash,
  response_id, requested_model, returned_model,
  input_tokens, cached_tokens, output_tokens, reasoning_tokens,
  latency_ms, output_json, error_code, skip_reason, created_at
) values
  ('15100000-0000-4000-8000-000000000201',
    '15100000-0000-4000-8000-000000000101',
    'PB-01C', 2, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'candidate_absent', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000202',
    '15100000-0000-4000-8000-000000000102',
    'PB-01C', 2, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_initial_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000203',
    '15100000-0000-4000-8000-000000000102',
    'PB-02', 3, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_initial_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000204',
    '15100000-0000-4000-8000-000000000102',
    'PB-03', 4, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_initial_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000205',
    '15100000-0000-4000-8000-000000000103',
    'PB-01', 1, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_purchase_ready_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000206',
    '15100000-0000-4000-8000-000000000103',
    'PB-01C', 2, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_purchase_ready_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000207',
    '15100000-0000-4000-8000-000000000103',
    'PB-02', 3, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_purchase_ready_authority', '2026-08-22T11:00:01Z'),
  ('15100000-0000-4000-8000-000000000208',
    '15100000-0000-4000-8000-000000000103',
    'PB-03', 4, 1, 'skipped', repeat('1', 64), repeat('2', 64), repeat('3', 64),
    null, 'gpt-5.6-luna', null, 0, 0, 0, 0, 0, null, null,
    'reused_purchase_ready_authority', '2026-08-22T11:00:01Z');

select 'PASS A initial candidate_absent accepted';
select 'PASS B clarification reused authority accepted';
select 'PASS C fulfillment reused purchase-ready authority accepted';

create function pg_temp.assert_stage_rejected(
  p_case text,
  p_run_id uuid,
  p_stage_id text,
  p_sequence integer,
  p_attempt integer,
  p_skip_reason text,
  p_overrides jsonb,
  p_expected_state text,
  p_expected_constraint text
) returns void
language plpgsql
as $function$
declare
  actual_state text;
  actual_constraint text;
begin
  begin
    insert into public.assessment_stage_runs (
      id, run_id, stage_id, sequence_number, attempt_number, status,
      request_hash, prompt_hash, schema_hash,
      response_id, requested_model, returned_model,
      input_tokens, cached_tokens, output_tokens, reasoning_tokens,
      latency_ms, output_json, error_code, skip_reason, created_at
    ) values (
      md5(p_case)::uuid, p_run_id, p_stage_id, p_sequence, p_attempt, 'skipped',
      repeat('4', 64), repeat('5', 64), repeat('6', 64),
      p_overrides ->> 'response_id',
      'gpt-5.6-luna', p_overrides ->> 'returned_model',
      coalesce((p_overrides ->> 'input_tokens')::bigint, 0),
      coalesce((p_overrides ->> 'cached_tokens')::bigint, 0),
      coalesce((p_overrides ->> 'output_tokens')::bigint, 0),
      coalesce((p_overrides ->> 'reasoning_tokens')::bigint, 0),
      coalesce((p_overrides ->> 'latency_ms')::bigint, 0),
      case when p_overrides ? 'output_json'
        then p_overrides -> 'output_json' else null end,
      p_overrides ->> 'error_code', p_skip_reason,
      '2026-08-22T11:00:02Z'
    );
  exception
    when others then
      get stacked diagnostics
        actual_state = returned_sqlstate,
        actual_constraint = constraint_name;
      if actual_state <> p_expected_state then
        raise exception 'PROOF_REJECTION_WRONG_SQLSTATE case=% expected=% actual=%',
          p_case, p_expected_state, actual_state;
      end if;
      if p_expected_constraint is not null
         and actual_constraint is distinct from p_expected_constraint then
        raise exception 'PROOF_REJECTION_WRONG_CONSTRAINT case=% expected=% actual=%',
          p_case, p_expected_constraint, actual_constraint;
      end if;
      return;
  end;
  raise exception 'PROOF_MALFORMED_SKIP_ACCEPTED case=%', p_case;
end;
$function$;

select pg_temp.assert_stage_rejected(
  'wrong_stage', '15100000-0000-4000-8000-000000000104',
  'PB-04', 5, 1, 'reused_purchase_ready_authority', '{}'::jsonb,
  'P0001', null
);
select pg_temp.assert_stage_rejected(
  'wrong_run_kind', '15100000-0000-4000-8000-000000000105',
  'PB-01C', 2, 1, 'reused_initial_authority', '{}'::jsonb,
  'P0001', null
);
select pg_temp.assert_stage_rejected(
  'wrong_skip_reason', '15100000-0000-4000-8000-000000000106',
  'PB-01', 1, 1, 'routing_stopped', '{}'::jsonb,
  'P0001', null
);
select pg_temp.assert_stage_rejected(
  'attempt_2_skipped', '15100000-0000-4000-8000-000000000107',
  'PB-01', 1, 2, 'reused_purchase_ready_authority', '{}'::jsonb,
  'P0001', null
);

alter table public.assessment_stage_runs
  disable trigger assessment_stage_runs_topology_v5;

select pg_temp.assert_stage_rejected(
  'nonzero_input_tokens', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"input_tokens":1}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'nonzero_cached_tokens', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"cached_tokens":1}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'nonzero_output_tokens', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"output_tokens":1}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'nonzero_reasoning_tokens', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"reasoning_tokens":1}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'nonzero_latency', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"latency_ms":1}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'response_present', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"response_id":"synthetic"}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'returned_model_present', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"returned_model":"gpt-5.6-luna"}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'output_present', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"output_json":{"synthetic":true}}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);
select pg_temp.assert_stage_rejected(
  'error_present', '15100000-0000-4000-8000-000000000108',
  'PB-01C', 2, 1, 'candidate_absent', '{"error_code":"SYNTHETIC"}'::jsonb,
  '23514', 'assessment_stage_runs_skipped_invariants'
);

alter table public.assessment_stage_runs
  enable trigger assessment_stage_runs_topology_v5;

select 'PASS D malformed skips rejected';

insert into public.assessment_stage_runs (
  id, run_id, stage_id, sequence_number, attempt_number, status,
  request_hash, prompt_hash, schema_hash,
  response_id, requested_model, returned_model,
  input_tokens, cached_tokens, output_tokens, reasoning_tokens,
  latency_ms, output_json, error_code, skip_reason, created_at
) values
  ('15100000-0000-4000-8000-000000000301',
    '15100000-0000-4000-8000-000000000109',
    'PB-04', 5, 1, 'completed', repeat('7', 64), repeat('8', 64), repeat('9', 64),
    'synthetic-response', 'gpt-5.6-luna', 'gpt-5.6-luna',
    10, 0, 5, 0, 25, '{"synthetic":true}'::jsonb, null, null,
    '2026-08-22T11:00:03Z'),
  ('15100000-0000-4000-8000-000000000302',
    '15100000-0000-4000-8000-000000000109',
    'PB-05', 6, 1, 'failed', repeat('7', 64), repeat('8', 64), repeat('9', 64),
    null, 'gpt-5.6-luna', null,
    0, 0, 0, 0, 30, null, 'SYNTHETIC_FAILURE', null,
    '2026-08-22T11:00:04Z');

do $proof$
declare
  accepted_skip_count integer;
  ordinary_count integer;
begin
  select count(*) into accepted_skip_count
  from public.assessment_stage_runs as stage_run
  join public.assessment_runs as run on run.id = stage_run.run_id
  where run.request_id = '15100000-0000-4000-8000-000000000001'
    and stage_run.status = 'skipped';
  if accepted_skip_count <> 8 then
    raise exception 'PROOF_ACCEPTED_SKIP_COUNT_INVALID count=%', accepted_skip_count;
  end if;

  select count(*) into ordinary_count
  from public.assessment_stage_runs
  where run_id = '15100000-0000-4000-8000-000000000109'
    and status in ('completed', 'failed')
    and skip_reason is null;
  if ordinary_count <> 2 then
    raise exception 'PROOF_ORDINARY_STAGE_COUNT_INVALID count=%', ordinary_count;
  end if;
end;
$proof$;

select 'PASS E completed and failed stages unchanged';

rollback;

select 'M1-4 SKIPPED-STAGE LOCAL DB PASS A-F';
