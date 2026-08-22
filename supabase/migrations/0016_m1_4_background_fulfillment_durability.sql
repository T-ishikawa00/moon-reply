begin;

-- 0016 is append-only.  Existing rows are not rewritten.  The NOT VALID
-- checks allow a read-only rollout to classify legacy generating rows before
-- an operator chooses a safe disposition for them.
alter table public.production_logical_assessments
  add column lease_expires_at timestamptz;

alter table public.production_logical_assessments
  add constraint production_logical_assessments_lease_owner
  check (
    (status = 'generating'
      and owner_id is not null
      and ownership_acquired_at is not null
      and lease_expires_at is not null)
    or (status <> 'generating'
      and owner_id is null
      and ownership_acquired_at is null
      and lease_expires_at is null)
  ) not valid;

create index production_logical_assessments_lease_idx
  on public.production_logical_assessments(status, lease_expires_at);

alter table public.production_fulfillment_jobs
  add column dispatch_marker text,
  add column dispatch_owner_id uuid,
  add column dispatch_lease_expires_at timestamptz,
  add column dispatch_claimed_at timestamptz,
  add column dispatch_completed_at timestamptz,
  add column dispatch_retry_after timestamptz,
  add column dispatch_attempt_count integer not null default 0,
  add column dispatch_last_error_code text,
  add column dispatch_updated_at timestamptz;

alter table public.production_fulfillment_jobs
  add constraint production_fulfillment_job_dispatch_marker
  check (dispatch_marker is null or char_length(dispatch_marker) between 16 and 256),
  add constraint production_fulfillment_job_dispatch_attempt_count
  check (dispatch_attempt_count >= 0),
  add constraint production_fulfillment_job_dispatch_lease
  check (
    (dispatch_owner_id is null and dispatch_lease_expires_at is null)
    or (dispatch_owner_id is not null and dispatch_lease_expires_at is not null)
  );

create index production_fulfillment_jobs_dispatch_idx
  on public.production_fulfillment_jobs(
    dispatch_completed_at, dispatch_retry_after, dispatch_lease_expires_at
  );

alter table public.production_notification_outbox
  add column lease_expires_at timestamptz;

alter table public.production_notification_outbox
  add constraint production_notification_outbox_lease_owner
  check (
    (status = 'processing'
      and owner_id is not null
      and processing_started_at is not null
      and lease_expires_at is not null)
    or (status <> 'processing'
      and owner_id is null
      and processing_started_at is null
      and lease_expires_at is null)
  ) not valid;

create index production_notification_outbox_lease_idx
  on public.production_notification_outbox(status, lease_expires_at);

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
  if p_owner_id is null or p_lease_expires_at <= p_now then
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
        perform public.recover_stale_assessment_run_v1(
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
      perform public.recover_stale_assessment_run_v1(
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

-- Backward-compatible seam for existing callers.  New callers should pass
-- their configured expiry to v2; this wrapper supplies a bounded fallback.
create or replace function public.claim_production_fulfillment_v1(
  p_grant_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select public.claim_production_fulfillment_v2(
    p_grant_id, p_owner_id, p_now + interval '16 minutes', p_now
  )
$function$;

create function public.heartbeat_production_fulfillment_v1(
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  renewed_until timestamptz;
begin
  if p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_FULFILLMENT_LEASE_INVALID' using errcode = 'P0001';
  end if;
  update public.production_logical_assessments set
    lease_expires_at = p_lease_expires_at,
    updated_at = p_now
    where id = p_logical_assessment_id
      and status = 'generating'
      and owner_id = p_owner_id
      and lease_expires_at > p_now
    returning lease_expires_at into renewed_until;
  if renewed_until is null then
    raise exception 'PRODUCTION_FULFILLMENT_LEASE_CONFLICT' using errcode = 'P0001';
  end if;
  return renewed_until;
end;
$function$;

create or replace function public.mark_production_generation_started_v1(
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  recorded_at timestamptz;
begin
  update public.production_logical_assessments set
    generation_started_at = coalesce(generation_started_at, p_now),
    recovery_state = 'post_provider_retryable_same_assessment',
    updated_at = p_now
    where id = p_logical_assessment_id
      and status = 'generating'
      and owner_id = p_owner_id
      and lease_expires_at > p_now
    returning generation_started_at into recorded_at;
  if recorded_at is null then
    raise exception 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' using errcode = 'P0001';
  end if;
  return recorded_at::text;
end;
$function$;

create or replace function public.complete_production_fulfillment_v1(
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
     or locked.owner_id <> p_owner_id
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

create or replace function public.fail_production_fulfillment_v1(
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_logical_assessments set
    status = 'retryable', owner_id = null, ownership_acquired_at = null,
    lease_expires_at = null,
    recovery_state = case when generation_started_at is null
      then 'pre_provider_retryable'
      else 'post_provider_retryable_same_assessment' end,
    last_error_code = p_error_code, updated_at = p_now
    where id = p_logical_assessment_id
      and status = 'generating'
      and owner_id = p_owner_id
      and lease_expires_at > p_now;
  if not found then
    raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.claim_rc2_fulfillment_dispatch_v1(
  p_fulfillment_job_id uuid,
  p_dispatch_marker text,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  job public.production_fulfillment_jobs%rowtype;
  intent_state text;
begin
  if p_owner_id is null or p_lease_expires_at <= p_now
     or p_dispatch_marker is null
     or char_length(p_dispatch_marker) not between 16 and 256 then
    raise exception 'RC2_FULFILLMENT_DISPATCH_INVALID' using errcode = 'P0001';
  end if;
  select * into job
    from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id
    for update;
  if job.id is null then return null; end if;
  select state into intent_state
    from public.production_purchase_intents
    where id = job.purchase_intent_id;
  if intent_state <> 'verified' then return null; end if;
  if job.state in ('completed', 'manual_review') then
    return jsonb_build_object('disposition', 'terminal');
  end if;
  if job.dispatch_marker is not null
     and job.dispatch_marker <> p_dispatch_marker then
    update public.production_fulfillment_jobs set
      state = 'manual_review', owner_id = null, lease_expires_at = null,
      dispatch_owner_id = null, dispatch_lease_expires_at = null,
      last_error_code = 'PAYMENT_FULFILLMENT_DISPATCH_CONFLICT',
      dispatch_last_error_code = 'PAYMENT_FULFILLMENT_DISPATCH_CONFLICT',
      updated_at = p_now, dispatch_updated_at = p_now
      where id = job.id;
    return jsonb_build_object('disposition', 'terminal');
  end if;
  if job.dispatch_completed_at is not null then
    return jsonb_build_object('disposition', 'dispatched');
  end if;
  if job.dispatch_owner_id is not null
     and job.dispatch_lease_expires_at > p_now then
    return jsonb_build_object('disposition', 'in_progress');
  end if;
  if job.dispatch_owner_id is not null
     and job.dispatch_retry_after is null then
    update public.production_fulfillment_jobs set
      state = 'manual_review', owner_id = null, lease_expires_at = null,
      dispatch_owner_id = null, dispatch_lease_expires_at = null,
      last_error_code = 'PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS',
      dispatch_last_error_code = 'PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS',
      updated_at = p_now, dispatch_updated_at = p_now
      where id = job.id;
    return jsonb_build_object('disposition', 'terminal');
  end if;
  if job.dispatch_retry_after is not null
     and job.dispatch_retry_after > p_now then
    return jsonb_build_object('disposition', 'retry_later');
  end if;
  update public.production_fulfillment_jobs set
    dispatch_marker = coalesce(dispatch_marker, p_dispatch_marker),
    dispatch_owner_id = p_owner_id,
    dispatch_lease_expires_at = p_lease_expires_at,
    dispatch_claimed_at = coalesce(dispatch_claimed_at, p_now),
    dispatch_retry_after = null,
    dispatch_attempt_count = dispatch_attempt_count + 1,
    dispatch_updated_at = p_now
    where id = job.id;
  return jsonb_build_object('disposition', 'acquired');
end;
$function$;

create function public.complete_rc2_fulfillment_dispatch_v1(
  p_fulfillment_job_id uuid,
  p_dispatch_marker text,
  p_owner_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_fulfillment_jobs set
    dispatch_owner_id = null, dispatch_lease_expires_at = null,
    dispatch_completed_at = p_now, dispatch_retry_after = null,
    dispatch_last_error_code = null, dispatch_updated_at = p_now
    where id = p_fulfillment_job_id
      and dispatch_marker = p_dispatch_marker
      and dispatch_owner_id = p_owner_id
      and dispatch_lease_expires_at > p_now;
  if not found then
    raise exception 'RC2_FULFILLMENT_DISPATCH_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_rc2_fulfillment_dispatch_v1(
  p_fulfillment_job_id uuid,
  p_dispatch_marker text,
  p_owner_id uuid,
  p_error_code text,
  p_retry_after timestamptz,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_retry_after <= p_now then
    raise exception 'RC2_FULFILLMENT_DISPATCH_INVALID' using errcode = 'P0001';
  end if;
  update public.production_fulfillment_jobs set
    dispatch_owner_id = null, dispatch_lease_expires_at = null,
    dispatch_retry_after = p_retry_after,
    dispatch_last_error_code = p_error_code,
    dispatch_updated_at = p_now
    where id = p_fulfillment_job_id
      and dispatch_marker = p_dispatch_marker
      and dispatch_owner_id = p_owner_id
      and dispatch_lease_expires_at > p_now;
  if not found then
    raise exception 'RC2_FULFILLMENT_DISPATCH_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create or replace function public.claim_rc2_fulfillment_job_by_id_v2(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz,
  p_dispatch_marker text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  job public.production_fulfillment_jobs%rowtype;
  intent_state text;
begin
  if p_owner_id is null or p_lease_expires_at <= p_now
     or p_dispatch_marker is null
     or char_length(p_dispatch_marker) not between 16 and 256 then
    raise exception 'RC2_FULFILLMENT_CLAIM_INVALID' using errcode = 'P0001';
  end if;
  select * into job
    from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id
    for update;
  if job.id is null then return null; end if;
  select state into intent_state
    from public.production_purchase_intents
    where id = job.purchase_intent_id
    for update;
  if intent_state <> 'verified' then return null; end if;
  if job.dispatch_marker is not null
     and job.dispatch_marker <> p_dispatch_marker then
    return jsonb_build_object(
      'disposition', 'manual_review',
      'fulfillment_job_id', job.id,
      'dispatch_marker', job.dispatch_marker
    );
  end if;
  if job.state = 'completed' then
    return jsonb_build_object(
      'disposition', 'completed', 'fulfillment_job_id', job.id,
      'dispatch_marker', job.dispatch_marker
    );
  end if;
  if job.state = 'manual_review' then
    return jsonb_build_object(
      'disposition', 'manual_review', 'fulfillment_job_id', job.id,
      'dispatch_marker', job.dispatch_marker
    );
  end if;
  if job.state = 'processing' and job.lease_expires_at is null then
    return jsonb_build_object(
      'disposition', 'manual_review', 'fulfillment_job_id', job.id,
      'dispatch_marker', job.dispatch_marker
    );
  end if;
  if job.state = 'processing' and job.lease_expires_at > p_now then
    return jsonb_build_object(
      'disposition', 'in_progress', 'fulfillment_job_id', job.id,
      'dispatch_marker', job.dispatch_marker
    );
  end if;
  if job.state not in ('pending', 'retryable', 'processing') then return null; end if;
  update public.production_fulfillment_jobs set
    state = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1,
    dispatch_marker = coalesce(dispatch_marker, p_dispatch_marker),
    dispatch_claimed_at = coalesce(dispatch_claimed_at, p_now),
    last_error_code = null, updated_at = p_now
    where id = job.id;
  return jsonb_build_object(
    'disposition', 'acquired',
    'fulfillment_job_id', job.id,
    'dispatch_marker', coalesce(job.dispatch_marker, p_dispatch_marker),
    'attempt_count', job.attempt_count + 1
  );
end;
$function$;

create function public.claim_rc2_fulfillment_job_v2(
  p_status_capability_hash text,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz,
  p_dispatch_marker text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_job_id uuid;
begin
  select jobs.id into target_job_id
    from public.production_purchase_intents intents
    join public.production_fulfillment_jobs jobs
      on jobs.purchase_intent_id = intents.id
    where intents.status_capability_hash = p_status_capability_hash
      and intents.state = 'verified'
      and intents.successful_payment_id is not null;
  if target_job_id is null then return null; end if;
  return public.claim_rc2_fulfillment_job_by_id_v2(
    target_job_id, p_owner_id, p_lease_expires_at, p_now, p_dispatch_marker
  );
end;
$function$;

create or replace function public.claim_rc2_fulfillment_job_by_id_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select public.claim_rc2_fulfillment_job_by_id_v2(
    p_fulfillment_job_id, p_owner_id, p_lease_expires_at, p_now,
    'rc2-dispatch:' || p_fulfillment_job_id::text
  )
$function$;

create or replace function public.claim_rc2_fulfillment_job_v1(
  p_status_capability_hash text,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select case when target_job_id is null then null else
    public.claim_rc2_fulfillment_job_v2(
      p_status_capability_hash, p_owner_id, p_lease_expires_at, p_now,
      'rc2-dispatch:' || target_job_id::text
    ) end
  from (
    select jobs.id as target_job_id
    from public.production_purchase_intents intents
    join public.production_fulfillment_jobs jobs
      on jobs.purchase_intent_id = intents.id
    where intents.status_capability_hash = p_status_capability_hash
    limit 1
  ) target
$function$;

create function public.heartbeat_rc2_fulfillment_job_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  renewed_until timestamptz;
begin
  update public.production_fulfillment_jobs set
    lease_expires_at = p_lease_expires_at,
    updated_at = p_now
    where id = p_fulfillment_job_id
      and state = 'processing'
      and owner_id = p_owner_id
      and lease_expires_at > p_now
    returning lease_expires_at into renewed_until;
  if renewed_until is null then
    raise exception 'RC2_FULFILLMENT_LEASE_CONFLICT' using errcode = 'P0001';
  end if;
  return renewed_until;
end;
$function$;

create or replace function public.complete_rc2_fulfillment_job_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_fulfillment_jobs jobs set
    state = 'completed', owner_id = null, lease_expires_at = null,
    completed_at = p_now,
    last_error_code = null, updated_at = p_now
    where jobs.id = p_fulfillment_job_id
      and jobs.state = 'processing'
      and jobs.owner_id = p_owner_id
      and jobs.lease_expires_at > p_now
      and jobs.grant_id is not null
      and jobs.logical_assessment_id is not null
      and exists (
        select 1 from public.production_assessment_grants grants
        where grants.id = jobs.grant_id and grants.status = 'completed'
      )
      and exists (
        select 1 from public.production_customer_deliveries deliveries
        where deliveries.logical_assessment_id = jobs.logical_assessment_id
      );
  if not found then
    raise exception 'RC2_FULFILLMENT_JOB_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create or replace function public.fail_rc2_fulfillment_job_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_fulfillment_jobs set
    state = case
      when last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        or p_error_code = 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
        then 'manual_review'
      else 'retryable'
    end,
    owner_id = null, lease_expires_at = null,
    last_error_code = case
      when last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
        then 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED'
      else p_error_code
    end,
    updated_at = p_now
    where id = p_fulfillment_job_id
      and state = 'processing'
      and owner_id = p_owner_id
      and lease_expires_at > p_now;
  if not found then
    raise exception 'RC2_FULFILLMENT_JOB_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

-- Once the router has accepted an event, Async Workloads exclusively owns its
-- retry lifecycle. The last retry invocation converges to an observable
-- terminal state without entering the Provider pipeline.
create function public.quarantine_rc2_fulfillment_job_after_async_retries_v1(
  p_fulfillment_job_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  job public.production_fulfillment_jobs%rowtype;
  logical public.production_logical_assessments%rowtype;
  intent_state text;
begin
  select * into job
    from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id
    for update;
  if job.id is null then return null; end if;

  select state into intent_state
    from public.production_purchase_intents
    where id = job.purchase_intent_id
    for update;
  if intent_state <> 'verified' or job.dispatch_completed_at is null then
    raise exception 'RC2_ASYNC_RETRY_AUTHORITY_INVALID' using errcode = 'P0001';
  end if;
  if job.state = 'completed' then
    return jsonb_build_object('disposition', 'completed');
  end if;
  if job.state = 'manual_review' then
    return jsonb_build_object('disposition', 'manual_review');
  end if;
  if job.state = 'processing'
     and job.lease_expires_at is not null
     and job.lease_expires_at > p_now then
    -- Do not steal the active fence.  The marker changes Customer observation
    -- to confirmation_pending immediately.  A successful active worker may
    -- still complete; its ordinary failure converges the Job to manual_review.
    update public.production_fulfillment_jobs set
      last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED',
      dispatch_last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED',
      updated_at = p_now, dispatch_updated_at = p_now
      where id = job.id;
    return jsonb_build_object('disposition', 'quarantined_active');
  end if;
  if job.state not in ('pending', 'retryable', 'processing') then
    raise exception 'RC2_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
  end if;

  if job.logical_assessment_id is not null then
    select * into logical
      from public.production_logical_assessments
      where id = job.logical_assessment_id
      for update;
    if logical.id is null then
      raise exception 'RC2_FULFILLMENT_STATE_CONFLICT' using errcode = 'P0001';
    end if;
    if logical.status = 'generating' and (
         (logical.lease_expires_at is not null
          and logical.lease_expires_at > p_now)
         or (logical.lease_expires_at is null
             and logical.ownership_acquired_at > p_now - interval '16 minutes')
       ) then
      return jsonb_build_object('disposition', 'in_progress');
    end if;
    if logical.status <> 'completed' then
      update public.production_logical_assessments set
        status = 'retryable', owner_id = null,
        ownership_acquired_at = null, lease_expires_at = null,
        recovery_state = 'manual_review',
        last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED',
        updated_at = p_now
        where id = logical.id;
    end if;
  end if;

  update public.production_fulfillment_jobs set
    state = 'manual_review', owner_id = null, lease_expires_at = null,
    last_error_code = 'PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED',
    updated_at = p_now
    where id = job.id;
  return jsonb_build_object('disposition', 'quarantined');
end;
$function$;

create function public.claim_production_notification_v2(
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
  if p_owner_id is null or p_lease_expires_at <= p_now then
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

create or replace function public.claim_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select public.claim_production_notification_v2(
    p_notification_id, p_owner_id, p_now + interval '5 minutes', p_now
  )
$function$;

create function public.heartbeat_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  renewed_until timestamptz;
begin
  update public.production_notification_outbox set
    lease_expires_at = p_lease_expires_at, updated_at = p_now
    where id = p_notification_id
      and status = 'processing'
      and owner_id = p_owner_id
      and lease_expires_at > p_now
    returning lease_expires_at into renewed_until;
  if renewed_until is null then
    raise exception 'PRODUCTION_NOTIFICATION_LEASE_CONFLICT' using errcode = 'P0001';
  end if;
  return renewed_until;
end;
$function$;

create or replace function public.complete_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_provider_message_reference text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_notification_outbox set
    status = 'sent', owner_id = null, processing_started_at = null,
    lease_expires_at = null, sent_at = p_now,
    provider_message_reference = p_provider_message_reference,
    last_error_code = null, updated_at = p_now
    where id = p_notification_id
      and status = 'processing'
      and owner_id = p_owner_id
      and lease_expires_at > p_now;
  if not found then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create or replace function public.fail_production_notification_v1(
  p_notification_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_notification_outbox set
    status = 'failed', owner_id = null, processing_started_at = null,
    lease_expires_at = null, last_error_code = p_error_code, updated_at = p_now
    where id = p_notification_id
      and status = 'processing'
      and owner_id = p_owner_id
      and lease_expires_at > p_now;
  if not found then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.recover_stale_assessment_run_v1(
  p_run_id uuid,
  p_logical_assessment_id uuid,
  p_reason_code text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  locked_run public.assessment_runs%rowtype;
  stale_stage_count integer;
  logical_status text;
  logical_request_id uuid;
  logical_generation_started_at timestamptz;
  logical_ownership_acquired_at timestamptz;
  logical_lease_expires_at timestamptz;
  logical_recovery_state text;
  logical_last_error_code text;
  logical_recovery_authorized boolean := false;
begin
  if p_reason_code not in (
    'PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER',
    'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
  ) then
    raise exception 'M1_RECOVERY_REASON_INVALID' using errcode = 'P0001';
  end if;
  select * into locked_run
    from public.assessment_runs
    where id = p_run_id
    for update;
  if locked_run.id is null then
    raise exception 'M1_RUN_NOT_FOUND' using errcode = 'P0001';
  end if;
  if locked_run.status <> 'processing' then
    return jsonb_build_object('disposition', locked_run.status, 'run_id', p_run_id);
  end if;
  if p_logical_assessment_id is null then
    select id into p_logical_assessment_id
      from public.production_logical_assessments
      where assessment_request_id = locked_run.request_id;
  end if;
  if p_logical_assessment_id is not null then
    select status, assessment_request_id, generation_started_at,
           ownership_acquired_at, lease_expires_at, recovery_state,
           last_error_code
      into logical_status, logical_request_id, logical_generation_started_at,
           logical_ownership_acquired_at, logical_lease_expires_at,
           logical_recovery_state,
           logical_last_error_code
      from public.production_logical_assessments
      where id = p_logical_assessment_id
      for update;
    if logical_request_id is distinct from locked_run.request_id then
      raise exception 'M1_RECOVERY_AUTHORITY_MISMATCH' using errcode = 'P0001';
    end if;
    logical_recovery_authorized :=
      (logical_status = 'generating' and (
        logical_lease_expires_at <= p_now
        or (logical_lease_expires_at is null
            and logical_ownership_acquired_at <= p_now - interval '16 minutes')
      ))
      or (logical_status = 'retryable'
          and logical_recovery_state in ('manual_review', 'pre_provider_retryable')
          and logical_last_error_code = p_reason_code);
  end if;
  if not logical_recovery_authorized then
    return jsonb_build_object('disposition', 'in_progress', 'run_id', p_run_id);
  end if;

  update public.assessment_stage_runs set
    status = 'failed', error_code = p_reason_code
    where run_id = p_run_id and status = 'processing';
  get diagnostics stale_stage_count = row_count;

  update public.assessment_runs set
    status = 'failed', error_code = p_reason_code,
    completed_at = p_now
    where id = p_run_id and status = 'processing';

  update public.assessment_requests set
    status = 'failed', updated_at = p_now
    where id = locked_run.request_id and status = 'processing';

  if p_logical_assessment_id is not null then
    if logical_status = 'generating' then
      update public.production_logical_assessments set
        status = 'retryable', owner_id = null, ownership_acquired_at = null,
        lease_expires_at = null,
        recovery_state = case
          when p_reason_code = 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
            or logical_generation_started_at is not null
            then 'manual_review'
          else 'pre_provider_retryable'
        end,
        last_error_code = p_reason_code, updated_at = p_now
        where id = p_logical_assessment_id;
    end if;
  end if;
  return jsonb_build_object(
    'disposition', case when p_reason_code = 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
      then 'manual_review' else 'recovered' end,
    'run_id', p_run_id,
    'stale_stage_count', stale_stage_count,
    'automatic_rerun', false
  );
end;
$function$;

revoke all on function public.claim_production_fulfillment_v2(uuid, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.heartbeat_production_fulfillment_v1(uuid, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_rc2_fulfillment_dispatch_v1(uuid, text, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.complete_rc2_fulfillment_dispatch_v1(uuid, text, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.fail_rc2_fulfillment_dispatch_v1(uuid, text, uuid, text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_rc2_fulfillment_job_v2(text, uuid, timestamptz, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.claim_rc2_fulfillment_job_by_id_v2(uuid, uuid, timestamptz, timestamptz, text)
  from public, anon, authenticated;
revoke all on function public.heartbeat_rc2_fulfillment_job_v1(uuid, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_production_notification_v2(uuid, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.heartbeat_production_notification_v1(uuid, uuid, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.recover_stale_assessment_run_v1(uuid, uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.quarantine_rc2_fulfillment_job_after_async_retries_v1(uuid, timestamptz)
  from public, anon, authenticated;

grant execute on function public.claim_production_fulfillment_v2(uuid, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.heartbeat_production_fulfillment_v1(uuid, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.claim_rc2_fulfillment_dispatch_v1(uuid, text, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.complete_rc2_fulfillment_dispatch_v1(uuid, text, uuid, timestamptz)
  to service_role;
grant execute on function public.fail_rc2_fulfillment_dispatch_v1(uuid, text, uuid, text, timestamptz, timestamptz)
  to service_role;
grant execute on function public.claim_rc2_fulfillment_job_v2(text, uuid, timestamptz, timestamptz, text)
  to service_role;
grant execute on function public.claim_rc2_fulfillment_job_by_id_v2(uuid, uuid, timestamptz, timestamptz, text)
  to service_role;
grant execute on function public.heartbeat_rc2_fulfillment_job_v1(uuid, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.claim_production_notification_v2(uuid, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.heartbeat_production_notification_v1(uuid, uuid, timestamptz, timestamptz)
  to service_role;
grant execute on function public.recover_stale_assessment_run_v1(uuid, uuid, text, timestamptz)
  to service_role;
grant execute on function public.quarantine_rc2_fulfillment_job_after_async_retries_v1(uuid, timestamptz)
  to service_role;

comment on column public.production_logical_assessments.lease_expires_at is
  'Bounded worker lease. Expired rows may be reclaimed; active rows must remain with their owner.';
comment on column public.production_fulfillment_jobs.dispatch_marker is
  'Durable dispatch idempotency marker. A conflicting marker is manual review, never a second dispatch.';
comment on function public.recover_stale_assessment_run_v1(uuid, uuid, text, timestamptz) is
  'Marks only explicitly expired processing run/stage rows failed, preserves completed history, and never auto-reruns post-provider ambiguity.';

commit;
