import Ajv2020 from "ajv/dist/2020.js";
import baseStructuredIntakeV2Schema from "./contracts/base-structured-intake-v2.schema.json" with {
  type: "json",
};
import { M2RuntimeError } from "./errors.ts";
import type { SafetyResult } from "./policy.ts";
import type { JsonObject } from "./types.ts";

export const JPY980_INPUT_SUFFICIENCY_POLICY_V1_VERSION =
  "m2-p4-jpy980-input-sufficiency-policy-v1" as const;

export const JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION =
  "m2-p4-jpy980-input-sufficiency-result-v1" as const;

export const JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE =
  "M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID" as const;

export const JPY980_INPUT_SUFFICIENCY_STATES_V1 = [
  "full_paid_ready_candidate",
  "needs_one_clarifying_answer",
  "not_full_product_candidate",
  "safety_blocked",
] as const;

export type Jpy980InputSufficiencyStateV1 =
  (typeof JPY980_INPUT_SUFFICIENCY_STATES_V1)[number];

export const JPY980_CLARIFICATION_TARGETS_V1 = [
  "material_relationship_or_communication_concern",
  "latest_contact_timing",
  "usual_reply_cadence",
  "central_fear_or_decision_concern",
  "relationship_intent",
  "requested_message_tone",
] as const;

export type Jpy980ClarificationTargetV1 =
  (typeof JPY980_CLARIFICATION_TARGETS_V1)[number];

export const JPY980_MATERIAL_DIMENSIONS_V1 = [
  ...JPY980_CLARIFICATION_TARGETS_V1,
  "grounded_evidence",
  "usable_action_context",
] as const;

export type Jpy980MaterialDimensionV1 =
  (typeof JPY980_MATERIAL_DIMENSIONS_V1)[number];

type ClarificationCatalogEntryV1 = {
  code: string;
  target: Jpy980ClarificationTargetV1;
  question: string;
};

export const JPY980_CLARIFICATION_CATALOG_V1 = {
  material_relationship_or_communication_concern: {
    code: "ask_material_relationship_or_communication_concern_v1",
    target: "material_relationship_or_communication_concern",
    question:
      "この返信でいちばん気になっているのは、距離感・好意の伝わり方・返信への圧のどれに近いですか？特に気になる点がなければ「特になし」で大丈夫です。",
  },
  latest_contact_timing: {
    code: "ask_latest_contact_timing_v1",
    target: "latest_contact_timing",
    question: "最後にあなたからメッセージを送ったのは、いつ頃ですか？",
  },
  usual_reply_cadence: {
    code: "ask_usual_reply_cadence_v1",
    target: "usual_reply_cadence",
    question:
      "その相手は普段、どれくらいの間隔で返信することが多いですか？",
  },
  central_fear_or_decision_concern: {
    code: "ask_central_fear_or_decision_concern_v1",
    target: "central_fear_or_decision_concern",
    question: "今回いちばん不安なのは、何が起きることですか？",
  },
  relationship_intent: {
    code: "ask_relationship_intent_v1",
    target: "relationship_intent",
    question: "このやり取りで、相手との距離をどうしたいですか？",
  },
  requested_message_tone: {
    code: "ask_requested_message_tone_v1",
    target: "requested_message_tone",
    question: "送るなら、どんな印象の文面にしたいですか？",
  },
} as const satisfies Record<
  Jpy980ClarificationTargetV1,
  ClarificationCatalogEntryV1
>;

export type Jpy980InputSufficiencyPolicyInputV1 = {
  aggregateSafety: Pick<SafetyResult, "classification">;
  baseStructuredIntake: JsonObject;
  decisionFacts: JsonObject;
  baseWritingSignals: JsonObject;
  clarificationAlreadyUsed: boolean;
};

export type Jpy980ClarificationBudgetV1 = {
  maximumQuestionsTotal: 1;
  questionsAlreadyUsed: 0 | 1;
  questionsRemaining: 0 | 1;
};

export type Jpy980ClarificationV1 = ClarificationCatalogEntryV1;

export type Jpy980InputSufficiencyResultV1 = {
  schemaVersion: typeof JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION;
  state: Jpy980InputSufficiencyStateV1;
  reasonCodes: string[];
  missingMaterialDimensions: Jpy980MaterialDimensionV1[];
  clarificationBudget: Jpy980ClarificationBudgetV1;
  clarification: Jpy980ClarificationV1 | null;
};

const safetyClassifications = new Set<SafetyResult["classification"]>([
  "normal_allowed",
  "needs_review",
  "rejected",
]);

const requestedTopics = new Set([
  "decide_send_or_wait",
  "message_impact",
  "draft_message",
  "relationship",
  "next_three_days",
  "organize_emotions",
]);

const baseUserGoals = new Set([
  "decide_send_or_wait",
  "reply_to_message",
  "prepare_message",
  "organize_relationship",
  "plan_next_three_days",
  "organize_emotions",
  "unknown",
]);

const messageSenders = new Set(["user", "other_person", "none", "unknown"]);
const messageKinds = new Set([
  "question",
  "schedule_coordination",
  "apology",
  "thanks_or_followup",
  "practical_information",
  "invitation",
  "closure_or_boundary",
  "social_acknowledgement",
  "other",
  "none",
  "unknown",
]);
const responseExpectations = new Set([
  "reasonable",
  "optional",
  "none",
  "unknown",
]);
const userReplyStates = new Set([
  "not_replied",
  "replied",
  "not_applicable",
  "unknown",
]);
const cadenceRelations = new Set([
  "within_usual",
  "beyond_usual",
  "unknown",
  "not_applicable",
]);
const decisionFieldPaths = new Set([
  "relationship_stage",
  "latest_direct_message.sender",
  "latest_direct_message.kind",
  "latest_direct_message.response_expectation",
  "latest_direct_message.user_reply_state",
  "latest_direct_message.sns_signal_only",
  "contact_state.unanswered_user_message_count",
  "contact_state.elapsed_since_latest_user_message_minutes",
  "contact_state.usual_cadence_relation",
  "boundary_state.kind",
  "boundary_state.status",
  "boundary_state.repeated_unanswered_contact",
  "practical_reason.kind",
  "practical_reason.active",
  "practical_reason.deadline",
]);
const goalValues = new Set([
  "respond_politely",
  "move_closer",
  "maintain_distance",
  "schedule_only",
  "apologize",
  "repair_conflict",
  "decline_without_false_hope",
  "end_contact",
  "express_affection",
  "clarify_relationship",
  "other",
  "unknown",
]);
const materialGoalValues = new Set([
  "move_closer",
  "maintain_distance",
  "apologize",
  "repair_conflict",
  "decline_without_false_hope",
  "end_contact",
  "express_affection",
  "clarify_relationship",
]);
const goalSignalBases = new Set([
  "current_situation_explicit",
  "current_situation_inferred",
  "relationship_chip",
  "requested_topics",
  "unresolved",
]);
const relationshipSignalBases = new Set([
  "current_situation_explicit",
  "current_situation_inferred",
  "relationship_chip",
  "unresolved",
]);
const currentSituationSignalBases = new Set([
  "current_situation_explicit",
  "current_situation_inferred",
  "unresolved",
]);
const registerValues = new Set([
  "polite",
  "neutral_polite",
  "casual",
  "mixed",
  "unknown",
]);
const constraintKinds = new Set([
  "no_emoji",
  "no_self_invitation",
  "no_late_night_send",
  "no_phone_call",
  "no_private_contact_at_work",
  "no_followup_message",
  "keep_polite_register",
  "keep_casual_register",
  "custom_explicit_constraint",
]);
const sourceRefs = new Set([
  "input:current_situation",
  "input:relationship",
  "input:requested_topics",
]);
const materialToValues = new Set([
  "eligibility",
  "decision",
  "message_draft",
  "safety",
]);

const validateBaseStructuredIntakeV2 = new Ajv2020({
  allErrors: false,
  strict: false,
}).compile(baseStructuredIntakeV2Schema);

type ValidatedAuthorityV1 = {
  baseStructuredIntake: Record<string, unknown>;
  decisionFacts: Record<string, unknown>;
  baseWritingSignals: Record<string, unknown>;
};

function invalid(): never {
  throw new M2RuntimeError(JPY980_INPUT_SUFFICIENCY_INVALID_SAFE_CODE);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyText(value: unknown, maximum: number) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximum
  );
}

function isIntegerOrNull(value: unknown, minimum: number, maximum?: number) {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      (maximum === undefined || value <= maximum))
  );
}

function isUniqueStringArray(value: unknown, allowed?: Set<string>) {
  return (
    Array.isArray(value) &&
    value.every(
      (item): item is string =>
        typeof item === "string" && (allowed === undefined || allowed.has(item)),
    ) &&
    new Set(value).size === value.length
  );
}

function isSourceRefArray(value: unknown) {
  return (
    isUniqueStringArray(value, sourceRefs) &&
    (value as string[]).length > 0
  );
}

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => structurallyEqual(item, right[index]))
    );
  }
  if (!isObject(left) || !isObject(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && structurallyEqual(left[key], right[key]),
    )
  );
}

function validateObservedFacts(value: unknown) {
  if (!Array.isArray(value)) invalid();
  for (const fact of value) {
    if (
      !isObject(fact) ||
      typeof fact.fact_id !== "string" ||
      !/^F[0-9]{3}$/u.test(fact.fact_id) ||
      !isNonEmptyText(fact.statement, 600) ||
      !isSourceRefArray(fact.source_refs) ||
      !["explicit", "normalized", "unknown"].some(
        (support) => support === fact.support,
      )
    ) {
      invalid();
    }
  }
}

function validateUserEmotions(value: unknown) {
  if (!Array.isArray(value)) invalid();
  for (const emotion of value) {
    if (
      !isObject(emotion) ||
      typeof emotion.item_id !== "string" ||
      !/^M[0-9]{3}$/u.test(emotion.item_id) ||
      !isNonEmptyText(emotion.statement, 600) ||
      !isSourceRefArray(emotion.source_refs)
    ) {
      invalid();
    }
  }
}

function validateMaterialUnknowns(value: unknown) {
  if (!Array.isArray(value)) invalid();
  for (const materialUnknown of value) {
    if (
      !isObject(materialUnknown) ||
      typeof materialUnknown.unknown_code !== "string" ||
      !/^[a-z][a-z0-9_]+$/u.test(materialUnknown.unknown_code) ||
      !isNonEmptyText(materialUnknown.description, 600) ||
      !isUniqueStringArray(materialUnknown.material_to, materialToValues) ||
      (materialUnknown.material_to as string[]).length === 0
    ) {
      invalid();
    }
  }
}

function validateDecisionFacts(value: unknown): Record<string, unknown> {
  if (
    !isObject(value) ||
    value.schema_version !== "m2-p4-base-decision-facts-v2" ||
    !isUniqueStringArray(value.selected_requests, requestedTopics)
  ) {
    invalid();
  }
  const message = value.latest_direct_message;
  const contact = value.contact_state;
  const boundary = value.boundary_state;
  const practical = value.practical_reason;
  const contactConstraint = value.user_contact_constraint;
  const information = value.information_state;
  if (
    !isObject(message) ||
    !messageSenders.has(String(message.sender)) ||
    !messageKinds.has(String(message.kind)) ||
    !responseExpectations.has(String(message.response_expectation)) ||
    !userReplyStates.has(String(message.user_reply_state)) ||
    typeof message.sns_signal_only !== "boolean" ||
    !isObject(contact) ||
    !isIntegerOrNull(contact.unanswered_user_message_count, 0, 20) ||
    !isIntegerOrNull(contact.elapsed_since_latest_user_message_minutes, 0) ||
    !cadenceRelations.has(String(contact.usual_cadence_relation)) ||
    !isObject(boundary) ||
    !isObject(practical) ||
    !isObject(contactConstraint) ||
    !isObject(information) ||
    information.assessment_mode !== "best_effort" ||
    information.can_proceed_without_followup !== true ||
    typeof information.used_context_inference !== "boolean" ||
    !isUniqueStringArray(information.unresolved_fields, decisionFieldPaths)
  ) {
    invalid();
  }
  return value;
}

function validateWritingSignals(value: unknown): Record<string, unknown> {
  if (!isObject(value) || value.schema_version !== "m2-p4-base-writing-signals-v1") {
    invalid();
  }
  const dimensions = value.relationship_dimensions;
  const observedRegister = isObject(dimensions)
    ? dimensions.observed_register
    : null;
  const goal = value.user_goal_detail;
  const communication = value.communication_pattern;
  if (
    !isObject(observedRegister) ||
    !registerValues.has(String(observedRegister.value)) ||
    !relationshipSignalBases.has(String(observedRegister.basis)) ||
    !isObject(goal) ||
    !goalValues.has(String(goal.value)) ||
    !goalSignalBases.has(String(goal.basis)) ||
    !isObject(communication) ||
    !registerValues.has(String(communication.usual_register)) ||
    !currentSituationSignalBases.has(String(communication.basis)) ||
    !Array.isArray(value.explicit_user_constraints)
  ) {
    invalid();
  }
  for (const constraint of value.explicit_user_constraints) {
    if (
      !isObject(constraint) ||
      !constraintKinds.has(String(constraint.kind)) ||
      !(
        constraint.bounded_summary === null ||
        isNonEmptyText(constraint.bounded_summary, 240)
      )
    ) {
      invalid();
    }
  }
  return value;
}

function validateAuthority(input: Record<string, unknown>): ValidatedAuthorityV1 {
  const baseStructuredIntake = input.baseStructuredIntake;
  if (
    !isObject(baseStructuredIntake) ||
    !validateBaseStructuredIntakeV2(baseStructuredIntake) ||
    !baseUserGoals.has(String(baseStructuredIntake.user_goal))
  ) {
    invalid();
  }
  validateObservedFacts(baseStructuredIntake.observed_facts);
  validateUserEmotions(baseStructuredIntake.user_emotions);
  validateMaterialUnknowns(baseStructuredIntake.material_unknowns);
  const decisionFacts = validateDecisionFacts(input.decisionFacts);
  const baseWritingSignals = validateWritingSignals(input.baseWritingSignals);
  if (
    !structurallyEqual(baseStructuredIntake.decision_facts, decisionFacts) ||
    !structurallyEqual(
      baseStructuredIntake.base_writing_signals,
      baseWritingSignals,
    )
  ) {
    invalid();
  }
  return { baseStructuredIntake, decisionFacts, baseWritingSignals };
}

function clarificationBudget(
  clarificationAlreadyUsed: boolean,
): Jpy980ClarificationBudgetV1 {
  return clarificationAlreadyUsed
    ? {
        maximumQuestionsTotal: 1,
        questionsAlreadyUsed: 1,
        questionsRemaining: 0,
      }
    : {
        maximumQuestionsTotal: 1,
        questionsAlreadyUsed: 0,
        questionsRemaining: 1,
      };
}

function result(
  state: Jpy980InputSufficiencyStateV1,
  reasonCodes: string[],
  missingMaterialDimensions: Jpy980MaterialDimensionV1[],
  budget: Jpy980ClarificationBudgetV1,
  clarification: Jpy980ClarificationV1 | null,
): Jpy980InputSufficiencyResultV1 {
  if (state !== "needs_one_clarifying_answer" && clarification !== null) {
    invalid();
  }
  return {
    schemaVersion: JPY980_INPUT_SUFFICIENCY_RESULT_V1_SCHEMA_VERSION,
    state,
    reasonCodes: [...reasonCodes],
    missingMaterialDimensions: [...missingMaterialDimensions],
    clarificationBudget: { ...budget },
    clarification: clarification === null ? null : { ...clarification },
  };
}

function resolvedSignal(value: unknown, basis: unknown) {
  return value !== "unknown" && basis !== "unresolved";
}

function hasGroundedRelationshipIntent(writingSignals: Record<string, unknown>) {
  const goal = writingSignals.user_goal_detail as Record<string, unknown>;
  return resolvedSignal(goal.value, goal.basis);
}

function hasMaterialIntent(writingSignals: Record<string, unknown>) {
  const goal = writingSignals.user_goal_detail as Record<string, unknown>;
  return resolvedSignal(goal.value, goal.basis) && materialGoalValues.has(String(goal.value));
}

function hasUsableToneContext(writingSignals: Record<string, unknown>) {
  const dimensions = writingSignals.relationship_dimensions as Record<
    string,
    unknown
  >;
  const register = dimensions.observed_register as Record<string, unknown>;
  const communication = writingSignals.communication_pattern as Record<
    string,
    unknown
  >;
  const constraints = writingSignals.explicit_user_constraints as Array<
    Record<string, unknown>
  >;
  return (
    resolvedSignal(register.value, register.basis) ||
    resolvedSignal(communication.usual_register, communication.basis) ||
    constraints.some(
      (constraint) =>
        constraint.kind === "keep_polite_register" ||
        constraint.kind === "keep_casual_register",
    )
  );
}

function hasMaterialConcern(authority: ValidatedAuthorityV1) {
  const emotions = authority.baseStructuredIntake.user_emotions as unknown[];
  const boundary = authority.decisionFacts.boundary_state as Record<
    string,
    unknown
  >;
  return (
    emotions.length > 0 ||
    hasMaterialIntent(authority.baseWritingSignals) ||
    boundary.status === "explicit" ||
    boundary.repeated_unanswered_contact === true
  );
}

function clarificationFor(
  dimension: Jpy980MaterialDimensionV1,
): Jpy980ClarificationV1 | null {
  if (!JPY980_CLARIFICATION_TARGETS_V1.some((target) => target === dimension)) {
    return null;
  }
  return {
    ...JPY980_CLARIFICATION_CATALOG_V1[
      dimension as Jpy980ClarificationTargetV1
    ],
  };
}

function missingDimensions(
  authority: ValidatedAuthorityV1,
): Jpy980MaterialDimensionV1[] | null {
  const facts = authority.decisionFacts;
  const requests = new Set(facts.selected_requests as string[]);
  const waitPath =
    requests.has("decide_send_or_wait") || requests.has("next_three_days");
  const draftPath =
    requests.has("draft_message") || requests.has("message_impact");
  if (!waitPath && !draftPath) return null;

  if (!hasMaterialConcern(authority)) {
    return ["material_relationship_or_communication_concern"];
  }

  const missing = new Set<Jpy980MaterialDimensionV1>();
  const contact = facts.contact_state as Record<string, unknown>;
  const message = facts.latest_direct_message as Record<string, unknown>;
  const information = facts.information_state as Record<string, unknown>;
  const unresolved = new Set(information.unresolved_fields as string[]);
  if (waitPath) {
    if (
      contact.elapsed_since_latest_user_message_minutes === null ||
      unresolved.has("contact_state.elapsed_since_latest_user_message_minutes")
    ) {
      missing.add("latest_contact_timing");
    }
    if (
      contact.usual_cadence_relation === "unknown" ||
      unresolved.has("contact_state.usual_cadence_relation")
    ) {
      missing.add("usual_reply_cadence");
    }
    if (
      (authority.baseStructuredIntake.user_emotions as unknown[]).length === 0
    ) {
      missing.add("central_fear_or_decision_concern");
    }
    if (
      message.sender === "unknown" ||
      message.sender === "none" ||
      message.kind === "unknown" ||
      message.kind === "none" ||
      message.user_reply_state === "unknown"
    ) {
      missing.add("usable_action_context");
    }
  }
  if (draftPath) {
    if (!hasGroundedRelationshipIntent(authority.baseWritingSignals)) {
      missing.add("relationship_intent");
    }
    if (!hasUsableToneContext(authority.baseWritingSignals)) {
      missing.add("requested_message_tone");
    }
  }
  if (
    (authority.baseStructuredIntake.observed_facts as unknown[]).length === 0
  ) {
    missing.add("grounded_evidence");
  }
  return JPY980_MATERIAL_DIMENSIONS_V1.filter((dimension) =>
    missing.has(dimension),
  );
}

export function evaluateJpy980InputSufficiencyV1(
  input: unknown,
): Jpy980InputSufficiencyResultV1 {
  if (
    !isObject(input) ||
    typeof input.clarificationAlreadyUsed !== "boolean" ||
    !isObject(input.aggregateSafety) ||
    !safetyClassifications.has(
      input.aggregateSafety.classification as SafetyResult["classification"],
    )
  ) {
    invalid();
  }
  const budget = clarificationBudget(input.clarificationAlreadyUsed);
  if (input.aggregateSafety.classification !== "normal_allowed") {
    return result(
      "safety_blocked",
      ["SAFETY_CLASSIFICATION_NOT_NORMAL"],
      [],
      budget,
      null,
    );
  }

  const authority = validateAuthority(input);
  const missing = missingDimensions(authority);
  if (missing === null) {
    return result(
      "not_full_product_candidate",
      ["SUPPORTED_CONSULTATION_PATH_NOT_ESTABLISHED"],
      [],
      budget,
      null,
    );
  }
  if (missing.length === 0) {
    return result(
      "full_paid_ready_candidate",
      ["FULL_PRODUCT_GROUNDING_BASIS_PRESENT"],
      [],
      budget,
      null,
    );
  }
  if (input.clarificationAlreadyUsed) {
    return result(
      "not_full_product_candidate",
      [
        "CLARIFICATION_BUDGET_EXHAUSTED",
        "MANDATORY_GROUNDING_BASIS_INSUFFICIENT",
      ],
      missing,
      budget,
      null,
    );
  }
  if (missing.length > 1) {
    return result(
      "not_full_product_candidate",
      [
        "MULTIPLE_INDEPENDENT_MATERIAL_DIMENSIONS_MISSING",
        "ONE_ANSWER_CANNOT_ESTABLISH_OR_REJECT_ELIGIBILITY",
      ],
      missing,
      budget,
      null,
    );
  }
  const clarification = clarificationFor(missing[0]);
  if (clarification === null) {
    return result(
      "not_full_product_candidate",
      [
        "MATERIAL_DIMENSION_NOT_CLARIFIABLE_BY_BOUNDED_CATALOG",
        "ONE_ANSWER_CANNOT_ESTABLISH_OR_REJECT_ELIGIBILITY",
      ],
      missing,
      budget,
      null,
    );
  }
  return result(
    "needs_one_clarifying_answer",
    [
      "ONE_MATERIAL_DIMENSION_MISSING",
      "ONE_ANSWER_CAN_ESTABLISH_OR_REJECT_ELIGIBILITY",
      "CLARIFICATION_BUDGET_AVAILABLE",
    ],
    missing,
    budget,
    clarification,
  );
}
