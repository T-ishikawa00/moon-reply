import { M2RuntimeError } from "./errors.ts";
import type { JsonObject } from "./types.ts";

export const QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION =
  "m2-p4-quality-reassessment-directive-v1" as const;
export const QUALITY_REASSESSMENT_ATTEMPT_NUMBER = 2 as const;
export const QUALITY_REASSESSMENT_MAX_DEFECTS = 12 as const;

export const QUALITY_REASSESSMENT_FINDING_CODES = [
  "FACT_FIDELITY",
  "ASSUMPTION_AS_FACT",
  "DECISION_ALLOWED",
  "DECISION_REASON_SUPPORT",
  "MESSAGE_POLICY_CONSISTENCY",
  "ACTION_CONSISTENCY",
  "THREE_DAY_PLAN_CONSISTENCY",
  "UNSUPPORTED_CERTAINTY",
  "SAFETY_REGRESSION",
  "REQUIRED_SECTION_MEANING",
  "REVIEW_CONDITION_PRESENT",
  "TEMPLATE_GENERICITY",
  "BRAND_TONE",
  "REPETITION",
] as const;

export type QualityReassessmentFindingCode =
  (typeof QUALITY_REASSESSMENT_FINDING_CODES)[number];
export type QualityReassessmentSeverity = "critical" | "major" | "minor";
export type QualityReassessmentScope = "report_only" | "plan_and_report";
export type QualityReassessmentSource =
  | "pb06_semantic_findings"
  | "local_semantic_shape";

const repairRequirementByFindingCode = {
  FACT_FIDELITY: "RESTORE_FACT_FIDELITY",
  ASSUMPTION_AS_FACT: "REMOVE_UNSUPPORTED_ASSUMPTION",
  DECISION_ALLOWED: "RESTORE_ALLOWED_DECISION",
  DECISION_REASON_SUPPORT: "RESTORE_DECISION_SUPPORT",
  MESSAGE_POLICY_CONSISTENCY: "RESTORE_MESSAGE_POLICY_CONSISTENCY",
  ACTION_CONSISTENCY: "RESTORE_ACTION_CONSISTENCY",
  THREE_DAY_PLAN_CONSISTENCY: "RESTORE_THREE_DAY_PLAN_CONSISTENCY",
  UNSUPPORTED_CERTAINTY: "REMOVE_UNSUPPORTED_CERTAINTY",
  SAFETY_REGRESSION: "RESTORE_SAFETY_COMPLIANCE",
  REQUIRED_SECTION_MEANING: "RESTORE_REQUIRED_SECTION_MEANING",
  REVIEW_CONDITION_PRESENT: "RESTORE_OBSERVABLE_REASSESSMENT",
  TEMPLATE_GENERICITY: "RESTORE_CONSULTATION_SPECIFICITY",
  BRAND_TONE: "RESTORE_BRAND_TONE",
  REPETITION: "RESTORE_DISTINCT_PRODUCT_FUNCTIONS",
} as const satisfies Record<QualityReassessmentFindingCode, string>;

export type QualityReassessmentRepairRequirementCode =
  | (typeof repairRequirementByFindingCode)[QualityReassessmentFindingCode]
  | "REBUILD_REPORT_SEMANTIC_SHAPE";

export type QualityReassessmentDefectV1 = {
  findingCode: QualityReassessmentFindingCode | "PRODUCT_SEMANTIC_SHAPE";
  severity: QualityReassessmentSeverity;
  jsonPath: string;
  normalizedRepairRequirementCode: QualityReassessmentRepairRequirementCode;
};

export type QualityReassessmentDirectiveV1 = {
  schemaVersion: typeof QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION;
  attemptNumber: typeof QUALITY_REASSESSMENT_ATTEMPT_NUMBER;
  scope: QualityReassessmentScope;
  source: QualityReassessmentSource;
  defects: QualityReassessmentDefectV1[];
};

const findingCodes = new Set<string>(QUALITY_REASSESSMENT_FINDING_CODES);
const severities = new Set<string>(["critical", "major", "minor"]);

const reportOwnedPathPatterns = [
  /^report_content\.cover_line$/u,
  /^report_content\.short_letter(?:\[(?:0|[1-9]\d*)\])?$/u,
  /^report_content\.decision_reason_summary$/u,
  /^report_content\.observed_fact_commentary(?:\[(?:0|[1-9]\d*)\](?:\.(?:fact_id|commentary))?)?$/u,
  /^report_content\.possible_interpretations(?:\[(?:0|[1-9]\d*)\])?$/u,
  /^report_content\.anxiety_reframe(?:\[(?:0|[1-9]\d*)\])?$/u,
  /^report_content\.message_temperature(?:\.(?:softness|affection|pressure|adjustment))?$/u,
  /^report_content\.action_rationales(?:\[(?:0|[1-9]\d*)\])?$/u,
  /^report_content\.message_draft_context$/u,
  /^report_content\.aftercare_commentary(?:\[(?:0|[1-9]\d*)\])?$/u,
  /^report_content\.closing_lines(?:\[(?:0|[1-9]\d*)\])?$/u,
] as const;

const planOwnedPathPattern =
  /^decision_plan\.(?:selected_decision|decision_reason_fact_ids|possible_interpretations|pre_action_check|actions_to_take|actions_to_avoid|recommended_message_draft|message_draft_edit_metadata|aftercare_plan|change_conditions|review_timing|material_unknowns|model_generated_limitations)(?:\[(?:0|[1-9]\d*)\]|\.[A-Za-z][A-Za-z0-9_]*|\[(?:0|[1-9]\d*)\]\.[A-Za-z][A-Za-z0-9_]*)*$/u;

function normalizeOwnedJsonPath(value: unknown) {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) {
    return null;
  }
  return value.startsWith("$.") ? value.slice(2) : value;
}

function pathOwnership(path: string): "report" | "plan" | null {
  if (
    path === "report_content.relationship_summary" ||
    path.startsWith("report_content.relationship_summary.") ||
    path === "report_content.change_condition_commentary" ||
    path.startsWith("report_content.change_condition_commentary[")
  ) {
    return null;
  }
  if (reportOwnedPathPatterns.some((pattern) => pattern.test(path))) {
    return "report";
  }
  return planOwnedPathPattern.test(path) ? "plan" : null;
}

function sanitizeFinding(value: JsonObject) {
  const findingCode = value.finding_code;
  const severity = value.severity;
  const jsonPath = normalizeOwnedJsonPath(value.json_path);
  if (
    typeof findingCode !== "string" ||
    !findingCodes.has(findingCode) ||
    typeof severity !== "string" ||
    !severities.has(severity) ||
    jsonPath === null
  ) {
    return null;
  }
  const ownership = pathOwnership(jsonPath);
  if (ownership === null) return null;
  const typedFindingCode = findingCode as QualityReassessmentFindingCode;
  return {
    ownership,
    defect: {
      findingCode: typedFindingCode,
      severity: severity as QualityReassessmentSeverity,
      jsonPath,
      normalizedRepairRequirementCode:
        repairRequirementByFindingCode[typedFindingCode],
    } satisfies QualityReassessmentDefectV1,
  };
}

function defectSortKey(defect: QualityReassessmentDefectV1) {
  return [
    defect.jsonPath,
    defect.findingCode,
    defect.severity,
    defect.normalizedRepairRequirementCode,
  ].join("\u0000");
}

export function buildQualityReassessmentDirectiveV1(
  blockingFindings: JsonObject[],
): QualityReassessmentDirectiveV1 | null {
  if (
    blockingFindings.length === 0 ||
    blockingFindings.length > QUALITY_REASSESSMENT_MAX_DEFECTS
  ) {
    return null;
  }
  const sanitized = blockingFindings.map(sanitizeFinding);
  if (sanitized.some((entry) => entry === null)) return null;
  const entries = sanitized.filter((entry) => entry !== null);
  const deduplicated = new Map<string, QualityReassessmentDefectV1>();
  for (const entry of entries) {
    deduplicated.set(defectSortKey(entry.defect), entry.defect);
  }
  const defects = [...deduplicated.values()].sort((left, right) =>
    defectSortKey(left).localeCompare(defectSortKey(right)),
  );
  if (defects.length === 0 || defects.length > QUALITY_REASSESSMENT_MAX_DEFECTS) {
    return null;
  }
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
    scope: entries.some((entry) => entry.ownership === "plan")
      ? "plan_and_report"
      : "report_only",
    source: "pb06_semantic_findings",
    defects,
  };
}

export function buildLocalSemanticShapeReassessmentDirectiveV1(): QualityReassessmentDirectiveV1 {
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
    scope: "report_only",
    source: "local_semantic_shape",
    defects: [
      {
        findingCode: "PRODUCT_SEMANTIC_SHAPE",
        severity: "major",
        jsonPath: "report_content",
        normalizedRepairRequirementCode: "REBUILD_REPORT_SEMANTIC_SHAPE",
      },
    ],
  };
}

export class QualityReassessmentRequiredSignalV1 extends M2RuntimeError {
  readonly directive: QualityReassessmentDirectiveV1;

  constructor(directive: QualityReassessmentDirectiveV1) {
    super("M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
    this.name = "QualityReassessmentRequiredSignalV1";
    this.directive = structuredClone(directive);
  }
}

export function isQualityReassessmentRequiredSignalV1(
  error: unknown,
): error is QualityReassessmentRequiredSignalV1 {
  return error instanceof QualityReassessmentRequiredSignalV1;
}
