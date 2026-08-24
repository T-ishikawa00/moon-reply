\set ON_ERROR_STOP on
\pset tuples_only on

do $proof$
begin
  if (select count(*) from public.production_stripe_event_ledger
      where provider_event_id = 'evt_m2_b2_i1_race') <> 1
     or (select count(*) from public.production_verified_payments
      where purchase_intent_id = '55000000-0000-4000-8000-000000000005') <> 1
     or (select count(*) from public.production_fulfillment_jobs
      where purchase_intent_id = '55000000-0000-4000-8000-000000000005') <> 1
     or not exists (
       select 1 from public.production_purchase_intents
       where id = '55000000-0000-4000-8000-000000000005'
         and state = 'verified' and successful_payment_id is not null
     ) then
    raise exception 'PROOF_CONCURRENT_DUPLICATE_ATOMICITY_FAILED';
  end if;
end;
$proof$;

select 'PASS concurrent duplicate one event/Payment/job';
