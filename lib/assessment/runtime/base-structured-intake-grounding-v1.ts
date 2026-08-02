import { canonicalizeContextInferencesV5 } from "./context-inference-canonicalization-v5.ts";
import { M2RuntimeError } from "./errors.ts";
import type {
  BaseProviderInputV1,
  BaseRelationshipV1,
  BaseRequestedTopicV1,
} from "./contracts/split-stage-contracts-v1.ts";
import type { JsonObject } from "./types.ts";

export const BASE_STRUCTURED_INTAKE_GROUNDING_VERSION =
  "m2-p4-base-structured-intake-grounding-v1" as const;

export type BaseProviderProjectionSourceV1 = Readonly<{
  currentSituation: string;
  relationship: BaseRelationshipV1;
  requestedTopics: readonly BaseRequestedTopicV1[];
}>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortedUnique(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

export function projectBaseProviderInputV1(
  input: BaseProviderProjectionSourceV1,
): BaseProviderInputV1 {
  return {
    current_situation: input.currentSituation,
    relationship: input.relationship,
    requested_topics: [...input.requestedTopics],
  };
}

export function groundBaseStructuredIntakeV1(
  input: BaseProviderInputV1,
  rawBaseStructuredIntake: JsonObject,
): JsonObject {
  const grounded = structuredClone(rawBaseStructuredIntake) as unknown as Record<
    string,
    unknown
  >;
  const decisionFacts = grounded.decision_facts;
  if (!isObject(decisionFacts)) {
    throw new M2RuntimeError("M2_BASE_SOURCE_INTEGRITY_FAILED");
  }

  grounded.relationship_stage = input.relationship;
  decisionFacts.relationship_stage = input.relationship;
  decisionFacts.selected_requests = [...input.requested_topics];

  const informationState = decisionFacts.information_state;
  if (isObject(informationState)) {
    informationState.unresolved_fields = Array.isArray(
      informationState.unresolved_fields,
    )
      ? informationState.unresolved_fields.filter(
          (fieldPath) => fieldPath !== "relationship_stage",
        )
      : informationState.unresolved_fields;
  }

  const observedFacts = Array.isArray(grounded.observed_facts)
    ? grounded.observed_facts
    : [];
  const factsById = new Map<string, Record<string, unknown>>();
  for (const fact of observedFacts) {
    if (isObject(fact) && typeof fact.fact_id === "string") {
      factsById.set(fact.fact_id, fact);
    }
  }

  const contextInferences = Array.isArray(grounded.context_inferences)
    ? grounded.context_inferences
    : [];
  grounded.context_inferences = contextInferences
    .filter(
      (inference) =>
        !isObject(inference) || inference.field_path !== "relationship_stage",
    )
    .map((inference) => {
      if (!isObject(inference) || !Array.isArray(inference.supporting_fact_ids)) {
        return inference;
      }

      const supportedFacts = inference.supporting_fact_ids.flatMap((factId) => {
        if (typeof factId !== "string") return [];
        const fact = factsById.get(factId);
        return fact ? [fact] : [];
      });
      if (supportedFacts.length === 0) return inference;

      const supportedRefs = supportedFacts.flatMap((fact) =>
        Array.isArray(fact.source_refs)
          ? fact.source_refs.filter(
              (sourceRef): sourceRef is string => typeof sourceRef === "string",
            )
          : [],
      );
      return {
        ...inference,
        source_refs: sortedUnique(supportedRefs),
      };
    });

  const canonicalized = canonicalizeContextInferencesV5(
    grounded as JsonObject,
  ) as unknown as Record<string, unknown>;
  const canonicalDecisionFacts = canonicalized.decision_facts;
  if (isObject(canonicalDecisionFacts)) {
    const canonicalInformationState = canonicalDecisionFacts.information_state;
    if (isObject(canonicalInformationState)) {
      canonicalInformationState.used_context_inference =
        Array.isArray(canonicalized.context_inferences) &&
        canonicalized.context_inferences.length > 0;
    }
  }

  return canonicalized as JsonObject;
}
