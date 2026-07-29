import { randomUUID } from "node:crypto";
import { M2RuntimeError } from "./errors.ts";
import { AssessmentPipeline } from "./pipeline.ts";
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
    if (existing.status === "completed") {
      const completed =
        await this.options.repository.getCompletedAssessment(existing.id);
      if (completed) {
        return { ...completed, duplicate: true } as AssessmentExecutionResult;
      }
    }
    throw new M2RuntimeError("M2_DUPLICATE_SUBMISSION", 409);
  }

  async submit(
    input: AssessmentInput,
    idempotencyKey: string,
  ): Promise<AssessmentExecutionResult> {
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
}
