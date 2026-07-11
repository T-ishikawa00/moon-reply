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

Status: accepted by Human.

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

## Task 18C-R2: Service Positioning and Classification Alignment

Status: accepted by Human at commit `24ca0f43f262f3fbe03d412460571ac9daf7956c`.

Accepted when:

- A canonical service-positioning document exists
- Official business/legal/provider copy uses AI relationship-message analysis and decision-support wording
- User-facing brand may retain `鑑定ノート` and `鑑定書`
- No current controlling document self-defines the service as AI fortune-telling
- No supernatural method is implied
- No provider classification or legal exemption is claimed
- Provider inquiries disclose the user-facing `鑑定` terminology
- Provider inquiries ask the provider to determine category treatment
- Result output distinguishes facts, inference and uncertainty
- Historical evidence has not been falsified
- No provider inquiry has been sent
- No provider has been approved or selected
- No payment/OpenAI/email/API implementation has been added

---

## Task 18C-R3: Roadmap Reset and Delivery Lane Alignment

Status: accepted by Human at commit `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`.

Accepted when:

- `docs/ROADMAP.md` defines one authoritative path to the first paid public Web MVP
- the initial Web MVP completion point is the first verified real purchase
- completed foundations are accurately recorded without claiming runtime integrations
- stale claims that Stage 1 is next are removed
- the payment-free Reviewable Web MVP precedes provider inquiry
- operator/publication decisions precede review-site deployment
- review-site deployment precedes provider inquiry
- provider selection precedes provider-specific payment implementation
- backend fulfillment can be tested before real payment integration
- sandbox payment precedes production payment
- E2E and failure-operation evidence precede soft launch
- subscription, accounts and native apps remain post-MVP candidates
- no code, route, API, payment, AI, email or deployment implementation is added
- no provider inquiry is sent
- no provider is approved or selected
- the next task is Milestone 1 planning/specification only

---

## Task M1-P1: Reviewable Web MVP Planning and Specification

Accepted when:

- exact route inventory exists
- every route has purpose, data source, actions and boundaries
- `normal_allowed`, `needs_review` and `rejected` are specified
- invalid age and consent states are specified
- `needs_review` and `rejected` cannot reach purchase
- final confirmation content is fully specified
- sample report and fixture result are distinguished
- fixture strategy prevents real personal information and fake evidence
- legal/contact review presentation is truthful
- design brief is specific to 月の返事
- accessibility and responsive requirements exist
- implementation is split into bounded one-commit slices
- material Human decisions are explicit
- no route, page, component, API or integration is implemented
- no provider inquiry is sent
- no operator personal information is added
- package files remain unchanged
- next task after acceptance is the first approved M1 implementation slice only

---

## Task M1-P1-R1: UI/UX Decision Alignment

Accepted when:

- the emotional objective includes reducing anxiety and restoring user agency
- vertical-scroll LP direction and section order are documented
- LP and request form remain separate
- CTA, price, one-shot and no-auto-renew clarity are required
- initial MVP input is text-only
- conversation copy-paste and anonymization guidance are specified
- image upload is explicitly post-MVP
- free full reading and ad-supported free reading are excluded from the initial MVP
- sample report is the primary free experience
- send, light-send, wait and do-not-send outputs include timing, conditions and interim action
- Web鑑定ノート and 保存用鑑定書 are separate presentation products
- `/review/save-report/result-normal-001` is included in planning
- save preview is not a screenshot or compressed full Web report
- exact file format and page count remain deferred
- Safety before payment remains controlling
- post-payment unfulfillable states require future refund/operator handling
- no provider refund capability is invented
- the review banner uses the approved two-level wording
- The Pattern is recorded as UX inspiration only, without copying
- M1-I1 through M1-I6 are aligned but remain unauthorized
- no application implementation is added
- package files remain unchanged
- next task after acceptance remains M1-I1 only after separate Human authorization

Task M1-P1 and Task M1-P1-R1 require final Human acceptance together. Completion of documentation alignment does not satisfy that acceptance gate by itself.

---

## Historical Stage 5–8 Criteria — Superseded as Current Sequencing

The criteria below are preserved as historical implementation-planning records. They do not authorize work and do not override the Milestone 1–9 order in `docs/ROADMAP.md` and `docs/phase1/IMPLEMENTATION_WBS.md`.

### Historical Stage 5: Payment

Accepted when:

- Only normal_allowed requests can start payment
- Payment success is verified
- Failed payment does not trigger generation
- Mock payment is clearly dev-only
- No subscription/coin system exists

---

### Historical Stage 6: AI Generation

Accepted when:

- Judgment generation runs before full diagnosis
- Full diagnosis follows approved 月の返事 structure
- Dangerous cases cannot generate normal diagnosis
- Failures are handled safely
- Outputs do not guarantee reply/love/reconciliation

---

### Historical Stage 7: Result Page + Email

Accepted when:

- Result page is accessible by unguessable token
- Result displays full diagnosis
- Result URL is emailed or logged in dev
- Feedback CTA is visible
- No private data is exposed publicly

---

### Historical Stage 8: Feedback + Metrics

Accepted when:

- Feedback can be submitted
- Feedback is stored
- Metrics can be summarized
- No fake sales/evaluation data is added

---

### Historical Public MVP Launch Gate

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
