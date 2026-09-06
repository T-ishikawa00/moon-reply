begin;

-- F005 correction only: preserve the existing RPC signature, owner, ACLs,
-- table/schema and legacy intake authority. Historical 0028 is immutable.
-- Move global request debit after per-IP policy/request checks, so traffic
-- already refused by its IP limit cannot exhaust unrelated IP capacity.
create or replace function public.begin_production_prepayment_intake_v2(
  p_preparation_id uuid,
  p_request_id uuid,
  p_idempotency_key_hash text,
  p_consultation_snapshot_sha256 text,
  p_consultation_snapshot_json jsonb,
  p_safety_authority_json jsonb,
  p_current_situation text,
  p_optional_message text,
  p_relationship text,
  p_requested_topics jsonb,
  p_execution_capability_hash text,
  p_now timestamptz,
  p_ip_identity_hash text,
  p_window_seconds integer,
  p_maximum_requests_per_ip integer,
  p_maximum_requests_global integer,
  p_maximum_intakes_per_ip integer,
  p_maximum_intakes_global integer
) returns jsonb
language plpgsql security definer set search_path = '' set lock_timeout = '2s'
as $function$
declare
  instant timestamptz;
  global_bucket public.anonymous_intake_admission_buckets%rowtype;
  ip_bucket public.anonymous_intake_admission_buckets%rowtype;
  existing public.production_preparations%rowtype;
  result jsonb;
  expiry timestamptz;
begin
  if p_preparation_id is null or p_request_id is null or p_now is null
    or p_ip_identity_hash is null or p_ip_identity_hash !~ '^[0-9a-f]{64}$'
    or p_idempotency_key_hash is null or p_idempotency_key_hash !~ '^[0-9a-f]{64}$'
    or p_consultation_snapshot_sha256 is null or p_consultation_snapshot_sha256 !~ '^[0-9a-f]{64}$'
    or p_execution_capability_hash is null or p_execution_capability_hash !~ '^[0-9a-f]{64}$'
    or p_window_seconds is null or p_window_seconds not between 60 and 3600
    or p_maximum_requests_per_ip is null or p_maximum_requests_per_ip not between 2 and 1000000
    or p_maximum_requests_global is null or p_maximum_requests_global not between p_maximum_requests_per_ip and 1000000
    or p_maximum_intakes_per_ip is null or p_maximum_intakes_per_ip not between 1 and p_maximum_requests_per_ip
    or p_maximum_intakes_global is null or p_maximum_intakes_global not between p_maximum_intakes_per_ip and p_maximum_requests_global then
    raise exception 'ANONYMOUS_ADMISSION_INPUT_INVALID' using errcode = 'P0001';
  end if;

  -- One lock order, including the initially absent global row. The legacy key
  -- lock below also serializes overlap with old app instances during expansion.
  perform pg_catalog.pg_advisory_xact_lock(28005, 1);
  instant := clock_timestamp();
  insert into public.anonymous_intake_admission_buckets as b
    (scope, identity_hash, window_started_at, expires_at, window_seconds,
      maximum_requests, maximum_intakes, request_count, intake_count)
    values ('global', 'global-v1', instant, instant + p_window_seconds * interval '1 second',
      p_window_seconds, p_maximum_requests_global, p_maximum_intakes_global, 0, 0)
    on conflict (scope, identity_hash) do update set
      window_started_at = excluded.window_started_at, expires_at = excluded.expires_at,
      window_seconds = excluded.window_seconds, maximum_requests = excluded.maximum_requests,
      maximum_intakes = excluded.maximum_intakes, request_count = 0, intake_count = 0
    where b.expires_at <= instant;
  select * into global_bucket from public.anonymous_intake_admission_buckets
    where scope = 'global' and identity_hash = 'global-v1' for update;
  if global_bucket.window_seconds <> p_window_seconds
    or global_bucket.maximum_requests <> p_maximum_requests_global
    or global_bucket.maximum_intakes <> p_maximum_intakes_global then
    return jsonb_build_object('admission_disposition', 'configuration_mismatch', 'retry_after_seconds', 0, 'intake', null);
  end if;

  -- Cleanup does not extend windows or delete consultations. Even exhausted
  -- traffic may retire old IP counters, without allocating new identity rows.
  with expired as (
    select scope, identity_hash from public.anonymous_intake_admission_buckets
      where scope = 'ip' and expires_at <= instant order by expires_at limit 100 for update skip locked
  ) delete from public.anonymous_intake_admission_buckets b using expired e
    where b.scope = e.scope and b.identity_hash = e.identity_hash;
  if global_bucket.request_count >= p_maximum_requests_global then
    return jsonb_build_object('admission_disposition', 'request_limited', 'retry_after_seconds',
      greatest(1, least(p_window_seconds, ceil(extract(epoch from (global_bucket.expires_at - instant)))::integer)), 'intake', null);
  end if;

  insert into public.anonymous_intake_admission_buckets as b
    (scope, identity_hash, window_started_at, expires_at, window_seconds,
      maximum_requests, maximum_intakes, request_count, intake_count)
    values ('ip', p_ip_identity_hash, instant, instant + p_window_seconds * interval '1 second',
      p_window_seconds, p_maximum_requests_per_ip, p_maximum_intakes_per_ip, 0, 0)
    on conflict (scope, identity_hash) do update set
      window_started_at = excluded.window_started_at, expires_at = excluded.expires_at,
      window_seconds = excluded.window_seconds, maximum_requests = excluded.maximum_requests,
      maximum_intakes = excluded.maximum_intakes, request_count = 0, intake_count = 0
    where b.expires_at <= instant;
  select * into ip_bucket from public.anonymous_intake_admission_buckets
    where scope = 'ip' and identity_hash = p_ip_identity_hash for update;
  if ip_bucket.window_seconds <> p_window_seconds
    or ip_bucket.maximum_requests <> p_maximum_requests_per_ip
    or ip_bucket.maximum_intakes <> p_maximum_intakes_per_ip then
    return jsonb_build_object('admission_disposition', 'configuration_mismatch', 'retry_after_seconds', 0, 'intake', null);
  end if;
  if ip_bucket.request_count >= p_maximum_requests_per_ip then
    return jsonb_build_object('admission_disposition', 'request_limited', 'retry_after_seconds',
      greatest(1, least(p_window_seconds, ceil(extract(epoch from (ip_bucket.expires_at - instant)))::integer)), 'intake', null);
  end if;
  -- Exhausted or policy-mismatched IPs cannot debit other IPs' capacity.
  -- Keep the global cap check before IP allocation and both debits under
  -- the same global transaction lock; admitted/conflict/intake-limit attempts
  -- still consume both request budgets. No refund or window reset is added.
  update public.anonymous_intake_admission_buckets set request_count = request_count + 1
    where scope = 'global' and identity_hash = 'global-v1';
  update public.anonymous_intake_admission_buckets set request_count = request_count + 1
    where scope = 'ip' and identity_hash = p_ip_identity_hash;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key_hash, 0));
  select * into existing from public.production_preparations
    where idempotency_key_hash = p_idempotency_key_hash for update;
  if existing.id is not null and existing.consultation_snapshot_sha256 <> p_consultation_snapshot_sha256 then
    -- Return a conflict receipt so abusive conflicts still consume requests.
    return jsonb_build_object('admission_disposition', 'idempotency_conflict', 'retry_after_seconds', 0, 'intake', null);
  end if;
  if existing.id is null then
    if global_bucket.intake_count >= p_maximum_intakes_global or ip_bucket.intake_count >= p_maximum_intakes_per_ip then
      expiry := case when global_bucket.intake_count >= p_maximum_intakes_global then global_bucket.expires_at else ip_bucket.expires_at end;
      return jsonb_build_object('admission_disposition', 'intake_limited', 'retry_after_seconds',
        greatest(1, least(p_window_seconds, ceil(extract(epoch from (expiry - instant)))::integer)), 'intake', null);
    end if;
    update public.anonymous_intake_admission_buckets set intake_count = intake_count + 1
      where (scope = 'global' and identity_hash = 'global-v1') or (scope = 'ip' and identity_hash = p_ip_identity_hash);
  end if;

  -- Counter consumption and the unchanged intake authority are one transaction.
  -- Inner failure rolls back partial intake writes but conservatively retains
  -- consumed attempt reservations. Unknown responses are never refunded/reset.
  begin
    result := public.begin_production_prepayment_intake_v1(
      p_preparation_id, p_request_id, p_idempotency_key_hash,
      p_consultation_snapshot_sha256, p_consultation_snapshot_json,
      p_safety_authority_json, p_current_situation, p_optional_message,
      p_relationship, p_requested_topics, p_execution_capability_hash, p_now
    );
  exception when others then
    return jsonb_build_object('admission_disposition', 'unavailable', 'retry_after_seconds', 0, 'intake', null);
  end;
  return jsonb_build_object('admission_disposition', 'admitted', 'retry_after_seconds', 0, 'intake', result);
end;
$function$;

commit;
