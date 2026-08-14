# IMPLEMENTATION_WBS.md

> **CURRENT Stripe Lane B B4a accepted overlay:** `stripe_lane_b_b4a_netlify_primary_hosting_direction_human_chatgpt_accepted_complete` on `2026-08-14`; ChatGPT review `PASS / complete`; Human acceptance / B4a acceptance `complete / complete`. B4a means only Netlify Primary Hosting Direction + Deployment Readiness planning/authority accepted. Accepted B3 authority remains unchanged.
>
> First B4b review-deployment attempt: Netlify; initial review plan: Netlify Free; static compatibility: A; actual Netlify build/deployment has not occurred; Netlify Hard Gate: `not_proven`; B4b evidence: `not_acquired`; paid Production direction / plan: `provisional / unresolved`. Detailed authority and proof gates: docs/payment/STRIPE_LANE_B_B4A_DEPLOYMENT_READINESS.md. Current exact work: **Stripe Lane B stable review URL deployment (B4b)**. Current work authority: `separately_authorized_external_work`; `b4b_external_work_authorized = false`. No Netlify account/site/Provider URL/deploy/domain/DNS/legal-publication/Stripe/Payment/Production-runtime authority is created.

## Status and Dependency Rule

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

This WBS implements the sequence controlled by `docs/ROADMAP.md`.

Milestones are ordered dependencies. No implementation task starts until its planning/specification task is accepted, and no milestone starts until Human accepts the previous milestone. Unchecked items are not authorized merely because they are listed.

Current state: M1-P2 Experience & Visual Direction Revision planning is complete and Human-accepted. M1-P3 is complete and Human and ChatGPT accepted, with B — `Lunar Contrast Edition` selected. M1-I8-R1 and M1-I9-R1 are complete, Human-accepted, and merged to `main`. M1-I12 automated final QA and Human final QA are complete; M1-I12 is Human-accepted and complete. Milestone 1 is Human-accepted, complete, and closed. The accepted deliverable is a fixed-fixture Reviewable Web MVP, not a production-ready or payment-ready product. M2-P1 AI Quality Specification & Evaluation Foundation and M2-P1-R1 integrity hardening are implemented, automatically validated, Human / ChatGPT accepted, and complete at accepted foundation implementation commit `c56f597d0491482995c4afa6fb64cf148dd66345`. M2-P1-R2 manifest-boundary correction is implemented and validated at `e859b4cdfc0efa03d3372784ea34f4abb61bee9d` without changing the accepted foundation. M2-P2 planning has not started; Milestone 2 runtime and all implementation work beyond M2-P1 remain unauthorized. Browser use and screenshot acquisition by CodeX/agents remain prohibited; the completed visual and interaction QA is Human observational evidence.

Current Payment strategy state: Stripe-first Product/strategy, Customer-facing / Public-copy Alignment, Stripe Feasibility Evidence Preparation, Lane B Human Decision Package, B2 authority, and B3 review-ready Website/Public Surface implementation remain accepted complete at their separate levels. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. Stripe Sales is `not_used_by_human_direction`, not a Provider outcome. Stripe Lane B deployment readiness (B4a) is the exact current next work and remains planning/readiness only. Lane B/C remain blocked pending downstream requirements. Stripe feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete; and credit/debit-card/Apple Pay/Google Pay/PayPay eligibility remains unverified. PAY.JP is paused fallback. No item below authorizes Provider operation, contact/submission, evidence acquisition, Payment implementation, publication, domain purchase, DNS mutation, or deployment.

## Milestone 0: Completed Foundations

- [x] Next.js project foundation
- [x] TypeScript configuration
- [x] Tailwind configuration
- [x] Static responsive LP at `/`
- [x] Request-form UI at `/request`
- [x] Client-side required-field validation
- [x] Required boolean self-attestation `私は18歳以上です` and notice
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

## Milestone 2: Internal Automated AI / DB Vertical Slice

Dependency: Milestone 1 Human acceptance.

Current authority: M2-P1 and M2-P1-R1 are Human / ChatGPT accepted and complete; M2-P1-R2 historical-manifest boundary correction is implemented and validated. Milestone 1 acceptance and M2-P1 foundation acceptance do not authorize M2-P2 planning, AI, DB, UI, API, authentication, payment, email, deployment, or any runtime implementation.

- [x] M2-P1 Human authorization limited to documentation and evaluation foundation
- [x] M2-P1: accepted specifications, exact 70-case development dataset, external-only holdout contract, schemas, foundation prompt assets, policies, manifests, and permanent verifier
- [x] M2-P1: automated foundation, M1 regression, typecheck, lint, build, diff, and prohibited-scope gates
- [x] Human / ChatGPT final review and acceptance of M2-P1 and M2-P1-R1 at accepted foundation implementation commit `c56f597d0491482995c4afa6fb64cf148dd66345`
- [x] M2-P1-R2: preserve the 42-file R1 historical snapshot and anchor verification to `432dbc76b79483616ee5fa4364e7bbc4d5d1dee7..c56f597d0491482995c4afa6fb64cf148dd66345`
- [ ] Separate M2-P2 planning and Human authorization for a bounded internal AI / DB runtime slice
- [ ] Internal-only automatic input-to-display flow with no production payment, production email, authentication, or public release
- [ ] Fail-closed delivery for Safety, insufficient information, invalid output, exhausted retries, and terminal failure
- [ ] Human acceptance of Milestone 2

Actual operator/entity labels, contact values/SLA, publication wording, delivery measurements, URL lifetime, refund execution, privacy, retention, and deletion details remain deferred prerequisites for any later public review or sale. The seven Lane B policy directions are accepted but do not complete these downstream facts.

The accepted foundation contains exactly 70 development cases, 42 contrast sets, 130 memberships, 7 connected components, an exact frozen 20-case Human-review sample, 9 JSON Schemas, PB-01 through PB-07, and 16 prompt assets. The largest development component contains 51 cases. The future 15-case holdout must be independently authored, not randomly split from development, and must share no counterfactual or contrast-set relationship with the development dataset.

## Milestone 3: Review Site Deployment

Dependency: Milestone 2 Human acceptance plus the ordered Stripe Lane B predecessor gates below.

- [x] B0 Stripe Lane B Human Decision Package Candidate — historical formulation commit `223a2746f72ae8faa90b4df198f998a8132f2f3a`
- [x] B1 Human + ChatGPT decision review and acceptance sync — `stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete` on `2026-08-13`; seven decisions accepted; no external action
- [x] B2 Stripe Lane B Legal Draft Finalization Candidate — implementation complete for review; `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`; internal/draft only; publication unauthorized
- [x] B2 Human + ChatGPT review and acceptance — complete on `2026-08-13`; docs/spec/legal authority only
- [x] B3 Review-ready Website/Public Surface implementation — `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA / ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance complete
- [ ] B4a deployment-readiness implementation/configuration — define hosting, stable review URL, indexing/privacy posture, device review, contact test, and rollback/removal
- [ ] Human acceptance of B4a / Milestone 3 planning and readiness
- [ ] B4b separate Human external-action authorization for stable-URL deployment
- [ ] B4b implementation: deploy payment-free review site
- [ ] Implementation: show clear payment-unavailable status
- [ ] Validation: stable external URL
- [ ] Validation: mobile and desktop review
- [ ] Validation: navigation and broken links
- [ ] Validation: contact receipt and indexing/privacy decision
- [ ] Human acceptance of Milestone 3

## Milestone 4: Payment Provider Review Evidence and Selection

Dependency: B4b / Milestone 3 Human acceptance. B5–B7 remain ordered and separately gated.

- [x] Human + ChatGPT Stripe-first strategy Acceptance Sync complete on `2026-08-12`; Product/strategy authority only
- [x] Truthful Customer-facing/public-copy alignment — `stripe_first_customer_public_copy_alignment_human_chatgpt_accepted_complete` on `2026-08-12`; Product/UI/content authority only; Human Visual QA / Automated QA `PASS / PASS`
- [x] Stripe feasibility evidence preparation — `stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete` on `2026-08-12`; Lane A preparation Human-approved; no external action/submission/outcome
- [ ] B5 private KYC readiness — field/status planning only; actual Human values remain outside Git
- [ ] B6 Stripe Account/Activation Authorization Package — no account creation or submission
- [ ] B7 further explicit Human external-action authorization before account creation/KYC/activation submission
- [ ] Actual Stripe account/business/site/category/Live Payment outcome preserved
- [ ] Cards eligibility evidenced
- [ ] Apple Pay eligibility evidenced
- [ ] Google Pay eligibility evidenced
- [ ] PayPay eligibility evidenced
- [ ] If any desired method is unavailable, explicit Human launch review completed
- [ ] Checkout/product/price, test/live, webhook, refund/dispute, descriptor, linkage, fee/settlement, and future RevenueCat evidence preserved
- [ ] Validation: distinguish authoritative Provider evidence from generic marketing, optional clarification, invitation, silence, or SDK availability
- [ ] PAY.JP fallback reactivated only if Human explicitly authorizes it; current-source re-review then required
- [ ] Human formal Provider selection
- [ ] Human acceptance of Milestone 4

Production QA does not authorize Production Payment. Soft Launch requires separate Production Payment authorization after all applicable evidence and Human gates pass.

## Milestone 5: Core Backend, Safety, AI and Email

Dependency: Milestone 4 Human acceptance. Production server age validation remains incomplete until this milestone.

- [ ] Planning/spec: request endpoint, persistence, state machine, access, recovery, and evidence boundaries
- [ ] Planning/spec: required adult-confirmation boolean and production server Purchase-authority enforcement
- [ ] Planning/spec: current server-owned eligibility, `purchaseGateSatisfied=true`, semantic fail-closed conditions, input-bound authority evidence, and browser/client/localStorage non-authority
- [ ] Planning/spec: AI payload minimization, judgment/report schemas, validation, retries, and failure handling
- [ ] Planning/spec: result token, email test/log mode, feedback persistence, and operations
- [ ] Human acceptance of Milestone 5 planning/specification
- [ ] Implementation: request submission endpoint and Supabase request persistence
- [ ] Implementation: production server enforcement of accepted adult-confirmation boolean
- [ ] Implementation: production enforcement of current server-owned eligibility and `purchaseGateSatisfied=true`
- [ ] Implementation: prohibit payment for clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error conditions; do not automatically disqualify waiting, not-sending-now, temporary pause, or boundary-respecting support when separate assistance eligibility remains valid
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
- [ ] Validation: normal E2E and missing/invalid adult-confirmation boolean
- [ ] Validation: every semantic fail-closed condition, `purchaseGateSatisfied=false`, stale/input-mutated authority, and browser/client/localStorage non-authority
- [ ] Validation: waiting, not-sending-now, temporary pause, and boundary-respecting support do not become automatic Payment blocks when separate assistance eligibility remains valid
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
