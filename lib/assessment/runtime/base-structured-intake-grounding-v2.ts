import { groundBaseStructuredIntakeV1 } from "./base-structured-intake-grounding-v1.ts";
import type { BaseProviderInputV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { JsonObject } from "./types.ts";

export const BASE_STRUCTURED_INTAKE_GROUNDING_V2_VERSION =
  "m2-p4-base-structured-intake-grounding-v2" as const;

const canonicalUnresolvedRepresentations = new Map<string, unknown>([
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valueAtPath(root: Record<string, unknown>, fieldPath: string) {
  let selected: unknown = root;
  for (const segment of fieldPath.split(".")) {
    if (!isObject(selected) || !(segment in selected)) return undefined;
    selected = selected[segment];
  }
  return selected;
}

export function groundBaseStructuredIntakeV2(
  input: BaseProviderInputV1,
  rawBaseStructuredIntake: JsonObject,
): JsonObject {
  const groundedV1 = groundBaseStructuredIntakeV1(
    input,
    rawBaseStructuredIntake,
  );
  const groundedV2 = structuredClone(groundedV1) as unknown as Record<
    string,
    unknown
  >;
  const decisionFacts = groundedV2.decision_facts;
  if (!isObject(decisionFacts)) return groundedV2 as JsonObject;
  const informationState = decisionFacts.information_state;
  if (!isObject(informationState)) return groundedV2 as JsonObject;

  if (Array.isArray(informationState.unresolved_fields)) {
    informationState.unresolved_fields =
      informationState.unresolved_fields.filter((fieldPath) => {
        if (
          typeof fieldPath !== "string" ||
          !canonicalUnresolvedRepresentations.has(fieldPath)
        ) {
          return true;
        }
        return (
          valueAtPath(decisionFacts, fieldPath) ===
          canonicalUnresolvedRepresentations.get(fieldPath)
        );
      });
  }

  informationState.used_context_inference =
    Array.isArray(groundedV2.context_inferences) &&
    groundedV2.context_inferences.length > 0;

  return groundedV2 as JsonObject;
}
