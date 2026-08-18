import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import { validateEffectiveAssessmentAuthorityIntegrityV1 } from "./effective-assessment-authority-integrity-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import {
  JPY980_CLARIFICATION_CATALOG_V1,
  type Jpy980ClarificationTargetV1,
  type Jpy980ClarificationV1,
  type Jpy980InputSufficiencyPolicyInputV1,
  type Jpy980InputSufficiencyStateV1,
} from "./jpy980-input-sufficiency-policy-v1.ts";
import {
  evaluateJpy980InputSufficiencyV2,
  type Jpy980InputSufficiencyResultV2,
} from "./jpy980-input-sufficiency-policy-v2.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import type { JsonObject } from "./types.ts";

export const JPY980_INPUT_SUFFICIENCY_POLICY_V3_VERSION =
  "m2-p4-jpy980-input-sufficiency-policy-v3" as const;
export const JPY980_INPUT_SUFFICIENCY_RESULT_V3_SCHEMA_VERSION =
  "m2-p4-jpy980-input-sufficiency-result-v3" as const;

export const JPY980_FUNCTIONAL_DIMENSIONS_V3 = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
  "grounded_evidence",
  "usable_action_context",
  "candidate_analysis",
  "consultation_specific_product_value",
] as const;

export type Jpy980FunctionalDimensionV3 =
  (typeof JPY980_FUNCTIONAL_DIMENSIONS_V3)[number];

export type Jpy980InputSufficiencyResultV3 = {
  schemaVersion: typeof JPY980_INPUT_SUFFICIENCY_RESULT_V3_SCHEMA_VERSION;
  state: Jpy980InputSufficiencyStateV1;
  reasonCodes: string[];
  missingMaterialDimensions: Jpy980FunctionalDimensionV3[];
  clarificationBudget: {
    maximumQuestionsTotal: 1;
    questionsAlreadyUsed: 0 | 1;
    questionsRemaining: 0 | 1;
  };
  clarification: Jpy980ClarificationV1 | null;
};

export type Jpy980InputSufficiencyPolicyInputV3 = {
  basePolicyInput: Omit<
    Jpy980InputSufficiencyPolicyInputV1,
    "clarificationAlreadyUsed"
  >;
  clarificationGrounding: ClarificationGroundingV1 | null;
  effectiveAssessmentAuthority: EffectiveAssessmentAuthorityV1;
};

type TrustedFunctionalAuthorityV3 = {
  base: Record<string, unknown>;
  facts: Record<string, unknown>;
  writing: Record<string, unknown>;
  candidate: CandidateEnvelopeV1;
};

const primaryDecisionRequest = "decide_send_or_wait";
const primaryDraftRequests = new Set(["draft_message", "message_impact"]);
const nonMaterialGoalValues = new Set([
  "unknown",
  "other",
  "respond_politely",
  "schedule_only",
]);
const genericRegisterConstraintKinds = new Set([
  "keep_polite_register",
  "keep_casual_register",
]);
const unresolvedTimingPath =
  "contact_state.elapsed_since_latest_user_message_minutes";
const unresolvedCadencePath = "contact_state.usual_cadence_relation";

function invalid(): never {
  throw new M2RuntimeError("M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID");
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid();
  }
  return value as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    invalid();
  }
  return value as string[];
}

function sameStructuredValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function resolvedSignal(value: unknown, basis: unknown) {
  return value !== "unknown" && basis !== "unresolved";
}

function groundedGoal(value: unknown, basis: unknown) {
  return resolvedSignal(value, basis) && basis !== "requested_topics";
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function clarificationBudget(used: boolean) {
  return used
    ? {
        maximumQuestionsTotal: 1 as const,
        questionsAlreadyUsed: 1 as const,
        questionsRemaining: 0 as const,
      }
    : {
        maximumQuestionsTotal: 1 as const,
        questionsAlreadyUsed: 0 as const,
        questionsRemaining: 1 as const,
      };
}

function result(
  state: Jpy980InputSufficiencyStateV1,
  reasonCodes: string[],
  missingMaterialDimensions: Iterable<Jpy980FunctionalDimensionV3>,
  clarificationAlreadyUsed: boolean,
  clarification: Jpy980ClarificationV1 | null,
): Jpy980InputSufficiencyResultV3 {
  if (state !== "needs_one_clarifying_answer" && clarification !== null) {
    invalid();
  }
  const missing = new Set(missingMaterialDimensions);
  return {
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V3_SCHEMA_VERSION,
    state,
    reasonCodes: [...reasonCodes],
    missingMaterialDimensions: JPY980_FUNCTIONAL_DIMENSIONS_V3.filter(
      (dimension) => missing.has(dimension),
    ),
    clarificationBudget: clarificationBudget(clarificationAlreadyUsed),
    clarification: clarification === null ? null : { ...clarification },
  };
}

function v3SafetyResult(
  baseline: Jpy980InputSufficiencyResultV2,
  clarificationAlreadyUsed: boolean,
) {
  return result(
    "safety_blocked",
    baseline.reasonCodes,
    [],
    clarificationAlreadyUsed,
    null,
  );
}

function trustedAuthority(
  input: Jpy980InputSufficiencyPolicyInputV3,
): TrustedFunctionalAuthorityV3 {
  const decisionContext = object(
    input.effectiveAssessmentAuthority.effectiveDecisionContext,
  );
  const writingContext = object(
    input.effectiveAssessmentAuthority.effectiveWritingContext,
  );
  const effectiveFacts = object(decisionContext.decisionFacts);
  const effectiveWriting = object(writingContext.baseWritingSignals);
  if (
    input.effectiveAssessmentAuthority.baseAuthorityRef !==
      "base_structured_intake" ||
    input.effectiveAssessmentAuthority.candidateAuthorityRef !==
      "candidate_envelope" ||
    !sameStructuredValue(effectiveFacts, input.basePolicyInput.decisionFacts) ||
    !sameStructuredValue(
      effectiveWriting,
      input.basePolicyInput.baseWritingSignals,
    )
  ) {
    invalid();
  }
  if (
    input.clarificationGrounding === null
      ? input.effectiveAssessmentAuthority.clarificationAuthorityRef !== null
      : input.effectiveAssessmentAuthority.clarificationAuthorityRef !==
        input.clarificationGrounding.sourceIdentity
  ) {
    invalid();
  }
  const candidate = object(writingContext.candidateEnvelope) as CandidateEnvelopeV1;
  validateCandidateSourceIntegrityV1({ candidateEnvelope: candidate });
  validateEffectiveAssessmentAuthorityIntegrityV1({
    authority: input.effectiveAssessmentAuthority,
    baseStructuredIntake: input.basePolicyInput.baseStructuredIntake,
    candidateEnvelope: candidate as unknown as JsonObject,
    clarificationGrounding: input.clarificationGrounding,
  });
  return {
    base: object(input.basePolicyInput.baseStructuredIntake),
    facts: object(input.basePolicyInput.decisionFacts),
    writing: object(input.basePolicyInput.baseWritingSignals),
    candidate,
  };
}

function clarified(
  grounding: ClarificationGroundingV1 | null,
  target: Jpy980ClarificationTargetV1,
) {
  return (
    grounding?.target === target && grounding.materiallyResolvesTarget === true
  );
}

function observedFactsPresent(authority: TrustedFunctionalAuthorityV3) {
  return (
    Array.isArray(authority.base.observed_facts) &&
    authority.base.observed_facts.length > 0
  );
}

function candidateAnalysisAvailable(authority: TrustedFunctionalAuthorityV3) {
  return (
    authority.candidate.presence === true &&
    authority.candidate.analysis_status === "available" &&
    authority.candidate.safety_status === "available" &&
    authority.candidate.analysis !== null
  );
}

function incomingProfile(authority: TrustedFunctionalAuthorityV3) {
  return object(authority.writing.incoming_message_profile);
}

function hasIncomingObligation(authority: TrustedFunctionalAuthorityV3) {
  const message = object(authority.facts.latest_direct_message);
  const profile = incomingProfile(authority);
  const obligations = stringArray(profile.unanswered_obligations);
  const requirements = stringArray(profile.practical_requirements);
  const typedMessage =
    message.sender === "other_person" &&
    message.user_reply_state === "not_replied" &&
    message.sns_signal_only === false &&
    message.response_expectation === "reasonable" &&
    message.kind !== "none" &&
    message.kind !== "unknown";
  const typedRequirement =
    profile.present === true &&
    (obligations.length > 0 ||
      requirements.some(
        (requirement) => requirement !== "none" && requirement !== "unknown",
      ));
  return typedMessage && typedRequirement;
}

function knownPracticalDeadline(authority: TrustedFunctionalAuthorityV3) {
  const practical = object(authority.facts.practical_reason);
  return (
    practical.active === true &&
    practical.kind !== "none" &&
    practical.kind !== "unknown" &&
    practical.deadline !== "none" &&
    practical.deadline !== "unknown"
  );
}

function hasGroundedCadenceSummary(authority: TrustedFunctionalAuthorityV3) {
  const communication = object(authority.writing.communication_pattern);
  return (
    communication.basis !== "unresolved" &&
    nonEmptyString(communication.usual_response_cadence_summary)
  );
}

function evaluateDecisionPath(
  authority: TrustedFunctionalAuthorityV3,
  grounding: ClarificationGroundingV1 | null,
  missing: Set<Jpy980FunctionalDimensionV3>,
  hardMissing: Set<Jpy980FunctionalDimensionV3>,
) {
  if (!observedFactsPresent(authority)) {
    hardMissing.add("grounded_evidence");
    return;
  }
  const message = object(authority.facts.latest_direct_message);
  const contact = object(authority.facts.contact_state);
  const boundary = object(authority.facts.boundary_state);
  const information = object(authority.facts.information_state);
  const unresolved = new Set(stringArray(information.unresolved_fields));

  if (
    boundary.status === "explicit" ||
    boundary.repeated_unanswered_contact === true ||
    hasIncomingObligation(authority) ||
    knownPracticalDeadline(authority)
  ) {
    return;
  }

  const outboundWaiting =
    message.sender === "user" &&
    message.sns_signal_only === false &&
    typeof contact.unanswered_user_message_count === "number" &&
    contact.unanswered_user_message_count >= 1;
  if (!outboundWaiting) {
    hardMissing.add("usable_action_context");
    return;
  }

  const timingFromBase =
    typeof contact.elapsed_since_latest_user_message_minutes === "number" &&
    Number.isFinite(contact.elapsed_since_latest_user_message_minutes) &&
    contact.elapsed_since_latest_user_message_minutes >= 0 &&
    !unresolved.has(unresolvedTimingPath);
  const timingPresent =
    timingFromBase || clarified(grounding, "latest_contact_timing");
  const cadenceFromBase =
    contact.usual_cadence_relation !== "unknown" &&
    !unresolved.has(unresolvedCadencePath);
  const cadencePresent =
    cadenceFromBase ||
    clarified(grounding, "usual_reply_cadence") ||
    hasGroundedCadenceSummary(authority);

  if (!timingPresent) missing.add("latest_contact_timing");
  if (!cadencePresent) missing.add("usual_reply_cadence");
}

function hasUsableTone(
  authority: TrustedFunctionalAuthorityV3,
  grounding: ClarificationGroundingV1 | null,
) {
  const dimensions = object(authority.writing.relationship_dimensions);
  const register = object(dimensions.observed_register);
  const communication = object(authority.writing.communication_pattern);
  const constraints = authority.writing.explicit_user_constraints;
  if (!Array.isArray(constraints)) invalid();
  const candidateRegister =
    authority.candidate.presence &&
    authority.candidate.analysis_status === "available"
      ? authority.candidate.analysis.candidate_style_profile.register
      : "unknown";
  return (
    resolvedSignal(register.value, register.basis) ||
    resolvedSignal(communication.usual_register, communication.basis) ||
    constraints.some((constraint) => {
      const typed = object(constraint);
      return genericRegisterConstraintKinds.has(String(typed.kind));
    }) ||
    candidateRegister !== "unknown" ||
    clarified(grounding, "requested_message_tone")
  );
}

function hasResolvedWritingDirection(
  authority: TrustedFunctionalAuthorityV3,
  grounding: ClarificationGroundingV1 | null,
) {
  const goal = object(authority.writing.user_goal_detail);
  const constraints = authority.writing.explicit_user_constraints;
  if (!Array.isArray(constraints)) invalid();
  return (
    groundedGoal(goal.value, goal.basis) ||
    constraints.length > 0 ||
    hasIncomingObligation(authority) ||
    clarified(grounding, "relationship_intent") ||
    clarified(grounding, "material_relationship_or_communication_concern")
  );
}

function hasPersonaContext(authority: TrustedFunctionalAuthorityV3) {
  const expression = object(authority.writing.language_and_expression);
  const communication = object(authority.writing.communication_pattern);
  const candidateExpression =
    authority.candidate.presence &&
    authority.candidate.analysis_status === "available"
      ? authority.candidate.analysis.candidate_language_expression
      : null;
  return (
    expression.basis !== "unresolved" &&
    (expression.dialect_or_regional_expression === "present" ||
      expression.established_shared_expression === "present" ||
      expression.intentional_nonstandard_expression === "present" ||
      communication.usual_emoji_pattern === "frequent" ||
      candidateExpression?.dialect_or_regional_expression === "present" ||
      candidateExpression?.intentional_nonstandard_expression === "present")
  );
}

function hasConsultationSpecificDraftPurpose(
  authority: TrustedFunctionalAuthorityV3,
  grounding: ClarificationGroundingV1 | null,
) {
  const goal = object(authority.writing.user_goal_detail);
  const constraints = authority.writing.explicit_user_constraints;
  if (!Array.isArray(constraints)) invalid();
  return (
    (groundedGoal(goal.value, goal.basis) &&
      !nonMaterialGoalValues.has(String(goal.value))) ||
    constraints.some(
      (constraint) =>
        !genericRegisterConstraintKinds.has(String(object(constraint).kind)),
    ) ||
    hasPersonaContext(authority) ||
    clarified(grounding, "relationship_intent") ||
    clarified(grounding, "material_relationship_or_communication_concern")
  );
}

function evaluateDraftPath(
  authority: TrustedFunctionalAuthorityV3,
  requests: Set<string>,
  grounding: ClarificationGroundingV1 | null,
  missing: Set<Jpy980FunctionalDimensionV3>,
  hardMissing: Set<Jpy980FunctionalDimensionV3>,
) {
  if (!observedFactsPresent(authority)) {
    hardMissing.add("grounded_evidence");
  }
  const messageImpact = requests.has("message_impact");
  const boundary = object(authority.facts.boundary_state);
  if (
    !messageImpact &&
    (boundary.status === "explicit" ||
      boundary.repeated_unanswered_contact === true)
  ) {
    return;
  }
  if (messageImpact && !candidateAnalysisAvailable(authority)) {
    hardMissing.add("candidate_analysis");
  }
  if (!hasUsableTone(authority, grounding)) {
    missing.add("requested_message_tone");
  }

  if (messageImpact) {
    if (!hasResolvedWritingDirection(authority, grounding)) {
      missing.add("material_relationship_or_communication_concern");
    }
    return;
  }
  if (!hasConsultationSpecificDraftPurpose(authority, grounding)) {
    missing.add("material_relationship_or_communication_concern");
  }
}

function clarificationFor(
  dimension: Jpy980FunctionalDimensionV3,
): Jpy980ClarificationV1 | null {
  if (
    dimension !== "material_relationship_or_communication_concern" &&
    dimension !== "latest_contact_timing" &&
    dimension !== "usual_reply_cadence" &&
    dimension !== "central_fear_or_decision_concern" &&
    dimension !== "relationship_intent" &&
    dimension !== "requested_message_tone"
  ) {
    return null;
  }
  const selected = JPY980_CLARIFICATION_CATALOG_V1[dimension];
  return dimension === "usual_reply_cadence"
    ? {
        code: "ask_usual_reply_cadence_v2",
        target: dimension,
        question: "今の待ち時間は、その相手の普段の返信ペースの範囲内ですか？",
      }
    : { ...selected };
}

export function evaluateJpy980InputSufficiencyV3(
  input: Jpy980InputSufficiencyPolicyInputV3,
): Jpy980InputSufficiencyResultV3 {
  const baseline = evaluateJpy980InputSufficiencyV2(input);
  const clarificationAlreadyUsed = input.clarificationGrounding !== null;
  if (baseline.state === "safety_blocked") {
    return v3SafetyResult(baseline, clarificationAlreadyUsed);
  }

  const authority = trustedAuthority(input);
  const requests = new Set(stringArray(authority.facts.selected_requests));
  const decisionPath = requests.has(primaryDecisionRequest);
  const draftPath = [...primaryDraftRequests].some((request) =>
    requests.has(request),
  );
  if (!decisionPath && !draftPath) {
    return result(
      "not_full_product_candidate",
      ["SUPPORTED_PRIMARY_PRODUCT_FUNCTION_NOT_ESTABLISHED"],
      [],
      clarificationAlreadyUsed,
      null,
    );
  }

  const missing = new Set<Jpy980FunctionalDimensionV3>();
  const hardMissing = new Set<Jpy980FunctionalDimensionV3>();
  if (decisionPath) {
    evaluateDecisionPath(
      authority,
      input.clarificationGrounding,
      missing,
      hardMissing,
    );
  }
  if (draftPath) {
    evaluateDraftPath(
      authority,
      requests,
      input.clarificationGrounding,
      missing,
      hardMissing,
    );
  }

  if (hardMissing.size > 0) {
    return result(
      "not_full_product_candidate",
      [
        "FUNCTIONAL_PRODUCT_AUTHORITY_INSUFFICIENT",
        "ONE_ANSWER_CANNOT_ESTABLISH_OR_REJECT_ELIGIBILITY",
      ],
      [...hardMissing, ...missing],
      clarificationAlreadyUsed,
      null,
    );
  }
  if (missing.size === 0) {
    return result(
      "full_paid_ready_candidate",
      ["FUNCTIONAL_PRODUCT_GROUNDING_BASIS_PRESENT"],
      [],
      clarificationAlreadyUsed,
      null,
    );
  }
  if (clarificationAlreadyUsed) {
    return result(
      "not_full_product_candidate",
      [
        "CLARIFICATION_BUDGET_EXHAUSTED",
        "FUNCTIONAL_PRODUCT_AUTHORITY_INSUFFICIENT",
      ],
      missing,
      true,
      null,
    );
  }
  if (missing.size > 1) {
    return result(
      "not_full_product_candidate",
      [
        "MULTIPLE_INDEPENDENT_FUNCTIONAL_GAPS_MISSING",
        "ONE_ANSWER_CANNOT_ESTABLISH_OR_REJECT_ELIGIBILITY",
      ],
      missing,
      false,
      null,
    );
  }

  const [onlyMissing] = missing;
  const clarification = clarificationFor(onlyMissing);
  if (clarification === null) {
    return result(
      "not_full_product_candidate",
      [
        "FUNCTIONAL_GAP_NOT_CLARIFIABLE_BY_BOUNDED_CATALOG",
        "ONE_ANSWER_CANNOT_ESTABLISH_OR_REJECT_ELIGIBILITY",
      ],
      missing,
      false,
      null,
    );
  }
  return result(
    "needs_one_clarifying_answer",
    [
      "ONE_FUNCTIONAL_GAP_MISSING",
      "ONE_ANSWER_CAN_ESTABLISH_OR_REJECT_ELIGIBILITY",
      "CLARIFICATION_BUDGET_AVAILABLE",
    ],
    missing,
    false,
    clarification,
  );
}
