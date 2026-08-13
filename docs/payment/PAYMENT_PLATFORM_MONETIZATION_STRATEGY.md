# PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md

## Status and Authority

> **B2 Candidate current overlay:** `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review` on `2026-08-13`; Human + ChatGPT review / acceptance `pending / pending`; exact next work B2 review. This status synchronization does not change the accepted Stripe-first strategy, formal Provider-selection gate, PAY.JP paused fallback, or any implementation authority.

- Effective decision date: `2026-08-10`
- Product strategy status: `human_chatgpt_agreed_long_term_direction`
- Stripe pivot Candidate formulation date: `2026-08-12`
- Stripe-first strategy accepted status: `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`
- Stripe-first strategy Human + ChatGPT acceptance date: `2026-08-12`
- Customer-facing / Public-copy Alignment accepted status: `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete`
- Customer-facing / Public-copy Alignment Human + ChatGPT acceptance date: `2026-08-12`
- Stripe Feasibility Evidence Preparation accepted status: `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`
- Stripe Feasibility Evidence Preparation Human + ChatGPT acceptance date: `2026-08-12`
- Stripe Feasibility Evidence Preparation accepted lineage: `8a07cd46ea2370b14ff09a69fa05e4de88c0f50b` -> `ef0af57d9db1c071c9847257b4a87b4f4f6af633` -> `e2111fd88dffef4137ce3202f3805aef93c647cb`
- Customer-facing / Public-copy Alignment accepted implementation lineage: `3d3888f53293231506838195c478fa2e1a88417f` -> `0bdbdc87b9de5b28707a7f5ce25f12d7b6333c95` -> `48d21e7ee7d672575eae6fd957e637b37da2a52f`
- Human Visual QA / Automated QA: `PASS / PASS`
- Payment Charter v1 status: `human_chatgpt_accepted_complete`
- Payment Charter v1 Human + ChatGPT acceptance date: `2026-08-12`
- Payment implementation authorized: `false`
- Provider / API / DB / Supabase / Runtime / LUNA operations authorized by this document: `0 / 0 / 0 / 0 / 0 / 0`

This document is the canonical product strategy for Payment, Platform, Purchase, Entitlement, and Monetization across Web, iOS, and Android.

`docs/ROADMAP.md` remains the authoritative high-level delivery roadmap. Provider application/review/inquiry evidence and formal provider approval remain governed by the evidence documents under `docs/payment/`. If an older Product, Phase, Payment, or provider-planning document conflicts with this strategy, this document controls the Payment / Platform / Monetization decision, while immutable historical execution and acceptance records remain historical evidence.

This strategy records the long-term sequence, Human + ChatGPT accepted Stripe-first Product/strategy direction, accepted Customer-facing / Public-copy Alignment, accepted Charter status, and accepted Stripe feasibility evidence preparation. Public-copy acceptance is Product/UI/content authority only. Evidence-preparation acceptance is planning/documentation authority only. Neither state is an accepted Provider decision or authorization for a Stripe or PAY.JP account, contact, application, approval, activation, SDK, Provider call, Payment implementation, Production Payment, or legal publication.

## 1. Long-Term Platform Sequence

Moon Reply will ultimately target three platforms:

1. Web
2. iOS / App Store
3. Android / Google Play

They are not simultaneous implementation tracks. The controlling product sequence is:

```text
Phase A  Web / accepted Stripe Checkout strategic direction / JPY 980 tax-inclusive one-time purchase
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

Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare.

The accepted status is `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete` as of `2026-08-12`. This establishes Product/strategy authority only; it is not Stripe feasibility, account/contact, approval/activation, formal Provider selection, Payment implementation authorization, or Production Payment authorization. Payment Charter v1 acceptance is complete and does not satisfy those separate gates.

The desired initial Web payment methods are:

- supported credit/debit cards;
- Apple Pay;
- Google Pay; and
- PayPay.

No desired method is treated as available without actual Stripe account/category/method evidence. No unavailable method may be silently removed. PayPay unavailable is not automatic approval to launch without PayPay; that outcome returns to explicit Human launch review.

PayPay's materially higher variable transaction cost is an accepted Human conversion/revenue tradeoff in the strategy. Exact rates, taxes, settlement, and account-specific pricing are not frozen. The Product Owner prefers variable cost over unnecessary pre-revenue monthly fixed cost and wants to avoid premature virtual-office or PAY.JP-specific preparation, but this does not imply zero total cost.

RevenueCat is not required for initial Web fulfillment. Future cross-platform synchronization remains desired where evidenced. PAY.JP is `paused_fallback_provider_direction`; its readiness evidence remains preserved, but it does not control current next work.

Candidate Checkout identity is 月の返事｜恋のメッセージ鑑定ノート with adjacent description AIによる恋愛メッセージ分析・判断支援デジタルレポート 1件／税込980円／単発購入. Exact Stripe Product/Price/Checkout fields and statement descriptors remain unresolved and evidence/implementation-gated; no Provider object is created.

### 3.2 Current Stripe evidence boundaries

Official sources checked on `2026-08-12` preserve three controlling boundaries:

- Stripe's Japan jurisdiction-specific list includes `サイキックサービス / 占い師`. Separate general guidance says some listed businesses may be supportable only after detailed review and explicit approval, while some categories are never eligible, and Stripe's independent activation review determines support. The two facts establish neither automatic approval nor automatic impossibility for Moon Reply. Moon Reply must present the accurate real Product; wording or positioning never guarantees approval, this strategy does not claim an exception, and only authoritative Stripe evidence about the actual Product may establish supportability.
- PayPay remains desired, unverified, not enabled, and not approved. Current official surfaces are not sufficiently consistent for this project to freeze either Preview or GA as the controlling lifecycle label; `lifecycle_label = not_frozen_recheck_required`. Lifecycle, supported integration surface, method restrictions, and Moon Reply eligibility must be rechecked before formal Stripe Provider selection, before PayPay implementation authorization, immediately before PayPay onboarding/enablement, and before Paid Launch. Official onboarding guidance preserves a literal `デジタルコンテンツ` examples / otherwise `一般` rule, but Moon Reply's selection remains `unresolved_pending_actual_onboarding_evidence_and_human_review`. No PayPay fee rate is frozen.
- Stripe private onboarding/KYC requires truthful business-address and representative information and may require additional address evidence when automatic verification fails. Separately, Stripe's Commerce Disclosure guidance permits a sole proprietor, subject to its requirements, to use an equivalent request-based statement instead of immediate public display of formal name, address, and phone information. `Stripe private KYC/business-address disclosure != Customer-facing public Tokushoho disclosure`. Human accepts truthful private disclosure to Stripe KYC, banks, tax/public authorities, and other legitimately required non-public counterparties; routine public display of the Human's home address is not desired as the default; and a legally valid request-based or otherwise non-routine-public method is preferred where current law and actual Provider requirements allow. Exact Tokushoho implementation remains unresolved and evidence-gated; Stripe removes no legal/operator/address/phone/publication obligation and does not guarantee request-based disclosure will always suffice. Virtual-office use is not currently required by Human preference; GMO is on hold, not rejected, and may be reconsidered if actual legal, Provider, postal, privacy, or operational evidence makes it useful or necessary. No unverified virtual-office address may be used for Stripe KYC.

The bounded source URLs and evidence notes are maintained in `docs/legal/LEGAL_SOURCE_REGISTER.md` and the accepted Stripe strategy artifact. No Stripe account, contact, approval, selection, or operation is created by this acceptance synchronization.

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
| Web | Accepted Stripe Checkout strategic direction; feasibility and method evidence pending | Not required initially and unconfigured; future external-purchase synchronization desired and unresolved |
| iOS | Apple In-App Purchase | Verify and manage Store purchases/subscriptions |
| Android | Google Play Billing | Verify and manage Store purchases/subscriptions |

The unifying authority is the Moon Reply backend purchase and entitlement model, not a single external Payment Provider.

## 6. Provider-Independent Purchase Boundary

The domain model must not be designed as Provider-only. At minimum, the future conceptual boundary must be able to represent:

```text
provider = stripe | payjp | app_store | google_play
purchase_type = one_time | subscription
```

Provider-specific payment or subscription facts must remain separate from Moon Reply product rights.

The accepted Product-authority sequence is `External economic rail -> authoritative verification -> Moon Reply Purchase -> Assessment Grant -> Logical Assessment -> Report`. Neither Stripe nor RevenueCat replaces Moon Reply Product authority.

```text
Stripe payment | PAY.JP payment | Apple transaction | Google Play purchase
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
| Web | Desired Stripe direction; exact future subscription rail unresolved |
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

## 11. Next Formal Work: Stripe Lane B Legal Draft Finalization Candidate (B2)

Payment Charter v1 in `PAYMENT_CHARTER.md` remains `human_chatgpt_accepted_complete`. Stripe-first strategy, Customer-facing/Public-copy Alignment, and Stripe Feasibility Evidence Preparation remain accepted complete. Stripe Sales is `not_used_by_human_direction`, which is not a Provider outcome, and Lane A remains preserved inactive without changing its four fields. The Stripe Lane B Human Decision Package is `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; all seven policy decisions are accepted. The B2 Candidate is `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`; B2 Human + ChatGPT review is the exact current next work and acceptance remains pending. The bounded sequence is:

1. B0 — Workflow Pivot + Human Decision Package Candidate — complete;
2. B1 — Human + ChatGPT decision review and acceptance sync — complete;
3. B2 — Stripe Lane B Legal Draft Finalization Candidate — Candidate implementation complete; Human + ChatGPT review is current next work; acceptance pending;
4. B3 — Review-ready Website/Public Surface implementation;
5. B4a — Deployment-readiness implementation/configuration;
6. B4b — Stable URL deployment under separate external-action authority;
7. B5 — Private KYC readiness;
8. B6 — Stripe Account/Activation Authorization Package; and
9. B7 — actual Stripe account creation/KYC/activation submission under a further explicit Human external-action authorization.

No exact future branch or mutation manifest may be assigned before predecessor acceptance. PayPay Lane C remains separate and later. No Stripe account/contact/submission exists or is authorized by this planning package. Lane A is `preparation_human_approved / external_action_not_authorized / not_submitted / null` and preserved inactive; Lane B/C are `preparation_blocked / external_action_not_authorized / not_submitted / null`. Stripe feasibility and approval/activation are absent; formal selection is incomplete; cards, Apple Pay, Google Pay, and PayPay are unverified. `AGE-GATE-001` is `accepted_direction_legal_spec_alignment_candidate_complete` in B2, while Human + ChatGPT review and Production server enforcement remain pending and Lane B/C stay blocked. PAY.JP remains paused fallback, Not approved, and not selected, with no automatic reactivation from any Stripe lane outcome. Checkout, test/live, webhook, refund execution, descriptor, Customer linkage, fees, settlement, and future RevenueCat identity/import behavior remain evidence-gated.

## 12. Authorization Matrix

| Item | Current state |
| --- | --- |
| Long-term Payment / Platform / Monetization strategy | Human + ChatGPT agreed direction |
| Safety Engine / Safety UX | Human + ChatGPT accepted complete by current explicit Human decision |
| Payment Charter v1 Candidate | Historical lineage retained |
| Payment Charter v1 | `human_chatgpt_accepted_complete` on `2026-08-12` |
| Delivery/Recovery Email Verification | `accepted_required_control_with_trusted_session_reuse` |
| Stripe strategic primary direction | Human + ChatGPT accepted Product/strategy direction on `2026-08-12` |
| Stripe-first Customer-facing / Public-copy Alignment | `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete` on `2026-08-12`; Human Visual QA and Automated QA PASS; Product/UI/content only |
| Stripe Feasibility Evidence Preparation | `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12`; planning/documentation authority only |
| Stripe Lane B Human Decision Package | `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; seven decisions accepted; B2 Candidate ready pending review; Production enforcement/evidence pending |
| Stripe Lane A / B / C | `preparation_human_approved` / blocked / blocked; no external-action authority; not submitted; outcomes `null` |
| Stripe feasibility / account / contact / approval / activation | Not established / absent / none / absent / absent |
| Stripe formal selection | Incomplete |
| Cards / Apple Pay / Google Pay / PayPay | Unverified |
| PayPay lifecycle / enablement | Desired; lifecycle `not_frozen_recheck_required`; Not enabled; Not approved; goods type unresolved pending actual onboarding evidence and Human review |
| `AGE-GATE-001` | Human direction accepted / downstream specification and legal alignment pending; Lane B/C blocked |
| Current next work | Human + ChatGPT review of Stripe Lane B Legal Draft Finalization Candidate (B2); Candidate not accepted; B3 inactive |
| Stripe private KYC vs public Tokushoho | Separate evidence domains; private truthful disclosure accepted; routine public home-address display not default; exact Tokushoho method unresolved |
| Virtual office / GMO | Not currently required by Human preference; GMO on hold, Not rejected; evidence-based reconsideration available |
| PAY.JP | Paused fallback; Not approved; Not selected |
| Provider SDK / API / checkout / webhook | Unauthorized and unimplemented |
| RevenueCat initial Web / future synchronization | Not required and unconfigured / desired and unresolved |
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
- `docs/payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`: Stripe transition Candidate source; accepted status is `stripe_feasibility_and_web_payment_strategy_pivot_human_chatgpt_accepted_complete`.
- `docs/payment/STRIPE_FEASIBILITY_EVIDENCE_PREPARATION.md`: pending-review controller for the three evidence lanes and authority matrix.
- `docs/payment/STRIPE_BUSINESS_DESCRIPTION_AND_SUBMISSION_FACTS.md`: canonical PII-free Product/submission facts; proposed wording is not submitted.
- `docs/payment/STRIPE_ACCOUNT_SITE_PAYPAY_READINESS_CHECKLIST.md`: Gate A/B/C, KYC boundary, PayPay readiness, and `AGE-GATE-001`.
- `docs/phase1/PAYMENT_FLOW.md`: detailed Web-flow planning subordinate to the accepted Payment Charter.
- `docs/payment/PAYMENT_PROVIDER_DECISION_GATE.md`: evidence gate for formal provider selection.
- `docs/payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`: preserved paused-fallback readiness evidence; does not control current next work.
- `docs/payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md`: factual application/review/inquiry record; no external evidence is created by this strategy.
