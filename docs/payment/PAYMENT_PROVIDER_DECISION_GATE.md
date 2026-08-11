# PAYMENT_PROVIDER_DECISION_GATE.md

> **INTERNAL SELECTION GATE**
>
> **PAY.JP IS THE STRATEGIC PRIMARY WEB DIRECTION**
>
> **NO PROVIDER HAS PASSED THIS FORMAL EVIDENCE-SELECTION GATE**
>
> **PAYMENT IMPLEMENTATION IS NOT AUTHORIZED**

## Strategy versus evidence state

`PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md` records PAY.JP as the Human-agreed primary Web direction. That product decision does not prove category acceptance, merchant eligibility, payment-method availability, webhook/refund behavior, or production approval and does not satisfy this gate.

The intended initial Web methods are supported cards and Apple Pay. PayPay, Google Pay, and multiple simultaneous Web providers are outside the initial direction. Evidence routes are provider-specific. For PAY.JP, the authoritative route is production-application/review evidence under `PAYJP_PRODUCTION_APPLICATION_READINESS.md`; an optional support clarification is not preapproval. Contingency providers may require a different verified evidence process.

## Required before provider selection

- [ ] Provider-specific authoritative approval/review evidence obtained
- [ ] Service description submitted and reviewed matches actual 月の返事
- [ ] One-shot digital delivery accepted
- [ ] Individual/operator eligibility confirmed
- [ ] Required legal pages understood
- [ ] Refund requirements understood
- [ ] Chargeback handling understood
- [ ] Settlement and fees verified
- [ ] Webhook availability verified
- [ ] Sandbox/test process verified
- [ ] Restrictions on advertising and service copy recorded
- [ ] Termination/fund-hold risk recorded
- [ ] Privacy/data-flow implications reviewed
- [ ] Provider comparison updated
- [ ] Human explicitly approves selection

For PAY.JP specifically, the first item requires the actual production-use application/review outcome and all applicable PAY.JP/card-company conditions. PAY.JP is currently `Not submitted`, `Not approved`, and `Not selected`. A generic support answer, application invitation, official feature page, test-key availability, or optional clarification does not pass this gate.

## Evidence required for each check

- Record the provider-specific application, review, inquiry, and response metadata in `PROVIDER_INQUIRY_EVIDENCE_LOG.md`.
- Record provider facts, conditions, source and checked date in `PROVIDER_COMPARISON.md`.
- Apply `PROVIDER_DECISION_SCORECARD.md` only after evidence exists.
- Keep provider-specific response files and sensitive operator information in an approved non-public evidence location.
- Do not use an unchecked item, unknown fact, marketing claim or verbal statement as a passed gate.

## After this gate

Even after every item is completed and Human approves a provider:

- sandbox implementation requires a separate task
- the Payment Charter must be Human + ChatGPT accepted before Payment implementation
- production payment remains separately gated
- adding an SDK, checkout, API route, server action or Webhook is not authorized by this document
- future price, subscription, coin, point or ticket changes require separate review and may require provider re-review

Task 18C completed none of the selection checks above. The `2026-08-10` strategy decision changes PAY.JP's product-strategy position only. PAY.JP remains Not submitted, Not approved, not formally selected, and Not scored. Historical/fallback inquiry artifacts for PAY.JP, KOMOJU, and STORES do not establish approval.
