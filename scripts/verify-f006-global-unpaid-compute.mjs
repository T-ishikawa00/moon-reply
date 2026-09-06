import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  boundedGlobalUnpaidComputeOperation,
  GLOBAL_UNPAID_COMPUTE_LEASE_SECONDS,
  GLOBAL_UNPAID_COMPUTE_RPC_TIMEOUT_MS,
  readGlobalUnpaidComputePolicy,
  requireGlobalUnpaidComputePermit,
} from "../lib/assessment/production/global-unpaid-compute.ts";

let externalCalls = 0;
globalThis.fetch = async () => { externalCalls++; throw new Error("F006_EXTERNAL_CALL_FORBIDDEN"); };
const config = {
  PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS: "86400",
  PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS: "100",
  PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT: "2",
};
const policy = readGlobalUnpaidComputePolicy((name) => config[name]);
const claimInput = () => ({ invocationId: randomUUID(), customerUserId: randomUUID(), preparationId: randomUUID(),
  stageId: "PB-01", attemptNumber: 1,
  policy: { policyVersion: "m2-c1-prepayment-compute-v1", windowSeconds: 86400, maximumProviderInvocations: 50 },
  globalPolicy: policy });
const acquired = (input, overrides = {}) => ({ disposition: "acquired", slot_number: 1,
  invocation_id: input.invocationId, lease_expires_at: "2026-09-06T01:04:00Z", ...overrides });
const code = (wanted, status = 503) => (error) => error.safeCode === wanted && error.httpStatus === status;
let passed = 0;
async function check(name, run) { await run(); console.log(`PASS F006 ${++passed} ${name}`); }

await check("global policy requires explicit bounded values without defaults", () => {
  assert.deepEqual(policy, { windowSeconds: 86400, maximumProviderInvocations: 100, maximumConcurrent: 2 });
  for (const name of Object.keys(config)) for (const invalid of [undefined, "", "0", "-1", "TRUE", " 2", "2 ", "1e3", "1.5", "NaN", "99999999999999999999999999999"]) {
    assert.throws(() => readGlobalUnpaidComputePolicy((key) => key === name ? invalid : config[key]),
      code("PREPAYMENT_GLOBAL_COMPUTE_CONFIGURATION_INVALID"));
  }
  for (const [name, invalid] of [["PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS", "59"],
    ["PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS", "2678401"],
    ["PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS", "100001"],
    ["PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT", "33"]]) {
    assert.throws(() => readGlobalUnpaidComputePolicy((key) => key === name ? invalid : config[key]),
      code("PREPAYMENT_GLOBAL_COMPUTE_CONFIGURATION_INVALID"));
  }
});

await check("one known response releases its slot once without a quota-refund API", async () => {
  const input = claimInput(); const releases = [];
  const authority = { claim: async (request) => { assert.deepEqual(request, input); return acquired(input); },
    release: async (request) => { releases.push(request); return true; } };
  const permit = await requireGlobalUnpaidComputePermit(authority, input);
  await permit.finish(true); await permit.finish(true);
  assert.deepEqual(releases, [{ invocationId: input.invocationId, slotNumber: 1 }]);
  assert.equal(GLOBAL_UNPAID_COMPUTE_LEASE_SECONDS, 240);
  assert.equal(GLOBAL_UNPAID_COMPUTE_RPC_TIMEOUT_MS, 5000);
});

await check("rejection, timeout and response loss retain the slot for database expiry", async () => {
  for (const cause of ["rejected", "timeout", "response_lost"]) {
    const input = claimInput(); let released = 0;
    const permit = await requireGlobalUnpaidComputePermit({ claim: async () => acquired(input),
      release: async () => { released++; throw new Error(cause); } }, input);
    await permit.finish(false); await permit.finish(true);
    assert.equal(released, 0);
  }
});

await check("post-response release failure preserves the response and does not retry release", async () => {
  const input = claimInput(); let released = 0;
  const permit = await requireGlobalUnpaidComputePermit({ claim: async () => acquired(input),
    release: async () => { released++; throw new Error("synthetic DB outage"); } }, input);
  await permit.finish(true); await permit.finish(true); assert.equal(released, 1);
});

await check("Customer, global and concurrency denials are distinct bounded technical failures", async () => {
  for (const [disposition, error] of [["customer_exhausted", "PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED"],
    ["global_exhausted", "PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED"],
    ["concurrency_exhausted", "PREPAYMENT_GLOBAL_COMPUTE_CONCURRENCY_EXHAUSTED"]]) {
    await assert.rejects(() => requireGlobalUnpaidComputePermit({ claim: async () => ({ disposition }),
      release: async () => assert.fail("no permit on denial") }, claimInput()), code(error, 429));
  }
});

await check("lost reservation response and malformed receipts never authorize Provider execution", async () => {
  const input = claimInput();
  const receipts = [null, false, [], {}, { disposition: "duplicate" }, { disposition: "unknown" },
    { disposition: "global_exhausted", count: 42 }, acquired(input, { invocation_id: randomUUID() }),
    acquired(input, { slot_number: 0 }), acquired(input, { slot_number: 3 }),
    acquired(input, { slot_number: 1.5 }), acquired(input, { lease_expires_at: "invalid" }),
    { ...acquired(input), secret: "forbidden-extra-field" }];
  for (const receipt of receipts) await assert.rejects(() => requireGlobalUnpaidComputePermit({
    claim: async () => receipt, release: async () => assert.fail("invalid receipt release"),
  }, input), code("PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE"));
  await assert.rejects(() => requireGlobalUnpaidComputePermit({ claim: async () => { throw new Error("ack lost after commit"); },
    release: async () => assert.fail("unknown claim release") }, input), code("PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE"));
});

await check("RPC deadline aborts a stalled operation and safely observes late rejection", async () => {
  let signal; let reject;
  const stalled = boundedGlobalUnpaidComputeOperation((current) => {
    signal = current; return new Promise((_, failure) => { reject = failure; });
  }, 5);
  await assert.rejects(stalled, code("PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE"));
  assert.equal(signal.aborted, true); reject(new Error("late body failure"));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(await boundedGlobalUnpaidComputeOperation(async () => "safe", 5), "safe");
});

await check("runtime adapter uses one atomic claim with the unchanged Customer-policy fields", () => {
  const runtime = readFileSync("lib/assessment/production/global-unpaid-compute-runtime.ts", "utf8");
  assert.match(runtime, /createGlobalUnpaidComputeAuthority\(/u);
  assert.equal((runtime.match(/\.rpc\("claim_global_unpaid_compute_v1"/gu) ?? []).length, 1);
  assert.equal((runtime.match(/\.abortSignal\(signal\)/gu) ?? []).length, 2);
  for (const field of ["p_customer_policy_version", "p_customer_window_seconds", "p_customer_maximum", "p_stage_id", "p_attempt_number"]) assert.match(runtime, new RegExp(field, "u"));
  assert.doesNotMatch(runtime, /claim_production_prepayment_compute_unit_v1|fetch\(|console\.|log\(|process\.env/u);
});

assert.equal(externalCalls, 0);
console.log(`F006 global unpaid compute: ${passed}/${passed} PASS; external calls=0; integration verified separately`);
