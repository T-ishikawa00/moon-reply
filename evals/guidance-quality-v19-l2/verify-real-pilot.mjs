// Fake/local verification only. Never invokes the live CLI, a key loader, SDK
// network dispatch, or the fresh authorized real run. Temporary assets stay here.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const priorFetch = globalThis.fetch;
let forbiddenNetwork = 0;
globalThis.fetch = async () => { forbiddenNetwork++; throw new Error("NETWORK_FORBIDDEN_L2_PILOT_VERIFIER"); };
const checks = [];
const test = async (name, fn) => { await fn(); checks.push({ name, status: "PASS" }); console.log(`PASS ${checks.length} ${name}`); };
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));

try {
  const [{ CANDIDATE_HEAD, RUN_NAME, loadV19L2PilotConfiguration, reviewReceipt }, budget, transportModule, runner, review, helpers, baseProjection, fakes] = await Promise.all([
    import("./real-pilot.mjs"), import("../guidance-quality-wave1/real-pilot/budget.mjs"),
    import("../guidance-quality-wave1/real-pilot/transport.mjs"), import("../guidance-quality-wave1/real-pilot/runner.mjs"),
    import("../guidance-quality-wave1/real-pilot/review.mjs"), import("../guidance-quality-v19-l1/fixtures.mjs"),
    import("../../lib/assessment/runtime/base-structured-intake-grounding-v1.ts"), import("../../lib/assessment/runtime/fakes.ts"),
  ]);
  const { ReservationLedger, hash, reserveNanos, accountUsage } = budget;
  const { EvaluationTransport, buildBody } = transportModule;
  const { executeSession, acquireOneShotLock } = runner;
  const { writeBlindArtifacts } = review;
  const { makeStoredFixture, makeEditedAcknowledgementFixture } = helpers;
  const config = await loadV19L2PilotConfiguration();
  const caps = config.plan.tokenCapsProposal;
  const tempRoot = path.resolve(".tmp/guidance-v19-l2-pilot-tests");
  fs.mkdirSync(tempRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(tempRoot, "verify-"));
  fs.writeFileSync(path.join(directory, "FAKE-ONLY.json"), JSON.stringify({ provenance: "FAKE_TRANSPORT_STORED_OR_AUTHORED_OUTPUTS", realApiCalls: 0, notForHumanQualityComparison: true }, null, 2));
  const frozenSourceHashes = Object.fromEntries(Object.keys(config.evaluationSourceHashes).filter(file => !file.endsWith("execution-verification.json")).map(file => [file, hash(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n"))]));
  const usage = { input_tokens: 100, output_tokens: 20, total_tokens: 120,
    input_tokens_details: { cached_tokens: 10, cache_write_tokens: 30 }, output_tokens_details: { reasoning_tokens: 5 } };
  const response = (output, changes = {}) => ({ id: "resp_synthetic", _request_id: "req_synthetic", model: "gpt-5.6-luna", status: "completed",
    service_tier: "default", usage: structuredClone(usage), output_text: JSON.stringify(output), ...changes });
  let serial = 0, fakeDispatches = 0;
  function setup(change = value => value) {
    const dir = path.join(directory, String(++serial)); fs.mkdirSync(dir);
    const manifest = change({ sessions: Array.from({ length: 8 }, (_, i) => ({ sessionId: `synthetic-${i}` })), caps, maxHttpAttempts: 72, budgetNanos: 2e9 });
    return { dir, manifest, ledger: new ReservationLedger(path.join(dir, "journal.jsonl"), manifest, { create: true }) };
  }
  async function run({ fixture = makeEditedAcknowledgementFixture(), catalog = config.catalogs["candidate-v19-l2"], onReceipt, mutateOutput } = {}) {
    const state = setup(), sends = [], receipts = [];
    const record = await executeSession({ session: { sessionId: "synthetic-0", caseId: fixture.caseId, anonymousVariantId: "A" }, catalog,
      input: fixture.request, directory: state.dir, ledger: state.ledger, frozenNow: config.plan.generation.frozenApplicationNow,
      send: async (body, mark) => {
        assert.equal(state.ledger.calls.at(-1).status, "reserved");
        assert.ok(state.ledger.reservedNanos <= 2e9);
        mark(); fakeDispatches++;
        const definition = catalog.definitions.find(def => def.schemaName === body.text.format.name);
        assert.ok(definition); sends.push(definition.stageId);
        assert.equal(body.model, "gpt-5.6-luna"); assert.equal(body.reasoning.effort, "low"); assert.equal(body.service_tier, "default");
        assert.equal(body.store, false); assert.equal(body.stream, false); assert.equal(body.background, false);
        assert.equal(body.truncation, "disabled"); assert.deepEqual(body.tools, []);
        assert.equal(body.max_output_tokens, caps.find(cap => cap.stage === definition.stageId).outputIncludingReasoning);
        if (definition.stageId === "PB-01") assert.deepEqual(JSON.parse(body.input[1].content[0].text), { run_mode: "initial_base", base_provider_input: baseProjection.projectBaseProviderInputV1(fixture.request) });
        const output = structuredClone(fixture.outputs[definition.stageId]); assert.ok(output);
        mutateOutput?.(definition.stageId, output);
        return response(output);
      },
      reviewReceipt: async receipt => {
        receipts.push(receipt.stageId);
        assert.ok(fs.existsSync(receipt.prefix + "-response.json")); assert.ok(fs.existsSync(receipt.prefix + "-review.json"));
        assert.equal(state.ledger.summary().unknownUsageCalls, 0);
        assert.equal(state.ledger.summary().inputTokens, sends.length * 100);
        await onReceipt?.(receipt, { ...state, sends });
      } });
    assert.equal(record.actualHttpCalls, sends.length); assert.equal(record.repository.actualDatabaseCalls, 0);
    assert.deepEqual(read(path.join(state.dir, "session.json")), record);
    return { ...state, sends, receipts, record };
  }
  async function approveSyntheticReceipt(receipt, mutate = () => {}) {
    const log = console.log;
    let pending;
    try { console.log = () => {}; pending = reviewReceipt(receipt); } finally { console.log = log; }
    const required = read(receipt.prefix + "-inspection-required.json");
    const decision = { action: "continue", reason: "Synthetic offline inspection only; no Human quality judgment", receiptHash: required.receiptHash, stageId: receipt.stageId, attempt: receipt.attempt };
    mutate(decision);
    fs.writeFileSync(receipt.prefix + "-inspection-decision.json", JSON.stringify(decision), { flag: "wx" });
    await pending;
  }

  await test("exact frozen candidate, four inputs, eight sessions and unchanged execution constraints", () => {
    assert.equal(execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), CANDIDATE_HEAD);
    assert.equal(CANDIDATE_HEAD, "64a1321477c5b76ed946ad8ecbe0dda888f9390f");
    assert.deepEqual(config.inputs.cases.map(item => item.id), ["GQ-05", "GQ-24", "GQ-13", "GQ-29-P3"]);
    assert.equal(config.plan.executionOrder.length, 8); assert.equal(new Set(config.plan.executionOrder.map(row => JSON.stringify(row))).size, 8);
    assert.equal(config.plan.proposedBudgetUsd, 2); assert.equal(config.plan.maxHttpAttempts, 72);
    for (const field of ["maximumClarificationAnswers", "transportRetries", "applicationProviderRetries", "attempt3", "additionalSamples"]) assert.equal(config.plan[field], 0);
    assert.equal(config.plan.samplesPerArmCase, 1); assert.equal(config.plan.productGenerationAttempts, 2);
    assert.equal(config.catalogs["current-v17"].catalogVersion, "runtime-stage-catalog-v17.0.0");
    assert.equal(config.catalogs["candidate-v19-l2"].catalogVersion, "runtime-stage-catalog-v20.0.0");
    assert.equal(config.catalogs["candidate-v19-l2"].definitions.find(stage => stage.stageId === "PB-06").promptVersion, "v9.0.0");
    assert.equal(config.plan.blind.reuseHistoricalAssignments, false); assert.equal(config.plan.blind.reuseHistoricalSessions, false);
  });
  await test("fixed caps total 72 calls and USD1.5330112; serialized input estimates fit both arms", () => {
    assert.deepEqual(caps.map(cap => [cap.stage, cap.invocationsPerSession, cap.input, cap.outputIncludingReasoning]), [
      ["PB-01", 1, 42000, 8192], ["PB-01C", 0, 0, 0], ["PB-02", 1, 24000, 3072], ["PB-03", 1, 24000, 2048],
      ["PB-04", 2, 48000, 8192], ["PB-05", 2, 64000, 8192], ["PB-06", 2, 96000, 4096],
    ]);
    assert.equal(caps.reduce((sum, cap) => sum + reserveNanos(cap) * cap.invocationsPerSession, 0) * 8, 1_533_011_200);
    assert.equal(caps.reduce((sum, cap) => sum + cap.invocationsPerSession, 0) * 8, 72);
    for (const catalog of Object.values(config.catalogs)) for (const item of config.inputs.cases) {
      const definition = catalog.definitions.find(stage => stage.stageId === "PB-01");
      const input = { run_mode: "initial_base", base_provider_input: baseProjection.projectBaseProviderInputV1(item.input) };
      assert.ok(Buffer.byteLength(JSON.stringify(buildBody({ ...definition, input }, caps[0])), "utf8") + 4096 <= caps[0].input);
    }
  });
  await test("actual usage accounts cache writes once and reserves output including reasoning", () => {
    const charged = accountUsage(usage, caps[0]);
    assert.equal(charged.lowerNanos, 60 * 200 + 10 * 20 + 30 * 250 + 20 * 1200);
    assert.equal(charged.lowerNanos, charged.upperNanos); assert.equal(charged.pricingComplete, true);
    const unknownWrites = structuredClone(usage); delete unknownWrites.input_tokens_details.cache_write_tokens;
    const bounded = accountUsage(unknownWrites, caps[0]); assert.equal(bounded.pricingComplete, false); assert.ok(bounded.upperNanos > bounded.lowerNanos);
    assert.throws(() => accountUsage(usage, caps[0], 99), /BUDGET_USAGE/);
    assert.throws(() => accountUsage({ ...usage, total_tokens: 999 }, caps[0]), /BUDGET_USAGE/);
  });
  await test("shared ledger bounds all 72 reservations without refunds and rejects extra session", () => {
    const { ledger } = setup();
    for (let index = 0; index < 8; index++) {
      const id = `synthetic-${index}`; ledger.start(id);
      for (const cap of caps) for (let attempt = 1; attempt <= cap.invocationsPerSession; attempt++) {
        const reserved = ledger.reserve(id, cap.stage, attempt, cap.input, hash([id, cap.stage, attempt]));
        ledger.dispatch(reserved); ledger.settle(reserved, { status: "received", accounting: accountUsage(usage, cap) });
      }
      ledger.finish(id, "completed");
    }
    assert.equal(ledger.calls.length, 72); assert.equal(ledger.reservedNanos, 1_533_011_200); assert.equal(ledger.summary().actualHttpCalls, 72);
    assert.throws(() => ledger.start("extra-session"), /BUDGET_SESSION/);
  });
  await test("budget shortfall blocks reservation before dispatch; no stage or attempt 3 exception", () => {
    const { ledger } = setup(value => ({ ...value, budgetNanos: reserveNanos(caps[0]) }));
    ledger.start("synthetic-0"); const first = ledger.reserve("synthetic-0", "PB-01", 1, 100, "request");
    ledger.dispatch(first); ledger.settle(first, { status: "received", accounting: accountUsage(usage, caps[0]) });
    assert.throws(() => ledger.reserve("synthetic-0", "PB-02", 1, 100, "second"), /BUDGET_RESERVATION/);
    assert.equal(ledger.summary().actualHttpCalls, 1);
    assert.throws(() => ledger.reserve("synthetic-0", "PB-01C", 1, 0, "candidate"), /BUDGET_RESERVATION/);
    assert.throws(() => ledger.reserve("synthetic-0", "PB-04", 3, 100, "attempt3"), /BUDGET_RESERVATION/);
  });
  await test("unknown or crash-pending reservations persist and prevent retry across reload", () => {
    for (const settle of [false, true]) {
      const { ledger, dir, manifest } = setup(); ledger.start("synthetic-0");
      const reservation = ledger.reserve("synthetic-0", "PB-01", 1, 100, "same-request"); ledger.dispatch(reservation);
      if (settle) { ledger.settle(reservation, { status: "unknown_or_failed", stopReason: "HTTP_TIMEOUT" }); ledger.stop("HTTP_TIMEOUT"); }
      const reloaded = new ReservationLedger(path.join(dir, "journal.jsonl"), manifest);
      assert.equal(reloaded.reservedNanos, reserveNanos(caps[0])); assert.equal(reloaded.summary().unknownUsageCalls, 1);
      assert.throws(() => reloaded.reserve("synthetic-0", "PB-01", 1, 100, "same-request"), /BUDGET_RESERVATION/);
      assert.throws(() => reloaded.start("synthetic-0"), /BUDGET_SESSION/);
    }
  });
  await test("ledger durability failures poison execution; truncated journal and duplicate lock reject", () => {
    const { ledger, dir, manifest } = setup();
    ledger.io = { ...fs, writeSync: (fd, buffer, offset, length) => fs.writeSync(fd, buffer, offset, Math.min(9, length)) };
    ledger.start("synthetic-0"); assert.equal(new ReservationLedger(path.join(dir, "journal.jsonl"), manifest).sessions.size, 1);
    ledger.io = { ...fs, fsyncSync: () => { throw new Error("synthetic fsync failure"); } };
    assert.throws(() => ledger.reserve("synthetic-0", "PB-01", 1, 100, "x"), /BUDGET_LEDGER_IO/);
    assert.equal(ledger.poisoned, true);
    assert.throws(() => ledger.reserve("synthetic-0", "PB-02", 1, 100, "y"), /BUDGET_LEDGER_IO/);
    const other = setup(); fs.appendFileSync(path.join(other.dir, "journal.jsonl"), "{");
    assert.throws(() => new ReservationLedger(path.join(other.dir, "journal.jsonl"), other.manifest), /BUDGET_LEDGER_TRUNCATED/);
    acquireOneShotLock(other.dir); assert.throws(() => acquireOneShotLock(other.dir), /EEXIST/);
  });

  const fixedRecords = [];
  await test("fresh fake sends for both catalogs use the same four frozen input objects", async () => {
    for (const item of config.inputs.cases) {
      let variant = 0;
      for (const [arm, catalog] of Object.entries(config.catalogs)) {
        const fixture = item.id === "GQ-24" && arm === "candidate-v19-l2" ? makeEditedAcknowledgementFixture() : makeStoredFixture(item.id);
        assert.deepEqual(fixture.request, item.input);
        const outcome = await run({ fixture, catalog });
        assert.equal(outcome.record.errorCode, null); assert.deepEqual(outcome.sends, outcome.receipts);
        assert.equal(outcome.record.reassessment.length, 0); assert.equal(outcome.sends.includes("PB-01C"), false);
        assert.equal(outcome.record.finalOutput.eligibility, item.id === "GQ-05" || (item.id === "GQ-24" && arm === "current-v17") ? "needs_more_information" : "ready");
        outcome.record.anonymousVariantId = variant++ === 0 ? "A" : "B";
        fixedRecords.push(outcome.record);
      }
    }
    assert.equal(fixedRecords.length, 8);
  });
  await test("major and critical present-action findings STOP both catalogs before repair", async () => {
    for (const catalog of Object.values(config.catalogs)) for (const severity of ["major", "critical"]) {
      const outcome = await run({ fixture: makeStoredFixture("GQ-13"), catalog,
        mutateOutput: (stage, output) => { if (stage === "PB-06") output.semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity,
          json_path: "decision_plan.actions_to_take[0]", evidence_refs: ["policy:action_context"], detail: "Synthetic same-time same-action contradiction for STOP verification only." }]; },
        onReceipt: receipt => receipt.stageId === "PB-06" ? reviewReceipt(receipt) : undefined });
      assert.equal(outcome.record.errorCode, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING"); assert.equal(outcome.sends.length, 6);
      assert.equal(outcome.record.reassessment.length, 0); assert.equal(outcome.record.finalOutput, null);
      assert.equal(outcome.ledger.summary().inputTokens, 600); assert.ok(outcome.ledger.stopReason);
    }
  });
  await test("raw ACTION_CONSISTENCY major or critical ignored by old classifier still STOPs both catalogs", async () => {
    for (const catalog of Object.values(config.catalogs)) for (const severity of ["major", "critical"]) {
      let rawStopSeen = false;
      const fixture = makeStoredFixture("GQ-13"); assert.ok(fixture.outputs["PB-04"].change_conditions.length);
      const outcome = await run({ fixture, catalog,
        mutateOutput: (stage, output) => { if (stage === "PB-06") output.semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity,
          json_path: "decision_plan.change_conditions[0].resulting_direction", evidence_refs: ["policy:effective_decision_policy_result", "policy:decision_policy_result"], detail: "Synthetic raw finding with classifier-ignored future-path metadata." }]; },
        onReceipt: async receipt => { if (receipt.stageId === "PB-06") {
          assert.equal(receipt.review.stopReason, null); assert.equal(receipt.review.disposition.blockingFindings.length, 0);
          assert.equal(receipt.review.disposition.ignoredTemporalFalsePositives.length, 1);
          rawStopSeen = true; await reviewReceipt(receipt);
        } } });
      assert.equal(rawStopSeen, true); assert.equal(outcome.record.errorCode, "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
      assert.equal(outcome.record.reassessment.length, 0); assert.equal(outcome.record.finalOutput, null); assert.equal(outcome.sends.length, 6);
      assert.equal(outcome.ledger.summary().inputTokens, 600);
      assert.ok(outcome.record.findings.some(finding => finding.stopReason === "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"));
    }
  });
  await test("receipt inspection prevents the next fake HTTP until explicit release", async () => {
    let notify, release;
    const started = new Promise(resolve => { notify = resolve; }), gate = new Promise(resolve => { release = resolve; });
    const pending = run({ onReceipt: async (receipt, state) => { if (receipt.stageId === "PB-01") { notify(state); await gate; } } });
    const state = await started; await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(state.sends, ["PB-01"]); assert.equal(state.ledger.summary().actualHttpCalls, 1);
    release(); const result = await pending; assert.equal(result.record.finalDeliveryDisposition, "ready_local_only");
  });
  await test("real profile checkpoint preserves exact receipt hash stage attempt and empty reason guards", async () => {
    for (const variant of ["wrong_hash", "wrong_stage", "wrong_attempt", "empty_reason", "stop", "continue"]) {
      const outcome = await run({ onReceipt: async receipt => { if (receipt.stageId === "PB-01") await approveSyntheticReceipt(receipt, decision => {
        if (variant === "wrong_hash") decision.receiptHash = "wrong";
        if (variant === "wrong_stage") decision.stageId = "PB-06";
        if (variant === "wrong_attempt") decision.attempt = 2;
        if (variant === "empty_reason") decision.reason = " ";
        if (variant === "stop") decision.action = "stop";
      }); } });
      assert.equal(outcome.sends.length, variant === "continue" ? 6 : 1);
      assert.equal(outcome.record.errorCode, variant === "continue" ? null : variant === "stop" ? "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY" : "LOCAL_INSPECTION_INVALID");
    }
  });
  await test("ordinary PB06 continues only after normal bound checkpoint; local timeout stops", async () => {
    const valid = await run({ onReceipt: receipt => receipt.stageId === "PB-06" ? approveSyntheticReceipt(receipt) : undefined });
    assert.equal(valid.record.errorCode, null);
    const timeout = await run({ onReceipt: async receipt => {
      if (receipt.stageId !== "PB-01") return;
      const now = Date.now, log = console.log; let reads = 0;
      try { Date.now = () => ++reads === 1 ? 0 : 30 * 60_000 + 1; console.log = () => {}; await reviewReceipt(receipt); }
      finally { Date.now = now; console.log = log; }
    } });
    assert.equal(timeout.record.errorCode, "LOCAL_INSPECTION_TIMEOUT"); assert.deepEqual(timeout.sends, ["PB-01"]);
    assert.equal(timeout.ledger.summary().inputTokens, 100);
  });
  await test("known false generated-draft preservation STOPs at PB04 with no repair", async () => {
    const outcome = await run({ mutateOutput: (stage, output) => { if (stage === "PB-04") output.message_draft_edit_metadata.preserved_meaning = true; } });
    assert.equal(outcome.record.errorCode, "MATERIAL_DRAFT_SOURCE_INTEGRITY"); assert.equal(outcome.sends.length, 4);
    assert.equal(outcome.record.reassessment.length, 0); assert.equal(outcome.record.finalOutput, null);
  });

  async function singleFailure({ changes = {}, failure = null, schemaMismatch = false } = {}) {
    const state = setup(); state.ledger.start("synthetic-0");
    const catalog = config.catalogs["candidate-v19-l2"], definition = catalog.definitions.find(stage => stage.stageId === "PB-01");
    const fixture = makeEditedAcknowledgementFixture(), repository = new fakes.FakeAssessmentRepository();
    repository.stageRuns.set("synthetic-stage", { stageId: "PB-01", status: "processing", attemptNumber: 1 });
    let sends = 0;
    const transport = new EvaluationTransport({ session: { sessionId: "synthetic-0" }, ledger: state.ledger, repository, definitions: catalog.definitions,
      originalInput: fixture.request, directory: state.dir, send: async (_body, mark) => { mark(); sends++; fakeDispatches++; if (failure) throw failure; return response(fixture.outputs["PB-01"], changes); } });
    const request = { ...definition, model: "gpt-5.6-luna", input: { run_mode: "initial_base", base_provider_input: baseProjection.projectBaseProviderInputV1(fixture.request) } };
    if (schemaMismatch) request.schemaHash = "wrong";
    await assert.rejects(() => transport.invoke(request));
    assert.equal(sends, schemaMismatch ? 0 : 1); assert.ok(state.ledger.stopReason);
    await assert.rejects(() => transport.invoke(request)); assert.equal(sends, schemaMismatch ? 0 : 1);
    return state;
  }
  await test("HTTP failure and timeout retain worst-case reservation and never retry", async () => {
    for (const failure of [Object.assign(new Error("synthetic private failure detail"), { status: 500 }), Object.assign(new Error("timeout"), { name: "APIConnectionTimeoutError" })]) {
      const state = await singleFailure({ failure });
      assert.equal(state.ledger.reservedNanos, reserveNanos(caps[0])); assert.equal(state.ledger.summary().unknownUsageCalls, 1);
      assert.equal(fs.readFileSync(path.join(state.dir, "journal.jsonl"), "utf8").includes("synthetic private failure detail"), false);
    }
  });
  await test("model tier incomplete JSON and schema failures retain usage before STOP without retry", async () => {
    for (const changes of [{ model: "wrong-model" }, { service_tier: "flex" }, { status: "incomplete" }, { output_text: "{" }, { output_text: '{"wrong":"shape"}' }]) {
      const state = await singleFailure({ changes });
      assert.equal(state.ledger.summary().inputTokens, 100); assert.equal(state.ledger.summary().outputTokens, 20);
      assert.equal(state.ledger.reservedNanos, reserveNanos(caps[0]));
      assert.ok(fs.readdirSync(state.dir).some(file => file.endsWith("-response.json")));
    }
  });
  await test("invalid usage retains raw receipt and full reservation; identity mismatch sends zero", async () => {
    const invalid = await singleFailure({ changes: { usage: { ...usage, total_tokens: 999 } } });
    assert.equal(invalid.ledger.summary().unknownUsageCalls, 1); assert.equal(invalid.ledger.reservedNanos, reserveNanos(caps[0]));
    assert.ok(fs.readdirSync(invalid.dir).some(file => file.endsWith("-response.json")));
    const mismatch = await singleFailure({ schemaMismatch: true }); assert.equal(mismatch.ledger.calls.length, 0);
  });
  await test("nonmaterial finding keeps the existing single repair without attempt 3", async () => {
    let verdicts = 0;
    const outcome = await run({ mutateOutput: (stage, output) => { if (stage === "PB-06" && ++verdicts === 1) output.semantic_checks = [{ finding_code: "TEMPLATE_GENERICITY", severity: "major", json_path: "report_content.short_letter", evidence_refs: [], detail: "Synthetic expression-only repair fixture." }]; } });
    assert.equal(outcome.record.finalDeliveryDisposition, "ready_local_only");
    assert.equal(outcome.sends.filter(stage => stage === "PB-04").length, 1);
    for (const stage of ["PB-05", "PB-06"]) assert.equal(outcome.sends.filter(value => value === stage).length, 2);
    assert.ok(outcome.record.stageDispositions.every(stage => (stage.attemptNumber ?? 1) <= 2));
    assert.deepEqual(outcome.sends, outcome.receipts);
  });
  async function render(records) {
    const dir = path.join(directory, `public-${++serial}`); fs.mkdirSync(dir); fs.mkdirSync(path.join(dir, "internal"));
    await writeBlindArtifacts({ runDirectory: dir, inputs: config.inputs, records, summary: { stopReason: records.length === 8 ? null : "SYNTHETIC_STOP" } });
    const html = fs.readFileSync(path.join(dir, "blind-review.html"), "utf8"), markdown = fs.readFileSync(path.join(dir, "blind-review.md"), "utf8");
    for (const text of [html, markdown]) assert.doesNotMatch(text, /current-v17|candidate-v19|runtime-stage-catalog|promptBundleVersion|actualRuntimeVersion|\bV(?:17|18|19|20)\b|synthetic-0|resp_synthetic|req_synthetic/);
    assert.doesNotMatch(html, /\schecked(?:[\s=>])/);
    assert.equal((html.match(/<textarea[^>]*>[^<]+<\/textarea>/gu) ?? []).length, 0);
    return { html, markdown };
  }
  await test("same four unanswered Human questions and anonymous eight outputs remain unchanged", async () => {
    const { html, markdown } = await render(fixedRecords);
    assert.equal((html.match(/class="output-label"/gu) ?? []).length, 8); assert.equal((html.match(/<form data-case=/gu) ?? []).length, 4);
    for (const question of ["1. 月の返事としてどちらが良い？", "2. 理由は一言で何？", "3. A/Bそれぞれに重大な問題はある？", "4. 980円で受け取るならどちら？"]) {
      assert.ok(html.includes(question)); assert.ok(markdown.includes(question));
    }
    for (const issue of ["事実の捏造", "意味のズレ", "不必要に待たせる", "不必要に送らせる", "重すぎる", "依頼を落としている", "その他", "なし"]) assert.ok(html.includes(issue));
    assert.ok(markdown.includes("回答：未記入"));
    assert.equal(html.includes("moon-reply-2026-09-07-authorized-pilot8-human-answers"), false);
  });
  await test("partial and empty STOP artifacts never invent missing outcomes", async () => {
    const partial = await render(fixedRecords.slice(0, 1)); assert.equal((partial.html.match(/class="output-label"/gu) ?? []).length, 2); assert.ok(partial.html.includes("未実施です"));
    const empty = await render([]); assert.equal((empty.html.match(/class="output-label"/gu) ?? []).length, 0); assert.ok(empty.html.includes("取得済みsessionはありません"));
  });
  await test("existing sources untouched; new real run and mapping absent; no network or live CLI", () => {
    for (const [file, digest] of Object.entries(frozenSourceHashes)) assert.equal(hash(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n")), digest);
    assert.equal(fs.existsSync(path.join(config.evaluationRoot, "runs", RUN_NAME)), false);
    assert.equal(forbiddenNetwork, 0);
    const source = fs.readFileSync("evals/guidance-quality-wave1/real-pilot/runner.mjs", "utf8");
    assert.ok(source.includes("maxRetries: 0")); assert.ok(source.includes("timeout: 180_000"));
    assert.ok(source.includes('redirect: "error"'));
  });
  const summary = { schemaVersion: "guidance-v19-l2-authorized-pilot-fake-verification-v1", candidateHead: CANDIDATE_HEAD,
    checks: checks.length, passed: checks.length, failed: 0, realApiCalls: 0, credentialReads: 0, actualDatabaseCalls: 0, forbiddenNetwork,
    fakeTransportDispatches: fakeDispatches, fakeMatrixSessions: 8, actualPilotSessions: 0,
    evidence: "OFFLINE_SYNTHETIC_TRANSPORT_WITH_STORED_OR_AUTHORED_OUTPUTS_ONLY", rawActionConsistencyMajorCriticalStops: true,
    classifierIgnoredRawActionConsistencyStops: true, actualModelQuality: "NOT_TESTED", historicalMappingReused: false,
    actualRunCreated: false, humanAnswersPrefilled: false, mappingDisclosed: false, results: checks };
  fs.writeFileSync("evals/guidance-quality-v19-l2/execution-verification.json", JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify({ checks: checks.length, passed: checks.length, realApiCalls: 0, forbiddenNetwork, mappingDisclosed: false }));
} finally {
  globalThis.fetch = priorFetch;
}
