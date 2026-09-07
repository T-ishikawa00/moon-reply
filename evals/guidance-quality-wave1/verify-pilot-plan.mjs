// Offline review of the eight-session plan. No client, credentials or network.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { makeRuntimeFixture, runFixture } from "./runtime-fixtures.mjs";
import { toOpenAiStructuredOutputSchema } from "../../lib/assessment/runtime/openai-schema.ts";

const read = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
const plan = read("pilot-plan.json"), inputs = read("pilot-inputs.json");
const frozenText = readFileSync(new URL("../guidance-quality-r1/cases.json", import.meta.url), "utf8").replaceAll("\r\n", "\n");
assert.equal(createHash("sha256").update(frozenText).digest("hex"), "b4544798a68db8dcb1d6a7fe54adc6ddce16c9787ae263d7e5371aefa09efd14");
const frozen = JSON.parse(frozenText);
assert.deepEqual(inputs.cases.map(c => c.id), plan.pilotCases);
for (const c of inputs.cases) {
  const original = frozen.cases.find(x => x.id === c.sourceCase);
  assert.equal(c.input.currentSituation, original.consultation + (c.id === "GQ-29-P3" ? " 今後3日間はどう動けばよいかも整理してください。" : ""));
  assert.deepEqual(Object.keys(c.input).sort(), ["currentSituation", "optionalMessage", "relationship", "requestedTopics"]);
  assert.equal(c.input.optionalMessage, null);
  assert.deepEqual(c.input.requestedTopics, c.id === "GQ-29-P3" ? ["decide_send_or_wait", "next_three_days"] : ["decide_send_or_wait"]);
}
assert.equal(plan.maxTotalSessions, 8);
assert.equal(plan.executionOrder.length, 8);
assert.equal(new Set(plan.executionOrder.map(x => x.join("/"))).size, 8);
for (const c of inputs.cases) for (const arm of plan.arms) assert.ok(plan.executionOrder.some(([id, a]) => id === c.id && a === arm));
assert.equal(plan.model, "gpt-5.6-luna");
assert.equal(plan.status, "NOT_AUTHORIZED_NOT_RUN");
assert.equal(plan.actualApiCalls, 0);
assert.equal(plan.maximumClarificationAnswers, 0);
assert.equal(plan.transportRetries + plan.applicationProviderRetries, 0);
assert.equal(plan.tokenCapsProposal.find(x => x.stage === "PB-01C").invocationsPerSession, 0);
const totals = plan.tokenCapsProposal.reduce((a, c) => ({ calls: a.calls + c.invocationsPerSession, input: a.input + c.input * c.invocationsPerSession, output: a.output + c.outputIncludingReasoning * c.invocationsPerSession }), { calls: 0, input: 0, output: 0 });
assert.equal(totals.calls, 9);
assert.equal(totals.calls * 8, plan.maxHttpAttempts);
assert.equal(totals.input, plan.worstCase.inputPerSession);
assert.equal(totals.output, plan.worstCase.outputPerSession);
assert.equal(totals.input * 8, plan.worstCase.totalInput);
assert.equal(totals.output * 8, plan.worstCase.totalOutput);
const cost = (input, output) => (input * plan.prices.reserveInputPrice + output * plan.prices.perMillionTokens.outputIncludingReasoning) / 1e6;
assert.ok(Math.abs(cost(totals.input * 8, totals.output * 8) - plan.worstCase.usd) < 1e-9);
assert.ok(plan.worstCase.usd < plan.proposedBudgetUsd);
assert.ok(plan.tokenCapsProposal.every(c => c.input <= 96000 && c.input < 272000 && c.outputIncludingReasoning <= 128000));
const history = JSON.parse(readFileSync(plan.expectedCost.historicalUsagePath, "utf8"));
const usage = history.stage_attempts.filter(x => x.attemptNumber === 1 && x.stageId !== "PB-01C");
assert.equal(usage.length, 6);
for (const x of usage) { assert.equal(x.requestedModel, plan.model); assert.equal(x.returnedModel, plan.model); }
const inputEstimate = usage.reduce((a, x) => a + x.usage.inputTokens, 0) * 2 * 8;
const outputEstimate = usage.reduce((a, x) => a + x.usage.outputTokens, 0) * 2 * 8;
assert.equal(inputEstimate, plan.expectedCost.totalInput);
assert.equal(outputEstimate, plan.expectedCost.totalOutput);
assert.ok(Math.abs(cost(inputEstimate, outputEstimate) - plan.expectedCost.usd) < 1e-9);

// Representative serialized body sizes from synthetic stage outputs, not tokens
// measured by the API. Real prior-stage outputs must be checked anew per call.
const maxBodyCeilings = {};
for (const candidate of [false, true]) for (const id of ["GQ-05", "GQ-24", "GQ-29"]) {
  const f = makeRuntimeFixture(id, { candidate, detailed: id === "GQ-29" });
  if (id === "GQ-29") f.request = structuredClone(inputs.cases.find(x => x.id === "GQ-29-P3").input);
  const execution = await runFixture(f, { candidate });
  for (const q of execution.transport.requests) {
    const cap = plan.tokenCapsProposal.find(x => x.stage === q.stageId);
    const body = { model: q.model, store: false, tools: [], stream: false, background: false, service_tier: "default", truncation: "disabled", reasoning: { effort: "low" }, max_output_tokens: cap.outputIncludingReasoning, input: [{ role: "developer", content: [{ type: "input_text", text: q.developerPrompt }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify(q.input) }] }], text: { format: { type: "json_schema", name: q.schemaName, strict: true, schema: toOpenAiStructuredOutputSchema(q.outputSchema) } } };
    const ceiling = Buffer.byteLength(JSON.stringify(body), "utf8") + plan.tokenCounting.framingReserveTokens;
    assert.ok(ceiling <= cap.input, `${q.stageId} synthetic body exceeds input ceiling: ${ceiling}/${cap.input}`);
    maxBodyCeilings[q.stageId] = Math.max(maxBodyCeilings[q.stageId] ?? 0, ceiling);
  }
}
// Reservation boundary arithmetic only, not an implemented network guard.
const largest = Math.max(...plan.tokenCapsProposal.map(c => cost(c.input, c.outputIncludingReasoning)));
const mayDispatch = (reserved, next) => reserved + next <= plan.proposedBudgetUsd;
assert.equal(mayDispatch(plan.proposedBudgetUsd - largest / 2, largest), false);
assert.equal(mayDispatch(0, largest), true);
console.log(JSON.stringify({ status: "OFFLINE_PLAN_CHECK_PASS", sessions: 8, maximumHttpAttempts: 72, expectedUsd: plan.expectedCost.usd, maximumUsd: plan.worstCase.usd, proposedBudgetUsd: 2, syntheticSerializedInputCeilings: maxBodyCeilings, runnerEnforcement: "NOT_IMPLEMENTED", actualApiCalls: 0, actualModelQuality: "NOT_RUN" }, null, 2));
