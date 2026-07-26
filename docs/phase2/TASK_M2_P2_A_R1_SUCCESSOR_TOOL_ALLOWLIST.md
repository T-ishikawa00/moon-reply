# Task M2-P2-A-R1 Successor Tool Allowlist

## 1. Status

- Correction ID: `M2-P2-A-R1`
- Name: `Foundation Successor Local Tool Allowlist Correction`
- Branch: `design/m2-p2-a-zero-cost-estimator`
- Base SHA: `e673d015ea7da1f6f1d6f00457014f07072d3011`
- State: correction implemented; all required automated validation passes; isolated correction commit boundary defined

## 2. Triggering failure

The accepted M2-P1 foundation verifier passed every historical, dataset, Prompt, Schema, oracle-isolation, runtime-isolation, and capability gate, but its current-task scope rejected the three M2-P2-A local scripts. The failure was limited to `M2_PROHIBITED_IMPLEMENTATION_GATE`.

## 3. Human authorization

Human / ChatGPT authorized preservation of the complete M2-P2-A 16-file working tree and authorized a bounded verifier amendment. The amendment may allow only three named local tools and does not authorize API execution, provider integration, model selection, runtime implementation, M2-P2-B, main merge, or PR creation.

## 4. Preserved 16-file working tree

The correction was prepared without deleting, restoring, resetting, stashing, or rolling back the existing four modified and twelve untracked M2-P2-A files. Those 16 files remain outside the correction commit.

## 5. Exact old allowlist owner

The stale allowlist owner was the `exactAllowed` set inside `verifyScopeAndProhibitedImplementation()` in `scripts/verify-m2-eval-foundation.mjs`. Its only allowed `scripts/` path was:

- `scripts/verify-m2-eval-foundation.mjs`

`currentTaskPaths()` evaluates `baseCommit` against the current working tree and adds all untracked paths. This is a working-tree-inclusive current-scope audit, not a HEAD-only audit. Separately, `verifyExactMutationManifest()` preserves the immutable accepted M2-P1 historical commit-range comparison.

## 6. Rejected paths

The old current-scope branch rejected:

- `scripts/render-m2-dry-run-requests.mjs`
- `scripts/estimate-m2-static-costs.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`

The M2-P2-A documents passed through the existing `docs/phase2/` prefix, and estimator data passed through the existing `evals/` prefix. No `scripts/` prefix was authorized, so the three scripts alone failed the exact-root test.

## 7. Exact three-path authorization

The verifier now contains one code-owned fixed set with exactly:

- `scripts/render-m2-dry-run-requests.mjs`
- `scripts/estimate-m2-static-costs.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`

Presence is optional. A repository state before these successor tools exist remains valid, while any present tool is subject to isolation checks.

## 8. No-wildcard policy

No `scripts/**` prefix, glob, regular-expression family such as `verify-m2-*`, environment option, or configuration-driven self-authorization was added. Any other changed path under `scripts/` fails the successor path gate and the parent prohibited-implementation gate.

## 9. Local-only isolation rules

Each present successor tool is statically checked for:

- Node built-ins or relative imports resolving only to the other exact successor tools;
- no HTTP, HTTPS, socket, DNS, fetch, browser-request, or socket-client capability;
- no child-process invocation of curl, wget, PowerShell, or web-request commands;
- no OpenAI or other provider SDK import or invocation;
- no environment or API-secret read and no key-like material;
- no database, authentication, payment, or email client invocation;
- no API route or server action wiring;
- no application or UI import.

## 10. Historical M2-P1 preservation

The correction does not change:

- `docs/phase2/M2_P1_EXACT_MUTATION_MANIFEST.json`;
- the accepted historical base or end commit constants;
- historical mutation counts or paths;
- accepted datasets, fixtures, Schemas, Prompt assets, hashes, retry policy, stage contracts, holdout isolation, oracle leakage checks, runtime isolation, or capability flags.

## 11. New verifier gates

The verifier emits:

- `M2_SUCCESSOR_LOCAL_TOOL_PATH_GATE`
- `M2_SUCCESSOR_LOCAL_TOOL_ISOLATION_GATE`

Both gates must pass for `M2_PROHIBITED_IMPLEMENTATION_GATE` and the overall `M2_EVAL_FOUNDATION_GATE` to pass.

## 12. Correction validation

| Validation | Result |
| --- | --- |
| `M2_SUCCESSOR_LOCAL_TOOL_PATH_GATE` | `PASS` |
| `M2_SUCCESSOR_LOCAL_TOOL_ISOLATION_GATE` | `PASS` |
| Successor tools absent in isolated local clone | `PASS` |
| `M2_EVAL_FOUNDATION_GATE` | `PASS` |
| `M2_ZERO_COST_ESTIMATOR_GATE` | `PASS` |
| `M2_P2_A_EXACT_SCOPE_GATE` | `PASS` |
| `CONTENT_LOCK_GATE` | `PASS` |
| `SAFETY_POLICY_GATE` | `PASS` |
| typecheck | `PASS` |
| lint warning 0 | `PASS` |
| build | `PASS` — 28 static/SSG pages generated |
| `git diff --check` | `PASS` |

The first typecheck was launched concurrently with `next build` and encountered a transient missing `.next/types/routes.js` generated-artifact race. The required standalone rerun after build completed passed. No source correction was needed for that transient result.

No OpenAI API call, external network request, provider invocation, secret read, database/authentication/payment/email operation, API route, server action, UI execution, or application-runtime execution occurred. API spend remained USD 0.

## 13. Correction commit boundary

The correction commit stages exactly:

- `scripts/verify-m2-eval-foundation.mjs`
- `docs/phase2/TASK_M2_P2_A_R1_SUCCESSOR_TOOL_ALLOWLIST.md`

Required commit message: `fix: allow approved M2 successor local tools`.

## 14. M2-P2-A resume condition

M2-P2-A may resume only after both successor gates and the complete M2 foundation gate pass, the correction is committed independently, and the preserved original 16-file task scope remains the only remaining working-tree mutation set.

## 15. API/runtime prohibition

API and external network calls, provider invocation, secret access, database, authentication, payment, email, API route, server action, UI, and application/runtime implementation remain prohibited. API spend remains USD 0. M2-P2-B remains unauthorized.
