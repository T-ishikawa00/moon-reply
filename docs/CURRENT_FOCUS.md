# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Milestone 1 — M1-P3-R1 coded A/B visual prototypes implemented and automatically validated; Human design selection pending

## Completed Through

- Stage 1 project foundation and static LP
- Stage 2 request-form UI
- Stage 3 Supabase schema foundation
- Stage 4 deterministic safety foundation
- Legal/compliance foundation and legal-page drafts
- Provider-inquiry preparation
- 18+ policy and service-positioning alignment
- Task 18C-R3 Roadmap Reset accepted by Human
- Task M1-P1 accepted by Human at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`
- Task M1-P1-R1 accepted by Human at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`
- Tasks M1-I1 through M1-I5 and M1-I5-R1 accepted by Human at their recorded commits
- Task M1-I6 implemented but not accepted; formally closed as superseded by M1-P2
- Task M1-P2 Experience & Visual Direction Revision accepted by Human
- Tasks M1-I7 through M1-I11 implemented, automatically validated, and Human-accepted together as the integrated next-stage baseline
- Task M1-P2-R1 public-sample conclusion diversification and the bounded M1-P2-R1-R1 contrast/comparison-boundary correction Human-accepted as part of that baseline
- Task M1-P3 Reading Note Visual Excellence Specification Human and ChatGPT accepted as the authoritative documentation/design specification
- Task M1-I2-R1 Human-accepted at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`; `SEM-UNSUPPORTED-CASES` passed without waiver
- Task M1-P3-R1 preflight stop resolved by the accepted Safety correction
- Task M1-P3-R1 review-only A/B coded visual prototypes implemented from the same fixed `result-normal-001` source; Human design selection pending

## Current Task

M1-P3-R1 is the current bounded coded visual prototype gate. It compares A — `Quiet Editorial Letter` and B — `Lunar Contrast Edition` on isolated `/review/visual-excellence/**` routes using the same exported resolver, fixed `result-normal-001` fixture, content subset, and semantic order.

M1-I2-R1 implementation and automated validation are complete, Human accepted implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`, and the accepted Safety correction is synchronized to `main`. `SEM-UNSUPPORTED-CASES` passes without waiver. The M1-P3-R1 A/B prototypes are implemented and automatically validated; Human must now select A, B, or an explicit combination. Canonical UI, Reading Note, LP, Request Form UI, Legal UI, fixtures, Safety, packages, and runtime integrations were not changed by the prototype. Checkpoint A, Checkpoint B, M1-I9-R1, and M1-I12 remain unauthorized and unimplemented; Milestone 1 remains incomplete and Milestone 2 remains unauthorized.

Accepted public fictional conclusions in the baseline are:

- `今夜は待つ`;
- `今夜は短く返信してよい`; and
- `こちらからの追加連絡を止める`.

The authoritative artifact names are:

- product: `恋のメッセージ鑑定ノート`;
- long presentation: `Web鑑定ノート`; and
- short presentation: `保存用判断カード`.

Residual application copy such as `保存用鑑定書` is a known deferred M1-I8-R1 alignment item. Baseline closure does not change application copy.

## Human Design Decisions for M1-P3

- Recommended Web鑑定ノート reading order: a one-line `今夜の答え` summary inside the cover, then `月の返事からの短い手紙`, then the detailed `今夜の答え`, followed by the remaining body.
- Fixed judgment, consultation facts, Safety meaning, non-guarantee, uncertainty, and each chapter's purpose must not change.
- The public full sample is a shorter edited artifact using the same visual grammar as the full product; it does not need to expand to the same fourteen chapters.
- The primary mobile design width is 390px. 320px is a QA fallback.
- External fonts are prohibited.
- The formal Human design gate is selection and acceptance of a coded visual prototype: A, B, or an explicitly recorded combination.
- Figma is optional, non-authoritative reference material and is not required for the gate.
- The primary first-impression evaluation target is the Reading Note artifact itself. Header, ReviewBanner, and the whole review route must not obstruct the artifact's impression, reading entry, or closing aftertaste.

## Current Human Decisions

- Task M1-P2 Experience & Visual Direction Revision is accepted.
- Human explicitly authorized the one-time integrated implementation of M1-I7 through M1-I11 and allowed internal checkpoints to replace the normal Human pause between those slices.
- Human accepted the current M1-I7 through M1-I11 integrated redesign as a single next-stage baseline.
- Human accepted M1-P2-R1 and the bounded M1-P2-R1-R1 correction as part of that baseline.
- This baseline decision is not final Milestone 1 acceptance.
- M1-P3 Reading Note Visual Excellence Specification is Human and ChatGPT accepted and authoritative; the documentation/design specification is complete and grants no implementation authorization.
- Human accepted M1-I2-R1 as the bounded Safety coverage correction and permanent regression-verifier task at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`.
- The previous M1-P3-R1 hard stop is resolved; review-only A/B coded visual prototypes are implemented and automatically validated under the continuing Human authorization.
- Human design selection is pending. Prototype acceptance does not authorize canonical implementation.
- Figma is optional and non-authoritative; an existing or future Figma file has no implementation-gate authority.
- Checkpoint A / M1-I8-R1 Technical Preparation remains unauthorized and unimplemented.
- Checkpoint B / M1-I8-R1 Visual Excellence remains unauthorized and unimplemented; it is blocked until Human selects the coded prototype direction and separately records explicit implementation authorization.
- M1-I9-R1 remains unauthorized and unimplemented.
- M1-I12 Responsive, Accessibility and Final QA remains unauthorized and unimplemented.
- M1-I6 remains formally closed as superseded without acceptance; its historical evidence and carried defect inventory remain intact.
- Product definition, JPY 980 price, 18+ policy, existing Safety classification/severity meaning, fixed judgment, core scenario facts, legal substance, and runtime boundaries remain fixed; M1-I2-R1 adds only missing reason codes and coverage needed to enforce the accepted fail-closed policy.
- Presentation fixture/schema changes in M1-I8 and M1-I10 are deterministic, presentation-only, and require Human review.
- A fixed/sticky mobile CTA remains `rejected for Milestone 1`; all CTAs remain non-fixed.
- Milestone 1 remains incomplete. Milestone 2 and all later milestones remain unauthorized.

## Runtime Boundary

- Current M1 data remains deterministic fixture/mock or browser-memory-only data.
- The three M1-P2-R1 cases are static public-display data under `fixtures/public/` and are separate from Safety and fixed result fixtures.
- No form state is persisted or transmitted.
- No real AI, DB/Supabase runtime, payment, email, analytics, API, server action, active contact, external asset, file generation, clipboard, share, print, upload, OCR, or deployment was added.
- `lib/safety/**` now includes the bounded M1-I2-R1 reason-code, normalization, targeted phrase, negation-guard, and non-normal blocking correction. Only `normal_allowed` continues; `needs_review`, `rejected`, contradictory, invalid, missing, and unknown states remain fail closed.
- Legal/contact content remains Review mode only, and Contact remains inactive.

## Current Restrictions

- Do not reinterpret the integrated baseline decision as separate slice acceptance or final Milestone 1 acceptance.
- M1-P3 acceptance and M1-P3-R1 prototype implementation do not grant canonical implementation authority.
- Do not treat Figma as a required or authoritative gate. Human selection of A, B, or a recorded combination is the controlling design decision.
- Do not start M1-I8-R1, M1-I9-R1, or M1-I12 without separate explicit Human authorization after the applicable specification/acceptance gate.
- Do not publish, deploy, activate runtime integrations, complete operator facts, or start Milestone 2+ under baseline closure.
- Browser use, the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browser control, and screenshot acquisition by CodeX/agents are prohibited.
- CodeX/agents must not claim visual evidence. Human performs screen review manually in ordinary external Microsoft Edge.
- Complete 320px cross-route, keyboard/focus, and final visual/contrast acceptance remain M1-I12 work.

## M1-P3 Record

- Task ID: `M1-P3`
- Task name: `Reading Note Visual Excellence Specification`
- Status: `Human and ChatGPT accepted; documentation/design specification complete; not implementation authorization`
- Purpose: polish the `税込980円` Reading Note product without changing content or judgment; define content lock, information hierarchy, component anatomy, tokens, typography, chapter archetypes, Figma/design handoff, responsive behavior for desktop/390px with 768px reflow and 320px fallback, acceptance criteria, and implementation plan.
- Dependencies: current integrated redesign baseline closure commit; clean working tree; Human decisions recorded.
- Out of scope: implementation; product facts or price; fixture judgment or Safety; request/legal redesign; real AI, DB, payment, email, API, deployment; external fonts; Storybook; visual-regression tooling; PDF, download, share, print, or persistence.

## M1-I2-R1 Record

- Task ID: `M1-I2-R1`
- Task name: `Safety Policy Enforcement Alignment`
- Status: Human-accepted; implementation and automated validation complete
- Accepted implementation commit: `23ee6f3b98837e48628b59b41eab811da627e730`
- Branch: `fix/m1-i2-r1-safety-policy-alignment`
- Scope: align all 13 locked unsupported-case labels to fail-closed classification, correct the five confirmed free-text gaps, add `illegal_conduct` and `third_party_secret`, preserve existing structured flag classification/severity, avoid the named benign false positives, and add a permanent verifier.
- Evidence: `EXACT_CATEGORY_CASES`, `NATURAL_LANGUAGE_CASES`, `BENIGN_CONTROLS`, `STRUCTURED_FLAGS`, `NORMAL_CONTROL`, `CONTRADICTORY_SELECTION`, `SEM-UNSUPPORTED-CASES`, and `SAFETY_POLICY_GATE` all PASS; typecheck, lint, build, and `git diff --check` pass.

## M1-P3-R1 Record

- Task ID: `M1-P3-R1`
- Task name: `Coded Visual Prototype Gate`
- Status: A/B prototypes implemented and automatically validated; Human design selection pending
- Branch: `design/m1-p3-coded-visual-prototype`
- Routes: `/review/visual-excellence`, `/review/visual-excellence/a`, `/review/visual-excellence/b`
- Fixed source: `getReportFixture("result-normal-001")`; fixture, Safety, canonical report components, package files, and runtime behavior unchanged
- Gate: Human selects A, B, or an explicit combination. Prototype acceptance is not canonical implementation authorization.

## Next Gate

Human reviews A and B in ordinary external Microsoft Edge and selects A, B, or an explicitly recorded combination. Figma is optional and non-authoritative. Checkpoint A remains unauthorized. Checkpoint B remains unauthorized and additionally requires separate explicit implementation authorization after the coded-prototype selection. M1-I9-R1 and M1-I12 remain unauthorized. Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
