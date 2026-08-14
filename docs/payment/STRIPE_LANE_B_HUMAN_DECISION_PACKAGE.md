# Stripe Lane B Human Decision Package — Human + ChatGPT Accepted

> **CURRENT Stripe Lane B B4a Candidate overlay:** stripe_lane_b_b4a_netlify_primary_hosting_direction_candidate_ready_pending_human_chatgpt_review; Candidate date 2026-08-14; Human + ChatGPT Hosting direction accepted at conversation/decision level; repository Candidate review / acceptance pending / pending. Accepted B3 authority remains unchanged.
>
> First future B4b review-deployment attempt: Netlify; initial review plan: Netlify Free; static compatibility: A; actual Netlify build/deployment and Hard Gate: not proven; paid Production direction: provisional. Detailed authority and proof gates: docs/payment/STRIPE_LANE_B_B4A_DEPLOYMENT_READINESS.md. Current exact work: **Human + ChatGPT review of Stripe Lane B B4a Netlify Primary Hosting Direction Candidate**. Conditional successor after B4a acceptance: **Stripe Lane B stable review URL deployment (B4b)**, separately authorized external work. This overlay supersedes earlier current-next-work wording only; no Netlify/site/deploy/domain/DNS/legal-publication/Stripe/Payment/Production-runtime authority is created.

## 1. Accepted status and authority

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. The seven decisions and B2 predecessor remain accepted; B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

- Accepted status: `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`
- Acceptance date: `2026-08-13`
- Human + ChatGPT review: `complete`
- Human + ChatGPT acceptance: `complete`
- Historical Candidate formulation commit: `223a2746f72ae8faa90b4df198f998a8132f2f3a`
- All seven Decision IDs: `accepted`
- Stripe Sales route: `not_used_by_human_direction`
- Lane A: preserved / external action not authorized / not submitted / `null`
- Lane B: blocked pending downstream Legal/Site/KYC/domain alignment
- Lane C: blocked
- Stripe feasibility: not established
- Stripe account/contact/submission: absent / none / none
- Stripe approval/activation: absent / absent
- Formal Provider selection: incomplete
- PayPay: desired / unverified / not enabled / not approved
- PAY.JP: paused fallback / not submitted / not approved / not selected
- Payment Charter v1: `human_chatgpt_accepted_complete` / normative principles unchanged
- Payment implementation: `false`
- Production Payment: `false`
- Legal publication: not ready
- Deployment/domain purchase: unauthorized

The Human has chosen not to use a Stripe Sales form or Sales email and not to prepare a Sales message as the active next work. No Stripe contact has occurred. `not_used_by_human_direction` is an internal Human workflow choice, not a Stripe Provider outcome.

Lane A / `STRIPE-FEAS-001` remains preserved accepted preparation evidence but is inactive as current next work:

```yaml
preparation_status: preparation_human_approved
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

Lane B / `STRIPE-ACCOUNT-001` remains blocked:

```yaml
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

Lane C / `STRIPE-PAYPAY-001` remains blocked:

```yaml
preparation_status: preparation_blocked
external_action_authority: external_action_not_authorized
acquisition_status: not_submitted
outcome: null
```

This document is the controlling accepted Human-decision package for the policy directions required before Legal Draft Finalization Candidate work, public Website implementation, stable domain/deployment readiness, private KYC readiness, or a Stripe Account/Activation Authorization Package.

The following states are deliberately separate:

```text
Human-accepted policy directions
!= Legal finalization
!= Website implementation
!= publication
!= deployment
!= Stripe account authority
!= Stripe approval
!= Payment implementation authority
```

At B1 acceptance time, this Acceptance Sync accepted the seven policy directions below without claiming downstream specifications or legal drafts were already aligned. The accepted B2 docs/spec/legal authority records `AGE-GATE-001 = accepted_direction_legal_spec_alignment_human_chatgpt_accepted_complete`; B2 review / acceptance is complete; Production server enforcement remains unimplemented, and Lane B remains blocked. Neither B1 nor B2 creates account/contact/submission authority, publishes anything, or changes Product code/UI.

Bounded official-source facts are controlled by `../legal/LEGAL_SOURCE_REGISTER.md` and were rechecked on `2026-08-13`. They establish preparation requirements only and do not establish Moon Reply legal compliance, Stripe supportability, or Stripe approval.

## 2. Decision register

### LB-DEC-AGE-001 — Age-gate mechanism

Accepted direction:

- Use the dedicated `私は18歳以上です` self-attestation checkbox.
- Do not collect age bands solely for eligibility.
- Do not collect date of birth or identity documents for initial Customer age eligibility.
- Server-side purchase authority must ultimately require accepted adult confirmation.
- This is self-attestation, not strict identity verification.

Rationale:

- The Product requires confirmation of 18+ eligibility, not age-band analysis.
- Boolean self-attestation minimizes data collection.
- It creates lower Customer friction.
- The current implementation already uses it.
- Server-side enforcement can validate `adultConfirmed=true`.
- The reviewed Stripe and Consumer Affairs Agency source set contains no requirement that Moon Reply collect age bands.
- This is self-attestation, not identity verification.

Human decision status: `accepted`

Downstream state:

```yaml
AGE-GATE-001:
  human_direction: accepted
  downstream_alignment: pending
  semantic_state: accepted_human_direction_downstream_alignment_pending
```

No RequestForm, `ORDER_FORM_SPEC`, `PAYMENT_CONFIRMATION_SCREEN_SPEC`, Terms, Privacy, age-related specification, or legal draft is modified by this Acceptance Sync. Lane B remains blocked until the conflicting downstream specifications and legal drafts are synchronized.

### LB-DEC-ENTITY-001 — Stripe entity/account route

Accepted direction: **Use the individual / sole-proprietor applicable Stripe route for the initial MVP.**

- Do not create a corporation solely to open a Stripe account.
- Current Stripe Japan guidance says sole proprietors may register regardless of whether a business-registration filing has been made.
- Tax timing and opening-notification decisions remain separate.
- Actual Stripe onboarding entity labels and required fields remain evidence-gated and must be reviewed when the later account-authorization task is created.

Human decision status: `accepted`

No account creation is authorized.

### LB-DEC-DISCLOSURE-001 — Tokushoho operator disclosure

The accepted decision keeps three disclosures separate:

A. Truthful private KYC disclosure to Stripe.

B. Customer-facing public disclosure.

C. A statutory request-based disclosure mechanism.

Accepted direction: **Prefer request-based disclosure for legally eligible legal-name/address/phone fields where current law and actual Stripe requirements permit, with a functioning pre-Payment disclosure-request mechanism.**

Limitations:

- This does not permit fake values.
- This does not permit refusing disclosure.
- The Customer must be able to request information before deciding to purchase.
- A purchase ID, completed purchase, or login must not be required.
- The mechanism must provide the legal name, full address, and reachable phone when applicable.
- Requests and responses require operational records.
- Exact response-time wording must be operationally achievable.
- Stripe Commerce Disclosure separately requires an email address.
- Stripe also lists Head of Operations as a distinct field.
- This acceptance does not establish that the Human's legal name can remain routinely non-public under every Stripe review outcome.
- Exact final Tokushoho wording remains gated by current official sources and actual Stripe evidence.

Human decision status: `accepted`

No real name, address, or phone is committed.

### LB-DEC-SUPPORT-001 — Contact/support model

Accepted direction: **Use one operating business mailbox plus one categorized contact form.**

Accepted categories:

- delivery / result URL / email non-delivery;
- ordinary cancellation / refund;
- Payment Integrity incident;
- Privacy / deletion / data disclosure;
- seller-information disclosure request; and
- other.

Operational requirements:

- mailbox receiving test;
- 2FA;
- account recovery;
- responsible operator and access control;
- internal notification;
- anti-spam measures;
- request/response logging;
- continuity/backup procedure;
- separate handling priority for Payment Integrity;
- no purchase-ID requirement for a disclosure request; and
- Human/private input for the actual support email and response-time commitment.

Human decision status: `accepted`

No actual email address is invented by this Acceptance Sync.

### LB-DEC-REFUND-001 — Refund and cancellation model

The accepted distinction remains:

```text
ordinary Product refund
!= Payment Integrity remediation
```

#### Before Payment

- The Customer may stop the application with `JPY 0 / free cancellation`.
- No charge occurs.

#### After Payment success but before generation starts

- Permit a full JPY 980 cancellation/refund only where the future system can objectively prove the request arrived before `generation_started`.
- Do not promise this publicly until the state machine and operation can enforce it.

#### After generation begins / after successful fulfillment

- Customer dissatisfaction alone is not ordinarily a refund reason.
- Preserve applicable statutory rights and serious Product-defect remedies.
- Do not claim that every post-generation refund request is legally excluded.

#### Product/technical failure

- The same Purchase may receive bounded recovery without recharging.
- If the Product cannot be delivered, the ordinary refund is full JPY 980.

#### Wrong Customer-entered email

- Prioritize ownership verification, correction, result-link invalidation, and secure reissue.
- Evaluate Privacy incident risk.
- If secure fulfillment cannot be completed, full-refund candidacy remains.

#### Payment Integrity

- duplicate charge;
- wrong amount;
- wrong Customer;
- wrong Request;
- Safety bypass; or
- another unintended economic charge.

These are remediation, not ordinary refund. Correct the actual unintended amount or charge; do not cap remediation at JPY 980.

Unresolved:

- exact cancellation state;
- exact generation-start boundary;
- decision authority;
- refund execution method;
- Provider fee behavior;
- processing duration;
- evidence retention; and
- chargeback/dispute workflow.

Human decision status: `accepted`

This Acceptance Sync preserves the provider-independent Charter boundaries, keeps ordinary JPY 980 Product refunds distinct from uncapped Payment Integrity remediation, and synchronizes the accepted pre-generation cancellation direction without implementing any Provider operation.

### LB-DEC-FULFILLMENT-001 — Delivery and fulfillment wording

Accepted wording skeleton:

> 「確認済みメールアドレスについて、サーバーが決済成功を確認した後に鑑定ノートの生成を開始します。結果は、公開前に実測と運用確認に基づいて定める提供期限までに結果ページで提供し、確認済みメールアドレスへ通知します。障害時は同一購入で復旧を試み、提供できない場合は税込980円を全額返金します。」

- Email ownership verification occurs before real Payment.
- Trusted-session reuse applies only to the same unchanged verified email.
- Generation starts only after server-authoritative Payment success.
- Recovery uses the same Purchase and does not recharge.
- Refund-required state and delivered state remain exclusive.
- Delayed output must not be automatically delivered after refund finalization.
- Real Payment, Production fulfillment, and a delivery SLA do not currently exist.
- No concrete minutes or hours may be published before production-like measurement.
- Provider object, authorization, and capture semantics remain unresolved.

Accepted direction: **Use the skeleton and determine the concrete delivery deadline only from measured production-like performance plus a conservative operational buffer.**

Human decision status: `accepted`

### LB-DEC-DOMAIN-001 — Stable domain/review URL strategy

Accepted direction: **Choose the intended final production domain before Stripe Account/Site review; do not use a temporary review URL as the default Stripe review strategy.**

Rationale:

- reduces repeated ownership verification;
- avoids changing canonical, metadata, and legal links;
- avoids repeating screenshot/evidence capture;
- keeps the Stripe-submitted URL aligned with the eventual paid service; and
- reduces wasted migration work.

Current boundary:

- no domain is selected;
- no availability is claimed;
- no purchase is authorized;
- no DNS change is authorized;
- no deployment is authorized; and
- actual domain research/selection is a later Human task.

Human decision status: `accepted`

## 3. Recommended execution sequence

| Step | Bounded work |
| --- | --- |
| B0 | Workflow Pivot + Human Decision Package Candidate — complete at historical formulation commit `223a2746f72ae8faa90b4df198f998a8132f2f3a` |
| B1 | Human + ChatGPT decision review and acceptance sync — complete on `2026-08-13` |
| B2 | Stripe Lane B Legal Draft Finalization Candidate — `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`; Human + ChatGPT review and acceptance complete |
| B3 | Review-ready Website/Public Surface implementation — accepted complete on `2026-08-14` |
| B4a | Deployment readiness — exact current next work; planning/readiness only |
| B4b | Stable URL deployment under separate external-action authority |
| B5 | Private KYC readiness |
| B6 | Stripe Account/Activation Authorization Package |
| B7 | Actual Stripe account creation/KYC/activation submission under a further explicit Human external-action authorization |

PayPay Lane C remains separate and later. Exact future branches and mutation manifests must not be assigned before predecessor acceptance.

The B2 Candidate synchronized the accepted Human directions into the age-related specifications/legal drafts, Terms, Privacy, Tokushoho, Refund, Contact, AI disclosure, Unsupported Cases, and final-confirmation legal facts. Its status remains `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`; B3 review-ready Website/Public Surface implementation is separately accepted complete on `2026-08-14`. The exact current next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B2 and B3 authorize no publication. Lane B remains blocked until downstream Legal/Site/KYC/domain requirements are actually completed, and no external action is authorized.

## 4. Private-data and operation boundary

Git may contain decision options, status, field names, and redacted references only. It must not contain actual legal name, date of birth, home/business address, phone, identity-document image or number, bank values, support-mailbox credentials, domain-registrar credentials, Stripe credentials, complete sensitive screenshots, or low-entropy PII hashes.

This Acceptance Sync performs zero Stripe Sales/Support/account/submission/Dashboard/API/SDK/Checkout operations; zero PayPay/PAY.JP/RevenueCat operations; zero Provider/API/DB/Supabase/migration/Runtime/LUNA operations; zero domain purchase/DNS/deployment operations; and zero Payment implementation operations.
