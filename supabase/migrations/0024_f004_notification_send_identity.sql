begin;

-- Expand first. No legacy row is backfilled and no raw bearer or email is stored.
-- Apply before the new runtime. v2 workers cannot claim a v3-owned identity.
-- Rollback: retain these columns/credentials/ciphertexts and the v2 guard; an
-- old runtime safely leaves v3 notifications for review. Never drop identities
-- or restore the unsafe old notification claim while retryable rows exist.
alter table public.production_notification_outbox
  add column email_identity_version smallint,
  add column email_credential_id uuid unique references public.production_result_credentials(id),
  add column email_payload_ciphertext text,
  add column email_first_send_started_at timestamptz,
  add column email_send_attempt_count integer not null default 0,
  add constraint notification_email_identity_shape check (
    (email_identity_version is null or email_identity_version = 1)
    and ((email_credential_id is null and email_payload_ciphertext is null)
      or (email_identity_version is not distinct from 1 and email_credential_id is not null
        and email_payload_ciphertext is not null
        and length(email_payload_ciphertext) between 1 and 32768))
    and email_send_attempt_count >= 0
    and ((email_send_attempt_count = 0 and email_first_send_started_at is null)
      or (email_send_attempt_count > 0 and email_first_send_started_at is not null
        and email_payload_ciphertext is not null))
  );

create function public.guard_production_notification_email_identity_v1()
returns trigger language plpgsql security invoker set search_path = '' as $function$
begin
  if (old.email_identity_version is not null
      and new.email_identity_version is distinct from old.email_identity_version)
    or (old.email_payload_ciphertext is not null and
      (new.email_payload_ciphertext is distinct from old.email_payload_ciphertext
       or new.email_credential_id is distinct from old.email_credential_id))
    or (old.email_first_send_started_at is not null and
      new.email_first_send_started_at is distinct from old.email_first_send_started_at)
    or new.email_send_attempt_count < old.email_send_attempt_count then
    raise exception 'PRODUCTION_NOTIFICATION_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
create trigger production_notification_email_identity_immutable
  before update on public.production_notification_outbox
  for each row execute function public.guard_production_notification_email_identity_v1();

create function public.claim_production_notification_v3(
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
    attempt_count = attempt_count + 1, updated_at = p_now
    where id = locked.id;
  return jsonb_build_object('disposition', 'acquired', 'id', locked.id,
    'delivery_id', locked.delivery_id,
    'delivery_authority_reference', locked.delivery_authority_reference,
    'attempt_count', locked.attempt_count + 1,
    'email_payload_ciphertext', locked.email_payload_ciphertext);
end;
$function$;

create function public.prepare_production_notification_email_v1(
  p_notification_id uuid, p_owner_id uuid, p_credential_id uuid,
  p_token_hash text, p_payload_ciphertext text, p_now timestamptz
) returns text language plpgsql security invoker set search_path = '' as $function$
declare locked public.production_notification_outbox%rowtype;
begin
  select * into locked from public.production_notification_outbox
    where id = p_notification_id for update;
  if locked.id is null or locked.status <> 'processing'
     or p_owner_id is null or locked.owner_id is distinct from p_owner_id
     or p_now is null or locked.lease_expires_at is null
     or locked.lease_expires_at <= p_now
     or locked.email_identity_version is distinct from 1 then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  if locked.email_payload_ciphertext is not null then
    return locked.email_payload_ciphertext;
  end if;
  if p_credential_id is null or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_payload_ciphertext is null or length(p_payload_ciphertext) not between 1 and 32768 then
    raise exception 'PRODUCTION_NOTIFICATION_IDENTITY_INVALID' using errcode = 'P0001';
  end if;
  insert into public.production_result_credentials
    (id, delivery_id, token_hash, purpose, issued_at)
    values (p_credential_id, locked.delivery_id, p_token_hash, 'notification', p_now);
  update public.production_notification_outbox set
    email_credential_id = p_credential_id, email_payload_ciphertext = p_payload_ciphertext,
    updated_at = p_now where id = locked.id;
  return p_payload_ciphertext;
end;
$function$;

create function public.begin_production_notification_send_v1(
  p_notification_id uuid, p_owner_id uuid, p_now timestamptz
) returns void language plpgsql security invoker set search_path = '' as $function$
declare locked public.production_notification_outbox%rowtype;
begin
  select * into locked from public.production_notification_outbox
    where id = p_notification_id for update;
  if locked.id is null or locked.status <> 'processing'
     or p_owner_id is null or locked.owner_id is distinct from p_owner_id
     or p_now is null or locked.lease_expires_at is null
     or locked.lease_expires_at <= p_now
     or locked.email_payload_ciphertext is null
     or not exists (select 1 from public.production_result_credentials
       where id = locked.email_credential_id and delivery_id = locked.delivery_id
         and purpose = 'notification' and revoked_at is null
         and (expires_at is null or expires_at > p_now)) then
    raise exception 'PRODUCTION_NOTIFICATION_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  -- These fields record attempts, not a new retry window or attempt policy.
  -- This durable marker precedes the network boundary. A crash from here may
  -- have sent; never rotate/revoke the credential on transport or ack failure.
  update public.production_notification_outbox set
    email_first_send_started_at = coalesce(email_first_send_started_at, p_now),
    email_send_attempt_count = email_send_attempt_count + 1, updated_at = p_now
    where id = locked.id;
end;
$function$;

revoke all on function public.guard_production_notification_email_identity_v1() from public, anon, authenticated;
revoke all on function public.claim_production_notification_v3(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.prepare_production_notification_email_v1(uuid, uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.begin_production_notification_send_v1(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.guard_production_notification_email_identity_v1() to service_role;
grant execute on function public.claim_production_notification_v3(uuid, uuid, timestamptz, timestamptz) to service_role;
grant execute on function public.prepare_production_notification_email_v1(uuid, uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.begin_production_notification_send_v1(uuid, uuid, timestamptz) to service_role;

-- The existing v2 function is preserved below with only an early identity
-- guard added. This prevents an old worker from rotating a v3 email token.

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
  if locked.email_identity_version is not null then
    return jsonb_build_object('disposition', 'manual_review', 'id', locked.id);
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

commit;
