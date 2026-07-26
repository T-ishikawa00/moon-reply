# Task M2-P2-A Review Record

## 1. Task identity

- Task ID: `M2-P2-A`
- Task: `Zero-Cost Token & Cost Estimator Foundation`
- Branch: `design/m2-p2-a-zero-cost-estimator`
- Base SHA: `e673d015ea7da1f6f1d6f00457014f07072d3011`
- Expected commit message: `feat: add zero-cost M2 token estimator`
- Predecessor correction: `M2-P2-A-R1` at `deff429e45a411f0d6c6d5bd3f199adca994ebb5`
- State: estimator implemented and static estimate generated; all required automated gates and Human / ChatGPT review pass; accepted and complete
- Accepted estimator implementation commit: `2e2e0cc4c57c46320d56aa986055f65187aa6aee`

## 2. Authority

Authorized:

- deterministic local request-envelope rendering;
- deterministic Schema-shaped synthetic upstream profiles;
- exact byte/code-point/character/line metrics;
- configurable offline token-estimate bands;
- versioned USD price and scenario catalogs;
- static cost formulas and reports;
- permanent zero-cost estimator verifier;
- four status-document updates;
- one task commit and normal feature-branch push.
- acceptance synchronization limited to the exact eight approved documents;
- one acceptance commit and normal feature-branch push; and
- fast-forward-only synchronization to `main` followed by a normal `main` push.

Not authorized:

- API call, provider SDK, model benchmark, or model selection;
- network request or environment-secret read;
- database, authentication, payment, email, API route, server action, UI, or runtime implementation;
- accepted M2-P1 asset changes;
- M2-P2-B;
- API spend or model selection;
- merge commit, rebase, force push, or PR creation.

## 3. Exact mutation manifest

Allowed new files:

- `docs/phase2/M2_P2_A_ZERO_COST_ESTIMATOR_SPEC.md`
- `docs/phase2/M2_P2_A_STATIC_ESTIMATE_REPORT.md`
- `docs/phase2/TASK_M2_P2_A_REVIEW.md`
- `evals/cost-estimator/README.md`
- `evals/cost-estimator/price-catalog-v1.json`
- `evals/cost-estimator/estimator-config-v1.json`
- `evals/cost-estimator/scenario-catalog-v1.json`
- `evals/cost-estimator/stage-size-profiles-v1.json`
- `evals/cost-estimator/reports/static-estimate-v1.json`
- `scripts/render-m2-dry-run-requests.mjs`
- `scripts/estimate-m2-static-costs.mjs`
- `scripts/verify-m2-zero-cost-estimator.mjs`

Allowed status updates:

- `docs/ROADMAP.md`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`

No package or dependency change is allowed.

The separately committed M2-P2-A-R1 correction files are not part of this 16-file manifest. `M2_P2_A_EXACT_SCOPE_GATE` excludes exactly those two fixed correction paths and requires this original manifest without wildcard expansion.

The acceptance synchronization commit may change only:

- `docs/ROADMAP.md`;
- `docs/CURRENT_FOCUS.md`;
- `docs/CODEX_HANDOFF.md`;
- `docs/WBS.md`;
- `docs/phase2/M2_P2_A_ZERO_COST_ESTIMATOR_SPEC.md`;
- `docs/phase2/M2_P2_A_STATIC_ESTIMATE_REPORT.md`;
- `docs/phase2/TASK_M2_P2_A_REVIEW.md`; and
- `docs/phase2/TASK_M2_P2_A_R1_SUCCESSOR_TOOL_ALLOWLIST.md`.

Estimator scripts, generated JSON, configs, catalogs, M2-P1 assets, application/runtime files, and package files remain unchanged by acceptance synchronization.

## 4. Review checklist

### Request renderer

- [x] PB-01 through PB-06 render deterministically.
- [x] PB-07 appears only in the repair-stress scenario.
- [x] Every request uses `store: false`, `tools: []`, and an unselected model placeholder.
- [x] Developer Prompt, referenced shared assets, stage input, resolved Schema, and stage configuration are present.
- [x] Envelopes are labeled local drafts and not provider-validated requests.

### Oracle isolation

- [x] Only fixture `input` is projected.
- [x] Oracle and evaluator-only fields are absent from requests.
- [x] Local stop routing may use oracle without serializing it.
- [x] No holdout content is read.

### Synthetic profiles

- [x] `minimum`, `nominal`, and `conservative` exist.
- [x] Every stage output is accepted-Schema shaped.
- [x] Profiles are deterministic, synthetic, non-oracle, non-personal, and non-holdout.
- [x] Fixture and synthetic upstream bytes are separated.

### Estimate integrity

- [x] LOW/CENTRAL/HIGH formulas are configurable and explicit.
- [x] Estimated tokens are not labeled actual usage.
- [x] Nominal, conservative, and configured-cap output values are separate.
- [x] PB-07 inherits PB-05's output cap.
- [x] Standard/no-cache/HIGH-input/conservative-output is the baseline.
- [x] Batch is separate and cache savings are excluded.
- [x] Reasoning tokens remain unknown.

### Scenarios and formulas

- [x] All six exact scenarios exist.
- [x] Repair stress has three candidates, no fourth, and no repair-of-repair.
- [x] Cost formulas are applied per model and scenario.
- [x] No model has `selected_for_runtime: true`.
- [x] No JPY or live exchange rate is emitted.

### Boundaries

- [x] No OpenAI SDK import.
- [x] No network client invocation.
- [x] No environment-secret read.
- [x] No provider adapter.
- [x] No database, auth, payment, email, API route, server action, UI, or runtime wiring.
- [x] No accepted M2-P1 asset mutation.
- [x] No dependency change.

## 5. Automated gates

Final results are recorded after the exact validation sequence:

| Gate | Result |
| --- | --- |
| `M2_ZERO_NETWORK_GATE` | `PASS` |
| `M2_ZERO_SECRET_GATE` | `PASS` |
| `M2_ZERO_PROVIDER_GATE` | `PASS` |
| `M2_PRICE_CATALOG_GATE` | `PASS` |
| `M2_SCENARIO_CATALOG_GATE` | `PASS` |
| `M2_DRY_RUN_RENDER_GATE` | `PASS` |
| `M2_DRY_RUN_ORACLE_ISOLATION_GATE` | `PASS` |
| `M2_SYNTHETIC_PROFILE_GATE` | `PASS` |
| `M2_TOKEN_BAND_GATE` | `PASS` |
| `M2_ESTIMATE_LABEL_INTEGRITY_GATE` | `PASS` |
| `M2_COST_FORMULA_GATE` | `PASS` |
| `M2_REPAIR_STRESS_GATE` | `PASS` |
| `M2_ESTIMATOR_DETERMINISM_GATE` | `PASS` |
| `M2_REPORT_HASH_GATE` | `PASS` |
| `M2_P2_A_EXACT_SCOPE_GATE` | `PASS` |
| `M2_PROHIBITED_IMPLEMENTATION_GATE` | `PASS` |
| `M2_ZERO_COST_ESTIMATOR_GATE` | `PASS` |
| `M2_SUCCESSOR_LOCAL_TOOL_PATH_GATE` | `PASS` |
| `M2_SUCCESSOR_LOCAL_TOOL_ISOLATION_GATE` | `PASS` |
| `M2_EVAL_FOUNDATION_GATE` | `PASS` |
| `CONTENT_LOCK_GATE` | `PASS` |
| `SAFETY_POLICY_GATE` | `PASS` |
| typecheck | `PASS` |
| lint warning 0 | `PASS` |
| build | `PASS` — 28 static/SSG pages generated |
| `git diff --check` | `PASS` |

Automated PASS is not Human / ChatGPT review or model-quality acceptance. The separate explicit Human / ChatGPT decision accepts M2-P2-A without creating model-quality evidence.

## 6. Resolved successor-tool boundary

M2-P2-A-R1 corrected the stale current-task script boundary in an independent two-file commit. The foundation verifier now permits exactly:

- `scripts/render-m2-dry-run-requests.mjs`;
- `scripts/estimate-m2-static-costs.mjs`; and
- `scripts/verify-m2-zero-cost-estimator.mjs`.

No `scripts/**`, prefix, glob, `verify-m2-*` family, environment switch, or configuration-driven self-authorization was added. The three tools may import Node built-ins or each other by exact resolved path only. Network, provider, secret, database, authentication, payment, email, API route, server action, application, and UI capability remains prohibited.

The accepted historical M2-P1 manifest and commit-range checks are unchanged and pass. Dataset, Prompt, Schema, hash, retry, stage-contract, holdout, oracle-isolation, runtime-isolation, and capability gates also pass.

## 7. Known limitations

- No exact tokenizer is used.
- No provider validates the envelope.
- No actual usage, cache, reasoning, latency, refusal, or repair-frequency evidence exists.
- Synthetic upstream artifacts are sizing assumptions, not model outputs.
- The price catalog is a versioned task-supplied planning snapshot.
- No development, holdout, stability, or Human quality model run exists.

## 8. Review outcome

Current outcome: **M2-P2-A-R1 and M2-P2-A are Human / ChatGPT accepted and complete; automated gates pass**.

Accepted correction commit: `deff429e45a411f0d6c6d5bd3f199adca994ebb5`. Accepted estimator implementation commit: `2e2e0cc4c57c46320d56aa986055f65187aa6aee`. Accepted generated-report hash: `0e79050e8f44d91b2329e92e97fd91b833c0a37bda397bb16b20132beb4ec84f`.

M2-P2-A implementation does not authorize M2-P2-B. Development-70 is evaluation cost, not one customer report cost. The first possible paid calibration requires separate Human approval and is limited to one case, one model, no repair, one execution, and an absolute future spend ceiling of USD 1. Static token and cost values remain estimates; actual tokenizer usage, reasoning tokens, latency, API cost, provider validation, and model quality remain unknown.
