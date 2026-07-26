# M2-P2-A Zero-Cost Token & Cost Estimator Specification

## 1. Status and authority

- Task ID: `M2-P2-A`
- Task name: `Zero-Cost Token & Cost Estimator Foundation`
- State: local estimator implementation and static report generated; automated validation and ChatGPT implementation review complete; Human acceptance pending
- Foundation SHA: `e673d015ea7da1f6f1d6f00457014f07072d3011`
- Runtime authority: none

M2-P2-A is a planning and local-tooling task over the accepted M2-P1 foundation. It authorizes no OpenAI API call, model benchmark, model selection, provider integration, database, authentication, payment, email, API route, server action, UI, runtime wiring, or deployment.

M2-P2-B is not authorized.

## 2. Objective

The estimator answers a bounded planning question: what static input size, estimated token bands, configured output ranges, and reference USD costs follow from the accepted Prompt, Schema, and development fixtures before any paid experiment?

The result is not a forecast of model quality or exact provider usage.

## 3. Canonical inputs

The estimator reads:

- accepted M2-P1 Prompt bundle manifest, seven stage prompts, and referenced shared assets;
- accepted PB-01 through PB-07 machine-readable stage contracts;
- accepted retry policy;
- accepted nine-Schema set;
- accepted 70-case development dataset and index;
- accepted dataset and component version manifest;
- versioned estimator, output-size, scenario, and price catalogs; and
- no holdout content.

M2-P1 fixtures, oracle, Schemas, Prompt assets, Prompt hashes, and policies remain unchanged. The separately committed M2-P2-A-R1 correction changes only the foundation verifier's exact successor local-tool boundary; its accepted historical manifest, commit-range, dataset, Schema, Prompt, hash, isolation, and capability checks remain intact.

## 4. Canonical local request envelope draft

`scripts/render-m2-dry-run-requests.mjs` renders a deterministic local envelope with:

- the stage developer prompt;
- full referenced shared Prompt assets;
- the projected user/stage input payload;
- the resolved output JSON Schema;
- stage configuration;
- `store: false`;
- `tools: []`;
- `streaming: false`; and
- `MODEL_UNSELECTED_PLACEHOLDER`.

The envelope is a planning draft. It is not a live or provider-validated Responses API request.

PB-01 through PB-06 are rendered for normal planning. PB-07 is rendered only in the separate repair-stress scenario.

## 5. Oracle isolation

The renderer projects only the accepted fixture `input` object for PB-01. It never projects:

- `oracle`;
- expected decision or expected Safety result;
- required extraction or reasoning meanings;
- evaluator-only forbidden claims;
- reference draft;
- scoring labels;
- Human rubric results;
- contrast/counterfactual metadata; or
- holdout data.

The local scenario controller may read oracle only to choose the accepted stop route:

- ready or benign cases continue to the scenario's ready-stage ceiling;
- information cases stop after PB-03; and
- Safety cases stop after PB-02.

Controller routing metadata stays outside `request`. Oracle content never enters the rendered request payload.

Required gate: `M2_DRY_RUN_ORACLE_ISOLATION_GATE`.

## 6. Synthetic upstream profiles

Later-stage model outputs do not exist. The renderer therefore creates three deterministic Schema-shaped profiles:

- `minimum`;
- `nominal`; and
- `conservative`.

Each profile is:

- marked synthetic in the local wrapper and report;
- validated against the accepted output Schema;
- deterministic and non-random;
- not an actual model output;
- not oracle-derived;
- free of personal data; and
- free of holdout data.

For every downstream rendered stage, fixture bytes and synthetic upstream bytes are measured separately.

## 7. Exact size metrics

The estimator reports:

- developer Prompt UTF-8 bytes;
- referenced shared Prompt UTF-8 bytes;
- total static Prompt UTF-8 bytes;
- static Prompt Unicode code points and line counts;
- resolved compact Schema bytes;
- source Schema file bytes;
- fixture/request input bytes;
- synthetic upstream bytes;
- stage input payload bytes;
- serialized request bytes and characters; and
- full serialized local-envelope bytes, characters, code points, and line counts.

Token estimates use serialized `request` bytes. Local metadata is measured but excluded from the estimated provider input.

## 8. Offline token bands

The configurable defaults are:

- LOW: `ceil(UTF8 bytes / 4)`;
- CENTRAL: `ceil(UTF8 bytes / 3)`; and
- HIGH: `ceil(UTF8 bytes / 2)`.

Each estimate record contains:

- `estimate_method`;
- `low_tokens`;
- `central_tokens`;
- `high_tokens`;
- `nominal_output_tokens`;
- `conservative_output_tokens`; and
- `configured_output_cap_tokens`.

These values are project heuristics, not exact tokenizer results or actual usage. Japanese, JSON structure, tokenizer revisions, provider normalization, and reasoning behavior can materially change actual usage.

Required gates: `M2_TOKEN_BAND_GATE` and `M2_ESTIMATE_LABEL_INTEGRITY_GATE`.

## 9. Output-size profiles

PB-01 through PB-06 have separate:

- nominal expected output;
- conservative expected output; and
- configured output cap.

The assumptions are versioned in `stage-size-profiles-v1.json` and cite the accepted output Schema or Prompt constraint. Configured caps are ceilings, not expected use.

PB-07 returns a complete `report-content` object and inherits PB-05's nominal, conservative, and cap values. It does not create an unlimited independent cap.

## 10. Price catalog

`price-catalog-v1.json` is a versioned USD planning snapshot using the task-supplied values:

| Model reference | Input / 1M | Output / 1M | Batch multiplier | Selected |
| --- | ---: | ---: | ---: | --- |
| `gpt-5.6-sol` | USD 5.00 | USD 30.00 | 0.5 | no |
| `gpt-5.6-terra` | USD 2.50 | USD 15.00 | 0.5 | no |
| `gpt-5.6-luna` | USD 1.00 | USD 6.00 | 0.5 | no |

The catalog contains an official-source reference but M2-P2-A performs no network verification. It must be rechecked before any separately authorized paid calibration.

No live exchange rate or JPY value is used. No model is selected.

## 11. Scenarios

The exact scenario IDs are:

1. `single-case-full-pipeline`;
2. `screening-14-functional`;
3. `screening-4-writing`;
4. `development-70-no-repair`;
5. `development-70-repair-stress`; and
6. `screening-14-five-run-reference`.

The exact case lists and routing contract are owned by `scenario-catalog-v1.json`.

All scenarios are estimates only. None authorize execution.

## 12. Repair-stress ceiling

The development repair-stress scenario uses the maximum accepted content-candidate path for every report-eligible development case:

1. initial PB-05 candidate plus PB-06 validation;
2. one PB-07 targeted repair plus PB-06 validation; and
3. one PB-07 full regeneration plus PB-06 validation.

A fourth candidate and repair-of-repair are prohibited. This is a stress ceiling, not expected operating cost.

## 13. Cost formulas

For each model and scenario:

`estimated_input_cost = estimated_input_tokens × input_price_per_million / 1,000,000`

`estimated_output_cost = estimated_output_tokens × output_price_per_million / 1,000,000`

`estimated_total_cost = estimated_input_cost + estimated_output_cost`

The report emits:

- `standard_low`;
- `standard_central`;
- `standard_high`;
- `standard_conservative`;
- `standard_hard_cap_ceiling`;
- `batch_high`; and
- `batch_conservative`.

## 14. Approval baseline

The conservative approval-planning baseline uses:

- standard pricing;
- no cache discount;
- conservative synthetic upstream;
- HIGH input estimate; and
- conservative output estimate.

Batch is reference-only. Prompt-cache savings are excluded.

## 15. Reasoning-token boundary

Reasoning tokens are not estimated as a separate static billable category. They are unknown output usage that must be calibrated from actual provider usage fields only after M2-P2-B receives separate Human approval.

## 16. Determinism

Volatile timestamps are excluded. Generated content uses the versioned price-catalog timestamp.

Two builds from unchanged sources must produce byte-identical JSON and Markdown reports.

Required gate: `M2_ESTIMATOR_DETERMINISM_GATE`.

## 17. Hashes

The report records:

- dataset aggregate hash;
- Prompt bundle manifest and asset-aggregate hashes;
- Schema-set aggregate hash;
- price-catalog hash;
- estimator-config hash;
- scenario-catalog hash;
- stage-profile hash;
- estimator-script hash; and
- generated-report hash.

The generated-report hash is SHA-256 over compact canonical JSON with `hashes.generated_report_sha256` set to `null`, avoiding an impossible direct self-reference.

Required gate: `M2_REPORT_HASH_GATE`.

## 18. What static estimation cannot establish

Static estimation cannot establish:

- actual input, cached-input, output, reasoning, or total tokens;
- provider-side request validation;
- returned model identity;
- actual output length;
- actual repair/retry frequency;
- latency or refusal behavior;
- cache savings;
- model quality;
- development, holdout, stability, or Human quality results; or
- JPY 980 value.

## 19. M2-P2-B calibration plan

M2-P2-B remains not started. After separate Human approval:

1. recheck official pricing;
2. select the smallest representative calibration case;
3. keep total first paid calibration spend at or below USD 1;
4. record actual input, cached-input, output, reasoning, and total usage fields;
5. compare actual values with LOW/CENTRAL/HIGH and output profiles; and
6. stop before any expansion unless Human separately approves it.

This plan is not execution authorization.

## 20. Acceptance boundary

M2-P2-A completes only when:

- all named estimator gates pass;
- the accepted M2-P1 foundation verifier still passes;
- M1 content and Safety locks pass;
- typecheck, lint, build, and `git diff --check` pass;
- `M2_P2_A_EXACT_SCOPE_GATE` confirms exactly the original authorized 16 files after excluding the separately committed two-file M2-P2-A-R1 correction;
- the branch is committed and normally pushed; and
- Human acceptance remains explicitly pending.

No budget is authorized. No API cost was incurred. No model is selected. Runtime remains disabled.
