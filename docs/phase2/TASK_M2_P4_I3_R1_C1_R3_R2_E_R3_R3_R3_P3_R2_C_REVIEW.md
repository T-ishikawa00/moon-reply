# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-C Review

## Current R2-C finding

- R2-C preparation commit: d28fdf37f3e80f28a927a9f9dcc793cdd26b92e2
- Reviewed R2-B Product snapshot: fa956b9b1941c73f8e1767c64ab24f07fadd36c6
- Visual direction: accepted
- Customer note architecture: accepted
- Draft utility: accepted
- Overall content direction: accepted
- Semantic depth: remediation_required
- Input sufficiency handling: remediation_required
- R2-C overall: remediation_required
- experienceProductJudgment: pending_remediation
- jpy980RuntimeReadiness: not_established
- globalQ0Completion: false
- Formal Human Visual review: PENDING / incomplete

This is not an R2-C PASS. Directional visual acceptance does not complete the formal Human Visual checklist; every unperformed Human Visual item remains PENDING. The successor finding is stored in the R2-C-R1 planning package.

The required remediation is planning-only: an Input Sufficiency Gate, Semantic Depth Contract, case routing, pairwise-separated future packages, and Product re-review acceptance. Product code must not be repaired in this task.

## Preparation-time status

- Task: R2-C Authorized Human Visual / Product Review Preparation
- R2-B review target: `fa956b9b1941c73f8e1767c64ab24f07fadd36c6`
- R2-B Human acceptance: complete
- R2-B acceptance date: `2026-08-16`
- R2-C execution / review preparation: authorized
- R2-C Human Visual verdict: PENDING
- R2-C Human Product verdict: PENDING
- `experienceProductJudgment`: `pending`
- `jpy980RuntimeReadiness`: `not_established`
- `globalQ0Completion`: `false`

Automated layout and interaction evidence below is review preparation only. It is not a Human PASS and does not complete R2-C.

## Authority and immutable target

- R2-A acceptance / R2-B authorization: `1229627588e3c6ccd41ea7ea32751b8b8ac79c6e`
- R2-C branch: `review/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r2-authorized-visual-product`
- Exact parent and immutable Product snapshot: `fa956b9b1941c73f8e1767c64ab24f07fadd36c6`
- `main` / `origin/main`: `61e33a10e195fad17e253a6b9719217e1992f273`
- Historical R2-C reference: `df3c707ec7f567120d28f0ce164ef42916e61c63`, read-only

The historical package contributed the six-artifact review-package structure and review categories. Its Human, ChatGPT, and Product Owner PASS values were not reused. Current Human fields remain null or PENDING.

The following Product implementation remains unchanged from the exact parent:

- `components/runtime/CustomerAssessmentNote.tsx`
- `components/runtime/CustomerAssessmentNote.module.css`
- `components/runtime/CustomerDraftCopyButton.tsx`
- `app/review/runtime/v12/page.tsx`
- `lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts`
- `CustomerAssessmentExperienceProjectionV2`
- `CustomerAssessmentProjectionV1`
- Full structured Report and Production Runtime paths

Problems found during Human review must be recorded as FAIL or `remediation_required`. Product code must not be repaired in this task.

## Exact R2-C preparation scope

Exactly six new files are allowed:

1. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/review-matrix-v1.json`
2. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/human-visual-review-v1.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/product-owner-review-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/capabilities-v1.json`
5. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-visual-product-review.mjs`
6. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_C_REVIEW.md`

No rolling authority document was needed. Scope is `6/6 NEW only`.

## Start the local review surface

From `C:\projects\moon-reply` in PowerShell:

```powershell
$env:M2_INTERNAL_RUNTIME_ENABLED='true'; npm.cmd run dev -- --hostname 127.0.0.1 --port 3102
```

Open:

`http://127.0.0.1:3102/review/runtime/v12`

This is a fixture-only, noindex/nofollow review route. Persistent server availability is not guaranteed; restart it with the command above when necessary.

## Required five cases

| Category | Review URL | Human review focus |
| --- | --- | --- |
| simple | `http://127.0.0.1:3102/review/runtime/v12?fixture=simple_business_reply_with_draft` | 水増しせず短い相談が成立するか、文案をすぐ発見できるか |
| emotional | `http://127.0.0.1:3102/review/runtime/v12?fixture=ordinary_reply_waiting` | 理解と安心があるか、不確実性が不安を煽らないか、重複が適切か |
| null_optional | `http://127.0.0.1:3102/review/runtime/v12?fixture=nullable_optional_sections` | 空sectionがなく、短い構成でも行動と見直し条件が明確か |
| polite_draft | `http://127.0.0.1:3102/review/runtime/v12?fixture=polite_thank_you_with_draft` | 丁寧さ、文案の目立ち方、文案理由と届き方が有用か |
| persona_preserved | `http://127.0.0.1:3102/review/runtime/v12?fixture=kansai_persona_draft` | 方言・改行・絵文字・exact copyが保たれるか |

Fixture IDはreview inputだけであり、Product behaviorの分岐には使用していない。

## Preparation-time technical evidence

The selected browser surface loaded all five cases at 1440 x 1000, 399 x 900, and 320 x 900: 15 page / viewport combinations.

| Check | Technical preparation status | Human status | Evidence boundary |
| --- | --- | --- | --- |
| desktop 1440 | PASS | PENDING | 5 cases; no measured horizontal overflow, note escape, or adjacent primary-content overlap |
| mobile 399 | PASS | PENDING | 5 cases; no measured horizontal overflow or overlap; current answer stacked |
| mobile 320 | PASS | PENDING | 5 cases; no measured horizontal overflow or overlap; persona draft rendered exactly |
| keyboard | PARTIAL | PENDING | native button/details and visible focus observed; end-to-end keyboard activation remains Human review |
| browser zoom 200% | NOT_AUTOMATED | PENDING | selected browser surface did not expose actual zoom control |
| copy success | PASS | PENDING | runtime click produced `コピー済み` and `コピーしました`; external clipboard readback unavailable |
| copy failure | STATIC_ONLY | PENDING | failure branch and live-region recovery copy exist; denied-permission runtime path remains Human review |
| details behavior | PASS | PENDING | one native details, initially closed, opens by pointer; keyboard activation remains Human review |
| reduced motion | STATIC_ONLY | PENDING | reduced-motion CSS removes transitions; browser emulation remains Human review |

Primary section counts observed during preparation were simple 5, emotional 4, null_optional 4, polite_draft 6, and persona_preserved 5. This is evidence that six sections are not treated as a hard minimum. It is not a Product-quality judgment.

## Human review procedure

### PC and mobile

1. Start the server and open each of the five URLs.
2. Review desktop at 1440 CSS pixels wide.
3. Use browser responsive mode at 399 x 900 and then 320 x 900.
4. Check horizontal scrolling, overlap, Japanese wrapping, hierarchy, draft prominence, and whether every visible section has a distinct Product function.

### Keyboard

1. Reload a draft case without using the pointer.
2. Use Tab and Shift+Tab through fixture links, the copy button, and details summary.
3. Confirm visible focus and logical order.
4. Activate copy and details with Enter or Space as appropriate.

### Browser zoom 200%

Set browser zoom to 200%, not only responsive width. Confirm that all content and controls remain reachable, without blocking overlap or two-dimensional scrolling.

### Copy success and failure

1. On `polite_draft` or `persona_preserved`, allow clipboard access and activate copy. Confirm success announcement.
2. Compare the copied draft with the rendered source, including persona, emoji, and line breaks.
3. Deny or block clipboard permission, activate copy again, and confirm the recovery message: `コピーできませんでした。文面を選択してコピーしてください。`

### Details behavior

Confirm details is initially collapsed, communicates its purpose, opens and closes by pointer and keyboard, and keeps expanded content readable at all three widths and 200% zoom.

### Reduced motion

Enable the operating system or browser reduced-motion preference, reload, and confirm that no unexpected transition or motion remains.

## Human Product questions

The preparation-time Product Owner template remains unchanged and PENDING. The current cross-case remediation finding is recorded in the R2-C-R1 successor package and does not fabricate case-by-case answers in the older template. Within that immutable preparation template experienceProductJudgment remains pending; the current successor disposition is pending_remediation.

Record answers only after actual Human review in:

`evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c/product-owner-review-v1.json`

Each case intentionally leaves these values null:

- `personally_understood`
- `emotionally_reassuring_without_false_certainty`
- `amount_of_content_appropriate`
- `semantic_repetition_acceptable`
- `draft_useful_when_present`
- `action_clear`
- `feels_like_paid_assessment_not_ai_answer`
- `plausibly_worth_jpy980`

Do not infer unanswered values. `experienceProductJudgment` remains `pending` until the Human decision is supplied.

## R2-C PASS boundary

The current R2-C disposition is remediation_required, so this boundary has not been reached.

Even if a later Human Product review passes, the maximum meaning is:

`experienceProductJudgment = plausibly_worth_jpy980`

It does not establish Provider quality, JPY980 Runtime readiness, Global Q0, Runtime activation, Production Runtime, Payment readiness, or main integration.

- `jpy980RuntimeReadiness = not_established`
- `globalQ0Completion = false`
- `providerQualityEstablished = false`
- `activeRuntimeActivationAuthorized = false`
- `productionRuntimeAuthorized = false`
- `paymentImplementationAuthorized = false`
- `productionPaymentAuthorized = false`
- `mainIntegrationAuthorized = false`
- Provider / DB / Supabase: `0 / 0 / 0`

## Automated validation

Before the single preparation commit, run:

1. R2-C dedicated verifier
2. R2-B dedicated verifier and its R2-A acceptance, R2-A, Q0-A, Doctrine, historical Package B, Package A R1, and Decision Policy chain
3. `npm.cmd run typecheck`
4. `npm.cmd run lint -- --max-warnings=0`
5. `npm.cmd run build`
6. `git diff --check`
7. exact six-path scope audit
8. sensitive scan
9. Git refs, stash, Product snapshot, main, historical R2-C, and `next-env.d.ts` drift audit

Automated PASS does not populate or imply a Human verdict.

Preparation-time automated results:

- R2-C dedicated verifier: PASS `17/17`
- R2-B dedicated verifier: PASS `21/21`
- R2-A acceptance / R2-B authorization verifier: PASS `14/14`
- R2-A dedicated verifier: PASS `35/35`
- Q0-A acceptance verifier: PASS `12/12`
- R1 Doctrine verifier: PASS `19/19`
- historical Package B verifier: PASS `20/20`, exact `10/10`
- Package A R1 verifier: PASS `23/23`
- Decision Policy verifier: PASS `40/40`
- typecheck: PASS
- lint with `--max-warnings=0`: PASS
- production build: PASS
- exact scope, sensitive scan, and `git diff --check`: PASS
- `next-env.d.ts` content drift after build: `0`

These are technical preparation results only. Human Visual and Human Product judgments remain PENDING.

They remain valid as preparation-time technical measurements only. They do not override the current Product finding, establish Semantic Depth or Input Sufficiency, or make R2-C pass.
