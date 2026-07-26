# M2-P2-A Static Token & Cost Estimate

## 1. Status

- Task: `M2-P2-A Zero-Cost Token & Cost Estimator Foundation`
- Estimator: `m2-zero-cost-estimator-v1.0.0`
- Generated from versioned timestamp: `2026-07-26T00:00:00+09:00`
- No API cost was incurred.
- These are estimates, not actual usage.
- No model is selected.
- No API experiment is authorized.
- M2-P2-B requires separate Human approval.
- The first paid calibration remains capped at USD 1 total.

This report is deterministic planning evidence. The rendered objects are canonical local request envelope drafts, not live or provider-validated API requests.

## 2. Foundation identity

| Item | Version / hash |
| --- | --- |
| Foundation SHA | `e673d015ea7da1f6f1d6f00457014f07072d3011` |
| Dataset | `eval-development-v1.0.0` / `9960f91c0e4eb0009bca6be7834437d56195c0e5682f5e679530cdb7df64d0e8` |
| Prompt bundle | `prompt-bundle-v1.0.0` / manifest `abcc37aac3d461ff2fc310c08708a3e26c5d658eb081cf2f4241529ca4accdb0` |
| Prompt assets aggregate | `4a8467c5448d01f69bb4518798ad74fd71b6d5f2919c3e9c53990f305b3e5b58` |
| Schema set | `pipeline-schema-v1.0.0` / `1bdb2a124d00fdb094296099d6cf5e9a3493910083f648cd804021ac64f22818` |
| Price catalog | `price-catalog-v1.0.0` / `2026-07-26T00:00:00+09:00` |
| Generated report | `0e79050e8f44d91b2329e92e97fd91b833c0a37bda397bb16b20132beb4ec84f` |

## 3. No-network declaration

The renderer and estimator use Node built-ins and repository files only. They require no API key and no internet connection. No provider SDK, HTTP request, WebSocket, database, authentication, payment, email, API route, server action, UI, or runtime wiring is present.

## 4. Exact static sizes and estimated token bands by stage

Reference case: `WAIT-003`. The table uses the nominal synthetic upstream profile. Static prompt bytes are developer-prompt bytes plus referenced shared-asset bytes. Schema bytes are compact serialized resolved output-schema bytes. Token values use the request draft bytes, not the local metadata envelope bytes.

| Stage | Static prompt bytes | Schema bytes | Fixture input bytes | Synthetic upstream bytes | Request bytes | Full envelope bytes | LOW input estimate | CENTRAL input estimate | HIGH input estimate | Nominal output | Conservative output | Configured cap |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| PB-01 | 15719 | 4593 | 454 | 2 | 22724 | 23193 | 5681 | 7575 | 11362 | 1200 | 2400 | 4000 |
| PB-02 | 18094 | 469 | 454 | 1804 | 23416 | 23884 | 5854 | 7806 | 11708 | 200 | 400 | 800 |
| PB-03 | 19685 | 2605 | 454 | 1804 | 27197 | 27665 | 6800 | 9066 | 13599 | 180 | 350 | 700 |
| PB-04 | 18530 | 4048 | 454 | 2015 | 28154 | 28622 | 7039 | 9385 | 14077 | 1400 | 2800 | 4500 |
| PB-05 | 20118 | 2726 | 454 | 3510 | 29607 | 30075 | 7402 | 9869 | 14804 | 2500 | 5000 | 8000 |
| PB-06 | 17659 | 2766 | 454 | 5229 | 29270 | 29738 | 7318 | 9757 | 14635 | 500 | 1200 | 2500 |

Each stage record in the JSON report also contains exact UTF-8 bytes, Unicode code points, serialized JSON characters, and line counts where relevant.

## 5. Synthetic upstream assumptions

The `minimum`, `nominal`, and `conservative` profiles are deterministic and Schema-shaped. They are clearly marked synthetic, contain no personal data or holdout data, are not oracle-derived, and are not actual model outputs. Downstream request sizing reports fixture input and synthetic upstream bytes separately.

## 6. Token heuristic integrity

- LOW: `ceil(UTF8 bytes / 4)`
- CENTRAL: `ceil(UTF8 bytes / 3)`
- HIGH: `ceil(UTF8 bytes / 2)`

These are project estimation heuristics, not exact OpenAI tokenizer outputs. Japanese, JSON structure, model tokenizer changes, and reasoning behavior can make actual usage differ. Estimated tokens are never labeled actual usage.

## 7. Output profiles

PB-01 through PB-06 each keep nominal expected output, conservative expected output, and configured `max_output_tokens` separate. Configured caps are ceilings, not expected usage. PB-07 inherits the PB-05 report-content cap and does not define an unlimited independent cap.

## 8. Scenario token summary

| Scenario | Case references | Calls | LOW input | CENTRAL input | HIGH input | Conservative-profile HIGH input | Nominal output | Conservative output | Hard-cap output |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| single-case-full-pipeline | 1 | 6 | 40094 | 53458 | 80185 | 90223 | 5980 | 12150 | 20500 |
| screening-14-functional | 14 | 50 | 313198 | 417596 | 626368 | 671656 | 35760 | 71400 | 120600 |
| screening-4-writing | 4 | 8 | 58880 | 78504 | 117756 | 142812 | 12000 | 24800 | 42000 |
| development-70-no-repair | 70 | 344 | 2259713 | 3012914 | 4519240 | 5047584 | 323860 | 656950 | 1110900 |
| development-70-repair-stress | 70 | 540 | 3783956 | 5045189 | 7567579 | 8843467 | 617860 | 1264550 | 2139900 |
| screening-14-five-run-reference | 70 | 250 | 1565990 | 2087980 | 3131840 | 3358280 | 178800 | 357000 | 603000 |

The screening controller may inspect oracle only to determine local stop routing. Oracle, expected decision, expected Safety result, required reasoning, evaluator-only forbidden claims, scoring labels, and Human rubric results never enter rendered request payloads.

## 9. Cost formulas

`estimated_input_cost = estimated_input_tokens × input_price_per_million / 1,000,000`

`estimated_output_cost = estimated_output_tokens × output_price_per_million / 1,000,000`

`estimated_total_cost = estimated_input_cost + estimated_output_cost`

The approval baseline is standard pricing, no cache discount, conservative synthetic upstream, HIGH input estimate, and conservative output estimate. Batch is shown separately and is not the approval baseline. Reasoning tokens are not estimated as a separate billable category; they remain unknown output usage for later calibration.

## 10. Single-case full-pipeline estimate

Calls: 6. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $0.580325 | $0.815615 | $1.066115 | $0.407807 |
| gpt-5.6-terra | $0.290162 | $0.407807 | $0.533057 | $0.203904 |
| gpt-5.6-luna | $0.116065 | $0.163123 | $0.213223 | $0.081561 |

## 11. Screening-14 functional estimate

Calls: 50. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $4.204640 | $5.500280 | $6.976280 | $2.750140 |
| gpt-5.6-terra | $2.102320 | $2.750140 | $3.488140 | $1.375070 |
| gpt-5.6-luna | $0.840928 | $1.100056 | $1.395256 | $0.550028 |

## 12. Screening-4 writing estimate

Calls: 8. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $0.948780 | $1.458060 | $1.974060 | $0.729030 |
| gpt-5.6-terra | $0.474390 | $0.729030 | $0.987030 | $0.364515 |
| gpt-5.6-luna | $0.189756 | $0.291612 | $0.394812 | $0.145806 |

## 13. Development-70 no-repair estimate

Calls: 344. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $32.312000 | $44.946420 | $58.564920 | $22.473210 |
| gpt-5.6-terra | $16.156000 | $22.473210 | $29.282460 | $11.236605 |
| gpt-5.6-luna | $6.462400 | $8.989284 | $11.712984 | $4.494642 |

## 14. Development-70 repair-stress ceiling

Calls: 540. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $56.373695 | $82.153835 | $108.414335 | $41.076918 |
| gpt-5.6-terra | $28.186847 | $41.076918 | $54.207167 | $20.538459 |
| gpt-5.6-luna | $11.274739 | $16.430767 | $21.682867 | $8.215383 |

The repair-stress path adds exactly one targeted repair and one full regeneration after the initial content candidate, with semantic revalidation after each. It has no fourth candidate and no repair-of-repair. This is a stress ceiling, not expected operating cost.

## 15. Screening-14 five-run reference

Calls: 250. Execution authorized: no.

| Model reference | Standard HIGH | No-cache conservative baseline | Hard-cap ceiling | Batch conservative reference |
| --- | ---: | ---: | ---: | ---: |
| gpt-5.6-sol | $21.023200 | $27.501400 | $34.881400 | $13.750700 |
| gpt-5.6-terra | $10.511600 | $13.750700 | $17.440700 | $6.875350 |
| gpt-5.6-luna | $4.204640 | $5.500280 | $6.976280 | $2.750140 |

Five-run reference is estimate-only: screening 14 cases × 5. It does not authorize execution.

## 16. Complete model-by-model cost table

| Scenario | Model reference | Standard LOW | Standard CENTRAL | Standard HIGH | Standard conservative | Hard-cap ceiling | Batch HIGH | Batch conservative |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| single-case-full-pipeline | gpt-5.6-sol | $0.379870 | $0.446690 | $0.580325 | $0.815615 | $1.066115 | $0.290162 | $0.407807 |
| single-case-full-pipeline | gpt-5.6-terra | $0.189935 | $0.223345 | $0.290162 | $0.407807 | $0.533057 | $0.145081 | $0.203904 |
| single-case-full-pipeline | gpt-5.6-luna | $0.075974 | $0.089338 | $0.116065 | $0.163123 | $0.213223 | $0.058033 | $0.081561 |
| screening-14-functional | gpt-5.6-sol | $2.638790 | $3.160780 | $4.204640 | $5.500280 | $6.976280 | $2.102320 | $2.750140 |
| screening-14-functional | gpt-5.6-terra | $1.319395 | $1.580390 | $2.102320 | $2.750140 | $3.488140 | $1.051160 | $1.375070 |
| screening-14-functional | gpt-5.6-luna | $0.527758 | $0.632156 | $0.840928 | $1.100056 | $1.395256 | $0.420464 | $0.550028 |
| screening-4-writing | gpt-5.6-sol | $0.654400 | $0.752520 | $0.948780 | $1.458060 | $1.974060 | $0.474390 | $0.729030 |
| screening-4-writing | gpt-5.6-terra | $0.327200 | $0.376260 | $0.474390 | $0.729030 | $0.987030 | $0.237195 | $0.364515 |
| screening-4-writing | gpt-5.6-luna | $0.130880 | $0.150504 | $0.189756 | $0.291612 | $0.394812 | $0.094878 | $0.145806 |
| development-70-no-repair | gpt-5.6-sol | $21.014365 | $24.780370 | $32.312000 | $44.946420 | $58.564920 | $16.156000 | $22.473210 |
| development-70-no-repair | gpt-5.6-terra | $10.507183 | $12.390185 | $16.156000 | $22.473210 | $29.282460 | $8.078000 | $11.236605 |
| development-70-no-repair | gpt-5.6-luna | $4.202873 | $4.956074 | $6.462400 | $8.989284 | $11.712984 | $3.231200 | $4.494642 |
| development-70-repair-stress | gpt-5.6-sol | $37.455580 | $43.761745 | $56.373695 | $82.153835 | $108.414335 | $28.186847 | $41.076918 |
| development-70-repair-stress | gpt-5.6-terra | $18.727790 | $21.880872 | $28.186847 | $41.076918 | $54.207167 | $14.093424 | $20.538459 |
| development-70-repair-stress | gpt-5.6-luna | $7.491116 | $8.752349 | $11.274739 | $16.430767 | $21.682867 | $5.637370 | $8.215383 |
| screening-14-five-run-reference | gpt-5.6-sol | $13.193950 | $15.803900 | $21.023200 | $27.501400 | $34.881400 | $10.511600 | $13.750700 |
| screening-14-five-run-reference | gpt-5.6-terra | $6.596975 | $7.901950 | $10.511600 | $13.750700 | $17.440700 | $5.255800 | $6.875350 |
| screening-14-five-run-reference | gpt-5.6-luna | $2.638790 | $3.160780 | $4.204640 | $5.500280 | $6.976280 | $2.102320 | $2.750140 |

Every catalog model has `selected_for_runtime: false`. No live exchange rate or JPY conversion is included.

## 17. Largest cost contributors

Development-70 no-repair, nominal request bytes:

| Stage | Calls | Request bytes | HIGH input estimate | Byte share |
| --- | ---: | ---: | ---: | ---: |
| PB-02 | 70 | 1639120 | 819560 | 18.14% |
| PB-01 | 70 | 1584474 | 792253 | 17.53% |
| PB-03 | 57 | 1550229 | 775143 | 17.15% |
| PB-05 | 49 | 1450743 | 725396 | 16.05% |
| PB-06 | 49 | 1434230 | 717115 | 15.87% |
| PB-04 | 49 | 1379546 | 689773 | 15.26% |

## 18. Determinism and hashes

The estimator excludes volatile timestamps and uses the versioned price-catalog timestamp. Two builds from unchanged sources must produce byte-identical JSON and Markdown. The JSON report self-hash is SHA-256 over compact canonical JSON with `hashes.generated_report_sha256` set to null.

| Artifact | SHA-256 |
| --- | --- |
| Price catalog | `731b7ae22346149c49bf7c792d99bcb70c87d0af7739a5a12670b0330d16c430` |
| Estimator config | `306ae2cf17e338903bf303848423da2ae6e7801c07483bf988e3884eea64d7e3` |
| Scenario catalog | `eb4dc84c375796ea5537d79fbeadf4090d8e49e244c6aa7fa2cfcc3b6c91aae9` |
| Stage profiles | `b95f51f51a96b9ad8716246e8ada9241285ad720262fe624fa911db075bcef44` |
| Estimator script | `b92dffba49832c6cc0e914890c4f61cb693536e0ba8ffb034b54dcc792682e2b` |
| Generated report projection | `0e79050e8f44d91b2329e92e97fd91b833c0a37bda397bb16b20132beb4ec84f` |

## 19. Uncertainty and what cannot be known statically

- The byte-division bands are project heuristics, not tokenizer output.
- Japanese text and JSON punctuation can tokenize differently by model and tokenizer revision.
- Actual model outputs can be shorter or longer than the nominal and conservative profiles.
- Reasoning behavior is unknown and is treated as unknown output usage rather than a separate static billable category.
- Provider-side request normalization, cached-input accounting, refusals, retries, and Batch eligibility are unknown.
- The price catalog is a versioned planning snapshot and must be rechecked before paid calibration.

Static work cannot establish:

- actual input, cached input, output, reasoning, and total usage tokens
- returned model identifier
- latency, refusal behavior, and provider validation outcome
- actual retry frequency and repair frequency
- actual prompt-cache savings
- actual output quality or M2-P1 quality-gate performance

## 20. M2-P2-B calibration plan and authorization boundary

M2-P2-B is not started and is not authorized. After separate Human approval, the first paid calibration should run the smallest representative case, record provider usage fields, compare actual input/cached-input/output/reasoning/total usage with these bands, and stop before expansion. Total first-calibration spend remains capped at USD 1.

This report does not authorize a budget, model selection, API experiment, provider integration, or runtime implementation.

- No API cost was incurred.
- These are estimates, not actual usage.
- No model is selected.
- No API experiment is authorized.
- M2-P2-B requires separate Human approval.
- The first paid calibration remains capped at USD 1 total.
