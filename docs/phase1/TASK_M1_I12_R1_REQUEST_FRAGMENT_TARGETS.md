# Task M1-I12-R1 Request Fragment Target Integrity Correction

## 1. Status

- Task ID: `M1-I12-R1`
- Task name: Request Fragment Target Integrity Correction
- Base commit: `99fda0040b180f3d320530d51644ee8c79b8c400`
- Branch: `fix/m1-i12-r1-request-fragment-targets`
- Automated correction validation: **PASS**
- Main integration: authorized only by the conditions in section 19
- M1-I12 Final QA: resumes only after the correction is fast-forwarded to `main`
- Human final QA remains pending. Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.

## 2. Triggering M1-I12 failure

The initial M1-I12 raw-HTML internal-link audit correctly hard-stopped after finding 15 rendered links to `/request#sheet`, `/request#safety`, and `/request#email` without stable matching fragment targets in the server-rendered Request page.

## 3. Root cause

`RequestForm` already interpreted the three hashes as phase-selection commands, but the corresponding target IDs were absent from the stable server-rendered markup. The email input conditionally used `id="email"`, so it could not also serve as an always-present target and would have duplicated the ID if a stable target had simply been added.

This was a fragment-target coverage gap. The link sources, fixtures, and hash-to-phase mapping were not the defect.

## 4. Human authorization

Human explicitly authorized this bounded correction, its automated validation, a fast-forward-only integration to `main` if every gate passes, and subsequent resumption of M1-I12 on its existing QA branch. No PR, merge commit, M1-I12 merge to `main`, Milestone 1 completion, or Milestone 2 work is authorized.

## 5. Files changed

- `components/request/RequestForm.tsx`
- `app/globals.css`
- `docs/phase1/TASK_M1_I12_R1_REQUEST_FRAGMENT_TARGETS.md`

No status synchronization file is needed before the correction is integrated and M1-I12 resumes.

## 6. Target implementation

`RequestFragmentTargets` emits the following noninteractive targets at the stable `RequestForm` entry in both the active form and local-completion render paths:

- `id="sheet"`
- `id="safety"`
- `id="email"`

Each target uses `className="request-fragment-target"` and `aria-hidden="true"`. The email field ID and its label association are mechanically renamed to `request-email`, preventing a duplicate `email` ID without changing the field name, value, validation, copy, or behavior.

## 7. Hash mapping preservation

The existing mapping remains unchanged:

- `#sheet` -> phase 1
- `#safety` -> phase 2
- `#email` -> phase 4

`REQUEST_HASH_PHASE_MAPPING: PASS`

## 8. Link source preservation

No href was changed. Source and rendered anchor counts remain:

| Fragment | Source references | Rendered link references |
| --- | ---: | ---: |
| `/request#sheet` | 4 | 4 |
| `/request#safety` | 10 | 10 |
| `/request#email` | 1 | 1 |
| Total | 15 | 15 |

The rendered audit counts actual `<a href>` attributes. Next.js also serializes the same values into the RSC payload, so unqualified raw-string counting would double-count them and is not used as the link count.

## 9. ID uniqueness

Production `/request` HTML contains exactly one `sheet`, one `safety`, and one `email` target. Its 17 rendered IDs have zero duplicates.

`REQUEST_FRAGMENT_UNIQUENESS: PASS`

## 10. Accessibility treatment

- Targets are noninteractive `span` elements.
- They have no `tabIndex` and do not enter keyboard tab order.
- `aria-hidden="true"` prevents empty target nodes from being announced.
- No visible label, focus trap, or positive tab index is added.
- The email label remains programmatically associated with its input through `htmlFor="request-email"` and `id="request-email"`.

## 11. No-visible-delta audit

The target rule is limited to `display: block`, `block-size: 0`, and `scroll-margin-top: 6rem`. It adds no text, margin, padding, border, fixed/sticky positioning, clipping, overflow, transform, or animation. `display: none` is not used. Structural source and production-HTML inspection therefore finds no added layout height or visible content. Browser, screenshot, and visual-acceptance claims are intentionally not used; Human final QA remains pending.

## 12. Content locks

- `EXACT_LOCKS: PASS`
- `SEMANTIC_ASSERTIONS: PASS`
- `CONTENT_LOCK_GATE: PASS`

## 13. Safety

- `SAFETY_POLICY_GATE: PASS`
- Safety fixtures, policy implementation, and locked categories have zero diff.

## 14. Typecheck

`npm.cmd run typecheck`: **PASS**

## 15. Lint

`npm.cmd run lint`: **PASS**, warning 0

## 16. Build

A clean `npm.cmd run build` completed successfully and generated 28 static/SSG pages.

`build: PASS`

## 17. Fragment gate

- `REQUEST_FRAGMENT_TARGETS: PASS`
- `REQUEST_FRAGMENT_REFERENCES: PASS`
- `REQUEST_FRAGMENT_UNIQUENESS: PASS`
- `REQUEST_HASH_PHASE_MAPPING: PASS`
- `REQUEST_FRAGMENT_GATE: PASS`

## 18. Prohibited-scope audit

The diff has zero changes to fixtures, Safety, Legal, package files, product copy, hrefs, phase names, runtime boundaries, report surfaces, LP, Header, and Footer. It adds no runtime, API, AI, DB, payment, email-delivery, external asset, fixed/sticky CTA, overflow-x masking, writing-mode, or truncation behavior.

## 19. Main integration condition

Fast-forward-only integration to `main` is authorized only if the exact three-file manifest, all fragment gates, content locks, Safety, typecheck, lint, clean build, `git diff --check`, no-visible-delta audit, and prohibited-scope audit remain PASS; `origin/main` must still be `99fda0040b180f3d320530d51644ee8c79b8c400`, and the correction branch must be a direct descendant without conflict or divergence. A merge commit and PR are prohibited.

## 20. M1-I12 resume condition

After authorized fast-forward and successful main revalidation, update the existing `qa/m1-i12-final-acceptance` branch to the latest `main` with `git merge --ff-only main`. Resume M1-I12 from the beginning only when the QA branch has no branch-specific commit and the working tree is clean. The final QA package remains QA-branch-only pending Human final acceptance.
