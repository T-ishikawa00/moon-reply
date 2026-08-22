import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import {
  JPY980_CLARIFICATION_CATALOG_V1,
  type Jpy980ClarificationV1,
  type Jpy980InputSufficiencyStateV1,
} from "./jpy980-input-sufficiency-policy-v1.ts";
import {
  evaluateJpy980InputSufficiencyV3,
  type Jpy980FunctionalDimensionV3,
  type Jpy980InputSufficiencyPolicyInputV3,
} from "./jpy980-input-sufficiency-policy-v3.ts";

export const JPY980_INPUT_SUFFICIENCY_POLICY_V4_VERSION =
  "m2-p4-jpy980-input-sufficiency-policy-v4" as const;
export const JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION =
  "m2-p4-jpy980-input-sufficiency-result-v4" as const;

export const JPY980_SOFT_UNCERTAINTY_DIMENSIONS_V4 = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
] as const satisfies readonly Jpy980FunctionalDimensionV3[];

export type Jpy980InputSufficiencyResultV4 = {
  schemaVersion: typeof JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION;
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

const softUncertaintyDimensions = new Set<Jpy980FunctionalDimensionV3>(
  JPY980_SOFT_UNCERTAINTY_DIMENSIONS_V4,
);
const supportedPrimaryRequests = new Set([
  "decide_send_or_wait",
  "draft_message",
  "message_impact",
]);

function clarificationBudget(
  grounding: ClarificationGroundingV1 | null,
): Jpy980InputSufficiencyResultV4["clarificationBudget"] {
  return grounding === null
    ? {
        maximumQuestionsTotal: 1,
        questionsAlreadyUsed: 0,
        questionsRemaining: 1,
      }
    : {
        maximumQuestionsTotal: 1,
        questionsAlreadyUsed: 1,
        questionsRemaining: 0,
      };
}

function result(
  input: Jpy980InputSufficiencyPolicyInputV3,
  state: Jpy980InputSufficiencyStateV1,
  reasonCodes: string[],
  missingMaterialDimensions: Jpy980FunctionalDimensionV3[],
  clarification: Jpy980ClarificationV1 | null,
): Jpy980InputSufficiencyResultV4 {
  return {
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V4_SCHEMA_VERSION,
    state,
    reasonCodes: [...reasonCodes],
    missingMaterialDimensions: [...missingMaterialDimensions],
    clarificationBudget: clarificationBudget(input.clarificationGrounding),
    clarification: clarification === null ? null : { ...clarification },
  };
}

function baseStructuredIntake(input: Jpy980InputSufficiencyPolicyInputV3) {
  return input.basePolicyInput.baseStructuredIntake as Record<string, unknown>;
}

function selectedRequests(input: Jpy980InputSufficiencyPolicyInputV3) {
  const facts = input.basePolicyInput.decisionFacts as Record<string, unknown>;
  return new Set(
    Array.isArray(facts.selected_requests)
      ? facts.selected_requests.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  );
}

function hasSupportedPrimaryRequest(input: Jpy980InputSufficiencyPolicyInputV3) {
  return [...selectedRequests(input)].some((request) =>
    supportedPrimaryRequests.has(request),
  );
}

function hasGroundedObservedFact(input: Jpy980InputSufficiencyPolicyInputV3) {
  const observedFacts = baseStructuredIntake(input).observed_facts;
  return Array.isArray(observedFacts) && observedFacts.length > 0;
}

function materialConcernResolved(
  grounding: ClarificationGroundingV1 | null,
) {
  return (
    grounding?.target === "material_relationship_or_communication_concern" &&
    grounding.materiallyResolvesTarget === true
  );
}

export function evaluateJpy980InputSufficiencyV4(
  input: Jpy980InputSufficiencyPolicyInputV3,
): Jpy980InputSufficiencyResultV4 {
  const baseline = evaluateJpy980InputSufficiencyV3(input);
  if (baseline.state === "safety_blocked") {
    return result(input, "safety_blocked", baseline.reasonCodes, [], null);
  }
  if (baseline.state === "full_paid_ready_candidate") {
    return result(
      input,
      "full_paid_ready_candidate",
      baseline.reasonCodes,
      [],
      null,
    );
  }

  const hardMissing = baseline.missingMaterialDimensions.filter(
    (dimension) => !softUncertaintyDimensions.has(dimension),
  );
  if (
    baseline.missingMaterialDimensions.length > 0 &&
    hardMissing.length === 0
  ) {
    return result(
      input,
      "full_paid_ready_candidate",
      [
        "SOFT_UNCERTAINTY_ABSORBED_BY_ASSESSMENT_NOTE",
        "CONDITIONAL_REASONING_AND_REASSESSMENT_ALLOWED",
      ],
      [],
      null,
    );
  }

  const oneResolvableUnusableGap =
    hardMissing.length === 1 &&
    hardMissing[0] === "usable_action_context" &&
    hasGroundedObservedFact(input) &&
    hasSupportedPrimaryRequest(input);
  if (oneResolvableUnusableGap) {
    if (input.clarificationGrounding === null) {
      return result(
        input,
        "needs_one_clarifying_answer",
        [
          "MEANINGFUL_ASSESSMENT_ACTION_CONTEXT_MISSING",
          "ONE_ANSWER_CAN_ESTABLISH_USABLE_CONSULTATION_FOCUS",
          "CLARIFICATION_BUDGET_AVAILABLE",
        ],
        ["usable_action_context"],
        JPY980_CLARIFICATION_CATALOG_V1
          .material_relationship_or_communication_concern,
      );
    }
    if (materialConcernResolved(input.clarificationGrounding)) {
      return result(
        input,
        "full_paid_ready_candidate",
        [
          "USABLE_CONSULTATION_FOCUS_ESTABLISHED_BY_CLARIFICATION",
          "SOFT_UNCERTAINTY_ABSORBED_BY_ASSESSMENT_NOTE",
        ],
        [],
        null,
      );
    }
    return result(
      input,
      "not_full_product_candidate",
      [
        "CLARIFICATION_BUDGET_EXHAUSTED",
        "MEANINGFUL_ASSESSMENT_ACTION_CONTEXT_MISSING",
      ],
      ["usable_action_context"],
      null,
    );
  }

  if (hardMissing.length > 0) {
    return result(
      input,
      "not_full_product_candidate",
      [
        "MEANINGFUL_ASSESSMENT_BASIS_MISSING",
        "ONE_BOUNDED_ANSWER_CANNOT_ESTABLISH_USABLE_ASSESSMENT",
      ],
      hardMissing,
      null,
    );
  }

  return result(
    input,
    baseline.state,
    baseline.reasonCodes,
    baseline.missingMaterialDimensions,
    baseline.clarification,
  );
}
