# IMPLEMENTATION_PLAN.md

## 0. Status and Purpose

This document aligns implementation planning with the authoritative `docs/ROADMAP.md` delivery sequence.

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
| Operator decisions | Milestone 2 | Human facts and policies; no fictional public facts |
| Deployment for review | Milestone 3 | Stable review URL with payment unavailable |
| External inquiry and selection | Milestone 4 | Written evidence and Human provider selection required |
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

### Milestone 3: Review Site Deployment

Planning/specification must define hosting, review URL, indexing/privacy posture, contact receipt test, device coverage, and rollback/removal procedure.

Implementation deploys only the payment-free review site. Validation covers stable URL access, mobile/desktop presentation, navigation, broken links, contact receipt, and a clear payment-unavailable notice. Human acceptance closes the milestone.

### Milestone 4: Payment Provider Inquiry and Selection

Planning/specification must freeze the truthful service description, verified inquiry channel, evidence format, provider fallback order, comparison criteria, and Human decision gate.

External inquiry occurs only after Milestones 1–3 are accepted. PAY.JP is first; KOMOJU follows only if needed; STORES or another provider requires authorization. Responses are retained verbatim. Generic support, an invitation to apply, silence, or SDK availability is not approval.

Validation confirms written evidence and known application/site conditions. Human selects the provider and accepts the milestone.

### Milestone 5: Core Backend, Safety, AI and Email

Planning/specification must define API/persistence boundaries, allowed age values, safety enforcement, state transitions, AI payload minimization, structured schemas, retry/failure behavior, tokens, email test/log mode, feedback persistence, and recovery evidence.

Implementation connects the request-to-delivery flow using mock-paid or test-paid state. `needs_review` and `rejected` must have no payment path. Real provider card integration is excluded.

Validation proves one controlled request can move from submission through stored result and delivery without real card payment. Human acceptance closes the milestone.

### Milestone 6: Approved Provider Sandbox Payment

Planning/specification must be provider-specific and based on Milestone 4 written evidence. It must define checkout, event verification, webhook signatures, idempotency, duplicate prevention, purchase state machine, cancellation/failure, refunds, and evidence retention.

Implementation connects only the Human-approved provider in test/sandbox mode. Validation proves one sandbox payment triggers exactly one fulfillment and one accessible result. Human acceptance closes the milestone.

### Milestone 7: E2E, Safety and Failure Operations

Planning/specification must define the evidence matrix and operator runbooks for normal, dangerous, abusive, duplicated, and failed paths.

Implementation may add only the controls and recovery paths accepted in the plan. Validation covers invalid age, `rejected`, `needs_review`, duplicate webhook, AI/email failure, token protection, rate limits, spam/abuse, manual recovery, refund/reissue, retention/deletion, device UI, legal/publication review, and production stop. Human acceptance closes the milestone.

### Milestone 8: Production Application and Soft Launch

Planning/specification must define production application evidence, secrets/domain setup, monitoring/logging, limited traffic, order observation, and emergency purchase stop.

Implementation/configuration occurs only after provider production authorization. Validation proves intentional limited availability and operable monitoring/stop controls. Human acceptance closes the milestone.

### Milestone 9: First Real Purchase Verification

Planning/specification must define the first-order observation and evidence checklist without exposing customer personal information.

Verification confirms payment evidence, internal purchase record, exactly one generation, exactly one result token, result access, email delivery, support traceability, no personal-information exposure, and no unhandled failure. Human acceptance records initial paid Web MVP completion.

## 5. Dependency Ordering

The dependency chain is strict:

`M1 review experience → M2 truthful operator/publication facts → M3 stable review deployment → M4 written provider evidence and Human selection → M5 backend fulfillment without real card payment → M6 approved-provider sandbox payment → M7 E2E/failure operations → M8 production approval and soft launch → M9 first real purchase verification`

Provider inquiry is not the immediate next task. Provider-specific payment implementation cannot precede Human provider selection. Sandbox payment cannot be treated as production authorization. Production cannot precede E2E and failure-operation evidence.

## 6. One-Task / One-Commit / Human-Review Rule

- Do not combine milestones or implementation slices into one task.
- Every task must state scope, exclusions, acceptance criteria, and evidence.
- Each accepted task is one intentional commit unless Human explicitly authorizes otherwise.
- Human review is required before the next task or milestone begins.
- No unrelated feature creep is allowed.
- Technical availability of a later integration does not authorize skipping dependencies.

## 7. Current Gate and Next Task

Task M1-P1 defines the route inventory, UI states, fixture strategy, legal/contact presentation, design brief, acceptance criteria, and implementation slices for the payment-free Reviewable Web MVP.

Until Human accepts Task M1-P1, no Milestone 1 implementation is authorized.

After acceptance, the next task is M1-I1 Route Shell and Review Navigation only, subject to separate explicit Human authorization. M1-I2 through M1-I6, Milestone 2, APIs, persistence, payment, OpenAI, email, deployment, and package changes remain unauthorized.
