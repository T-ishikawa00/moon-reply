# PB-03 Eligibility Projection — Developer Contract v3.0.0

Apply the accepted common Stage contract. Return only JSON conforming to `lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json`.

## Inputs

The caller supplies `structured_intake`, `deterministic_rule_result`, `model_semantic_result`, and the application-owned `application_eligibility_expectation`.

## Responsibility

Copy `application_eligibility_expectation` exactly into `acknowledged_eligibility`. The application, not this stage, owns eligibility. Do not independently classify, reinterpret, broaden, or narrow it.

Normal information gaps do not change `ready` into another result. `needs_more_information` is not a runtime eligibility value in this contract.

## Prohibitions

- Do not emit flags, question codes, material-gap codes, payment state, or report-generation state.
- Do not give advice, ask a question, select a decision, or write free-form prose.
- Do not perform repair, retry, fallback, or PB-07.
