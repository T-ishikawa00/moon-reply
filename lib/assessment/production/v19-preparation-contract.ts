import type { ClarificationEvidenceV1 } from "../runtime/clarification-evidence-v1.ts";
import type { V19L5Result } from "../runtime/v19-l5-application.ts";
import { validateClarificationAnswerV1 } from "../runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../runtime/errors.ts";
import { isDeepStrictEqual } from "node:util";
import type { JsonObject } from "../runtime/types.ts";

/** Verify the accepted canonical receipt with the original decoder and clock. */
export function validateV19PreparationClarificationEvidence(evidence: ClarificationEvidenceV1, resumeStartedAt: string): void {
  let decoderInput: unknown = structuredClone(evidence.answer);
  if (evidence.target === "usual_reply_cadence") {
    decoderInput = (evidence.answer as JsonObject)?.relation;
  } else if (["material_relationship_or_communication_concern", "relationship_intent", "requested_message_tone"].includes(evidence.target)) {
    const value = structuredClone(evidence.answer) as JsonObject;
    if (value?.detail === null) delete value.detail;
    decoderInput = value;
  }
  const validated = validateClarificationAnswerV1({ target: evidence.target, answer: decoderInput, resumeStartedAt });
  if (!Number.isFinite(Date.parse(resumeStartedAt)) || validated.answerFingerprint !== evidence.answerFingerprint ||
    validated.canonicalAnswer !== evidence.canonicalAnswer || !isDeepStrictEqual(validated.validatedAnswer, evidence.answer) ||
    validated.resolvesTarget !== evidence.resolvesTarget || !isDeepStrictEqual(validated.groundedNormalizedRepresentation, evidence.groundedNormalizedRepresentation)) {
    throw new M2RuntimeError("V19_L5_CLARIFICATION_STATE_INVALID");
  }
}

export type V19PreparationAnswer =
  | { kind: "original_message"; originalMessage: string; clarificationId: string; answerFingerprint: string }
  | { kind: "legacy"; evidence: ClarificationEvidenceV1 };

export type V19PreparationResume = {
  initialCheckpoint: V19L5Result;
  answer: V19PreparationAnswer;
  resumeStartedAt: string;
};

export const V19_PRODUCTION_PREPARATION_SCHEMA_VERSION = "v19-l5-production-preparation-v1" as const;

export type V19PreparationExecutionResult = {
  checkpoint: V19L5Result;
  disposition: "purchase_ready" | "needs_more_information" | "safety_blocked" | "not_full_product_candidate";
  clarification?: {
    opaqueClarificationId: string; questionCode: string; target: string; question: string;
    maximumQuestionsTotal: 1; questionsAlreadyUsed: 0; questionsRemaining: 1;
  };
};
