import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type {
  DecisionPolicyResultV2,
  RequestedTopic,
  SplitDecisionPlanV2,
} from "./types.ts";

export const GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE =
  "M2_GENERATED_DRAFT_AUTHORITY_VIOLATION";

export function validateGeneratedDraftAuthorityV1(input: {
  candidateEnvelope: CandidateEnvelopeV1;
  requestedTopics: readonly RequestedTopic[];
  decisionPolicy: Pick<DecisionPolicyResultV2, "message_draft_policy">;
  decisionPlan: Pick<
    SplitDecisionPlanV2,
    "recommended_message_draft" | "message_draft_edit_metadata"
  >;
}) {
  const generatedWithoutCandidate =
    input.decisionPlan.message_draft_edit_metadata?.source_status ===
    "generated_without_candidate";

  if (
    !input.candidateEnvelope.presence &&
    !input.requestedTopics.includes("draft_message") &&
    input.decisionPolicy.message_draft_policy !== "required_now" &&
    generatedWithoutCandidate
  ) {
    throw new M2RuntimeError(GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE);
  }
}
