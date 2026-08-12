# Stripe Account, Site, and PayPay Readiness Checklist

## 1. Status and classification

- Candidate package version: `STRIPE-FEAS-PREP-2026-08-12-CANDIDATE-01`
- Formulation date: `2026-08-12`
- Candidate status: `stripe_feasibility_evidence_preparation_candidate_ready_pending_human_chatgpt_review`
- Human + ChatGPT Candidate review: `pending`
- Stripe external action: `not authorized`
- Stripe account/contact/submission: `absent / none / none`
- PayPay enablement/review: `not enabled / not submitted`

Readiness item classifications:

- `satisfied`
- `implemented_not_public`
- `draft_only`
- `Human_input_required`
- `Provider_evidence_required`
- `blocker`

An item classification is preparation evidence only. It is not Stripe acceptance, legal approval, public readiness, or implementation authorization.

## 2. Gate A — Preliminary clarification readiness

Lane: `STRIPE-FEAS-001`

```yaml
preparation_status: preparation_ready_pending_human_review
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

| Requirement | Classification | Current evidence/boundary |
| --- | --- | --- |
| Accurate Product facts frozen | `satisfied` | PII-free accepted facts frozen in `STRIPE_BUSINESS_DESCRIPTION_AND_SUBMISSION_FACTS.md` |
| Proposed short/medium/full description prepared | `draft_only` | Prepared; not submitted; pending Human + ChatGPT review |
| Customer-facing `鑑定` terminology disclosed | `satisfied` | Explicit in all applicable proposed descriptions |
| Lane A questions prepared | `satisfied` | Exactly three proposed questions in `STRIPE_FEASIBILITY_EVIDENCE_PREPARATION.md`; not sent |
| Official external contact route identified | `satisfied` | `https://stripe.com/jp/contact` and its linked official support route; route authority still must be confirmed |
| Exact submission package version frozen | `satisfied` | Candidate version `STRIPE-FEAS-PREP-2026-08-12-CANDIDATE-01`; no submitted version exists |
| Non-public evidence storage location prepared | `Human_input_required` | Storage/access control and opaque reference not assigned in Git |
| Explicit Human external-action authorization | `Human_input_required` | Not granted by this Candidate |

Gate A is not Human-approved. `preparation_ready_pending_human_review` means the documentation package is ready for review; it does not mean every pre-action condition is complete. External action remains prohibited until the exact route, package, non-public evidence storage, and authority are separately approved.

A public production website is required for Lane A only if the actual official Lane A route requires it.

## 3. Gate B — Account / Live Payment readiness

Lane: `STRIPE-ACCOUNT-001`

```yaml
overall_gate_b: BLOCKED
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

| Readiness item | Classification | Current evidence/boundary |
| --- | --- | --- |
| Stable public/review domain | `blocker` | No stable public/review URL recorded |
| Functioning accessible site | `blocker` | Local review implementation is not a public review environment |
| Business name | `Human_input_required` | Legal/operator fact not stored in Git |
| Complete service description | `draft_only` | Proposed PII-free descriptions prepared; review pending |
| JPY 980 price | `implemented_not_public` | Accepted and represented in local review UI |
| Product/sample image or equivalent sales presentation | `implemented_not_public` | Local sample/report presentation exists; not public review evidence |
| Purchase-flow representation | `implemented_not_public` | Review-only flow exists; no real Payment |
| Final-confirmation representation | `implemented_not_public` | Review-only representation; no consent or Payment authority |
| Terms | `draft_only` | Not final/effective/publication-ready |
| Privacy | `draft_only` | Not final/effective/publication-ready |
| Tokushoho | `blocker` | Review display explicitly incomplete; operator/contact/payment facts unresolved |
| Refund/cancellation | `draft_only` | Provider and Customer-rights facts unresolved; no invented deadline/capability |
| Contact | `blocker` | Preparation display only; no operating channel |
| Support email | `Human_input_required` | Actual value not stored in Git |
| Operator identity | `Human_input_required` | Actual value not stored in Git |
| Private KYC data readiness | `Human_input_required` | Field names only; no private values or evidence in Git |
| Private address/phone readiness | `Human_input_required` | Truthful private facts required later; values not stored in Git |
| Bank payout details | `Human_input_required` | No bank values stored in Git |
| Domain/site ownership evidence | `blocker` | Stable domain/evidence absent |
| AI disclosure | `implemented_not_public` | Accepted public-copy alignment exists locally |
| Unsupported-case disclosure | `implemented_not_public` | Local review disclosure exists; not public evidence |
| Age-gate mechanism consistency | `blocker` | `AGE-GATE-001` unresolved |
| Responsive/public-environment QA | `blocker` | No stable public environment to verify |
| No misleading Stripe logo/approval claims | `satisfied` | Current local public surfaces contain no Stripe approval/logo claim; recheck required before publication |

Gate B must not be marked publication-ready, approved, activated, or Live capable from this checklist.

## 4. `AGE-GATE-001`

Current conflict:

- current Request UI uses the required self-attestation checkbox `私は18歳以上です`; and
- current controlling/draft documents retain required age-group selection (`18〜24歳`, `25〜29歳`, `30〜34歳`, `35〜39歳`, `40歳以上`) and prohibit the dedicated checkbox.

```yaml
id: AGE-GATE-001
status: Human Product/legal decision required before Lane B / Lane C readiness
resolution_in_this_candidate: prohibited
```

Non-authoritative ChatGPT recommendation: retain the current dedicated 18+ self-attestation for MVP and do not collect age-band data solely for eligibility. This is not Human acceptance.

This Candidate does not modify RequestForm, `ORDER_FORM_SPEC.md`, `PAYMENT_CONFIRMATION_SCREEN_SPEC.md`, the Terms draft, or the Privacy draft.

## 5. Private KYC evidence boundary

Only field names and statuses are tracked here.

| Field name | Readiness/status |
| --- | --- |
| Entity/account type | `Human_input_required` |
| Legal personal name | `Human_input_required / private` |
| Company name if applicable | `Human_input_required / private` |
| Corporate number if applicable | `Human_input_required / private` |
| Date of birth | `Human_input_required / private` |
| Residential/business address | `Human_input_required / private` |
| Phone | `Human_input_required / private` |
| Representative | `Human_input_required / private` |
| Beneficial owner where applicable | `Human_input_required / private` |
| Identity-document type | `Human_input_required / field_name_only` |
| Identity-document submission status | `not_submitted` |
| Payout bank readiness | `Human_input_required / private` |
| Business description | `draft_only` |
| Website URL | `blocker` |
| Website ownership evidence | `blocker` |
| Support email | `Human_input_required / private` |
| Operator/public disclosure method | `Human_input_required / unresolved` |
| Additional Stripe requests | `Provider_evidence_required / none received` |

Never commit actual private Human values, identity documents or numbers, bank values, Stripe credentials, sensitive application exports, complete sensitive screenshots, or low-entropy PII hashes. Git may contain only the field name, readiness/status, checked date, redacted outcome, and an opaque non-public evidence reference.

## 6. Gate C — PayPay-specific onboarding readiness

Lane: `STRIPE-PAYPAY-001`

```yaml
overall_gate_c: BLOCKED
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

| PayPay readiness item | Classification | Current evidence/boundary |
| --- | --- | --- |
| Stripe account-state prerequisite | `blocker` | Stripe account absent; Lane B has no outcome |
| Japanese Product description | `draft_only` | Proposed descriptions prepared; not submitted |
| Japanese Product image / sales presentation | `implemented_not_public` | Local review/sample presentation only |
| JPY price | `implemented_not_public` | Accepted JPY 980 value represented locally |
| Checkout/purchase flow | `implemented_not_public` | Review representation only; no real checkout |
| Completed Tokushoho link | `blocker` | Tokushoho review display incomplete and not publication-ready |
| Website/account facts matching onboarding requirements | `Human_input_required` | Actual account/operator/site facts absent |
| PayPay goods type | `Provider_evidence_required` | Selection unresolved; actual onboarding UI required |
| Method/category restrictions | `Provider_evidence_required` | Moon Reply-specific eligibility unverified |
| External review status | `Provider_evidence_required` | Not submitted; no review exists |
| External review conditions | `Provider_evidence_required` | No conditions received; do not invent |
| Method enablement state | `blocker` | Not enabled and not approved |
| Lifecycle-label recheck | `Provider_evidence_required` | Controlling label not frozen; recheck at each required gate |

Stripe account support does not establish PayPay support. Lane C may not inherit a Lane B outcome automatically. This Candidate does not enable PayPay or claim approval.

## 7. PayPay lifecycle, goods type, and timing

Current method state:

```yaml
desired_initial_method: true
moon_reply_eligibility: unverified
method_state: not_enabled
approval_state: not_approved
lifecycle_label: not_frozen_recheck_required
goods_type_selection: unresolved_pending_actual_onboarding_evidence_and_human_review
```

### Lifecycle-label rule

Neither `Public Preview` nor `GA` is frozen as the controlling label because official Stripe surfaces are not sufficiently consistent for this project to do so. Recheck before formal Stripe Provider selection, before PayPay implementation authorization, immediately before onboarding/enablement, and before Paid Launch. Explicitly historical references to prior Public Preview evidence may remain.

### Goods-type rule

Current official Stripe PayPay onboarding guidance gives examples for selecting `デジタルコンテンツ` and instructs other products/services to use `一般`. Preserve that literal rule. Do not select Moon Reply's goods type until the actual onboarding UI and current Product facts are reviewed and Human approves the selection. A goods-type option proves neither account/category acceptance nor PayPay approval.

### Timing rule

The official support guidance describes external partner review as approximately two weeks. Treat this only as a planning estimate, not an SLA or release deadline. Incomplete information or additional review may extend it.

Official sources checked `2026-08-12`:

- https://docs.stripe.com/payments/paypay/accept-a-payment?locale=ja-JP
- https://support.stripe.com/questions/accepting-paypay-payments-for-japan-based-stripe-accounts?locale=ja-JP

## 8. Current hard boundary

- Stripe account/contact/submission operations: `0 / 0 / 0`
- PayPay onboarding/enablement operations: `0 / 0`
- PAY.JP/RevenueCat operations: `0 / 0`
- Provider/API operations: `0 / 0`
- DB/Supabase/migration operations: `0 / 0 / 0`
- Runtime/LUNA/AI Provider operations: `0 / 0 / 0`
- Payment implementation/deployment operations: `0 / 0`

Unchecked, draft, Human-input, Provider-evidence, and blocker states must not be normalized to readiness or approval.
