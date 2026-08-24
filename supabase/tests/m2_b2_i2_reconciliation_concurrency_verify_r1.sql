\set ON_ERROR_STOP on
\pset tuples_only on

do $proof$
begin
  if not exists (
    select 1 from public.production_payment_attempts
    where id = '65000000-0000-4000-8000-000000000005'
      and reconciliation_attempt_count = 1
      and reconciliation_owner_id in (
        '95000000-0000-4000-8000-000000000001',
        '95000000-0000-4000-8000-000000000002'
      )
      and reconciliation_lease_expires_at = '2026-08-24T00:10:24Z'
  ) then
    raise exception 'I2_CONCURRENT_RECONCILIATION_SINGLE_WINNER_FAILED';
  end if;
end;
$proof$;

update public.production_purchase_intents
set current_payment_attempt_id = null
where id = '55000000-0000-4000-8000-000000000005';
delete from public.production_payment_attempts
where id = '65000000-0000-4000-8000-000000000005';
delete from public.production_purchase_intents
where id = '55000000-0000-4000-8000-000000000005';
delete from public.production_customer_ownership_bindings
where id = '45000000-0000-4000-8000-000000000005';
delete from public.production_preparations
where id = '25000000-0000-4000-8000-000000000005';
delete from public.assessment_requests
where id = '15000000-0000-4000-8000-000000000005';
delete from auth.users
where id = '35000000-0000-4000-8000-000000000005';
revoke m2_b2_stripe_ingress from postgres;

select 'PASS M2-B2-I2 concurrent reconciliation winner 1';
