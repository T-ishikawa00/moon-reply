begin;

alter table public.assessment_requests
  drop constraint assessment_requests_status;
alter table public.assessment_requests
  add constraint assessment_requests_status
    check (status in ('processing', 'awaiting_clarification', 'completed', 'failed'));

alter table public.assessment_runs
  add column run_kind text,
  add column result_json jsonb,
  add column policy_result_json jsonb;
update public.assessment_runs set run_kind = 'initial' where run_kind is null;
alter table public.assessment_runs alter column run_kind set not null;
alter table public.assessment_runs
  add constraint assessment_runs_run_kind
    check (run_kind in ('initial', 'clarification_resume'));
alter table public.assessment_runs
  drop constraint assessment_runs_eligibility;
alter table public.assessment_runs
  add constraint assessment_runs_eligibility
    check (
      eligibility is null or eligibility in (
        'ready',
        'needs_more_information',
        'not_full_product_candidate',
        'safety_blocked'
      )
    );
alter table public.assessment_runs
  add constraint assessment_runs_result_json_object
    check (result_json is null or jsonb_typeof(result_json) = 'object');
alter table public.assessment_runs
  add constraint assessment_runs_policy_result_json_object
    check (policy_result_json is null or jsonb_typeof(policy_result_json) = 'object');

alter table public.assessment_stage_runs add column skip_reason text;
update public.assessment_stage_runs
  set skip_reason = 'candidate_absent'
  where status = 'skipped' and stage_id = 'PB-01C';
alter table public.assessment_stage_runs
  add constraint assessment_stage_runs_skip_reason
    check (
      (status = 'skipped' and skip_reason in (
        'candidate_absent',
        'reused_initial_authority',
        'routing_stopped'
      ))
      or (status <> 'skipped' and skip_reason is null)
    );

alter table public.assessment_runs
  drop constraint assessment_runs_topology_runtime_identity;
alter table public.assessment_runs
  add constraint assessment_runs_topology_runtime_identity
    check (
      (
        stage_topology_version = 'legacy-six-v1'
        and prompt_bundle_version not in (
          'prompt-bundle-runtime-v9.0.0',
          'prompt-bundle-runtime-v10.0.0',
          'prompt-bundle-runtime-v11.0.0',
          'prompt-bundle-runtime-v12.0.0'
        )
        and schema_set_version not in (
          'pipeline-schema-runtime-v4.0.0',
          'pipeline-schema-runtime-v5.0.0',
          'pipeline-schema-runtime-v6.0.0'
        )
      )
      or (
        stage_topology_version = 'split-base-candidate-v1'
        and (
          (prompt_bundle_version in (
            'prompt-bundle-runtime-v9.0.0',
            'prompt-bundle-runtime-v10.0.0'
          ) and schema_set_version = 'pipeline-schema-runtime-v4.0.0')
          or (prompt_bundle_version = 'prompt-bundle-runtime-v11.0.0'
            and schema_set_version = 'pipeline-schema-runtime-v5.0.0')
          or (prompt_bundle_version = 'prompt-bundle-runtime-v12.0.0'
            and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
        )
      )
    );

drop trigger assessment_stage_runs_topology_v2
  on public.assessment_stage_runs;
drop function public.enforce_assessment_stage_topology_v2();

create function public.enforce_assessment_stage_topology_v3()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  parent_topology text;
  parent_run_kind text;
  expected_stage text;
begin
  select assessment_runs.stage_topology_version, assessment_runs.run_kind
    into parent_topology, parent_run_kind
    from public.assessment_runs
    where assessment_runs.id = new.run_id;
  if parent_topology is null then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if parent_topology = 'legacy-six-v1' then
    expected_stage := case new.sequence_number
      when 1 then 'PB-01' when 2 then 'PB-02' when 3 then 'PB-03'
      when 4 then 'PB-04' when 5 then 'PB-05' when 6 then 'PB-06'
      else null end;
  elsif parent_topology = 'split-base-candidate-v1' then
    expected_stage := case new.sequence_number
      when 1 then 'PB-01' when 2 then 'PB-01C' when 3 then 'PB-02'
      when 4 then 'PB-03' when 5 then 'PB-04' when 6 then 'PB-05'
      when 7 then 'PB-06' else null end;
  else
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if expected_stage is null or new.stage_id <> expected_stage then
    raise exception 'M2_STAGE_TOPOLOGY_INVALID' using errcode = 'P0001';
  end if;
  if new.status = 'skipped' then
    if new.response_id is not null or new.returned_model is not null
       or new.input_tokens <> 0 or new.cached_tokens <> 0
       or new.output_tokens <> 0 or new.reasoning_tokens <> 0
       or new.latency_ms <> 0 or new.output_json is not null
       or new.error_code is not null then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
    if not (
      (parent_run_kind = 'initial' and new.stage_id = 'PB-01C'
        and new.skip_reason = 'candidate_absent')
      or (parent_run_kind = 'clarification_resume'
        and new.stage_id in ('PB-01C', 'PB-02', 'PB-03')
        and new.skip_reason = 'reused_initial_authority')
    ) then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$function$;

create trigger assessment_stage_runs_topology_v3
before insert or update on public.assessment_stage_runs
for each row execute function public.enforce_assessment_stage_topology_v3();

create table public.assessment_clarifications (
  schema_version text not null,
  id text primary key,
  request_id uuid not null unique,
  ordinal integer not null,
  question_code text not null,
  target text not null,
  question_snapshot text not null,
  provenance text not null,
  source_identity text not null unique,
  answer_status text not null,
  answer jsonb,
  answer_fingerprint text,
  grounded_normalized_representation jsonb,
  safety_signals jsonb not null default '[]'::jsonb,
  resume_run_id uuid unique,
  created_at timestamptz not null,
  answered_at timestamptz,
  constraint assessment_clarifications_request_fk foreign key (request_id)
    references public.assessment_requests(id) on delete cascade,
  constraint assessment_clarifications_resume_run_fk foreign key (resume_run_id)
    references public.assessment_runs(id) on delete restrict,
  constraint assessment_clarifications_schema
    check (schema_version = 'm2-p4-assessment-clarification-v1'),
  constraint assessment_clarifications_ordinal check (ordinal = 1),
  constraint assessment_clarifications_id_entropy_shape
    check (id ~ '^[A-Za-z0-9_-]{22,}$'),
  constraint assessment_clarifications_source_identity
    check (source_identity = 'clarification:' || id || ':answer:1'),
  constraint assessment_clarifications_provenance
    check (provenance = 'user_clarification'),
  constraint assessment_clarifications_target check (target in (
    'material_relationship_or_communication_concern',
    'latest_contact_timing',
    'usual_reply_cadence',
    'central_fear_or_decision_concern',
    'relationship_intent',
    'requested_message_tone'
  )),
  constraint assessment_clarifications_answer_status
    check (answer_status in ('pending', 'answered')),
  constraint assessment_clarifications_answer_coherence check (
    (answer_status = 'pending' and answer is null and answer_fingerprint is null
      and grounded_normalized_representation is null and resume_run_id is null
      and answered_at is null)
    or
    (answer_status = 'answered' and answer is not null
      and answer_fingerprint ~ '^[a-f0-9]{64}$'
      and grounded_normalized_representation is not null
      and resume_run_id is not null and answered_at is not null)
  ),
  constraint assessment_clarifications_safety_array
    check (jsonb_typeof(safety_signals) = 'array')
);

create function public.protect_assessment_clarification_question_v1()
returns trigger language plpgsql security invoker set search_path = ''
as $function$
begin
  if new.schema_version <> old.schema_version or new.id <> old.id
     or new.request_id <> old.request_id or new.ordinal <> old.ordinal
     or new.question_code <> old.question_code or new.target <> old.target
     or new.question_snapshot <> old.question_snapshot
     or new.provenance <> old.provenance
     or new.source_identity <> old.source_identity
     or new.created_at <> old.created_at then
    raise exception 'M2_CLARIFICATION_IMMUTABLE_AUTHORITY'
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create trigger assessment_clarification_question_immutable_v1
before update on public.assessment_clarifications
for each row execute function public.protect_assessment_clarification_question_v1();

create function public.finalize_needs_more_information_v1(
  p_run_id uuid, p_request_id uuid, p_returned_model text,
  p_policy_result_json jsonb, p_result_json jsonb,
  p_total_input_tokens bigint, p_total_cached_tokens bigint,
  p_total_output_tokens bigint, p_total_reasoning_tokens bigint,
  p_usage_derived_cost_usd numeric, p_completed_at timestamptz,
  p_clarification_id text, p_schema_version text, p_ordinal integer,
  p_question_code text, p_target text, p_question_snapshot text,
  p_provenance text, p_source_identity text, p_created_at timestamptz
) returns void language plpgsql security invoker set search_path = ''
as $function$
begin
  perform 1 from public.assessment_requests
    where id = p_request_id and status = 'processing' for update;
  if not found then
    raise exception 'M2_CLARIFICATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_runs
    where id = p_run_id and request_id = p_request_id
      and run_kind = 'initial' and status = 'processing' for update;
  if not found then
    raise exception 'M2_CLARIFICATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  insert into public.assessment_clarifications (
    schema_version, id, request_id, ordinal, question_code, target,
    question_snapshot, provenance, source_identity, answer_status,
    created_at
  ) values (
    p_schema_version, p_clarification_id, p_request_id, p_ordinal,
    p_question_code, p_target, p_question_snapshot, p_provenance,
    p_source_identity, 'pending', p_created_at
  );
  update public.assessment_runs set
    status = 'completed', returned_model = p_returned_model,
    eligibility = 'needs_more_information', decision = null,
    total_input_tokens = p_total_input_tokens,
    total_cached_tokens = p_total_cached_tokens,
    total_output_tokens = p_total_output_tokens,
    total_reasoning_tokens = p_total_reasoning_tokens,
    usage_derived_cost_usd = p_usage_derived_cost_usd,
    completed_at = p_completed_at, error_code = null,
    result_json = p_result_json, policy_result_json = p_policy_result_json
    where id = p_run_id and status = 'processing';
  update public.assessment_requests set
    status = 'awaiting_clarification', updated_at = p_completed_at
    where id = p_request_id and status = 'processing';
  if not found then
    raise exception 'M2_CLARIFICATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.accept_assessment_clarification_v1(
  p_clarification_id text, p_answer jsonb, p_answer_fingerprint text,
  p_grounded_normalized_representation jsonb, p_answered_at timestamptz,
  p_resume_run_id uuid, p_requested_model text,
  p_prompt_bundle_version text, p_schema_set_version text,
  p_stage_topology_version text, p_started_at timestamptz
) returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare
  locked public.assessment_clarifications%rowtype;
  request_status text;
begin
  select * into locked from public.assessment_clarifications
    where id = p_clarification_id for update;
  if locked.id is null then
    raise exception 'M2_CLARIFICATION_NOT_FOUND' using errcode = 'P0001';
  end if;
  select status into request_status from public.assessment_requests
    where id = locked.request_id for update;
  if locked.answer_status = 'answered' then
    if locked.answer_fingerprint = p_answer_fingerprint then
      return jsonb_build_object(
        'disposition', 'duplicate', 'resume_run_id', locked.resume_run_id
      );
    end if;
    raise exception 'M2_CLARIFICATION_ALREADY_ANSWERED' using errcode = 'P0001';
  end if;
  if request_status <> 'awaiting_clarification' then
    raise exception 'M2_CLARIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  insert into public.assessment_runs (
    id, request_id, status, requested_model, returned_model,
    prompt_bundle_version, schema_set_version, stage_topology_version,
    run_kind, eligibility, decision, total_input_tokens,
    total_cached_tokens, total_output_tokens, total_reasoning_tokens,
    usage_derived_cost_usd, started_at, completed_at, error_code,
    result_json, policy_result_json
  ) values (
    p_resume_run_id, locked.request_id, 'processing', p_requested_model, null,
    p_prompt_bundle_version, p_schema_set_version, p_stage_topology_version,
    'clarification_resume', null, null, 0, 0, 0, 0, 0,
    p_started_at, null, null, null, null
  );
  update public.assessment_clarifications set
    answer_status = 'answered', answer = p_answer,
    answer_fingerprint = p_answer_fingerprint,
    grounded_normalized_representation = p_grounded_normalized_representation,
    answered_at = p_answered_at, resume_run_id = p_resume_run_id
    where id = p_clarification_id and answer_status = 'pending';
  update public.assessment_requests set
    status = 'processing', updated_at = p_answered_at
    where id = locked.request_id and status = 'awaiting_clarification';
  if not found then
    raise exception 'M2_CLARIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'disposition', 'accepted', 'resume_run_id', p_resume_run_id
  );
end;
$function$;

create function public.finalize_stopped_assessment_v1(
  p_run_id uuid, p_request_id uuid, p_returned_model text,
  p_eligibility text, p_decision text, p_result_json jsonb,
  p_total_input_tokens bigint, p_total_cached_tokens bigint,
  p_total_output_tokens bigint, p_total_reasoning_tokens bigint,
  p_usage_derived_cost_usd numeric, p_completed_at timestamptz
) returns void language plpgsql security invoker set search_path = ''
as $function$
begin
  if p_eligibility not in ('not_full_product_candidate', 'safety_blocked')
     or p_decision is not null or p_result_json is null then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_requests
    where id = p_request_id and status = 'processing' for update;
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_runs set
    status = 'completed', returned_model = p_returned_model,
    eligibility = p_eligibility, decision = null,
    result_json = p_result_json,
    total_input_tokens = p_total_input_tokens,
    total_cached_tokens = p_total_cached_tokens,
    total_output_tokens = p_total_output_tokens,
    total_reasoning_tokens = p_total_reasoning_tokens,
    usage_derived_cost_usd = p_usage_derived_cost_usd,
    completed_at = p_completed_at, error_code = null
    where id = p_run_id and request_id = p_request_id
      and status = 'processing';
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_requests set
    status = 'completed', updated_at = p_completed_at
    where id = p_request_id and status = 'processing';
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_assessment_run_v1(
  p_run_id uuid, p_request_id uuid, p_returned_model text,
  p_error_code text, p_total_input_tokens bigint,
  p_total_cached_tokens bigint, p_total_output_tokens bigint,
  p_total_reasoning_tokens bigint, p_usage_derived_cost_usd numeric,
  p_completed_at timestamptz
) returns void language plpgsql security invoker set search_path = ''
as $function$
begin
  perform 1 from public.assessment_requests
    where id = p_request_id and status = 'processing' for update;
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_runs set
    status = 'failed', returned_model = p_returned_model,
    total_input_tokens = p_total_input_tokens,
    total_cached_tokens = p_total_cached_tokens,
    total_output_tokens = p_total_output_tokens,
    total_reasoning_tokens = p_total_reasoning_tokens,
    usage_derived_cost_usd = p_usage_derived_cost_usd,
    completed_at = p_completed_at, error_code = p_error_code
    where id = p_run_id and request_id = p_request_id
      and status = 'processing';
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_requests set
    status = 'failed', updated_at = p_completed_at
    where id = p_request_id and status = 'processing';
  if not found then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on function public.enforce_assessment_stage_topology_v3() from public, anon, authenticated;
revoke all on function public.protect_assessment_clarification_question_v1() from public, anon, authenticated;
revoke all on function public.finalize_needs_more_information_v1(uuid, uuid, text, jsonb, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz, text, text, integer, text, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.accept_assessment_clarification_v1(text, jsonb, text, jsonb, timestamptz, uuid, text, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.finalize_stopped_assessment_v1(uuid, uuid, text, text, text, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz) from public, anon, authenticated;
revoke all on function public.fail_assessment_run_v1(uuid, uuid, text, text, bigint, bigint, bigint, bigint, numeric, timestamptz) from public, anon, authenticated;
grant execute on function public.finalize_needs_more_information_v1(uuid, uuid, text, jsonb, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz, text, text, integer, text, text, text, text, text, timestamptz) to service_role;
grant execute on function public.accept_assessment_clarification_v1(text, jsonb, text, jsonb, timestamptz, uuid, text, text, text, text, timestamptz) to service_role;
grant execute on function public.finalize_stopped_assessment_v1(uuid, uuid, text, text, text, jsonb, bigint, bigint, bigint, bigint, numeric, timestamptz) to service_role;
grant execute on function public.fail_assessment_run_v1(uuid, uuid, text, text, bigint, bigint, bigint, bigint, numeric, timestamptz) to service_role;

commit;
