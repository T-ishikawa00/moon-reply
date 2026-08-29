import type { RequestedTopic } from "./types.ts";

export const JPY980_PRIMARY_PRODUCT_FUNCTION_V1_VERSION =
  "final-primary-product-function-r1" as const;

export const JPY980_ORGANIZATION_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1 = [
  "relationship",
  "organize_emotions",
] as const satisfies readonly RequestedTopic[];

export const JPY980_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1 = [
  "decide_send_or_wait",
  "draft_message",
  "message_impact",
  ...JPY980_ORGANIZATION_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1,
] as const satisfies readonly RequestedTopic[];

const primaryProductFunctionTopics = new Set<string>(
  JPY980_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1,
);
const organizationPrimaryProductFunctionTopics = new Set<string>(
  JPY980_ORGANIZATION_PRIMARY_PRODUCT_FUNCTION_TOPICS_V1,
);

export function hasJpy980PrimaryProductFunctionV1(
  requestedTopics: Iterable<string>,
) {
  return [...requestedTopics].some((topic) =>
    primaryProductFunctionTopics.has(topic),
  );
}

export function hasJpy980OrganizationPrimaryProductFunctionV1(
  requestedTopics: Iterable<string>,
) {
  return [...requestedTopics].some((topic) =>
    organizationPrimaryProductFunctionTopics.has(topic),
  );
}
