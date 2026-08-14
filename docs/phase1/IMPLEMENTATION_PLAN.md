# IMPLEMENTATION_PLAN.md

> **CURRENT Stripe Lane B B4b Final R1 evidence overlay:** `stripe_lane_b_b4b_final_r1_external_qa_evidence_recorded_pending_human_chatgpt_review_b4b_acceptance`; latest externally verified artifact: R1 `3f45d40d89660223030bfa1b881e4c04ae394445`; R1 Provider build / Private Branch Deploy: `success / success`; Private protection `maintained`; Production SHA `025e28a82c0b773d21ececfd8064af045922079d`, `unchanged / locked`; R1 technical QA `PASS_26_of_26_on_r1_sha`; R1 truthfulness QA `FAIL_stale_r1_self_evidence_state_only`. ChatGPT final review / Human final review / B4b acceptance: `pending / pending / pending`.
>
> RequestMemo blocker `resolved`; `/request` robots `PASS`; safety-stop `PASS_expected_fail_closed`; unauthenticated HTTP `PASS_13_of_13_unauthenticated_http_401`; authenticated HTTP `partial_rendered_pages_confirmed_exact_numeric_http_status_unconfirmed`; Preview/Production separation `PASS`; runtime contract asset inclusion `not_fully_proven`; rollback/republication `not_executed_not_proven`; removal/offline `not_executed_not_proven`; Netlify Hard Gate `not_passed`; Paid Production Hosting `provisional`. This evidence-sync source records completed R1 evidence and does not itself constitute or assert additional Provider deployment evidence. Future Provider operations remain separately authorized; raw Provider URLs/IDs stay prohibited; historical B3/B4a/B4b Candidate and R1 commit-time snapshots remain unchanged. Detailed evidence: docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md.

## 0. Status and Purpose

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

This document aligns implementation planning with the authoritative `docs/ROADMAP.md` delivery sequence.

Current Payment planning authority: the Stripe-first strategy, Customer-facing / Public-copy Alignment, Stripe Feasibility Evidence Preparation, Lane B Human Decision Package, B2 authority, and B3 review-ready Website/Public Surface implementation remain accepted complete at their separate levels. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. Stripe Sales is `not_used_by_human_direction`, not a Provider outcome. Stripe Lane B deployment readiness (B4a) is the exact current next work and remains planning/readiness only. Lane B/C remain blocked pending downstream requirements; no external action is authorized. Stripe feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete; PAY.JP is paused fallback; Payment implementation and Production Payment authority are `false / false`.

Task 18C-R3 is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.

Task M1-P1 planning/specification is completed in the repository and awaiting Human review. It does not authorize implementation.

## 1. Product and Delivery Boundary

Canonical service:

- official: `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`;
- user-facing: `恋のメッセージ鑑定ノート`;
- one report, not chat;
- JPY 980 one-shot;
- users aged 18 or older;
- safety enforcement before payment;
- no provider selected; and
- no payment implementation yet.

The initial paid Web MVP completes only after Milestone 9 verifies the first real unknown-customer purchase through payment, generation, result access, email delivery, and internal traceability.

## 2. Completed Foundations

Stages 1–4.5 and Tasks 18B–18C-R2 are completed foundations:

- Stage 1: Next.js/TypeScript/Tailwind foundation and static LP;
- Stage 2: request-form UI and client-side validation;
- Stage 3: Supabase schema foundation;
- Stage 4: deterministic local safety foundation;
- Stage 4.5: legal/compliance foundation;
- Task 18B: legal-page drafts and publication/operator decision gates;
- Task 18C: operator-decision and provider-inquiry preparation;
- Task 18C-R1: required 18-or-older age-policy alignment; and
- Task 18C-R2: canonical service-positioning alignment, accepted by Human; and
- Task 18C-R3: roadmap reset and delivery-lane alignment, accepted by Human.

These completed foundations do not include production server validation, public DB writes, payment, OpenAI, email, deployment, provider inquiry, provider selection, legal-page publication, or production operations.

The former statement that Stage 1 is the next implementation task is obsolete and removed from current authority.

## 3. Work-Type Separation

The remaining delivery lane separates work that must not be collapsed into one task:

| Work type | Primary milestone | Boundary |
| --- | --- | --- |
| Planning/specification | Every milestone, beginning with Milestone 1 | Defines scope and acceptance; does not authorize implementation by itself |
| UI/review implementation | Milestone 1 | Payment-free, fixture/mock based, no public writes or runtime integrations |
| Operator decisions | Milestone 2 / Stripe Lane B B1 | Human facts and policies; no fictional public facts; current Lane B Candidate decisions remain pending |
| Public-surface and deployment work | Milestone 3 / Stripe Lane B B3–B4b | B1/B2 predecessor acceptance, review-ready public surface, deployment readiness, then separately authorized stable review URL with payment unavailable |
| Provider review evidence and selection | Milestone 4 | Provider-specific authoritative evidence and Human provider selection required |
| Backend/AI/email implementation | Milestone 5 | Mock-paid/test-paid fulfillment before real payment integration |
| Payment implementation | Milestone 6 | Human-approved provider, sandbox/test mode only |
| E2E and operations | Milestone 7 | Normal, safety, abuse, failure, refund, recovery, and stop procedures |
| Production application and launch | Milestone 8 | Production approval and limited soft launch |
| Real purchase verification | Milestone 9 | First verified unknown-customer order completes the MVP |

## 4. Approved Milestone Sequence

### Milestone 1: Reviewable Web MVP

Planning/specification must define the route inventory, UI states, fixture strategy, legal-page presentation, design brief, acceptance criteria, and bounded implementation slices.

Implementation, only after that plan is accepted, may create the payment-free review experience described in `docs/ROADMAP.md`. It must use fixtures or mock state and must not add real payment, OpenAI, email sending, public database writes, fake social proof, or fictional operator facts.

Validation must prove that a reviewer can understand the offer, price, input flow, safety boundaries, final confirmation, expected report, and legal/support information. Human acceptance closes the milestone.

### Milestone 2: Operator Information and Publication Readiness

Planning/specification must enumerate every unresolved operator/publication decision and its evidence owner. Human supplies or approves truthful operator facts and operational policies. Public-facing TBD and fictional placeholders must be removed or withheld before publication.

Validation confirms that no public review page presents invented or unresolved information as complete. Human acceptance closes the milestone.

For the Stripe Lane B overlay, B1 and B2 are accepted. B3 Review-ready Website/Public Surface implementation is accepted complete on `2026-08-14`; Human Visual QA and ChatGPT review are PASS. Stripe Lane B deployment readiness (B4a) is the exact current next work, but this Acceptance Sync does not implement B4a or authorize B4b–B7 work.

### Milestone 3: Review Site Deployment

For Stripe Lane B, B2 Legal Draft Finalization Candidate and B3 Review-ready Website/Public Surface implementation are accepted complete at their separate authority levels. Stripe Lane B deployment readiness (B4a) is the exact current next work and remains planning/readiness only. B4a must define hosting compatibility, hosting cost/operating model, stable review URL plan, indexing/privacy posture, contact receipt validation plan, device/browser coverage, rollback/removal procedure, and domain decision sequencing. It authorizes no domain purchase, DNS mutation, deployment, publication, Stripe submission, Provider activation, or Production Payment.

B4b implementation deploys only the payment-free review site and requires separate Human external-action authority. Validation covers stable URL access, mobile/desktop presentation, navigation, broken links, contact receipt, and a clear payment-unavailable notice. Human acceptance closes the milestone. No exact future branch or mutation manifest is assigned before predecessor acceptance.

### Milestone 4: Payment Provider Review Evidence and Selection

Planning/specification must freeze the truthful service description, provider-specific review route, evidence format, provider fallback order, comparison criteria, and Human decision gates. No account, contact, submission, or implementation is authorized by planning.

Current conceptual sequence is completed Stripe-first strategy Acceptance Sync -> accepted-complete Customer-facing/public-copy Alignment -> accepted-complete Stripe feasibility evidence preparation -> B0 Stripe Lane B Human Decision Package Candidate -> B1 Human + ChatGPT review/acceptance sync -> B2 Legal Draft Finalization Candidate -> B3 Review-ready Website/Public Surface -> B4a deployment readiness -> B4b separately authorized stable-URL deployment -> B5 private KYC readiness -> B6 Stripe Account/Activation Authorization Package -> B7 actual Stripe account/KYC/activation submission under further explicit Human authority -> lane-specific evidence -> explicit Human review if any desired method is unavailable -> Human formal Provider selection. Stable review URLs/public legal conditions must exist before any Provider/site review requiring them. PAY.JP is preserved paused fallback and follows its application route only after explicit reactivation and current-source re-review.

Validation confirms authoritative approval/review evidence and all known application/site conditions. Human selects the provider and accepts the milestone.

### Milestone 5: Core Backend, Safety, AI and Email

Planning/specification must define API/persistence boundaries, the required adult-confirmation boolean and its server-side authority evidence, semantic Safety enforcement, current server-owned eligibility with `purchaseGateSatisfied=true`, state transitions, AI payload minimization, structured schemas, retry/failure behavior, tokens, email test/log mode, feedback persistence, and recovery evidence. It must not require an eligibility-only age band, date of birth, or identity document.

Implementation connects the request-to-delivery flow using mock-paid or test-paid state. Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error conditions must have no payment path. Waiting, not-sending-now, temporary pause, and boundary-respecting support are not automatically disqualifying when separate assistance eligibility remains valid. Browser, client, and localStorage cannot establish Purchase authority. Real provider card integration is excluded.

Validation proves one controlled request can move from submission through stored result and delivery without real card payment. Human acceptance closes the milestone.

### Milestone 6: Approved Provider Sandbox Payment

Planning/specification must be provider-specific and based on Milestone 4 authoritative approval/review evidence. It must define checkout, event verification, webhook signatures, idempotency, duplicate prevention, purchase state machine, cancellation/failure, refunds, and evidence retention.

Implementation connects only the Human-approved provider in test/sandbox mode. Validation proves one sandbox payment triggers exactly one fulfillment and one accessible result. Human acceptance closes the milestone.

### Milestone 7: E2E, Safety and Failure Operations

Planning/specification must define the evidence matrix and operator runbooks for normal, dangerous, abusive, duplicated, and failed paths.

Implementation may add only the controls and recovery paths accepted in the plan. Validation covers missing/invalid adult confirmation; clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error fail-closed behavior; the non-automatic treatment of waiting, not-sending-now, temporary pause, and boundary-respecting support; server-owned `purchaseGateSatisfied=true`; duplicate webhook; AI/email failure; token protection; rate limits; spam/abuse; manual recovery; refund/reissue; retention/deletion; device UI; legal/publication review; and production stop. Human acceptance closes the milestone.

### Milestone 8: Production Application and Soft Launch

Planning/specification must define production application evidence, secrets/domain setup, monitoring/logging, limited traffic, order observation, and emergency purchase stop.

Implementation/configuration occurs only after provider production authorization. Validation proves intentional limited availability and operable monitoring/stop controls. Human acceptance closes the milestone.

### Milestone 9: First Real Purchase Verification

Planning/specification must define the first-order observation and evidence checklist without exposing customer personal information.

Verification confirms payment evidence, internal purchase record, exactly one generation, exactly one result token, result access, email delivery, support traceability, no personal-information exposure, and no unhandled failure. Human acceptance records initial paid Web MVP completion.

## 5. Dependency Ordering

The dependency chain is strict:

`Stripe-first strategy Acceptance Sync (complete) → Customer-facing/public-copy Alignment (accepted complete) → Stripe feasibility evidence preparation (accepted complete) → B0 Lane B Human Decision Package Candidate → B1 Human + ChatGPT decision review/acceptance sync → B2 Legal Draft Finalization Candidate → B3 Website/Public Surface → B4a deployment readiness → B4b separately authorized stable-URL deployment → B5 private KYC readiness → B6 account/activation authorization package → B7 separately authorized account/KYC/activation submission → authoritative evidence → Human formal Provider selection → separately authorized Payment implementation → Production QA → separate Production Payment authorization → Soft Launch`

The Product/UI/content alignment item is accepted complete; no Payment Provider implementation item is complete. No Provider account/contact is authorized. Provider-specific Payment implementation cannot precede Human formal selection and separate implementation authorization. Sandbox payment and Production QA cannot be treated as Production Payment authorization. Soft Launch requires separate Production Payment authorization and cannot precede E2E and failure-operation evidence.

## 6. One-Task / One-Commit / Human-Review Rule

- Do not combine milestones or implementation slices into one task.
- Every task must state scope, exclusions, acceptance criteria, and evidence.
- Each accepted task is one intentional commit unless Human explicitly authorizes otherwise.
- Human review is required before the next task or milestone begins.
- No unrelated feature creep is allowed.
- Technical availability of a later integration does not authorize skipping dependencies.

## 7. Current Payment Gate and Next Task

Milestone 1 task snapshots are historical and do not control the current Payment task. The Customer-facing/public-copy Alignment, Stripe feasibility evidence preparation, all seven Stripe Lane B Human policy decisions, B2 authority, and B3 review-ready Website/Public Surface implementation are accepted complete at their separate levels. Stripe Sales is `not_used_by_human_direction`, Lane A is preserved inactive, and Stripe Lane B deployment readiness (B4a) is the exact current next work and remains planning/readiness only. `AGE-GATE-001` B2 docs/spec/legal alignment and B3 review display are accepted while Production enforcement and other downstream evidence/implementation remain pending. Lane B/C remain blocked; actual Stripe contact/submission and account/business/site/category/Live Payment or payment-method evidence acquisition remain unauthorized and evidence-gated.

Strategy acceptance alone did not authorize truthful-public-copy implementation; that bounded implementation was separately authorized and is now accepted. Neither acceptance authorizes Provider evidence acquisition, account/contact, sandbox/test Payment implementation, Production Payment, deployment, legal publication, or release. Each future step requires its own authority and evidence in the sequence above.
