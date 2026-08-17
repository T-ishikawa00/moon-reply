import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { M2RuntimeError } from "../errors.ts";
import {
  assertOpenAIStructuredOutputSchema,
  toOpenAiStructuredOutputSchema,
} from "../openai-schema.ts";
import type {
  AiStageTransport,
  JsonObject,
  StageRequest,
  StageResponse,
  UsageRecord,
} from "../types.ts";

export const V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_PER_CASE = 12;
export const V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_TOTAL = 108;

const zeroUsage: UsageRecord = {
  inputTokens: 0,
  cachedTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
};

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export type ControlledReviewApplicationStageInvocation = {
  fixtureId: string;
  globalApplicationStageInvocationOrdinal: number;
  caseApplicationStageInvocationOrdinal: number;
  stageId: StageRequest["stageId"];
  requestedModel: StageRequest["model"];
  requestHash: string;
  promptHash: string;
  schemaHash: string;
};

export type ControlledReviewProviderHttpAttempt = {
  fixtureId: string;
  globalHttpAttemptOrdinal: number;
  caseHttpAttemptOrdinal: number;
  stageId: StageRequest["stageId"];
  requestedModel: StageRequest["model"];
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  disposition: "completed" | "failed";
  returnedModel: string | null;
  usage: UsageRecord;
  safeErrorCode: string | null;
};

export class ControlledReviewInvocationBudget {
  private totalCount = 0;
  private readonly perCaseCounts = new Map<string, number>();
  private readonly invocationRecords: ControlledReviewApplicationStageInvocation[] = [];

  consume(fixtureId: string, stageRequest: StageRequest) {
    const caseCount = this.perCaseCounts.get(fixtureId) ?? 0;
    if (
      caseCount >= V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_PER_CASE ||
      this.totalCount >= V1_D_MAXIMUM_APPLICATION_STAGE_INVOCATIONS_TOTAL
    ) {
      throw new M2RuntimeError("M2_V1D_REVIEW_STAGE_BUDGET_EXCEEDED");
    }
    const nextCaseCount = caseCount + 1;
    const nextTotalCount = this.totalCount + 1;
    this.perCaseCounts.set(fixtureId, nextCaseCount);
    this.totalCount = nextTotalCount;
    const record: ControlledReviewApplicationStageInvocation = {
      fixtureId,
      globalApplicationStageInvocationOrdinal: nextTotalCount,
      caseApplicationStageInvocationOrdinal: nextCaseCount,
      stageId: stageRequest.stageId,
      requestedModel: stageRequest.model,
      requestHash: sha256(JSON.stringify(stageRequest.input)),
      promptHash: stageRequest.promptHash,
      schemaHash: stageRequest.schemaHash,
    };
    this.invocationRecords.push(record);
    return structuredClone(record);
  }

  snapshot() {
    return {
      applicationStageInvocationCount: this.totalCount,
      applicationStageInvocationCountByFixture: Object.fromEntries(
        [...this.perCaseCounts.entries()].sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
      applicationStageInvocations: structuredClone(this.invocationRecords),
    };
  }
}

export class BudgetedControlledReviewTransport implements AiStageTransport {
  private readonly fixtureId: string;
  private readonly budget: ControlledReviewInvocationBudget;
  private readonly underlying: AiStageTransport;

  constructor(
    fixtureId: string,
    budget: ControlledReviewInvocationBudget,
    underlying: AiStageTransport,
  ) {
    this.fixtureId = fixtureId;
    this.budget = budget;
    this.underlying = underlying;
  }

  invoke(stageRequest: StageRequest): Promise<StageResponse> {
    this.budget.consume(this.fixtureId, stageRequest);
    return this.underlying.invoke(stageRequest);
  }
}

type ReviewOnlyOpenAiResponsesTransportOptions = {
  apiKey: string;
  fixtureId: string;
  nextGlobalHttpAttemptOrdinal: () => number;
  onHttpAttempt?: (
    attempt: ControlledReviewProviderHttpAttempt,
  ) => void | Promise<void>;
  clock?: () => string;
};

export class ReviewOnlyOpenAiResponsesTransport implements AiStageTransport {
  private readonly client: OpenAI;
  private caseHttpAttemptOrdinal = 0;
  private readonly clock: () => string;
  private readonly options: ReviewOnlyOpenAiResponsesTransportOptions;

  constructor(options: ReviewOnlyOpenAiResponsesTransportOptions) {
    this.options = options;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      maxRetries: 0,
    });
    this.clock = options.clock ?? (() => new Date().toISOString());
  }

  private async observe(attempt: ControlledReviewProviderHttpAttempt) {
    try {
      await this.options.onHttpAttempt?.(structuredClone(attempt));
    } catch {
      throw new M2RuntimeError("M2_V1D_REVIEW_EVIDENCE_WRITE_FAILED");
    }
  }

  async invoke(stageRequest: StageRequest): Promise<StageResponse> {
    const providerSchema = toOpenAiStructuredOutputSchema(
      stageRequest.outputSchema,
    );
    try {
      assertOpenAIStructuredOutputSchema(providerSchema);
    } catch {
      throw new M2RuntimeError("M2_STAGE_PROVIDER_FAILED");
    }

    const globalHttpAttemptOrdinal = this.options.nextGlobalHttpAttemptOrdinal();
    this.caseHttpAttemptOrdinal += 1;
    const caseHttpAttemptOrdinal = this.caseHttpAttemptOrdinal;
    const startedAt = this.clock();
    const started = performance.now();

    try {
      const response = await this.client.responses.create({
        model: stageRequest.model,
        store: false,
        tools: [],
        stream: false,
        background: false,
        service_tier: "default",
        truncation: "disabled",
        reasoning: {
          effort: "low",
        },
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: stageRequest.developerPrompt,
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(stageRequest.input),
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: stageRequest.schemaName,
            strict: true,
            schema: providerSchema,
          },
        },
      });

      if (!response.output_text) {
        throw new M2RuntimeError("M2_PROVIDER_OUTPUT_MISSING");
      }
      let output: JsonObject;
      try {
        const parsed: unknown = JSON.parse(response.output_text);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new M2RuntimeError("M2_PROVIDER_OUTPUT_INVALID");
        }
        output = parsed as JsonObject;
      } catch (error) {
        if (error instanceof M2RuntimeError) throw error;
        throw new M2RuntimeError("M2_PROVIDER_OUTPUT_INVALID");
      }

      const latencyMs = Math.max(0, Math.round(performance.now() - started));
      const usage: UsageRecord = {
        inputTokens: response.usage?.input_tokens ?? 0,
        cachedTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        reasoningTokens:
          response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      };
      await this.observe({
        fixtureId: this.options.fixtureId,
        globalHttpAttemptOrdinal,
        caseHttpAttemptOrdinal,
        stageId: stageRequest.stageId,
        requestedModel: stageRequest.model,
        startedAt,
        completedAt: this.clock(),
        latencyMs,
        disposition: "completed",
        returnedModel: response.model,
        usage,
        safeErrorCode: null,
      });
      return {
        responseId: response.id,
        returnedModel: response.model,
        output,
        usage,
        latencyMs,
      };
    } catch (error) {
      if (
        error instanceof M2RuntimeError &&
        error.safeCode === "M2_V1D_REVIEW_EVIDENCE_WRITE_FAILED"
      ) {
        throw error;
      }
      const safeErrorCode =
        error instanceof M2RuntimeError
          ? error.safeCode
          : "M2_STAGE_PROVIDER_FAILED";
      const latencyMs = Math.max(0, Math.round(performance.now() - started));
      await this.observe({
        fixtureId: this.options.fixtureId,
        globalHttpAttemptOrdinal,
        caseHttpAttemptOrdinal,
        stageId: stageRequest.stageId,
        requestedModel: stageRequest.model,
        startedAt,
        completedAt: this.clock(),
        latencyMs,
        disposition: "failed",
        returnedModel: null,
        usage: zeroUsage,
        safeErrorCode,
      });
      throw new M2RuntimeError(safeErrorCode);
    }
  }
}
