import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import { buildEffectiveDecisionPolicyV2, type EffectiveDecisionPolicyV2 } from "./effective-decision-policy-v2.ts";
import type { Jpy980InputSufficiencyPolicyInputV3 } from "./jpy980-input-sufficiency-policy-v3.ts";
import { evaluateJpy980InputSufficiencyV4, type Jpy980InputSufficiencyResultV4 } from "./jpy980-input-sufficiency-policy-v4.ts";
import type { Decision } from "./types.ts";

export const V19_L1_INPUT_RESULT_VERSION = "m2-p4-jpy980-input-sufficiency-result-v19-l1" as const;
export const V19_L1_EFFECTIVE_POLICY_VERSION = "m2-p4-effective-decision-policy-v19-l1" as const;
export type V19L1InputSufficiencyResult = Omit<Jpy980InputSufficiencyResultV4, "schemaVersion"> & {
  schemaVersion: typeof V19_L1_INPUT_RESULT_VERSION;
};
export type V19L1EffectiveDecisionPolicy = Omit<EffectiveDecisionPolicyV2, "schemaVersion"> & {
  schemaVersion: typeof V19_L1_EFFECTIVE_POLICY_VERSION;
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

/** Only consumes validated, grounded Base authority. No prose matching or V18 rules. */
export function classifyV19L1AcknowledgementPurpose(authority: EffectiveAssessmentAuthorityV1) {
  const facts = object(authority.effectiveDecisionContext.decisionFacts);
  const writing = object(authority.effectiveWritingContext.baseWritingSignals);
  const candidate = object(authority.effectiveWritingContext.candidateEnvelope);
  const boundary = object(facts?.boundary_state);
  const contactConstraint = object(facts?.user_contact_constraint);
  const contact = object(facts?.contact_state);
  const message = object(facts?.latest_direct_message);
  const practical = object(facts?.practical_reason);
  const goal = object(writing?.user_goal_detail);
  const incoming = object(writing?.incoming_message_profile);
  const requests = facts?.selected_requests;
  const acts = incoming?.dialogue_acts;
  const obligations = incoming?.unanswered_obligations;
  const requirements = incoming?.practical_requirements;
  const constraints = writing?.explicit_user_constraints;
  if (
    authority.clarificationAuthorityRef !== null || candidate?.presence !== false ||
    !Array.isArray(requests) || requests.length !== 1 || requests[0] !== "decide_send_or_wait" ||
    goal?.value !== "respond_politely" || goal.basis !== "current_situation_explicit" ||
    message?.sender !== "other_person" || message.sns_signal_only !== false ||
    !["thanks_or_followup", "social_acknowledgement"].includes(String(message.kind)) ||
    message.user_reply_state !== "not_replied" || message.response_expectation !== "optional" ||
    incoming?.present !== true || incoming.response_expectation !== "optional" ||
    !["none", "soft"].includes(String(incoming.closure_signal)) ||
    !Array.isArray(acts) || !acts.includes("thanks") ||
    !acts.every((act) => act === "thanks" || act === "conversation_closure") ||
    !Array.isArray(obligations) || obligations.length !== 0 ||
    !Array.isArray(requirements) || !requirements.every((item) => item === "none") ||
    boundary?.kind !== "none" || boundary.status !== "none" ||
    boundary.repeated_unanswered_contact !== false ||
    contactConstraint?.kind !== "none" || contactConstraint.status !== "none" ||
    (contact?.unanswered_user_message_count !== 0 && contact?.unanswered_user_message_count !== null) ||
    practical?.kind !== "none" || practical.active !== false || practical.deadline !== "none" ||
    !Array.isArray(constraints) || !constraints.every((constraint) =>
      ["keep_polite_register", "keep_casual_register", "no_emoji"].includes(String(object(constraint)?.kind)))
  ) return null;
  return {
    consumedEffectivePaths: [
      "effectiveDecisionContext.decisionFacts",
      "effectiveWritingContext.baseWritingSignals.user_goal_detail",
      "effectiveWritingContext.baseWritingSignals.incoming_message_profile",
      "effectiveWritingContext.baseWritingSignals.explicit_user_constraints",
      "effectiveWritingContext.candidateEnvelope",
    ],
  };
}

export function evaluateV19L1InputSufficiency(input: Jpy980InputSufficiencyPolicyInputV3): V19L1InputSufficiencyResult {
  const predecessor = evaluateJpy980InputSufficiencyV4(input);
  const result: V19L1InputSufficiencyResult = {
    ...structuredClone(predecessor), schemaVersion: V19_L1_INPUT_RESULT_VERSION,
  };
  // All Safety, integrity, other missing dimensions and the one-question budget stay V17.
  if (input.clarificationGrounding !== null || predecessor.state !== "needs_one_clarifying_answer" ||
    predecessor.missingMaterialDimensions.length !== 1 ||
    predecessor.missingMaterialDimensions[0] !== "usable_action_context" ||
    classifyV19L1AcknowledgementPurpose(input.effectiveAssessmentAuthority) === null) return result;
  return { ...result, state: "full_paid_ready_candidate",
    reasonCodes: ["GROUNDED_OPTIONAL_THANKS_REPLY_CONTEXT_PRESENT"],
    missingMaterialDimensions: [], clarification: null };
}

export function buildV19L1EffectiveDecisionPolicy(input: {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
}): V19L1EffectiveDecisionPolicy {
  const predecessor = buildEffectiveDecisionPolicyV2(input);
  const result: V19L1EffectiveDecisionPolicy = {
    ...structuredClone(predecessor), schemaVersion: V19_L1_EFFECTIVE_POLICY_VERSION,
  };
  const purpose = classifyV19L1AcknowledgementPurpose(input.authority);
  if (input.candidateEnvelope.presence !== false || purpose === null ||
    predecessor.policy.allowed_decisions[0] !== "wait_and_reassess" ||
    predecessor.policy.reason_codes.length !== 1 || predecessor.policy.reason_codes[0] !== "waiting_preferred") return result;
  const reason = "optional_thanks_reply_without_response_obligation";
  const otherDecisions: Decision[] = ["send_now", "wait_and_reassess", "pause_additional_contact"];
  // One primary recommendation, not an obligation to reply. Original optional
  // expectation/soft closure remain available to PB04–06 without fact mutation.
  result.policy = { ...result.policy, allowed_decisions: ["reply_now"],
    disallowed_decisions: otherDecisions.map((decision) => ({ decision, reason_codes: [reason] })),
    message_draft_policy: "required_now", later_draft_mode: null,
    follow_up_exception: "none", pause_reason_code: null, resume_policy: null, reason_codes: [reason] };
  result.consumedEffectivePaths = [...new Set([...result.consumedEffectivePaths, ...purpose.consumedEffectivePaths])];
  return result;
}
