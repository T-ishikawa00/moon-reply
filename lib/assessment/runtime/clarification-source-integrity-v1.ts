import { M2RuntimeError } from "./errors.ts";
import type { ClarificationEvidenceV1 } from "./clarification-evidence-v1.ts";
import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";

export const CLARIFICATION_SOURCE_INTEGRITY_V1_VERSION =
  "m2-p4-clarification-source-integrity-v1" as const;

function invalid(): never {
  throw new M2RuntimeError("M2_CLARIFICATION_SOURCE_INTEGRITY_FAILED");
}
function containsForbiddenSource(value: unknown): boolean {
  if (typeof value === "string") {
    return value === "input:current_situation" || value.startsWith("candidate:");
  }
  if (Array.isArray(value)) return value.some(containsForbiddenSource);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).some(containsForbiddenSource);
  }
  return false;
}

export function validateClarificationSourceIntegrityV1(input: {
  evidence: ClarificationEvidenceV1;
  grounding: ClarificationGroundingV1;
}) {
  const { evidence, grounding } = input;
  if (
    grounding.clarificationId !== evidence.clarificationId ||
    grounding.target !== evidence.target ||
    grounding.sourceIdentity !== evidence.sourceIdentity ||
    grounding.answerFingerprint !== evidence.answerFingerprint ||
    !grounding.sourceIdentity.startsWith("clarification:") ||
    !grounding.sourceIdentity.endsWith(":answer:1") ||
    containsForbiddenSource(grounding.normalizedValue)
  ) {
    invalid();
  }
  return true;
}
