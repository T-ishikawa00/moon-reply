import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type { Jpy980InputSufficiencyPolicyInputV3 } from "./jpy980-input-sufficiency-policy-v3.ts";
import {
  buildV19L1EffectiveDecisionPolicy,
  evaluateV19L1InputSufficiency,
  type V19L1EffectiveDecisionPolicy,
  type V19L1InputSufficiencyResult,
} from "./v19-l1-acknowledgement-policy.ts";
import type { Decision, JsonObject } from "./types.ts";
import type {
  V19L5OriginalMessageClarification,
  V19L5RequestIntent,
  V19L5Route,
} from "./v19-l5-types.ts";

export const V19_L5_INPUT_RESULT_VERSION = "m2-p4-jpy980-input-sufficiency-result-v19-l5" as const;
export const V19_L5_EFFECTIVE_POLICY_VERSION = "m2-p4-effective-decision-policy-v19-l5" as const;
export const V19_L5_ORIGINAL_MESSAGE_QUESTION: V19L5OriginalMessageClarification = Object.freeze({
  code: "ask_original_message_v19_l5",
  target: "original_message",
  question: "整えたい文章をそのまま教えてください",
});

export type V19L5EffectiveDecisionPolicy = Omit<V19L1EffectiveDecisionPolicy, "schemaVersion"> & {
  schemaVersion: typeof V19_L5_EFFECTIVE_POLICY_VERSION;
};

export type V19L5InputSufficiencyResult = Omit<
  V19L1InputSufficiencyResult,
  "schemaVersion" | "missingMaterialDimensions" | "clarification"
> & {
  schemaVersion: typeof V19_L5_INPUT_RESULT_VERSION;
  missingMaterialDimensions: Array<
    V19L1InputSufficiencyResult["missingMaterialDimensions"][number] | "original_message"
  >;
  clarification: V19L1InputSufficiencyResult["clarification"] | V19L5OriginalMessageClarification;
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function invalidIntent(): never {
  throw new M2RuntimeError("M2_V19_L5_INTENT_SOURCE_INTEGRITY_FAILED");
}

/** Semantic classification belongs to PB01; this validates its exact Base provenance. */
export function validateV19L5Intent(input: {
  intent: unknown;
  baseStructuredIntake: JsonObject;
  currentSituation: string;
}): V19L5RequestIntent {
  const intent = object(input.intent);
  const keys = ["message_task", "decision_requested", "decision_explicitly_excluded",
    "communication_purpose", "evidence_fact_ids", "source_excerpt"];
  if (intent === null || Object.keys(intent).length !== keys.length ||
    !keys.every((key) => Object.prototype.hasOwnProperty.call(intent, key)) ||
    !["EDIT_EXISTING_MESSAGE", "COMPOSE_NEW_MESSAGE", "NONE"].includes(String(intent.message_task)) ||
    typeof intent.decision_requested !== "boolean" ||
    typeof intent.decision_explicitly_excluded !== "boolean" ||
    (intent.decision_requested && intent.decision_explicitly_excluded) ||
    !["APPRECIATION", "NATURAL_REPLY", "FIRST_INVITATION", "OTHER"].includes(String(intent.communication_purpose)) ||
    typeof intent.source_excerpt !== "string" || intent.source_excerpt.trim().length === 0 ||
    !input.currentSituation.includes(intent.source_excerpt) ||
    !Array.isArray(intent.evidence_fact_ids) || intent.evidence_fact_ids.length === 0 ||
    intent.evidence_fact_ids.some((id) => typeof id !== "string" || !/^F[0-9]{3}$/u.test(id)) ||
    new Set(intent.evidence_fact_ids).size !== intent.evidence_fact_ids.length) invalidIntent();
  const observed = input.baseStructuredIntake.observed_facts;
  if (!Array.isArray(observed)) invalidIntent();
  for (const id of intent.evidence_fact_ids) {
    const matches = observed.filter((value) => object(value)?.fact_id === id);
    const fact = matches.length === 1 ? object(matches[0]) : null;
    if (fact === null || fact.support !== "explicit" ||
      !Array.isArray(fact.source_refs) || !fact.source_refs.includes("input:current_situation")) invalidIntent();
  }
  return structuredClone(intent) as V19L5RequestIntent;
}

/** Candidate existence is supplied by the separate Candidate authority, never PB01 intent. */
export function classifyV19L5Route(input: {
  intent: V19L5RequestIntent;
  candidateEnvelope: CandidateEnvelopeV1;
}): V19L5Route {
  if (input.intent.message_task === "EDIT_EXISTING_MESSAGE") {
    if (!input.candidateEnvelope.presence) return "original_message_clarification";
    if (!input.intent.decision_requested) return "message_only";
  }
  if (input.intent.message_task === "COMPOSE_NEW_MESSAGE" &&
    input.intent.decision_explicitly_excluded) return "message_only";
  return "decision_guidance";
}

type PurposeInput = {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
  intent: V19L5RequestIntent;
};

/** Only grounded typed purpose and structured contact facts participate; no prose/keyword gates. */
function actionablePurpose(input: PurposeInput): "reply_now" | "send_now" | null {
  const facts = object(input.authority.effectiveDecisionContext.decisionFacts);
  const writing = object(input.authority.effectiveWritingContext.baseWritingSignals);
  const boundary = object(facts?.boundary_state);
  const constraint = object(facts?.user_contact_constraint);
  const contact = object(facts?.contact_state);
  const message = object(facts?.latest_direct_message);
  const incoming = object(writing?.incoming_message_profile);
  if (facts === null || input.intent.communication_purpose === "OTHER" ||
    input.intent.evidence_fact_ids.length === 0 ||
    boundary?.kind !== "none" || boundary.status !== "none" ||
    boundary.repeated_unanswered_contact !== false ||
    constraint?.kind !== "none" || constraint.status !== "none" ||
    (contact?.unanswered_user_message_count !== 0 && contact?.unanswered_user_message_count !== null) ||
    message === null || message.sender === "user" || message.sns_signal_only !== false) return null;
  const candidate = input.candidateEnvelope;
  if (candidate.presence && (candidate.analysis_status !== "available" ||
    candidate.safety_status !== "available" ||
    !["none", "low"].includes(candidate.analysis.candidate_communicative_intent.response_pressure))) return null;
  const incomingReply = message.sender === "other_person" && message.user_reply_state === "not_replied" &&
    incoming?.present === true && incoming.closure_signal !== "explicit" &&
    incoming.closure_signal !== "unknown" &&
    ["reasonable", "optional"].includes(String(message.response_expectation));
  if (input.intent.communication_purpose === "NATURAL_REPLY") return incomingReply ? "reply_now" : null;
  if (input.intent.communication_purpose === "APPRECIATION" && incomingReply) return "reply_now";
  // Unknown timing is left unknown. It is not an assertion that the user is undecided.
  if (message.sender === "none" ||
    (message.sender === "other_person" && message.user_reply_state === "replied")) return "send_now";
  return null;
}

export function buildV19L5EffectiveDecisionPolicy(input: PurposeInput): V19L5EffectiveDecisionPolicy {
  const predecessor = buildV19L1EffectiveDecisionPolicy(input);
  const result: V19L5EffectiveDecisionPolicy = {
    ...structuredClone(predecessor), schemaVersion: V19_L5_EFFECTIVE_POLICY_VERSION,
  };
  if (classifyV19L5Route(input) !== "decision_guidance" ||
    predecessor.policy.allowed_decisions.length !== 1 ||
    predecessor.policy.allowed_decisions[0] !== "wait_and_reassess" ||
    predecessor.policy.reason_codes.length !== 1 ||
    predecessor.policy.reason_codes[0] !== "waiting_preferred") return result;
  const selected = actionablePurpose(input);
  if (selected === null) return result;
  const reason = `grounded_${input.intent.communication_purpose.toLowerCase()}_without_contact_barrier`;
  const decisions: Decision[] = ["reply_now", "send_now", "wait_and_reassess", "pause_additional_contact"];
  result.policy = { ...result.policy, allowed_decisions: [selected],
    disallowed_decisions: decisions.filter((decision) => decision !== selected)
      .map((decision) => ({ decision, reason_codes: [reason] })),
    message_draft_policy: "required_now", later_draft_mode: null,
    follow_up_exception: "none", pause_reason_code: null, resume_policy: null, reason_codes: [reason] };
  result.consumedEffectivePaths = [...new Set([...result.consumedEffectivePaths,
    "request_intent.communication_purpose", "request_intent.evidence_fact_ids",
    "effectiveDecisionContext.decisionFacts", "effectiveWritingContext.baseWritingSignals.incoming_message_profile",
    "effectiveWritingContext.candidateEnvelope"])];
  return result;
}

export function evaluateV19L5Sufficiency(input: Jpy980InputSufficiencyPolicyInputV3 & {
  intent: V19L5RequestIntent;
  candidateEnvelope: CandidateEnvelopeV1;
  originalMessageClarificationAlreadyUsed?: boolean;
}): V19L5InputSufficiencyResult {
  const predecessor = evaluateV19L1InputSufficiency(input);
  const result: V19L5InputSufficiencyResult = {
    ...structuredClone(predecessor), schemaVersion: V19_L5_INPUT_RESULT_VERSION,
    clarificationBudget: input.originalMessageClarificationAlreadyUsed === true
      ? { maximumQuestionsTotal: 1, questionsAlreadyUsed: 1, questionsRemaining: 0 }
      : structuredClone(predecessor.clarificationBudget),
  };
  // Preserve all predecessor Safety/integrity validation before intent-specific sufficiency.
  if (predecessor.state === "safety_blocked") return result;
  const route = classifyV19L5Route(input);
  if (route === "original_message_clarification") {
    const alreadyUsed = input.originalMessageClarificationAlreadyUsed === true ||
      predecessor.clarificationBudget.questionsAlreadyUsed === 1;
    return { ...result,
      state: alreadyUsed ? "not_full_product_candidate" : "needs_one_clarifying_answer",
      reasonCodes: alreadyUsed ? ["CLARIFICATION_BUDGET_EXHAUSTED", "EDIT_ORIGINAL_MESSAGE_REQUIRED"]
        : ["EDIT_ORIGINAL_MESSAGE_REQUIRED", "CLARIFICATION_BUDGET_AVAILABLE"],
      missingMaterialDimensions: ["original_message"],
      clarificationBudget: { maximumQuestionsTotal: 1, questionsAlreadyUsed: alreadyUsed ? 1 : 0,
        questionsRemaining: alreadyUsed ? 0 : 1 },
      clarification: alreadyUsed ? null : { ...V19_L5_ORIGINAL_MESSAGE_QUESTION } };
  }
  if (input.intent.message_task === "EDIT_EXISTING_MESSAGE" &&
    input.candidateEnvelope.analysis_status !== "available") {
    return { ...result, state: "not_full_product_candidate", reasonCodes: ["EDIT_CANDIDATE_ANALYSIS_REQUIRED"],
      missingMaterialDimensions: ["candidate_analysis"], clarification: null };
  }
  if (predecessor.state === "full_paid_ready_candidate") return result;
  const onlyUsableContextMissing = predecessor.missingMaterialDimensions.length === 1 &&
    predecessor.missingMaterialDimensions[0] === "usable_action_context";
  const groundedEditing = input.intent.message_task === "EDIT_EXISTING_MESSAGE" &&
    input.candidateEnvelope.analysis_status === "available";
  const groundedPurpose = actionablePurpose({ authority: input.effectiveAssessmentAuthority,
    candidateEnvelope: input.candidateEnvelope, intent: input.intent }) !== null;
  if (onlyUsableContextMissing && (groundedEditing || groundedPurpose)) {
    return { ...result, state: "full_paid_ready_candidate",
      reasonCodes: [groundedEditing ? "GROUNDED_EXISTING_MESSAGE_EDIT_REQUEST" : "GROUNDED_COMMUNICATION_PURPOSE_PRESENT"],
      missingMaterialDimensions: [], clarification: null };
  }
  return result;
}
