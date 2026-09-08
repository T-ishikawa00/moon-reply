begin;

-- No new queue or purchase ledger: retain candidate proof on the existing logical
-- assessment and exact validation input on its existing stage evidence.
alter table public.assessment_stage_runs add column input_json jsonb;
alter table public.production_logical_assessments
  add column fulfillment_job_owner_id uuid,
  add column validated_candidate_run_id uuid,
  add column validated_candidate_report_hash text,
  add column validated_candidate_validation_hash text,
  add column validated_candidate_evidence jsonb;

create function public.paid_recovery_contract_matches_v1(p_authority jsonb, p_model text, p_bundle text, p_schema text, p_topology text)
returns boolean language sql immutable security invoker set search_path = '' as $function$
  select coalesce(p_model = 'gpt-5.6-luna' and p_topology = 'split-base-candidate-v1'
    and p_authority#>>'{runtimeIdentity,model}' = p_model
    and p_authority#>>'{runtimeIdentity,promptBundleVersion}' = p_bundle
    and p_authority#>>'{runtimeIdentity,schemaSetVersion}' = p_schema
    and p_authority#>>'{runtimeIdentity,stageTopologyVersion}' = p_topology
    and ((p_authority->>'schemaVersion' = 'rc1-purchase-ready-runtime-authority-v1'
      and p_bundle = 'prompt-bundle-runtime-v17.0.0' and p_schema = 'pipeline-schema-runtime-v6.0.0')
    or (p_authority->>'schemaVersion' = 'v19-l5-purchase-ready-authority-v1'
      and p_bundle = 'prompt-bundle-runtime-v23.0.0' and p_schema = 'pipeline-schema-runtime-v9.0.0')),false);
$function$;

-- Preserve every accepted legacy identity and add only the explicit V19-L5 pair.
do $migration$
declare old_expression text;
begin
  select pg_get_expr(conbin,conrelid) into old_expression from pg_constraint
    where conrelid='public.assessment_runs'::regclass and conname='assessment_runs_topology_runtime_identity';
  alter table public.assessment_runs drop constraint assessment_runs_topology_runtime_identity;
  execute 'alter table public.assessment_runs add constraint assessment_runs_topology_runtime_identity check ((('
    ||old_expression||') and prompt_bundle_version <> ''prompt-bundle-runtime-v23.0.0'' and schema_set_version <> ''pipeline-schema-runtime-v9.0.0'') or '
    ||'(stage_topology_version=''split-base-candidate-v1'' and prompt_bundle_version=''prompt-bundle-runtime-v23.0.0'' and schema_set_version=''pipeline-schema-runtime-v9.0.0''))';
  select pg_get_expr(conbin,conrelid) into old_expression from pg_constraint
    where conrelid='public.production_preparations'::regclass and conname='production_preparations_state';
  alter table public.production_preparations drop constraint production_preparations_state;
  execute 'alter table public.production_preparations add constraint production_preparations_state check (('
    ||old_expression||') or (status in (''purchase_ready'',''consumed'') and purchase_capability_hash is not null '
    ||'and purchase_ready_authority_sha256 is not null and stop_reason is null and '
    ||'public.paid_recovery_contract_matches_v1(purchase_ready_authority_json,''gpt-5.6-luna'',''prompt-bundle-runtime-v23.0.0'',''pipeline-schema-runtime-v9.0.0'',''split-base-candidate-v1'')))';
end;
$migration$;
create or replace function public.enforce_assessment_stage_topology_v5()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  parent_topology text;
  parent_run_kind text;
  parent_prompt_bundle text;
  expected_stage text;
begin
  select
    assessment_runs.stage_topology_version,
    assessment_runs.run_kind,
    assessment_runs.prompt_bundle_version
    into parent_topology, parent_run_kind, parent_prompt_bundle
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
  if new.attempt_number not in (1, 2) then
    raise exception 'M2_STAGE_ATTEMPT_INVALID' using errcode = 'P0001';
  end if;
  if new.attempt_number = 2 and not (
    (parent_prompt_bundle in (
      'prompt-bundle-runtime-v15.0.0',
      'prompt-bundle-runtime-v16.0.0',
      'prompt-bundle-runtime-v17.0.0'
    )
    and new.stage_id in ('PB-04', 'PB-05', 'PB-06')
    and new.status <> 'skipped') or (parent_prompt_bundle='prompt-bundle-runtime-v23.0.0' and new.stage_id in ('PB-05','PB-06') and new.status<>'skipped')
  ) then
    raise exception 'M2_STAGE_ATTEMPT_INVALID' using errcode = 'P0001';
  end if;
  if new.status = 'skipped' then
    if new.attempt_number <> 1
       or new.response_id is not null or new.returned_model is not null
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
      or (parent_run_kind = 'fulfillment_resume'
        and new.stage_id in ('PB-01', 'PB-01C', 'PB-02', 'PB-03')
        and new.skip_reason = 'reused_purchase_ready_authority')
    ) then
      raise exception 'M2_STAGE_SKIP_INVALID' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$function$;

create function public.claim_production_fulfillment_v4(p_grant_id uuid,p_owner_id uuid,p_lease_expires_at timestamptz,p_now timestamptz)
returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare locked public.production_logical_assessments%rowtype; preparation public.production_preparations%rowtype;
  completed_run_id uuid; job public.production_fulfillment_jobs%rowtype; result_disposition text := 'acquired';
begin
  if p_owner_id is null or p_now is null or p_lease_expires_at is null or p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_FULFILLMENT_LEASE_INVALID'; end if;
  select * into locked from public.production_logical_assessments where grant_id=p_grant_id;
  if locked.id is null then raise exception 'PRODUCTION_GRANT_INVALID'; end if;
  -- Stable order shared with dispatch/budget: job, logical, financial row.
  select * into job from public.production_fulfillment_jobs where logical_assessment_id=locked.id
    and state='processing' and owner_id is not null and lease_expires_at > p_now for update;
  if not found then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
  select * into locked from public.production_logical_assessments where id=locked.id for update;
  if not public.lock_paid_fulfillment_financial_v1(locked.id) then raise exception 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED'; end if;
  if locked.status='completed' then result_disposition := 'completed';
  elsif locked.status='generating' and (locked.lease_expires_at > p_now or
    (locked.lease_expires_at is null and locked.ownership_acquired_at > p_now-interval '16 minutes')) then result_disposition := 'in_progress';
  else
    if locked.status not in ('pending','retryable','generating') then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
    select * into preparation from public.production_preparations where id=locked.preparation_id;
    if not public.paid_recovery_contract_matches_v1(preparation.purchase_ready_authority_json,
      preparation.purchase_ready_authority_json#>>'{runtimeIdentity,model}', preparation.purchase_ready_authority_json#>>'{runtimeIdentity,promptBundleVersion}',
      preparation.purchase_ready_authority_json#>>'{runtimeIdentity,schemaSetVersion}', preparation.purchase_ready_authority_json#>>'{runtimeIdentity,stageTopologyVersion}') then
      raise exception 'PRODUCTION_RECOVERY_EXECUTOR_UNAVAILABLE'; end if;
    -- Completed candidates have priority over any replay or new Provider call.
    select r.id into completed_run_id from public.assessment_runs r join public.assessment_reports a on a.run_id=r.id
      where r.request_id=locked.assessment_request_id and r.status='completed' and r.eligibility='ready' and r.run_kind='fulfillment_resume'
        and public.paid_recovery_contract_matches_v1(preparation.purchase_ready_authority_json,r.requested_model,r.prompt_bundle_version,r.schema_set_version,r.stage_topology_version)
      order by r.started_at desc limit 1;
    -- This v4 claim has proven a new live job owner and absence of a live logical
    -- lease. Retire only interrupted runs/stages; retain every completed output,
    -- report and cumulative Provider reservation. Never call a legacy helper
    -- whose narrower manual_review predicate would leave these runs active.
    update public.assessment_stage_runs s set status='failed',error_code='PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
      from public.assessment_runs r where s.run_id=r.id and r.request_id=locked.assessment_request_id
      and r.status='processing' and s.status='processing';
    update public.assessment_runs set status='failed',error_code='PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS',completed_at=p_now
      where request_id=locked.assessment_request_id and status='processing';
    if completed_run_id is null then
      update public.assessment_requests set status='processing',updated_at=p_now where id=locked.assessment_request_id and source='production_fulfillment_runtime';
      if not found then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
    end if;
    update public.production_logical_assessments set status='generating',owner_id=p_owner_id,ownership_acquired_at=p_now,fulfillment_job_owner_id=job.owner_id,
      lease_expires_at=p_lease_expires_at,attempt_count=attempt_count+1,updated_at=p_now,
      validated_candidate_run_id=null,validated_candidate_report_hash=null,validated_candidate_validation_hash=null,validated_candidate_evidence=null
      where id=locked.id;
  end if;
  return jsonb_build_object('disposition',result_disposition,'grant_id',p_grant_id,'logical_assessment_id',locked.id,
    'preparation_id',locked.preparation_id,'owner_id',case when result_disposition='acquired' then p_owner_id else locked.owner_id end,
    'lease_expires_at',case when result_disposition='acquired' then p_lease_expires_at else locked.lease_expires_at end,
    'recoverable_runtime_run_id',completed_run_id);
end;
$function$;

create function public.attest_paid_recovery_candidate_v1(p_logical_assessment_id uuid,p_owner_id uuid,p_runtime_run_id uuid,
  p_report_hash text,p_validation_hash text,p_report_json jsonb,p_validation_stage_id uuid,p_validation_input jsonb,p_validation_output jsonb,p_now timestamptz,p_validation_request_hash text,p_reconstructed_legacy_input boolean,p_validation_proof text)
returns void language plpgsql security invoker set search_path = '' as $function$
declare locked public.production_logical_assessments%rowtype; job public.production_fulfillment_jobs%rowtype;
begin
  if p_now is null or p_owner_id is null or p_report_hash is null or p_validation_hash is null or p_validation_proof is null
    or p_validation_request_hash is null or p_reconstructed_legacy_input is null or p_validation_request_hash !~ '^[0-9a-f]{64}$' or p_report_hash !~ '^[0-9a-f]{64}$' or p_validation_hash !~ '^[0-9a-f]{64}$' then raise exception 'PRODUCTION_RECOVERY_CANDIDATE_INVALID'; end if;
  select * into job from public.production_fulfillment_jobs where logical_assessment_id=p_logical_assessment_id for update;
  select * into locked from public.production_logical_assessments where id=p_logical_assessment_id for update;
  if job.state is distinct from 'processing' or job.owner_id is null or job.owner_id is distinct from locked.fulfillment_job_owner_id or job.lease_expires_at is null or job.lease_expires_at<=p_now then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
  if not public.lock_paid_fulfillment_financial_v1(p_logical_assessment_id) then raise exception 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED'; end if;
  if locked.status is distinct from 'generating' or locked.owner_id is distinct from p_owner_id or locked.lease_expires_at is null or locked.lease_expires_at<=p_now then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
  perform 1 from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id
    join public.production_preparations p on p.id=locked.preparation_id
    join public.assessment_stage_runs s on s.run_id=r.id
    where r.id=p_runtime_run_id and r.request_id=locked.assessment_request_id and r.status='completed' and r.eligibility='ready' and r.run_kind='fulfillment_resume'
      and public.paid_recovery_contract_matches_v1(p.purchase_ready_authority_json,r.requested_model,r.prompt_bundle_version,r.schema_set_version,r.stage_topology_version)
      and a.report_json=p_report_json and s.id=p_validation_stage_id and s.stage_id='PB-06' and s.status='completed'
      and p_validation_proof::jsonb=jsonb_build_object('policyVersion','paid-recovery-validation-v1','input',p_validation_input,'output',p_validation_output,'promptHash',s.prompt_hash,'schemaHash',s.schema_hash)
      and pg_catalog.encode(extensions.digest(pg_catalog.convert_to(p_validation_proof,'UTF8'),'sha256'),'hex')=p_validation_hash
      and s.request_hash=p_validation_request_hash and (s.input_json=p_validation_input or (p_reconstructed_legacy_input and s.input_json is null and r.prompt_bundle_version='prompt-bundle-runtime-v17.0.0' and r.schema_set_version='pipeline-schema-runtime-v6.0.0')) and s.output_json=p_validation_output
      and not exists(select 1 from public.assessment_stage_runs later where later.run_id=r.id and later.stage_id='PB-06' and later.attempt_number>s.attempt_number and later.input_json=s.input_json and later.output_json is not null);
  if not found then raise exception 'PRODUCTION_RECOVERY_VALIDATION_EVIDENCE_REQUIRED'; end if;
  update public.production_logical_assessments set validated_candidate_run_id=p_runtime_run_id,validated_candidate_report_hash=p_report_hash,
    validated_candidate_validation_hash=p_validation_hash,validated_candidate_evidence=jsonb_build_object('report',p_report_json,'validation_stage_id',p_validation_stage_id,'input',p_validation_input,'output',p_validation_output,'request_hash',p_validation_request_hash,'reconstructed_legacy_input',p_reconstructed_legacy_input,'validation_policy_version','paid-recovery-validation-v1','validation_proof',p_validation_proof)
    where id=locked.id;
end;
$function$;
create function public.complete_production_fulfillment_v3(
  p_grant_id uuid,
  p_logical_assessment_id uuid,
  p_owner_id uuid,
  p_runtime_run_id uuid,
  p_report_hash text,
  p_validation_hash text,
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
  job public.production_fulfillment_jobs%rowtype;
begin
  if p_now is null then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
  select * into job from public.production_fulfillment_jobs where logical_assessment_id=p_logical_assessment_id for update;
  select * into locked
    from public.production_logical_assessments
    where id = p_logical_assessment_id
      and grant_id = p_grant_id
    for update;
  if job.state is distinct from 'processing' or job.owner_id is null or job.owner_id is distinct from locked.fulfillment_job_owner_id or job.lease_expires_at is null or job.lease_expires_at<=p_now then raise exception 'PRODUCTION_FULFILLMENT_STATE_CONFLICT'; end if;
  if not public.lock_paid_fulfillment_financial_v1(p_logical_assessment_id) then raise exception 'PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED'; end if;
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
  if locked.validated_candidate_run_id is distinct from p_runtime_run_id
    or p_report_hash is null or p_validation_hash is null
    or locked.validated_candidate_report_hash is distinct from p_report_hash
    or locked.validated_candidate_validation_hash is distinct from p_validation_hash
    or locked.validated_candidate_evidence->>'validation_policy_version' is distinct from 'paid-recovery-validation-v1' then raise exception 'PRODUCTION_RECOVERY_CANDIDATE_INVALID'; end if;
  perform 1 from public.assessment_reports a join public.assessment_runs r on r.id=a.run_id
    join public.production_preparations p on p.id=locked.preparation_id
    join public.assessment_stage_runs s on s.id=(locked.validated_candidate_evidence->>'validation_stage_id')::uuid and s.run_id=r.id
    where r.id=p_runtime_run_id and r.request_id=locked.assessment_request_id and r.status='completed' and r.eligibility='ready' and r.run_kind='fulfillment_resume'
      and public.paid_recovery_contract_matches_v1(p.purchase_ready_authority_json,r.requested_model,r.prompt_bundle_version,r.schema_set_version,r.stage_topology_version)
      and a.report_json=locked.validated_candidate_evidence->'report'
      and (locked.validated_candidate_evidence->>'validation_proof')::jsonb=jsonb_build_object('policyVersion','paid-recovery-validation-v1','input',locked.validated_candidate_evidence->'input','output',s.output_json,'promptHash',s.prompt_hash,'schemaHash',s.schema_hash)
      and pg_catalog.encode(extensions.digest(pg_catalog.convert_to(locked.validated_candidate_evidence->>'validation_proof','UTF8'),'sha256'),'hex')=locked.validated_candidate_validation_hash
      and s.request_hash=locked.validated_candidate_evidence->>'request_hash' and (s.input_json=locked.validated_candidate_evidence->'input' or (s.input_json is null and locked.validated_candidate_evidence->>'reconstructed_legacy_input'='true')) and s.output_json=locked.validated_candidate_evidence->'output' and s.status='completed';
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

-- All legacy/new completion RPCs cross this fence. An old worker cannot bypass
-- candidate validation by calling a still-installed v1/v2 completion function.
create function public.fence_paid_candidate_delivery_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
declare logical public.production_logical_assessments%rowtype; job public.production_fulfillment_jobs%rowtype;
begin
  select * into job from public.production_fulfillment_jobs where logical_assessment_id=new.logical_assessment_id for update;
  select * into logical from public.production_logical_assessments where id=new.logical_assessment_id for update;
  if job.state is distinct from 'processing' or job.owner_id is null or job.owner_id is distinct from logical.fulfillment_job_owner_id
    or job.lease_expires_at is null or job.lease_expires_at<=new.created_at
    or logical.validated_candidate_run_id is distinct from new.runtime_run_id or logical.validated_candidate_evidence is null
    or logical.validated_candidate_evidence->>'validation_policy_version' is distinct from 'paid-recovery-validation-v1' then
    raise exception 'PRODUCTION_RECOVERY_VALIDATION_EVIDENCE_REQUIRED'; end if;
  perform 1 from public.assessment_reports a join public.assessment_stage_runs s on s.run_id=a.run_id
    where a.run_id=new.runtime_run_id and a.report_json=logical.validated_candidate_evidence->'report'
      and s.id=(logical.validated_candidate_evidence->>'validation_stage_id')::uuid and s.status='completed'
      and (logical.validated_candidate_evidence->>'validation_proof')::jsonb=jsonb_build_object('policyVersion','paid-recovery-validation-v1','input',logical.validated_candidate_evidence->'input','output',s.output_json,'promptHash',s.prompt_hash,'schemaHash',s.schema_hash)
      and pg_catalog.encode(extensions.digest(pg_catalog.convert_to(logical.validated_candidate_evidence->>'validation_proof','UTF8'),'sha256'),'hex')=logical.validated_candidate_validation_hash
      and s.request_hash=logical.validated_candidate_evidence->>'request_hash' and (s.input_json=logical.validated_candidate_evidence->'input' or (s.input_json is null and logical.validated_candidate_evidence->>'reconstructed_legacy_input'='true')) and s.output_json=logical.validated_candidate_evidence->'output'
      and not exists(select 1 from public.assessment_stage_runs later where later.run_id=s.run_id and later.stage_id='PB-06'
        and later.attempt_number>s.attempt_number and later.input_json=s.input_json and later.output_json is not null);
  if not found then raise exception 'PRODUCTION_RECOVERY_CANDIDATE_INVALID'; end if;
  return new;
end;
$function$;
create trigger paid_candidate_delivery_fence before insert on public.production_customer_deliveries
for each row execute function public.fence_paid_candidate_delivery_v1();
revoke all on function public.fence_paid_candidate_delivery_v1() from public,anon,authenticated;
grant execute on function public.fence_paid_candidate_delivery_v1() to service_role;
revoke all on function public.paid_recovery_contract_matches_v1(jsonb,text,text,text,text),
  public.claim_production_fulfillment_v4(uuid,uuid,timestamptz,timestamptz),
  public.attest_paid_recovery_candidate_v1(uuid,uuid,uuid,text,text,jsonb,uuid,jsonb,jsonb,timestamptz,text,boolean,text),
  public.complete_production_fulfillment_v3(uuid,uuid,uuid,uuid,text,text,uuid,jsonb,text,uuid,text,uuid,timestamptz)
from public,anon,authenticated;
grant execute on function public.paid_recovery_contract_matches_v1(jsonb,text,text,text,text),
  public.claim_production_fulfillment_v4(uuid,uuid,timestamptz,timestamptz),
  public.attest_paid_recovery_candidate_v1(uuid,uuid,uuid,text,text,jsonb,uuid,jsonb,jsonb,timestamptz,text,boolean,text),
  public.complete_production_fulfillment_v3(uuid,uuid,uuid,uuid,text,text,uuid,jsonb,text,uuid,text,uuid,timestamptz)
to service_role;
commit;
