-- F003 additive mode fence. Existing RPC signatures and migration bytes stay intact.
-- Exact claim logic is retained except required environment validation and
-- database selection predicates. No payment evidence/state authority changes.
begin;

create function public.claim_rc2_payment_reconciliation_batch_v2(
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz,
  p_not_newer_than timestamptz,
  p_limit integer,
  p_max_attempts integer,
  p_environment text
) returns table(
  payment_attempt_id uuid,
  provider_checkout_session_id text,
  reconciliation_attempt_count integer
)
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if p_owner_id is null
     or p_environment is null or p_environment not in ('test', 'live')
     or p_lease_expires_at is null
     or p_now is null
     or p_not_newer_than is null
     or p_lease_expires_at <= p_now
     or p_not_newer_than > p_now
     or p_limit is null
     or p_limit not between 1 and 8
     or p_max_attempts is null
     or p_max_attempts not between 1 and 20 then
    raise exception 'RC2_PAYMENT_RECONCILIATION_CLAIM_INVALID'
      using errcode = 'P0001';
  end if;

  -- A process that dies after its final allowed external read must not leave
  -- an immortal retry candidate. Expired final leases are stopped without
  -- performing another Stripe read.
  update public.production_payment_attempts as exhausted
  set reconciliation_owner_id = null,
      reconciliation_lease_expires_at = null,
      reconciliation_retry_after = null,
      reconciliation_stopped_at = p_now,
      reconciliation_last_error_code =
        'PAYMENT_RECONCILIATION_RETRY_EXHAUSTED',
      reconciliation_updated_at = p_now
  where exhausted.state in ('pending', 'processing', 'unknown')
    and exhausted.provider_checkout_session_id is not null
    and exhausted.reconciliation_stopped_at is null
    and exhausted.reconciliation_attempt_count >= p_max_attempts
    and (
      exhausted.reconciliation_owner_id is null
      or exhausted.reconciliation_lease_expires_at <= p_now
    )
    and exists (
      select 1
      from public.production_purchase_intents as intent
      where intent.id = exhausted.purchase_intent_id
        and intent.environment = p_environment
        and intent.current_payment_attempt_id = exhausted.id
        and intent.state in ('pending', 'processing', 'unknown')
    );

  return query
  with candidates as (
    select attempt.id
    from public.production_payment_attempts as attempt
    join public.production_purchase_intents as intent
      on intent.id = attempt.purchase_intent_id
    where attempt.state in ('pending', 'processing', 'unknown')
      and intent.environment = p_environment
      and attempt.provider_checkout_session_id is not null
      and attempt.updated_at <= p_not_newer_than
      and intent.current_payment_attempt_id = attempt.id
      and intent.state in ('pending', 'processing', 'unknown')
      and attempt.reconciliation_stopped_at is null
      and attempt.reconciliation_attempt_count < p_max_attempts
      and (
        attempt.reconciliation_retry_after is null
        or attempt.reconciliation_retry_after <= p_now
      )
      and (
        attempt.reconciliation_owner_id is null
        or attempt.reconciliation_lease_expires_at <= p_now
      )
    order by
      coalesce(attempt.reconciliation_retry_after, attempt.updated_at),
      attempt.id
    for update of attempt skip locked
    limit p_limit
  )
  update public.production_payment_attempts as claimed
  set reconciliation_owner_id = p_owner_id,
      reconciliation_lease_expires_at = p_lease_expires_at,
      reconciliation_retry_after = null,
      reconciliation_attempt_count =
        claimed.reconciliation_attempt_count + 1,
      reconciliation_last_error_code = null,
      reconciliation_updated_at = p_now
  from candidates
  where claimed.id = candidates.id
  returning
    claimed.id,
    claimed.provider_checkout_session_id,
    claimed.reconciliation_attempt_count;
end;
$function$;

create function public.claim_rc2_payment_reconciliation_followup_v2(
  p_owner_id uuid, p_now timestamptz, p_environment text
) returns table(payment_attempt_id uuid, provider_checkout_session_id text, reconciliation_attempt_count integer)
language plpgsql security invoker set search_path = '' as $function$
declare selected_id uuid;
begin
  if p_owner_id is null or p_now is null
    or p_environment is null or p_environment not in ('test', 'live') then
    raise exception 'RC2_PAYMENT_FOLLOWUP_CLAIM_INVALID' using errcode = 'P0001';
  end if;
  -- Old STOPPED/RETRY_EXHAUSTED records and final-read crashes have no proven
  -- transient provenance. Detect and notify them; do not reauthorize reads.
  insert into public.production_payment_reconciliation_followups (
    payment_attempt_id, short_stopped_at, short_error_code, status,
    first_observed_at, updated_at
  )
  select attempt.id, attempt.reconciliation_stopped_at,
    coalesce(attempt.reconciliation_last_error_code, 'PAYMENT_RECONCILIATION_STOP_CAUSE_UNKNOWN'),
    'blocked', p_now, p_now
  from public.production_payment_attempts as attempt
  join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
  where attempt.reconciliation_stopped_at is not null
    and intent.environment = p_environment
    and attempt.state in ('reserved', 'pending', 'processing', 'unknown')
    and not exists (select 1 from public.production_payment_reconciliation_followups as f where f.payment_attempt_id = attempt.id)
  order by attempt.reconciliation_stopped_at, attempt.id
  limit 100 on conflict on constraint production_payment_reconciliation_followups_pkey do nothing;

  -- Only existing durable terminal attempt state closes a tracking record.
  -- Manual review/supersession is blocked monitoring, never a new financial state.
  with candidates as (
    select f.payment_attempt_id, attempt.state as attempt_state,
      intent.current_payment_attempt_id, intent.state as intent_state
    from public.production_payment_reconciliation_followups as f
    join public.production_payment_attempts as attempt on attempt.id = f.payment_attempt_id
    join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
    where f.status <> 'resolved'
      and intent.environment = p_environment
      and (f.owner_id is null or f.lease_expires_at <= p_now)
      and (attempt.state in ('succeeded', 'failed', 'canceled')
        or (f.status <> 'blocked' and (intent.current_payment_attempt_id is distinct from attempt.id
          or intent.state not in ('pending', 'processing', 'unknown'))))
    order by f.updated_at, f.payment_attempt_id
    for update of f skip locked limit 100
  )
  update public.production_payment_reconciliation_followups as f
  set status = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then 'resolved' else 'blocked' end,
    next_check_at = null, owner_id = null, lease_expires_at = null,
    resolved_at = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then p_now else null end,
    last_error_code = case when c.attempt_state in ('succeeded', 'failed', 'canceled') then null else 'PAYMENT_RECONCILIATION_AUTHORITY_CHANGED' end,
    updated_at = p_now
  from candidates as c where f.payment_attempt_id = c.payment_attempt_id;

  perform 1 from public.production_payment_reconciliation_followup_clock
    where singleton and next_claim_at <= p_now for update skip locked;
  if not found then return; end if;
  select f.payment_attempt_id into selected_id
  from public.production_payment_reconciliation_followups as f
  join public.production_payment_attempts as attempt on attempt.id = f.payment_attempt_id
  join public.production_purchase_intents as intent on intent.id = attempt.purchase_intent_id
  where f.status in ('pending', 'processing') and f.next_check_at <= p_now
    and intent.environment = p_environment
    and (f.owner_id is null or f.lease_expires_at <= p_now)
    and attempt.state in ('pending', 'processing', 'unknown')
    and attempt.provider_checkout_session_id is not null
    and attempt.reconciliation_stopped_at is not null
    and intent.current_payment_attempt_id = attempt.id
    and intent.state in ('pending', 'processing', 'unknown')
  order by f.next_check_at, f.payment_attempt_id
  for update of f skip locked limit 1;
  if selected_id is null then return; end if;
  update public.production_payment_reconciliation_followup_clock set next_claim_at = p_now + interval '5 minutes' where singleton;
  return query
  update public.production_payment_reconciliation_followups as f
  set status = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_now + interval '24 seconds',
    -- Advance the durable due time before a read, so a crashed worker cannot
    -- make lease expiry into an immediate provider retry loop.
    next_check_at = p_now + pg_catalog.make_interval(secs =>
      least(86400, 3600 * pg_catalog.power(2, least(f.attempt_count, 5)))::double precision
      + (pg_catalog.get_byte(pg_catalog.decode(pg_catalog.md5(f.payment_attempt_id::text || ':' || f.attempt_count::text), 'hex'), 0) % 301)),
    attempt_count = f.attempt_count + 1, last_checked_at = p_now, updated_at = p_now
  from public.production_payment_attempts as attempt
  where f.payment_attempt_id = selected_id and attempt.id = f.payment_attempt_id
  returning f.payment_attempt_id, attempt.provider_checkout_session_id, f.attempt_count;
end;
$function$;

revoke all on function public.claim_rc2_payment_reconciliation_batch_v2(uuid,timestamptz,timestamptz,timestamptz,integer,integer,text),
  public.claim_rc2_payment_reconciliation_followup_v2(uuid,timestamptz,text)
  from public, anon, authenticated, m2_b2_stripe_ingress;
grant execute on function public.claim_rc2_payment_reconciliation_batch_v2(uuid,timestamptz,timestamptz,timestamptz,integer,integer,text),
  public.claim_rc2_payment_reconciliation_followup_v2(uuid,timestamptz,text) to service_role;

-- The existing singleton clock remains shared: at most one followup claim per
-- five-minute slot across all instances AND both Stripe environments.
commit;
