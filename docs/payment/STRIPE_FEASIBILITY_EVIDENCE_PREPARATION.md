# Stripe Feasibility Evidence Preparation — Human + ChatGPT Accepted

## 1. Status and authority

- Task-time Candidate formulation date: `2026-08-12`
- Task-time formulation package version: `STRIPE-FEAS-PREP-2026-08-12-CANDIDATE-01`
- Status: `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`
- Human + ChatGPT integrated review: `complete`
- Acceptance date: `2026-08-12`
- Accepted lineage: `8a07cd46ea2370b14ff09a69fa05e4de88c0f50b` -> `ef0af57d9db1c071c9847257b4a87b4f4f6af633` -> `e2111fd88dffef4137ce3202f3805aef93c647cb`
- Stripe feasibility: `not established`
- Stripe account: `absent`
- Stripe contact: `none`
- Stripe submission: `none`
- Stripe approval: `absent`
- Stripe activation: `absent`
- Stripe formal Provider selection: `incomplete`
- Payment implementation authorization: `false`
- Production Payment authorization: `false`
- Legal publication authorization/readiness: `false / not ready`

This is a Human + ChatGPT accepted docs-only preparation package. Acceptance creates no Provider operation and does not authorize Stripe contact, account creation, Dashboard use, submission, review initiation, approval, activation, Live Payment, PayPay onboarding, formal Provider selection, Payment implementation, Production Payment, deployment, or legal publication.

The following states are deliberately separate:

```text
accepted Stripe-first Product/strategy
!= accepted Customer-facing/Public-copy Alignment
!= this accepted evidence-preparation package
!= Human external-action authorization for a Lane A contact package
!= external-action authority
!= evidence acquisition
!= lane outcome
!= Stripe feasibility or approval
!= formal Provider selection
!= Payment implementation or Production Payment authority
```

## 2. Official-source category boundary

Official sources checked on `2026-08-12` establish two separate facts:

1. Stripe's Japan jurisdiction-specific prohibited-business list includes `サイキックサービス / 占い師`.
2. Stripe's general prohibited/restricted-business guidance separately states that some listed businesses may be supportable after additional detailed review and explicit approval, while some categories remain ineligible and account activation review ultimately determines supportability.

These facts must not be combined into a project-invented Moon Reply outcome.

- Moon Reply is not classified by this project as accepted by Stripe.
- Moon Reply is not classified by this project as automatically rejected by Stripe.
- Truthful non-divination Product positioning is necessary but not sufficient.
- Only authoritative Stripe evidence concerning the accurately described Moon Reply Product may establish supportability.
- Wording changes never create approval.
- Customer-facing `鑑定ノート` terminology must remain disclosed.
- Actual AI use, Product flow, Safety behavior, implementation state, and non-guarantees must remain disclosed.

Official sources:

- https://stripe.com/jp/legal/restricted-businesses
- https://support.stripe.com/questions/restricted-business-list-and-considerations?locale=ja-JP
- https://support.stripe.com/questions/prohibited-and-restricted-businesses-list-faqs?locale=ja-JP

## 3. Four-field evidence-state model

Every Stripe evidence lane uses four independent fields. No combined status may replace them.

### 3.1 `preparation_status`

Allowed values:

- `preparation_not_started`
- `preparation_in_progress`
- `preparation_ready_pending_human_review`
- `preparation_human_approved`
- `preparation_blocked`

### 3.2 `external_action_authority`

Allowed values:

- `external_action_not_authorized`
- `external_action_authorized`
- `external_action_authority_consumed`

### 3.3 `acquisition_status`

Allowed values:

- `not_submitted`
- `submitted`
- `response_received`
- `outcome_recorded`

### 3.4 `outcome`

The value remains `null` until evidenced through the applicable lane.

Lane A allowed outcomes:

- `preliminary_supportable`
- `preliminary_unsupported`
- `preliminary_inconclusive`

Lane B allowed outcomes:

- `account_activation_pending`
- `account_conditionally_approved`
- `account_approved`
- `account_rejected`

Lane C allowed outcomes:

- `paypay_review_pending`
- `paypay_conditionally_enabled`
- `paypay_enabled`
- `paypay_rejected`

A conditional outcome requires both `conditions[]` and `open_condition_count`. A conditional state must not be normalized to approved or enabled while `open_condition_count` is greater than zero. This accepted preparation package invents no outcome, condition, timestamp, case ID, account, response, approval, or external reference.

## 4. Three-lane evidence architecture

### Lane A — `STRIPE-FEAS-001`

Name: Preliminary Category Clarification

Purpose:

- obtain an early written signal about the accurately described Product;
- ask whether the actual Moon Reply Product is treated as within or outside the Japan jurisdiction-specific `Psychic services and fortune tellers` category;
- identify the authoritative review route Stripe requires; and
- identify the appropriate account/business category to use.

Lane A is preliminary evidence only. Its outcome is not account approval, activation, Live Payment eligibility, formal Provider selection, or Payment implementation authority.

```yaml
preparation_status: preparation_human_approved
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

No Stripe contact is authorized by this acceptance. The official external routes identified for later Human review are Stripe's contact page at `https://stripe.com/jp/contact` and the official support route linked from that page. Identifying a route is not authorization to use it and does not establish that Stripe will treat it as the authoritative category-review route.

### Lane B — `STRIPE-ACCOUNT-001`

Name: Stripe Account / Business / Site / Live Payment Review

Purpose:

- actual account activation review;
- business and category review;
- website review;
- KYC review;
- Live Payment capability;
- account restrictions and conditions; and
- reserve, hold, settlement, or other account-specific conditions.

```yaml
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

Current blockers include:

- stable public/review URL;
- completed required Website information;
- operator/KYC inputs;
- Tokushoho publication readiness;
- support/contact facts;
- refund/cancellation facts;
- domain/site ownership evidence where required;
- `AGE-GATE-001` age-gate mechanism consistency; and
- any additional Stripe-requested information.

### Lane C — `STRIPE-PAYPAY-001`

Name: PayPay-specific Onboarding Review

Purpose:

- PayPay-specific onboarding;
- PayPay method state;
- method/category conditions;
- required Product, site, and checkout evidence; and
- PayPay-specific external review outcome.

```yaml
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

Stripe account support does not establish PayPay support. Lane C must never inherit Lane B approval automatically.

## 5. Lane A proposed preliminary clarification questions

The following are exactly three questions with status `HUMAN + CHATGPT ACCEPTED PREPARATION WORDING / NOT SENT`.

### Question 1

「以下に正確に記載した『月の返事』のサービスについて、日本のStripeアカウントで決済処理を行うことは可能でしょうか。また、本サービスは日本向け禁止業種に記載されている『サイキックサービス / 占い師』に該当すると判断されますか。」Stripe must assess the complete functional description, not the name `鑑定ノート` in isolation.

### Question 2

What is the authoritative Stripe route for determining supportability of this service—for example, preliminary support clarification, account activation review, or an additional restricted-business review—without assuming in advance which route applies?

### Question 3

Which business or industry category should be selected when creating or activating a Stripe account for the accurately described Product, without this project guessing a category?

The controlling PII-free Product and proposed-submission facts are in `STRIPE_BUSINESS_DESCRIPTION_AND_SUBMISSION_FACTS.md`.

## 6. Website, account, KYC, and PayPay readiness

`STRIPE_ACCOUNT_SITE_PAYPAY_READINESS_CHECKLIST.md` is the controlling readiness checklist.

- Gate A preparation package is Human + ChatGPT approved internally, but has no external-action authority and remains not submitted.
- Gate B is `BLOCKED`.
- Gate C is `BLOCKED`.
- Private KYC fields and status may be tracked in Git, but private Human values and sensitive evidence may not be committed.
- `AGE-GATE-001` remains unresolved and blocks Lane B/C readiness.

## 7. PayPay boundaries

PayPay is a desired initial payment method. Its current Moon Reply eligibility is `unverified`; it is `not enabled` and `not approved`.

### 7.1 Lifecycle label

Official Stripe surfaces checked on `2026-08-12` are not sufficiently consistent for this project to freeze either `Public Preview` or `GA` as the controlling lifecycle label.

```yaml
lifecycle_label: not_frozen_recheck_required
```

Recheck is required:

- before formal Stripe Provider selection;
- before PayPay implementation authorization;
- immediately before PayPay onboarding or enablement; and
- before Paid Launch.

Historical references to prior Public Preview evidence may remain only when explicitly labeled historical.

### 7.2 Goods type

Stripe's current PayPay onboarding guidance gives listed examples for selecting `デジタルコンテンツ` and instructs other products or services to use `一般`. This accepted preparation package preserves that literal official rule but does not select Moon Reply's actual goods type.

```yaml
goods_type_selection: unresolved_pending_actual_onboarding_evidence_and_human_review
```

Final confirmation must use the actual onboarding UI and current Product facts. A goods-type option does not establish account, category, or method acceptance.

### 7.3 Review timing

Stripe support guidance currently describes external partner review as approximately two weeks. This is a planning estimate, not an SLA. It may extend when information is incomplete or further review is required, and it creates no release deadline.

Official PayPay sources:

- https://docs.stripe.com/payments/paypay/accept-a-payment?locale=ja-JP
- https://support.stripe.com/questions/accepting-paypay-payments-for-japan-based-stripe-accounts?locale=ja-JP

## 8. `AGE-GATE-001`

Current Request UI uses the required self-attestation checkbox `私は18歳以上です`. Current controlling/draft documents also retain an older incompatible required age-group mechanism (`18〜24歳`, `25〜29歳`, `30〜34歳`, `35〜39歳`, `40歳以上`) and explicitly prohibit the dedicated checkbox.

This Acceptance Sync does not resolve, implement, or publish either direction.

```yaml
id: AGE-GATE-001
status: unresolved_human_product_legal_decision_required
lane_b_readiness: blocked
lane_c_readiness: blocked
```

The non-authoritative ChatGPT recommendation is to retain the current dedicated 18+ self-attestation for MVP and not collect age-band data solely for eligibility. This is not Human acceptance and changes no Request UI, order-form specification, payment-confirmation specification, Terms draft, or Privacy draft.

## 9. PAY.JP fallback and Payment Charter

PAY.JP remains `paused_fallback_provider_direction`. Lane A unsupported, Lane B rejected, or Lane C rejected does not automatically reactivate PAY.JP. Any reactivation requires explicit Human authority, current-source re-review, and the PAY.JP-specific readiness/application route. No PAY.JP account or Provider state changes here.

Payment Charter v1 remains `human_chatgpt_accepted_complete`. This Acceptance Sync records the accepted evidence-preparation context, Lane A preparation status, unresolved Provider state, and next formal work only. It does not reopen or change normative Charter principles.

## 10. Evidence and operation boundaries

The evidence register is `PROVIDER_INQUIRY_EVIDENCE_LOG.md`. All three Stripe lane IDs are registered there using the four-field state model. Current external actions are `0`.

Git may contain only PII-free facts, required field names, readiness/status, checked date, redacted outcomes, and opaque non-public evidence references. Actual private Human values, identity documents, bank details, Stripe credentials, sensitive exports, and complete sensitive screenshots must remain outside Git.

## 11. Accepted preparation authority matrix

| Area | Current state |
| --- | --- |
| Stripe-first Product/strategy | Human + ChatGPT accepted complete |
| Customer-facing/Public-copy Alignment | Human + ChatGPT accepted complete |
| Stripe Feasibility Evidence Preparation | `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12` |
| Lane A preparation | Human-approved preparation package |
| Lane A external action | Not authorized |
| Lane A acquisition | Not submitted |
| Lane A outcome | `null` |
| Lane B preparation | Blocked |
| Lane B external action | Not authorized |
| Lane B acquisition | Not submitted |
| Lane B outcome | `null` |
| Lane C preparation | Blocked |
| Lane C external action | Not authorized |
| Lane C acquisition | Not submitted |
| Lane C outcome | `null` |
| Stripe feasibility | Not established |
| Stripe account | Absent |
| Stripe contact | None |
| Stripe approval/activation | Absent |
| Stripe formal selection | Incomplete |
| Cards / Apple Pay / Google Pay | Unverified |
| PayPay | Desired / unverified / not enabled / not approved |
| PayPay lifecycle | Not frozen / recheck required |
| `AGE-GATE-001` | Unresolved Human decision blocker for Lane B/C |
| PAY.JP | Paused fallback / not approved / not selected |
| RevenueCat initial Web | Not required / unconfigured |
| RevenueCat future | Desired / unresolved |
| Payment implementation | Unauthorized |
| Production Payment | Unauthorized |
| Legal publication | Not ready |
| Provider/API/DB/Supabase/Runtime/LUNA | `0 / 0 / 0 / 0 / 0 / 0` operations |
