import type { JsonObject } from "./types.ts";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAtPath(root: Record<string, unknown>, fieldPath: string) {
  let selected: unknown = root;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(selected)) return undefined;
    selected = selected[segment];
  }
  return selected;
}

export function canonicalizeContextInferencesV5(
  structuredIntake: JsonObject,
): JsonObject {
  const canonicalized = structuredClone(structuredIntake) as unknown as Record<
    string,
    unknown
  >;
  const decisionFacts = isObject(canonicalized.decision_facts)
    ? canonicalized.decision_facts
    : {};
  const information = isObject(decisionFacts.information_state)
    ? decisionFacts.information_state
    : null;
  const unresolvedFields = new Set(
    Array.isArray(information?.unresolved_fields)
      ? information.unresolved_fields.filter(
          (fieldPath): fieldPath is string => typeof fieldPath === "string",
        )
      : [],
  );
  const contextInferences = Array.isArray(canonicalized.context_inferences)
    ? canonicalized.context_inferences
    : [];

  const canonicalContextInferences = contextInferences.filter((inference) => {
    if (!isObject(inference) || typeof inference.field_path !== "string") {
      return true;
    }
    const finalValue = valueAtPath(decisionFacts, inference.field_path);
    return (
      !unresolvedFields.has(inference.field_path) &&
      finalValue !== null &&
      finalValue !== "unknown"
    );
  });
  canonicalized.context_inferences = canonicalContextInferences;

  if (information) {
    information.used_context_inference = canonicalContextInferences.length > 0;
  }

  return canonicalized as JsonObject;
}
