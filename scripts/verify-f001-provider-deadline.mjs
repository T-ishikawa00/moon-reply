import assert from "node:assert/strict";
import { mock } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { OpenAiResponsesTransport } from "../lib/assessment/runtime/openai-transport.ts";
import { boundedProviderCall, withProviderDeadline, PROVIDER_STAGE_TIMEOUT_MS, FULFILLMENT_PROVIDER_BUDGET_MS } from "../lib/assessment/runtime/provider-deadline.ts";

let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F001 ${++passed} ${name}`); }
const code = (expected) => (error) => error.safeCode === expected;
await check("defensive ceilings fit the 15-minute background worker", () => {
  assert.equal(PROVIDER_STAGE_TIMEOUT_MS, 180_000);
  assert.equal(FULFILLMENT_PROVIDER_BUDGET_MS, 720_000);
  assert.ok(FULFILLMENT_PROVIDER_BUDGET_MS < 15 * 60_000);
});
await check("ordinary success returns and clears its timer", async () => {
  assert.equal(await withProviderDeadline(() => boundedProviderCall(async () => "ready")), "ready");
});
await check("stage timeout aborts and ignores a late response", async () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    let signal, finish;
    const result = boundedProviderCall((s) => { signal = s; return new Promise((resolve) => { finish = resolve; }); });
    const rejected = assert.rejects(result, code("M2_STAGE_PROVIDER_TIMEOUT"));
    await Promise.resolve(); mock.timers.tick(PROVIDER_STAGE_TIMEOUT_MS);
    await rejected; assert.equal(signal.aborted, true); finish("late");
  } finally { mock.timers.reset(); }
});
await check("whole deadline bounds an in-flight call even when abort is ignored", async () => {
  await assert.rejects(withProviderDeadline(() => boundedProviderCall(() => new Promise(() => {})), 10), code("M2_PROVIDER_DEADLINE_EXCEEDED"));
});
await check("elapsed persistence time counts; no new call after deadline", async () => {
  let calls = 0;
  await assert.rejects(withProviderDeadline(async () => {
    await delay(20);
    return boundedProviderCall(async () => { calls++; });
  }, 5), code("M2_PROVIDER_DEADLINE_EXCEEDED"));
  assert.equal(calls, 0);
});
await check("nested deadlines cannot extend the worker deadline; instances isolate context", async () => {
  const results = await Promise.allSettled([
    withProviderDeadline(() => withProviderDeadline(() => boundedProviderCall(() => new Promise(() => {}))), 10),
    withProviderDeadline(async () => { await delay(20); return boundedProviderCall(async () => "independent"); }, 1000),
  ]);
  assert.equal(results[0].reason.safeCode, "M2_PROVIDER_DEADLINE_EXCEEDED");
  assert.equal(results[1].value, "independent");
});

const request = { stageId: "PB-04", model: "gpt-5.6-luna", schemaName: "synthetic", developerPrompt: "synthetic local test",
  input: {}, outputSchema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false } };
const originalFetch = globalThis.fetch;
try {
  for (const status of [429, 500, 503]) {
    await check(`real installed SDK makes exactly one physical request for HTTP ${status}`, async () => {
      let calls = 0;
      globalThis.fetch = async () => { calls++; return new Response('{"error":{"message":"synthetic"}}', { status, headers: { "content-type": "application/json", "retry-after": "0" } }); };
      await assert.rejects(new OpenAiResponsesTransport("synthetic-local-key").invoke(request), code("M2_STAGE_PROVIDER_FAILED"));
      assert.equal(calls, 1);
    });
  }
  await check("real SDK timeout has no retry and aborts its request", async () => {
    let calls = 0, aborted = false;
    globalThis.fetch = async (_url, init) => { calls++; return new Promise((_resolve, reject) => {
      init.signal.addEventListener("abort", () => { aborted = true; reject(new Error("synthetic abort")); }, { once: true });
    }); };
    await assert.rejects(withProviderDeadline(() => new OpenAiResponsesTransport("synthetic-local-key").invoke(request), 30), code("M2_PROVIDER_DEADLINE_EXCEEDED"));
    await delay(10); assert.equal(calls, 1); assert.equal(aborted, true);
  });
  await check("body collection is bounded after response headers arrive", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(new ReadableStream({ start() {} }), { headers: { "content-type": "application/json" } }); };
    await assert.rejects(withProviderDeadline(() => new OpenAiResponsesTransport("synthetic-local-key").invoke(request), 30), code("M2_PROVIDER_DEADLINE_EXCEEDED"));
    assert.equal(calls, 1);
  });
  await check("normal SDK response remains compatible", async () => {
    globalThis.fetch = async () => Response.json({ object: "response", id: "synthetic-response", model: "gpt-5.6-luna", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: '{"ok":true}', annotations: [] }] }] });
    assert.deepEqual((await new OpenAiResponsesTransport("synthetic-local-key").invoke(request)).output, { ok: true });
  });
} finally { globalThis.fetch = originalFetch; }
console.log(`F001 Provider deadlines PASS ${passed}/${passed}; real Provider calls=0 (SDK fetch mocked)`);
