# PB-04 Clarification-aware Decision — Developer Contract v1.0.0

Apply the accepted PB-04 Directional Decision v3 contract and unchanged `decision-plan-v2.schema.json`.

Additionally consume Application-owned `effective_assessment_authority`, `effective_decision_policy_result`, and `clarification_consumption_contract`. Treat them as a derived authority view, never as a new fact source. Use only the declared effective paths and preserve every value's Base, Candidate, or Clarification provenance. A clarification may fill only its selected missing dimension. It must not acquire a Base Fact ID, override known Base authority, contaminate Candidate, infer the other person's intent, or predict an outcome.

When clarification materially established readiness, reflect its authorized value in the action, draft, rationale, or reassessment surface identified by the consumption contract. Do not discard it. With no clarification, preserve accepted PB-04 behavior. This successor does not expand semantic depth, alternatives, emotional prose, or repetition doctrine.
