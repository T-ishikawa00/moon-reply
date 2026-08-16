import { M2RuntimeError } from "./errors.ts";
import type { SafetyResult } from "./policy.ts";
import type { JsonObject, Jpy980ClarificationTarget } from "./types.ts";
import type { ClarificationEvidenceV1 } from "./clarification-evidence-v1.ts";

export const CLARIFICATION_GROUNDING_V1_SCHEMA_VERSION =
  "m2-p4-clarification-grounding-v1" as const;

export type ClarificationGroundingV1 = {
  schemaVersion: typeof CLARIFICATION_GROUNDING_V1_SCHEMA_VERSION;
  clarificationId: string;
  target: Jpy980ClarificationTarget;
  sourceIdentity: string;
  answerFingerprint: string;
  normalizedValue: JsonObject;
  materiallyResolvesTarget: boolean;
  clarificationSafety: SafetyResult;
};

function invalid(code = "M2_CLARIFICATION_GROUNDING_INVALID"): never {
  throw new M2RuntimeError(code);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safetyResult(value: unknown): SafetyResult {
  if (!isObject(value)) invalid();
  const classification = value.classification;
  if (
    classification !== "normal_allowed" &&
    classification !== "needs_review" &&
    classification !== "rejected"
  ) {
    invalid();
  }
  if (
    !Array.isArray(value.reason_codes) ||
    value.reason_codes.some((code) => typeof code !== "string") ||
    typeof value.response_mode !== "string"
  ) {
    invalid();
  }
  return {
    classification,
    reason_codes: [...value.reason_codes] as string[],
    response_mode: value.response_mode,
  } as SafetyResult;
}

export function groundClarificationEvidenceV1(input: {
  evidence: ClarificationEvidenceV1;
  providerOutput: JsonObject;
}): ClarificationGroundingV1 {
  const output = input.providerOutput;
  if (
    output.schema_version !== "pipeline-schema-clarification-grounding-v1.0.0" ||
    output.target !== input.evidence.target ||
    output.source_identity !== input.evidence.sourceIdentity ||
    output.answer_fingerprint !== input.evidence.answerFingerprint ||
    typeof output.materially_resolves_target !== "boolean" ||
    output.materially_resolves_target !== input.evidence.resolvesTarget ||
    !isObject(output.clarification_safety_result)
  ) {
    invalid();
  }

  return {
    schemaVersion: CLARIFICATION_GROUNDING_V1_SCHEMA_VERSION,
    clarificationId: input.evidence.clarificationId,
    target: input.evidence.target,
    sourceIdentity: input.evidence.sourceIdentity,
    answerFingerprint: input.evidence.answerFingerprint,
    normalizedValue: structuredClone(
      input.evidence.groundedNormalizedRepresentation,
    ),
    materiallyResolvesTarget: input.evidence.resolvesTarget,
    clarificationSafety: safetyResult(output.clarification_safety_result),
  };
}
