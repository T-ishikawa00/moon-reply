# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I2-R2 Review

Status: `prepayment_safety_customer_experience_refined_pending_r2_human_visual_review`

Baseline: `ddbea5347d0fb2c1cfacd990e9a7f17acaf53801`

Branch: `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i2-r2-customer-experience`

## TECHNICAL

### Exact scope and protected authority

This R2 refinement updates exactly 9/9 pre-existing paths: `RequestForm.tsx`, its existing Safety presentation stylesheet, the P6 review fixtures, four P6 contract/review artifacts, the dedicated P6 verifier, and this review report. No path is added.

The Safety Engine, classifications, enum values, rules, identity, purchase gate, purchase state machine, internal API, Runtime, Pipeline, Provider, DB, Supabase, payment, accepted Charter, and existing M1 review assets are unchanged. The accepted customer stop components are also unchanged:

- `PrePaymentSafetyStop.tsx`: `2c146a032049dedca3a1547c3bcfc52aa66e1fa5`
- `ReviewPrePaymentSafetyConfirmation.tsx`: `d96c311af2d18af370238a7a940185e5576b573a`
- `blocked_unsafe_assistance`: accepted customer copy and behavior preserved
- `urgent_safety_redirect`: accepted customer copy and behavior preserved

### Phase 2 customer presentation

The Phase 2 customer heading is `鑑定前の確認`; the phase navigation label remains `利用確認`. One compact intro replaces the duplicated Product/Safety explanation. Internal Safety terminology is not added to the customer surface.

All nine `contactBoundaryState` enum values remain selectable, but no longer have equal visual priority:

- Primary: `no_restriction_known`, `temporary_pause`, `explicit_no_contact`, `channel_restricted`, `relationship_closed`
- Secondary disclosure `その他の連絡状況はこちら`: `business_only`, `new_inbound_after_boundary`, `unknown`
- Separate secondary Safety entry: `urgent_safety`

The urgent entry does not put detailed self-harm or violence language in the ordinary contact list. Selecting it still submits `contactBoundaryState=urgent_safety`; server free-text urgent detection and the accepted urgent stop remain unchanged.

Short contact-state labels are visually primary and helper copy is secondary. The three primary assistance goals remain visible. Unsafe, professional, and urgent goals remain in the existing secondary assistance disclosure and are not promoted. The CTA is `この内容で確認する`.

### Product value and fixture parity

`eligible_pause_assessment` now presents a concrete assessment note: what can be checked now, why not to send now, what can be done tonight, and the conditions for reassessment. It does not imply a future reply guarantee. The mandatory pause acknowledgement and server-owned purchase-gate semantics are unchanged.

`eligible_boundary_support_only` now frames the Product as organizing feelings and the next self-directed step without repeated contact. Its delivery contract remains strict: no message draft and no recontact method.

The live RequestForm renders each Product's `provides` list. The `eligible-pause-assessment` and `eligible-boundary-support-only` review fixtures use the same `scopeLabel`, `heading`, `description`, `provides`, and `draftAvailability` strings as RequestForm. Review-only banners and metadata remain isolated in the unchanged review component.

### Preserved regression boundary

All five eligible classifications, temporary-pause eligibility, boundary-support eligibility, unsafe stop, urgent stop, professional stop, clarification, stale-input invalidation, server-only eligibility authority, acknowledgements, and attestation remain intact.

Payment implementation/session/authority remain `false / false / false`. Provider / DB / Supabase operations are `0 / 0 / 0`. Active Runtime remains v4 and v12 remains inactive.

### Human review status

- Phase 1 Request UX: `human_visual_accepted`
- Blocked unsafe stop: `human_visual_accepted`
- Urgent Safety stop: `human_visual_accepted`
- Phase 2 customer presentation: `pending_r2_human_visual_review`
- Pause Product value presentation: `pending_r2_human_visual_review`
- Boundary-support Product value presentation: `pending_r2_human_visual_review`
- P6-I2 overall: `pending_human_visual_product_review`
- Package E-C: `unauthorized`
- Final JPY980 readiness: `false`

Automated PASS and Codex responsive spot-checks do not convert these pending Human/Product states into acceptance.

### Codex responsive spot-check evidence

- Desktop 1280px: both pause and boundary Product fixtures render the exact copy, four-item provides lists, draft availability, planned price, and disabled payment control without horizontal overflow.
- 399px: Phase 2 reports `innerWidth=399`, `scrollWidth=384`, five primary contact cards, two collapsed secondary disclosures, and no horizontal overflow.
- 320px: Phase 2 reports `innerWidth=320`, `scrollWidth=305`, 247px contact cards, visible short-label/helper hierarchy, and no horizontal overflow.
- 200% effective desktop reflow: a 1280px desktop's 640px CSS-width equivalent reports `scrollWidth=625`, no horizontal overflow, and no hidden Phase 2 input, summary, or button.
- DOM semantics expose one contact-state fieldset, native radios, native disclosures, combined accessible label/helper names, and `urgent_safety` as the selected value from the separate urgent entry.

Literal Human browser zoom, keyboard-only traversal, and screen-reader review remain part of `pending_r2_human_visual_review`.

## PLAIN-LANGUAGE

### What changed for the customer

The second step now reads like a short pre-assessment confirmation instead of a Safety examination. It explains once that the assessment may conclude `今は送らない`, then asks only what is needed to determine whether the consultation can be handled.

Customers first see five common contact situations. Less common business-only, new-inbound, and unknown situations are available under one disclosure. An urgent Safety situation has its own secondary entry, separate from ordinary relationship-contact choices.

The pause Product now says concretely what the customer receives tonight even when no message draft is appropriate. The boundary-support Product avoids punitive wording and explains that the assessment will organize knowns, unknowns, feelings, and next self-directed steps without providing a draft or a way to contact the other person again.

### What did not change

Unsafe-method requests still stop. Current urgent Safety still stops with the accepted safety-first guidance. Professional judgment requests still stop. Server authority, input invalidation, acknowledgements, and the no-payment state are unchanged.

No payment occurs. No Provider, OpenAI, DB, or Supabase operation runs. The planned `税込980円` display is not final JPY980 readiness.

### R2 Human review targets

- Request Phase 2 at desktop, 399px, 320px, keyboard-only, screen-reader naming, and 200% zoom
- `/review/purchase/safety/eligible-pause-assessment`
- `/review/purchase/safety/eligible-boundary-support-only`

### Full regression fixture URLs

- `/review/purchase/safety/eligible-general`
- `/review/purchase/safety/eligible-pause-assessment`
- `/review/purchase/safety/eligible-boundary-support-only`
- `/review/purchase/safety/eligible-scoped-reply`
- `/review/purchase/safety/eligible-business-only`
- `/review/purchase/safety/needs-clarification`
- `/review/purchase/safety/boundary-state-conflict`
- `/review/purchase/safety/blocked-unsafe-assistance`
- `/review/purchase/safety/urgent-safety-redirect`
- `/review/purchase/safety/unsupported-professional-request`
- `/review/purchase/safety/purchase-gate-ready-payment-absent`

The accepted Phase 1, blocked unsafe stop, and urgent Safety stop are regression locks. The new Phase 2 and Product-value presentation remain pending Human visual/Product review.
