# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P4-R2 Review

## Outcome

PB-05 Grounding Name, Input Authority, and Fact-ID Contract Alignment corrects only the inactive PB-05 v4 Prompt contract and its offline evidence. It aligns the future Grounding export name, preserves the exact five-input authority, and makes the observed-fact subset and uniqueness rules explicit. The implementation status is `pb05_precision_writing_contract_aligned_pending_human_chatgpt_review`.

- Branch: `fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p4-r2-contract-alignment`
- Baseline: `f2efc64009ae1afd8343c1383db12cccf827ed23`
- Baseline parent: `eb76dd591fd52ba344c9114c85b8b63187664e9b`
- Main / origin-main: `61e33a10e195fad17e253a6b9719217e1992f273`
- Exact correction scope: `7/7` updated; new `0`; deleted `0`
- Provider / DB / Supabase: `0 / 0 / 0`

Package C architecture remains accepted. This correction changes no grounding code and performs no Provider run, runner rerun, package-check, DB/Supabase operation, Runtime wiring, or activation. Provider quality established: `false`.

## Actual predecessor authority

`runtime-stage-catalog-v11.0.0` identifies PB-05 v3 as the actual immediate predecessor of PB-05 v4.

- Catalog: `lib/assessment/runtime/contracts/runtime-stage-catalog-v11.json`
- Version: `v3.0.0`
- Path: `lib/assessment/runtime/contracts/pb-05-directional-report-v3.developer.md`
- Git blob SHA: `8d0242ee120238c488b80b310bf47e13cea617ba`
- Canonical UTF-8/LF SHA-256: `3dfdf47d9df45bdde344e57d5481dcac247095736eed8cd1919f2e7547d8b083`

PB-05 v2 remains protected historical authority, but it is not the immediate predecessor. PB-05 v2 and v3 are unchanged.

## Corrected v4 authority

`PB-05 Directional Report — Developer Contract v4.0.0` remains an inactive, offline-only successor that outputs `report-content-v2.schema.json`.

- Path: `lib/assessment/runtime/contracts/pb-05-directional-report-v4.developer.md`
- R2 baseline canonical UTF-8/LF SHA-256: `0ed1f8e63d352c1599ab97686617d8a15c037fcb5c8c376df0ece0eb343ac768`
- Corrected canonical UTF-8/LF SHA-256: `530fe831e8290270d499a44d8aae98b3756935feed1bcfc79612e05ff7695c9f`
- Future inputs: `base_structured_intake`, `candidate_envelope`, `decision_plan`, `contact_constraint_policy`, `action_context`

The existing v4 precision responsibilities remain intact: factual authority, causal integrity, chronology integrity, explicit fact versus inference, anxiety-safe uncertainty, consultation-specific reassurance, distinct field responsibility, density without repetition, persona/final-draft integrity, contact/Safety integrity, action-context authority, and final output audit.

## Predecessor parity matrix

The machine-readable matrix is `16/16` complete in `remediation-contract-v1.json`.

| Responsibility | Disposition |
| --- | --- |
| exact input boundary | preserved |
| contact constraint policy | preserved |
| no_followup_message | preserved and made explicit |
| business_only | preserved and made explicit |
| action-context authority | preserved with deliberate neutral-time refinement |
| selected-request meaning coverage | preserved |
| natural Japanese Product voice | preserved |
| relationship grounding | preserved |
| change-condition grounding | preserved as future Application-owned integration |
| concrete action | preserved |
| observable reassessment | preserved |
| Candidate reconstruction prohibition | preserved |
| draft authority | preserved |
| JPY 980 prose prohibition | preserved |
| Provider/evaluation metadata prohibition | preserved |
| multiple-interpretation minimum | deliberately superseded; zero remains valid when non-material |

The deliberate supersession is explicit: forcing another interpretation when it adds no Product value would create filler or repetition and can amplify anxiety. The v3 `今夜` narrative expectation is not restored as an unconditional rule; Base and `action_context` continue to own time wording.

## Explicit parity results

- `no_followup_message`: with `follow_up_exception=none`, no current or later outbound contact, later draft, apology/aftercare workaround, time-only reopening, user-initiated reassessment instruction, or hidden reply request is allowed. This applies to `wait_and_reassess`, `pause_additional_contact`, and future-valid Decisions.
- `business_only`: all Report explanation, draft commentary, and action commentary remain within business scope; no personal, romantic, private-conversation, relationship-progression, or non-business suggestion is permitted.
- Product voice: the user is addressed naturally and directly; `相談者`, `本ケース`, `入力情報から判断すると`, business-report tone, defensive AI voice, occult certainty, and generic filler remain prohibited.
- Selected-request coverage: every materially selected Base-owned topic must be fulfilled in meaning without duplicate sections. When `draft_message` and `message_impact` are selected, draft context alone is insufficient; outgoing softness, affection, pressure, or adjustment must be addressed without predicting recipient reaction.
- Grounding ownership: `relationship_summary` and `change_condition_commentary` remain Application-owned. Future Package D must preserve `groundSplitReportContentV4` → `groundChangeConditionCommentaryV3` → post-grounding `validateStageOutput` for PB-05; this correction does not wire it.
- Usable outcome: one clear current direction, one concrete immediate action, and one observable reassessment condition are required.
- Commercial/output boundary: Report prose claims no JPY 980 value and emits no merged intake, Provider/evaluation/oracle data, Product Owner rating, diagnostic verdict, retry/repair/fallback, or PB-07 content.

## Contract alignment

The accepted Grounding implementation exports `buildRelationshipSummaryV4` and `groundSplitReportContentV4`. It does not export `groundReportContentV4`. `report-grounding-v4.ts` is unchanged; only the future integration name in the Prompt and offline contract evidence is corrected.

PB-05 still receives exactly five inputs: `base_structured_intake`, `candidate_envelope`, `decision_plan`, `contact_constraint_policy`, and `action_context`. It does not directly receive `decision_policy_result`, `aggregate_safety_result`, PB-02, PB-03, or PB-06 results. The obsolete wording that claimed direct consumption of Decision Policy and the Safety outcome is removed. The validated Decision Plan and Application-owned contact constraint already embody relevant upstream decisions; PB-05 explains those bounded authorities and does not recompute, reinterpret, or override upstream Policy or Safety.

Every `observed_fact_commentary.fact_id` must be unique and drawn only from `decision_plan.decision_reason_fact_ids`. Commentary for an unselected Base fact and duplicate IDs used to create more prose are prohibited. Observed facts remain separate from interpretation, and customer-visible commentary must not expose internal IDs. Zero items is permitted when no additional commentary is useful and the Schema permits it; coverage of every selected fact ID is not required. Grounding v4 continues to reject duplicate and unselected IDs fail-closed.

Machine-readable contract alignment cases are separate from the existing wording and Grounding fixtures:

- positive: `CA-P01` exact Grounding export, `CA-P02` exact five-input authority, `CA-P03` observed fact-ID subset and uniqueness — `3/3 PASS`;
- negative: `CA-N01` nonexistent export, `CA-N02` direct Policy/Safety input claim, `CA-N03` duplicate or unselected fact IDs — `3/3 REJECT`.

These are offline contract checks. They do not establish Provider compliance.

## Contract examples and mutation verification

Positive / negative wording fixtures: `10 / 10`. Existing pairs `6/6` are unchanged; PW-07 through PW-10 add no-followup, business-only, Product voice, and selected-request coverage examples. They are synthetic contract examples and do not establish Provider compliance.

Prompt mutation rejection is independently recorded:

- existing v4 responsibility mutations: `11/11 REJECT`;
- predecessor parity mutations: `7/7 REJECT`;
- integration-alignment mutations: `3/3 REJECT`; and
- total: `21/21 REJECT`.

These section-level contract checks establish explicit Prompt responsibility only. They are not Provider-quality proof.

## Grounding v4 preservation

`lib/assessment/runtime/report-grounding-v4.ts` is blob-identical to baseline.

- Version: `m2-p4-report-grounding-v4`
- Canonical UTF-8/LF SHA-256: `dc256f6bb98a9a350f3b5938d76229ee3d9d4a5ec9095a183a185afa584388b8`
- Exact exports: `buildRelationshipSummaryV4`, `groundSplitReportContentV4`; nonexistent `groundReportContentV4` is absent
- Positive / negative grounding fixtures: `8 / 6`

Relationship semantics, null-draft behavior, draft-present preservation, observed-fact integrity, source order, Unicode/dialect/emoji preservation, input immutability, and fail-closed rejection remain unchanged.

## Frozen E-R3 and regression boundaries

Evidence Commit B remains `9e9bf7d90740c1d00bfc4e282c85906744cd736c`. Its exact 10-file source manifest, raw hashes, consumed marker, and authorization are unchanged. `rerun_authorized=false`; the frozen machine verdict remains `FAIL` and is not reclassified.

- Frozen E-R3 source manifest: `10/10 PASS`
- Frozen case regression: `6/6 PASS`
- E-R3-05 and E-R3-06 accepted finals reconstructed: `false / false`

R2-A/R1, R2-B/R1, R2-C, Product Doctrine, PB-05 v2, PB-05 v3, report-grounding v3, report-grounding v4, Pipeline, Catalog, Schema, evaluator, semantic disposition, UI, Active Runtime v4, and main remain unchanged.

## Authority limits

Package D is unauthorized. Provider rerun is unauthorized. Active Runtime remains `v4`; activation is `false`. Final JPY 980 readiness established: `false`. R4 / C2: unauthorized / unauthorized. No PR or main merge is performed.

## Automated validation

Validation must run sequentially:

1. dedicated PB-05 verifier;
2. Decision Policy verifier;
3. typecheck;
4. lint;
5. build;
6. `git diff --check`;
7. final Git status inspection.

The dedicated verifier enforces the exact R2 baseline, exact `7/7` scope, real Grounding exports, exact future integration order, exact five-input authority, unavailable Policy/Safety input restrictions, observed fact-ID subset and uniqueness, zero-commentary permission, v3 catalog authority and hashes, v2/v3/Grounding preservation, the `16/16` parity matrix, no-followup and business-only boundaries, selected-request coverage, Product voice, usable outcome, commercial/output boundary, wording fixtures `10/10`, contract alignment cases `3/3 + 3/3`, mutations `11/11 + 7/7 + 3/3`, grounding fixtures `8/6`, frozen E-R3, inactive Runtime, zero operations, authority limits, main invariance, and `git diff --check`.

## Review gate

Implementation and offline verification stop at `human_chatgpt_review_of_pb05_contract_alignment`. Human / ChatGPT review must separately decide acceptance. Success here cannot be treated as Provider-quality proof, Package D authorization, Runtime activation, final JPY 980 readiness, R4/C2 readiness, PR approval, or main-merge authority.
