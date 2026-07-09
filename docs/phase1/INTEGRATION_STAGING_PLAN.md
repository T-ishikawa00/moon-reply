# INTEGRATION_STAGING_PLAN.md

## 0. Purpose

This document defines how integrations should be added safely.

---

## 1. Integration Order

Recommended order:

1. Static LP
2. Request form UI
3. Supabase persistence
4. Safety screening
5. Mock payment
6. Real payment provider
7. Mock AI generation
8. OpenAI judgment generation
9. OpenAI full diagnosis generation
10. Result page
11. Email log mode
12. Real email provider
13. Feedback collection
14. Metrics

---

## 2. Why This Order

This order reduces risk.

- LP can be reviewed visually before backend work
- Form fields can be tested before persistence
- Safety screening must exist before payment
- Mock payment allows testing generation without real charges
- AI generation can be quality-tested before public payment
- Email can be logged before sending real emails

---

## 3. Payment Integration Rule

Do not allow public users to trigger diagnosis generation unless payment success is verified.

Development exception:

- mock payment may trigger generation only when explicitly enabled by development flag

---

## 4. AI Integration Rule

AI generation must be split into:

1. judgment generation
2. full diagnosis generation

Do not generate full diagnosis without judgment.

Do not generate normal diagnosis if safety result is rejected.

---

## 5. Email Integration Rule

Before real email:

- log email body
- test result URL
- verify disclaimer
- verify feedback link

After real email:

- record delivery status
- record failures
- do not expose secrets

---

## 6. Public Launch Gate

Public launch requires:

- safety screening works
- payment success verification works
- AI generation works
- result page works
- email delivery works
- privacy/refund/safety notes visible
- no test data appears
