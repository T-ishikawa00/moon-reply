import { randomUUID } from "node:crypto";
import {
  createOpaqueClarificationIdV1,
  clarificationSourceIdentityV1,
  type ClarificationEvidenceV1,
} from "./clarification-evidence-v1.ts";
import { groundClarificationEvidenceV1, type ClarificationGroundingV1 } from "./clarification-grounding-v1.ts";
import { validateClarificationSourceIntegrityV1 } from "./clarification-source-integrity-v1.ts";
import { buildEffectiveAssessmentAuthorityV1, type EffectiveAssessmentAuthorityV1 } from "./effective-assessment-authority-v1.ts";
import {
  requireReadyMakingClarificationDownstreamV1,
  validateEffectiveAssessmentAuthorityIntegrityV1,
} from "./effective-assessment-authority-integrity-v1.ts";
import {
  buildEffectiveDecisionPolicyV1,
  clarificationConsumptionPathsForStageV1,
} from "./effective-decision-policy-v1.ts";
import { buildEffectiveDecisionPolicyV2 } from "./effective-decision-policy-v2.ts";
import { evaluateJpy980InputSufficiencyV2, type Jpy980InputSufficiencyResultV2 } from "./jpy980-input-sufficiency-policy-v2.ts";
import {
  evaluateJpy980InputSufficiencyV3,
  type Jpy980InputSufficiencyResultV3,
} from "./jpy980-input-sufficiency-policy-v3.ts";
import { groundChangeConditionCommentaryV3 } from "./change-condition-grounding-v3.ts";
import { groundChangeConditionCommentaryV4 } from "./change-condition-grounding-v4.ts";
import { groundBaseStructuredIntakeV1, projectBaseProviderInputV1 } from "./base-structured-intake-grounding-v1.ts";
import { groundBaseStructuredIntakeV2 } from "./base-structured-intake-grounding-v2.ts";
import { groundBaseStructuredIntakeV3 } from "./base-structured-intake-grounding-v3.ts";
import { buildBaseStructuredIntakeLegacyViewV1 } from "./base-structured-intake-legacy-view-v1.ts";
import { validateBaseSourceIntegrityV1 } from "./base-source-integrity-v1.ts";
import { groundCandidateAnalysisV1, projectCandidateProviderInputV1 } from "./candidate-analysis-grounding-v1.ts";
import { groundCandidateAnalysisV2 } from "./candidate-analysis-grounding-v2.ts";
import {
  evaluateCandidateBoundaryContactV1,
  projectCandidateSafetyDispositionV1,
} from "./candidate-safety-routing-v1.ts";
import { validateCandidateSourceIntegrityV1 } from "./candidate-source-integrity-v1.ts";
import { evaluateCustomerSurfaceIntegrityV1 } from "./customer-surface-integrity-v1.ts";
import {
  LEGACY_SIX_STAGE_TOPOLOGY,
  SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY,
  type CandidateEnvelopeV1,
  type CandidateSafetySignalsV1,
} from "./contracts/split-stage-contracts-v1.ts";
import { validateContextualIntakeIntegrityV3 } from "./contextual-integrity-v3.ts";
import { validateDecisionPlanConstraintIntegrityV1 } from "./decision-plan-constraint-integrity-v1.ts";
import { addUsage, emptyUsageTotals } from "./cost.ts";
import {
  buildLocalEligibilityResultV3,
  deriveRuntimeEligibilityV3,
  validateEligibilityProjectionV3,
} from "./eligibility-v3.ts";
import { asM2RuntimeError, M2RuntimeError } from "./errors.ts";
import { validateGeneratedDraftAuthorityV1 } from "./generated-draft-authority-v1.ts";
import { evaluateDraftSourceIntegrityV2 } from "./draft-source-integrity-v2.ts";
import { hashJson } from "./hash.ts";
import {
  aggregateSafety,
  deterministicSafetyResult,
} from "./policy.ts";
import type { SafetyResult } from "./policy.ts";
import { groundReportContentV3 } from "./report-grounding-v3.ts";
import { validateProductSemanticShapeV1 } from "./product-semantic-shape-v1.ts";
import {
  buildLocalSemanticShapeReassessmentDirectiveV1,
  buildQualityReassessmentDirectiveV1,
  isQualityReassessmentRequiredSignalV1,
  QualityReassessmentRequiredSignalV1,
  type QualityReassessmentDirectiveV1,
} from "./quality-reassessment-v1.ts";
import {
  buildCombinedProductQualityDirectiveV2,
  isQualityReassessmentRequiredSignalV2,
  localSemanticShapeDefectV2,
  QualityReassessmentRequiredSignalV2,
  type ProductQualityDefectV2,
  type QualityReassessmentDirectiveV2,
} from "./quality-reassessment-v2.ts";
import {
  createActionContextV1,
  createContactConstraintPolicyV1,
} from "./runtime-authority-v1.ts";
import {
  buildSelectedRequestProductCompletenessReassessmentDirectiveV1,
  evaluateSelectedRequestProductCompletenessV1,
} from "./selected-request-product-completeness-v1.ts";
import { evaluateSelectedRequestProductCompletenessV2 } from "./selected-request-product-completeness-v2.ts";
import { aggregateSafetyV3 } from "./safety-aggregation-v3.ts";
import { evaluateSemanticFindingsV3 } from "./semantic-disposition-v3.ts";
import { evaluateSemanticFindingsV4 } from "./semantic-disposition-v4.ts";
import { evaluateSemanticFindingsV5 } from "./semantic-disposition-v5.ts";
import { evaluateSemanticFindingsV7 } from "./semantic-disposition-v7.ts";
import { groundStructuredIntakeV3 } from "./structured-intake-grounding-v3.ts";
import { groundStructuredIntakeV4 } from "./structured-intake-grounding-v4.ts";
import { groundStructuredIntakeV5 } from "./structured-intake-grounding-v5.ts";
import { buildStructuredIntakeLegacyViewV3 } from "./structured-intake-legacy-view-v3.ts";
import {
  buildAbsentCandidateLaneV1,
  buildAnalysisUnavailableSafetyAvailableCandidateLaneV1,
  buildAvailableCandidateLaneV1,
  buildSafetyUnavailableCandidateLaneV1,
  buildSplitAnalysisEnvelopeV1,
  type CandidateLaneV1,
} from "./split-analysis-envelope-v1.ts";
import {
  buildDecisionPolicyV2,
  requireDecisionFacts,
  validateDecisionPlanAgainstPolicyV2,
} from "./policy-v2.ts";
import {
  buildContextualDecisionPolicyV3,
  requireContextualDecisionFactsV3,
  validateContextualDecisionPlanV3,
} from "./policy-v3.ts";
import type {
  AiStageTransport,
  ActionContextV1,
  AssessmentExecutionResult,
  AssessmentInput,
  AssessmentRepository,
  DecisionCard,
  DecisionPlan,
  DecisionPolicyResultV2,
  ContactConstraintPolicyV1,
  Eligibility,
  JsonObject,
  M2StageId,
  PipelineObserver,
  ReportContent,
  RuntimeReport,
  SplitDecisionPlanV2,
  SplitReportContentV2,
  SplitRuntimeReportV1,
  StageAttemptNumber,
  StageTopologyVersion,
  StageDefinition,
  StageResponse,
  UsageTotals,
  PersistedInitialAuthorityV1,
} from "./types.ts";
import type { DecisionFactsV2 } from "./contextual-inference-v3.ts";
import {
  validateGroundedStageOutput,
  validateStageOutput,
} from "./validation.ts";
import { validateWritingContextIntegrityV1 } from "./writing-context-integrity-v1.ts";
import { validateWritingContextIntegrityV2 } from "./writing-context-integrity-v2.ts";

export type AssessmentRunContext = {
  requestId: string;
  runId: string;
  model: "gpt-5.6-luna";
  promptBundleVersion: string;
  schemaSetVersion: string;
  startedAt: string;
};

type PipelineOptions = {
  repository: AssessmentRepository;
  transport: AiStageTransport;
  definitions: StageDefinition[];
  observe?: PipelineObserver;
  now?: () => string;
  uuid?: () => string;
  timeZone?: string;
  clarificationId?: () => string;
};

type StageInput = {
  definition: StageDefinition;
  input: JsonObject;
};

type CandidateStageOutcome =
  | { kind: "available"; lane: CandidateLaneV1 }
  | { kind: "analysis_unavailable"; lane: CandidateLaneV1 }
  | { kind: "safety_unavailable"; lane: CandidateLaneV1 };

const zeroUsage = Object.freeze({
  inputTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
});

function asCandidateStagePersistenceError(error: unknown) {
  const runtimeError = asM2RuntimeError(error);
  return runtimeError.safeCode === "M2_STAGE_PERSISTENCE_FAILED"
    ? runtimeError
    : new M2RuntimeError("M2_STAGE_PERSISTENCE_FAILED");
}

function asJsonObject(value: unknown) {
  return value as JsonObject;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isMajorOrCriticalFinding(value: unknown): value is JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const finding = value as JsonObject;
  return finding.severity === "critical" || finding.severity === "major";
}

function eligibilityFrom(
  safety: SafetyResult,
  modelEligibility: JsonObject,
): Eligibility {
  if (safety.classification !== "normal_allowed") {
    return "safety_blocked";
  }
  const value = modelEligibility.eligibility;
  if (
    value !== "ready" &&
    value !== "needs_more_information" &&
    value !== "safety_blocked"
  ) {
    throw new M2RuntimeError("M2_ELIGIBILITY_INVALID");
  }
  return value;
}

function buildRuntimeReport(
  plan: DecisionPlan,
  content: ReportContent,
): RuntimeReport {
  return {
    schemaVersion: "m2-p3-runtime-report-v1",
    decisionPlan: plan,
    content,
    fixedLimitation:
      "このノートは入力された情報を整理した判断材料です。相手の本心や将来を断定・保証せず、医療・心理・法律上の助言を代替しません。",
  };
}

function buildDecisionCard(
  plan: DecisionPlan,
  content: ReportContent,
): DecisionCard {
  return {
    schemaVersion: "m2-p3-decision-card-v1",
    decision: plan.selected_decision,
    reason: content.decision_reason_summary,
    actionsToTake: plan.actions_to_take,
    actionsToAvoid: plan.actions_to_avoid,
    messageDraft: plan.message_draft?.text ?? null,
    reviewTiming: plan.review_timing.when,
  };
}

const fixedLimitation =
  "このノートは入力された情報を整理した判断材料です。相手の本心や将来を断定・保証せず、医療・心理・法律上の助言を代替しません。";

function sameTopology(
  definitions: readonly StageDefinition[],
  topology: typeof LEGACY_SIX_STAGE_TOPOLOGY | typeof SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY,
) {
  return (
    definitions.length === topology.stages.length &&
    definitions.every(
      (definition, index) =>
        definition.stageId === topology.stages[index]?.stage_id &&
        definition.sequenceNumber === topology.stages[index]?.sequence,
    )
  );
}

export function detectStageTopologyVersion(
  definitions: readonly StageDefinition[],
): StageTopologyVersion {
  const identities = definitions.map(
    (definition) => `${definition.stageId}:${definition.sequenceNumber}`,
  );
  if (new Set(identities).size !== identities.length) {
    throw new M2RuntimeError("M2_STAGE_TOPOLOGY_INVALID");
  }
  if (sameTopology(definitions, LEGACY_SIX_STAGE_TOPOLOGY)) {
    return "legacy-six-v1";
  }
  if (sameTopology(definitions, SPLIT_BASE_CANDIDATE_STAGE_TOPOLOGY)) {
    return "split-base-candidate-v1";
  }
  throw new M2RuntimeError("M2_STAGE_TOPOLOGY_INVALID");
}

function buildSplitRuntimeReport(
  plan: SplitDecisionPlanV2,
  content: SplitReportContentV2,
): SplitRuntimeReportV1 {
  return {
    schemaVersion: "m2-p4-split-runtime-report-v1",
    decisionPlan: plan,
    content,
    fixedLimitation,
  };
}

function buildSplitDecisionCard(
  plan: SplitDecisionPlanV2,
  content: SplitReportContentV2,
): DecisionCard {
  return {
    schemaVersion: "m2-p3-decision-card-v1",
    decision: plan.selected_decision,
    reason: content.decision_reason_summary,
    actionsToTake: plan.actions_to_take,
    actionsToAvoid: plan.actions_to_avoid,
    messageDraft: plan.recommended_message_draft?.text ?? null,
    reviewTiming: plan.review_timing.when,
  };
}

function projectSplitDecisionFacts(
  baseStructuredIntake: JsonObject,
  candidateEnvelope: CandidateEnvelopeV1,
): DecisionFactsV2 {
  const baseFacts = baseStructuredIntake.decision_facts;
  if (typeof baseFacts !== "object" || baseFacts === null || Array.isArray(baseFacts)) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  const projected = structuredClone(baseFacts) as JsonObject;
  delete projected.user_contact_constraint;
  projected.schema_version = "m2-p4-decision-facts-v2";
  const contactState = projected.contact_state;
  if (
    typeof contactState !== "object" ||
    contactState === null ||
    Array.isArray(contactState)
  ) {
    throw new M2RuntimeError("M2_DECISION_FACTS_INCOMPLETE");
  }
  contactState.proposed_message_present = candidateEnvelope.presence;
  return requireContextualDecisionFactsV3({ decision_facts: projected });
}

const degradedAllowedChangeReasons = new Set([
  "no_change_needed",
  "typo_correction",
  "naturalness",
  "reduce_over_explanation",
  "reduce_excessive_apology",
  "reduce_pressure",
  "respect_user_constraint",
  "respect_relationship_or_hierarchy",
  "safety_or_boundary",
]);

function validateSplitDecisionPlan(
  plan: SplitDecisionPlanV2,
  policy: DecisionPolicyResultV2,
  candidateEnvelope: CandidateEnvelopeV1,
  options: { deferDraftSourceIntegrity?: boolean } = {},
) {
  if (
    !policy.allowed_decisions.includes(plan.selected_decision) ||
    policy.disallowed_decisions.some(
      ({ decision }) => decision === plan.selected_decision,
    )
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }

  const draft = plan.recommended_message_draft;
  const metadata = plan.message_draft_edit_metadata;
  if ((draft === null) !== (metadata === null)) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "required_now" &&
    (!draft || draft.policy !== "required_now" || draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "later_only" &&
    draft !== null &&
    (draft.policy !== "later_only" || draft.use_timing !== "later")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    policy.message_draft_policy === "not_allowed" &&
    (draft !== null || metadata !== null)
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    (plan.selected_decision === "reply_now" ||
      plan.selected_decision === "send_now") &&
    (!draft || draft.policy !== "required_now" || draft.use_timing !== "now")
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    plan.selected_decision === "pause_additional_contact" &&
    (draft !== null || metadata !== null)
  ) {
    throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
  }
  if (
    !options.deferDraftSourceIntegrity &&
    !candidateEnvelope.presence &&
    metadata !== null &&
    metadata.source_status !== "generated_without_candidate"
  ) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }
  if (
    !options.deferDraftSourceIntegrity &&
    candidateEnvelope.presence &&
    metadata?.source_status === "generated_without_candidate"
  ) {
    throw new M2RuntimeError("M2_CANDIDATE_SOURCE_INTEGRITY_FAILED");
  }

  if (
    candidateEnvelope.presence &&
    candidateEnvelope.analysis_status === "unavailable" &&
    metadata
  ) {
    if (
      metadata.preserved_meaning !== true ||
      metadata.style_delta.some(
        ({ change }) =>
          change !== "preserved" &&
          change !== "lightly_adjusted" &&
          change !== "unresolved",
      ) ||
      metadata.change_reasons.some(
        (reason) => !degradedAllowedChangeReasons.has(reason),
      )
    ) {
      throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
    }
    const intent = metadata.communicative_intent_delta;
    const forbiddenIntentDeltas = new Set(["increased", "added"]);
    if (
      Object.values(intent).some((value) =>
        typeof value === "string" ? forbiddenIntentDeltas.has(value) : false,
      ) ||
      (typeof intent.question_count_delta === "number" &&
        intent.question_count_delta > 0)
    ) {
      throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
    }
  }
}

export class AssessmentPipeline {
  private readonly repository: AssessmentRepository;
  private readonly transport: AiStageTransport;
  private readonly definitions: Map<M2StageId, StageDefinition>;
  private readonly stageTopologyVersion: StageTopologyVersion;
  private readonly observe?: PipelineObserver;
  private readonly now: () => string;
  private readonly uuid: () => string;
  private readonly timeZone?: string;
  private readonly clarificationId: () => string;
  private usage: UsageTotals = emptyUsageTotals();
  private returnedModel: string | null = null;

  constructor(options: PipelineOptions) {
    this.repository = options.repository;
    this.transport = options.transport;
    this.stageTopologyVersion = detectStageTopologyVersion(options.definitions);
    this.definitions = new Map(
      options.definitions.map((definition) => [
        definition.stageId,
        definition,
      ]),
    );
    this.observe = options.observe;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
    this.timeZone = options.timeZone;
    this.clarificationId = options.clarificationId ?? createOpaqueClarificationIdV1;
  }

  private validateRuntimeIdentity(runContext: AssessmentRunContext) {
    const legacySplitPair =
      (runContext.promptBundleVersion === "prompt-bundle-runtime-v9.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v10.0.0") &&
      runContext.schemaSetVersion === "pipeline-schema-runtime-v4.0.0";
    const authorityIntegrityPair =
      runContext.promptBundleVersion === "prompt-bundle-runtime-v11.0.0" &&
      runContext.schemaSetVersion === "pipeline-schema-runtime-v5.0.0";
    const v1A2CapablePair =
      (runContext.promptBundleVersion === "prompt-bundle-runtime-v12.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v13.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v14.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v15.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v16.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v17.0.0") &&
      runContext.schemaSetVersion === "pipeline-schema-runtime-v6.0.0";
    const splitIdentity =
      runContext.promptBundleVersion === "prompt-bundle-runtime-v9.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v10.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v11.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v12.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v13.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v14.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v15.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v16.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v17.0.0" ||
      runContext.schemaSetVersion === "pipeline-schema-runtime-v4.0.0" ||
      runContext.schemaSetVersion === "pipeline-schema-runtime-v5.0.0" ||
      runContext.schemaSetVersion === "pipeline-schema-runtime-v6.0.0";
    if (
      this.stageTopologyVersion === "split-base-candidate-v1"
        ? !legacySplitPair && !authorityIntegrityPair && !v1A2CapablePair
        : splitIdentity
    ) {
      throw new M2RuntimeError("M2_STAGE_TOPOLOGY_INVALID");
    }
    if ((authorityIntegrityPair || v1A2CapablePair) && !this.timeZone) {
      throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
    }
  }

  private emit(event: Parameters<PipelineObserver>[0]) {
    this.observe?.(event);
  }

  private definition(stageId: M2StageId) {
    const definition = this.definitions.get(stageId);
    if (!definition) {
      throw new M2RuntimeError("M2_STAGE_DEFINITION_MISSING");
    }
    return definition;
  }

  private async invokeStage(
    runContext: AssessmentRunContext,
    { definition, input }: StageInput,
    localValidationEvent:
      | "LOCAL_SCHEMA_PB-01"
      | "LOCAL_SCHEMA_PB-02"
      | "LOCAL_SCHEMA_PB-03"
      | "LOCAL_SCHEMA_AND_PLAN_VALIDATION"
      | "LOCAL_SCHEMA_AND_REPORT_VALIDATION"
      | "LOCAL_SEMANTIC_DISPOSITION",
    afterValidation?: (output: JsonObject) => void,
    attemptNumber: StageAttemptNumber = 1,
  ) {
    this.emit(definition.stageId);
    const stageRunId = this.uuid();
    const requestHash = hashJson({
      stageId: definition.stageId,
      model: runContext.model,
      promptHash: definition.promptHash,
      schemaHash: definition.schemaHash,
      attemptNumber,
      ...(definition.groundedSchemaHash
        ? { groundedSchemaHash: definition.groundedSchemaHash }
        : {}),
      input,
    });
    await this.repository.startStage({
      id: stageRunId,
      runId: runContext.runId,
      stageId: definition.stageId,
      sequenceNumber: definition.sequenceNumber,
      attemptNumber,
      requestHash,
      promptHash: definition.promptHash,
      schemaHash: definition.schemaHash,
      requestedModel: runContext.model,
      createdAt: this.now(),
    });

    let response: StageResponse | null = null;
    try {
      response = await this.transport.invoke({
        stageId: definition.stageId,
        model: runContext.model,
        developerPrompt: definition.developerPrompt,
        promptVersion: definition.promptVersion,
        promptHash: definition.promptHash,
        schemaName: definition.schemaName,
        schemaVersion: definition.schemaVersion,
        schemaHash: definition.schemaHash,
        outputSchema: definition.outputSchema,
        input,
      });
      this.usage = addUsage(this.usage, response.usage);
      if (response.returnedModel !== runContext.model) {
        throw new M2RuntimeError("M2_STAGE_MODEL_MISMATCH");
      }
      this.returnedModel = response.returnedModel;
      this.emit(localValidationEvent);
      validateStageOutput(definition, response.output);
      afterValidation?.(response.output);
      await this.repository.completeStage({
        stageRunId,
        responseId: response.responseId,
        returnedModel: response.returnedModel,
        usage: response.usage,
        latencyMs: response.latencyMs,
        outputJson: response.output,
      });
      return response.output;
    } catch (error) {
      const safeError = asM2RuntimeError(error, "M2_STAGE_PROVIDER_FAILED");
      try {
        await this.repository.failStage({
          stageRunId,
          responseId: response?.responseId ?? null,
          returnedModel: response?.returnedModel ?? null,
          usage: response?.usage ?? zeroUsage,
          latencyMs: response?.latencyMs ?? 0,
          outputJson: response?.output ?? null,
          errorCode: safeError.safeCode,
        });
      } catch {
        throw new M2RuntimeError("M2_STAGE_PERSISTENCE_FAILED");
      }
      throw safeError;
    }
  }

  private async persistCandidateStageFailure(
    stageRunId: string,
    response: StageResponse | null,
    errorCode: string,
  ) {
    try {
      await this.repository.failStage({
        stageRunId,
        responseId: response?.responseId ?? null,
        returnedModel: response?.returnedModel ?? null,
        usage: response?.usage ?? zeroUsage,
        latencyMs: response?.latencyMs ?? 0,
        outputJson: response?.output ?? null,
        errorCode,
      });
    } catch (error) {
      throw asCandidateStagePersistenceError(error);
    }
  }

  private async invokeCandidateStage(
    runContext: AssessmentRunContext,
    optionalMessage: string,
  ): Promise<CandidateStageOutcome> {
    const definition = this.definition("PB-01C");
    const input = asJsonObject(projectCandidateProviderInputV1(optionalMessage));
    this.emit("PB-01C");
    const stageRunId = this.uuid();
    try {
      await this.repository.startStage({
        id: stageRunId,
        runId: runContext.runId,
        stageId: "PB-01C",
        sequenceNumber: definition.sequenceNumber,
        attemptNumber: 1,
        requestHash: hashJson({
          stageId: definition.stageId,
          attemptNumber: 1,
          model: runContext.model,
          promptHash: definition.promptHash,
          schemaHash: definition.schemaHash,
          input,
        }),
        promptHash: definition.promptHash,
        schemaHash: definition.schemaHash,
        requestedModel: runContext.model,
        createdAt: this.now(),
      });
    } catch (error) {
      throw asCandidateStagePersistenceError(error);
    }

    let response: StageResponse | null = null;
    try {
      response = await this.transport.invoke({
        stageId: definition.stageId,
        model: runContext.model,
        developerPrompt: definition.developerPrompt,
        promptVersion: definition.promptVersion,
        promptHash: definition.promptHash,
        schemaName: definition.schemaName,
        schemaVersion: definition.schemaVersion,
        schemaHash: definition.schemaHash,
        outputSchema: definition.outputSchema,
        input,
      });
      this.usage = addUsage(this.usage, response.usage);
      if (response.returnedModel !== runContext.model) {
        throw new M2RuntimeError("M2_CANDIDATE_SAFETY_UNAVAILABLE");
      }
      this.returnedModel = response.returnedModel;

      const candidateSafetyResult = response.output
        .candidate_safety_signals as unknown as CandidateSafetySignalsV1;
      try {
        validateCandidateSourceIntegrityV1({ candidateSafetyResult });
      } catch {
        throw new M2RuntimeError("M2_CANDIDATE_SAFETY_UNAVAILABLE");
      }
      validateCandidateSourceIntegrityV1({
        rawCandidateProviderOutput: response.output,
      });

      this.emit("LOCAL_SCHEMA_PB-01C");
      try {
        validateStageOutput(definition, response.output);
      } catch (error) {
        const safeError = asM2RuntimeError(error);
        if (safeError.safeCode !== "M2_STAGE_SCHEMA_INVALID") throw safeError;
        await this.persistCandidateStageFailure(
          stageRunId,
          response,
          "M2_CANDIDATE_ANALYSIS_UNAVAILABLE",
        );
        return {
          kind: "analysis_unavailable",
          lane: buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(
            candidateSafetyResult,
          ),
        };
      }

      const authorityIntegrityRuntime =
        runContext.promptBundleVersion === "prompt-bundle-runtime-v11.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v12.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v13.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v14.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v15.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v16.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v17.0.0";
      const grounded = authorityIntegrityRuntime
        ? groundCandidateAnalysisV2(response.output)
        : groundCandidateAnalysisV1(response.output);
      validateCandidateSourceIntegrityV1({
        candidateAnalysis: grounded.candidate_analysis,
        candidateSafetyResult: grounded.candidate_safety_result,
      });
      try {
        await this.repository.completeStage({
          stageRunId,
          responseId: response.responseId,
          returnedModel: response.returnedModel,
          usage: response.usage,
          latencyMs: response.latencyMs,
          outputJson: response.output,
        });
      } catch (error) {
        throw asCandidateStagePersistenceError(error);
      }
      return {
        kind: "available",
        lane: buildAvailableCandidateLaneV1(
          grounded.candidate_analysis,
          grounded.candidate_safety_result,
        ),
      };
    } catch (error) {
      const safeError = asM2RuntimeError(
        error,
        "M2_CANDIDATE_SAFETY_UNAVAILABLE",
      );
      if (safeError.safeCode === "M2_STAGE_PERSISTENCE_FAILED") {
        throw safeError;
      }
      const errorCode =
        safeError.safeCode === "M2_CANDIDATE_SOURCE_INTEGRITY_FAILED"
          ? safeError.safeCode
          : "M2_CANDIDATE_SAFETY_UNAVAILABLE";
      await this.persistCandidateStageFailure(stageRunId, response, errorCode);
      if (errorCode === "M2_CANDIDATE_SOURCE_INTEGRITY_FAILED") {
        throw safeError;
      }
      return {
        kind: "safety_unavailable",
        lane: buildSafetyUnavailableCandidateLaneV1(),
      };
    }
  }

  private async skipCandidateStage(runContext: AssessmentRunContext) {
    const definition = this.definition("PB-01C");
    this.emit("PB-01C");
    try {
      await this.repository.skipStage({
        id: this.uuid(),
        runId: runContext.runId,
        stageId: "PB-01C",
        sequenceNumber: 2,
        attemptNumber: 1,
        requestHash: hashJson({
          stageId: "PB-01C",
          attemptNumber: 1,
          model: runContext.model,
          promptHash: definition.promptHash,
          schemaHash: definition.schemaHash,
          candidate: "candidate_absent",
        }),
        promptHash: definition.promptHash,
        schemaHash: definition.schemaHash,
        requestedModel: runContext.model,
        skipReason: "candidate_absent",
        createdAt: this.now(),
      });
    } catch (error) {
      throw asCandidateStagePersistenceError(error);
    }
    return buildAbsentCandidateLaneV1();
  }

  private async completeSplitSafetyBlocked(runContext: AssessmentRunContext) {
    this.emit("COMPLETE_RUN");
    await this.repository.completeRun({
      runId: runContext.runId,
      requestId: runContext.requestId,
      returnedModel: this.returnedModel,
      eligibility: "safety_blocked",
      decision: null,
      completedAt: this.now(),
      ...this.usage,
    });
    return {
      requestId: runContext.requestId,
      runId: runContext.runId,
      eligibility: "safety_blocked" as const,
      questionCodes: [],
      reasonCodes: ["SAFETY_CLASSIFICATION_NOT_NORMAL"],
      clarification: null,
      duplicate: false,
      usage: this.usage,
    };
  }

  private clarificationDefinition() {
    const base = this.definition("PB-01");
    if (
      !base.clarificationOutputSchema ||
      !base.clarificationSchemaVersion ||
      !base.clarificationSchemaHash
    ) {
      throw new M2RuntimeError("M2_STAGE_DEFINITION_MISSING");
    }
    return {
      ...base,
      schemaName: "pb_01_clarification_grounding_v1",
      schemaVersion: base.clarificationSchemaVersion,
      schemaHash: base.clarificationSchemaHash,
      outputSchema: base.clarificationOutputSchema,
    } satisfies StageDefinition;
  }

  private async skipReusedStage(
    runContext: AssessmentRunContext,
    stageId: "PB-01C" | "PB-02" | "PB-03",
  ) {
    const definition = this.definition(stageId);
    this.emit(stageId);
    await this.repository.skipStage({
      id: this.uuid(),
      runId: runContext.runId,
      stageId,
      sequenceNumber: definition.sequenceNumber,
      attemptNumber: 1,
      requestHash: hashJson({
        stageId,
        attemptNumber: 1,
        reusedFrom: "initial_run_immutable_authority",
        promptHash: definition.promptHash,
        schemaHash: definition.schemaHash,
      }),
      promptHash: definition.promptHash,
      schemaHash: definition.schemaHash,
      requestedModel: runContext.model,
      skipReason: "reused_initial_authority",
      createdAt: this.now(),
    });
  }

  private v1a2BasePolicyInput(
    baseStructuredIntake: JsonObject,
    aggregate: SafetyResult,
  ) {
    const decisionFacts = baseStructuredIntake.decision_facts;
    const baseWritingSignals = baseStructuredIntake.base_writing_signals;
    if (
      typeof decisionFacts !== "object" ||
      decisionFacts === null ||
      Array.isArray(decisionFacts) ||
      typeof baseWritingSignals !== "object" ||
      baseWritingSignals === null ||
      Array.isArray(baseWritingSignals)
    ) {
      throw new M2RuntimeError("M2_JPY980_INPUT_SUFFICIENCY_POLICY_INVALID");
    }
    return {
      aggregateSafety: {
        classification: aggregate.classification as SafetyResult["classification"],
      },
      baseStructuredIntake,
      decisionFacts: decisionFacts as JsonObject,
      baseWritingSignals: baseWritingSignals as JsonObject,
    };
  }

  private v1a2StopResult(input: {
    runContext: AssessmentRunContext;
    eligibility: "not_full_product_candidate" | "safety_blocked";
    reasonCodes: string[];
  }) {
    return {
      requestId: input.runContext.requestId,
      runId: input.runContext.runId,
      eligibility: input.eligibility,
      questionCodes: [],
      reasonCodes: [...input.reasonCodes],
      clarification: null,
      duplicate: false,
      usage: this.usage,
    };
  }

  private async completeV1A2Stop(input: {
    runContext: AssessmentRunContext;
    eligibility: "not_full_product_candidate" | "safety_blocked";
    reasonCodes: string[];
  }): Promise<AssessmentExecutionResult> {
    const result = this.v1a2StopResult(input);
    this.emit("COMPLETE_RUN");
    await this.repository.completeRun({
      runId: input.runContext.runId,
      requestId: input.runContext.requestId,
      returnedModel: this.returnedModel,
      eligibility: input.eligibility,
      decision: null,
      resultJson: result as unknown as JsonObject,
      completedAt: this.now(),
      ...this.usage,
    });
    return result;
  }

  private async completeV1A2NeedsMore(input: {
    runContext: AssessmentRunContext;
    policy: Jpy980InputSufficiencyResultV2 | Jpy980InputSufficiencyResultV3;
  }): Promise<AssessmentExecutionResult> {
    const prompt = input.policy.clarification;
    if (!prompt || input.policy.clarificationBudget.questionsRemaining !== 1) {
      throw new M2RuntimeError("M2_CLARIFICATION_POLICY_INVALID");
    }
    const clarificationId = this.clarificationId();
    const sourceIdentity = clarificationSourceIdentityV1(clarificationId);
    const clarification = {
      opaqueClarificationId: clarificationId,
      questionCode: prompt.code,
      target: prompt.target,
      question: prompt.question,
      maximumQuestionsTotal: 1 as const,
      questionsAlreadyUsed: 0 as const,
      questionsRemaining: 1 as const,
    };
    const result = {
      requestId: input.runContext.requestId,
      runId: input.runContext.runId,
      eligibility: "needs_more_information" as const,
      questionCodes: [prompt.code],
      reasonCodes: [...input.policy.reasonCodes],
      clarification,
      duplicate: false,
      usage: this.usage,
    };
    const completedAt = this.now();
    this.emit("COMPLETE_RUN");
    await this.repository.finalizeNeedsMoreInformation({
      runId: input.runContext.runId,
      requestId: input.runContext.requestId,
      returnedModel: this.returnedModel,
      completedAt,
      policyResult: input.policy as unknown as JsonObject,
      resultJson: result as unknown as JsonObject,
      clarification: {
        schemaVersion: "m2-p4-assessment-clarification-v1",
        id: clarificationId,
        requestId: input.runContext.requestId,
        ordinal: 1,
        questionCode: prompt.code,
        target: prompt.target,
        questionSnapshot: prompt.question,
        provenance: "user_clarification",
        sourceIdentity,
        createdAt: completedAt,
      },
      ...this.usage,
    });
    return result;
  }

  private buildV1A2Aggregate(input: {
    request: AssessmentInput;
    baseStructuredIntake: JsonObject;
    candidateLane: CandidateLaneV1;
    modelSafety: JsonObject;
    clarificationSafety?: SafetyResult;
  }) {
    const deterministic = deterministicSafetyResult(input.request);
    const splitEnvelope = buildSplitAnalysisEnvelopeV1({
      baseStructuredIntake: input.baseStructuredIntake,
      baseLegacyView: buildBaseStructuredIntakeLegacyViewV1(
        input.baseStructuredIntake,
      ),
      candidateLane: input.candidateLane,
    });
    const candidateSemanticSafety = splitEnvelope.candidate_safety_result
      ? projectCandidateSafetyDispositionV1(splitEnvelope.candidate_safety_result)
      : {
          classification: "normal_allowed" as const,
          reason_codes: [],
          response_mode: "none" as const,
        };
    const boundary = evaluateCandidateBoundaryContactV1(
      splitEnvelope.base_structured_intake,
      splitEnvelope.candidate_safety_result,
    );
    const aggregate = aggregateSafetyV3(
      aggregateSafetyV3(
        aggregateSafetyV3(deterministic, input.modelSafety, candidateSemanticSafety),
        asJsonObject(boundary),
      ),
      input.clarificationSafety ?? {
        classification: "normal_allowed",
        reason_codes: [],
        response_mode: "none",
      },
    );
    return { aggregate, splitEnvelope };
  }

  private evaluateV1A2InputSufficiency(input: {
    runContext: AssessmentRunContext;
    baseStructuredIntake: JsonObject;
    aggregate: SafetyResult;
    clarificationGrounding: ClarificationGroundingV1 | null;
    effectiveAuthority: EffectiveAssessmentAuthorityV1;
  }) {
    const policyInput = {
      basePolicyInput: this.v1a2BasePolicyInput(
        input.baseStructuredIntake,
        input.aggregate,
      ),
      clarificationGrounding: input.clarificationGrounding,
      effectiveAssessmentAuthority: input.effectiveAuthority,
    };
    return input.runContext.promptBundleVersion ===
      "prompt-bundle-runtime-v16.0.0" ||
      input.runContext.promptBundleVersion ===
        "prompt-bundle-runtime-v17.0.0"
      ? evaluateJpy980InputSufficiencyV3(policyInput)
      : evaluateJpy980InputSufficiencyV2(policyInput);
  }

  private async completeV15Ready(input: {
    request: AssessmentInput;
    runContext: AssessmentRunContext;
    baseStructuredIntake: JsonObject;
    candidateEnvelope: CandidateEnvelopeV1;
    aggregate: SafetyResult;
    effectiveAuthority: EffectiveAssessmentAuthorityV1;
    clarificationGrounding: ClarificationGroundingV1 | null;
  }): Promise<AssessmentExecutionResult> {
    if (!this.timeZone) throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
    this.emit("LOCAL_DECISION_POLICY");
    const v17Runtime =
      input.runContext.promptBundleVersion ===
      "prompt-bundle-runtime-v17.0.0";
    const effectivePolicyV17 = v17Runtime
      ? buildEffectiveDecisionPolicyV2({
          authority: input.effectiveAuthority,
          candidateEnvelope: input.candidateEnvelope,
        })
      : null;
    const effectivePolicyV16 = v17Runtime
      ? null
      : buildEffectiveDecisionPolicyV1({
          authority: input.effectiveAuthority,
          candidateEnvelope: input.candidateEnvelope,
        });
    const effectivePolicy = effectivePolicyV17 ?? effectivePolicyV16;
    if (effectivePolicy === null) {
      throw new M2RuntimeError("M2_EFFECTIVE_DECISION_POLICY_INVALID");
    }
    const decisionPolicy = effectivePolicy.policy;
    const actionContext = createActionContextV1({
      trustedNowIso: input.runContext.startedAt,
      timeZone: this.timeZone,
    });
    const contactConstraintPolicy = createContactConstraintPolicyV1({
      baseStructuredIntake: input.baseStructuredIntake,
      followUpException: decisionPolicy.follow_up_exception,
    });
    const pb04Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-04",
    );
    const pb05Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-05",
    );
    const pb06Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-06",
    );
    const downstreamPaths = [...new Set([...pb04Paths, ...pb05Paths])];

    const buildDecisionPlan = async (
      attemptNumber: StageAttemptNumber,
      directive:
        | QualityReassessmentDirectiveV1
        | QualityReassessmentDirectiveV2
        | null,
    ) =>
      (await this.invokeStage(
        input.runContext,
        {
          definition: this.definition("PB-04"),
          input: asJsonObject({
            base_structured_intake: input.baseStructuredIntake,
            candidate_envelope: input.candidateEnvelope,
            user_supplied_optional_message: input.request.optionalMessage,
            decision_policy_result: decisionPolicy,
            effective_decision_policy_result: effectivePolicy,
            effective_assessment_authority: input.effectiveAuthority,
            clarification_consumption_contract: {
              stage_id: "PB-04",
              consumed_effective_paths: pb04Paths,
            },
            contact_constraint_policy: contactConstraintPolicy,
            action_context: actionContext,
            requested_topics: input.request.requestedTopics,
            quality_reassessment_directive: directive,
          }),
        },
        "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
        (output) => {
          validateSplitDecisionPlan(
            output as unknown as SplitDecisionPlanV2,
            decisionPolicy,
            input.candidateEnvelope,
            { deferDraftSourceIntegrity: v17Runtime },
          );
          if (
            input.runContext.promptBundleVersion ===
            "prompt-bundle-runtime-v16.0.0"
          ) {
            validateGeneratedDraftAuthorityV1({
              candidateEnvelope: input.candidateEnvelope,
              requestedTopics: input.request.requestedTopics,
              decisionPolicy,
              decisionPlan: output as unknown as SplitDecisionPlanV2,
            });
          }
          validateDecisionPlanConstraintIntegrityV1({
            decisionPlan: output as unknown as SplitDecisionPlanV2,
            contactConstraintPolicy,
            actionContext,
          });
        },
        attemptNumber,
      )) as unknown as SplitDecisionPlanV2;

    const buildReportAndValidate = async (
      decisionPlan: SplitDecisionPlanV2,
      attemptNumber: StageAttemptNumber,
      directive:
        | QualityReassessmentDirectiveV1
        | QualityReassessmentDirectiveV2
        | null,
    ) => {
      const generatedReport = (await this.invokeStage(
        input.runContext,
        {
          definition: this.definition("PB-05"),
          input: asJsonObject({
            base_structured_intake: input.baseStructuredIntake,
            candidate_envelope: input.candidateEnvelope,
            decision_plan: decisionPlan,
            effective_assessment_authority: input.effectiveAuthority,
            clarification_consumption_contract: {
              stage_id: "PB-05",
              consumed_effective_paths: pb05Paths,
            },
            contact_constraint_policy: contactConstraintPolicy,
            action_context: actionContext,
            quality_reassessment_directive: directive,
          }),
        },
        "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
        undefined,
        attemptNumber,
      )) as unknown as SplitReportContentV2;
      const contextualDecisionFacts = projectSplitDecisionFacts(
        input.baseStructuredIntake,
        input.candidateEnvelope,
      );
      let reportContent = groundReportContentV3(
        contextualDecisionFacts,
        generatedReport as unknown as ReportContent,
      ) as unknown as SplitReportContentV2;
      reportContent = (v17Runtime
        ? groundChangeConditionCommentaryV4
        : groundChangeConditionCommentaryV3)(
        decisionPlan as unknown as DecisionPlan,
        reportContent as unknown as ReportContent,
      ) as unknown as SplitReportContentV2;
      validateStageOutput(
        this.definition("PB-05"),
        reportContent as unknown as JsonObject,
      );
      const localDefects: ProductQualityDefectV2[] = [];
      try {
        validateProductSemanticShapeV1({ decisionPlan, reportContent });
      } catch (error) {
        const safeError = asM2RuntimeError(error);
        if (safeError.safeCode !== "M2_PRODUCT_SEMANTIC_SHAPE_INVALID") {
          throw safeError;
        }
        if (v17Runtime) {
          localDefects.push(localSemanticShapeDefectV2());
        } else if (attemptNumber === 2) {
          throw new M2RuntimeError("M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
        } else {
          throw new QualityReassessmentRequiredSignalV1(
            buildLocalSemanticShapeReassessmentDirectiveV1(),
          );
        }
      }

      const selectedRequestCompletenessV17 = v17Runtime
        ? evaluateSelectedRequestProductCompletenessV2({
            requestedTopics: input.request.requestedTopics,
            candidateEnvelope: input.candidateEnvelope,
            effectiveDecisionPolicy: effectivePolicyV17!,
            decisionPlan,
            reportContent,
          })
        : null;
      const selectedRequestCompletenessV16 =
        !v17Runtime &&
        input.runContext.promptBundleVersion ===
          "prompt-bundle-runtime-v16.0.0"
          ? evaluateSelectedRequestProductCompletenessV1({
              requestedTopics: input.request.requestedTopics,
              candidateEnvelope: input.candidateEnvelope,
              effectiveDecisionPolicy: effectivePolicyV16!,
              decisionPlan,
              reportContent,
            })
          : null;
      if (selectedRequestCompletenessV17 !== null) {
        localDefects.push(...selectedRequestCompletenessV17.defects);
        localDefects.push(
          ...evaluateDraftSourceIntegrityV2({
            candidateEnvelope: input.candidateEnvelope,
            optionalMessage: input.request.optionalMessage,
            requestedTopics: input.request.requestedTopics,
            decisionPolicy,
            decisionPlan,
          }),
          ...evaluateCustomerSurfaceIntegrityV1({
            decisionPlan,
            reportContent,
          }),
        );
      }

      requireReadyMakingClarificationDownstreamV1({
        authority: input.effectiveAuthority,
        clarificationGrounding: input.clarificationGrounding,
        consumedEffectivePaths: downstreamPaths,
      });
      await this.invokeStage(
        input.runContext,
        {
          definition: this.definition("PB-06"),
          input: asJsonObject({
            base_structured_intake: input.baseStructuredIntake,
            candidate_envelope: input.candidateEnvelope,
            user_supplied_optional_message: input.request.optionalMessage,
            aggregate_safety_result: input.aggregate,
            decision_policy_result: decisionPolicy,
            effective_decision_policy_result: effectivePolicy,
            effective_assessment_authority: input.effectiveAuthority,
            clarification_consumption_contract: {
              stage_id: "PB-06",
              consumed_effective_paths: pb06Paths,
            },
            decision_plan: decisionPlan,
            report_content: reportContent,
            contact_constraint_policy: contactConstraintPolicy,
            action_context: actionContext,
          }),
        },
        "LOCAL_SEMANTIC_DISPOSITION",
        (output) => {
          requireReadyMakingClarificationDownstreamV1({
            authority: input.effectiveAuthority,
            clarificationGrounding: input.clarificationGrounding,
            consumedEffectivePaths: pb06Paths,
          });
          if (
            output.validation_mode !== "semantic_findings_only" ||
            !Array.isArray(output.semantic_checks)
          ) {
            throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
          }
          if (v17Runtime) {
            const { blockingFindings } = evaluateSemanticFindingsV7({
              validationOutput: output,
              decisionPlan,
              groundedReportContent: reportContent,
              decisionFacts: contextualDecisionFacts,
            });
            const reassessmentDirective =
              buildCombinedProductQualityDirectiveV2({
                blockingFindings,
                localDefects,
                decisionPlan,
                reportContent,
              });
            if (blockingFindings.length > 0 || localDefects.length > 0) {
              if (reassessmentDirective === null) {
                throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
              }
              if (attemptNumber === 2) {
                throw new M2RuntimeError(
                  "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
                );
              }
              throw new QualityReassessmentRequiredSignalV2(
                reassessmentDirective,
              );
            }
            return;
          }
          const { blockingFindings } = evaluateSemanticFindingsV5({
            validationOutput: output,
            decisionPlan,
            groundedReportContent: reportContent,
          });
          if (blockingFindings.length > 0) {
            if (attemptNumber === 2) {
              throw new M2RuntimeError(
                "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
              );
            }
            const reassessmentDirective = buildQualityReassessmentDirectiveV1({
              blockingFindings,
              decisionPlan,
              reportContent,
            });
            if (reassessmentDirective === null) {
              throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
            }
            throw new QualityReassessmentRequiredSignalV1(
              reassessmentDirective,
            );
          }
          if (selectedRequestCompletenessV16?.complete === false) {
            if (attemptNumber === 2) {
              throw new M2RuntimeError(
                "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED",
              );
            }
            throw new QualityReassessmentRequiredSignalV1(
              buildSelectedRequestProductCompletenessReassessmentDirectiveV1(
                selectedRequestCompletenessV16,
              ),
            );
          }
        },
        attemptNumber,
      );
      return reportContent;
    };

    const decisionPlan1 = await buildDecisionPlan(1, null);
    let finalDecisionPlan = decisionPlan1;
    let finalReportContent: SplitReportContentV2;
    try {
      finalReportContent = await buildReportAndValidate(decisionPlan1, 1, null);
    } catch (error) {
      const qualitySignal = v17Runtime
        ? isQualityReassessmentRequiredSignalV2(error)
          ? error
          : null
        : isQualityReassessmentRequiredSignalV1(error)
          ? error
          : null;
      if (qualitySignal === null) throw error;
      const directive = qualitySignal.directive;
      if (directive.scope === "plan_and_report") {
        finalDecisionPlan = await buildDecisionPlan(2, directive);
      }
      finalReportContent = await buildReportAndValidate(
        finalDecisionPlan,
        2,
        directive,
      );
      if (
        directive.scope === "report_only" &&
        finalDecisionPlan.recommended_message_draft?.text !==
          decisionPlan1.recommended_message_draft?.text
      ) {
        throw new M2RuntimeError("M2_PLAN_POLICY_VIOLATION");
      }
    }

    const report = buildSplitRuntimeReport(finalDecisionPlan, finalReportContent);
    const decisionCard = buildSplitDecisionCard(
      finalDecisionPlan,
      finalReportContent,
    );
    this.emit("SAVE_FINAL_REPORT");
    this.emit("COMPLETE_RUN");
    await this.repository.finalizeCompletedAssessment({
      reportId: this.uuid(),
      runId: input.runContext.runId,
      requestId: input.runContext.requestId,
      returnedModel: this.returnedModel,
      eligibility: "ready",
      decision: finalDecisionPlan.selected_decision,
      reportJson: report,
      decisionCardJson: decisionCard,
      completedAt: this.now(),
      ...this.usage,
    });
    return {
      requestId: input.runContext.requestId,
      runId: input.runContext.runId,
      eligibility: "ready",
      decision: finalDecisionPlan.selected_decision,
      report,
      decisionCard,
      duplicate: false,
      usage: this.usage,
    };
  }

  private async completeV1A2Ready(input: {
    request: AssessmentInput;
    runContext: AssessmentRunContext;
    baseStructuredIntake: JsonObject;
    candidateEnvelope: CandidateEnvelopeV1;
    aggregate: SafetyResult;
    effectiveAuthority: EffectiveAssessmentAuthorityV1;
    clarificationGrounding: ClarificationGroundingV1 | null;
  }): Promise<AssessmentExecutionResult> {
    if (
      input.runContext.promptBundleVersion === "prompt-bundle-runtime-v15.0.0" ||
      input.runContext.promptBundleVersion === "prompt-bundle-runtime-v16.0.0" ||
      input.runContext.promptBundleVersion === "prompt-bundle-runtime-v17.0.0"
    ) {
      return this.completeV15Ready(input);
    }
    if (!this.timeZone) throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
    this.emit("LOCAL_DECISION_POLICY");
    const effectivePolicy = buildEffectiveDecisionPolicyV1({
      authority: input.effectiveAuthority,
      candidateEnvelope: input.candidateEnvelope,
    });
    const decisionPolicy = effectivePolicy.policy;
    const actionContext = createActionContextV1({
      trustedNowIso: input.runContext.startedAt,
      timeZone: this.timeZone,
    });
    const contactConstraintPolicy = createContactConstraintPolicyV1({
      baseStructuredIntake: input.baseStructuredIntake,
      followUpException: decisionPolicy.follow_up_exception,
    });
    const pb04Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-04",
    );
    const decisionPlan = (await this.invokeStage(
      input.runContext,
      {
        definition: this.definition("PB-04"),
        input: asJsonObject({
          base_structured_intake: input.baseStructuredIntake,
          candidate_envelope: input.candidateEnvelope,
          user_supplied_optional_message: input.request.optionalMessage,
          decision_policy_result: decisionPolicy,
          effective_decision_policy_result: effectivePolicy,
          effective_assessment_authority: input.effectiveAuthority,
          clarification_consumption_contract: {
            stage_id: "PB-04",
            consumed_effective_paths: pb04Paths,
          },
          contact_constraint_policy: contactConstraintPolicy,
          action_context: actionContext,
          requested_topics: input.request.requestedTopics,
        }),
      },
      "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
      (output) => {
        validateSplitDecisionPlan(
          output as unknown as SplitDecisionPlanV2,
          decisionPolicy,
          input.candidateEnvelope,
        );
        validateDecisionPlanConstraintIntegrityV1({
          decisionPlan: output as unknown as SplitDecisionPlanV2,
          contactConstraintPolicy,
          actionContext,
        });
      },
    )) as unknown as SplitDecisionPlanV2;

    const pb05Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-05",
    );
    const generatedReport = (await this.invokeStage(
      input.runContext,
      {
        definition: this.definition("PB-05"),
        input: asJsonObject({
          base_structured_intake: input.baseStructuredIntake,
          candidate_envelope: input.candidateEnvelope,
          decision_plan: decisionPlan,
          effective_assessment_authority: input.effectiveAuthority,
          clarification_consumption_contract: {
            stage_id: "PB-05",
            consumed_effective_paths: pb05Paths,
          },
          contact_constraint_policy: contactConstraintPolicy,
          action_context: actionContext,
        }),
      },
      "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
    )) as unknown as SplitReportContentV2;
    const contextualDecisionFacts = projectSplitDecisionFacts(
      input.baseStructuredIntake,
      input.candidateEnvelope,
    );
    let reportContent = groundReportContentV3(
      contextualDecisionFacts,
      generatedReport as unknown as ReportContent,
    ) as unknown as SplitReportContentV2;
    reportContent = groundChangeConditionCommentaryV3(
      decisionPlan as unknown as DecisionPlan,
      reportContent as unknown as ReportContent,
    ) as unknown as SplitReportContentV2;
    validateStageOutput(
      this.definition("PB-05"),
      reportContent as unknown as JsonObject,
    );
    const semanticQualityRuntime =
      input.runContext.promptBundleVersion === "prompt-bundle-runtime-v14.0.0";
    if (semanticQualityRuntime) {
      validateProductSemanticShapeV1({
        decisionPlan,
        reportContent,
      });
    }

    const downstreamPaths = [...new Set([...pb04Paths, ...pb05Paths])];
    requireReadyMakingClarificationDownstreamV1({
      authority: input.effectiveAuthority,
      clarificationGrounding: input.clarificationGrounding,
      consumedEffectivePaths: downstreamPaths,
    });
    const pb06Paths = clarificationConsumptionPathsForStageV1(
      input.effectiveAuthority,
      "PB-06",
    );
    await this.invokeStage(
      input.runContext,
      {
        definition: this.definition("PB-06"),
        input: asJsonObject({
          base_structured_intake: input.baseStructuredIntake,
          candidate_envelope: input.candidateEnvelope,
          user_supplied_optional_message: input.request.optionalMessage,
          aggregate_safety_result: input.aggregate,
          decision_policy_result: decisionPolicy,
          effective_decision_policy_result: effectivePolicy,
          effective_assessment_authority: input.effectiveAuthority,
          clarification_consumption_contract: {
            stage_id: "PB-06",
            consumed_effective_paths: pb06Paths,
          },
          decision_plan: decisionPlan,
          report_content: reportContent,
          contact_constraint_policy: contactConstraintPolicy,
          action_context: actionContext,
        }),
      },
      "LOCAL_SEMANTIC_DISPOSITION",
      (output) => {
        requireReadyMakingClarificationDownstreamV1({
          authority: input.effectiveAuthority,
          clarificationGrounding: input.clarificationGrounding,
          consumedEffectivePaths: pb06Paths,
        });
        if (
          output.validation_mode !== "semantic_findings_only" ||
          !Array.isArray(output.semantic_checks)
        ) throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
        const { blockingFindings } = semanticQualityRuntime
          ? evaluateSemanticFindingsV5({
              validationOutput: output,
              decisionPlan,
              groundedReportContent: reportContent,
            })
          : evaluateSemanticFindingsV4({
              validationOutput: output,
              decisionPlan: decisionPlan as unknown as DecisionPlan,
              groundedReportContent: reportContent as unknown as ReportContent,
            });
        if (blockingFindings.length > 0) {
          throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
        }
      },
    );

    const report = buildSplitRuntimeReport(decisionPlan, reportContent);
    const decisionCard = buildSplitDecisionCard(decisionPlan, reportContent);
    this.emit("SAVE_FINAL_REPORT");
    this.emit("COMPLETE_RUN");
    await this.repository.finalizeCompletedAssessment({
      reportId: this.uuid(),
      runId: input.runContext.runId,
      requestId: input.runContext.requestId,
      returnedModel: this.returnedModel,
      eligibility: "ready",
      decision: decisionPlan.selected_decision,
      reportJson: report,
      decisionCardJson: decisionCard,
      completedAt: this.now(),
      ...this.usage,
    });
    return {
      requestId: input.runContext.requestId,
      runId: input.runContext.runId,
      eligibility: "ready",
      decision: decisionPlan.selected_decision,
      report,
      decisionCard,
      duplicate: false,
      usage: this.usage,
    };
  }

  private async executeV1A2Initial(
    request: AssessmentInput,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    const deterministicSafety = deterministicSafetyResult(request);
    const baseProviderInput = projectBaseProviderInputV1(request);
    let baseStructuredIntake: JsonObject | null = null;
    await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-01"),
        input: asJsonObject({
          run_mode: "initial_base",
          base_provider_input: baseProviderInput,
        }),
      },
      "LOCAL_SCHEMA_PB-01",
      (rawOutput) => {
        validateBaseSourceIntegrityV1({
          input: baseProviderInput,
          baseProviderRequest: baseProviderInput,
          rawBaseOutput: rawOutput,
        });
        const grounded = groundBaseStructuredIntakeV3(baseProviderInput, rawOutput);
        validateGroundedStageOutput(this.definition("PB-01"), grounded);
        validateBaseSourceIntegrityV1({
          input: baseProviderInput,
          groundedBaseOutput: grounded,
        });
        validateContextualIntakeIntegrityV3(grounded);
        baseStructuredIntake = grounded;
      },
    );
    if (!baseStructuredIntake) {
      throw new M2RuntimeError("M2_BASE_SOURCE_INTEGRITY_FAILED");
    }
    const candidateOutcome =
      request.optionalMessage === null || request.optionalMessage.trim() === ""
        ? { kind: "absent" as const, lane: await this.skipCandidateStage(runContext) }
        : await this.invokeCandidateStage(runContext, request.optionalMessage);
    if (candidateOutcome.kind === "safety_unavailable") {
      if (deterministicSafety.classification === "normal_allowed") {
        throw new M2RuntimeError("M2_CANDIDATE_SAFETY_UNAVAILABLE");
      }
      return this.completeV1A2Stop({
        runContext,
        eligibility: "safety_blocked",
        reasonCodes: ["SAFETY_CLASSIFICATION_NOT_NORMAL"],
      });
    }
    const initialEnvelope = buildSplitAnalysisEnvelopeV1({
      baseStructuredIntake,
      baseLegacyView: buildBaseStructuredIntakeLegacyViewV1(baseStructuredIntake),
      candidateLane: candidateOutcome.lane,
    });
    const modelSafety = await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-02"),
        input: asJsonObject({
          base_structured_intake: initialEnvelope.base_structured_intake,
          deterministic_rule_result: deterministicSafety,
          candidate_safety_result: initialEnvelope.candidate_safety_result,
        }),
      },
      "LOCAL_SCHEMA_PB-02",
    );
    const { aggregate, splitEnvelope } = this.buildV1A2Aggregate({
      request,
      baseStructuredIntake,
      candidateLane: candidateOutcome.lane,
      modelSafety,
    });
    this.emit("LOCAL_SAFETY_AGGREGATION");
    const safetyEligibility = deriveRuntimeEligibilityV3(aggregate);
    await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-03"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          aggregate_safety_result: aggregate,
          application_eligibility_expectation: safetyEligibility,
        }),
      },
      "LOCAL_SCHEMA_PB-03",
      (output) => validateEligibilityProjectionV3(output, safetyEligibility),
    );
    this.emit("LOCAL_ELIGIBILITY_GATE");
    const effectiveAuthority = buildEffectiveAssessmentAuthorityV1({
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope,
      clarificationGrounding: null,
    });
    validateEffectiveAssessmentAuthorityIntegrityV1({
      authority: effectiveAuthority,
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope as unknown as JsonObject,
      clarificationGrounding: null,
    });
    this.emit("LOCAL_EFFECTIVE_ASSESSMENT_AUTHORITY");
    this.emit("LOCAL_JPY980_INPUT_SUFFICIENCY");
    const policy = this.evaluateV1A2InputSufficiency({
      runContext,
      baseStructuredIntake,
      aggregate,
      clarificationGrounding: null,
      effectiveAuthority,
    });
    if (policy.state === "safety_blocked") {
      return this.completeV1A2Stop({
        runContext,
        eligibility: "safety_blocked",
        reasonCodes: policy.reasonCodes,
      });
    }
    if (policy.state === "needs_one_clarifying_answer") {
      return this.completeV1A2NeedsMore({ runContext, policy });
    }
    if (policy.state === "not_full_product_candidate") {
      return this.completeV1A2Stop({
        runContext,
        eligibility: "not_full_product_candidate",
        reasonCodes: policy.reasonCodes,
      });
    }
    return this.completeV1A2Ready({
      request,
      runContext,
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope,
      aggregate,
      effectiveAuthority,
      clarificationGrounding: null,
    });
  }

  private candidateLaneFromInitialAuthority(
    request: AssessmentInput,
    initial: PersistedInitialAuthorityV1,
  ) {
    if (request.optionalMessage === null || request.optionalMessage.trim() === "") {
      if (initial.pb01c.status !== "skipped") {
        throw new M2RuntimeError("M2_INITIAL_AUTHORITY_MISSING");
      }
      return buildAbsentCandidateLaneV1();
    }
    if (!initial.pb01c.outputJson) {
      throw new M2RuntimeError("M2_INITIAL_AUTHORITY_MISSING");
    }
    if (initial.pb01c.status === "completed") {
      const grounded = groundCandidateAnalysisV2(initial.pb01c.outputJson);
      validateCandidateSourceIntegrityV1({
        candidateAnalysis: grounded.candidate_analysis,
        candidateSafetyResult: grounded.candidate_safety_result,
      });
      return buildAvailableCandidateLaneV1(
        grounded.candidate_analysis,
        grounded.candidate_safety_result,
      );
    }
    if (
      initial.pb01c.status === "failed" &&
      initial.pb01c.errorCode === "M2_CANDIDATE_ANALYSIS_UNAVAILABLE"
    ) {
      const candidateSafety = initial.pb01c.outputJson
        .candidate_safety_signals as unknown as CandidateSafetySignalsV1;
      validateCandidateSourceIntegrityV1({ candidateSafetyResult: candidateSafety });
      return buildAnalysisUnavailableSafetyAvailableCandidateLaneV1(
        candidateSafety,
      );
    }
    throw new M2RuntimeError("M2_INITIAL_AUTHORITY_MISSING");
  }

  async resume(
    request: AssessmentInput,
    initial: PersistedInitialAuthorityV1,
    evidence: ClarificationEvidenceV1,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    this.usage = emptyUsageTotals();
    this.returnedModel = null;
    try {
      return await this.resumeWithAccumulatedUsage(
        request,
        initial,
        evidence,
        runContext,
      );
    } catch (error) {
      const safeError = asM2RuntimeError(error);
      try {
        await this.repository.failRun({
          runId: runContext.runId,
          requestId: runContext.requestId,
          returnedModel: this.returnedModel,
          errorCode: safeError.safeCode,
          completedAt: this.now(),
          ...this.usage,
        });
      } catch {
        throw new M2RuntimeError("M2_RUN_PERSISTENCE_FAILED");
      }
      throw safeError;
    }
  }

  private async resumeWithAccumulatedUsage(
    request: AssessmentInput,
    initial: PersistedInitialAuthorityV1,
    evidence: ClarificationEvidenceV1,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    this.validateRuntimeIdentity(runContext);
    if (
      (runContext.promptBundleVersion !== "prompt-bundle-runtime-v12.0.0" &&
        runContext.promptBundleVersion !== "prompt-bundle-runtime-v13.0.0" &&
        runContext.promptBundleVersion !== "prompt-bundle-runtime-v14.0.0" &&
        runContext.promptBundleVersion !== "prompt-bundle-runtime-v15.0.0" &&
        runContext.promptBundleVersion !== "prompt-bundle-runtime-v16.0.0" &&
        runContext.promptBundleVersion !== "prompt-bundle-runtime-v17.0.0") ||
      runContext.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
      initial.request.id !== runContext.requestId ||
      evidence.ordinal !== 1
    ) {
      throw new M2RuntimeError("M2_CLARIFICATION_STATE_CONFLICT", 409);
    }
    const baseProviderInput = projectBaseProviderInputV1(request);
    validateBaseSourceIntegrityV1({
      input: baseProviderInput,
      baseProviderRequest: baseProviderInput,
      rawBaseOutput: initial.pb01Output,
    });
    const baseStructuredIntake = groundBaseStructuredIntakeV3(
      baseProviderInput,
      initial.pb01Output,
    );
    validateGroundedStageOutput(this.definition("PB-01"), baseStructuredIntake);
    const candidateLane = this.candidateLaneFromInitialAuthority(request, initial);

    const rawClarificationGrounding = await this.invokeStage(
      runContext,
      {
        definition: this.clarificationDefinition(),
        input: asJsonObject({
          run_mode: "clarification_resume",
          clarification_evidence: {
            schema_version: evidence.schemaVersion,
            ordinal: evidence.ordinal,
            question_code: evidence.questionCode,
            target: evidence.target,
            question_snapshot: evidence.questionSnapshot,
            validated_answer: evidence.answer,
            grounded_normalized_representation:
              evidence.groundedNormalizedRepresentation,
            provenance: evidence.provenance,
            source_identity: evidence.sourceIdentity,
            answer_fingerprint: evidence.answerFingerprint,
            resolves_target: evidence.resolvesTarget,
          },
        }),
      },
      "LOCAL_SCHEMA_PB-01",
    );
    this.emit("LOCAL_CLARIFICATION_GROUNDING");
    const clarificationGrounding = groundClarificationEvidenceV1({
      evidence,
      providerOutput: rawClarificationGrounding,
    });
    validateClarificationSourceIntegrityV1({
      evidence,
      grounding: clarificationGrounding,
    });
    await this.repository.completeClarificationGrounding({
      clarificationId: evidence.clarificationId,
      groundedNormalizedRepresentation:
        clarificationGrounding.normalizedValue,
      safetySignals: [
        clarificationGrounding.clarificationSafety as unknown as JsonObject,
      ],
    });
    await this.skipReusedStage(runContext, "PB-01C");
    await this.skipReusedStage(runContext, "PB-02");
    await this.skipReusedStage(runContext, "PB-03");

    const { aggregate, splitEnvelope } = this.buildV1A2Aggregate({
      request,
      baseStructuredIntake,
      candidateLane,
      modelSafety: initial.pb02Output,
      clarificationSafety: clarificationGrounding.clarificationSafety,
    });
    this.emit("LOCAL_SAFETY_AGGREGATION");
    const effectiveAuthority = buildEffectiveAssessmentAuthorityV1({
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope,
      clarificationGrounding,
    });
    validateEffectiveAssessmentAuthorityIntegrityV1({
      authority: effectiveAuthority,
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope as unknown as JsonObject,
      clarificationGrounding,
    });
    this.emit("LOCAL_EFFECTIVE_ASSESSMENT_AUTHORITY");
    this.emit("LOCAL_JPY980_INPUT_SUFFICIENCY");
    const policy = this.evaluateV1A2InputSufficiency({
      runContext,
      baseStructuredIntake,
      aggregate,
      clarificationGrounding,
      effectiveAuthority,
    });
    if (policy.state === "needs_one_clarifying_answer") {
      throw new M2RuntimeError("M2_SECOND_CLARIFICATION_PROHIBITED");
    }
    if (policy.state === "safety_blocked") {
      return this.completeV1A2Stop({
        runContext,
        eligibility: "safety_blocked",
        reasonCodes: policy.reasonCodes,
      });
    }
    if (policy.state === "not_full_product_candidate") {
      return this.completeV1A2Stop({
        runContext,
        eligibility: "not_full_product_candidate",
        reasonCodes: policy.reasonCodes,
      });
    }
    return this.completeV1A2Ready({
      request,
      runContext,
      baseStructuredIntake,
      candidateEnvelope: splitEnvelope.candidate_envelope,
      aggregate,
      effectiveAuthority,
      clarificationGrounding,
    });
  }

  private async executeSplit(
    request: AssessmentInput,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    if (
      runContext.promptBundleVersion === "prompt-bundle-runtime-v12.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v13.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v14.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v15.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v16.0.0" ||
      runContext.promptBundleVersion === "prompt-bundle-runtime-v17.0.0"
    ) {
      return this.executeV1A2Initial(request, runContext);
    }
    const directionalGuidanceRuntime =
      runContext.promptBundleVersion === "prompt-bundle-runtime-v10.0.0";
    const authorityIntegrityRuntime =
      runContext.promptBundleVersion === "prompt-bundle-runtime-v11.0.0";
    const deterministicSafety = deterministicSafetyResult(request);
    const baseProviderInput = projectBaseProviderInputV1(request);
    let baseStructuredIntake: JsonObject | null = null;

    await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-01"),
        input: asJsonObject(baseProviderInput),
      },
      "LOCAL_SCHEMA_PB-01",
      (rawBaseOutput) => {
        validateBaseSourceIntegrityV1({
          input: baseProviderInput,
          baseProviderRequest: baseProviderInput,
          rawBaseOutput,
        });
        const grounded = authorityIntegrityRuntime
          ? groundBaseStructuredIntakeV3(baseProviderInput, rawBaseOutput)
          : directionalGuidanceRuntime
            ? groundBaseStructuredIntakeV2(baseProviderInput, rawBaseOutput)
            : groundBaseStructuredIntakeV1(baseProviderInput, rawBaseOutput);
        validateGroundedStageOutput(this.definition("PB-01"), grounded);
        validateBaseSourceIntegrityV1({
          input: baseProviderInput,
          groundedBaseOutput: grounded,
        });
        validateContextualIntakeIntegrityV3(grounded);
        baseStructuredIntake = grounded;
      },
    );
    if (baseStructuredIntake === null) {
      throw new M2RuntimeError("M2_BASE_SOURCE_INTEGRITY_FAILED");
    }
    const baseLegacyView = buildBaseStructuredIntakeLegacyViewV1(
      baseStructuredIntake,
    );
    validateBaseSourceIntegrityV1({
      input: baseProviderInput,
      groundedBaseOutput: baseStructuredIntake,
      baseLegacyView,
    });

    const candidateStageOutcome =
      request.optionalMessage === null || request.optionalMessage.trim() === ""
        ? {
            kind: "absent" as const,
            lane: await this.skipCandidateStage(runContext),
          }
        : await this.invokeCandidateStage(runContext, request.optionalMessage);

    if (candidateStageOutcome.kind === "safety_unavailable") {
      if (deterministicSafety.classification === "normal_allowed") {
        throw new M2RuntimeError("M2_CANDIDATE_SAFETY_UNAVAILABLE");
      }
      return this.completeSplitSafetyBlocked(runContext);
    }

    const splitEnvelope = buildSplitAnalysisEnvelopeV1({
      baseStructuredIntake,
      baseLegacyView,
      candidateLane: candidateStageOutcome.lane,
    });
    const modelSafety = await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-02"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          deterministic_rule_result: deterministicSafety,
          candidate_safety_result: splitEnvelope.candidate_safety_result,
        }),
      },
      "LOCAL_SCHEMA_PB-02",
    );

    this.emit("LOCAL_SAFETY_AGGREGATION");
    const candidateSemanticSafety = splitEnvelope.candidate_safety_result
      ? projectCandidateSafetyDispositionV1(
          splitEnvelope.candidate_safety_result,
        )
      : {
          classification: "normal_allowed" as const,
          reason_codes: [],
          response_mode: "none" as const,
        };
    const boundaryContactSafety = evaluateCandidateBoundaryContactV1(
      splitEnvelope.base_structured_intake,
      splitEnvelope.candidate_safety_result,
    );
    const candidateAggregatedSafety = aggregateSafetyV3(
      deterministicSafety,
      modelSafety,
      candidateSemanticSafety,
    );
    const aggregate = aggregateSafetyV3(
      candidateAggregatedSafety,
      asJsonObject(boundaryContactSafety),
    );
    const applicationEligibility = deriveRuntimeEligibilityV3(aggregate);

    await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-03"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          aggregate_safety_result: aggregate,
          application_eligibility_expectation: applicationEligibility,
        }),
      },
      "LOCAL_SCHEMA_PB-03",
      (output) =>
        validateEligibilityProjectionV3(output, applicationEligibility),
    );
    this.emit("LOCAL_ELIGIBILITY_GATE");
    if (applicationEligibility !== "ready") {
      return this.completeSplitSafetyBlocked(runContext);
    }

    this.emit("LOCAL_DECISION_POLICY");
    const contextualDecisionFacts = projectSplitDecisionFacts(
      splitEnvelope.base_structured_intake,
      splitEnvelope.candidate_envelope,
    );
    const decisionPolicy = buildContextualDecisionPolicyV3(
      contextualDecisionFacts,
    );
    let actionContext: ActionContextV1 | null = null;
    let contactConstraintPolicy: ContactConstraintPolicyV1 | null = null;
    if (authorityIntegrityRuntime) {
      if (!this.timeZone) {
        throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
      }
      actionContext = createActionContextV1({
        trustedNowIso: runContext.startedAt,
        timeZone: this.timeZone,
      });
      contactConstraintPolicy = createContactConstraintPolicyV1({
        baseStructuredIntake: splitEnvelope.base_structured_intake,
        followUpException: decisionPolicy.follow_up_exception,
      });
    }
    const decisionPlan = (await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-04"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          candidate_envelope: splitEnvelope.candidate_envelope,
          user_supplied_optional_message: request.optionalMessage,
          decision_policy_result: decisionPolicy,
          ...(authorityIntegrityRuntime
            ? {
                contact_constraint_policy: contactConstraintPolicy,
                action_context: actionContext,
              }
            : {}),
          requested_topics: request.requestedTopics,
        }),
      },
      "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
      (output) => {
        validateSplitDecisionPlan(
          output as unknown as SplitDecisionPlanV2,
          decisionPolicy,
          splitEnvelope.candidate_envelope,
        );
        if (authorityIntegrityRuntime) {
          if (!actionContext || !contactConstraintPolicy) {
            throw new M2RuntimeError("M2_RUNTIME_AUTHORITY_INVALID");
          }
          validateDecisionPlanConstraintIntegrityV1({
            decisionPlan: output as unknown as SplitDecisionPlanV2,
            contactConstraintPolicy,
            actionContext,
          });
        }
      },
    )) as unknown as SplitDecisionPlanV2;

    const generatedReportContent = (await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-05"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          candidate_envelope: splitEnvelope.candidate_envelope,
          decision_plan: decisionPlan,
          ...(authorityIntegrityRuntime
            ? {
                contact_constraint_policy: contactConstraintPolicy,
                action_context: actionContext,
              }
            : {}),
        }),
      },
      "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
    )) as unknown as SplitReportContentV2;
    let reportContent = groundReportContentV3(
      contextualDecisionFacts,
      generatedReportContent as unknown as ReportContent,
    ) as unknown as SplitReportContentV2;
    reportContent = groundChangeConditionCommentaryV3(
      decisionPlan as unknown as DecisionPlan,
      reportContent as unknown as ReportContent,
    ) as unknown as SplitReportContentV2;
    validateStageOutput(
      this.definition("PB-05"),
      reportContent as unknown as JsonObject,
    );

    await this.invokeStage(
      runContext,
      {
        definition: this.definition("PB-06"),
        input: asJsonObject({
          base_structured_intake: splitEnvelope.base_structured_intake,
          candidate_envelope: splitEnvelope.candidate_envelope,
          user_supplied_optional_message: request.optionalMessage,
          aggregate_safety_result: aggregate,
          decision_policy_result: decisionPolicy,
          decision_plan: decisionPlan,
          report_content: reportContent,
          ...(authorityIntegrityRuntime
            ? {
                contact_constraint_policy: contactConstraintPolicy,
                action_context: actionContext,
              }
            : {}),
        }),
      },
      "LOCAL_SEMANTIC_DISPOSITION",
      (output) => {
        if (
          output.validation_mode !== "semantic_findings_only" ||
          !Array.isArray(output.semantic_checks)
        ) {
          throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
        }
        const { blockingFindings } =
          directionalGuidanceRuntime || authorityIntegrityRuntime
          ? evaluateSemanticFindingsV4({
              validationOutput: output,
              decisionPlan: decisionPlan as unknown as DecisionPlan,
              groundedReportContent: reportContent as unknown as ReportContent,
            })
          : evaluateSemanticFindingsV3({
              validationOutput: output,
              decisionPlan: decisionPlan as unknown as DecisionPlan,
              groundedReportContent: reportContent as unknown as ReportContent,
            });
        if (blockingFindings.length > 0) {
          throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
        }
      },
    );

    const report = buildSplitRuntimeReport(decisionPlan, reportContent);
    const decisionCard = buildSplitDecisionCard(decisionPlan, reportContent);
    this.emit("SAVE_FINAL_REPORT");
    this.emit("COMPLETE_RUN");
    try {
      await this.repository.finalizeCompletedAssessment({
        reportId: this.uuid(),
        runId: runContext.runId,
        requestId: runContext.requestId,
        returnedModel: this.returnedModel,
        eligibility: "ready",
        decision: decisionPlan.selected_decision,
        reportJson: report,
        decisionCardJson: decisionCard,
        completedAt: this.now(),
        ...this.usage,
      });
    } catch {
      throw new M2RuntimeError("M2_FINALIZATION_PERSISTENCE_FAILED");
    }
    return {
      requestId: runContext.requestId,
      runId: runContext.runId,
      eligibility: "ready",
      decision: decisionPlan.selected_decision,
      report,
      decisionCard,
      duplicate: false,
      usage: this.usage,
    };
  }

  async execute(
    request: AssessmentInput,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    this.usage = emptyUsageTotals();
    this.returnedModel = null;
    this.validateRuntimeIdentity(runContext);
    await this.repository.createRun({
      id: runContext.runId,
      requestId: runContext.requestId,
      requestedModel: runContext.model,
      promptBundleVersion: runContext.promptBundleVersion,
      schemaSetVersion: runContext.schemaSetVersion,
      stageTopologyVersion: this.stageTopologyVersion,
      runKind: "initial",
      startedAt: runContext.startedAt,
    });

    try {
      if (this.stageTopologyVersion === "split-base-candidate-v1") {
        return await this.executeSplit(request, runContext);
      }
      const deterministicSafety = deterministicSafetyResult(request);
      const responsibilityRevisionRuntime =
        runContext.schemaSetVersion === "pipeline-schema-runtime-v3.2.0";
      const writingContextRuntime =
        runContext.schemaSetVersion === "pipeline-schema-runtime-v3.1.0";
      const writingContextOutputRuntime =
        writingContextRuntime || responsibilityRevisionRuntime;
      const contextualRuntime =
        runContext.schemaSetVersion === "pipeline-schema-runtime-v3.0.0" ||
        writingContextOutputRuntime;
      const productQualityRuntime =
        runContext.promptBundleVersion === "prompt-bundle-runtime-v4.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v5.0.0" ||
        runContext.promptBundleVersion === "prompt-bundle-runtime-v6.0.0";
      const rawStructuredIntake = await this.invokeStage(
        runContext,
        {
          definition: this.definition("PB-01"),
          input: asJsonObject({
            current_situation: request.currentSituation,
            optional_message: request.optionalMessage,
            relationship: request.relationship,
            requested_topics: request.requestedTopics,
          }),
        },
        "LOCAL_SCHEMA_PB-01",
      );
      const groundedStructuredIntake = responsibilityRevisionRuntime
        ? groundStructuredIntakeV5(request, rawStructuredIntake)
        : writingContextRuntime
          ? groundStructuredIntakeV4(request, rawStructuredIntake)
          : contextualRuntime
            ? groundStructuredIntakeV3(request, rawStructuredIntake)
            : rawStructuredIntake;
      if (contextualRuntime) {
        if (responsibilityRevisionRuntime) {
          validateGroundedStageOutput(
            this.definition("PB-01"),
            groundedStructuredIntake,
          );
          validateWritingContextIntegrityV2(
            request,
            groundedStructuredIntake,
          );
          validateContextualIntakeIntegrityV3(groundedStructuredIntake);
        } else {
          validateStageOutput(
            this.definition("PB-01"),
            groundedStructuredIntake,
          );
        }
        if (writingContextRuntime) {
          validateWritingContextIntegrityV1(request, groundedStructuredIntake);
        } else if (!responsibilityRevisionRuntime) {
          validateContextualIntakeIntegrityV3(groundedStructuredIntake);
        }
      }
      const structuredIntake = writingContextOutputRuntime
        ? buildStructuredIntakeLegacyViewV3(groundedStructuredIntake)
        : groundedStructuredIntake;
      if (writingContextRuntime) {
        validateContextualIntakeIntegrityV3(structuredIntake);
      }

      const modelSafety = await this.invokeStage(
        runContext,
        {
          definition: this.definition("PB-02"),
          input: asJsonObject({
            structured_intake: structuredIntake,
            deterministic_rule_result: deterministicSafety,
          }),
        },
        "LOCAL_SCHEMA_PB-02",
      );

      let aggregate: SafetyResult;
      let modelEligibility: JsonObject;
      let eligibility: Eligibility;
      let eligibilityResult: JsonObject;

      if (contextualRuntime) {
        this.emit("LOCAL_SAFETY_AGGREGATION");
        aggregate = aggregateSafetyV3(deterministicSafety, modelSafety);
        const applicationEligibility = deriveRuntimeEligibilityV3(aggregate);
        modelEligibility = await this.invokeStage(
          runContext,
          {
            definition: this.definition("PB-03"),
            input: asJsonObject({
              structured_intake: structuredIntake,
              deterministic_rule_result: deterministicSafety,
              model_semantic_result: modelSafety,
              application_eligibility_expectation: applicationEligibility,
            }),
          },
          "LOCAL_SCHEMA_PB-03",
          (output) =>
            validateEligibilityProjectionV3(output, applicationEligibility),
        );
        this.emit("LOCAL_ELIGIBILITY_GATE");
        eligibility = applicationEligibility;
        eligibilityResult = asJsonObject(
          buildLocalEligibilityResultV3(applicationEligibility),
        );
      } else {
        modelEligibility = await this.invokeStage(
          runContext,
          {
            definition: this.definition("PB-03"),
            input: asJsonObject({
              structured_intake: structuredIntake,
              deterministic_rule_result: deterministicSafety,
              model_semantic_result: modelSafety,
            }),
          },
          "LOCAL_SCHEMA_PB-03",
        );
        this.emit("LOCAL_SAFETY_AGGREGATION");
        aggregate = aggregateSafety(deterministicSafety, modelSafety);
        this.emit("LOCAL_ELIGIBILITY_GATE");
        eligibility = eligibilityFrom(aggregate, modelEligibility);
        eligibilityResult = modelEligibility;
      }

      if (eligibility !== "ready") {
        this.emit("COMPLETE_RUN");
        await this.repository.completeRun({
          runId: runContext.runId,
          requestId: runContext.requestId,
          returnedModel: this.returnedModel,
          eligibility,
          decision: null,
          completedAt: this.now(),
          ...this.usage,
        });
        return {
          requestId: runContext.requestId,
          runId: runContext.runId,
          eligibility,
          questionCodes:
            eligibility === "needs_more_information"
              ? stringArray(modelEligibility.question_codes).slice(0, 3)
              : [],
          reasonCodes: [],
          clarification: null,
          duplicate: false,
          usage: this.usage,
        };
      }

      this.emit("LOCAL_DECISION_POLICY");
      const contextualDecisionFacts = contextualRuntime
        ? requireContextualDecisionFactsV3(structuredIntake)
        : null;
      let decisionPolicy: DecisionPolicyResultV2;
      if (contextualDecisionFacts) {
        decisionPolicy = buildContextualDecisionPolicyV3(
          contextualDecisionFacts,
        );
      } else {
        const decisionFacts = requireDecisionFacts(structuredIntake);
        decisionPolicy = buildDecisionPolicyV2(decisionFacts);
      }
      const decisionPlan = (await this.invokeStage(
        runContext,
        {
          definition: this.definition("PB-04"),
          input: asJsonObject({
            structured_intake: structuredIntake,
            aggregate_safety_result: aggregate,
            eligibility_result: eligibilityResult,
            decision_policy_result: decisionPolicy,
            ...(productQualityRuntime
              ? {
                  user_supplied_optional_message: request.optionalMessage,
                  requested_topics: request.requestedTopics,
                }
              : {}),
          }),
        },
        "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
        (output) => {
          const plan = output as unknown as DecisionPlan;
          if (contextualRuntime) {
            validateContextualDecisionPlanV3(plan, decisionPolicy);
          } else {
            validateDecisionPlanAgainstPolicyV2(plan, decisionPolicy);
          }
        },
      )) as unknown as DecisionPlan;

      const generatedReportContent = (await this.invokeStage(
        runContext,
        {
          definition: this.definition("PB-05"),
          input: asJsonObject({
            structured_intake: structuredIntake,
            decision_plan: decisionPlan,
            ...(productQualityRuntime
              ? {
                  user_supplied_optional_message: request.optionalMessage,
                  requested_topics: request.requestedTopics,
                }
              : {}),
          }),
        },
        "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
      )) as unknown as ReportContent;
      let reportContent = generatedReportContent;
      if (contextualDecisionFacts) {
        reportContent = groundReportContentV3(
          contextualDecisionFacts,
          reportContent,
        );
        reportContent = groundChangeConditionCommentaryV3(
          decisionPlan,
          reportContent,
        );
        validateStageOutput(this.definition("PB-05"), reportContent);
      }

      await this.invokeStage(
        runContext,
        {
          definition: this.definition("PB-06"),
          input: asJsonObject({
            structured_intake: structuredIntake,
            aggregate_safety_result: aggregate,
            decision_policy_result: decisionPolicy,
            decision_plan: decisionPlan,
            report_content: reportContent,
            ...(productQualityRuntime
              ? {
                  user_supplied_optional_message: request.optionalMessage,
                  requested_topics: request.requestedTopics,
                }
              : {}),
          }),
        },
        "LOCAL_SEMANTIC_DISPOSITION",
        (output) => {
          if (
            output.validation_mode !== "semantic_findings_only" ||
            !Array.isArray(output.semantic_checks)
          ) {
            throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
          }
          const blockingFindings = contextualRuntime
            ? evaluateSemanticFindingsV3({
                validationOutput: output,
                decisionPlan,
                groundedReportContent: reportContent,
              }).blockingFindings
            : output.semantic_checks.filter(isMajorOrCriticalFinding);
          if (blockingFindings.length > 0) {
            throw new M2RuntimeError("M2_SEMANTIC_VALIDATION_FAILED");
          }
        },
      );

      const report = buildRuntimeReport(decisionPlan, reportContent);
      const decisionCard = buildDecisionCard(decisionPlan, reportContent);
      this.emit("SAVE_FINAL_REPORT");
      this.emit("COMPLETE_RUN");
      try {
        await this.repository.finalizeCompletedAssessment({
          reportId: this.uuid(),
          runId: runContext.runId,
          requestId: runContext.requestId,
          returnedModel: this.returnedModel,
          eligibility: "ready",
          decision: decisionPlan.selected_decision,
          reportJson: report,
          decisionCardJson: decisionCard,
          completedAt: this.now(),
          ...this.usage,
        });
      } catch {
        throw new M2RuntimeError("M2_FINALIZATION_PERSISTENCE_FAILED");
      }

      return {
        requestId: runContext.requestId,
        runId: runContext.runId,
        eligibility: "ready",
        decision: decisionPlan.selected_decision,
        report,
        decisionCard,
        duplicate: false,
        usage: this.usage,
      };
    } catch (error) {
      const safeError = asM2RuntimeError(error);
      try {
        await this.repository.failRun({
          runId: runContext.runId,
          requestId: runContext.requestId,
          returnedModel: this.returnedModel,
          errorCode: safeError.safeCode,
          completedAt: this.now(),
          ...this.usage,
        });
      } catch {
        throw new M2RuntimeError("M2_RUN_PERSISTENCE_FAILED");
      }
      throw safeError;
    }
  }
}
