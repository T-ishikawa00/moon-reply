import "server-only";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";
import { M2RuntimeError } from "./errors.ts";
import type { AiStageTransport, JsonObject, StageRequest } from "./types.ts";

export class OpenAiResponsesTransport implements AiStageTransport {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async invoke(stageRequest: StageRequest) {
    const startedAt = performance.now();
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
            schema: stageRequest.outputSchema,
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
      throw new M2RuntimeError("M2_STAGE_PROVIDER_FAILED");
    }
  }
}
