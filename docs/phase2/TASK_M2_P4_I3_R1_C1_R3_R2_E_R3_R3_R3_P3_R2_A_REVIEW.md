# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-A-R1 Review

## Outcome

The accepted R2-A architecture is unchanged. The Human / ChatGPT review defect in customer-text internal-identifier exclusion is corrected offline and is pending a new Human / ChatGPT review.

`CustomerAssessmentExperienceProjectionV2` now rejects ASCII Fact IDs and the four internal Decision literals in every enumerated customer-readable V2 string, including Japanese-adjacent forms. Structural enum, topic, policy, timing, phase, and schema-version values remain accepted in their defined non-customer fields.

## Baseline and exact scope

- Branch: `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-customer-text-exclusion`
- Exact R1 baseline: `da325d9b4d8404879a08c1b50107e7f7df8787ec`
- Baseline parent: `a5b2defa1bb765d46076a28ca9827d494fcbe433`
- Main / origin-main authority: `61e33a10e195fad17e253a6b9719217e1992f273`
- Original R2-A package: exactly seven paths
- R1 correction: the same exact seven paths, with no additional path
- `CustomerAssessmentProjectionV1`: unchanged
- `CustomerAssessmentDeliveryV1`: unchanged
- Product Doctrine: unchanged
- Package B: unchanged 10/10
- Active Runtime: remains v4

## Identifier correction

Fact IDs use direct ASCII matching with `F[0-9]{3}`. Unicode-letter boundaries are not used, so `F101とF102`, `説明はF101です`, `F001を参照`, `（F002）`, `F003。`, and `F004` are rejected wherever the field is customer-readable.

The exact internal Decision literals `reply_now`, `send_now`, `wait_and_reassess`, and `pause_additional_contact` are also rejected inside customer-readable prose without relying on word-boundary behavior.

Recursive forbidden-key rejection remains independent from customer text-value exclusion. No indiscriminate recursive string scan was added.

## Exact customer-text coverage

The original Experience fields remain covered: `openingLine`, all array members of `openingLetter`, `situationReading`, `possibleInterpretations`, `materialUnknowns`, `actionRationales`, `closingLines`, and `consultationLimitations`, plus non-null `draftContext`.

The complete `baseProjection` customer-readable surface is now covered explicitly:

- `primaryReason` and non-null `finalDraft.text`
- `immediateAction.action`, `avoid[*]`, and `secondaryActions[*]`
- `reassessment.when` and `conditions[*].condition`
- non-null `relationshipSummary`
- all four non-null `messageTemperature` strings
- all present `optionalDetails` text arrays
- `expandedPlan[*].action` and non-null `avoid`
- `fixedLimitation`

The decoder does not treat `projectionSchemaVersion`, `sourceReportSchemaVersion`, `requestedTopics`, `decisionCode`, `finalDraft.policy`, `finalDraft.useTiming`, `resultingDirection`, or `expandedPlan.phase` as customer text.

## Offline evidence

- Positive fixtures: preserved 8/8, including Legacy 2 and Split 6
- Previous negative fixtures: preserved and rejected 20/20
- R1 negative fixtures: added and rejected 15/15
- Behavioral path matrix: all 9 Experience path categories and all 19 baseProjection path categories
- Structural positive controls: `reply_now`, `wait_and_reassess`, `required_now`, `now`, `reassessment_condition`, requested-topic values, and schema-version strings
- Exact Legacy / Split mapping, source order, unmatched omission, sparse/null behavior, Unicode/emoji/dialect/line-break preservation: unchanged
- Full Report serialized and deep immutability: preserved
- Direct V1 parity and V1 decoder acceptance: preserved

Frozen E-R3 evidence is read-only. E-R3-01, E-R3-02, and E-R3-04 remain accepted ready projections. E-R3-03 remains `safety_blocked`. E-R3-05 and E-R3-06 remain rejected intermediates. Every accepted frozen customer-readable path is checked for an internal identifier; no frozen string is rewritten and no Provider rerun is authorized.

## Authorization boundary

Provider / DB / Supabase operations are `0 / 0 / 0`. The runner, package-check, retry, repair, fallback, migration, UI, Prompt, Catalog, Schema, Pipeline, Runtime activation, R2-B, R2-C, existing Package C, R4, C2, PR creation, and main merge remain outside this correction.

This correction does not establish customer reassurance or JPY980 readiness.

## Validation contract

Validation remains sequential:

1. Dedicated R2-A/R1 verifier
2. Decision Policy verifier
3. Typecheck
4. Lint
5. Build
6. `git diff --check`
7. `git status --short`

Human / ChatGPT review of the R2-A/R1 identifier exclusion correction is the next action after one normal commit and normal push.
