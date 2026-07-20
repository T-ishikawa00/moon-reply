# ROADMAP.md

## 1. Status and Authority

This document is the authoritative high-level delivery roadmap for the initial paid Web MVP of 月の返事.

The canonical service is an `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート`, presented to users as `恋のメッセージ鑑定ノート`. It is one report, not chat, sold as a JPY 980 one-shot service for users aged 18 or older. Safety enforcement must occur before payment.

Earlier documents considered semi-manual validation, semi-manual Web delivery, automated Web, subscription, and native-app alternatives. Those records remain historical context but do not control the current delivery sequence. Where another planning document conflicts with this roadmap, this roadmap controls until Human approves a documented change.

Current status:

- Milestone 0 is completed.
- Task 18C-R3 is accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.
- Tasks M1-P1 and M1-P1-R1 are accepted by Human.
- Tasks M1-I1 through M1-I5 and M1-I5-R1 are accepted by Human.
- Task M1-I6 was not accepted by Human and is formally closed as superseded by M1-P2. Its implementation and evidence remain historical records, and its known defects are carried into M1-I7 through M1-I12 and final M1-I12 QA. This is not M1-I6 acceptance; Milestone 1 remains incomplete.
- Task M1-P2 Experience & Visual Direction Revision is accepted by Human. It documents the broader revision inside Milestone 1; no later M1-I6 Human Visual QA or disposition gate is required.
- M1-P2 is a planning task. Its acceptance did not itself authorize implementation. Human subsequently authorized M1-I7, then explicitly authorized a one-time integrated M1-I7 through M1-I11 implementation batch that replaced the normal prior-slice acceptance pauses for this batch only.
- Human accepted the integrated M1-I7 through M1-I11 redesign as the baseline for the next planning stage. This is one integrated baseline decision, not independent acceptance records for each slice and not final Milestone 1 acceptance.
- Human also accepted M1-P2-R1 Public Sample Conclusion Diversification and the subsequent bounded M1-P2-R1-R1 contrast/comparison-boundary correction. The accepted baseline contains separate wait/send/stop-additional-contact public fictional cases while preserving `result-normal-001`, Safety, and runtime boundaries.
- Task M1-P3 Reading Note Visual Excellence Specification is Human and ChatGPT accepted. Its documentation/design package remains the authoritative Visual Excellence specification. The specification is complete; its acceptance does not authorize canonical implementation.
- Task M1-I2-R1 Safety Policy Enforcement Alignment is Human-accepted and synchronized to `main`. `SEM-UNSUPPORTED-CASES` passes without waiver, and the previous M1-P3-R1 hard stop is resolved.
- M1-P3-R1 implements two isolated, review-only coded visual prototypes using the same fixed `result-normal-001` content and semantic order. Automated validation is complete. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`; the Human design-selection gate is complete.
- The required M1-P3 coded-prototype design gate is satisfied by the B selection. Figma remains optional, non-authoritative reference material and is not required for implementation. Prototype acceptance is design-direction evidence, not canonical visual implementation authorization.
- Checkpoint A / M1-I8-R1 Technical Preparation is explicitly Human-authorized and not yet implemented. Checkpoint B / M1-I8-R1 Visual Excellence remains unauthorized and unimplemented; its prototype-selection dependency is satisfied, but it still requires separate explicit Human authorization. M1-I9-R1 and M1-I12 remain unauthorized and unimplemented. Milestone 1 remains incomplete.
- The canonical Reading Note visual implementation remains unchanged. The review-only prototype routes/components remain isolated on `design/m1-p3-coded-visual-prototype` and are not merged into `main`.
- The controlling artifact names are `恋のメッセージ鑑定ノート` for the product, `Web鑑定ノート` for the long presentation, and `保存用判断カード` for the short presentation. Residual application copy such as `保存用鑑定書` is a known deferred M1-I8-R1 alignment item and is not changed by baseline closure.
- Milestone 2 and every later milestone remain unauthorized.
- No payment provider has been selected.
- No provider inquiry, production backend, payment, OpenAI, email, or deployment work has started.

## 2. Initial Web MVP Completion Definition

The initial paid Web MVP is complete only at Milestone 9, when a first real unknown customer can and does:

1. open the public LP;
2. submit a reading request;
3. pass production server-side age and safety validation;
4. pay JPY 980 once;
5. trigger AI analysis and report generation;
6. open the result through an unguessable URL;
7. receive the result URL by email; and
8. submit feedback or provide traceable support follow-up.

The operator must be able to identify the order, payment state, generation state, and delivery state; handle failures and refund/escalation cases; and stop new paid orders when necessary.

Completion is not established by a deployed review site, a provider application, a sandbox payment, or a successful internal E2E run alone.

## 3. Current Completed Foundations — Milestone 0

Status: completed.

Completed foundations:

- product concept and JPY 980 one-shot model;
- Next.js, TypeScript, and Tailwind project foundation;
- static LP;
- request-form UI;
- required 18-or-older age-group selection and client-side validation;
- deterministic local safety foundation;
- Supabase schema foundation;
- legal/compliance foundation;
- legal-page drafts;
- provider-inquiry preparation; and
- canonical service positioning.

These foundations do not mean that production request persistence, production server validation, provider approval, payment, AI generation, email delivery, public legal pages, or deployment is complete.

## 4. Milestone 1: Reviewable Web MVP

Goal: create a payment-free, externally reviewable representation of the complete purchase and delivery experience.

Required reviewable routes or screens:

- `/`;
- `/request`;
- request confirmation;
- safety blocked state;
- safety needs-review state;
- purchase/final-confirmation screen;
- sample report page;
- production-shaped result page using fixture data;
- legal-information index or navigation;
- Terms, Privacy, Tokushoho, Refund, AI disclosure, unsupported-cases, and contact pages.

Allowed: fixture data, mock request/payment state, sample report content, and a disabled or preparation-only purchase action.

Prohibited: real payment, OpenAI API, real email sending, public database writes, fake customer reviews, fake purchase counts, and fictional operator information presented as real.

Exit criterion: a reviewer can understand what is sold, the price, input flow, safety boundaries, final confirmation, expected output, and legal/support information without real payment or AI integration.

## 5. Milestone 2: Operator Information and Publication Readiness

Goal: resolve the Human/operator decisions required for a truthful review site.

Includes operating status, operator-name treatment, business name if any, contact email and method, address/phone display decisions, response-time policy, delivery timing, result URL lifetime, refund/reissue operation, privacy contact, retention/deletion decisions, and removal of public-facing TBD or fictional placeholders.

Exit criterion: no public review page presents invented operator facts or unresolved placeholders as completed information.

## 6. Milestone 3: Review Site Deployment

Goal: deploy the payment-free Reviewable Web MVP to a stable external URL.

Includes hosting deployment, stable review URL, mobile and desktop review, navigation and broken-link review, contact receipt review, clear notice that payment is unavailable, and an appropriate indexing/privacy decision for the review stage.

Exit criterion: an external reviewer or payment provider can inspect the service at a stable URL.

## 7. Milestone 4: Payment Provider Inquiry and Selection

Goal: use the real review URL and an honest service description to obtain written provider evidence and a Human selection.

Sequence:

1. Human approves the final PAY.JP inquiry.
2. The inquiry is sent through a verified official channel.
3. The response is recorded verbatim as evidence.
4. If PAY.JP is unavailable or unsuitable, proceed to KOMOJU.
5. STORES or another provider is considered only when authorized.
6. Written conditions are compared.
7. Human selects the provider.

A generic support response, invitation to apply, silence, or SDK availability is not provider approval.

Exit criterion: Human selects a provider using written evidence, and the required application and site conditions are known.

## 8. Milestone 5: Core Backend, Safety, AI and Email

Goal: complete the fulfillment flow using mock-paid or test-paid state before real payment integration.

Includes request submission and Supabase persistence; production server validation of allowed age-group values; production enforcement of `normal_allowed`, `needs_review`, and `rejected`; no payment path for `needs_review` or `rejected`; minimized AI payloads; structured AI judgment and full-report generation; schema/output validation; retries and failure handling; result-token generation, persistence, and display; email delivery or approved test/log mode; and feedback persistence.

Exit criterion: excluding real card payment, one request can move from submission to stored result and delivery in a controlled test environment.

## 9. Milestone 6: Approved Provider Sandbox Payment

Goal: connect only the Human-approved provider in test or sandbox mode.

Includes checkout creation, provider-event and webhook-signature verification, idempotency, duplicate-payment prevention, purchase state machine, payment-success requirement before generation, failure/cancellation handling, refund foundation, and provider-event evidence retention.

Exit criterion: one sandbox/test payment triggers exactly one fulfillment flow and produces exactly one accessible result.

## 10. Milestone 7: E2E, Safety and Failure Operations

Goal: prove normal and failure paths before accepting real payment.

Includes normal E2E; invalid age; rejected and needs-review cases; duplicate webhook; payment success plus AI failure; email failure; token access protection; rate limiting; abuse/spam controls; retry/manual recovery; refund/reissue; retention/deletion; mobile and desktop UI review; legal/publication final review; and production-stop procedure.

Exit criterion: normal, dangerous, and failure cases have evidence, expected outcomes, and operator procedures.

## 11. Milestone 8: Production Application and Soft Launch

Goal: obtain production approval, configure production systems, and release intentionally to a limited audience.

Includes provider production review/application, production keys and secrets, production domain, monitoring/logging, limited traffic, manual observation of initial orders, and an emergency purchase stop.

Exit criterion: production payment is authorized and the service is intentionally open to a limited audience.

## 12. Milestone 9: First Real Purchase Verification

Goal: verify the first real unknown-customer order from payment through feedback or support follow-up.

Required evidence:

- payment evidence;
- internal purchase record;
- exactly one generation;
- exactly one result token;
- successful result access;
- email delivery;
- support traceability;
- no exposed personal information; and
- no unhandled failure.

Exit criterion: all evidence above is confirmed for the first real unknown-customer order. This is the initial paid Web MVP completion point.

## 13. Explicit Initial-MVP Out of Scope

- login;
- user account or my page;
- partner-specific notebook;
- diagnosis history or saved reports;
- subscription, coins, points, or recurring billing;
- native application or push notifications;
- full admin dashboard; and
- unapproved provider-specific implementation.

## 14. Post-MVP Candidates

Only after initial paid Web MVP completion and real demand evidence may Human consider:

- operator/admin tools;
- improved refund and regeneration operations;
- saved reports;
- user accounts;
- partner-specific notebooks;
- previous-reading comparison;
- follow-up analysis;
- subscription evaluation; and
- native-app evaluation.

These are candidates, not approved immediate tasks.

## 15. Change-Control Rule

No milestone may be skipped merely because a later integration is technically available. Human acceptance of the previous milestone is required before the next milestone begins.

Each milestone must be planned, implemented where applicable, validated, committed as bounded work, and accepted by Human. A roadmap update does not itself authorize implementation. Changes to milestone order, completion definition, price, age policy, safety-before-payment rule, provider choice, or MVP scope require explicit Human approval and an update to the controlling documents.
