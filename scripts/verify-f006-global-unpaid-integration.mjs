import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { ProductionFulfillmentApplication } from "../lib/assessment/production/application.ts";
import { FakeProductionFulfillmentRepository } from "../lib/assessment/production/fakes.ts";
import { readGlobalUnpaidComputePolicy } from "../lib/assessment/production/global-unpaid-compute.ts";
import { createGlobalUnpaidComputeAuthority } from "../lib/assessment/production/global-unpaid-compute-runtime.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { FakeAssessmentRepository } from "../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";

// Saved, local synthetic regression fixtures only. No live Provider generation.
const fixtureRoot = "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const inputs = json(`${fixtureRoot}/controlled-provider-inputs-v1.json`);
const safety = json("evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json");
const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
const customerPolicy = { policyVersion: "m2-c1-prepayment-compute-v1", windowSeconds: 86400, maximumProviderInvocations: 50 };
const globalPolicy = { windowSeconds: 86400, maximumProviderInvocations: 100, maximumConcurrent: 2 };
let external = 0, passed = 0;
globalThis.fetch = async () => { external++; throw new Error("F006_EXTERNAL_FORBIDDEN"); };
const code = (wanted) => (error) => error.safeCode === wanted;
async function check(name, run) { await run(); console.log(`PASS F006 integration ${++passed} ${name}`); }
function stageOutputs(directory) {
  const outputs = {};
  for (const entry of json(`${fixtureRoot}/controlled-provider-executions/${directory}/v16-stage-attempt-results-v1.json`).stage_attempts)
    if (entry.attemptNumber === 1 && entry.outputJson !== null && outputs[entry.stageId] === undefined) outputs[entry.stageId] = entry.outputJson;
  return structuredClone(outputs);
}
function harness({ clarification = false, options = {} } = {}) {
  const selected = structuredClone(inputs.cases.find((entry) => entry.fixture_id === (clarification ? "one_clarification_answer_becomes_ready" : "polite_thank_you_with_draft")));
  assert.ok(selected);
  const outputs = stageOutputs(clarification ? "2026-08-18-case9-one-clarification-ai-first-v16-cd1518ce" : "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce");
  if (clarification) {
    selected.assessment_input.currentSituation = "相手とのことを相談したいです。どうすればいいですか？";
    selected.assessment_input.optionalMessage = null;
    const base = outputs["PB-01"];
    base.timeline = [{ event_id: "E101", sequence: 1, actor: "user", statement: "ユーザーには相談したい相手がいる。", source_refs: ["input:current_situation"] }];
    base.context = [];
    base.observed_facts = [{ fact_id: "F101", statement: "ユーザーは相手とのことを相談したい。", source_refs: ["input:current_situation"], support: "explicit" }];
    base.user_assumptions = []; base.user_emotions = []; base.material_unknowns = [];
    base.decision_facts.latest_direct_message = { sender: "unknown", kind: "unknown", response_expectation: "unknown", user_reply_state: "unknown", sns_signal_only: false };
    base.decision_facts.contact_state = { unanswered_user_message_count: 0, elapsed_since_latest_user_message_minutes: null, usual_cadence_relation: "unknown" };
    base.decision_facts.information_state.unresolved_fields = [];
    base.base_writing_signals.user_goal_detail = { value: "unknown", basis: "unresolved" };
    base.base_writing_signals.explicit_user_constraints = [];
  }
  const consultation = { ...structuredClone(safety.base_input), ...selected.assessment_input,
    consultationSchemaVersion: "rc1-production-consultation-v1", privacyAcknowledged: true };
  const runtime = new FakeAssessmentRepository();
  const lifecycle = new FakeProductionFulfillmentRepository(runtime);
  const state = { claims: [], releases: [], calls: [], policyReads: 0, failRelease: false,
    claimBehavior: undefined, transportFailure: undefined, invalidOutput: undefined };
  const customerAuthority = {
    async beginPrepaymentIntake(record) { return { ...await lifecycle.beginPreparation(record), executionDisposition: "awaiting_auth" }; },
    async claimPrepaymentExecution(input) {
      const preparation = lifecycle.preparations.get(input.preparationId); assert.ok(preparation);
      return { disposition: "acquired", preparation: structuredClone(preparation),
        request: structuredClone(runtime.requests.get(preparation.requestId)), preparationId: preparation.id };
    },
    async beginPrepaymentClarification() {},
    async finalizePrepaymentExecution(record) { await lifecycle.finalizePreparation(record); },
    async failPrepaymentExecution(record) { await lifecycle.failPreparation(record); },
    async claimComputeUnit() { assert.fail("separate Customer debit must not accompany atomic global claim"); },
  };
  const globalAuthority = {
    async claim(input) {
      state.claims.push(structuredClone(input));
      const override = await state.claimBehavior?.(input);
      return override ?? { disposition: "acquired", invocation_id: input.invocationId,
        slot_number: 1, lease_expires_at: new Date(Date.now() + 240000).toISOString() };
    },
    async release(input) { state.releases.push(input); if (state.failRelease) throw new Error("synthetic DB release outage"); return true; },
  };
  const transport = { async invoke(request) {
    state.calls.push(structuredClone(request));
    if (state.transportFailure === request.stageId) throw new M2RuntimeError("F006_SYNTHETIC_PROVIDER_TIMEOUT", 503);
    let output = outputs[request.stageId];
    if (request.stageId === "PB-01" && request.input.run_mode === "clarification_resume") {
      const evidence = request.input.clarification_evidence;
      output = { schema_version: "pipeline-schema-clarification-grounding-v1.0.0", target: evidence.target,
        source_identity: evidence.source_identity, answer_fingerprint: evidence.answer_fingerprint,
        materially_resolves_target: evidence.resolves_target,
        clarification_safety_result: { classification: "normal_allowed", reason_codes: [], response_mode: "none" } };
    }
    if (state.invalidOutput === request.stageId) output = {};
    assert.ok(output, request.stageId);
    return { responseId: `synthetic-${state.calls.length}`, returnedModel: request.model, output: structuredClone(output),
      usage: { inputTokens: 0, cachedTokens: 0, outputTokens: 0, reasoningTokens: 0 }, latencyMs: 1 };
  } };
  const application = new ProductionFulfillmentApplication({ runtimeRepository: runtime, lifecycleRepository: lifecycle,
    prepaymentComputeAuthority: customerAuthority, globalUnpaidComputeAuthority: globalAuthority,
    globalUnpaidComputePolicy: () => { state.policyReads++; return globalPolicy; },
    transport, catalog, model: "gpt-5.6-luna", now: () => selected.fixed_clock, uuid: randomUUID,
    allowSyntheticPurchaseAuthority: true, ...options });
  const customerUserId = randomUUID();
  async function begin() {
    const result = await application.beginProviderFreePreparation(consultation, randomUUID());
    assert.equal(result.status, "authentication_required");
    assert.equal(state.claims.length, 0); assert.equal(state.calls.length, 0); assert.equal(state.policyReads, 0);
    return [...lifecycle.preparations.keys()][0];
  }
  async function execute() { return application.executeAuthenticatedPrepayment({ preparationId: await begin(), customerUserId, policy: customerPolicy }); }
  return { application, runtime, lifecycle, state, begin, execute, customerUserId };
}

await check("missing or malformed global policy fails closed in Production and test with zero Provider calls", async () => {
  const original = process.env.NODE_ENV;
  try {
    for (const environment of ["production", "test"]) for (const options of [
      { globalUnpaidComputeAuthority: undefined }, { globalUnpaidComputePolicy: undefined },
      { globalUnpaidComputePolicy: () => readGlobalUnpaidComputePolicy(() => undefined) },
    ]) {
      process.env.NODE_ENV = environment;
      const run = harness({ options });
      await assert.rejects(run.execute, code("PREPAYMENT_GLOBAL_COMPUTE_CONFIGURATION_INVALID"));
      assert.equal(run.state.calls.length, 0); assert.equal(run.state.claims.length, 0);
    }
  } finally { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; }
});
await check("all unpaid stages reserve distinct invocations with both policies and release known responses", async () => {
  const run = harness(); assert.equal((await run.execute()).status, "purchase_ready");
  assert.deepEqual(run.state.calls.map((r) => r.stageId), ["PB-01", "PB-01C", "PB-02", "PB-03"]);
  assert.deepEqual(run.state.claims.map((r) => r.stageId), run.state.calls.map((r) => r.stageId));
  assert.equal(new Set(run.state.claims.map((r) => r.invocationId)).size, 4); assert.equal(run.state.releases.length, 4);
  for (const claim of run.state.claims) { assert.deepEqual(claim.policy, customerPolicy); assert.deepEqual(claim.globalPolicy, globalPolicy); assert.equal(claim.attemptNumber, 1); }
});
await check("global quota, concurrency and DB outage deny before the initial Provider call", async () => {
  for (const disposition of ["global_exhausted", "concurrency_exhausted", "outage"]) {
    const run = harness();
    run.state.claimBehavior = () => { if (disposition === "outage") throw new Error("synthetic reservation ack lost"); return { disposition }; };
    await assert.rejects(run.execute, code(disposition === "outage" ? "PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE" :
      disposition === "global_exhausted" ? "PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED" : "PREPAYMENT_GLOBAL_COMPUTE_CONCURRENCY_EXHAUSTED"));
    assert.equal(run.state.calls.length, 0); assert.equal(run.state.releases.length, 0);
  }
});
await check("PB-01C admission rejection stays technical, with candidate Provider calls zero", async () => {
  for (const disposition of ["global_exhausted", "concurrency_exhausted", "outage"]) {
    const run = harness(); const expected = disposition === "outage" ? "PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE" :
      disposition === "global_exhausted" ? "PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED" : "PREPAYMENT_GLOBAL_COMPUTE_CONCURRENCY_EXHAUSTED";
    run.state.claimBehavior = (input) => { if (input.stageId !== "PB-01C") return;
      if (disposition === "outage") throw new Error("synthetic outage"); return { disposition }; };
    await assert.rejects(run.execute, code(expected));
    assert.deepEqual(run.state.calls.map((r) => r.stageId), ["PB-01"]);
    const candidate = [...run.runtime.stageRuns.values()].find((r) => r.stageId === "PB-01C");
    assert.equal(candidate.failure.errorCode, expected);
    assert.equal([...run.lifecycle.preparations.values()][0].status, "failed");
    assert.equal([...run.runtime.runs.values()][0].eligibility, undefined);
  }
});
await check("Provider timeout holds the reservation while a returned invalid response frees only concurrency", async () => {
  const timed = harness(); timed.state.transportFailure = "PB-01";
  await assert.rejects(timed.execute, code("F006_SYNTHETIC_PROVIDER_TIMEOUT"));
  assert.equal(timed.state.claims.length, 1); assert.equal(timed.state.calls.length, 1); assert.equal(timed.state.releases.length, 0);
  const invalid = harness(); invalid.state.invalidOutput = "PB-01";
  await assert.rejects(invalid.execute); assert.equal(invalid.state.claims.length, 1); assert.equal(invalid.state.releases.length, 1);
});
await check("PB-01C Provider timeout preserves the existing candidate Safety failure and retains its slot", async () => {
  const run = harness(); run.state.transportFailure = "PB-01C";
  await assert.rejects(run.execute, code("M2_CANDIDATE_SAFETY_UNAVAILABLE"));
  assert.deepEqual(run.state.calls.map((r) => r.stageId), ["PB-01", "PB-01C"]);
  assert.equal(run.state.claims.length, 2); assert.equal(run.state.releases.length, 1);
  assert.equal([...run.runtime.stageRuns.values()].find((r) => r.stageId === "PB-01C").failure.errorCode, "M2_CANDIDATE_SAFETY_UNAVAILABLE");
});
await check("release outage does not discard a valid preparation or retry/refund reservations", async () => {
  const run = harness(); run.state.failRelease = true; assert.equal((await run.execute()).status, "purchase_ready");
  assert.equal(run.state.claims.length, 4); assert.equal(run.state.releases.length, 4);
});
await check("authenticated clarification uses the same global fence; exhaustion sends no additional request", async () => {
  for (const exhausted of [false, true]) {
    const run = harness({ clarification: true }); const prepared = await run.execute();
    assert.equal(prepared.status, "needs_one_clarifying_answer");
    const before = run.state.calls.length; const beforeClaims = run.state.claims.length;
    if (exhausted) run.state.claimBehavior = () => ({ disposition: "global_exhausted" });
    const answered = run.application.answerClarification(prepared.clarificationCapability,
      { choice: "reply_pressure", detail: "連絡の距離感をどうすべきか迷っています。" },
      { customerUserId: run.customerUserId, policy: customerPolicy });
    if (exhausted) { await assert.rejects(answered, code("PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED")); assert.equal(run.state.calls.length, before); }
    else { assert.equal((await answered).status, "purchase_ready"); assert.equal(run.state.calls.length, before + 1); }
    assert.equal(run.state.claims.length, beforeClaims + 1); assert.equal(run.state.claims.at(-1).stageId, "PB-01");
  }
});
await check("Paid Provider work does not read or reserve the exhausted unpaid pool", async () => {
  const run = harness(); const prepared = await run.execute(); const before = run.state.claims.length;
  const policyReads = run.state.policyReads;
  run.state.claimBehavior = () => { assert.fail("Paid must not claim unpaid pool"); };
  run.state.transportFailure = "PB-04";
  const grant = await run.application.issueAssessmentGrant({ schemaVersion: "rc1-verified-purchase-authority-v1",
    verificationSource: "rc1_test_fake", purchaseAuthorityReference: "synthetic-f006-purchase-authority",
    preparationCapability: prepared.preparationCapability, deliveryAuthorityReference: "synthetic-f006-delivery-authority" });
  await assert.rejects(() => run.application.fulfillAssessmentGrant(grant), code("F006_SYNTHETIC_PROVIDER_TIMEOUT"));
  assert.equal(run.state.claims.length, before); assert.equal(run.state.policyReads, policyReads);
  assert.equal(run.state.calls.at(-1).stageId, "PB-04");
});
await check("runtime PostgREST adapter sends one bounded atomic reservation with exact Customer arguments", async () => {
  const requests = []; const invocation = randomUUID();
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body), signal: options.signal });
      return new Response(JSON.stringify(String(url).endsWith("claim_global_unpaid_compute_v1") ? {
        disposition: "acquired", invocation_id: invocation, slot_number: 1, lease_expires_at: new Date(Date.now() + 240000).toISOString(),
      } : true), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    const authority = createGlobalUnpaidComputeAuthority("https://synthetic-f006.invalid", "synthetic-f006-key");
    await authority.claim({ invocationId: invocation, customerUserId: "synthetic-customer", preparationId: "synthetic-preparation",
      policy: customerPolicy, globalPolicy, stageId: "PB-01C", attemptNumber: 1 });
    await authority.release({ invocationId: invocation, slotNumber: 1 });
    assert.equal(requests.length, 2); assert.ok(requests.every((r) => r.signal instanceof AbortSignal));
    assert.deepEqual(requests[0].body, { p_invocation_id: invocation, p_customer_user_id: "synthetic-customer",
      p_preparation_id: "synthetic-preparation", p_customer_policy_version: customerPolicy.policyVersion,
      p_customer_window_seconds: 86400, p_customer_maximum: 50, p_stage_id: "PB-01C", p_attempt_number: 1,
      p_global_window_seconds: 86400, p_global_maximum: 100, p_maximum_concurrent: 2 });
  } finally { globalThis.fetch = previous; }
});
assert.equal(external, 0);
console.log(`F006 global unpaid integration: ${passed}/${passed} PASS; real external operations=0`);
