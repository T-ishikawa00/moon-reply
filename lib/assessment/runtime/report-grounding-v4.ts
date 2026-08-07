import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import { M2RuntimeError } from "./errors.ts";
import { buildRelationshipSummaryV3 } from "./report-grounding-v3.ts";
import type {
  SplitDecisionPlanV2,
  SplitReportContentV2,
} from "./types.ts";

export const REPORT_GROUNDING_V4_VERSION =
  "m2-p4-report-grounding-v4" as const;

export const REPORT_GROUNDING_V4_SAFE_ERROR =
  "M2_REPORT_GROUNDING_INTEGRITY_FAILED" as const;

const reportKeys = [
  "schema_version",
  "cover_line",
  "short_letter",
  "decision_reason_summary",
  "relationship_summary",
  "observed_fact_commentary",
  "possible_interpretations",
  "anxiety_reframe",
  "message_temperature",
  "action_rationales",
  "message_draft_context",
  "aftercare_commentary",
  "change_condition_commentary",
  "closing_lines",
] as const;

const decisionFactsKeys = [
  "schema_version",
  "relationship_stage",
  "selected_requests",
  "latest_direct_message",
  "contact_state",
  "boundary_state",
  "practical_reason",
  "information_state",
] as const;

const decisionPlanKeys = [
  "schema_version",
  "selected_decision",
  "decision_reason_fact_ids",
  "possible_interpretations",
  "pre_action_check",
  "actions_to_take",
  "actions_to_avoid",
  "recommended_message_draft",
  "message_draft_edit_metadata",
  "aftercare_plan",
  "change_conditions",
  "review_timing",
  "material_unknowns",
  "model_generated_limitations",
] as const;

const forbiddenAuthorityKeys = new Set([
  "raw_candidate_text",
  "raw_optional_candidate_text",
  "raw_merged_request",
  "provider_metadata",
  "report_metadata",
  "response_id",
  "usage",
  "latency",
  "evaluation",
  "oracle",
  "product_owner_ratings",
  "diagnostic_verdict",
  "retry",
  "repair",
  "fallback",
]);

function invalid(): never {
  throw new M2RuntimeError(REPORT_GROUNDING_V4_SAFE_ERROR);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertJsonDataAndAuthorityBoundary(
  value: unknown,
  visited = new WeakSet<object>(),
): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value !== "object" || visited.has(value)) invalid();
  visited.add(value);

  if (!Array.isArray(value) && !isPlainRecord(value)) invalid();
  if (Object.getOwnPropertySymbols(value).length > 0) invalid();

  for (const key of Object.keys(value)) {
    if (forbiddenAuthorityKeys.has(key)) invalid();
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) invalid();
    assertJsonDataAndAuthorityBoundary(descriptor.value, visited);
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) invalid();
    }
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): void {
  const actualKeys = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actualKeys.length !== expected.length ||
    actualKeys.some((key, index) => key !== expected[index])
  ) {
    invalid();
  }
}

function assertStringArray(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    invalid();
  }
}

function assertGeneratedReportShape(
  value: unknown,
): asserts value is SplitReportContentV2 {
  if (!isPlainRecord(value)) invalid();
  assertExactKeys(value, reportKeys);
  if (
    value.schema_version !== "pipeline-schema-v2.0.0" ||
    typeof value.cover_line !== "string" ||
    typeof value.decision_reason_summary !== "string" ||
    (value.relationship_summary !== null &&
      typeof value.relationship_summary !== "string") ||
    (value.message_draft_context !== null &&
      typeof value.message_draft_context !== "string")
  ) {
    invalid();
  }

  assertStringArray(value.short_letter);
  assertStringArray(value.possible_interpretations);
  assertStringArray(value.anxiety_reframe);
  assertStringArray(value.action_rationales);
  assertStringArray(value.aftercare_commentary);
  assertStringArray(value.change_condition_commentary);
  assertStringArray(value.closing_lines);

  if (!Array.isArray(value.observed_fact_commentary)) invalid();
  for (const item of value.observed_fact_commentary) {
    if (!isPlainRecord(item)) invalid();
    assertExactKeys(item, ["fact_id", "commentary"]);
    if (
      typeof item.fact_id !== "string" ||
      typeof item.commentary !== "string"
    ) {
      invalid();
    }
  }

  if (value.message_temperature !== null) {
    if (!isPlainRecord(value.message_temperature)) invalid();
    assertExactKeys(value.message_temperature, [
      "softness",
      "affection",
      "pressure",
      "adjustment",
    ]);
    if (
      typeof value.message_temperature.softness !== "string" ||
      typeof value.message_temperature.affection !== "string" ||
      typeof value.message_temperature.pressure !== "string" ||
      typeof value.message_temperature.adjustment !== "string"
    ) {
      invalid();
    }
  }
}

function assertRelationshipFacts(decisionFacts: DecisionFactsV2): void {
  if (!isPlainRecord(decisionFacts)) invalid();
  assertExactKeys(decisionFacts, decisionFactsKeys);
  if (decisionFacts.schema_version !== "m2-p4-decision-facts-v2") invalid();
  const message = decisionFacts.latest_direct_message;
  if (!isPlainRecord(message)) invalid();
  assertExactKeys(message, [
    "sender",
    "kind",
    "response_expectation",
    "user_reply_state",
    "sns_signal_only",
  ]);
  if (
    !["user", "other_person", "none", "unknown"].includes(
      String(message.sender),
    ) ||
    !["not_replied", "replied", "not_applicable", "unknown"].includes(
      String(message.user_reply_state),
    )
  ) {
    invalid();
  }
}

function selectedReasonFactIds(decisionPlan: SplitDecisionPlanV2): Set<string> {
  if (!isPlainRecord(decisionPlan)) invalid();
  if (
    !Array.isArray(decisionPlan.decision_reason_fact_ids) ||
    decisionPlan.decision_reason_fact_ids.some(
      (factId) => typeof factId !== "string",
    )
  ) {
    invalid();
  }
  return new Set(decisionPlan.decision_reason_fact_ids);
}

function assertDraftShape(decisionPlan: SplitDecisionPlanV2): void {
  if (!isPlainRecord(decisionPlan)) invalid();
  assertExactKeys(decisionPlan, decisionPlanKeys);
  if (decisionPlan.schema_version !== "pipeline-schema-v2.0.0") invalid();
  const draft = decisionPlan.recommended_message_draft;
  if (draft === null) return;
  if (!isPlainRecord(draft)) invalid();
  assertExactKeys(draft, ["text", "policy", "use_timing"]);
  if (
    typeof draft.text !== "string" ||
    !["required_now", "later_only"].includes(String(draft.policy)) ||
    !["now", "later"].includes(String(draft.use_timing))
  ) {
    invalid();
  }
}

export function buildRelationshipSummaryV4(
  decisionFacts: DecisionFactsV2,
): string {
  assertJsonDataAndAuthorityBoundary(decisionFacts);
  assertRelationshipFacts(decisionFacts);
  return buildRelationshipSummaryV3(decisionFacts);
}

export function groundSplitReportContentV4(
  decisionFacts: DecisionFactsV2,
  decisionPlan: SplitDecisionPlanV2,
  generatedReportContent: SplitReportContentV2,
): SplitReportContentV2 {
  assertJsonDataAndAuthorityBoundary(decisionFacts);
  assertJsonDataAndAuthorityBoundary(decisionPlan);
  assertJsonDataAndAuthorityBoundary(generatedReportContent);
  assertRelationshipFacts(decisionFacts);
  assertDraftShape(decisionPlan);
  assertGeneratedReportShape(generatedReportContent);

  const selectedFactIds = selectedReasonFactIds(decisionPlan);
  const observedFactIds = new Set<string>();
  for (const item of generatedReportContent.observed_fact_commentary) {
    if (
      observedFactIds.has(item.fact_id) ||
      !selectedFactIds.has(item.fact_id)
    ) {
      invalid();
    }
    observedFactIds.add(item.fact_id);
  }

  const grounded = structuredClone(generatedReportContent);
  grounded.relationship_summary = buildRelationshipSummaryV3(decisionFacts);

  if (decisionPlan.recommended_message_draft === null) {
    grounded.message_temperature = null;
    grounded.message_draft_context = null;
  }

  return grounded;
}
