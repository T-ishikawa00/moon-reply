import { isDeepStrictEqual } from "node:util";
import { clarificationSourceIdentityV1 } from "../runtime/clarification-evidence-v1.ts";
import { M2RuntimeError } from "../runtime/errors.ts";
import { hashJson } from "../runtime/hash.ts";
import type { PersistedAssessmentClarification } from "../runtime/types.ts";
import type { V19PreparationAnswer } from "./v19-preparation-contract.ts";

export function validateOriginalMessageAnswer(answer: unknown) {
  if (!answer || typeof answer !== "object" || Array.isArray(answer) ||
    Object.keys(answer).length !== 1 || !("original_message" in answer) ||
    typeof answer.original_message !== "string") {
    throw new M2RuntimeError("M2_CLARIFICATION_ANSWER_INVALID", 400);
  }
  const originalMessage = answer.original_message.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if (!originalMessage || [...originalMessage].length > 2000) throw new M2RuntimeError("M2_CLARIFICATION_ANSWER_INVALID", 400);
  const validatedAnswer = { original_message: originalMessage };
  return { validatedAnswer, answerFingerprint: hashJson(validatedAnswer), groundedNormalizedRepresentation: { original_message: originalMessage } };
}

export function buildOriginalMessageAnswer(row: PersistedAssessmentClarification): Extract<V19PreparationAnswer, { kind: "original_message" }> {
  const validated = validateOriginalMessageAnswer(row.answer);
  if (row.target !== "original_message" || row.ordinal !== 1 || row.answerStatus !== "answered" ||
    row.provenance !== "user_clarification" || row.sourceIdentity !== clarificationSourceIdentityV1(row.id) ||
    row.answerFingerprint !== validated.answerFingerprint ||
    !isDeepStrictEqual(row.groundedNormalizedRepresentation, validated.groundedNormalizedRepresentation)) {
    throw new M2RuntimeError("M2_CLARIFICATION_EVIDENCE_INVALID");
  }
  return { kind: "original_message", originalMessage: validated.validatedAnswer.original_message,
    clarificationId: row.id, answerFingerprint: validated.answerFingerprint };
}
