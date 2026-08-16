# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1 Review

## Status

`r2_a_human_chatgpt_accepted_complete_r2_b_implementation_authorized`

The authorized R2-A Experience Projection implementation completed ChatGPT and Human review with `PASS`, Human acceptance, and R2-A acceptance on `2026-08-16`. This Task is acceptance / authorization synchronization only: it preserves the exact R2-A implementation and authorizes only the next R2-B Reassuring Customer Note implementation.

- Doctrine source branch: `plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-reassurance-experience`
- Correction baseline: `a5b2defa1bb765d46076a28ca9827d494fcbe433`
- Correction branch: `plan/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-reassurance-doctrine-correction`
- Q0-A acceptance branch: `chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r1-r1-doctrine-acceptance`
- Q0-A acceptance commit: `cf9a04773fca622c4813e1e6e73a7632b139aff6`
- R2-A implementation branch: `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-authorized-experience-projection`
- Accepted R2-A implementation commit: `5070c02267f49e1e0095ce2e46fb106b886f7df5`
- R2-A acceptance / R2-B authorization branch: `chore/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-acceptance-r2-b-authorization`
- Acceptance sync parent: `5070c02267f49e1e0095ce2e46fb106b886f7df5`
- Original Product baseline: `fdbdf808f135655084de32aec2e57473c1beaf31`
- Parent: `8700ded1454058f72d33f2eb4d1ae6a05b6e008c`
- main / origin/main: `61e33a10e195fad17e253a6b9719217e1992f273`
- R2-A implementation scope: exact seven NEW paths, preserved
- Acceptance sync scope: exact eight UPDATE paths plus one NEW verifier; DELETE / RENAME = `0 / 0`

Package A/R1 is unchanged and accepted. Package B historical scope is unchanged at exact `10/10`. The Provider marker is unchanged, authorization remains consumed, `rerun_authorized=false`, and Active Runtime remains v4.

## Acceptance authority

- `r2AChatGPTReview = complete`; `r2AChatGPTReviewOutcome = PASS`
- `r2AHumanReview = complete`; `r2AHumanReviewOutcome = PASS`
- `r2AHumanAcceptance = complete`
- `r2AAcceptance = complete`
- `acceptanceDate = 2026-08-16`
- R2-A Experience Projection successor: `implementation_complete / accepted_complete`
- R2-B Reassuring Customer Note: `implementation_authorized`
- R2-C Human Visual/Product Review: `not_ready_until_R2_B_acceptance / unauthorized`

## Product Doctrine

The non-negotiable Hard Gate is, in order:

1. Safety
2. factual integrity
3. user and other-person boundary integrity
4. no unsupported certainty
5. no fabricated inner state, causality, chronology, or future outcome

After those gates, the Product prioritizes emotional reassurance and containment, feeling personally understood, atmosphere and afterglow, clear present direction, usable draft and action, and only then information efficiency.

The customer is not primarily buying the shortest correct answer. The customer is buying a calm, personalized assessment experience where anxiety can be temporarily entrusted, organized, and returned in an understandable and manageable form.

The target state is first `なんか安心した。今日はこれでいい。`, then `今はこれをすればいい。` Comfort may use Moon Reply's visual atmosphere, letter-like pacing, reflective language, ritual, and moon/night/paper identity. It may not use psychic claims, hidden-feeling assertions, predicted replies or reconciliation, promised outcomes, or possibilities presented as facts.

The previous long note failed through repetition, not length. Package B fails through under-delivery, not visual direction.

## Human Visual Review disposition

- Visual direction: `accepted`
- Brand atmosphere: `accepted`
- Draft discoverability: `accepted`
- Draft copy interaction: `accepted_pending_keyboard_and_failure_manual_test`
- Typography/readability at the observed desktop width: `accepted`
- Customer content density: `failed_too_short`
- JPY980 readiness: `not_ready`
- Package B: `visual_shell_accepted_experience_content_revision_required`

The navy/paper/gold language, draft discoverability, and persona-preserved Kansai draft are retained. The simple and nullable-optional cases are materially too short, the hero is too dominant relative to the body, and the result reads as a polished AI answer rather than a paid assessment. The target is the earlier assessment's sense of fullness without its semantic repetition.

Mobile 399/320, keyboard, 200% zoom, copy failure, and reduced motion remain incomplete unless separately observed.

## Required emotional journey

1. Receive the anxiety.
2. Restate the situation in consultation-specific language.
3. Separate observed facts from feared interpretation.
4. Bound uncertainty without enumerating adverse possibilities.
5. Give one present direction.
6. Provide a draft when permitted and requested.
7. Make one immediate action concrete.
8. Give observable reassessment conditions.
9. Close with calm, consultation-specific aftercare.

The required movement is `理解された感覚 → 安心 → 納得 → 行動`, not `結論 → 操作指示 → 終了`.

## Experience section architecture

The proportional candidate structure is:

A. Cover/opening with Moon Reply identity, one consultation-specific line, and a visible but non-dominant current answer.

B. `月の返事からの短い手紙` for consultation-specific acknowledgment without false reassurance or therapeutic filler.

C. `今の状況を読み解く` using grounded customer-readable observations with no fact IDs.

D. `確かに言えること / まだ分からないこと` to separate facts, interpretation, and material uncertainty without manufacturing adverse possibilities.

E. `送信文案`, prominent and exactly copyable when permitted and requested, with exact draft context when useful.

F. `この文面がどう届くか`, only when relevant and requested.

G. `今夜の動き方`, with one immediate step and relevant avoid guidance.

H. `見直す条件`, with observable triggers and customer-readable future direction rather than internal enums.

I. `月の返事から最後に`, one or two consultation-specific closing paragraphs providing reassurance without guarantee.

Not every case renders every section. Normal cases use approximately six to nine semantically distinct visible sections as `guidance_only`, never as a Hard Minimum or Hard Maximum. Semantic necessity controls density. A simple consultation may render fewer than six visible sections when every necessary Product function is fulfilled; no section may be created only to satisfy the count, no padding is permitted, and no primary meaning may be duplicated. The existing simple-case requirement is preserved: compress proportionally to judgment, reason, draft when applicable, reassessment, and other semantically necessary Product functions. Complex or emotional cases may legitimately be longer. Fixed word counts and fixed section counts are prohibited.

## Current Projection gaps

`CustomerAssessmentProjectionV1` safely normalizes the decision, primary reason, draft, immediate action, reassessment, requested relationship/message details, and fixed limitation. It cannot stably supply the complete desired experience:

| Desired experience field | Exact Report source | Current v1 disposition |
| --- | --- | --- |
| `openingLine` | `content.cover_line` | unavailable |
| `openingLetter` | `content.short_letter` | only under `organize_emotions` |
| `situationReading` | selected `content.observed_fact_commentary[*].commentary` | unavailable |
| `possibleInterpretations` | `content.possible_interpretations` | only under `message_impact` |
| `materialUnknowns` | legacy strings or split `[*].summary` | unavailable |
| `draftContext` | `content.message_draft_context` | unavailable |
| `actionRationales` | `content.action_rationales` | unavailable |
| `closingLines` | `content.closing_lines` | unavailable |
| `consultationLimitations` | legacy `limitations` or split `model_generated_limitations` | unavailable except separate fixed limitation |

The UI cannot render these missing fields without inventing text or breaking the Projection-only boundary.

## Proposed successor Projection

Plan `CustomerAssessmentExperienceProjectionV2` as a versioned successor:

`Full structured Report → deterministic CustomerAssessmentExperienceProjectionV2 → Customer UI`

It preserves the full Report unchanged and preserves accepted v1 concepts without mutating or silently widening `CustomerAssessmentProjectionV1`. Selected observed commentary is chosen by membership in `decision_reason_fact_ids`, preserves Report content order, and emits commentary only. Legacy material unknown strings and split summaries are projected exactly. All source strings and array order remain exact.

There is no additional Provider Stage, paraphrase, factual rewrite, generated filler, fact-ID output, internal-enum output, or case-ID branching.

## Density rules

Density follows semantic necessity rather than character count. A visible field must uniquely provide emotional acknowledgment, grounded understanding, uncertainty separation, present decision, draft utility, immediate action, reassessment, or emotional closure.

The renderer assigns each field one primary Product function, avoids rendering the same field twice, exact-deduplicates without rewriting, and moves only genuinely secondary distinct detail into disclosure. It must not hide all reassurance behind `<details>`. Every ready assessment retains at least one visible personalized emotional or reflective section. `organize_emotions` is not the sole reassurance route; `requestedTopics` changes emphasis but does not remove the complete baseline experience.

## Implementation decomposition

### Package R2-A — Experience Projection successor

Add deterministic experience fields, preserve the full Report and v1 contract, make no UI design change, and use no Provider call.

R2-A implementation is complete and accepted. Its exact seven-file snapshot at `5070c02267f49e1e0095ce2e46fb106b886f7df5` remains the current implementation authority: deterministic `CustomerAssessmentExperienceProjectionV2`, unchanged Full structured Report and `CustomerAssessmentProjectionV1`, exact legacy/split source mapping, and removal of fact IDs/internal enums from the customer projection. Provider calls, paraphrase, factual rewrite, generated filler, and UI design changes remain `0`.

### Package R2-B — Reassuring Customer Note revision

R2-B implementation is authorized only on future branch `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r2-authorized-reassuring-note`, in this exact nine-path scope:

1. `components/runtime/CustomerAssessmentNote.tsx`
2. `components/runtime/CustomerAssessmentNote.module.css`
3. `components/runtime/CustomerDraftCopyButton.tsx`
4. `app/review/runtime/v12/page.tsx`
5. `lib/assessment/runtime/review/m2-p4-v12-customer-experience-projection-fixtures.ts`
6. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/presentation-contract-v1.json`
7. `evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b/capabilities-v1.json`
8. `scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note.mjs`
9. `docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_R2_B_REVIEW.md`

The implementation must consume accepted `CustomerAssessmentExperienceProjectionV2`, preserve the accepted navy/paper/gold shell, reduce hero dominance, render consultation-specific opening/letter/situation reading and fact-versus-uncertainty separation, keep the draft prominent when needed with exact-copy interaction, clarify immediate action and reassessment conditions, close in consultation-specific language, select sections by semantic necessity, allow a semantically complete simple case below six sections, prohibit section-count padding, and suppress semantic repetition.

It may not change V2, `CustomerAssessmentProjectionV1`, the Full Report, Provider integration, Prompt/Catalog/Schema, PB-05, evaluator/semantic disposition, Safety UX, Payment, DB/Supabase/migration, Runtime activation, Production Runtime, R2-C execution, or main.

Historical branches `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-reassuring-note` and `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-b-r1-mobile-copy` remain read-only references. Reset, overwrite, rebase, cherry-pick, and force-push are prohibited.

### Package R2-C — Human Visual and Product review

Required Human Visual review checks are:

- desktop 1440
- mobile 399
- mobile 320
- keyboard
- browser zoom 200%
- copy success
- copy failure
- details behavior
- reduced-motion behavior

Required Product Owner cases are `simple`, `emotional`, `null_optional`, `polite_draft`, and `persona_preserved`.

R2-C must not be marked complete without observed reduced-motion behavior.

R2-C is `not_ready_until_R2_B_acceptance`; execution and review remain unauthorized.

The three proposed path manifests are pairwise disjoint. Existing Package C remains separate and continues to own PB-05 factual and anxiety-safe writing quality.

## Acceptance principles

The successor Experience is accepted only when the customer feels personally understood; reassurance contains no unsupported certainty; simple cases no longer feel empty or underpriced; emotional cases do not become generic therapy copy; the draft stays discoverable; every section has a distinct function; repetition is materially below the old full report; Moon Reply atmosphere remains; and the Product Owner judges the experience plausibly worth JPY980.

At R2-C Human Product PASS, the states remain explicitly separate:

`experienceProductJudgment = plausibly_worth_jpy980`

is not equal to:

`jpy980RuntimeReadiness = not_established / not_ready_until_global_Q0_completion`

R2-A, R2-B, and R2-C own only the Reassuring Assessment Experience. R2-C Human Product PASS does not establish Active Runtime activation, Production Runtime, Provider quality, or overall JPY980 Runtime readiness. Global Q0 completion separately requires acceptance of at least the remaining v12 Product/Safety quality work: PB-05 factual precision and anxiety-safe writing, evaluator and semantic disposition, pre-payment Safety UX, and consolidated regression/Product Owner review.

Runtime activation remains separately unauthorized.

## Boundary

`unscoped_implementation_authorized=false`

`R2-A implementation_complete=true / acceptance=complete`

`R2-B implementation_authorized=true`

`R2-C execution_authorized=false / review_authorized=false`

This sync performs no R2-B implementation and changes no CustomerAssessmentNote, CSS, Projection, Delivery, Runtime, Prompt, Catalog, Schema, evaluator, semantic disposition, fixture, Provider, runner, DB, Supabase, migration, activation, payment, Safety UX, Package C-F implementation, R4, C2, PR, main, or historical branch.

`experienceProductJudgment = not_established_pending_R2_C_human_product_review`

`jpy980RuntimeReadiness = not_established`

`globalQ0Completion = false`; `providerQualityEstablished = false`.

Provider rerun, Active Runtime activation, Production Runtime, Payment implementation, Production Payment, R4, C2, PR, and main integration remain unauthorized.

Provider / DB / Supabase: `0 / 0 / 0`.

Next action: `human_chatgpt_review_of_r2_a_acceptance_r2_b_authorization_sync`.
