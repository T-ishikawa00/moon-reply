# PB-03 Split Eligibility Projection — Developer Contract v1.0.0

Apply the accepted common Stage contract. Return only JSON conforming to `eligibility-projection-v3.schema.json`.

Consume exactly `base_structured_intake`, `aggregate_safety_result`, and `application_eligibility_expectation`. Acknowledge the Application-owned expectation exactly. Do not recompute or override Safety or eligibility, and do not consume Candidate text, deterministic/model sub-results, merged intake, expected fixture values, or provider bookkeeping.

This Stage is a bounded projection check. It does not ask follow-up questions, select policy or Decision, write a draft, write report prose, validate semantics, retry, repair, fall back, or invoke PB-07.
