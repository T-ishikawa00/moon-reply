\set ON_ERROR_STOP on
\pset tuples_only on

insert into auth.users (
  id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, is_sso_user, is_anonymous
) values
  ('c1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'c1-a@example.test', '2026-08-24T00:00:00Z',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false),
  ('c1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'c1-b@example.test', '2026-08-24T00:00:00Z',
    '{"provider":"google","providers":["google"]}'::jsonb, '{}'::jsonb,
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false),
  ('c1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
    'c1-c@example.test', '2026-08-24T00:00:00Z',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z', false, false);

set role service_role;

select public.begin_production_prepayment_intake_v1(
  'c2000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000001',
  repeat('1', 64), repeat('a', 64), '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'synthetic customer A', null, 'other', '["reply"]'::jsonb,
  repeat('a', 64), '2026-08-24T00:00:00Z'
);
select public.begin_production_prepayment_intake_v1(
  'c2000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000002',
  repeat('2', 64), repeat('b', 64), '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'synthetic customer B', null, 'other', '["reply"]'::jsonb,
  repeat('b', 64), '2026-08-24T00:00:00Z'
);
select public.begin_production_prepayment_intake_v1(
  'c2000000-0000-4000-8000-000000000003',
  'c3000000-0000-4000-8000-000000000003',
  repeat('3', 64), repeat('c', 64), '{}'::jsonb,
  '{"purchaseGateSatisfied":true,"paymentAuthorityIssued":false}'::jsonb,
  'synthetic rollover customer', null, 'other', '["reply"]'::jsonb,
  repeat('c', 64), '2026-08-24T00:00:00Z'
);

select public.create_production_prepayment_auth_continuation_v1(
  'c6000000-0000-4000-8000-000000000001', repeat('a', 64),
  repeat('7', 64), repeat('8', 64), 'email_otp',
  '2026-08-24T00:20:00Z', '2026-08-24T00:00:00Z'
);
select public.validate_production_prepayment_auth_continuation_v1(
  repeat('7', 64), repeat('8', 64), 'email_otp',
  '2026-08-24T00:00:01Z'
);
select public.bind_production_prepayment_owner_from_continuation_v1(
  'c4000000-0000-4000-8000-000000000001',
  'c5000000-0000-4000-8000-000000000001', repeat('7', 64), repeat('8', 64),
  'c1000000-0000-4000-8000-000000000001', repeat('d', 64),
  'synthetic-ciphertext-a', 'c1-v1', 'supabase_email_otp',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:01Z'
);

do $proof$
begin
  if public.validate_production_prepayment_auth_continuation_v1(
    repeat('7', 64), repeat('8', 64), 'email_otp',
    '2026-08-24T00:00:02Z'
  ) is not null then
    raise exception 'CONSUMED_CONTINUATION_VALIDATED';
  end if;
  perform public.bind_production_prepayment_owner_from_continuation_v1(
    'c4000000-0000-4000-8000-000000000001',
    'c5000000-0000-4000-8000-000000000001', repeat('7', 64), repeat('8', 64),
    'c1000000-0000-4000-8000-000000000001', repeat('d', 64),
    'synthetic-ciphertext-a', 'c1-v1', 'supabase_email_otp',
    '2026-08-24T00:00:00Z', '2026-08-24T00:00:02Z'
  );
  begin
    perform public.bind_production_prepayment_owner_from_continuation_v1(
      'c4000000-0000-4000-8000-000000000099',
      'c5000000-0000-4000-8000-000000000099', repeat('7', 64), repeat('8', 64),
      'c1000000-0000-4000-8000-000000000002', repeat('e', 64),
      'synthetic-ciphertext-cross', 'c1-v1', 'google_verified_identity',
      '2026-08-24T00:00:00Z', '2026-08-24T00:00:03Z'
    );
    raise exception 'CROSS_CUSTOMER_CONTINUATION_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
  if public.resolve_production_prepayment_continuation_v1(
    'c1000000-0000-4000-8000-000000000001', repeat('7', 64),
    '2026-08-24T00:00:04Z'
  ) is distinct from 'c2000000-0000-4000-8000-000000000001'::uuid then
    raise exception 'OWNER_CONTINUATION_RESOLUTION_FAILED';
  end if;
  if public.resolve_production_prepayment_continuation_v1(
    'c1000000-0000-4000-8000-000000000002', repeat('7', 64),
    '2026-08-24T00:00:04Z'
  ) is not null then
    raise exception 'CROSS_CUSTOMER_CONTINUATION_RESOLVED';
  end if;
end;
$proof$;
select 'PASS auth continuation one-use, replay, and customer isolation';
select public.bind_production_prepayment_owner_by_capability_v1(
  repeat('b', 64), 'c4000000-0000-4000-8000-000000000002',
  'c5000000-0000-4000-8000-000000000002',
  'c1000000-0000-4000-8000-000000000002', repeat('e', 64),
  'synthetic-ciphertext-b', 'c1-v1', 'google_verified_identity',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);
select public.bind_production_prepayment_owner_by_capability_v1(
  repeat('c', 64), 'c4000000-0000-4000-8000-000000000003',
  'c5000000-0000-4000-8000-000000000003',
  'c1000000-0000-4000-8000-000000000003', repeat('f', 64),
  'synthetic-ciphertext-c', 'c1-v1', 'supabase_email_otp',
  '2026-08-24T00:00:00Z', '2026-08-24T00:00:00Z'
);

select public.claim_production_prepayment_execution_v1(
  'c1000000-0000-4000-8000-000000000001',
  'c2000000-0000-4000-8000-000000000001', '2026-08-24T00:00:01Z'
);
select public.claim_production_prepayment_execution_v1(
  'c1000000-0000-4000-8000-000000000002',
  'c2000000-0000-4000-8000-000000000002', '2026-08-24T00:00:01Z'
);
select public.claim_production_prepayment_execution_v1(
  'c1000000-0000-4000-8000-000000000003',
  'c2000000-0000-4000-8000-000000000003', '2026-08-24T00:00:01Z'
);

insert into public.production_prepayment_compute_budgets (
  customer_user_id, policy_version, window_started_at, window_expires_at,
  used_provider_invocation_units, created_at, updated_at
) values (
  'c1000000-0000-4000-8000-000000000003', 'm2-c1-prepayment-compute-v1',
  '2026-08-23T00:00:00Z', '2026-08-23T00:01:00Z', 3,
  '2026-08-23T00:00:00Z', '2026-08-23T00:00:00Z'
);

reset role;
select 'PASS M2-C1 synthetic setup';
