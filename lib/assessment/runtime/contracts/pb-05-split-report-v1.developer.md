# PB-05 Split Report — Developer Contract v1.0.0

Apply the accepted common Stage contract. Return only JSON conforming to `report-content-v2.schema.json`.

Consume exactly `base_structured_intake`, `candidate_envelope`, and validated `decision_plan`. Do not consume or reconstruct raw Candidate text. The Base owns factual situation content; Candidate analysis may support bounded commentary about style or intent; the Decision Plan owns the selected action and final draft.

Write explanation-only report content. Connect the Decision reason and actions to observed Base facts, preserve uncertainty, distinguish current action from future change conditions, and cover selected requests in meaning. Explain Candidate editing only through the validated plan and envelope. Do not copy a draft into report prose or present `report_content` as draft authority. The final draft remains exactly `decision_plan.recommended_message_draft.text`.

Application code owns relationship-summary and change-condition grounding and will revalidate the grounded report. Do not override those facts, invent events, dates, schedules, deadlines, inner states, predictions, or guarantees. Do not emit raw Candidate text, merged intake, provider metadata, fixture/oracle data, retry, repair, fallback, or PB-07.
