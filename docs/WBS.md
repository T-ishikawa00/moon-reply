# WBS.md

## Status Rule

Historical completed work is preserved below. Current delivery sequencing is controlled by `docs/ROADMAP.md`. A checked historical planning item does not authorize a later implementation. Milestones 1–9 remain incomplete until their stated validation and Human acceptance gates are satisfied.

Current state: M1-P2 Experience & Visual Direction Revision planning is Human-accepted inside Milestone 1. M1-I6 was not accepted and is formally closed as superseded by M1-P2. Human accepted the current M1-I7 through M1-I11 integrated redesign plus M1-P2-R1 and bounded M1-P2-R1-R1 corrections as the next-stage baseline. This is not final Milestone 1 acceptance. M1-P3 is Human and ChatGPT accepted as the authoritative, complete documentation/design specification. The bounded M1-I2-R1 Safety correction is Human-accepted at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`, synchronized to `main`, and passes `SEM-UNSUPPORTED-CASES` without waiver. M1-P3-R1 review-only A/B coded visual prototypes are implemented and automatically validated. Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`. Figma is optional and non-authoritative. Checkpoint A is Human-accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and synchronized to `main` at `79011f274c35a0cf80f68af845ffaca95e8884c9`. Checkpoint B is implemented and automatically validated on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`; Human Visual QA is pending and merge to `main` is prohibited. M1-I9-R1 and M1-I12 remain unauthorized and unimplemented. Milestone 1 remains incomplete and Milestone 2 remains unauthorized.

## P0: Repository Setup

- [x] Git repository initialized
- [x] GitHub private repository created
- [x] Initial docs created
- [x] First commit pushed

## P1: Product Spec

- [x] PRODUCT_SPEC.md finalized for its historical phase
- [x] DEVELOPMENT_FLOW.md created as historical planning context
- [x] ROADMAP.md created
- [ ] GO_NO_GO.md finalized
- [ ] VALIDATION_PLAN.md finalized

## P2: Phase 0 Assets

- [x] Initial consultation dataset template created
- [x] Judgment criteria table created
- [x] Golden sample format created
- [x] External evaluation sheet created
- [x] Forbidden copy checklist finalized
- [x] Safety branching checklist finalized
- [x] Phase 0 runbook created

## P2.5: Phase 0 Working Files

- [x] Consultation cases working file created
- [x] Judgment work table created
- [x] Golden sample drafts file created
- [x] External evaluator recruitment copy created
- [x] Payment provider inquiry copy created
- [x] Phase 0 decision log created

## P2.6: Human-approved Phase 0 Case Design

- [x] Initial 10 consultation case outlines approved
- [x] Initial 5 safety case outlines approved
- [x] Initial judgment boundaries approved
- [x] Consultation cases working file updated
- [x] Judgment work table updated
- [x] Phase 0 decision log updated

## P2.7: Result Presentation Spec

- [x] Result presentation spec created
- [x] Diagnosis page structure defined
- [x] Saveable image card structure defined
- [x] LP/X sample image direction defined
- [x] G001 presentation notes added

## P2.8: Approved Golden Samples

- [x] G001 full diagnosis approved and documented
- [x] G001 saveable image card copy approved and documented
- [x] G001 LP/X sample copy approved and documented
- [x] G002 full diagnosis approved and documented
- [x] G002 saveable image card copy approved and documented
- [x] G002 LP/X sample copy approved and documented
- [x] G003 full diagnosis approved and documented
- [x] G003 saveable image card copy approved and documented
- [x] G003 LP/X sample copy approved and documented

## P2.9: External Evaluation Package

- [x] Evaluator package created
- [x] Evaluation form questions created
- [x] Evaluation results template created
- [x] Recruitment message created
- [x] Phase 0 external decision rule created

## P3: Historical Phase 1 Validation Setup — Superseded as Current Sequence

These items record early setup ideas. They do not control the Milestone 1–9 sequence.

- [x] Payment provider inquiry templates created later under P4.8
- [x] LP copy/static LP completed later under P4.1
- [x] Request-form draft/UI completed later under P4.2
- [ ] Feedback form draft; remapped to Milestone 1 review planning and Milestone 5 persistence
- [ ] Delivery template draft; remapped to Milestone 1 sample output and Milestone 5 delivery

## P3.1: Historical Phase 1 Sales MVP Specs

- [x] Phase 0 Founder Override decision recorded
- [x] MVP scope defined for the historical plan
- [x] LP structure defined
- [x] Order form spec defined
- [x] Payment flow defined
- [x] Delivery workflow defined
- [x] Quality checklist defined
- [x] Metrics template defined
- [x] Phase 1 runbook defined

## P3.2: Historical Automated Public MVP Revision

Completed planning record; current sequencing is superseded by `docs/ROADMAP.md`.

- [x] Phase 1 MVP corrected from semi-manual to automated public MVP at that time
- [x] Automated public MVP spec created
- [x] Automation architecture created
- [x] Draft data model created
- [x] Development QA mode defined
- [x] Historical MVP scope updated
- [x] Form/payment/delivery docs updated for automation
- [x] Quality checklist updated for automation readiness
- [x] Metrics updated for automation

## P3.3: Historical Automated MVP Implementation Plan

Completed planning record; it does not authorize implementation outside Milestones 1–9.

- [x] README updated for automated public MVP direction at that time
- [x] Implementation plan created
- [x] Route structure created
- [x] Environment variable plan created
- [x] Integration staging plan created
- [x] Implementation WBS created
- [x] Acceptance criteria created

## P4: Completed Foundations

### P4.1: Stage 1 Project Bootstrap + Static LP

- [x] Next.js project foundation created
- [x] TypeScript configured
- [x] Tailwind CSS configured
- [x] Static LP implemented at `/`
- [x] Responsive layout added
- [x] CTA placeholder added
- [x] Safety/AI/refund notes displayed
- [x] No backend/API integrations added
- [x] Build passed at Stage 1 acceptance

### P4.2: Stage 2 Request Form UI

- [x] Stage 1 acceptance recorded
- [x] `/request` page created
- [x] Basic information fields added
- [x] Relationship and message-context fields added
- [x] Emotion/outcome fields added
- [x] Safety-screening UI added
- [x] Consent checkboxes added
- [x] Client-side validation added
- [x] Local-only confirmation state added
- [x] LP CTA updated to `/request`
- [x] No backend/API integrations added

### P4.3: Stage 3 Data Foundation Revision

- [x] Stage 2 acceptance recorded
- [x] Payment-provider risk note created
- [x] Provider sync/source-of-truth policy created
- [x] Stage 3 data-foundation scope created
- [x] Data model strengthened for purchases, credits, entitlements, provider events, and AI logs
- [x] Stage 3 plan, WBS, and acceptance criteria updated

### P4.4: Stage 3 Supabase Data Foundation

- [x] Supabase package added
- [x] `.env.example` created
- [x] Supabase helper files created
- [x] Stage 3 migration created
- [x] `reading_requests`, `safety_checks`, `readings`, `purchases`, `credit_ledger`, `entitlements`, `provider_events`, `ai_generation_logs`, `email_deliveries`, and `feedback` tables defined
- [x] RLS enabled without public policies
- [x] No OpenAI/payment/email/API integration added
- [ ] Production request persistence/public database-write connection; deferred to Milestone 5

### P4.5: Stage 4 Deterministic Safety Foundation

- [x] Stage 3 acceptance recorded
- [x] Safety types, reason codes, and deterministic rules created
- [x] Request form uses local safety classification
- [x] Rejected-level issues block local confirmation
- [x] Needs-review issues show warning
- [x] No DB persistence, API route, OpenAI, payment, or email added
- [ ] Production server safety enforcement; deferred to Milestone 5

### P4.6: Legal / Compliance Foundation

- [x] Stage 4 acceptance recorded
- [x] Compliance, prohibited-copy, safety, input, AI-minimization, provider-inquiry, payment-confirmation, and legal-page requirements documented
- [x] No payment implementation started

### P4.7: Legal Page Drafts and Operator Decisions

- [x] Japanese legal-page drafts created
- [x] Operator placeholders and decision register created
- [x] Unknown provider facts remain explicit
- [x] Publication gate created
- [x] No legal draft published

### P4.8: Provider Inquiry Preparation

- [x] Operator decisions explained
- [x] Provider inquiry drafts prepared
- [x] Evidence log, scorecard, and provider-selection gate prepared
- [x] No inquiry sent
- [x] No provider selected
- [x] No payment implementation started

### P4.9: Task 18C-R1 Age Eligibility Policy Alignment

- [x] `回答しない` removed from request-form age choices
- [x] Required 18-or-older age-group gate aligned across current specifications
- [x] 18-or-older notice added near the age field
- [x] Separate age checkbox rejected by policy
- [x] Date-of-birth and identity-document collection excluded
- [x] Future production server validation requirement recorded
- [x] No provider inquiry or payment/API/OpenAI/email implementation added
- [x] Human acceptance of Task 18C-R1

### P4.10: Task 18C-R2 Service Positioning and Classification Alignment

- [x] Canonical service-positioning document created
- [x] Product, public copy, result, AI, legal/compliance, and provider-inquiry language aligned
- [x] Historical Phase 0 evidence preserved and classified
- [x] No provider inquiry sent
- [x] No provider approved or selected
- [x] No payment/OpenAI/email/API/server-action implementation added
- [x] Human acceptance of Task 18C-R2

## P4.11: Human Accepted — Task 18C-R3 Roadmap Reset and Delivery Lane Alignment

- [x] `docs/ROADMAP.md` reset as authoritative Milestone 1–9 roadmap
- [x] Initial MVP completion fixed at first verified real purchase
- [x] Completed foundations separated from runtime integrations
- [x] Implementation plan and implementation WBS aligned
- [x] Parent WBS and acceptance criteria aligned
- [x] Current focus, handoff, and review record aligned
- [x] Stale controlling statements classified and corrected
- [x] Documentation-only boundary preserved
- [x] Human acceptance of Task 18C-R3

## P4.12: Human Accepted — Task M1-P1 Reviewable Web MVP Planning and Specification

- [x] Exact route inventory and review journey specified
- [x] Route, inline-state, fixture-route, and review-preview ownership specified
- [x] Safety, invalid-age, missing-consent, and error states specified
- [x] Payment-free final confirmation specified
- [x] Sample report and production-shaped fixture result separated
- [x] Fixture/mock data boundary specified
- [x] Legal/contact review presentation specified without fictional operator facts
- [x] 月の返事-specific design brief specified
- [x] Accessibility, responsive, navigation, analytics, and error requirements specified
- [x] Milestone 1 implementation divided into M1-I1 through M1-I6 one-commit slices
- [x] Material Human decisions and slice blockers recorded
- [x] Documentation-only boundary preserved
- [x] Milestone 1 implementation remained unstarted during planning
- [x] Human acceptance of Task M1-P1 at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`

## P4.13: Human Accepted — Task M1-P1-R1 UI/UX Decision Alignment

- [x] Human-approved emotional objective documented
- [x] Vertical LP order, LP/`/request` separation, CTA and price clarity aligned
- [x] Text-only input, conversation paste/anonymization, and image-upload deferral aligned
- [x] Initial free/ad exclusions and `/sample-report` free-experience role aligned
- [x] Complete recommendation requirements aligned for all approved send/light-send/wait/do-not-send labels
- [x] Web鑑定ノート and the then-named 保存用鑑定書 separated; the current formal short-presentation name is 保存用判断カード
- [x] `/review/save-report/result-normal-001` added to planning only
- [x] Safety-before-payment and future post-payment refund/operator state requirement aligned
- [x] Two-level review banner aligned
- [x] The Pattern adopt/transform/reject boundary recorded without adding reference assets
- [x] M1-I1 through M1-I6 planning aligned without authorization
- [x] Documentation-only boundary preserved
- [x] Milestone 1 implementation remained unstarted during planning
- [x] Human acceptance of Task M1-P1-R1 at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`

## P4.14: Human Review In Progress — M1-I1 Route Shell and Review Navigation

- [x] Human explicitly authorized M1-I1
- [x] Refreshed vertical LP implemented at `/`
- [x] Shared responsive header and footer implemented
- [x] Shared two-level `/review/**` banner implemented
- [x] Static `/review` route/status inventory implemented
- [x] Unimplemented routes shown only as non-clickable preparation items
- [x] Existing `/request` behavior, age choices, and Safety implementation preserved
- [x] No fixture or runtime integration added
- [x] Desktop visual direction approved by Human
- [x] M1-I1-R1 internal terminology removed from the ordinary LP
- [x] M1-I1-R1 completed and awaiting Human review
- [ ] Human review of mobile LP, `/request`, and `/review`
- [x] Human acceptance of Task M1-I1 at commit `dd031183dd347493fd5619f1b0d8bb355fc93560`

## P4.15: Human Accepted — M1-I2 Request Confirmation and Safety Review States

- [x] Human explicitly authorized M1-I2
- [x] Human selected a three-step request flow
- [x] Human selected one unified required acknowledgement after a visible five-item list
- [x] Three-step `/request` flow and in-memory navigation implemented
- [x] `normal_allowed`-only local request confirmation implemented
- [x] Deterministic typed fixtures and all required request review routes implemented
- [x] `needs_review`, `rejected`, contradictory selection, invalid age, missing consent, and unknown/error fail closed
- [x] Refund and transaction-specific acceptance kept outside M1-I2
- [x] Marketing/newsletter consent not added
- [x] Typecheck, lint, build, static scope audit, required-route HTTP checks, and unknown-ID fail-closed checks
- [x] Human visual review and acceptance of M1-I2 at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`

## P4.16: Human Accepted — M1-I3 Final Purchase Confirmation Without Payment

- [x] Human explicitly authorized M1-I3
- [x] Typed `normal-001` purchase fixture references accepted `request-normal-001`
- [x] `normal_allowed`-only purchase confirmation route implemented
- [x] Product, 税込980円, quantity, request summary, delivery plan, AI/non-guarantee, and draft transaction boundaries displayed
- [x] Native disabled purchase control implemented with no transaction handler
- [x] Unknown and non-normal purchase IDs fail closed without fallback
- [x] Legal/contact destinations remain truthful non-clickable preparation items
- [x] Payment provider remains unselected; no payment, persistence, network, AI, or email behavior implemented
- [x] Typecheck, lint, build, required-route HTTP, content, fail-closed, and prohibited-scope checks completed
- [x] Human visual review and acceptance of M1-I3 at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25`

## P4.17: Human Accepted — M1-I4 Sample Report and Fixture Result Experience

- [x] Human explicitly authorized M1-I4
- [x] Public `/sample-report` implemented with `sample-report-g001` and explicit fictional/non-purchase/non-review/non-AI-generation labels
- [x] Shared typed `result-normal-001` references `request-normal-001`
- [x] Nine-section Web鑑定ノート implemented with fixed `今日は送らない方がいい` judgment and complete recommendation coverage
- [x] A4-oriented short presentation implemented by selecting and recomposing the same structured result; its current formal name is 保存用判断カード
- [x] Missing-fixture, unavailable-report, static loading, and unknown-ID fail-closed states implemented
- [x] LP output previews and sample/Web/save comparison navigation updated without redesigning unrelated sections
- [x] Sample 840-character and Web 1,973-character counts verified
- [x] Typecheck, lint, build, required-route HTTP, content, fail-closed, and prohibited-scope checks completed
- [x] No AI, payment, email, DB, API, file generation, download/copy/share, package, Safety, age, or legal-publication work added
- [x] Human Visual QA and acceptance of M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b`

## P4.18: Human Accepted — M1-I5 Legal, Disclosure and Contact Review Pages

- [x] Human explicitly authorized M1-I5 and approved the incomplete-field presentation rule
- [x] `/legal`, Terms, Privacy, Tokushoho, Refund, AI disclosure, Unsupported Cases, and inactive Contact routes implemented
- [x] Shared draft/publication/legal-advice boundary, legal navigation, fixed-fact rows, and unresolved Decision status cards implemented
- [x] Every legal/contact route marked noindex/nofollow
- [x] Footer, purchase confirmation, blocked Safety states, and `/review` integrated without changing transaction or Safety logic
- [x] No raw placeholder, invented operator/provider/contact value, active contact, legal acceptance, payment, AI, email, DB/API, package, Supabase, or Safety change added
- [x] Typecheck, lint, build, HTTP, required-label, placeholder, runtime, and prohibited-scope checks completed
- [x] Human accepted the overall M1-I5 page structure and direction and authorized only the M1-I5-R1 active-state correction
- [x] M1-I5-R1 replaced the blacked-out legal-navigation current item with a warm, readable card and visible compact `現在` badge while preserving `aria-current="page"`
- [x] M1-I5-R1 typecheck, lint, build, eight-route HTTP, rendered current-marker/navigation, and prohibited-scope checks completed
- [x] Human Visual QA and acceptance of M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`

## P4.19: Closed Unaccepted — M1-I6 Responsive, Accessibility and Visual QA Hardening

- [x] Human explicitly authorized M1-I6 after accepting M1-I5 and M1-I5-R1
- [x] Human fixed-mobile-CTA decision recorded as `rejected for Milestone 1`; non-fixed CTA preserved
- [x] Responsive Japanese heading wrapping and mobile type scales hardened without changing desktop hierarchy
- [x] Original local crescent icon added through `app/icon.svg`
- [x] Customer-facing raw `none`, public/review terminology, sample metadata hierarchy, and comparison-count mismatch corrected
- [x] `/review/**` centrally marked `noindex, nofollow`; legal/contact boundary preserved
- [x] Typecheck, lint, build, 30-route HTTP/rendered checks, 25-link integrity checks, and five fail-closed checks completed
- [x] No fixture, Safety, price, legal substance, Decision state, package, Supabase, or runtime integration change added
- [x] Partial Human visual review performed manually in external Edge; unresolved visual/accessibility defects and broader product-experience concerns identified
- [x] Full cross-width and keyboard QA recorded as incomplete historical review work
- [x] M1-I6 not accepted by Human and formally closed as superseded by M1-P2
- [x] M1-I6 implementation and evidence retained as historical records
- [x] Known M1-I6/M1-I6-R1 defects carried into M1-I7 through M1-I12 and final M1-I12 QA
- [ ] Human acceptance of Milestone 1

This closure is not M1-I6 acceptance and does not complete Milestone 1. No further M1-I6 Human Visual QA or disposition gate is required.

## P4.20: Accepted — M1-P2 Experience & Visual Direction Revision Planning

- [x] Confirm clean base state at `38319adbe019826180db71e0b32302a000cc4a02`
- [x] Confirm no existing M1-P2 or M1-I7 through M1-I12 ID conflict
- [x] Create `docs/phase1/M1_P2_EXPERIENCE_REVISION_PLAN.md`
- [x] Document the approved 14-part Reading Note structure and distinct save-oriented note purpose
- [x] Document the approved free-text/chip Request Sheet input, privacy warning, email timing, and truthful no-AI fixture representation
- [x] Document the approved ten-part LP sequence with the Reading Note artifact as primary value proof
- [x] Document the approved three-layer Legal Review architecture
- [x] Preserve product definition, JPY 980 price, 18+ policy, Safety/classification meaning, fixed judgment, core scenario facts, and runtime boundaries
- [x] Preserve the Milestone 1 rejection of a fixed/sticky mobile CTA
- [x] Propose M1-I7 Brand Foundation
- [x] Propose M1-I8 Reading Note Product Redesign
- [x] Propose M1-I9 LP Redesign
- [x] Propose M1-I10 Request Sheet Redesign
- [x] Propose M1-I11 Legal Review Redesign
- [x] Propose M1-I12 Responsive, Accessibility and Final QA
- [x] Record that every implementation slice requires separate explicit Human authorization and acceptance
- [x] Record that Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, and core scenario facts remain fixed
- [x] Allow presentation fixture/schema extension or reorganization only inside the separately authorized relevant slice, with Human review and no runtime activation
- [x] Record that real AI, DB, payment, email, API, deployment, and Safety changes remain prohibited
- [x] Record the Browser-use and screenshot prohibition; visual checks belong only to Human in ordinary external Microsoft Edge
- [x] Preserve documentation-only scope with no product-code or package change
- [x] Human acceptance of Task M1-P2; documentation acceptance does not authorize implementation
- [x] Separate Human authorization and implementation of M1-I7
- [x] One-time Human batch authorization of M1-I7 through M1-I11
- [x] M1-I7 through M1-I11 implementation and automated validation under internal checkpoints
- [x] Human acceptance of M1-I7 through M1-I11 plus M1-P2-R1 and bounded M1-P2-R1-R1 as one integrated next-stage baseline
- [ ] Separate Human authorization, implementation, and acceptance of M1-I12; currently unauthorized
- [ ] Human acceptance of Milestone 1

## P4.21: Human-Accepted as Part of the Integrated Baseline — M1-I7 Brand Foundation

- [x] Human initially authorized only M1-I7 Brand Foundation from base commit `923d43057178da070a72f380d7054d60efca7daf`; later integrated authorization is recorded below
- [x] Role-based night, moon-gold, paper, ink, state, layout, typography, border, shadow, focus, and motion tokens added
- [x] OS-font typography roles and corrected Japanese wrapping foundation with scoped `phrase-keep` utility added
- [x] `surface-brand`, `surface-paper`, `surface-worksheet`, `surface-answer`, `surface-caution`, and `surface-legal` roles added without applying later page redesigns
- [x] Original `MoonSeal`, `LunarArc`, and `EditorialDivider` components plus CSS-only `SoftGlow` and `PaperGrain` primitives added
- [x] Shared primary/secondary CTA, text-link, status, focus, contrast, touch-target, and reduced-motion foundations added
- [x] Review-only Brand Foundation preview added inside existing `/review`; no new route added
- [x] Stale M1-I6 review-gate copy corrected to the M1-I7 Human Visual QA gate
- [x] Typecheck, lint, build, raw HTTP/rendered-text, prohibited-scope, and diff validation completed without Browser use
- [x] No package, fixture, Safety, Supabase, AI, DB, payment, email, API, server action, analytics, deployment, or external asset change added
- [x] Human acceptance as part of the integrated M1-I7 through M1-I11 baseline, including the bounded public-sample corrections
- [x] M1-I8 through M1-I11 authorized and implemented under the one-time integrated batch; no standalone acceptance recorded

## P4.22: Human-Accepted Integrated Baseline — M1-I7 through M1-I11

- [x] Preserve inherited M1-I7 work from base commit `923d43057178da070a72f380d7054d60efca7daf`
- [x] Complete M1-I7 bounded Brand Foundation corrections
- [x] Implement M1-I8 14-part Reading Note, distinct saved decision card, and fictional public sample
- [x] Implement M1-I9 approved ten-part LP
- [x] Implement M1-I10 free-text Request Sheet, deterministic Safety gate, Request Memo, post-Safety email, and preparation-only purchase confirmation
- [x] Implement M1-I11 document-first Legal Review, readiness hierarchy, Unsupported cases, and inactive Contact
- [x] Complete per-slice typecheck, lint, build, `git diff --check`, and required raw HTTP/rendered-text checks without Browser use
- [x] Preserve product facts, fixed judgment, core scenario, `lib/safety/**`, fail-closed behavior, runtime inactivity, non-fixed CTAs, and legal facts
- [x] Human acceptance of M1-I7 through M1-I11 as one integrated next-stage baseline
- [ ] M1-I12 authorization; remains outside this batch
- [ ] Human acceptance of Milestone 1

## P4.23: Human-Accepted as Part of the Integrated Baseline — M1-P2-R1 and M1-P2-R1-R1

- [x] Preserve the inherited uncommitted M1-I7 through M1-I11 integrated redesign
- [x] Add separate public-only static cases for wait, send, and stop additional contact
- [x] Show the three different-case conclusions and their distinguishing facts on the LP
- [x] Change `/sample-report` to the complete `sample-send-001` fictional example
- [x] Separate same-case LP/Web/save format comparison from different-case conclusion comparison
- [x] Preserve `result-normal-001`, Safety fixtures, `lib/safety/**`, packages, and runtime boundaries
- [x] Complete typecheck, lint, build, `git diff --check`, and static boundary checks without Browser use
- [x] Correct the bounded M1-P2-R1-R1 LP contrast and separate-case comparison-boundary defects
- [x] Human acceptance with the integrated M1-I7 through M1-I11 baseline
- [ ] M1-I12 authorization; remains outside this correction
- [ ] Human acceptance of Milestone 1

## P4.24: Human and ChatGPT Accepted — M1-P3 Reading Note Visual Excellence Specification

- [x] Human authorization limited to documentation/design work
- [x] Record the formal names `恋のメッセージ鑑定ノート`, `Web鑑定ノート`, and `保存用判断カード`
- [x] Record residual application use of `保存用鑑定書` as a deferred M1-I8-R1 alignment item
- [x] Prepare the fixed-content lock, information hierarchy, Figma/design handoff, typography, chapter archetypes, responsive specification, acceptance criteria, implementation plan, and review record
- [x] Human and ChatGPT review of the M1-P3 package
- [x] Human acceptance of the five M1-P3 documents as the authoritative Visual Excellence design specification
- [x] Replace the former required-Figma gate with a Human-approved coded visual prototype gate; retain Figma only as optional non-authoritative reference material
- [x] Implement isolated M1-P3-R1 A/B coded visual prototypes from the same fixed fixture and semantic order
- [x] Human selection and acceptance of B — `Lunar Contrast Edition` as the canonical design direction; A — `Quiet Editorial Letter` rejected
- [x] Separate Human authorization of Checkpoint A / M1-I8-R1 Technical Preparation
- [x] Checkpoint A implementation and automated validation within its exact mutation manifest
- [x] Human acceptance of Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B / M1-I8-R1 Visual Excellence; B — `Lunar Contrast Edition` controlling
- [x] Checkpoint B implementation and automated validation on `feat/m1-i8-r1-checkpoint-b-lunar-contrast` within the exact mutation manifest
- [ ] Checkpoint B Human Visual QA and acceptance; merge to `main` remains prohibited
- [ ] Separate Human authorization of M1-I9-R1; currently unauthorized
- [ ] Separate Human authorization of M1-I12; currently unauthorized

M1-P3 acceptance and M1-P3-R1 prototype acceptance are not canonical implementation authorization. Figma is optional and non-authoritative. Neither prototype selection nor optional Figma material may change product facts, price, fixture judgment, Safety, request/legal behavior, or runtime scope.

## P4.25: Human Accepted — M1-I2-R1 Safety Policy Enforcement Alignment

- [x] Stop M1-P3-R1 before coded visual prototype implementation when `SEM-UNSUPPORTED-CASES` fails
- [x] Human authorization of only the bounded M1-I2-R1 Safety correction
- [x] Add `illegal_conduct` and `third_party_secret` without changing existing reason-code meaning or structured classification/severity
- [x] Align all 13 exact locked unsupported-case labels to their required fail-closed classification/reason
- [x] Add NFKC/whitespace normalization, targeted free-text variants, and bounded negation guards for the confirmed coverage gaps
- [x] Ensure every non-`normal_allowed` result blocks ordinary confirmation
- [x] Add `scripts/verify-m1-safety-policy.mjs` using the real classifier, real category export, existing TypeScript compiler, OS temp directory, and exact lock
- [x] Pass exact-category, natural-language, benign-control, structured-flag, normal, contradictory-selection, `SEM-UNSUPPORTED-CASES`, and aggregate Safety gates
- [x] Pass typecheck, lint, production build, `git diff --check`, and prohibited-scope audit without Browser or screenshots
- [x] Human review and acceptance of M1-I2-R1 at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`; `SEM-UNSUPPORTED-CASES` PASS without waiver
- [x] Resolve the previous M1-P3-R1 hard stop; coded visual prototype implementation may resume and remains zero before that work starts

This correction does not authorize canonical UI or Reading Note changes, Checkpoint A, Checkpoint B, M1-I9-R1, M1-I12, Milestone 1 acceptance, or Milestone 2.

## P4.26: Human Design Selection Accepted — M1-P3-R1 Coded Visual Prototype Gate

- [x] Continue the existing Human authorization after M1-I2-R1 acceptance and `main` synchronization
- [x] Add review-only `/review/visual-excellence`, `/review/visual-excellence/a`, and `/review/visual-excellence/b`
- [x] Use only the existing exported `getReportFixture("result-normal-001")` resolver; keep fixture content unchanged
- [x] Use the same content subset and semantic order for A and B while demonstrating all six M1-P3 chapter archetypes
- [x] Keep canonical report components, LP, Request UI, Legal UI, `fixtures/**`, `lib/safety/**`, package files, and runtime behavior unchanged
- [x] Pass exact locks, semantic assertions, Safety verifier, typecheck, lint, build, raw HTTP/rendered checks, prohibited-scope audit, and `git diff --check` without Browser or screenshots
- [x] Human selected and accepted B — `Lunar Contrast Edition` and rejected A — `Quiet Editorial Letter`; this explicit Human decision is the design-selection evidence
- [x] Separate Human authorization of Checkpoint A with its exact mutation manifest
- [x] Checkpoint A implementation, automated validation, and Human acceptance at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B after design selection
- [x] Checkpoint B implementation and automated validation on its dedicated branch; Human Visual QA pending

Prototype acceptance alone is not canonical visual implementation authorization. Figma is optional and non-authoritative. The current separate Human instruction accepts Checkpoint A and explicitly authorizes Checkpoint B only within its exact mutation manifest.

## P4.27: Human Accepted — M1-I8-R1 Checkpoint A Technical Preparation

- [x] Branch from accepted documentation commit `d6a9f111a2e15c54e9f250a2126d64abfacdefd0`
- [x] Add deterministic exact-lock, rendered-lock, semantic-assertion, and Safety aggregate verifier
- [x] Resolve the three undefined CSS references through approved existing palette aliases
- [x] Isolate paper-grain positioning, order media queries broad-to-narrow, and add the 320px fallback without redesign
- [x] Remove only statically proven unconsumed legacy LP selectors
- [x] Add narrow, currently unadopted artifact surface/rule/metadata/stamp/section-label presentation primitives
- [x] Inventory residual `保存用鑑定書` sources without changing customer-facing copy
- [x] Document the deliberate `--swatch-color` dynamic source and defensive fallback
- [x] Pass content locks, semantic assertions, Safety, typecheck, lint, production build, `git diff --check`, manifest, and protected-scope audits
- [x] Human acceptance of Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`
- [x] Separate Human authorization of Checkpoint B

Checkpoint A acceptance is technical acceptance, not visual acceptance. The separate current Human authorization permits Checkpoint B only within its exact mutation manifest; it does not authorize Checkpoint B merge, M1-I9-R1, M1-I12, or Milestone 1 completion.

## P4.28: Implemented — M1-I8-R1 Checkpoint B Visual Excellence; Human Visual QA Pending

- [x] Branch from accepted `main` commit `79011f274c35a0cf80f68af845ffaca95e8884c9` on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`
- [x] Use prototype commit `d5095ec3c7cf14a9646cb621a64b88d970e908bc` only as read-only design evidence; no merge, cherry-pick, or rebase
- [x] Implement B — `Lunar Contrast Edition` for Web鑑定ノート, 保存用判断カード, 公開全文見本, comparison navigation, error/loading, and review boundary
- [x] Introduce shared presentation-only artifact compositions with caller-owned semantics and no fixture/schema renderer, routing, state, behavior, or runtime integration
- [x] Preserve the exact Web/save judgment, public conclusion/disclosure, approved content order, Safety meaning, and fail-closed unknown-ID behavior
- [x] Align only authorized customer-facing `保存用鑑定書` labels; defer `lib/legal/review-content.ts` residual `保存用鑑定書見本`
- [x] Pass content locks, semantic assertions, Safety, typecheck, lint, production build, raw HTTP, one-`h1`, heading-order, exact-copy, manifest, prohibited-scope, and `git diff --check` audits without Browser or screenshots
- [ ] Human Visual QA at desktop, 768px, 390px, and 320px, including contrast, 200% zoom, wrapping, focus, keyboard order, and closing aftertaste
- [ ] Human acceptance and separate merge authorization

Checkpoint B remains off `main`. M1-I9-R1, M1-I12, Milestone 1 completion, and Milestone 2 remain unauthorized.

## P5: Approved Remaining Delivery Sequence — Not Yet Complete

Dependency order is mandatory. Detailed tasks are in `docs/phase1/IMPLEMENTATION_WBS.md`.

- [ ] Milestone 1: Reviewable Web MVP
- [ ] Milestone 2: Operator Information and Publication Readiness
- [ ] Milestone 3: Review Site Deployment
- [ ] Milestone 4: Payment Provider Inquiry and Selection
- [ ] Milestone 5: Core Backend, Safety, AI and Email
- [ ] Milestone 6: Approved Provider Sandbox Payment
- [ ] Milestone 7: E2E, Safety and Failure Operations
- [ ] Milestone 8: Production Application and Soft Launch
- [ ] Milestone 9: First Real Purchase Verification

## Blocked Future Work

M1-P2 is Human-accepted planning. M1-I6 was not accepted and is formally closed as superseded by M1-P2; its implementation and evidence remain historical, and no later M1-I6 gate exists. The current M1-I7 through M1-I11 integrated redesign plus M1-P2-R1 and bounded M1-P2-R1-R1 corrections are the Human-accepted next-stage baseline. M1-P3 is Human and ChatGPT accepted as the authoritative, complete documentation/design specification. M1-I2-R1 is Human-accepted, and M1-P3-R1 A/B coded visual prototypes are implemented and automatically validated. Human selected and accepted B — `Lunar Contrast Edition` and rejected A — `Quiet Editorial Letter`; Figma is optional and non-authoritative. Checkpoint A is Human-accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and synchronized to `main`. Checkpoint B is implemented and automatically validated on its dedicated branch; Human Visual QA is pending and merge remains prohibited. M1-I9-R1 and M1-I12 remain unauthorized. Operator-information completion, deployment, provider inquiry, provider selection, production DB writes, OpenAI, email, payment, refund implementation, production launch, accounts, subscription, native-app work, and every Milestone 2+ task remain blocked by their dependency, validation, and Human acceptance gates. Browser use and screenshot acquisition by CodeX/agents are prohibited; Human performs visual review manually in ordinary external Microsoft Edge.
