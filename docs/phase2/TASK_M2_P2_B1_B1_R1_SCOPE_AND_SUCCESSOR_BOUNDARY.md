# M2-P2-B1-B1-R1 Scope and Successor Boundary

## 1. Triggering lifecycle boundary

M2-P2-B1-A is accepted and complete. Its verifier originally measured from the B1-A correction commit through the current checkout, so an authorized successor would be incorrectly absorbed into the accepted B1-A implementation scope. This correction freezes B1-A before any B1-B1 implementation file exists.

## 2. B1-A historical base and end

- Historical base: `22bbf6f69ad2e21d3d43808e3518970eb1dc48e7`
- Historical end: `630cde811d63e0304ed528dc2e426400e81506a6`
- Scope type: `historical_commit_range`
- Later HEAD, index, and working tree: excluded
- Snapshot: immutable

## 3. Preserved 30-file scope

`docs/phase2/M2_P2_B1_A_HISTORICAL_SCOPE.json` records the exact accepted B1-A implementation delta: 30 files, with 26 additions, 4 modifications, and 0 deletions. No B1-B1 file is part of that snapshot.

## 4. Exact eleven successor paths

Only these complete paths are registered as possible B1-B1 successor scripts:

1. `scripts/prepare-m2-p2-b1-b1-provider-adapter.mjs`
2. `scripts/run-m2-p2-b1-b1-network-blocked.mjs`
3. `scripts/verify-m2-p2-b1-b1-provider-adapter.mjs`
4. `scripts/lib/m2-p2-b1-b1-request-builder.mjs`
5. `scripts/lib/m2-p2-b1-b1-response-parser.mjs`
6. `scripts/lib/m2-p2-b1-b1-usage-ledger.mjs`
7. `scripts/lib/m2-p2-b1-b1-provider-adapter.mjs`
8. `scripts/lib/m2-p2-b1-b1-network-interlock.mjs`
9. `scripts/lib/m2-p2-b1-b1-secret-provider-contract.mjs`
10. `scripts/lib/m2-p2-b1-b1-redaction.mjs`
11. `scripts/lib/m2-p2-b1-b1-artifact-sanitizer.mjs`

The successor allowlist is an authorization boundary, not an implementation manifest. The separately fixed B1-B1 39-file manifest requires artifact-sanitizer functionality to live inside `m2-p2-b1-b1-redaction.mjs`; it therefore does not authorize creation of the eleventh path during B1-B1 implementation.

## 5. Exact verifier owners

The exact successor paths are owned by:

- `scripts/verify-m2-eval-foundation.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`
- `scripts/verify-m2-p2-b1-a-offline-runner.mjs`

## 6. No-wildcard policy

Authorization uses exact full-path set membership only. Wildcards, prefixes, `scripts/**`, `verify-m2-*`, directory-derived discovery, and config-based self-authorization are prohibited. An absent successor file does not fail an older accepted gate.

## 7. No-direct-network policy

Successor scripts may use Node built-ins only, excluding `http`, `https`, `http2`, `net`, `tls`, `dns`, and related network clients. Global fetch, WebSocket, shell network clients, provider SDKs, application/UI imports, and DB/auth/payment/email integrations remain prohibited.

## 8. No-secret-read policy

Successor scripts may not read or enumerate environment values, read an API key, embed an Authorization value, accept a CLI/config secret, or serialize secret material. B1-B1 defines injected interfaces only.

## 9. Historical scope preservation

The B1-A verifier validates both commit objects, the base-to-end ancestry, the end-to-current-HEAD ancestry, and only the fixed historical diff. Current HEAD, index, working tree, and B1-B1 files cannot change the accepted 30-file result.

## 10. New gates

- `M2_B1_A_HISTORICAL_SCOPE_CONTRACT_GATE`
- `M2_B1_A_HISTORICAL_SCOPE_HISTORY_GATE`
- `M2_B1_A_EXACT_SCOPE_GATE`
- exact B1-B1 successor-path and isolation sub-gates in all four owning verifiers

## 11. Validation

Before this correction commit, all accepted M2/M1 gates, typecheck, lint, build, and `git diff --check` must pass. The B1-A historical gates must report the exact 30-file A/M/D result and the successor gates must remain green while every B1-B1 implementation path is absent.

## 12. Correction commit boundary

The correction commit contains exactly the historical-scope contract, this record, and the four owning verifiers. It contains no B1-B1 implementation file, no accepted machine-asset modification, no application/UI change, and no package or dependency change.

## 13. B1-B1 resume condition

B1-B1 implementation may start only after this six-file correction is validated, committed as `fix: prepare historical scope for provider adapter`, and normally pushed to `origin/design/m2-p2-b1-b1-provider-adapter`.

## 14. B1-B2 prohibition

This correction does not authorize a live HTTP executor, environment secret provider, live approval record, API call, paid execution, retry, Repair, fallback, Batch, holdout, real-user execution, model selection, or M2-P2-B1-B2. Actual provider calls and API spend remain zero.
