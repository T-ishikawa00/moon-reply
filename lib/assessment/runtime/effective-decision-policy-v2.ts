import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import {
  buildEffectiveDecisionPolicyV1,
  type EffectiveDecisionPolicyV1,
} from "./effective-decision-policy-v1.ts";
import type { Decision, DecisionPolicyResultV2, JsonObject } from "./types.ts";

export const EFFECTIVE_DECISION_POLICY_V2_SCHEMA_VERSION =
  "m2-p4-effective-decision-policy-v2" as const;

export type EffectiveDecisionPolicyV2 = Omit<
  EffectiveDecisionPolicyV1,
  "schemaVersion"
> & {
  schemaVersion: typeof EFFECTIVE_DECISION_POLICY_V2_SCHEMA_VERSION;
};

const decisions: Decision[] = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function contactIsUnrestricted(facts: Record<string, unknown>) {
  const constraint = object(facts.user_contact_constraint);
  return (
    constraint !== null &&
    constraint.kind === "none" &&
    constraint.status === "none"
  );
}

function withSelectedDecision(
  policy: DecisionPolicyResultV2,
  input: {
    selected: Decision;
    reasonCode: string;
    messageDraftPolicy: DecisionPolicyResultV2["message_draft_policy"];
    laterDraftMode: DecisionPolicyResultV2["later_draft_mode"];
  },
): DecisionPolicyResultV2 {
  return {
    ...structuredClone(policy),
    allowed_decisions: [input.selected],
    disallowed_decisions: decisions
      .filter((decision) => decision !== input.selected)
      .map((decision) => ({ decision, reason_codes: [input.reasonCode] })),
    follow_up_exception: "none",
    message_draft_policy: input.messageDraftPolicy,
    later_draft_mode: input.laterDraftMode,
    pause_reason_code: null,
    resume_policy: null,
    reason_codes: [input.reasonCode],
  };
}

function isWithinCadenceScheduleWaiting(
  facts: Record<string, unknown>,
) {
  const message = object(facts.latest_direct_message);
  const contact = object(facts.contact_state);
  const boundary = object(facts.boundary_state);
  const practical = object(facts.practical_reason);
  return (
    message?.sender === "user" &&
    message.sns_signal_only === false &&
    contact !== null &&
    typeof contact.unanswered_user_message_count === "number" &&
    contact.unanswered_user_message_count >= 1 &&
    contact.usual_cadence_relation === "within_usual" &&
    boundary?.kind === "none" &&
    boundary.status === "none" &&
    boundary.repeated_unanswered_contact === false &&
    practical?.kind === "schedule_coordination" &&
    practical.active === true &&
    practical.deadline !== "same_day" &&
    practical.deadline !== "next_day" &&
    contactIsUnrestricted(facts)
  );
}

function isSafeSameDayLowPressureThankYou(input: {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
}) {
  const facts = object(input.authority.effectiveDecisionContext.decisionFacts);
  const writing = object(input.authority.effectiveWritingContext.baseWritingSignals);
  const goal = object(writing?.user_goal_detail);
  const timing = object(writing?.channel_and_timing);
  const boundary = object(facts?.boundary_state);
  const selectedRequests = facts?.selected_requests;
  const candidate = input.candidateEnvelope;
  if (
    facts === null ||
    writing === null ||
    candidate.presence !== true ||
    candidate.analysis_status !== "available" ||
    candidate.safety_status !== "available" ||
    candidate.analysis === null
  ) {
    return false;
  }
  const intent = candidate.analysis.candidate_communicative_intent;
  return (
    Array.isArray(selectedRequests) &&
    selectedRequests.includes("draft_message") &&
    goal?.value === "respond_politely" &&
    goal.basis !== "requested_topics" &&
    goal.basis !== "unresolved" &&
    timing?.relative_timing === "same_day" &&
    timing.basis !== "unresolved" &&
    boundary?.kind === "none" &&
    boundary.status === "none" &&
    boundary.repeated_unanswered_contact === false &&
    contactIsUnrestricted(facts) &&
    intent.gratitude_strength === "high" &&
    intent.invitation_presence === false &&
    (intent.response_pressure === "none" || intent.response_pressure === "low") &&
    intent.practical_requirement.every((item) => item === "none")
  );
}

export function buildEffectiveDecisionPolicyV2(input: {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
}): EffectiveDecisionPolicyV2 {
  const predecessor = buildEffectiveDecisionPolicyV1(input);
  const facts = object(input.authority.effectiveDecisionContext.decisionFacts);
  let policy = predecessor.policy;
  const consumedEffectivePaths = [...predecessor.consumedEffectivePaths];

  if (facts !== null && isWithinCadenceScheduleWaiting(facts)) {
    policy = withSelectedDecision(policy, {
      selected: "wait_and_reassess",
      reasonCode: "within_usual_cadence_without_material_deadline",
      messageDraftPolicy: "later_only",
      laterDraftMode: input.candidateEnvelope.presence
        ? "defer_until_reassessment"
        : "candidate_can_be_prepared",
    });
  } else if (
    predecessor.policy.allowed_decisions[0] !== "reply_now" &&
    isSafeSameDayLowPressureThankYou(input)
  ) {
    policy = withSelectedDecision(policy, {
      selected: "send_now",
      reasonCode: "safe_same_day_low_pressure_thank_you",
      messageDraftPolicy: "required_now",
      laterDraftMode: null,
    });
    consumedEffectivePaths.push(
      "effectiveWritingContext.baseWritingSignals.user_goal_detail",
      "effectiveWritingContext.baseWritingSignals.channel_and_timing",
      "effectiveWritingContext.candidateEnvelope.analysis.candidate_communicative_intent",
    );
  }

  return {
    schemaVersion: EFFECTIVE_DECISION_POLICY_V2_SCHEMA_VERSION,
    policy,
    effectiveDecisionFacts: structuredClone(
      predecessor.effectiveDecisionFacts,
    ) as JsonObject,
    consumedEffectivePaths: [...new Set(consumedEffectivePaths)],
  };
}
