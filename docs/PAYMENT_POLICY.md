# PAYMENT_POLICY.md

## Status and Authority

This is the concise policy for the initial paid product. The canonical cross-platform detail is `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md`.

- Product strategy: Human + ChatGPT agreed direction
- Payment Charter v1: `human_chatgpt_accepted_complete`
- Human + ChatGPT Charter acceptance date: `2026-08-12`
- Payment implementation: unauthorized and absent

The accepted Charter is `docs/payment/PAYMENT_CHARTER.md`. Charter acceptance is not implementation authority, Provider approval, formal Provider selection, or production authorization. The Candidate commits remain historical lineage.

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

Stripe Checkout is the desired strategic primary Web direction under a Candidate that remains pending Human + ChatGPT integrated review. Desired initial methods are credit/debit cards, Apple Pay, Google Pay, and PayPay, all for the same JPY 980 tax-inclusive one-time Product. No method is treated as enabled or eligible without actual Stripe evidence.

Stripe feasibility, account, approval, activation, and formal selection are absent or incomplete. PAY.JP is `paused_fallback_provider_direction`; its evidence remains preserved but does not control current next work. RevenueCat is not required for initial Web fulfillment and remains a desired, unresolved future cross-platform synchronization layer. No Provider account, contact, API, implementation, or Production Payment authority is created.

## Safety and Purchase Eligibility

Safety and server-owned purchase eligibility are evaluated before payment. A future purchase flow may continue only when the current server result is eligible and `purchaseGateSatisfied=true`.

Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error states fail closed before payment. A normal relationship outcome such as waiting, not sending now, a temporary pause, or boundary-respecting support is not a payment block by itself.

Browser display, a redirect, an enabled button, or client-owned state is never payment or purchase authority. Payment implementation must not weaken or duplicate the accepted Safety authority.

## Delivery/Recovery Email Verification

Before a first or otherwise untrusted-session real Payment, Moon Reply must have server-authoritative evidence that the Customer controls the delivery/recovery mailbox and must bind the verified email to the current purchase authority and Purchase Intent.

A repeat Customer does not repeat mailbox verification merely because another assessment is being purchased when a still-valid trusted session is bound to the unchanged verified email. Email change, an expired/revoked/invalid/unavailable trusted session, a browser or device without valid trusted state, sensitive recovery, or an unsafe/uncertain binding requires reverification.

Trusted state must be server-verifiable and cannot be asserted from browser, client, or localStorage state alone. It is neither Payment authority nor Safety authority. Safety eligibility and final purchase confirmation remain required for every purchase.

The initial MVP remains no-login. This control does not create mandatory account registration, password/Google/Apple login, a Customer profile, or My Page. Exact verification method, Provider, session/cookie/token design, lifetime, refresh, and revocation remain unresolved and unauthorized implementation work.

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

The accepted Payment Charter v1 establishes provider-independent principles for Payment success followed by LUNA, delivery, or Safety failure. Until separate implementation authorization, the following remains only a conceptual failure path:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> recovery or refund decision
  -> operator attention when required
  -> final reconciled state
```

The Charter accepts initial Product refund principles and Payment Integrity invariants, but execution, deadlines, fee treatment, Provider API capability/confirmation, and Customer communication remain unimplemented or evidence-gated. Charter acceptance does not resolve those Provider-specific facts or authorize refund execution.

## Long-Term Direction

- Web: desired Stripe Checkout direction under Candidate review; PAY.JP paused fallback
- iOS: Apple IAP + RevenueCat
- Android: Google Play Billing + RevenueCat
- Subscription: future coexistence candidate only after repeat-demand evidence; one-time purchase is not automatically removed

## Current Provider Evidence State

No provider inquiry, account, or Provider call is created by this policy. Written Stripe feasibility and method evidence, formal provider selection, sandbox authorization, production authorization, and implementation remain separately gated by the evidence documents under `docs/payment/`.
