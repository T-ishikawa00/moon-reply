# IMPLEMENTATION_WBS.md

## P1: Bootstrap + Static LP

- [ ] Create Next.js project foundation
- [ ] Configure TypeScript
- [ ] Configure Tailwind
- [ ] Create one-page LP
- [ ] Add responsive layout
- [ ] Add CTA to request placeholder
- [ ] Add safety/AI/refund notes
- [ ] Confirm no backend/API integrations

## P2: Request Form UI

- [ ] Create `/request`
- [ ] Add relationship fields
- [ ] Add message context fields
- [ ] Add emotion/outcome fields
- [ ] Add safety screening fields
- [ ] Add consent checkboxes
- [ ] Add client-side validation

## P3: Supabase Foundation

- [ ] Create `.env.example`
- [ ] Add Supabase client/server plan
- [ ] Create table migration plan
- [ ] Add reading_requests
- [ ] Add safety_checks
- [ ] Add readings
- [ ] Add purchases
- [ ] Add credit_ledger
- [ ] Add entitlements
- [ ] Add provider_events
- [ ] Add ai_generation_logs
- [ ] Add email_deliveries
- [ ] Add feedback
- [ ] Confirm no OpenAI/payment/email integration
- [ ] Confirm no login/user account implementation

## P4: Safety Screening

- [x] Define safety classification types
- [x] Define safety reason codes
- [x] Define selected-flag rules
- [x] Add conservative free-text risk scan
- [x] Implement deterministic classifier
- [x] Add user-facing safety messages
- [x] Integrate classifier into request form UI
- [x] Block local confirmation for rejected-level safety issues
- [x] Show warning for needs-review issues
- [x] Confirm no DB/API/OpenAI/payment/email integration

## P4.5: Legal / Compliance Foundation

- [x] Stage 4 acceptance recorded
- [x] Legal source register created
- [x] Legal compliance foundation created
- [x] Compliance checklist created
- [x] Prohibited expressions created
- [x] Unsupported-case policy created
- [x] Input validation specification created
- [x] AI prompt guardrails created
- [x] AI data minimization policy created
- [x] Data retention planning created
- [x] Payment provider inquiry plan created
- [x] Provider comparison template created
- [x] Final payment confirmation screen specified
- [x] Legal page requirements specified
- [x] No implementation code changed

## P4.6: Legal Page Drafts

- [x] Terms of Service draft created
- [x] Privacy Policy draft created
- [x] 特商法 draft created
- [x] Refund Policy draft created
- [x] AI disclosure draft created
- [x] Unsupported-cases public draft created
- [x] Contact-page draft created
- [x] Operator decision register created
- [x] Consistency matrix created
- [x] Publication gate created
- [x] All drafts retain non-public draft labels
- [x] No application implementation changed

## P4.7: Operator Decisions and Provider Inquiry Preparation

- [x] Task 18B acceptance recorded
- [x] Decided/undecided overview created
- [x] Operator decision guide created
- [x] Operator worksheet created
- [x] PAY.JP inquiry draft created
- [x] KOMOJU inquiry draft created
- [x] STORES inquiry draft created
- [x] Generic inquiry template created
- [x] Submission checklist created
- [x] Evidence log created
- [x] Provider scorecard created
- [x] Provider decision gate created
- [x] No inquiry sent
- [x] No payment implementation started

## P5: Payment

- [ ] Choose provider
- [ ] Add payment environment variables
- [ ] Add mock payment mode
- [ ] Add real payment create flow
- [ ] Add payment success verification
- [ ] Add webhook handling
- [ ] Ensure payment success required before generation

## P6: AI Generation

- [ ] Add OpenAI environment variables
- [ ] Add judgment prompt
- [ ] Add judgment schema
- [ ] Add full diagnosis prompt
- [ ] Add output validation
- [ ] Add failure handling
- [ ] Add golden sample quality anchors

## P7: Result Page + Email

- [ ] Create `/result/[token]`
- [ ] Add token protection
- [ ] Render markdown diagnosis
- [ ] Show saveable memo/card copy
- [ ] Show emotional tags
- [ ] Add email log mode
- [ ] Add real email provider
- [ ] Send result URL by email

## P8: Feedback + Metrics

- [ ] Create `/feedback/[token]`
- [ ] Add feedback fields
- [ ] Store feedback
- [ ] Add metrics tracking
- [ ] Add validation summary process

## P9: Public Launch Gate

- [ ] Run safety test cases
- [ ] Run payment test
- [ ] Run AI generation test
- [ ] Run email test
- [ ] Run privacy review
- [ ] Run mobile UI review
- [ ] Confirm no fake metrics
