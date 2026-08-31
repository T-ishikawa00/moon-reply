import { requireContextualDecisionFactsV3 } from "../../../lib/assessment/runtime/policy-v3.ts";
import { evaluateCustomerSurfaceIntegrityV1 } from "../../../lib/assessment/runtime/customer-surface-integrity-v1.ts";
import type { CandidateEnvelopeV1 } from "../../../lib/assessment/runtime/contracts/split-stage-contracts-v1.ts";
import { evaluateDraftSourceIntegrityV2 } from "../../../lib/assessment/runtime/draft-source-integrity-v2.ts";
import type { EffectiveDecisionPolicyV2 } from "../../../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { asM2RuntimeError, M2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { validateProductSemanticShapeV1 } from "../../../lib/assessment/runtime/product-semantic-shape-v1.ts";
import {
  buildCombinedProductQualityDirectiveV2,
  classifyPaidQualityReassessmentExhaustionV1,
  localSemanticShapeDefectV2,
  type PaidQualityReassessmentExhaustionDispositionV1,
  type ProductQualityDefectV2,
} from "../../../lib/assessment/runtime/quality-reassessment-v2.ts";
import { evaluateSelectedRequestProductCompletenessV2 } from "../../../lib/assessment/runtime/selected-request-product-completeness-v2.ts";
import { evaluateSemanticFindingsV7 } from "../../../lib/assessment/runtime/semantic-disposition-v7.ts";
import type {
  AiStageTransport,
  DecisionPolicyResultV2,
  JsonObject,
  RequestedTopic,
  SplitDecisionPlanV2,
  SplitReportContentV2,
  StageRequest,
  StageResponse,
} from "../../../lib/assessment/runtime/types.ts";

export type LocalQualityDiagnosticV1 = Readonly<{
  attemptNumber: 2;
  disposition: PaidQualityReassessmentExhaustionDispositionV1;
  findingCodes: readonly ProductQualityDefectV2["findingCode"][];
}>;

function record(value: unknown, code: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new M2RuntimeError(code);
  }
  return value as JsonObject;
}

function projectDecisionFacts(
  baseStructuredIntake: JsonObject,
  candidateEnvelope: CandidateEnvelopeV1,
) {
  const baseFacts = record(
    baseStructuredIntake.decision_facts,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  );
  const projected = structuredClone(baseFacts);
  delete projected.user_contact_constraint;
  projected.schema_version = "m2-p4-decision-facts-v2";
  const contactState = record(
    projected.contact_state,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  );
  contactState.proposed_message_present = candidateEnvelope.presence;
  return requireContextualDecisionFactsV3({ decision_facts: projected });
}

function deriveAttemptTwoDiagnostic(
  request: StageRequest,
  response: StageResponse,
  requestedTopics: readonly RequestedTopic[],
): LocalQualityDiagnosticV1 | null {
  const decisionPlan = record(
    request.input.decision_plan,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  ) as unknown as SplitDecisionPlanV2;
  const reportContent = record(
    request.input.report_content,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  ) as unknown as SplitReportContentV2;
  const candidateEnvelope = record(
    request.input.candidate_envelope,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  ) as unknown as CandidateEnvelopeV1;
  const baseStructuredIntake = record(
    request.input.base_structured_intake,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  );
  const decisionPolicy = record(
    request.input.decision_policy_result,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  ) as unknown as DecisionPolicyResultV2;
  const effectiveDecisionPolicy = record(
    request.input.effective_decision_policy_result,
    "CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID",
  ) as unknown as EffectiveDecisionPolicyV2;
  const optionalMessage = request.input.user_supplied_optional_message;
  if (optionalMessage !== null && typeof optionalMessage !== "string") {
    throw new M2RuntimeError("CONTENT_STUDIO_LOCAL_DIAGNOSTIC_INPUT_INVALID");
  }

  const localDefects: ProductQualityDefectV2[] = [];
  try {
    validateProductSemanticShapeV1({ decisionPlan, reportContent });
  } catch (error) {
    const safe = asM2RuntimeError(error);
    if (safe.safeCode !== "M2_PRODUCT_SEMANTIC_SHAPE_INVALID") throw safe;
    localDefects.push(localSemanticShapeDefectV2());
  }
  localDefects.push(
    ...evaluateSelectedRequestProductCompletenessV2({
      requestedTopics,
      candidateEnvelope,
      effectiveDecisionPolicy,
      decisionPlan,
      reportContent,
    }).defects,
    ...evaluateDraftSourceIntegrityV2({
      candidateEnvelope,
      optionalMessage,
      requestedTopics,
      decisionPolicy,
      decisionPlan,
    }),
    ...evaluateCustomerSurfaceIntegrityV1({ decisionPlan, reportContent }),
  );

  const { blockingFindings } = evaluateSemanticFindingsV7({
    validationOutput: response.output,
    decisionPlan,
    groundedReportContent: reportContent,
    decisionFacts: projectDecisionFacts(baseStructuredIntake, candidateEnvelope),
  });
  const directive = buildCombinedProductQualityDirectiveV2({
    blockingFindings,
    localDefects,
    decisionPlan,
    reportContent,
  });
  if (directive === null) return null;
  const findingCodes = [...new Set(
    directive.defects.map((defect) => defect.findingCode),
  )].sort();
  return Object.freeze({
    attemptNumber: 2,
    disposition: classifyPaidQualityReassessmentExhaustionV1(directive),
    findingCodes: Object.freeze(findingCodes),
  });
}

export class LocalQualityDiagnosticCollector {
  private diagnostic: LocalQualityDiagnosticV1 | null = null;

  capture(diagnostic: LocalQualityDiagnosticV1 | null) {
    this.diagnostic = diagnostic === null ? null : structuredClone(diagnostic);
  }

  read() {
    return this.diagnostic === null
      ? null
      : (structuredClone(this.diagnostic) as LocalQualityDiagnosticV1);
  }
}

export class LocalQualityDiagnosticTransport implements AiStageTransport {
  private pb06Attempt = 0;
  private readonly delegate: AiStageTransport;
  private readonly requestedTopics: readonly RequestedTopic[];
  private readonly collector: LocalQualityDiagnosticCollector;

  constructor(
    delegate: AiStageTransport,
    requestedTopics: readonly RequestedTopic[],
    collector: LocalQualityDiagnosticCollector,
  ) {
    this.delegate = delegate;
    this.requestedTopics = Object.freeze([...requestedTopics]);
    this.collector = collector;
  }

  async invoke(request: StageRequest): Promise<StageResponse> {
    const response = await this.delegate.invoke(request);
    if (request.stageId !== "PB-06") return response;
    this.pb06Attempt += 1;
    if (this.pb06Attempt !== 2) return response;
    try {
      this.collector.capture(
        deriveAttemptTwoDiagnostic(request, response, this.requestedTopics),
      );
    } catch {
      this.collector.capture(null);
    }
    return response;
  }
}
