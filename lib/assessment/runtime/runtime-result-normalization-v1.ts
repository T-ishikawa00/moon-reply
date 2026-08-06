import { M2RuntimeError } from "./errors.ts";
import {
  REQUESTED_TOPIC_VALUES,
  type AssessmentExecutionResult,
  type Decision,
  type DecisionCard,
  type DecisionPlan,
  type ReadyAssessmentResult,
  type ReportContent,
  type RequestedTopic,
  type RuntimeReport,
  type SplitDecisionPlanV2,
  type SplitReportContentV2,
  type SplitRuntimeReportV1,
  type UsageTotals,
} from "./types.ts";

const decisions = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
] as const;

const draftPolicies = ["required_now", "later_only"] as const;
const draftTimings = ["now", "later"] as const;
const factIdPattern = /^F[0-9]{3}$/u;

function invalid(code = "M2_RUNTIME_RESULT_INVALID"): never {
  throw new M2RuntimeError(code);
}

function assertRecord(
  value: unknown,
  code = "M2_RUNTIME_RESULT_INVALID",
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalid(code);
  }
}

function assertArray(
  value: unknown,
  code = "M2_RUNTIME_RESULT_INVALID",
): asserts value is unknown[] {
  if (!Array.isArray(value)) invalid(code);
}

function assertExactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
  code = "M2_RUNTIME_RESULT_INVALID",
) {
  const allowed = new Set([...required, ...optional]);
  if (
    required.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    Object.keys(value).some((key) => !allowed.has(key))
  ) {
    invalid(code);
  }
}

function assertString(
  value: unknown,
  options: {
    nullable?: boolean;
    nonEmpty?: boolean;
    pattern?: RegExp;
    code?: string;
  } = {},
): asserts value is string | null {
  const code = options.code ?? "M2_RUNTIME_RESULT_INVALID";
  if (value === null && options.nullable) return;
  if (typeof value !== "string") invalid(code);
  if (options.nonEmpty !== false && value.length === 0) invalid(code);
  if (options.pattern && !options.pattern.test(value)) invalid(code);
}

function assertBoolean(
  value: unknown,
  code = "M2_RUNTIME_RESULT_INVALID",
): asserts value is boolean {
  if (typeof value !== "boolean") invalid(code);
}

function assertFiniteNumber(
  value: unknown,
  integer: boolean,
  code = "M2_RUNTIME_RESULT_INVALID",
): asserts value is number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    (integer && !Number.isInteger(value))
  ) {
    invalid(code);
  }
}

function assertOneOf<const Values extends readonly string[]>(
  value: unknown,
  allowed: Values,
  code = "M2_RUNTIME_RESULT_INVALID",
): asserts value is Values[number] {
  if (
    typeof value !== "string" ||
    !allowed.some((candidate) => candidate === value)
  ) {
    invalid(code);
  }
}

function assertStringArray(
  value: unknown,
  options: {
    minimum?: number;
    maximum?: number;
    unique?: boolean;
    pattern?: RegExp;
    code?: string;
  } = {},
): asserts value is string[] {
  const code = options.code ?? "M2_RUNTIME_RESULT_INVALID";
  assertArray(value, code);
  if (
    value.length < (options.minimum ?? 0) ||
    (options.maximum !== undefined && value.length > options.maximum)
  ) {
    invalid(code);
  }
  for (const item of value) {
    assertString(item, { pattern: options.pattern, code });
  }
  if (options.unique && new Set(value).size !== value.length) invalid(code);
}

function assertObjectArray(
  value: unknown,
  validate: (item: unknown) => void,
  minimum = 0,
  maximum?: number,
): asserts value is Record<string, unknown>[] {
  assertArray(value);
  if (value.length < minimum || (maximum !== undefined && value.length > maximum)) {
    invalid();
  }
  value.forEach((item) => {
    assertRecord(item);
    validate(item);
  });
}

function assertFactIds(value: unknown) {
  assertStringArray(value, {
    minimum: 1,
    unique: true,
    pattern: factIdPattern,
  });
}

export function decodeDecisionCode(value: unknown): Decision {
  assertOneOf(value, decisions);
  return value;
}

function assertRequestedTopics(
  value: unknown,
  code = "M2_REQUESTED_TOPICS_INVALID",
): asserts value is RequestedTopic[] {
  assertArray(value, code);
  if (value.length < 1 || value.length > 3) invalid(code);
  for (const topic of value) {
    assertOneOf(topic, REQUESTED_TOPIC_VALUES, code);
  }
  if (new Set(value).size !== value.length) invalid(code);
}

export function decodeRequestedTopics(value: unknown): RequestedTopic[] {
  assertRequestedTopics(value);
  return value;
}

function assertUsageTotals(value: unknown): asserts value is UsageTotals {
  assertRecord(value);
  assertExactKeys(value, [
    "totalInputTokens",
    "totalCachedTokens",
    "totalOutputTokens",
    "totalReasoningTokens",
    "usageDerivedCostUsd",
  ]);
  assertFiniteNumber(value.totalInputTokens, true);
  assertFiniteNumber(value.totalCachedTokens, true);
  assertFiniteNumber(value.totalOutputTokens, true);
  assertFiniteNumber(value.totalReasoningTokens, true);
  assertFiniteNumber(value.usageDerivedCostUsd, false);
}

function assertDraft(
  value: unknown,
): asserts value is {
  text: string;
  policy: "required_now" | "later_only";
  use_timing: "now" | "later";
} {
  assertRecord(value);
  assertExactKeys(value, ["text", "policy", "use_timing"]);
  assertString(value.text);
  assertOneOf(value.policy, draftPolicies);
  assertOneOf(value.use_timing, draftTimings);
  if (
    (value.policy === "required_now" && value.use_timing !== "now") ||
    (value.policy === "later_only" && value.use_timing !== "later")
  ) {
    invalid();
  }
}

function assertDraftPolicy(decision: Decision, draft: unknown) {
  if (draft !== null) assertDraft(draft);
  if (decision === "reply_now" || decision === "send_now") {
    if (draft === null || draft.policy !== "required_now" || draft.use_timing !== "now") {
      invalid();
    }
    return;
  }
  if (decision === "pause_additional_contact" && draft !== null) invalid();
  if (
    decision === "wait_and_reassess" &&
    draft !== null &&
    (draft.policy !== "later_only" || draft.use_timing !== "later")
  ) {
    invalid();
  }
}

function assertPossibleInterpretation(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["statement", "supporting_fact_ids", "epistemic_status"]);
  assertString(value.statement);
  assertFactIds(value.supporting_fact_ids);
  if (value.epistemic_status !== "possibility_only") invalid();
}

function assertChangeCondition(value: unknown, split: boolean) {
  assertRecord(value);
  assertExactKeys(
    value,
    split
      ? ["condition", "resulting_direction", "supporting_fact_ids"]
      : ["condition", "resulting_direction"],
  );
  assertString(value.condition);
  decodeDecisionCode(value.resulting_direction);
  if (split) assertFactIds(value.supporting_fact_ids);
}

function assertReviewTiming(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["when", "trigger_fact_ids"]);
  assertString(value.when);
  assertFactIds(value.trigger_fact_ids);
}

function assertLegacyDecisionPlan(value: unknown): asserts value is DecisionPlan {
  assertRecord(value);
  assertExactKeys(value, [
    "schema_version",
    "selected_decision",
    "decision_reason_fact_ids",
    "possible_interpretations",
    "actions_to_take",
    "actions_to_avoid",
    "message_draft",
    "three_day_plan",
    "change_conditions",
    "review_timing",
    "material_unknowns",
    "limitations",
  ]);
  if (value.schema_version !== "pipeline-schema-v1.0.0") invalid();
  const decision = decodeDecisionCode(value.selected_decision);
  assertFactIds(value.decision_reason_fact_ids);
  assertObjectArray(value.possible_interpretations, assertPossibleInterpretation, 0, 5);
  assertStringArray(value.actions_to_take, { minimum: 1, maximum: 8, unique: true });
  assertStringArray(value.actions_to_avoid, { minimum: 1, maximum: 8, unique: true });
  assertDraftPolicy(decision, value.message_draft);
  assertObjectArray(
    value.three_day_plan,
    (item) => {
      assertRecord(item);
      assertExactKeys(item, ["day", "action", "avoid"]);
      assertOneOf(item.day, ["tonight", "next_day", "day_three"] as const);
      assertString(item.action);
      assertString(item.avoid);
    },
    3,
    3,
  );
  if (
    value.three_day_plan[0].day !== "tonight" ||
    value.three_day_plan[1].day !== "next_day" ||
    value.three_day_plan[2].day !== "day_three"
  ) {
    invalid();
  }
  assertObjectArray(
    value.change_conditions,
    (item) => assertChangeCondition(item, false),
    1,
    8,
  );
  assertReviewTiming(value.review_timing);
  assertStringArray(value.material_unknowns, { maximum: 12, unique: true });
  assertStringArray(value.limitations, { minimum: 1, maximum: 8, unique: true });
}

const styleDimensions = [
  "register",
  "sentence_length",
  "sentence_ending",
  "punctuation",
  "emoji_usage",
  "exclamation_usage",
  "softness",
  "directness",
  "invitation_style",
  "reply_pressure",
] as const;
const styleChanges = [
  "preserved",
  "lightly_adjusted",
  "materially_adjusted",
  "unresolved",
] as const;
const changeReasons = [
  "no_change_needed",
  "typo_correction",
  "naturalness",
  "reduce_over_explanation",
  "reduce_excessive_apology",
  "reduce_pressure",
  "answer_incoming_question",
  "respect_user_constraint",
  "respect_relationship_or_hierarchy",
  "safety_or_boundary",
  "other",
] as const;
const intentDeltas = ["decreased", "unchanged", "increased", "unresolved"] as const;
const presenceDeltas = [
  "removed",
  "unchanged_absent",
  "unchanged_present",
  "added",
  "unresolved",
] as const;

function assertCommunicativeIntentDelta(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, [
    "gratitude_change",
    "apology_change",
    "question_count_delta",
    "invitation_presence_delta",
    "invitation_specificity_delta",
    "affection_strength_delta",
    "commitment_strength_delta",
    "response_pressure_delta",
    "boundary_strength_delta",
    "closure_intent_delta",
    "practical_requirement_fulfillment",
  ]);
  assertOneOf(value.gratitude_change, intentDeltas);
  assertOneOf(value.apology_change, intentDeltas);
  if (
    value.question_count_delta !== null &&
    (typeof value.question_count_delta !== "number" ||
      !Number.isInteger(value.question_count_delta))
  ) {
    invalid();
  }
  assertOneOf(value.invitation_presence_delta, presenceDeltas);
  assertOneOf(value.invitation_specificity_delta, intentDeltas);
  assertOneOf(value.affection_strength_delta, intentDeltas);
  assertOneOf(value.commitment_strength_delta, intentDeltas);
  assertOneOf(value.response_pressure_delta, intentDeltas);
  assertOneOf(value.boundary_strength_delta, intentDeltas);
  assertOneOf(value.closure_intent_delta, presenceDeltas);
  assertOneOf(
    value.practical_requirement_fulfillment,
    [
      "fulfilled",
      "partially_fulfilled",
      "unfulfilled",
      "not_applicable",
      "unresolved",
    ] as const,
  );
}

function assertDraftEditMetadata(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, [
    "source_status",
    "preserved_meaning",
    "style_delta",
    "communicative_intent_delta",
    "change_reasons",
    "change_summary",
  ]);
  assertOneOf(
    value.source_status,
    [
      "generated_without_candidate",
      "candidate_preserved",
      "candidate_minimally_edited",
      "candidate_materially_corrected_for_safety_or_boundary",
    ] as const,
  );
  assertBoolean(value.preserved_meaning);
  assertObjectArray(
    value.style_delta,
    (item) => {
      assertRecord(item);
      assertExactKeys(item, ["dimension", "change", "reason"]);
      assertOneOf(item.dimension, styleDimensions);
      assertOneOf(item.change, styleChanges);
      assertOneOf(item.reason, changeReasons);
    },
    0,
    10,
  );
  assertCommunicativeIntentDelta(value.communicative_intent_delta);
  assertArray(value.change_reasons);
  if (value.change_reasons.length > 8) invalid();
  for (const reason of value.change_reasons) assertOneOf(reason, changeReasons);
  if (new Set(value.change_reasons).size !== value.change_reasons.length) invalid();
  assertString(value.change_summary, { nullable: true, nonEmpty: false });
}

function assertSplitDecisionPlan(
  value: unknown,
): asserts value is SplitDecisionPlanV2 {
  assertRecord(value);
  assertExactKeys(value, [
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
  ]);
  if (value.schema_version !== "pipeline-schema-v2.0.0") invalid();
  const decision = decodeDecisionCode(value.selected_decision);
  assertFactIds(value.decision_reason_fact_ids);
  assertObjectArray(value.possible_interpretations, assertPossibleInterpretation, 0, 3);
  assertRecord(value.pre_action_check);
  assertExactKeys(value.pre_action_check, ["check", "supporting_fact_ids"]);
  assertString(value.pre_action_check.check);
  assertFactIds(value.pre_action_check.supporting_fact_ids);
  assertStringArray(value.actions_to_take, { minimum: 1, maximum: 4, unique: true });
  assertStringArray(value.actions_to_avoid, { minimum: 1, maximum: 4, unique: true });
  assertDraftPolicy(decision, value.recommended_message_draft);
  if (value.recommended_message_draft === null) {
    if (value.message_draft_edit_metadata !== null) invalid();
  } else {
    assertDraftEditMetadata(value.message_draft_edit_metadata);
  }
  assertObjectArray(
    value.aftercare_plan,
    (item) => {
      assertRecord(item);
      assertExactKeys(item, ["phase", "action", "avoid", "supporting_fact_ids"]);
      assertOneOf(item.phase, ["tonight", "next", "reassessment_condition"] as const);
      assertString(item.action);
      assertString(item.avoid, { nullable: true });
      assertFactIds(item.supporting_fact_ids);
    },
    0,
    3,
  );
  const phases = value.aftercare_plan.map((item) => item.phase);
  if (new Set(phases).size !== phases.length) invalid();
  assertObjectArray(
    value.change_conditions,
    (item) => assertChangeCondition(item, true),
    0,
    4,
  );
  assertReviewTiming(value.review_timing);
  assertObjectArray(
    value.material_unknowns,
    (item) => {
      assertRecord(item);
      assertExactKeys(item, ["unknown_code", "summary", "material_to"]);
      assertString(item.unknown_code, { pattern: /^[a-z][a-z0-9_]+$/u });
      assertString(item.summary);
      assertOneOf(item.material_to, ["decision", "draft", "action", "safety"] as const);
    },
    0,
    4,
  );
  assertStringArray(value.model_generated_limitations, {
    maximum: 2,
    unique: true,
  });
}

function assertObservedFactCommentary(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["fact_id", "commentary"]);
  assertString(value.fact_id, { pattern: factIdPattern });
  assertString(value.commentary);
}

function assertMessageTemperature(value: unknown) {
  assertRecord(value);
  assertExactKeys(value, ["softness", "affection", "pressure", "adjustment"]);
  assertString(value.softness);
  assertString(value.affection);
  assertString(value.pressure);
  assertString(value.adjustment);
}

function assertLegacyReportContent(value: unknown): asserts value is ReportContent {
  assertRecord(value);
  assertExactKeys(value, [
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
    "three_day_plan_commentary",
    "change_condition_commentary",
    "unknowns_commentary",
    "closing_lines",
  ]);
  if (value.schema_version !== "pipeline-schema-v1.0.0") invalid();
  assertString(value.cover_line);
  assertStringArray(value.short_letter, { minimum: 1, maximum: 3 });
  assertString(value.decision_reason_summary);
  assertString(value.relationship_summary);
  assertObjectArray(value.observed_fact_commentary, assertObservedFactCommentary, 0, 8);
  assertStringArray(value.possible_interpretations, { maximum: 3 });
  assertStringArray(value.anxiety_reframe, { maximum: 2 });
  assertMessageTemperature(value.message_temperature);
  assertStringArray(value.action_rationales, { maximum: 4 });
  assertString(value.message_draft_context, { nullable: true });
  assertStringArray(value.three_day_plan_commentary, { minimum: 3, maximum: 3 });
  assertStringArray(value.change_condition_commentary, { maximum: 8 });
  assertStringArray(value.unknowns_commentary, { maximum: 12 });
  assertStringArray(value.closing_lines, { minimum: 1, maximum: 2 });
}

function assertSplitReportContent(
  value: unknown,
): asserts value is SplitReportContentV2 {
  assertRecord(value);
  assertExactKeys(value, [
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
  ]);
  if (value.schema_version !== "pipeline-schema-v2.0.0") invalid();
  assertString(value.cover_line);
  assertStringArray(value.short_letter, { minimum: 1, maximum: 3 });
  assertString(value.decision_reason_summary);
  assertString(value.relationship_summary, { nullable: true });
  assertObjectArray(value.observed_fact_commentary, assertObservedFactCommentary, 0, 8);
  assertStringArray(value.possible_interpretations, { maximum: 3 });
  assertStringArray(value.anxiety_reframe, { maximum: 2 });
  if (value.message_temperature !== null) {
    assertMessageTemperature(value.message_temperature);
  }
  assertStringArray(value.action_rationales, { maximum: 4 });
  assertString(value.message_draft_context, { nullable: true });
  assertStringArray(value.aftercare_commentary, { maximum: 3 });
  assertStringArray(value.change_condition_commentary, { maximum: 4 });
  assertStringArray(value.closing_lines, { minimum: 1, maximum: 2 });
}

function assertRuntimeReport(
  value: unknown,
): asserts value is RuntimeReport | SplitRuntimeReportV1 {
  assertRecord(value);
  assertExactKeys(value, ["schemaVersion", "decisionPlan", "content", "fixedLimitation"]);
  assertString(value.fixedLimitation);
  if (value.schemaVersion === "m2-p3-runtime-report-v1") {
    assertLegacyDecisionPlan(value.decisionPlan);
    assertLegacyReportContent(value.content);
    return;
  }
  if (value.schemaVersion === "m2-p4-split-runtime-report-v1") {
    assertSplitDecisionPlan(value.decisionPlan);
    assertSplitReportContent(value.content);
    return;
  }
  invalid();
}

export function decodeRuntimeReport(
  value: unknown,
): RuntimeReport | SplitRuntimeReportV1 {
  assertRuntimeReport(value);
  return value;
}

function assertDecisionCard(value: unknown): asserts value is DecisionCard {
  assertRecord(value);
  assertExactKeys(value, [
    "schemaVersion",
    "decision",
    "reason",
    "actionsToTake",
    "actionsToAvoid",
    "messageDraft",
    "reviewTiming",
  ]);
  if (value.schemaVersion !== "m2-p3-decision-card-v1") invalid();
  decodeDecisionCode(value.decision);
  assertString(value.reason);
  assertStringArray(value.actionsToTake, { minimum: 1, maximum: 8 });
  assertStringArray(value.actionsToAvoid, { minimum: 1, maximum: 8 });
  assertString(value.messageDraft, { nullable: true });
  assertString(value.reviewTiming);
}

export function decodeDecisionCard(value: unknown): DecisionCard {
  assertDecisionCard(value);
  return value;
}

function sameStrings(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function assertReadyResult(value: unknown): asserts value is ReadyAssessmentResult {
  assertRecord(value);
  assertExactKeys(
    value,
    [
      "requestId",
      "runId",
      "eligibility",
      "decision",
      "report",
      "decisionCard",
      "duplicate",
      "usage",
    ],
    ["authoritativeRequestedTopics"],
  );
  assertString(value.requestId);
  assertString(value.runId);
  if (value.eligibility !== "ready") invalid();
  const decision = decodeDecisionCode(value.decision);
  assertRuntimeReport(value.report);
  assertDecisionCard(value.decisionCard);
  assertBoolean(value.duplicate);
  assertUsageTotals(value.usage);
  if (value.authoritativeRequestedTopics !== undefined) {
    assertRequestedTopics(value.authoritativeRequestedTopics);
  }
  if (value.duplicate && value.authoritativeRequestedTopics === undefined) {
    invalid();
  }

  const plan = value.report.decisionPlan;
  const content = value.report.content;
  const sourceDraft =
    value.report.schemaVersion === "m2-p3-runtime-report-v1"
      ? value.report.decisionPlan.message_draft
      : value.report.decisionPlan.recommended_message_draft;
  if (
    decision !== plan.selected_decision ||
    value.decisionCard.decision !== decision ||
    value.decisionCard.reason !== content.decision_reason_summary ||
    !sameStrings(value.decisionCard.actionsToTake, plan.actions_to_take) ||
    !sameStrings(value.decisionCard.actionsToAvoid, plan.actions_to_avoid) ||
    value.decisionCard.messageDraft !== (sourceDraft?.text ?? null) ||
    value.decisionCard.reviewTiming !== plan.review_timing.when
  ) {
    invalid();
  }
}

function assertStoppedResult(value: unknown): asserts value is AssessmentExecutionResult {
  assertRecord(value);
  assertExactKeys(value, [
    "requestId",
    "runId",
    "eligibility",
    "questionCodes",
    "duplicate",
    "usage",
  ]);
  assertString(value.requestId);
  assertString(value.runId);
  assertOneOf(value.eligibility, ["safety_blocked", "needs_more_information"] as const);
  assertStringArray(value.questionCodes, { maximum: 3, unique: true });
  if (value.eligibility === "safety_blocked" && value.questionCodes.length !== 0) {
    invalid();
  }
  assertBoolean(value.duplicate);
  assertUsageTotals(value.usage);
}

function assertAssessmentExecutionResult(
  value: unknown,
): asserts value is AssessmentExecutionResult {
  assertRecord(value);
  if (value.eligibility === "ready") {
    assertReadyResult(value);
    return;
  }
  if (
    value.eligibility === "safety_blocked" ||
    value.eligibility === "needs_more_information"
  ) {
    assertStoppedResult(value);
    return;
  }
  invalid();
}

export function decodeAssessmentExecutionResult(
  value: unknown,
): AssessmentExecutionResult {
  assertAssessmentExecutionResult(value);
  return value;
}

export function hydratePersistedReadyAssessmentV1(record: {
  requestId: unknown;
  runId: unknown;
  decision: unknown;
  reportJson: unknown;
  decisionCardJson: unknown;
  authoritativeRequestedTopics: unknown;
  usage: unknown;
}): ReadyAssessmentResult {
  const decoded = decodeAssessmentExecutionResult({
    requestId: record.requestId,
    runId: record.runId,
    eligibility: "ready",
    decision: record.decision,
    report: record.reportJson,
    decisionCard: record.decisionCardJson,
    authoritativeRequestedTopics: record.authoritativeRequestedTopics,
    duplicate: false,
    usage: record.usage,
  });
  if (decoded.eligibility !== "ready") invalid("M2_PERSISTED_RESULT_INVALID");
  return decoded;
}

export function requireReadyAssessmentResult(
  value: unknown,
): ReadyAssessmentResult {
  const decoded = decodeAssessmentExecutionResult(value);
  if (decoded.eligibility !== "ready") invalid();
  return decoded;
}
