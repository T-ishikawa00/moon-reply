import { M2RuntimeError } from "./errors.ts";
import {
  DECISION_FACTS_RELATIONSHIP_STAGES,
  REQUESTED_TOPIC_VALUES,
} from "./types.ts";
import type {
  Decision,
  DecisionFactsV1,
  DecisionPlan,
  DecisionPolicyResultV2,
  JsonObject,
  StructuredIntakeV2,
} from "./types.ts";

const decisions: Decision[] = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];

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
const meaningfulMessageKinds = new Set([
  "question",
  "schedule_coordination",
  "apology",
  "thanks_or_followup",
  "practical_information",
  "invitation",
  "closure_or_boundary",
  "other",
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
const clearPracticalReasonKinds = new Set([
  "schedule_coordination",
  "factual_correction",
  "promised_information",
  "logistics",
  "thank_you",
  "initial_apology",
  "single_invitation",
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
  const actual = Object.keys(value);
  const expected = new Set(keys);
  return (
    actual.length === expected.size &&
    actual.every((key) => expected.has(key))
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

function isDecisionFactsV1(value: unknown): value is DecisionFactsV1 {
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
    value.schema_version !== "m2-p4-decision-facts-v1" ||
    !DECISION_FACTS_RELATIONSHIP_STAGES.some(
      (item) => item === value.relationship_stage,
    ) ||
    !Array.isArray(value.selected_requests) ||
    new Set(value.selected_requests).size !== value.selected_requests.length ||
    !value.selected_requests.every((request) =>
      REQUESTED_TOPIC_VALUES.some((item) => item === request),
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
    (boundary.status === "none" && boundary.kind !== "none")
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

  return (
    isObject(value.information_state) &&
    hasExactKeys(value.information_state, ["complete_for_decision"]) &&
    value.information_state.complete_for_decision === true
  );
}

export function requireDecisionFacts(
  structuredIntake: StructuredIntakeV2 | JsonObject,
): DecisionFactsV1 {
  const facts = structuredIntake.decision_facts;
  if (!isDecisionFactsV1(facts)) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  return facts;
}

function followUpExceptionFor(
  facts: DecisionFactsV1,
): DecisionPolicyResultV2["follow_up_exception"] {
  const reason = facts.practical_reason;
  if (!reason.active) return "none";
  if (reason.kind === "factual_correction") {
    return "material_factual_correction";
  }
  if (reason.kind === "promised_information") {
    return "promised_required_information";
  }
  if (reason.kind === "schedule_coordination") {
    if (reason.deadline === "same_day") return "same_day_schedule_change";
    if (reason.deadline === "next_day") return "next_day_schedule_change";
  }
  return "none";
}

function pauseReasonFor(
  facts: DecisionFactsV1,
): DecisionPolicyResultV2["pause_reason_code"] {
  if (facts.boundary_state.status === "explicit") {
    switch (facts.boundary_state.kind) {
      case "no_contact":
        return "explicit_no_contact";
      case "temporary_distance":
        return "temporary_distance_requested";
      case "blocked_or_restricted":
        return "blocked_or_restricted";
      case "relationship_closed":
        return "relationship_closed";
      default:
        return null;
    }
  }
  return facts.boundary_state.repeated_unanswered_contact
    ? "repeated_unanswered_contact"
    : null;
}

function buildResult({
  selected,
  reasonCode,
  followUpException = "none",
  messageDraftPolicy,
  laterDraftMode = null,
  pauseReasonCode = null,
  resumePolicy = null,
}: {
  selected: Decision;
  reasonCode: string;
  followUpException?: DecisionPolicyResultV2["follow_up_exception"];
  messageDraftPolicy: DecisionPolicyResultV2["message_draft_policy"];
  laterDraftMode?: DecisionPolicyResultV2["later_draft_mode"];
  pauseReasonCode?: DecisionPolicyResultV2["pause_reason_code"];
  resumePolicy?: DecisionPolicyResultV2["resume_policy"];
}): DecisionPolicyResultV2 {
  return {
    schema_version: "pipeline-schema-v2.0.0",
    policy_version: "decision-policy-v2.0.0",
    allowed_decisions: [selected],
    disallowed_decisions: decisions
      .filter((decision) => decision !== selected)
      .map((decision) => ({
        decision,
        reason_codes: [reasonCode],
      })),
    follow_up_exception: followUpException,
    message_draft_policy: messageDraftPolicy,
    later_draft_mode: laterDraftMode,
    pause_reason_code: pauseReasonCode,
    resume_policy: resumePolicy,
    reason_codes: [reasonCode],
  };
}

export function buildDecisionPolicyV2(
  decisionFacts: DecisionFactsV1,
): DecisionPolicyResultV2 {
  const boundary = decisionFacts.boundary_state;
  const explicitBoundary = boundary.status === "explicit";
  if (explicitBoundary || boundary.repeated_unanswered_contact) {
    const pauseReasonCode = pauseReasonFor(decisionFacts);
    const otherInitiated =
      pauseReasonCode === "temporary_distance_requested" ||
      pauseReasonCode === "repeated_unanswered_contact";
    return buildResult({
      selected: "pause_additional_contact",
      reasonCode: explicitBoundary
        ? "explicit_boundary"
        : "repeated_unanswered_contact",
      messageDraftPolicy: "not_allowed",
      pauseReasonCode,
      resumePolicy: otherInitiated
        ? "other_initiated_only"
        : "explicit_permission_required",
    });
  }

  const message = decisionFacts.latest_direct_message;
  const unansweredMeaningfulIncoming =
    message.sender === "other_person" &&
    message.user_reply_state === "not_replied" &&
    message.sns_signal_only === false &&
    message.response_expectation === "reasonable" &&
    meaningfulMessageKinds.has(message.kind);
  if (unansweredMeaningfulIncoming) {
    return buildResult({
      selected: "reply_now",
      reasonCode: "unanswered_meaningful_message",
      messageDraftPolicy: "required_now",
    });
  }

  const practical = decisionFacts.practical_reason;
  if (practical.active && clearPracticalReasonKinds.has(practical.kind)) {
    return buildResult({
      selected: "send_now",
      reasonCode: "clear_low_pressure_reason",
      followUpException: followUpExceptionFor(decisionFacts),
      messageDraftPolicy: "required_now",
    });
  }

  return buildResult({
    selected: "wait_and_reassess",
    reasonCode: "waiting_preferred",
    messageDraftPolicy: "later_only",
    laterDraftMode: decisionFacts.contact_state.proposed_message_present
      ? "defer_until_reassessment"
      : "candidate_can_be_prepared",
  });
}

export function validateDecisionPlanAgainstPolicyV2(
  plan: DecisionPlan,
  policy: DecisionPolicyResultV2,
) {
  if (plan.selected_decision !== policy.allowed_decisions[0]) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (policy.message_draft_policy === "not_allowed" && plan.message_draft) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "required_now" &&
    (!plan.message_draft ||
      plan.message_draft.policy !== "required_now" ||
      plan.message_draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "later_only" &&
    plan.message_draft !== null &&
    (plan.message_draft.policy !== "later_only" ||
      plan.message_draft.use_timing !== "later")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
}
