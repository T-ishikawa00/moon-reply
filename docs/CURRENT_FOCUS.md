# CURRENT_FOCUS.md

## Current Phase

Phase 1 / Milestone 1 integrated redesign baseline established — M1-P3 authorized for documentation/design only and not started

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

## Current Task

The baseline-closure commit containing this document records the existing M1-I7 through M1-I11 integrated redesign, M1-P2-R1 public-sample conclusion diversification, and M1-P2-R1-R1 bounded correction as one honest baseline. The application, component, fixture, Safety, and runtime implementation is preserved exactly; baseline closure adds only status/governance documentation.

Human accepted the current integrated result as the baseline for the next planning stage. This decision does not independently accept each historical slice, does not authorize M1-I12, and does not complete Milestone 1.

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
- Figma/design handoff is the formal Human design gate.
- The primary first-impression evaluation target is the Reading Note artifact itself. Header, ReviewBanner, and the whole review route must not obstruct the artifact's impression, reading entry, or closing aftertaste.

## Current Human Decisions

- Task M1-P2 Experience & Visual Direction Revision is accepted.
- Human explicitly authorized the one-time integrated implementation of M1-I7 through M1-I11 and allowed internal checkpoints to replace the normal Human pause between those slices.
- Human accepted the current M1-I7 through M1-I11 integrated redesign as a single next-stage baseline.
- Human accepted M1-P2-R1 and the bounded M1-P2-R1-R1 correction as part of that baseline.
- This baseline decision is not final Milestone 1 acceptance.
- M1-P3 Reading Note Visual Excellence Specification is Human-authorized for documentation/design work only and remains unstarted.
- M1-I8-R1 and M1-I9-R1 remain unauthorized and unimplemented.
- M1-I12 Responsive, Accessibility and Final QA remains unauthorized.
- M1-I6 remains formally closed as superseded without acceptance; its historical evidence and carried defect inventory remain intact.
- Product definition, JPY 980 price, 18+ policy, Safety/classification meaning, fixed judgment, core scenario facts, legal substance, and runtime boundaries remain fixed.
- Presentation fixture/schema changes in M1-I8 and M1-I10 are deterministic, presentation-only, and require Human review.
- A fixed/sticky mobile CTA remains `rejected for Milestone 1`; all CTAs remain non-fixed.
- Milestone 1 remains incomplete. Milestone 2 and all later milestones remain unauthorized.

## Runtime Boundary

- Current M1 data remains deterministic fixture/mock or browser-memory-only data.
- The three M1-P2-R1 cases are static public-display data under `fixtures/public/` and are separate from Safety and fixed result fixtures.
- No form state is persisted or transmitted.
- No real AI, DB/Supabase runtime, payment, email, analytics, API, server action, active contact, external asset, file generation, clipboard, share, print, upload, OCR, or deployment was added.
- `lib/safety/**` classification and vocabulary are unchanged; only `normal_allowed` continues and every blocked/invalid/unknown state remains fail closed.
- Legal/contact content remains Review mode only, and Contact remains inactive.

## Current Restrictions

- Do not reinterpret the integrated baseline decision as separate slice acceptance or final Milestone 1 acceptance.
- M1-P3 permits documentation/design specification only. Do not implement Visual Excellence under M1-P3.
- Do not start M1-I8-R1, M1-I9-R1, or M1-I12 without separate explicit Human authorization after the applicable specification/acceptance gate.
- Do not publish, deploy, activate runtime integrations, complete operator facts, or start Milestone 2+ under baseline closure.
- Browser use, the Codex in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browser control, and screenshot acquisition by CodeX/agents are prohibited.
- CodeX/agents must not claim visual evidence. Human performs screen review manually in ordinary external Microsoft Edge.
- Complete 320px cross-route, keyboard/focus, and final visual/contrast acceptance remain M1-I12 work.

## M1-P3 Record

- Task ID: `M1-P3`
- Task name: `Reading Note Visual Excellence Specification`
- Status: `Human-authorized; documentation/design only; not implementation authorization`
- Purpose: polish the `税込980円` Reading Note product without changing content or judgment; define content lock, information hierarchy, component anatomy, tokens, typography, chapter archetypes, Figma/design handoff, responsive behavior for desktop/390px with 768px reflow and 320px fallback, acceptance criteria, and implementation plan.
- Dependencies: current integrated redesign baseline closure commit; clean working tree; Human decisions recorded.
- Out of scope: implementation; product facts or price; fixture judgment or Safety; request/legal redesign; real AI, DB, payment, email, API, deployment; external fonts; Storybook; visual-regression tooling; PDF, download, share, print, or persistence.

## Next Gate

Human and ChatGPT prepare and review the M1-P3 design specification. M1-I8-R1 remains unauthorized until M1-P3 is explicitly accepted and M1-I8-R1 is separately authorized. M1-I9-R1 and M1-I12 also remain unauthorized. Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
