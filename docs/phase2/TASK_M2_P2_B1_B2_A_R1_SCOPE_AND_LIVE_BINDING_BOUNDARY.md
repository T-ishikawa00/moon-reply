# M2-P2-B1-B2-A-R1 Scope and Live-Binding Boundary

## 1. Lifecycle trigger

M2-P2-B1-B1 is accepted and complete. Its verifier previously measured from the B1-B1 correction commit through the current checkout, so an authorized successor would be incorrectly absorbed into the accepted B1-B1 implementation scope. This correction freezes B1-B1 before any B1-B2-A implementation file exists.

## 2. B1-B1 historical base/end

- Historical base: `2f9fa4f2aa0616a03ec716bf0c09e1d0e0df038e`
- Historical end: `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`
- Scope type: `historical_commit_range`
- Later HEAD, index, and working tree: excluded
- Snapshot: immutable

## 3. Preserved 39-file scope

`docs/phase2/M2_P2_B1_B1_HISTORICAL_SCOPE.json` records the exact accepted B1-B1 implementation delta: 39 files, with 35 additions, 4 modifications, and 0 deletions. No B1-B2-A file is part of that snapshot.

## 4. Exact twelve successor paths

Only these complete paths are registered as B1-B2-A successor scripts:

1. `scripts/prepare-m2-p2-b1-b2-a-live-bindings.mjs`
2. `scripts/run-m2-p2-b1-b2-a-preflight-blocked.mjs`
3. `scripts/verify-m2-p2-b1-b2-a-live-bindings.mjs`
4. `scripts/lib/m2-p2-b1-b2-a-live-runner.mjs`
5. `scripts/lib/m2-p2-b1-b2-a-human-approval.mjs`
6. `scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs`
7. `scripts/lib/m2-p2-b1-b2-a-https-executor.mjs`
8. `scripts/lib/m2-p2-b1-b2-a-one-time-authorization.mjs`
9. `scripts/lib/m2-p2-b1-b2-a-artifact-bundle.mjs`
10. `scripts/lib/m2-p2-b1-b2-a-runtime-redaction.mjs`
11. `scripts/lib/m2-p2-b1-b2-a-budget-guard.mjs`
12. `scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs`

## 5. Exact verifier owners

The exact successor paths and capability confinement are owned by:

- `scripts/verify-m2-eval-foundation.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`
- `scripts/verify-m2-p2-b1-a-offline-runner.mjs`
- `scripts/verify-m2-p2-b1-b1-provider-adapter.mjs`

## 6. Special capability files

- Only `scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs` may reference `process.env` or `OPENAI_API_KEY`.
- Only `scripts/lib/m2-p2-b1-b2-a-https-executor.mjs` may import `node:https` or `node:tls`.
- Only `scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs` may import `node:child_process`.

These are capability locations, not live-execution authorization.

## 7. No-wildcard policy

Authorization uses exact full-path set membership. Wildcards, prefixes, `scripts/**`, `verify-m2-*`, directory-derived authorization, and config-based self-authorization are prohibited. An absent successor file remains valid for historical checkouts.

## 8. No-import-side-effect policy

Importing any successor module must not read an environment value, resolve a secret, start a network request, invoke a child process, write an artifact, or consume a one-time authorization. All capability operations require explicit future runtime invocation after the preceding gates.

## 9. No-live-execution policy

B1-B2-A fixes `live_execution_authorized` and `paid_run_authorized` to false. It may define network-capable bindings but must perform zero external HTTPS requests, zero provider calls, and USD 0 API spend.

## 10. No-real-secret policy

No API key exists for this task. B1-B2-A may define a single environment-secret binding but may not read the real process environment during preparation, blocked execution, verification, or artifact generation. Fixture environment objects are the only test inputs.

## 11. Historical-scope preservation

The B1-B1 verifier validates both commit objects, base-to-end ancestry, end-to-current-HEAD ancestry, and only the fixed historical diff. Current HEAD, index, working tree, later acceptance commits, and B1-B2-A files cannot change the accepted 39-file result.

## 12. Validation

Before the correction commit, every accepted M2/M1 gate, typecheck, lint, build, and `git diff --check` must pass. Historical gates must prove the exact 39-file A/M/D result while all twelve B1-B2-A implementation paths remain absent.

## 13. Correction commit boundary

The correction commit contains exactly the historical-scope contract, this record, and the five owning verifiers. It contains no B1-B2-A implementation file, accepted machine-asset modification, application/UI change, or package/dependency change.

## 14. B1-B2-A resume condition

B1-B2-A implementation may start only after this seven-file correction is validated, committed as `fix: anchor provider adapter scope for live bindings`, and normally pushed to `origin/design/m2-p2-b1-b2-a-live-bindings`.

## 15. B1-B2-B prohibition

This correction does not authorize OpenAI Project or billing setup, API-key creation, a true approval record, a paid run, a provider request, retry, Repair, fallback, Batch, PB-07, 14-case, 70-case, holdout, or real-user execution. M2-P2-B1-B2-B remains unauthorized and not started.
