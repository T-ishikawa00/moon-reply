# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R1 Review

## Status

`reassuring_assessment_experience_doctrine_ready_pending_human_chatgpt_review`

This planning-only Task fixes the Product Doctrine established by Human Visual Review, audits the exact current `CustomerAssessmentProjectionV1`, and decomposes the next implementation without authorizing it.

- Source branch: `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-customer-note`
- Baseline: `fdbdf808f135655084de32aec2e57473c1beaf31`
- Parent: `8700ded1454058f72d33f2eb4d1ae6a05b6e008c`
- main / origin/main: `61e33a10e195fad17e253a6b9719217e1992f273`
- Planning scope: exact `12/12`

Package A/R1 is unchanged and accepted. Package B is unchanged at exact `10/10`. The Provider marker is unchanged, authorization remains consumed, `rerun_authorized=false`, and Active Runtime remains v4.

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

Not every case renders every section. Normal cases target approximately six to nine semantically distinct visible sections. Simple cases may be shorter but must remain assessments; emotional cases may be longer because acknowledgment and uncertainty separation are Product value.

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

### Package R2-B — Reassuring Customer Note revision

Retain the accepted visual shell, reduce hero dominance, restore meaningful assessment length, render the emotional journey, preserve draft/copy prominence, and remove semantic repetition.

### Package R2-C — Human Visual and Product review

Review desktop 1440, mobile 399 and 320, keyboard, 200% zoom, copy success/failure, details behavior, and Product Owner cases covering simple, emotional, null-optional, polite-draft, and persona-preserved output.

The three proposed path manifests are pairwise disjoint. Existing Package C remains separate and continues to own PB-05 factual and anxiety-safe writing quality.

## Acceptance principles

The successor is accepted only when the customer feels personally understood; reassurance contains no unsupported certainty; simple cases no longer feel empty or underpriced; emotional cases do not become generic therapy copy; the draft stays discoverable; every section has a distinct function; repetition is materially below the old full report; Moon Reply atmosphere remains; and the Product Owner judges the experience plausibly worth JPY980.

Runtime activation remains separately unauthorized.

## Boundary

`implementation_authorized=false`

No CustomerAssessmentNote, CSS, Projection, Delivery, Runtime, Prompt, Catalog, Schema, evaluator, semantic disposition, fixture, Provider, runner, DB, Supabase, migration, activation, payment, Safety UX, Package C-F implementation, R4, C2, PR, main merge, or force push occurs in this Task.

Provider / DB / Supabase: `0 / 0 / 0`.

Next action: `human_chatgpt_review_of_reassuring_assessment_experience_doctrine`.
