// Local transport interception only. Never constructs an external request.
import assert from "node:assert/strict";
import { OpenAiResponsesTransport } from "../lib/assessment/runtime/openai-transport.ts";
import { toOpenAiStructuredOutputSchema } from "../lib/assessment/runtime/openai-schema.ts";
import { normalizeProviderSchema } from "../lib/assessment/runtime/openai-schema-normalization.mjs";
import { normalizeEvaluationSchema } from "../evals/paid-delivery-step1c/normalize.mjs";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import { loadV19L5StageCatalog } from "../lib/assessment/runtime/v19-l5-stage-catalog.ts";

const oldFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error("NETWORK_FORBIDDEN"); };
let checks = 0;
try {
  const transport = new OpenAiResponsesTransport("synthetic-not-a-key");
  let captured;
  transport.client.responses.create = async body => { captured = structuredClone(body); return { id: "synthetic-response", model: body.model, output_text: "{}", usage: {} }; };
  for (const [version, catalog] of [["V17", await loadM2P4FinalProductRecoveryRuntimeStageCatalog()], ["V19-L5", await loadV19L5StageCatalog()]]) {
    for (const definition of [...catalog.definitions, ...catalog.definitions.flatMap(d => d.reportFactRepair ? [{ ...d, ...d.reportFactRepair }] : [])]) {
      const canonical = structuredClone(definition.outputSchema), projected = toOpenAiStructuredOutputSchema(canonical);
      const normalized = normalizeProviderSchema(projected), established = normalizeEvaluationSchema(projected);
      assert.deepEqual(normalized.schema, established.schema, "promoted normalizer preserves the accepted STEP1C transform");
      assert.equal(normalized.report.proof.equal, true);
      if (version === "V17") assert.deepEqual(normalized.schema, projected, "V17 pass-through");
      await transport.invoke({ stageId: definition.stageId, model: "gpt-5.6-luna", developerPrompt: definition.developerPrompt,
        promptVersion: definition.promptVersion, promptHash: definition.promptHash, schemaName: definition.schemaName,
        schemaVersion: definition.schemaVersion, schemaHash: definition.schemaHash, outputSchema: definition.outputSchema, input: {}, maxOutputTokens: 8192 });
      assert.deepEqual(captured.text.format.schema, established.schema, "actual production transport uses normalized schema");
      assert.equal(captured.max_output_tokens, 8192);
      assert.deepEqual(definition.outputSchema, canonical, "canonical contract immutable");
      checks++;
    }
  }
  const request = { stageId: "PB-01", model: "gpt-5.6-luna", developerPrompt: "synthetic", promptVersion: "synthetic", promptHash: "x", schemaName: "test", schemaVersion: "test", schemaHash: "x", input: {}, outputSchema: { type: "object", properties: {}, required: [], additionalProperties: false } };
  for (const [status, expected] of [[429,"M2_STAGE_PROVIDER_RETRYABLE"],[503,"M2_STAGE_PROVIDER_RETRYABLE"],[400,"M2_STAGE_PROVIDER_CONFIGURATION_INVALID"],[401,"M2_STAGE_PROVIDER_CONFIGURATION_INVALID"],[undefined,"M2_STAGE_PROVIDER_OUTCOME_AMBIGUOUS"]]) {
    transport.client.responses.create = async () => { throw { status }; };
    await assert.rejects(transport.invoke(request), error => error.safeCode === expected); checks++;
  }
  await assert.rejects(transport.invoke({ ...request, outputSchema: { ...request.outputSchema, properties: { bad: { $ref: "#/$defs/missing" } }, required: ["bad"] } }), error => error.safeCode === "M2_STAGE_PROVIDER_CONFIGURATION_INVALID"); checks++;
  console.log(JSON.stringify({ status: "PASS", checks, actualProviderRequests: 0, productionOperations: 0 }));
} finally { globalThis.fetch = oldFetch; }
