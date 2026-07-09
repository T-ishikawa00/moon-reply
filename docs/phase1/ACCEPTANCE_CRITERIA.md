# ACCEPTANCE_CRITERIA.md

## 0. Purpose

This document defines acceptance criteria for implementation stages.

---

## Stage 1: Bootstrap + Static LP

Accepted when:

- Next.js project runs locally
- One-page LP exists at `/`
- LP is responsive
- CTA exists
- No backend integrations are added
- No DB/OpenAI/payment/email code exists
- Build passes

---

## Stage 2: Request Form UI

Accepted when:

- `/request` exists
- Form contains all required fields
- Safety screening fields exist
- Consent checkboxes exist
- Required fields validate
- No payment/AI generation happens yet

---

## Stage 3: Supabase Foundation

Accepted when:

- `.env.example` exists
- Supabase configuration is documented
- Draft tables can be created
- No user account/login is created

---

## Stage 4: Safety Screening

Accepted when:

- Dangerous cases are detected
- Rejected cases do not proceed to payment
- Normal cases can proceed
- Safety results are stored

---

## Stage 5: Payment

Accepted when:

- Only normal_allowed requests can start payment
- Payment success is verified
- Failed payment does not trigger generation
- Mock payment is clearly dev-only
- No subscription/coin system exists

---

## Stage 6: AI Generation

Accepted when:

- Judgment generation runs before full diagnosis
- Full diagnosis follows approved 月の返事 structure
- Dangerous cases cannot generate normal diagnosis
- Failures are handled safely
- Outputs do not guarantee reply/love/reconciliation

---

## Stage 7: Result Page + Email

Accepted when:

- Result page is accessible by unguessable token
- Result displays full diagnosis
- Result URL is emailed or logged in dev
- Feedback CTA is visible
- No private data is exposed publicly

---

## Stage 8: Feedback + Metrics

Accepted when:

- Feedback can be submitted
- Feedback is stored
- Metrics can be summarized
- No fake sales/evaluation data is added

---

## Public MVP Launch Gate

Accepted when:

- Normal paid diagnosis flow is automated
- Safety screening works
- Payment verification works
- AI generation works
- Result page works
- Email notification works
- Feedback works
- Mobile experience is acceptable
- Legal/safety/refund notes are visible
- No test data appears in production
