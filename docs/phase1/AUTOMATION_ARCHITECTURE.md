# AUTOMATION_ARCHITECTURE.md

## 0. Purpose

This document defines the high-level automation architecture for the Phase 1 public MVP.

No implementation is included in this document.

---

## 1. Recommended Stack

Recommended stack:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API
- Payment provider
- Email sending service
- Vercel

---

## 2. Main Components

### LP

Purpose:

- Explain 月の返事
- Show diagnosis samples
- Convert visitors to diagnosis request form

### Diagnosis Request Form

Purpose:

- Collect enough information for diagnosis
- Avoid unnecessary personal information
- Collect consent
- Run safety screening

### Safety Screening

Purpose:

- Block or flag dangerous consultations before payment and normal diagnosis

Possible outcomes:

- normal_allowed
- needs_review
- rejected

### Payment

Purpose:

- Charge ¥980 for normal diagnosis request

Required behavior:

- Payment starts only after normal eligibility is confirmed
- Payment success triggers diagnosis generation
- Payment failure does not trigger generation

### AI Judgment Generation

Purpose:

- Produce structured judgment before full diagnosis

Possible judgments:

- 送っていい
- 軽く送るならあり
- 今夜は待つ
- 今日は送らない方がいい
- 通常鑑定不可

### AI Diagnosis Generation

Purpose:

- Generate full diagnosis using 月の返事 tone and approved golden samples as quality anchors

### Result Page

Purpose:

- Display full diagnosis
- Display saveable memo/card copy
- Display emotional tags
- Provide feedback link

### Email Notification

Purpose:

- Send result URL to the user
- Include disclaimer
- Include feedback link

### Feedback Collection

Purpose:

- Collect satisfaction, save intent, repeat intent, price perception, and ChatGPT comparison

---

## 3. Automation Flow

```text
LP
↓
Diagnosis request form
↓
Safety screening
↓
If rejected: show cannot-provide-normal-diagnosis message
↓
If normal_allowed: payment
↓
Payment success
↓
AI judgment generation
↓
AI diagnosis generation
↓
Quality guard / validation
↓
Save diagnosis result
↓
Generate result URL
↓
Send email
↓
User reads result
↓
User submits feedback
```

---

## 4. Guardrails

The system must not:

- Generate normal romantic diagnosis for dangerous cases
- Encourage stalking, waiting outside, monitoring, coercion, or threats
- Guarantee reply, love, reconciliation, or desired outcome
- Present AI output as medical advice, counseling, or legal advice
- Store unnecessary personal identifiers
- Expose result pages publicly without an unguessable token or equivalent protection

---

## 5. Development vs Public Behavior

Development behavior:

- Payment can be mocked
- AI can be mocked
- Email can be logged
- Admin can inspect database directly
- Manual QA can approve sample outputs

Public behavior:

- Normal flow should be automatic
- Payment success should trigger generation
- Result URL should be sent automatically
- Dangerous cases should not proceed to normal paid diagnosis
