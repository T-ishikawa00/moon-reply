import { M2RuntimeError } from "./errors.ts";
import {
  decodeCustomerAssessmentProjectionV1,
  projectCustomerAssessmentV1,
  type CustomerAssessmentProjectionV1,
} from "./customer-assessment-projection-v1.ts";
import { requireReadyAssessmentResult } from "./runtime-result-normalization-v1.ts";

export const CUSTOMER_ASSESSMENT_EXPERIENCE_PROJECTION_SCHEMA_VERSION =
  "customer-assessment-experience-projection-v2" as const;

export type CustomerAssessmentExperienceProjectionV2 = {
  projectionSchemaVersion:
    typeof CUSTOMER_ASSESSMENT_EXPERIENCE_PROJECTION_SCHEMA_VERSION;
  baseProjection: CustomerAssessmentProjectionV1;
  openingLine: string;
  openingLetter: string[];
  situationReading: string[];
  possibleInterpretations: string[];
  materialUnknowns: string[];
  draftContext: string | null;
  actionRationales: string[];
  closingLines: string[];
  consultationLimitations: string[];
};

const topLevelKeys = [
  "projectionSchemaVersion",
  "baseProjection",
  "openingLine",
  "openingLetter",
  "situationReading",
  "possibleInterpretations",
  "materialUnknowns",
  "draftContext",
  "actionRationales",
  "closingLines",
  "consultationLimitations",
] as const;

const forbiddenKeys = new Set([
  "case_id",
  "caseId",
  "fixture_id",
  "fixtureId",
  "request_id",
  "requestId",
  "run_id",
  "runId",
  "provider_response_id",
  "providerResponseId",
  "response_id",
  "responseId",
  "usage",
  "diagnostic_verdict",
  "diagnosticVerdict",
  "machine_verdict",
  "machineVerdict",
  "stage",
  "stages",
  "stage_data",
  "stageData",
  "fact_id",
  "factId",
  "decision_reason_fact_ids",
  "supporting_fact_ids",
  "trigger_fact_ids",
  "unknown_code",
  "material_to",
  "report",
]);

const factIdPattern = /F[0-9]{3}/u;
const decisionCodePattern =
  /(?:reply_now|send_now|wait_and_reassess|pause_additional_contact)/u;

function projectionInvalid(): never {
  throw new M2RuntimeError("M2_CUSTOMER_EXPERIENCE_PROJECTION_INVALID");
}

function assertRecord(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    projectionInvalid();
  }
}

function assertExactTopLevelKeys(value: Record<string, unknown>) {
  const actual = Object.keys(value);
  const expected = new Set<string>(topLevelKeys);
  if (
    actual.length !== topLevelKeys.length ||
    topLevelKeys.some((key) => !Object.prototype.hasOwnProperty.call(value, key)) ||
    actual.some((key) => !expected.has(key))
  ) {
    projectionInvalid();
  }
}

function assertNoForbiddenKeys(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenKeys);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) projectionInvalid();
    assertNoForbiddenKeys(child);
  }
}

function assertText(value: unknown, customerFacing = true): asserts value is string {
  if (typeof value !== "string" || value.length === 0) projectionInvalid();
  if (
    customerFacing &&
    (factIdPattern.test(value) || decisionCodePattern.test(value))
  ) {
    projectionInvalid();
  }
}

function assertTexts(
  value: unknown,
  minimum: number,
  maximum: number,
): asserts value is string[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    projectionInvalid();
  }
  value.forEach((item) => assertText(item));
}

function assertBaseProjectionCustomerTexts(
  value: CustomerAssessmentProjectionV1,
) {
  assertText(value.primaryReason);
  if (value.finalDraft !== null) assertText(value.finalDraft.text);
  assertText(value.immediateAction.action);
  value.immediateAction.avoid.forEach((item) => assertText(item));
  value.immediateAction.secondaryActions.forEach((item) => assertText(item));
  assertText(value.reassessment.when);
  value.reassessment.conditions.forEach((item) => assertText(item.condition));
  if (value.relationshipSummary !== null) assertText(value.relationshipSummary);
  if (value.messageTemperature !== null) {
    assertText(value.messageTemperature.softness);
    assertText(value.messageTemperature.affection);
    assertText(value.messageTemperature.pressure);
    assertText(value.messageTemperature.adjustment);
  }
  value.optionalDetails.interpretations?.forEach((item) => assertText(item));
  value.optionalDetails.shortLetter?.forEach((item) => assertText(item));
  value.optionalDetails.anxietyReframe?.forEach((item) => assertText(item));
  value.optionalDetails.expandedPlan?.forEach((item) => {
    assertText(item.action);
    if (item.avoid !== null) assertText(item.avoid);
  });
  value.optionalDetails.planCommentary?.forEach((item) => assertText(item));
  assertText(value.fixedLimitation);
}

export function projectCustomerAssessmentExperienceV2(
  readyResult: unknown,
  authoritativeRequestedTopics: unknown,
): CustomerAssessmentExperienceProjectionV2 {
  const decoded = requireReadyAssessmentResult(readyResult);
  const baseProjection = projectCustomerAssessmentV1(
    decoded,
    authoritativeRequestedTopics,
  );
  const report = decoded.report;
  const reasonFactIds = new Set(report.decisionPlan.decision_reason_fact_ids);

  const projection: CustomerAssessmentExperienceProjectionV2 = {
    projectionSchemaVersion:
      CUSTOMER_ASSESSMENT_EXPERIENCE_PROJECTION_SCHEMA_VERSION,
    baseProjection,
    openingLine: report.content.cover_line,
    openingLetter: [...report.content.short_letter],
    situationReading: report.content.observed_fact_commentary
      .filter((item) => reasonFactIds.has(item.fact_id))
      .map((item) => item.commentary),
    possibleInterpretations: [...report.content.possible_interpretations],
    materialUnknowns:
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? [...report.decisionPlan.material_unknowns]
        : report.decisionPlan.material_unknowns.map((item) => item.summary),
    draftContext: report.content.message_draft_context,
    actionRationales: [...report.content.action_rationales],
    closingLines: [...report.content.closing_lines],
    consultationLimitations:
      report.schemaVersion === "m2-p3-runtime-report-v1"
        ? [...report.decisionPlan.limitations]
        : [...report.decisionPlan.model_generated_limitations],
  };
  return decodeCustomerAssessmentExperienceProjectionV2(projection);
}

function assertCustomerAssessmentExperienceProjectionV2(
  value: unknown,
): asserts value is CustomerAssessmentExperienceProjectionV2 {
  assertRecord(value);
  assertExactTopLevelKeys(value);
  assertNoForbiddenKeys(value);

  if (
    value.projectionSchemaVersion !==
    CUSTOMER_ASSESSMENT_EXPERIENCE_PROJECTION_SCHEMA_VERSION
  ) {
    projectionInvalid();
  }

  const baseProjection = decodeCustomerAssessmentProjectionV1(
    value.baseProjection,
  );
  assertBaseProjectionCustomerTexts(baseProjection);
  assertText(value.openingLine);
  assertTexts(value.openingLetter, 1, 3);
  assertTexts(value.situationReading, 0, 8);
  assertTexts(value.possibleInterpretations, 0, 3);
  if (value.draftContext !== null) assertText(value.draftContext);
  assertTexts(value.actionRationales, 0, 4);
  assertTexts(value.closingLines, 1, 2);

  if (baseProjection.sourceReportSchemaVersion === "m2-p3-runtime-report-v1") {
    assertTexts(value.materialUnknowns, 0, 12);
    assertTexts(value.consultationLimitations, 1, 8);
    return;
  }
  if (
    baseProjection.sourceReportSchemaVersion ===
    "m2-p4-split-runtime-report-v1"
  ) {
    assertTexts(value.materialUnknowns, 0, 4);
    assertTexts(value.consultationLimitations, 0, 2);
    return;
  }
  projectionInvalid();
}

export function decodeCustomerAssessmentExperienceProjectionV2(
  value: unknown,
): CustomerAssessmentExperienceProjectionV2 {
  assertCustomerAssessmentExperienceProjectionV2(value);
  return value;
}
