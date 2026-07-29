import OpenAI from "openai";
import type { M2StageId } from "./types.ts";

type ProviderFailureClassification =
  | "openai_api_error"
  | "openai_connection_timeout"
  | "openai_connection_error"
  | "openai_sdk_error"
  | "unknown_provider_error";

type OpenAiProviderFailureDiagnostic = {
  stageId: M2StageId;
  httpStatus: number | null;
  openaiErrorType: string | null;
  openaiErrorCode: string | null;
  openaiErrorParam: string | null;
  openaiErrorMessage: string | null;
  requestId: string | null;
  failureClassification: ProviderFailureClassification;
};

function safeProviderField(value: string | null | undefined) {
  if (!value) return null;
  return value.replace(/[\u0000-\u001f\u007f]/gu, "?").slice(0, 200);
}

function safeOpenAiErrorMessage(error: unknown) {
  if (!(error instanceof OpenAI.OpenAIError) || !error.message) return null;
  return error.message
    .replace(
      /(?:\bsk-[^\s"'`,;)\]}]+|\bsb_secret_[^\s"'`,;)\]}]+|\bBearer(?:\s+[^\s"'`,;)\]}]+)?)/giu,
      "[REDACTED]",
    )
    .replace(/[\u0000-\u001f\u007f]/gu, "?")
    .slice(0, 1000);
}

function classifyProviderFailure(
  error: unknown,
): ProviderFailureClassification {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return "openai_connection_timeout";
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return "openai_connection_error";
  }
  if (error instanceof OpenAI.APIError && typeof error.status === "number") {
    return "openai_api_error";
  }
  if (error instanceof OpenAI.OpenAIError) {
    return "openai_sdk_error";
  }
  return "unknown_provider_error";
}

export function createOpenAiProviderFailureDiagnostic(
  stageId: M2StageId,
  error: unknown,
): OpenAiProviderFailureDiagnostic {
  const apiError = error instanceof OpenAI.APIError ? error : null;
  return {
    stageId,
    httpStatus:
      apiError && typeof apiError.status === "number"
        ? apiError.status
        : null,
    openaiErrorType: safeProviderField(apiError?.type),
    openaiErrorCode: safeProviderField(apiError?.code),
    openaiErrorParam: safeProviderField(apiError?.param),
    openaiErrorMessage: safeOpenAiErrorMessage(error),
    requestId: safeProviderField(apiError?.requestID),
    failureClassification: classifyProviderFailure(error),
  };
}

export function logDevelopmentOpenAiProviderFailure(
  stageId: M2StageId,
  error: unknown,
) {
  if (process.env.NODE_ENV !== "development") return;
  console.error(
    "M2_PROVIDER_FAILURE",
    createOpenAiProviderFailureDiagnostic(stageId, error),
  );
}
