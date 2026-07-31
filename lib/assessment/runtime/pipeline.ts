import { randomUUID } from "node:crypto";
import { validateContextualIntakeIntegrityV3 } from "./contextual-integrity-v3.ts";
import { addUsage, emptyUsageTotals } from "./cost.ts";
import {
  buildLocalEligibilityResultV3,
  deriveRuntimeEligibilityV3,
  validateEligibilityProjectionV3,
} from "./eligibility-v3.ts";
import { asM2RuntimeError, M2RuntimeError } from "./errors.ts";
import { hashJson } from "./hash.ts";
import {
  aggregateSafety,
  deterministicSafetyResult,
} from "./policy.ts";
import type { SafetyResult } from "./policy.ts";
import { groundReportContentV3 } from "./report-grounding-v3.ts";
import { aggregateSafetyV3 } from "./safety-aggregation-v3.ts";
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
  AssessmentExecutionResult,
  AssessmentInput,
  AssessmentRepository,
  DecisionCard,
  DecisionPlan,
  DecisionPolicyResultV2,
  Eligibility,
  JsonObject,
  M2StageId,
  PipelineObserver,
  ReportContent,
  RuntimeReport,
  StageDefinition,
  StageResponse,
  UsageTotals,
} from "./types.ts";
import { validateStageOutput } from "./validation.ts";

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
};

type StageInput = {
  definition: StageDefinition;
  input: JsonObject;
};

const zeroUsage = Object.freeze({
  inputTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
});

function asJsonObject(value: unknown) {
  return value as JsonObject;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
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

export class AssessmentPipeline {
  private readonly repository: AssessmentRepository;
  private readonly transport: AiStageTransport;
  private readonly definitions: Map<M2StageId, StageDefinition>;
  private readonly observe?: PipelineObserver;
  private readonly now: () => string;
  private readonly uuid: () => string;
  private usage: UsageTotals = emptyUsageTotals();
  private returnedModel: string | null = null;

  constructor(options: PipelineOptions) {
    this.repository = options.repository;
    this.transport = options.transport;
    this.definitions = new Map(
      options.definitions.map((definition) => [
        definition.stageId,
        definition,
      ]),
    );
    this.observe = options.observe;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
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
  ) {
    this.emit(definition.stageId);
    const stageRunId = this.uuid();
    const requestHash = hashJson({
      stageId: definition.stageId,
      model: runContext.model,
      promptHash: definition.promptHash,
      schemaHash: definition.schemaHash,
      input,
    });
    await this.repository.startStage({
      id: stageRunId,
      runId: runContext.runId,
      stageId: definition.stageId,
      sequenceNumber: definition.sequenceNumber,
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

  async execute(
    request: AssessmentInput,
    runContext: AssessmentRunContext,
  ): Promise<AssessmentExecutionResult> {
    this.usage = emptyUsageTotals();
    this.returnedModel = null;
    await this.repository.createRun({
      id: runContext.runId,
      requestId: runContext.requestId,
      requestedModel: runContext.model,
      promptBundleVersion: runContext.promptBundleVersion,
      schemaSetVersion: runContext.schemaSetVersion,
      startedAt: runContext.startedAt,
    });

    try {
      const deterministicSafety = deterministicSafetyResult(request);
      const contextualRuntime =
        runContext.schemaSetVersion === "pipeline-schema-runtime-v3.0.0";
      const structuredIntake = await this.invokeStage(
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
        contextualRuntime
          ? (output) => validateContextualIntakeIntegrityV3(output)
          : undefined,
      );

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
          }),
        },
        "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
      )) as unknown as ReportContent;
      const reportContent = contextualDecisionFacts
        ? groundReportContentV3(
            contextualDecisionFacts,
            generatedReportContent,
          )
        : generatedReportContent;

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
          }),
        },
        "LOCAL_SEMANTIC_DISPOSITION",
        (output) => {
          if (
            output.validation_mode !== "semantic_findings_only" ||
            !Array.isArray(output.semantic_checks) ||
            output.semantic_checks.some(
              (finding) =>
                typeof finding === "object" &&
                finding !== null &&
                !Array.isArray(finding) &&
                (finding.severity === "critical" ||
                  finding.severity === "major"),
            )
          ) {
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
