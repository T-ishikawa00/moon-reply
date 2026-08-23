\set ON_ERROR_STOP on
\pset tuples_only on

-- Run after the legacy seed and exact 0016 on a disposable local database.
-- Every mutation is rolled back. No external service is called.
begin;

do $proof$
declare
  mismatches integer;
  definition text;
  validated boolean;
  identity text;
begin
  select count(*) into mismatches
  from m1_4_expand_proof.legacy_function_defs saved
  where pg_catalog.pg_get_functiondef(saved.identity::regprocedure)
    is distinct from saved.definition;
  if mismatches <> 0 then
    raise exception 'M1_EXPAND_LEGACY_V1_DEFINITION_CHANGED:%', mismatches;
  end if;
  if exists (
    select 1 from m1_4_expand_proof.legacy_function_defs saved
    where not has_function_privilege('service_role', saved.identity, 'EXECUTE')
       or has_function_privilege('anon', saved.identity, 'EXECUTE')
       or has_function_privilege('authenticated', saved.identity, 'EXECUTE')
  ) then
    raise exception 'M1_EXPAND_LEGACY_V1_ACL_CHANGED';
  end if;

  select pg_catalog.pg_get_constraintdef(oid), convalidated
    into definition, validated
  from pg_catalog.pg_constraint
  where conrelid = 'public.production_logical_assessments'::regclass
    and conname = 'production_logical_assessments_lease_owner';
  if validated is not false
     or position('lease_expires_at IS NULL' in definition) = 0
     or position('status = ''generating''' in definition) = 0 then
    raise exception 'M1_EXPAND_LOGICAL_CONSTRAINT_NOT_EXPAND_SAFE';
  end if;
  select pg_catalog.pg_get_constraintdef(oid), convalidated
    into definition, validated
  from pg_catalog.pg_constraint
  where conrelid = 'public.production_notification_outbox'::regclass
    and conname = 'production_notification_outbox_lease_owner';
  if validated is not false
     or position('lease_expires_at IS NULL' in definition) = 0
     or position('status = ''processing''' in definition) = 0 then
    raise exception 'M1_EXPAND_NOTIFICATION_CONSTRAINT_NOT_EXPAND_SAFE';
  end if;

  if exists (
    select 1 from public.production_logical_assessments
    where id in (
      '51000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000002',
      '51000000-0000-4000-8000-000000000003',
      '51000000-0000-4000-8000-000000000004'
    ) and (status <> 'generating' or owner_id is null or lease_expires_at is not null)
  ) or exists (
    select 1 from public.production_notification_outbox
    where id in (
      '91000000-0000-4000-8000-000000000005',
      '91000000-0000-4000-8000-000000000006'
    ) and (status <> 'processing' or owner_id is null or lease_expires_at is not null)
  ) then
    raise exception 'M1_EXPAND_APPLY_REWROTE_LEGACY_OWNER';
  end if;

  foreach identity in array array[
    'public.claim_production_fulfillment_v2(uuid,uuid,timestamptz,timestamptz)',
    'public.mark_production_generation_started_v2(uuid,uuid,timestamptz)',
    'public.complete_production_fulfillment_v2(uuid,uuid,uuid,uuid,uuid,jsonb,text,uuid,text,uuid,timestamptz)',
    'public.fail_production_fulfillment_v2(uuid,uuid,text,timestamptz)',
    'public.claim_rc2_fulfillment_dispatch_v2(uuid,text,uuid,timestamptz,timestamptz)',
    'public.complete_rc2_fulfillment_dispatch_v2(uuid,text,uuid,timestamptz)',
    'public.fail_rc2_fulfillment_dispatch_v2(uuid,text,uuid,text,timestamptz,timestamptz)',
    'public.claim_rc2_fulfillment_job_v2(text,uuid,timestamptz,timestamptz)',
    'public.claim_rc2_fulfillment_job_by_id_v2(uuid,uuid,timestamptz,timestamptz)',
    'public.complete_rc2_fulfillment_job_v2(uuid,uuid,timestamptz)',
    'public.fail_rc2_fulfillment_job_v2(uuid,uuid,text,timestamptz)',
    'public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz)',
    'public.complete_production_notification_v2(uuid,uuid,text,timestamptz)',
    'public.fail_production_notification_v2(uuid,uuid,text,timestamptz)',
    'public.recover_stale_assessment_run_v2(uuid,uuid,text,timestamptz)',
    'public.quarantine_rc2_fulfillment_job_after_async_retries_v2(uuid,timestamptz)'
  ] loop
    if to_regprocedure(identity) is null
       or not has_function_privilege('service_role', identity, 'EXECUTE')
       or has_function_privilege('anon', identity, 'EXECUTE')
       or has_function_privilege('authenticated', identity, 'EXECUTE') then
      raise exception 'M1_EXPAND_V2_ACL_INVALID:%', identity;
    end if;
  end loop;

  if exists (
    select 1 from m1_4_expand_proof.legacy_function_defs saved
    where position('manual_review' in lower(saved.definition)) > 0
  ) then
    raise exception 'M1_EXPAND_LEGACY_V1_NEW_DISPOSITION';
  end if;
end;
$proof$;
select 'PASS A/H exact legacy v1 definitions, response policy, ACL, and apply state preserved';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_production_fulfillment_v1(
    '41000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000011',
    '2026-08-23T00:10:00Z'
  );
  if result <> jsonb_build_object(
    'disposition', 'acquired',
    'grant_id', '41000000-0000-4000-8000-000000000011'::uuid,
    'logical_assessment_id', '51000000-0000-4000-8000-000000000011'::uuid,
    'preparation_id', '21000000-0000-4000-8000-000000000011'::uuid,
    'owner_id', 'a1000000-0000-4000-8000-000000000011'::uuid,
    'recoverable_runtime_run_id', null
  ) then
    raise exception 'M1_EXPAND_LEGACY_LOGICAL_CLAIM_SHAPE:%', result;
  end if;
  perform public.fail_production_fulfillment_v1(
    '51000000-0000-4000-8000-000000000011',
    'a1000000-0000-4000-8000-000000000011',
    'SYNTHETIC_LEGACY_FAILURE', '2026-08-23T00:10:01Z'
  );

  result := public.claim_rc2_fulfillment_job_by_id_v1(
    'e1000000-0000-4000-8000-000000000009',
    'a9000000-0000-4000-8000-000000000099',
    '2026-08-23T00:12:00Z', '2026-08-23T00:10:00Z'
  );
  if result <> jsonb_build_object(
    'disposition', 'in_progress',
    'fulfillment_job_id', 'e1000000-0000-4000-8000-000000000009'::uuid
  ) then
    raise exception 'M1_EXPAND_LEGACY_JOB_CLAIM_SHAPE:%', result;
  end if;
  if public.claim_production_notification_v1(
    '91000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000099',
    '2026-08-23T00:10:00Z'
  ) is not null then
    raise exception 'M1_EXPAND_LEGACY_NOTIFICATION_SHAPE_CHANGED';
  end if;
end;
$proof$;
select 'PASS A/H legacy v1 acquired/in_progress/null payload shapes remain exact';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000001',
    '2026-08-23T00:20:00Z', '2026-08-23T00:10:00Z'
  );
  if result ->> 'disposition' <> 'in_progress' then
    raise exception 'M1_EXPAND_ACTIVE_LEGACY_LOGICAL_STOLEN:%', result;
  end if;
  result := public.claim_rc2_fulfillment_job_by_id_v2(
    'e1000000-0000-4000-8000-000000000009',
    'b9000000-0000-4000-8000-000000000009',
    '2026-08-23T00:20:00Z', '2026-08-23T00:10:00Z'
  );
  if result ->> 'disposition' <> 'in_progress' then
    raise exception 'M1_EXPAND_ACTIVE_LEGACY_JOB_STOLEN:%', result;
  end if;
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000009',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000009',
    'b9000000-0000-4000-8000-000000000099',
    '2026-08-23T00:11:00Z', '2026-08-23T00:10:00Z'
  );
  if result ->> 'disposition' <> 'in_progress' then
    raise exception 'M1_EXPAND_STATUS_DISPATCH_STOLE_ACTIVE_EA4_JOB:%', result;
  end if;
  if exists (
    select 1 from public.production_logical_assessments
    where id = '51000000-0000-4000-8000-000000000001'
      and (owner_id <> 'a1000000-0000-4000-8000-000000000001'
           or lease_expires_at is not null)
  ) or exists (
    select 1 from public.production_fulfillment_jobs
    where id = 'e1000000-0000-4000-8000-000000000009'
      and (owner_id <> 'a9000000-0000-4000-8000-000000000009'
           or dispatch_attempt_count <> 0)
  ) then
    raise exception 'M1_EXPAND_ACTIVE_LEGACY_OWNER_MUTATED';
  end if;
end;
$proof$;
select 'PASS E active ea4 logical/job workers remain owned during grace/lease';

select public.mark_production_generation_started_v1(
  '51000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001', '2026-08-23T00:10:01Z'
);
select public.complete_production_fulfillment_v1(
  '41000000-0000-4000-8000-000000000001',
  '51000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000001',
  '61000000-0000-4000-8000-000000000001',
  '81000000-0000-4000-8000-000000000001',
  '{"schemaVersion":"synthetic-expand-proof-v1"}'::jsonb,
  encode(extensions.digest(convert_to('expand-legacy-complete', 'UTF8'), 'sha256'), 'hex'),
  '82000000-0000-4000-8000-000000000001',
  encode(extensions.digest(convert_to('expand-legacy-token', 'UTF8'), 'sha256'), 'hex'),
  '91000000-0000-4000-8000-000000000001', '2026-08-23T00:10:02Z'
);
select public.fail_production_fulfillment_v1(
  '51000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000002',
  'SYNTHETIC_LEGACY_FAILURE', '2026-08-23T00:10:02Z'
);

do $proof$
begin
  if not exists (
    select 1 from public.production_logical_assessments
    where id = '51000000-0000-4000-8000-000000000001'
      and status = 'completed' and owner_id is null and lease_expires_at is null
  ) or not exists (
    select 1 from public.production_logical_assessments
    where id = '51000000-0000-4000-8000-000000000002'
      and status = 'retryable' and owner_id is null and lease_expires_at is null
  ) then
    raise exception 'M1_EXPAND_LEGACY_LOGICAL_COMPLETION_FAILURE';
  end if;
end;
$proof$;
select 'PASS B legacy generating owner can mark/complete/fail through exact ea4 v1';

select public.complete_production_notification_v1(
  '91000000-0000-4000-8000-000000000005',
  'a1000000-0000-4000-8000-000000000005',
  'synthetic-provider-reference', '2026-08-23T00:10:03Z'
);
select public.fail_production_notification_v1(
  '91000000-0000-4000-8000-000000000006',
  'a1000000-0000-4000-8000-000000000006',
  'SYNTHETIC_NOTIFICATION_FAILURE', '2026-08-23T00:10:03Z'
);
do $proof$
begin
  if not exists (
    select 1 from public.production_notification_outbox
    where id = '91000000-0000-4000-8000-000000000005'
      and status = 'sent' and owner_id is null and lease_expires_at is null
  ) or not exists (
    select 1 from public.production_notification_outbox
    where id = '91000000-0000-4000-8000-000000000006'
      and status = 'failed' and owner_id is null and lease_expires_at is null
  ) then
    raise exception 'M1_EXPAND_LEGACY_NOTIFICATION_COMPLETION_FAILURE';
  end if;
end;
$proof$;
select 'PASS C legacy processing notification can complete/fail through exact ea4 v1';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000002',
    '2026-08-23T00:20:00Z', '2026-08-23T00:11:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_V2_LOGICAL_NOT_ACQUIRED:%', result;
  end if;
  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000099',
    '2026-08-23T00:21:00Z', '2026-08-23T00:11:01Z'
  );
  if result ->> 'disposition' <> 'in_progress' then
    raise exception 'M1_EXPAND_V2_LOGICAL_ACTIVE_FENCE_FAILED:%', result;
  end if;
  begin
    perform public.mark_production_generation_started_v2(
      '51000000-0000-4000-8000-000000000002',
      'b1000000-0000-4000-8000-000000000099', '2026-08-23T00:11:02Z'
    );
    raise exception 'M1_EXPAND_V2_WRONG_OWNER_MARK_SUCCEEDED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' then raise; end if;
  end;
  perform public.mark_production_generation_started_v2(
    '51000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000002', '2026-08-23T00:11:02Z'
  );
  perform public.fail_production_fulfillment_v2(
    '51000000-0000-4000-8000-000000000002',
    'b1000000-0000-4000-8000-000000000002',
    'SYNTHETIC_V2_FAILURE', '2026-08-23T00:11:03Z'
  );

  result := public.claim_production_notification_v2(
    '91000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000101',
    '2026-08-23T00:20:00Z', '2026-08-23T00:11:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_V2_NOTIFICATION_NOT_ACQUIRED:%', result;
  end if;
  begin
    perform public.complete_production_notification_v2(
      '91000000-0000-4000-8000-000000000001',
      'b1000000-0000-4000-8000-000000000199',
      'synthetic-wrong-owner', '2026-08-23T00:11:01Z'
    );
    raise exception 'M1_EXPAND_V2_WRONG_OWNER_NOTIFICATION_SUCCEEDED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' then raise; end if;
  end;
  perform public.complete_production_notification_v2(
    '91000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000101',
    'synthetic-v2-message', '2026-08-23T00:11:02Z'
  );
end;
$proof$;
select 'PASS D v2 logical and notification ownership is leased and fenced';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000010',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000010',
    'ba000000-0000-4000-8000-000000000010',
    '2026-08-23T00:12:00Z', '2026-08-23T00:11:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_V2_DISPATCH_NOT_ACQUIRED:%', result;
  end if;
  perform public.complete_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000010',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000010',
    'ba000000-0000-4000-8000-000000000010', '2026-08-23T00:11:01Z'
  );
  result := public.claim_rc2_fulfillment_job_by_id_v2(
    'e1000000-0000-4000-8000-000000000010',
    'bb000000-0000-4000-8000-000000000010',
    '2026-08-23T00:20:00Z', '2026-08-23T00:11:02Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_V2_JOB_NOT_ACQUIRED:%', result;
  end if;
  begin
    perform public.fail_rc2_fulfillment_job_v2(
      'e1000000-0000-4000-8000-000000000010',
      'bb000000-0000-4000-8000-000000000099',
      'SYNTHETIC_WRONG_OWNER', '2026-08-23T00:11:03Z'
    );
    raise exception 'M1_EXPAND_V2_WRONG_OWNER_JOB_SUCCEEDED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'RC2_FULFILLMENT_JOB_CONFLICT' then raise; end if;
  end;
  perform public.fail_rc2_fulfillment_job_v2(
    'e1000000-0000-4000-8000-000000000010',
    'bb000000-0000-4000-8000-000000000010',
    'SYNTHETIC_V2_JOB_FAILURE', '2026-08-23T00:11:04Z'
  );
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000010',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000010',
    'ba000000-0000-4000-8000-000000000099',
    '2026-08-23T00:13:00Z', '2026-08-23T00:11:05Z'
  );
  if result ->> 'disposition' <> 'dispatched' then
    raise exception 'M1_EXPAND_V2_STATUS_REDISPATCH_OPENED:%', result;
  end if;

  result := public.claim_rc2_fulfillment_job_by_id_v2(
    'e1000000-0000-4000-8000-000000000007',
    'bb000000-0000-4000-8000-000000000007',
    '2026-08-23T00:20:00Z', '2026-08-23T00:11:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_V2_COMPLETE_JOB_NOT_ACQUIRED:%', result;
  end if;
  perform public.complete_rc2_fulfillment_job_v2(
    'e1000000-0000-4000-8000-000000000007',
    'bb000000-0000-4000-8000-000000000007', '2026-08-23T00:11:01Z'
  );

  -- A failed ea4 worker has no dispatch marker. Status may create the first
  -- durable async event, and only a recorded pre-router failure may retry that
  -- same initial dispatch transaction.
  result := public.claim_rc2_fulfillment_job_by_id_v1(
    'e1000000-0000-4000-8000-000000000008',
    'bb000000-0000-4000-8000-000000000008',
    '2026-08-23T00:20:00Z', '2026-08-23T00:11:10Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_LEGACY_FAILED_JOB_NOT_ACQUIRED:%', result;
  end if;
  perform public.fail_rc2_fulfillment_job_v1(
    'e1000000-0000-4000-8000-000000000008',
    'bb000000-0000-4000-8000-000000000008',
    'SYNTHETIC_EA4_JOB_FAILURE', '2026-08-23T00:11:11Z'
  );
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000008',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000008',
    'ba000000-0000-4000-8000-000000000008',
    '2026-08-23T00:12:20Z', '2026-08-23T00:11:20Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_LEGACY_FAILURE_INITIAL_DISPATCH_BLOCKED:%', result;
  end if;
  perform public.fail_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000008',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000008',
    'ba000000-0000-4000-8000-000000000008',
    'SYNTHETIC_PRE_ROUTER_FAILURE',
    '2026-08-23T00:12:00Z', '2026-08-23T00:11:21Z'
  );
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000008',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000008',
    'ba000000-0000-4000-8000-000000000088',
    '2026-08-23T00:12:50Z', '2026-08-23T00:11:50Z'
  );
  if result ->> 'disposition' <> 'retry_later' then
    raise exception 'M1_EXPAND_PRE_ROUTER_COOLDOWN_BYPASSED:%', result;
  end if;
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000008',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000008',
    'ba000000-0000-4000-8000-000000000088',
    '2026-08-23T00:13:10Z', '2026-08-23T00:12:10Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_PRE_ROUTER_RETRY_NOT_ACQUIRED:%', result;
  end if;

  -- A direct v2 worker claim creates the deterministic event marker. If that
  -- worker fails without persisted router acceptance, status must fail closed
  -- instead of creating a second event authority.
  result := public.claim_rc2_fulfillment_job_by_id_v2(
    'e1000000-0000-4000-8000-000000000009',
    'bb000000-0000-4000-8000-000000000009',
    '2026-08-23T00:50:00Z', '2026-08-23T00:40:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_DIRECT_V2_JOB_NOT_ACQUIRED:%', result;
  end if;
  perform public.fail_rc2_fulfillment_job_v2(
    'e1000000-0000-4000-8000-000000000009',
    'bb000000-0000-4000-8000-000000000009',
    'SYNTHETIC_DIRECT_V2_FAILURE', '2026-08-23T00:40:01Z'
  );
  result := public.claim_rc2_fulfillment_dispatch_v2(
    'e1000000-0000-4000-8000-000000000009',
    'rc2-dispatch:e1000000-0000-4000-8000-000000000009',
    'ba000000-0000-4000-8000-000000000009',
    '2026-08-23T00:42:00Z', '2026-08-23T00:40:02Z'
  );
  if result ->> 'disposition' <> 'terminal'
     or not exists (
       select 1 from public.production_fulfillment_jobs
       where id = 'e1000000-0000-4000-8000-000000000009'
         and state = 'manual_review'
         and dispatch_attempt_count = 0
         and last_error_code = 'PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS'
     ) then
    raise exception 'M1_EXPAND_DIRECT_WORKER_OPENED_EVENT_B:%', result;
  end if;
end;
$proof$;
select 'PASS D/E v2 dispatch/job retry authority, ea4 coexistence, and fencing hold';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000003',
    'bc000000-0000-4000-8000-000000000003',
    '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
  );
  if result ->> 'disposition' <> 'acquired' then
    raise exception 'M1_EXPAND_PRE_PROVIDER_NOT_RECLAIMED:%', result;
  end if;
  if not exists (
    select 1 from public.assessment_runs
    where id = '61000000-0000-4000-8000-000000000003'
      and status = 'failed' and error_code = 'PRODUCTION_WORKER_CRASH_BEFORE_PROVIDER'
  ) then
    raise exception 'M1_EXPAND_PRE_PROVIDER_RUN_NOT_RECOVERED';
  end if;

  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000004',
    'bc000000-0000-4000-8000-000000000004',
    '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
  );
  if result ->> 'disposition' <> 'manual_review'
     or result ->> 'automatic_rerun' <> 'false' then
    raise exception 'M1_EXPAND_POST_PROVIDER_NOT_QUARANTINED:%', result;
  end if;
  if not exists (
    select 1 from public.production_logical_assessments
    where id = '51000000-0000-4000-8000-000000000004'
      and status = 'retryable' and recovery_state = 'manual_review'
      and owner_id is null and lease_expires_at is null
  ) then
    raise exception 'M1_EXPAND_POST_PROVIDER_STATE_INVALID';
  end if;
end;
$proof$;
select 'PASS G expired legacy pre-provider reclaims; post-provider ambiguity quarantines';

do $proof$
declare
  result jsonb;
begin
  result := public.claim_production_fulfillment_v1(
    '41000000-0000-4000-8000-000000000001',
    'bd000000-0000-4000-8000-000000000001', '2026-08-23T00:30:00Z'
  );
  if result ->> 'disposition' <> 'completed'
     or result ? 'lease_expires_at'
     or result ? 'reason_code' then
    raise exception 'M1_EXPAND_LEGACY_COMPLETED_OBSERVATION_CHANGED:%', result;
  end if;
  if not exists (
    select 1 from public.production_customer_deliveries
    where logical_assessment_id = '51000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'M1_EXPAND_COMPLETED_DELIVERY_NOT_OBSERVABLE';
  end if;
end;
$proof$;
select 'PASS F ea4 completion remains observable to legacy and new status reads';

rollback;
select 'M1-4 EXPAND CROSS-VERSION PASS A-H';
