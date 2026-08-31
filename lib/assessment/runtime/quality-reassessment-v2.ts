import { M2RuntimeError } from "./errors.ts";
import {
  QUALITY_REASSESSMENT_FINDING_CODES,
  QUALITY_REASSESSMENT_REPAIR_REQUIREMENT_BY_FINDING_CODE,
  buildQualityReassessmentDirectiveV1,
  type QualityReassessmentDefectV1,
  type QualityReassessmentFindingCode,
  type QualityReassessmentSeverity,
} from "./quality-reassessment-v1.ts";
import type { JsonObject, SplitDecisionPlanV2, SplitReportContentV2 } from "./types.ts";

export const QUALITY_REASSESSMENT_DIRECTIVE_V2_SCHEMA_VERSION =
  "m2-p4-quality-reassessment-directive-v2" as const;
export const QUALITY_REASSESSMENT_V2_ATTEMPT_NUMBER = 2 as const;
export const QUALITY_REASSESSMENT_V2_MAX_DEFECTS = 24 as const;

export const PAID_QUALITY_SOFT_FINDING_CODES_V1 = [
  "TEMPLATE_GENERICITY",
  "BRAND_TONE",
  "REPETITION",
] as const;

export type PaidQualityReassessmentExhaustionDispositionV1 =
  | "deliver_latest_valid_candidate"
  | "fail_closed";

export type ProductQualityDefectV2 = {
  findingCode:
    | QualityReassessmentFindingCode
    | "PRODUCT_SEMANTIC_SHAPE"
    | "DRAFT_SOURCE_INTEGRITY"
    | "CUSTOMER_SURFACE_INTEGRITY";
  severity: QualityReassessmentSeverity;
  jsonPath: string;
  normalizedRepairRequirementCode: string;
  ownership: "plan" | "report";
};

export type QualityReassessmentDirectiveV2 = {
  schemaVersion: typeof QUALITY_REASSESSMENT_DIRECTIVE_V2_SCHEMA_VERSION;
  attemptNumber: typeof QUALITY_REASSESSMENT_V2_ATTEMPT_NUMBER;
  scope: "report_only" | "plan_and_report";
  source: "combined_product_quality";
  defects: Array<Omit<ProductQualityDefectV2, "ownership">>;
};

const paidQualityKnownFindingCodes = new Set<string>([
  ...QUALITY_REASSESSMENT_FINDING_CODES,
  "PRODUCT_SEMANTIC_SHAPE",
  "DRAFT_SOURCE_INTEGRITY",
  "CUSTOMER_SURFACE_INTEGRITY",
]);
const paidQualityKnownSeverities = new Set<string>([
  "critical",
  "major",
  "minor",
]);
const ownedProductPath = /^(?:decision_plan|report_content)(?:\.|\[|$)/u;
const currentDecisionPath =
  /^decision_plan\.selected_decision$/u;
const currentActionPath =
  /^decision_plan\.(?:pre_action_check(?:\.|$)|actions_to_(?:take|avoid)(?:\[|$)|aftercare_plan(?:\[|$)|change_conditions(?:\[|$))/u;
const executableDraftPath =
  /^decision_plan\.recommended_message_draft(?:$|\.(?:text|policy|use_timing)$)/u;
const localDraftSourceRepairRequirements = new Set<string>([
  "RESTORE_CANDIDATE_SOURCE_OWNERSHIP",
  "RESTORE_TRUTHFUL_GENERATED_DRAFT_METADATA",
  "REMOVE_UNAUTHORIZED_GENERATED_DRAFT",
  "RESTORE_CANDIDATE_MEANING_OWNERSHIP",
  "RESTORE_BYTE_EXACT_CANDIDATE",
]);

type ClassifiedPaidQualityDefectV2 =
  QualityReassessmentDirectiveV2["defects"][number];

function normalizeClassifierPath(value: string) {
  return value.startsWith("$.") ? value.slice(2) : value;
}

function isMajorOrCritical(severity: QualityReassessmentSeverity) {
  return severity === "major" || severity === "critical";
}

function hasExpectedRepairRequirement(defect: ClassifiedPaidQualityDefectV2) {
  if (
    QUALITY_REASSESSMENT_FINDING_CODES.includes(
      defect.findingCode as QualityReassessmentFindingCode,
    )
  ) {
    return (
      defect.normalizedRepairRequirementCode ===
      QUALITY_REASSESSMENT_REPAIR_REQUIREMENT_BY_FINDING_CODE[
        defect.findingCode as QualityReassessmentFindingCode
      ]
    );
  }
  if (defect.findingCode === "PRODUCT_SEMANTIC_SHAPE") {
    return (
      defect.normalizedRepairRequirementCode ===
      "REBUILD_REPORT_SEMANTIC_SHAPE"
    );
  }
  if (defect.findingCode === "CUSTOMER_SURFACE_INTEGRITY") {
    return (
      defect.normalizedRepairRequirementCode ===
      "REMOVE_INTERNAL_IMPLEMENTATION_LANGUAGE"
    );
  }
  return (
    defect.findingCode === "DRAFT_SOURCE_INTEGRITY" &&
    localDraftSourceRepairRequirements.has(
      defect.normalizedRepairRequirementCode,
    )
  );
}

function isPaidQualityNonDeliverableDefectR2(
  defect: ClassifiedPaidQualityDefectV2,
) {
  const path = normalizeClassifierPath(defect.jsonPath);
  if (
    !paidQualityKnownFindingCodes.has(defect.findingCode) ||
    !paidQualityKnownSeverities.has(defect.severity) ||
    !ownedProductPath.test(path) ||
    !hasExpectedRepairRequirement(defect)
  ) {
    return true;
  }

  if (defect.findingCode === "SAFETY_REGRESSION") {
    return true;
  }
  if (
    defect.findingCode === "DECISION_ALLOWED" &&
    !currentDecisionPath.test(path)
  ) {
    return true;
  }
  if (
    defect.findingCode === "DECISION_ALLOWED" &&
    isMajorOrCritical(defect.severity)
  ) {
    return true;
  }
  if (
    defect.findingCode === "FACT_FIDELITY" &&
    defect.severity === "critical" &&
    ownedProductPath.test(path)
  ) {
    return true;
  }
  if (
    defect.findingCode === "MESSAGE_POLICY_CONSISTENCY" &&
    defect.severity === "critical" &&
    executableDraftPath.test(path)
  ) {
    return true;
  }
  if (
    defect.findingCode === "ACTION_CONSISTENCY" &&
    defect.severity === "critical" &&
    currentActionPath.test(path)
  ) {
    return true;
  }
  if (
    defect.findingCode === "REQUIRED_SECTION_MEANING" &&
    defect.severity === "critical" &&
    ownedProductPath.test(path)
  ) {
    return true;
  }
  return false;
}

export function classifyPaidQualityReassessmentExhaustionV1(
  directive: QualityReassessmentDirectiveV2,
): PaidQualityReassessmentExhaustionDispositionV1 {
  if (directive.defects.length === 0) return "fail_closed";
  return directive.defects.some(isPaidQualityNonDeliverableDefectR2)
    ? "fail_closed"
    : "deliver_latest_valid_candidate";
}

function normalizedPath(value: unknown) {
  if (typeof value !== "string" || value.length === 0 || value.length > 300) {
    return null;
  }
  return value.startsWith("$.") ? value.slice(2) : value;
}

function mapApplicationOwnedFinding(finding: JsonObject): JsonObject | null {
  const path = normalizedPath(finding.json_path);
  if (path === null || path === "report_content.relationship_summary") {
    return null;
  }
  const commentary =
    /^report_content\.change_condition_commentary\[(0|[1-9]\d*)\]$/u.exec(
      path,
    );
  if (commentary === null) return { ...finding, json_path: path };
  return {
    ...finding,
    json_path: `decision_plan.change_conditions[${commentary[1]}]`,
  };
}

function sortKey(defect: Omit<ProductQualityDefectV2, "ownership">) {
  return [
    defect.jsonPath,
    defect.findingCode,
    defect.severity,
    defect.normalizedRepairRequirementCode,
  ].join("\u0000");
}

export function localSemanticShapeDefectV2(): ProductQualityDefectV2 {
  return {
    findingCode: "PRODUCT_SEMANTIC_SHAPE",
    severity: "major",
    jsonPath: "report_content",
    normalizedRepairRequirementCode: "REBUILD_REPORT_SEMANTIC_SHAPE",
    ownership: "report",
  };
}

export function buildCombinedProductQualityDirectiveV2(input: {
  blockingFindings: JsonObject[];
  localDefects: ProductQualityDefectV2[];
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}): QualityReassessmentDirectiveV2 | null {
  const defects: ProductQualityDefectV2[] = [];
  if (input.blockingFindings.length > 0) {
    const mapped = input.blockingFindings.map(mapApplicationOwnedFinding);
    if (mapped.some((finding) => finding === null)) return null;
    const semanticDirective = buildQualityReassessmentDirectiveV1({
      blockingFindings: mapped.filter((finding) => finding !== null),
      decisionPlan: input.decisionPlan,
      reportContent: input.reportContent,
    });
    if (semanticDirective === null) return null;
    defects.push(
      ...semanticDirective.defects.map((defect: QualityReassessmentDefectV1) => ({
        ...defect,
        ownership: defect.jsonPath.startsWith("decision_plan.")
          ? ("plan" as const)
          : ("report" as const),
      })),
    );
  }
  defects.push(...input.localDefects.map((defect) => structuredClone(defect)));
  if (defects.length === 0 || defects.length > QUALITY_REASSESSMENT_V2_MAX_DEFECTS) {
    return null;
  }
  const deduplicated = new Map<string, ProductQualityDefectV2>();
  for (const defect of defects) {
    if (
      !defect.jsonPath ||
      defect.jsonPath.length > 300 ||
      (defect.ownership === "plan") !==
        defect.jsonPath.startsWith("decision_plan")
    ) {
      return null;
    }
    const exposed = {
      findingCode: defect.findingCode,
      severity: defect.severity,
      jsonPath: defect.jsonPath,
      normalizedRepairRequirementCode: defect.normalizedRepairRequirementCode,
    };
    deduplicated.set(sortKey(exposed), defect);
  }
  const normalized = [...deduplicated.values()].sort((left, right) =>
    sortKey(left).localeCompare(sortKey(right)),
  );
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V2_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_V2_ATTEMPT_NUMBER,
    scope: normalized.some((defect) => defect.ownership === "plan")
      ? "plan_and_report"
      : "report_only",
    source: "combined_product_quality",
    defects: normalized.map((defect) => ({
      findingCode: defect.findingCode,
      severity: defect.severity,
      jsonPath: defect.jsonPath,
      normalizedRepairRequirementCode:
        defect.normalizedRepairRequirementCode,
    })),
  };
}

export class QualityReassessmentRequiredSignalV2 extends M2RuntimeError {
  readonly directive: QualityReassessmentDirectiveV2;

  constructor(directive: QualityReassessmentDirectiveV2) {
    super("M2_PRODUCT_QUALITY_REASSESSMENT_REQUIRED");
    this.name = "QualityReassessmentRequiredSignalV2";
    this.directive = structuredClone(directive);
  }
}

export function isQualityReassessmentRequiredSignalV2(
  error: unknown,
): error is QualityReassessmentRequiredSignalV2 {
  return error instanceof QualityReassessmentRequiredSignalV2;
}
