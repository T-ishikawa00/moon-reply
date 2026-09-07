// Fake-only verification. Never invokes a live CLI, credentials, network,
// Production storage, or any historical/real evaluation runner entry point.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const priorFetch = globalThis.fetch;
let forbiddenNetworkCalls = 0;
globalThis.fetch = async () => { forbiddenNetworkCalls++; throw new Error("FRESH_FAKE_NETWORK_FORBIDDEN"); };
const results = [];
const test = async (name, action) => { await action(); results.push({ name, status: "PASS" }); console.log(`PASS ${results.length} ${name}`); };
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const byteHash = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

try {
  const [driver, core, budget, transportModule, fixtures] = await Promise.all([
    import("./runner.mjs"), import("./stop-policy.mjs"), import("../../guidance-quality-wave1/real-pilot/budget.mjs"),
    import("../../guidance-quality-wave1/real-pilot/transport.mjs"), import("../../guidance-quality-v19-l1/fixtures.mjs"),
  ]);
  const { loadFreshConfiguration, createManifest, validateManifest, runFresh } = driver;
  const { SessionLedger, classifyStop, assertNoRawActionConsistency } = core;
  const { ReservationLedger, reserveNanos, accountUsage, hash, PilotStop } = budget;
  const { buildBody } = transportModule;
  const config = await loadFreshConfiguration({ requireVerification: false });
  const caps = config.plan.tokenCapsProposal;
  assert.equal(execFileSync("git", ["check-ignore", ".tmp/fresh-blind-tests/probe"], { encoding: "utf8" }).trim(), ".tmp/fresh-blind-tests/probe");
  const tempRoot = path.resolve(".tmp/fresh-blind-tests"); fs.mkdirSync(tempRoot, { recursive: true });
  const temp = fs.mkdtempSync(path.join(tempRoot, "verify-"));
  fs.writeFileSync(path.join(temp, "FAKE-ONLY.json"), JSON.stringify({ fakeOnly: true, realApiCalls: 0, neverUseForHumanQualityComparison: true }));
  let serial = 0;
  const catalog = Object.values(config.catalogs).find(value => value.catalogVersion === "runtime-stage-catalog-v21.0.0");
  assert.ok(catalog);
  const usage = { input_tokens: 100, output_tokens: 20, total_tokens: 120, input_tokens_details: { cached_tokens: 10, cache_write_tokens: 30 }, output_tokens_details: { reasoning_tokens: 5 } };
  const response = (output, changes = {}) => ({ id: "resp_fake", _request_id: "req_fake", model: "gpt-5.6-luna", service_tier: "default", status: "completed", usage: structuredClone(usage), output_text: JSON.stringify(output), ...changes });
  function ledgerState() {
    const dir = path.join(temp, `ledger-${++serial}`); fs.mkdirSync(dir);
    const manifest = { sessions: [{ sessionId: "s0" }, { sessionId: "s1" }], caps, maxHttpAttempts: 72, budgetNanos: 2e9 };
    const shared = new ReservationLedger(path.join(dir, "ledger.jsonl"), manifest, { create: true });
    return { dir, manifest, shared, local: new SessionLedger(shared, { sessionId: "s0", definitions: catalog.definitions }) };
  }
  function firstRequest(state, rawResponse) {
    const definition = catalog.definitions.find(value => value.stageId === "PB-01");
    const body = buildBody({ ...definition, input: { run_mode: "initial_base", base_provider_input: {} } }, caps[0]);
    state.local.start("s0");
    const reservation = state.local.reserve("s0", "PB-01", 1, caps[0].input, hash(body)); state.local.dispatch(reservation);
    state.local.noteResponse(body, rawResponse);
    state.local.settle(reservation, { status: "received", accounting: accountUsage(usage, caps[0]) });
    return { body, reservation };
  }
  await test("baseline history changed only targeted evaluation assets and both runtime identities match", () => {
    const changed = execFileSync("git", ["diff", "--name-only", "cc899b92e94e26b71d83eae3a747f0b849874ddc..b62e1a9ac3794344925e2fef8d1fed71c99fb48f"], { encoding: "utf8" }).trim().split(/\r?\n/u);
    assert.equal(changed.length, 45);
    assert.ok(changed.every(file => file === "evals/guidance-quality-v19-l3/.gitattributes" || file.startsWith("evals/guidance-quality-v19-l3/targeted/") || file.startsWith("evals/guidance-quality-v19-l3/runs/2026-09-08-gq29-p3-targeted/")));
    assert.equal(execFileSync("git", ["diff", "--name-only", "cc899b92e94e26b71d83eae3a747f0b849874ddc..b62e1a9ac3794344925e2fef8d1fed71c99fb48f", "--", "lib", "ai", "app", "components", "supabase"], { encoding: "utf8" }).trim(), "");
    assert.deepEqual(catalog.definitions.map(({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName }) => ({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName })), read("evals/guidance-quality-v19-l3/catalog-identity.json").definitions);
    assert.ok(Object.values(config.catalogs).some(value => value.catalogVersion === "runtime-stage-catalog-v17.0.0"));
  });
  await test("schema and incomplete session routing requires exact accounted response provenance", () => {
    const good = { requestIdentityVerified: true, model: "gpt-5.6-luna", serviceTier: "default", accounted: true, settlementStatus: "received", status: "completed", outputValidation: "schema_invalid", stageId: "PB-01" };
    assert.equal(classifyStop("M2_STAGE_SCHEMA_INVALID", good).scope, "session");
    assert.equal(classifyStop("INCOMPLETE_RESPONSE", { ...good, status: "incomplete" }).scope, "session");
    for (const patch of [{ model: "other" }, { serviceTier: "flex" }, { accounted: false }, { requestIdentityVerified: false }, { settlementStatus: "unknown_or_failed" }, { outputValidation: "validation_configuration_or_application_error" }]) {
      assert.equal(classifyStop("M2_STAGE_SCHEMA_INVALID", { ...good, ...patch }).scope, "global");
    }
    for (const reason of ["MODEL_IDENTITY_MISMATCH", "RUNTIME_CONTRACT_IDENTITY_MISMATCH", "BUDGET_USAGE_INCONSISTENT", "HTTP_FAILURE_401", "HTTP_FAILURE_429", "HTTP_TIMEOUT", "MAPPING_INVALID", "UNKNOWN_APPLICATION_FAILURE"]) assert.equal(classifyStop(reason, good).scope, "global");
  });
  await test("a stopped session cannot resume or refund while the next independent session can run", () => {
    const state = ledgerState(); firstRequest(state, response({ wrong: "shape" })); state.local.stop("M2_STAGE_SCHEMA_INVALID");
    assert.equal(state.local.stopReason, "M2_STAGE_SCHEMA_INVALID"); assert.equal(state.shared.stopReason, null);
    const reserved = state.shared.reservedNanos; state.local.finish("s0", "failed");
    assert.throws(() => state.local.reserve("s0", "PB-02", 1, 100, "retry"), /M2_STAGE_SCHEMA_INVALID/);
    assert.throws(() => state.local.start("s0"), /M2_STAGE_SCHEMA_INVALID/);
    const next = new SessionLedger(state.shared, { sessionId: "s1", definitions: catalog.definitions }); next.start("s1");
    next.reserve("s1", "PB-01", 1, 100, "new-independent-session");
    assert.equal(state.shared.reservedNanos, reserved + reserveNanos(caps[0]));
  });
  await test("new reservations discard old success provenance and prevent failure misclassification", () => {
    const state = ledgerState(); firstRequest(state, response({ wrong: "shape" }));
    state.local.reserve("s0", "PB-02", 1, 100, "new-request"); assert.equal(state.local.provenance, null);
    state.local.stop("M2_STAGE_SCHEMA_INVALID"); assert.equal(state.shared.stopReason, "M2_STAGE_SCHEMA_INVALID");
    const other = ledgerState(); assert.throws(() => other.local.start("s1"), /BUDGET_SESSION_IDENTITY_MISMATCH/);
    assert.equal(other.shared.stopReason, "BUDGET_SESSION_IDENTITY_MISMATCH");
  });
  await test("tampered request identity cannot become a local model-schema failure", () => {
    const state = ledgerState(), definition = catalog.definitions[0];
    const body = buildBody({ ...definition, input: {} }, caps[0]); body.input[0].content[0].text += " unauthorized prompt";
    state.local.start("s0"); const reserved = state.local.reserve("s0", "PB-01", 1, caps[0].input, hash(body)); state.local.dispatch(reserved);
    assert.throws(() => state.local.noteResponse(body, response({ wrong: "shape" })), /RESPONSE_REQUEST_IDENTITY_MISMATCH/);
    assert.equal(state.shared.stopReason, "RESPONSE_REQUEST_IDENTITY_MISMATCH");
  });
  await test("raw major and critical ACTION_CONSISTENCY stop even with classifier-ignored metadata", () => {
    for (const severity of ["major", "critical"]) assert.throws(() => assertNoRawActionConsistency({ stageId: "PB-06", received: { outputText: JSON.stringify({ semantic_checks: [{ finding_code: "ACTION_CONSISTENCY", severity, json_path: "decision_plan.change_conditions[0].resulting_direction", evidence_refs: ["policy:decision_policy_result"] }] }) } }), /MATERIAL_MANUAL_INTEGRITY_OR_SAFETY/);
    assert.doesNotThrow(() => assertNoRawActionConsistency({ stageId: "PB-06", received: { outputText: JSON.stringify({ semantic_checks: [] }) } }));
  });

  const fixedFixtures = Object.fromEntries(config.inputs.cases.map(c => [c.id, fixtures.makeStoredFixture(c.id)]));
  const candidateArm = config.candidateArm;
  const primary = context => context.caseId === "GQ-24" && context.arm === candidateArm;
  const fakeFinding = (code, severity, jsonPath, refs = ["policy:decision_policy_result"]) => ({ finding_code: code, severity,
    json_path: jsonPath, evidence_refs: refs, detail: "FAKE ONLY: controlled finding for stop routing; not a model judgment." });
  async function experiment({ change = () => ({}), inspect = async () => {}, before = () => {} } = {}) {
    const directory = path.join(temp, `run-${++serial}`), sends = [];
    let active = null;
    const send = async (body, mark) => {
      const definitions = active ? config.catalogs[active.arm].definitions : catalog.definitions;
      let stage = definitions.find(d => d.schemaName === body.text.format.name)?.stageId;
      // PB01 uses different schemas across the two immutable catalogs.
      if (Object.values(config.catalogs).some(c => c.definitions.find(d => d.stageId === "PB-01").schemaName === body.text.format.name)) stage = "PB-01";
      if (stage === "PB-01") {
        const data = JSON.parse(body.input[1].content[0].text).base_provider_input;
        const item = config.inputs.cases.find(c => c.input.currentSituation === data.current_situation);
        assert.ok(item, "fake generator receives only a fixed synthetic input");
        const arm = Object.entries(config.catalogs).find(([,c]) => c.definitions.find(d => d.stageId === stage).developerPrompt === body.input[0].content[0].text)?.[0];
        assert.ok(arm, "exact catalog prompt identity");
        active = { caseId: item.id, arm, counts: {}, fixture: item.id === "GQ-24" && arm === candidateArm ? fixtures.makeEditedAcknowledgementFixture() : structuredClone(fixedFixtures[item.id]) };
      }
      assert.ok(stage && active);
      const definition = config.catalogs[active.arm].definitions.find(d => d.stageId === stage), cap = caps.find(c => c.stage === stage);
      assert.equal(body.input[0].content[0].text, definition.developerPrompt);
      assert.equal(body.text.format.name, definition.schemaName); assert.equal(body.model, config.plan.model);
      assert.equal(body.service_tier, "default"); assert.equal(body.reasoning.effort, "low"); assert.equal(body.max_output_tokens, cap.outputIncludingReasoning);
      active.counts[stage] = (active.counts[stage] ?? 0) + 1;
      assert.ok(active.counts[stage] <= cap.invocationsPerSession);
      const output = structuredClone(active.fixture.outputs[stage]); assert.ok(output, "fake fixture has requested stage");
      const context = { caseId: active.caseId, arm: active.arm, stage, occurrence: active.counts[stage], output, body, directory, callIndex: sends.length };
      before(context); mark(); sends.push({ caseId: active.caseId, arm: active.arm, stage, occurrence: context.occurrence });
      const changes = await change(context); return response(output, changes);
    };
    const priorLog = console.log;
    let result;
    try { console.log = () => {}; result = await runFresh({ config, directory, send, inspect }); }
    finally { console.log = priorLog; }
    assert.equal(result.summary.httpCalls, sends.length, "one counted dispatch per fake call");
    assert.ok(sends.length <= 72); assert.ok(result.summary.reservedUsd <= 2);
    assert.equal(result.summary.retries, 0); assert.equal(result.summary.additionalSamples, 0); assert.equal(result.summary.attempt3, 0);
    return { directory, sends, ...result };
  }
  function assertSingleLocalStop(run, code) {
    assert.equal(run.summary.globalStop, null, "local model failure must not stop independent sessions");
    assert.equal(run.summary.attemptedSessions, 8); assert.equal(run.summary.stoppedSessions, 1);
    assert.equal(run.summary.sessionStopReasons[code], 1);
    const stopped = run.records.filter(r => r.errorCode); assert.equal(stopped.length, 1); assert.equal(stopped[0].errorCode, code);
    assert.notEqual(stopped[0].finalDeliveryDisposition, "ready_local_only");
    const audit = read(path.join(run.directory, "blind-integrity-check.json"));
    assert.equal(audit.outputStates.filter(s => s.state === "stopped").length, 1);
    assert.equal(audit.mappingDisplayed, false); assert.equal(audit.placeholderDisplaySlots, 0);
  }
  function assertGlobalStop(run, code) {
    assert.equal(run.summary.globalStop, code); assert.equal(run.summary.attemptedSessions, 1);
    assert.equal(run.summary.notStarted, 7); assert.equal(run.sends.length, 1);
    assert.equal(run.summary.completedAnswers, 0);
    const audit = read(path.join(run.directory, "blind-integrity-check.json"));
    assert.equal(audit.outputStates.filter(s => s.state === "stopped").length, 1);
    assert.equal(audit.outputStates.filter(s => s.state === "not_started").length, 7);
  }
  await test("fresh manifest uses fixed eight slots and independently generated session identities", () => {
    const one = createManifest(config), two = createManifest(config);
    assert.equal(one.manifest.sessions.length, 8); assert.equal(one.manifest.maxHttpAttempts, 72); assert.equal(one.manifest.budgetNanos, 2e9);
    assert.equal(one.manifest.sessions.some(a => two.manifest.sessions.some(b => a.sessionId === b.sessionId)), false);
    assert.equal(one.manifest.clarificationAnswers, 0); assert.equal(one.manifest.httpRetries, 0); assert.equal(one.manifest.attempt3, 0); assert.equal(one.manifest.additionalSamples, 0);
    validateManifest(config, one.manifest, one.sealedMapping);
    const variants = [
      ["BLIND_MAPPING_CORRUPTION", m => { m.mappingHash = "wrong"; }],
      ["CANDIDATE_VERSION_HASH_MISMATCH", m => { m.catalogs[candidateArm].definitions[0].promptHash = "wrong"; }],
      ["SESSION_ORDER_MISMATCH", m => { m.sessions[0].caseId = "GQ-NEW"; }],
      ["EXPERIMENT_CONTRACT_MISMATCH", m => { m.budgetNanos++; }],
      ["SESSION_IDENTITY_MISMATCH", m => { m.sessions[1].sessionId = m.sessions[0].sessionId; }],
    ];
    for (const [code, mutate] of variants) { const copy = structuredClone(one.manifest); mutate(copy); assert.throws(() => validateManifest(config, copy, one.sealedMapping), new RegExp(code)); }
    const wrong = { ...config, inputs: structuredClone(config.inputs) }; wrong.inputs.cases[0].input.currentSituation += " unauthorized";
    assert.throws(() => createManifest(wrong), /WRONG_CASE_OR_INPUT/);
  });
  let nominal;
  await test("both catalogs execute all fixed fake sessions under one budget without extra stages", async () => {
    nominal = await experiment();
    assert.equal(nominal.summary.globalStop, null); assert.equal(nominal.summary.attemptedSessions, 8);
    assert.equal(nominal.summary.completedAnswers, 5); assert.equal(nominal.summary.clarifications, 3); assert.equal(nominal.summary.stoppedSessions, 0);
    assert.equal(nominal.sends.length, 39); assert.equal(nominal.summary.reassessmentSessions, 0);
    assert.equal(nominal.summary.inputTokens, 3900); assert.equal(nominal.summary.outputTokensIncludingReasoning, 780);
    assert.equal(nominal.summary.unknownUsageCalls, 0);
    for (const c of config.inputs.cases) assert.equal(nominal.records.filter(r => r.caseId === c.id).length, 2);
    const html = fs.readFileSync(path.join(nominal.directory, "blind-review.html"), "utf8");
    assert.equal((html.match(/<form data-case=/gu) ?? []).length, 4);
    assert.equal((html.match(/data-output-state=/gu) ?? []).length, 8);
    assert.equal(/<input[^>]*\bchecked\b/u.test(html), false); assert.equal(/<textarea[^>]*>[^<]+<\/textarea>/u.test(html), false);
    assert.equal(/actualRuntimeVersion|runtime-stage-catalog|current-v17|candidate-v19|\bV(?:17|19)\b/u.test(html), false);
    assert.deepEqual(read(path.join(nominal.directory, "human-review-status.json")), { status: "PENDING", answers: null, mappingDisclosed: false });
    await assert.rejects(() => runFresh({ config, directory: nominal.directory, send: async () => { throw new Error("must not send"); }, inspect: async () => {} }), /ONE_SHOT_RUN_ALREADY_EXISTS/);
  });
  await test("schema-invalid and incomplete output stop only their accounted session with no retry", async () => {
    for (const [changes, code] of [[{ output_text: '{"wrong":"shape"}' }, "M2_STAGE_SCHEMA_INVALID"], [{ status: "incomplete" }, "INCOMPLETE_RESPONSE"], [{ output_text: "{" }, "SCHEMA_INVALID_JSON"], [{ output_text: "" }, "PROVIDER_OUTPUT_MISSING_OR_REFUSAL"]]) {
      const run = await experiment({ change: c => c.callIndex === 0 ? changes : {} }); assertSingleLocalStop(run, code);
      assert.equal(run.records[0].actualHttpCalls, 1); assert.equal(run.records[0].reassessment.length, 0); assert.equal(run.summary.unknownUsageCalls, 0);
    }
  });
  await test("material manual PB05 and Safety STOP preserve later independent sessions", async () => {
    for (const code of ["MATERIAL_MANUAL_INTEGRITY_OR_SAFETY", "SAFETY_BLOCKED"]) {
      const run = await experiment({ inspect: async r => { if (r.session.caseId === "GQ-24" && r.session.arm === candidateArm && r.stageId === "PB-05") throw new PilotStop(code); } });
      assertSingleLocalStop(run, code);
      assert.equal(run.sends.filter(c => primary(c) && c.stage === "PB-06").length, 0);
      assert.equal(run.records.find(r => r.errorCode)?.reassessment.length, 0);
    }
  });
  await test("raw ignored ACTION_CONSISTENCY major or critical halts the session before any repair", async () => {
    for (const severity of ["major", "critical"]) {
      const run = await experiment({ change: c => {
        if (primary(c) && c.stage === "PB-06") c.output.semantic_checks = [fakeFinding("ACTION_CONSISTENCY", severity,
          "decision_plan.change_conditions[0].resulting_direction", ["policy:decision_policy_result", "policy:effective_decision_policy_result"])];
        return {};
      } });
      assertSingleLocalStop(run, "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
      const stopped = run.records.find(r => r.errorCode), check = stopped.findings.find(r => r.stageId === "PB-06" && r.disposition);
      assert.equal(check.disposition.blockingFindings.length, 0); assert.equal(check.disposition.ignoredTemporalFalsePositives.length, 1);
      assert.equal(stopped.reassessment.length, 0); assert.equal(run.sends.filter(c => primary(c)).length, 6);
    }
  });
  await test("true material PB06 finding cannot reach repair or deliver but does not stop the batch", async () => {
    const run = await experiment({ change: c => {
      if (primary(c) && c.stage === "PB-06") c.output.semantic_checks = [fakeFinding("ACTION_CONSISTENCY", "critical", "decision_plan.actions_to_take[0]", ["policy:action_context"])];
      return {};
    } });
    assertSingleLocalStop(run, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING");
    assert.equal(run.records.find(r => r.errorCode)?.reassessment.length, 0); assert.equal(run.sends.filter(c => primary(c)).length, 6);
  });
  await test("one permitted nonmaterial repair followed by material STOP cannot dispatch a third cycle", async () => {
    const run = await experiment({ change: c => {
      if (primary(c) && c.stage === "PB-06") c.output.semantic_checks = [c.occurrence === 1
        ? fakeFinding("TEMPLATE_GENERICITY", "major", "report_content.short_letter[0]", ["F101"])
        : fakeFinding("ACTION_CONSISTENCY", "critical", "decision_plan.actions_to_take[0]", ["policy:action_context"])];
      return {};
    } });
    assertSingleLocalStop(run, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING");
    const stopped = run.records.find(r => r.errorCode); assert.ok(stopped.reassessment.length > 0);
    assert.equal(run.sends.filter(c => primary(c) && c.stage === "PB-06").length, 2);
    assert.ok(run.sends.every(c => c.occurrence <= 2));
  });
  await test("model tier usage HTTP and auth failures globally stop without refunds or retries", async () => {
    const faults = [
      ["MODEL_IDENTITY_MISMATCH", () => ({ model: "wrong-model" }), false],
      ["SERVICE_TIER_MISMATCH", () => ({ service_tier: "flex" }), false],
      ["BUDGET_USAGE_INCONSISTENT", () => ({ usage: { ...usage, total_tokens: 999 } }), true],
      ["HTTP_FAILURE_401", () => { throw Object.assign(new Error("fake auth failure"), { status: 401 }); }, true],
      ["HTTP_FAILURE_500", () => { throw Object.assign(new Error("fake server failure"), { status: 500 }); }, true],
      ["HTTP_TIMEOUT", () => { throw Object.assign(new Error("fake timeout"), { name: "APIConnectionTimeoutError" }); }, true],
    ];
    for (const [code, change, unknown] of faults) {
      const run = await experiment({ change }); assertGlobalStop(run, code);
      assert.equal(run.summary.reservedUsd, reserveNanos(caps[0]) / 1e9); assert.equal(run.summary.unknownUsageCalls, unknown ? 1 : 0);
    }
  });
  await test("request provenance and disk mapping corruption globally stop before another HTTP dispatch", async () => {
    const alteredRequest = await experiment({ change: c => { c.body.input[0].content[0].text += " fake tamper"; return {}; } });
    assertGlobalStop(alteredRequest, "RESPONSE_REQUEST_PROVENANCE_MISMATCH");
    const corruptMapping = await experiment({ change: c => {
      if (c.callIndex === 0) { const file = path.join(c.directory, "internal/mapping-SEALED-until-human-review.json"); const value = read(file); value.disclosureStatus = "FAKE_TAMPER"; fs.writeFileSync(file, JSON.stringify(value)); }
      return {};
    } });
    assertGlobalStop(corruptMapping, "BLIND_MAPPING_CORRUPTION");
  });
  await test("budget exhaustion rejects before dispatch and ledger corruption remains a global failure", () => {
    const directory = path.join(temp, `budget-${++serial}`); fs.mkdirSync(directory);
    const manifest = { sessions: [{ sessionId: "s0" }], caps, maxHttpAttempts: 72, budgetNanos: reserveNanos(caps[0]) - 1 };
    const shared = new ReservationLedger(path.join(directory, "ledger.jsonl"), manifest, { create: true });
    const scoped = new SessionLedger(shared, { sessionId: "s0", definitions: catalog.definitions }); scoped.start("s0");
    assert.throws(() => scoped.reserve("s0", "PB-01", 1, 100, "fake"), /BUDGET_RESERVATION_REJECTED/);
    scoped.stop("BUDGET_RESERVATION_REJECTED"); assert.equal(shared.stopReason, "BUDGET_RESERVATION_REJECTED");
    assert.equal(shared.calls.length, 0); assert.equal(shared.reservedNanos, 0);
    const state = ledgerState(); fs.appendFileSync(path.join(state.dir, "ledger.jsonl"), '{"fake":"corrupt"}\n');
    assert.throws(() => new ReservationLedger(path.join(state.dir, "ledger.jsonl"), state.manifest), /BUDGET_LEDGER_CORRUPT/);
  });
  await test("maximum reservations are bounded at 72 and USD 1.5330112 with no attempt three", () => {
    const directory = path.join(temp, `caps-${++serial}`); fs.mkdirSync(directory);
    const manifest = { sessions: Array.from({ length: 8 }, (_,i) => ({ sessionId: `s${i}` })), caps, maxHttpAttempts: 72, budgetNanos: 2e9 };
    const shared = new ReservationLedger(path.join(directory, "ledger.jsonl"), manifest, { create: true });
    for (const { sessionId } of manifest.sessions) {
      const local = new SessionLedger(shared, { sessionId, definitions: catalog.definitions }); local.start(sessionId);
      for (const cap of caps) for (let attempt = 1; attempt <= cap.invocationsPerSession; attempt++) {
        const reserved = local.reserve(sessionId, cap.stage, attempt, 100, "fake-max-reservation-only"); local.dispatch(reserved);
        local.settle(reserved, { status: "received", accounting: accountUsage(usage, cap) });
      }
      if (sessionId === "s7") assert.throws(() => local.reserve(sessionId, "PB-06", 3, 100, "forbidden"), /UNAUTHORIZED_STAGE_ATTEMPT/);
      local.finish(sessionId, "completed");
    }
    assert.equal(shared.calls.length, 72); assert.equal(shared.reservedNanos, 1533011200);
    assert.equal(shared.stopReason, "UNAUTHORIZED_STAGE_ATTEMPT");
  });
  await test("protected historical bytes and verification source hashes are unchanged after fake runs", async () => {
    const after = await loadFreshConfiguration({ requireVerification: false });
    assert.equal(after.runtimeProof.historicalFileBytesVerified, config.runtimeProof.historicalFileBytesVerified);
    assert.equal(after.runtimeProof.implementationChanges, 0);
    for (const [file, expected] of Object.entries(config.evaluationSourceHashes)) assert.equal(byteHash(file), expected, `protected source byte check: ${file}`);
    assert.equal(forbiddenNetworkCalls, 0);
  });
  assert.equal(forbiddenNetworkCalls, 0);
  const sourceHashes = Object.fromEntries(Object.keys(config.evaluationSourceHashes).filter(file => !file.endsWith("/verification.json")).map(file => [file, byteHash(file)]));
  fs.writeFileSync("evals/guidance-quality-v19-l3/fresh-pilot/verification.json", JSON.stringify({
    schemaVersion: "guidance-fresh-fake-verification-v1", pass: true, realApiCalls: 0, forbiddenNetworkCalls,
    baselineHead: config.executionHead, sourceHashes, checks: results,
    fixtureProvenance: "FAKE ONLY. Saved historical synthetic outputs and a hand-authored acknowledgement fixture were fake transport replies only. They are not new real output, live generation input, or Human quality evidence.",
    limitations: ["Fake verification proves stop routing, identity, ledger, projection and rendering mechanics only.", "No model judgment, semantic quality or Human preference is inferred from these fixtures.", "The production runtime and F007 classifier are unchanged; existing raw findings remain preserved."],
    fakeRunSummary: { nominalSessions: nominal.summary.attemptedSessions, nominalHttpDispatches: nominal.sends.length,
      maximumLedgerOnlyReservations: 72, maximumReservationUsd: 1.5330112, hardCapUsd: 2, realApiCalls: 0,
      historicalFilesUnchanged: config.runtimeProof.historicalFileBytesVerified, mappingDisclosed: false },
  }, null, 2) + "\n");
  console.log(JSON.stringify({ checks: results.length, passed: results.length, realApiCalls: 0, forbiddenNetworkCalls }));
} finally { globalThis.fetch = priorFetch; }
