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

## Exact Implementation Scope

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
