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

### Stage 4: Safety Screening

Goal:

- Prevent dangerous cases from proceeding to normal paid diagnosis

Includes:

- deterministic safety flag checks
- blocked/rejected flow
- needs_review state if needed
- no normal romantic diagnosis for rejected cases

---

### Stage 5: Payment Flow

Goal:

- Only normal_allowed requests proceed to payment
- Payment success is verified before generation

Includes:

- payment provider selection
- checkout/session creation
- payment success verification
- webhook or verified callback design

Excludes:

- subscription
- coin/point system
- multi-item checkout

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
