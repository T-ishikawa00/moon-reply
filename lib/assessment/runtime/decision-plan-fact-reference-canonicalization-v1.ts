import type { JsonObject, JsonValue } from "./types.ts";

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deduplicateExactStrings(value: JsonValue | undefined): JsonValue | undefined {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return value;
  }
  return [...new Set(value)];
}

function canonicalizeSupportingFactIds(value: JsonValue | undefined) {
  if (!isObject(value)) return;
  const canonical = deduplicateExactStrings(value.supporting_fact_ids);
  if (canonical !== undefined) value.supporting_fact_ids = canonical;
}

/**
 * OpenAI Structured Outputs does not support JSON Schema `uniqueItems`, while
 * the canonical PB-04 contract correctly requires fact references to be
 * unique. Repeating the same fact reference carries no additional meaning, so
 * collapse exact string duplicates before canonical AJV and policy validation.
 * All other types, values, fields, and ordering remain untouched and continue
 * to fail closed under the existing validators.
 */
export function canonicalizeDecisionPlanFactReferencesV1(
  output: JsonObject,
): JsonObject {
  const canonical = structuredClone(output);

  const decisionReasons = deduplicateExactStrings(
    canonical.decision_reason_fact_ids,
  );
  if (decisionReasons !== undefined) {
    canonical.decision_reason_fact_ids = decisionReasons;
  }

  if (Array.isArray(canonical.possible_interpretations)) {
    canonical.possible_interpretations.forEach(canonicalizeSupportingFactIds);
  }
  canonicalizeSupportingFactIds(canonical.pre_action_check);
  if (Array.isArray(canonical.aftercare_plan)) {
    canonical.aftercare_plan.forEach(canonicalizeSupportingFactIds);
  }
  if (Array.isArray(canonical.change_conditions)) {
    canonical.change_conditions.forEach(canonicalizeSupportingFactIds);
  }

  if (isObject(canonical.review_timing)) {
    const triggerFacts = deduplicateExactStrings(
      canonical.review_timing.trigger_fact_ids,
    );
    if (triggerFacts !== undefined) {
      canonical.review_timing.trigger_fact_ids = triggerFacts;
    }
  }

  return canonical;
}
