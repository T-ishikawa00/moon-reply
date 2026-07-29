begin;

create function public.finalize_completed_assessment(
  p_report_id uuid,
  p_run_id uuid,
  p_request_id uuid,
  p_returned_model text,
  p_decision text,
  p_report_json jsonb,
  p_decision_card_json jsonb,
  p_total_input_tokens bigint,
  p_total_cached_tokens bigint,
  p_total_output_tokens bigint,
  p_total_reasoning_tokens bigint,
  p_usage_derived_cost_usd numeric(18, 9),
  p_completed_at timestamptz
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked_request_id uuid;
begin
  select assessment_runs.request_id
    into locked_request_id
    from public.assessment_runs
    where assessment_runs.id = p_run_id
      and assessment_runs.request_id = p_request_id
      and assessment_runs.status = 'processing'
    for update;

  if locked_request_id is null then
    raise exception 'M2_FINALIZATION_STATE_CONFLICT'
      using errcode = 'P0001';
  end if;

  if p_returned_model is null then
    raise exception 'M2_FINALIZATION_MODEL_REQUIRED'
      using errcode = 'P0001';
  end if;

  insert into public.assessment_reports (
    id,
    run_id,
    report_json,
    decision_card_json,
    created_at
  )
  values (
    p_report_id,
    p_run_id,
    p_report_json,
    p_decision_card_json,
    p_completed_at
  );

  update public.assessment_runs
    set status = 'completed',
        returned_model = p_returned_model,
        eligibility = 'ready',
        decision = p_decision,
        total_input_tokens = p_total_input_tokens,
        total_cached_tokens = p_total_cached_tokens,
        total_output_tokens = p_total_output_tokens,
        total_reasoning_tokens = p_total_reasoning_tokens,
        usage_derived_cost_usd = p_usage_derived_cost_usd,
        completed_at = p_completed_at,
        error_code = null
    where assessment_runs.id = p_run_id
      and assessment_runs.request_id = p_request_id
      and assessment_runs.status = 'processing';

  if not found then
    raise exception 'M2_FINALIZATION_RUN_UPDATE_FAILED'
      using errcode = 'P0001';
  end if;

  update public.assessment_requests
    set status = 'completed',
        updated_at = p_completed_at
    where assessment_requests.id = p_request_id
      and assessment_requests.status = 'processing';

  if not found then
    raise exception 'M2_FINALIZATION_REQUEST_UPDATE_FAILED'
      using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on function public.finalize_completed_assessment(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  bigint,
  bigint,
  bigint,
  bigint,
  numeric,
  timestamptz
) from public;

revoke all on function public.finalize_completed_assessment(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  bigint,
  bigint,
  bigint,
  bigint,
  numeric,
  timestamptz
) from anon;

revoke all on function public.finalize_completed_assessment(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  bigint,
  bigint,
  bigint,
  bigint,
  numeric,
  timestamptz
) from authenticated;

grant execute on function public.finalize_completed_assessment(
  uuid,
  uuid,
  uuid,
  text,
  text,
  jsonb,
  jsonb,
  bigint,
  bigint,
  bigint,
  bigint,
  numeric,
  timestamptz
) to service_role;

commit;
