# M2-P2-B1-A-R1 Successor Tool Allowlist Correction

## 1. Triggering successor boundary

M2-P2-B1-A introduces an offline-only Runner after the accepted M2-P1, M2-P2-A, and M2-P2-B0 foundations. Their verifier owners must recognize the new local tools without treating later lifecycle files as part of any accepted historical manifest.

## 2. Exact six paths

Only these optional paths are authorized:

- `scripts/prepare-m2-p2-b1-a-offline-runner.mjs`
- `scripts/run-m2-p2-b1-a-offline.mjs`
- `scripts/verify-m2-p2-b1-a-offline-runner.mjs`
- `scripts/lib/m2-p2-b1-a-contract.mjs`
- `scripts/lib/m2-p2-b1-a-runner-core.mjs`
- `scripts/lib/m2-p2-b1-a-offline-replay-transport.mjs`

There is no wildcard, directory-wide allowance, prefix-family allowance, verifier-name pattern, or config-based self-authorization.

## 3. Exact verifier owners

- `scripts/verify-m2-eval-foundation.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`

## 4. No-wildcard policy

Authorization is by exact repository-relative full path. Presence is optional so the accepted older gates continue to pass before B1-A exists. Any non-listed script remains unauthorized.

## 5. Historical-scope preservation

The accepted M2-P1, M2-P2-A, and M2-P2-B0 manifests, file counts, commit ranges, fixtures, Prompt assets, Schemas, reports, price snapshot, and hashes remain unchanged. The B0 exact-scope gate reads its immutable accepted implementation range; later B1-A files are not added to the historical B0 count.

## 6. Local-only import policy

When any of the six tools is present, imports are restricted to non-network Node built-ins and exact peers among the same six paths. Network transports, provider/database/auth/payment/email SDKs, environment or secret access, application/UI wiring, API routes, server actions, authorization headers, key-like literals, and shell network clients are rejected. `node:child_process` is allowed only in the exact B1-A verifier and is prohibited in the other five tools.

## 7. New gates

- `M2_B1_A_SUCCESSOR_PATH_GATE`
- `M2_B1_A_SUCCESSOR_ISOLATION_GATE`

Each parent aggregate requires both gates. With all six tools absent, both gates pass. When present, exact-path and isolation checks apply.

## 8. Validation

Before this correction commit, all B1-A implementation files remain absent. The accepted M2 and M1 verifiers, typecheck, lint with zero warnings, production build, and `git diff --check` must pass.

## 9. Correction commit scope

The correction commit contains exactly this record and the three verifier-owner modifications. It contains no B1-A implementation file.

## 10. B1-A resume condition

B1-A implementation may begin only after the four correction files pass validation, are committed as `fix: allow approved M2 offline runner tools`, and are pushed normally to `origin/design/m2-p2-b1-a-offline-runner`. M2-P2-B1-B live provider work remains unauthorized.
