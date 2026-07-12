# IMPLEMENTATION_WBS.md

## Status and Dependency Rule

This WBS implements the sequence controlled by `docs/ROADMAP.md`.

Milestones are ordered dependencies. No implementation task starts until its planning/specification task is accepted, and no milestone starts until Human accepts the previous milestone. Unchecked items are not authorized merely because they are listed.

## Milestone 0: Completed Foundations

- [x] Next.js project foundation
- [x] TypeScript configuration
- [x] Tailwind configuration
- [x] Static responsive LP at `/`
- [x] Request-form UI at `/request`
- [x] Client-side required-field validation
- [x] Required 18-or-older age-group choices and notice
- [x] Deterministic local safety classifier and UI states
- [x] Supabase schema/migration foundation
- [x] RLS enabled without public policies
- [x] Legal/compliance foundation
- [x] Legal-page drafts and publication gate
- [x] Provider-inquiry drafts, evidence log, scorecard, and selection gate prepared
- [x] Canonical service positioning aligned
- [x] Task 18C-R1 accepted by Human
- [x] Task 18C-R2 accepted by Human
- [x] Confirm no production DB writes, payment, OpenAI, email, API, deployment, provider inquiry, or provider selection completed

## Milestone 1: Reviewable Web MVP

Dependency: Task 18C-R3 Human acceptance — satisfied at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.

- [x] Planning/spec: define route inventory
- [x] Planning/spec: define request, confirmation, blocked, needs-review, purchase-confirmation, sample-report, and result fixture states
- [x] Planning/spec: define fixture/mock strategy and prohibit public writes
- [x] Planning/spec: define legal-page presentation and truthful-placeholder handling
- [x] Planning/spec: define design brief, acceptance criteria, and bounded implementation slices
- [x] Planning/spec: create `M1_REVIEWABLE_WEB_MVP_SPEC.md`
- [x] Planning/spec: create `M1_UI_STATE_MATRIX.md`
- [x] Planning/spec: create `M1_IMPLEMENTATION_SLICES.md`
- [x] Planning/spec: create Task M1-P1 review record
- [x] Task M1-P1-R1 docs: align emotional objective, LP, CTA/price, text-only input, anonymization, image deferral, free/ad policy, complete recommendations for all four normal labels, report split, Safety/refund requirement, review banner, and UX reference boundary
- [x] Task M1-P1-R1 docs: add `/review/save-report/result-normal-001` to route/state/slice planning
- [x] Task M1-P1-R1 docs: create decision register and R1 review record
- [x] Human acceptance of Task M1-P1 and Task M1-P1-R1 planning/specification
- [x] M1-I1: implement vertical `/` LP, shared header/footer, `/review/**` shell, and static `/review` inventory
- [x] M1-I1: preserve `/request`, age choices, Safety behavior, and local-only runtime boundary
- [x] M1-I1 desktop visual direction approved by Human
- [x] M1-I1-R1: remove internal terminology from ordinary LP copy without design changes
- [x] Human review and acceptance of M1-I1 at commit `dd031183dd347493fd5619f1b0d8bb355fc93560`
- [x] Human authorization of M1-I2 and selection of a three-step request flow
- [x] M1-I2: add reviewable request confirmation and Safety states
- [x] M1-I2: use one unified required acknowledgement after a visible five-item list; exclude refund and marketing consent
- [x] Human visual review and acceptance of M1-I2 at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`
- [x] Human authorization of M1-I3
- [x] M1-I3: add purchase/final-confirmation screen with disabled or preparation-only action
- [x] M1-I3: validate allowlisted normal-only access, unknown/non-normal failure, and absence of transaction behavior
- [x] Human visual review and acceptance of M1-I3 at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25`
- [x] Human authorization of M1-I4
- [x] M1-I4: add fictional sample, production-shaped Web鑑定ノート fixture, and separate 保存用鑑定書 fixture preview
- [x] M1-I4: derive Web/save from one shared `result-normal-001` object referencing `request-normal-001`
- [x] M1-I4: add missing/unavailable/loading states, unknown-ID fail-closed behavior, LP excerpts, and comparison navigation
- [x] M1-I4: validate sample/Web character counts, typecheck, lint, build, HTTP routes, content boundaries, and prohibited scope
- [ ] Human Visual QA and acceptance of M1-I4
- [ ] M1-I5: add legal-information navigation and Terms, Privacy, Tokushoho, Refund, AI disclosure, unsupported-cases, and contact pages
- [ ] M1-I6: complete responsive, accessibility, and visual QA hardening
- [ ] Validation: verify fixture/mock-only behavior and no real payment/OpenAI/email/public DB writes
- [ ] Validation: verify no fake reviews, fake purchase counts, or fictional operator facts
- [ ] Validation: verify offer, JPY 980 price, flow, safety, output, and legal/support clarity
- [ ] Human acceptance of Milestone 1

## Milestone 2: Operator Information and Publication Readiness

Dependency: Milestone 1 Human acceptance.

- [ ] Planning/spec: enumerate operator, contact, disclosure, delivery, URL-lifetime, refund/reissue, privacy, retention, and deletion decisions
- [ ] Human acceptance of Milestone 2 planning/specification
- [ ] Operator decisions: resolve individual/sole-proprietor status and name/business-name treatment
- [ ] Operator decisions: resolve contact email/method, address, phone, response time, and privacy contact
- [ ] Operator decisions: resolve delivery timing, result URL lifetime, refund/reissue, retention, and deletion
- [ ] Implementation/content: remove or withhold public-facing TBD and fictional placeholders
- [ ] Validation: verify public review content contains no invented or falsely completed operator facts
- [ ] Human acceptance of Milestone 2

## Milestone 3: Review Site Deployment

Dependency: Milestone 2 Human acceptance.

- [ ] Planning/spec: define hosting, stable review URL, indexing/privacy posture, device review, contact test, and rollback/removal
- [ ] Human acceptance of Milestone 3 planning/specification
- [ ] Implementation: deploy payment-free review site
- [ ] Implementation: show clear payment-unavailable status
- [ ] Validation: stable external URL
- [ ] Validation: mobile and desktop review
- [ ] Validation: navigation and broken links
- [ ] Validation: contact receipt and indexing/privacy decision
- [ ] Human acceptance of Milestone 3

## Milestone 4: Payment Provider Inquiry and Selection

Dependency: Milestone 3 Human acceptance.

- [ ] Planning/spec: freeze truthful inquiry content, verified channel, evidence format, fallback order, comparison criteria, and Human gates
- [ ] Human acceptance of Milestone 4 planning/specification and final PAY.JP inquiry
- [ ] External inquiry: send PAY.JP inquiry through verified official channel
- [ ] Evidence: record PAY.JP response verbatim
- [ ] External inquiry: if required and authorized, send KOMOJU inquiry and record response verbatim
- [ ] External inquiry: consider STORES/other provider only when authorized
- [ ] Validation: distinguish written acceptance/conditions from generic support, invitation, silence, or SDK availability
- [ ] Validation: compare written conditions and required application/site changes
- [ ] Human provider selection
- [ ] Human acceptance of Milestone 4

## Milestone 5: Core Backend, Safety, AI and Email

Dependency: Milestone 4 Human acceptance. Production server age validation remains incomplete until this milestone.

- [ ] Planning/spec: request endpoint, persistence, state machine, access, recovery, and evidence boundaries
- [ ] Planning/spec: allowed age values and production server safety enforcement
- [ ] Planning/spec: AI payload minimization, judgment/report schemas, validation, retries, and failure handling
- [ ] Planning/spec: result token, email test/log mode, feedback persistence, and operations
- [ ] Human acceptance of Milestone 5 planning/specification
- [ ] Implementation: request submission endpoint and Supabase request persistence
- [ ] Implementation: production server validation of allowed age-group values
- [ ] Implementation: production enforcement of `normal_allowed`, `needs_review`, and `rejected`
- [ ] Implementation: prohibit payment path for `needs_review` and `rejected`
- [ ] Implementation: minimized structured AI judgment and full report generation
- [ ] Implementation: output validation, retries, and failure handling
- [ ] Implementation: result token generation, persistence, protected result page, and feedback persistence
- [ ] Implementation: email delivery or approved test/log mode
- [ ] Validation: controlled request reaches stored result and delivery with mock-paid/test-paid state
- [ ] Validation: no real card payment integration
- [ ] Human acceptance of Milestone 5

## Milestone 6: Approved Provider Sandbox Payment

Dependency: Milestone 5 Human acceptance and Human-selected provider from Milestone 4.

- [ ] Planning/spec: approved-provider checkout, events, webhook signature, idempotency, purchase states, failure/cancellation, refund, and evidence
- [ ] Human acceptance of Milestone 6 planning/specification
- [ ] Implementation: approved-provider sandbox/test checkout
- [ ] Implementation: event and webhook-signature verification
- [ ] Implementation: idempotency and duplicate-payment prevention
- [ ] Implementation: payment-success gate before generation
- [ ] Implementation: failure, cancellation, refund foundation, and evidence retention
- [ ] Validation: one sandbox payment triggers exactly one fulfillment and one result
- [ ] Human acceptance of Milestone 6

## Milestone 7: E2E, Safety and Failure Operations

Dependency: Milestone 6 Human acceptance.

- [ ] Planning/spec: normal, safety, abuse, duplicate, failure, recovery, refund, deletion, device, legal, and stop evidence matrix
- [ ] Human acceptance of Milestone 7 planning/specification
- [ ] Implementation: accepted rate limiting, abuse/spam controls, recovery, and production-stop controls
- [ ] Validation: normal E2E and invalid age
- [ ] Validation: `rejected` and `needs_review`
- [ ] Validation: duplicate webhook
- [ ] Validation: payment success plus AI failure and email failure
- [ ] Validation: token access protection, rate limiting, and abuse/spam controls
- [ ] Validation: retry/manual recovery and refund/reissue
- [ ] Validation: retention/deletion and mobile/desktop UI
- [ ] Validation: legal/publication final review and production-stop procedure
- [ ] Human acceptance of Milestone 7

## Milestone 8: Production Application and Soft Launch

Dependency: Milestone 7 Human acceptance.

- [ ] Planning/spec: production application, secrets/domain, monitoring/logging, limited traffic, observation, and emergency stop
- [ ] Human acceptance of Milestone 8 planning/specification
- [ ] External/application: obtain provider production authorization
- [ ] Implementation/configuration: production keys, secrets, domain, monitoring, and logging
- [ ] Implementation/operation: limited traffic and manual observation of initial orders
- [ ] Validation: emergency purchase stop works
- [ ] Validation: production authorization and intentional limited opening are evidenced
- [ ] Human acceptance of Milestone 8

## Milestone 9: First Real Purchase Verification

Dependency: Milestone 8 Human acceptance.

- [ ] Planning/spec: define privacy-safe first-order observation and evidence checklist
- [ ] Human acceptance of Milestone 9 verification plan
- [ ] Validation: real payment evidence and internal purchase record
- [ ] Validation: exactly one generation and one result token
- [ ] Validation: successful result access and email delivery
- [ ] Validation: feedback or support follow-up and support traceability
- [ ] Validation: no exposed personal information and no unhandled failure
- [ ] Human acceptance of Milestone 9 and initial paid Web MVP completion
