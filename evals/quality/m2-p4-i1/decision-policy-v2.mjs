const DECISIONS = Object.freeze([
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
]);

const NON_MEANINGFUL_MESSAGE_KINDS = new Set([
  "none",
  "unknown",
  "social_acknowledgement",
]);

const NON_BOUNDARY_KINDS = new Set(["none", "unknown"]);
const NON_PRACTICAL_KINDS = new Set(["none", "unknown"]);
const EXPLICIT_PERMISSION_BOUNDARIES = new Set([
  "no_contact",
  "blocked_or_restricted",
  "relationship_closed",
]);

function followUpExceptionFor(facts) {
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

function buildResult({
  selected,
  reasonCode,
  followUpException = "none",
  messageDraftPolicy,
  laterDraftMode = null,
  pauseReasonCode = null,
  resumePolicy = null,
}) {
  return {
    schema_version: "m2-p4-decision-policy-result-v1",
    policy_version: "decision-policy-v2.0.0",
    allowed_decisions: [selected],
    disallowed_decisions: DECISIONS
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

export function selectDecisionPolicy(facts) {
  const boundary = facts.boundary_state;
  const explicitBoundary =
    boundary.status === "explicit" &&
    !NON_BOUNDARY_KINDS.has(boundary.kind);

  if (explicitBoundary || boundary.repeated_unanswered_contact) {
    const repeated = boundary.repeated_unanswered_contact && !explicitBoundary;
    const pauseReasonCode = repeated
      ? "repeated_unanswered_contact"
      : boundary.kind;
    const resumePolicy =
      repeated || boundary.kind === "temporary_distance"
        ? "other_initiated_only"
        : EXPLICIT_PERMISSION_BOUNDARIES.has(boundary.kind)
          ? "explicit_permission_required"
          : "other_initiated_only";
    return buildResult({
      selected: "pause_additional_contact",
      reasonCode: explicitBoundary
        ? "explicit_boundary"
        : "repeated_unanswered_contact",
      messageDraftPolicy: "not_allowed",
      pauseReasonCode,
      resumePolicy,
    });
  }

  const message = facts.latest_direct_message;
  const unansweredMeaningfulIncoming =
    message.sender === "other_person" &&
    message.user_reply_state === "not_replied" &&
    message.sns_signal_only === false &&
    message.response_expectation === "reasonable" &&
    !NON_MEANINGFUL_MESSAGE_KINDS.has(message.kind);

  if (unansweredMeaningfulIncoming) {
    return buildResult({
      selected: "reply_now",
      reasonCode: "unanswered_meaningful_message",
      messageDraftPolicy: "required_now",
    });
  }

  const practicalReason = facts.practical_reason;
  const clearLowPressureReason =
    practicalReason.active &&
    !NON_PRACTICAL_KINDS.has(practicalReason.kind);

  if (clearLowPressureReason) {
    return buildResult({
      selected: "send_now",
      reasonCode: "clear_low_pressure_reason",
      followUpException: followUpExceptionFor(facts),
      messageDraftPolicy: "required_now",
    });
  }

  return buildResult({
    selected: "wait_and_reassess",
    reasonCode: "waiting_preferred",
    messageDraftPolicy: "later_only",
    laterDraftMode: facts.contact_state.proposed_message_present
      ? "defer_until_reassessment"
      : "candidate_can_be_prepared",
  });
}
