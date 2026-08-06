# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P2-R1 Schema Parity Correction Review

## Status

`runtime_projection_corrected_pending_human_chatgpt_review`

Package A の原設計は accepted のままです。Human / ChatGPT implementation review で検出された blocking split fact-ID Schema parity defect だけを offline で修正しました。Provider quality は未確立です。Package B through F、Provider rerun、Runtime activation、R4、C2、PR、main integration は引き続き未承認です。

## Git authority

- Branch: `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p2-r1-schema-parity`
- Exact correction baseline: `db47145cd8ed04e9516861c20cdafbd198205cc5`
- Package A baseline parent: `7810861cec9036d5a131dcdf810e6b5e0e74cac5`
- Main / origin-main: `61e33a10e195fad17e253a6b9719217e1992f273`
- Exact correction scope: 7/7
- Original Package A scope at the baseline: 14/14

The correction changes only the Runtime result decoder, Package A contract/fixtures/offline evidence/capabilities, the dedicated verifier, and this review document. Types, Projection, Delivery, Supabase repository, API route, React components, RuntimeAssessmentNote, Pipeline, Prompt, Catalog, Schema, evaluator, and semantic disposition remain unchanged.

## Split fact-ID Schema parity

- `decision_reason_fact_ids` uses required fact-ID semantics: 1 through 60 items, unique, pattern `^F[0-9]{3}$`.
- `possible_interpretations[*].supporting_fact_ids`, `pre_action_check.supporting_fact_ids`, `aftercare_plan[*].supporting_fact_ids`, `change_conditions[*].supporting_fact_ids`, and `review_timing.trigger_fact_ids` use optional fact-ID semantics: 0 through 60 items, unique, same pattern.
- Required length 0 and every split length 61 fail closed. Duplicates and malformed IDs fail closed.
- Legacy `fact_ids` behavior remains minimum 1, unique, pattern-valid, with no 60-item maximum.
- No fact ID is exposed by `CustomerAssessmentProjectionV1`.

## Offline fixture coverage

- Ready: legacy 1, split 10
- New split optional-empty positives: 6
- Stop: Safety 1, needs information 1
- Rejected invalid runtime shapes: 13
- New split fact-ID negatives: 5
- Rejected invalid delivery shapes: 3

The six positive fixtures cover each of the five optional fact-ID locations independently and one combined result with all five categories empty. Every fixture decodes and projects successfully, preserves the source Report byte/deep representation, and produces a Projection without fact IDs. The negative fixtures cover empty required IDs, required length 61, optional length 61, duplicates, and malformed IDs. All eight original invalid-shape fixtures remain present and rejected.

## Frozen evidence regression

- E-R3-01, E-R3-02, and E-R3-04 accepted structures remain decoder-compatible.
- E-R3-03 Safety stop remains decoder-compatible.
- E-R3-05 and E-R3-06 remain intermediate outputs and are not treated as accepted final Product.
- Source immutability, Projection behavior, Delivery behavior, and requestedTopics authority remain unchanged.

## Automated evidence

| Gate | Result |
| --- | --- |
| Dedicated Package A R1 verifier | PASS 23/23 |
| Decision Policy | PASS 40/40 |
| Typecheck | PASS |
| Lint | PASS |
| Build | PASS |
| `git diff --check` | PASS |

## Operations and authorization

- Provider / DB / Supabase: `0 / 0 / 0`
- Runner rerun / package-check / retry / repair / fallback: `false / false / false / false / false`
- Active Runtime: v4, unchanged and not activated
- Provider quality established: false
- Provider rerun authorized: false
- Package B / C / D / E / F authorized: false
- R4 / C2 authorized: false / false
- PR / main merge / force push: unauthorized

## Required next action

Human / ChatGPT review of the R1 Schema parity correction. Package B remains unauthorized until that review. No adjacent package, rerun, or activation follows automatically.
