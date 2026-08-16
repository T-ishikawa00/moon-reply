# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-R2-A Authorized Lineage Review

## Outcome

`CustomerAssessmentExperienceProjectionV2` is implemented from the accepted Q0-A authority commit `cf9a04773fca622c4813e1e6e73a7632b139aff6`. It is a deterministic Projection-only successor pending Human / ChatGPT review. No R2-B UI or R2-C review work is performed.

The Projection extracts exact validated Report strings, composes accepted `CustomerAssessmentProjectionV1` concepts, and rejects ASCII Fact IDs and the four internal Decision literals in every enumerated customer-readable string, including Japanese-adjacent forms. Structural enum, topic, policy, timing, phase, and schema-version values remain accepted only in their defined non-customer structural fields.

## Baseline and exact scope

- Branch: `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-r1-authorized-experience-projection`
- Accepted authority parent: `cf9a04773fca622c4813e1e6e73a7632b139aff6`
- Accepted authority direct parent (R1 Correction): `6196ab58d8d93a650d050a0fa6e1e7d4c2b44bc2`
- Main / origin-main authority: `61e33a10e195fad17e253a6b9719217e1992f273`
- Mutation scope: exactly seven NEW paths; UPDATE / DELETE / RENAME are `0 / 0 / 0`
- `CustomerAssessmentProjectionV1`: unchanged
- `CustomerAssessmentDeliveryV1`: unchanged
- Q0-A Product Doctrine and R1 Correction: unchanged and accepted
- Package B: unchanged 10/10
- Active Runtime: remains v4

## Historical candidate reuse

The pre-authorization branch `feat/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-a-experience-projection` remains read-only at `da325d9b4d8404879a08c1b50107e7f7df8787ec`, parent `a5b2defa1bb765d46076a28ca9827d494fcbe433`. It was not reset, rebased, overwritten, deleted, or cherry-picked.

All seven historical files supplied the functional and evidence foundation. Every current file differs from the `da325d9` blob: the implementation, fixtures, contract, results, capabilities, verifier, and review record include the later deterministic customer-text identifier hardening from read-only commit `89a6d55fdf3845451e80f1ee21dc648b224bcc9d`; this authorized implementation additionally validates the constructed Projection before returning it, closing the historical decoder-only enforcement gap. The four authority/evidence documents and verifier also replace stale historical lineage with the accepted `cf9a047` parent, current branch, and explicit R2-A-only authorization. No historical branch is treated as current authority.

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
- Source-level Fact ID and Decision-literal rejection before Projection return: 4/4

Frozen E-R3 evidence is read-only. E-R3-01, E-R3-02, and E-R3-04 remain accepted ready projections. E-R3-03 remains `safety_blocked`. E-R3-05 and E-R3-06 remain rejected intermediates. Every accepted frozen customer-readable path is checked for an internal identifier; no frozen string is rewritten and no Provider rerun is authorized.

## Authorization boundary

R2-A implementation authority is exercised only by this exact Projection scope. Provider / DB / Supabase operations are `0 / 0 / 0`. The runner, package-check, retry, repair, fallback, migration, CustomerAssessmentNote, CSS, copy button, review route UI, Prompt, Catalog, Schema, PB-05, Evaluator, semantic disposition, Safety UX, Payment, Pipeline, Runtime activation, R2-B, R2-C, existing Package C, R4, C2, PR creation, and main merge remain outside this implementation.

This implementation does not establish customer reassurance or JPY980 readiness.

## Validation contract

Validation remains sequential:

1. Dedicated R2-A verifier
2. Q0-A Acceptance verifier at accepted authority
3. R1 Doctrine verifier at accepted authority
4. Package B accepted verifier
5. Package A R1 accepted verifier
6. Decision Policy verifier
7. Typecheck
8. Lint with `--max-warnings=0`
9. Build
10. `git diff --check`
11. Exact NEW `7/7` scope
12. Sensitive-value scan

Human / ChatGPT review of the authorized R2-A implementation is the next action after one normal commit and normal push.
