# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P6-I2-R3 Review

Status: `customer_boundary_phrase_parity_corrected_pending_human_regression_review`

Baseline: `e96ae3a722fc92f25da9c4a7bc5e0f411b71b390`

Branch: `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i2-r3-boundary-phrase-parity`

## TECHNICAL

### Blocking mismatch and correction

Human live-flow review found one blocking source-parity defect. The Customer UI presents `少し時間を置いてほしいと言われている` as `temporary_pause`, but the deterministic server hint detector did not recognize that Product phrase. When the structured selection was `explicit_no_contact`, the engine therefore reached `eligible_boundary_support_only` instead of returning `needs_clarification`.

The server detector now recognizes these Customer-language temporary-pause equivalents:

- `少し時間を置いてほしい`
- `時間を置いてほしい`
- `少し距離を置きたい`
- `少し距離を置いてほしい`
- `しばらく距離を置きたい`
- `しばらく連絡を控えたい`

For `currentSituation`, these phrases become partner-boundary evidence only when the phrase is tied to reported speech such as `と言われた`, `と言われている`, or `と伝えられた`. For `latestInboundMessage`, the text is direct source evidence and does not require that framing.

An explicit customer-owned statement such as `私は少し距離を置きたいと思っています` is not converted into a partner boundary. If the same pause wording appears in `currentSituation` without reported-other-person or explicit customer ownership, the engine fails closed to `needs_clarification` with `boundary_state_conflict`.

`temporary_pause`, `explicit_no_contact`, and `relationship_closed` remain separate states. The correction does not reinterpret `少し時間を置いてほしい` as `もう連絡しないで`.

### Regression evidence

The new Customer boundary phrase suite passes `19/19`, including all six declared paraphrase families, direct inbound evidence, matching and conflicting structured states, explicit customer ownership, ambiguous ownership, explicit no-contact, and relationship closure.

The exact Human-discovered fixture is recorded as `HUMAN-P6-I2-BOUNDARY-01`:

```text
currentSituation:
連絡状況:
少し時間を置いてほしいと言われている

手伝ってほしいこと:
状況や気持ちを整理し、今後の方向性を知りたい

contactBoundaryState:
explicit_no_contact
```

Its deterministic result is `needs_clarification`; `requiredClarificationCodes` is exactly `boundary_state_conflict`.

All existing classification expectations remain unchanged at `144/144`. The accepted historical P6-I1-R3 verifier remains `42/42`; the successor verifier additionally enforces the current `6/6` path scope and the new `19/19` suite. Decision Policy remains `40/40`.

### Exact scope and protected authority

This correction updates exactly 6/6 pre-existing paths: the deterministic rules, safety cases, offline results, capabilities, the dedicated verifier, and this review report. No path is added.

`RequestForm.tsx`, `PrePaymentSafetyStop` UI/CSS, review fixtures/UI, Safety types, identity, Gate, purchase state machine, internal API, Charter, Runtime, Pipeline, payment, Provider, DB, and Supabase are unchanged. This is not a UI task.

Payment implementation/session/authority: `false / false / false`

Provider / DB / Supabase: `0 / 0 / 0`

Active Runtime: `v4`; v12: `inactive`

### Review state

- Automated phrase-parity evidence: `pass`
- Existing 144 classification expectations: `pass_unchanged`
- `HUMAN-P6-I2-BOUNDARY-01`: `added_and_automated_pass`
- Human regression review: `pending`
- Phase 2 customer presentation review inherited from R2: `pending_r2_human_visual_review`
- Payment authority issued: `false`
- Final JPY980 readiness: `false`

Automated PASS does not convert the pending Human regression or Product review into acceptance.

## PLAIN-LANGUAGE

### What changed for the customer

The screen and its wording did not change. The server now understands the same everyday pause wording already shown on the screen.

If a customer says the other person asked for some time or distance but selects `連絡しないでと言われている`, the service no longer treats those answers as consistent. It asks the customer to correct or confirm the contact situation before proceeding.

If the customer says `私は少し距離を置きたい`, that is treated as the customer's own wish, not as proof that the other person requested a pause. If it is unclear whose wish the phrase describes, the service asks for clarification instead of guessing.

### What did not change

A request for temporary space is still different from a complete no-contact request or the end of a relationship. Existing urgent, unsafe, professional-scope, payment, and purchase-gate behavior is unchanged.

No payment occurs. No Provider, OpenAI, DB, or Supabase operation runs. Runtime v4 remains active and v12 remains inactive.

### Human regression target

Repeat the live-flow case `HUMAN-P6-I2-BOUNDARY-01`. The expected customer-visible behavior is a contact-situation clarification, not eligibility. Also confirm that selecting the matching temporary-pause option proceeds without a boundary conflict and that an explicitly customer-owned wish does not create a partner-boundary warning.

## INHERITED R2 REVIEW RECORD

The following baseline evidence and pending review states remain authoritative and are not replaced by this server-only correction.

### Phase 2 customer presentation

The Phase 2 customer heading is `鑑定前の確認`; the phase navigation label remains `利用確認`. One compact intro replaces the duplicated Product/Safety explanation. Internal Safety terminology is not added to the customer surface.

All nine `contactBoundaryState` enum values remain selectable, but no longer have equal visual priority:

- Primary: `no_restriction_known`, `temporary_pause`, `explicit_no_contact`, `channel_restricted`, `relationship_closed`
- Secondary disclosure `その他の連絡状況はこちら`: `business_only`, `new_inbound_after_boundary`, `unknown`
- Separate secondary Safety entry: `urgent_safety`

The urgent entry does not put detailed self-harm or violence language in the ordinary contact list. Selecting it still submits `contactBoundaryState=urgent_safety`; server free-text urgent detection and the accepted urgent stop remain unchanged.

Short contact-state labels are visually primary and helper copy is secondary. The three primary assistance goals remain visible. Unsafe, professional, and urgent goals remain in the existing secondary assistance disclosure and are not promoted. The CTA is `この内容で確認する`.

### Product value and fixture parity

`eligible_pause_assessment` presents a concrete assessment note: what can be checked now, why not to send now, what can be done tonight, and the conditions for reassessment. It does not imply a future reply guarantee. The mandatory pause acknowledgement and server-owned purchase-gate semantics are unchanged.

`eligible_boundary_support_only` frames the Product as organizing feelings and the next self-directed step without repeated contact. Its delivery contract remains strict: no message draft and no recontact method.

The live RequestForm renders each Product's `provides` list. The `eligible-pause-assessment` and `eligible-boundary-support-only` review fixtures use the same `scopeLabel`, `heading`, `description`, `provides`, and `draftAvailability` strings as RequestForm. Review-only banners and metadata remain isolated in the unchanged review component.

### R2 Human review status

- Phase 1 Request UX: `human_visual_accepted`
- Blocked unsafe stop: `human_visual_accepted`
- Urgent Safety stop: `human_visual_accepted`
- Phase 2 customer presentation: `pending_r2_human_visual_review`
- Pause Product value presentation: `pending_r2_human_visual_review`
- Boundary-support Product value presentation: `pending_r2_human_visual_review`
- P6-I2 overall: `pending_human_visual_product_review`
- Package E-C: `unauthorized`
- Final JPY980 readiness: `false`

### Codex responsive spot-check evidence

- Desktop 1280px: both pause and boundary Product fixtures render the exact copy, four-item provides lists, draft availability, planned price, and disabled payment control without horizontal overflow.
- 399px: Phase 2 reports `innerWidth=399`, `scrollWidth=384`, five primary contact cards, two collapsed secondary disclosures, and no horizontal overflow.
- 320px: Phase 2 reports `innerWidth=320`, `scrollWidth=305`, 247px contact cards, visible short-label/helper hierarchy, and no horizontal overflow.
- 200% effective desktop reflow: a 1280px desktop's 640px CSS-width equivalent reports `scrollWidth=625`, no horizontal overflow, and no hidden Phase 2 input, summary, or button.
- DOM semantics expose one contact-state fieldset, native radios, native disclosures, combined accessible label/helper names, and `urgent_safety` as the selected value from the separate urgent entry.

Literal Human browser zoom, keyboard-only traversal, and screen-reader review remain part of `pending_r2_human_visual_review`.

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
