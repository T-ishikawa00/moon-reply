begin;

-- F004 forward-only cutover. Lock both durable boundaries before deciding
-- whether any legacy send capability can still be outstanding. Never infer
-- that an expired lease proves a network request has stopped.
set local lock_timeout = '5s';
lock table public.production_notification_outbox,
  public.production_result_credentials in access exclusive mode;

do $preflight$
begin
  -- This cutover is from the published v2 sender. A different sender history
  -- needs its own evidence; do not silently treat it as the same cutover.
  if exists (select 1 from public.production_notification_outbox
    where email_identity_version is not null) then
    raise exception 'F004_CUTOVER_UNEXPECTED_VERSIONED_HISTORY' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.production_notification_outbox n
    where not (
      (n.status = 'pending' and n.attempt_count = 0
        and n.owner_id is null and n.processing_started_at is null
        and n.lease_expires_at is null and n.sent_at is null
        and n.provider_message_reference is null and n.last_error_code is null
        and not exists (select 1 from public.production_result_credentials c
          where c.delivery_id = n.delivery_id and c.purpose = 'notification'))
      or
      (n.status = 'sent' and n.attempt_count = 1
        and n.owner_id is null and n.processing_started_at is null
        and n.lease_expires_at is null and n.sent_at is not null
        and n.provider_message_reference is not null and n.last_error_code is null
        and (select count(*) from public.production_result_credentials c
          where c.delivery_id = n.delivery_id and c.purpose = 'notification') = 1
        and exists (select 1 from public.production_result_credentials c
          where c.delivery_id = n.delivery_id and c.purpose = 'notification'
            and c.revoked_at is null
            and (c.expires_at is null or c.expires_at > clock_timestamp())))
    )
  ) then
    raise exception 'F004_CUTOVER_LEGACY_SEND_UNSAFE' using errcode = 'P0001';
  end if;
end;
$preflight$;

alter table public.production_notification_outbox
  add column email_sender_claim_generation integer not null default 0
    check (email_sender_claim_generation >= 0),
  add column email_cutover_recovery_after timestamptz;

-- A lost acknowledgement of a legacy successful completion can leave the
-- old JS catch block poised to revoke its credential even though status=sent.
-- Capture only those already-sent legacy credentials. The old service-role
-- automatic revoke is fenced; explicit database-owner revocation is retained.
alter table public.production_result_credentials
  add column f004_legacy_sent_cutover_protected boolean not null default false;
update public.production_result_credentials c
  set f004_legacy_sent_cutover_protected = true
  from public.production_notification_outbox n
  where n.delivery_id = c.delivery_id and n.status = 'sent'
    and n.email_identity_version is null and c.purpose = 'notification';

create function public.guard_f004_legacy_notification_revocation_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if current_user = 'service_role'
     and old.f004_legacy_sent_cutover_protected
     and old.revoked_at is null and new.revoked_at is not null
     and not exists (
       select 1 from public.production_customer_deliveries delivery
       join public.production_logical_assessments logical_assessment
         on logical_assessment.id = delivery.logical_assessment_id
       join public.production_purchase_intents intent
         on intent.preparation_id = logical_assessment.preparation_id
       join public.production_customer_ownership_bindings binding
         on binding.id = intent.customer_ownership_binding_id
           and binding.preparation_id = intent.preparation_id
       where delivery.id = old.delivery_id
         and binding.state = 'identity_detached'
         and binding.identity_detached_at = new.revoked_at
     ) then
    raise exception 'F004_LEGACY_NOTIFICATION_REVOCATION_FENCED' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
create trigger f004_legacy_notification_revocation_fence
  before update on public.production_result_credentials
  for each row execute function public.guard_f004_legacy_notification_revocation_v1();

-- Preserve the accepted detachment signature, invoker authority, ACL and
-- atomic result. Record the existing ownership transition first, then revoke
-- only credentials belonging to those exact bindings at the same timestamp.
-- The guard observes that real transition, not a caller-set bypass flag.
-- Use separate statements so row triggers see the completed binding update;
-- any later error rolls both changes back. The guard takes no binding locks.
-- An old detachment body already in flight may fail closed and be retried by
-- its caller; it must never bypass the guard or partially detach identity.
create or replace function public.detach_production_customer_identity_v1(
  p_customer_user_id uuid,
  p_request_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  detached_binding_ids uuid[];
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'customer-identity-detachment:' || p_request_id::text, 0
    )
  );
  perform 1 from public.production_customer_ownership_bindings
    where customer_user_id = p_customer_user_id and state = 'active'
    for update;
  with detached as (
    update public.production_customer_ownership_bindings set
      customer_user_id = null,
      delivery_email_sha256 = null,
      delivery_email_ciphertext = null,
      delivery_email_key_version = null,
      delivery_email_verified_source = null,
      delivery_email_verified_at = null,
      state = 'identity_detached',
      identity_detached_at = p_now,
      updated_at = p_now
      where customer_user_id = p_customer_user_id and state = 'active'
      returning id
  ) select coalesce(pg_catalog.array_agg(id), array[]::uuid[])
    into detached_binding_ids from detached;
  update public.production_result_credentials as credential set
    revoked_at = coalesce(credential.revoked_at, p_now)
    where credential.revoked_at is null and exists (
      select 1
      from public.production_customer_deliveries as delivery
      join public.production_logical_assessments as logical_assessment
        on logical_assessment.id = delivery.logical_assessment_id
      join public.production_purchase_intents as intent
        on intent.preparation_id = logical_assessment.preparation_id
      join public.production_customer_ownership_bindings as binding
        on binding.id = intent.customer_ownership_binding_id
        and binding.preparation_id = intent.preparation_id
      where delivery.id = credential.delivery_id
        and binding.id = any(detached_binding_ids)
    );
  return pg_catalog.jsonb_build_object(
    'disposition', 'completed',
    'detached_binding_count', pg_catalog.cardinality(detached_binding_ids)
  );
end;
$function$;

-- Replacing a function is not sufficient: an old invocation may already have
-- entered its old body and be waiting for the relation lock. New claims must
-- change this generation in the same row update. Old v1/v2 bodies cannot do so.
create function public.guard_f004_notification_sender_claim_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if new.email_sender_claim_generation < old.email_sender_claim_generation then
    raise exception 'F004_NOTIFICATION_CLAIM_GENERATION_INVALID' using errcode = 'P0001';
  end if;
  if new.status = 'processing' and
    (old.status <> 'processing' or new.owner_id is distinct from old.owner_id
      or new.attempt_count is distinct from old.attempt_count) then
    if new.email_identity_version is distinct from 1
       or new.email_sender_claim_generation <> old.email_sender_claim_generation + 1 then
      raise exception 'F004_LEGACY_NOTIFICATION_CLAIM_FENCED' using errcode = 'P0001';
    end if;
  elsif new.email_sender_claim_generation <> old.email_sender_claim_generation then
    raise exception 'F004_NOTIFICATION_CLAIM_GENERATION_INVALID' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
create trigger f004_notification_sender_claim_fence
  before update on public.production_notification_outbox
  for each row execute function public.guard_f004_notification_sender_claim_v1();

create or replace function public.claim_production_notification_v1(
  p_notification_id uuid, p_owner_id uuid, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
begin
  return null;
end;
$function$;

create or replace function public.claim_production_notification_v2(
  p_notification_id uuid, p_owner_id uuid,
  p_lease_expires_at timestamptz, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare current_status text;
begin
  select status into current_status from public.production_notification_outbox
    where id = p_notification_id;
  if not found then return null; end if;
  return jsonb_build_object('disposition',
    case when current_status = 'sent' then 'sent' else 'in_progress' end,
    'id', p_notification_id);
end;
$function$;

create or replace function public.claim_production_notification_v3(
  p_notification_id uuid, p_owner_id uuid,
  p_lease_expires_at timestamptz, p_now timestamptz
) returns jsonb language plpgsql security invoker set search_path = '' as $function$
declare
  locked public.production_notification_outbox%rowtype;
begin
  if p_owner_id is null or p_now is null or p_lease_expires_at is null
     or p_lease_expires_at <= p_now then
    raise exception 'PRODUCTION_NOTIFICATION_LEASE_INVALID' using errcode = 'P0001';
  end if;
  select * into locked from public.production_notification_outbox
    where id = p_notification_id for update;
  if locked.id is null then return null; end if;
  if locked.status = 'sent' then
    return jsonb_build_object('disposition', 'sent', 'id', locked.id);
  end if;
  if locked.status = 'processing' and locked.lease_expires_at > p_now then
    return jsonb_build_object('disposition', 'in_progress', 'id', locked.id);
  end if;
  if (locked.status = 'processing' and locked.lease_expires_at is null)
     or (locked.email_identity_version is null and
       (locked.attempt_count <> 0 or locked.status <> 'pending'))
     or locked.last_error_code = 'PRODUCTION_NOTIFICATION_PAYLOAD_CONFLICT'
     or (locked.email_credential_id is not null and not exists (
       select 1 from public.production_result_credentials
       where id = locked.email_credential_id and delivery_id = locked.delivery_id
         and purpose = 'notification' and revoked_at is null
         and (expires_at is null or expires_at > p_now))) then
    return jsonb_build_object('disposition', 'manual_review', 'id', locked.id);
  end if;
  if locked.status not in ('pending', 'failed', 'processing') then return null; end if;
  update public.production_notification_outbox set
    email_identity_version = 1, status = 'processing', owner_id = p_owner_id,
    processing_started_at = coalesce(processing_started_at, p_now),
    lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1, updated_at = p_now,
    email_sender_claim_generation = email_sender_claim_generation + 1
    where id = locked.id;
  return jsonb_build_object('disposition', 'acquired', 'id', locked.id,
    'delivery_id', locked.delivery_id,
    'delivery_authority_reference', locked.delivery_authority_reference,
    'attempt_count', locked.attempt_count + 1,
    'email_payload_ciphertext', locked.email_payload_ciphertext);
end;
$function$;

-- Queue retry exhaustion must not lose a notification held before its first
-- claim. This is notification-only re-entry of an already-completed Paid job,
-- not a fresh Provider run and not a reset of failed/unknown obligations.
create table public.production_notification_cutover_recovery_clock (
  singleton boolean primary key default true check (singleton),
  next_claim_at timestamptz not null
);
insert into public.production_notification_cutover_recovery_clock
  (singleton, next_claim_at) values (true, '-infinity');
alter table public.production_notification_cutover_recovery_clock enable row level security;
revoke all on table public.production_notification_cutover_recovery_clock
  from public, anon, authenticated, service_role;

create function public.claim_production_notification_cutover_recovery_v1(p_environment text)
returns jsonb language plpgsql security definer set search_path = ''
set lock_timeout = '2s' as $function$
declare
  admitted_at timestamptz;
  due_at timestamptz;
  selected record;
begin
  if p_environment is null or p_environment not in ('test', 'live') then
    raise exception 'F004_CUTOVER_RECOVERY_ENVIRONMENT_INVALID' using errcode = 'P0001';
  end if;
  select next_claim_at into due_at
    from public.production_notification_cutover_recovery_clock
    where singleton for update;
  admitted_at := clock_timestamp();
  if due_at > admitted_at then return null; end if;
  select n.id notification_id, j.id fulfillment_job_id into selected
    from public.production_notification_outbox n
    join public.production_customer_deliveries d
      on d.id = n.delivery_id and d.delivery_authority_reference = n.delivery_authority_reference
    join public.production_fulfillment_jobs j
      on j.logical_assessment_id = d.logical_assessment_id
        and j.delivery_authority_reference = n.delivery_authority_reference
    join public.production_purchase_intents i
      on i.id = j.purchase_intent_id and i.successful_payment_id = j.verified_payment_id
        and i.preparation_id = j.preparation_id
        and i.delivery_authority_reference = j.delivery_authority_reference
    join public.production_verified_payments p
      on p.id = j.verified_payment_id and p.purchase_intent_id = i.id
    where n.status = 'pending' and n.attempt_count = 0
      and n.email_identity_version is null and n.email_sender_claim_generation = 0
      and n.email_credential_id is null and n.email_payload_ciphertext is null
      and n.email_send_attempt_count = 0 and n.email_first_send_started_at is null
      and n.owner_id is null and n.lease_expires_at is null
      and n.processing_started_at is null and n.sent_at is null
      and n.provider_message_reference is null and n.last_error_code is null
      and (n.email_cutover_recovery_after is null or n.email_cutover_recovery_after <= admitted_at)
      and not exists (select 1 from public.production_result_credentials c
        where c.delivery_id = n.delivery_id and c.purpose = 'notification')
      and j.state = 'completed' and j.completed_at is not null
      and (j.dispatch_marker is null or j.dispatch_marker = 'rc2-dispatch:' || j.id::text)
      and i.state = 'verified' and i.environment = p_environment
      and p.environment = p_environment
    order by n.email_cutover_recovery_after asc nulls first, n.requested_at, n.id
    for update of n skip locked limit 1;
  if selected.notification_id is null then return null; end if;
  update public.production_notification_outbox
    set email_cutover_recovery_after = admitted_at + interval '5 minutes'
    where id = selected.notification_id;
  update public.production_notification_cutover_recovery_clock
    set next_claim_at = admitted_at + interval '1 minute' where singleton;
  return jsonb_build_object('fulfillment_job_id', selected.fulfillment_job_id,
    'notification_id', selected.notification_id);
end;
$function$;

revoke all on function public.guard_f004_legacy_notification_revocation_v1(),
  public.guard_f004_notification_sender_claim_v1(),
  public.claim_production_notification_v1(uuid,uuid,timestamptz),
  public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz),
  public.claim_production_notification_v3(uuid,uuid,timestamptz,timestamptz),
  public.claim_production_notification_cutover_recovery_v1(text)
  from public, anon, authenticated;
grant execute on function public.guard_f004_legacy_notification_revocation_v1(),
  public.guard_f004_notification_sender_claim_v1(),
  public.claim_production_notification_v1(uuid,uuid,timestamptz),
  public.claim_production_notification_v2(uuid,uuid,timestamptz,timestamptz),
  public.claim_production_notification_v3(uuid,uuid,timestamptz,timestamptz),
  public.claim_production_notification_cutover_recovery_v1(text)
  to service_role;

-- Keep schema, legacy URL protections, stable identities and pending rows on
-- runtime rollback. Restore compatible v3 handling by forward fix; never
-- restore legacy claims, reset attempt counters, or discard queued evidence.
commit;
