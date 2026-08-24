-- M2-B2-I2 private durable payment reconciliation authority.
-- Dispatch continues to use the accepted DB0016 marker/lease fence unchanged.

begin;

alter table public.production_payment_attempts
  add column reconciliation_owner_id uuid,
  add column reconciliation_lease_expires_at timestamptz,
  add column reconciliation_retry_after timestamptz,
  add column reconciliation_attempt_count integer not null default 0,
  add column reconciliation_last_error_code text,
  add column reconciliation_stopped_at timestamptz,
  add column reconciliation_updated_at timestamptz;

alter table public.production_payment_attempts
  add constraint production_payment_attempt_reconciliation_lease
  check (
    (reconciliation_owner_id is null
      and reconciliation_lease_expires_at is null)
    or (reconciliation_owner_id is not null
      and reconciliation_lease_expires_at is not null)
  ),
  add constraint production_payment_attempt_reconciliation_attempt_count
  check (reconciliation_attempt_count >= 0),
  add constraint production_payment_attempt_reconciliation_stopped
  check (
    reconciliation_stopped_at is null
    or (reconciliation_owner_id is null
      and reconciliation_lease_expires_at is null
      and reconciliation_retry_after is null)
  ),
  add constraint production_payment_attempt_reconciliation_error_code
  check (
    reconciliation_last_error_code is null
    or reconciliation_last_error_code ~ '^[A-Z0-9_]{3,128}$'
  );

create index production_payment_attempts_reconciliation_due_idx
  on public.production_payment_attempts(
    state,
    reconciliation_stopped_at,
    reconciliation_retry_after,
    reconciliation_lease_expires_at,
    updated_at,
    id
  )
  where provider_checkout_session_id is not null;

create function public.claim_rc2_payment_reconciliation_batch_v1(
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz,
  p_not_newer_than timestamptz,
  p_limit integer,
  p_max_attempts integer
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

create function public.finish_rc2_payment_reconciliation_v1(
  p_payment_attempt_id uuid,
  p_owner_id uuid,
  p_outcome text,
  p_retry_after timestamptz,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  attempt public.production_payment_attempts%rowtype;
  intent_state text;
begin
  if p_payment_attempt_id is null
     or p_owner_id is null
     or p_now is null
     or p_outcome is null
     or p_outcome not in ('retry', 'stop', 'settled')
     or (p_outcome = 'retry' and (
       p_retry_after is null or p_retry_after <= p_now
       or p_error_code is null
       or p_error_code !~ '^[A-Z0-9_]{3,128}$'
     ))
     or (p_outcome = 'stop' and (
       p_retry_after is not null
       or p_error_code is null
       or p_error_code !~ '^[A-Z0-9_]{3,128}$'
     ))
     or (p_outcome = 'settled' and (
       p_retry_after is not null or p_error_code is not null
     )) then
    raise exception 'RC2_PAYMENT_RECONCILIATION_FINISH_INVALID'
      using errcode = 'P0001';
  end if;

  select * into attempt
  from public.production_payment_attempts
  where id = p_payment_attempt_id
  for update;
  if attempt.id is null then
    raise exception 'RC2_PAYMENT_RECONCILIATION_NOT_FOUND'
      using errcode = 'P0001';
  end if;
  if attempt.reconciliation_owner_id is null
     or attempt.reconciliation_lease_expires_at is null
     or attempt.reconciliation_owner_id is distinct from p_owner_id
     or attempt.reconciliation_lease_expires_at <= p_now then
    raise exception 'RC2_PAYMENT_RECONCILIATION_CONFLICT'
      using errcode = 'P0001';
  end if;

  if p_outcome = 'settled' then
    select state into intent_state
    from public.production_purchase_intents
    where id = attempt.purchase_intent_id;
    if attempt.state not in ('succeeded', 'failed', 'canceled')
       and intent_state not in (
         'verified', 'payment_failed', 'canceled', 'manual_review'
       ) then
      raise exception 'RC2_PAYMENT_RECONCILIATION_NOT_SETTLED'
        using errcode = 'P0001';
    end if;
  end if;

  update public.production_payment_attempts
  set reconciliation_owner_id = null,
      reconciliation_lease_expires_at = null,
      reconciliation_retry_after = case
        when p_outcome = 'retry' then p_retry_after
        else null
      end,
      reconciliation_stopped_at = case
        when p_outcome = 'stop' then p_now
        else reconciliation_stopped_at
      end,
      reconciliation_last_error_code = case
        when p_outcome in ('retry', 'stop') then p_error_code
        else null
      end,
      reconciliation_updated_at = p_now
  where id = attempt.id;
end;
$function$;

revoke all on function public.claim_rc2_payment_reconciliation_batch_v1(
  uuid, timestamptz, timestamptz, timestamptz, integer, integer
) from public, anon, authenticated, m2_b2_stripe_ingress;
grant execute on function public.claim_rc2_payment_reconciliation_batch_v1(
  uuid, timestamptz, timestamptz, timestamptz, integer, integer
) to service_role;

revoke all on function public.finish_rc2_payment_reconciliation_v1(
  uuid, uuid, text, timestamptz, text, timestamptz
) from public, anon, authenticated, m2_b2_stripe_ingress;
grant execute on function public.finish_rc2_payment_reconciliation_v1(
  uuid, uuid, text, timestamptz, text, timestamptz
) to service_role;

commit;
