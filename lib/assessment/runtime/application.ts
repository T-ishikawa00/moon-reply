import { randomUUID } from "node:crypto";
import { M2RuntimeError } from "./errors.ts";
import { AssessmentPipeline } from "./pipeline.ts";
import {
  buildClarificationEvidenceV1,
  validateClarificationAnswerV1,
  validateOpaqueClarificationIdV1,
} from "./clarification-evidence-v1.ts";
import { validateJpy980ProductScopeV1 } from "./jpy980-product-scope-validation-v1.ts";
import type {
  AiStageTransport,
  AssessmentExecutionResult,
  AssessmentInput,
  AssessmentRepository,
  PipelineObserver,
  StageDefinition,
} from "./types.ts";

type ApplicationOptions = {
  repository: AssessmentRepository;
  transport: AiStageTransport;
  model: "gpt-5.6-luna";
  promptBundleVersion: string;
  schemaSetVersion: string;
  definitions: StageDefinition[];
  observe?: PipelineObserver;
  now?: () => string;
  uuid?: () => string;
  clarificationId?: () => string;
  timeZone?: string;
};

export class AssessmentApplication {
  private readonly options: ApplicationOptions;
  private readonly now: () => string;
  private readonly uuid: () => string;

  constructor(options: ApplicationOptions) {
    this.options = options;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
  }

  private async existingResult(idempotencyKey: string) {
    const existing =
      await this.options.repository.findByIdempotencyKey(idempotencyKey);
    if (!existing) return null;
    if (
      existing.status === "completed" ||
      existing.status === "awaiting_clarification"
    ) {
      const persisted = await this.options.repository.getAssessmentResult(existing.id);
      if (persisted) {
        return {
          ...persisted,
          duplicate: true,
          authoritativeRequestedTopics: [...existing.requestedTopics],
        } as AssessmentExecutionResult;
      }
    }
    throw new M2RuntimeError("M2_DUPLICATE_SUBMISSION", 409);
  }

  async submit(
    input: AssessmentInput,
    idempotencyKey: string,
  ): Promise<AssessmentExecutionResult> {
    validateJpy980ProductScopeV1(input);
    const existing = await this.existingResult(idempotencyKey);
    if (existing) return existing;

    const now = this.now();
    const requestId = this.uuid();
    const runId = this.uuid();
    try {
      await this.options.repository.createRequest({
        id: requestId,
        idempotencyKey,
        source: "internal_review_runtime",
        ...input,
        now,
      });
    } catch (error) {
      if (
        error instanceof M2RuntimeError &&
        error.safeCode === "M2_IDEMPOTENCY_CONFLICT"
      ) {
        const concurrentResult = await this.existingResult(idempotencyKey);
        if (concurrentResult) return concurrentResult;
        throw new M2RuntimeError("M2_DUPLICATE_SUBMISSION", 409);
      }
      throw error;
    }

    const pipeline = new AssessmentPipeline({
      repository: this.options.repository,
      transport: this.options.transport,
      definitions: this.options.definitions,
      observe: this.options.observe,
      now: this.now,
      uuid: this.uuid,
      clarificationId: this.options.clarificationId,
      timeZone: this.options.timeZone,
    });
    return pipeline.execute(input, {
      requestId,
      runId,
      model: this.options.model,
      promptBundleVersion: this.options.promptBundleVersion,
      schemaSetVersion: this.options.schemaSetVersion,
      startedAt: now,
    });
  }

  async answerClarification(
    clarificationId: string,
    answer: unknown,
  ): Promise<AssessmentExecutionResult> {
    validateOpaqueClarificationIdV1(clarificationId);
    const persisted = await this.options.repository.findClarificationById(
      clarificationId,
    );
    if (!persisted) throw new M2RuntimeError("M2_CLARIFICATION_NOT_FOUND", 404);
    if (persisted.target === "original_message") throw new M2RuntimeError("M2_CLARIFICATION_EVIDENCE_INVALID");
    const resumeStartedAt = this.now();
    const validated = validateClarificationAnswerV1({
      target: persisted.target,
      answer,
      resumeStartedAt,
    });
    const resumeRunId = this.uuid();
    const accepted = await this.options.repository.acceptClarificationAndCreateResumeRun({
      clarificationId,
      answer: validated.validatedAnswer,
      answerFingerprint: validated.answerFingerprint,
      groundedNormalizedRepresentation:
        validated.groundedNormalizedRepresentation,
      answeredAt: resumeStartedAt,
      resumeRun: {
        id: resumeRunId,
        requestId: persisted.requestId,
        requestedModel: this.options.model,
        promptBundleVersion: this.options.promptBundleVersion,
        schemaSetVersion: this.options.schemaSetVersion,
        stageTopologyVersion: "split-base-candidate-v1",
        runKind: "clarification_resume",
        startedAt: resumeStartedAt,
      },
    });
    if (accepted.disposition === "duplicate") {
      const replay = await this.options.repository.getAssessmentResult(
        accepted.request.id,
      );
      if (!replay) throw new M2RuntimeError("M2_CLARIFICATION_RESUME_IN_PROGRESS", 409);
      return {
        ...replay,
        duplicate: true,
        authoritativeRequestedTopics: [...accepted.request.requestedTopics],
      } as AssessmentExecutionResult;
    }
    const initial = await this.options.repository.getInitialAuthorityForResume(
      accepted.request.id,
    );
    const evidence = buildClarificationEvidenceV1(accepted.clarification);
    const pipeline = new AssessmentPipeline({
      repository: this.options.repository,
      transport: this.options.transport,
      definitions: this.options.definitions,
      observe: this.options.observe,
      now: this.now,
      uuid: this.uuid,
      clarificationId: this.options.clarificationId,
      timeZone: this.options.timeZone,
    });
    const resumed = await pipeline.resume(
      accepted.request,
      initial,
      evidence,
      {
        requestId: accepted.request.id,
        runId: accepted.resumeRunId,
        model: this.options.model,
        promptBundleVersion: this.options.promptBundleVersion,
        schemaSetVersion: this.options.schemaSetVersion,
        startedAt: resumeStartedAt,
      },
    );
    return {
      ...resumed,
      authoritativeRequestedTopics: [...accepted.request.requestedTopics],
    } as AssessmentExecutionResult;
  }
}
