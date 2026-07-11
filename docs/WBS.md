# WBS.md

## Status Rule

Historical completed work is preserved below. Current delivery sequencing is controlled by `docs/ROADMAP.md`. A checked historical planning item does not authorize a later implementation. Milestones 1–9 remain incomplete until their stated validation and Human acceptance gates are satisfied.

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

## P4.11: Current Task — Task 18C-R3 Roadmap Reset and Delivery Lane Alignment

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
- [x] Web鑑定ノート and 保存用鑑定書 separated
- [x] `/review/save-report/result-normal-001` added to planning only
- [x] Safety-before-payment and future post-payment refund/operator state requirement aligned
- [x] Two-level review banner aligned
- [x] The Pattern adopt/transform/reject boundary recorded without adding reference assets
- [x] M1-I1 through M1-I6 planning aligned without authorization
- [x] Documentation-only boundary preserved
- [x] Milestone 1 implementation remained unstarted during planning
- [x] Human acceptance of Task M1-P1-R1 at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`

## P4.14: Current Task — M1-I1 Route Shell and Review Navigation

- [x] Human explicitly authorized M1-I1
- [x] Refreshed vertical LP implemented at `/`
- [x] Shared responsive header and footer implemented
- [x] Shared two-level `/review/**` banner implemented
- [x] Static `/review` route/status inventory implemented
- [x] Unimplemented routes shown only as non-clickable preparation items
- [x] Existing `/request` behavior, age choices, and Safety implementation preserved
- [x] No fixture or runtime integration added
- [ ] Human acceptance of Task M1-I1

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

M1-I2 remains blocked until Human accepts M1-I1 and separately authorizes the next slice. M1-I3 through M1-I6, operator-information completion, deployment, provider inquiry, provider selection, production DB writes, OpenAI, email, payment, refund implementation, production launch, accounts, subscription, and native-app work remain blocked by their respective dependency, validation, and Human acceptance gates.
