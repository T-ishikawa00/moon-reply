import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OpenAiResponsesTransport } from "../lib/assessment/runtime/openai-transport.ts";
import { normalizeProviderSchema, verifySemanticPreservation } from "../lib/assessment/runtime/openai-schema-normalization.mjs";
import { normalizeEvaluationSchema } from "../evals/paid-delivery-step1c/normalize.mjs";
import { toOpenAiStructuredOutputSchema } from "../lib/assessment/runtime/openai-schema.ts";
import { createPaidRecoveryTransport, paidProviderReservationCost } from "../lib/assessment/production/paid-recovery-transport.ts";
import { decodeCustomerPurchaseStatusResponse, CUSTOMER_PURCHASE_STATUS_POLICY } from "../lib/payment/purchase-status-contract.ts";
import { getPurchaseReturnPresentation } from "../lib/payment/purchase-return-presentation.ts";

const schema = JSON.parse(readFileSync("evals/paid-delivery-step1c/fixtures/failing-schema.json", "utf8"));
const before = JSON.stringify(schema);
const normalized = normalizeProviderSchema(schema);
assert.deepEqual(normalized, normalizeEvaluationSchema(schema));
assert.equal(verifySemanticPreservation(schema, normalized.schema, normalized.report).equal, true);
assert.equal(JSON.stringify(schema), before);
let body, status = 200, calls = 0;
globalThis.fetch = async (_url, options) => {
  calls++; body = JSON.parse(options.body);
  if (status !== 200) return new Response(JSON.stringify({ error: { message: "synthetic", type: "invalid_request_error",
    code: status === 400 ? "invalid_json_schema" : "rate_limit_exceeded" } }), { status, headers: { "content-type": "application/json" } });
  return new Response(JSON.stringify({ id: "resp_local", object: "response", status: "completed", model: "gpt-5.6-luna",
    output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: '{"ok":true}', annotations: [] }] }],
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 } }), { headers: { "content-type": "application/json" } });
};
const transport = new OpenAiResponsesTransport("local-synthetic-key");
const request = { stageId: "PB-01", model: "gpt-5.6-luna", developerPrompt: "synthetic", promptVersion: "test", promptHash: "a".repeat(64),
  schemaName: "test_schema", schemaVersion: "test", schemaHash: "b".repeat(64), outputSchema: schema, input: { situation: "synthetic" } };
let reserved = 0, released = 0, accepted = true;
const budgeted = createPaidRecoveryTransport({ transport, logicalAssessmentId: "synthetic", ownerId: "synthetic", repository: {
  async reserve(input) { assert.equal(input.costUsd, paidProviderReservationCost(request)); reserved++; return accepted ? "reserved" : "budget_exhausted"; },
  async complete() { released++; },
} });
await budgeted.invoke(request);
assert.equal(body.max_output_tokens, 8192);
assert.deepEqual(body.text.format.schema, normalizeProviderSchema(toOpenAiStructuredOutputSchema(schema)).schema);
assert.equal(calls, 1); assert.equal(released, 1);
status = 400;
await assert.rejects(budgeted.invoke(request), error => error.safeCode === "M2_STAGE_PROVIDER_CONFIGURATION_INVALID");
assert.equal(calls, 2); assert.equal(released, 1);
status = 429;
await assert.rejects(budgeted.invoke(request), error => error.safeCode === "M2_STAGE_PROVIDER_RETRYABLE");
assert.equal(calls, 3, "SDK retries remain zero"); assert.equal(released, 1, "failed/unknown holds remain reserved");
accepted = false;
await assert.rejects(budgeted.invoke(request), error => error.safeCode === "PAID_RECOVERY_BUDGET_EXHAUSTED");
assert.equal(calls, 3, "budget rejects before HTTP"); assert.equal(reserved, 4);
const delayed = { status: "delayed_assessment", paymentVerified: true, accountFallback: true };
assert.deepEqual(decodeCustomerPurchaseStatusResponse({ data: delayed }), delayed);
assert.equal(CUSTOMER_PURCHASE_STATUS_POLICY.delayed_assessment.automaticPolling, false);
const presentation = getPurchaseReturnPresentation({ status: delayed, requestFailed: false, recoveryExhausted: false, customerAuthEnabled: true });
assert.equal(presentation.showManualRefresh, true); assert.equal(presentation.showCheckoutRestart, false);
assert.doesNotMatch(JSON.stringify(presentation), /復旧中|秒後|分後|カウントダウン/u);
console.log("PASS paid recovery runtime transport: semantic equivalence, actual SDK schema/body, output cap, 400 stop, 429 retry0, pre-call budget, unknown holds, truthful delayed UI; external operations=0");
