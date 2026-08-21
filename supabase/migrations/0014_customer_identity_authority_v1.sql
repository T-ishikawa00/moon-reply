begin;

do $precondition$
begin
  if pg_catalog.to_regclass('public.production_preparations') is null
     or pg_catalog.to_regclass('public.production_purchase_intents') is null
     or pg_catalog.to_regclass('public.production_verified_payments') is null
     or pg_catalog.to_regclass('public.production_customer_deliveries') is null then
    raise exception 'CUSTOMER_IDENTITY_MIGRATION_PRECONDITION_FAILED'
      using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'record_rc2_stripe_evidence_v1'
  ) or not exists (
    select 1 from pg_catalog.pg_proc as procedure
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'issue_rc2_production_assessment_grant_v1'
  ) then
    raise exception 'CUSTOMER_IDENTITY_MIGRATION_PRECONDITION_FAILED'
      using errcode = 'P0001';
  end if;
end;
$precondition$;

create table public.production_customer_auth_continuations (
  id uuid primary key,
  preparation_id uuid not null,
  continuation_token_hash text not null unique,
  csrf_token_hash text not null,
  flow_kind text not null,
  state text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  expired_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_customer_auth_continuation_preparation_fk
    foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_customer_auth_continuation_hashes check (
    continuation_token_hash ~ '^[0-9a-f]{64}$'
    and csrf_token_hash ~ '^[0-9a-f]{64}$'
    and continuation_token_hash <> csrf_token_hash
  ),
  constraint production_customer_auth_continuation_flow
    check (flow_kind in ('google', 'email_otp')),
  constraint production_customer_auth_continuation_expiry
    check (expires_at > created_at),
  constraint production_customer_auth_continuation_state check (
    (state = 'pending' and consumed_at is null
      and expired_at is null and revoked_at is null)
    or (state = 'consumed' and consumed_at is not null
      and expired_at is null and revoked_at is null)
    or (state = 'expired' and consumed_at is null
      and expired_at is not null and revoked_at is null)
    or (state = 'revoked' and consumed_at is null
      and expired_at is null and revoked_at is not null)
  )
);

create unique index production_customer_auth_one_pending_per_preparation_idx
  on public.production_customer_auth_continuations(preparation_id)
  where state = 'pending';
create index production_customer_auth_preparation_state_expiry_idx
  on public.production_customer_auth_continuations(
    preparation_id, state, expires_at
  );

create table public.production_customer_ownership_bindings (
  id uuid primary key,
  ownership_reference_id uuid not null unique,
  customer_user_id uuid,
  preparation_id uuid not null unique,
  delivery_email_sha256 text,
  delivery_email_ciphertext text,
  delivery_email_key_version text,
  delivery_email_verified_source text,
  delivery_email_verified_at timestamptz,
  state text not null,
  bound_at timestamptz not null,
  identity_detached_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_customer_ownership_auth_user_fk
    foreign key (customer_user_id)
    references auth.users(id) on delete restrict,
  constraint production_customer_ownership_preparation_fk
    foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_customer_ownership_id_preparation_unique
    unique (id, preparation_id),
  constraint production_customer_ownership_email_hash check (
    delivery_email_sha256 is null
    or delivery_email_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint production_customer_ownership_email_source check (
    delivery_email_verified_source is null
    or delivery_email_verified_source in (
      'supabase_email_otp', 'google_verified_identity'
    )
  ),
  constraint production_customer_ownership_state check (
    (state = 'active'
      and customer_user_id is not null
      and delivery_email_sha256 is not null
      and delivery_email_ciphertext is not null
      and delivery_email_key_version is not null
      and delivery_email_verified_source is not null
      and delivery_email_verified_at is not null
      and identity_detached_at is null)
    or (state = 'identity_detached'
      and customer_user_id is null
      and delivery_email_sha256 is null
      and delivery_email_ciphertext is null
      and delivery_email_key_version is null
      and delivery_email_verified_source is null
      and delivery_email_verified_at is null
      and identity_detached_at is not null)
  )
);

create index production_customer_ownership_customer_history_idx
  on public.production_customer_ownership_bindings(
    customer_user_id, state, bound_at desc
  );

alter table public.production_purchase_intents
  add column customer_ownership_binding_id uuid;

alter table public.production_purchase_intents
  alter column verified_email_authority_id drop not null,
  alter column trusted_email_session_id drop not null;

alter table public.production_purchase_intents
  add constraint production_purchase_intent_customer_binding_fk
    foreign key (customer_ownership_binding_id)
    references public.production_customer_ownership_bindings(id)
    on delete restrict,
  add constraint production_purchase_intent_customer_binding_preparation_fk
    foreign key (customer_ownership_binding_id, preparation_id)
    references public.production_customer_ownership_bindings(id, preparation_id)
    on delete restrict,
  add constraint production_purchase_intent_ownership_lane check (
    (customer_ownership_binding_id is null
      and verified_email_authority_id is not null
      and trusted_email_session_id is not null)
    or (customer_ownership_binding_id is not null
      and verified_email_authority_id is null
      and trusted_email_session_id is null)
  );

create index production_purchase_intent_customer_binding_idx
  on public.production_purchase_intents(customer_ownership_binding_id)
  where customer_ownership_binding_id is not null;

create function public.create_customer_auth_continuation_v1(
  p_continuation_id uuid,
  p_preparation_capability_hash text,
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_flow_kind text,
  p_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash
    for update;
  if preparation.id is null or preparation.status <> 'purchase_ready' then
    raise exception 'CUSTOMER_AUTH_PURCHASE_READY_REQUIRED'
      using errcode = 'P0001';
  end if;
  if p_expires_at <= p_now or p_expires_at > p_now + interval '30 minutes'
     or p_flow_kind not in ('google', 'email_otp')
     or p_continuation_token_hash !~ '^[0-9a-f]{64}$'
     or p_csrf_token_hash !~ '^[0-9a-f]{64}$'
     or p_continuation_token_hash = p_csrf_token_hash then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  update public.production_customer_auth_continuations set
    state = 'expired', expired_at = p_now, updated_at = p_now
    where preparation_id = preparation.id
      and state = 'pending' and expires_at <= p_now;
  update public.production_customer_auth_continuations set
    state = 'revoked', revoked_at = p_now, updated_at = p_now
    where preparation_id = preparation.id and state = 'pending';
  insert into public.production_customer_auth_continuations (
    id, preparation_id, continuation_token_hash, csrf_token_hash,
    flow_kind, state, expires_at, created_at, updated_at
  ) values (
    p_continuation_id, preparation.id, p_continuation_token_hash,
    p_csrf_token_hash, p_flow_kind, 'pending', p_expires_at, p_now, p_now
  );
  return pg_catalog.jsonb_build_object(
    'continuation_id', p_continuation_id,
    'preparation_id', preparation.id,
    'flow_kind', p_flow_kind,
    'state', 'pending',
    'expires_at', p_expires_at
  );
end;
$function$;

create function public.record_rc2_stripe_evidence_v2(
  p_provider_event_id text,
  p_evidence_source text,
  p_event_type text,
  p_provider_created_at timestamptz,
  p_payload_sha256 text,
  p_environment text,
  p_purchase_reference text,
  p_provider_checkout_session_id text,
  p_provider_payment_id text,
  p_mode text,
  p_payment_status text,
  p_amount_total integer,
  p_currency text,
  p_application_disposition text,
  p_application_reason_code text,
  p_verified_payment_id uuid,
  p_fulfillment_job_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  duplicate_event public.production_stripe_event_ledger%rowtype;
  intent public.production_purchase_intents%rowtype;
  attempt public.production_payment_attempts%rowtype;
  authority public.production_verified_email_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
  preparation public.production_preparations%rowtype;
  existing_payment public.production_verified_payments%rowtype;
  existing_job_id uuid;
  ownership_valid boolean := false;
  terminal_success boolean;
  final_disposition text;
  final_reason text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('rc2-stripe-event:' || p_provider_event_id, 0)
  );
  select * into duplicate_event from public.production_stripe_event_ledger
    where provider_event_id = p_provider_event_id;
  if duplicate_event.provider_event_id is not null then
    return pg_catalog.jsonb_build_object(
      'disposition', 'duplicate',
      'purchase_intent_id', duplicate_event.purchase_intent_id,
      'verified_payment_id', duplicate_event.verified_payment_id,
      'fulfillment_job_id', duplicate_event.fulfillment_job_id
    );
  end if;
  insert into public.production_stripe_event_ledger (
    provider_event_id, evidence_source, event_type,
    provider_created_at, payload_sha256,
    environment, purchase_reference, provider_checkout_session_id,
    provider_payment_id, mode, payment_status, amount_total, currency,
    disposition, reason_code, received_at
  ) values (
    p_provider_event_id, p_evidence_source, p_event_type,
    p_provider_created_at, p_payload_sha256,
    p_environment, p_purchase_reference, p_provider_checkout_session_id,
    p_provider_payment_id, p_mode, p_payment_status, p_amount_total, p_currency,
    'received', p_application_reason_code, p_now
  );
  select * into intent from public.production_purchase_intents
    where id::text = p_purchase_reference for update;
  select * into attempt from public.production_payment_attempts
    where provider_checkout_session_id = p_provider_checkout_session_id for update;
  if intent.id is not null and (
    p_environment is distinct from intent.environment
    or p_provider_checkout_session_id is null
    or not public.rc2_checkout_session_matches_environment_v1(
      intent.environment, p_provider_checkout_session_id
    )
  ) then
    update public.production_stripe_event_ledger set
      disposition = 'rejected',
      reason_code = 'PAYMENT_ENVIRONMENT_MISMATCH',
      purchase_intent_id = intent.id,
      processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', 'rejected',
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  if intent.id is null or attempt.id is null
     or attempt.purchase_intent_id <> intent.id then
    final_disposition := 'rejected';
    final_reason := 'PAYMENT_BINDING_INVALID';
  elsif p_application_disposition = 'rejected' then
    final_disposition := 'rejected';
    final_reason := coalesce(
      p_application_reason_code, 'PAYMENT_EVIDENCE_REJECTED'
    );
  else
    final_disposition := null;
    final_reason := null;
  end if;
  if final_disposition is not null then
    update public.production_stripe_event_ledger set
      disposition = final_disposition, reason_code = final_reason,
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  terminal_success := coalesce(p_application_disposition = 'verified'
    and p_event_type in (
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded'
    ) and p_payment_status = 'paid', false);
  if not terminal_success and (
    intent.state in ('verified', 'manual_review')
    or attempt.id <> intent.current_payment_attempt_id
    or attempt.state in ('failed', 'canceled', 'succeeded')
    or (attempt.last_provider_event_created_at is not null
      and p_provider_created_at < attempt.last_provider_event_created_at)
  ) then
    update public.production_stripe_event_ledger set
      disposition = 'stale', reason_code = 'PAYMENT_STALE_EVENT_IGNORED',
      purchase_intent_id = intent.id,
      verified_payment_id = intent.successful_payment_id,
      fulfillment_job_id = (
        select id from public.production_fulfillment_jobs
          where purchase_intent_id = intent.id
      ), processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', 'stale', 'purchase_intent_id', intent.id,
      'verified_payment_id', intent.successful_payment_id,
      'fulfillment_job_id', (
        select id from public.production_fulfillment_jobs
          where purchase_intent_id = intent.id
      )
    );
  end if;
  if not terminal_success then
    if p_application_disposition = 'pending' then
      update public.production_payment_attempts set
        state = 'processing',
        last_provider_event_created_at = greatest(
          coalesce(last_provider_event_created_at, p_provider_created_at),
          p_provider_created_at
        ), updated_at = p_now
        where id = attempt.id and state <> 'succeeded';
      update public.production_purchase_intents set
        state = 'processing', updated_at = p_now
        where id = intent.id and state not in ('verified', 'manual_review');
      final_disposition := 'pending';
    elsif p_application_disposition in ('failed', 'canceled') then
      update public.production_payment_attempts set
        state = p_application_disposition,
        last_provider_event_created_at = p_provider_created_at,
        updated_at = p_now where id = attempt.id and state <> 'succeeded';
      update public.production_purchase_intents set
        state = case when p_application_disposition = 'failed'
          then 'payment_failed' else 'canceled' end,
        updated_at = p_now
        where id = intent.id and state not in ('verified', 'manual_review');
      final_disposition := p_application_disposition;
    else
      final_disposition := 'rejected';
      final_reason := 'PAYMENT_EVENT_DISPOSITION_INVALID';
    end if;
    update public.production_stripe_event_ledger set
      disposition = final_disposition, reason_code = final_reason,
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  if intent.customer_ownership_binding_id is null then
    select * into authority from public.production_verified_email_authorities
      where id = intent.verified_email_authority_id
        and revoked_at is null for update;
    ownership_valid := authority.id is not null
      and intent.trusted_email_session_id is not null;
  else
    select * into binding from public.production_customer_ownership_bindings
      where id = intent.customer_ownership_binding_id
        and preparation_id = intent.preparation_id for update;
    ownership_valid := binding.id is not null
      and binding.state = 'active'
      and binding.customer_user_id is not null
      and binding.delivery_email_ciphertext is not null
      and intent.verified_email_authority_id is null
      and intent.trusted_email_session_id is null;
  end if;
  select * into preparation from public.production_preparations
    where id = intent.preparation_id for update;
  if not ownership_valid or preparation.id is null
     or preparation.status not in ('purchase_ready', 'consumed')
     or intent.expected_product_code <> 'moon_reply_love_message_assessment_note_v1'
     or intent.expected_amount <> 980 or intent.currency <> 'jpy'
     or intent.purchase_kind <> 'one_time' or intent.provider <> 'stripe'
     or intent.environment is distinct from p_environment
     or p_application_disposition is distinct from 'verified'
     or p_event_type is null or p_event_type not in (
       'checkout.session.completed',
       'checkout.session.async_payment_succeeded'
     )
     or p_payment_status is distinct from 'paid'
     or p_mode is distinct from 'payment'
     or p_amount_total is distinct from 980
     or pg_catalog.lower(p_currency) is distinct from 'jpy'
     or p_provider_payment_id is null then
    update public.production_stripe_event_ledger set
      disposition = 'rejected', reason_code = 'PAYMENT_DB_VERIFICATION_FAILED',
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', 'rejected', 'purchase_intent_id', intent.id,
      'verified_payment_id', null, 'fulfillment_job_id', null
    );
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'rc2-provider-payment:' || p_provider_payment_id, 0
    )
  );
  select * into existing_payment from public.production_verified_payments
    where purchase_intent_id = intent.id for update;
  if existing_payment.id is not null then
    select id into existing_job_id from public.production_fulfillment_jobs
      where verified_payment_id = existing_payment.id;
    if existing_payment.provider_payment_id = p_provider_payment_id
       and existing_payment.provider_checkout_session_id =
         p_provider_checkout_session_id then
      final_disposition := 'duplicate';
    else
      final_disposition := 'conflict';
      update public.production_purchase_intents set
        state = 'manual_review', updated_at = p_now where id = intent.id;
    end if;
    update public.production_stripe_event_ledger set
      disposition = final_disposition,
      reason_code = case when final_disposition = 'conflict'
        then 'PAYMENT_CONFLICTING_SUCCESS' else null end,
      purchase_intent_id = intent.id,
      verified_payment_id = existing_payment.id,
      fulfillment_job_id = existing_job_id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', existing_payment.id,
      'fulfillment_job_id', existing_job_id
    );
  end if;
  if exists (
    select 1 from public.production_verified_payments
      where provider_payment_id = p_provider_payment_id
        and purchase_intent_id <> intent.id
  ) then
    update public.production_purchase_intents set
      state = 'manual_review', updated_at = p_now where id = intent.id;
    update public.production_stripe_event_ledger set
      disposition = 'conflict', reason_code = 'PAYMENT_PROVIDER_ID_CONFLICT',
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return pg_catalog.jsonb_build_object(
      'disposition', 'conflict', 'purchase_intent_id', intent.id,
      'verified_payment_id', null, 'fulfillment_job_id', null
    );
  end if;
  insert into public.production_verified_payments (
    id, purchase_intent_id, payment_attempt_id,
    provider_checkout_session_id, provider_payment_id, provider_event_id,
    product_code, amount, currency, environment, verified_at, created_at
  ) values (
    p_verified_payment_id, intent.id, attempt.id,
    p_provider_checkout_session_id, p_provider_payment_id, p_provider_event_id,
    intent.expected_product_code, p_amount_total, pg_catalog.lower(p_currency),
    p_environment, p_now, p_now
  );
  update public.production_payment_attempts set
    state = 'succeeded', provider_payment_id = p_provider_payment_id,
    last_provider_event_created_at = greatest(
      coalesce(last_provider_event_created_at, p_provider_created_at),
      p_provider_created_at
    ), last_error_code = null, updated_at = p_now
    where id = attempt.id;
  update public.production_purchase_intents set
    state = 'verified', current_payment_attempt_id = attempt.id,
    successful_payment_id = p_verified_payment_id, updated_at = p_now
    where id = intent.id;
  insert into public.production_fulfillment_jobs (
    id, purchase_intent_id, verified_payment_id, preparation_id,
    delivery_authority_reference, state, attempt_count, requested_at,
    created_at, updated_at
  ) values (
    p_fulfillment_job_id, intent.id, p_verified_payment_id,
    intent.preparation_id, intent.delivery_authority_reference,
    'pending', 0, p_now, p_now, p_now
  );
  update public.production_stripe_event_ledger set
    disposition = 'applied', reason_code = null,
    purchase_intent_id = intent.id,
    verified_payment_id = p_verified_payment_id,
    fulfillment_job_id = p_fulfillment_job_id, processed_at = p_now
    where provider_event_id = p_provider_event_id;
  return pg_catalog.jsonb_build_object(
    'disposition', 'verified', 'purchase_intent_id', intent.id,
    'verified_payment_id', p_verified_payment_id,
    'fulfillment_job_id', p_fulfillment_job_id
  );
end;
$function$;

create function public.issue_rc2_production_assessment_grant_v2(
  p_grant_id uuid,
  p_purchase_id uuid,
  p_logical_assessment_id uuid,
  p_verified_payment_id uuid,
  p_preparation_id uuid,
  p_purchase_authority_reference_hash text,
  p_delivery_authority_reference text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  verified public.production_verified_payments%rowtype;
  intent public.production_purchase_intents%rowtype;
  preparation public.production_preparations%rowtype;
  authority public.production_verified_email_authorities%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
  job public.production_fulfillment_jobs%rowtype;
  existing_grant public.production_assessment_grants%rowtype;
  existing_purchase_hash text;
  existing_logical_id uuid;
  expected_reference_hash text;
  target_intent_id uuid;
  ownership_valid boolean := false;
begin
  select purchase_intent_id into target_intent_id
    from public.production_verified_payments where id = p_verified_payment_id;
  if target_intent_id is null then
    raise exception 'RC2_VERIFIED_PAYMENT_REQUIRED' using errcode = 'P0001';
  end if;
  select * into intent from public.production_purchase_intents
    where id = target_intent_id for update;
  if intent.customer_ownership_binding_id is null then
    select * into authority from public.production_verified_email_authorities
      where id = intent.verified_email_authority_id for update;
    ownership_valid := authority.id is not null
      and authority.revoked_at is null
      and intent.trusted_email_session_id is not null;
  else
    select * into binding from public.production_customer_ownership_bindings
      where id = intent.customer_ownership_binding_id
        and preparation_id = intent.preparation_id for update;
    ownership_valid := binding.id is not null
      and binding.state = 'active'
      and binding.customer_user_id is not null
      and binding.delivery_email_ciphertext is not null
      and intent.verified_email_authority_id is null
      and intent.trusted_email_session_id is null;
  end if;
  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into verified from public.production_verified_payments
    where id = p_verified_payment_id
      and purchase_intent_id = intent.id for update;
  select * into job from public.production_fulfillment_jobs
    where verified_payment_id = p_verified_payment_id for update;
  expected_reference_hash := pg_catalog.encode(extensions.digest(
    pg_catalog.convert_to('verified-payment:' || p_verified_payment_id::text, 'UTF8'),
    'sha256'
  ), 'hex');
  if verified.id is null or intent.id is null or preparation.id is null
     or not ownership_valid or job.id is null
     or intent.state <> 'verified'
     or intent.successful_payment_id <> verified.id
     or intent.preparation_id <> preparation.id
     or verified.purchase_intent_id <> intent.id
     or verified.product_code <> 'moon_reply_love_message_assessment_note_v1'
     or verified.amount <> 980 or verified.currency <> 'jpy'
     or verified.environment is distinct from intent.environment
     or preparation.status not in ('purchase_ready', 'consumed')
     or intent.delivery_authority_reference is distinct from
       p_delivery_authority_reference
     or job.delivery_authority_reference is distinct from
       p_delivery_authority_reference
     or job.state not in ('processing', 'retryable', 'completed')
     or p_purchase_authority_reference_hash is distinct from
       expected_reference_hash then
    raise exception 'RC2_VERIFIED_PAYMENT_REQUIRED' using errcode = 'P0001';
  end if;
  select * into existing_grant from public.production_assessment_grants
    where preparation_id = preparation.id;
  if existing_grant.id is not null then
    select purchase_authority_reference_hash into existing_purchase_hash
      from public.production_purchases where id = existing_grant.purchase_id;
    select id into existing_logical_id from public.production_logical_assessments
      where grant_id = existing_grant.id;
    if existing_purchase_hash is distinct from p_purchase_authority_reference_hash
       or existing_grant.delivery_authority_reference is distinct from
         p_delivery_authority_reference then
      raise exception 'RC2_PURCHASE_AUTHORITY_CONFLICT' using errcode = 'P0001';
    end if;
    update public.production_fulfillment_jobs set
      grant_id = existing_grant.id,
      logical_assessment_id = existing_logical_id, updated_at = p_now
      where id = job.id;
    return pg_catalog.jsonb_build_object(
      'grant_id', existing_grant.id,
      'logical_assessment_id', existing_logical_id
    );
  end if;
  insert into public.production_purchases (
    id, preparation_id, purchase_authority_reference_hash, verified_at
  ) values (
    p_purchase_id, preparation.id, p_purchase_authority_reference_hash, p_now
  );
  insert into public.production_assessment_grants (
    id, purchase_id, preparation_id, delivery_authority_reference,
    status, issued_at
  ) values (
    p_grant_id, p_purchase_id, preparation.id,
    p_delivery_authority_reference, 'issued', p_now
  );
  insert into public.production_logical_assessments (
    id, grant_id, preparation_id, assessment_request_id, status,
    attempt_count, recovery_state, created_at, updated_at
  ) values (
    p_logical_assessment_id, p_grant_id, preparation.id,
    preparation.assessment_request_id, 'pending', 0, 'not_started', p_now, p_now
  );
  update public.production_preparations set
    status = 'consumed', updated_at = p_now
    where id = preparation.id and status = 'purchase_ready';
  update public.production_fulfillment_jobs set
    grant_id = p_grant_id, logical_assessment_id = p_logical_assessment_id,
    updated_at = p_now where id = job.id;
  return pg_catalog.jsonb_build_object(
    'grant_id', p_grant_id,
    'logical_assessment_id', p_logical_assessment_id
  );
end;
$function$;


create function public.validate_customer_auth_continuation_v1(
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_flow_kind text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  continuation public.production_customer_auth_continuations%rowtype;
begin
  select * into continuation
    from public.production_customer_auth_continuations
    where continuation_token_hash = p_continuation_token_hash
    for update;
  if continuation.id is null
     or continuation.csrf_token_hash is distinct from p_csrf_token_hash
     or continuation.flow_kind is distinct from p_flow_kind
     or continuation.state <> 'pending' then
    return null;
  end if;
  if continuation.expires_at <= p_now then
    update public.production_customer_auth_continuations set
      state = 'expired', expired_at = p_now, updated_at = p_now
      where id = continuation.id and state = 'pending';
    return null;
  end if;
  return pg_catalog.jsonb_build_object(
    'continuation_id', continuation.id,
    'preparation_id', continuation.preparation_id,
    'flow_kind', continuation.flow_kind,
    'state', continuation.state,
    'expires_at', continuation.expires_at
  );
end;
$function$;

create function public.bind_production_preparation_to_customer_v1(
  p_binding_id uuid,
  p_ownership_reference_id uuid,
  p_continuation_token_hash text,
  p_csrf_token_hash text,
  p_customer_user_id uuid,
  p_delivery_email_sha256 text,
  p_delivery_email_ciphertext text,
  p_delivery_email_key_version text,
  p_delivery_email_verified_source text,
  p_delivery_email_verified_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  continuation_preparation_id uuid;
  continuation public.production_customer_auth_continuations%rowtype;
  preparation public.production_preparations%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
begin
  select preparation_id into continuation_preparation_id
    from public.production_customer_auth_continuations
    where continuation_token_hash = p_continuation_token_hash;
  if continuation_preparation_id is null then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  select * into preparation from public.production_preparations
    where id = continuation_preparation_id for update;
  select * into continuation
    from public.production_customer_auth_continuations
    where continuation_token_hash = p_continuation_token_hash
    for update;
  select * into binding
    from public.production_customer_ownership_bindings
    where preparation_id = continuation_preparation_id
    for update;
  if continuation.csrf_token_hash is distinct from p_csrf_token_hash
     or continuation.expires_at <= p_now
     or continuation.state not in ('pending', 'consumed')
     or preparation.id is null
     or preparation.status <> 'purchase_ready' then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  if binding.id is not null then
    if binding.state = 'active'
       and binding.customer_user_id = p_customer_user_id then
      update public.production_customer_auth_continuations set
        state = 'consumed', consumed_at = coalesce(consumed_at, p_now),
        updated_at = p_now
        where id = continuation.id and state = 'pending';
      return pg_catalog.jsonb_build_object(
        'binding_id', binding.id,
        'preparation_id', binding.preparation_id,
        'customer_user_id', binding.customer_user_id,
        'state', binding.state,
        'disposition', 'existing'
      );
    end if;
    raise exception 'CUSTOMER_AUTH_BINDING_CONFLICT'
      using errcode = 'P0001';
  end if;
  if continuation.state <> 'pending'
     or p_delivery_email_sha256 !~ '^[0-9a-f]{64}$'
     or p_delivery_email_ciphertext is null
     or pg_catalog.char_length(p_delivery_email_ciphertext) < 16
     or p_delivery_email_key_version !~ '^[A-Za-z0-9._-]{1,32}$'
     or p_delivery_email_verified_source not in (
       'supabase_email_otp', 'google_verified_identity'
     )
     or p_delivery_email_verified_at > p_now then
    raise exception 'CUSTOMER_AUTH_BINDING_INVALID'
      using errcode = 'P0001';
  end if;
  insert into public.production_customer_ownership_bindings (
    id, ownership_reference_id, customer_user_id, preparation_id,
    delivery_email_sha256, delivery_email_ciphertext,
    delivery_email_key_version, delivery_email_verified_source,
    delivery_email_verified_at, state, bound_at, created_at, updated_at
  ) values (
    p_binding_id, p_ownership_reference_id, p_customer_user_id,
    preparation.id, p_delivery_email_sha256, p_delivery_email_ciphertext,
    p_delivery_email_key_version, p_delivery_email_verified_source,
    p_delivery_email_verified_at, 'active', p_now, p_now, p_now
  ) returning * into binding;
  update public.production_customer_auth_continuations set
    state = 'consumed', consumed_at = p_now, updated_at = p_now
    where id = continuation.id and state = 'pending';
  if not found then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  return pg_catalog.jsonb_build_object(
    'binding_id', binding.id,
    'preparation_id', binding.preparation_id,
    'customer_user_id', binding.customer_user_id,
    'state', binding.state,
    'disposition', 'created'
  );
end;
$function$;

create function public.begin_customer_purchase_intent_v1(
  p_purchase_intent_id uuid,
  p_customer_user_id uuid,
  p_preparation_capability_hash text,
  p_status_capability_hash text,
  p_delivery_authority_reference text,
  p_expected_product_code text,
  p_expected_amount integer,
  p_currency text,
  p_purchase_kind text,
  p_environment text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
  intent public.production_purchase_intents%rowtype;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash
    for update;
  if preparation.id is null or preparation.status <> 'purchase_ready' then
    raise exception 'CUSTOMER_AUTH_PURCHASE_READY_REQUIRED'
      using errcode = 'P0001';
  end if;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = preparation.id for update;
  if binding.id is null or binding.state <> 'active'
     or binding.customer_user_id <> p_customer_user_id then
    raise exception 'CUSTOMER_AUTH_OWNERSHIP_REQUIRED'
      using errcode = 'P0001';
  end if;
  select * into intent from public.production_purchase_intents
    where preparation_id = preparation.id for update;
  if intent.id is not null then
    if intent.customer_ownership_binding_id = binding.id
       and intent.verified_email_authority_id is null
       and intent.trusted_email_session_id is null
       and intent.expected_product_code = 'moon_reply_love_message_assessment_note_v1'
       and intent.expected_amount = 980 and intent.currency = 'jpy'
       and intent.purchase_kind = 'one_time' and intent.provider = 'stripe'
       and intent.environment = p_environment then
      return pg_catalog.jsonb_build_object(
        'disposition', 'existing',
        'intent', pg_catalog.to_jsonb(intent),
        'delivery_email_ciphertext', binding.delivery_email_ciphertext
      );
    end if;
    raise exception 'CUSTOMER_AUTH_PURCHASE_INTENT_CONFLICT'
      using errcode = 'P0001';
  end if;
  if p_expected_product_code <> 'moon_reply_love_message_assessment_note_v1'
     or p_expected_amount <> 980 or pg_catalog.lower(p_currency) <> 'jpy'
     or p_purchase_kind <> 'one_time'
     or p_environment not in ('test', 'live')
     or p_status_capability_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'CUSTOMER_AUTH_PURCHASE_INTENT_INVALID'
      using errcode = 'P0001';
  end if;
  insert into public.production_purchase_intents (
    id, preparation_id, verified_email_authority_id,
    trusted_email_session_id, customer_ownership_binding_id,
    delivery_authority_reference, expected_product_code, expected_amount,
    currency, purchase_kind, provider, environment, state,
    status_capability_hash, final_confirmation_accepted_at,
    created_at, updated_at
  ) values (
    p_purchase_intent_id, preparation.id, null, null, binding.id,
    p_delivery_authority_reference, p_expected_product_code,
    p_expected_amount, pg_catalog.lower(p_currency), p_purchase_kind,
    'stripe', p_environment, 'requires_payment', p_status_capability_hash,
    p_now, p_now, p_now
  ) returning * into intent;
  return pg_catalog.jsonb_build_object(
    'disposition', 'created',
    'intent', pg_catalog.to_jsonb(intent),
    'delivery_email_ciphertext', binding.delivery_email_ciphertext
  );
end;
$function$;

create function public.resolve_customer_purchase_status_v1(
  p_customer_user_id uuid,
  p_status_capability_hash text
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
begin
  select pg_catalog.jsonb_build_object(
    'intent', pg_catalog.to_jsonb(intent) || pg_catalog.jsonb_build_object(
      'email_ciphertext', binding.delivery_email_ciphertext
    ),
    'job', case when job.id is null then null else pg_catalog.to_jsonb(job) end
  ) into result
  from public.production_customer_ownership_bindings as binding
  join public.production_purchase_intents as intent
    on intent.customer_ownership_binding_id = binding.id
    and intent.preparation_id = binding.preparation_id
  left join public.production_fulfillment_jobs as job
    on job.purchase_intent_id = intent.id
  where binding.customer_user_id = p_customer_user_id
    and binding.state = 'active'
    and intent.status_capability_hash = p_status_capability_hash;
  return result;
end;
$function$;

create function public.begin_customer_purchase_intent_from_continuation_v1(
  p_purchase_intent_id uuid,
  p_customer_user_id uuid,
  p_continuation_token_hash text,
  p_status_capability_hash text,
  p_delivery_authority_reference text,
  p_expected_product_code text,
  p_expected_amount integer,
  p_currency text,
  p_purchase_kind text,
  p_environment text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  continuation_preparation_id uuid;
  continuation public.production_customer_auth_continuations%rowtype;
  preparation public.production_preparations%rowtype;
  binding public.production_customer_ownership_bindings%rowtype;
begin
  select preparation_id into continuation_preparation_id
    from public.production_customer_auth_continuations
    where continuation_token_hash = p_continuation_token_hash;
  if continuation_preparation_id is null then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  select * into preparation from public.production_preparations
    where id = continuation_preparation_id for update;
  select * into continuation
    from public.production_customer_auth_continuations
    where continuation_token_hash = p_continuation_token_hash
    for update;
  select * into binding from public.production_customer_ownership_bindings
    where preparation_id = continuation_preparation_id for update;
  if continuation.state <> 'consumed'
     or continuation.expires_at <= p_now
     or preparation.id is null or preparation.status <> 'purchase_ready'
     or binding.id is null or binding.state <> 'active'
     or binding.customer_user_id <> p_customer_user_id then
    raise exception 'CUSTOMER_AUTH_CONTINUATION_INVALID'
      using errcode = 'P0001';
  end if;
  return public.begin_customer_purchase_intent_v1(
    p_purchase_intent_id,
    p_customer_user_id,
    preparation.purchase_capability_hash,
    p_status_capability_hash,
    p_delivery_authority_reference,
    p_expected_product_code,
    p_expected_amount,
    p_currency,
    p_purchase_kind,
    p_environment,
    p_now
  );
end;
$function$;

create function public.resolve_customer_account_history_v1(
  p_customer_user_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
begin
  select coalesce(pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'purchase_intent_id', intent.id,
      'delivery_id', delivery.id,
      'created_at', intent.created_at,
      'state', case when delivery.id is null then 'processing' else 'completed' end
    ) order by intent.created_at desc
  ), '[]'::jsonb) into result
  from public.production_customer_ownership_bindings as binding
  join public.production_purchase_intents as intent
    on intent.customer_ownership_binding_id = binding.id
    and intent.preparation_id = binding.preparation_id
  left join public.production_logical_assessments as logical_assessment
    on logical_assessment.preparation_id = intent.preparation_id
  left join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  where binding.customer_user_id = p_customer_user_id
    and binding.state = 'active';
  return result;
end;
$function$;

create function public.resolve_customer_account_result_v1(
  p_customer_user_id uuid,
  p_delivery_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result jsonb;
begin
  select pg_catalog.jsonb_build_object(
    'delivery_id', delivery.id,
    'experience_projection_json', delivery.experience_projection_json,
    'projection_sha256', delivery.projection_sha256
  ) into result
  from public.production_customer_ownership_bindings as binding
  join public.production_purchase_intents as intent
    on intent.customer_ownership_binding_id = binding.id
    and intent.preparation_id = binding.preparation_id
  join public.production_logical_assessments as logical_assessment
    on logical_assessment.preparation_id = intent.preparation_id
  join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  where binding.customer_user_id = p_customer_user_id
    and binding.state = 'active'
    and delivery.id = p_delivery_id;
  return result;
end;
$function$;

create function public.resolve_customer_completed_delivery_v1(
  p_customer_user_id uuid,
  p_purchase_intent_id uuid
) returns uuid
language sql
security invoker
set search_path = ''
as $function$
  select delivery.id
  from public.production_customer_ownership_bindings as binding
  join public.production_purchase_intents as intent
    on intent.customer_ownership_binding_id = binding.id
    and intent.preparation_id = binding.preparation_id
  join public.production_logical_assessments as logical_assessment
    on logical_assessment.preparation_id = intent.preparation_id
  join public.production_customer_deliveries as delivery
    on delivery.logical_assessment_id = logical_assessment.id
  where binding.customer_user_id = p_customer_user_id
    and binding.state = 'active'
    and intent.id = p_purchase_intent_id;
$function$;

create function public.resolve_production_delivery_email_v2(
  p_delivery_authority_reference text
) returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  result text;
begin
  select case
    when intent.customer_ownership_binding_id is null
      and authority.revoked_at is null then authority.email_ciphertext
    when intent.customer_ownership_binding_id is not null
      and binding.state = 'active' then binding.delivery_email_ciphertext
    else null
  end into result
  from public.production_purchase_intents as intent
  left join public.production_verified_email_authorities as authority
    on authority.id = intent.verified_email_authority_id
  left join public.production_customer_ownership_bindings as binding
    on binding.id = intent.customer_ownership_binding_id
    and binding.preparation_id = intent.preparation_id
  where intent.delivery_authority_reference = p_delivery_authority_reference;
  return result;
end;
$function$;

create function public.detach_production_customer_identity_v1(
  p_customer_user_id uuid,
  p_request_id uuid,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  detached_count integer;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'customer-identity-detachment:' || p_request_id::text, 0
    )
  );
  perform 1 from public.production_customer_ownership_bindings
    where customer_user_id = p_customer_user_id and state = 'active'
    for update;
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
        and binding.customer_user_id = p_customer_user_id
        and binding.state = 'active'
    );
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
    where customer_user_id = p_customer_user_id and state = 'active';
  get diagnostics detached_count = row_count;
  return pg_catalog.jsonb_build_object(
    'disposition', 'completed',
    'detached_binding_count', detached_count
  );
end;
$function$;

alter table public.production_customer_auth_continuations enable row level security;
alter table public.production_customer_ownership_bindings enable row level security;

revoke all privileges on table
  public.production_customer_auth_continuations,
  public.production_customer_ownership_bindings
from public, anon, authenticated, service_role;

grant select, insert, update on table
  public.production_customer_auth_continuations,
  public.production_customer_ownership_bindings
to service_role;

revoke all on function public.create_customer_auth_continuation_v1(
  uuid, text, text, text, text, timestamptz, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.validate_customer_auth_continuation_v1(
  text, text, text, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.bind_production_preparation_to_customer_v1(
  uuid, uuid, text, text, uuid, text, text, text, text,
  timestamptz, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.begin_customer_purchase_intent_v1(
  uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.resolve_customer_purchase_status_v1(
  uuid, text
) from public, anon, authenticated, service_role;
revoke all on function public.begin_customer_purchase_intent_from_continuation_v1(
  uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.resolve_customer_account_history_v1(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.resolve_customer_account_result_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.resolve_customer_completed_delivery_v1(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.resolve_production_delivery_email_v2(text)
  from public, anon, authenticated, service_role;
revoke all on function public.detach_production_customer_identity_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.record_rc2_stripe_evidence_v2(
  text, text, text, timestamptz, text, text, text, text, text,
  text, text, integer, text, text, text, uuid, uuid, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function public.issue_rc2_production_assessment_grant_v2(
  uuid, uuid, uuid, uuid, uuid, text, text, timestamptz
) from public, anon, authenticated, service_role;

grant execute on function public.create_customer_auth_continuation_v1(
  uuid, text, text, text, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.validate_customer_auth_continuation_v1(
  text, text, text, timestamptz
) to service_role;
grant execute on function public.bind_production_preparation_to_customer_v1(
  uuid, uuid, text, text, uuid, text, text, text, text,
  timestamptz, timestamptz
) to service_role;
grant execute on function public.begin_customer_purchase_intent_v1(
  uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz
) to service_role;
grant execute on function public.resolve_customer_purchase_status_v1(
  uuid, text
) to service_role;
grant execute on function public.begin_customer_purchase_intent_from_continuation_v1(
  uuid, uuid, text, text, text, text, integer, text, text, text, timestamptz
) to service_role;
grant execute on function public.resolve_customer_account_history_v1(uuid)
  to service_role;
grant execute on function public.resolve_customer_account_result_v1(uuid, uuid)
  to service_role;
grant execute on function public.resolve_customer_completed_delivery_v1(uuid, uuid)
  to service_role;
grant execute on function public.resolve_production_delivery_email_v2(text)
  to service_role;
grant execute on function public.detach_production_customer_identity_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.record_rc2_stripe_evidence_v2(
  text, text, text, timestamptz, text, text, text, text, text,
  text, text, integer, text, text, text, uuid, uuid, timestamptz
) to service_role;
grant execute on function public.issue_rc2_production_assessment_grant_v2(
  uuid, uuid, uuid, uuid, uuid, text, text, timestamptz
) to service_role;

do $catalog_self_check$
declare
  invalid_public_privilege_count integer;
  customer_identity_column_count integer;
  runtime_owner_column_count integer;
begin
  if not exists (
    select 1 from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'production_customer_auth_continuations'
      and relation.relrowsecurity
  ) or not exists (
    select 1 from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname = 'production_customer_ownership_bindings'
      and relation.relrowsecurity
  ) then
    raise exception 'CUSTOMER_IDENTITY_RLS_SELF_CHECK_FAILED'
      using errcode = 'P0001';
  end if;

  select count(*) into invalid_public_privilege_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'production_customer_auth_continuations',
      'production_customer_ownership_bindings'
    )
    and grantee in ('PUBLIC', 'anon', 'authenticated')
    and privilege_type in (
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'
    );
  if invalid_public_privilege_count <> 0
     or pg_catalog.has_table_privilege(
       'service_role',
       'public.production_customer_auth_continuations',
       'DELETE'
     )
     or pg_catalog.has_table_privilege(
       'service_role',
       'public.production_customer_ownership_bindings',
       'DELETE'
     ) then
    raise exception 'CUSTOMER_IDENTITY_ACL_SELF_CHECK_FAILED'
      using errcode = 'P0001';
  end if;

  select count(*) into customer_identity_column_count
  from information_schema.columns
  where table_schema = 'public' and column_name = 'customer_user_id';
  if customer_identity_column_count <> 1 then
    raise exception 'CUSTOMER_IDENTITY_COLUMN_SCOPE_FAILED'
      using errcode = 'P0001';
  end if;

  select count(*) into runtime_owner_column_count
  from information_schema.columns
  where table_schema = 'public' and column_name = 'owner_id'
    and table_name in (
      'production_logical_assessments',
      'production_notification_outbox',
      'production_fulfillment_jobs'
    );
  if runtime_owner_column_count <> 3 then
    raise exception 'CUSTOMER_IDENTITY_RUNTIME_OWNER_SCOPE_FAILED'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from pg_catalog.pg_index as index_record
    join pg_catalog.pg_class as relation
      on relation.oid = index_record.indexrelid
    where relation.relname =
      'production_customer_auth_one_pending_per_preparation_idx'
      and pg_catalog.pg_get_expr(
        index_record.indpred, index_record.indrelid
      ) ~* 'now[(]'
  ) then
    raise exception 'CUSTOMER_IDENTITY_VOLATILE_INDEX_FAILED'
      using errcode = 'P0001';
  end if;
end;
$catalog_self_check$;

commit;
