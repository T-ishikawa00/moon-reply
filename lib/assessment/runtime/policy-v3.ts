import {
  CONTEXTUAL_DECISION_FIELD_PATHS,
  isContextualDecisionFieldPath,
} from "./contextual-inference-v3.ts";
import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import { M2RuntimeError } from "./errors.ts";
import {
  buildDecisionPolicyV2,
  validateDecisionPlanAgainstPolicyV2,
} from "./policy-v2.ts";
import {
  DECISION_FACTS_RELATIONSHIP_STAGES,
  REQUESTED_TOPIC_VALUES,
} from "./types.ts";
import type {
  DecisionFactsV1,
  DecisionPlan,
  DecisionPolicyResultV2,
  JsonObject,
} from "./types.ts";

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
const boundaryKinds = new Set([
  "none",
  "no_contact",
  "temporary_distance",
  "blocked_or_restricted",
  "relationship_closed",
  "unknown",
]);
const boundaryStatuses = new Set(["none", "explicit", "unknown"]);
const practicalReasonKinds = new Set([
  "none",
  "schedule_coordination",
  "factual_correction",
  "promised_information",
  "logistics",
  "thank_you",
  "initial_apology",
  "single_invitation",
  "unknown",
]);
const practicalDeadlines = new Set([
  "none",
  "same_day",
  "next_day",
  "later",
  "unknown",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  const expected = new Set(keys);
  return (
    Object.keys(value).length === expected.size &&
    Object.keys(value).every((key) => expected.has(key))
  );
}

function isIntegerOrNull(
  value: unknown,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
) {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function isDecisionFactsV2(value: unknown): value is DecisionFactsV2 {
  if (
    !isObject(value) ||
    !hasExactKeys(value, [
      "schema_version",
      "relationship_stage",
      "selected_requests",
      "latest_direct_message",
      "contact_state",
      "boundary_state",
      "practical_reason",
      "information_state",
    ]) ||
    value.schema_version !== "m2-p4-decision-facts-v2" ||
    !DECISION_FACTS_RELATIONSHIP_STAGES.some(
      (stage) => stage === value.relationship_stage,
    ) ||
    !Array.isArray(value.selected_requests) ||
    new Set(value.selected_requests).size !== value.selected_requests.length ||
    !value.selected_requests.every((request) =>
      REQUESTED_TOPIC_VALUES.some((topic) => topic === request),
    )
  ) {
    return false;
  }

  const message = value.latest_direct_message;
  if (
    !isObject(message) ||
    !hasExactKeys(message, [
      "sender",
      "kind",
      "response_expectation",
      "user_reply_state",
      "sns_signal_only",
    ]) ||
    !messageSenders.has(String(message.sender)) ||
    !messageKinds.has(String(message.kind)) ||
    !responseExpectations.has(String(message.response_expectation)) ||
    !userReplyStates.has(String(message.user_reply_state)) ||
    typeof message.sns_signal_only !== "boolean"
  ) {
    return false;
  }

  const contact = value.contact_state;
  if (
    !isObject(contact) ||
    !hasExactKeys(contact, [
      "unanswered_user_message_count",
      "elapsed_since_latest_user_message_minutes",
      "usual_cadence_relation",
      "proposed_message_present",
    ]) ||
    !isIntegerOrNull(contact.unanswered_user_message_count, 0, 20) ||
    !isIntegerOrNull(contact.elapsed_since_latest_user_message_minutes, 0) ||
    !cadenceRelations.has(String(contact.usual_cadence_relation)) ||
    typeof contact.proposed_message_present !== "boolean"
  ) {
    return false;
  }

  const boundary = value.boundary_state;
  if (
    !isObject(boundary) ||
    !hasExactKeys(boundary, [
      "kind",
      "status",
      "repeated_unanswered_contact",
    ]) ||
    !boundaryKinds.has(String(boundary.kind)) ||
    !boundaryStatuses.has(String(boundary.status)) ||
    typeof boundary.repeated_unanswered_contact !== "boolean" ||
    (boundary.status === "explicit" &&
      (boundary.kind === "none" || boundary.kind === "unknown")) ||
    (boundary.status === "none" && boundary.kind !== "none") ||
    (boundary.status === "unknown" && boundary.kind !== "unknown")
  ) {
    return false;
  }

  const practical = value.practical_reason;
  if (
    !isObject(practical) ||
    !hasExactKeys(practical, ["kind", "active", "deadline"]) ||
    !practicalReasonKinds.has(String(practical.kind)) ||
    typeof practical.active !== "boolean" ||
    !practicalDeadlines.has(String(practical.deadline)) ||
    (practical.active
      ? practical.kind === "none" || practical.kind === "unknown"
      : practical.kind !== "none" || practical.deadline !== "none")
  ) {
    return false;
  }

  const information = value.information_state;
  return (
    isObject(information) &&
    hasExactKeys(information, [
      "assessment_mode",
      "can_proceed_without_followup",
      "used_context_inference",
      "unresolved_fields",
    ]) &&
    information.assessment_mode === "best_effort" &&
    information.can_proceed_without_followup === true &&
    typeof information.used_context_inference === "boolean" &&
    Array.isArray(information.unresolved_fields) &&
    new Set(information.unresolved_fields).size ===
      information.unresolved_fields.length &&
    information.unresolved_fields.every(isContextualDecisionFieldPath)
  );
}

export function requireContextualDecisionFactsV3(
  structuredIntake: JsonObject,
): DecisionFactsV2 {
  const facts = structuredIntake.decision_facts;
  if (!isDecisionFactsV2(facts)) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  return facts;
}

export function projectDecisionFactsV2ToV1(
  facts: DecisionFactsV2,
): DecisionFactsV1 {
  return {
    schema_version: "m2-p4-decision-facts-v1",
    relationship_stage: facts.relationship_stage,
    selected_requests: [...facts.selected_requests],
    latest_direct_message: { ...facts.latest_direct_message },
    contact_state: { ...facts.contact_state },
    boundary_state: { ...facts.boundary_state },
    practical_reason: { ...facts.practical_reason },
    information_state: { complete_for_decision: true },
  };
}

export function buildContextualDecisionPolicyV3(
  decisionFacts: DecisionFactsV2,
): DecisionPolicyResultV2 {
  return buildDecisionPolicyV2(projectDecisionFactsV2ToV1(decisionFacts));
}

export function validateContextualDecisionPlanV3(
  plan: DecisionPlan,
  policy: DecisionPolicyResultV2,
) {
  validateDecisionPlanAgainstPolicyV2(plan, policy);
}

export const contextualDecisionFieldCount =
  CONTEXTUAL_DECISION_FIELD_PATHS.length;
