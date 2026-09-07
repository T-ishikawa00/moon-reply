// Integrated offline tests only. Saved synthetic receipts are fake transport
// fixtures, not new model output. Every new PB06 repair verdict is authored.
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const priorFetch = globalThis.fetch;
let networkAttempts = 0;
globalThis.fetch = async () => { networkAttempts++; throw new Error("L4_OFFLINE_NETWORK_FORBIDDEN"); };
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const bytesHash = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const runRoot = "evals/blind-runs/2026-09-08-fresh-01";
const targetRoot = "evals/guidance-quality-v19-l4";
const results = [];
let scenarioCount = 0;
const test = async (name, action) => { await action(); results.push({ name, status: "PASS" }); console.log(`PASS ${results.length} ${name}`); };
function fileHashes(directory) {
  return Object.fromEntries(fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const file = path.join(directory, item.name);
    return item.isDirectory() ? Object.entries(fileHashes(file)) : [[file, bytesHash(file)]];
  }));
}
const protectedHashes = fileHashes(runRoot);
const provenance = "FAKE CONTRACT/ROUTING ONLY. Frozen real synthetic receipts replayed unchanged except declared candidate schema wrappers; injected PB06 findings, patch proposals and six-check verdicts are authored fixtures. No semantic detection, model repair quality or Human acceptance is proved.";

try {
  const [l4Module, l3Module, apps, fakes, pipelines, projections, experiences, hashModule, repairModule, errors] = await Promise.all([
    import("../../lib/assessment/runtime/v19-l4-stage-catalog.ts"), import("../../lib/assessment/runtime/v19-l3-stage-catalog.ts"),
    import("../../lib/assessment/runtime/application.ts"), import("../../lib/assessment/runtime/fakes.ts"),
    import("../../lib/assessment/runtime/pipeline.ts"), import("../../lib/assessment/runtime/customer-assessment-projection-v1.ts"),
    import("../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts"), import("../../lib/assessment/runtime/hash.ts"),
    import("../../lib/assessment/runtime/report-fact-repair-v1.ts"), import("../../lib/assessment/runtime/errors.ts"),
  ]);
  const candidate = await l4Module.loadV19L4StageCatalog(), predecessor = await l3Module.loadV19L3StageCatalog();
  const { hashJson } = hashModule;
  const inputs = read("evals/guidance-quality-wave1/pilot-inputs.json").cases;
  const sessions = {
    "GQ-05": "661dd6cc-9481-4410-8904-45461b76659e",
    "GQ-24": "25e05ceb-e9d6-400f-86f0-ed5267b32a2a",
    "GQ-13": "9d80ceed-387c-4cea-94c1-9fabe663288d",
    "GQ-29-P3": "f904555b-eaf7-46d0-9382-aa1b3146c6e3",
  };
  const fixtures = Object.fromEntries(Object.entries(sessions).map(([caseId, id]) => {
    const directory = path.join(runRoot, "internal", id), session = read(path.join(directory, "session.json"));
    const receipts = fs.readdirSync(directory).filter(name => /^call-\d+-response\.json$/u.test(name)).map(name => read(path.join(directory, name)));
    const outputSequence = {};
    for (const receipt of receipts) {
      assert.equal(receipt.status, "completed"); assert.equal(receipt.returnedModel, "gpt-5.6-luna");
      outputSequence[receipt.stageId] ??= [];
      assert.equal(outputSequence[receipt.stageId].length + 1, receipt.attempt, "retain every saved attempt in order");
      outputSequence[receipt.stageId].push(JSON.parse(receipt.outputText));
    }
    assert.equal(session.caseId, caseId); assert.equal(session.actualRuntimeVersion, predecessor.catalogVersion);
    return [caseId, { caseId, directory, session, request: structuredClone(inputs.find(c => c.id === caseId).input), outputSequence }];
  }));
  const target = fixtures["GQ-29-P3"], targetPath = "report_content.short_letter[1]";
  const sourceReport = target.outputSequence["PB-05"][0];
  const sourcePlan = target.outputSequence["PB-04"][0];
  const evidenceIds = target.outputSequence["PB-01"][0].observed_facts.slice(0, 2).map(f => f.fact_id);
  const blankVerdict = { schema_version: "pipeline-schema-v1.0.0", validation_mode: "semantic_findings_only", deterministic_checks: [],
    semantic_checks: [], final_disposition: null, repair_strategy: null, failed_codes: [] };
  const finding = (code = "FACT_FIDELITY", severity = "major", jsonPath = targetPath, refs = evidenceIds) => ({ finding_code: code, severity,
    json_path: jsonPath, evidence_refs: [...refs], detail: "AUTHORED FAKE ONLY: source states sent/no reply; the affected Report claim adds delivery. This fixture tests routing, not Japanese detection." });
  const defaultReplacement = original => original.replace("質問は一度届いており", "質問は一度送っていて");
  const count = (run, stage) => run.transport.calls.filter(s => s === stage).length;
  const requests = (run, stage) => run.transport.requests.filter(q => q.stageId === stage);

  async function runFixture(fixture = target, { catalog = candidate, firstFindings, change = () => {}, frozenTime = "2026-09-07T10:00:00.000Z" } = {}) {
    scenarioCount++;
    const sequence = structuredClone(fixture.outputSequence);
    if (fixture.caseId === "GQ-29-P3") sequence["PB-06"] = [{ ...blankVerdict, semantic_checks: firstFindings ?? [finding()] }];
    if (catalog.catalogVersion === candidate.catalogVersion) for (const item of sequence["PB-06"] ?? []) {
      item.schema_version = "validation-result-v19-l4-v1"; item.report_fact_repair_verification = null;
    }
    const repository = new fakes.FakeAssessmentRepository();
    const fake = new fakes.FakeAiStageTransport({ outputs: Object.fromEntries(Object.entries(sequence).map(([stage, values]) => [stage, values[0]])), outputSequence: sequence });
    const returnedOutputs = [];
    const transport = {
      get actualProviderCalls() { return fake.actualProviderCalls; }, get calls() { return fake.calls; }, get requests() { return fake.requests; },
      async invoke(request) {
        const response = await fake.invoke(request);
        const occurrence = count({ transport: fake }, request.stageId);
        assert.ok(occurrence <= (["PB-04", "PB-05", "PB-06"].includes(request.stageId) ? 2 : 1), "no fake fallback can conceal an unauthorized attempt");
        const binding = request.input.report_fact_repair_context;
        const patchMode = request.stageId === "PB-05" && request.schemaVersion === "report-fact-repair-v1";
        const postRepair = request.stageId === "PB-06" && binding !== null && binding !== undefined;
        if (patchMode) {
          assert.equal(occurrence, 2); assert.equal(request.promptVersion, "v1.0.0"); assert.equal(request.schemaName, "pb_05_report_fact_repair_v1");
          response.output = { schema_version: "report-fact-repair-v1", source_report_hash: binding.source_report_hash,
            target_path: binding.target_path, original_text: binding.original_text, replacement_text: defaultReplacement(binding.original_text) };
        }
        if (postRepair) response.output = {
          ...blankVerdict, schema_version: "validation-result-v19-l4-v1", report_fact_repair_verification: {
            report_hash: binding.report_hash, target_path: binding.target_path, verified_text: binding.verified_text,
            evidence_fact_ids: structuredClone(binding.evidence_fact_ids), checks: Object.fromEntries(repairModule.REPORT_FACT_REPAIR_CHECKS_V1.map(key => [key, "pass"])),
          },
        };
        await change({ request, stage: request.stageId, occurrence, patchMode, postRepair, binding, output: response.output, repository });
        returnedOutputs.push({ stage: request.stageId, occurrence, output: structuredClone(response.output) });
        return response;
      },
    };
    let index = 0, result = null, error = null;
    try {
      const application = new apps.AssessmentApplication({ repository, transport, model: "gpt-5.6-luna", definitions: catalog.definitions,
        promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion, timeZone: "Asia/Tokyo",
        now: () => frozenTime, uuid: () => `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}` });
      result = await application.submit(structuredClone(fixture.request), `l4-offline-${scenarioCount}`);
    } catch (caught) { error = caught; }
    assert.equal(transport.actualProviderCalls, 0); assert.equal(repository.actualSupabaseCalls, 0);
    assert.ok([...repository.stageRuns.values()].every(s => [1, 2].includes(s.attemptNumber ?? 1)));
    return { result, error, repository, transport, returnedOutputs, catalog };
  }
  function failed(run, code) {
    assert.equal(run.error?.safeCode, code, `expected ${code}, observed ${run.error?.safeCode ?? run.error?.name ?? run.result?.eligibility}`);
    assert.equal(run.result, null); assert.equal(run.repository.reports.size, 0);
    assert.ok([...run.repository.runs.values()].every(r => r.status !== "completed"));
  }
  await test("new catalog isolates full Report patch and PB06 versions without replacing old stages", () => {
    assert.equal(candidate.catalogVersion, "runtime-stage-catalog-v22.0.0"); assert.equal(candidate.schemaSetVersion, "pipeline-schema-runtime-v8.0.0");
    assert.equal(candidate.definitions.length, 7);
    for (const old of predecessor.definitions) {
      const next = candidate.definitions.find(d => d.stageId === old.stageId);
      if (!["PB-05", "PB-06"].includes(old.stageId)) assert.deepEqual(next, old);
    }
    const d = candidate.definitions.find(s => s.stageId === "PB-05");
    assert.equal(d.promptVersion, "v12.0.0"); assert.equal(d.schemaVersion, "pipeline-schema-v2.0.0");
    assert.equal(d.reportFactRepair.promptVersion, "v1.0.0"); assert.notEqual(d.reportFactRepair.promptHash, d.promptHash);
    assert.equal(candidate.definitions.find(s => s.stageId === "PB-06").schemaVersion, "validation-result-v19-l4-v1");
  });
  for (const caseId of ["GQ-05", "GQ-24", "GQ-13"]) await test(`${caseId} saved clarification or complete note including both prior repair attempts remains unchanged`, async () => {
    const fixture = fixtures[caseId], old = await runFixture(fixture, { catalog: predecessor }), next = await runFixture(fixture);
    assert.equal(old.error, null); assert.equal(next.error, null);
    assert.deepEqual(next.transport.calls, old.transport.calls);
    assert.equal(next.result.eligibility, fixture.session.finalOutput.eligibility);
    if (next.result.eligibility === "needs_more_information") {
      assert.equal(next.result.clarification.question, fixture.session.finalOutput.clarification.question);
      assert.equal(count(next, "PB-05"), 0);
    } else {
      assert.deepEqual(next.result.report, fixture.session.finalOutput.report); assert.deepEqual(next.result.decisionCard, fixture.session.finalOutput.decisionCard);
      assert.deepEqual(projections.projectCustomerAssessmentV1(next.result, fixture.request.requestedTopics), projections.projectCustomerAssessmentV1(old.result, fixture.request.requestedTopics));
      assert.deepEqual(experiences.projectCustomerAssessmentExperienceV2(next.result, fixture.request.requestedTopics), experiences.projectCustomerAssessmentExperienceV2(old.result, fixture.request.requestedTopics));
      assert.ok(requests(next, "PB-06").every(q => q.input.report_fact_repair_context === null));
      assert.ok(requests(next, "PB-05").every(q => q.schemaVersion === "pipeline-schema-v2.0.0"));
      if (caseId === "GQ-13") { assert.equal(count(next, "PB-05"), 2); assert.equal(count(next, "PB-06"), 2); assert.equal(requests(next, "PB-05")[1].input.quality_reassessment_directive.scope, "report_only"); }
    }
  });
  let success;
  await test("one bound fact patch preserves the full Plan and every other raw and grounded Report value", async () => {
    success = await runFixture(); assert.equal(success.error, null); assert.equal(success.result.eligibility, "ready");
    assert.equal(count(success, "PB-04"), 1); assert.equal(count(success, "PB-05"), 2); assert.equal(count(success, "PB-06"), 2);
    const q5 = requests(success, "PB-05"), q6 = requests(success, "PB-06");
    const binding = q5[1].input.report_fact_repair_context;
    assert.equal(q5[0].input.report_fact_repair_context, undefined); assert.equal(q5[1].input.quality_reassessment_directive, null);
    assert.deepEqual(binding.source_report, sourceReport); assert.equal(binding.source_report_hash, hashJson(sourceReport));
    assert.equal(binding.target_path, targetPath); assert.equal(binding.original_text, sourceReport.short_letter[1]);
    assert.deepEqual(binding.selected_finding, finding(), "patch input binds the exact selected finding, not just its code or path");
    assert.deepEqual(q5[0].input.decision_plan, q5[1].input.decision_plan); assert.deepEqual(q5[0].input.base_structured_intake, q5[1].input.base_structured_intake);
    assert.deepEqual(success.result.report.decisionPlan, sourcePlan);
    const expectedRaw = structuredClone(sourceReport); expectedRaw.short_letter[1] = defaultReplacement(expectedRaw.short_letter[1]);
    const expectedGrounded = structuredClone(q6[0].input.report_content); expectedGrounded.short_letter[1] = expectedRaw.short_letter[1];
    assert.deepEqual(q6[1].input.report_content, expectedGrounded); assert.deepEqual(success.result.report.content, expectedGrounded);
    assert.equal(q6[1].input.report_fact_repair_context.report_hash, hashJson(expectedGrounded));
    const patchReceipt = success.returnedOutputs.find(o => o.stage === "PB-05" && o.occurrence === 2).output;
    assert.deepEqual(Object.keys(patchReceipt), ["schema_version", "source_report_hash", "target_path", "original_text", "replacement_text"]);
    assert.equal(patchReceipt.replacement_text, expectedRaw.short_letter[1]);
    assert.equal(success.result.report.content.short_letter[0], sourceReport.short_letter[0]);
    for (const key of ["closing_lines", "decision_reason_summary", "action_rationales", "aftercare_commentary"]) assert.deepEqual(success.result.report.content[key], sourceReport[key]);
    assert.deepEqual(success.result.decisionCard.actionsToTake, sourcePlan.actions_to_take); assert.equal(success.result.decisionCard.reason, sourceReport.decision_reason_summary);
    assert.equal(success.result.report.decisionPlan.recommended_message_draft, null);
    const projection = projections.projectCustomerAssessmentV1(success.result, target.request.requestedTopics);
    assert.ok(projection); assert.equal(target.request.requestedTopics.includes("next_three_days"), true);
    assert.equal(target.session.finalOutput, null); assert.equal(target.session.errorCode, "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY");
    assert.equal(target.outputSequence["PB-06"], undefined, "PB06 is authored only, never relabeled as a saved real receipt");
  });
  await test("unchanged text and wrong source hash target or original cannot merge", async () => {
    for (const mutate of [p => { p.replacement_text = p.original_text; }, p => { p.source_report_hash = "0".repeat(64); },
      p => { p.target_path = "report_content.short_letter[0]"; }, p => { p.original_text += " altered"; }, p => { p.replacement_text = "長".repeat(701); }]) {
      const run = await runFixture(target, { change: c => { if (c.patchMode) mutate(c.output); } });
      failed(run, "M2_REPORT_FACT_REPAIR_INVALID"); assert.equal(count(run, "PB-06"), 1); assert.equal(count(run, "PB-04"), 1);
    }
  });
  await test("invalid patch schema and full Report regeneration cannot pass the patch contract", async () => {
    for (const mutate of [p => { p.extra = "unauthorized"; }, p => { p.replacement_text = null; }, p => { Object.assign(p, sourceReport); }]) {
      const run = await runFixture(target, { change: c => { if (c.patchMode) mutate(c.output); } });
      failed(run, "M2_STAGE_SCHEMA_INVALID"); assert.equal(count(run, "PB-06"), 1);
    }
  });
  await test("a contradiction added within the allowed leaf fails independent post-repair action validation", async () => {
    const run = await runFixture(target, { change: c => {
      if (c.patchMode) c.output.replacement_text += "今は同じ一通を送ってください。同じ今、その一通を送らないでください。";
      if (c.postRepair) c.output.report_fact_repair_verification.checks.action_consistency = "fail";
    } });
    failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"); assert.equal(count(run, "PB-04"), 1); assert.equal(count(run, "PB-06"), 2);
  });
  await test("remaining material fact finding rejects despite six fake pass labels", async () => {
    const run = await runFixture(target, { change: c => { if (c.postRepair) c.output.semantic_checks = [finding()]; } });
    failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"); assert.equal(count(run, "PB-05"), 2);
  });
  await test("each failed verification dimension independently prevents final delivery", async () => {
    for (const key of repairModule.REPORT_FACT_REPAIR_CHECKS_V1) {
      const run = await runFixture(target, { change: c => { if (c.postRepair) c.output.report_fact_repair_verification.checks[key] = "fail"; } });
      failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
    }
  });
  await test("missing null unknown or mismatched post-repair verification cannot imply success", async () => {
    const mutations = [
      ["M2_STAGE_SCHEMA_INVALID", o => { delete o.report_fact_repair_verification; }],
      ["M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED", o => { o.report_fact_repair_verification = null; }],
      ["M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED", o => { o.report_fact_repair_verification.checks.fact_source_integrity = "unknown"; }],
      ["M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED", o => { o.report_fact_repair_verification.report_hash = "0".repeat(64); }],
      ["M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED", o => { o.report_fact_repair_verification.verified_text += " different"; }],
      ["M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED", o => { o.report_fact_repair_verification.evidence_fact_ids = ["F999"]; }],
    ];
    for (const [code, mutate] of mutations) { const run = await runFixture(target, { change: c => { if (c.postRepair) mutate(c.output); } }); failed(run, code); }
  });
  await test("technical failure at either repair stage stays failed with no retry or third attempt", async () => {
    for (const targetStage of ["PB-05", "PB-06"]) {
      const run = await runFixture(target, { change: c => { if (c.stage === targetStage && c.occurrence === 2) throw new errors.M2RuntimeError("M2_FAKE_STAGE_FAILURE"); } });
      failed(run, "M2_FAKE_STAGE_FAILURE"); assert.equal(count(run, "PB-05"), 2); assert.equal(count(run, "PB-06"), targetStage === "PB-05" ? 1 : 2);
    }
  });
  await test("material Safety action and Plan findings exclude a localized fact repair", async () => {
    for (const extra of [finding("SAFETY_REGRESSION", "major", "report_content.short_letter[0]", ["policy:action_context"]),
      finding("ACTION_CONSISTENCY", "major", "decision_plan.actions_to_take[0]", ["policy:action_context"]),
      finding("DECISION_ALLOWED", "critical", "decision_plan.selected_decision", ["policy:decision_policy_result"])]) {
      const run = await runFixture(target, { firstFindings: [finding(), extra] }); failed(run, "M2_REPORT_FACT_REPAIR_INELIGIBLE");
      assert.equal(count(run, "PB-05"), 1); assert.equal(count(run, "PB-06"), 1);
    }
  });
  await test("unsafe aggregate never reaches report patch or final ready", async () => {
    const run = await runFixture(target, { change: c => {
      if (c.stage === "PB-02") Object.assign(c.output, {
        classification: "rejected", reason_codes: ["stalking_or_visit"], response_mode: "unsafe_contact_stop", evidence_refs: ["input:current_situation"], ambiguity_present: false,
      });
      if (c.stage === "PB-03") c.output.acknowledged_eligibility = c.request.input.application_eligibility_expectation;
    } });
    assert.equal(run.error, null); assert.equal(run.result.eligibility, "safety_blocked"); assert.equal(count(run, "PB-05"), 0); assert.equal(count(run, "PB-06"), 0);
  });
  await test("explicit delivery and read facts remain permitted with no word-based repair trigger", async () => {
    const controls = [
      { fact: "アプリに配達済みと表示されています。", clause: "アプリに配達済みと表示されていて", commentary: "配達済みの表示は確認できています。既読や内容の理解まで確定するものではありません。" },
      { fact: "送信済みのメッセージに既読表示が付いています。", clause: "既読表示は付いていて", commentary: "既読表示は付いていますが、返事がない理由や内容の理解までは分かりません。" },
    ];
    for (const control of controls) {
      const fixture = structuredClone(target);
      fixture.request.currentSituation += ` ${control.fact}`;
      fixture.outputSequence["PB-01"][0].observed_facts.push({ fact_id: "F505", statement: control.fact, source_refs: ["input:current_situation"], support: "explicit" });
      fixture.outputSequence["PB-05"][0].short_letter[1] = sourceReport.short_letter[1].replace("すでに質問は一度届いており", control.clause);
      fixture.outputSequence["PB-05"][0].observed_fact_commentary.push({ fact_id: "F505", commentary: control.commentary });
      const run = await runFixture(fixture, { firstFindings: [] });
      assert.equal(run.error, null); assert.equal(run.result.eligibility, "ready");
      assert.equal(count(run, "PB-05"), 1); assert.equal(count(run, "PB-06"), 1);
      assert.equal(run.result.report.content.observed_fact_commentary.at(-1).commentary, control.commentary);
      assert.equal(run.result.report.content.short_letter[1], fixture.outputSequence["PB-05"][0].short_letter[1]);
      assert.equal(requests(run, "PB-06")[0].input.report_fact_repair_context, null);
    }
  });
  const observationControls = [
    {
      name: "no-reply observation cannot become an actor-level assertion",
      badClaim: "ただ、相手は返信していません。", correctedClaim: "ただ、まだ返信はありません。", refs: ["F205"],
      detail: "AUTHORED FAKE ONLY: the source records that no reply has arrived, not an independently established action by the recipient. The single Report leaf strengthens an observation into an actor-level assertion.",
    },
    {
      name: "explicit read plus silence cannot establish deliberate ignoring",
      fact: "送信済みのメッセージには既読表示が付いています。",
      badClaim: "ただ、相手は読んだうえで意図的に無視しています。", correctedClaim: "ただ、既読表示は付いていますが、まだ返信はありません。", refs: ["F205", "F505"],
      detail: "AUTHORED FAKE ONLY: a read indicator and no reply do not establish deliberate ignoring. The selected Report leaf adds an unsupported intention while explicit read status remains usable.",
    },
  ];
  for (const control of observationControls) await test(`authored ${control.name}: one-leaf correction can pass; remaining claim cannot deliver`, async () => {
    // Both semantic findings and PB06 verdicts below are authored fixtures.
    // This checks routing/binding only; it is not Japanese prose detection.
    const fixture = structuredClone(target);
    if (control.fact) {
      fixture.request.currentSituation += ` ${control.fact}`;
      fixture.outputSequence["PB-01"][0].observed_facts.push({ fact_id: "F505", statement: control.fact, source_refs: ["input:current_situation"], support: "explicit" });
    }
    assert.ok(fixture.outputSequence["PB-01"][0].observed_facts.some(f => f.fact_id === "F205"));
    const rest = "短時間に重ねて確認する必要性も確定していません。今夜は追加送信をせず、自分の時間に戻る判断で大丈夫です。";
    const original = `${control.badClaim}${rest}`, replacement = `${control.correctedClaim}${rest}`;
    fixture.outputSequence["PB-05"][0].short_letter[1] = original;
    // The original stopped delivery claim is fully replaced in memory so no
    // second unsupported delivery assertion is silently left in a positive.
    assert.equal(JSON.stringify(fixture.outputSequence["PB-05"][0]).includes("質問は一度届いており"), false);
    const selectedFinding = { ...finding("ASSUMPTION_AS_FACT", "major", targetPath, control.refs), detail: control.detail };
    const repaired = await runFixture(fixture, { firstFindings: [selectedFinding], change: c => {
      if (c.patchMode) c.output.replacement_text = replacement;
    } });
    assert.equal(repaired.error, null); assert.equal(repaired.result.eligibility, "ready");
    assert.equal(count(repaired, "PB-04"), 1); assert.equal(count(repaired, "PB-05"), 2); assert.equal(count(repaired, "PB-06"), 2);
    const patchRequest = requests(repaired, "PB-05")[1];
    assert.deepEqual(patchRequest.input.report_fact_repair_context.selected_finding, selectedFinding);
    assert.equal(patchRequest.input.report_fact_repair_context.original_text, original);
    assert.deepEqual(patchRequest.input.report_fact_repair_context.source_report, fixture.outputSequence["PB-05"][0]);
    const expected = structuredClone(requests(repaired, "PB-06")[0].input.report_content); expected.short_letter[1] = replacement;
    assert.deepEqual(repaired.result.report.content, expected); assert.deepEqual(repaired.result.report.decisionPlan, sourcePlan);
    assert.equal(repaired.result.report.content.short_letter[1].includes(control.badClaim), false);
    if (control.fact) assert.ok(repaired.result.report.content.short_letter[1].includes("既読表示は付いています"));
    const rejected = await runFixture(fixture, { firstFindings: [selectedFinding], change: c => {
      if (c.patchMode) c.output.replacement_text = original.replace("今夜は追加送信をせず", "今夜は追加の送信をせず");
      if (c.postRepair) c.output.report_fact_repair_verification.checks.fact_source_integrity = "fail";
    } });
    failed(rejected, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
    assert.equal(count(rejected, "PB-04"), 1); assert.equal(count(rejected, "PB-05"), 2); assert.equal(count(rejected, "PB-06"), 2);
    assert.ok(requests(rejected, "PB-06")[1].input.report_content.short_letter[1].includes(control.badClaim));
  });
  await test("one Fact-ID commentary leaf is repairable while its identifier and every other leaf remain fixed", async () => {
    // Controlled counterexample, not a modification of the real stopped report:
    // remove the original introduction defect, place one authored defect in the
    // existing Fact-ID commentary, and inject a matching evaluator finding.
    const fixture = structuredClone(target);
    fixture.outputSequence["PB-05"][0].short_letter[1] = defaultReplacement(sourceReport.short_letter[1]);
    fixture.outputSequence["PB-05"][0].observed_fact_commentary[0].commentary = "質問は一度届いており、現時点で伝えるべき内容を何も送れていない状態ではありません。";
    const commentaryPath = "report_content.observed_fact_commentary[0].commentary";
    const id = fixture.outputSequence["PB-05"][0].observed_fact_commentary[0].fact_id;
    const run = await runFixture(fixture, { firstFindings: [finding("FACT_FIDELITY", "major", commentaryPath, [id])] });
    assert.equal(run.error, null); assert.equal(run.result.eligibility, "ready");
    assert.equal(count(run, "PB-04"), 1); assert.equal(count(run, "PB-05"), 2); assert.equal(count(run, "PB-06"), 2);
    const expected = structuredClone(requests(run, "PB-06")[0].input.report_content);
    expected.observed_fact_commentary[0].commentary = defaultReplacement(expected.observed_fact_commentary[0].commentary);
    assert.deepEqual(run.result.report.content, expected); assert.equal(run.result.report.content.observed_fact_commentary[0].fact_id, id);
    assert.deepEqual(run.result.report.decisionPlan, sourcePlan);
  });
  await test("material fact outside owned leaf or lacking known Base evidence does not fall back to whole-Report repair", async () => {
    for (const fact of [finding("FACT_FIDELITY", "major", "report_content.decision_reason_summary"), finding("FACT_FIDELITY", "major", targetPath, ["F999"]),
      finding("FACT_FIDELITY", "major", targetPath, ["policy:action_context"])]) {
      const run = await runFixture(target, { firstFindings: [fact] }); failed(run, "M2_REPORT_FACT_REPAIR_INELIGIBLE"); assert.equal(count(run, "PB-05"), 1);
    }
  });
  await test("old candidate residual-major Report behavior is a preserved F007 counterexample, not quality PASS", async () => {
    const run = await runFixture(target, { catalog: predecessor }); assert.equal(run.error, null); assert.equal(run.result.eligibility, "ready");
    assert.equal(run.result.report.content.short_letter[1], sourceReport.short_letter[1]); assert.equal(count(run, "PB-05"), 2); assert.equal(count(run, "PB-06"), 2);
    assert.ok(requests(run, "PB-05").every(q => q.schemaVersion === "pipeline-schema-v2.0.0"));
  });
  await test("mixed prompt schema and bundle identities reject before transport", async () => {
    const variants = [
      { ...candidate, definitions: candidate.definitions.map(d => d.stageId === "PB-05" ? predecessor.definitions.find(s => s.stageId === "PB-05") : d) },
      { ...candidate, definitions: candidate.definitions.map(d => d.stageId === "PB-06" ? predecessor.definitions.find(s => s.stageId === "PB-06") : d) },
      { ...candidate, promptBundleVersion: predecessor.promptBundleVersion }, { ...candidate, schemaSetVersion: predecessor.schemaSetVersion },
    ];
    for (const catalog of variants) { const run = await runFixture(target, { catalog }); failed(run, "M2_STAGE_TOPOLOGY_INVALID"); assert.equal(run.transport.calls.length, 0); }
  });
  await test("candidate purchase preparation remains unavailable before any stage", async () => {
    const repository = new fakes.FakeAssessmentRepository(), transport = new fakes.FakeAiStageTransport({ outputs: {} });
    const pipeline = new pipelines.AssessmentPipeline({ repository, transport, definitions: candidate.definitions, timeZone: "Asia/Tokyo" });
    await assert.rejects(() => pipeline.prepare(target.request, { requestId: "00000000-0000-4000-8000-000000000001", runId: "00000000-0000-4000-8000-000000000002",
      model: "gpt-5.6-luna", promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion, startedAt: "2026-09-07T10:00:00.000Z" }), error => error.safeCode === "M2_PRODUCTION_PREPARATION_IDENTITY_INVALID");
    assert.equal(transport.calls.length, 0); assert.equal(repository.runs.size, 0);
  });
  await test("saved evidence Human evaluation and STOP bytes remain immutable; network and real Provider calls stay zero", () => {
    assert.deepEqual(fileHashes(runRoot), protectedHashes); assert.equal(networkAttempts, 0);
  });
  const known = results.filter(r => r.name.startsWith("old candidate residual-major"));
  fs.writeFileSync(path.join(targetRoot, "verification-runtime-results.json"), JSON.stringify({
    schemaVersion: "guidance-v19-l4-runtime-verification-v1", pass: true, checks: results.length, scenarios: scenarioCount,
    realApiCalls: 0, actualProviderCalls: 0, actualDatabaseCalls: 0, networkAttempts,
    candidate: { catalog: candidate.catalogVersion, promptBundle: candidate.promptBundleVersion, schemaSet: candidate.schemaSetVersion },
    preservedHistoricalFiles: Object.keys(protectedHashes).length, preservationPass: true, originalStopReleased: false,
    provenance, semanticDetectionValidated: false, modelRepairQualityValidated: false, humanAcceptanceChanged: false,
    results, knownLimitations: known.map(r => ({ name: r.name, result: "KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS", F007Resolved: false })),
  }, null, 2) + "\n");
  console.log(JSON.stringify({ checks: results.length, passed: results.length, scenarios: scenarioCount, realApiCalls: 0, networkAttempts,
    knownLimitationDiagnostics: known.length, newModelRepairQuality: "NOT_TESTED" }));
} finally { globalThis.fetch = priorFetch; }
