# PAYMENT_POLICY.md

## Initial Payment Policy

Initial validation uses one-time payment:

- 1相談 / 1鑑定ノート: 税込¥980
- One-shot purchase
- No automatic renewal
- No coins
- No points
- No endless continuation

The initial MVP does not use a free complete first reading, ad-supported complete reading, advertising, free tickets, free coins/points, or a repeatable first-free mechanism. The fictional sample report and product previews are the primary free experience.

## Safety and Exceptional Downstream Failure

Safety is evaluated before payment. Only `normal_allowed` may reach a future purchase flow. `needs_review`, `rejected`, invalid age, missing consent, contradictory input, and unknown/error states cannot purchase.

Later milestones must support the exceptional post-payment state requirement:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

A Safety-blocked fulfillment must not deliver a normal report. Recoverable technical failure may be retried; unrecoverable or unfulfillable service is a full-refund candidate with duplicate-refund prevention, reason/state recording, operator notification, and user-status communication.

Automatic refunds, provider refund API capability, fee reimbursement, refund deadlines, reflection timing, and concrete operator-console steps remain unresolved until provider selection and later specification.

## Candidate Providers

- PAY.JP
- KOMOJU
- STORES

## Excluded / High Risk

- Stripe
- Square

## Status

Provider availability must be checked using the complete functional description: AI relationship-message analysis and decision-support digital report, user-facing `鑑定ノート` / `鑑定書` terminology, no divination or supernatural method, no true-feeling or future guarantee, and the safety gate. The provider must determine category treatment; no exemption or approval is assumed.

Task M1-P1-R1 does not send an inquiry, select a provider, implement payment/refunds, or convert this policy into publication-ready legal copy.
