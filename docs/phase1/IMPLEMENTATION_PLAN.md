# IMPLEMENTATION_PLAN.md

## 0. Purpose

This document defines the implementation plan for the Phase 1 automated public MVP.

This is not implementation.

The next implementation must be staged and must not accidentally become a full app.

---

## 1. MVP Goal

Build an automated one-shot paid diagnosis MVP.

Target public flow:

LP → self-hosted request form → safety check → payment → AI judgment → AI full diagnosis → result page → email notification → feedback.

---

## 2. Development Principle

Development may use:

- mock payment
- mock AI
- email logging
- fixture data
- manual QA

Public MVP target:

- normal diagnosis flow is automated
- dangerous cases are blocked or routed away
- payment success triggers diagnosis generation
- result page is created automatically
- result URL is sent by email

---

## 3. Recommended Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API
- Payment provider
- Email sending service
- Vercel

---

## 4. Staged Implementation Overview

### Stage 1: Project Bootstrap + Static LP

Goal:

- Create Next.js project foundation
- Build one-page LP
- No DB/API/payment/AI yet

Includes:

- package.json
- app route structure
- Tailwind setup
- static LP sections
- CTA route placeholder

Excludes:

- Supabase
- OpenAI
- Payment
- Email
- Database

---

### Stage 2: Self-hosted Request Form

Goal:

- Build diagnosis request form UI
- Validate required fields client-side
- Display consent checkboxes

Includes:

- form page
- relationship/context fields
- message fields
- safety screening questions
- consent fields

Excludes:

- real DB persistence initially
- payment
- AI generation

---

### Stage 3: Supabase Data Foundation

Goal:

- Add minimal but future-safe data persistence foundation

Includes draft tables:

- reading_requests
- safety_checks
- readings
- purchases
- credit_ledger
- entitlements
- provider_events
- ai_generation_logs
- email_deliveries
- feedback

Important principles:

- External providers are proof sources
- Our DB is the business source of truth
- Do not treat Stripe, RevenueCat, Apple, Google, or any payment provider as the only purchase database
- Do not implement real payment, AI, or email in Stage 3

Excludes:

- authentication
- user account
- full admin panel
- OpenAI API
- payment API
- email API

---

### Stage 4: Safety Screening Foundation

Goal:

- Add deterministic safety screening foundation before payment or AI generation

Includes:

- safety reason codes
- rule-based selected flag classification
- conservative free-text high-risk keyword detection
- normal_allowed / needs_review / rejected classification
- user-facing safety messages
- local request form UI integration

Excludes:

- OpenAI safety judge
- DB persistence
- API route
- payment
- email
- result page

---

### Stage 4.5: Legal / Compliance Foundation

Goal:

- Define the legal, consumer-protection, privacy, AI, safety, and payment-review rules before paid implementation

Includes:

- legal source register
- compliance checklist
- prohibited expression policy
- unsupported-case policy
- input validation specification
- AI prompt guardrails
- AI data minimization
- retention planning
- payment provider inquiry plan
- provider comparison
- final payment confirmation screen specification
- legal page requirements

Excludes:

- final legal advice
- publication-ready legal pages
- payment SDK
- checkout
- webhook
- OpenAI integration
- email integration

### Task 18B: Legal Page Drafts and Operator Decisions

Goal:

- Convert approved compliance requirements into internally reviewable Japanese legal-page drafts
- Make every unknown operator/provider decision explicit
- Define the publication approval gate

Includes:

- Terms draft
- Privacy draft
- 特商法 draft
- Refund draft
- AI disclosure
- Unsupported-case public explanation
- Contact-page draft
- Operator decision register
- Consistency matrix
- Publication gate

Excludes:

- publication
- application routes
- provider inquiry
- provider approval
- payment implementation
- professional legal approval

### Task 18C: Operator Decisions and Provider Inquiry Preparation

Goal:

- Resolve operator-owned placeholders where possible
- Prepare provider-specific inquiry messages and evidence folders
- Do not implement payment yet

### Stage 5B: Payment Provider Decision

Goal:

- Select a provider only after written evidence and Human approval

### Stage 5C: Sandbox Payment Implementation

Goal:

- Implement the approved provider in test mode only

---

### Stage 6: AI Judgment + Diagnosis Generation

Goal:

- Generate structured judgment first
- Generate full diagnosis second

Includes:

- AI judgment prompt
- AI diagnosis prompt
- output validation
- failure handling
- quality guardrails based on golden samples

---

### Stage 7: Result Page + Email

Goal:

- Automatically display and deliver result

Includes:

- result page with unguessable token
- full diagnosis markdown rendering
- saveable memo/card copy display
- emotional tags
- email notification with result URL
- feedback CTA

---

### Stage 8: Feedback + Metrics

Goal:

- Collect feedback and validation data

Includes:

- feedback form
- satisfaction
- save intent
- repeat intent
- price value
- ChatGPT comparison
- basic metrics logging

---

## 5. Implementation Rule

Do not implement all stages in one task.

Each stage must have:

- clear scope
- acceptance criteria
- no unrelated feature creep
- commit after completion
- human review before proceeding

---

## 6. First Implementation Task

The first implementation task after this plan should be:

Stage 1: Project Bootstrap + Static LP

Allowed:

- create Next.js app foundation
- create one-page LP
- static content only
- no DB
- no API integrations
- no payment
- no AI
- no email

Not allowed:

- login
- database
- payment API
- OpenAI API
- email API
- subscription
- dashboard
