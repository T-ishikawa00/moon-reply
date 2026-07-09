# AUTOMATED_PUBLIC_MVP_SPEC.md

## 0. Purpose

This document defines the corrected Phase 1 MVP direction.

Phase 1 is not a semi-manual paid test.

Phase 1 is an automated public MVP for one-shot paid diagnosis.

Development may use manual, mock, and QA modes, but the public MVP must complete normal diagnosis flow automatically.

---

## 1. Core Principle

Development mode:

- Manual review is allowed
- Mock payment is allowed
- Mock AI response is allowed
- Email sending may be logged instead of sent
- Human QA may inspect generated diagnosis

Public MVP:

- User can submit a diagnosis request
- Safety screening runs before payment
- Eligible requests proceed to payment
- Payment success triggers AI diagnosis generation
- Result page is generated automatically
- Result URL is sent by email
- Feedback is collected
- Metrics are recorded

---

## 2. Public MVP Flow

Public MVP flow:

1. User visits LP
2. User clicks CTA
3. User fills diagnosis request form
4. System runs safety screening
5. If normal diagnosis is allowed, user proceeds to payment
6. User completes payment
7. Payment success is verified
8. System generates judgment
9. System generates full diagnosis
10. System stores diagnosis result
11. System creates result URL
12. System sends result URL by email
13. User reads result page
14. User optionally submits feedback
15. Metrics are recorded

---

## 3. In Scope

In scope for public MVP:

- One-page LP
- Self-hosted diagnosis request form
- Safety screening
- Payment provider integration
- Payment success handling
- AI judgment generation
- AI full diagnosis generation
- Result page
- Email notification
- Minimal database tables
- Feedback form
- Metrics logging
- Basic operational visibility through database/admin tooling

---

## 4. Out of Scope

Out of scope:

- Login
- User account
- My page
- Partner-specific notebooks
- Diagnosis history list
- Subscription
- Coin/point system
- Native app
- Full admin panel
- Auto-generated image card
- Complex CRM
- Multi-product checkout
- Social sharing features
- Push notifications

---

## 5. Public MVP Success Criteria

Primary success criteria:

- Paid orders: 10 or more within validation window
- Refund requests: 1 or less
- At least 3 users say they want to save or revisit the result
- At least 2 users show repeat intent
- "ChatGPT is enough" is not dominant feedback
- Normal diagnosis flow works without human intervention

Secondary success criteria:

- Safety screening catches dangerous cases
- Result generation quality is close to G001/G002/G003
- Result page feels like a diagnosis note, not generic AI chat
- Email result delivery works
- Payment flow is not confusing
- No critical privacy/safety issue appears

---

## 6. Public MVP Failure Criteria

No-Go or major iterate if:

- Paid orders are 0-2 with enough traffic
- Payment flow breaks repeatedly
- AI result quality is unstable
- Safety screening fails dangerous cases
- Users say ChatGPT is enough
- Users do not understand what they are paying for
- Refunds or complaints are high
- Payment provider cannot support this category
