# STAGE3_DATA_FOUNDATION_SCOPE.md

## 0. Purpose

This document defines the intended scope for Stage 3 Supabase Data Foundation.

Stage 3 should create the data foundation only.

It must not implement payment, AI generation, email delivery, or public result generation.

---

## 1. Stage 3 Goal

Create Supabase-backed data foundation for the automated public MVP.

Stage 3 should support future stages:

- safety screening
- payment verification
- AI generation
- result storage
- email delivery
- feedback
- purchase/credit tracking

---

## 2. In Scope for Stage 3

In scope:

- Supabase package installation
- `.env.example`
- Supabase client/server setup
- Database schema or migration plan
- Tables needed for MVP data foundation
- Type-safe data access helpers if useful
- No real user authentication
- No payment provider implementation
- No OpenAI implementation
- No email implementation

---

## 3. Candidate Tables

Stage 3 candidate tables:

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

Optional later table:

- profiles

Do not add profiles unless a clear no-login MVP reason requires it.

---

## 4. No-Login MVP Assumption

The current public MVP does not include login.

Expected access model:

- request token
- result token
- email address for delivery
- unguessable result URLs

No account dashboard is required in Stage 3.

---

## 5. Not in Stage 3

Do not implement:

- OpenAI API
- payment API
- email API
- result page
- login
- user accounts
- subscriptions
- coin/point system
- admin dashboard
- app-store purchase handling
- RevenueCat integration

---

## 6. Stage 3 Acceptance Direction

Stage 3 will be accepted when:

- Supabase foundation exists
- `.env.example` exists
- schema/migrations exist
- MVP tables are represented
- no provider integrations are implemented
- no fake sales or customer data is inserted
- build/typecheck/lint pass
