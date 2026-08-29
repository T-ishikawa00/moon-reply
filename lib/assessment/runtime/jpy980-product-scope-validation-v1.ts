import { M2RuntimeError } from "./errors.ts";
import type {
  AssessmentInput,
  RelationshipValue,
  RequestedTopic,
} from "./types.ts";

export const JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION =
  "final-product-scope-r1" as const;

export const JPY980_PRODUCT_SCOPE_DECISIONS = [
  "eligible",
  "needs_clarification",
] as const;

export const JPY980_PRODUCT_SCOPE_CLARIFICATION_CODES = [
  "relationship_domain_confirmation_required",
  "message_candidate_required",
] as const;

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

export type Jpy980ProductScopeInputV1 = Readonly<{
  currentSituation: string;
  latestInboundMessage?: string | null;
  optionalMessage: string | null;
  relationship: RelationshipValue;
  requestedTopics: readonly RequestedTopic[];
}>;

export type Jpy980ProductScopeClarificationCodeV1 =
  (typeof JPY980_PRODUCT_SCOPE_CLARIFICATION_CODES)[number];

export type Jpy980ProductScopeValidationV1 = Readonly<{
  schemaVersion: typeof JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION;
  accepted: true;
  decision: "eligible";
  clarificationCode: null;
  actionableAnchorTopics: readonly RequestedTopic[];
}>;

export type Jpy980ProductScopeClarificationV1 = Readonly<{
  schemaVersion: typeof JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION;
  accepted: false;
  decision: "needs_clarification";
  clarificationCode: Jpy980ProductScopeClarificationCodeV1;
  actionableAnchorTopics: readonly RequestedTopic[];
}>;

export type Jpy980ProductScopeDecisionV1 =
  | Jpy980ProductScopeValidationV1
  | Jpy980ProductScopeClarificationV1;

const relationshipDomainSignal =
  /(?:恋愛|恋人|片思い|好き|告白|デート|交際|付き合|別れ|復縁|婚約|結婚|夫|妻|彼氏|彼女|パートナー|相手|友達|友人|同僚|先輩|後輩|知人|関係|距離|連絡|返信|返事|既読|未読|メッセージ|LINE|DM|love|romantic|relationship|partner|boyfriend|girlfriend|crush|dating|message|reply)/iu;

function hasRelationshipDomainEvidence(input: Jpy980ProductScopeInputV1) {
  if (input.relationship !== "other") return true;
  return [
    input.currentSituation,
    input.latestInboundMessage ?? "",
    input.optionalMessage ?? "",
  ].some((value) => relationshipDomainSignal.test(value));
}

export function evaluateJpy980ProductScopeV1(
  input: Jpy980ProductScopeInputV1,
): Jpy980ProductScopeDecisionV1 {
  const selected = new Set(input.requestedTopics);
  const actionable = JPY980_ACTIONABLE_ANCHOR_TOPICS.filter((topic) =>
    selected.has(topic),
  );
  const base = {
    schemaVersion: JPY980_PRODUCT_SCOPE_VALIDATION_V1_VERSION,
    actionableAnchorTopics: [...actionable],
  } as const;

  if (
    selected.has("message_impact") &&
    (input.optionalMessage === null || input.optionalMessage.trim() === "")
  ) {
    return {
      ...base,
      accepted: false,
      decision: "needs_clarification",
      clarificationCode: "message_candidate_required",
    };
  }
  if (actionable.length > 0 || hasRelationshipDomainEvidence(input)) {
    return {
      ...base,
      accepted: true,
      decision: "eligible",
      clarificationCode: null,
    };
  }
  return {
    ...base,
    accepted: false,
    decision: "needs_clarification",
    clarificationCode: "relationship_domain_confirmation_required",
  };
}

export function validateJpy980ProductScopeV1(
  input: Pick<
    AssessmentInput,
    | "currentSituation"
    | "optionalMessage"
    | "relationship"
    | "requestedTopics"
  >,
): Jpy980ProductScopeValidationV1 {
  const decision = evaluateJpy980ProductScopeV1(input);
  if (decision.accepted) return decision;
  if (decision.clarificationCode === "message_candidate_required") {
    throw new M2RuntimeError("M2_MESSAGE_IMPACT_CANDIDATE_REQUIRED", 400);
  }
  throw new M2RuntimeError("M2_PRODUCT_SCOPE_CLARIFICATION_REQUIRED", 400);
}
