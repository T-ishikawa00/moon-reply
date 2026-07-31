# M2-P4-I1-C Contextual Best-Effort Consultation Review

## Status

- Task: `M2-P4-I1-C`
- Baseline: `c27120eea067f91c5e9ef4447e382f55a329e158`
- Branch: `feat/m2-p4-i1-c-contextual-best-effort`
- Status: implementation complete; Human / ChatGPT acceptance pending
- Live rerun: not executed and not authorized by this task
- OpenAI calls: `0`
- DB operations: `0`
- migrations: `0`
- holdout use: `0`
- real-user data: `0`

## Human Product Decision

Normal information gaps are part of an ordinary consultation and no longer terminate the consultation. Contextual inference is core product value: the runtime first preserves explicit facts, then may use sufficiently natural categorical context readings for non-Safety action decisions. Explicit, inferred, and unresolved material remain distinguishable.

When aggregate Safety is `normal_allowed`, application-owned eligibility is always `ready`. Only a non-`normal_allowed` aggregate Safety classification yields `safety_blocked`. `needs_more_information` has no v3 runtime path. Unresolved points become report limitations or change conditions after the current conclusion rather than mandatory pre-answer questions.

## Contextual Inference Boundary

Allowed contextual classification includes sender, reply state, direct-message kind, ordinary response expectation, SNS-only state, proposed-message state, practical purpose, and relationship classification supported by the complete input. Each inferred typed value is recorded in `context_inferences` with one stable inference ID, one allowed field path, supporting fact IDs, source references, and a short externally evaluable rationale.

The runtime must not infer or fabricate inner state, romantic interest, future behavior, reply or success probability, confidence, exact missing time/count, hidden events, nonexistent statements, or reassuring Safety conclusions. Explicit no-contact/distance/block/closure is set only from observed input. `repeated_unanswered_contact=true` requires observed multiple unanswered additional contacts. Context inference can influence non-Safety policy, but cannot manufacture a pause boundary.

## Failed Synthetic Live Run Summary

The diagnosed run prefix is `64ef40a2`. The failure was safe: PB-01 non-inference and nullable decision facts combined with model-owned terminal eligibility prevented an ordinary incomplete consultation from reaching a concrete report. No raw DB output or full UUID is recorded here. This task does not rerun that live path.

## Runtime Contract

- Structured Intake v3 uses `pipeline-schema-v3.0.0`.
- `decision_facts` is a non-null strict object using `m2-p4-decision-facts-v2`.
- `information_state` is `{ assessment_mode: "best_effort", can_proceed_without_followup: true, used_context_inference, unresolved_fields }`.
- Policy v3 strictly validates DecisionFactsV2, projects safely to the accepted DecisionFactsV1 adapter, and reuses accepted policy and plan validation.
- The adapter's `complete_for_decision=true` means only that best-effort policy execution is possible; it does not claim complete information.
- PB-03 v3 only acknowledges the application expectation. A mismatch fails as `M2_ELIGIBILITY_PROJECTION_MISMATCH`; no retry, Repair, fallback, or PB-07 follows.
- PB-04 receives the application-owned local eligibility object, not provider-owned flags.
- Historical v2 catalog execution remains available for accepted offline replay; the service selects only the v3 catalog.

## Original I1-C Exact Implementation Scope

Exactly 21 paths:

1. `lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md`
2. `lib/assessment/runtime/contracts/structured-intake-v3.schema.json`
3. `lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md`
4. `lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json`
5. `lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md`
6. `lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md`
7. `lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json`
8. `lib/assessment/runtime/contextual-inference-v3.ts`
9. `lib/assessment/runtime/eligibility-v3.ts`
10. `lib/assessment/runtime/policy-v3.ts`
11. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
12. `evals/runtime/m2-p4-i1-c-capabilities-v1.json`
13. `docs/phase2/TASK_M2_P4_I1_C_REVIEW.md`
14. `lib/assessment/runtime/schema-catalog.ts`
15. `lib/assessment/runtime/service.ts`
16. `lib/assessment/runtime/pipeline.ts`
17. `scripts/verify-m2-eval-foundation.mjs`
18. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
19. `docs/CURRENT_FOCUS.md`
20. `docs/WBS.md`
21. `docs/CODEX_HANDOFF.md`

Accepted I1-A/I1-B assets, historical `ai/prompts/**`, historical `ai/schemas/**`, development data, holdout, app, components, Supabase, packages, `next-env.d.ts`, UI, and renderer remain protected.

## R1 Contextual Integrity Successor

- Task: `M2-P4-I1-C-R1`
- Baseline: `da520621b6569ff65ae652fb75945ed923b4fc3b`
- Branch: `fix/m2-p4-i1-c-r1-contextual-integrity`
- Status: implementation and required offline validation complete; Human / ChatGPT acceptance pending
- External execution: OpenAI calls `0`; DB operations `0`; migrations `0`; holdout use `0`; real-user data `0`; live rerun not executed

R1 preserves the contextual best-effort and Safety-only terminal policy while adding deterministic post-schema PB-01 integrity validation. `observed_facts.fact_id`, `context_inferences.inference_id`, and inferred `field_path` values must be unique. Every cited fact must exist, and every inference source reference must be supported by the cited facts. The runtime also enforces the inference-used flag equivalence, inferred/unresolved exclusion, unresolved uniqueness and actual-value consistency, non-null/non-unknown inferred values, and the prohibition on inferred boundary or repeated-contact facts. Violations fail before PB-02 as `M2_CONTEXTUAL_INFERENCE_INVALID`.

Practical reason and boundary state are each fixed to three canonical/provider Schema branches. Unresolved practical reason projects conservatively to inactive `none`; unresolved boundary does not create a pause. Both unresolved states remain ordinary `normal_allowed -> ready` consultations and continue through PB-04 to PB-06 with one report.

Exact R1 mutation scope is 12 literal paths:

1. `lib/assessment/runtime/contextual-integrity-v3.ts`
2. `lib/assessment/runtime/contracts/structured-intake-v3.schema.json`
3. `lib/assessment/runtime/policy-v3.ts`
4. `lib/assessment/runtime/pipeline.ts`
5. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
6. `evals/runtime/m2-p4-i1-c-capabilities-v1.json`
7. `docs/phase2/TASK_M2_P4_I1_C_REVIEW.md`
8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`
11. `lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json`
12. `scripts/verify-m2-eval-foundation.mjs`

The catalog mutation is limited to PB-01 `schema_sha256 = 40457d83f992973e745eb7b3488cf244166cbadd5b3b5a3e19affc16a4f6cce8`, matching the changed Structured Intake v3 Schema. The original I1-C 21-path manifest and baseline remain unchanged; R1 is recorded separately as a successor. `scripts/verify-m2-p3-runtime-vertical-slice.mjs` is unchanged.

## R1 Validation Evidence

Recorded sequential offline evidence before commit:

- I1-C verifier: PASS; contextual-reference integrity, state consistency, inferred/unresolved exclusion, and duplicate-unresolved checks PASS
- contextual-integrity runtime rejections: `12/12`; invalid practical combinations: `3/3`; invalid boundary combinations: `3/3`
- legal practical states: `3/3`; legal boundary states: `3/3`; Provider Schema and canonical Schema: PASS
- valid unresolved practical/boundary normal flow: `2/2`, each `ready -> wait_and_reassess -> report 1`
- I1-B verifier: PASS, `40/40`; I1-A verifier: PASS, `40/40`; policy parity: `40/40`
- foundation verifier including `M2_PROHIBITED_IMPLEMENTATION_GATE`: PASS
- unchanged M2-P3 verifier: PASS
- typecheck / lint / build: PASS / PASS / PASS
- exact R1 scope: `12/12`; protected diff: `0`; `git diff --check`: PASS
- OpenAI calls / DB operations / migrations / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- live rerun: not executed

Automated PASS does not constitute Human / ChatGPT acceptance, provider-backed model-quality evidence, live execution, merge, release, or Milestone 2 completion.

## Offline Validation Evidence

The dedicated Fake verifier covers strict schemas and OpenAI projections, contextual-inference source contract, sanitized live-failure equivalence, 11 normal sparse consultations, one Safety-blocked consultation, application-owned PB-03 acknowledgement, no needs-more-information route, I1-A policy parity 40/40, final report creation, exact scope, historical protection, and zero external execution.

Recorded offline evidence before commit:

- `M2_P4_I1_C_CONTEXTUAL_BEST_EFFORT: PASS`
- normal information terminal gates: `0`
- v3 needs-more-information runtime paths: `0`
- sparse normal ready cases: `11/11`
- Safety-blocked cases: `1/1`
- sanitized baseline Fake decision/report: `reply_now` / `1`
- policy parity: `40/40`, each category `10/10`
- OpenAI calls / DB operations / holdout use: `0 / 0 / 0`
- I1-B verifier: PASS, 40/40
- I1-A verifier: PASS, 40/40
- foundation verifier: PASS
- M2-P3 verifier: PASS
- typecheck / lint / build: PASS / PASS / PASS
- JSON parse: 4/4 PASS
- protected diff: `0`
- exact scope: `21/21`
- `git diff --check`: PASS

Automated PASS does not constitute provider-backed prose-quality acceptance, Human review, live execution, DB verification, release, or Milestone 2 completion.

## Acceptance and Next Gate

Human / ChatGPT acceptance is pending. After acceptance, the only named next candidate is one separately authorized synthetic live rerun. This review does not authorize API/DB access, secret access, migration work, retry, Repair, fallback, PB-07, PR creation, merge to `main`, or full PB-04 through PB-06 prose-quality improvement.

## R2 Safety Aggregation & Report Direction Grounding Successor

- Task: `M2-P4-I1-C-R2`
- Baseline: `bee69d1cf0f1792786eccc6508fb5e7184ad6241`
- Branch: `fix/m2-p4-i1-c-r2-safety-report-grounding`
- Status: implementation and required offline validation complete; Human / ChatGPT acceptance pending
- External execution: OpenAI calls `0`; DB operations `0`; migrations `0`; holdout use `0`; real-user data `0`; live rerun not executed

R2 corrects two independently observed fail-closed findings without weakening PB-06. Contextual runtime now derives aggregate `response_mode` from the strictest classification and application-owned reason-code mapping. `normal_allowed` always yields `none`, including `reason_codes=["normal"]` and an empty list. Non-normal aggregation removes only a mixed `normal` code, maps known high-risk codes to the required specialized response, and uses `unsafe_contact_stop` only for the named contact-risk codes or when no specialized non-normal mapping exists. Historical `policy.ts` and `aggregateSafety()` remain unchanged for legacy runtime.

After PB-05, contextual runtime deterministically replaces only `relationship_summary` from DecisionFactsV2. Incoming/unreplied, outgoing/reply-wait, no-direct-message, and unknown-sender states each have an application-owned description that adds no inner state, romantic interest, or future claim. PB-05 raw output remains Stage evidence; the grounded projection is supplied to PB-06 and persisted in the final report. This is not retry, Repair, PB-07, or fallback.

Exact R2 mutation scope is 10 literal paths:

1. `lib/assessment/runtime/safety-aggregation-v3.ts`
2. `lib/assessment/runtime/report-grounding-v3.ts`
3. `lib/assessment/runtime/pipeline.ts`
4. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
5. `evals/runtime/m2-p4-i1-c-capabilities-v1.json`
6. `docs/phase2/TASK_M2_P4_I1_C_REVIEW.md`
7. `docs/CURRENT_FOCUS.md`
8. `docs/WBS.md`
9. `docs/CODEX_HANDOFF.md`
10. `scripts/verify-m2-eval-foundation.mjs`

The original I1-C 21-path and R1 12-path records remain immutable. The R2 verifier covers six Safety aggregation cases, four report-direction states, deliberately reversed PB-05 raw output, grounded PB-06 input and final report, major/critical PB-06 fail-closed behavior, the live-failure equivalent `normal_allowed -> none -> reply_now -> non-null draft -> report 1`, policy parity `40/40`, exact R2 scope `10/10`, protected diff `0`, and zero external execution. Automated PASS does not constitute Human / ChatGPT acceptance or provider-backed prose-quality evidence.

## R3 PB-01 Evidence Canonicalization Successor

- Task: `M2-P4-I1-C-R3`
- Baseline: `2659c14d82fe2589d2e1cfc655c52c13b878dc7c`
- Branch: `fix/m2-p4-i1-c-r3-intake-evidence-grounding`
- Status: implementation and required offline validation complete; Human / ChatGPT acceptance pending
- External execution: OpenAI calls `0`; DB operations `0`; migrations `0`; holdout use `0`; real-user data `0`; live rerun not executed

R3 preserves Provider PB-01 output unchanged as Stage evidence, then deep-clones it for downstream grounding. The application makes request `relationship`, exact `requestedTopics`, and trimmed `optionalMessage` presence authoritative; removes contextual inferences and unresolved markers for `relationship_stage` and `contact_state.proposed_message_present`; rebuilds every remaining inference `source_refs` as a stable unique union of its existing supporting facts; and derives `used_context_inference` from the remaining inference count. It neither invents facts nor changes supporting IDs, inferred values, rationale, Schema, Prompt, catalog, or hash.

The grounded object is revalidated against the canonical PB-01 Schema and the unchanged strict Contextual Integrity validator before PB-02. Missing supporting facts, duplicate inference IDs, duplicate inferred fields, forbidden boundary inference, and inferred/unresolved collisions remain rejected. Raw PB-01 evidence stays separate from the grounded object supplied to PB-02 through PB-06.

Exact R3 mutation scope is 9 literal paths:

1. `lib/assessment/runtime/structured-intake-grounding-v3.ts`
2. `lib/assessment/runtime/pipeline.ts`
3. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
4. `evals/runtime/m2-p4-i1-c-capabilities-v1.json`
5. `scripts/verify-m2-eval-foundation.mjs`
6. `docs/phase2/TASK_M2_P4_I1_C_REVIEW.md`
7. `docs/CURRENT_FOCUS.md`
8. `docs/WBS.md`
9. `docs/CODEX_HANDOFF.md`

The original I1-C 21-path, R1 12-path, and R2 10-path records remain immutable. R3 regression evidence covers the `2026-07-31` live-failure equivalent, application-owned field correction, stable source-ref union, relationship-only inference removal, proposed-message true/false derivation, raw Stage evidence preservation, grounded PB-02-through-PB-06 input, full Fake `ready -> reply_now -> non-null draft -> report 1`, PB-06 major/critical fail-closed behavior, policy parity `40/40`, exact scope `9/9`, protected diff `0`, and zero external execution. Automated PASS does not constitute Human / ChatGPT acceptance, provider-backed quality evidence, live execution, merge, release, or Milestone 2 completion.

## R4 Temporal Change-Condition Semantics Successor

- Task: `M2-P4-I1-C-R4`
- Baseline: `e4e844cbaa8534c68a0d87d5831d04b5afe676a1`
- Branch: `fix/m2-p4-i1-c-r4-temporal-change-semantics`
- Status: implementation and required offline validation complete; Human / ChatGPT acceptance pending
- External execution: OpenAI calls `0`; DB operations `0`; migrations `0`; holdout use `0`; real-user data `0`; live rerun not executed

R4 separates the current application-owned decision policy from future change conditions. Contextual runtime deterministically replaces PB-05 `change_condition_commentary` in PB-04 `change_conditions` order. Each application-owned sentence states an observable future condition and only then describes the direction to reconsider; it never converts a future `wait_and_reassess` or `pause_additional_contact` branch into a current instruction. Raw PB-05 output remains Stage evidence. The relationship-grounded and change-condition-grounded projection is revalidated against the unchanged PB-05 Schema, supplied to PB-06, and persisted in the final report.

Application-owned semantic disposition ignores only two exact temporal false-positive forms: `DECISION_ALLOWED` on an existing `decision_plan.change_conditions[N].resulting_direction`, with or without the leading `$.`; and `MESSAGE_POLICY_CONSISTENCY` on `report_content.change_condition_commentary[N]`, with or without `$.`, only when the actual commentary exactly equals the application-owned projection for that index. Selected decision, message draft, actions, three-day plan, fact fidelity, assumptions, Safety, unsupported certainty, mismatched commentary, every other major/critical finding, invalid envelope, and legacy runtime remain blocking exactly as before. Minor findings remain nonblocking. This disposition is not retry, Repair, PB-07, or fallback.

Exact R4 mutation scope is 10 literal paths:

1. `lib/assessment/runtime/change-condition-grounding-v3.ts`
2. `lib/assessment/runtime/semantic-disposition-v3.ts`
3. `lib/assessment/runtime/pipeline.ts`
4. `scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs`
5. `evals/runtime/m2-p4-i1-c-capabilities-v1.json`
6. `scripts/verify-m2-eval-foundation.mjs`
7. `docs/phase2/TASK_M2_P4_I1_C_REVIEW.md`
8. `docs/CURRENT_FOCUS.md`
9. `docs/WBS.md`
10. `docs/CODEX_HANDOFF.md`

The original I1-C 21-path, R1 12-path, R2 10-path, and R3 9-path records remain immutable. R4 regression evidence covers all four future directions, both exact JSON-path forms, the four-finding `2026-07-31` live-failure equivalent as temporal false positives `4` / blocking `0` / final report `1`, raw PB-05 and PB-06 Stage evidence, grounded PB-06 input and final report, preserved relationship grounding, selected-decision/draft/fact/Safety blocking cases, mismatched-commentary blocking, policy parity `40/40`, exact R4 scope `10/10`, protected diff `0`, and zero external execution. Prompt, Schema, catalog, hash, legacy runtime, and normal PB-06 major/critical fail-closed behavior are unchanged. Automated PASS does not constitute Human / ChatGPT acceptance, provider-backed quality evidence, live execution, merge, release, or Milestone 2 completion.
