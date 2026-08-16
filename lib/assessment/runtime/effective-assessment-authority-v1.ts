import { M2RuntimeError } from "./errors.ts";
import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import type { JsonObject, JsonValue, Jpy980ClarificationTarget } from "./types.ts";

export const EFFECTIVE_ASSESSMENT_AUTHORITY_V1_SCHEMA_VERSION =
  "m2-p4-effective-assessment-authority-v1" as const;

export type EffectiveSourceMapEntryV1 = {
  effectivePath: string;
  sourceLane: "base" | "candidate" | "clarification";
  sourceRef: string;
  sourceValuePath: string;
  clarificationTarget: Jpy980ClarificationTarget | null;
};

export type EffectiveAssessmentAuthorityV1 = {
  schemaVersion: typeof EFFECTIVE_ASSESSMENT_AUTHORITY_V1_SCHEMA_VERSION;
  baseAuthorityRef: "base_structured_intake";
  candidateAuthorityRef: "candidate_envelope";
  clarificationAuthorityRef: string | null;
  effectiveDecisionContext: JsonObject;
  effectiveWritingContext: JsonObject;
  effectiveEmotionalContext: JsonObject;
  sourceMap: EffectiveSourceMapEntryV1[];
};

function invalid(): never {
  throw new M2RuntimeError("M2_CLARIFICATION_AUTHORITY_CONFLICT");
}
function asObject(value: unknown): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid();
  return structuredClone(value as JsonObject);
}

function sourceEntry(
  effectivePath: string,
  sourceValuePath: string,
  grounding: ClarificationGroundingV1,
): EffectiveSourceMapEntryV1 {
  return {
    effectivePath,
    sourceLane: "clarification",
    sourceRef: grounding.sourceIdentity,
    sourceValuePath,
    clarificationTarget: grounding.target,
  };
}

function baseEntry(effectivePath: string, sourceValuePath: string): EffectiveSourceMapEntryV1 {
  return {
    effectivePath,
    sourceLane: "base",
    sourceRef: `input:${sourceValuePath}`,
    sourceValuePath,
    clarificationTarget: null,
  };
}

function candidateEntry(effectivePath: string, sourceValuePath: string): EffectiveSourceMapEntryV1 {
  return {
    effectivePath,
    sourceLane: "candidate",
    sourceRef: `candidate:${sourceValuePath}`,
    sourceValuePath,
    clarificationTarget: null,
  };
}

function setClarified(
  target: JsonObject,
  key: string,
  value: JsonValue,
  sourceMap: EffectiveSourceMapEntryV1[],
  effectivePath: string,
  grounding: ClarificationGroundingV1,
) {
  if (Object.prototype.hasOwnProperty.call(target, key) && target[key] !== null) invalid();
  target[key] = structuredClone(value);
  sourceMap.push(sourceEntry(effectivePath, `normalizedValue.${key}`, grounding));
}

export function buildEffectiveAssessmentAuthorityV1(input: {
  baseStructuredIntake: JsonObject;
  candidateEnvelope: CandidateEnvelopeV1;
  clarificationGrounding: ClarificationGroundingV1 | null;
}): EffectiveAssessmentAuthorityV1 {
  const decisionFacts = asObject(input.baseStructuredIntake.decision_facts);
  const baseWritingSignals = asObject(input.baseStructuredIntake.base_writing_signals);
  const baseEmotions = Array.isArray(input.baseStructuredIntake.user_emotions)
    ? structuredClone(input.baseStructuredIntake.user_emotions)
    : invalid();
  const decisionContext: JsonObject = {
    decisionFacts,
    materialConcern: null,
    latestContactTiming: null,
    usualReplyCadence: null,
    relationshipIntent: null,
  };
  const writingContext: JsonObject = {
    baseWritingSignals,
    candidateEnvelope: structuredClone(input.candidateEnvelope) as unknown as JsonObject,
    relationshipIntent: null,
    requestedMessageTone: null,
  };
  const emotionalContext: JsonObject = {
    baseUserEmotions: baseEmotions,
    centralFearOrDecisionConcern: null,
    materialConcern: null,
  };
  const sourceMap: EffectiveSourceMapEntryV1[] = [
    baseEntry("effectiveDecisionContext.decisionFacts", "current_situation"),
    baseEntry("effectiveWritingContext.baseWritingSignals", "current_situation"),
    candidateEntry("effectiveWritingContext.candidateEnvelope", "optional_message"),
    baseEntry("effectiveEmotionalContext.baseUserEmotions", "current_situation"),
  ];

  const grounding = input.clarificationGrounding;
  if (grounding) {
    const value = grounding.normalizedValue;
    switch (grounding.target) {
      case "material_relationship_or_communication_concern":
        setClarified(decisionContext, "materialConcern", value, sourceMap,
          "effectiveDecisionContext.materialConcern", grounding);
        setClarified(emotionalContext, "materialConcern", value, sourceMap,
          "effectiveEmotionalContext.materialConcern", grounding);
        break;
      case "latest_contact_timing":
        setClarified(decisionContext, "latestContactTiming", value, sourceMap,
          "effectiveDecisionContext.latestContactTiming", grounding);
        break;
      case "usual_reply_cadence":
        setClarified(decisionContext, "usualReplyCadence", value, sourceMap,
          "effectiveDecisionContext.usualReplyCadence", grounding);
        break;
      case "central_fear_or_decision_concern":
        setClarified(emotionalContext, "centralFearOrDecisionConcern", value, sourceMap,
          "effectiveEmotionalContext.centralFearOrDecisionConcern", grounding);
        break;
      case "relationship_intent":
        setClarified(decisionContext, "relationshipIntent", value, sourceMap,
          "effectiveDecisionContext.relationshipIntent", grounding);
        setClarified(writingContext, "relationshipIntent", value, sourceMap,
          "effectiveWritingContext.relationshipIntent", grounding);
        break;
      case "requested_message_tone":
        setClarified(writingContext, "requestedMessageTone", value, sourceMap,
          "effectiveWritingContext.requestedMessageTone", grounding);
        break;
      default:
        invalid();
    }
  }

  return {
    schemaVersion: EFFECTIVE_ASSESSMENT_AUTHORITY_V1_SCHEMA_VERSION,
    baseAuthorityRef: "base_structured_intake",
    candidateAuthorityRef: "candidate_envelope",
    clarificationAuthorityRef: grounding?.sourceIdentity ?? null,
    effectiveDecisionContext: decisionContext,
    effectiveWritingContext: writingContext,
    effectiveEmotionalContext: emotionalContext,
    sourceMap,
  };
}
