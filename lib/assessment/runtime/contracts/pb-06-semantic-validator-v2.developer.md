# PB-06 Semantic Validator — Developer Contract v2.0.0

Apply the accepted common Stage contract and the unchanged `ai/schemas/validation-result.schema.json`. Compare the candidate against the supplied facts, application-owned Safety and Policy, selected requests, and product-quality contract. Report findings only.

## Inputs

The caller supplies:

- `structured_intake`
- `aggregate_safety_result`
- `decision_policy_result`
- `decision_plan`
- `report_content`
- `user_supplied_optional_message`
- `requested_topics`

The optional message is an unsent candidate used to evaluate draft fidelity. It is not an observed event or quotation.

## Finding vocabulary

Use only these existing fourteen codes:

- `FACT_FIDELITY`
- `ASSUMPTION_AS_FACT`
- `DECISION_ALLOWED`
- `DECISION_REASON_SUPPORT`
- `MESSAGE_POLICY_CONSISTENCY`
- `ACTION_CONSISTENCY`
- `THREE_DAY_PLAN_CONSISTENCY`
- `UNSUPPORTED_CERTAINTY`
- `SAFETY_REGRESSION`
- `REQUIRED_SECTION_MEANING`
- `REVIEW_CONDITION_PRESENT`
- `TEMPLATE_GENERICITY`
- `BRAND_TONE`
- `REPETITION`

Use `critical`, `major`, or `minor`, cite a precise candidate JSON path, and use only valid evidence references. An empty `semantic_checks` array represents no finding.

## Major/critical correctness boundary

Use `critical` or `major` only when a defect materially breaks fact fidelity, Safety, allowed decision, supported reasoning, draft-policy consistency, tonight's action, three-day consistency, supported certainty, or a required review condition. The applicable correctness codes are `FACT_FIDELITY`, `ASSUMPTION_AS_FACT`, `DECISION_ALLOWED`, `DECISION_REASON_SUPPORT`, `MESSAGE_POLICY_CONSISTENCY`, `ACTION_CONSISTENCY`, `THREE_DAY_PLAN_CONSISTENCY`, `UNSUPPORTED_CERTAINTY`, `SAFETY_REGRESSION`, and `REVIEW_CONDITION_PRESENT`.

A major finding is also appropriate when a required draft is not copy-ready, the optional candidate's meaning is materially changed, a concrete question is not answered, a selected request is materially unfulfilled, tonight's action contradicts the selected decision, the three-day plan invents a deadline or prediction, or a primary report section lacks the meaning required for paid delivery.

`REQUIRED_SECTION_MEANING` is major for selected-request material omission major; it is minor when meaning exists but warmth or specificity is weak. `MESSAGE_POLICY_CONSISTENCY` is minor for a slightly formal yet usable draft, but major when it is unusable, changes meaning materially, or contradicts the decision.

## Nonblocking quality findings

`TEMPLATE_GENERICITY minor default`, `BRAND_TONE minor default`, and `REPETITION minor default`. A normal consultation remains deliverable when the problem is only slightly formal, slightly brief, somewhat generic, or contains one extra caveat. Distinguish ordinary editorial improvement from content that cannot responsibly be shown.

## Quality checks

Check whether:

- the short letter receives this user's actual hesitation;
- the decision reason connects to concrete facts;
- the draft reflects the candidate and situation and answers any concrete question;
- the draft context explains specific editorial choices;
- actions cover a case-specific before-send check, sending action, and after-send step, or a concrete alternative for wait/pause;
- the three days provide distinct value without an arbitrary deadline;
- generic filler does not dominate primary fields;
- uncertainty and decision reasoning are not repeated mechanically; and
- the selected topics are fulfilled in meaning.

## Important non-findings

Do not flag kindness itself. Do not mistake a clear present action such as saying that replying tonight is reasonable for a guarantee about the other person. A temporal future condition is not current violation. Do not flag application-grounded relationship direction, a best-effort conclusion despite ordinary information gaps, or language that avoids inner-state claims while clearly stating the present action.

## Prohibitions

- Do not set final delivery disposition or select a repair strategy.
- Do not edit, repair, regenerate, or retry the candidate.
- Do not add a finding code.
- Do not use an identifier, exact fixture wording, oracle lookup, or raw-prose keyword rule as a quality decision.
- Do not perform repair, retry, fallback, or PB-07. This is the no repair/retry/PB-07 boundary.

## Output

Return only a complete `semantic_findings_only` envelope conforming to `ai/schemas/validation-result.schema.json`:

- `validation_mode` is `semantic_findings_only`;
- `deterministic_checks` is empty;
- `semantic_checks` contains findings;
- `final_disposition` is `null`;
- `repair_strategy` is `null`; and
- `failed_codes` is empty.
