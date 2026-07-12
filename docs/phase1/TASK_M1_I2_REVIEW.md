# TASK_M1_I2_REVIEW.md

## Status

Task M1-I2 Request Confirmation and Safety Review States was implemented, automatically validated, and accepted by Human at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`.

## Base commit

`dd031183dd347493fd5619f1b0d8bb355fc93560`

The task started from a clean working tree with `HEAD` and `origin/main` equal to the base commit.

## Human acceptance of M1-I1

Human accepted M1-I1 at commit `dd031183dd347493fd5619f1b0d8bb355fc93560` and explicitly authorized M1-I2.

## Human acceptance of M1-I2

Human visually reviewed and accepted M1-I2 at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1`, then explicitly authorized M1-I3 Final Purchase Confirmation Without Payment. M1-I4 remains unauthorized.

## Human three-step decision

Human selected a three-step request flow. Human also replaced per-item acknowledgement checkboxes with one visible five-item list followed by exactly one required, unchecked checkbox labeled `上記の内容をすべて確認し、同意します`.

Refund conditions, delivery-completion treatment, and transaction-specific acceptance remain outside M1-I2. Marketing/newsletter consent is not added or bundled.

## Implemented public flow

`/request` now presents `1 / 3`, `2 / 3`, and `3 / 3` progress states, validates the current step before forward movement, and retains entered values in React memory while moving backward and forward. Refresh may reset the form; no draft-saving claim is made.

## Step field mapping

- Step 1 `あなたと相手の状況`: age group, nickname, relationship, relationship status, reply-wait duration.
- Step 2 `実際のやり取りと今夜の相談`: last partner message, last own message, draft message, recent flow, main concern, desired action, main question, send-tonight intent.
- Step 3 `受け取り・安全確認・同意`: email, Safety selected flags, visible acknowledgement list, one unified required checkbox.

## Validation behavior

Only the current step is validated before `次へ`. Final confirmation validates Step 3, rejects contradictory Safety selection, requires the unified acknowledgement, and permits confirmation only when classification is `normal_allowed`. The validation message is `上記の内容を確認し、同意してください。`. The first relevant invalid control receives focus/scroll treatment and existing values are preserved.

## Normal confirmation behavior

The local confirmation groups the summary by all three steps, provides correction controls for each step, displays `同意事項：確認済み`, and does not list acknowledgements as separately checked. It states that no external submission, data save, payment start, or AI generation occurred. No purchase or report link exists.

## Safety stop-state behavior

- `normal_allowed`: may reach local request confirmation.
- `needs_review`: stops before ordinary confirmation, purchase, or report.
- `rejected`: stops calmly without accusation, romance encouragement, or invented hotline.
- contradictory selection: identifies the conflict and returns to Step 3.
- invalid age: fails closed and returns to Step 1 without adding an under-18 public option.
- missing consent: returns to the single acknowledgement in Step 3.
- unknown/error: fails closed without default fixture fallback.

Existing Safety vocabulary, classification rules, and severity are unchanged. User-facing Safety copy removes the M1-I2 refund implication.

## Review fixtures

Typed fictional fixtures are defined in `fixtures/review/requests.ts` and `fixtures/review/safety-states.ts`. All email addresses use the reserved `.invalid` domain. Only documented request fixture IDs are allowlisted.

## Review routes

- `/review/request/normal-allowed`
- `/review/request/needs-review`
- `/review/request/rejected`
- `/review/request/contradictory-selection`
- `/review/request/invalid-age`
- `/review/request/missing-consent`
- `/review/request/unknown-error`
- `/review/request/confirmation/normal-001`

Unknown state or confirmation IDs fail closed and never select the first/default fixture.

## Public copy cleanup

Public `/request` copy no longer exposes `Stage 2`, `Stage 4`, `このStage`, implementation status, internal task labels, or technical Safety reason codes. It explains text-only copy/paste, manual anonymization, no screenshot/image upload, no automatic masking, non-guarantee, local-only behavior, and Safety-before-future-payment.

## Accessibility

The flow uses semantic fieldsets and legends, explicit labels, visible focus styles, `aria-invalid`, error descriptions, alert/status roles, keyboard-operable controls, one large checkbox target, and text labels in addition to color.

## Responsive behavior

The flow uses single-column mobile layouts, full-width mobile controls, wrapping summaries, and responsive grids intended for approximately 320px, 390px, tablet, and desktop widths without horizontal scrolling. Human visual confirmation remains pending.

## Files changed

- `app/request/page.tsx`
- `app/review/page.tsx`
- `app/review/request/[stateId]/page.tsx`
- `app/review/request/confirmation/[fixtureId]/page.tsx`
- `components/request/RequestForm.tsx`
- `components/review/ReviewRequestConfirmation.tsx`
- `components/review/ReviewRequestState.tsx`
- `fixtures/review/requests.ts`
- `fixtures/review/safety-states.ts`
- `docs/CODEX_HANDOFF.md`
- `docs/CURRENT_FOCUS.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/TASK_M1_I1_REVIEW.md`
- `docs/phase1/TASK_M1_I1_R1_REVIEW.md`
- `docs/phase1/TASK_M1_I2_REVIEW.md`

## Validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run build`: passed and generated all 13 static/SSG pages. The first restricted run hit environment-level `EPERM` on `.next/trace`; the permitted rerun passed.
- `git diff --check`: passed.
- Required HTTP routes `/`, `/request`, `/review`, all seven request-state routes, and `/review/request/confirmation/normal-001`: HTTP 200.
- Unknown `/review/request/not-allowlisted`: HTTP 200 fail-closed copy, with no normal-confirmation copy.
- Unknown `/review/request/confirmation/rejected-001`: HTTP 200 fail-closed copy, with no normal-confirmation copy.
- Public Stage-copy search: no match.
- Required state coverage search: all requested state/route vocabulary present.
- Runtime integration search: no implementation match; one historical sentence in `lib/data/README.md` mentions future API/server-action work only.
- File/image/OCR implementation search: no match.
- Removed refund acknowledgement search across public request/Safety copy: no match.
- Package and `supabase` diffs: empty.
- `next-env.d.ts`: unchanged.
- `lib/safety` has no diff. Classifier rules, messages, selected flags, types, and severity are unchanged; M1-I2-safe user copy is confined to the public/review presentation layer.

## Prohibited work confirmed

M1-I2 added no purchase confirmation, payment/provider control, checkout/webhook/card field, AI/OpenAI call, email sending, Supabase read/write, API route, server action, analytics, deployment, package change, price change, age-choice change, Safety severity change, file/image upload, OCR, automatic masking, report/PDF/image/download/copy/share function, account, subscription, coin/point, or advertising implementation.

## Remaining Human checks

Human completed the M1-I2 visual review and accepted the slice. CodeX visual browser validation was not performed as part of M1-I2.

## Next gate

M1-I2 is accepted and M1-I3 is explicitly authorized. M1-I4 remains unauthorized. Mobile heading polish and favicon remain deferred to M1-I6.
