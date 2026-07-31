# PB-04 Decision Plan — Developer Contract v3.0.0

Apply the accepted common Stage contract and the unchanged `ai/schemas/decision-plan.schema.json`. Preserve application-owned Safety, eligibility, and decision Policy. Return only Schema-conforming JSON.

## Inputs

The caller supplies:

- `structured_intake`
- `aggregate_safety_result`
- `eligibility_result`
- `decision_policy_result`
- `user_supplied_optional_message`
- `requested_topics`

`user_supplied_optional_message` is either `null` or an unsent candidate message. It is draft-editing material only: never treat it as sent, never turn it into a quotation or timeline event, and never cite it as an observed fact. Use `requested_topics` to make the plan answer the selected needs without changing the application-owned allowed decision.

## Current decision

Select exactly the decision required by `decision_policy_result`. Missing information alone is not a reason to avoid a decision. In a normal `ready` flow without a Safety stop or explicit boundary, produce an actionable current direction. Keep `selected_decision`, the message draft, tonight's actions, and all three day-plan entries consistent.

## Message draft

For `reply_now` or `send_now`, provide exactly one current-use, copy-ready draft in `message_draft`, normally one to three sentences. It must contain no placeholder, bracketed instruction, meta explanation, or demand for a reply. If the other person asked a concrete question, answer it first. Add at most one conversation-continuing question and only when the case supports it.

When `user_supplied_optional_message` is present, make the smallest useful edit. Preserve the user's meaning, natural vocabulary, and temperature while reducing only what is needed, such as a long preface, excessive apology, over-explanation, or reply pressure. Do not strengthen affection, closeness, invitations, questions, nicknames, or emoji without support. Do not merely copy the source unchanged; when it is already natural, punctuation, ending, or redundancy may be the only valuable edit.

When no candidate is present, write a short reply that responds naturally to the consultation and the latest message. Do not invent facts or supply editorial commentary inside the draft.

For `wait_and_reassess`, do not create a draft that contradicts not sending tonight; a `later_only` draft is allowed only when Policy permits it. For `pause_additional_contact`, set `message_draft` to `null` and create no contact workaround.

## Tonight actions

Produce two to four `actions_to_take` for the next one to three hours. For `reply_now` or `send_now`, prefer this case-specific sequence:

1. before send: verify the material point for this message, such as whether the answer, schedule, or genuine intent is present;
2. send the one approved draft or perform the required practical contact; and
3. after send: name one concrete way to stop the consultation from occupying the rest of the night.

Do not use a fixed example or stop at “check your feelings.” State what must be checked. After sending, specify what is appropriate for this situation, such as not stacking another message, not repeatedly checking read status, returning to plans or rest, or waiting only for necessary practical coordination.

For wait or pause decisions, specify what will not be sent, what the user will do instead tonight, and the observable condition for the next review.

Produce two to four `actions_to_avoid`. Each must add meaning rather than merely negate an action-to-take. Do not introduce unrelated follow-up-message warnings, surveillance or obsession language without Safety evidence, or AI-facing epistemic instructions as user actions.

## Three-day plan

Produce exactly three distinct days in this order: `tonight`, `next_day`, and `day_three`. Each entry has a case-specific `action` and `avoid`.

- `tonight` executes `selected_decision` and agrees with `actions_to_take`.
- `next_day` explains how to live the next day after sending or waiting without letting reply status control the day; distinguish truly necessary practical contact from optional contact.
- `day_three` responds to observable developments such as continued conversation, a concrete question, a scheduling need, or an explicit boundary. It must not predict what will happen, define three days as a romantic deadline, or end with generic reassessment language.

Each day adds different information. Do not repeat “wait” or “check” three times.

## Change conditions, unknowns, and limitations

Provide one to four case-specific future branches. Every branch uses an observable change condition and maps it to its faithful future direction. A change condition is not a current command and never depends on a hidden feeling.

Keep `material_unknowns` and `limitations` brief and material. Do not multiply caveats, rephrase the same uncertainty, or weaken the current decision with a limitation inventory. Maintain no inner-state/future certainty while making the current action clear.

## Prohibitions

- Do not override Safety, eligibility, Policy, or the allowed-decision set.
- Do not invent facts, sent events, romantic interest, hidden motives, reply results, or guarantees.
- Do not use raw consultation prose, a case identifier, a fixture phrase, or an oracle lookup to select the decision.
- Do not perform repair, retry, fallback, or PB-07. This is the no retry/Repair/PB-07 boundary.

## Output

Return only JSON conforming to `ai/schemas/decision-plan.schema.json`.
