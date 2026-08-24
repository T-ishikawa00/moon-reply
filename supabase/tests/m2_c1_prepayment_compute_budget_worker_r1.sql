\set ON_ERROR_STOP on
\pset tuples_only on
set role service_role;
select public.claim_production_prepayment_compute_unit_v1(
  :'customer_user_id'::uuid,
  :'preparation_id'::uuid,
  '2026-08-24T00:00:02Z',
  'm2-c1-prepayment-compute-v1', 3600, 3, 'PB-01', 1
);
reset role;
