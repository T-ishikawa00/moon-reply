/**
 * Server-runtime transport shared by guarded services and the Netlify worker.
 * The API key is constructor-injected; browser reachability is rejected by the
 * async-router worker-graph verifier.
 */
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { M2RuntimeError } from "./errors.ts";
import { boundedProviderCall, PROVIDER_STAGE_TIMEOUT_MS } from "./provider-deadline.ts";
import { logDevelopmentOpenAiProviderFailure } from "./openai-diagnostics.ts";
import {
  assertOpenAIStructuredOutputSchema,
  logDevelopmentOpenAIStructuredOutputSchemaFailure,
  toOpenAiStructuredOutputSchema,
} from "./openai-schema.ts";
import type { AiStageTransport, JsonObject, StageRequest } from "./types.ts";
import { normalizeProviderSchema } from "./openai-schema-normalization.mjs";

export class OpenAiResponsesTransport implements AiStageTransport {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    // Application/pipeline retries own each attempt and its durable budget.
    this.client = new OpenAI({ apiKey, timeout: PROVIDER_STAGE_TIMEOUT_MS, maxRetries: 0 });
  }

  async invoke(stageRequest: StageRequest) {
    let providerSchema: JsonObject;
    try {
      providerSchema = normalizeProviderSchema(toOpenAiStructuredOutputSchema(stageRequest.outputSchema)).schema;
      assertOpenAIStructuredOutputSchema(providerSchema);
    } catch (error) {
      logDevelopmentOpenAIStructuredOutputSchemaFailure(error);
      throw new M2RuntimeError("M2_STAGE_PROVIDER_CONFIGURATION_INVALID");
    }
    const startedAt = performance.now();
    try {
      const response = await boundedProviderCall((signal) => this.client.responses.create({
        model: stageRequest.model,
        ...(stageRequest.maxOutputTokens !== undefined ? { max_output_tokens: stageRequest.maxOutputTokens } : {}),
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
      }, { signal, timeout: PROVIDER_STAGE_TIMEOUT_MS, maxRetries: 0 }));

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

      return {
        responseId: response.id,
        returnedModel: response.model,
        output,
        usage: {
          inputTokens: response.usage?.input_tokens ?? 0,
          cachedTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
          outputTokens: response.usage?.output_tokens ?? 0,
          reasoningTokens:
            response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
        },
        latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      };
    } catch (error) {
      if (error instanceof M2RuntimeError) throw error;
      logDevelopmentOpenAiProviderFailure(stageRequest.stageId, error);
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : null;
      throw new M2RuntimeError(status === 429 || typeof status === "number" && status >= 500
        ? "M2_STAGE_PROVIDER_RETRYABLE"
        : status === 400 || status === 401 || status === 403 || status === 404
          ? "M2_STAGE_PROVIDER_CONFIGURATION_INVALID"
          : "M2_STAGE_PROVIDER_OUTCOME_AMBIGUOUS");
    }
  }
}
