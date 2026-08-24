\set ON_ERROR_STOP on
\pset tuples_only on

do $proof$
declare
  customer_id uuid;
  used_units integer;
begin
  foreach customer_id in array array[
    'c1000000-0000-4000-8000-000000000001'::uuid,
    'c1000000-0000-4000-8000-000000000002'::uuid,
    'c1000000-0000-4000-8000-000000000003'::uuid
  ] loop
    select used_provider_invocation_units into used_units
      from public.production_prepayment_compute_budgets
      where customer_user_id = customer_id
        and policy_version = 'm2-c1-prepayment-compute-v1';
    if used_units is distinct from 3 then
      raise exception 'M2_C1_EXACT_LIMIT_FAILED customer=% used=%',
        customer_id, used_units;
    end if;
  end loop;
  if (select count(*) from public.production_prepayment_compute_budgets) <> 3 then
    raise exception 'M2_C1_CUSTOMER_ISOLATION_FAILED';
  end if;
  if exists (
    select 1 from public.production_prepayment_compute_budgets
    where used_provider_invocation_units < 0
       or used_provider_invocation_units > 3
  ) then
    raise exception 'M2_C1_LIMIT_OVERFLOW_FAILED';
  end if;
  if not exists (
    select 1 from public.production_prepayment_compute_budgets
    where customer_user_id = 'c1000000-0000-4000-8000-000000000003'
      and window_started_at = '2026-08-24T00:00:02Z'
      and window_expires_at = '2026-08-24T01:00:02Z'
      and used_provider_invocation_units = 3
  ) then
    raise exception 'M2_C1_ATOMIC_WINDOW_ROLLOVER_FAILED';
  end if;
end;
$proof$;
select 'PASS exact concurrent winners, isolation, and rollover';

set role service_role;

do $proof$
begin
  begin
    perform public.claim_production_prepayment_compute_unit_v1(
      'c1000000-0000-4000-8000-000000000002',
      'c2000000-0000-4000-8000-000000000001', now(),
      'm2-c1-cross-customer-v1', 3600, 3, 'PB-01', 1
    );
    raise exception 'CROSS_CUSTOMER_PREPARATION_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.claim_production_prepayment_compute_unit_v1(
      null, 'c2000000-0000-4000-8000-000000000001', now(),
      'm2-c1-prepayment-compute-v1', 3600, 3, 'PB-01', 1
    );
    raise exception 'NULL_CUSTOMER_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.claim_production_prepayment_compute_unit_v1(
      'c1000000-0000-4000-8000-000000000001', null, now(),
      'm2-c1-prepayment-compute-v1', 3600, 3, 'PB-01', 1
    );
    raise exception 'NULL_PREPARATION_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.claim_production_prepayment_compute_unit_v1(
      'c1000000-0000-4000-8000-000000000001',
      'c2000000-0000-4000-8000-000000000001', now(),
      'm2-c1-prepayment-compute-v1', 0, 0, 'PB-01', 1
    );
    raise exception 'INVALID_POLICY_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
end;
$proof$;
select 'PASS cross-customer, NULL, and invalid policy fail closed';

select public.detach_production_customer_identity_v1(
  'c1000000-0000-4000-8000-000000000001',
  'c5000000-0000-4000-8000-000000000001',
  now()
);

do $proof$
begin
  begin
    perform public.claim_production_prepayment_compute_unit_v1(
      'c1000000-0000-4000-8000-000000000001',
      'c2000000-0000-4000-8000-000000000001', now(),
      'm2-c1-detached-owner-v1', 3600, 3, 'PB-01', 1
    );
    raise exception 'DETACHED_OWNER_ACCEPTED';
  exception when sqlstate 'P0001' then null;
  end;
  if exists (
    select 1 from public.production_prepayment_compute_budgets
    where policy_version in (
      'm2-c1-cross-customer-v1',
      'm2-c1-detached-owner-v1'
    )
  ) then
    raise exception 'FAILED_AUTHORITY_MUTATED_BUDGET';
  end if;
end;
$proof$;
select 'PASS detached ownership fails before budget mutation';

reset role;

do $proof$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated', 'm2_b2_stripe_ingress']
  loop
    if pg_catalog.has_table_privilege(
      role_name, 'public.production_prepayment_compute_budgets', 'SELECT'
    ) or pg_catalog.has_function_privilege(
      role_name,
      'public.claim_production_prepayment_compute_unit_v1(uuid,uuid,timestamptz,text,integer,integer,text,integer)',
      'EXECUTE'
    ) then
      raise exception 'M2_C1_UNAUTHORIZED_ROLE_PRIVILEGE role=%', role_name;
    end if;
  end loop;
end;
$proof$;
select 'PASS unauthorized direct role authority zero';
