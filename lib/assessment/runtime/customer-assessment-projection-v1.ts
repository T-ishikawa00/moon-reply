import { M2RuntimeError } from "./errors.ts";
import {
  decodeDecisionCode,
  decodeRequestedTopics,
  requireReadyAssessmentResult,
} from "./runtime-result-normalization-v1.ts";
import type {
  Decision,
  RequestedTopic,
  RuntimeReport,
  SplitRuntimeReportV1,
} from "./types.ts";

export const CUSTOMER_ASSESSMENT_PROJECTION_SCHEMA_VERSION =
  "customer-assessment-projection-v1" as const;

export type NormalizedFinalDraftV1 = {
  text: string;
  policy: "required_now" | "later_only";
  useTiming: "now" | "later";
};

export type NormalizedImmediateActionV1 = {
  action: string;
  avoid: string[];
  secondaryActions: string[];
};

export type NormalizedReassessmentV1 = {
  when: string;
  conditions: Array<{
    condition: string;
    resultingDirection: Decision;
  }>;
};

export type ProjectedMessageTemperatureV1 = {
  softness: string;
  affection: string;
  pressure: string;
  adjustment: string;
};

export type CustomerAssessmentOptionalDetailsV1 = {
  interpretations?: string[];
  shortLetter?: string[];
  anxietyReframe?: string[];
  expandedPlan?: Array<{
    phase: "tonight" | "next_day" | "day_three" | "next" | "reassessment_condition";
    action: string;
    avoid: string | null;
  }>;
  planCommentary?: string[];
};

export type CustomerAssessmentProjectionV1 = {
  projectionSchemaVersion: typeof CUSTOMER_ASSESSMENT_PROJECTION_SCHEMA_VERSION;
  sourceReportSchemaVersion:
    | RuntimeReport["schemaVersion"]
    | SplitRuntimeReportV1["schemaVersion"];
  requestedTopics: RequestedTopic[];
  decisionCode: Decision;
  primaryReason: string;
  finalDraft: NormalizedFinalDraftV1 | null;
  immediateAction: NormalizedImmediateActionV1;
  reassessment: NormalizedReassessmentV1;
  relationshipSummary: string | null;
  messageTemperature: ProjectedMessageTemperatureV1 | null;
  optionalDetails: CustomerAssessmentOptionalDetailsV1;
  fixedLimitation: string;
};

function projectionInvalid(): never {
  throw new M2RuntimeError("M2_CUSTOMER_PROJECTION_INVALID");
}

function normalizedEqualityKey(value: string) {
  return value.replace(/\s+/gu, " ").trim();
}

function uniqueExactStrings(values: readonly string[]) {
  const seen = new Set<string>();
  const selected: string[] = [];
  for (const value of values) {
    const key = normalizedEqualityKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(value);
  }
  return selected;
}

function projectImmediateAction(
  report: RuntimeReport | SplitRuntimeReportV1,
): NormalizedImmediateActionV1 {
  const plan = report.decisionPlan;
  const tonight =
    report.schemaVersion === "m2-p3-runtime-report-v1"
      ? report.decisionPlan.three_day_plan.find((item) => item.day === "tonight")
      : report.decisionPlan.aftercare_plan.find((item) => item.phase === "tonight");
  const action = tonight?.action ?? plan.actions_to_take[0];
  if (!action) projectionInvalid();

  const avoid = uniqueExactStrings([
    ...(tonight?.avoid === null || tonight?.avoid === undefined
      ? []
      : [tonight.avoid]),
    ...plan.actions_to_avoid,
  ]);
  const actionKey = normalizedEqualityKey(action);
  const secondaryActions = uniqueExactStrings(plan.actions_to_take).filter(
    (candidate) => normalizedEqualityKey(candidate) !== actionKey,
  );
  return { action, avoid, secondaryActions };
}

function projectOptionalDetails(
  report: RuntimeReport | SplitRuntimeReportV1,
  requestedTopics: readonly RequestedTopic[],
): CustomerAssessmentOptionalDetailsV1 {
  const content = report.content;
  const selected: CustomerAssessmentOptionalDetailsV1 = {};
  if (
    requestedTopics.includes("message_impact") &&
    content.possible_interpretations.length > 0
  ) {
    selected.interpretations = [...content.possible_interpretations];
  }
  if (requestedTopics.includes("organize_emotions")) {
    if (content.short_letter.length > 0) {
      selected.shortLetter = [...content.short_letter];
    }
    if (content.anxiety_reframe.length > 0) {
      selected.anxietyReframe = [...content.anxiety_reframe];
    }
  }
  if (requestedTopics.includes("next_three_days")) {
    selected.expandedPlan =
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? report.decisionPlan.three_day_plan.map((item) => ({
            phase: item.day,
            action: item.action,
            avoid: item.avoid,
          }))
        : report.decisionPlan.aftercare_plan.map((item) => ({
            phase: item.phase,
            action: item.action,
            avoid: item.avoid,
          }));
    const commentary =
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? report.content.three_day_plan_commentary
        : report.content.aftercare_commentary;
    if (commentary.length > 0) selected.planCommentary = [...commentary];
  }
  return selected;
}

export function projectCustomerAssessmentV1(
  readyResult: unknown,
  authoritativeRequestedTopics: unknown,
): CustomerAssessmentProjectionV1 {
  const decoded = requireReadyAssessmentResult(readyResult);
  const requestedTopics = decodeRequestedTopics(authoritativeRequestedTopics);
  const report = decoded.report;
  const plan = report.decisionPlan;
  const content = report.content;
  const sourceDraft =
    report.schemaVersion === "m2-p3-runtime-report-v1"
      ? report.decisionPlan.message_draft
      : report.decisionPlan.recommended_message_draft;
  const finalDraft = sourceDraft
    ? {
        text: sourceDraft.text,
        policy: sourceDraft.policy,
        useTiming: sourceDraft.use_timing,
      }
    : null;

  return {
    projectionSchemaVersion: CUSTOMER_ASSESSMENT_PROJECTION_SCHEMA_VERSION,
    sourceReportSchemaVersion: report.schemaVersion,
    requestedTopics: [...requestedTopics],
    decisionCode: plan.selected_decision,
    primaryReason: content.decision_reason_summary,
    finalDraft,
    immediateAction: projectImmediateAction(report),
    reassessment: {
      when: plan.review_timing.when,
      conditions: plan.change_conditions.map((item) => ({
        condition: item.condition,
        resultingDirection: item.resulting_direction,
      })),
    },
    relationshipSummary:
      requestedTopics.includes("relationship")
        ? content.relationship_summary
        : null,
    messageTemperature:
      requestedTopics.includes("message_impact") && content.message_temperature
        ? { ...content.message_temperature }
        : null,
    optionalDetails: projectOptionalDetails(report, requestedTopics),
    fixedLimitation: report.fixedLimitation,
  };
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    projectionInvalid();
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
) {
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    projectionInvalid();
  }
}

function assertText(value: unknown, nullable = false): asserts value is string | null {
  if (value === null && nullable) return;
  if (typeof value !== "string" || value.length === 0) projectionInvalid();
}

function assertTexts(value: unknown): asserts value is string[] {
  if (!Array.isArray(value)) projectionInvalid();
  value.forEach((item) => assertText(item));
}

function assertFinalDraft(value: unknown, decision: Decision) {
  if (value === null) {
    if (decision === "reply_now" || decision === "send_now") projectionInvalid();
    return;
  }
  assertRecord(value);
  assertExactKeys(value, ["text", "policy", "useTiming"]);
  assertText(value.text);
  if (value.policy !== "required_now" && value.policy !== "later_only") {
    projectionInvalid();
  }
  if (value.useTiming !== "now" && value.useTiming !== "later") {
    projectionInvalid();
  }
  if (
    (value.policy === "required_now" && value.useTiming !== "now") ||
    (value.policy === "later_only" && value.useTiming !== "later") ||
    ((decision === "reply_now" || decision === "send_now") &&
      value.policy !== "required_now") ||
    (decision === "pause_additional_contact")
  ) {
    projectionInvalid();
  }
}

function assertImmediateAction(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["action", "avoid", "secondaryActions"]);
  assertText(value.action);
  assertTexts(value.avoid);
  assertTexts(value.secondaryActions);
}

function assertReassessment(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["when", "conditions"]);
  assertText(value.when);
  if (!Array.isArray(value.conditions)) projectionInvalid();
  for (const condition of value.conditions) {
    assertRecord(condition);
    assertExactKeys(condition, ["condition", "resultingDirection"]);
    assertText(condition.condition);
    decodeDecisionCode(condition.resultingDirection);
  }
}

function assertMessageTemperature(value: unknown) {
  if (value === null) return;
  assertRecord(value);
  assertExactKeys(value, ["softness", "affection", "pressure", "adjustment"]);
  assertText(value.softness);
  assertText(value.affection);
  assertText(value.pressure);
  assertText(value.adjustment);
}

function assertOptionalDetails(
  value: unknown,
): asserts value is CustomerAssessmentOptionalDetailsV1 {
  assertRecord(value);
  assertExactKeys(value, [], [
    "interpretations",
    "shortLetter",
    "anxietyReframe",
    "expandedPlan",
    "planCommentary",
  ]);
  if (value.interpretations !== undefined) assertTexts(value.interpretations);
  if (value.shortLetter !== undefined) assertTexts(value.shortLetter);
  if (value.anxietyReframe !== undefined) assertTexts(value.anxietyReframe);
  if (value.planCommentary !== undefined) assertTexts(value.planCommentary);
  if (value.expandedPlan !== undefined) {
    if (!Array.isArray(value.expandedPlan)) projectionInvalid();
    for (const item of value.expandedPlan) {
      assertRecord(item);
      assertExactKeys(item, ["phase", "action", "avoid"]);
      if (
        item.phase !== "tonight" &&
        item.phase !== "next_day" &&
        item.phase !== "day_three" &&
        item.phase !== "next" &&
        item.phase !== "reassessment_condition"
      ) {
        projectionInvalid();
      }
      assertText(item.action);
      assertText(item.avoid, true);
    }
  }
}

function assertCustomerAssessmentProjection(
  value: unknown,
): asserts value is CustomerAssessmentProjectionV1 {
  assertRecord(value);
  assertExactKeys(value, [
    "projectionSchemaVersion",
    "sourceReportSchemaVersion",
    "requestedTopics",
    "decisionCode",
    "primaryReason",
    "finalDraft",
    "immediateAction",
    "reassessment",
    "relationshipSummary",
    "messageTemperature",
    "optionalDetails",
    "fixedLimitation",
  ]);
  if (value.projectionSchemaVersion !== CUSTOMER_ASSESSMENT_PROJECTION_SCHEMA_VERSION) {
    projectionInvalid();
  }
  if (
    value.sourceReportSchemaVersion !== "m2-p3-runtime-report-v1" &&
    value.sourceReportSchemaVersion !== "m2-p4-split-runtime-report-v1"
  ) {
    projectionInvalid();
  }
  const requestedTopics = decodeRequestedTopics(value.requestedTopics);
  const decision = decodeDecisionCode(value.decisionCode);
  assertText(value.primaryReason);
  assertFinalDraft(value.finalDraft, decision);
  assertImmediateAction(value.immediateAction);
  assertReassessment(value.reassessment);
  assertText(value.relationshipSummary, true);
  assertMessageTemperature(value.messageTemperature);
  assertOptionalDetails(value.optionalDetails);
  if (
    (!requestedTopics.includes("relationship") &&
      value.relationshipSummary !== null) ||
    (!requestedTopics.includes("message_impact") &&
      (value.messageTemperature !== null ||
        value.optionalDetails.interpretations !== undefined)) ||
    (!requestedTopics.includes("organize_emotions") &&
      (value.optionalDetails.shortLetter !== undefined ||
        value.optionalDetails.anxietyReframe !== undefined)) ||
    (!requestedTopics.includes("next_three_days") &&
      (value.optionalDetails.expandedPlan !== undefined ||
        value.optionalDetails.planCommentary !== undefined))
  ) {
    projectionInvalid();
  }
  assertText(value.fixedLimitation);
}

export function decodeCustomerAssessmentProjectionV1(
  value: unknown,
): CustomerAssessmentProjectionV1 {
  assertCustomerAssessmentProjection(value);
  return value;
}
