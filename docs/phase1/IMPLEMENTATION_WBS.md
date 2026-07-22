# IMPLEMENTATION_WBS.md

## Status and Dependency Rule

This WBS implements the sequence controlled by `docs/ROADMAP.md`.

Milestones are ordered dependencies. No implementation task starts until its planning/specification task is accepted, and no milestone starts until Human accepts the previous milestone. Unchecked items are not authorized merely because they are listed.

Current state: M1-P2 Experience & Visual Direction Revision planning is complete and Human-accepted. M1-P3 is complete and Human and ChatGPT accepted, with B — `Lunar Contrast Edition` selected. M1-I8-R1 and M1-I9-R1 are complete, Human-accepted, and merged to `main`. M1-I12 automated final QA and Human final QA are complete; M1-I12 is Human-accepted and complete. Milestone 1 is Human-accepted, complete, and closed. The accepted deliverable is a fixed-fixture Reviewable Web MVP, not a production-ready or payment-ready product. Milestone 2 remains unauthorized and not started. Browser use and screenshot acquisition by CodeX/agents remain prohibited; the completed visual and interaction QA is Human observational evidence.

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

## Milestone 1: Reviewable Web MVP — Human Accepted, Complete, Closed

Accepted boundary: fixed-fixture review experience only; no real AI, runtime DB, payment, email delivery, deployment, production analytics, account system, or PDF/download/share implementation.

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
- [x] M1-I4: add fictional sample, production-shaped Web鑑定ノート fixture, and separate short-presentation fixture preview, now formally named 保存用判断カード
- [x] M1-I4: derive Web/save from one shared `result-normal-001` object referencing `request-normal-001`
- [x] M1-I4: add missing/unavailable/loading states, unknown-ID fail-closed behavior, LP excerpts, and comparison navigation
- [x] M1-I4: validate sample/Web character counts, typecheck, lint, build, HTTP routes, content boundaries, and prohibited scope
- [x] Human Visual QA and acceptance of M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b`
- [x] Human authorization of M1-I5 and approval of the incomplete-field presentation rule
- [x] M1-I5: add legal-information navigation and Terms, Privacy, Tokushoho, Refund, AI disclosure, unsupported-cases, and inactive contact pages
- [x] M1-I5: add shared review boundary, noindex/nofollow, fixed facts, unresolved Decision status, and responsive disclosure rows
- [x] M1-I5: integrate footer, purchase confirmation, blocked Safety views, report/footer access, and `/review` without runtime behavior
- [x] M1-I5: validate typecheck, lint, build, HTTP routes, labels, placeholders, active-runtime absence, and prohibited scope
- [x] Human accepted the overall M1-I5 page structure and direction and authorized only the M1-I5-R1 legal-navigation active-state correction
- [x] M1-I5-R1: replace the blacked-out current item with a warm pale-gold card, dark readable text, stronger gold boundary, and compact visible `現在` badge while preserving accessibility behavior
- [x] M1-I5-R1: validate typecheck, lint, build, all eight HTTP routes, one rendered `aria-current="page"` and visible `現在` per route, complete legal navigation, and prohibited scope
- [x] Human Visual QA and acceptance of M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`
- [x] Human authorization of M1-I6 and rejection of a fixed/sticky mobile CTA for Milestone 1
- [x] M1-I6: complete responsive, accessibility, terminology, icon, link, fail-closed, and indexing-boundary hardening
- [x] Validation: verify fixture/mock-only behavior and no real payment/OpenAI/email/public DB writes
- [x] Validation: verify no fake reviews, fake purchase counts, or fictional operator facts
- [x] Validation: verify offer, JPY 980 price, flow, safety, output, legal/support clarity, 30 documented routes, and 25 active link targets
- [x] Partial Human visual review in external Edge identified unresolved visual/accessibility defects and broader product-experience concerns; full cross-width and keyboard QA was not completed
- [x] Human decision: M1-I6 was not accepted and is formally closed as superseded by M1-P2; later Milestone 1 acceptance does not retroactively accept M1-I6
- [x] Preserve M1-I6 implementation/automated evidence as history and carry known M1-I6/M1-I6-R1 defects into M1-I7 through M1-I12 and final M1-I12 QA; no later M1-I6 gate
- [x] M1-P2 planning: confirm no M1-P2 or M1-I7 through M1-I12 ID conflict
- [x] M1-P2 planning: create `M1_P2_EXPERIENCE_REVISION_PLAN.md`
- [x] M1-P2 planning: define the approved 14-part Reading Note and distinct save-oriented note, ten-part LP sequence, free-text/chip Request Sheet, and three-layer Legal Review
- [x] M1-P2 planning: preserve product definition, JPY 980 price, 18+ policy, Safety/classification meaning, fixed judgment, core scenario facts, runtime boundary, and non-fixed mobile CTA decision
- [x] M1-P2 planning: keep Safety fixtures and fail-closed behavior fixed; permit presentation fixture/schema changes only inside the separately authorized relevant slice with Human review and no runtime activation
- [x] M1-P2 planning: define Human-only external-Edge Visual QA and prohibit CodeX/agent browser use and screenshots
- [x] Human acceptance of M1-P2 planning; documentation acceptance does not authorize implementation
- [x] Separate Human authorization of M1-I7 Brand Foundation
- [x] M1-I7: implement role-based tokens, typography and Japanese wrapping roles, shared surface vocabulary, restrained decoration primitives, and shared CTA/link/focus/status/motion foundations
- [x] M1-I7: add the review-only Brand Foundation preview inside existing `/review` and correct the stale review gate without adding a route or redesigning later product surfaces
- [x] M1-I7: validate typecheck, lint, build, raw HTTP/rendered text, review robots, one-`h1`, purchase/contact boundaries, prohibited scope, and diff hygiene without Browser use
- [x] One-time Human batch authorization of M1-I7 through M1-I11, replacing prior-slice Human pauses for implementation only
- [x] M1-I8 Reading Note Product Redesign implementation and automated validation
- [x] M1-I9 LP Redesign implementation and automated validation
- [x] M1-I10 Request Sheet Redesign implementation and automated validation
- [x] M1-I11 Legal Review Redesign implementation and automated validation
- [x] Integrated per-slice raw HTTP/rendered-text and prohibited-scope validation without Browser use
- [x] M1-P2-R1: add separate wait/send/stop-additional-contact public cases and expose their distinguishing facts on the LP
- [x] M1-P2-R1: change `/sample-report` to `sample-send-001` and align its conclusion, letter, message temperature, actions, three-day direction, review conditions, and limitations
- [x] M1-P2-R1: distinguish same-case three-format comparison from different-case three-conclusion comparison
- [x] M1-P2-R1: preserve `result-normal-001`, Safety fixtures, `lib/safety/**`, packages, and runtime boundaries
- [x] M1-P2-R1-R1: correct only the LP Night-background contrast defect and `/sample-report` separate-case comparison boundary
- [x] Human acceptance of M1-I7 through M1-I11 plus M1-P2-R1 and M1-P2-R1-R1 as one integrated next-stage baseline
- [x] Human authorization of M1-P3 Reading Note Visual Excellence Specification for documentation/design work only
- [x] M1-P3: prepare the content lock, information hierarchy, Figma/design handoff, typography, chapter archetypes, responsive specification, acceptance criteria, implementation plan, and review record
- [x] M1-P3: Human and ChatGPT review of the package
- [x] Human acceptance of the five M1-P3 documents as the authoritative Visual Excellence design specification
- [x] Historical M1-P3-R1 preflight: stopped before coded visual prototype implementation on `SEM-UNSUPPORTED-CASES`; prototype implementation was zero at that gate
- [x] Human authorization of M1-I2-R1 as a bounded Safety correction only
- [x] M1-I2-R1: align all 13 locked unsupported-case categories, add the two missing reason codes, preserve structured classification/severity, avoid named benign overmatching, and keep every non-normal state fail closed
- [x] M1-I2-R1: add and pass the permanent real-classifier verifier, exact unsupported-case lock, typecheck, lint, production build, `git diff --check`, and prohibited-scope audit
- [x] Human review and acceptance of M1-I2-R1 at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`; `SEM-UNSUPPORTED-CASES` PASS without waiver
- [x] Previous M1-P3-R1 hard stop resolved; release from implementation zero recorded before coded visual prototype work started
- [x] Replace the former required-Figma gate with a Human-approved coded visual prototype gate; Figma is optional and non-authoritative
- [x] M1-P3-R1: implement isolated A/B review routes from the same fixed `result-normal-001` source and semantic order
- [x] M1-P3-R1: pass exact locks, semantic assertions, Safety verifier, typecheck, lint, build, raw HTTP/rendered checks, prohibited-scope audit, and `git diff --check`
- [x] Human selection and acceptance of B — `Lunar Contrast Edition` as the canonical design direction; A — `Quiet Editorial Letter` rejected
- [x] Separate Human authorization of Checkpoint A / M1-I8-R1 Technical Preparation
- [x] Checkpoint A: deterministic content-lock verifier, approved token aliases, grain positioning, media ordering, proven-unused selector removal, artifact primitives, formal-name map, and swatch fallback
- [x] Checkpoint A: exact locks, semantic assertions, Safety, typecheck, lint, build, diff hygiene, exact manifest, and prohibited-scope audit
- [x] Human acceptance of Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B / M1-I8-R1 Visual Excellence; B — `Lunar Contrast Edition` controlling
- [x] Checkpoint B implementation and automated validation within its exact mutation manifest on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`
- [x] Checkpoint B content locks, Safety, typecheck, lint, build, raw HTTP, semantic structure, manifest, protected-scope, and diff-hygiene checks without Browser or screenshots
- [x] Checkpoint B primary desktop/390px Human Visual QA and acceptance at implementation-and-polish commit `bb2079aafb3666562e2876ead4c24a5c933bea8a`; fast-forward to `main` authorized
- [x] Separate Human authorization of M1-I9-R1 Reading Note Preview Alignment
- [x] M1-I9-R1 implementation and automated validation within the exact manifest on `feat/m1-i9-r1-reading-note-preview-alignment`
- [x] M1-I9-R1 content locks, Safety, typecheck, lint, build, HTTP, CSS asset, source structure, manifest, prohibited-scope, and diff-hygiene checks without Browser or screenshots
- [x] M1-I9-R1 primary desktop/390px Human Visual QA and acceptance at final implementation commit `82600df57481cae2c61d370288083a61f0c719c3`; fast-forward to `main` authorized
- [x] Separate Human authorization of M1-I12 Final QA & Milestone 1 Acceptance Package
- [x] M1-I12-R3 automated final QA against corrected main
- [x] Human 320px responsive QA
- [x] Human keyboard/focus QA
- [x] Human 200% zoom QA
- [x] Human reduced-motion QA
- [x] Human reading-quality/contrast QA; no release-blocking visual defect reported
- [x] M1-I12 Human final QA and acceptance
- [x] Human acceptance and closure of Milestone 1

## Milestone 2: Operator Information and Publication Readiness

Dependency: Milestone 1 Human acceptance.

Current authority: unauthorized; not started. Milestone 1 acceptance satisfies the predecessor dependency but does not authorize Milestone 2 planning or implementation. Next work requires a separate Milestone 2 planning and Human authorization gate.

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
