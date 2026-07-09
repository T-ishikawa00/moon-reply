# DEVELOPMENT_QA_MODE.md

## 0. Purpose

This document defines how development and QA can use manual or mock behavior while the public MVP remains automated.

---

## 1. Principle

Manual behavior is acceptable during development.

Manual behavior is not the target public MVP.

The public MVP should automate normal diagnosis flow.

---

## 2. Allowed During Development

Allowed:

- Mock payment
- Mock payment success
- Mock AI generation
- Manual AI prompt testing
- Manual quality review
- Email logged to console or development logs
- Result page preview using fixture data
- Safety check test cases
- Database inspection through Supabase

---

## 3. Required Before Public Use

Before public use:

- Real payment flow or approved payment provider flow is connected
- Payment success cannot be faked by users
- AI generation is connected
- Dangerous cases are blocked or routed away from normal diagnosis
- Result pages use unguessable tokens or equivalent protection
- Email delivery works
- Error states are handled
- Privacy and refund notes are visible
- No test data appears in public

---

## 4. Human QA Role

Human QA may inspect:

- generated diagnosis quality
- safety screening behavior
- prompt stability
- result page readability
- email formatting
- feedback capture
- logs and metrics

Human QA should not be required for every normal public diagnosis unless the system is in controlled beta mode.

---

## 5. Controlled Beta Option

If needed, public beta can run in controlled mode:

- User completes normal flow
- Payment is real
- AI generation is automatic
- Human receives an alert
- Human can inspect outputs for a limited early period

But the product goal remains automated delivery for normal cases.
