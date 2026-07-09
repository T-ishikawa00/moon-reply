# PROVIDER_SYNC_AND_SOURCE_OF_TRUTH.md

## 0. Purpose

This document defines the source-of-truth rule for purchases, credits, and entitlements.

---

## 1. Core Principle

External providers are proof sources.

Our own database is the business source of truth.

External providers may include:

- Web payment provider
- Stripe
- PAY.JP
- KOMOJU
- STORES
- Square
- Apple In-App Purchase
- Google Play Billing
- RevenueCat

They are not the only source of business state.

---

## 2. Why This Matters

月の返事 may eventually support:

- Web one-shot purchases
- iOS purchases
- Android purchases
- subscription plans
- one-shot reading tickets
- refunds
- revocations
- failed generations
- customer support
- payment provider migration

If purchase and entitlement state lives only in provider dashboards, the product becomes hard to operate.

---

## 3. Own Database Must Track

Our own DB should track:

- reading requests
- reading results
- purchases
- credit increases
- credit decreases
- current entitlements
- provider webhook events
- refunds
- revocations
- AI generation logs
- email delivery logs
- feedback

---

## 4. Provider Events

Every webhook or provider notification should be stored in `provider_events`.

Provider events should include:

- provider name
- provider event id
- event type
- raw payload or safely reduced payload
- processed status
- processed at
- error message if processing fails

Provider event IDs must be used to prevent duplicate processing.

---

## 5. Purchases

Purchases should be stored in `purchases`.

Purchases represent completed or attempted economic events.

They should not be inferred only from frontend success pages.

---

## 6. Credit Ledger

Credit changes should be stored in `credit_ledger`.

Examples:

- purchase_grant: +1
- reading_consumed: -1
- generation_failed_compensation: +1
- refund_reversal: -1
- admin_adjustment: +1 or -1

Do not mutate credit count without ledger history.

---

## 7. Entitlements

Current usable credit state should be stored in `entitlements`.

`entitlements.available_credits` is a cached current state derived from ledger behavior.

The ledger is the audit trail.

Entitlements are the current operational state.

---

## 8. RevenueCat Policy

RevenueCat may be used later for app-store purchase management.

RevenueCat can help with:

- receipt validation
- subscription state
- Apple / Google billing abstraction
- entitlement sync
- webhooks

But RevenueCat must not be the only business source of truth.

RevenueCat events should be synced into:

- provider_events
- purchases
- credit_ledger
- entitlements

---

## 9. Forbidden Designs

Do not:

- Treat RevenueCat as the only purchase database
- Treat Stripe/PAY.JP/KOMOJU dashboards as the only purchase database
- Store entitlement state only in Supabase Auth metadata
- Decrease credits on the frontend
- Generate readings without server-side entitlement checks
- Ignore duplicate webhook events
- Store no AI generation logs
