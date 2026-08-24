\set ON_ERROR_STOP on
set role m2_b2_stripe_ingress;
select private_payment_ingress.record_stripe_webhook_evidence_v1(
  'evt_m2_b2_i1_race', 'checkout.session.completed',
  '2026-08-24T00:01:00Z', repeat('8a',32), 'test',
  '55000000-0000-4000-8000-000000000005',
  'cs_test_m2_b2_i1_race', 'pi_m2_b2_i1_race',
  'payment', 'paid', 980, 'jpy'
);
