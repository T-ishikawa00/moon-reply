# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I2-R1 Review

Status: `prepayment_safety_ux_implemented_pending_human_visual_product_review`

Baseline: `91efbf1ef14a27fb21d24f12baeb8196d6113cf0`

## TECHNICAL

### Scope and isolation

The implementation is exactly 12 paths: one existing `RequestForm.tsx` update and 11 new P6 UX/review/evidence paths. The legacy M1 `ReviewPurchaseConfirmation.tsx` and `fixtures/review/purchase-confirmations.ts` are not imported, wrapped, modified, or repurposed. Their accepted blobs remain `5f77c298639a78d3c9d0d3c7dc987f32f806ae5a` and `ec22a26bd3df38781b029db8e0e646e2d4db8d0d`.

The new review component is `ReviewPrePaymentSafetyConfirmation.tsx`, backed only by `prepayment-safety-states.ts`, and routed at `/review/purchase/safety/[fixtureId]`.

### Server-owned utilization check

`RequestForm` no longer imports `classifySafetyInput`, `SAFETY_SELECTED_FLAGS`, `NONE_SAFETY_FLAG`, or `@/lib/safety`. It sends the preserved free-text-first request to `POST /api/internal/purchase-eligibility` with exact relationship/topic mappings, `partnerMessage => latestInboundMessage`, and `draftMessage => optionalMessage` without combining them.

The first request sends scope acknowledgements and attestation as false. The UI renders only gates returned by the server and resubmits the current complete input. Phase 2 to Phase 3 and the final payment-absent confirmation each require a fresh server result with an eligible classification and `purchaseGateSatisfied=true`. The client validates but discards `eligibilityInputHash`; it neither stores nor reuses it.

Every bound-input mutation invalidates the prior result and increments a request sequence so a late stale response cannot restore an eligible state. API unavailability, non-200 status, or an unexpected response fails closed with calm customer copy and no internal error code.

### Customer states

- General: ordinary assessment with the common anti-circumvention attestation.
- Pause assessment: remains purchasable in principle; the paid Product is the full assessment note even when no draft is shown.
- Boundary support only: remains purchasable in principle; provides facts, emotional organization, and boundary-respecting direction, with no draft or recontact strategy.
- Scoped reply: latest inbound subject only; no broader contact permission is created.
- Business only: explicitly permitted practical subject only; private or romantic expansion cannot proceed.
- Clarification: structured only from server-required codes, one completed submission maximum, then fail closed if unresolved.
- Unsafe assistance: calm stop with an optional switch to emotional organization followed by full server reclassification.
- Urgent Safety: distinct urgent stop with no relationship strategy or switch to an ordinary assessment.
- Professional request: scope stop with an optional switch to nonprofessional organization followed by full server reclassification.

### Payment and external authority

The final confirmation shows the selected Product scope, what the assessment provides, draft availability, and planned price `税込980円`. Its CTA is disabled and states: `決済機能は現在準備中です。この画面では料金は発生しません。`

Payment Provider/session/authority are `false / false / false`. Provider / DB / Supabase operations are `0 / 0 / 0`. Active Runtime remains v4 and v12 remains inactive. No Provider, LUNA, OpenAI, database, Supabase, checkout, payment session, payment token, persistence, email delivery, or assessment generation is executed by this implementation.

### Automated verification boundary

The dedicated verifier covers exact baseline/branch/scope, protected blobs, legacy Safety isolation, accepted Engine preservation, 20 deterministic UX cases, both acknowledgement gates, stale-result invalidation, internal-code non-rendering, payment absence, external-operation absence, and Runtime selection. P6-I1-R3 classification coverage remains `42/42 + 36/36 + 30/30 + 20/20 + 16/16 = 144/144`; Decision Policy remains `40/40`.

The historical P6-P0 branch-lock verifier is not a successor acceptance gate. Human visual/Product review remains pending and is not implied by automated PASS.

## PLAIN-LANGUAGE

### What a normal customer sees

The customer first writes the same free-text consultation, relationship, requested topics, optional inbound message, optional draft, nickname, adult confirmation, and privacy-aware information as before. The second step is now called `決済前の利用確認`. They select the current contact situation and what they want help with, then the server decides which Product scope is allowed.

If the content is ordinary, the customer sees that it can be checked as a normal assessment. If a pause has been requested, they are told that `今は送らない` may be the answer and that the reasons, present action, and reassessment condition are still the paid assessment note. If an explicit boundary exists, they are told that no message draft or recontact method will be provided, while a useful boundary-respecting assessment note remains available in principle.

Clarification appears only when the server needs a specific missing or conflicting fact. It is calm, limited to one completed submission, and points back to the original contact selection or source text rather than guessing eligibility.

Unsafe-method requests receive a firm, non-accusatory stop and may switch to emotional organization before a full new server check. Current urgent Safety receives a distinct safety-first stop without relationship strategy. Professional legal, medical, contract, or money judgment receives an out-of-scope stop and may switch only to nonprofessional emotional or situational organization before a full new check.

No payment occurs. The final view shows planned `税込980円`, but the button is disabled. No LUNA, Provider, OpenAI, DB, or Supabase operation runs.

### Review fixture IDs and URLs

- `eligible-general` — `/review/purchase/safety/eligible-general`
- `eligible-pause-assessment` — `/review/purchase/safety/eligible-pause-assessment`
- `eligible-boundary-support-only` — `/review/purchase/safety/eligible-boundary-support-only`
- `eligible-scoped-reply` — `/review/purchase/safety/eligible-scoped-reply`
- `eligible-business-only` — `/review/purchase/safety/eligible-business-only`
- `needs-clarification` — `/review/purchase/safety/needs-clarification`
- `boundary-state-conflict` — `/review/purchase/safety/boundary-state-conflict`
- `blocked-unsafe-assistance` — `/review/purchase/safety/blocked-unsafe-assistance`
- `urgent-safety-redirect` — `/review/purchase/safety/urgent-safety-redirect`
- `unsupported-professional-request` — `/review/purchase/safety/unsupported-professional-request`
- `purchase-gate-ready-payment-absent` — `/review/purchase/safety/purchase-gate-ready-payment-absent`

Human should inspect desktop, 399px, 320px, keyboard-only operation, visible focus, screen-reader names, result status/alert semantics, 200% zoom, reduced motion, and whether pause/boundary-only Product value remains credible without a draft. Product questions A–J are recorded in `visual-review-checklist-v1.md` and remain pending.
