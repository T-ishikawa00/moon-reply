// Offline-only verification of the authorized profile and receipt checkpoint.
// Never invokes the live entry point, reads credentials, or creates a real run.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { CANDIDATE_HEAD, loadV19PilotConfiguration, reviewReceipt } from "./real-pilot.mjs";
import { makeStoredFixture, makeEditedAcknowledgementFixture } from "./fixtures.mjs";
import { ReservationLedger, PilotStop, hash, reserveNanos } from "../guidance-quality-wave1/real-pilot/budget.mjs";
import { buildBody } from "../guidance-quality-wave1/real-pilot/transport.mjs";
import { executeSession } from "../guidance-quality-wave1/real-pilot/runner.mjs";
import { writeBlindArtifacts } from "../guidance-quality-wave1/real-pilot/review.mjs";
import { projectBaseProviderInputV1 } from "../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts";

const beforeFetch = globalThis.fetch;
let forbiddenNetwork = 0;
globalThis.fetch = async () => { forbiddenNetwork++; throw new Error("Offline verification forbids network"); };
const config = await loadV19PilotConfiguration();
const tempRoot = path.resolve(".tmp/guidance-v19-pilot-tests");
fs.mkdirSync(tempRoot, { recursive: true });
const directory = fs.mkdtempSync(path.join(tempRoot, "verify-"));
let checks = 0, serial = 0;
const test = async (name, fn) => { await fn(); console.log(`PASS ${++checks} ${name}`); };
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const caps = config.plan.tokenCapsProposal;
const usage = { input_tokens: 100, output_tokens: 20, total_tokens: 120,
  input_tokens_details: { cached_tokens: 10, cache_write_tokens: 30 }, output_tokens_details: { reasoning_tokens: 5 } };
const response = output => ({ id: "resp_synthetic", _request_id: "req_synthetic", model: "gpt-5.6-luna", status: "completed",
  service_tier: "default", usage: structuredClone(usage), output_text: JSON.stringify(output) });
function setup() {
  const dir = path.join(directory, String(++serial)); fs.mkdirSync(dir);
  const manifest = { sessions: [{ sessionId: "synthetic-session" }], caps, maxHttpAttempts: 72, budgetNanos: 2e9 };
  return { dir, ledger: new ReservationLedger(path.join(dir, "ledger.jsonl"), manifest, { create: true }) };
}
async function run({ fixture = makeEditedAcknowledgementFixture(), catalog = config.catalogs["candidate-v19"], onReceipt, mutateOutput } = {}) {
  const state = setup(), sends = [], receipts = [];
  const record = await executeSession({ session: { sessionId: "synthetic-session", caseId: fixture.caseId, anonymousVariantId: "A" }, catalog,
    input: fixture.request, directory: state.dir, ledger: state.ledger, frozenNow: config.plan.generation.frozenApplicationNow,
    send: async (body, mark) => {
      mark();
      const definition = catalog.definitions.find(d => d.schemaName === body.text.format.name);
      assert.ok(definition); sends.push(definition.stageId);
      assert.equal(body.model, "gpt-5.6-luna"); assert.equal(body.reasoning.effort, "low");
      assert.equal(body.service_tier, "default"); assert.equal(body.store, false);
      assert.equal(body.truncation, "disabled"); assert.deepEqual(body.tools, []);
      const output = structuredClone(fixture.outputs[definition.stageId]);
      assert.ok(output, "Missing frozen or declared hand-authored fixture stage");
      mutateOutput?.(definition.stageId, output);
      return response(output);
    },
    reviewReceipt: async receipt => {
      receipts.push(receipt.stageId);
      assert.ok(fs.existsSync(receipt.prefix + "-response.json"));
      assert.ok(fs.existsSync(receipt.prefix + "-review.json"));
      assert.equal(state.ledger.summary().unknownUsageCalls, 0);
      assert.equal(state.ledger.summary().inputTokens, sends.length * 100);
      await onReceipt?.(receipt, { ...state, sends });
    } });
  assert.equal(record.actualHttpCalls, sends.length);
  assert.equal(record.repository.actualDatabaseCalls, 0);
  assert.deepEqual(read(path.join(state.dir, "session.json")), record);
  return { ...state, sends, receipts, record };
}

await test("exact candidate source and frozen four-by-two profile remain isolated", () => {
  assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), CANDIDATE_HEAD);
  assert.equal(CANDIDATE_HEAD, "f5e5dc34b1a35a45652b2fd3f458ec04a541ecc6");
  assert.equal(execFileSync("git", ["diff", "--name-only", "HEAD", "--", "lib", "app", "components", "supabase",
    "evals/guidance-quality-r1", "evals/guidance-quality-wave1/pilot-inputs.json", "evals/guidance-quality-wave1/pilot-plan.json"], { encoding: "utf8" }).trim(), "");
  assert.deepEqual(config.inputs.cases.map(c => c.id), ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"]);
  assert.equal(config.plan.executionOrder.length, 8);
  assert.equal(new Set(config.plan.executionOrder.map(row => JSON.stringify(row))).size, 8);
  for (const c of config.inputs.cases) for (const arm of config.plan.arms)
    assert.equal(config.plan.executionOrder.filter(([id, a]) => id === c.id && a === arm).length, 1);
  assert.equal(config.plan.maximumClarificationAnswers, 0); assert.equal(config.plan.samplesPerArmCase, 1);
  assert.equal(config.plan.transportRetries, 0); assert.equal(config.plan.applicationProviderRetries, 0);
  assert.equal(config.plan.productGenerationAttempts, 2);
  assert.equal(config.catalogs["current-v17"].catalogVersion, "runtime-stage-catalog-v17.0.0");
  assert.equal(config.catalogs["candidate-v19"].catalogVersion, "runtime-stage-catalog-v19.0.0");
  assert.equal(config.catalogs["candidate-v19"].schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  for (const [file, digest] of Object.entries(config.evaluationSourceHashes))
    assert.equal(hash(fs.readFileSync(file, "utf8").replace(/\r\n/gu, "\n")), digest);
});
await test("PB01 reservation 42000 fits both arms; output caps, USD2 and 72 calls remain fixed", () => {
  assert.deepEqual(caps.map(c => [c.stage, c.invocationsPerSession, c.input, c.outputIncludingReasoning]), [
    ["PB-01", 1, 42000, 8192], ["PB-01C", 0, 0, 0], ["PB-02", 1, 24000, 3072], ["PB-03", 1, 24000, 2048],
    ["PB-04", 2, 48000, 8192], ["PB-05", 2, 64000, 8192], ["PB-06", 2, 96000, 4096],
  ]);
  assert.equal(caps.reduce((n, c) => n + reserveNanos(c) * c.invocationsPerSession, 0) * 8, 1_533_011_200);
  assert.equal(caps.reduce((n, c) => n + c.invocationsPerSession, 0) * 8, 72);
  assert.equal(config.plan.proposedBudgetUsd, 2);
  const old = read("evals/guidance-quality-wave1/pilot-plan.json");
  assert.equal(old.tokenCapsProposal[0].input, 40000);
  for (const catalog of Object.values(config.catalogs)) for (const c of config.inputs.cases) {
    const definition = catalog.definitions.find(d => d.stageId === "PB-01");
    const input = { run_mode: "initial_base", base_provider_input: projectBaseProviderInputV1(c.input) };
    const ceiling = Buffer.byteLength(JSON.stringify(buildBody({ ...definition, input }, caps[0])), "utf8") + 4096;
    assert.ok(ceiling <= 42000);
    if (catalog.catalogVersion === "runtime-stage-catalog-v19.0.0") assert.ok(ceiling > 40000, "Retain the first offline preflight failure evidence");
  }
});

const fixedRecords = [];
await test("eight offline sessions preserve terminal entry outcomes and all-stage receipt checks", async () => {
  for (const c of config.inputs.cases) {
    let ordinal = 0;
    for (const catalog of Object.values(config.catalogs)) {
      const fixture = c.id === "GQ-24" && catalog.catalogVersion === "runtime-stage-catalog-v19.0.0"
        ? makeEditedAcknowledgementFixture() : makeStoredFixture(c.id);
      const result = await run({ fixture, catalog });
      assert.equal(result.record.errorCode, null);
      assert.deepEqual(result.receipts, result.sends);
      assert.equal(result.sends.includes("PB-01C"), false);
      assert.equal(result.record.reassessment.length, 0);
      assert.equal(result.record.finalOutput.eligibility, c.id === "GQ-05" || (c.id === "GQ-24" && catalog.catalogVersion === "runtime-stage-catalog-v17.0.0") ? "needs_more_information" : "ready");
      result.record.anonymousVariantId = ordinal++ === 0 ? "A" : "B";
      fixedRecords.push(result.record);
    }
  }
  assert.equal(fixedRecords.length, 8);
});
await test("pending receipt prevents any next HTTP until explicitly released", async () => {
  let notify, release;
  const started = new Promise(resolve => { notify = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const pending = run({ onReceipt: async (receipt, state) => {
    if (receipt.stageId === "PB-01") { notify(state); await gate; }
  } });
  const state = await started;
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(state.sends, ["PB-01"]);
  assert.equal(state.ledger.summary().actualHttpCalls, 1);
  release();
  const result = await pending;
  assert.equal(result.record.finalDeliveryDisposition, "ready_local_only");
  assert.equal(result.sends.length, 6);
});
await test("receipt STOP at every stage retains usage and prevents all later sends", async () => {
  const stages = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
  for (const [index, stage] of stages.entries()) {
    const result = await run({ onReceipt: receipt => { if (receipt.stageId === stage) throw new PilotStop("SYNTHETIC_INSPECTION_STOP"); } });
    assert.deepEqual(result.sends, stages.slice(0, index + 1));
    assert.equal(result.record.errorCode, "SYNTHETIC_INSPECTION_STOP");
    assert.equal(result.record.finalDeliveryDisposition, "technical_stop");
    assert.equal(result.ledger.summary().inputTokens, (index + 1) * 100);
    assert.equal(result.record.reassessment.length, 0);
    assert.throws(() => result.ledger.start("another-session"), /BUDGET_SESSION/);
  }
});
await test("real local inspection function binds exact response, stage and attempt before continuation", async () => {
  for (const variant of ["wrong_hash", "wrong_stage", "wrong_attempt", "empty_reason", "stop", "continue"]) {
    const result = await run({ onReceipt: async receipt => {
      if (receipt.stageId !== "PB-01") return;
      const log = console.log;
      let pending;
      try { console.log = () => {}; pending = reviewReceipt(receipt); } finally { console.log = log; }
      const required = read(receipt.prefix + "-inspection-required.json");
      assert.equal(required.receiptHash, hash(receipt.received));
      const decision = { action: variant === "stop" ? "stop" : "continue", reason: "Synthetic offline receipt review only",
        receiptHash: required.receiptHash, stageId: receipt.stageId, attempt: receipt.attempt };
      if (variant === "wrong_hash") decision.receiptHash = "wrong";
      if (variant === "wrong_stage") decision.stageId = "PB-06";
      if (variant === "wrong_attempt") decision.attempt = 2;
      if (variant === "empty_reason") decision.reason = " ";
      fs.writeFileSync(receipt.prefix + "-inspection-decision.json", JSON.stringify(decision), { flag: "wx" });
      await pending;
      if (variant === "continue") await assert.rejects(() => reviewReceipt(receipt), /EEXIST/);
    } });
    assert.equal(result.sends.length, variant === "continue" ? 6 : 1);
    assert.equal(result.record.errorCode, variant === "continue" ? null : variant === "stop" ? "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY" : "LOCAL_INSPECTION_INVALID");
    assert.equal(result.ledger.summary().inputTokens, result.sends.length * 100);
  }
});
await test("inspection timeout stops before the next send without waiting for a real deadline", async () => {
  const result = await run({ onReceipt: async receipt => {
    if (receipt.stageId !== "PB-01") return;
    const now = Date.now, log = console.log;
    let reads = 0;
    try {
      Date.now = () => ++reads === 1 ? 0 : 30 * 60_000 + 1;
      console.log = () => {};
      await reviewReceipt(receipt);
    } finally { Date.now = now; console.log = log; }
  } });
  assert.deepEqual(result.sends, ["PB-01"]);
  assert.equal(result.record.errorCode, "LOCAL_INSPECTION_TIMEOUT");
  assert.equal(result.ledger.summary().inputTokens, 100);
});
await test("known false generated-draft preservation stops at PB04 before PB05 or repair", async () => {
  const result = await run({ mutateOutput: (stage, output) => { if (stage === "PB-04") output.message_draft_edit_metadata.preserved_meaning = true; } });
  assert.deepEqual(result.sends, ["PB-01", "PB-02", "PB-03", "PB-04"]);
  assert.equal(result.record.errorCode, "MATERIAL_DRAFT_SOURCE_INTEGRITY");
  assert.equal(result.record.initialCandidate.message_draft_edit_metadata.preserved_meaning, true);
  assert.equal(result.ledger.summary().inputTokens, 400);
  assert.equal(result.record.reassessment.length, 0);
  assert.equal(result.record.finalOutput, null);
});
await test("all PB06 findings reach inspection, including material codes outside old filter", async () => {
  for (const [code, jsonPath] of [["THREE_DAY_PLAN_CONSISTENCY", "decision_plan.aftercare_plan[1].action"], ["DECISION_REASON_SUPPORT", "report_content.decision_reason_summary"]]) {
    let seen = false;
    const result = await run({ mutateOutput: (stage, output) => {
      if (stage === "PB-06") output.semantic_checks = [{ finding_code: code, severity: "critical", json_path: jsonPath, evidence_refs: [], detail: "Synthetic material contradiction for checkpoint transport verification only." }];
    }, onReceipt: receipt => {
      if (receipt.stageId === "PB-06") {
        assert.equal(receipt.review.stopReason, null);
        assert.equal(receipt.review.disposition.blockingFindings[0].finding_code, code);
        seen = true; throw new PilotStop("SYNTHETIC_INSPECTED_MATERIAL_CONTRADICTION");
      }
    } });
    assert.equal(seen, true); assert.equal(result.sends.length, 6);
    assert.equal(result.record.errorCode, "SYNTHETIC_INSPECTED_MATERIAL_CONTRADICTION");
    assert.equal(result.record.reassessment.length, 0);
  }
});
await test("nonmaterial report finding retains the existing one repair and receipt checks", async () => {
  let verdicts = 0;
  const result = await run({ mutateOutput: (stage, output) => {
    if (stage === "PB-06" && ++verdicts === 1) output.semantic_checks = [{ finding_code: "TEMPLATE_GENERICITY", severity: "major", json_path: "report_content.short_letter", evidence_refs: [], detail: "Synthetic report-only expression repair." }];
  } });
  assert.equal(result.record.finalDeliveryDisposition, "ready_local_only");
  assert.equal(result.sends.filter(s => s === "PB-04").length, 1);
  assert.equal(result.sends.filter(s => s === "PB-05").length, 2);
  assert.equal(result.sends.filter(s => s === "PB-06").length, 2);
  assert.equal(result.record.evaluatedPairs.length, 2);
  assert.deepEqual(result.receipts, result.sends);
});

async function render(records) {
  const dir = path.join(directory, `public-${++serial}`); fs.mkdirSync(dir); fs.mkdirSync(path.join(dir, "internal"));
  await writeBlindArtifacts({ runDirectory: dir, inputs: config.inputs, records, summary: { stopReason: records.length === 8 ? null : "SYNTHETIC_STOP" } });
  const html = fs.readFileSync(path.join(dir, "blind-review.html"), "utf8");
  const markdown = fs.readFileSync(path.join(dir, "blind-review.md"), "utf8");
  for (const publicText of [html, markdown]) {
    assert.doesNotMatch(publicText, /current-v17|candidate-v19|candidate-v18|runtime-stage-catalog|promptBundleVersion|actualRuntimeVersion|\bV(?:17|18|19)\b|synthetic-session|resp_synthetic|req_synthetic/);
  }
  assert.doesNotMatch(html, /\schecked(?:[\s=>])/);
  return { html, markdown };
}
await test("blind renderer shows eight anonymous outputs without identity or filled answers", async () => {
  const { html } = await render(fixedRecords);
  assert.equal((html.match(/class="output-label"/g) ?? []).length, 8);
  assert.equal((html.match(/<form data-case=/g) ?? []).length, 4);
});
await test("blind renderer handles partial or empty STOP without forcing eight outcomes", async () => {
  const partial = await render(fixedRecords.slice(0, 1));
  assert.equal((partial.html.match(/class="output-label"/g) ?? []).length, 2);
  assert.ok(partial.html.includes("未実施です"));
  const empty = await render([]);
  assert.equal((empty.html.match(/class="output-label"/g) ?? []).length, 0);
  assert.ok(empty.html.includes("取得済みsessionはありません"));
});

assert.equal(forbiddenNetwork, 0);
globalThis.fetch = beforeFetch;
console.log(JSON.stringify({ checks, passed: checks, realApiCalls: 0, credentialReads: 0, actualDatabaseCalls: 0,
  forbiddenNetwork, evidence: "OFFLINE_SYNTHETIC_TRANSPORT_AND_STORED_OUTPUT_REPLAY_ONLY", actualModelQuality: "NOT_TESTED", mappingDisclosed: false }));
