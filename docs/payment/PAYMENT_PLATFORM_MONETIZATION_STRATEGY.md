# PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md

## Status and Authority

- Effective decision date: `2026-08-10`
- Product strategy status: `human_chatgpt_agreed_long_term_direction`
- Payment Charter v1 status: `human_chatgpt_accepted_complete`
- Payment Charter v1 Human + ChatGPT acceptance date: `2026-08-12`
- Payment implementation authorized: `false`
- Provider / API / DB / Supabase / Runtime / LUNA operations authorized by this document: `0 / 0 / 0 / 0 / 0 / 0`

This document is the canonical product strategy for Payment, Platform, Purchase, Entitlement, and Monetization across Web, iOS, and Android.

`docs/ROADMAP.md` remains the authoritative high-level delivery roadmap. Provider application/review/inquiry evidence and formal provider approval remain governed by the evidence documents under `docs/payment/`. If an older Product, Phase, Payment, or provider-planning document conflicts with this strategy, this document controls the Payment / Platform / Monetization decision, while immutable historical execution and acceptance records remain historical evidence.

This strategy records product direction and the accepted Charter status only. It does not authorize a PAY.JP account or application submission, approve PAY.JP as a merchant, establish current feature availability, authorize an SDK, authorize a Provider call, or authorize implementation.

## 1. Long-Term Platform Sequence

Moon Reply will ultimately target three platforms:

1. Web
2. iOS / App Store
3. Android / Google Play

They are not simultaneous implementation tracks. The controlling product sequence is:

```text
Phase A  Web / PAY.JP direction / JPY 980 one-time purchase
  ->
Phase B  Real-customer paid Web validation
  ->
Phase C  iOS / Apple In-App Purchase / RevenueCat
  ->
Phase D  Android / Google Play Billing / RevenueCat
  ->
Phase E  Repeat-purchase data analysis
  ->
Phase F  Subscription design and implementation only if demand is established
```

Human/Product Owner may change the sequence through an explicit documented decision. Heuristic purchase counts are decision inputs, not automatic release gates.

## 2. Current Initial Product

The initial commercial product remains:

- one consultation = one assessment note;
- JPY 980 including tax;
- one-time purchase;
- no automatic renewal;
- no initial customer-facing subscription;
- no customer-facing coin or point system; and
- the same JPY 980 total price for every enabled initial payment method.

The initial objective is to validate whether real customers will purchase and repurchase the JPY 980 product. Subscription price, included usage, and renewal design must not be invented before repeat-purchase evidence exists.

## 3. Web Payment Direction

### 3.1 Primary direction

PAY.JP is the primary Web payment direction.

This is a strategic preference, not evidence that PAY.JP has approved Moon Reply and not formal implementation authorization. The operational evidence state remains governed by `PAYJP_PRODUCTION_APPLICATION_READINESS.md`, `PROVIDER_INQUIRY_EVIDENCE_LOG.md`, `PROVIDER_COMPARISON.md`, and `PAYMENT_PROVIDER_DECISION_GATE.md`. Authoritative production-application/review evidence, Human selection under that gate, and a separate implementation authorization remain required. Payment Charter v1 acceptance is complete but does not satisfy those separate gates.

The intended initial Web payment methods are:

- supported credit/debit cards; and
- Apple Pay.

The initial Web release does not include:

- PayPay;
- Google Pay;
- multiple Payment Providers in parallel; or
- RevenueCat Billing solely to force cross-platform payment-provider uniformity.

The planning rationale for PAY.JP is its Japan-based operation, Japanese-language operability, confidence in refund/payment-incident support, and ability to support a future Web subscription without changing the strategic provider solely for that reason. Some additional backend integration is acceptable if the Payment Charter and provider evidence support the choice.

The decision not to add PayPay initially is not a permanent rejection. Based on the `2026-08-10` planning premise, Moon Reply will not incorporate solely to obtain PayPay before paid-demand validation. Human may reconsider if incorporation becomes economically rational or real data shows that PayPay absence is a material purchase barrier. Current provider terms and eligibility must be reverified before any action.

## 4. Mobile Payment Direction

### 4.1 iOS

The iOS direction is:

```text
Apple In-App Purchase
  -> RevenueCat verification/management
  -> Moon Reply purchase normalization
  -> Moon Reply entitlement or assessment grant
```

The initial iOS product may start with the same JPY 980 one-time, consumable-style assessment purchase. Subscription is not required for the first iOS release. The exact App Store product type, tax/price-tier handling, restoration behavior, and account-linkage rules remain future design decisions.

### 4.2 Android

The Android direction is:

```text
Google Play Billing
  -> RevenueCat verification/management
  -> Moon Reply purchase normalization
  -> Moon Reply entitlement or assessment grant
```

The initial Android product may also start with the JPY 980 one-time assessment purchase. Android follows iOS so that Store purchase verification, RevenueCat handling, Moon Reply account linkage, entitlement issuance, restoration, and recovery can first stabilize on iOS.

When implementation can be shared, Product Owner may still stagger iOS and Android Store releases to separate operational risk.

## 5. RevenueCat Role

RevenueCat is not required merely to put every platform behind one billing vendor.

The strategic provider map is:

| Platform | Payment rail | RevenueCat role |
| --- | --- | --- |
| Web | PAY.JP direction | Not required for the initial Web payment path |
| iOS | Apple In-App Purchase | Verify and manage Store purchases/subscriptions |
| Android | Google Play Billing | Verify and manage Store purchases/subscriptions |

The unifying authority is the Moon Reply backend purchase and entitlement model, not a single external Payment Provider.

## 6. Provider-Independent Purchase Boundary

The domain model must not be designed as PAY.JP-only. At minimum, the future conceptual boundary must be able to represent:

```text
provider = payjp | app_store | google_play
purchase_type = one_time | subscription
```

Provider-specific payment or subscription facts must remain separate from Moon Reply product rights.

```text
PAY.JP payment | Apple transaction | Google Play purchase
  -> verify and normalize
Moon Reply purchase
  -> issue entitlement / assessment grant
Moon Reply product fulfillment
```

For the current JPY 980 product, the target invariant is:

```text
valid purchase
  -> assessment_grant = 1
  -> assessment generation and delivery
  -> grant consumed exactly once
```

`assessment_grant` is an internal domain concept. Customer-facing UX must not present it as a coin, point, or spendable virtual currency.

This section is an architecture constraint, not a database schema. It authorizes no table, migration, ledger, API, provider adapter, or Runtime change.

## 7. Long-Term Subscription Direction

Subscription remains an explicit long-term product candidate. The default candidate is coexistence:

```text
JPY 980 one-time purchase
+
subscription, only if repeat-demand evidence supports it
```

Introducing subscription does not automatically remove the one-time purchase.

The intended future platform mapping is:

| Platform | Subscription rail |
| --- | --- |
| Web | PAY.JP direction |
| iOS | Apple subscription + RevenueCat |
| Android | Google Play subscription + RevenueCat |

Moon Reply must normalize platform-specific subscription states into a common backend subscription/entitlement state.

Subscription is not designed or implemented now because actual repurchase frequency, consultation interval, desired monthly usage, and repeat-customer segments are unknown. Useful future decision inputs include:

- 30-day repurchase rate;
- 60-day repurchase rate;
- average purchases per customer;
- average consultation interval;
- repeat-customer share; and
- heavy-user frequency.

Approximately 30–50 paid customers or 50–100 cumulative paid assessments may be used as a Product Owner prompt to begin subscription evaluation. These figures are not hard gates, release gates, implementation conditions, or automatic authorization.

## 8. Platform Transition Heuristics

### 8.1 Web to iOS

Approximately 30–50 real Web purchases may prompt Product Owner to consider iOS work. The decision must also consider whether real-customer Payment, Safety, LUNA, delivery, refund, failure recovery, and product value are operationally credible.

This is not a hard gate and there is no rule requiring JPY 100,000 monthly revenue before iOS work.

### 8.2 iOS to Android

Android is normally considered after the iOS path is stable across:

- RevenueCat;
- Store purchase;
- Moon Reply account linkage;
- purchase verification;
- entitlement / assessment-grant issuance; and
- restoration and recovery.

No purchase count automatically authorizes either mobile implementation or Store release.

## 9. Safety and Purchase Eligibility Boundary

The `2026-08-10` Human decision records the current Safety Engine and Safety UX as Human + ChatGPT accepted complete on the Safety work line ending at repository HEAD `55238f64a2409fb0f3f60d3d008f7db4d3a805a1`.

Some task-local P6 review artifacts at that HEAD still preserve their pre-acceptance `pending_human_*_review` status. This strategy does not rewrite those immutable task-time records. For current planning authority, the newer explicit Human decision controls; it does not establish final JPY 980 readiness or Payment implementation authority.

The Safety Gate decides whether Moon Reply may provide the requested kind of assistance. It does not decide the ordinary relationship outcome of the assessment. Outcomes such as `do not send now`, waiting, a temporary pause, or a boundary-respecting assessment are not payment blocks by themselves.

Only server-owned purchase eligibility may permit the purchase flow. The future payment path must require a current eligible classification and `purchaseGateSatisfied=true`. Unsafe, urgent, unsupported professional-assistance, ambiguous/unresolved authority, invalid, or technical-error states fail closed before payment.

Payment design must not weaken, bypass, duplicate, or replace the accepted Safety authority. A browser display, enabled button, or client-owned state is never purchase authority.

## 10. Conceptual Customer Flow

The current conceptual sequence is:

```text
consultation input
  -> accepted Safety Gate
  -> server-owned purchase eligibility
  -> delivery/recovery email
  -> mailbox verification when no valid trusted session exists
  -> server-authoritative verified-email binding
  -> JPY 980 final confirmation
  -> Payment Charter-defined payment flow
  -> verified payment
  -> one assessment grant
  -> LUNA assessment generation
  -> report delivery
```

When a still-valid trusted session is bound to the unchanged verified delivery/recovery email, repeat mailbox verification may be skipped. Safety eligibility and final purchase confirmation remain mandatory for every Purchase. Trusted state is server-verifiable, is neither Payment nor Safety authority, and does not create a mandatory login or Customer account.

No Payment Provider SDK, checkout, Payment API, webhook, purchase ledger, entitlement issuance, trusted-session mechanism, or grant consumption is implemented or authorized by this sequence.

## 11. Next Formal Work: PAY.JP Production Application Readiness and Human Readiness Review

Payment Charter v1 in `PAYMENT_CHARTER.md` is `human_chatgpt_accepted_complete` as of `2026-08-12`. Current official PAY.JP guidance provides no pre-application screening. The next formal Payment track is not implementation. It is:

1. complete `PAYJP_PRODUCTION_APPLICATION_READINESS.md` and Human readiness review;
2. complete actual operator/application facts, final intended URLs, legal publication readiness, and security-declaration readiness without false implementation claims;
3. recheck current PAY.JP requirements and actual application fields;
4. obtain explicit Human authorization for the exact production-use application submission;
5. only under that future authorization, submit and preserve application/reference/review evidence and conditions; and
6. only after authoritative acceptance evidence, perform Human formal provider selection.

The application is Not submitted. No PAY.JP account is created or authorized by this planning package. PAY.JP remains Not approved and not formally selected; authoritative application/review evidence is absent. Optional support clarification is not preapproval. Unknown API behavior, webhook semantics, refund capabilities, fee treatment, settlement behavior, or Apple Pay details remain evidence-gated.

## 12. Authorization Matrix

| Item | Current state |
| --- | --- |
| Long-term Payment / Platform / Monetization strategy | Human + ChatGPT agreed direction |
| Safety Engine / Safety UX | Human + ChatGPT accepted complete by current explicit Human decision |
| Payment Charter v1 Candidate | Historical lineage retained |
| Payment Charter v1 | `human_chatgpt_accepted_complete` on `2026-08-12` |
| Delivery/Recovery Email Verification | `accepted_required_control_with_trusted_session_reuse` |
| PAY.JP merchant/category approval | Not established by this strategy |
| PAY.JP formal evidence-gate selection | Not completed |
| PAY.JP SDK / API / checkout / webhook | Unauthorized and unimplemented |
| RevenueCat implementation | Unauthorized and unimplemented |
| Apple IAP / Google Play Billing implementation | Unauthorized and unimplemented |
| Purchase/entitlement DB or migration work | Unauthorized |
| Runtime / LUNA activation change | Unauthorized |
| PR / main merge / release | Unauthorized |

Planning agreement, provider approval, Payment Charter acceptance, implementation acceptance, production authorization, and release are separate states and must be reported separately.

## 13. Related Documents

- `docs/ROADMAP.md`: authoritative high-level phase and delivery order.
- `docs/CURRENT_FOCUS.md`: immediate next work and current authorization boundary.
- `docs/WBS.md`: bounded planning and future implementation work items.
- `docs/CODEX_HANDOFF.md`: session handoff and prohibited-action boundary.
- `docs/PAYMENT_POLICY.md`: concise initial-product payment policy.
- `docs/payment/PAYMENT_CHARTER.md`: Human + ChatGPT accepted Payment Charter v1; implementation authority remains `false`.
- `docs/phase1/PAYMENT_FLOW.md`: detailed Web-flow planning subordinate to the accepted Payment Charter.
- `docs/payment/PAYMENT_PROVIDER_DECISION_GATE.md`: evidence gate for formal provider selection.
- `docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`: controlling PAY.JP readiness plan; status remains pending Human + ChatGPT review.
- `docs/payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md`: factual application/review/inquiry record; no external evidence is created by this strategy.
