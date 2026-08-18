import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type { RequestedTopic, SplitDecisionPlanV2 } from "./types.ts";

export const GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE =
  "M2_GENERATED_DRAFT_AUTHORITY_VIOLATION";

export function validateGeneratedDraftAuthorityV1(input: {
  candidateEnvelope: CandidateEnvelopeV1;
  requestedTopics: readonly RequestedTopic[];
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
    generatedWithoutCandidate
  ) {
    throw new M2RuntimeError(GENERATED_DRAFT_AUTHORITY_VIOLATION_CODE);
  }
}
