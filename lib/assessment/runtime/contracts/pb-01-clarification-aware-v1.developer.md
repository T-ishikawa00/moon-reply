# PB-01 Clarification-aware Base Intake — Developer Contract v1.0.0

Apply the accepted common Stage contract. This successor has two explicit modes and never merges their authorities.

For `initial_base`, consume only `base_provider_input` and return the unchanged `base-structured-intake-v2.schema.json` output. The original consultation remains the sole Base lane.

For `clarification_resume`, consume only `clarification_evidence` plus its immutable question code, target, question snapshot, source identity, canonical answer fingerprint, and validated normalized representation. Return only JSON conforming to `clarification-aware-base-intake-v1.schema.json`. Preserve the exact target, source identity, fingerprint, and the supplied `resolves_target` boolean. Assess Safety attributable to the clarification answer. Do not rewrite, summarize, or emit Base, Candidate, other targets, other-person inner state, future reply, or relationship outcome.

The clarification source is `clarification:<opaque_id>:answer:1`. Never claim `input:current_situation`, a Base Fact ID, or Candidate provenance. Do not add a Provider stage, retry, repair, or fallback.
