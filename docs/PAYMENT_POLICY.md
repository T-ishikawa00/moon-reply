# PAYMENT_POLICY.md

## Status and Authority

This is the concise policy for the initial paid product. The canonical cross-platform detail is `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`.

- Product strategy: Human + ChatGPT agreed direction
- Payment Charter v1 Candidate: `payment_charter_v1_candidate_ready_pending_human_chatgpt_review`
- Human + ChatGPT Charter acceptance: pending
- Payment implementation: unauthorized and absent

The Candidate is `docs/payment/PAYMENT_CHARTER.md`. It is not implementation authority, Provider approval, or production authorization.

## Initial Payment Policy

Initial validation uses one-time payment:

- 1 consultation / 1 assessment note: JPY 980 including tax
- one-shot purchase
- no automatic renewal
- no customer-facing coins
- no customer-facing points
- no endless continuation or anxiety-driven upsell

The initial MVP does not use a free complete first reading, ad-supported complete reading, in-product advertising or ad-supported monetization as a product revenue model, free tickets, free coins/points, subscription, or a repeatable first-free mechanism. The fictional sample report and product previews are the primary free experience.

This Payment Policy does not prohibit or govern external marketing or paid customer acquisition.

The primary Web provider direction is PAY.JP. Intended initial Web methods are supported credit/debit cards and Apple Pay, all at the same JPY 980 total price. PayPay, Google Pay, multiple simultaneous Web providers, and RevenueCat-based Web billing are not part of the initial direction.

PAY.JP direction is not provider approval, formal evidence-gate selection, an accepted Payment Charter, or implementation authorization.

## Safety and Purchase Eligibility

Safety and server-owned purchase eligibility are evaluated before payment. A future purchase flow may continue only when the current server result is eligible and `purchaseGateSatisfied=true`.

Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error states fail closed before payment. A normal relationship outcome such as waiting, not sending now, a temporary pause, or boundary-respecting support is not a payment block by itself.

Browser display, a redirect, an enabled button, or client-owned state is never payment or purchase authority. Payment implementation must not weaken or duplicate the accepted Safety authority.

## Provider-Independent Product Right

The future architecture must separate provider-specific transactions from the Moon Reply product right:

```text
verified external transaction
  -> normalized Moon Reply purchase
  -> one assessment grant
  -> one fulfillment
  -> consume once
```

The grant is an internal domain concept, not a customer-facing coin or point. This policy creates no schema, ledger, API, migration, or entitlement implementation.

## Exceptional Downstream Failure and Refund

The unaccepted Payment Charter v1 Candidate formulates provider-independent behavior for Payment success followed by LUNA, delivery, or Safety failure. Until Human + ChatGPT acceptance and separate implementation authorization, the following remains only a conceptual failure path:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> recovery or refund decision
  -> operator attention when required
  -> final reconciled state
```

The Candidate proposes initial Product refund eligibility and integrity invariants, but Refund Decision Authority, execution, deadlines, fee treatment, Provider API capability/confirmation, and Customer communication remain unimplemented or evidence-gated. Candidate formulation does not resolve those Provider-specific facts or authorize refund execution.

## Long-Term Direction

- Web: PAY.JP direction
- iOS: Apple IAP + RevenueCat
- Android: Google Play Billing + RevenueCat
- Subscription: future coexistence candidate only after repeat-demand evidence; one-time purchase is not automatically removed

## Current Provider Evidence State

No provider inquiry or Provider call is created by this policy. Written evidence, formal provider selection, sandbox authorization, production authorization, and implementation remain separately gated by the evidence documents under `docs/payment/`.
