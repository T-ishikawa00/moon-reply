# Task M2-P4-I1-B Review — Runtime Typed-Facts Integration

## Status

- Task ID: `M2-P4-I1-B`.
- Baseline SHA: `554d2cb5a2f816ac82edf3cc247458fe34a4a74c`.
- Branch: `feat/m2-p4-i1-b-runtime-typed-facts`.
- Implementation: accepted and complete within the authorized slice.
- Human / ChatGPT acceptance: accepted.
- Accepted implementation commit: `9588c8fd6ab47c265f5f661d4473a29d73885427`.
- Historical implementation snapshot: `554d2cb5a2f816ac82edf3cc247458fe34a4a74c..9588c8fd6ab47c265f5f661d4473a29d73885427`.
- Milestone 2: incomplete.

## Exact authorized scope

The mutation scope is exactly 16 literal paths:

1. `lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md`
2. `lib/assessment/runtime/contracts/structured-intake-v2.schema.json`
3. `lib/assessment/runtime/contracts/runtime-stage-catalog-v2.json`
4. `lib/assessment/runtime/policy-v2.ts`
5. `scripts/verify-m2-p4-i1-b-runtime-integration.mjs`
6. `evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json`
7. `docs/phase2/TASK_M2_P4_I1_B_REVIEW.md`
8. `lib/assessment/runtime/schema-catalog.ts`
9. `lib/assessment/runtime/service.ts`
10. `lib/assessment/runtime/pipeline.ts`
11. `lib/assessment/runtime/types.ts`
12. `scripts/verify-m2-eval-foundation.mjs`
13. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
14. `docs/CURRENT_FOCUS.md`
15. `docs/WBS.md`
16. `docs/CODEX_HANDOFF.md`

No wildcard, prefix authorization, waiver, or seventeenth path is used.

## Successor rationale and catalog

The historical M2-P1 PB-01 Prompt and Structured Intake Schema cannot carry the complete typed facts required by the accepted I1-A policy. Rewriting those accepted historical assets would corrupt their snapshot. I1-B therefore adds a PB-01 v2 successor Prompt and self-contained Draft 2020-12 Schema under `lib/assessment/runtime/contracts/`.

`runtime-stage-catalog-v2.json` binds the successor to baseline `554d2cb5a2f816ac82edf3cc247458fe34a4a74c`, Prompt bundle `prompt-bundle-runtime-v2.0.0`, Schema set `pipeline-schema-runtime-v2.0.0`, and actual SHA-256 UTF-8 LF hashes. It replaces PB-01 only. The common Prompt and PB-02 through PB-06 Prompt/Schema assets are inherited exactly from the accepted historical manifest, and the loader verifies every declared hash at runtime.

`loadCanonicalStageCatalog()` remains unchanged for historical M2-P3 verification. The active internal service now uses only `loadM2P4RuntimeStageCatalog()`.

## Typed-facts active path

PB-01 v2 retains every v1 Structured Intake field and adds required nullable `decision_facts`. A complete object preserves the accepted I1-A fact vocabulary; missing, contradictory, or decision-material unknown facts produce `null` without guessing.

For `ready`, the pipeline now:

1. requires and strictly validates `structured_intake.decision_facts`;
2. builds `decision-policy-v2.0.0` from those facts only;
3. passes the v2 policy and complete Structured Intake to PB-04;
4. validates the PB-04 plan against the v2 policy; and
5. passes the complete Structured Intake to PB-05 and PB-06.

`lib/assessment/runtime/policy.ts` remains byte-for-byte unchanged for historical Safety and policy evidence. Its `buildDecisionPolicy(request, structuredIntake)` function is no longer referenced by the active pipeline. The active decision path has no `currentSituation` access, raw Japanese consultation matching, regular expression, case-ID branch, fixture phrase, oracle lookup, evaluation import, network, DB, or environment access.

## Automated evidence

The dedicated verifier records:

```text
M2_P4_I1_B_RUNTIME_INTEGRATION: PASS
reference_decisions: 40/40
reply_now: 10/10
send_now: 10/10
wait_and_reassess: 10/10
pause_additional_contact: 10/10
baseline_fake_decision: reply_now
ready_null_facts_fail_closed: PASS
information_null_facts: PASS
safety_null_facts: PASS
active_raw_prose_policy: 0
openai_calls: 0
db_operations: 0
holdout_use: 0
```

The 40 I1-A fixtures match the accepted reference decision, message-draft policy, later-draft mode, follow-up exception, and pause/resume semantics. The Fake `M2P4-LIVE-001` equivalent carries an unanswered meaningful incoming direct message, gives PB-04 `allowed_decisions=["reply_now"]`, and finalizes both the report and decision card as `reply_now`.

The Fake baseline `reply_now` result is Human / ChatGPT accepted as I1-B offline integration evidence. It is not live-provider evidence.

`ready` plus null or malformed facts fails closed as `M2_DECISION_FACTS_INCOMPLETE`, does not execute PB-04, and persists no partial report. `needs_more_information` and `safety_blocked` accept null facts and stop normally before PB-04.

The I1-A verifier, M2 evaluation foundation verifier, M2-P3 verifier with every existing Gate retained, typecheck, lint, build, JSON parsing, protected-diff audit, exact-scope audit, and `git diff --check` pass.

## Execution boundary and disposition

- OpenAI live calls: `0`.
- DB operations: `0`.
- Migration operations: `0`.
- Holdout use: `0`.
- Real-user data: `0`.
- UI: unchanged.
- PB-04 through PB-06 Prompt quality: unchanged.
- Renderer: unchanged.
- Live synthetic smoke: not executed.
- Human / ChatGPT acceptance: accepted.
- PB-04/PB-05/PB-06 prose-quality improvement: not started.
- Milestone 2: incomplete.

The next candidate is one synthetic `M2P4-LIVE-001` live smoke. It requires separate explicit authorization, was not executed, and must not start automatically. No active implementation authority or further work is self-authorized.
