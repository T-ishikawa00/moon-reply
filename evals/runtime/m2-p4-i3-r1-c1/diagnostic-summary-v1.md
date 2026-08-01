# M2-P4-I3-R1-C1 Diagnostic Summary

## Execution evidence

- Package commit: `0c228406298fbb829cbb216e31c00e6812cc1393`
- Branch: `test/m2-p4-i3-r1-c1-provider-diagnostic`
- Execution window: `2026-08-01T10:12:21.219Z` to `2026-08-01T10:14:33.391Z`
- Requested / returned model contract: `gpt-5.6-luna`
- Provider calls: 12/12 completed; 12 authorized
- PB-01 v3 calls: 4; PB-01 v4 calls: 8
- Retry / repair / fallback: 0 / 0 / 0
- Provider diagnostic only: `true`
- Active Runtime changed: `false`
- DB / Supabase: 0 / 0

## Case results

| Case | Name | Calls | Result |
| --- | --- | ---: | --- |
| PAIR-01 | matching_app_candidate_schedule | 2/2 | FAIL |
| PAIR-02 | wait_without_candidate | 2/2 | FAIL |
| PAIR-03 | work_hierarchy_and_constraint | 2/2 | FAIL |
| PAIR-04 | explicit_no_contact_boundary | 2/2 | FAIL |
| V4-05 | former_partner_without_reconciliation | 1/1 | FAIL |
| V4-06 | multiple_message_ownership | 1/1 | FAIL |
| V4-07 | casual_style_and_explicit_constraints | 1/1 | FAIL |
| V4-08 | injection_privacy_repeat | 1/1 | FAIL |

## Quality evidence

- Provider / Schema viability: v3 3/4; v4 0/8
- v4 grounding + Integrity: 0/8
- Legacy v3 view: 0/8
- Paired critical Decision Facts parity: 0/4
- Hard assertions: 3/3 (100.0%)
- Forbidden assertions: 1/1 (100.0%)
- Soft style assertions: 0/0 (100.0%)
- Candidate provenance: 0/0
- Message ownership: 0/0
- Relationship effect ceiling: 0/0
- Explicit constraint provenance: 0/0
- Hard fail count: 2 (PROVIDER_SCHEMA_VIABILITY_FAILED, DECISION_FACTS_REGRESSION)
- Secret leakage count: 0

## Usage

- Input tokens: 67048
- Cached tokens: 55413
- Output tokens: 21727
- Reasoning tokens: 1766

## Exceptions and typed differences

- PAIR-01/v4: M2_WRITING_CONTEXT_INVALID
- PAIR-02/v3: M2_CONTEXTUAL_INFERENCE_INVALID
- PAIR-02/v4: M2_WRITING_CONTEXT_INVALID
- PAIR-03/v4: M2_WRITING_CONTEXT_INVALID
- PAIR-04/v4: M2_WRITING_CONTEXT_INVALID
- V4-05/v4: M2_WRITING_CONTEXT_INVALID
- V4-06/v4: M2_WRITING_CONTEXT_INVALID
- V4-07/v4: M2_WRITING_CONTEXT_INVALID
- V4-08/v4: M2_WRITING_CONTEXT_INVALID
- PAIR-01: critical mismatches=none; nonmaterial full-object difference recorded
- PAIR-02: critical mismatches=none; nonmaterial full-object difference recorded
- PAIR-03: critical mismatches=/boundary_state/kind, /boundary_state/status; nonmaterial full-object difference recorded
- PAIR-04: critical mismatches=/contact_state/usual_cadence_relation; nonmaterial full-object difference recorded

Provider output and consultation prose are not reproduced here. Only bounded typed evidence and hashes are retained in the JSON result.

## Verdict

- C1 verdict: **FAIL**
- C2 eligible for Human / ChatGPT review: `false`
- C2 authorized: `false`
- Active Runtime remains catalog v4 and unchanged.
- No DB or Supabase operation was performed.
