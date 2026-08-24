\set ON_ERROR_STOP on
\pset tuples_only on
set role service_role;
select public.create_production_customer_support_case_v1(
  'd2f00000-0000-4000-8000-000000000007',
  'd2e10000-0000-4000-8000-000000000007',
  'd2100000-0000-4000-8000-000000000001',
  'd2500000-0000-4000-8000-000000000007',
  'result_delivery', null, repeat('a7', 32), repeat('b7', 32),
  '2026-08-24T01:00:00Z'
);
reset role;
