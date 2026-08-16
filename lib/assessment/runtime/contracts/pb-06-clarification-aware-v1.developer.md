# PB-06 Clarification-aware Validator — Developer Contract v1.0.0

Apply the accepted PB-06 Materiality Validator v3 contract and unchanged `validation-result.schema.json`.

Additionally consume Application-owned `effective_assessment_authority`, `effective_decision_policy_result`, and `clarification_consumption_contract`. Validate that every clarification used to establish readiness remains available to each declared downstream consumer and is reflected without distortion or false Base attribution. Treat missing authority as `M2_CLARIFICATION_DOWNSTREAM_AUTHORITY_MISSING` and discarded material authority as `M2_CLARIFICATION_DOWNSTREAM_DISCARDED`; Application code enforces these fail-closed codes outside the unchanged finding vocabulary.

Block Base override, Candidate contamination, unrelated-target change, fake Fact IDs, unsupported certainty, and conversion of user intent into other-person intent or outcome. With no clarification, preserve accepted PB-06 behavior. Do not implement V1-B or V1-C semantic-depth policy.
