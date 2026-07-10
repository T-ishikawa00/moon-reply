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
- Data model supports no-login one-shot diagnosis
- Tables or migrations exist for:
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
- External provider source-of-truth policy is documented
- No user account/login is created
- No OpenAI/payment/email integration is implemented
- No fake purchase/customer data is inserted

---

## Stage 4: Safety Screening Foundation

Accepted when:

- Safety classifier is deterministic
- Safety classifier has no DB/API/network dependency
- Selected safety flags map to expected classifications
- Contradictory safety selection is blocked
- DV/abuse/fear is needs_review
- Self-harm, harm, stalking, ambush, threat, minor, doxxing, surveillance are rejected
- Conservative free-text high-risk detection exists
- Request form displays safety classification
- Rejected-level issues block local confirmation
- Needs-review issues show warning
- No OpenAI API is used
- No DB persistence is added
- No API route is created

---

## Stage 4.5: Legal / Compliance Foundation

Accepted when:

- Stage 4 acceptance is recorded
- Internal documents are clearly labeled as drafts/not legal advice
- Consumer-protection rules prohibit fear-based selling
- Outcome guarantees are prohibited
- Fake reviews and fake metrics are prohibited
- 18+ initial MVP policy is recorded
- Safety screening is required before payment
- Direct identifiers are excluded from future AI payloads
- Marketing consent is separate from result delivery
- Provider inquiry is required before SDK implementation
- No provider is falsely marked approved
- Final payment confirmation requirements are specified
- Legal page requirements are specified
- No application code/package/migration is changed

---

## Task 18B: Legal Page Drafts

Accepted when:

- All required draft files exist
- Drafts are written in Japanese
- Draft warning labels remain visible
- No fictional operator details are used
- Unknown fields use explicit placeholders
- Terms accurately describe the initial one-shot MVP
- Privacy draft excludes fixed unverified provider claims
- 特商法 draft contains all required decision placeholders
- Refund draft distinguishes major failure cases
- AI disclosure clearly states uncertainty and non-guarantee
- Unsupported-case draft is safety-first and non-judgmental
- Operator decision register captures unresolved decisions
- Cross-document consistency requirements are documented
- Publication gate marks all external approvals as incomplete
- No application code/package/migration is changed

---

## Task 18C: Operator Decisions and Provider Inquiry Preparation

Accepted when:

- Approved product decisions are clearly distinguished from unresolved decisions
- Human/operator decisions are explained in plain Japanese
- Evidence-required decisions are separated
- Professional-review decisions are separated
- Provider inquiry drafts honestly describe the service
- No provider feature or approval is invented
- Provider inquiry evidence log exists
- Provider decision scorecard exists
- Written category acceptance is mandatory
- All providers remain not sent/not approved/not selected
- No application code/package/migration is changed

---

## Task 18C-R1: Age Eligibility Policy Alignment

Accepted when:

- Age-group selection remains required
- Only `18〜24歳`, `25〜29歳`, `30〜34歳`, `35〜39歳`, and `40歳以上` are available
- `回答しない` is not available in the request-form age-group field
- The request form clearly states that the service is for users aged 18 or older
- No separate 18-or-older checkbox exists
- No date of birth or identity document is collected
- The payment confirmation specification displays and permits correction of the selected age group
- Production server validation of the allowed age-group value is recorded as required but remains unimplemented
- Current specifications no longer require a separate age checkbox
- No provider inquiry is sent
- No payment/API/OpenAI/email implementation is added

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
