# M2-P4-I3-R1-C1-R2-R2 Diagnostic Summary

## Purpose and exact protocol

This targeted repair diagnostic invokes inactive PB-01 Prompt v6 exactly once for each of four preserved synthetic AssessmentInput cases. Calls are sequential and capped at four. Retry, repair, PB-07, fallback, PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data are excluded.

## Result

- Status: provider_targeted_diagnostic_failed_pending_human_chatgpt_review
- Targeted verdict: FAIL
- Commit A: 36e7d1967a502f0ed80aaccb12d44507f0058560
- Provider calls: 4 / 4
- Completed calls: 4 / 4
- Retry / repair / fallback: 0 / 0 / 0
- Targeted repairs: PASS
- Normal ownership regression control: FAIL
- Principal R2R2-03 quoted ownership: PASS
- Authorization consumed: true
- Rerun authorized: false
- Provider quality established: false
- Full eight-case confirmation required: true
- Active Runtime changed: false
- C2 eligible / authorized: false / false

## Four cases

| Case | Source | Verdict | Raw Schema v5 | Grounded Schema v4 | Ownership | Boundary |
|---|---|---:|---:|---:|---:|---:|
| R2R2-01 | R2-03 | PASS | PASS | PASS | PASS | PASS |
| R2R2-02 | R2-04 | PASS | PASS | PASS | PASS | PASS |
| R2R2-03 | R2-08 | PASS | PASS | PASS | PASS | PASS |
| R2R2-04 | R2-06 | FAIL | PASS | PASS | PASS | PASS |

## Metrics

| Metric | Result | Evidence |
|---|---:|---|
| provider_transport | 4/4 | available |
| returned_model_exact | 4/4 | available |
| raw_json_parse | 4/4 | available |
| raw_schema_v5 | 4/4 | available |
| grounded_schema_v4 | 4/4 | available |
| writing_context_integrity_v2 | 4/4 | available |
| contextual_intake_integrity | 4/4 | available |
| application_decision_facts | 3/4 | available |
| provider_semantic_core | 4/4 | available |
| forbidden_bookkeeping | 4/4 | available |
| message_ownership | 4/4 | available |
| boundary_ownership | 4/4 | available |
| candidate_presence | 4/4 | available |
| candidate_style | 2/2 | available |
| candidate_intent | 2/2 | available |
| relationship_limits | 4/4 | available |
| privacy_repeat_injection | 4/4 | available |
| application_grounding | 4/4 | available |
| provider_output_immutability | 4/4 | available |
| targeted_repairs | 3/3 | available |
| normal_regression_control | 0/1 | available |
| soft_style_assertions | 0/0 (unavailable) | unavailable |

## Remaining hard failures

- R2R2-04: R2R2-04-APPLICATION-DECISION-FACTS
- R2R2-04: R2R2-04-NORMAL-OWNERSHIP-CONTROL

## Usage totals

- Input tokens: 26092
- Cached input tokens: 19068
- Output tokens: 5452
- Reasoning tokens: 367

## Runtime and next step

Active Runtime and main remain unchanged. Even a 4/4 PASS establishes only the three targeted Prompt v6 repairs plus one selected ownership control. It does not establish all-eight quality or C2 eligibility. Human / ChatGPT review is the only next step, and no rerun is authorized.
