import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";

export const GUIDANCE_COMMUNICATION_PURPOSE_V1_VERSION =
  "guidance-communication-purpose-v1" as const;

export type GuidanceCommunicationPurposeV1 = {
  kind: "initial_thank_you" | "single_invitation" | "natural_incoming_reply";
  consumedEffectivePaths: string[];
};

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

/** Consumes already validated Base authority; never extracts facts from prose or Candidate. */
export function classifyGuidanceCommunicationPurposeV1(
  authority: EffectiveAssessmentAuthorityV1,
): GuidanceCommunicationPurposeV1 | null {
  const facts = object(authority.effectiveDecisionContext.decisionFacts);
  const writing = object(authority.effectiveWritingContext.baseWritingSignals);
  const boundary = object(facts?.boundary_state);
  const contactConstraint = object(facts?.user_contact_constraint);
  const contact = object(facts?.contact_state);
  const message = object(facts?.latest_direct_message);
  const practical = object(facts?.practical_reason);
  const goal = object(writing?.user_goal_detail);
  const incoming = object(writing?.incoming_message_profile);
  if (
    facts === null || writing === null || contact === null || message === null ||
    practical === null || goal === null || incoming === null ||
    boundary?.kind !== "none" || boundary.status !== "none" ||
    boundary.repeated_unanswered_contact !== false ||
    contactConstraint?.kind !== "none" || contactConstraint.status !== "none" ||
    goal.basis !== "current_situation_explicit"
  ) {
    return null;
  }
  const unansweredCount = contact.unanswered_user_message_count;
  const constraints = Array.isArray(writing.explicit_user_constraints)
    ? writing.explicit_user_constraints.flatMap((item) => {
        const constraint = object(item);
        return typeof constraint?.kind === "string" ? [constraint.kind] : [];
      })
    : [];
  if (
    (typeof unansweredCount === "number" && unansweredCount > 0) ||
    strings(incoming.dialogue_acts).some((act) =>
      ["boundary", "decline", "hold"].includes(act),
    ) ||
    incoming.closure_signal === "explicit" ||
    constraints.includes("no_followup_message") ||
    constraints.includes("no_private_contact_at_work")
  ) {
    return null;
  }
  const consumedEffectivePaths = [
    "effectiveDecisionContext.decisionFacts",
    "effectiveWritingContext.baseWritingSignals.user_goal_detail",
    "effectiveWritingContext.baseWritingSignals.incoming_message_profile",
  ];
  if (
    message.sender === "other_person" && message.sns_signal_only === false &&
    message.user_reply_state === "not_replied" && incoming.present === true &&
    message.response_expectation === "optional" &&
    incoming.response_expectation === "optional" &&
    ["social_acknowledgement", "thanks_or_followup"].includes(String(message.kind)) &&
    strings(incoming.dialogue_acts).length > 0 &&
    strings(incoming.dialogue_acts).every((act) =>
      ["thanks", "answer", "conversation_closure", "other"].includes(act),
    ) &&
    goal.value === "respond_politely"
  ) {
    return { kind: "natural_incoming_reply", consumedEffectivePaths };
  }
  // No confirmed direct message, or an already answered incoming message, can
  // precede a new interpersonal purpose. An unanswered outbound cannot.
  const noPendingExchange =
    (message.sender === "none" && message.kind === "none" && incoming.present === false) ||
    (message.sender === "other_person" && message.user_reply_state === "replied");
  if (
    !noPendingExchange || practical.active !== true
  ) {
    return null;
  }
  if (practical.kind === "thank_you" && goal.value === "respond_politely") {
    return { kind: "initial_thank_you", consumedEffectivePaths };
  }
  if (
    practical.kind === "single_invitation" && goal.value === "move_closer" &&
    !constraints.includes("no_self_invitation")
  ) {
    return { kind: "single_invitation", consumedEffectivePaths };
  }
  return null;
}
