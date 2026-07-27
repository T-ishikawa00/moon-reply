# Task M2-P2-B0-R1 Successor Tool Allowlist Correction

## 1. Status

- Correction ID: `M2-P2-B0-R1`
- Parent task: `M2-P2-B0 One-Case Paid Calibration Contract Foundation`
- Branch: `design/m2-p2-b0-calibration-contract`
- Base SHA: `cadd019303247310623f582a505d5745c0186b30`
- State: bounded correction implemented; automated validation required before commit
- Required commit: `fix: allow approved M2 calibration contract tools`

## 2. Trigger and authority

The accepted M2 foundation verifier has a code-owned exact allowlist for successor local tools. M2-P2-B0 authorizes exactly two additional local-only scripts:

- `scripts/prepare-m2-p2-b0-calibration-contract.mjs`
- `scripts/verify-m2-p2-b0-calibration-contract.mjs`

Their presence is optional so the correction can be committed before the B0 implementation files exist. No other script path is authorized.

## 3. Exact correction

The fixed `successorLocalToolPaths` set in `scripts/verify-m2-eval-foundation.mjs` adds only the two full paths above. The correction adds no wildcard, `scripts/**` prefix, `verify-m2-*` family, prefix matching, environment switch, or configuration-driven self-authorization.

Every present successor tool remains subject to the existing static isolation checks:

- imports are Node built-ins or exact authorized successor-tool peers;
- network built-ins and network calls are prohibited;
- provider SDK imports and provider calls are prohibited;
- environment and secret reads are prohibited;
- database, authentication, payment, email, API route, server action, application, and UI imports or execution are prohibited; and
- key-like or Authorization material is prohibited.

## 4. Preserved boundaries

This correction does not change accepted M2-P1 or M2-P2-A fixtures, Schemas, Prompts, hashes, policies, estimator reports, historical manifests, runtime capabilities, application code, UI, package files, or dependencies.

It does not authorize:

- OpenAI API or external-network execution;
- API-key access;
- a provider executor;
- model selection for the product or baseline;
- paid execution or any spend;
- M2-P2-B1;
- retry, Repair, fallback, 14-case, 70-case, or holdout execution;
- main mutation, merge, rebase, force push, or PR creation.

## 5. Commit boundary

The correction commit must contain exactly:

- `scripts/verify-m2-eval-foundation.mjs`
- `docs/phase2/TASK_M2_P2_B0_R1_SUCCESSOR_TOOL_ALLOWLIST.md`

B0 implementation files must not be staged in this correction commit. API spend remains USD 0 and live execution remains unauthorized.
