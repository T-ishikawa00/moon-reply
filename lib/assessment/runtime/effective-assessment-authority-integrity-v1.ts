import { M2RuntimeError } from "./errors.ts";
import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import type { EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import type { JsonObject } from "./types.ts";

export const EFFECTIVE_ASSESSMENT_AUTHORITY_INTEGRITY_V1_VERSION =
  "m2-p4-effective-assessment-authority-integrity-v1" as const;

function invalid(code = "M2_EFFECTIVE_ASSESSMENT_AUTHORITY_INVALID"): never {
  throw new M2RuntimeError(code);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, stable((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function equal(left: unknown, right: unknown) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

export function validateEffectiveAssessmentAuthorityIntegrityV1(input: {
  authority: EffectiveAssessmentAuthorityV1;
  baseStructuredIntake: JsonObject;
  candidateEnvelope: JsonObject;
  clarificationGrounding: ClarificationGroundingV1 | null;
}) {
  const { authority, clarificationGrounding } = input;
  if (
    authority.baseAuthorityRef !== "base_structured_intake" ||
    authority.candidateAuthorityRef !== "candidate_envelope" ||
    !equal(
      authority.effectiveDecisionContext.decisionFacts,
      input.baseStructuredIntake.decision_facts,
    ) ||
    !equal(
      authority.effectiveWritingContext.baseWritingSignals,
      input.baseStructuredIntake.base_writing_signals,
    ) ||
    !equal(
      authority.effectiveWritingContext.candidateEnvelope,
      input.candidateEnvelope,
    )
  ) {
    invalid("M2_CLARIFICATION_AUTHORITY_CONFLICT");
  }
  const clarificationEntries = authority.sourceMap.filter(
    (entry) => entry.sourceLane === "clarification",
  );
  if (clarificationGrounding === null) {
    if (authority.clarificationAuthorityRef !== null || clarificationEntries.length !== 0) {
      invalid();
    }
    return true;
  }
  if (
    authority.clarificationAuthorityRef !== clarificationGrounding.sourceIdentity ||
    clarificationEntries.length === 0 ||
    clarificationEntries.some(
      (entry) =>
        entry.sourceRef !== clarificationGrounding.sourceIdentity ||
        entry.clarificationTarget !== clarificationGrounding.target ||
        !entry.effectivePath.startsWith("effective"),
    ) ||
    new Set(clarificationEntries.map((entry) => entry.effectivePath)).size !==
      clarificationEntries.length
  ) {
    invalid();
  }
  return true;
}

export function requireReadyMakingClarificationDownstreamV1(input: {
  authority: EffectiveAssessmentAuthorityV1 | null;
  clarificationGrounding: ClarificationGroundingV1 | null;
  consumedEffectivePaths: readonly string[];
}) {
  if (!input.clarificationGrounding) return true;
  if (!input.authority) {
    invalid("M2_CLARIFICATION_DOWNSTREAM_AUTHORITY_MISSING");
  }
  const relevant = input.authority.sourceMap
    .filter((entry) => entry.sourceLane === "clarification")
    .map((entry) => entry.effectivePath);
  if (
    relevant.length === 0 ||
    !input.consumedEffectivePaths.some((path) => relevant.includes(path))
  ) {
    invalid("M2_CLARIFICATION_DOWNSTREAM_DISCARDED");
  }
  return true;
}
