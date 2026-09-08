// STEP4 local HTTP boundary only. Production transport and OpenAI SDK execute;
// the SDK's injected fetch never opens a socket or uses a real credential.
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { OpenAiResponsesTransport } from "../../lib/assessment/runtime/openai-transport.ts";
import { toOpenAiStructuredOutputSchema } from "../../lib/assessment/runtime/openai-schema.ts";
import { normalizeProviderSchema } from "../../lib/assessment/runtime/openai-schema-normalization.mjs";
import { hashJson } from "../../lib/assessment/runtime/hash.ts";

function assertWireSchema(schema) {
  const references = [];
  function visit(node, depth = 0) {
    if (!node || typeof node !== "object") return;
    if (!Array.isArray(node)) {
      assert.ok(depth === 0 || !Object.hasOwn(node, "$defs"), "nested definitions must be hoisted on the actual SDK wire");
      if (Object.hasOwn(node, "$ref")) references.push(node.$ref);
    }
    for (const value of Object.values(node)) visit(value, depth + 1);
  }
  visit(schema);
  for (const reference of references) {
    assert.ok(reference === "#" || reference.startsWith("#/"), "document-local reference only");
    let target = schema;
    if (reference !== "#") for (const part of decodeURIComponent(reference.slice(2)).split("/")) {
      const key = part.replaceAll("~1", "/").replaceAll("~0", "~");
      assert.ok(target && typeof target === "object" && Object.hasOwn(target, key), "every SDK wire reference resolves");
      target = target[key];
    }
  }
  return references.length;
}

export function createStep4SDKBoundary(delegate, { configurationValid = false } = {}) {
  assert.equal(typeof delegate.invoke, "function");
  const context = new AsyncLocalStorage(), wireRequests = [];
  const actual = new OpenAiResponsesTransport("step4-synthetic-not-a-key");
  let valid = configurationValid, delegateCalls = 0;
  // This seam is test-only: the real SDK still serializes, sends through fetch,
  // classifies HTTP responses and parses the response object.
  actual.client.fetch = async (url, init) => {
    const request = context.getStore();
    assert.ok(request, "SDK call must belong to the invoking paid stage");
    assert.equal(new URL(String(url)).pathname, "/v1/responses");
    const body = JSON.parse(init.body);
    assert.deepEqual(JSON.parse(body.input[1].content[0].text), request.input);
    const normalized = normalizeProviderSchema(toOpenAiStructuredOutputSchema(request.outputSchema));
    assert.equal(normalized.report.proof.equal, true);
    assert.deepEqual(body.text.format.schema, normalized.schema);
    const referenceCount = assertWireSchema(body.text.format.schema);
    const wire = { ordinal: wireRequests.length + 1, stageId: request.stageId, schemaVersion: request.schemaVersion,
      canonicalSchemaHash: hashJson(request.outputSchema), wireSchemaHash: hashJson(body.text.format.schema),
      referenceCount, semanticGraphEqual: true, nestedDefinitions: 0, maxOutputTokens: body.max_output_tokens ?? null,
      httpStatus: valid ? 200 : 400, body: structuredClone(body) };
    wireRequests.push(wire);
    if (!valid) return new Response(JSON.stringify({ error: { message: "Synthetic configuration rejection",
      type: "invalid_request_error", param: "text.format.schema", code: "invalid_json_schema" } }),
    { status: 400, headers: { "Content-Type": "application/json", "x-request-id": `step4-sdk-${wire.ordinal}` } });
    delegateCalls++;
    const response = await delegate.invoke(request);
    return new Response(JSON.stringify({ id: response.responseId, object: "response", created_at: 0, status: "completed",
      model: response.returnedModel, output: [{ id: `step4-message-${wire.ordinal}`, type: "message", role: "assistant", status: "completed",
        content: [{ type: "output_text", text: JSON.stringify(response.output), annotations: [] }] }],
      usage: { input_tokens: response.usage.inputTokens, output_tokens: response.usage.outputTokens,
        total_tokens: response.usage.inputTokens + response.usage.outputTokens,
        input_tokens_details: { cached_tokens: response.usage.cachedTokens }, output_tokens_details: { reasoning_tokens: response.usage.reasoningTokens } } }),
    { status: 200, headers: { "Content-Type": "application/json", "x-request-id": `step4-sdk-${wire.ordinal}` } });
  };
  return { transport: { invoke: request => context.run(request, () => actual.invoke(request)) }, wireRequests,
    setConfigurationValid(value) { assert.equal(typeof value, "boolean"); valid = value; },
    metrics: () => ({ sdkFetchCalls: wireRequests.length, configurationRejected: wireRequests.filter(row => row.httpStatus === 400).length,
      delegateCalls, actualProviderRequests: 0 }) };
}
