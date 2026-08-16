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

function resolvePath(root: unknown, path: string) {
  let current = root;
  for (const segment of path.split(".")) {
    if (
      typeof current !== "object" ||
      current === null ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      invalid("M2_CLARIFICATION_AUTHORITY_CONFLICT");
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

const overlayPathsByTarget = {
  material_relationship_or_communication_concern: [
    "effectiveDecisionContext.materialConcern",
    "effectiveEmotionalContext.materialConcern",
  ],
  latest_contact_timing: ["effectiveDecisionContext.latestContactTiming"],
  usual_reply_cadence: ["effectiveDecisionContext.usualReplyCadence"],
  central_fear_or_decision_concern: [
    "effectiveEmotionalContext.centralFearOrDecisionConcern",
  ],
  relationship_intent: [
    "effectiveDecisionContext.relationshipIntent",
    "effectiveWritingContext.relationshipIntent",
  ],
  requested_message_tone: ["effectiveWritingContext.requestedMessageTone"],
} as const;

const allOverlayPaths = Object.values(overlayPathsByTarget).flat();

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
    ) ||
    !equal(
      authority.effectiveEmotionalContext.baseUserEmotions,
      input.baseStructuredIntake.user_emotions,
    )
  ) {
    invalid("M2_CLARIFICATION_AUTHORITY_CONFLICT");
  }
  if (clarificationGrounding === null) {
    if (
      authority.clarificationAuthorityRef !== null ||
      authority.sourceMap.length !== 0 ||
      allOverlayPaths.some((path) => resolvePath(authority, path) !== null)
    ) {
      invalid();
    }
    return true;
  }
  const expectedPaths = overlayPathsByTarget[clarificationGrounding.target];
  const expectedPathSet = new Set<string>(expectedPaths);
  const actualPaths = authority.sourceMap.map((entry) => entry.effectivePath);
  if (
    authority.clarificationAuthorityRef !== clarificationGrounding.sourceIdentity ||
    authority.sourceMap.length !== expectedPaths.length ||
    new Set(actualPaths).size !== actualPaths.length ||
    expectedPaths.some((path) => !actualPaths.includes(path)) ||
    authority.sourceMap.some(
      (entry) =>
        entry.sourceLane !== "clarification" ||
        entry.sourceRef !== clarificationGrounding.sourceIdentity ||
        entry.clarificationTarget !== clarificationGrounding.target ||
        !expectedPathSet.has(entry.effectivePath) ||
        !equal(
          resolvePath(authority, entry.effectivePath),
          resolvePath(clarificationGrounding, entry.sourceValuePath),
        ),
    ) ||
    allOverlayPaths.some((path) =>
      expectedPathSet.has(path)
        ? !equal(resolvePath(authority, path), clarificationGrounding.normalizedValue)
        : resolvePath(authority, path) !== null,
    )
  ) {
    invalid("M2_CLARIFICATION_AUTHORITY_CONFLICT");
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
