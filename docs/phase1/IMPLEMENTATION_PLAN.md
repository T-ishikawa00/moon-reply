# IMPLEMENTATION_PLAN.md

## 0. Status and Purpose

> **B2 Candidate current overlay:** `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review` on `2026-08-13`; Human + ChatGPT review / acceptance `pending / pending`; exact next work B2 review. B3 and later implementation/deployment/Provider steps remain inactive pending their explicit predecessor gates.

This document aligns implementation planning with the authoritative `docs/ROADMAP.md` delivery sequence.

Current Payment planning authority: the Stripe-first strategy, Customer-facing / Public-copy Alignment, and Stripe Feasibility Evidence Preparation remain accepted complete. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. Stripe Sales is `not_used_by_human_direction`, not a Provider outcome. The Stripe Lane B Human Decision Package is `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; all seven policy decisions are accepted. The B2 Candidate is `stripe_lane_b_legal_draft_finalization_candidate_ready_pending_human_chatgpt_review`; B2 Human + ChatGPT review is the exact current next work and acceptance remains pending. Lane B/C remain blocked pending downstream requirements; no external action is authorized. Stripe feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete; PAY.JP is paused fallback; Payment implementation and Production Payment authority are `false / false`.

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

For the Stripe Lane B overlay, B1 Human + ChatGPT review of `STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md` is complete and all seven decisions are accepted. Human + ChatGPT review of the B2 Legal Draft Finalization Candidate is the exact current next work; B2 acceptance remains pending and the Candidate authorizes no B3–B7 work.

### Milestone 3: Review Site Deployment

For Stripe Lane B, B2 Legal Draft Finalization Candidate is ready pending Human + ChatGPT review; that review is the exact current next work, and B2 remains internal/draft only and not accepted. B3 Review-ready Website/Public Surface implementation may begin only after separate B2 acceptance. Planning/specification for B4a must then define hosting, review URL, indexing/privacy posture, contact receipt test, device coverage, and rollback/removal procedure.

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

Milestone 1 task snapshots are historical and do not control the current Payment task. The Customer-facing/public-copy Alignment, Stripe feasibility evidence preparation, and all seven Stripe Lane B Human policy decisions are accepted complete. Stripe Sales is `not_used_by_human_direction`, Lane A is preserved inactive, and the B2 Candidate is ready pending Human + ChatGPT review; that review is the exact current next work. `AGE-GATE-001` draft/spec alignment is Candidate complete while Production enforcement and other downstream evidence/implementation remain pending. Lane B/C remain blocked; actual Stripe contact/submission and account/business/site/category/Live Payment or payment-method evidence acquisition remain unauthorized and evidence-gated.

Strategy acceptance alone did not authorize truthful-public-copy implementation; that bounded implementation was separately authorized and is now accepted. Neither acceptance authorizes Provider evidence acquisition, account/contact, sandbox/test Payment implementation, Production Payment, deployment, legal publication, or release. Each future step requires its own authority and evidence in the sequence above.
