import { validateJsonSchema } from "./m2-p2-b1-b1-request-builder.mjs";

function parserStop(stopCode, message, receipt = null) {
  return Object.assign(new Error(message), { stopCode, receipt });
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function terminalStatusCode(status) {
  const codes = {
    failed: "RESPONSE_STATUS_FAILED",
    incomplete: "RESPONSE_STATUS_INCOMPLETE",
    queued: "RESPONSE_STATUS_QUEUED",
    in_progress: "RESPONSE_STATUS_IN_PROGRESS",
    cancelled: "RESPONSE_STATUS_CANCELLED",
  };
  return codes[status] ?? "RESPONSE_STATUS_INVALID";
}

export function parseProviderResponse({ stageRequest, rawResponse }) {
  if (!rawResponse || typeof rawResponse !== "object" || Array.isArray(rawResponse)) {
    throw parserStop("RESPONSE_OBJECT_INVALID", "Raw Response is not an object");
  }
  if (rawResponse.object !== "response") {
    throw parserStop("RESPONSE_OBJECT_INVALID", "Response object marker differs");
  }
  if (rawResponse.status !== "completed") {
    throw parserStop(
      terminalStatusCode(rawResponse.status),
      `Response status ${String(rawResponse.status)} is not completed`,
    );
  }
  if (rawResponse.error !== null) {
    throw parserStop("RESPONSE_ERROR_PRESENT", "Response error is present");
  }
  if (rawResponse.incomplete_details !== null) {
    throw parserStop(
      "RESPONSE_INCOMPLETE_DETAILS_PRESENT",
      "Incomplete details are present",
    );
  }
  if (typeof rawResponse.id !== "string" || rawResponse.id.length === 0) {
    throw parserStop("RESPONSE_ID_MISSING", "Response ID is missing");
  }
  if (typeof rawResponse.model !== "string" || rawResponse.model.length === 0) {
    throw parserStop("RESPONSE_MODEL_MISSING", "Returned model is missing");
  }
  if (!Array.isArray(rawResponse.output)) {
    throw parserStop("RESPONSE_OUTPUT_MISSING", "Response output is missing");
  }
  if (
    rawResponse.output.some(
      (item) =>
        item?.type === "refusal" ||
        (typeof item?.refusal === "string" && item.refusal.length > 0) ||
        item?.content?.some?.(
          (content) =>
            content?.type === "refusal" ||
            (typeof content?.refusal === "string" && content.refusal.length > 0),
        ),
    )
  ) {
    throw parserStop("RESPONSE_REFUSAL", "A refusal item is present");
  }
  const assistantMessages = rawResponse.output.filter(
    (item) => item?.type === "message" && item?.role === "assistant",
  );
  if (assistantMessages.length !== 1) {
    throw parserStop(
      "RESPONSE_AMBIGUOUS_MESSAGES",
      `Expected one assistant message, received ${assistantMessages.length}`,
    );
  }
  const content = assistantMessages[0].content;
  const outputTexts = Array.isArray(content)
    ? content.filter((item) => item?.type === "output_text")
    : [];
  if (outputTexts.length === 0) {
    throw parserStop(
      "RESPONSE_OUTPUT_TEXT_MISSING",
      "Output text item is missing",
    );
  }
  if (outputTexts.length !== 1 || content.length !== 1) {
    throw parserStop(
      "RESPONSE_AMBIGUOUS_OUTPUT_TEXT",
      "Exactly one output_text content item is required",
    );
  }
  if (typeof outputTexts[0].text !== "string" || outputTexts[0].text.length === 0) {
    throw parserStop("RESPONSE_OUTPUT_TEXT_MISSING", "Output text is empty");
  }
  let outputJson;
  try {
    outputJson = JSON.parse(outputTexts[0].text);
  } catch {
    throw parserStop("RESPONSE_JSON_INVALID", "Output text is not valid JSON");
  }
  const schema = stageRequest?.body?.text?.format?.schema;
  const schemaErrors = validateJsonSchema(outputJson, schema);
  if (schemaErrors.length > 0) {
    throw parserStop(
      "RESPONSE_SCHEMA_INVALID",
      `Stage output Schema failed: ${schemaErrors.join("; ")}`,
    );
  }
  const usage = rawResponse.usage;
  if (!usage || typeof usage !== "object" || Array.isArray(usage)) {
    throw parserStop("RESPONSE_USAGE_MISSING", "Usage object is missing");
  }
  const inputTokens = usage.input_tokens;
  const cachedTokens = usage.input_tokens_details?.cached_tokens;
  const outputTokens = usage.output_tokens;
  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens;
  const totalTokens = usage.total_tokens;
  if (
    ![
      inputTokens,
      cachedTokens,
      outputTokens,
      reasoningTokens,
      totalTokens,
    ].every(nonNegativeInteger)
  ) {
    throw parserStop(
      "RESPONSE_USAGE_INVALID",
      "Usage fields must be non-negative integers",
    );
  }
  if (
    cachedTokens > inputTokens ||
    reasoningTokens > outputTokens ||
    totalTokens !== inputTokens + outputTokens
  ) {
    throw parserStop(
      "RESPONSE_USAGE_INCONSISTENT",
      "Usage arithmetic is inconsistent",
    );
  }
  const receipt = {
    stage_id: stageRequest.stage_id,
    response_id: rawResponse.id,
    response_status: rawResponse.status,
    requested_model: stageRequest.requested_model,
    returned_model: rawResponse.model,
    output_json: outputJson,
    schema_valid: true,
    usage: {
      input_tokens: inputTokens,
      cached_tokens: cachedTokens,
      uncached_input_tokens: inputTokens - cachedTokens,
      output_tokens: outputTokens,
      reasoning_tokens: reasoningTokens,
      total_tokens: totalTokens,
    },
    retry_attempted: false,
    repair_attempted: false,
    fallback_attempted: false,
  };
  if (rawResponse.model !== stageRequest.requested_model) {
    throw parserStop(
      "RETURNED_MODEL_MISMATCH",
      "Returned model differs from requested model",
      receipt,
    );
  }
  return receipt;
}
