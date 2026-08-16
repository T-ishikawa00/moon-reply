# M2-P4-I3-R1-C1-R3-R2-E-R3-R3-R3-P3-V1-A1 Review / R1 Materiality Correction

## Status and authority

- Task: V1-A1 Deterministic JPY980 Input Sufficiency Policy
- Status: r1_materiality_correction_implemented_pending_human_chatgpt_review
- Branch: fix/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality
- Exact correction parent: 65c245860813f6179689855b344dbf6fd425867a
- Original accepted authority: cfad0bd4ca3fd2304b00d072624e624f98c09b29
- Parent planning commit: 885d46db8bfbc2add4828b7205af9a9e3d6c009c
- R2-B Product snapshot: fa956b9b1941c73f8e1767c64ab24f07fadd36c6
- main / origin/main: 61e33a10e195fad17e253a6b9719217e1992f273

JPY980 Value Architecture R1 Correction is Human + ChatGPT accepted complete. ChatGPT review is PASS / complete, Human review is PASS / complete, Human acceptance and correction acceptance are complete, and the acceptance date is 2026-08-16.

Only V1-A1 was implementation-authorized. V1-A2 Runtime/API/UI Clarification Integration, V1-B, V1-C, V1-D, Provider execution, Production Runtime, Payment, and main integration remain unauthorized. V1-A overall is not complete.

## R1 review finding and correction

ChatGPT review of implementation commit `65c245860813f6179689855b344dbf6fd425867a` is `NEEDS_CORRECTION`: BLOCKER 0, MAJOR 1, MINOR 0. The major finding was that `user_emotions.length > 0` could independently make material concern true and allow an incidental positive emotion in a routine administrative case to bypass the material-concern clarification.

R1 removes emotion presence as a standalone materiality signal. Materiality is now established only by existing bounded typed authority representing an actual decision, relationship, boundary, or contact concern: a material `user_goal_detail`, explicit boundary state, or repeated unanswered contact. No raw-prose classifier, emotion-statement keyword search, or customer-prose regex is added.

## Implemented boundary

V1-A1 adds one pure deterministic policy foundation:

`lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts`

It is not imported by the active pipeline. It changes no API response, UI clarification flow, database constraint, Runtime schema, Prompt, Provider stage, Payment path, PB-05 output, semantic disposition, CustomerAssessmentNote, or CustomerAssessmentExperienceProjectionV2.

The public state union is:

- full_paid_ready_candidate
- needs_one_clarifying_answer
- not_full_product_candidate
- safety_blocked

`not_full_product_candidate` remains an internal future Product-routing classification. V1-A1 does not add it to RuntimeEligibilityV3, the API, or the database.

## Structured input authority

The policy consumes already-grounded authority only:

- aggregate Safety classification
- Base Structured Intake `pipeline-schema-base-v2.0.0`
- Base Decision Facts `m2-p4-base-decision-facts-v2`
- Base Writing Signals `m2-p4-base-writing-signals-v1`
- Base `material_unknowns`
- Base `user_emotions`
- `clarificationAlreadyUsed` boolean

The supplied Decision Facts and Base Writing Signals must structurally agree with the corresponding fields inside Base Structured Intake. Unsupported schema versions and malformed authority fail closed with the safe code `M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID`.

The policy does not branch on a case ID or fixture ID. It does not use regular expressions or keyword lists to decide romantic meaning from customer prose. Structured statements are validated only as bounded non-empty schema text; their words are not searched to select a route.

`user_emotions` may establish only that bounded emotional context is available for future emotional containment. Its presence does not establish paid Product materiality and does not prove a specific fear proposition. V1-A1 does not interpret emotion prose. If a specific central-fear proposition is required beyond this presence signal, its grounding remains a future clarification concern.

## Output contract

Every successful evaluation returns:

- `schemaVersion`
- `state`
- `reasonCodes`
- `missingMaterialDimensions`
- `clarificationBudget`
- `clarification`

The clarification budget is always:

- `maximumQuestionsTotal = 1`
- `questionsAlreadyUsed = 0 | 1`
- `questionsRemaining = 0 | 1`

At most one clarification object is returned. When state is not `needs_one_clarifying_answer`, clarification is null. When `clarificationAlreadyUsed=true`, `needs_one_clarifying_answer` is unreachable.

## Safety priority

The policy validates the aggregate Safety classification before Product sufficiency. Any classification other than `normal_allowed` returns `safety_blocked`, never returns a clarification, and never becomes a paid-ready candidate. V1-A1 neither weakens nor reinterprets Safety.

## Sufficiency routing

For supported reply-waiting consultations, the policy requires grounded material concern, latest-contact timing, usual cadence, bounded emotional-context presence, usable current action context, and observed evidence. The current `central_fear_or_decision_concern` availability check records only that emotional context exists; it does not assert a fear proposition. For supported draft or message-impact consultations, the policy requires a grounded material concern, grounded relationship intent, usable tone/writing context, and observed evidence.

Material concern itself is independent of emotion presence. Accepted typed signals are the material goals `move_closer`, `maintain_distance`, `apologize`, `repair_conflict`, `decline_without_false_hope`, `end_contact`, `express_affection`, and `clarify_relationship`, an explicit boundary state, or repeated unanswered contact. Without one of those signals, material concern remains missing.

These conditions are only a plausibility basis for future mandatory Semantic Depth functions. V1-A1 does not generate consultation_core, evidence_and_significance, decision_logic, action_artifact, emotional_containment, uncertainty_boundary, or reassessment_trigger.

Routing is fail-closed:

- zero missing dimensions → full_paid_ready_candidate
- one catalog-supported missing dimension and unused budget → needs_one_clarifying_answer
- multiple independent missing dimensions → not_full_product_candidate
- any unresolved insufficiency after budget use → not_full_product_candidate
- one unsupported non-catalog gap → not_full_product_candidate
- unsupported consultation shape → not_full_product_candidate
- malformed structured authority → safe M2RuntimeError

Word count, section count, fact count alone, and requested-topic count alone do not establish sufficiency. A routine administrative reply with no grounded relationship, tone, affection, pressure, distance, or communication concern is never automatically full-paid-ready.

## Bounded clarification catalog

The catalog has six customer-safe Japanese targets:

1. material_relationship_or_communication_concern
2. latest_contact_timing
3. usual_reply_cadence
4. central_fear_or_decision_concern
5. relationship_intent
6. requested_message_tone

Each entry asks one conceptual question. Questions do not claim facts, suggest an answer, imply knowledge of the other person's mind, or request unnecessary sensitive personal information. The selected target is based on a missing structured dimension, not raw wording.

The material-concern question is consultation-shape neutral: `今回のやり取りで、いちばん気になっているのは、距離感・好意の伝わり方・返信への圧のどれに近いですか？特に気になる点がなければ「特になし」で大丈夫です。` It does not assume that the user is drafting a reply.

## Offline routing evidence

The original twelve A-L fixtures remain, and four R1 materiality regression fixtures extend the offline set to sixteen:

| Requirement | Evidence |
| --- | --- |
| A | Routine administrative reply, unused budget → one material-concern clarification |
| B | Same insufficient consultation after budget use → route out |
| C | Reply waiting with timing, cadence, fear, evidence, and action context → ready candidate |
| D | Reply waiting missing only timing → one timing clarification |
| E | Reply waiting missing timing and cadence → route out |
| F | Draft/message-impact with material intent and usable tone context → ready candidate |
| G | Draft missing only tone → one tone clarification |
| H | Same missing tone after budget use → route out |
| I | Non-normal Safety → safety_blocked |
| J | Unsupported schema → safe fail-closed error |
| K | Same exact input twice → deep-equal result |
| L | Changed case/fixture metadata → unchanged result |
| R1-A | Routine administrative reply without emotion → material-concern clarification |
| R1-B | Same routine case with one incidental relief emotion → still material-concern clarification |
| R1-C | Incidental-emotion routine case after budget use → route out |
| R1-D | Routine case with material typed goal plus usable tone/evidence → ready candidate allowed |

Every non-malformed Base Structured Intake fixture validates against the existing `base-structured-intake-v2.schema.json`. Provider / DB / Supabase operations are 0 / 0 / 0.

Fixture metadata and case IDs remain outside policy routing. The R1-D result is driven by the material typed goal, not its metadata.

## V1-A2 clarification-answer provenance boundary

Current PB-01 Base authority does not accept a clarification answer as a Base fact or source reference. Before any V1-A2 Runtime/API/UI connection, an explicit clarification-answer grounding and provenance contract is required. V1-A2 must not silently append a follow-up answer into `currentSituation`, pretend the answer came from `input:current_situation`, discard provenance, or widen current schemas implicitly.

This R1 correction does not design or implement that contract. V1-A2 remains unauthorized.

## Exact scope

The immutable V1-A1 implementation snapshot remains exactly 12 paths: 5 UPDATE + 7 NEW at `65c245860813f6179689855b344dbf6fd425867a`.

R1 correction scope is exactly 11/11 paths: 10 UPDATE + 1 NEW. DELETE / RENAME = 0.

Updated:

1. lib/assessment/runtime/jpy980-input-sufficiency-policy-v1.ts
2. evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/routing-fixtures-v1.json
3. evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/offline-results-v1.json
4. evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/policy-contract-v1.json
5. evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1/capabilities-v1.json
6. docs/phase2/TASK_M2_P4_I3_R1_C1_R3_R2_E_R3_R3_R3_P3_V1_A1_REVIEW.md
7. evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-r2-c-r1/implementation-work-packages-v1.json
8. docs/CODEX_HANDOFF.md
9. docs/CURRENT_FOCUS.md
10. docs/WBS.md

New:

1. scripts/verify-m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-a1-r1-materiality.mjs

## Protected boundary

The R1 verifier freezes from the parent all active Runtime integration, eligibility-v3, runtime types and schemas, RuntimeAssessmentForm, API routes, Supabase repository, migrations, Prompt assets, Provider stages, Payment paths, CustomerAssessmentNote, CustomerAssessmentExperienceProjectionV2, PB-05, and semantic-disposition implementation. It also freezes the R2-B Product snapshot and proves the original V1-A1 verifier remains PASS 24/24 in an isolated immutable checkout at `65c245860813f6179689855b344dbf6fd425867a`. The original V1-A1 verifier itself is unchanged.

## Current Product authority

- R2-C: remediation_required
- experienceProductJudgment: pending_remediation
- jpy980RuntimeReadiness: not_established
- globalQ0Completion: false
- Provider execution: unauthorized
- Production Runtime: unauthorized
- Payment: unauthorized
- main integration: unauthorized

V1-A1 automated PASS does not establish any broader Product or Runtime readiness.

## Validation

Required final gates:

- dedicated R1 materiality correction verifier PASS 25/25
- original V1-A1 verifier PASS 24/24 at immutable `65c245860813f6179689855b344dbf6fd425867a`
- JPY980 R1 Correction verifier PASS 19/19 at accepted authority
- original JPY980 planning verifier PASS 18/18 at 885d
- R2-C preparation verifier PASS 17/17
- R2-B verifier PASS 21/21
- all upstream accepted verifiers PASS
- Decision Policy PASS 40/40
- typecheck
- lint with max warnings 0
- production build
- git diff --check
- exact scope and sensitive scan
- Product snapshot unchanged
- main unchanged
- next-env.d.ts drift 0

Only after every gate passes may the one normal commit be created and pushed normally.

## Next action

STOP after the normal correction-branch push and wait for Human / ChatGPT review of the V1-A1 R1 materiality correction. Do not begin V1-A2 or any other package.
