# M2-P4-I3-R1-C1-R3 Diagnostic Summary

## Purpose and exact protocol

This final confirmation invokes inactive PB-01 Prompt v7 exactly once for each of eight preserved synthetic AssessmentInput cases. Calls are sequential and capped at eight. Retry, repair, PB-07, fallback, PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data are excluded.

## Result

- Status: evaluation_blocked_pending_human_chatgpt_review
- Final confirmation verdict: EVALUATION_BLOCKED
- Frozen evaluator verdict before block: FAIL
- Evaluation block: `M2_R3_EVALUATOR_DEFECT`
- Commit A: 86d990a791a48dbb552f1b2eacc2011e7e8fa380
- Provider calls: 8 / 8
- Completed calls: 8 / 8
- Retry / repair / fallback: 0 / 0 / 0
- Cases passed: 2/8 under the frozen evaluator; non-final
- Principal R3-08 quoted ownership: PASS
- Authorization consumed: true
- Rerun authorized: false
- Provider quality established: false
- Provider quality scope: exact_eight_case_pb01_v7_suite
- Candidate ready for isolated E2E: false
- Active Runtime changed: false
- C2 eligible / authorized: false / false

## Eight cases

The table below preserves the frozen evaluator's original per-case dispositions. It is evidence, not a final Provider-quality adjudication.

| Case | Source | Verdict | Raw v5 | Grounded v4 | Integrity v2 | Decision Facts | Semantic core | Ownership | Boundary | Candidate |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| R3-01 | R2-01 | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-02 | R2-02 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-03 | R2-03 | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-04 | R2-04 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-05 | R2-05 | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-06 | R2-06 | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-07 | R2-07 | FAIL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| R3-08 | R2-08 | FAIL | PASS | PASS | PASS | PASS | FAIL | PASS | PASS | PASS |

## Metrics

The metric table is the unchanged frozen evaluator output. The practical-reason and targeted-correction aggregates are not final because of the defect described below.

| Metric | Result | Evidence |
|---|---:|---|
| provider_transport | 8/8 | available |
| returned_model_exact | 8/8 | available |
| raw_json_parse | 8/8 | available |
| raw_schema_v5 | 8/8 | available |
| grounded_schema_v4 | 8/8 | available |
| writing_context_integrity_v2 | 8/8 | available |
| contextual_intake_integrity | 6/8 | available |
| application_decision_facts | 8/8 | available |
| provider_semantic_core | 7/8 | available |
| forbidden_bookkeeping | 8/8 | available |
| probability_confidence_fields | 8/8 | available |
| case_fixture_oracle_references | 8/8 | available |
| raw_pii_copied | 8/8 | available |
| secret_leakage | 8/8 | available |
| message_ownership | 8/8 | available |
| boundary_ownership | 8/8 | available |
| candidate_presence | 8/8 | available |
| candidate_style | 4/4 | available |
| candidate_intent | 4/4 | available |
| relationship_limits | 8/8 | available |
| privacy_repeat_injection | 8/8 | available |
| application_grounding | 8/8 | available |
| provider_output_immutability | 8/8 | available |
| practical_reason_consistency | 0/4 | available |
| targeted_correction_gates | 3/4 | available |
| soft_style_assertions | 4/4 | available |

## Four correction gates

| Gate | Verdict |
|---|---:|
| known_taxonomy | PASS |
| no_contact_ownership | PASS |
| quoted_ownership | PASS |
| practical_reason_consistency | EVALUATION_BLOCKED |

## Evaluation block

The frozen practical-reason assertion compared the complete `practical_reason` object to a contract subset containing only `kind` and `active`. R3-01, R3-03, R3-05, and R3-06 all retained the required kind/active values in both raw and grounded facts, but their schema-valid `deadline` field caused four false hard failures. Per protocol, the evaluator, Prompt, Schema, and saved Provider outputs are unchanged; no offline reevaluation and no Provider rerun were performed.

Independent frozen findings remain for Human / ChatGPT review: contextual intake Integrity failed on R3-03 and R3-07, and the frozen R3-08 user-goal basis assertion failed. These findings are preserved, not repaired or reclassified here.

## Remaining hard failures

- R3-01: R3-01-PRACTICAL-REASON-CONSISTENCY
- R3-03: CONTEXTUAL_INTAKE_INTEGRITY_FAILED
- R3-03: R3-03-PRACTICAL-REASON-CONSISTENCY
- R3-05: R3-05-PRACTICAL-REASON-CONSISTENCY
- R3-06: R3-06-PRACTICAL-REASON-CONSISTENCY
- R3-07: CONTEXTUAL_INTAKE_INTEGRITY_FAILED
- R3-08: R3-08-USER-GOAL-BASIS

## Usage totals

- Input tokens: 55246
- Cached input tokens: 47222
- Output tokens: 11981
- Reasoning tokens: 1160

## Runtime and next step

Active Runtime and main remain unchanged. Provider quality is not established, the candidate is not ready for isolated E2E, and C2 remains unauthorized. Human / ChatGPT review is the only authorized next step, and no rerun is authorized.
