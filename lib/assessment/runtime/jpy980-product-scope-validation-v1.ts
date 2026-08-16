import { M2RuntimeError } from "./errors.ts";
import type { AssessmentInput, RequestedTopic } from "./types.ts";

export const JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION =
  "m2-p4-jpy980-product-scope-validation-v1" as const;

export const JPY980_ACTIONABLE_ANCHOR_TOPICS = [
  "decide_send_or_wait",
  "draft_message",
  "message_impact",
  "next_three_days",
] as const satisfies readonly RequestedTopic[];

export const JPY980_SUPPLEMENTARY_ONLY_TOPICS = [
  "relationship",
  "organize_emotions",
] as const satisfies readonly RequestedTopic[];

export type Jpy980ProductScopeValidationV1 = {
  schemaVersion: typeof JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION;
  accepted: true;
  actionableAnchorTopics: RequestedTopic[];
};

export function validateJpy980ProductScopeV1(
  input: Pick<AssessmentInput, "requestedTopics" | "optionalMessage">,
): Jpy980ProductScopeValidationV1 {
  const selected = new Set(input.requestedTopics);
  const actionable = JPY980_ACTIONABLE_ANCHOR_TOPICS.filter((topic) =>
    selected.has(topic),
  );
  if (actionable.length === 0) {
    throw new M2RuntimeError("M2_ACTIONABLE_TOPIC_REQUIRED", 400);
  }
  if (
    selected.has("message_impact") &&
    (input.optionalMessage === null || input.optionalMessage.trim() === "")
  ) {
    throw new M2RuntimeError("M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED", 400);
  }
  return {
    schemaVersion: JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION,
    accepted: true,
    actionableAnchorTopics: [...actionable],
  };
}
