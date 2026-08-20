-- RC-2 Production Payment + Customer Delivery integration core.
-- Append-only: the accepted 0010 RC-1 artifact is intentionally unchanged.

create extension if not exists pgcrypto with schema extensions;

create table public.production_email_verification_challenges (
  id uuid primary key,
  preparation_id uuid not null,
  challenge_capability_hash text not null unique,
  verification_secret_hash text not null,
  email_sha256 text not null,
  email_ciphertext text not null,
  status text not null,
  attempt_count integer not null default 0,
  maximum_attempts integer not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  verified_email_authority_id uuid,
  last_error_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_email_challenge_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_email_challenge_hashes check (
    challenge_capability_hash ~ '^[0-9a-f]{64}$'
    and verification_secret_hash ~ '^[0-9a-f]{64}$'
    and email_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint production_email_challenge_status check (
    status in ('pending', 'delivery_failed', 'consumed', 'revoked')
  ),
  constraint production_email_challenge_attempts check (
    attempt_count >= 0 and maximum_attempts between 1 and 20
    and attempt_count <= maximum_attempts
  ),
  constraint production_email_challenge_expiry check (expires_at > created_at),
  constraint production_email_challenge_state check (
    (status = 'pending' and consumed_at is null and revoked_at is null)
    or (status = 'delivery_failed' and consumed_at is null and revoked_at is not null)
    or (status = 'consumed' and consumed_at is not null and revoked_at is null)
    or (status = 'revoked' and consumed_at is null and revoked_at is not null)
  )
);

create table public.production_verified_email_authorities (
  id uuid primary key,
  delivery_authority_reference text not null unique,
  email_sha256 text not null,
  email_ciphertext text not null,
  verified_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_verified_email_hash
    check (email_sha256 ~ '^[0-9a-f]{64}$'),
  constraint production_verified_email_reference
    check (char_length(delivery_authority_reference) between 16 and 256),
  constraint production_verified_email_id_hash_unique unique (id, email_sha256)
);

alter table public.production_email_verification_challenges
  add constraint production_email_challenge_authority_fk
  foreign key (verified_email_authority_id)
  references public.production_verified_email_authorities(id) on delete restrict;
alter table public.production_email_verification_challenges
  add constraint production_email_challenge_authority_hash_binding_fk
  foreign key (verified_email_authority_id, email_sha256)
  references public.production_verified_email_authorities(id, email_sha256)
  on delete restrict;

create table public.production_trusted_email_sessions (
  id uuid primary key,
  verified_email_authority_id uuid not null,
  session_token_hash text not null unique,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_trusted_email_authority_fk
    foreign key (verified_email_authority_id)
    references public.production_verified_email_authorities(id) on delete restrict,
  constraint production_trusted_email_hash
    check (session_token_hash ~ '^[0-9a-f]{64}$'),
  constraint production_trusted_email_authority_id_unique
    unique (verified_email_authority_id, id),
  constraint production_trusted_email_expiry check (expires_at > issued_at)
);

create table public.production_preparation_email_bindings (
  preparation_id uuid primary key,
  intended_email_sha256 text not null,
  verified_email_authority_id uuid,
  trusted_email_session_id uuid,
  state text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_preparation_email_binding_preparation_fk
    foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_preparation_email_binding_hash
    check (intended_email_sha256 ~ '^[0-9a-f]{64}$'),
  constraint production_preparation_email_binding_state check (
    (state = 'verification_pending'
      and verified_email_authority_id is null
      and trusted_email_session_id is null)
    or (state = 'verified'
      and verified_email_authority_id is not null
      and trusted_email_session_id is not null)
  ),
  constraint production_preparation_email_binding_authority_hash_fk
    foreign key (verified_email_authority_id, intended_email_sha256)
    references public.production_verified_email_authorities(id, email_sha256)
    on delete restrict,
  constraint production_preparation_email_binding_session_authority_fk
    foreign key (verified_email_authority_id, trusted_email_session_id)
    references public.production_trusted_email_sessions(
      verified_email_authority_id, id
    ) on delete restrict,
  constraint production_preparation_email_binding_identity_unique
    unique (preparation_id, verified_email_authority_id, trusted_email_session_id)
);

create table public.production_purchase_intents (
  id uuid primary key,
  preparation_id uuid not null unique,
  verified_email_authority_id uuid not null,
  trusted_email_session_id uuid not null,
  delivery_authority_reference text not null unique,
  expected_product_code text not null,
  expected_amount integer not null,
  currency text not null,
  purchase_kind text not null,
  provider text not null,
  environment text not null,
  state text not null,
  current_payment_attempt_id uuid,
  successful_payment_id uuid,
  status_capability_hash text not null unique,
  final_confirmation_accepted_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_purchase_intent_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_purchase_intent_email_fk
    foreign key (verified_email_authority_id)
    references public.production_verified_email_authorities(id) on delete restrict,
  constraint production_purchase_intent_session_fk
    foreign key (trusted_email_session_id)
    references public.production_trusted_email_sessions(id) on delete restrict,
  constraint production_purchase_intent_session_authority_binding_fk
    foreign key (verified_email_authority_id, trusted_email_session_id)
    references public.production_trusted_email_sessions(
      verified_email_authority_id, id
    ) on delete restrict,
  constraint production_purchase_intent_preparation_email_binding_fk
    foreign key (
      preparation_id, verified_email_authority_id, trusted_email_session_id
    ) references public.production_preparation_email_bindings(
      preparation_id, verified_email_authority_id, trusted_email_session_id
    ) on delete restrict,
  constraint production_purchase_intent_id_preparation_unique
    unique (id, preparation_id),
  constraint production_purchase_intent_id_delivery_unique
    unique (id, delivery_authority_reference),
  constraint production_purchase_intent_product check (
    expected_product_code = 'moon_reply_love_message_assessment_note_v1'
    and expected_amount = 980
    and currency = 'jpy'
    and purchase_kind = 'one_time'
    and provider = 'stripe'
  ),
  constraint production_purchase_intent_environment
    check (environment in ('test', 'live')),
  constraint production_purchase_intent_state check (state in (
    'requires_payment', 'pending', 'processing', 'unknown',
    'payment_failed', 'canceled', 'verified', 'manual_review'
  )),
  constraint production_purchase_intent_status_hash
    check (status_capability_hash ~ '^[0-9a-f]{64}$'),
  constraint production_purchase_intent_delivery_reference
    check (delivery_authority_reference ~
      '^purchase-delivery:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  constraint production_purchase_intent_success_state check (
    (state = 'verified' and successful_payment_id is not null)
    or state = 'manual_review'
    or (state not in ('verified', 'manual_review')
      and successful_payment_id is null)
  )
);

create table public.production_payment_attempts (
  id uuid primary key,
  purchase_intent_id uuid not null,
  sequence_number integer not null,
  state text not null,
  provider_idempotency_key_hash text not null unique,
  provider_checkout_session_id text unique,
  provider_payment_id text unique,
  provider_checkout_url text,
  last_provider_event_created_at timestamptz,
  last_error_code text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_payment_attempt_intent_fk foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_payment_attempt_sequence unique (purchase_intent_id, sequence_number),
  constraint production_payment_attempt_intent_id_unique
    unique (purchase_intent_id, id),
  constraint production_payment_attempt_sequence_positive check (sequence_number >= 1),
  constraint production_payment_attempt_state check (state in (
    'reserved', 'pending', 'processing', 'unknown',
    'failed', 'canceled', 'succeeded'
  )),
  constraint production_payment_attempt_idempotency_hash
    check (provider_idempotency_key_hash ~ '^[0-9a-f]{64}$'),
  constraint production_payment_attempt_provider_ids check (
    (provider_checkout_session_id is null or
      provider_checkout_session_id ~ '^cs_(test|live)_[A-Za-z0-9_]+$')
    and (provider_payment_id is null or
      provider_payment_id ~ '^pi_[A-Za-z0-9_]+$')
    and (provider_checkout_url is null or
      provider_checkout_url ~ '^https://checkout[.]stripe[.]com/')
  ),
  constraint production_payment_attempt_checkout_binding check (
    (state = 'reserved' and provider_checkout_session_id is null
      and provider_checkout_url is null)
    or (state <> 'reserved' and (
      state = 'unknown' or provider_checkout_session_id is not null
    ))
  )
);

create unique index production_payment_attempt_one_success_idx
  on public.production_payment_attempts(purchase_intent_id)
  where state = 'succeeded';

alter table public.production_purchase_intents
  add constraint production_purchase_intent_current_attempt_fk
  foreign key (id, current_payment_attempt_id)
  references public.production_payment_attempts(purchase_intent_id, id)
  on delete restrict;

create table public.production_verified_payments (
  id uuid primary key,
  purchase_intent_id uuid not null unique,
  payment_attempt_id uuid not null unique,
  provider_checkout_session_id text not null unique,
  provider_payment_id text not null unique,
  provider_event_id text not null unique,
  product_code text not null,
  amount integer not null,
  currency text not null,
  environment text not null,
  verified_at timestamptz not null,
  created_at timestamptz not null,
  constraint production_verified_payment_intent_fk foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_verified_payment_attempt_fk foreign key (payment_attempt_id)
    references public.production_payment_attempts(id) on delete restrict,
  constraint production_verified_payment_attempt_binding_fk
    foreign key (purchase_intent_id, payment_attempt_id)
    references public.production_payment_attempts(purchase_intent_id, id)
    on delete restrict,
  constraint production_verified_payment_intent_id_unique
    unique (purchase_intent_id, id),
  constraint production_verified_payment_economics check (
    product_code = 'moon_reply_love_message_assessment_note_v1'
    and amount = 980 and currency = 'jpy'
  ),
  constraint production_verified_payment_environment
    check (environment in ('test', 'live')),
  constraint production_verified_payment_provider_ids check (
    provider_checkout_session_id ~ '^cs_(test|live)_[A-Za-z0-9_]+$'
    and provider_payment_id ~ '^pi_[A-Za-z0-9_]+$'
    and provider_event_id ~
      '^(evt_[A-Za-z0-9_]+|reconcile_[0-9a-f]{64})$'
  )
);

alter table public.production_purchase_intents
  add constraint production_purchase_intent_successful_payment_fk
  foreign key (id, successful_payment_id)
  references public.production_verified_payments(purchase_intent_id, id)
  on delete restrict;

create table public.production_stripe_event_ledger (
  provider_event_id text primary key,
  evidence_source text not null,
  event_type text not null,
  provider_created_at timestamptz not null,
  payload_sha256 text not null,
  environment text not null,
  purchase_reference text,
  provider_checkout_session_id text,
  provider_payment_id text,
  mode text,
  payment_status text,
  amount_total integer,
  currency text,
  disposition text not null,
  reason_code text,
  purchase_intent_id uuid,
  verified_payment_id uuid,
  fulfillment_job_id uuid,
  received_at timestamptz not null,
  processed_at timestamptz,
  constraint production_stripe_event_payload_hash
    check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  constraint production_stripe_event_provider_id
    check (provider_event_id ~
      '^(evt_[A-Za-z0-9_]+|reconcile_[0-9a-f]{64})$'),
  constraint production_stripe_event_source check (
    (evidence_source = 'webhook'
      and provider_event_id ~ '^evt_[A-Za-z0-9_]+$')
    or (evidence_source = 'reconciliation'
      and provider_event_id ~ '^reconcile_[0-9a-f]{64}$')
  ),
  constraint production_stripe_event_environment
    check (environment in ('test', 'live')),
  constraint production_stripe_event_disposition check (disposition in (
    'received', 'pending', 'failed', 'canceled', 'rejected',
    'stale', 'applied', 'duplicate', 'conflict', 'ignored'
  )),
  constraint production_stripe_event_reference_binding check (
    (verified_payment_id is null or purchase_intent_id is not null)
    and (fulfillment_job_id is null or purchase_intent_id is not null)
  ),
  constraint production_stripe_event_intent_fk foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_stripe_event_payment_fk foreign key (verified_payment_id)
    references public.production_verified_payments(id) on delete restrict,
  constraint production_stripe_event_payment_binding_fk
    foreign key (purchase_intent_id, verified_payment_id)
    references public.production_verified_payments(purchase_intent_id, id)
    on delete restrict
);

alter table public.production_verified_payments
  add constraint production_verified_payment_event_fk
  foreign key (provider_event_id)
  references public.production_stripe_event_ledger(provider_event_id)
  on delete restrict;

create table public.production_fulfillment_jobs (
  id uuid primary key,
  purchase_intent_id uuid not null unique,
  verified_payment_id uuid not null unique,
  preparation_id uuid not null unique,
  delivery_authority_reference text not null,
  state text not null,
  owner_id uuid,
  lease_expires_at timestamptz,
  attempt_count integer not null default 0,
  grant_id uuid unique,
  logical_assessment_id uuid unique,
  last_error_code text,
  requested_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_fulfillment_job_intent_fk foreign key (purchase_intent_id)
    references public.production_purchase_intents(id) on delete restrict,
  constraint production_fulfillment_job_payment_fk foreign key (verified_payment_id)
    references public.production_verified_payments(id) on delete restrict,
  constraint production_fulfillment_job_preparation_fk foreign key (preparation_id)
    references public.production_preparations(id) on delete restrict,
  constraint production_fulfillment_job_payment_binding_fk
    foreign key (purchase_intent_id, verified_payment_id)
    references public.production_verified_payments(purchase_intent_id, id)
    on delete restrict,
  constraint production_fulfillment_job_preparation_binding_fk
    foreign key (purchase_intent_id, preparation_id)
    references public.production_purchase_intents(id, preparation_id)
    on delete restrict,
  constraint production_fulfillment_job_delivery_binding_fk
    foreign key (purchase_intent_id, delivery_authority_reference)
    references public.production_purchase_intents(id, delivery_authority_reference)
    on delete restrict,
  constraint production_fulfillment_job_grant_fk foreign key (grant_id)
    references public.production_assessment_grants(id) on delete restrict,
  constraint production_fulfillment_job_logical_fk foreign key (logical_assessment_id)
    references public.production_logical_assessments(id) on delete restrict,
  constraint production_fulfillment_job_state check (
    state in ('pending', 'processing', 'retryable', 'completed', 'manual_review')
  ),
  constraint production_fulfillment_job_attempt_count check (attempt_count >= 0),
  constraint production_fulfillment_job_intent_id_unique
    unique (purchase_intent_id, id),
  constraint production_fulfillment_job_owner check (
    (state = 'processing' and owner_id is not null and lease_expires_at is not null)
    or (state <> 'processing' and owner_id is null and lease_expires_at is null)
  ),
  constraint production_fulfillment_job_grant_pair check (
    (grant_id is null and logical_assessment_id is null)
    or (grant_id is not null and logical_assessment_id is not null)
  )
);

alter table public.production_stripe_event_ledger
  add constraint production_stripe_event_job_fk foreign key (fulfillment_job_id)
  references public.production_fulfillment_jobs(id) on delete restrict;
alter table public.production_stripe_event_ledger
  add constraint production_stripe_event_job_binding_fk
  foreign key (purchase_intent_id, fulfillment_job_id)
  references public.production_fulfillment_jobs(purchase_intent_id, id)
  on delete restrict;

create table public.production_payment_adjustment_ledger (
  id uuid primary key,
  verified_payment_id uuid not null,
  provider_event_id text unique,
  adjustment_kind text not null,
  state text not null,
  amount integer,
  currency text,
  reason_code text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  constraint production_payment_adjustment_payment_fk foreign key (verified_payment_id)
    references public.production_verified_payments(id) on delete restrict,
  constraint production_payment_adjustment_kind check (adjustment_kind in (
    'ordinary_refund', 'payment_integrity_refund', 'reversal',
    'dispute', 'chargeback'
  )),
  constraint production_payment_adjustment_state check (
    state in ('requested', 'pending', 'succeeded', 'failed', 'manual_review')
  ),
  constraint production_payment_adjustment_amount check (
    amount is null or amount >= 0
  ),
  constraint production_payment_adjustment_currency check (
    currency is null or currency = 'jpy'
  )
);

create index production_email_challenge_preparation_idx
  on public.production_email_verification_challenges(preparation_id, status);
create index production_trusted_email_authority_idx
  on public.production_trusted_email_sessions(verified_email_authority_id);
create index production_purchase_intent_state_idx
  on public.production_purchase_intents(state);
create index production_payment_attempt_intent_state_idx
  on public.production_payment_attempts(purchase_intent_id, state);
create index production_stripe_event_intent_idx
  on public.production_stripe_event_ledger(purchase_intent_id);
create index production_fulfillment_job_state_idx
  on public.production_fulfillment_jobs(state, requested_at);
create unique index production_rc2_grant_delivery_reference_idx
  on public.production_assessment_grants(delivery_authority_reference)
  where delivery_authority_reference like 'purchase-delivery:%';
create unique index production_rc2_outbox_delivery_reference_idx
  on public.production_notification_outbox(delivery_authority_reference)
  where delivery_authority_reference like 'purchase-delivery:%';

alter table public.production_email_verification_challenges enable row level security;
alter table public.production_verified_email_authorities enable row level security;
alter table public.production_trusted_email_sessions enable row level security;
alter table public.production_preparation_email_bindings enable row level security;
alter table public.production_purchase_intents enable row level security;
alter table public.production_payment_attempts enable row level security;
alter table public.production_verified_payments enable row level security;
alter table public.production_stripe_event_ledger enable row level security;
alter table public.production_fulfillment_jobs enable row level security;
alter table public.production_payment_adjustment_ledger enable row level security;

create function public.bind_rc2_trusted_email_to_preparation_v1(
  p_preparation_capability_hash text,
  p_trusted_session_token_hash text,
  p_email_sha256 text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
  trusted public.production_trusted_email_sessions%rowtype;
  authority public.production_verified_email_authorities%rowtype;
  binding public.production_preparation_email_bindings%rowtype;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash for update;
  if preparation.id is null or preparation.status <> 'purchase_ready' then
    raise exception 'RC2_PURCHASE_READY_REQUIRED' using errcode = 'P0001';
  end if;
  select * into trusted from public.production_trusted_email_sessions
    where session_token_hash = p_trusted_session_token_hash
      and revoked_at is null and expires_at > p_now for update;
  if trusted.id is null then
    return jsonb_build_object('disposition', 'invalid');
  end if;
  select * into authority from public.production_verified_email_authorities
    where id = trusted.verified_email_authority_id
      and email_sha256 = p_email_sha256
      and revoked_at is null for update;
  if authority.id is null then
    return jsonb_build_object('disposition', 'invalid');
  end if;
  select * into binding from public.production_preparation_email_bindings
    where preparation_id = preparation.id for update;
  if exists (
    select 1 from public.production_purchase_intents
      where preparation_id = preparation.id
  ) then
    if binding.preparation_id is null
       or binding.state <> 'verified'
       or binding.intended_email_sha256 <> authority.email_sha256
       or binding.verified_email_authority_id <> authority.id
       or binding.trusted_email_session_id <> trusted.id then
      raise exception 'RC2_PURCHASE_INTENT_CONFLICT' using errcode = 'P0001';
    end if;
  else
    insert into public.production_preparation_email_bindings (
      preparation_id, intended_email_sha256, verified_email_authority_id,
      trusted_email_session_id, state, created_at, updated_at
    ) values (
      preparation.id, authority.email_sha256, authority.id, trusted.id,
      'verified', p_now, p_now
    ) on conflict (preparation_id) do update set
      intended_email_sha256 = excluded.intended_email_sha256,
      verified_email_authority_id = excluded.verified_email_authority_id,
      trusted_email_session_id = excluded.trusted_email_session_id,
      state = excluded.state,
      updated_at = excluded.updated_at;
  end if;
  update public.production_trusted_email_sessions set
    last_used_at = p_now, updated_at = p_now where id = trusted.id;
  return jsonb_build_object('disposition', 'bound');
end;
$function$;

create function public.begin_rc2_email_challenge_v1(
  p_preparation_capability_hash text,
  p_challenge_id uuid,
  p_challenge_capability_hash text,
  p_verification_secret_hash text,
  p_email_sha256 text,
  p_email_ciphertext text,
  p_maximum_attempts integer,
  p_expires_at timestamptz,
  p_now timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  preparation public.production_preparations%rowtype;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash for update;
  if preparation.id is null or preparation.status <> 'purchase_ready' then
    raise exception 'RC2_PURCHASE_READY_REQUIRED' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.production_purchase_intents
      where preparation_id = preparation.id
  ) then
    raise exception 'RC2_PURCHASE_INTENT_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_email_verification_challenges set
    status = 'revoked', revoked_at = p_now, updated_at = p_now,
    last_error_code = 'EMAIL_CHALLENGE_SUPERSEDED'
    where preparation_id = preparation.id and status = 'pending';
  insert into public.production_preparation_email_bindings (
    preparation_id, intended_email_sha256, verified_email_authority_id,
    trusted_email_session_id, state, created_at, updated_at
  ) values (
    preparation.id, p_email_sha256, null, null,
    'verification_pending', p_now, p_now
  ) on conflict (preparation_id) do update set
    intended_email_sha256 = excluded.intended_email_sha256,
    verified_email_authority_id = null,
    trusted_email_session_id = null,
    state = 'verification_pending',
    updated_at = excluded.updated_at;
  insert into public.production_email_verification_challenges (
    id, preparation_id, challenge_capability_hash, verification_secret_hash,
    email_sha256, email_ciphertext, status, attempt_count, maximum_attempts,
    expires_at, created_at, updated_at
  ) values (
    p_challenge_id, preparation.id, p_challenge_capability_hash,
    p_verification_secret_hash, p_email_sha256, p_email_ciphertext,
    'pending', 0, p_maximum_attempts, p_expires_at, p_now, p_now
  );
  return preparation.id;
end;
$function$;

create function public.mark_rc2_email_challenge_delivery_failed_v1(
  p_challenge_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_email_verification_challenges set
    status = 'delivery_failed', revoked_at = p_now,
    last_error_code = p_error_code, updated_at = p_now
    where id = p_challenge_id and status = 'pending';
  if not found then
    raise exception 'RC2_EMAIL_CHALLENGE_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.consume_rc2_email_challenge_v1(
  p_challenge_capability_hash text,
  p_verification_secret_hash text,
  p_verified_email_authority_id uuid,
  p_delivery_authority_reference text,
  p_trusted_session_id uuid,
  p_trusted_session_token_hash text,
  p_trusted_session_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  challenge public.production_email_verification_challenges%rowtype;
  binding public.production_preparation_email_bindings%rowtype;
  target_preparation_id uuid;
begin
  select preparation_id into target_preparation_id
    from public.production_email_verification_challenges
    where challenge_capability_hash = p_challenge_capability_hash;
  if target_preparation_id is null then
    return jsonb_build_object('disposition', 'invalid');
  end if;
  perform 1 from public.production_preparations
    where id = target_preparation_id for update;
  select * into challenge from public.production_email_verification_challenges
    where challenge_capability_hash = p_challenge_capability_hash for update;
  if challenge.id is null or challenge.status <> 'pending' then
    return jsonb_build_object('disposition', 'invalid');
  end if;
  if challenge.expires_at <= p_now then
    update public.production_email_verification_challenges set
      status = 'revoked', revoked_at = p_now, updated_at = p_now,
      last_error_code = 'EMAIL_CHALLENGE_EXPIRED'
      where id = challenge.id;
    return jsonb_build_object('disposition', 'invalid');
  end if;
  if challenge.verification_secret_hash <> p_verification_secret_hash then
    update public.production_email_verification_challenges set
      attempt_count = least(attempt_count + 1, maximum_attempts),
      status = case when attempt_count + 1 >= maximum_attempts
        then 'revoked' else status end,
      revoked_at = case when attempt_count + 1 >= maximum_attempts
        then p_now else revoked_at end,
      last_error_code = 'EMAIL_VERIFICATION_INVALID', updated_at = p_now
      where id = challenge.id;
    return jsonb_build_object('disposition', 'invalid');
  end if;
  select * into binding from public.production_preparation_email_bindings
    where preparation_id = challenge.preparation_id for update;
  if binding.preparation_id is null
     or binding.state <> 'verification_pending'
     or binding.intended_email_sha256 <> challenge.email_sha256 then
    return jsonb_build_object('disposition', 'invalid');
  end if;
  insert into public.production_verified_email_authorities (
    id, delivery_authority_reference, email_sha256, email_ciphertext,
    verified_at, created_at, updated_at
  ) values (
    p_verified_email_authority_id, p_delivery_authority_reference,
    challenge.email_sha256, challenge.email_ciphertext, p_now, p_now, p_now
  );
  insert into public.production_trusted_email_sessions (
    id, verified_email_authority_id, session_token_hash, issued_at,
    expires_at, created_at, updated_at
  ) values (
    p_trusted_session_id, p_verified_email_authority_id,
    p_trusted_session_token_hash, p_now, p_trusted_session_expires_at,
    p_now, p_now
  );
  update public.production_email_verification_challenges set
    status = 'consumed', consumed_at = p_now,
    verified_email_authority_id = p_verified_email_authority_id,
    updated_at = p_now, last_error_code = null
    where id = challenge.id;
  update public.production_preparation_email_bindings set
    verified_email_authority_id = p_verified_email_authority_id,
    trusted_email_session_id = p_trusted_session_id,
    state = 'verified', updated_at = p_now
    where preparation_id = challenge.preparation_id
      and state = 'verification_pending'
      and intended_email_sha256 = challenge.email_sha256;
  if not found then
    raise exception 'RC2_EMAIL_BINDING_CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'disposition', 'verified',
    'verified_email_authority_id', p_verified_email_authority_id,
    'trusted_session_id', p_trusted_session_id
  );
end;
$function$;

create function public.begin_rc2_purchase_intent_v1(
  p_purchase_intent_id uuid,
  p_preparation_capability_hash text,
  p_trusted_session_token_hash text,
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
  trusted public.production_trusted_email_sessions%rowtype;
  authority public.production_verified_email_authorities%rowtype;
  binding public.production_preparation_email_bindings%rowtype;
  existing public.production_purchase_intents%rowtype;
begin
  select * into preparation from public.production_preparations
    where purchase_capability_hash = p_preparation_capability_hash for update;
  if preparation.id is null or preparation.status <> 'purchase_ready' then
    raise exception 'RC2_PURCHASE_READY_REQUIRED' using errcode = 'P0001';
  end if;
  select * into trusted from public.production_trusted_email_sessions
    where session_token_hash = p_trusted_session_token_hash
      and revoked_at is null and expires_at > p_now for update;
  if trusted.id is null then
    raise exception 'RC2_VERIFIED_EMAIL_REQUIRED' using errcode = 'P0001';
  end if;
  select * into authority from public.production_verified_email_authorities
    where id = trusted.verified_email_authority_id and revoked_at is null for update;
  if authority.id is null then
    raise exception 'RC2_VERIFIED_EMAIL_REQUIRED' using errcode = 'P0001';
  end if;
  select * into binding from public.production_preparation_email_bindings
    where preparation_id = preparation.id for update;
  if binding.preparation_id is null
     or binding.state <> 'verified'
     or binding.intended_email_sha256 <> authority.email_sha256
     or binding.verified_email_authority_id <> authority.id
     or binding.trusted_email_session_id <> trusted.id then
    raise exception 'RC2_VERIFIED_EMAIL_REQUIRED' using errcode = 'P0001';
  end if;
  select * into existing from public.production_purchase_intents
    where preparation_id = preparation.id for update;
  if existing.id is not null then
    if existing.verified_email_authority_id <> authority.id
       or existing.trusted_email_session_id <> trusted.id
       or existing.expected_product_code <> p_expected_product_code
       or existing.expected_amount <> p_expected_amount
       or existing.currency <> p_currency
       or existing.purchase_kind <> p_purchase_kind
       or existing.environment <> p_environment then
      raise exception 'RC2_PURCHASE_INTENT_CONFLICT' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'disposition', 'existing', 'purchase_intent_id', existing.id
    );
  end if;
  if p_expected_product_code <> 'moon_reply_love_message_assessment_note_v1'
     or p_expected_amount <> 980 or p_currency <> 'jpy'
     or p_purchase_kind <> 'one_time'
     or p_environment not in ('test', 'live') then
    raise exception 'RC2_PURCHASE_INTENT_CONFLICT' using errcode = 'P0001';
  end if;
  insert into public.production_purchase_intents (
    id, preparation_id, verified_email_authority_id, trusted_email_session_id,
    delivery_authority_reference,
    expected_product_code, expected_amount, currency, purchase_kind,
    provider, environment, state, status_capability_hash,
    final_confirmation_accepted_at, created_at, updated_at
  ) values (
    p_purchase_intent_id, preparation.id, authority.id, trusted.id,
    p_delivery_authority_reference,
    p_expected_product_code, p_expected_amount, p_currency, p_purchase_kind,
    'stripe', p_environment, 'requires_payment', p_status_capability_hash,
    p_now, p_now, p_now
  );
  update public.production_trusted_email_sessions set
    last_used_at = p_now, updated_at = p_now where id = trusted.id;
  return jsonb_build_object(
    'disposition', 'created', 'purchase_intent_id', p_purchase_intent_id
  );
end;
$function$;

create function public.reserve_rc2_payment_attempt_v1(
  p_purchase_intent_id uuid,
  p_attempt_id uuid,
  p_provider_idempotency_key_hash text,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent public.production_purchase_intents%rowtype;
  current_attempt public.production_payment_attempts%rowtype;
  next_sequence integer;
begin
  select * into intent from public.production_purchase_intents
    where id = p_purchase_intent_id for update;
  if intent.id is null then
    raise exception 'RC2_PURCHASE_INTENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if intent.state in ('verified', 'manual_review') then
    raise exception 'RC2_PAYMENT_ATTEMPT_BLOCKED' using errcode = 'P0001';
  end if;
  if intent.current_payment_attempt_id is not null then
    select * into current_attempt from public.production_payment_attempts
      where id = intent.current_payment_attempt_id for update;
    if current_attempt.state in (
      'reserved', 'pending', 'processing', 'unknown', 'succeeded'
    ) then
      return jsonb_build_object(
        'disposition', 'existing', 'payment_attempt_id', current_attempt.id
      );
    end if;
  end if;
  select coalesce(max(sequence_number), 0) + 1 into next_sequence
    from public.production_payment_attempts
    where purchase_intent_id = intent.id;
  insert into public.production_payment_attempts (
    id, purchase_intent_id, sequence_number, state,
    provider_idempotency_key_hash, created_at, updated_at
  ) values (
    p_attempt_id, intent.id, next_sequence, 'reserved',
    p_provider_idempotency_key_hash, p_now, p_now
  );
  update public.production_purchase_intents set
    current_payment_attempt_id = p_attempt_id,
    state = 'requires_payment', updated_at = p_now
    where id = intent.id;
  return jsonb_build_object(
    'disposition', 'created', 'payment_attempt_id', p_attempt_id
  );
end;
$function$;

create function public.attach_rc2_checkout_session_v1(
  p_attempt_id uuid,
  p_provider_checkout_session_id text,
  p_provider_checkout_url text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent_id uuid;
  existing_attempt public.production_payment_attempts%rowtype;
begin
  select purchase_intent_id into intent_id
    from public.production_payment_attempts where id = p_attempt_id;
  if intent_id is null then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.production_purchase_intents
    where id = intent_id for update;
  update public.production_payment_attempts set
    state = 'pending',
    provider_checkout_session_id = p_provider_checkout_session_id,
    provider_checkout_url = p_provider_checkout_url,
    last_error_code = null, updated_at = p_now
    where id = p_attempt_id and state in ('reserved', 'unknown')
      and (provider_checkout_session_id is null
        or provider_checkout_session_id = p_provider_checkout_session_id)
      and (provider_checkout_url is null
        or provider_checkout_url = p_provider_checkout_url)
    returning purchase_intent_id into intent_id;
  if intent_id is null then
    select * into existing_attempt from public.production_payment_attempts
      where id = p_attempt_id for update;
    if existing_attempt.id is not null
       and existing_attempt.state = 'pending'
       and existing_attempt.provider_checkout_session_id is not distinct from
         p_provider_checkout_session_id
       and existing_attempt.provider_checkout_url is not distinct from
         p_provider_checkout_url then
      return;
    end if;
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_purchase_intents set
    state = 'pending', updated_at = p_now
    where id = intent_id and current_payment_attempt_id = p_attempt_id
      and state in ('requires_payment', 'unknown');
  if not found then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.mark_rc2_payment_attempt_unknown_v1(
  p_attempt_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent_id uuid;
begin
  select purchase_intent_id into intent_id
    from public.production_payment_attempts where id = p_attempt_id;
  if intent_id is null then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  perform 1 from public.production_purchase_intents
    where id = intent_id and current_payment_attempt_id = p_attempt_id
      and state not in ('verified', 'manual_review') for update;
  if not found then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_payment_attempts set
    state = 'unknown', last_error_code = p_error_code, updated_at = p_now
    where id = p_attempt_id
      and state in ('reserved', 'pending', 'processing', 'unknown')
    returning purchase_intent_id into intent_id;
  if intent_id is null then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
  update public.production_purchase_intents set
    state = 'unknown', updated_at = p_now
    where id = intent_id and current_payment_attempt_id = p_attempt_id
      and state not in ('verified', 'manual_review');
  if not found then
    raise exception 'RC2_PAYMENT_ATTEMPT_STATE_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.record_rc2_stripe_evidence_v1(
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
  preparation public.production_preparations%rowtype;
  existing_payment public.production_verified_payments%rowtype;
  existing_job_id uuid;
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
    return jsonb_build_object(
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
  if intent.id is null or attempt.id is null
     or attempt.purchase_intent_id <> intent.id then
    final_disposition := 'rejected';
    final_reason := 'PAYMENT_BINDING_INVALID';
  elsif p_application_disposition = 'rejected' then
    final_disposition := 'rejected';
    final_reason := coalesce(p_application_reason_code, 'PAYMENT_EVIDENCE_REJECTED');
  else
    final_disposition := null;
    final_reason := null;
  end if;
  if final_disposition is not null then
    update public.production_stripe_event_ledger set
      disposition = final_disposition, reason_code = final_reason,
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
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
    return jsonb_build_object(
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
    return jsonb_build_object(
      'disposition', final_disposition,
      'purchase_intent_id', intent.id,
      'verified_payment_id', null,
      'fulfillment_job_id', null
    );
  end if;
  select * into authority from public.production_verified_email_authorities
    where id = intent.verified_email_authority_id and revoked_at is null for update;
  select * into preparation from public.production_preparations
    where id = intent.preparation_id for update;
  if authority.id is null or preparation.id is null
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
     or lower(p_currency) is distinct from 'jpy'
     or p_provider_payment_id is null then
    update public.production_stripe_event_ledger set
      disposition = 'rejected', reason_code = 'PAYMENT_DB_VERIFICATION_FAILED',
      purchase_intent_id = intent.id, processed_at = p_now
      where provider_event_id = p_provider_event_id;
    return jsonb_build_object(
      'disposition', 'rejected', 'purchase_intent_id', intent.id,
      'verified_payment_id', null, 'fulfillment_job_id', null
    );
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'rc2-provider-payment:' || p_provider_payment_id,
      0
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
    return jsonb_build_object(
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
    return jsonb_build_object(
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
    intent.expected_product_code, p_amount_total, lower(p_currency),
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
  return jsonb_build_object(
    'disposition', 'verified', 'purchase_intent_id', intent.id,
    'verified_payment_id', p_verified_payment_id,
    'fulfillment_job_id', p_fulfillment_job_id
  );
end;
$function$;

create function public.issue_rc2_production_assessment_grant_v1(
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
  job public.production_fulfillment_jobs%rowtype;
  existing_grant public.production_assessment_grants%rowtype;
  existing_purchase_hash text;
  existing_logical_id uuid;
  expected_reference_hash text;
  target_intent_id uuid;
begin
  select purchase_intent_id into target_intent_id
    from public.production_verified_payments where id = p_verified_payment_id;
  if target_intent_id is null then
    raise exception 'RC2_VERIFIED_PAYMENT_REQUIRED' using errcode = 'P0001';
  end if;
  select * into intent from public.production_purchase_intents
    where id = target_intent_id for update;
  select * into authority from public.production_verified_email_authorities
    where id = intent.verified_email_authority_id for update;
  select * into preparation from public.production_preparations
    where id = p_preparation_id for update;
  select * into verified from public.production_verified_payments
    where id = p_verified_payment_id
      and purchase_intent_id = intent.id for update;
  select * into job from public.production_fulfillment_jobs
    where verified_payment_id = p_verified_payment_id for update;
  expected_reference_hash := encode(extensions.digest(
    convert_to('verified-payment:' || p_verified_payment_id::text, 'UTF8'),
    'sha256'
  ), 'hex');
  if verified.id is null or intent.id is null or preparation.id is null
     or authority.id is null or job.id is null
     or intent.state <> 'verified'
     or intent.successful_payment_id <> verified.id
     or intent.preparation_id <> preparation.id
     or verified.purchase_intent_id <> intent.id
     or verified.product_code <> 'moon_reply_love_message_assessment_note_v1'
     or verified.amount <> 980 or verified.currency <> 'jpy'
     or verified.environment is distinct from intent.environment
     or preparation.status not in ('purchase_ready', 'consumed')
     or authority.revoked_at is not null
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
    return jsonb_build_object(
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
  return jsonb_build_object(
    'grant_id', p_grant_id,
    'logical_assessment_id', p_logical_assessment_id
  );
end;
$function$;

create function public.claim_rc2_fulfillment_job_v1(
  p_status_capability_hash text,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  intent public.production_purchase_intents%rowtype;
  job public.production_fulfillment_jobs%rowtype;
begin
  select * into intent from public.production_purchase_intents
    where status_capability_hash = p_status_capability_hash for update;
  if intent.id is null then return null; end if;
  if intent.state <> 'verified' or intent.successful_payment_id is null then
    return null;
  end if;
  select * into job from public.production_fulfillment_jobs
    where purchase_intent_id = intent.id for update;
  if job.id is null then return null; end if;
  if job.state = 'completed' then
    return jsonb_build_object(
      'disposition', 'completed', 'fulfillment_job_id', job.id
    );
  end if;
  if job.state = 'processing' and job.lease_expires_at > p_now then
    return jsonb_build_object(
      'disposition', 'in_progress', 'fulfillment_job_id', job.id
    );
  end if;
  if job.state not in ('pending', 'retryable', 'processing') then
    return null;
  end if;
  update public.production_fulfillment_jobs set
    state = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1,
    last_error_code = null, updated_at = p_now
    where id = job.id;
  return jsonb_build_object(
    'disposition', 'acquired', 'fulfillment_job_id', job.id
  );
end;
$function$;

create function public.claim_rc2_fulfillment_job_by_id_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_lease_expires_at timestamptz,
  p_now timestamptz
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  job public.production_fulfillment_jobs%rowtype;
  intent_state text;
  target_intent_id uuid;
begin
  select purchase_intent_id into target_intent_id
    from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id;
  if target_intent_id is null then return null; end if;
  select state into intent_state from public.production_purchase_intents
    where id = target_intent_id for update;
  select * into job from public.production_fulfillment_jobs
    where id = p_fulfillment_job_id for update;
  if job.id is null then return null; end if;
  if job.purchase_intent_id <> target_intent_id
     or intent_state <> 'verified' then return null; end if;
  if job.state = 'completed' then
    return jsonb_build_object(
      'disposition', 'completed', 'fulfillment_job_id', job.id
    );
  end if;
  if job.state = 'processing' and job.lease_expires_at > p_now then
    return jsonb_build_object(
      'disposition', 'in_progress', 'fulfillment_job_id', job.id
    );
  end if;
  if job.state not in ('pending', 'retryable', 'processing') then return null; end if;
  update public.production_fulfillment_jobs set
    state = 'processing', owner_id = p_owner_id,
    lease_expires_at = p_lease_expires_at,
    attempt_count = attempt_count + 1,
    last_error_code = null, updated_at = p_now
    where id = job.id;
  return jsonb_build_object(
    'disposition', 'acquired', 'fulfillment_job_id', job.id
  );
end;
$function$;

create function public.complete_rc2_fulfillment_job_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_fulfillment_jobs jobs set
    state = 'completed', owner_id = null, lease_expires_at = null,
    completed_at = p_now, last_error_code = null, updated_at = p_now
    where jobs.id = p_fulfillment_job_id and jobs.state = 'processing'
      and jobs.owner_id = p_owner_id
      and jobs.grant_id is not null and jobs.logical_assessment_id is not null
      and exists (
        select 1 from public.production_assessment_grants grants
          where grants.id = jobs.grant_id and grants.status = 'completed'
      )
      and exists (
        select 1 from public.production_customer_deliveries deliveries
          where deliveries.logical_assessment_id = jobs.logical_assessment_id
      );
  if not found then
    raise exception 'RC2_FULFILLMENT_JOB_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

create function public.fail_rc2_fulfillment_job_v1(
  p_fulfillment_job_id uuid,
  p_owner_id uuid,
  p_error_code text,
  p_now timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  update public.production_fulfillment_jobs set
    state = 'retryable', owner_id = null, lease_expires_at = null,
    last_error_code = p_error_code, updated_at = p_now
    where id = p_fulfillment_job_id and state = 'processing'
      and owner_id = p_owner_id;
  if not found then
    raise exception 'RC2_FULFILLMENT_JOB_CONFLICT' using errcode = 'P0001';
  end if;
end;
$function$;

revoke all on table public.production_email_verification_challenges
  from public, anon, authenticated;
revoke all on table public.production_verified_email_authorities
  from public, anon, authenticated;
revoke all on table public.production_trusted_email_sessions
  from public, anon, authenticated;
revoke all on table public.production_preparation_email_bindings
  from public, anon, authenticated;
revoke all on table public.production_purchase_intents
  from public, anon, authenticated;
revoke all on table public.production_payment_attempts
  from public, anon, authenticated;
revoke all on table public.production_verified_payments
  from public, anon, authenticated;
revoke all on table public.production_stripe_event_ledger
  from public, anon, authenticated;
revoke all on table public.production_fulfillment_jobs
  from public, anon, authenticated;
revoke all on table public.production_payment_adjustment_ledger
  from public, anon, authenticated;

grant select, insert, update on table public.production_email_verification_challenges
  to service_role;
grant select, insert, update on table public.production_verified_email_authorities
  to service_role;
grant select, insert, update on table public.production_trusted_email_sessions
  to service_role;
grant select, insert, update on table public.production_preparation_email_bindings
  to service_role;
grant select, insert, update on table public.production_purchase_intents
  to service_role;
grant select, insert, update on table public.production_payment_attempts
  to service_role;
grant select, insert on table public.production_verified_payments
  to service_role;
grant select, insert, update on table public.production_stripe_event_ledger
  to service_role;
grant select, insert, update on table public.production_fulfillment_jobs
  to service_role;
grant select, insert, update on table public.production_payment_adjustment_ledger
  to service_role;

revoke all on function public.bind_rc2_trusted_email_to_preparation_v1(
  text, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.begin_rc2_email_challenge_v1(
  text, uuid, text, text, text, text, integer, timestamptz, timestamptz
) from public, anon, authenticated;
revoke all on function public.mark_rc2_email_challenge_delivery_failed_v1(
  uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.consume_rc2_email_challenge_v1(
  text, text, uuid, text, uuid, text, timestamptz, timestamptz
) from public, anon, authenticated;
revoke all on function public.begin_rc2_purchase_intent_v1(
  uuid, text, text, text, text, text, integer, text, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.reserve_rc2_payment_attempt_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.attach_rc2_checkout_session_v1(
  uuid, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.mark_rc2_payment_attempt_unknown_v1(
  uuid, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.record_rc2_stripe_evidence_v1(
  text, text, text, timestamptz, text, text, text, text, text, text, text,
  integer, text, text, text, uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.issue_rc2_production_assessment_grant_v1(
  uuid, uuid, uuid, uuid, uuid, text, text, timestamptz
) from public, anon, authenticated;
revoke all on function public.claim_rc2_fulfillment_job_v1(
  text, uuid, timestamptz, timestamptz
) from public, anon, authenticated;
revoke all on function public.claim_rc2_fulfillment_job_by_id_v1(
  uuid, uuid, timestamptz, timestamptz
) from public, anon, authenticated;
revoke all on function public.complete_rc2_fulfillment_job_v1(
  uuid, uuid, timestamptz
) from public, anon, authenticated;
revoke all on function public.fail_rc2_fulfillment_job_v1(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.bind_rc2_trusted_email_to_preparation_v1(
  text, text, text, timestamptz
) to service_role;
grant execute on function public.begin_rc2_email_challenge_v1(
  text, uuid, text, text, text, text, integer, timestamptz, timestamptz
) to service_role;
grant execute on function public.mark_rc2_email_challenge_delivery_failed_v1(
  uuid, text, timestamptz
) to service_role;
grant execute on function public.consume_rc2_email_challenge_v1(
  text, text, uuid, text, uuid, text, timestamptz, timestamptz
) to service_role;
grant execute on function public.begin_rc2_purchase_intent_v1(
  uuid, text, text, text, text, text, integer, text, text, text, timestamptz
) to service_role;
grant execute on function public.reserve_rc2_payment_attempt_v1(
  uuid, uuid, text, timestamptz
) to service_role;
grant execute on function public.attach_rc2_checkout_session_v1(
  uuid, text, text, timestamptz
) to service_role;
grant execute on function public.mark_rc2_payment_attempt_unknown_v1(
  uuid, text, timestamptz
) to service_role;
grant execute on function public.record_rc2_stripe_evidence_v1(
  text, text, text, timestamptz, text, text, text, text, text, text, text,
  integer, text, text, text, uuid, uuid, timestamptz
) to service_role;
grant execute on function public.issue_rc2_production_assessment_grant_v1(
  uuid, uuid, uuid, uuid, uuid, text, text, timestamptz
) to service_role;
grant execute on function public.claim_rc2_fulfillment_job_v1(
  text, uuid, timestamptz, timestamptz
) to service_role;
grant execute on function public.claim_rc2_fulfillment_job_by_id_v1(
  uuid, uuid, timestamptz, timestamptz
) to service_role;
grant execute on function public.complete_rc2_fulfillment_job_v1(
  uuid, uuid, timestamptz
) to service_role;
grant execute on function public.fail_rc2_fulfillment_job_v1(
  uuid, uuid, text, timestamptz
) to service_role;
