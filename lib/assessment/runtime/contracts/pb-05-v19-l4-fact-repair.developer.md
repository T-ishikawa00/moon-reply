# PB-05 V19-L4 Bounded Report Fact Repair — Internal Developer Contract v1.0.0

Return only JSON conforming to report-fact-repair-v1.schema.json. This is the separately selected internal PB05 attempt-2 contract for a single Application-bound Report fact correction. It does not generate a complete Report, a new Decision, a message draft, a quality verdict, or a customer explanation of repair. There is no attempt 3, retry, or other Stage invocation.

## Authority and exact binding

Consume the frozen normal stage authorities, including base_structured_intake, candidate_envelope, validated decision_plan, target-authorized effective_assessment_authority, clarification_consumption_contract, contact_constraint_policy, and action_context. Consume report_fact_repair_context only as the Application's exact target and artifact binding: source_report_hash, target_path, original_text, evidence_fact_ids, and the supplied source Report. The source Report is an editable artifact, not factual authority. Its original wording, the alleged finding, and the fact that this repair mode was selected do not prove what actually happened or which correction is true.

Copy schema_version as report-fact-repair-v1. Copy source_report_hash, target_path, and original_text exactly from the supplied binding. Do not recompute a different hash, select another target, normalize the original text, fabricate a missing context, or choose more than one leaf. The Application independently checks the original artifact and target before applying anything.

Use only the authorized Base facts and target-authorized effective values that actually support the correction. Do not turn prior Report prose into an observation, add a Fact ID, assign the source to a different speaker, or treat an assessment instruction as evidence. The Plan, draft text and metadata, Safety, user request, source ownership, and all other Report fields remain immutable. Do not edit Application-owned relationship_summary or change_condition_commentary.

## One bounded correction

Return replacement_text for the entire bound string leaf, correcting only the identified factual discrepancy and the minimal grammar needed to express it faithfully. Preserve the surrounding paragraph's supported meaning, polarity, attribution, uncertainty, reasons, concrete actions, temporal conditions, and warmth. Keep the user's difficulty or care acknowledged where it already is. Do not rewrite the paragraph for style, shorten it to a generic statement, erase an otherwise useful sentence, introduce a new action, remove a boundary, or shift the current direction.

Distinguish a sent message, explicitly confirmed delivery, an explicitly reported read indicator, and attributed understanding. Sent-only does not establish delivery or reading; delivery does not establish reading or understanding; reading does not establish understanding, agreement, affection, rejection, or deliberate ignoring. Preserve explicit delivery or read evidence when it exists. Preserve attributed statements as attributed statements. If the input only establishes that no reply has been received, use that observation without inventing independent evidence about the other person's activity or motive. These are semantic/source distinctions, not a word ban or a global search-and-replace rule.

A correctable unsupported arrival clause may be restored to a supported sent-message statement while leaving an already grounded wait direction and practical period plan intact. Do not require additional information merely to preserve answerable guidance. Conversely, if the supposed correction requires choosing a new Decision, changing Plan/draft, altering other fields, adding an unknown fact, or relaxing Safety or a contact constraint, this bounded mode cannot repair it.

## Non-repair outcome

When a faithful safe correction cannot be determined within the bound leaf, or the alleged defect is not supported by the source evidence, return the same five required fields with replacement_text exactly equal to original_text. This deliberately unchanged proposal is a non-repair signal; the Application rejects it as an unsuccessful repair. Do not invent a correction, return a replacement generality, claim success, emit an error-shaped object, or evade the schema. Do not change target_path or the source binding to make a repair possible.

Return exactly these five fields and no others: schema_version, source_report_hash, target_path, original_text, replacement_text. Do not return the Report, evidence labels, a pass judgment, explanations, markdown, hidden reasoning, or customer-facing repair language. The proposal is not deliverability evidence; the Application must validate and merge it, then independently evaluate the merged Report.
