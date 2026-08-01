# M2-P4-I3-R1-C1-R2 Diagnostic Summary

## Purpose and protocol

This bounded diagnostic checks only whether inactive PB-01 v5 returns semantic-only `writing_signals` for eight synthetic consultations. Each case invoked PB-01 exactly once and sequentially. Application grounding, grounded Schema v4, Writing Context Integrity v2, contextual intake Integrity, and Decision Facts adjudication ran locally. PB-02 through PB-06, Service, full Pipeline, DB, Supabase, holdout, and real-user data were not used.

## Result

- Status: `provider_diagnostic_failed_pending_human_chatgpt_review`
- Verdict: `FAIL`
- Package commit: `d0ad3eceb130a806b2c2b06cb1a59dbbaa35bf4e`
- Provider calls: `8 / 8`
- Completed calls: `8 / 8`
- Retry / repair / fallback: `0 / 0 / 0`
- R2-08 quoted-message ownership: `FAIL`
- Authorization consumed: `true`
- Rerun authorized: `false`
- Active Runtime changed: `false`
- C2 eligible / authorized: `false / false`

## Cases

| Case | Verdict | Transport | Raw Schema v5 | Grounded Schema v4 | Ownership | Boundary |
|---|---:|---:|---:|---:|---:|---:|
| R2-01 | PASS | PASS | PASS | PASS | PASS | PASS |
| R2-02 | PASS | PASS | PASS | PASS | PASS | PASS |
| R2-03 | FAIL | PASS | PASS | PASS | PASS | PASS |
| R2-04 | FAIL | PASS | PASS | PASS | FAIL | PASS |
| R2-05 | PASS | PASS | PASS | PASS | PASS | PASS |
| R2-06 | PASS | PASS | PASS | PASS | PASS | PASS |
| R2-07 | PASS | PASS | PASS | PASS | PASS | PASS |
| R2-08 | FAIL | PASS | PASS | PASS | FAIL | PASS |

## Metrics

| Metric | Result | Evidence |
|---|---:|---|
| provider_transport | 8/8 | available |
| returned_model_recorded | 8/8 | available |
| raw_json_parse | 8/8 | available |
| raw_schema_v5 | 8/8 | available |
| forbidden_bookkeeping | 8/8 | available |
| provider_semantic_core | 5/8 | available |
| grounded_schema_v4 | 8/8 | available |
| writing_context_integrity_v2 | 8/8 | available |
| contextual_intake_integrity | 7/8 | available |
| application_decision_facts | 7/8 | available |
| message_ownership | 6/8 | available |
| boundary_ownership | 8/8 | available |
| candidate_presence | 8/8 | available |
| candidate_style | 4/4 | available |
| candidate_intent | 4/4 | available |
| relationship_limits | 8/8 | available |
| privacy_repeat_injection | 8/8 | available |
| application_grounding | 8/8 | available |
| soft_style_assertions | 5/6 | available |

## Principal ownership and boundary gates

- R2-08 quoted-message ownership: `FAIL`
- R2-03 grounded boundary: `none / none`
- R2-04 grounded boundary: `no_contact / explicit`

## Remaining hard failures

- R2-03: `R2-03-REQUIRED-CONSTRAINTS`
- R2-04: `CONTEXTUAL_INTAKE_INTEGRITY_FAILED`
- R2-04: `R2-04-APPLICATION-DECISION-FACTS`
- R2-04: `R2-04-CANONICAL-MESSAGE-OWNERSHIP`
- R2-04: `R2-04-INCOMING-PRESENT`
- R2-04: `R2-04-RAW-MESSAGE-SIGNALS`
- R2-08: `R2-08-CANONICAL-MESSAGE-OWNERSHIP`
- R2-08: `R2-08-INCOMING-PRESENT`
- R2-08: `R2-08-PRINCIPAL-QUOTED-OWNERSHIP`
- R2-08: `R2-08-RAW-MESSAGE-SIGNALS`

## Usage totals

- Input tokens: `46190`
- Cached input tokens: `39298`
- Output tokens: `11310`
- Reasoning tokens: `1279`

## Runtime and next step

Active Runtime and `main` remain unchanged. C2 remains unauthorized even if this diagnostic passes. The only next step is Human / ChatGPT review; no rerun is authorized.
