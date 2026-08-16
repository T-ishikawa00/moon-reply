import { M2RuntimeError } from "./errors.ts";
import {
  evaluateJpy980InputSufficiencyV1,
  type Jpy980InputSufficiencyPolicyInputV1,
  type Jpy980InputSufficiencyResultV1,
  type Jpy980MaterialDimensionV1,
} from "./jpy980-input-sufficiency-policy-v1.ts";
import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";

export const JPY980_INPUT_SUFFICIENCY_POLICY_V2_VERSION =
  "m2-p4-jpy980-input-sufficiency-policy-v2" as const;
export const JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION =
  "m2-p4-jpy980-input-sufficiency-result-v2" as const;

export type Jpy980InputSufficiencyResultV2 = Omit<
  Jpy980InputSufficiencyResultV1,
  "schemaVersion"
> & {
  schemaVersion: typeof JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION;
};

const materialGoals = new Set([
  "move_closer",
  "maintain_distance",
  "apologize",
  "repair_conflict",
  "decline_without_false_hope",
  "end_contact",
  "express_affection",
  "clarify_relationship",
]);

function invalid(): never {
  throw new M2RuntimeError("M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID");
}
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function v2(result: Jpy980InputSufficiencyResultV1): Jpy980InputSufficiencyResultV2 {
  const clarification = result.clarification
    ? {
        ...result.clarification,
        ...(result.clarification.target === "usual_reply_cadence"
          ? {
              code: "ask_usual_reply_cadence_v2",
              question:
                "今の待ち時間は、その相手の普段の返信ペースの範囲内ですか？",
            }
          : {}),
      }
    : null;
  return {
    ...result,
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION,
    clarification,
  };
}

function resolved(value: unknown, basis: unknown) {
  return value !== "unknown" && basis !== "unresolved";
}

function missingAfterClarification(
  input: Jpy980InputSufficiencyPolicyInputV1,
  grounding: ClarificationGroundingV1,
) {
  const base = object(input.baseStructuredIntake);
  const facts = object(input.decisionFacts);
  const writing = object(input.baseWritingSignals);
  const requests = new Set(facts.selected_requests as string[]);
  const waitPath =
    requests.has("decide_send_or_wait") || requests.has("next_three_days");
  const draftPath =
    requests.has("draft_message") || requests.has("message_impact");
  if (!waitPath && !draftPath) return null;

  const boundary = object(facts.boundary_state);
  const goal = object(writing.user_goal_detail);
  const materialFromBase =
    (resolved(goal.value, goal.basis) && materialGoals.has(String(goal.value))) ||
    boundary.status === "explicit" ||
    boundary.repeated_unanswered_contact === true;
  const materialFromClarification =
    grounding.target === "material_relationship_or_communication_concern" &&
    grounding.materiallyResolvesTarget;
  if (!materialFromBase && !materialFromClarification) {
    return [
      "material_relationship_or_communication_concern",
    ] as Jpy980MaterialDimensionV1[];
  }

  const missing = new Set<Jpy980MaterialDimensionV1>();
  const contact = object(facts.contact_state);
  const message = object(facts.latest_direct_message);
  const information = object(facts.information_state);
  const unresolved = new Set(
    Array.isArray(information.unresolved_fields)
      ? information.unresolved_fields.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
  );
  if (waitPath) {
    const hasTiming =
      grounding.target === "latest_contact_timing" &&
      grounding.materiallyResolvesTarget;
    if (
      !hasTiming &&
      (contact.elapsed_since_latest_user_message_minutes === null ||
        unresolved.has("contact_state.elapsed_since_latest_user_message_minutes"))
    ) missing.add("latest_contact_timing");

    const hasCadence =
      grounding.target === "usual_reply_cadence" &&
      grounding.materiallyResolvesTarget;
    if (
      !hasCadence &&
      (contact.usual_cadence_relation === "unknown" ||
        unresolved.has("contact_state.usual_cadence_relation"))
    ) missing.add("usual_reply_cadence");

    const hasEmotion =
      Array.isArray(base.user_emotions) && base.user_emotions.length > 0;
    if (
      !hasEmotion &&
      !(
        grounding.target === "central_fear_or_decision_concern" &&
        grounding.materiallyResolvesTarget
      )
    ) missing.add("central_fear_or_decision_concern");
    if (
      message.sender === "unknown" ||
      message.sender === "none" ||
      message.kind === "unknown" ||
      message.kind === "none" ||
      message.user_reply_state === "unknown"
    ) missing.add("usable_action_context");
  }

  if (draftPath) {
    const intent =
      resolved(goal.value, goal.basis) ||
      (grounding.target === "relationship_intent" &&
        grounding.materiallyResolvesTarget);
    if (!intent) missing.add("relationship_intent");

    const dimensions = object(writing.relationship_dimensions);
    const register = object(dimensions.observed_register);
    const communication = object(writing.communication_pattern);
    const constraints = Array.isArray(writing.explicit_user_constraints)
      ? writing.explicit_user_constraints
      : [];
    const tone =
      resolved(register.value, register.basis) ||
      (communication.usual_register !== "unknown" &&
        communication.basis !== "unresolved") ||
      constraints.some((item) => {
        const entry = object(item);
        return (
          entry.kind === "keep_polite_register" ||
          entry.kind === "keep_casual_register"
        );
      }) ||
      (grounding.target === "requested_message_tone" &&
        grounding.materiallyResolvesTarget);
    if (!tone) missing.add("requested_message_tone");
  }
  if (!Array.isArray(base.observed_facts) || base.observed_facts.length === 0) {
    missing.add("grounded_evidence");
  }
  return [...missing];
}

export function evaluateJpy980InputSufficiencyV2(input: {
  basePolicyInput: Omit<
    Jpy980InputSufficiencyPolicyInputV1,
    "clarificationAlreadyUsed"
  >;
  clarificationGrounding: ClarificationGroundingV1 | null;
  effectiveAssessmentAuthority: EffectiveAssessmentAuthorityV1;
}): Jpy980InputSufficiencyResultV2 {
  const baseline = evaluateJpy980InputSufficiencyV1({
    ...input.basePolicyInput,
    clarificationAlreadyUsed: input.clarificationGrounding !== null,
  });
  if (
    input.clarificationGrounding === null ||
    baseline.state === "safety_blocked"
  ) {
    return v2(baseline);
  }

  if (
    input.effectiveAssessmentAuthority.clarificationAuthorityRef !==
    input.clarificationGrounding.sourceIdentity
  ) invalid();
  const missing = missingAfterClarification(
    { ...input.basePolicyInput, clarificationAlreadyUsed: true },
    input.clarificationGrounding,
  );
  const budget = {
    maximumQuestionsTotal: 1 as const,
    questionsAlreadyUsed: 1 as const,
    questionsRemaining: 0 as const,
  };
  if (missing === null) {
    return {
      schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION,
      state: "not_full_product_candidate",
      reasonCodes: ["SUPPORTED_CONSULTATION_PATH_NOT_ESTABLISHED"],
      missingMaterialDimensions: [],
      clarificationBudget: budget,
      clarification: null,
    };
  }
  if (missing.length === 0) {
    return {
      schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION,
      state: "full_paid_ready_candidate",
      reasonCodes: ["FULL_PRODUCT_GROUNDING_BASIS_PRESENT"],
      missingMaterialDimensions: [],
      clarificationBudget: budget,
      clarification: null,
    };
  }
  return {
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V2_SCHEMA_VERSION,
    state: "not_full_product_candidate",
    reasonCodes: [
      "CLARIFICATION_BUDGET_EXHAUSTED",
      "MANDATORY_GROUNDING_BASIS_INSUFFICIENT",
    ],
    missingMaterialDimensions: missing,
    clarificationBudget: budget,
    clarification: null,
  };
}
