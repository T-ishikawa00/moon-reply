# TASK M2-P4-I2 Review

## Status

- Task: `M2-P4-I2 Report Information Architecture and Intent Fulfillment`
- Baseline: `20d4178e3a63026128f3a25d052196c7161e7e27`
- Branch: `feat/m2-p4-i2-report-information-architecture`
- Status: implementation中 / Human Visual QA pending / Human・ChatGPT review pending
- M2-P4-I1-C through R4: Human / ChatGPT accepted and complete; immutable 27-path historical snapshot preserved
- M2-P4-I3: not started
- Milestone 2: incomplete

## Authorization and product boundary

I2 is explicitly authorized as a renderer and internal static-preview slice. It reorganizes existing report output so the user reaches `今夜の答え`, `そのまま使える返信案`, and `今夜の具体的な行動` before detailed analysis. It also makes the submitted `requestedTopics` visible in input order and reduces duplicate conclusion rendering.

I2 does not revise PB-01 through PB-06, Prompt, Schema, decision Policy, pipeline, API route, Supabase, runtime catalog/hash, development/holdout datasets, or provider-generated prose. Provider-backed quality evaluation has not been performed. OpenAI calls, DB operations, migrations, holdout use, and real-user data are all `0` for this task.

## Exact mutation scope

Exactly 16 literal paths are authorized:

1. `app/review/runtime/i2/page.tsx`
2. `lib/assessment/runtime/review/m2-p4-i2-review-fixture.ts`
3. `evals/runtime/m2-p4-i2-field-disposition-v1.json`
4. `evals/runtime/m2-p4-i2-capabilities-v1.json`
5. `scripts/verify-m2-p4-i2-report-ia.mjs`
6. `docs/phase2/TASK_M2_P4_I2_REVIEW.md`
7. `components/runtime/RuntimeAssessmentForm.tsx`
8. `components/runtime/RuntimeAssessmentNote.tsx`
9. `app/globals.css`
10. `scripts/verify-m2-eval-foundation.mjs`
11. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
12. `docs/CURRENT_FOCUS.md`
13. `docs/WBS.md`
14. `docs/CODEX_HANDOFF.md`
15. `scripts/verify-m2-p4-i1-b-runtime-integration.mjs`
16. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`

Wildcard, prefix-wide authorization, and future-path auto-authorization are prohibited.

## Report order

The cover retains the brand, note title, cover line, and the single large `今夜の答え`. It adds `このノートでお答えすること`, using only `form.requestedTopics` and linking the selected topics in their submitted order.

The body order is:

1. `02 今夜はこう動いてください` (`#tonight-action`)
2. `03 月の返事からの短い手紙` (`#short-letter`)
3. `04 そう判断した理由` (`#decision-reason`)
4. `05 文面から読み取れること` (`#message-reading`)
5. `06 今夜から3日間の動き方` (`#three-day-plan`)
6. `07 判断を変えるとき` (`#change-conditions`)
7. `08 月の返事からの締め` (`#closing`)

The former standalone `今夜の答え` section and standalone message-temperature section are removed. `decision_reason_summary`, the short letter, closing, and the fixed limitation remain. The fixed limitation is rendered once.

## Selected intent mappings

All six mappings are fixed in the renderer and point to visible report anchors:

- `decide_send_or_wait` -> `送るか待つか決めたい` -> `#tonight-action`
- `draft_message` -> `送る文章を整えたい` -> `#message-draft`
- `message_impact` -> `この文面がどう届くか知りたい` -> `#message-reading`
- `relationship` -> `相手との関係を整理したい` -> `#decision-reason`
- `next_three_days` -> `これから3日どう動くか知りたい` -> `#three-day-plan`
- `organize_emotions` -> `不安を整理したい` -> `#short-letter`

No additional question, DB record, or PB-01 reconstruction supplies this navigation.

## Hidden-field disposition

The exact seven-field disposition is recorded in `evals/runtime/m2-p4-i2-field-disposition-v1.json`:

- `observed_fact_commentary`: integrate into `decision-reason`, filtered to `decision_reason_fact_ids` while preserving source order.
- `anxiety_reframe`: display under the short letter as `不安を少しほどくために` with neutral styling.
- `action_rationales`: integrate into tonight action as `この動き方をすすめる理由`.
- `message_draft_context`: display immediately below the draft as `この文面に整えた理由`.
- `three_day_plan_commentary`: integrate by the same day index; count mismatch becomes visible rather than silently hidden.
- `change_condition_commentary`: display as future reconsideration conditions, not current commands.
- `unknowns_commentary`: `deprecate_in_successor_schema`; it remains required and generated in the current Schema/PB-05/PB-06 contract but is not added to this renderer.

## Draft absence behavior

When `draft_message` was requested but the decision is `wait_and_reassess`, the renderer states that no immediate draft is shown because sending is not being rushed. For `pause_additional_contact`, it states that no sending draft is shown because additional contact is being stopped. A missing draft for `reply_now` or `send_now` remains a Policy violation and is not masked with invented UI copy.

## Static Human review fixture

`/review/runtime/i2` is a development-only, environment-gated, noindex/nofollow route. It returns `notFound()` in production or when `M2_INTERNAL_RUNTIME_ENABLED` is not exactly `true`. The route renders a wholly fictional matching-app `reply_now` fixture with all required report fields and all seven hidden fields populated. It does not call the API route, OpenAI, or Supabase, contains no DB UUID, secret, provider response, real user, or holdout data, and displays `I2固定プレビュー / API・DB未使用`.

Human Visual QA remains pending and must be performed manually at `http://localhost:3000/review/runtime/i2`. Automated checks do not establish visual acceptance.

## Validation and acceptance boundary

The dedicated I2 verifier, I1-C/I1-B/policy regressions, foundation gate, M2-P3 gate, typecheck, lint, build, JSON parse, exact-scope audit, protected-diff audit, and `git diff --check` are required. The I1-B and I1-C historical snapshots remain immutable; their verifier updates only recognize the exact four authorized I2 renderer paths as a separate post-acceptance successor slice within the exact 16-path I2 scope.

Passing automation does not complete Human Visual QA, Human / ChatGPT acceptance, M2-P4-I3, provider-backed quality evaluation, Milestone 2, release, deployment, or public exposure.
