# M2-P2-B1-B2-B0-R1 Scope and Execution Boundary

## 1. Lifecycle trigger

M2-P2-B1-B2-A is accepted and complete. Its verifier previously relied on the implementation manifest exported by the current checkout, so a later authorized successor could weaken the historical evidence boundary. This correction freezes B1-B2-A before any B0 execution-package implementation file exists.

## 2. Historical B1-B2-A base/end

- Historical base: `fa222917f0e6ff4a4e25d11da239717c062af6d0`
- Historical end: `76ceb4a25cc565e84b9537bd25dbe703f87bd342`
- Scope type: `historical_commit_range`
- Later HEAD, index, and working tree: excluded
- Snapshot: immutable

## 3. Preserved 41-file scope

`docs/phase2/M2_P2_B1_B2_A_HISTORICAL_SCOPE.json` records the exact accepted B1-B2-A implementation delta: 41 files, with 37 additions, 4 modifications, and 0 deletions. No acceptance commit, B0 file, index entry, unstaged file, or untracked file is part of that snapshot.

## 4. Exact nine successor scripts

Only these complete paths are registered as B0 successor scripts:

1. `scripts/prepare-m2-p2-b1-b2-b0-execution-package.mjs`
2. `scripts/run-m2-p2-b1-b2-b0-preflight-blocked.mjs`
3. `scripts/verify-m2-p2-b1-b2-b0-execution-package.mjs`
4. `scripts/run-m2-p2-b1-b2-b-paid-once.mjs`
5. `scripts/lib/m2-p2-b1-b2-b0-approval-record.mjs`
6. `scripts/lib/m2-p2-b1-b2-b0-paid-cli.mjs`
7. `scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs`
8. `scripts/lib/m2-p2-b1-b2-b0-price-snapshot.mjs`
9. `scripts/lib/m2-p2-b1-b2-b0-external-paths.mjs`

## 5. Exact verifier owners

The exact successor paths and capability confinement are owned by:

- `scripts/verify-m2-eval-foundation.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`
- `scripts/verify-m2-p2-b1-a-offline-runner.mjs`
- `scripts/verify-m2-p2-b1-b1-provider-adapter.mjs`
- `scripts/verify-m2-p2-b1-b2-a-live-bindings.mjs`

## 6. Direct capability ownership

Only `scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs` may directly import `node:fs`, `node:fs/promises`, `node:path`, or `node:os`. No B0 successor may directly import `node:https`, `node:http`, `node:tls`, `node:net`, or `node:dns`, and no B0 successor may directly access the API-key environment variable. The future paid CLI must use the accepted injected B1-B2-A secret provider and HTTPS executor.

## 7. No-wildcard policy

Authorization uses exact full-path set membership. Wildcards, prefixes, `scripts/**`, `verify-m2-*`, directory-derived authorization, and config-based self-authorization are prohibited. An absent successor file remains valid for historical checkouts.

## 8. No-import-side-effect policy

Importing any successor module must not read a filesystem, resolve a secret, invoke a child process, start a network request, write an artifact, consume a one-time marker, or inspect Git. Every capability operation requires an explicit runtime call after its preceding gates.

## 9. Zero-secret CodeX process requirement

The CodeX process must not contain the API-key environment variable. Existence is tested without printing a value, prefix, suffix, or length. Any presence is a hard stop before mutation.

## 10. Zero-network requirement

This task performs no provider execution and no external HTTPS request. The checked-in preflight uses injected in-memory dependencies and must stop before secret resolution or HTTPS. API spend remains USD 0.

## 11. Historical evidence preservation

The B1-B2-A verifier validates both commit objects, base-to-end ancestry, end-to-current-HEAD ancestry, and only the fixed historical diff. Current HEAD, index, working tree, later acceptance commits, and B0 files cannot change the accepted 41-file result.

## 12. Validation

Before the correction commit, all accepted M2 and M1 gates, typecheck, lint, build, and `git diff --check` must pass. Historical gates must prove the exact 41-file A/M/D result while all nine B0 implementation paths remain absent.

## 13. Correction commit boundary

The correction commit contains exactly the historical-scope contract, this record, and the six owning verifiers. It contains no B0 implementation file, external approval record, accepted machine-asset modification, application/UI change, or package/dependency change.

## 14. Execution-package resume condition

B0 execution-package implementation may start only after this eight-file correction is validated, committed as `fix: anchor dormant live binding scope for paid execution`, and normally pushed to `origin/design/m2-p2-b1-b2-b0-paid-execution-package`.

## 15. Paid execution prohibition

This correction does not authorize a true approval record, API-key access, a paid run, a provider request, retry, Repair, fallback, Batch, PB-07, 14-case, 70-case, holdout, real-user execution, or product/baseline model selection. M2-P2-B1-B2-B1 remains unauthorized and not started.
