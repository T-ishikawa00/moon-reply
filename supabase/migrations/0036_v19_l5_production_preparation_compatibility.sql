-- Forward-only compatibility for production preparation. Existing V17 rows,
-- function ownership/ACL, and clarification question immutability are retained.
begin;

create or replace function public.finalize_purchase_ready_assessment_v1(
  p_run_id uuid,
  p_request_id uuid,
  p_returned_model text,
  p_policy_result_json jsonb,
  p_total_input_tokens bigint,
  p_total_cached_tokens bigint,
  p_total_output_tokens bigint,
  p_total_reasoning_tokens bigint,
  p_usage_derived_cost_usd numeric,
  p_completed_at timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_returned_model <> 'gpt-5.6-luna'
     or jsonb_typeof(p_policy_result_json) <> 'object' then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_requests
    where id = p_request_id and source = 'production_fulfillment_runtime'
      and status = 'processing' for update;
  if not found then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_runs set
    status = 'completed', returned_model = p_returned_model,
    eligibility = 'ready', decision = null,
    policy_result_json = p_policy_result_json, result_json = null,
    total_input_tokens = p_total_input_tokens,
    total_cached_tokens = p_total_cached_tokens,
    total_output_tokens = p_total_output_tokens,
    total_reasoning_tokens = p_total_reasoning_tokens,
    usage_derived_cost_usd = p_usage_derived_cost_usd,
    completed_at = p_completed_at, error_code = null
    where id = p_run_id and request_id = p_request_id
      and status = 'processing'
      and run_kind in ('initial', 'clarification_resume')
      and requested_model = 'gpt-5.6-luna'
      and (
        (prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
          and schema_set_version = 'pipeline-schema-runtime-v6.0.0')
        or
        (prompt_bundle_version = 'prompt-bundle-runtime-v23.0.0'
          and schema_set_version = 'pipeline-schema-runtime-v9.0.0')
      )
      and stage_topology_version = 'split-base-candidate-v1';
  if not found then
    raise exception 'M2_PREPARATION_FINALIZATION_CONFLICT' using errcode = 'P0001';
  end if;
  update public.assessment_requests
    set updated_at = p_completed_at
    where id = p_request_id and status = 'processing';
end;
$function$;

alter table public.assessment_clarifications
  drop constraint assessment_clarifications_target,
  add constraint assessment_clarifications_target check (target in (
    'material_relationship_or_communication_concern',
    'latest_contact_timing',
    'usual_reply_cadence',
    'central_fear_or_decision_concern',
    'relationship_intent',
    'requested_message_tone',
    'original_message'
  ));

commit;
