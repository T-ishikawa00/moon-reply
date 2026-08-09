# P6-I2-R2 Pre-Payment Safety Customer Experience — Human Visual/Product Review Checklist

Status: `pending_human_visual_product_review`

Automated validation establishes presentation structure, fixture parity, and preserved fail-closed behavior only. It does not establish R2 Human Product acceptance or final JPY980 readiness.

## Recorded Human review status

- Phase 1 Request UX: `human_visual_accepted`
- Blocked unsafe stop: `human_visual_accepted`
- Urgent Safety stop: `human_visual_accepted`
- Phase 2 customer presentation: `pending_r2_human_visual_review`
- Pause Product value presentation: `pending_r2_human_visual_review`
- Boundary-support Product value presentation: `pending_r2_human_visual_review`
- P6-I2 overall: `pending_human_visual_product_review`
- Package E-C: `unauthorized`
- Final JPY980 readiness: `false`

The accepted Phase 1 and stop surfaces are regression references, not reopened review scope. Their customer copy and behavior must remain unchanged.

## Required R2 viewports and input modes

- [ ] Desktop width: Phase 2 progressive contact presentation and both eligible Product fixtures
- [ ] 399px width: no horizontal clipping; short labels remain primary and helpers secondary
- [ ] 320px width: no horizontal clipping; disclosures, radios, helpers, and CTA remain usable
- [ ] Keyboard only: primary radios, both disclosures, urgent Safety entry, assistance goals, and CTA
- [ ] Visible focus: every radio, checkbox, disclosure, link, and button
- [ ] Screen reader names: one contact-state question, correctly named radios, and unambiguous result headings
- [ ] Result semantics: ordinary/clarification results use status; urgent Safety and local API failure use alert
- [ ] 200% zoom: content reflows without overlap, hidden controls, or a giant equal-priority list
- [ ] Reduced motion: no required information depends on animation
- [ ] Stop/clarification focus regression: focus moves to the accepted result heading and is not trapped

## Product review A–J

- [ ] A. Does `鑑定前の確認` feel like a short Product-fit check rather than a Safety review screen?
- [ ] B. Does the single intro explain the purpose once, without repeated Safety/Product rationale?
- [ ] C. Are the five primary contact states easy to scan, with three uncommon states discoverable under `その他の連絡状況はこちら`?
- [ ] D. Is the urgent Safety entry visibly separate and secondary without requiring ordinary customers to read detailed crisis language?
- [ ] E. Are the three primary assistance goals preserved while unsafe/professional goals remain secondary and unpromoted?
- [ ] F. Does pause assessment make the planned JPY980 value concrete through tonight's actions and reassessment conditions?
- [ ] G. Does boundary support feel useful and nonpunitive while preserving strict no-draft/no-recontact delivery?
- [ ] H. Do RequestForm and the pause/boundary fixtures show the same Product copy with no semantic divergence?
- [ ] I. Are mandatory acknowledgements still clear and impossible to bypass?
- [ ] J. Does the final payment-unavailable confirmation coherently preserve Product scope, draft availability, and planned price?

## R2 fixture coverage

- [ ] `/review/purchase/safety/eligible-pause-assessment`
- [ ] `/review/purchase/safety/eligible-boundary-support-only`

## Regression fixture coverage

- [ ] `/review/purchase/safety/eligible-general`
- [ ] `/review/purchase/safety/eligible-scoped-reply`
- [ ] `/review/purchase/safety/eligible-business-only`
- [ ] `/review/purchase/safety/needs-clarification`
- [ ] `/review/purchase/safety/boundary-state-conflict`
- [ ] `/review/purchase/safety/blocked-unsafe-assistance`
- [ ] `/review/purchase/safety/urgent-safety-redirect`
- [ ] `/review/purchase/safety/unsupported-professional-request`
- [ ] `/review/purchase/safety/purchase-gate-ready-payment-absent`

## Acceptance boundary

- Phase 2, pause Product value, boundary-support Product value, and P6-I2 overall remain pending Human review.
- Payment Provider, payment session, and payment authority remain absent.
- Provider / DB / Supabase operations remain `0 / 0 / 0`.
- Runtime remains Active v4; v12 remains inactive.
- Package E-C, Package F, Provider rerun, PR, main merge, and release remain unauthorized.
