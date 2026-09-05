begin;

-- Expand RPC only: all v2 APIs and owner/NULL/canonical fences remain intact.
-- Recover only an atomically finalized, same-request v17 report under an
-- expired generating lease. Unknown Provider outcomes still use the v2 guard.
create function public.claim_production_fulfillment_v3(
  p_grant_id uuid, p_owner_id uuid, p_lease_expires_at timestamptz, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  locked public.production_logical_assessments%rowtype;
  completed_run_id uuid;
begin
  if p_owner_id is null or p_now is null or p_lease_expires_at is null or p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_FULFILLMENT_LEASE_INVALID' using errcode = 'P0001';
  end if;
  select * into locked from public.production_logical_assessments where grant_id = p_grant_id for update;
  if locked.status = 'generating'
    and locked.generation_started_at is not null
    and ((locked.lease_expires_at is not null and locked.lease_expires_at <= p_now)
      or (locked.lease_expires_at is null and locked.ownership_acquired_at <= p_now - interval '16 minutes')) then
    select runs.id into completed_run_id
      from public.assessment_requests requests
      join public.assessment_runs runs on runs.request_id = requests.id
      join public.assessment_reports reports on reports.run_id = runs.id
      where requests.id = locked.assessment_request_id
        and requests.source = 'production_fulfillment_runtime'
        and requests.status = 'completed'
        and runs.status = 'completed' and runs.eligibility = 'ready'
        and runs.run_kind = 'fulfillment_resume'
        and runs.requested_model = 'gpt-5.6-luna'
        and runs.prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
        and runs.schema_set_version = 'pipeline-schema-runtime-v6.0.0'
        and runs.stage_topology_version = 'split-base-candidate-v1'
      order by runs.started_at desc limit 1;
    if completed_run_id is not null then
      update public.production_logical_assessments set
        owner_id = p_owner_id, ownership_acquired_at = p_now,
        lease_expires_at = p_lease_expires_at,
        attempt_count = attempt_count + 1, updated_at = p_now
        where id = locked.id;
      return jsonb_build_object('disposition', 'acquired', 'grant_id', p_grant_id,
        'logical_assessment_id', locked.id, 'preparation_id', locked.preparation_id,
        'owner_id', p_owner_id, 'lease_expires_at', p_lease_expires_at,
        'attempt_count', locked.attempt_count + 1, 'recoverable_runtime_run_id', completed_run_id);
    end if;
  end if;
  return public.claim_production_fulfillment_v2(p_grant_id, p_owner_id, p_lease_expires_at, p_now);
end;
$function$;
revoke all on function public.claim_production_fulfillment_v3(uuid,uuid,timestamptz,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_production_fulfillment_v3(uuid,uuid,timestamptz,timestamptz) to service_role;
commit;
