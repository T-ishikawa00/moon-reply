# TASK_M1_P1_REVIEW.md

## Status

Accepted by Human at commit `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`.

Task M1-P1-R1 was accepted by Human at commit `479f3b9610ed93be921c5b844dff03d6f1c16f31`. Human then separately authorized M1-I1. M1-I1 is implemented and awaiting Human review; M1-I2 remains unauthorized.

## Base Commit

Task 18C-R3 accepted by Human.

Base commit: `54e5f2dba518eb13ab2fb1d7f645799be65fd1e8`

R1 alignment base commit: `05c02efeb90a53caaf603f7a4e983a7bc5c7914b`

## Documents Created

- `docs/phase1/M1_REVIEWABLE_WEB_MVP_SPEC.md`
- `docs/phase1/M1_UI_STATE_MATRIX.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/TASK_M1_P1_REVIEW.md`

## Route Recommendation

Use ordinary product routes for the LP, request form, fictional sample, legal navigation, legal pages, and contact review:

- `/`
- `/request`
- `/sample-report`
- `/legal`
- `/legal/terms`
- `/legal/privacy`
- `/legal/tokushoho`
- `/legal/refund`
- `/legal/ai-disclosure`
- `/legal/unsupported-cases`
- `/contact`

Use a dedicated `/review/**` namespace for deterministic state, confirmation, production-shaped fixture result, and error inspection. The recommended namespace prevents fixture/query state from being mistaken for a real purchase or production token and provides one visible review boundary.

Key review routes:

- `/review`
- `/review/request/<approved-state>`
- `/review/request/confirmation/normal-001`
- `/review/purchase/confirmation/normal-001`
- `/review/result/result-normal-001`
- `/review/save-report/result-normal-001`
- `/review/error/<approved-error>`

## State Model

- Empty, validation, missing-consent, invalid-age, and contradictory input are corrected inline on `/request` and also receive deterministic review previews.
- `normal_allowed` may reach request confirmation and then the payment-free final confirmation.
- `needs_review` is a stop state for the initial MVP. It cannot reach purchase or an ordinary report.
- `rejected` is a blocked state. It cannot reach purchase, ordinary report, or normal message suggestions.
- Unknown/error states fail closed and never default to `normal_allowed`.
- Fictional sample, production-shaped Web鑑定ノート fixture, and separate 保存用鑑定書 fixture preview are distinct routes and evidence categories.
- The save preview derives from the same structured fixture judgment but uses a quick-reference layout; it is not a Web screenshot or generated/downloadable file.

## Fixture Boundary

Future implementation, only after authorization, should place typed deterministic fixtures in `fixtures/review/`.

Fixture rules:

- allowlisted readable IDs such as `request-normal-001` and `result-normal-001`;
- fictional labels and `.invalid` email domains;
- no real person, conversation, contact, purchase, provider, AI, or delivery data;
- no network, API, server action, public DB write, AI call, email, payment, or analytics;
- unknown IDs render a missing-fixture state; and
- fixture data is structurally separate from future production data access.

No fixture implementation was created by Task M1-P1 or Task M1-P1-R1.

## Legal and Contact Boundary

- Existing `docs/legal/*` files remain internal source drafts.
- Review pages must show `審査用ドラフト表示`, `公開承認前・運営者情報未完了`, and `法的助言ではありません`.
- Fixed product facts may be shown.
- Operator identity, address, phone, support channel, response time, provider, payment timing, delivery timing, retention, external providers, and effective dates remain unresolved.
- Unresolved values are withheld and replaced by a truthful review-status explanation, not invented data or raw placeholders presented as final copy.
- Contact review is non-functional; it does not use an invented `mailto:` or submit form.
- Operator-information completion remains Milestone 2.

## Design Direction

The approved foundation is night, moonlight, letter, notebook, deep navy, muted purple, pale gold, and warm ivory.

The intended experience is calm, private, emotionally safe, readable, and realistic. Moon imagery is atmospheric, not analytical or predictive. The design avoids strong occult imagery, magic circles, excessive stars/sparkles, fear-based copy, generic chatbot UI, depressive darkness, and cheap diagnosis-app styling.

The implementation critique is:

> Is this truly designed for 月の返事, or could it be reused unchanged for an unrelated AI service?

R1 fixes the LP direction as vertical scrolling with one value per section, large headings, concise explanation, wide spacing, concrete Web/save/input previews, wider-screen left/right alternation, and clear mid/final CTAs. Mobile keeps one vertical reading order without horizontal scrolling. The LP explains and forms expectations; the full form remains independent at `/request`.

The Pattern is UX hierarchy inspiration only. Astrology, natal charts, zodiac symbols, birth-data analysis, fate/true-feeling claims, circular-chart imitation, proprietary copy/assets/exact layout, copied colors/fonts, horizontal scrolling, and unnatural Japanese line breaks are rejected. External screenshots are not repository assets.

## Implementation Slices

1. M1-I1: Route Shell and Review Navigation
2. M1-I2: Request Confirmation and Safety Review States
3. M1-I3: Final Purchase Confirmation Without Payment
4. M1-I4: Fictional Sample, Web鑑定ノート and 保存用鑑定書 Fixture Experience
5. M1-I5: Legal, Disclosure and Contact Review Pages
6. M1-I6: Responsive, Accessibility and Visual QA Hardening

Each slice is one task, one commit, validation evidence, rollback boundary, and Human gate. Acceptance of Task M1-P1 and Task M1-P1-R1 authorizes none of them automatically.

## Human Decisions Required

The material decisions recorded for final Human review include the original M1-P1 recommendations plus the R1-aligned decisions.

R1 Human decision inputs now fix:

- the emotional objective of reducing anxiety and restoring agency;
- the vertical LP structure and LP/`/request` separation;
- text-only input, conversation paste/anonymization, and image-upload deferral;
- no free-complete/ad-supported initial path;
- complete recommendations for every approved send/light-send/wait/do-not-send label;
- separate Web鑑定ノート and 保存用鑑定書 presentations;
- `/review/save-report/result-normal-001` as the planning route;
- Safety-before-payment plus the future downstream `refund_required` requirement;
- the exact two-level review-banner wording; and
- The Pattern adopt/transform/reject boundary.

Original M1-P1 recommendations still requiring package acceptance or later gates are:

- accept dedicated `/review/**` routes;
- accept inline correction plus separate review-only safety-state previews;
- approve `/sample-report` as the sample entry point;
- approve withholding unresolved legal/operator values and showing review-status rows;
- approve a non-functional contact review page;
- approve readable fixture IDs instead of token-looking values;
- accept delivery timing as unresolved in the final-confirmation preview;
- decide one-page versus multi-step request-form layout before M1-I2;
- keep exact save format/page count/download behavior deferred; and
- reserve `/review/**` for `noindex`, with final indexing/deployment posture deferred to Milestone 3.

Each decision, alternatives, rationale, consequence, and blocking effect is documented in `M1_REVIEWABLE_WEB_MVP_SPEC.md`.

## Files Updated by Task M1-P1

- `docs/ROADMAP.md`
- `docs/WBS.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/legal/WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md`
- `docs/phase1/IMPLEMENTATION_PLAN.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/ACCEPTANCE_CRITERIA.md`
- `docs/phase1/TASK18C_R3_ROADMAP_RESET_REVIEW.md`
- `docs/phase1/M1_REVIEWABLE_WEB_MVP_SPEC.md`
- `docs/phase1/M1_UI_STATE_MATRIX.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/TASK_M1_P1_REVIEW.md`

This is the historical Task M1-P1 file list. The exact 20-file Task M1-P1-R1 change list, including the new decision register and R1 review record, is maintained in `docs/phase1/TASK_M1_P1_R1_UX_ALIGNMENT_REVIEW.md`.

## Validation

- Authoritative roadmap, product, result, request, payment-confirmation, legal, status, WBS, and handoff documents inspected.
- Current app routes and component/safety structure inspected.
- Route/state/slice completeness and cross-document terminology checked.
- Changed-file boundary checked against the allowed docs-only scope.
- `git diff --check` required before commit.
- `package.json` and `package-lock.json` must remain unchanged.
- `app/**`, `components/**`, `lib/**`, and `supabase/**` must remain unchanged.
- `fixtures/**` and all image assets must remain unchanged.
- No build, typecheck, lint, browser, or HTTP result is claimed for Task M1-P1 or Task M1-P1-R1 because runtime behavior is unchanged.

## Prohibited Work Confirmed

- No page, route, component, or fixture code implemented.
- No API route or server action created.
- No Supabase write connected.
- No OpenAI, email, or payment integration added.
- No deployment performed.
- No provider inquiry sent and no provider selected.
- No operator personal information added.
- No package installed or changed.
- No age or safety logic changed.
- No legal draft substance changed; only the obsolete execution-order note in a planning/status document is aligned to the accepted roadmap.

## Current Follow-up Gate

M1-I1 Route Shell and Review Navigation was separately authorized and is implemented for Human review.

M1-I2 through M1-I6 and later milestones remain unauthorized. M1-I2 may begin only after Human accepts M1-I1 and separately authorizes M1-I2.
