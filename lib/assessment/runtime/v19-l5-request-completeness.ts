// L5-only successor of the V17 request completeness check. Historical validators remain unchanged.
import type { V19L5EffectiveDecisionPolicy } from "./v19-l5-intent-policy.ts";
import type { CandidateEnvelopeV1 } from "./contracts/split-stage-contracts-v1.ts";
import type { EffectiveDecisionPolicyV3 } from "./effective-decision-policy-v3.ts";
import type { EffectiveDecisionPolicyV2 } from "./effective-decision-policy-v2.ts";
import type { V19L1EffectiveDecisionPolicy } from "./v19-l1-acknowledgement-policy.ts";
import { M2RuntimeError } from "./errors.ts";
import type { ProductQualityDefectV2 } from "./quality-reassessment-v2.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import {
  REQUESTED_TOPIC_VALUES,
  type RequestedTopic,
  type SplitDecisionPlanV2,
  type SplitReportContentV2,
} from "./types.ts";

export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_V2_SCHEMA_VERSION =
  "m2-p4-selected-request-product-completeness-v2" as const;
export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_V2_INVALID_SAFE_CODE =
  "M2_SELECTED_REQUEST_PRODUCT_COMPLETENESS_INVALID" as const;

export const SELECTED_REQUEST_PRODUCT_COMPLETENESS_DEFECT_CODES_V2 = [
  "CANDIDATE_CONTENT_FALSELY_ABSENT",
  "REQUESTED_DRAFT_MISSING",
  "REQUESTED_DRAFT_EDIT_METADATA_MISSING",
  "REQUESTED_DRAFT_CONTEXT_MISSING",
  "REQUESTED_MESSAGE_TEMPERATURE_MISSING",
] as const;

export type SelectedRequestProductCompletenessDefectCodeV2 =
  (typeof SELECTED_REQUEST_PRODUCT_COMPLETENESS_DEFECT_CODES_V2)[number];

export type SelectedRequestProductCompletenessDefectV2 =
  ProductQualityDefectV2 & {
    code: SelectedRequestProductCompletenessDefectCodeV2;
  };

export type SelectedRequestProductCompletenessResultV2 = {
  schemaVersion: typeof SELECTED_REQUEST_PRODUCT_COMPLETENESS_V2_SCHEMA_VERSION;
  complete: boolean;
  defects: SelectedRequestProductCompletenessDefectV2[];
};

function invalid(): never {
  throw new M2RuntimeError(
    SELECTED_REQUEST_PRODUCT_COMPLETENESS_V2_INVALID_SAFE_CODE,
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
  code: SelectedRequestProductCompletenessDefectCodeV2,
  jsonPath: string,
): SelectedRequestProductCompletenessDefectV2 {
  const ownership = jsonPath.startsWith("decision_plan")
    ? ("plan" as const)
    : ("report" as const);
  return {
    code,
    findingCode:
      code === "REQUESTED_MESSAGE_TEMPERATURE_MISSING" ||
      code === "REQUESTED_DRAFT_CONTEXT_MISSING"
        ? "REQUIRED_SECTION_MEANING"
        : "MESSAGE_POLICY_CONSISTENCY",
    severity: "major",
    jsonPath,
    normalizedRepairRequirementCode:
      ownership === "plan"
        ? "RESTORE_MESSAGE_POLICY_CONSISTENCY"
        : "RESTORE_REQUIRED_SECTION_MEANING",
    ownership,
  };
}

export function evaluateV19L5SelectedRequestProductCompleteness(input: {
  requestedTopics: readonly RequestedTopic[];
  candidateEnvelope: CandidateEnvelopeV1;
  effectiveDecisionPolicy: EffectiveDecisionPolicyV2 | EffectiveDecisionPolicyV3 | V19L1EffectiveDecisionPolicy | V19L5EffectiveDecisionPolicy;
  decisionPlan: SplitDecisionPlanV2;
  reportContent: SplitReportContentV2;
}): SelectedRequestProductCompletenessResultV2 {
  validateRequestedTopics(input.requestedTopics);
  validateCandidateSourceIntegrityV1({
    candidateEnvelope: input.candidateEnvelope,
  });
  if (
    (input.effectiveDecisionPolicy.schemaVersion !==
      "m2-p4-effective-decision-policy-v2" &&
      input.effectiveDecisionPolicy.schemaVersion !== "m2-p4-effective-decision-policy-v3" &&
      input.effectiveDecisionPolicy.schemaVersion !== "m2-p4-effective-decision-policy-v19-l1" &&
      input.effectiveDecisionPolicy.schemaVersion !== "m2-p4-effective-decision-policy-v19-l5") ||
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

  const defects: SelectedRequestProductCompletenessDefectV2[] = [];
  if (input.candidateEnvelope.presence === true) {
    input.decisionPlan.material_unknowns.forEach((unknown, index) => {
      if (
        unknown.unknown_code === "message_content_absent" ||
        unknown.unknown_code === "specific_message_text"
      ) {
        defects.push(
          defect(
            "CANDIDATE_CONTENT_FALSELY_ABSENT",
            `decision_plan.material_unknowns[${index}]`,
          ),
        );
      }
    });
  }
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
    if (input.reportContent.message_draft_context === null) {
      defects.push(
        defect(
          "REQUESTED_DRAFT_CONTEXT_MISSING",
          "report_content.message_draft_context",
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
    schemaVersion: SELECTED_REQUEST_PRODUCT_COMPLETENESS_V2_SCHEMA_VERSION,
    complete: defects.length === 0,
    defects,
  };
}
