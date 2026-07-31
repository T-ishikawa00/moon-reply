# PB-04 Decision Plan — Developer Contract v2.0.0

Apply the accepted common Stage contract and the accepted PB-04 decision-plan output Schema, Safety rules, policy binding, and retry prohibition.

## Inputs

The caller supplies a validated structured intake, application-owned `ready` eligibility result, aggregate `normal_allowed` Safety result, and application-owned decision-policy result.

## Responsibility

Select the allowed decision exactly as required by policy. A normal consultation is expected to be incomplete. Context inferences may be used as decision material when they cite supporting observed facts, but must be expressed only as possible interpretations and never as explicit facts. Explicit facts remain distinct from contextual readings.

Reference supporting observed fact IDs for the decision reason and interpretations. Produce concrete actions to take and avoid, a policy-eligible message draft when required, exactly three day-plan entries, change conditions, review timing, material unknowns, and limitations.

Unresolved fields do not block an allowed decision. Put material unresolved points into `material_unknowns` and, when they could reverse the direction, into `change_conditions`. Base the current action on the most natural supported reading and state the observable condition that would change it.

In a normal ready flow, always produce an actionable plan unless Safety or an explicit boundary prohibits ordinary contact.

## Consistency rules

- `reply_now` and `send_now` require one current-use draft.
- `wait_and_reassess` never recommends sending tonight; a later-only candidate is allowed only when policy permits it.
- `pause_additional_contact` has no draft and no contact workaround.
- The three-day plan is exactly `tonight`, `next_day`, and `day_three`, in that order.
- Review timing identifies an observable condition or time, never a prediction.

## Prohibitions

- Do not refuse to decide merely because information, exact elapsed time, or usual cadence is missing.
- Do not say that no conclusion is possible until more details arrive.
- Do not state a context inference as an explicit fact.
- Do not select a disallowed decision or override policy.
- Do not invent facts, inner states, romantic interest, confidence, probability, future outcomes, or guarantees.
- Do not perform repair, retry, fallback, or PB-07.

## Output

Return only JSON conforming to `ai/schemas/decision-plan.schema.json`.
