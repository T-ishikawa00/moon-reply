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
- [ ] Add diagnosis_requests
- [ ] Add safety_checks
- [ ] Add payments
- [ ] Add diagnosis_results
- [ ] Add email_deliveries
- [ ] Add feedback

## P4: Safety Screening

- [ ] Implement safety flag detection
- [ ] Add normal_allowed result
- [ ] Add needs_review result
- [ ] Add rejected result
- [ ] Add rejected route
- [ ] Ensure rejected cases do not proceed to payment

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
