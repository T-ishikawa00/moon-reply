import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveDecisionPolicyV1 } from "./effective-decision-policy-v1.ts";
import { M2RuntimeError } from "./errors.ts";
import type {
  QualityReassessmentDefectV1,
  QualityReassessmentDirectiveV1,
} from "./quality-reassessment-v1.ts";
import {
  QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
  QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
} from "./quality-reassessment-v1.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import {
  REQUESTED_TOPIC_VALUES,
  type RequestedTopic,
  type SplitDecisionPlanV2,
  type SplitReportContentV2,
} from "./types.ts";

export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_V1_SCHEMA_VERSION =
  "m2-p4-selected-request-product-completeness-v1" as const;
export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID_SAFE_CODE =
  "M2_SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID" as const;

export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_DEFECT_CODES_V1 = [
  "REQUESTED_DRAFT_MISSING",
  "REQUESTED_DRAFT_EDIT_METADATA_MISSING",
  "REQUESTED_MESSAGE_TEMPERATURE_MISSING",
] as const;

export type SelectedRequestProductCompletenessDefectCodeV1 =
  (typeof SELECTED_REQUEST_PRODUCT_COMPLETENESS_DEFECT_CODES_V1)[number];

export type SelectedRequestProductCompletenessDefectV1 = {
  code: SelectedRequestProductCompletenessDefectCodeV1;
  findingCode: QualityReassessmentDefectV1["findingCode"];
  severity: QualityReassessmentDefectV1["severity"];
  jsonPath: string;
  normalizedRepairRequirementCode: QualityReassessmentDefectV1["normalizedRepairRequirementCode"];
};

export type SelectedRequestProductCompletenessResultV1 = {
  schemaVersion: typeof SELECTED_REQUEST_PRODUCT_COMPLETENESS_V1_SCHEMA_VERSION;
  complete: boolean;
  defects: SelectedRequestProductCompletenessDefectV1[];
};

function invalid(): never {
  throw new M2RuntimeError(
    SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID_SAFE_CODE,
  );
}

function validateRequestedTopics(value: readonly RequestedTopic[]) {
  if (
    !Array.isArray(value) ||
    new Set(value).size !== value.length ||
    value.some((topic) => !REQUESTED_TOPIC_VALUES.includes(topic))
  ) {
    invalid();
  }
}

function defect(
  code: SelectedRequestProductCompletenessDefectCodeV1,
  jsonPath: string,
): SelectedRequestProductCompletenessDefectV1 {
  const planDefect = code !== "REQUESTED_MESSAGE_TEMPERATURE_MISSING";
  return {
    code,
    findingCode: planDefect
      ? "MESSAGE_POLICY_CONSISTENCY"
      : "REQUIRED_SECTION_MEANING",
    severity: "major",
    jsonPath,
    normalizedRepairRequirementCode: planDefect
      ? "RESTORE_MESSAGE_POLICY_CONSISTENCY"
      : "RESTORE_REQUIRED_SECTION_MEANING",
  };
}

export function evaluateSelectedRequestProductCompletenessV1(input: {
  requestedTopics: readonly RequestedTopic[];
  candidateEnvelope: CandidateEnvelopeV1;
  effectiveDecisionPolicy: EffectiveDecisionPolicyV1;
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}): SelectedRequestProductCompletenessResultV1 {
  validateRequestedTopics(input.requestedTopics);
  validateCandidateSourceIntegrityV1({
    candidateEnvelope: input.candidateEnvelope,
  });
  if (
    input.effectiveDecisionPolicy.schemaVersion !==
      "m2-p4-effective-decision-policy-v1" ||
    input.effectiveDecisionPolicy.policy.policy_version !==
      "decision-policy-v2.0.0"
  ) {
    invalid();
  }

  const requested = new Set(input.requestedTopics);
  if (
    requested.has("message_impact") &&
    !(
      input.candidateEnvelope.presence === true &&
      input.candidateEnvelope.analysis_status === "available" &&
      input.candidateEnvelope.safety_status === "available" &&
      input.candidateEnvelope.analysis !== null
    )
  ) {
    invalid();
  }

  const defects: SelectedRequestProductCompletenessDefectV1[] = [];
  const draftPermitted =
    input.effectiveDecisionPolicy.policy.message_draft_policy ===
      "required_now" ||
    input.effectiveDecisionPolicy.policy.message_draft_policy === "later_only";
  if (requested.has("draft_message") && draftPermitted) {
    if (input.decisionPlan.recommended_message_draft === null) {
      defects.push(
        defect(
          "REQUESTED_DRAFT_MISSING",
          "decision_plan.recommended_message_draft",
        ),
      );
    }
    if (input.decisionPlan.message_draft_edit_metadata === null) {
      defects.push(
        defect(
          "REQUESTED_DRAFT_EDIT_METADATA_MISSING",
          "decision_plan.message_draft_edit_metadata",
        ),
      );
    }
  }
  if (
    requested.has("message_impact") &&
    input.reportContent.message_temperature === null
  ) {
    defects.push(
      defect(
        "REQUESTED_MESSAGE_TEMPERATURE_MISSING",
        "report_content.message_temperature",
      ),
    );
  }
  defects.sort((left, right) => left.jsonPath.localeCompare(right.jsonPath));
  return {
    schemaVersion: SELECTED_REQUEST_PRODUCT_COMPLETENESS_V1_SCHEMA_VERSION,
    complete: defects.length === 0,
    defects,
  };
}

export function buildSelectedRequestProductCompletenessReassessmentDirectiveV1(
  completeness: SelectedRequestProductCompletenessResultV1,
): QualityReassessmentDirectiveV1 {
  if (
    completeness.schemaVersion !==
      SELECTED_REQUEST_PRODUCT_COMPLETENESS_V1_SCHEMA_VERSION ||
    completeness.complete ||
    completeness.defects.length === 0
  ) {
    invalid();
  }
  const defects = completeness.defects.map(
    ({ findingCode, severity, jsonPath, normalizedRepairRequirementCode }) => ({
      findingCode,
      severity,
      jsonPath,
      normalizedRepairRequirementCode,
    }),
  );
  return {
    schemaVersion: QUALITY_REASSESSMENT_DIRECTIVE_V1_SCHEMA_VERSION,
    attemptNumber: QUALITY_REASSESSMENT_ATTEMPT_NUMBER,
    scope: defects.some((entry) =>
      entry.jsonPath.startsWith("decision_plan."),
    )
      ? "plan_and_report"
      : "report_only",
    source: "local_selected_request_completeness",
    defects,
  };
}
