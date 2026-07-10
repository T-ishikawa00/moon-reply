# PAYMENT_PROVIDER_DECISION_GATE.md

> **INTERNAL SELECTION GATE**
>
> **NO PROVIDER IS APPROVED OR SELECTED**
>
> **PAYMENT IMPLEMENTATION IS NOT AUTHORIZED**

## Required before provider selection

- [ ] Honest inquiry sent
- [ ] Written category response received
- [ ] Service description in response matches actual 月の返事
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

## Evidence required for each check

- Record inquiry and response metadata in `PROVIDER_INQUIRY_EVIDENCE_LOG.md`.
- Record provider facts, conditions, source and checked date in `PROVIDER_COMPARISON.md`.
- Apply `PROVIDER_DECISION_SCORECARD.md` only after evidence exists.
- Keep provider-specific response files and sensitive operator information in an approved non-public evidence location.
- Do not use an unchecked item, unknown fact, marketing claim or verbal statement as a passed gate.

## After this gate

Even after every item is completed and Human approves a provider:

- sandbox implementation requires a separate task
- production payment remains separately gated
- adding an SDK, checkout, API route, server action or Webhook is not authorized by this document
- future price, subscription, coin, point or ticket changes require separate review and may require provider re-review

Task 18C completes none of the selection checks above. PAY.JP, KOMOJU and STORES remain Not sent, Not approved, Not selected and Not scored.
