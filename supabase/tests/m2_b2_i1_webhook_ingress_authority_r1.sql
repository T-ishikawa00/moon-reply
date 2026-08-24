\set ON_ERROR_STOP on
\pset tuples_only on

-- Disposable synthetic proof for exact migrations 0002..0018.
begin;

insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data,
  raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
) values (
  '30000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'ingress-proof@example.test',
  '2026-08-24T00:00:00Z',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false
);

insert into public.assessment_requests (
  id, idempotency_key, source, raw_situation, relationship,
  requested_topics, privacy_acknowledged, status, created_at, updated_at
)
select
  format('10000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'm2-b2-i1-request-' || n,
  'production_fulfillment_runtime', 'synthetic ingress proof ' || n,
  'other', '["reply"]'::jsonb, true, 'completed',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 4) as n;

insert into public.production_preparations (
  id, assessment_request_id, idempotency_key_hash,
  consultation_snapshot_sha256, consultation_snapshot_json,
  safety_authority_json, status, purchase_capability_hash,
  purchase_ready_authority_json, purchase_ready_authority_sha256,
  created_at, updated_at
)
select
  format('20000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('10000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('i1-idempotency-' || n) || md5('i1-idempotency-2-' || n),
  md5('i1-snapshot-' || n) || md5('i1-snapshot-2-' || n),
  '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'purchase_ready',
  md5('i1-capability-' || n) || md5('i1-capability-2-' || n),
  '{"schemaVersion":"rc1-purchase-ready-runtime-authority-v1","runtimeIdentity":{"model":"gpt-5.6-luna","promptBundleVersion":"prompt-bundle-runtime-v17.0.0","schemaSetVersion":"pipeline-schema-runtime-v6.0.0","stageTopologyVersion":"split-base-candidate-v1"}}'::jsonb,
  md5('i1-authority-' || n) || md5('i1-authority-2-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 4) as n;

insert into public.production_customer_ownership_bindings (
  id, ownership_reference_id, customer_user_id, preparation_id,
  delivery_email_sha256, delivery_email_ciphertext,
  delivery_email_key_version, delivery_email_verified_source,
  delivery_email_verified_at, state, bound_at, created_at, updated_at
)
select
  format('40000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('41000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  '30000000-0000-4000-8000-000000000001'::uuid,
  format('20000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  md5('i1-email-' || n) || md5('i1-email-2-' || n),
  'synthetic-ciphertext-ingress-' || n, 'v1', 'supabase_email_otp',
  '2026-08-24T00:00:00Z', 'active', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 4) as n;

insert into public.production_purchase_intents (
  id, preparation_id, verified_email_authority_id,
  trusted_email_session_id, customer_ownership_binding_id,
  delivery_authority_reference, expected_product_code, expected_amount,
  currency, purchase_kind, provider, environment, state,
  current_payment_attempt_id, successful_payment_id, status_capability_hash,
  final_confirmation_accepted_at, created_at, updated_at
)
select
  format('50000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('20000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  null, null,
  format('40000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  'purchase-delivery:' ||
    format('50000000-0000-4000-8000-%s', to_char(n, 'FM000000000000')),
  'moon_reply_love_message_assessment_note_v1', 980, 'jpy', 'one_time',
  'stripe', 'test', 'requires_payment', null, null,
  md5('i1-status-' || n) || md5('i1-status-2-' || n),
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z',
  '2026-08-24T00:00:00Z'
from generate_series(1, 4) as n;

insert into public.production_payment_attempts (
  id, purchase_intent_id, sequence_number, state,
  provider_idempotency_key_hash, provider_checkout_session_id,
  provider_checkout_url, created_at, updated_at
)
select
  format('60000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  format('50000000-0000-4000-8000-%s', to_char(n, 'FM000000000000'))::uuid,
  1, 'pending',
  md5('i1-attempt-' || n) || md5('i1-attempt-2-' || n),
  'cs_test_m2_b2_i1_' || n,
  'https://checkout.stripe.com/c/pay/m2_b2_i1_' || n,
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
from generate_series(1, 4) as n;

update public.production_purchase_intents as intent set
  current_payment_attempt_id = attempt.id,
  state = 'pending', updated_at = '2026-08-24T00:00:01Z'
from public.production_payment_attempts as attempt
where attempt.purchase_intent_id = intent.id
  and intent.id::text like '50000000-0000-4000-8000-%';

-- The local Supabase `postgres` migration role is intentionally not a member
-- of the new NOINHERIT login. Grant only inside this rollback-only proof so
-- SET ROLE exercises the target's effective privileges without provisioning a
-- credential. The membership and every fixture roll back together.
grant m2_b2_stripe_ingress to postgres;

-- Direct privilege surface: only wrapper execution may succeed.
do $proof$
declare
  target regprocedure :=
    'private_payment_ingress.record_stripe_webhook_evidence_v1(text,text,timestamp with time zone,text,text,text,text,text,text,text,integer,text)'::regprocedure;
begin
  if exists (
    select 1 from pg_catalog.pg_roles
    where rolname = 'm2_b2_stripe_ingress'
      and (rolsuper or rolinherit or rolcreatedb or rolcreaterole
        or rolreplication or rolbypassrls or not rolcanlogin
        or rolconnlimit <> 4)
  ) then raise exception 'PROOF_ROLE_ATTRIBUTES_FAILED'; end if;
  if exists (
    select 1 from pg_catalog.pg_class as relation
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
      and pg_catalog.has_table_privilege(
        'm2_b2_stripe_ingress', relation.oid,
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'
      )
  ) then raise exception 'PROOF_RELATION_PRIVILEGE_FAILED'; end if;
  if exists (
    select 1 from pg_catalog.pg_proc as routine
    join pg_catalog.pg_namespace as namespace
      on namespace.oid = routine.pronamespace
    where namespace.nspname in ('public', 'private_payment_ingress')
      and routine.oid <> target::oid
      and pg_catalog.has_function_privilege(
        'm2_b2_stripe_ingress', routine.oid, 'EXECUTE'
      )
  ) then raise exception 'PROOF_NON_TARGET_FUNCTION_FAILED'; end if;
  if not pg_catalog.has_function_privilege(
       'm2_b2_stripe_ingress', target, 'EXECUTE'
     ) or pg_catalog.has_function_privilege('anon', target, 'EXECUTE')
     or pg_catalog.has_function_privilege('authenticated', target, 'EXECUTE')
     or pg_catalog.has_function_privilege('service_role', target, 'EXECUTE')
     or exists (
       select 1 from pg_catalog.pg_proc as routine,
         lateral pg_catalog.aclexplode(routine.proacl) as privilege
       where routine.oid = target::oid and privilege.grantee = 0
         and privilege.privilege_type = 'EXECUTE'
     ) then
    raise exception 'PROOF_WRAPPER_ACL_FAILED';
  end if;
end;
$proof$;

set local role m2_b2_stripe_ingress;
do $proof$
begin
  begin
    perform 1 from public.production_purchase_intents limit 1;
    raise exception 'PROOF_DIRECT_SELECT_UNEXPECTED_SUCCESS';
  exception when insufficient_privilege then null; end;
  begin
    update public.production_payment_attempts set updated_at = updated_at;
    raise exception 'PROOF_DIRECT_UPDATE_UNEXPECTED_SUCCESS';
  exception when insufficient_privilege then null; end;
  begin
    perform public.resolve_customer_account_history_v1(
      '30000000-0000-4000-8000-000000000001'
    );
    raise exception 'PROOF_NON_TARGET_RPC_UNEXPECTED_SUCCESS';
  exception when insufficient_privilege then null; end;
end;
$proof$;

do $proof$
declare result text;
begin
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_m2_b2_i1_valid_1', 'checkout.session.completed',
    '2026-08-24T00:01:00Z', repeat('a1', 32), 'test',
    '50000000-0000-4000-8000-000000000001', 'cs_test_m2_b2_i1_1',
    'pi_m2_b2_i1_1', 'payment', 'paid', 980, 'jpy'
  );
  if result <> 'verified' then raise exception 'PROOF_FIRST_VALID_FAILED'; end if;
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_m2_b2_i1_valid_1', 'checkout.session.completed',
    '2026-08-24T00:01:00Z', repeat('a1', 32), 'test',
    '50000000-0000-4000-8000-000000000001', 'cs_test_m2_b2_i1_1',
    'pi_m2_b2_i1_1', 'payment', 'paid', 980, 'jpy'
  );
  if result <> 'duplicate' then raise exception 'PROOF_EXACT_DUPLICATE_FAILED'; end if;
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_m2_b2_i1_valid_1b', 'checkout.session.async_payment_succeeded',
    '2026-08-24T00:01:01Z', repeat('a2', 32), 'test',
    '50000000-0000-4000-8000-000000000001', 'cs_test_m2_b2_i1_1',
    'pi_m2_b2_i1_1', 'payment', 'paid', 980, 'jpy'
  );
  if result <> 'duplicate' then raise exception 'PROOF_DISTINCT_EVENT_DUPLICATE_FAILED'; end if;
end;
$proof$;

-- Invalid binding/economics must not reach the event ledger or Payment/job.
do $proof$
declare
  result text;
begin
  foreach result in array array[
    private_payment_ingress.record_stripe_webhook_evidence_v1(
      'evt_i1_wrong_env', 'checkout.session.completed', now(), repeat('b1',32),
      'live', '50000000-0000-4000-8000-000000000002',
      'cs_live_m2_b2_i1_2', 'pi_i1_wrong_env', 'payment', 'paid', 980, 'jpy'),
    private_payment_ingress.record_stripe_webhook_evidence_v1(
      'evt_i1_wrong_amount', 'checkout.session.completed', now(), repeat('b2',32),
      'test', '50000000-0000-4000-8000-000000000002',
      'cs_test_m2_b2_i1_2', 'pi_i1_wrong_amount', 'payment', 'paid', 981, 'jpy'),
    private_payment_ingress.record_stripe_webhook_evidence_v1(
      'evt_i1_wrong_currency', 'checkout.session.completed', now(), repeat('b3',32),
      'test', '50000000-0000-4000-8000-000000000002',
      'cs_test_m2_b2_i1_2', 'pi_i1_wrong_currency', 'payment', 'paid', 980, 'usd'),
    private_payment_ingress.record_stripe_webhook_evidence_v1(
      'evt_i1_wrong_session', 'checkout.session.completed', now(), repeat('b4',32),
      'test', '50000000-0000-4000-8000-000000000002',
      'cs_test_m2_b2_i1_missing', 'pi_i1_wrong_session', 'payment', 'paid', 980, 'jpy'),
    private_payment_ingress.record_stripe_webhook_evidence_v1(
      'evt_i1_wrong_purchase', 'checkout.session.completed', now(), repeat('b5',32),
      'test', '50000000-0000-4000-8000-000000000003',
      'cs_test_m2_b2_i1_2', 'pi_i1_wrong_purchase', 'payment', 'paid', 980, 'jpy')
  ] loop
    if result <> 'rejected' then raise exception 'PROOF_INVALID_NOT_REJECTED'; end if;
  end loop;
end;
$proof$;
reset role;
do $proof$
begin
  if (select count(*) from public.production_stripe_event_ledger) <> 2
     or (select count(*) from public.production_verified_payments) <> 1
     or (select count(*) from public.production_fulfillment_jobs) <> 1 then
    raise exception 'PROOF_INVALID_SIDE_EFFECT_FAILED';
  end if;
end;
$proof$;
set local role m2_b2_stripe_ingress;

-- Failure before success remains recoverable.
do $proof$
declare result text;
begin
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_failure_first', 'checkout.session.async_payment_failed',
    '2026-08-24T00:01:00Z', repeat('c1',32), 'test',
    '50000000-0000-4000-8000-000000000002', 'cs_test_m2_b2_i1_2',
    null, 'payment', 'unpaid', 980, 'jpy');
  if result <> 'failed' then raise exception 'PROOF_FAILURE_FIRST_FAILED'; end if;
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_success_after_failure', 'checkout.session.async_payment_succeeded',
    '2026-08-24T00:02:00Z', repeat('c2',32), 'test',
    '50000000-0000-4000-8000-000000000002', 'cs_test_m2_b2_i1_2',
    'pi_m2_b2_i1_2', 'payment', 'paid', 980, 'jpy');
  if result <> 'verified' then raise exception 'PROOF_SUCCESS_AFTER_FAILURE_FAILED'; end if;
end;
$proof$;

-- Success before failure is terminal and does not regress.
do $proof$
declare result text;
begin
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_success_first', 'checkout.session.completed',
    '2026-08-24T00:01:00Z', repeat('d1',32), 'test',
    '50000000-0000-4000-8000-000000000003', 'cs_test_m2_b2_i1_3',
    'pi_m2_b2_i1_3', 'payment', 'paid', 980, 'jpy');
  if result <> 'verified' then raise exception 'PROOF_SUCCESS_FIRST_FAILED'; end if;
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_failure_after_success', 'checkout.session.async_payment_failed',
    '2026-08-24T00:02:00Z', repeat('d2',32), 'test',
    '50000000-0000-4000-8000-000000000003', 'cs_test_m2_b2_i1_3',
    null, 'payment', 'unpaid', 980, 'jpy');
  if result <> 'stale' then raise exception 'PROOF_TERMINAL_NON_REGRESSION_FAILED'; end if;
end;
$proof$;

-- A conflicting provider payment is recorded as conflict without a second
-- Payment or job.
do $proof$
declare result text;
begin
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_conflict_first', 'checkout.session.completed', now(), repeat('e1',32),
    'test', '50000000-0000-4000-8000-000000000004',
    'cs_test_m2_b2_i1_4', 'pi_m2_b2_i1_4a', 'payment', 'paid', 980, 'jpy');
  if result <> 'verified' then raise exception 'PROOF_CONFLICT_BASE_FAILED'; end if;
  result := private_payment_ingress.record_stripe_webhook_evidence_v1(
    'evt_i1_conflict_second', 'checkout.session.completed', now(), repeat('e2',32),
    'test', '50000000-0000-4000-8000-000000000004',
    'cs_test_m2_b2_i1_4', 'pi_m2_b2_i1_4b', 'payment', 'paid', 980, 'jpy');
  if result <> 'conflict' then raise exception 'PROOF_CONFLICT_FAILED'; end if;
end;
$proof$;
reset role;

do $proof$
begin
  if (select count(*) from public.production_verified_payments) <> 4
     or (select count(*) from public.production_fulfillment_jobs) <> 4
     or exists (
       select 1 from public.production_purchase_intents
       where id in (
         '50000000-0000-4000-8000-000000000001',
         '50000000-0000-4000-8000-000000000002',
         '50000000-0000-4000-8000-000000000003'
       ) and state <> 'verified'
     )
     or not exists (
       select 1 from public.production_purchase_intents
       where id = '50000000-0000-4000-8000-000000000004'
         and state = 'manual_review'
     ) then
    raise exception 'PROOF_EXACT_PAYMENT_JOB_OR_STATE_FAILED';
  end if;
end;
$proof$;

rollback;

select 'PASS role/ACL matrix';
select 'PASS valid/duplicate/two-event/conflict atomicity';
select 'PASS invalid evidence side effects 0';
select 'PASS failure/success ordering and terminal non-regression';
