# ROUTE_STRUCTURE.md

## 0. Purpose

This document defines the route structure for the Phase 1 automated public MVP.

---

## 1. Public Routes

### `/`

Purpose:

- One-page LP
- Explain 月の返事
- Show samples
- Show price
- Show flow
- Show safety notes
- CTA to request form

### `/request`

Purpose:

- Self-hosted diagnosis request form
- Collect relationship/message/context information
- Collect safety screening answers
- Collect consent
- Submit request

### `/request/rejected`

Purpose:

- Show message when normal diagnosis cannot be provided
- Explain that dangerous consultations are not handled as normal romantic diagnosis
- No AI romantic diagnosis
- No payment

### `/checkout`

Purpose:

- Start payment for normal_allowed requests

Note:

- May be placeholder during development
- Public MVP requires verified payment flow

### `/checkout/success`

Purpose:

- Handle successful payment redirect
- Public MVP should verify payment before generation
- Trigger or confirm diagnosis generation

### `/result/[token]`

Purpose:

- Display generated diagnosis result
- Token must be unguessable or equivalent protection
- Show full diagnosis
- Show saveable memo/card copy
- Show emotional tags
- Show feedback CTA

### `/feedback/[token]`

Purpose:

- Collect feedback after result delivery

---

## 2. Internal/API Routes Draft

Potential API routes:

- `POST /api/diagnosis/request`
- `POST /api/diagnosis/safety-check`
- `POST /api/payment/create`
- `POST /api/payment/webhook`
- `POST /api/diagnosis/generate-judgment`
- `POST /api/diagnosis/generate-result`
- `POST /api/email/send-result`
- `POST /api/feedback`

Note:

API route naming may change during implementation.

---

## 3. Routes Not in MVP

Do not create:

- `/login`
- `/signup`
- `/mypage`
- `/dashboard`
- `/history`
- `/subscription`
- `/coins`
- `/admin` full panel

Basic operational visibility should use Supabase or minimal logs at first.
