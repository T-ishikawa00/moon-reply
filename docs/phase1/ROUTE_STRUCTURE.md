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

Legacy/review compatibility classification:

- This route name is retained only to represent the historical M1/review stop state implemented by the existing code.
- The route name is not current Purchase authority and does not define the current server-owned eligibility contract.
- Any Customer-facing presentation must explain semantically that ordinary paid-assessment eligibility was not established; no internal historical enum should be exposed as current product state.
- No AI romantic diagnosis or Payment is available from this legacy/review representation.

### `/checkout`

Purpose:

- Start Payment only when the current server-owned eligibility result establishes `purchaseGateSatisfied=true`

Note:

- May be placeholder during development
- Public MVP requires verified payment flow
- Browser, client, localStorage, or arrival at this route cannot establish Purchase authority

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
