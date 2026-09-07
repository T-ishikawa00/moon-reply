import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

// No live runner, credential loader, DB client or real provider is instantiated.
const previousFetch = globalThis.fetch;
let forbiddenNetworkCalls = 0;
globalThis.fetch = async () => { forbiddenNetworkCalls++; throw new Error("NETWORK_FORBIDDEN_L3_OFFLINE"); };
const root = process.cwd(), target = "evals/guidance-quality-v19-l3/";
const json = file => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const hash = value => createHash("sha256").update(value).digest("hex");
const canonical = value => value.replaceAll("\r\n", "\n");
const results = [], evidence = [];
const check = async (name, fn) => {
  try { await fn(); results.push({ name, status: "PASS" }); console.log(`PASS ${results.length} ${name}`); }
  catch (error) { results.push({ name, status: "FAIL", error: error.safeCode ?? error.message }); console.error(`FAIL ${results.length} ${name}: ${error.safeCode ?? error.message}`); }
};

try {
  const preservation = json(target + "preservation-manifest.json");
  const preserve = () => {
    for (const [file, digest] of Object.entries(preservation.hashes)) assert.equal(hash(readFileSync(path.join(root, file))), digest, `Frozen evidence changed: ${file}`);
    assert.equal(preservation.stopReleased, false);
  };
  await check("all frozen prior-run and runner bytes match preservation manifest before imports", preserve);
  const [l3, l2, identities, helpers, semantic, boundary, validator, projection, experience, apps, fakes] = await Promise.all([
    import("../../lib/assessment/runtime/v19-l3-stage-catalog.ts"), import("../../lib/assessment/runtime/v19-l2-stage-catalog.ts"),
    import("../../lib/assessment/runtime/v19-l3-runtime-identity.ts"), import("../guidance-quality-v19-l1/fixtures.mjs"),
    import("../../lib/assessment/runtime/semantic-disposition-v7.ts"), import("../../lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts"),
    import("../../lib/assessment/runtime/validation.ts"), import("../../lib/assessment/runtime/customer-assessment-projection-v1.ts"),
    import("../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts"), import("../../lib/assessment/runtime/application.ts"),
    import("../../lib/assessment/runtime/fakes.ts"),
  ]);
  const predecessor = await l2.loadV19L2StageCatalog(), candidate = await l3.loadV19L3StageCatalog();
  const { executeOffline } = helpers;
  const noExternal = run => { assert.equal(run.transport.actualProviderCalls, 0); assert.equal(run.repository.actualSupabaseCalls, 0); };
  const stripPrompt = value => { const copy = structuredClone(value); delete copy.developerPrompt; delete copy.promptVersion; delete copy.promptHash; return copy; };
  await check("only PB05 prompt identity differs; PB06 temporal v9 and all old schemas remain exact", () => {
    assert.equal(candidate.catalogVersion, identities.V19_L3_CATALOG_VERSION);
    assert.equal(candidate.promptBundleVersion, "prompt-bundle-runtime-v21.0.0");
    assert.equal(candidate.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
    assert.equal(candidate.definitions.length, 7);
    for (const old of predecessor.definitions) {
      const next = candidate.definitions.find(stage => stage.stageId === old.stageId);
      if (old.stageId === "PB-05") { assert.equal(next.promptVersion, "v11.0.0"); assert.notEqual(next.promptHash, old.promptHash); assert.deepEqual(stripPrompt(next), stripPrompt(old)); }
      else assert.deepEqual(next, old);
    }
    assert.equal(candidate.definitions.find(stage => stage.stageId === "PB-06").promptVersion, "v9.0.0");
    assert.deepEqual(candidate.definitions.map(({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName }) => ({ stageId, promptVersion, promptHash, schemaVersion, schemaHash, schemaName })), json(target + "catalog-identity.json").definitions);
  });
  await check("old prompt/schema/classifier/Policy/Production/rendering sources are unchanged", () => {
    const oldContracts = execFileSync("git", ["ls-tree", "-r", "--name-only", preservation.baselineHead, "--", "lib/assessment/runtime/contracts"], { encoding: "utf8" }).trim().split(/\r?\n/u);
    const paths = [...oldContracts, "ai/prompts", "lib/assessment/runtime/v19-l1-stage-catalog.ts", "lib/assessment/runtime/v19-l2-stage-catalog.ts",
      "lib/assessment/runtime/v19-l1-runtime-identity.ts", "lib/assessment/runtime/v19-l2-runtime-identity.ts", "lib/assessment/runtime/v19-l1-acknowledgement-policy.ts",
      "lib/assessment/runtime/semantic-disposition-v7.ts", "lib/assessment/runtime/quality-reassessment-v2.ts", "lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts",
      "lib/assessment/runtime/effective-decision-policy-v2.ts", "lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts",
      "lib/assessment/runtime/draft-source-integrity-v2.ts", "lib/assessment/runtime/customer-assessment-projection-v1.ts",
      "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts", "components/runtime/CustomerAssessmentNote.tsx", "lib/assessment/production/application-runtime.ts"];
    execFileSync("git", ["diff", "--exit-code", preservation.baselineHead, "--", ...paths], { stdio: "pipe" });
  });
  let insertion;
  await check("PB05 adds exactly message-state evidence section and title, without changing old Product functions", () => {
    const old = canonical(predecessor.definitions.find(stage => stage.stageId === "PB-05").developerPrompt);
    const next = canonical(candidate.definitions.find(stage => stage.stageId === "PB-05").developerPrompt);
    const start = next.indexOf("## Message-state evidence fidelity\n"), end = next.indexOf("## Bounded quality reassessment mode", start);
    assert.ok(start > 0 && end > start); insertion = next.slice(start, end);
    const removeTitle = text => text.replace(/^# PB-05[^\n]*/mu, "# PB-05 TITLE");
    assert.equal(removeTitle(next.slice(0, start) + next.slice(end)), removeTitle(old));
    for (const fragment of ["A sent message alone establishes neither delivery nor reading", "read indicator does not establish understanding",
      "Explicit delivery or read evidence may be used", "Do not infer affection, rejection, deliberate ignoring", "not a ban on a word", "Do not add a status checklist",
      "Do not add a clarification", "preserve that direction, its concrete actions"]) assert.ok(insertion.includes(fragment));
    assert.equal(/GQ-?\d|Output A|Output B|expected_semantic|authored_findings/u.test(insertion), false);
  });

  const fixtures = json(target + "fixtures.json"), temporalSource = json(fixtures.temporalSource);
  await check("eight fixed source-state examples are evaluation-only and original temporal eight remain unchanged", () => {
    assert.deepEqual(fixtures.temporalFixtures, temporalSource.fixtures); assert.equal(fixtures.temporalFixtures.length, 8);
    assert.equal(fixtures.surfaceExamples.length, 8); assert.equal(new Set(fixtures.surfaceExamples.map(value => value.id)).size, 8);
    assert.equal(fixtures.actualModelQuality, "NOT_TESTED");
    for (const item of fixtures.surfaceExamples) {
      assert.ok(item.input && item.explicitFacts.length && item.unknowns.length && item.allowed && item.forbidden && item.expected);
      assert.notEqual(item.allowed, item.forbidden);
    }
    assert.ok(fixtures.surfaceExamples.find(item => item.id === "RECEIVED_MESSAGE_ALLOWED").allowed.includes("届いて"));
    // Coverage of explicit exceptions is an authored expectation, not Japanese
    // semantic parsing or model prediction.
    assert.ok(insertion.includes("Explicit delivery or read evidence may be used"));
  });

  const runRoot = "evals/guidance-quality-v19-l2/runs/2026-09-07-authorized-pilot8-v19-l2/internal";
  const fixedInputs = json("evals/guidance-quality-wave1/pilot-inputs.json").cases;
  const records = readdirSync(path.join(root, runRoot), { withFileTypes: true }).filter(item => item.isDirectory()).map(item => {
    const relative = `${runRoot}/${item.name}/session.json`;
    return { relative, directory: `${runRoot}/${item.name}`, session: json(relative) };
  });
  function storedFixture(record) {
    const outputs = {};
    for (const stage of record.session.stageDispositions) if (stage.status === "completed") {
      assert.equal(stage.attemptNumber ?? 1, 1, "Do not discard real repair attempts");
      assert.equal(outputs[stage.stageId], undefined);
      outputs[stage.stageId] = structuredClone(stage.completion.outputJson);
    }
    return { caseId: record.session.caseId, request: structuredClone(fixedInputs.find(item => item.id === record.session.caseId).input), outputs };
  }
  for (const caseId of ["GQ-05", "GQ-13", "GQ-24"]) {
    await check(`${caseId}: every fresh saved completed session replays unchanged under both candidates`, async () => {
      const matching = records.filter(record => record.session.caseId === caseId && record.session.errorCode === null);
      assert.equal(matching.length, 2);
      for (const record of matching) {
        const fixture = storedFixture(record), original = record.session.finalOutput;
        const old = await executeOffline(fixture, predecessor), next = await executeOffline(fixture, candidate); noExternal(old); noExternal(next);
        assert.deepEqual(old.transport.calls, next.transport.calls); assert.equal(next.result.eligibility, original.eligibility);
        if (original.eligibility === "needs_more_information") {
          assert.equal(next.result.clarification.question, original.clarification.question);
          assert.deepEqual(next.result.reasonCodes, old.result.reasonCodes); assert.equal(next.transport.calls.length, 3);
        } else {
          for (const replay of [old, next]) {
            assert.deepEqual(replay.result.report, original.report); assert.deepEqual(replay.result.decisionCard, original.decisionCard);
            assert.deepEqual(projection.projectCustomerAssessmentV1(replay.result, fixture.request.requestedTopics), projection.projectCustomerAssessmentV1(original, fixture.request.requestedTopics));
            assert.deepEqual(experience.projectCustomerAssessmentExperienceV2(replay.result, fixture.request.requestedTopics), experience.projectCustomerAssessmentExperienceV2(original, fixture.request.requestedTopics));
          }
        }
      }
      evidence.push({ case: caseId, type: "SAVED_FRESH_OUTPUT_REPLAY", sourceSessions: matching.length, unchangedOutputsAndProjection: true,
        newModelQuality: "NOT_TESTED", HumanJudgmentChanged: false });
    });
  }
  const stopped = records.find(record => record.session.caseId === "GQ-29-P3");
  assert.ok(stopped);
  const received = json(`${stopped.directory}/call-108-response.json`);
  const originalReport = JSON.parse(received.outputText), manualStop = json(`${stopped.directory}/call-108-inspection-decision.json`);
  const editedReport = structuredClone(originalReport);
  const affectedPath = "observed_fact_commentary[0].commentary";
  const originalCommentary = originalReport.observed_fact_commentary[0].commentary;
  const editedCommentary = originalCommentary.replace("すでに届いているため", "すでに送っているため");
  editedReport.observed_fact_commentary[0].commentary = editedCommentary;
  const stoppedFixture = storedFixture(stopped);
  const readyGq24 = records.find(record => record.session.caseId === "GQ-24" && record.session.finalOutput?.eligibility === "ready");
  const pb06Shape = structuredClone(storedFixture(readyGq24).outputs["PB-06"]);
  const controlled = structuredClone(stoppedFixture);
  controlled.outputs["PB-05"] = editedReport;
  controlled.outputs["PB-06"] = { ...pb06Shape, semantic_checks: [] };
  await check("stopped GQ29-P3 evidence remains stopped; only one editorial Report field differs in memory", () => {
    assert.equal(stopped.session.errorCode, "MATERIAL_MANUAL_INTEGRITY_OR_SAFETY"); assert.equal(stopped.session.finalOutput, null);
    assert.equal(manualStop.action, "stop"); assert.ok(manualStop.reason.includes("MATERIAL_FACT_SOURCE_FIDELITY"));
    assert.equal(stoppedFixture.outputs["PB-06"], undefined); assert.equal(stoppedFixture.outputs["PB-05"], undefined);
    assert.equal(originalReport.observed_fact_commentary[0].fact_id, "F101"); assert.notEqual(editedCommentary, originalCommentary);
    const undo = structuredClone(editedReport); undo.observed_fact_commentary[0].commentary = originalCommentary; assert.deepEqual(undo, originalReport);
    for (const catalog of [predecessor, candidate]) {
      const definition = catalog.definitions.find(stage => stage.stageId === "PB-05");
      validator.validateStageOutput(definition, originalReport); validator.validateStageOutput(definition, editedReport);
    }
    // Both texts are schema-valid. This test does NOT claim the validator detects
    // the original semantic defect, or that a new model generated the edit.
  });
  let controlledReady;
  await check("editorial one-field repair with explicitly authored PB06 preserves Plan draft and concrete three-day projection", async () => {
    const old = await executeOffline(controlled, predecessor), next = await executeOffline(controlled, candidate); noExternal(old); noExternal(next);
    assert.equal(next.result.eligibility, "ready"); controlledReady = next.result;
    assert.equal(next.result.decision, stoppedFixture.outputs["PB-04"].selected_decision);
    assert.equal(next.result.decision, "wait_and_reassess");
    assert.deepEqual(next.result.report.decisionPlan, old.result.report.decisionPlan);
    assert.deepEqual(next.result.report.decisionPlan.recommended_message_draft, stoppedFixture.outputs["PB-04"].recommended_message_draft);
    assert.equal(next.result.report.content.observed_fact_commentary[0].commentary, editedCommentary);
    assert.deepEqual(next.result.report, old.result.report); assert.deepEqual(next.result.decisionCard, old.result.decisionCard);
    assert.deepEqual(projection.projectCustomerAssessmentV1(next.result, controlled.request.requestedTopics), projection.projectCustomerAssessmentV1(old.result, controlled.request.requestedTopics));
    assert.deepEqual(experience.projectCustomerAssessmentExperienceV2(next.result, controlled.request.requestedTopics), experience.projectCustomerAssessmentExperienceV2(old.result, controlled.request.requestedTopics));
    assert.ok(controlled.request.requestedTopics.includes("next_three_days"));
    assert.equal(next.transport.calls.length, 6);
    evidence.push({ case: "GQ29-P3", type: "EDITORIAL_ONE_FIELD_REPAIR_WITH_AUTHORED_EMPTY_PB06_NOT_REAL_OUTPUT", affectedPath,
      original: originalCommentary, editorialTarget: editedCommentary, PlanAndDraftUnchanged: true, projectionMatchesPredecessor: true,
      actualNewModelCalls: 0, actualPb06ReceiptExists: false, originalStopReleased: false });
  });

  const pb06Files = readdirSync(path.join(root, readyGq24.directory)).filter(file => file.endsWith("-request.json"));
  const semanticInput = pb06Files.map(file => json(`${readyGq24.directory}/${file}`)).find(receipt => receipt.stageId === "PB-06").input;
  const facts = structuredClone(semanticInput.base_structured_intake.decision_facts); delete facts.user_contact_constraint;
  facts.schema_version = "m2-p4-decision-facts-v2"; facts.contact_state.proposed_message_present = semanticInput.candidate_envelope.presence;
  const classify = (findings, plan = semanticInput.decision_plan) => semantic.evaluateSemanticFindingsV7({ validationOutput: { ...pb06Shape, semantic_checks: structuredClone(findings) },
    decisionPlan: plan, groundedReportContent: semanticInput.report_content, decisionFacts: facts });
  for (const item of fixtures.temporalFixtures) await check(`${item.id}: inherited authored temporal expectation and finding routing unchanged`, () => {
    const plan = structuredClone(semanticInput.decision_plan); plan.selected_decision = item.primary_direction; plan.actions_to_take = item.temporal_events.map(event => event.instruction);
    assert.equal(classify(item.authored_findings, plan).blockingFindings.length, item.expected_existing_classifier_blocking);
    assert.equal(classify([], plan).blockingFindings.length, 0, "No prose detector is being claimed");
  });
  await check("explicit no-contact remains valid as no-send and rejects current or future contact workaround", () => {
    const contactPolicy = { schema_version: "m2-p4-contact-constraint-policy-v1", constraint_kind: "no_followup_message", constraint_status: "explicit", supporting_fact_ids: ["F100"],
      follow_up_exception: "none", outbound_contact_now_allowed: false, outbound_contact_after_time_passage_allowed: false, exception_required_for_future_contact: true };
    const plan = structuredClone(semanticInput.decision_plan);
    Object.assign(plan, { selected_decision: "pause_additional_contact", recommended_message_draft: null, message_draft_edit_metadata: null, actions_to_take: ["連絡を控える。"], aftercare_plan: [],
      change_conditions: [{ condition: "境界が続いている。", resulting_direction: "pause_additional_contact", supporting_fact_ids: ["F100"] }] });
    const validate = value => boundary.validateDecisionPlanConstraintIntegrityV1({ decisionPlan: value, contactConstraintPolicy: contactPolicy, actionContext: semanticInput.action_context });
    assert.doesNotThrow(() => validate(plan));
    for (const mutate of [value => { value.selected_decision = "send_now"; }, value => { value.change_conditions[0].resulting_direction = "reply_now"; },
      value => { value.recommended_message_draft = { text: "また連絡します。", policy: "later_only", use_timing: "later" }; }]) {
      const value = structuredClone(plan); mutate(value); assert.throws(() => validate(value), error => error.safeCode === "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
    }
  });
  async function capture(fixture, catalog) {
    const repository = new fakes.FakeAssessmentRepository(), transport = new fakes.FakeAiStageTransport({ outputs: fixture.outputs });
    let index = 0, result = null, error = null;
    const app = new apps.AssessmentApplication({ repository, transport, definitions: catalog.definitions, model: "gpt-5.6-luna", promptBundleVersion: catalog.promptBundleVersion,
      schemaSetVersion: catalog.schemaSetVersion, timeZone: "Asia/Tokyo", now: () => "2026-09-07T10:00:00.000Z", uuid: () => `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}` });
    try { result = await app.submit(fixture.request, "l3-offline-capture"); } catch (caught) { error = caught; }
    return { repository, transport, result, error };
  }
  await check("mixed PB05 versions and bundle identities fail before any fake stage", async () => {
    for (const [catalog, donor] of [[candidate, predecessor], [predecessor, candidate]]) {
      const mixed = { ...catalog, definitions: catalog.definitions.map(stage => stage.stageId === "PB-05" ? donor.definitions.find(value => value.stageId === "PB-05") : stage) };
      const run = await capture(controlled, mixed); noExternal(run); assert.equal(run.error?.safeCode, "M2_STAGE_TOPOLOGY_INVALID");
      assert.equal(run.transport.calls.length, 0); assert.equal(run.result, null);
    }
    for (const mixed of [{ ...candidate, promptBundleVersion: predecessor.promptBundleVersion }, { ...predecessor, promptBundleVersion: candidate.promptBundleVersion }]) {
      const run = await capture(controlled, mixed); assert.equal(run.error?.safeCode, "M2_STAGE_TOPOLOGY_INVALID"); assert.equal(run.transport.calls.length, 0);
    }
  });
  await check("new local candidate cannot enter Production purchase preparation", async () => {
    const { AssessmentPipeline } = await import("../../lib/assessment/runtime/pipeline.ts");
    const repository = new fakes.FakeAssessmentRepository(), transport = new fakes.FakeAiStageTransport({ outputs: controlled.outputs });
    const pipeline = new AssessmentPipeline({ repository, transport, definitions: candidate.definitions, timeZone: "Asia/Tokyo" });
    await assert.rejects(() => pipeline.prepare(controlled.request, {
      requestId: "00000000-0000-4000-8000-000000000001", runId: "00000000-0000-4000-8000-000000000002",
      model: "gpt-5.6-luna", promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion,
      startedAt: "2026-09-07T10:00:00.000Z",
    }), error => error.safeCode === "M2_PRODUCTION_PREPARATION_IDENTITY_INVALID");
    assert.equal(transport.calls.length, 0); assert.equal(repository.runs.size, 0); noExternal({ repository, transport });
  });
  await check("critical current contradiction or fact integrity remains fail-closed after one repair", async () => {
    for (const code of ["ACTION_CONSISTENCY", "FACT_FIDELITY"]) for (const catalog of [predecessor, candidate]) {
      const fixture = structuredClone(controlled);
      if (code === "ACTION_CONSISTENCY") fixture.outputs["PB-04"].actions_to_take[0] = "今、この同じ一通を送る。同じ今、その同じ一通を送らない。";
      fixture.outputs["PB-06"].semantic_checks = [{ finding_code: code, severity: "critical", json_path: code === "ACTION_CONSISTENCY" ? "decision_plan.actions_to_take[0]" : "report_content.decision_reason_summary",
        evidence_refs: ["policy:action_context"], detail: "Synthetic material failure persists through repair; not real model evaluation." }];
      const run = await capture(fixture, catalog); noExternal(run);
      assert.equal(run.error?.safeCode, "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED"); assert.equal(run.result, null); assert.equal(run.repository.reports.size, 0);
      assert.ok([...run.repository.stageRuns.values()].every(stage => (stage.attemptNumber ?? 1) <= 2));
    }
  });
  await check("known inherited F007 major-exhaustion limit is reproduced, not accepted as quality", async () => {
    for (const catalog of [predecessor, candidate]) {
      const fixture = structuredClone(controlled);
      fixture.outputs["PB-04"].actions_to_take[0] = "今、この同じ一通を送る。同じ今、その同じ一通を送らない。";
      fixture.outputs["PB-06"].semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity: "major", json_path: "decision_plan.actions_to_take[0]",
        evidence_refs: ["policy:action_context"], detail: "Authored material contradiction retained after repair; known-limit reproduction only." }];
      const run = await executeOffline(fixture, catalog); noExternal(run);
      assert.equal(run.result.eligibility, "ready"); assert.equal(run.result.report.decisionPlan.actions_to_take[0], fixture.outputs["PB-04"].actions_to_take[0]);
      assert.equal(run.transport.calls.filter(stage => stage === "PB-06").length, 2);
    }
    evidence.push({ type: "KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS", issue: "F007 major ACTION_CONSISTENCY can remain at existing exhaustion",
      unchangedFromPredecessor: true, classifierChanged: false, issueResolved: false });
  });
  await check("final edited fixture retains concrete original actions and no additional sections", () => {
    assert.ok(controlledReady); assert.deepEqual(controlledReady.report.decisionPlan.actions_to_take, stoppedFixture.outputs["PB-04"].actions_to_take);
    assert.deepEqual(Object.keys(editedReport), Object.keys(originalReport));
    assert.deepEqual(editedReport.short_letter, originalReport.short_letter); assert.deepEqual(editedReport.closing_lines, originalReport.closing_lines);
    assert.deepEqual(editedReport.aftercare_commentary, originalReport.aftercare_commentary);
  });
  await check("all frozen bytes still match and real API/network/DB calls remain zero", () => { preserve(); assert.equal(forbiddenNetworkCalls, 0); });
  const summary = { schemaVersion: "guidance-v19-l3-offline-verification-v1", candidate: { catalog: candidate.catalogVersion, promptBundle: candidate.promptBundleVersion, schemaSet: candidate.schemaSetVersion,
    stageHashes: candidate.definitions.map(({ stageId, promptHash, schemaHash }) => ({ stageId, promptHash, schemaHash })) },
    checks: results.length, passed: results.filter(value => value.status === "PASS").length, failed: results.filter(value => value.status === "FAIL").length,
    contractAndReplayChecks: results.filter(value => !value.name.startsWith("known inherited F007")).length, knownLimitationDiagnostics: 1,
    actualNewModelCalls: 0, actualProviderCalls: 0, actualDatabaseCalls: 0, forbiddenNetworkCalls, preservedFiles: Object.keys(preservation.hashes).length,
    sourceStateExpectations: 8, inheritedTemporalExpectations: 8, newPb05Generation: "NOT_RUN", semanticDetectionValidated: false,
    oldManualStopReleased: false, oldHumanReviewChanged: false, mappingDisclosed: false, results, evidence };
  writeFileSync(path.join(root, target, "verification-results.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(`V19-L3 OFFLINE ${summary.failed ? "FAIL" : "PASS"} ${summary.passed}/${summary.checks}; real API/Provider/DB=0; new semantics NOT_TESTED`);
  if (summary.failed) process.exitCode = 1;
} finally { globalThis.fetch = previousFetch; }
