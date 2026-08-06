# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-A Review

## Outcome

`CustomerAssessmentExperienceProjectionV2` is implemented as a versioned, deterministic successor pending Human / ChatGPT review. It extracts existing validated Report strings and does not render UI or generate customer-facing copy.

## Baseline and scope

- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection`
- Baseline: `a5b2defa1bb765d46076a28ca9827d494fcbe433`
- Baseline parent: `fdbdf808f135655084de32aec2e57473c1beaf31`
- Main / origin-main authority: `61e33a10e195fad17e253a6b9719217e1992f273`
- Mutation scope: exactly seven new paths
- `CustomerAssessmentProjectionV1`: unchanged
- `CustomerAssessmentDeliveryV1`: unchanged
- Package A / R1 authority: unchanged
- Package B exact scope: unchanged 10/10
- Product Doctrine authority: unchanged

## Projection contract

The exact V2 shape is:

```text
projectionSchemaVersion
baseProjection
openingLine
openingLetter
situationReading
possibleInterpretations
materialUnknowns
draftContext
actionRationales
closingLines
consultationLimitations
```

The flow strictly decodes a Ready result, calls `projectCustomerAssessmentV1()`, reads the validated full Report, and returns fresh arrays and objects. `baseProjection` deep-equals a direct V1 projection and remains accepted by the V1 decoder.

## Exact mappings

- `openingLine`: `content.cover_line`
- `openingLetter`: complete `content.short_letter` in source order
- `situationReading`: commentary selected by `decision_reason_fact_ids`, traversed in `observed_fact_commentary` source order
- `possibleInterpretations`: complete `content.possible_interpretations` without a requested-topic gate
- `materialUnknowns`: legacy strings or split `summary` strings
- `draftContext`: exact `content.message_draft_context` string or null
- `actionRationales`: complete `content.action_rationales`
- `closingLines`: complete `content.closing_lines`
- `consultationLimitations`: legacy `limitations` or split `model_generated_limitations`, separate from `fixedLimitation`

No text is paraphrased, no chronology or causal relationship is repaired, no generic reassurance is added, and no selection depends on a case ID or fixture ID.

## Offline evidence

- Positive fixtures: 8 synthetic cases
- Negative fixtures: 20 fail-closed cases
- Legacy and split exact mapping: covered
- Situation selection and content order: covered
- Unmatched fact omission without placeholder: covered
- Sparse arrays and null draft context: covered
- Japanese punctuation, line breaks, emoji, and dialect: covered for exact preservation
- Ready result and Report deep-freeze: covered for every positive fixture
- Serialized and deep Report immutability: covered
- Repeated projection equality: covered
- Direct V1 parity and V1 decoder acceptance: covered
- Repeated accepted source strings: accepted without deduplication
- Recursive internal/customer-data exclusion: covered

Frozen E-R3 evidence is read-only. E-R3-01, E-R3-02, and E-R3-04 are projected as accepted ready results. E-R3-03 remains `safety_blocked`. E-R3-05 and E-R3-06 remain rejected intermediates with no accepted final Product.

## Product boundary

R2-A supplies exact source fields for the opening ritual, personalized letter, grounded situation reading, fact / uncertainty separation, draft context, action rationale, and emotional closing. It does not render those fields and does not establish that a customer feels reassured or that the experience is worth JPY980.

R2-B, R2-C, existing Package C, R4, C2, Active Runtime activation, Provider rerun, PR creation, and main merge remain unauthorized.

Provider / DB / Supabase operations are `0 / 0 / 0`.

## Validation contract

The dedicated verifier independently checks exact Git authority, seven-path new-only scope, protected predecessor blobs, strict UTF-8 and JSON, exact mappings, positive and negative behavior, Report immutability, V1 parity, frozen E-R3 compatibility, absence of prohibited integrations, authorization boundaries, and `git diff --check`.

Required repository validation remains sequential:

1. Dedicated R2-A verifier
2. Decision Policy verifier
3. Typecheck
4. Lint
5. Build
6. `git diff --check`
7. `git status --short`

Human / ChatGPT review is the next action after automated validation, commit, and normal push.
