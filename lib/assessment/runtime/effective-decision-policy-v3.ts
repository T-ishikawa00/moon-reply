import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import {
  buildEffectiveDecisionPolicyV2,
  type EffectiveDecisionPolicyV2,
} from "./effective-decision-policy-v2.ts";
import { classifyGuidanceCommunicationPurposeV1 } from "./guidance-communication-purpose-v1.ts";
import type { Decision } from "./types.ts";

export const EFFECTIVE_DECISION_POLICY_V3_SCHEMA_VERSION =
  "m2-p4-effective-decision-policy-v3" as const;

export type EffectiveDecisionPolicyV3 = Omit<
  EffectiveDecisionPolicyV2,
  "schemaVersion"
> & {
  schemaVersion: typeof EFFECTIVE_DECISION_POLICY_V3_SCHEMA_VERSION;
};

export function buildEffectiveDecisionPolicyV3(input: {
  authority: EffectiveAssessmentAuthorityV1;
  candidateEnvelope: CandidateEnvelopeV1;
}): EffectiveDecisionPolicyV3 {
  const predecessor = buildEffectiveDecisionPolicyV2(input);
  const result: EffectiveDecisionPolicyV3 = {
    ...structuredClone(predecessor),
    schemaVersion: EFFECTIVE_DECISION_POLICY_V3_SCHEMA_VERSION,
  };
  if (predecessor.policy.allowed_decisions[0] !== "wait_and_reassess") {
    return result;
  }
  const purpose = classifyGuidanceCommunicationPurposeV1(input.authority);
  if (purpose?.kind !== "natural_incoming_reply") return result;
  const reason = "grounded_optional_incoming_acknowledgement";
  const otherDecisions: Decision[] = [
    "send_now", "wait_and_reassess", "pause_additional_contact",
  ];
  result.policy = {
    ...result.policy,
    allowed_decisions: ["reply_now"],
    disallowed_decisions: otherDecisions.map((decision) => ({
      decision,
      reason_codes: [reason],
    })),
    message_draft_policy: "required_now",
    later_draft_mode: null,
    follow_up_exception: "none",
    pause_reason_code: null,
    resume_policy: null,
    reason_codes: [reason],
  };
  result.consumedEffectivePaths = [
    ...new Set([...result.consumedEffectivePaths, ...purpose.consumedEffectivePaths]),
  ];
  return result;
}
