# P6-I2-R1 Pre-Payment Safety UX — Human Visual/Product Review Checklist

Status: `pending_human_visual_product_review`

Automated validation establishes structure and fail-closed behavior only. It does not establish Human Product acceptance or final JPY980 readiness.

## Required viewports and input modes

- [ ] Desktop width: customer Request flow and all 11 review fixtures
- [ ] 399px width: no horizontal clipping, readable radio labels, usable actions
- [ ] 320px width: no horizontal clipping, single-column controls, readable price and payment copy
- [ ] Keyboard only: Phase 1 through final payment-absent confirmation
- [ ] Visible focus: every radio, checkbox, disclosure, link, and button
- [ ] Screen reader names: radio groups and result headings are unambiguous
- [ ] Result semantics: ordinary/clarification results use status; urgent Safety and local API failure use alert
- [ ] 200% zoom: content reflows without overlap or hidden controls
- [ ] Reduced motion: no required information depends on animation
- [ ] Stop/clarification focus: focus moves to the result heading and is not trapped

## Product review A–J

- [ ] A. Does the utilization check feel understandable rather than frightening?
- [ ] B. Are ordinary customers likely to know which contact-boundary state to choose?
- [ ] C. Is the assistance-goal question understandable, with unusual goals available but not promoted?
- [ ] D. Does pause-assessment disclosure make the planned JPY980 value clear despite no draft?
- [ ] E. Does boundary-support-only feel useful and intentional rather than punitive or degraded?
- [ ] F. Is the unsafe-assistance stop firm without accusing or labeling the customer?
- [ ] G. Is urgent Safety clearly different from ordinary relationship anxiety, without invented hotline or diagnosis?
- [ ] H. Is the professional-scope stop understandable, with a clear nonprofessional organization alternative?
- [ ] I. Are clarification screens short enough, bounded to one completed submission, and clear about editing source input?
- [ ] J. Does the final payment-unavailable confirmation coherently show scope, draft availability, Product value, and planned price?

## Fixture coverage

- [ ] `/review/purchase/safety/eligible-general`
- [ ] `/review/purchase/safety/eligible-pause-assessment`
- [ ] `/review/purchase/safety/eligible-boundary-support-only`
- [ ] `/review/purchase/safety/eligible-scoped-reply`
- [ ] `/review/purchase/safety/eligible-business-only`
- [ ] `/review/purchase/safety/needs-clarification`
- [ ] `/review/purchase/safety/boundary-state-conflict`
- [ ] `/review/purchase/safety/blocked-unsafe-assistance`
- [ ] `/review/purchase/safety/urgent-safety-redirect`
- [ ] `/review/purchase/safety/unsupported-professional-request`
- [ ] `/review/purchase/safety/purchase-gate-ready-payment-absent`

## Acceptance boundary

- Human visual/Product review remains pending.
- Payment Provider, payment session, and payment authority remain absent.
- Provider / DB / Supabase operations remain `0 / 0 / 0`.
- Runtime remains Active v4; v12 remains inactive.
- Package E-C, Package F, Provider rerun, PR, main merge, and release remain unauthorized.
