# M2-P4-I3-R1-C1-R2 Review

## Status

- Task: `M2-P4-I3-R1-C1-R2 PB-01 v5 Bounded Provider Diagnostic`
- Status: `human_chatgpt_reviewed_fail_complete`
- Authorization: `M2-P4-I3-R1-C1-R2-2026-08-01`
- Confirmation: `R1-C1-R2-8-CALL-SYNTHETIC-ONLY`
- Baseline: `277101219c27477e67e1196af0e6067713571edc`
- Branch: `test/m2-p4-i3-r1-c1-r2-provider-diagnostic`
- Commit A: `d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e`
- Commit B: `7239f50fd24eb80369e74583cd619c2155813401`
- Exact diagnostic snapshot: `17/17`
- Exact review sync scope: `8/8`
- Model / stage: `gpt-5.6-luna` / `PB-01 v5 only`
- Synthetic cases / authorized Provider calls: `8 / 8`
- Actual / completed Provider calls: `8 / 8`
- Retry / repair / fallback: `0 / 0 / 0`
- PB-02 through PB-06 / DB / Supabase / holdout / real-user data: `0 / 0 / 0 / 0 / 0`
- Authorization consumed / rerun authorized: `true / false`
- Execution protocol accepted: `true`
- Diagnostic evidence valid: `true`
- Post-run evaluator correction accepted: `true`
- Provider product gate passed: `false`
- Verdict / cases passed: `FAIL / 5 of 8`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`
- Next candidate: `M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision`
- Next candidate authorized: `false`
- I3 final acceptance: `pending`
- Milestone 2: `incomplete`
- `main`: unchanged at `61e33a10e195fad17e253a6b9719217e1992f273`

## Historical verifier compatibility

- Mode: `accepted_sha_external_clone`
- Historical verifier SHA: `277101219c27477e67e1196af0e6067713571edc`
- Historical snapshot revalidation: `7/7`
- Historical verifiers current-branch compatible: `false`
- Incompatibility reason: `exact R1-C1-R1 31-path snapshot authority`
- Old verifier mutations / scope expansion: `0 / 0`

The seven historical verifiers passed only against the accepted SHA in a clean external clone. This proves the accepted historical evidence remains self-consistent; it does not claim those verifiers support the R2 successor branch, does not establish R2 Provider quality, and does not authorize Runtime activation.

The one-time sequential eight-call synthetic-only diagnostic completed. It tested Provider-owned semantic `writing_signals` and then ran deterministic Application grounding and validation locally. It did not call Service or the full Pipeline and does not authorize Runtime activation, C2, E1, PR, main merge, release, or rerun.

## Human / ChatGPT review

- [x] The bounded execution protocol is accepted.
- [x] The diagnostic evidence is valid.
- [x] The saved-evidence offline evaluator correction is accepted.
- [x] The Provider product gate remains failed.
- [x] C2 remains ineligible and unauthorized.
- [x] No rerun is authorized.

The final review status is `human_chatgpt_reviewed_fail_complete`. This accepts the execution protocol, evidence, and deterministic evaluator correction; it does not accept Provider product quality.

## Immutable diagnostic snapshot

- Type: `historical_commit_range`
- Base commit: `277101219c27477e67e1196af0e6067713571edc`
- End commit: `7239f50fd24eb80369e74583cd619c2155813401`
- Exact paths: `17/17`
- Immutable snapshot: `true`
- Include working tree: `false`
- Execution commits: `d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e`, `7239f50fd24eb80369e74583cd619c2155813401`

Commit B is the immutable source for the R2 execution evidence. The review sync changes none of the nine execution-evidence blobs outside its exact eight-path manifest.

## Diagnostic outcome

- Provider transport / returned-model record / raw JSON / raw Schema v5: `8/8` each
- Forbidden bookkeeping / grounded Schema v4 / Writing Context Integrity v2: `8/8` each
- Provider semantic core: `5/8`
- Contextual intake Integrity / Application Decision Facts: `7/8` each
- Message ownership: `6/8`
- Boundary ownership / candidate presence / relationship limits / privacy-repeat-injection / Application grounding: `8/8` each
- Candidate style / intent: `4/4` each
- Soft style assertions: `5/6` (nonblocking)
- R2-03 / R2-04 grounded boundaries: `none / none` and `no_contact / explicit`
- Principal R2-08 quoted-message ownership: `FAIL`
- Secret leakage: `0`
- Usage: input `46190`, cached `39298`, output `11310`, reasoning `1279` tokens

## Accepted failure analysis

### R2-03

The Provider identified the semantic statement `職場では私的な話をしない` but emitted `custom_explicit_constraint` instead of `no_private_contact_at_work`. The grounded boundary remained `none / none`. This is a classification-taxonomy failure, not a restrictive-boundary safety failure.

### R2-04

Application Decision Facts correctly retained `sender=other_person` and `boundary=no_contact / explicit`. Provider `writing_signals` instead emitted `author=unknown`, `status=quoted_history`, and incoming-message `present=unknown`. This is a cross-projection message-ownership inconsistency and a Provider semantic failure. The final restrictive boundary remained protected.

### R2-08

Injection detection, privacy categories, repeat state, and candidate absence passed. Provider `message_signals` was nevertheless empty, omitting quoted other-person message ownership. The principal Provider ownership gate therefore failed.

R2-07 passed after applying the accepted nonrestrictive-boundary rule.

Post-run offline evaluation used `saved_evidence_offline_recompute` and corrected two deterministic evaluator defects without another Provider call or any Provider-output mutation: privacy categories are an unordered set, and a user-owned nonrestrictive `other` boundary is allowed for R2-03/R2-07. Provider calls added and Provider outputs mutated were both `0`. The verdict was `FAIL` before and `FAIL` after; case pass count changed from `4/8` to `5/8`, boundary ownership from `6/8` to `8/8`, and privacy-repeat-injection from `7/8` to `8/8`. The correction introduced no expected data into Provider input.

## Diagnostic boundary

The inactive candidate is catalog `runtime-stage-catalog-v6.0.0`, prompt bundle `prompt-bundle-runtime-v6.0.0`, raw Provider Schema `pipeline-schema-v5.0.0`, and grounded Application Schema `pipeline-schema-v4.0.0`. Only PB-01 is invoked. The Provider classifies bounded meaning; Application code owns provenance, evidence state, identifiers, sequence, candidate insertion, source unions, final Writing Context, and Decision Facts evidence guarding.

The case file contains only `case_id`, `name`, synthetic `AssessmentInput`, and `focus_tags`. Expected values and assertions are isolated in the quality contract and are never passed to the Provider. All eight inputs are semantically identical to the accepted C1 synthetic bundle. No case ID, fixture identifier, oracle, expected value, or assertion enters a Provider request.

## One-time execution control

The tracked authorization began unconsumed. Immediately before the first Provider call, the runner claimed execution in memory and atomically created the repo-local `.git` consumption marker. The existing OpenAI transport ran with its SDK retry count explicitly forced and checked at zero. Provider calls ran sequentially, one per case, with no retry, repair, PB-07, fallback, or automatic extension. The immutable execution artifact records `consumed=true`, actual calls `8`, completion state `provider_diagnostic_failed_pending_human_chatgpt_review`, and `rerun_authorized=false`; the separate review capability status is now `human_chatgpt_reviewed_fail_complete`.

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

## Exact review sync manifest

1. `evals/runtime/m2-p4-i3-r1-c1-r2/capabilities-v1.json`
2. `docs/phase2/TASK_M2_P4_I3_R1_C1_R2_REVIEW.md`
3. `scripts/verify-m2-p4-i3-r1-c1-r2-provider-diagnostic.mjs`
4. `scripts/verify-m2-eval-foundation.mjs`
5. `scripts/verify-m2-p3-runtime-vertical-slice.mjs`
6. `docs/CURRENT_FOCUS.md`
7. `docs/WBS.md`
8. `docs/CODEX_HANDOFF.md`

The review sync is exact `8/8`. It makes Provider calls `0`, adds no retry, repair, PB-07, fallback, PB-02 through PB-06, DB, Supabase, holdout, or real-user operation, and leaves the active Runtime and `main` unchanged.

## Review boundary

Commit A records the prepared one-time package. Commit B records only actual R2 evidence, the bounded offline evaluator correction, and state synchronization. Human / ChatGPT review is complete with the Provider verdict fixed at `FAIL`. C2 remains ineligible and unauthorized, and active Runtime and `main` remain unchanged. The next candidate is `M2-P4-I3-R1-C1-R2-R1 Offline Provider Semantic Consistency Revision`; it is not authorized.
