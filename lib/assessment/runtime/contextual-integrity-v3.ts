import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import { M2RuntimeError } from "./errors.ts";
import type { JsonObject } from "./types.ts";

const forbiddenInferenceFields = new Set([
  "boundary_state.kind",
  "boundary_state.status",
  "boundary_state.repeated_unanswered_contact",
]);

const unresolvedRepresentations = new Map<string, unknown>([
  ["relationship_stage", "unknown"],
  ["latest_direct_message.sender", "unknown"],
  ["latest_direct_message.kind", "unknown"],
  ["latest_direct_message.response_expectation", "unknown"],
  ["latest_direct_message.user_reply_state", "unknown"],
  ["contact_state.unanswered_user_message_count", null],
  ["contact_state.elapsed_since_latest_user_message_minutes", null],
  ["contact_state.usual_cadence_relation", "unknown"],
  ["boundary_state.kind", "unknown"],
  ["boundary_state.status", "unknown"],
  ["practical_reason.kind", "unknown"],
  ["practical_reason.deadline", "unknown"],
]);

function invalid(): never {
  throw new M2RuntimeError("M2_CONTEXTUAL_INFERENCE_INVALID");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAtPath(facts: DecisionFactsV2, fieldPath: string) {
  let value: unknown = facts;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(value) || !(segment in value)) invalid();
    value = value[segment];
  }
  return value;
}

function uniqueStrings(values: unknown[]): values is string[] {
  return (
    values.every((value) => typeof value === "string") &&
    new Set(values).size === values.length
  );
}

export function validateContextualIntakeIntegrityV3(
  structuredIntake: JsonObject,
) {
  const observedFacts = structuredIntake.observed_facts;
  const contextInferences = structuredIntake.context_inferences;
  const decisionFacts = structuredIntake.decision_facts;
  if (
    !Array.isArray(observedFacts) ||
    !Array.isArray(contextInferences) ||
    !isObject(decisionFacts) ||
    !isObject(decisionFacts.information_state)
  ) {
    invalid();
  }

  const factIds = observedFacts.map((fact) =>
    isObject(fact) ? fact.fact_id : undefined,
  );
  if (!uniqueStrings(factIds)) invalid();

  const factsById = new Map<string, Record<string, unknown>>();
  for (const fact of observedFacts) {
    if (!isObject(fact) || typeof fact.fact_id !== "string") invalid();
    factsById.set(fact.fact_id, fact);
  }

  const inferenceIds = contextInferences.map((inference) =>
    isObject(inference) ? inference.inference_id : undefined,
  );
  const inferredFieldPaths = contextInferences.map((inference) =>
    isObject(inference) ? inference.field_path : undefined,
  );
  if (!uniqueStrings(inferenceIds) || !uniqueStrings(inferredFieldPaths)) {
    invalid();
  }

  const information = decisionFacts.information_state;
  const unresolvedFields = information.unresolved_fields;
  if (!Array.isArray(unresolvedFields) || !uniqueStrings(unresolvedFields)) {
    invalid();
  }
  if (
    (contextInferences.length > 0) !==
    (information.used_context_inference === true)
  ) {
    invalid();
  }

  const unresolvedSet = new Set(unresolvedFields);
  for (const inference of contextInferences) {
    const supportingFactIds = isObject(inference)
      ? inference.supporting_fact_ids
      : null;
    const inferenceSourceRefs = isObject(inference)
      ? inference.source_refs
      : null;
    if (
      !isObject(inference) ||
      typeof inference.field_path !== "string" ||
      !Array.isArray(supportingFactIds) ||
      !Array.isArray(inferenceSourceRefs) ||
      !uniqueStrings(supportingFactIds) ||
      !uniqueStrings(inferenceSourceRefs) ||
      forbiddenInferenceFields.has(inference.field_path) ||
      unresolvedSet.has(inference.field_path)
    ) {
      invalid();
    }

    const supportedSourceRefs = new Set<string>();
    for (const factId of supportingFactIds) {
      const fact = factsById.get(factId);
      if (!fact || !Array.isArray(fact.source_refs)) invalid();
      for (const sourceRef of fact.source_refs) {
        if (typeof sourceRef !== "string") invalid();
        supportedSourceRefs.add(sourceRef);
      }
    }
    if (
      inferenceSourceRefs.some(
        (sourceRef) => !supportedSourceRefs.has(sourceRef),
      )
    ) {
      invalid();
    }

    const inferredValue = valueAtPath(
      decisionFacts as unknown as DecisionFactsV2,
      inference.field_path,
    );
    if (inferredValue === null || inferredValue === "unknown") invalid();
  }

  for (const fieldPath of unresolvedFields) {
    if (!unresolvedRepresentations.has(fieldPath)) invalid();
    if (
      valueAtPath(
        decisionFacts as unknown as DecisionFactsV2,
        fieldPath,
      ) !== unresolvedRepresentations.get(fieldPath)
    ) {
      invalid();
    }
  }
}
