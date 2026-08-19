import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { ProductQualityDefectV2 } from "./quality-reassessment-v2.ts";
import type {
  DecisionPolicyResultV2,
  RequestedTopic,
  SplitDecisionPlanV2,
} from "./types.ts";

export const DRAFT_SOURCE_INTEGRITY_V2_VERSION =
  "m2-p4-draft-source-integrity-v2" as const;

function defect(
  jsonPath: string,
  normalizedRepairRequirementCode: string,
): ProductQualityDefectV2 {
  return {
    findingCode: "DRAFT_SOURCE_INTEGRITY",
    severity: "major",
    jsonPath,
    normalizedRepairRequirementCode,
    ownership: "plan",
  };
}

export function evaluateDraftSourceIntegrityV2(input: {
  candidateEnvelope: CandidateEnvelopeV1;
  optionalMessage: string | null;
  requestedTopics: readonly RequestedTopic[];
  decisionPolicy: Pick<DecisionPolicyResultV2, "message_draft_policy">;
  decisionPlan: SplitDecisionPlanV2;
}): ProductQualityDefectV2[] {
  const draft = input.decisionPlan.recommended_message_draft;
  const metadata = input.decisionPlan.message_draft_edit_metadata;
  if (metadata === null) return [];
  const defects: ProductQualityDefectV2[] = [];
  if (metadata.source_status === "generated_without_candidate") {
    if (input.candidateEnvelope.presence) {
      defects.push(
        defect(
          "decision_plan.message_draft_edit_metadata.source_status",
          "RESTORE_CANDIDATE_SOURCE_OWNERSHIP",
        ),
      );
    }
    if (metadata.preserved_meaning !== false) {
      defects.push(
        defect(
          "decision_plan.message_draft_edit_metadata.preserved_meaning",
          "RESTORE_TRUTHFUL_GENERATED_DRAFT_METADATA",
        ),
      );
    }
    if (
      !input.candidateEnvelope.presence &&
      !input.requestedTopics.includes("draft_message") &&
      input.decisionPolicy.message_draft_policy !== "required_now"
    ) {
      defects.push(
        defect(
          "decision_plan.recommended_message_draft",
          "REMOVE_UNAUTHORIZED_GENERATED_DRAFT",
        ),
      );
    }
  } else {
    if (!input.candidateEnvelope.presence || input.optionalMessage === null) {
      defects.push(
        defect(
          "decision_plan.message_draft_edit_metadata.source_status",
          "RESTORE_CANDIDATE_SOURCE_OWNERSHIP",
        ),
      );
    }
    if (
      (metadata.source_status === "candidate_preserved" ||
        metadata.source_status === "candidate_minimally_edited") &&
      metadata.preserved_meaning !== true
    ) {
      defects.push(
        defect(
          "decision_plan.message_draft_edit_metadata.preserved_meaning",
          "RESTORE_CANDIDATE_MEANING_OWNERSHIP",
        ),
      );
    }
    if (
      metadata.source_status === "candidate_preserved" &&
      input.optionalMessage !== null &&
      draft?.text !== input.optionalMessage
    ) {
      defects.push(
        defect(
          "decision_plan.recommended_message_draft.text",
          "RESTORE_BYTE_EXACT_CANDIDATE",
        ),
      );
    }
  }
  return defects.sort((left, right) => left.jsonPath.localeCompare(right.jsonPath));
}
