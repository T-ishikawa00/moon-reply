begin;

-- M2-A1 closes only the NULL-fence gaps confirmed by the M2-0 remote catalog
-- identity and disposable local exploit proof. The v1 APIs, v2 signatures,
-- historical expand constraints, reclaim semantics, and all other RPCs remain
-- unchanged.

create or replace function public.claim_production_fulfillment_v2(
  p_grant_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_logical_assessments%rowtype;
  request_status text;
  recoverable_runtime_run_id uuid;
  provider_stage_processing boolean := false;
  stale_run record;
begin
  if p_owner_id is null
     or p_lease_expires_at is null
     or p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_FULFILLMENT_LEASE_INVALID' using errcode = 'P0001';
  end if;

  select * into locked
    from public.production_logical_assessments
    where grant_id = p_grant_id
    for update;
  if locked.id is null then
    raise exception 'PRODUCTION_GRANT_INVALID' using errcode = 'P0001';
  end if;
  if locked.status = 'completed' then
    return jsonb_build_object(
      'disposition', 'completed', 'grant_id', p_grant_id,
      'logical_assessment_id', locked.id,
      'preparation_id', locked.preparation_id,
      'owner_id', null, 'lease_expires_at', null,
      'recoverable_runtime_run_id', null
    );
  end if;
  if locked.status = 'retryable'
     and locked.recovery_state = 'manual_review' then
    return jsonb_build_object(
      'disposition', 'manual_review', 'grant_id', p_grant_id,
      'logical_assessment_id', locked.id,
      'preparation_id', locked.preparation_id,
      'owner_id', null, 'lease_expires_at', null,
      'recoverable_runtime_run_id', null
    );
  end if;
  if locked.status = 'generating' then
    if (locked.lease_expires_at is not null and locked.lease_expires_at > p_now)
       or (locked.lease_expires_at is null
           and locked.ownership_acquired_at > p_now - interval '16 minutes') then
      return jsonb_build_object(
        'disposition', 'in_progress', 'grant_id', p_grant_id,
        'logical_assessment_id', locked.id,
        'preparation_id', locked.preparation_id,
        'owner_id', locked.owner_id,
        'lease_expires_at', locked.lease_expires_at,
        'recoverable_runtime_run_id', null
      );
    end if;
    select exists (
      select 1
      from public.assessment_runs runs
      join public.assessment_stage_runs stages on stages.run_id = runs.id
      where runs.request_id = locked.assessment_request_id
        and runs.status = 'processing'
        and stages.status = 'processing'
        and stages.stage_id in ('PB-04', 'PB-05', 'PB-06')
    ) into provider_stage_processing;
    if locked.generation_started_at is not null or provider_stage_processing then
      for stale_run in
        select id
        from public.assessment_runs
        where request_id = locked.assessment_request_id
          and status = 'processing'
      loop
        perform public.recover_stale_assessment_run_v2(
          stale_run.id, locked.id, 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS', p_now
        );
      end loop;
      if locked.status = 'generating' then
        update public.production_logical_assessments set
          status = 'retryable', owner_id = null,
          ownership_acquired_at = null, lease_expires_at = null,
          recovery_state = 'manual_review',
          last_error_code = 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS', updated_at = p_now
          where id = locked.id;
      end if;
      return jsonb_build_object(
        'disposition', 'manual_review', 'grant_id', p_grant_id,
        'logical_assessment_id', locked.id,
        'preparation_id', locked.preparation_id,
        'owner_id', null, 'lease_expires_at', null,
        'automatic_rerun', false,
        'reason_code', 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
      );
    end if;
    for stale_run in
      select id
      from public.assessment_runs
      where request_id = locked.assessment_request_id
        and status = 'processing'
    loop
      perform public.recover_stale_assessment_run_v2(
        stale_run.id, locked.id, 'PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER', p_now
      );
    end loop;
    update public.assessment_requests set
      status = 'processing', updated_at = p_now
      where id = locked.assessment_request_id
        and status = 'failed';
    update public.production_logical_assessments set
      status = 'generating',
      owner_id = p_owner_id,
      ownership_acquired_at = p_now,
      lease_expires_at = p_lease_expires_at,
      attempt_count = attempt_count + 1,
      recovery_state = 'pre_provider_retryable',
      last_error_code = 'PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER',
      updated_at = p_now
      where id = locked.id;
    return jsonb_build_object(
      'disposition', 'acquired', 'grant_id', p_grant_id,
      'logical_assessment_id', locked.id,
      'preparation_id', locked.preparation_id,
      'owner_id', p_owner_id,
      'lease_expires_at', p_lease_expires_at,
      'attempt_count', locked.attempt_count + 1,
      'recovery_state', locked.recovery_state
    );
  end if;
  if locked.status not in ('pending', 'retryable') then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;

  select status into request_status
    from public.assessment_requests
    where id = locked.assessment_request_id
      and source = 'production_fulfillment_runtime'
    for update;
  if request_status = 'completed' then
    select runs.id into recoverable_runtime_run_id
      from public.assessment_runs runs
      join public.assessment_reports reports on reports.run_id = runs.id
      where runs.request_id = locked.assessment_request_id
        and runs.status = 'completed'
        and runs.eligibility = 'ready'
        and runs.run_kind = 'fulfillment_resume'
        and runs.requested_model = 'gpt-5.6-luna'
        and runs.prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
        and runs.schema_set_version = 'pipeline-schema-runtime-v6.0.0'
        and runs.stage_topology_version = 'split-base-candidate-v1'
      order by runs.started_at desc
      limit 1;
    if recoverable_runtime_run_id is null then
      raise exception 'PRODUCTION_FULFILLMENT_RECOVERY_INVALID' using errcode = 'P0001';
    end if;
  elsif request_status in ('processing', 'failed') then
    update public.assessment_requests set
      status = 'processing', updated_at = p_now
      where id = locked.assessment_request_id;
  else
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;

  update public.production_logical_assessments set
    status = 'generating', owner_id = p_owner_id,
    ownership_acquired_at = p_now, lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1, updated_at = p_now
    where id = locked.id;
  return jsonb_build_object(
    'disposition', 'acquired', 'grant_id', p_grant_id,
    'logical_assessment_id', locked.id,
    'preparation_id', locked.preparation_id,
    'owner_id', p_owner_id, 'lease_expires_at', p_lease_expires_at,
    'attempt_count', locked.attempt_count + 1,
    'recoverable_runtime_run_id', recoverable_runtime_run_id
  );
end;
$function$;

create or replace function public.complete_production_fulfillment_v2(
  p_grant_id uuid,
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_runtime_run_id uuid,
  p_delivery_id uuid,
  p_experience_projection_json jsonb,
  p_projection_sha256 text,
  p_result_credential_id uuid,
  p_result_token_hash text,
  p_notification_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_logical_assessments%rowtype;
  delivery_reference text;
begin
  select * into locked
    from public.production_logical_assessments
    where id = p_logical_assessment_id
      and grant_id = p_grant_id
    for update;
  if locked.id is null
     or locked.status <> 'generating'
     or p_owner_id is null
     or locked.owner_id is null
     or locked.owner_id is distinct from p_owner_id
     or locked.lease_expires_at is null
     or locked.lease_expires_at <= p_now
     or locked.generation_started_at is null then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.assessment_reports reports
    join public.assessment_runs runs on runs.id = reports.run_id
    where reports.run_id = p_runtime_run_id
      and runs.request_id = locked.assessment_request_id
      and runs.run_kind = 'fulfillment_resume'
      and runs.status = 'completed'
      and runs.requested_model = 'gpt-5.6-luna'
      and runs.prompt_bundle_version = 'prompt-bundle-runtime-v17.0.0'
      and runs.schema_set_version = 'pipeline-schema-runtime-v6.0.0'
      and runs.stage_topology_version = 'split-base-candidate-v1';
  if not found then
    raise exception 'PRODUCTION_CANONICAL_REPORT_REQUIRED' using errcode = 'P0001';
  end if;
  select delivery_authority_reference into delivery_reference
    from public.production_assessment_grants
    where id = p_grant_id and status = 'issued'
    for update;
  if delivery_reference is null then
    raise exception 'PRODUCTION_GRANT_INVALID' using errcode = 'P0001';
  end if;
  insert into public.production_customer_deliveries (
    id, logical_assessment_id, runtime_run_id, experience_projection_json,
    projection_sha256, delivery_authority_reference, created_at
  ) values (
    p_delivery_id, p_logical_assessment_id, p_runtime_run_id,
    p_experience_projection_json, p_projection_sha256,
    delivery_reference, p_now
  );
  insert into public.production_result_credentials (
    id, delivery_id, token_hash, purpose, issued_at
  ) values (
    p_result_credential_id, p_delivery_id, p_result_token_hash,
    'customer_handoff', p_now
  );
  insert into public.production_notification_outbox (
    id, delivery_id, delivery_authority_reference, status,
    attempt_count, requested_at, updated_at
  ) values (
    p_notification_id, p_delivery_id, delivery_reference,
    'pending', 0, p_now, p_now
  );
  update public.production_logical_assessments set
    status = 'completed', owner_id = null, ownership_acquired_at = null,
    lease_expires_at = null, recovery_state = 'completed',
    completed_at = p_now, last_error_code = null, updated_at = p_now
    where id = p_logical_assessment_id;
  update public.production_assessment_grants set
    status = 'completed', completed_at = p_now
    where id = p_grant_id and status = 'issued';
end;
$function$;

create or replace function public.claim_production_notification_v2(
  p_notification_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked public.production_notification_outbox%rowtype;
begin
  if p_owner_id is null
     or p_lease_expires_at is null
     or p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_NOTIFICATION_LEASE_INVALID' using errcode = 'P0001';
  end if;
  select * into locked
    from public.production_notification_outbox
    where id = p_notification_id
    for update;
  if locked.id is null then return null; end if;
  if locked.status = 'sent' then
    return jsonb_build_object('disposition', 'sent', 'id', locked.id);
  end if;
  if locked.status = 'processing' and locked.lease_expires_at is null then
    return jsonb_build_object('disposition', 'manual_review', 'id', locked.id);
  end if;
  if locked.status = 'processing' and locked.lease_expires_at > p_now then
    return jsonb_build_object('disposition', 'in_progress', 'id', locked.id);
  end if;
  if locked.status not in ('pending', 'failed', 'processing') then return null; end if;
  update public.production_notification_outbox set
    status = 'processing', owner_id = p_owner_id,
    processing_started_at = coalesce(processing_started_at, p_now),
    lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1, updated_at = p_now
    where id = p_notification_id;
  return jsonb_build_object(
    'disposition', case when locked.status = 'processing' then 'reclaimed' else 'acquired' end,
    'id', locked.id, 'delivery_id', locked.delivery_id,
    'delivery_authority_reference', locked.delivery_authority_reference,
    'attempt_count', locked.attempt_count + 1,
    'lease_expires_at', p_lease_expires_at
  );
end;
$function$;

comment on function public.claim_production_fulfillment_v2(uuid, uuid, timestamptz, timestamptz) is
  'Claims logical fulfillment only with a non-NULL owner and future non-NULL lease; preserves M1 expand reclaim semantics.';
comment on function public.complete_production_fulfillment_v2(uuid, uuid, uuid, uuid, uuid, jsonb, text, uuid, text, uuid, timestamptz) is
  'Completes fulfillment only behind an exact non-NULL live owner/lease fence checked before all delivery side effects.';
comment on function public.claim_production_notification_v2(uuid, uuid, timestamptz, timestamptz) is
  'Claims notification delivery only with a non-NULL owner and future non-NULL lease; preserves valid reclaim semantics.';

commit;
