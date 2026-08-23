\set ON_ERROR_STOP on
\pset tuples_only on

-- Run on a disposable local database after the exact 0002..0017 lineage,
-- with m1_4_background_fulfillment_expand_legacy_seed_r1.sql loaded before
-- 0016. Every mutation in this sequential proof is rolled back.
begin;

do $proof$
declare
  before_row jsonb;
  after_row jsonb;
  before_request jsonb;
  after_request jsonb;
  before_effects jsonb;
  after_effects jsonb;
  result jsonb;
begin
  select to_jsonb(logical) into before_row
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000011';
  select to_jsonb(request_row) into before_request
    from public.assessment_requests request_row
    where id = '11000000-0000-4000-8000-000000000011';
  select jsonb_build_object(
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000011'),
    'credentials', (select count(*) from public.production_result_credentials),
    'notifications', (select count(*) from public.production_notification_outbox)
  ) into before_effects;

  begin
    perform public.claim_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000011', null,
      '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_LOGICAL_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_LEASE_INVALID' then raise; end if;
  end;
  begin
    perform public.claim_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000011',
      'ba000000-0000-4000-8000-000000000011', null,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_LOGICAL_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_LEASE_INVALID' then raise; end if;
  end;
  begin
    perform public.claim_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000011',
      'ba000000-0000-4000-8000-000000000011',
      '2026-08-23T00:20:00Z', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_EXPIRED_LOGICAL_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_LEASE_INVALID' then raise; end if;
  end;

  select to_jsonb(logical) into after_row
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000011';
  select to_jsonb(request_row) into after_request
    from public.assessment_requests request_row
    where id = '11000000-0000-4000-8000-000000000011';
  select jsonb_build_object(
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000011'),
    'credentials', (select count(*) from public.production_result_credentials),
    'notifications', (select count(*) from public.production_notification_outbox)
  ) into after_effects;
  if after_row is distinct from before_row
     or after_request is distinct from before_request
     or after_effects is distinct from before_effects then
    raise exception 'M2_A1_INVALID_LOGICAL_CLAIM_LEFT_SIDE_EFFECT';
  end if;

  result := public.claim_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000011',
    'ba000000-0000-4000-8000-000000000011',
    '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
  );
  if result ->> 'disposition' <> 'acquired'
     or not exists (
       select 1 from public.production_logical_assessments
       where id = '51000000-0000-4000-8000-000000000011'
         and status = 'generating'
         and owner_id = 'ba000000-0000-4000-8000-000000000011'
         and lease_expires_at = '2026-08-23T00:40:00Z'
         and attempt_count = 1
  ) then
    raise exception 'M2_A1_VALID_LOGICAL_CLAIM_FAILED:%', result;
  end if;

  select to_jsonb(logical) into before_row
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000011';
  begin
    perform public.heartbeat_production_fulfillment_v2(
      '51000000-0000-4000-8000-000000000011',
      'ba000000-0000-4000-8000-000000000011', null,
      '2026-08-23T00:21:00Z'
    );
    raise exception 'M2_A1_NULL_LOGICAL_HEARTBEAT_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_LEASE_CONFLICT' then raise; end if;
  end;
  select to_jsonb(logical) into after_row
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000011';
  if after_row is distinct from before_row then
    raise exception 'M2_A1_NULL_LOGICAL_HEARTBEAT_LEFT_SIDE_EFFECT';
  end if;
end;
$proof$;

select 'PASS logical claim rejects NULL/expired before mutation and accepts one valid live fence';

do $proof$
declare
  before_logical jsonb;
  after_logical jsonb;
  before_grant jsonb;
  after_grant jsonb;
  before_effects jsonb;
  after_effects jsonb;
begin
  update public.production_logical_assessments set
    owner_id = 'a1000000-0000-4000-8000-000000000001',
    ownership_acquired_at = '2026-08-23T00:10:00Z',
    generation_started_at = '2026-08-23T00:11:00Z',
    lease_expires_at = '2026-08-23T00:40:00Z',
    updated_at = '2026-08-23T00:11:00Z'
    where id = '51000000-0000-4000-8000-000000000001';

  select to_jsonb(logical) into before_logical
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000001';
  select to_jsonb(grant_row) into before_grant
    from public.production_assessment_grants grant_row
    where id = '41000000-0000-4000-8000-000000000001';
  select jsonb_build_object(
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000001'),
    'credentials', (select count(*) from public.production_result_credentials),
    'notifications', (select count(*) from public.production_notification_outbox)
  ) into before_effects;

  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001', null,
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000001', '{}'::jsonb, repeat('1', 64),
      '92000000-0000-4000-8000-000000000001', repeat('2', 64),
      'a2000000-0000-4000-8000-000000000001', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_COMPLETION_CALLER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;

  -- The validated owner CHECK and the historical NOT VALID lease-owner CHECK
  -- both make this state catalog-infeasible for new writes. Drop them only
  -- inside this exception subtransaction to prove the RPC's own explicit
  -- stored-owner fence; the function error rolls both DDL changes and the
  -- fixture back.
  begin
    alter table public.production_logical_assessments
      drop constraint production_logical_assessments_owner;
    alter table public.production_logical_assessments
      drop constraint production_logical_assessments_lease_owner;
    update public.production_logical_assessments set owner_id = null
      where id = '51000000-0000-4000-8000-000000000001';
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000002', '{}'::jsonb, repeat('1', 64),
      '92000000-0000-4000-8000-000000000002', repeat('2', 64),
      'a2000000-0000-4000-8000-000000000002', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_STORED_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.production_logical_assessments'::regclass
      and conname = 'production_logical_assessments_owner'
      and convalidated
  ) or not exists (
    select 1 from pg_catalog.pg_constraint
    where conrelid = 'public.production_logical_assessments'::regclass
      and conname = 'production_logical_assessments_lease_owner'
      and not convalidated
  ) then
    raise exception 'M2_A1_TEST_ONLY_OWNER_CONSTRAINTS_NOT_RESTORED';
  end if;

  update public.production_logical_assessments set lease_expires_at = null
    where id = '51000000-0000-4000-8000-000000000001';
  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000003', '{}'::jsonb, repeat('1', 64),
      '92000000-0000-4000-8000-000000000003', repeat('2', 64),
      'a2000000-0000-4000-8000-000000000003', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_STORED_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  update public.production_logical_assessments set lease_expires_at = '2026-08-23T00:40:00Z'
    where id = '51000000-0000-4000-8000-000000000001';

  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000099',
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000004', '{}'::jsonb, repeat('1', 64),
      '92000000-0000-4000-8000-000000000004', repeat('2', 64),
      'a2000000-0000-4000-8000-000000000004', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_MISMATCHED_COMPLETION_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000005', '{}'::jsonb, repeat('1', 64),
      '92000000-0000-4000-8000-000000000005', repeat('2', 64),
      'a2000000-0000-4000-8000-000000000005', '2026-08-23T00:40:00Z'
    );
    raise exception 'M2_A1_EXPIRED_COMPLETION_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  begin
    perform public.fail_production_fulfillment_v2(
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000099',
      'SYNTHETIC_MISMATCH', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_MISMATCHED_FAILURE_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  begin
    perform public.fail_production_fulfillment_v2(
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      'SYNTHETIC_EXPIRED', '2026-08-23T00:40:00Z'
    );
    raise exception 'M2_A1_EXPIRED_FAILURE_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;

  select to_jsonb(logical) into after_logical
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000001';
  select to_jsonb(grant_row) into after_grant
    from public.production_assessment_grants grant_row
    where id = '41000000-0000-4000-8000-000000000001';
  select jsonb_build_object(
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000001'),
    'credentials', (select count(*) from public.production_result_credentials),
    'notifications', (select count(*) from public.production_notification_outbox)
  ) into after_effects;
  if after_logical is distinct from before_logical
     or after_grant is distinct from before_grant
     or after_effects is distinct from before_effects then
    raise exception 'M2_A1_INVALID_COMPLETION_OR_FAILURE_LEFT_SIDE_EFFECT';
  end if;

  perform public.complete_production_fulfillment_v2(
    '41000000-0000-4000-8000-000000000001',
    '51000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    '61000000-0000-4000-8000-000000000001',
    '82000000-0000-4000-8000-000000000010',
    '{"schemaVersion":"m2-a1-proof-v1"}'::jsonb, repeat('1', 64),
    '92000000-0000-4000-8000-000000000010', repeat('2', 64),
    'a2000000-0000-4000-8000-000000000010', '2026-08-23T00:20:00Z'
  );
  if not exists (
    select 1 from public.production_logical_assessments
    where id = '51000000-0000-4000-8000-000000000001'
      and status = 'completed' and owner_id is null and lease_expires_at is null
  ) or not exists (
    select 1 from public.production_assessment_grants
    where id = '41000000-0000-4000-8000-000000000001' and status = 'completed'
  ) or (select count(*) from public.production_customer_deliveries
    where logical_assessment_id = '51000000-0000-4000-8000-000000000001') <> 1
    or (select count(*) from public.production_result_credentials
      where delivery_id = '82000000-0000-4000-8000-000000000010'
        and purpose = 'customer_handoff') <> 1
    or (select count(*) from public.production_notification_outbox
      where delivery_id = '82000000-0000-4000-8000-000000000010') <> 1 then
    raise exception 'M2_A1_VALID_COMPLETION_SIDE_EFFECT_SET_INVALID';
  end if;

  select jsonb_build_object(
    'logical', (select to_jsonb(logical) from public.production_logical_assessments logical
      where id = '51000000-0000-4000-8000-000000000001'),
    'grant', (select to_jsonb(grant_row) from public.production_assessment_grants grant_row
      where id = '41000000-0000-4000-8000-000000000001'),
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000001'),
    'credentials', (select count(*) from public.production_result_credentials
      where delivery_id = '82000000-0000-4000-8000-000000000010'),
    'notifications', (select count(*) from public.production_notification_outbox
      where delivery_id = '82000000-0000-4000-8000-000000000010')
  ) into before_effects;
  begin
    perform public.complete_production_fulfillment_v2(
      '41000000-0000-4000-8000-000000000001',
      '51000000-0000-4000-8000-000000000001',
      'a1000000-0000-4000-8000-000000000001',
      '61000000-0000-4000-8000-000000000001',
      '82000000-0000-4000-8000-000000000011', '{}'::jsonb, repeat('3', 64),
      '92000000-0000-4000-8000-000000000011', repeat('4', 64),
      'a2000000-0000-4000-8000-000000000011', '2026-08-23T00:20:01Z'
    );
    raise exception 'M2_A1_COMPLETION_REPLAY_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_FULFILLMENT_STATE_CONFLICT' then raise; end if;
  end;
  select jsonb_build_object(
    'logical', (select to_jsonb(logical) from public.production_logical_assessments logical
      where id = '51000000-0000-4000-8000-000000000001'),
    'grant', (select to_jsonb(grant_row) from public.production_assessment_grants grant_row
      where id = '41000000-0000-4000-8000-000000000001'),
    'deliveries', (select count(*) from public.production_customer_deliveries
      where logical_assessment_id = '51000000-0000-4000-8000-000000000001'),
    'credentials', (select count(*) from public.production_result_credentials
      where delivery_id = '82000000-0000-4000-8000-000000000010'),
    'notifications', (select count(*) from public.production_notification_outbox
      where delivery_id = '82000000-0000-4000-8000-000000000010')
  ) into after_effects;
  if after_effects is distinct from before_effects then
    raise exception 'M2_A1_COMPLETION_REPLAY_LEFT_SIDE_EFFECT';
  end if;
end;
$proof$;

select 'PASS completion NULL/mismatch/expiry fences are atomic; valid completes once; replay is closed';

do $proof$
declare
  before_row jsonb;
  after_row jsonb;
  result jsonb;
begin
  update public.production_notification_outbox set
    status = 'pending', owner_id = null, processing_started_at = null,
    lease_expires_at = null, attempt_count = 0, provider_message_reference = null,
    last_error_code = null, updated_at = '2026-08-23T00:10:00Z'
    where id = '91000000-0000-4000-8000-000000000005';
  select to_jsonb(notification) into before_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  begin
    perform public.claim_production_notification_v2(
      '91000000-0000-4000-8000-000000000005', null,
      '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_NOTIFICATION_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_LEASE_INVALID' then raise; end if;
  end;
  begin
    perform public.claim_production_notification_v2(
      '91000000-0000-4000-8000-000000000005',
      'bb000000-0000-4000-8000-000000000005', null,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_NOTIFICATION_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_LEASE_INVALID' then raise; end if;
  end;
  begin
    perform public.claim_production_notification_v2(
      '91000000-0000-4000-8000-000000000005',
      'bb000000-0000-4000-8000-000000000005',
      '2026-08-23T00:20:00Z', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_EXPIRED_NOTIFICATION_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_LEASE_INVALID' then raise; end if;
  end;
  select to_jsonb(notification) into after_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  if after_row is distinct from before_row then
    raise exception 'M2_A1_INVALID_NOTIFICATION_CLAIM_LEFT_SIDE_EFFECT';
  end if;

  result := public.claim_production_notification_v2(
    '91000000-0000-4000-8000-000000000005',
    'bb000000-0000-4000-8000-000000000005',
    '2026-08-23T00:40:00Z', '2026-08-23T00:20:00Z'
  );
  if result ->> 'disposition' <> 'acquired'
     or not exists (
       select 1 from public.production_notification_outbox
       where id = '91000000-0000-4000-8000-000000000005'
         and status = 'processing'
         and owner_id = 'bb000000-0000-4000-8000-000000000005'
         and lease_expires_at = '2026-08-23T00:40:00Z'
         and attempt_count = 1
  ) then
    raise exception 'M2_A1_VALID_NOTIFICATION_CLAIM_FAILED:%', result;
  end if;

  select to_jsonb(notification) into before_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  begin
    perform public.heartbeat_production_notification_v2(
      '91000000-0000-4000-8000-000000000005',
      'bb000000-0000-4000-8000-000000000005', null,
      '2026-08-23T00:21:00Z'
    );
    raise exception 'M2_A1_NULL_NOTIFICATION_HEARTBEAT_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_LEASE_CONFLICT' then raise; end if;
  end;
  select to_jsonb(notification) into after_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  if after_row is distinct from before_row then
    raise exception 'M2_A1_NULL_NOTIFICATION_HEARTBEAT_LEFT_SIDE_EFFECT';
  end if;

  select to_jsonb(notification) into before_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  begin
    perform public.complete_production_notification_v2(
      '91000000-0000-4000-8000-000000000005',
      'bb000000-0000-4000-8000-000000000099', 'synthetic-provider-ref',
      '2026-08-23T00:21:00Z'
    );
    raise exception 'M2_A1_MISMATCHED_NOTIFICATION_COMPLETE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' then raise; end if;
  end;
  begin
    perform public.fail_production_notification_v2(
      '91000000-0000-4000-8000-000000000005',
      'bb000000-0000-4000-8000-000000000005', 'SYNTHETIC_EXPIRED',
      '2026-08-23T00:40:00Z'
    );
    raise exception 'M2_A1_EXPIRED_NOTIFICATION_FAILURE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' then raise; end if;
  end;
  select to_jsonb(notification) into after_row
    from public.production_notification_outbox notification
    where id = '91000000-0000-4000-8000-000000000005';
  if after_row is distinct from before_row then
    raise exception 'M2_A1_INVALID_NOTIFICATION_FINALIZE_LEFT_SIDE_EFFECT';
  end if;

  update public.production_notification_outbox set
    lease_expires_at = '2026-08-23T00:19:00Z', updated_at = '2026-08-23T00:19:00Z'
    where id = '91000000-0000-4000-8000-000000000005';
  result := public.claim_production_notification_v2(
    '91000000-0000-4000-8000-000000000005',
    'bb000000-0000-4000-8000-000000000055',
    '2026-08-23T00:50:00Z', '2026-08-23T00:20:00Z'
  );
  if result ->> 'disposition' <> 'reclaimed'
     or not exists (
       select 1 from public.production_notification_outbox
       where id = '91000000-0000-4000-8000-000000000005'
         and owner_id = 'bb000000-0000-4000-8000-000000000055'
         and lease_expires_at = '2026-08-23T00:50:00Z'
         and attempt_count = 2
     ) then
    raise exception 'M2_A1_NOTIFICATION_RECLAIM_CHANGED:%', result;
  end if;
end;
$proof$;

select 'PASS notification claim is atomic for NULL/expired and preserves valid acquire/reclaim semantics';

do $proof$
declare
  before_job jsonb;
  after_job jsonb;
  before_logical jsonb;
  after_logical jsonb;
begin
  -- Rejected M2-0 hypothesis: NULL job lease remains constraint-closed.
  select to_jsonb(job) into before_job from public.production_fulfillment_jobs job
    where id = 'e1000000-0000-4000-8000-000000000010';
  begin
    perform public.claim_rc2_fulfillment_job_by_id_v2(
      'e1000000-0000-4000-8000-000000000010',
      'bc000000-0000-4000-8000-000000000010', null,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_JOB_LEASE_ACCEPTED';
  exception when check_violation then null;
  end;
  select to_jsonb(job) into after_job from public.production_fulfillment_jobs job
    where id = 'e1000000-0000-4000-8000-000000000010';
  if after_job is distinct from before_job then
    raise exception 'M2_A1_NULL_JOB_LEASE_LEFT_SIDE_EFFECT';
  end if;

  -- Rejected M2-0 hypothesis: NULL dispatch lease remains constraint-closed.
  begin
    perform public.claim_rc2_fulfillment_dispatch_v2(
      'e1000000-0000-4000-8000-000000000010',
      'rc2-dispatch:e1000000-0000-4000-8000-000000000010',
      'bd000000-0000-4000-8000-000000000010', null,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_DISPATCH_LEASE_ACCEPTED';
  exception when check_violation then null;
  end;
  select to_jsonb(job) into after_job from public.production_fulfillment_jobs job
    where id = 'e1000000-0000-4000-8000-000000000010';
  if after_job is distinct from before_job then
    raise exception 'M2_A1_NULL_DISPATCH_LEASE_LEFT_SIDE_EFFECT';
  end if;

  -- Rejected M2-0 hypothesis: a NULL returned model remains RPC-closed.
  select to_jsonb(logical) into before_logical
    from public.assessment_runs logical
    where id = '61000000-0000-4000-8000-000000000003';
  begin
    perform public.finalize_completed_assessment(
      '73000000-0000-4000-8000-000000000003',
      '61000000-0000-4000-8000-000000000003',
      '11000000-0000-4000-8000-000000000003', null, 'reply_now',
      '{}'::jsonb, '{}'::jsonb, 0, 0, 0, 0, 0,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_RETURNED_MODEL_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'M2_FINALIZATION_MODEL_REQUIRED' then raise; end if;
  end;
  select to_jsonb(logical) into after_logical
    from public.assessment_runs logical
    where id = '61000000-0000-4000-8000-000000000003';
  if after_logical is distinct from before_logical
     or exists (select 1 from public.assessment_reports
       where id = '73000000-0000-4000-8000-000000000003') then
    raise exception 'M2_A1_NULL_RETURNED_MODEL_LEFT_SIDE_EFFECT';
  end if;

  -- Rejected M2-0 hypothesis: active ownership cannot contain a NULL user.
  insert into public.production_customer_auth_continuations (
    id, preparation_id, continuation_token_hash, csrf_token_hash, flow_kind,
    state, expires_at, created_at, updated_at
  ) values (
    'c2000000-0000-4000-8000-000000000011',
    '21000000-0000-4000-8000-000000000011', repeat('c', 64), repeat('d', 64),
    'google', 'pending', '2026-08-23T00:30:00Z',
    '2026-08-23T00:10:00Z', '2026-08-23T00:10:00Z'
  );
  begin
    perform public.bind_production_preparation_to_customer_v1(
      'd2000000-0000-4000-8000-000000000011',
      'e2000000-0000-4000-8000-000000000011', repeat('c', 64), repeat('d', 64),
      null, repeat('e', 64), 'synthetic-ciphertext-value', 'synthetic-key-v1',
      'google_verified_identity', '2026-08-23T00:10:00Z',
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_CUSTOMER_USER_ACCEPTED';
  exception when check_violation then null;
  end;
  if exists (
    select 1 from public.production_customer_ownership_bindings
    where id = 'd2000000-0000-4000-8000-000000000011'
  ) or not exists (
    select 1 from public.production_customer_auth_continuations
    where id = 'c2000000-0000-4000-8000-000000000011' and state = 'pending'
  ) then
    raise exception 'M2_A1_NULL_CUSTOMER_USER_LEFT_SIDE_EFFECT';
  end if;

  -- Rejected generation-boundary owner/time/fence cases remain closed.
  update public.production_logical_assessments set
    lease_expires_at = '2026-08-23T00:40:00Z'
    where id = '51000000-0000-4000-8000-000000000002';
  select to_jsonb(logical) into before_logical
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000002';
  begin
    perform public.mark_production_generation_started_v2(
      '51000000-0000-4000-8000-000000000002', null,
      '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_NULL_MARK_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' then raise; end if;
  end;
  begin
    perform public.mark_production_generation_started_v2(
      '51000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000002', null
    );
    raise exception 'M2_A1_NULL_MARK_TIME_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' then raise; end if;
  end;
  begin
    perform public.mark_production_generation_started_v2(
      '51000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000099', '2026-08-23T00:20:00Z'
    );
    raise exception 'M2_A1_MISMATCHED_MARK_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' then raise; end if;
  end;
  begin
    perform public.mark_production_generation_started_v2(
      '51000000-0000-4000-8000-000000000002',
      'a1000000-0000-4000-8000-000000000002', '2026-08-23T00:40:00Z'
    );
    raise exception 'M2_A1_EXPIRED_MARK_LEASE_ACCEPTED';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'PRODUCTION_GENERATION_BOUNDARY_CONFLICT' then raise; end if;
  end;
  select to_jsonb(logical) into after_logical
    from public.production_logical_assessments logical
    where id = '51000000-0000-4000-8000-000000000002';
  if after_logical is distinct from before_logical then
    raise exception 'M2_A1_INVALID_GENERATION_MARK_LEFT_SIDE_EFFECT';
  end if;
end;
$proof$;

select 'PASS rejected NULL job/dispatch/customer/model and generation-boundary hypotheses remain closed';

rollback;
select 'M2-A1 SEQUENTIAL NULL FENCE INTEGRITY PASS';
