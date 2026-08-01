# M2-P4-I3-R1-C1-R2 Review

## Status

- Task: `M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic`
- Status: `provider_diagnostic_package_ready`
- Authorization: `M2-P4-I3-R1-C1-R2-2026-08-01`
- Confirmation: `R1-C1-R2-8-CALL-SYNTHETIC-ONLY`
- Baseline: `277101219c27477e67e1196af0e6067713571edc`
- Branch: `test/m2-p4-i3-r1-c1-r2-provider-diagnostic`
- Commit A: pending
- Model / stage: `gpt-5.6-luna` / `PB-01 v5 only`
- Synthetic cases / authorized Provider calls: `8 / 8`
- Actual Provider calls: `0`
- Retry / repair / fallback: `0 / 0 / 0`
- PB-02 through PB-06 / DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- Authorization consumed / rerun authorized: `false / false`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Next step after execution: Human / ChatGPT review
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`

## Historical verifier compatibility

- Mode: `accepted_sha_external_clone`
- Historical verifier SHA: `277101219c27477e67e1196af0e6067713571edc`
- Historical snapshot revalidation: `7/7`
- Historical verifiers current-branch compatible: `false`
- Incompatibility reason: `exact R1-C1-R1 31-path snapshot authority`
- Old verifier mutations / scope expansion: `0 / 0`

The seven historical verifiers passed only against the accepted SHA in a clean external clone. This proves the accepted historical evidence remains self-consistent; it does not claim those verifiers support the R2 successor branch, does not establish R2 Provider quality, and does not authorize Runtime activation.

The package is prepared for one exact sequential eight-call synthetic-only diagnostic. It tests Provider-owned semantic `writing_signals` and then runs deterministic Application grounding and validation locally. It does not call Service or the full Pipeline and does not authorize Runtime activation, C2, E1, PR, main merge, release, or rerun.

## Diagnostic boundary

The inactive candidate is catalog `runtime-stage-catalog-v6.0.0`, prompt bundle `prompt-bundle-runtime-v6.0.0`, raw Provider Schema `pipeline-schema-v5.0.0`, and grounded Application Schema `pipeline-schema-v4.0.0`. Only PB-01 is invoked. The Provider classifies bounded meaning; Application code owns provenance, evidence state, identifiers, sequence, candidate insertion, source unions, final Writing Context, and Decision Facts evidence guarding.

The case file contains only `case_id`, `name`, synthetic `AssessmentInput`, and `focus_tags`. Expected values and assertions are isolated in the quality contract and are never passed to the Provider. All eight inputs are semantically identical to the accepted C1 synthetic bundle. No case ID, fixture identifier, oracle, expected value, or assertion enters a Provider request.

## One-time execution control

The tracked authorization state begins unconsumed. Immediately before the first Provider call, the runner claims execution in memory and atomically creates the repo-local `.git` consumption marker. The existing OpenAI transport is used with its SDK retry count explicitly forced and checked at zero. Provider calls run sequentially, one per case, with no retry, repair, PB-07, fallback, or automatic extension. After the attempt, the tracked authorization artifact records `consumed=true`, actual calls, completion state, and `rerun_authorized=false` even when the product verdict is `FAIL`.

## Hard gates

R2 can pass only with exact `8/8` Provider calls and transport, raw Schema v5 `8/8`, grounded Schema v4 `8/8`, Writing Context Integrity v2 `8/8`, contextual intake Integrity `8/8`, Application-adjudicated Decision Facts `8/8`, Provider semantic core `8/8`, ownership / boundary / candidate presence / relationship limits / privacy-repeat-injection each `8/8`, zero forbidden bookkeeping, zero raw PII copied into `writing_signals`, and zero secret leakage. R2-08 quoted-message ownership is the principal gate. R2-03 must ground to `none / none`; R2-04 must preserve `no_contact / explicit`.

Soft style assertions are reported separately. A `0/0` metric has `rate=null` and `evidence_status=unavailable`; unavailable evidence is never converted to PASS.

## Exact mutation manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-cases-v1.json`
2. `evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-contract-v1.json`
3. `evals/runtime/m2-p4-i3-r1-c1-r2/quality-contract-v1.json`
4. `evals/runtime/m2-p4-i3-r1-c1-r2/authorization-v1.json`
5. `evals/runtime/m2-p4-i3-r1-c1-r2/capabilities-v1.json`
6. `evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-results-v1.json`
7. `evals/runtime/m2-p4-i3-r1-c1-r2/diagnostic-summary-v1.md`
8. `scripts/lib/m2-p4-i3-r1-c1-r2-provider-evaluator-v1.mjs`
9. `scripts/run-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs`
10. `scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs`
11. `docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md`
12. `scripts/verify-m2-p4-i3-r1-c1-r1-grounding-responsibility.mjs`
13. `scripts/verify-m2-eval-foundation.mjs`
14. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
15. `docs/CURRENT_FOCUS.md`
16. `docs/WBS.md`
17. `docs/CODEX_HANDOFF.md`

Production PB-01 v5 Prompt, Schemas, Writing Signals contract, grounding, evidence guard, Integrity v2, Pipeline, schema catalog, catalog v6, Service, routes, PB-02 through PB-06, Policy, Safety, UI, Supabase, package files, C1 evidence, R1-C1-R1 evidence, development, and holdout remain unchanged.

## Review boundary

Commit A records the prepared one-time package. Commit B may record only actual R2 evidence and state synchronization. Even a PASS does not make C2 eligible or authorized and does not change active Runtime or `main`. Human / ChatGPT review remains required before any separately authorized successor.
