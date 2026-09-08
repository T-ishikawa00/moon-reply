// LOCAL ONLY. This verifier has no provider, credentials or database adapter.
// All new responses and semantic verdicts below are authored contract fixtures.
import assert from "node:assert/strict";
import { REPAIR_CHECKS, REPAIR_FIXTURE_PROVENANCE, createRepairFixture, createMessageOnlyConstraintFixture, repairFinding,
  repairPatch, validationPass, assertSeedUnchanged } from "./repair-fixtures.mjs";

const previousFetch = globalThis.fetch;
let networkAttempts = 0;
globalThis.fetch = async () => { networkAttempts++; throw new Error("V19_L5_REPAIR_TEST_NETWORK_FORBIDDEN"); };
const results = [];
let scenarios = 0;
const test = async (name, action) => { await action(); results.push({ name, status: "PASS" }); console.log(`PASS ${results.length} ${name}`); };

try {
  const [{ V19L5LocalApplication }, { loadV19L5StageCatalog }, { hashJson }, { M2RuntimeError }] = await Promise.all([
    import("../../lib/assessment/runtime/v19-l5-application.ts"),
    import("../../lib/assessment/runtime/v19-l5-stage-catalog.ts"),
    import("../../lib/assessment/runtime/hash.ts"), import("../../lib/assessment/runtime/errors.ts"),
  ]);
  const catalog = await loadV19L5StageCatalog();
  const protectedSeed = createRepairFixture();
  const stageCalls = (run, stage) => run.requests.filter(q => q.stageId === stage);
  const code = error => error?.safeCode ?? error?.message;

  async function runFixture({ fixture = createRepairFixture(), firstFindings, mutate = () => {}, changedCatalog = catalog } = {}) {
    scenarios++;
    const requests = [], returned = [];
    const originalInput = structuredClone(fixture.request);
    const transport = {
      async invoke(request) {
        requests.push(structuredClone(request));
        const occurrence = requests.filter(q => q.stageId === request.stageId).length;
        assert.ok(occurrence <= (["PB-05", "PB-06"].includes(request.stageId) ? 2 : 1), "no third attempt or repeated Plan/upstream stage");
        const binding = request.input.report_fact_repair_context;
        const patchMode = request.stageId === "PB-05" && request.schemaVersion === "report-fact-repair-v1";
        const postRepair = request.stageId === "PB-06" && binding !== null && binding !== undefined;
        let output;
        if (request.stageId === "PB-01") output = {
          schema_version: "v19-l5-base-intent-v1", base_intake: structuredClone(fixture.base),
          request_intent: fixture.requestIntent ?? { message_task: fixture.candidateAnalysis ? "EDIT_EXISTING_MESSAGE" : "NONE",
            decision_requested: true, decision_explicitly_excluded: false, communication_purpose: "OTHER",
            evidence_fact_ids: ["F305"], source_excerpt: fixture.request.currentSituation },
        };
        else if (request.stageId === "PB-01C") output = structuredClone(fixture.candidateAnalysis);
        else if (request.stageId === "PB-02") output = structuredClone(fixture.outputSequence["PB-02"][0]);
        else if (request.stageId === "PB-03") {
          output = structuredClone(fixture.outputSequence["PB-03"][0]);
          output.acknowledged_eligibility = structuredClone(request.input.application_eligibility_expectation);
        } else if (request.stageId === "PB-04") output = fixture.answerMode === "message_only" ? {
          schema_version: "v19-l5-plan-v1", answer_mode: "message_only", decision_plan: null, message_plan: structuredClone(fixture.messagePlan),
        } : {
          schema_version: "v19-l5-plan-v1", answer_mode: "decision_guidance", decision_plan: structuredClone(fixture.plan), message_plan: null,
        };
        else if (patchMode) {
          assert.equal(occurrence, 2); assert.equal(request.promptVersion, "v1.0.0");
          assert.equal(request.schemaName, "pb_05_report_fact_repair_v1");
          assert.equal(request.input.quality_reassessment_directive, null);
          output = repairPatch(binding, fixture.replacementText);
        } else if (request.stageId === "PB-05") output = fixture.answerMode === "message_only" ? {
          schema_version: "v19-l5-report-v1", answer_mode: "message_only", report_content: null, message_content: structuredClone(fixture.messageContent),
        } : {
          schema_version: "v19-l5-report-v1", answer_mode: "decision_guidance", report_content: structuredClone(fixture.report), message_content: null,
        };
        else if (request.stageId === "PB-06") {
          output = validationPass(postRepair ? binding : null);
          if (!postRepair) output.semantic_checks = structuredClone(firstFindings ?? (fixture.clean ? [] : [repairFinding(fixture)]));
        } else throw new Error(`UNEXPECTED_TEST_STAGE_${request.stageId}`);
        const response = { responseId: `authored-offline-${scenarios}-${requests.length}`, returnedModel: request.model,
          output, usage: { inputTokens: 100, cachedTokens: 0, outputTokens: 20, reasoningTokens: 5 }, latencyMs: 0 };
        await mutate({ fixture, request, stage: request.stageId, occurrence, binding, patchMode, postRepair, output, response });
        returned.push({ stageId: request.stageId, occurrence, output: structuredClone(response.output) });
        return response;
      },
    };
    const application = new V19L5LocalApplication({ catalog: changedCatalog, transport,
      now: () => "2026-09-08T00:00:00.000Z", timeZone: "Asia/Tokyo" });
    let result = null, thrown = null;
    try { result = await application.submit(fixture.request); } catch (error) { thrown = error; }
    assert.deepEqual(fixture.request, originalInput, "Application must not mutate test input");
    assertSeedUnchanged(fixture);
    return { result, thrown, requests, returned, application, fixture };
  }

  function failed(run, expected) {
    assert.equal(run.thrown, null, `unexpected outer error: ${code(run.thrown)}`);
    assert.equal(run.result?.finalState, "stopped", `expected stopped, got ${run.result?.finalState}`);
    assert.equal(run.result.stopFinding, expected);
    assert.equal(run.result.decisionResult, null); assert.equal(run.result.messageResult, null);
    assert.equal(run.result.evidence.repair.verified, false);
    assert.ok(run.result.evidence.stages.every(s => s.attempt === 1 || s.attempt === 2));
  }

  await test("exact L5 identity reuses the L4 narrow patch and verification schema", () => {
    assert.equal(catalog.catalogVersion, "runtime-stage-catalog-v23.0.0");
    assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v9.0.0");
    assert.equal(catalog.definitions.find(d => d.stageId === "PB-05").reportFactRepair.schemaVersion, "report-fact-repair-v1");
    assert.equal(catalog.definitions.find(d => d.stageId === "PB-06").schemaVersion, "validation-result-v19-l4-v1");
  });

  for (const target of ["short_letter", "observed_fact_commentary"]) for (const withCandidate of [false, true]) {
    await test(`${target} eligible repair preserves every other value, Candidate=${withCandidate}, and all three-day phases`, async () => {
      const fixture = createRepairFixture({ target, withCandidate });
      const run = await runFixture({ fixture });
      assert.equal(run.thrown, null); assert.equal(run.result.stopFinding, null);
      assert.equal(run.result.finalState, "completed"); assert.equal(run.result.decisionResult.eligibility, "ready");
      assert.equal(stageCalls(run, "PB-04").length, 1); assert.equal(stageCalls(run, "PB-05").length, 2); assert.equal(stageCalls(run, "PB-06").length, 2);
      const q5 = stageCalls(run, "PB-05"), q6 = stageCalls(run, "PB-06");
      const binding = q5[1].input.report_fact_repair_context;
      assert.equal(binding.target_path, fixture.targetPath); assert.equal(binding.original_text, fixture.originalText);
      assert.equal(binding.source_report_hash, hashJson(fixture.report));
      assert.deepEqual(binding.source_report, fixture.report); assert.deepEqual(binding.selected_finding, repairFinding(fixture));
      assert.deepEqual(binding.evidence_fact_ids, fixture.evidenceFactIds);
      assert.deepEqual(q5[1].input.decision_plan, q5[0].input.decision_plan);
      assert.deepEqual(q5[1].input.base_structured_intake, q5[0].input.base_structured_intake);
      const expected = structuredClone(q6[0].input.report_content);
      if (target === "short_letter") expected.short_letter[1] = fixture.replacementText;
      else expected.observed_fact_commentary[0].commentary = fixture.replacementText;
      assert.deepEqual(q6[1].input.report_content, expected);
      assert.deepEqual(run.result.decisionResult.report.content, expected);
      assert.deepEqual(run.result.decisionResult.report.decisionPlan, fixture.plan);
      assert.deepEqual(run.result.decisionResult.report.decisionPlan.aftercare_plan, fixture.plan.aftercare_plan);
      assert.equal(fixture.plan.aftercare_plan.length, 3);
      assert.deepEqual(run.result.decisionResult.report.decisionPlan.recommended_message_draft, fixture.plan.recommended_message_draft);
      assert.deepEqual(run.result.decisionResult.report.decisionPlan.message_draft_edit_metadata, fixture.plan.message_draft_edit_metadata);
      if (withCandidate) {
        assert.equal(stageCalls(run, "PB-01C").length, 1);
        assert.equal(run.result.decisionResult.decisionCard.messageDraft, fixture.request.optionalMessage);
        assert.equal(run.result.evidence.originalProvenance.hash, hashJson(fixture.request.optionalMessage));
      }
      assert.deepEqual(run.result.evidence.repair.eligible, true); assert.equal(run.result.evidence.repair.executed, true); assert.equal(run.result.evidence.repair.verified, true);
      assert.equal(q6[1].input.report_fact_repair_context.report_hash, hashJson(expected));
      const receipt = run.returned.find(r => r.stageId === "PB-05" && r.occurrence === 2).output;
      assert.deepEqual(Object.keys(receipt), ["schema_version", "source_report_hash", "target_path", "original_text", "replacement_text"]);
    });
  }

  await test("correct first pass remains completed without forced repair", async () => {
    const run = await runFixture({ fixture: createRepairFixture({ clean: true }) });
    assert.equal(run.result.finalState, "completed"); assert.equal(run.result.evidence.repair.executed, false);
    assert.equal(stageCalls(run, "PB-05").length, 1); assert.equal(stageCalls(run, "PB-06").length, 1);
    assert.equal(stageCalls(run, "PB-06")[0].input.report_fact_repair_context, null);
  });

  for (const key of REPAIR_CHECKS) for (const verdict of ["fail", "unknown"]) {
    await test(`post-repair ${key}=${verdict} blocks delivery despite five passes`, async () => {
      const run = await runFixture({ mutate: c => { if (c.postRepair) c.output.report_fact_repair_verification.checks[key] = verdict; } });
      failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
      assert.equal(stageCalls(run, "PB-05").length, 2); assert.equal(stageCalls(run, "PB-06").length, 2);
    });
  }

  const materialCases = [
    ["FACT_FIDELITY", "report_content.short_letter[1]"],
    ["ASSUMPTION_AS_FACT", "report_content.observed_fact_commentary[0].commentary"],
    ["UNSUPPORTED_CERTAINTY", "report_content.short_letter[0]"],
    ["ACTION_CONSISTENCY", "decision_plan.actions_to_take[0]"],
    ["SAFETY_REGRESSION", "report_content.short_letter[0]"],
    ["REQUIRED_SECTION_MEANING", "report_content.decision_reason_summary"],
    ["DECISION_ALLOWED", "decision_plan.selected_decision"],
  ];
  for (const [findingCode, jsonPath] of materialCases) {
    await test(`remaining/new ${findingCode} cannot be erased by six pass labels`, async () => {
      const fixture = createRepairFixture();
      const run = await runFixture({ fixture, mutate: c => {
        if (c.postRepair) c.output.semantic_checks = [repairFinding(fixture, { finding_code: findingCode, json_path: jsonPath,
          detail: "AUTHORED MATERIAL NEGATIVE: a remaining or newly introduced defect in the stated target has been independently established." })];
      } });
      failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
    });
  }

  await test("a repaired leaf that creates a same-time action contradiction cannot deliver", async () => {
    const run = await runFixture({ mutate: c => {
      if (c.patchMode) c.output.replacement_text += "今この一通を送ってください。同じ今、この一通を送らないでください。";
      if (c.postRepair) c.output.report_fact_repair_verification.checks.action_consistency = "fail";
    } });
    failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
  });

  await test("changing wording while retaining the unsupported delivery claim fails verification", async () => {
    const run = await runFixture({ mutate: c => {
      if (c.patchMode) c.output.replacement_text = c.binding.original_text.replace("今夜は", "今日は");
      if (c.postRepair) c.output.report_fact_repair_verification.checks.fact_source_integrity = "fail";
    } });
    failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
    assert.ok(stageCalls(run, "PB-06")[1].input.report_content.short_letter[1].includes("質問は一度届いており"));
  });

  await test("multiple new material defects cannot pass as one successful patch", async () => {
    const fixture = createRepairFixture();
    const run = await runFixture({ fixture, mutate: c => {
      if (c.postRepair) c.output.semantic_checks = [
        repairFinding(fixture, { finding_code: "ACTION_CONSISTENCY", json_path: "decision_plan.actions_to_take[0]" }),
        repairFinding(fixture, { finding_code: "SAFETY_REGRESSION", json_path: "report_content.short_letter[0]" }),
      ];
    } });
    failed(run, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED");
  });

  const invalidPatch = [
    ["source hash", p => { p.source_report_hash = "0".repeat(64); }, "M2_REPORT_FACT_REPAIR_INVALID"],
    ["target path", p => { p.target_path = "report_content.short_letter[0]"; }, "M2_REPORT_FACT_REPAIR_INVALID"],
    ["original text", p => { p.original_text += " altered"; }, "M2_REPORT_FACT_REPAIR_INVALID"],
    ["unchanged target", p => { p.replacement_text = p.original_text; }, "M2_REPORT_FACT_REPAIR_INVALID"],
    ["blank target", p => { p.replacement_text = " "; }, "M2_REPORT_FACT_REPAIR_INVALID"],
    ["full Report substitute", p => { p.report_content = {}; }, "M2_STAGE_SCHEMA_INVALID"],
  ];
  for (const [name, mutate, error] of invalidPatch) await test(`patch ${name} mismatch cannot merge or call post-verification`, async () => {
    const run = await runFixture({ mutate: c => { if (c.patchMode) mutate(c.output); } });
    failed(run, error); assert.equal(stageCalls(run, "PB-06").length, 1);
  });

  const invalidVerification = [
    ["missing", o => { delete o.report_fact_repair_verification; }, "M2_STAGE_SCHEMA_INVALID"],
    ["null", o => { o.report_fact_repair_verification = null; }, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"],
    ["hash", o => { o.report_fact_repair_verification.report_hash = "0".repeat(64); }, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"],
    ["path", o => { o.report_fact_repair_verification.target_path = "report_content.short_letter[0]"; }, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"],
    ["text", o => { o.report_fact_repair_verification.verified_text += " "; }, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"],
    ["fact ID", o => { o.report_fact_repair_verification.evidence_fact_ids = ["F999"]; }, "M2_REPORT_FACT_REPAIR_VERIFICATION_FAILED"],
  ];
  for (const [name, mutate, error] of invalidVerification) await test(`verification ${name} mismatch cannot imply success`, async () => {
    const run = await runFixture({ mutate: c => { if (c.postRepair) mutate(c.output); } }); failed(run, error);
  });

  await test("a nonexistent Plan reason Fact ID stops before Report or repair", async () => {
    const fixture = createRepairFixture({ clean: true });
    fixture.plan.decision_reason_fact_ids = ["F999"];
    assert.ok(!fixture.base.observed_facts.some(fact => fact.fact_id === "F999"));
    const run = await runFixture({ fixture });
    failed(run, "MATERIAL_REASON_SOURCE_INTEGRITY");
    assert.equal(stageCalls(run, "PB-04").length, 1);
    assert.equal(stageCalls(run, "PB-05").length, 0); assert.equal(stageCalls(run, "PB-06").length, 0);
    assert.equal(run.result.evidence.repair.executed, false);
  });

  for (const kind of ["no_followup_message", "unknown"]) await test(`message-only ${kind} cannot bypass the inherited outbound-draft restriction`, async () => {
    const fixture = createMessageOnlyConstraintFixture(kind);
    const run = await runFixture({ fixture });
    failed(run, "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
    assert.equal(run.result.answerMode, "message_only");
    assert.equal(stageCalls(run, "PB-01C").length, 1); assert.equal(stageCalls(run, "PB-04").length, 1);
    assert.equal(stageCalls(run, "PB-05").length, 0); assert.equal(stageCalls(run, "PB-06").length, 0);
    const contact = stageCalls(run, "PB-04")[0].input.contact_constraint_policy;
    assert.equal(contact.constraint_kind, kind); assert.equal(contact.outbound_contact_now_allowed, false);
    assert.equal(contact.outbound_contact_after_time_passage_allowed, false);
    assert.equal(run.result.evidence.repair.executed, false);
  });

  const fixture = createRepairFixture();
  const ineligible = [
    ["out-of-scope reason summary", [repairFinding(fixture, { json_path: "report_content.decision_reason_summary" })]],
    ["unknown fact ID", [repairFinding(fixture, { evidence_refs: ["F999"] })]],
    ["policy-only evidence", [repairFinding(fixture, { evidence_refs: ["policy:decision_policy_result"] })]],
    ["duplicate evidence", [repairFinding(fixture, { evidence_refs: ["F105", "F105"] })], "M2_STAGE_SCHEMA_INVALID"],
    ["multiple unrelated facts", [repairFinding(fixture), repairFinding(fixture, { json_path: "report_content.observed_fact_commentary[1].commentary", evidence_refs: ["F205"] })]],
    ...materialCases.filter(([findingCode]) => !["FACT_FIDELITY", "ASSUMPTION_AS_FACT", "UNSUPPORTED_CERTAINTY"].includes(findingCode))
      .map(([findingCode, jsonPath]) => [`mixed ${findingCode}`, [repairFinding(fixture), repairFinding(fixture, { finding_code: findingCode, json_path: jsonPath })]]),
  ];
  for (const [name, firstFindings, expected = "M2_REPORT_FACT_REPAIR_INELIGIBLE"] of ineligible) await test(`${name} rejects without whole-Report regeneration`, async () => {
    const run = await runFixture({ firstFindings }); failed(run, expected);
    assert.equal(run.result.evidence.repair.executed, false); assert.equal(stageCalls(run, "PB-05").length, 1); assert.equal(stageCalls(run, "PB-04").length, 1);
  });

  await test("unsafe aggregate never reaches Plan, Report, patch or delivery", async () => {
    const run = await runFixture({ mutate: c => {
      if (c.stage === "PB-02") Object.assign(c.output, { classification: "rejected", reason_codes: ["stalking_or_visit"],
        response_mode: "unsafe_contact_stop", evidence_refs: ["input:current_situation"], ambiguity_present: false });
    } });
    failed(run, "SAFETY_CLASSIFICATION_NOT_NORMAL");
    assert.equal(stageCalls(run, "PB-04").length, 0); assert.equal(stageCalls(run, "PB-05").length, 0); assert.equal(stageCalls(run, "PB-06").length, 0);
    assert.equal(run.result.evidence.repair.executed, false);
  });

  for (const stage of ["PB-05", "PB-06"]) await test(`technical failure at repair ${stage} stays stopped without retry`, async () => {
    const run = await runFixture({ mutate: c => { if (c.stage === stage && c.occurrence === 2) throw new M2RuntimeError("M2_FAKE_STAGE_FAILURE"); } });
    failed(run, "M2_FAKE_STAGE_FAILURE");
    assert.equal(stageCalls(run, "PB-05").length, 2); assert.equal(stageCalls(run, "PB-06").length, stage === "PB-05" ? 1 : 2);
    assert.equal(run.result.evidence.stages.at(-1).error, "M2_FAKE_STAGE_FAILURE");
  });

  await test("model mismatch during repair is terminal and retains the received receipt", async () => {
    const run = await runFixture({ mutate: c => { if (c.patchMode) c.response.returnedModel = "wrong-model"; } });
    failed(run, "M2_STAGE_MODEL_MISMATCH");
    assert.equal(run.result.evidence.stages.at(-1).response.returnedModel, "wrong-model");
    assert.equal(stageCalls(run, "PB-06").length, 1);
  });

  await test("changed candidate identity and patch contract reject before any stage", async () => {
    for (const mutate of [c => { c.catalogVersion = "runtime-stage-catalog-v22.0.0"; },
      c => { c.schemaSetVersion = "pipeline-schema-runtime-v8.0.0"; },
      c => { c.definitions.find(d => d.stageId === "PB-05").reportFactRepair.promptHash = "0".repeat(64); }]) {
      const changedCatalog = structuredClone(catalog); mutate(changedCatalog);
      const run = await runFixture({ changedCatalog });
      assert.equal(code(run.thrown) ?? run.result?.stopFinding, "V19_L5_RUNTIME_IDENTITY_MISMATCH");
      assert.equal(run.requests.length, 0);
    }
  });

  await test("a used Application cannot rerun the session", async () => {
    const run = await runFixture({ fixture: createRepairFixture({ clean: true }) });
    const count = run.requests.length;
    await assert.rejects(() => run.application.submit(run.fixture.request), error => code(error) === "V19_L5_SESSION_ALREADY_USED");
    assert.equal(run.requests.length, count);
  });
  await test("historical evidence bytes stay unchanged and network attempts are zero", () => {
    assertSeedUnchanged(protectedSeed); assert.equal(networkAttempts, 0);
  });
  console.log(JSON.stringify({ status: "PASS", checks: results.length, scenarios, realApiCalls: 0,
    actualProviderCalls: 0, actualDatabaseCalls: 0, networkAttempts, provenance: REPAIR_FIXTURE_PROVENANCE,
    semanticDetectionValidated: false, modelRepairQualityValidated: false, F007Resolved: false, F008Resolved: false, results }, null, 2));
} finally { globalThis.fetch = previousFetch; }
