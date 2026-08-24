\set ON_ERROR_STOP on
\pset tuples_only on

begin;
select * from public.claim_rc2_payment_reconciliation_batch_v1(
  :'owner_id'::uuid,
  '2026-08-24T00:10:24Z',
  '2026-08-24T00:10:00Z',
  '2026-08-24T00:08:00Z',
  1,
  5
);
select pg_sleep(2);
commit;
