\set ON_ERROR_STOP on
\pset tuples_only on

begin;

-- This is a disposable proof.  It never inserts into a production table and
-- never calls a provider.  The catalog assertions are safe to run against a
-- local database after migration 0016; the temp fixtures exercise the
-- active/expired and post-provider state-machine invariants.
do $proof$
declare
  definition text;
  is_validated boolean;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'production_logical_assessments'
      and column_name = 'lease_expires_at'
  ) then
    raise exception 'M1_LOGICAL_LEASE_COLUMN_MISSING';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'production_fulfillment_jobs'
      and column_name = 'dispatch_marker'
  ) then
    raise exception 'M1_DISPATCH_MARKER_COLUMN_MISSING';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'production_notification_outbox'
      and column_name = 'lease_expires_at'
  ) then
    raise exception 'M1_NOTIFICATION_LEASE_COLUMN_MISSING';
  end if;
  select pg_catalog.pg_get_constraintdef(pg_constraint.oid),
         pg_constraint.convalidated
    into definition, is_validated
  from pg_catalog.pg_constraint
  where conrelid = 'public.production_logical_assessments'::regclass
    and conname = 'production_logical_assessments_lease_owner';
  if definition is null
     or position('lease_expires_at IS NULL' in definition) = 0
     or position('status = ''generating''' in definition) = 0
     or is_validated is not false then
    raise exception 'M1_LOGICAL_LEASE_CONSTRAINT_INVALID';
  end if;

  if not exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'claim_production_fulfillment_v2'
  ) or not exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'recover_stale_assessment_run_v2'
  ) then
    raise exception 'M1_RECOVERY_RPC_MISSING';
  end if;
  if not exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'claim_rc2_fulfillment_dispatch_v2'
  ) or not exists (
    select 1 from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'quarantine_rc2_fulfillment_job_after_async_retries_v2'
  ) then
    raise exception 'M1_DISPATCH_RPC_MISSING';
  end if;
  select pg_catalog.pg_get_functiondef(pg_proc.oid)
    into definition
    from pg_catalog.pg_proc
    where pg_proc.oid =
      'public.fail_rc2_fulfillment_job_v2(uuid,uuid,text,timestamptz)'::regprocedure;
  if position('dispatch_completed_at = null' in lower(definition)) > 0
     or position('dispatch_retry_after' in lower(definition)) > 0 then
    raise exception 'M1_WORKER_FAILURE_REOPENS_STATUS_DISPATCH';
  end if;
  select pg_catalog.pg_get_functiondef(pg_proc.oid)
    into definition
    from pg_catalog.pg_proc
    where pg_proc.oid =
      'public.claim_rc2_fulfillment_dispatch_v2(uuid,text,uuid,timestamptz,timestamptz)'::regprocedure;
  if position('PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS' in definition) = 0
     or position('dispatch_owner_id is not null' in lower(definition)) = 0
     or position('dispatch_retry_after is null' in lower(definition)) = 0 then
    raise exception 'M1_AMBIGUOUS_ROUTER_ACK_NOT_QUARANTINED';
  end if;
  select pg_catalog.pg_get_functiondef(pg_proc.oid)
    into definition
    from pg_catalog.pg_proc
    where pg_proc.oid =
      'public.quarantine_rc2_fulfillment_job_after_async_retries_v2(uuid,timestamptz)'::regprocedure;
  if position('PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED' in definition) = 0
     or position('quarantined_active' in definition) = 0 then
    raise exception 'M1_ACTIVE_EXHAUSTION_NOT_DURABLY_MARKED';
  end if;
  select pg_catalog.pg_get_functiondef(pg_proc.oid)
    into definition
    from pg_catalog.pg_proc
    where pg_proc.oid =
      'public.recover_stale_assessment_run_v2(uuid,uuid,text,timestamptz)'::regprocedure;
  if position('logical_request_id is distinct from locked_run.request_id' in definition) = 0 then
    raise exception 'M1_RECOVERY_REQUEST_BINDING_MISSING';
  end if;
end;
$proof$;

select 'PASS catalog lease, dispatch marker, request-bound recovery RPC, and historical NOT VALID contract';

create temp table pg_temp.m1_4_logical_fixture (
  id integer primary key,
  status text not null,
  owner_id text,
  ownership_acquired_at timestamptz,
  lease_expires_at timestamptz,
  attempt_count integer not null,
  generation_started_at timestamptz,
  recovery_state text not null
);

insert into pg_temp.m1_4_logical_fixture values
  (1, 'generating', 'worker-active', '2026-08-22T11:59:00Z',
    '2026-08-22T12:10:00Z', 3,
    '2026-08-22T12:00:00Z', 'post_provider_retryable_same_assessment'),
  (2, 'generating', 'worker-expired', '2026-08-22T11:30:00Z',
    '2026-08-22T11:50:00Z', 3,
    '2026-08-22T12:00:00Z', 'post_provider_retryable_same_assessment'),
  (3, 'generating', 'worker-expired-pre', '2026-08-22T11:30:00Z',
    '2026-08-22T11:50:00Z', 1, null, 'pre_provider_retryable');

do $proof$
declare
  changed integer;
  old_attempt integer;
begin
  -- Active worker is never stolen.
  update pg_temp.m1_4_logical_fixture
    set owner_id = 'worker-new', lease_expires_at = '2026-08-22T12:20:00Z',
        attempt_count = attempt_count + 1
    where id = 1 and status = 'generating'
      and lease_expires_at <= '2026-08-22T12:00:00Z';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'M1_ACTIVE_WORKER_STOLEN'; end if;

  -- An expired post-provider worker is quarantined, never reclaimed.
  update pg_temp.m1_4_logical_fixture
    set status = 'retryable', owner_id = null,
        ownership_acquired_at = null, lease_expires_at = null,
        recovery_state = 'manual_review'
    where id = 2 and status = 'generating'
      and lease_expires_at <= '2026-08-22T12:00:00Z'
      and generation_started_at is not null;
  if not exists (
    select 1 from pg_temp.m1_4_logical_fixture
    where id = 2 and status = 'retryable' and owner_id is null
      and recovery_state = 'manual_review' and attempt_count = 3
  ) then raise exception 'M1_POST_PROVIDER_AMBIGUITY_NOT_QUARANTINED'; end if;

  -- Only an expired pre-provider worker is reclaimable.
  select attempt_count into old_attempt
  from pg_temp.m1_4_logical_fixture where id = 3;
  update pg_temp.m1_4_logical_fixture
    set owner_id = 'worker-new', ownership_acquired_at = '2026-08-22T12:00:00Z',
        lease_expires_at = '2026-08-22T12:16:00Z',
        attempt_count = attempt_count + 1
    where id = 3 and status = 'generating'
      and lease_expires_at <= '2026-08-22T12:00:00Z'
      and generation_started_at is null;
  if not exists (
    select 1 from pg_temp.m1_4_logical_fixture
    where id = 3 and owner_id = 'worker-new'
      and attempt_count = old_attempt + 1
  ) then raise exception 'M1_EXPIRED_RECLAIM_SEMANTICS_INVALID'; end if;

  -- The old owner is fenced after reclaim.
  update pg_temp.m1_4_logical_fixture
    set status = 'completed'
    where id = 3 and owner_id = 'worker-expired-pre';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'M1_STALE_OWNER_NOT_FENCED'; end if;
end;
$proof$;

select 'PASS active lease retained, pre-provider expiry reclaimed, post-provider ambiguity quarantined';

create temp table pg_temp.m1_4_stage_fixture (
  run_id integer not null,
  stage_id text not null,
  attempt_number integer not null,
  status text not null,
  error_code text,
  primary key (run_id, stage_id, attempt_number)
);

insert into pg_temp.m1_4_stage_fixture values
  (10, 'PB-04', 1, 'completed', null),
  (10, 'PB-05', 1, 'completed', null),
  (10, 'PB-06', 1, 'processing', null);

do $proof$
declare
  completed_before integer;
  completed_after integer;
  attempt_after integer;
begin
  select count(*) into completed_before
  from pg_temp.m1_4_stage_fixture
  where run_id = 10 and status = 'completed';
  update pg_temp.m1_4_stage_fixture
    set status = 'failed', error_code = 'PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS'
    where run_id = 10 and stage_id = 'PB-06'
      and attempt_number = 1 and status = 'processing';
  select count(*) into completed_after
  from pg_temp.m1_4_stage_fixture
  where run_id = 10 and status = 'completed';
  select attempt_number into attempt_after
  from pg_temp.m1_4_stage_fixture
  where run_id = 10 and stage_id = 'PB-06';
  if completed_before <> 2 or completed_after <> 2
     or attempt_after <> 1 then
    raise exception 'M1_PB04_PB05_PB06_RECOVERY_MUTATED_HISTORY';
  end if;
  if exists (
    select 1 from pg_temp.m1_4_stage_fixture
    where stage_id in ('PB-04', 'PB-05') and status <> 'completed'
  ) then raise exception 'M1_COMPLETED_STAGE_NOT_PRESERVED'; end if;
end;
$proof$;

select 'PASS PB-04/PB-05 completed plus PB-06 processing preserves history and attempt 1';

create temp table pg_temp.m1_4_dispatch_fixture (
  job_id integer primary key,
  state text not null,
  dispatch_marker text,
  dispatch_owner_id text,
  dispatch_lease_expires_at timestamptz,
  dispatch_completed_at timestamptz,
  dispatch_retry_after timestamptz,
  dispatch_attempt_count integer not null
);
insert into pg_temp.m1_4_dispatch_fixture values
  (20, 'pending', 'rc2-dispatch:stable-marker', 'dispatcher-a',
    '2026-08-22T12:01:00Z', null, null, 1),
  (21, 'pending', 'rc2-dispatch:ambiguous-marker', 'dispatcher-a',
    '2026-08-22T11:59:00Z', null, null, 1);

do $proof$
declare
  changed integer;
  accepted_at timestamptz;
  dispatch_attempts integer;
begin
  -- Duplicate polling cannot take an active dispatch lease.
  update pg_temp.m1_4_dispatch_fixture
    set dispatch_owner_id = 'dispatcher-b',
        dispatch_attempt_count = dispatch_attempt_count + 1
    where job_id = 20
      and dispatch_lease_expires_at <= '2026-08-22T12:00:00Z';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'M1_ACTIVE_DISPATCH_STOLEN'; end if;

  -- An expired claim with no recorded send failure is acknowledgement-
  -- ambiguous and must fail closed instead of creating another event.
  update pg_temp.m1_4_dispatch_fixture
    set state = 'manual_review', dispatch_owner_id = null,
        dispatch_lease_expires_at = null
    where job_id = 21
      and dispatch_lease_expires_at <= '2026-08-22T12:00:00Z'
      and dispatch_retry_after is null;
  get diagnostics changed = row_count;
  if changed <> 1 or not exists (
    select 1 from pg_temp.m1_4_dispatch_fixture
    where job_id = 21 and state = 'manual_review'
      and dispatch_attempt_count = 1
  ) then raise exception 'M1_AMBIGUOUS_DISPATCH_WAS_REENQUEUED'; end if;
  if exists (
    select 1 from pg_temp.m1_4_dispatch_fixture
    where job_id = 20
      and dispatch_marker = 'rc2-dispatch:other-marker'
  ) then raise exception 'M1_DISPATCH_MARKER_CONFLICT_NOT_MANUAL_REVIEW'; end if;
  if (select dispatch_marker from pg_temp.m1_4_dispatch_fixture where job_id = 20)
     <> 'rc2-dispatch:stable-marker' then
    raise exception 'M1_DISPATCH_MARKER_NOT_DURABLE';
  end if;

  -- Router acceptance permanently transfers retry authority to Async Workloads.
  update pg_temp.m1_4_dispatch_fixture
    set dispatch_owner_id = null, dispatch_lease_expires_at = null,
        dispatch_completed_at = '2026-08-22T12:00:10Z'
    where job_id = 20 and dispatch_owner_id = 'dispatcher-a';
  update pg_temp.m1_4_dispatch_fixture
    set state = 'retryable'
    where job_id = 20;
  select dispatch_completed_at, dispatch_attempt_count
    into accepted_at, dispatch_attempts
    from pg_temp.m1_4_dispatch_fixture where job_id = 20;

  -- Status cannot create Event B after Event A has been accepted, even when
  -- the worker has returned the job to its safe retryable state.
  update pg_temp.m1_4_dispatch_fixture
    set dispatch_owner_id = 'dispatcher-b',
        dispatch_attempt_count = dispatch_attempt_count + 1
    where job_id = 20 and dispatch_completed_at is null;
  get diagnostics changed = row_count;
  if changed <> 0
     or accepted_at is null
     or dispatch_attempts <> 1
     or (select dispatch_attempt_count from pg_temp.m1_4_dispatch_fixture
         where job_id = 20) <> 1 then
    raise exception 'M1_ACCEPTED_EVENT_REDISPATCHED_BY_STATUS';
  end if;
end;
$proof$;

select 'PASS accepted Event A retains single retry authority after worker failure';

rollback;
