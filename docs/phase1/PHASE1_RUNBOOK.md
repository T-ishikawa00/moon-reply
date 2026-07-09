# PHASE1_RUNBOOK.md

## 0. Purpose

This runbook describes how to operate the Phase 1 automated public MVP.

Development may use mock or manual behavior, but public launch requires the normal diagnosis flow to run automatically.

---

## 1. Public MVP Launch Requirements

Before public launch:

- [ ] Self-hosted request form works
- [ ] Safety screening works
- [ ] Payment success verification works
- [ ] Payment success triggers AI generation
- [ ] AI judgment generation works
- [ ] AI full diagnosis generation works
- [ ] Result page works
- [ ] Email notification works
- [ ] Feedback collection works
- [ ] Dangerous cases are blocked
- [ ] Privacy/refund/safety notes are visible

---

## 2. Development/QA Allowances

Allowed before public launch:

- Mock payment
- Mock payment success
- Mock AI generation
- Manual prompt testing
- Manual QA of generated outputs
- Email logged instead of sent
- Result page preview using fixture data
- Database/admin inspection through development tooling

These allowances do not define the public MVP target.

---

## 3. Launch Flow

1. Publish LP
2. Share LP through selected channels
3. User submits self-hosted diagnosis request form
4. Safety screening runs
5. Eligible user proceeds to payment
6. Payment success is verified
7. AI judgment and full diagnosis are generated
8. Result page is created
9. Result URL is sent by email
10. User reads result and submits optional feedback
11. Metrics are recorded

---

## 4. Daily Operation

Daily checklist:

- [ ] Check LP and form availability
- [ ] Check safety screening results
- [ ] Check payment success/failure records
- [ ] Check generation failures
- [ ] Check result page creation
- [ ] Check email delivery status
- [ ] Check feedback submissions
- [ ] Update metrics
- [ ] Record issues

---

## 5. Decision Timing

Initial validation period:

- 14 days

Decision options:

- Go: improve and harden automated MVP
- Iterate: revise LP/copy/price/form/automation
- No-Go: stop or pivot concept

---

## 6. Go Criteria

Candidate Go criteria:

- Paid orders: 10+
- Refunds: 1 or less
- Repeat intent: 2+
- Save intent: 3+
- ChatGPT enough feedback is not dominant
- Normal diagnosis flow works without human intervention
- Safety operations are manageable

---

## 7. Iterate Criteria

Iterate if:

- Paid orders: 3-9
- LP interest exists but conversion is weak
- Price resistance is strong but not total rejection
- Users like copy but do not pay
- Form is too long
- Diagnosis is liked but delivery or result page feels weak
- Automation has non-critical failure points

---

## 8. No-Go Criteria

No-Go if:

- Paid orders: 0-2 with enough traffic
- Most feedback says ChatGPT is enough
- Users do not understand the service
- Strong safety concerns appear
- Payment provider cannot support the category
- Critical automation failures cannot be resolved
