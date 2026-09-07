// Offline verification only. The saved PB05 text below is a fake response
// fixture; it is never used as live PB05 generation input or new output evidence.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const originalFetch = globalThis.fetch;
let forbiddenNetworkCalls = 0;
globalThis.fetch = async () => { forbiddenNetworkCalls++; throw new Error("TARGETED_VERIFIER_NETWORK_FORBIDDEN"); };
let checks = 0;
const test = async (name, action) => { await action(); console.log(`PASS ${++checks} ${name}`); };

try {
  const [adapter, runner, budget, transports, l2, l3] = await Promise.all([
    import("./adapter.mjs"), import("./runner.mjs"), import("../../guidance-quality-wave1/real-pilot/budget.mjs"),
    import("../../guidance-quality-wave1/real-pilot/transport.mjs"), import("../../../lib/assessment/runtime/v19-l2-stage-catalog.ts"),
    import("../../../lib/assessment/runtime/v19-l3-stage-catalog.ts"),
  ]);
  const { captureStageRequest, loadFixedUpstream } = adapter;
  const { CAPS, runTargeted, ConditionLedger } = runner;
  const { ReservationLedger, accountUsage, reserveNanos, hash, PilotStop } = budget;
  const { buildBody } = transports;
  const upstream = loadFixedUpstream();
  const catalogs = { "V19-L2": await l2.loadV19L2StageCatalog(), "V19-L3": await l3.loadV19L3StageCatalog() };
  const oldReportPath = "evals/guidance-quality-v19-l2/runs/2026-09-07-authorized-pilot8-v19-l2/internal/72e7a601-b626-4544-b40f-1d90574c3450/call-108-response.json";
  const oldReportBytes = fs.readFileSync(oldReportPath), oldReportHash = hash(oldReportBytes.toString("utf8"));
  const fakeReport = JSON.parse(JSON.parse(oldReportBytes.toString("utf8")).outputText);
  const fakeVerdict = { schema_version: "pipeline-schema-v1.0.0", validation_mode: "semantic_findings_only", deterministic_checks: [],
    semantic_checks: [], final_disposition: null, repair_strategy: null, failed_codes: [] };
  const usage = { input_tokens: 100, output_tokens: 20, total_tokens: 120,
    input_tokens_details: { cached_tokens: 10, cache_write_tokens: 30 }, output_tokens_details: { reasoning_tokens: 5 } };
  const response = (value, changes = {}) => ({ id: "resp_fake_targeted", _request_id: "req_fake_targeted", model: "gpt-5.6-luna", status: "completed",
    service_tier: "default", usage: structuredClone(usage), output_text: JSON.stringify(value), ...changes });
  const captured = {};

  await test("fixed upstream contains only PB01-PB04 and the original first-pass PB05 input", () => {
    assert.deepEqual(Object.keys(upstream.outputs), ["PB-01", "PB-02", "PB-03", "PB-04"]);
    assert.equal(upstream.originalPB05Input.quality_reassessment_directive, null);
    assert.deepEqual(upstream.originalPB05Input.decision_plan, upstream.outputs["PB-04"]);
    assert.equal(upstream.originalPB05Input.candidate_envelope.presence, false);
    assert.equal(JSON.stringify(upstream.originalPB05Input).includes(fakeReport.observed_fact_commentary[0].commentary), false);
    assert.equal(upstream.request.optionalMessage, null);
  });
  await test("both exact PB05 identities capture the same input without generating any target response", async () => {
    for (const [condition, catalog] of Object.entries(catalogs)) {
      const result = await captureStageRequest(catalog, upstream, "PB-05"); captured[condition] = { "PB-05": result };
      assert.equal(result.disposition, "captured"); assert.deepEqual(result.request.input, upstream.originalPB05Input);
      assert.equal(result.request.promptVersion, condition === "V19-L2" ? "v10.0.0" : "v11.0.0");
      assert.equal(result.request.promptHash, catalog.definitions.find(stage => stage.stageId === "PB-05").promptHash);
      assert.deepEqual(result.captureChecks.fakeResponseStages, ["PB-01", "PB-02", "PB-03", "PB-04"]);
      assert.equal(result.captureChecks.targetResponseGenerated, false); assert.equal(result.captureChecks.pb06ResponseGenerated, false);
      assert.equal(result.captureChecks.actualProviderCalls, 0); assert.equal(result.captureChecks.actualDatabaseCalls, 0);
    }
    assert.deepEqual(captured["V19-L2"]["PB-05"].request.input, captured["V19-L3"]["PB-05"].request.input);
  });
  await test("PB06 captures existing Application grounding of a declared fake response only", async () => {
    for (const [condition, catalog] of Object.entries(catalogs)) {
      const result = await captureStageRequest(catalog, upstream, "PB-06", fakeReport); captured[condition]["PB-06"] = result;
      assert.equal(result.disposition, "captured"); assert.equal(result.request.promptVersion, "v9.0.0");
      assert.deepEqual(result.request.input.decision_plan, upstream.originalPB05Input.decision_plan);
      assert.equal(result.request.input.report_content.observed_fact_commentary[0].commentary, fakeReport.observed_fact_commentary[0].commentary);
      assert.equal(result.captureChecks.applicationGroundingChangedRawReport, true);
      assert.notDeepEqual(result.request.input.report_content.change_condition_commentary, fakeReport.change_condition_commentary);
      assert.deepEqual(result.captureChecks.fakeResponseStages, ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05"]);
      assert.equal(result.captureChecks.pb06ResponseGenerated, false); assert.equal(result.captureChecks.repairCalls, 0);
    }
    assert.deepEqual(captured["V19-L2"]["PB-06"].request.input, captured["V19-L3"]["PB-06"].request.input);
  });
  await test("capture refuses upstream mutation, forbidden targets and a supplied report in PB05", async () => {
    const catalog = catalogs["V19-L3"];
    for (const field of ["request", "outputs", "originalPB05Input", "frozenNow"]) {
      const changed = structuredClone(upstream); changed[field] = field === "frozenNow" ? "2026-09-08T00:00:00Z" : {};
      await assert.rejects(() => captureStageRequest(catalog, changed, "PB-05"), /GQ29_FIXED_UPSTREAM_MUTATED/);
    }
    await assert.rejects(() => captureStageRequest(catalog, upstream, "PB-04"), /GQ29_CAPTURE_TARGET_FORBIDDEN/);
    await assert.rejects(() => captureStageRequest(catalog, upstream, "PB-05", fakeReport), /GQ29_PB05_CAPTURE_REPORT_INPUT_FORBIDDEN/);
    const invalid = await captureStageRequest(catalog, upstream, "PB-06", {});
    assert.equal(invalid.disposition, "local_validation_failed"); assert.equal(invalid.request, null);
    assert.equal(invalid.captureChecks.pb06ResponseGenerated, false); assert.equal(invalid.captureChecks.repairCalls, 0);
  });
  await test("two one-pass stage caps reserve USD0.1094912 under USD0.15 and fix comparison settings", () => {
    assert.deepEqual(CAPS.map(cap => [cap.stage, cap.invocationsPerSession, cap.input, cap.outputIncludingReasoning]), [["PB-05", 1, 64000, 8192], ["PB-06", 1, 96000, 4096]]);
    assert.equal(CAPS.reduce((sum, cap) => sum + reserveNanos(cap), 0) * 2, 109_491_200);
    for (const condition of Object.keys(catalogs)) for (const cap of CAPS) {
      const body = buildBody(captured[condition][cap.stage].request, cap);
      assert.equal(body.model, "gpt-5.6-luna"); assert.equal(body.reasoning.effort, "low"); assert.equal(body.service_tier, "default");
      assert.equal(body.max_output_tokens, cap.outputIncludingReasoning); assert.equal(body.truncation, "disabled");
      assert.equal(body.store, false); assert.deepEqual(body.tools, []);
      assert.ok(Buffer.byteLength(JSON.stringify(body), "utf8") + 4096 <= cap.input);
    }
  });

  const tempRoot = path.resolve(".tmp/guidance-v19-l3-targeted-tests");
  assert.equal(execFileSync("git", ["check-ignore", ".tmp/guidance-v19-l3-targeted-tests/probe"], { encoding: "utf8" }).trim(), ".tmp/guidance-v19-l3-targeted-tests/probe");
  fs.mkdirSync(tempRoot, { recursive: true });
  const temp = fs.mkdtempSync(path.join(tempRoot, "verify-"));
  let serial = 0, fakeDispatches = 0;
  const manifest = () => ({ sessions: ["V19-L2", "V19-L3"].map((condition, index) => ({ sessionId: `fake-targeted-${index}`, condition, caseId: "GQ-29-P3", anonymousVariantId: condition })),
    caps: CAPS, budgetNanos: 150_000_000, maxHttpAttempts: 4 });
  const inspectNone = async () => ({ materialFindings: [], observations: [], reason: "Fake local transport verification only, not a quality judgment" });
  async function experiment({ budgetNanos = 150_000_000, sendChange, inspect = inspectNone, capture } = {}) {
    const directory = path.join(temp, String(++serial)), inputManifest = { ...manifest(), budgetNanos }, sends = [];
    let currentCondition = null;
    const output = await runTargeted({ directory, manifest: inputManifest, catalogs, upstream, inspect, ...(capture ? { capture } : {}),
      send: async (body, mark) => {
        const stage = body.text.format.name === captured["V19-L2"]["PB-05"].request.schemaName ? "PB-05" : "PB-06";
        if (stage === "PB-05") currentCondition = Object.keys(catalogs).find(condition => body.input[0].content[0].text === captured[condition]["PB-05"].request.developerPrompt);
        assert.ok(currentCondition); assert.equal(body.model, "gpt-5.6-luna"); assert.equal(body.reasoning.effort, "low"); assert.equal(body.service_tier, "default");
        assert.equal(body.max_output_tokens, CAPS.find(cap => cap.stage === stage).outputIncludingReasoning);
        assert.deepEqual(JSON.parse(body.input[1].content[0].text), captured[currentCondition][stage].request.input);
        mark(); fakeDispatches++; sends.push([currentCondition, stage]);
        const value = structuredClone(stage === "PB-05" ? fakeReport : fakeVerdict);
        const changes = await sendChange?.({ condition: currentCondition, stage, output: value, body });
        return response(value, changes ?? {});
      } });
    const records = output.conditions.map(condition => JSON.parse(fs.readFileSync(path.join(directory, condition.condition, "result.json"), "utf8")));
    assert.equal(output.summary.actualHttpCalls, sends.length);
    for (const record of records) { assert.equal(record.repairs, 0); assert.equal(record.retries, 0); assert.equal(record.additionalSamples, 0); assert.equal(record.customerDelivery, false); }
    return { directory, inputManifest, output, records, sends };
  }
  await test("shared ledger refuses insufficient pre-call reservation and retains unknown outcomes", () => {
    const directory = path.join(temp, `ledger-${++serial}`); fs.mkdirSync(directory);
    const m = manifest(), file = path.join(directory, "ledger.jsonl"), ledger = new ReservationLedger(file, m, { create: true });
    ledger.start(m.sessions[0].sessionId);
    const reservation = ledger.reserve(m.sessions[0].sessionId, "PB-05", 1, 100, "first"); ledger.dispatch(reservation);
    ledger.settle(reservation, { status: "unknown_or_failed", stopReason: "HTTP_TIMEOUT" }); ledger.stop("HTTP_TIMEOUT");
    const reloaded = new ReservationLedger(file, m);
    assert.equal(reloaded.reservedNanos, reserveNanos(CAPS[0])); assert.equal(reloaded.summary().unknownUsageCalls, 1);
    assert.throws(() => reloaded.reserve(m.sessions[0].sessionId, "PB-05", 1, 100, "retry"), /BUDGET_RESERVATION/);
    assert.equal(accountUsage(usage, CAPS[0]).lowerNanos, 60 * 200 + 10 * 20 + 30 * 250 + 20 * 1200);
  });
  await test("ConditionLedger localizes only two exact material codes and never resets global STOP", () => {
    for (const code of ["MATERIAL_SAFETY_OR_INTEGRITY_FINDING", "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY", "MATERIAL_DRAFT_SOURCE_INTEGRITY", "MODEL_IDENTITY_MISMATCH", "SCHEMA_INVALID_JSON", "HTTP_TIMEOUT", "BUDGET_USAGE_INCONSISTENT", "MATERIAL_SAFETY_OR_INTEGRITY_FINDING_EXTRA"]) {
      const directory = path.join(temp, `scope-${++serial}`); fs.mkdirSync(directory);
      const shared = new ReservationLedger(path.join(directory, "ledger.jsonl"), manifest(), { create: true }), scoped = new ConditionLedger(shared);
      scoped.stop(code);
      const local = ["MATERIAL_SAFETY_OR_INTEGRITY_FINDING", "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"].includes(code);
      assert.equal(shared.stopReason, local ? null : code); assert.deepEqual(scoped.qualityStops, local ? [code] : []);
      if (!local) { scoped.stop("MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"); assert.equal(shared.stopReason, code); }
    }
  });
  await test("nominal two conditions perform PB05 and PB06 exactly once under shared cap", async () => {
    const run = await experiment();
    assert.deepEqual(run.sends, [["V19-L2", "PB-05"], ["V19-L2", "PB-06"], ["V19-L3", "PB-05"], ["V19-L3", "PB-06"]]);
    assert.equal(run.output.globalStop, null); assert.equal(run.output.summary.reservedUsd, 0.1094912);
    assert.equal(run.output.summary.inputTokens, 400); assert.equal(run.output.summary.outputTokens, 80);
    assert.ok(run.records.every(record => record.finalDisposition === "diagnostic_stages_completed_pending_postflight"));
    assert.ok(run.records.every(record => record.initialDirection === upstream.originalPB05Input.decision_plan.selected_decision));
    await assert.rejects(() => runTargeted({ directory: run.directory, manifest: run.inputManifest, catalogs, upstream, send: async () => { throw new Error("must not send"); }, inspect: inspectNone }), /EEXIST/);
  });
  await test("material PB06 failure ends only that condition and still invokes the successor once", async () => {
    const run = await experiment({ sendChange: ({ condition, stage, output }) => {
      if (condition === "V19-L2" && stage === "PB-06") output.semantic_checks = [{ finding_code: "FACT_FIDELITY", severity: "major", json_path: "report_content.observed_fact_commentary[0].commentary",
        evidence_refs: ["F101"], detail: "Synthetic unsupported sent-to-delivered upgrade, for condition isolation only." }];
    } });
    assert.equal(run.output.globalStop, null); assert.equal(run.sends.length, 4);
    assert.equal(run.records[0].finalDisposition, "diagnostic_quality_failed"); assert.equal(run.records[0].errorReason, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING");
    assert.equal(run.records[1].finalDisposition, "diagnostic_stages_completed_pending_postflight");
    assert.deepEqual(run.sends.filter(([condition]) => condition === "V19-L3"), [["V19-L3", "PB-05"], ["V19-L3", "PB-06"]]);
  });
  await test("raw manual PB05 defect remains quality failure despite later empty PB06 findings", async () => {
    const run = await experiment({ inspect: async context => ({ materialFindings: context.session.condition === "V19-L2" && context.stageId === "PB-05"
      ? [{ code: "SOURCE_FIDELITY", jsonPath: "report_content.observed_fact_commentary[0].commentary", detail: "Synthetic manual finding: unsupported delivery assertion in the unedited fake report." }] : [],
      observations: [], reason: "Fake manual inspection does not edit the PB05 response" }) });
    assert.equal(run.output.globalStop, null); assert.equal(run.sends.length, 4);
    assert.equal(run.records[0].finalDisposition, "diagnostic_quality_failed"); assert.equal(run.records[0].manualInspections[0].materialFindings.length, 1);
    assert.deepEqual(JSON.parse(run.records[0].pb06.outputText).semantic_checks, []);
    assert.equal(JSON.parse(run.records[0].pb05.outputText).observed_fact_commentary[0].commentary, fakeReport.observed_fact_commentary[0].commentary);
    assert.equal(run.records[1].finalDisposition, "diagnostic_stages_completed_pending_postflight");
  });
  await test("raw ACTION_CONSISTENCY ignored by old classifier still fails that condition only", async () => {
    for (const severity of ["major", "critical"]) {
      const run = await experiment({ sendChange: ({ condition, stage, output }) => {
        if (condition === "V19-L2" && stage === "PB-06") output.semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity,
          json_path: "decision_plan.change_conditions[0].resulting_direction", evidence_refs: ["policy:decision_policy_result", "policy:effective_decision_policy_result"],
          detail: "Synthetic raw finding on future direction; old classifier ignores this metadata." }];
      } });
      const review = run.records[0].findings.find(item => item.stageId === "PB-06");
      assert.equal(review.disposition.blockingFindings.length, 0); assert.equal(review.disposition.ignoredTemporalFalsePositives.length, 1);
      assert.equal(run.records[0].finalDisposition, "diagnostic_quality_failed"); assert.equal(run.output.globalStop, null);
      assert.equal(run.records[1].finalDisposition, "diagnostic_stages_completed_pending_postflight"); assert.equal(run.sends.length, 4);
    }
  });
  await test("explicit manual material STOP is condition-local with no retry or substitute report", async () => {
    const run = await experiment({ inspect: async context => {
      if (context.session.condition === "V19-L2" && context.stageId === "PB-05") throw new PilotStop("MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
      return inspectNone(context);
    } });
    assert.equal(run.output.globalStop, null); assert.equal(run.records[0].finalDisposition, "diagnostic_quality_failed");
    assert.deepEqual(run.sends, [["V19-L2", "PB-05"], ["V19-L3", "PB-05"], ["V19-L3", "PB-06"]]);
    assert.equal(run.records[0].pb06, null);
  });
  await test("insufficient budget prevents dispatch and stops all remaining conditions", async () => {
    const run = await experiment({ budgetNanos: reserveNanos(CAPS[0]) - 1 });
    assert.equal(run.output.globalStop, "BUDGET_RESERVATION_REJECTED"); assert.equal(run.sends.length, 0);
    assert.equal(run.output.summary.reservedUsd, 0); assert.equal(run.records.length, 1);
  });
  await test("HTTP failure or timeout retains full reservation and globally stops without retry", async () => {
    for (const error of [Object.assign(new Error("synthetic private failure"), { status: 500 }), Object.assign(new Error("timeout"), { name: "APIConnectionTimeoutError" })]) {
      const run = await experiment({ sendChange: () => { throw error; } });
      assert.ok(["HTTP_FAILURE_500", "HTTP_TIMEOUT"].includes(run.output.globalStop)); assert.equal(run.sends.length, 1);
      assert.equal(run.output.summary.reservedUsd, reserveNanos(CAPS[0]) / 1e9); assert.equal(run.output.summary.unknownUsageCalls, 1);
      assert.equal(run.records.length, 1); assert.equal(run.records[0].pb06, null);
    }
  });
  await test("schema model tier and incomplete responses globally STOP while retaining actual usage", async () => {
    for (const changes of [{ output_text: '{"wrong":"shape"}' }, { model: "wrong-model" }, { service_tier: "flex" }, { status: "incomplete" }]) {
      const run = await experiment({ sendChange: () => changes });
      assert.ok(run.output.globalStop); assert.equal(run.sends.length, 1); assert.equal(run.records.length, 1);
      assert.equal(run.output.summary.inputTokens, 100); assert.equal(run.output.summary.outputTokens, 20);
      assert.equal(run.output.summary.reservedUsd, reserveNanos(CAPS[0]) / 1e9);
    }
  });
  await test("invalid usage globally stops with the received raw usage and unknown reservation retained", async () => {
    const run = await experiment({ sendChange: () => ({ usage: { ...usage, total_tokens: 999 } }) });
    assert.equal(run.output.globalStop, "BUDGET_USAGE_INCONSISTENT"); assert.equal(run.sends.length, 1);
    assert.equal(run.output.summary.unknownUsageCalls, 1); assert.equal(run.records[0].pb05.usage.total_tokens, 999);
    assert.equal(run.output.summary.reservedUsd, reserveNanos(CAPS[0]) / 1e9);
  });
  await test("wrong captured stage identity causes zero HTTP and global STOP", async () => {
    const run = await experiment({ capture: async (...args) => {
      const result = await captureStageRequest(...args); result.request.promptHash = "wrong"; return result;
    } });
    assert.equal(run.output.globalStop, "RUNTIME_CONTRACT_IDENTITY_MISMATCH"); assert.equal(run.sends.length, 0);
    assert.equal(run.output.summary.reservedUsd, 0); assert.equal(run.records.length, 1);
  });
  await test("frozen report remains unchanged and no API/DB/network calls occurred", () => {
    assert.equal(hash(fs.readFileSync(oldReportPath, "utf8")), oldReportHash);
    assert.deepEqual(loadFixedUpstream().hashes, upstream.hashes);
    assert.equal(forbiddenNetworkCalls, 0);
  });
  const sourceFiles = ["evals/guidance-quality-v19-l3/targeted/adapter.mjs", "evals/guidance-quality-v19-l3/targeted/runner.mjs", "evals/guidance-quality-v19-l3/targeted/verify.mjs",
    "evals/guidance-quality-wave1/real-pilot/budget.mjs", "evals/guidance-quality-wave1/real-pilot/transport.mjs", "evals/guidance-quality-wave1/real-pilot/runner.mjs", "evals/guidance-quality-v19-l1/real-pilot.mjs"];
  const verification = { schemaVersion: "gq29-targeted-local-verification-v1", pass: true, checks, passed: checks, realApiCalls: 0,
    credentialReads: 0, actualDatabaseCalls: 0, forbiddenNetworkCalls, fakeTransportDispatches: fakeDispatches,
    fakeResponseEvidenceOnly: true, actualModelQualityValidated: false, sourceHashes: Object.fromEntries(sourceFiles.map(file => [file, createHash("sha256").update(fs.readFileSync(file)).digest("hex")])) };
  fs.writeFileSync("evals/guidance-quality-v19-l3/targeted/verification.json", JSON.stringify(verification, null, 2) + "\n");
  console.log(JSON.stringify({ checks, passed: checks, newApiCalls: 0, forbiddenNetworkCalls, oldReportIsFakeFixtureOnly: true }));
} finally { globalThis.fetch = originalFetch; }
