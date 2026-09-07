import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// Install before dynamically importing any application code. Only fake transports
// and repositories are instantiated; no real pilot runner or key loader is used.
let forbiddenNetworkCalls = 0;
const previousFetch = globalThis.fetch;
globalThis.fetch = async () => { forbiddenNetworkCalls++; throw new Error("NETWORK_FORBIDDEN_L2_OFFLINE"); };

const BASELINE = "122696691cac6ab5ba2fa9c453e833bb45b74cb8";
const directory = new URL("./", import.meta.url);
const root = new URL("../../", import.meta.url);
const canonical = value => value.replaceAll("\r\n", "\n");
const hash = value => createHash("sha256").update(value).digest("hex");
const read = relative => readFileSync(new URL(relative, root), "utf8");
const json = relative => JSON.parse(read(relative));
const results = [], evidence = [], frozenHashes = new Map();
const check = async (name, action, successStatus = "PASS") => {
  try { await action(); results.push({ name, status: successStatus }); console.log(`${successStatus} ${results.length} ${name}`); }
  catch (error) { results.push({ name, status: "FAIL", error: error.safeCode ?? error.message }); console.error(`FAIL ${results.length} ${name}: ${error.safeCode ?? error.message}`); }
};
function frozen(relative) {
  const value = readFileSync(new URL(relative, root));
  frozenHashes.set(relative, hash(value));
  return JSON.parse(value.toString("utf8"));
}

try {
  const [catalogModule, predecessorModule, productionCatalog, waveCatalog, identity, helpers, semantics,
    constraints, appModule, pipelineModule, fakes, errors, projections, experience, normalization, policy,
    originalPolicy, sufficiency, originalSufficiency] = await Promise.all([
    import("../../lib/assessment/runtime/v19-l2-stage-catalog.ts"),
    import("../../lib/assessment/runtime/v19-l1-stage-catalog.ts"),
    import("../../lib/assessment/runtime/schema-catalog.ts"),
    import("../../lib/assessment/runtime/guidance-stage-catalog-v1.ts"),
    import("../../lib/assessment/runtime/v19-l2-runtime-identity.ts"),
    import("../guidance-quality-v19-l1/fixtures.mjs"),
    import("../../lib/assessment/runtime/semantic-disposition-v7.ts"),
    import("../../lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts"),
    import("../../lib/assessment/runtime/application.ts"),
    import("../../lib/assessment/runtime/pipeline.ts"),
    import("../../lib/assessment/runtime/fakes.ts"),
    import("../../lib/assessment/runtime/errors.ts"),
    import("../../lib/assessment/runtime/customer-assessment-projection-v1.ts"),
    import("../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts"),
    import("../../lib/assessment/runtime/runtime-result-normalization-v1.ts"),
    import("../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts"),
    import("../../lib/assessment/runtime/effective-decision-policy-v2.ts"),
    import("../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts"),
    import("../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts"),
  ]);
  const candidate = await catalogModule.loadV19L2StageCatalog();
  // Pure existing receipt validator; no live runner or key loader import.
  const { reviewStage } = await import("../guidance-quality-wave1/real-pilot/transport.mjs");
  const predecessor = await predecessorModule.loadV19L1StageCatalog();
  const v17 = await productionCatalog.loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const v18 = await waveCatalog.loadGuidanceQualityWave1StageCatalog();
  const { makeStoredFixture, deriveAuthority, makeEditedAcknowledgementFixture, mutateFixture, executeOffline } = helpers;
  const { projectCustomerAssessmentV1 } = projections;
  const { projectCustomerAssessmentExperienceV2 } = experience;
  const { requireReadyAssessmentResult } = normalization;
  const { FakeAssessmentRepository, FakeAiStageTransport } = fakes;
  const { M2RuntimeError } = errors;
  const noExternal = run => {
    assert.equal(run.transport.actualProviderCalls, 0);
    assert.equal(run.repository.actualSupabaseCalls, 0);
    assert.ok([...run.repository.stageRuns.values()].every(stage => (stage.attemptNumber ?? 1) <= 2));
  };
  const rejects = (action, safeCode) => assert.rejects(action, error => error.safeCode === safeCode);
  const captureOfflineFailure = async (fixture, catalog) => {
    const repository = new FakeAssessmentRepository(), transport = new FakeAiStageTransport({ outputs: fixture.outputs });
    let count = 0, result = null, error = null;
    const application = new appModule.AssessmentApplication({ repository, transport, model: "gpt-5.6-luna", definitions: catalog.definitions,
      promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion,
      timeZone: "Asia/Tokyo", now: () => "2026-09-07T10:00:00.000Z", uuid: () => `00000000-0000-4000-8000-${String(++count).padStart(12, "0")}` });
    try { result = await application.submit(fixture.request, "offline-failure-capture"); } catch (failure) { error = failure; }
    return { repository, transport, result, error };
  };
  const withoutPrompt = definition => {
    const value = structuredClone(definition);
    delete value.promptVersion; delete value.promptHash; delete value.developerPrompt;
    return value;
  };

  await check("old contracts, protected policies, schemas, Product rendering and Production selector unchanged", () => {
    const paths = ["ai/prompts", "evals/guidance-quality-r1/cases.json", "evals/guidance-quality-wave1/pilot-inputs.json",
      "evals/guidance-quality-wave1/runs", "evals/guidance-quality-v19-l1/runs", "evals/guidance-quality-r1/gq24-action-consistency",
      "lib/assessment/production/application-runtime.ts", "lib/assessment/runtime/semantic-disposition-v4.ts",
      "lib/assessment/runtime/semantic-disposition-v5.ts", "lib/assessment/runtime/semantic-disposition-v6.ts",
      "lib/assessment/runtime/semantic-disposition-v7.ts", "lib/assessment/runtime/quality-reassessment-v2.ts",
      "lib/assessment/runtime/v19-l1-runtime-identity.ts", "lib/assessment/runtime/v19-l1-stage-catalog.ts",
      "lib/assessment/runtime/v19-l1-acknowledgement-policy.ts", "lib/assessment/runtime/effective-decision-policy-v2.ts",
      "lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts", "lib/assessment/runtime/decision-plan-constraint-integrity-v1.ts",
      "lib/assessment/runtime/draft-source-integrity-v2.ts", "lib/assessment/runtime/customer-surface-integrity-v1.ts",
      "components/runtime/CustomerAssessmentNote.tsx", "lib/assessment/runtime/customer-assessment-projection-v1.ts",
      "lib/assessment/runtime/customer-assessment-experience-projection-v2.ts"];
    const oldContracts = execFileSync("git", ["ls-tree", "-r", "--name-only", BASELINE, "--", "lib/assessment/runtime/contracts"], { encoding: "utf8" }).trim().split(/\r?\n/u);
    // Protect every historical file, while allowing the separately authorized
    // new diagnostic-status overlay after this candidate is committed.
    const protectedPaths = execFileSync("git", ["ls-tree", "-r", "--name-only", BASELINE, "--", ...paths], { encoding: "utf8" }).trim().split(/\r?\n/u);
    const protectedSet = new Set([...protectedPaths, ...oldContracts]);
    const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", "-z", BASELINE], { encoding: "utf8" }).split("\0").filter(Boolean);
    assert.deepEqual(changed.filter(name => protectedSet.has(name)), [], "Historical files must remain unchanged");
    for (const name of oldContracts) frozenHashes.set(name, hash(readFileSync(new URL(name, root))));
  });
  await check("seven stages, old schemas and all non-PB06 definitions equal predecessor", () => {
    assert.equal(candidate.catalogVersion, identity.V19_L2_CATALOG_VERSION);
    assert.equal(candidate.promptBundleVersion, identity.V19_L2_PROMPT_BUNDLE_VERSION);
    assert.equal(candidate.schemaSetVersion, identity.V19_L2_SCHEMA_SET_VERSION);
    assert.equal(candidate.schemaSetVersion, v17.schemaSetVersion);
    assert.equal(candidate.definitions.length, 7);
    for (const old of predecessor.definitions) {
      const next = candidate.definitions.find(stage => stage.stageId === old.stageId);
      if (old.stageId === "PB-06") {
        assert.equal(next.promptVersion, "v9.0.0"); assert.notEqual(next.promptHash, old.promptHash);
        assert.deepEqual(withoutPrompt(next), withoutPrompt(old));
      } else assert.deepEqual(next, old);
    }
    for (const catalog of [v17, v18, predecessor]) assert.equal(catalog.definitions.length, 7);
  });
  await check("PB06 is exactly predecessor title plus the approved temporal insertion", () => {
    const proposal = canonical(read("evals/guidance-quality-r1/gq24-action-consistency/pb06-proposal.md"));
    const inserted = proposal.split("\n---\n")[1].trim();
    const old = canonical(read("lib/assessment/runtime/contracts/pb-06-v17-product-quality-v1.developer.md"));
    const next = canonical(read("lib/assessment/runtime/contracts/pb-06-v19-l2-temporal-action.developer.md"));
    assert.equal(next.split(inserted).length, 2);
    assert.equal(next.replace(`${inserted}\n\n`, "").replace(/^# [^\n]+/u, "# TITLE"), old.replace(/^# [^\n]+/u, "# TITLE"));
    assert.ok(inserted.includes("same message under the same conditions at the same time"));
    assert.ok(inserted.includes("unjustified immediate additional send"));
    assert.ok(inserted.includes("primary direction remains send or reply"));
    for (const forbidden of ["GQ-24", "GQ24", "Output A", "Output B", "Humanは", "expected_direction"]) assert.equal(next.includes(forbidden), false);
  });

  const receiptRoot = "evals/guidance-quality-v19-l1/runs/2026-09-07-authorized-pilot8-v19-l1/internal/31a5eebb-5b54-4ca9-a46b-3e2ec4d32295/";
  const stages = [["PB-01", "025"], ["PB-02", "028"], ["PB-03", "031"], ["PB-04", "034"], ["PB-05", "037"], ["PB-06", "040"]];
  const saved = { caseId: "GQ-24", request: frozen("evals/guidance-quality-wave1/pilot-inputs.json").cases.find(item => item.id === "GQ-24").input, outputs: {} };
  const requests = {};
  for (const [stage, number] of stages) {
    requests[stage] = frozen(`${receiptRoot}call-${number}-request.json`).input;
    saved.outputs[stage] = JSON.parse(frozen(`${receiptRoot}call-${number}-response.json`).outputText);
  }
  const savedPlan = requests["PB-06"].decision_plan, savedReport = requests["PB-06"].report_content;
  const savedVerdict = saved.outputs["PB-06"];
  const savedFacts = structuredClone(requests["PB-06"].base_structured_intake.decision_facts);
  delete savedFacts.user_contact_constraint;
  savedFacts.schema_version = "m2-p4-decision-facts-v2";
  savedFacts.contact_state.proposed_message_present = requests["PB-06"].candidate_envelope.presence;
  const classify = (findings, plan = savedPlan, report = savedReport) => semantics.evaluateSemanticFindingsV7({
    validationOutput: { ...structuredClone(savedVerdict), semantic_checks: structuredClone(findings) },
    decisionPlan: structuredClone(plan), groundedReportContent: structuredClone(report), decisionFacts: structuredClone(savedFacts),
  });
  await check("saved GQ24 actual false-positive finding remains blocking; classifier has no new allow", () => {
    assert.equal(savedVerdict.semantic_checks.length, 1);
    assert.equal(savedVerdict.semantic_checks[0].finding_code, "ACTION_CONSISTENCY");
    assert.equal(savedVerdict.semantic_checks[0].json_path, "decision_plan.change_conditions[1].resulting_direction");
    assert.equal(savedPlan.selected_decision, "reply_now");
    assert.equal(savedPlan.change_conditions[1].resulting_direction, "wait_and_reassess");
    const classified = classify(savedVerdict.semantic_checks);
    assert.equal(classified.blockingFindings.length, 1);
    assert.equal(classified.ignoredTemporalFalsePositives.length, 0);
    evidence.push({ case: "GQ24", kind: "SAVED_ACTUAL_FINDING_RECLASSIFIED_UNEDITED", currentDirection: savedPlan.selected_decision,
      futureDirection: savedPlan.change_conditions[1].resulting_direction, blocking: 1, oldStopLifted: false, actualModelEvaluation: "NOT_RUN" });
  });
  await check("saved PB01-06 replay through successor stops at original finding without any repair output", async () => {
    const repository = new FakeAssessmentRepository(), transport = new FakeAiStageTransport({ outputs: saved.outputs });
    const invoke = transport.invoke.bind(transport);
    transport.invoke = async request => {
      assert.equal(request.attemptNumber ?? 1, 1, "No saved attempt-2 output exists");
      const response = await invoke(request);
      if (request.stageId === "PB-06") {
        assert.deepEqual(request.input.decision_plan, savedPlan);
        assert.deepEqual(request.input.report_content, savedReport);
        assert.equal(classify(response.output.semantic_checks).blockingFindings.length, 1);
        throw new M2RuntimeError("M2_OFFLINE_SAVED_FINDING_STOP");
      }
      return response;
    };
    let count = 0;
    const application = new appModule.AssessmentApplication({ repository, transport, model: "gpt-5.6-luna", definitions: candidate.definitions,
      promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion,
      timeZone: "Asia/Tokyo", now: () => "2026-09-07T10:00:00.000Z", uuid: () => `00000000-0000-4000-8000-${String(++count).padStart(12, "0")}` });
    await rejects(() => application.submit(saved.request, "offline-saved-stop"), "M2_OFFLINE_SAVED_FINDING_STOP");
    assert.deepEqual(transport.calls, stages.map(([stage]) => stage));
    assert.equal(repository.reports.size, 0); noExternal({ transport, repository });
    evidence.push({ case: "GQ24", kind: "RAW_SAVED_STAGE_REPLAY_WITH_EXISTING_BLOCKING_CHECK", stageOutputsRead: 6,
      fakeStageCalls: transport.calls.length, repairOutputs: 0, completedReport: false, preservesHistoricalStop: true });
  });
  const controlled = structuredClone(saved);
  controlled.outputs["PB-06"].semantic_checks = [];
  let controlledReady;
  await check("controlled authored empty PB06 preserves saved GQ24 Plan/Report/projection under L1 and L2", async () => {
    const old = await executeOffline(controlled, predecessor), next = await executeOffline(controlled, candidate);
    noExternal(old); noExternal(next);
    controlledReady = requireReadyAssessmentResult(next.result);
    assert.equal(controlledReady.decision, "reply_now");
    assert.deepEqual(next.result.report.decisionPlan, savedPlan);
    assert.deepEqual(next.result.report.content, savedReport);
    assert.deepEqual(next.result.report, old.result.report);
    assert.deepEqual(next.result.decisionCard, old.result.decisionCard);
    assert.deepEqual(projectCustomerAssessmentV1(next.result, saved.request.requestedTopics), projectCustomerAssessmentV1(old.result, saved.request.requestedTopics));
    assert.deepEqual(projectCustomerAssessmentExperienceV2(next.result, saved.request.requestedTopics), projectCustomerAssessmentExperienceV2(old.result, saved.request.requestedTopics));
    const authority = deriveAuthority(saved);
    assert.equal(sufficiency.evaluateV19L1InputSufficiency(authority.policyInput).state, "full_paid_ready_candidate");
    assert.equal(saved.outputs["PB-01"].base_writing_signals.user_goal_detail.value, "respond_politely");
    const pb06 = next.transport.requests.find(stage => stage.stageId === "PB-06");
    assert.equal(pb06.promptVersion, identity.V19_L2_PB06_PROMPT_VERSION);
    for (const literal of ["expected_semantic_result", "authored_findings", "GQ-24", "GQ24", "Human preference"]) assert.equal(JSON.stringify(pb06.input).includes(literal), false);
    evidence.push({ case: "GQ24", kind: "CONTROLLED_AUTHORED_EMPTY_FINDINGS_NOT_REAL_MODEL_OUTPUT", onlyOverride: "PB06 semantic_checks=[]",
      PlanReportProjectionEqualPredecessor: true, direction: controlledReady.decision, generatedByNewModel: false, actualTemporalDetection: "NOT_TESTED" });
  });

  const originalFixtures = frozen("evals/guidance-quality-r1/gq24-action-consistency/fixtures.json");
  const temporal = json("evals/guidance-quality-v19-l2/fixtures.json");
  await check("original seven preregistered expectations unchanged plus required reply/no-reply negative", () => {
    assert.deepEqual(temporal.fixtures.slice(0, 7), originalFixtures.fixtures);
    assert.equal(temporal.fixtures.length, 8);
    assert.equal(temporal.fixtures[7].id, "REPLY_NOW_AND_DO_NOT_REPLY_NOW");
    assert.equal(temporal.fixtures[7].expected_semantic_result, "FAIL");
    assert.equal(new Set(temporal.fixtures.map(fixture => fixture.id)).size, 8);
    assert.equal(temporal.candidate_temporal_evaluator, "PROMPT_ONLY_UNVALIDATED_WITH_REAL_MODEL");
  });
  for (const fixture of temporal.fixtures) {
    await check(`${fixture.id}: authored finding routing only; fixed semantic expectation`, () => {
      const plan = structuredClone(savedPlan);
      plan.selected_decision = fixture.primary_direction;
      plan.actions_to_take = fixture.temporal_events.map(event => event.instruction);
      assert.equal(classify(fixture.authored_findings, plan).blockingFindings.length, fixture.expected_existing_classifier_blocking);
      // There is no deterministic prose semantics detector here. Empty findings
      // cannot establish that even intentionally contradictory prose is sound.
      assert.equal(classify([], plan).blockingFindings.length, 0);
    });
  }
  await check("policy action_context, fact and boundary evidence never become a broad temporal allow", () => {
    const original = savedVerdict.semantic_checks[0];
    for (const ref of ["policy:action_context", "policy:contact_constraint_policy", "F100"]) {
      const finding = { ...original, evidence_refs: ["policy:decision_policy_result", ref] };
      assert.equal(classify([finding]).blockingFindings.length, 1);
    }
    for (const path of ["decision_plan.selected_decision", "decision_plan.actions_to_take[0]", "decision_plan.aftercare_plan[0].action"]) {
      assert.equal(classify([{ ...original, json_path: path }]).blockingFindings.length, 1);
    }
  });

  for (const caseId of ["GQ-05", "GQ-13", "GQ-29-P3"]) {
    await check(`${caseId}: saved predecessor outcome and Customer projection unchanged`, async () => {
      const fixture = makeStoredFixture(caseId);
      frozenHashes.set(fixture.sourcePath, hash(readFileSync(new URL(fixture.sourcePath, root))));
      const old = await executeOffline(fixture, predecessor), next = await executeOffline(fixture, candidate);
      noExternal(old); noExternal(next);
      assert.deepEqual(next.transport.calls, old.transport.calls);
      assert.equal(next.result.eligibility, fixture.savedSession.finalOutput.eligibility);
      if (caseId === "GQ-05") {
        assert.equal(next.result.eligibility, "needs_more_information");
        assert.equal(next.result.clarification.question, old.result.clarification.question);
        assert.equal(next.result.clarification.question, fixture.savedSession.finalOutput.clarification.question);
        assert.deepEqual(next.result.reasonCodes, old.result.reasonCodes);
        assert.equal(next.transport.calls.length, 3);
      } else {
        const original = requireReadyAssessmentResult(fixture.savedSession.finalOutput);
        for (const replay of [old, next]) {
          assert.deepEqual(replay.result.report, original.report);
          assert.deepEqual(replay.result.decisionCard, original.decisionCard);
          assert.deepEqual(projectCustomerAssessmentV1(replay.result, fixture.request.requestedTopics), projectCustomerAssessmentV1(original, fixture.request.requestedTopics));
          assert.deepEqual(projectCustomerAssessmentExperienceV2(replay.result, fixture.request.requestedTopics), projectCustomerAssessmentExperienceV2(original, fixture.request.requestedTopics));
          assert.equal(["send_now", "reply_now"].includes(replay.result.decision), false);
        }
      }
      evidence.push({ case: caseId, kind: "SAVED_ORIGINAL_OUTPUT_REPLAY", sameOutcomeAndProjection: true,
        unchangedClarification: caseId === "GQ-05", unchangedWarmthOrConcreteText: caseId !== "GQ-05",
        newModelQuality: "NOT_EVALUATED", HumanJudgmentModified: false });
    });
  }

  const edited = makeEditedAcknowledgementFixture();
  const contrasts = [
    ["unanswered outbound follow-up", base => {
      Object.assign(base.decision_facts.latest_direct_message, { sender: "user", kind: "question", user_reply_state: "not_applicable", response_expectation: "reasonable" });
      base.decision_facts.contact_state.unanswered_user_message_count = 1;
      base.base_writing_signals.message_signals = [{ author: "user", status: "sent_by_user" }];
      Object.assign(base.base_writing_signals.incoming_message_profile, { present: false, dialogue_acts: [], response_expectation: "none", closure_signal: "none" });
    }],
    ["explicit no-contact", base => { base.decision_facts.boundary_state = { kind: "no_contact", status: "explicit", repeated_unanswered_contact: false }; }],
    ["repeated unanswered contact", base => { base.decision_facts.boundary_state.repeated_unanswered_contact = true; }],
    ["refused reinvitation", base => {
      base.base_writing_signals.incoming_message_profile.dialogue_acts = ["thanks", "decline"];
      base.base_writing_signals.incoming_message_profile.practical_requirements = ["acknowledge_decline"];
    }],
  ];
  for (const [name, mutation] of contrasts) {
    await check(`${name}: no expansion of acknowledgement exception or allowed action`, () => {
      const authority = deriveAuthority(mutateFixture(edited, mutation));
      assert.equal(policy.classifyV19L1AcknowledgementPurpose(authority.authority), null);
      const current = originalPolicy.buildEffectiveDecisionPolicyV2(authority);
      const next = policy.buildV19L1EffectiveDecisionPolicy(authority);
      assert.deepEqual(helpers.comparableEffectivePolicy(next), helpers.comparableEffectivePolicy(current));
      assert.equal(next.policy.allowed_decisions.some(direction => ["send_now", "reply_now"].includes(direction)), false);
      assert.deepEqual(helpers.comparableSufficiency(sufficiency.evaluateV19L1InputSufficiency(authority.policyInput)),
        helpers.comparableSufficiency(originalSufficiency.evaluateJpy980InputSufficiencyV4(authority.policyInput)));
    });
  }
  await check("Safety blocked intake remains blocked under unchanged predecessor policy", () => {
    const authority = deriveAuthority(saved);
    for (const classification of ["needs_review", "rejected"]) {
      const input = structuredClone(authority.policyInput); input.basePolicyInput.aggregateSafety.classification = classification;
      assert.equal(sufficiency.evaluateV19L1InputSufficiency(input).state, "safety_blocked");
    }
  });
  await check("explicit boundary permits no-send and rejects current or future contact plus draft workaround", () => {
    const contactPolicy = { schema_version: "m2-p4-contact-constraint-policy-v1", constraint_kind: "no_followup_message",
      constraint_status: "explicit", supporting_fact_ids: ["F100"], follow_up_exception: "none", outbound_contact_now_allowed: false,
      outbound_contact_after_time_passage_allowed: false, exception_required_for_future_contact: true };
    const plan = structuredClone(savedPlan);
    Object.assign(plan, { selected_decision: "pause_additional_contact", recommended_message_draft: null, message_draft_edit_metadata: null,
      actions_to_take: ["連絡しないでほしいという境界を尊重して送らない。"], aftercare_plan: [],
      change_conditions: [{ condition: "時間が経っても境界が続いている。", resulting_direction: "pause_additional_contact", supporting_fact_ids: ["F100"] }] });
    const validate = value => constraints.validateDecisionPlanConstraintIntegrityV1({ decisionPlan: value, contactConstraintPolicy: contactPolicy, actionContext: requests["PB-06"].action_context });
    assert.doesNotThrow(() => validate(plan));
    for (const mutate of [value => { value.selected_decision = "send_now"; }, value => { value.change_conditions[0].resulting_direction = "reply_now"; },
      value => { value.recommended_message_draft = { text: "また連絡します。", policy: "later_only", use_timing: "later" }; }]) {
      const changed = structuredClone(plan); mutate(changed);
      assert.throws(() => validate(changed), error => error.safeCode === "M2_PLAN_CONSTRAINT_INTEGRITY_FAILED");
    }
  });

  await check("mixed PB06 identity, bundle relabel and schema mixing reject before execution", async () => {
    for (const [catalog, donor] of [[candidate, predecessor], [predecessor, candidate]]) {
      const mixed = { ...catalog, definitions: catalog.definitions.map(stage => stage.stageId === "PB-06" ? donor.definitions.find(item => item.stageId === "PB-06") : stage) };
      await rejects(() => executeOffline(controlled, mixed), "M2_STAGE_TOPOLOGY_INVALID");
    }
    for (const invalid of [{ ...candidate, promptBundleVersion: predecessor.promptBundleVersion },
      { ...predecessor, promptBundleVersion: candidate.promptBundleVersion }, { ...candidate, schemaSetVersion: v18.schemaSetVersion }]) {
      await rejects(() => executeOffline(controlled, invalid), "M2_STAGE_TOPOLOGY_INVALID");
    }
  });
  await check("candidate purchase preparation is rejected before stages or paid run", async () => {
    const repository = new FakeAssessmentRepository(), transport = new FakeAiStageTransport({ outputs: controlled.outputs });
    const pipeline = new pipelineModule.AssessmentPipeline({ repository, transport, definitions: candidate.definitions, timeZone: "Asia/Tokyo" });
    await rejects(() => pipeline.prepare(controlled.request, { requestId: "00000000-0000-4000-8000-000000000001", runId: "00000000-0000-4000-8000-000000000002",
      model: "gpt-5.6-luna", promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion, startedAt: "2026-09-07T10:00:00.000Z" }), "M2_PRODUCTION_PREPARATION_IDENTITY_INVALID");
    assert.equal(transport.calls.length, 0); assert.equal(repository.runs.size, 0); noExternal({ repository, transport });
  });
  await check("old required-now draft and schema constraints remain enforced", async () => {
    for (const mutate of [plan => { plan.recommended_message_draft = null; plan.message_draft_edit_metadata = null; },
      plan => { plan.schema_version = "guidance-decision-plan-v1"; }, plan => { plan.actions_to_avoid = []; }]) {
      const fixture = structuredClone(controlled); mutate(fixture.outputs["PB-04"]);
      await rejects(() => executeOffline(fixture, candidate), "M2_STAGE_SCHEMA_INVALID");
    }
  });
  await check("critical fact integrity and technical failures cannot produce ready", async () => {
    const fixture = structuredClone(controlled);
    fixture.outputs["PB-06"].semantic_checks = [{ finding_code: "FACT_FIDELITY", severity: "critical", json_path: "report_content.decision_reason_summary", evidence_refs: [], detail: "Authored critical fact contradiction for fail-closed routing; not detector output." }];
    await rejects(() => executeOffline(fixture, candidate), "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
    await rejects(() => executeOffline(controlled, candidate, { failAtStage: "PB-05" }), "M2_FAKE_STAGE_FAILURE");
  });
  await check("critical same-time contradiction exhausts with no Report and no attempt 3", async () => {
    const fixture = structuredClone(controlled);
    fixture.outputs["PB-04"].actions_to_take[0] = "今、この一通を返信する。同じ今、同じ一通を返信しない。";
    fixture.outputs["PB-06"].semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity: "critical", json_path: "decision_plan.actions_to_take[0]",
      evidence_refs: ["policy:action_context", "policy:decision_policy_result"], detail: "Authored same-time same-message reply/no-reply contradiction remains after one repair." }];
    for (const catalog of [predecessor, candidate]) {
      const replay = await captureOfflineFailure(fixture, catalog);
      noExternal(replay); assert.equal(replay.result, null);
      assert.equal(replay.error?.safeCode, "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
      assert.equal(replay.repository.reports.size, 0);
      for (const stage of ["PB-04", "PB-05", "PB-06"]) assert.equal(replay.transport.calls.filter(item => item === stage).length, 2);
    }
  });
  await check("known inherited F007 limit: repeated major contradiction can survive exhaustion unchanged", async () => {
    const fixture = structuredClone(controlled);
    fixture.outputs["PB-04"].actions_to_take[0] = "今、この一通を返信する。同じ今、同じ一通を返信しない。";
    fixture.outputs["PB-06"].semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity: "major", json_path: "decision_plan.actions_to_take[0]",
      evidence_refs: ["policy:action_context", "policy:decision_policy_result"], detail: "Authored same-time same-message contradiction retained after repair; known-limit reproduction, not acceptable Product output." }];
    const outcomes = [];
    for (const catalog of [predecessor, candidate]) {
      const replay = await executeOffline(fixture, catalog); noExternal(replay);
      assert.equal(replay.result.eligibility, "ready");
      assert.equal(replay.result.report.decisionPlan.actions_to_take[0], fixture.outputs["PB-04"].actions_to_take[0]);
      for (const stage of ["PB-04", "PB-05", "PB-06"]) assert.equal(replay.transport.calls.filter(item => item === stage).length, 2);
      outcomes.push({ eligibility: replay.result.eligibility, unresolvedAuthoredContradiction: true, pb06Calls: 2 });
    }
    assert.deepEqual(outcomes[0], outcomes[1]);
    evidence.push({ kind: "KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS", finding: "ACTION_CONSISTENCY/major/current action",
      source: "quality-reassessment-v2.ts:160-183", unchangedFromPredecessor: true, contradictionRetainedAfterOneRepair: true,
      boundary: "Initial semantic blocking is retained. Existing final exhaustion can deliver major findings. No classifier change or F007 resolution is claimed.",
      evaluatorFixtures: "Hand-authored Plan contradiction and repeated finding, not real model output", newApiCalls: 0 });
  }, "KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS");
  await check("existing pilot receipt check stops first major or critical contradiction before repair", () => {
    const definition = candidate.definitions.find(stage => stage.stageId === "PB-06");
    const request = { ...definition, input: structuredClone(requests["PB-06"]) };
    request.input.decision_plan.actions_to_take[0] = "今、この一通を返信する。同じ今、同じ一通を返信しない。";
    for (const severity of ["major", "critical"]) {
      const verdict = structuredClone(controlled.outputs["PB-06"]);
      verdict.semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity, json_path: "decision_plan.actions_to_take[0]",
        evidence_refs: ["policy:action_context", "policy:decision_policy_result"], detail: "Authored same-time same-message contradiction for existing pilot STOP verification only." }];
      const review = reviewStage(request, verdict, definition, saved.request);
      assert.equal(review.stopReason, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING");
      assert.equal(review.findings.length, 1);
    }
    const savedReview = reviewStage({ ...definition, input: requests["PB-06"] }, savedVerdict, definition, saved.request);
    assert.equal(savedReview.stopReason, "MATERIAL_SAFETY_OR_INTEGRITY_FINDING");
    evidence.push({ kind: "EXISTING_PILOT_INITIAL_FINDING_STOP", majorAndCritical: true, oldFalsePositiveAlsoStops: true,
      productionExhaustionFixed: false, newApiCalls: 0 });
  });
  await check("controlled report-only repair runs once and preserves original reply", async () => {
    const verdict = structuredClone(controlled.outputs["PB-06"]);
    verdict.semantic_checks = [{ finding_code: "TEMPLATE_GENERICITY", severity: "major", json_path: "report_content.cover_line", evidence_refs: [], detail: "Authored repair routing fixture, not model detection." }];
    const replay = await executeOffline(controlled, candidate, { outputSequence: { "PB-06": [verdict, controlled.outputs["PB-06"]] } });
    noExternal(replay); assert.equal(replay.result.eligibility, "ready");
    assert.equal(replay.transport.calls.filter(stage => stage === "PB-04").length, 1);
    for (const stage of ["PB-05", "PB-06"]) assert.equal(replay.transport.calls.filter(item => item === stage).length, 2);
    assert.deepEqual(replay.result.report, controlledReady.report);
  });
  await check("controlled authored contradiction finding keeps Plan repair and at most one repair cycle", async () => {
    const verdict = structuredClone(controlled.outputs["PB-06"]);
    verdict.semantic_checks = structuredClone(temporal.fixtures.find(fixture => fixture.id === "REPLY_NOW_AND_DO_NOT_REPLY_NOW").authored_findings);
    const replay = await executeOffline(controlled, candidate, { outputSequence: { "PB-06": [verdict, controlled.outputs["PB-06"]] } });
    noExternal(replay); assert.equal(replay.result.eligibility, "ready");
    for (const stage of ["PB-04", "PB-05", "PB-06"]) assert.equal(replay.transport.calls.filter(item => item === stage).length, 2);
    assert.equal(replay.transport.requests.filter(stage => stage.stageId === "PB-04")[1].input.quality_reassessment_directive.scope, "plan_and_report");
    assert.deepEqual(replay.result.report, controlledReady.report);
  });
  await check("saved evidence and old source hashes unchanged; network calls zero", () => {
    for (const [relative, digest] of frozenHashes) assert.equal(hash(readFileSync(new URL(relative, root))), digest);
    assert.equal(forbiddenNetworkCalls, 0);
  });

  const summary = { schemaVersion: "guidance-v19-l2-offline-verification-v1", baseline: BASELINE,
    candidate: { catalog: candidate.catalogVersion, promptBundle: candidate.promptBundleVersion, schemaSet: candidate.schemaSetVersion,
      stageHashes: candidate.definitions.map(({ stageId, promptHash, schemaHash }) => ({ stageId, promptHash, schemaHash })) },
    evidenceKind: "offline_contracts_stored_replay_and_authored_findings", realApiCalls: 0, actualProviderCalls: 0, actualDatabaseCalls: 0,
    forbiddenNetworkCalls, newPb06ModelEvaluation: "NOT_RUN", modelTemporalDetectionValidated: false, oldStopLifted: false,
    abortedPilotComparisonAuthority: "DIAGNOSTIC_ONLY_INCOMPLETE", HumanJudgmentsChanged: false, mappingDisclosed: false,
    temporalFixtures: temporal.fixtures.length, protectedFilesHashed: frozenHashes.size,
    contractAndReplayChecks: results.filter(item => !item.name.startsWith("known inherited F007 limit:")).length,
    knownLimitationDiagnostics: results.filter(item => item.name.startsWith("known inherited F007 limit:")).length,
    checks: results.length, passed: results.filter(item => item.status === "PASS").length, failed: results.filter(item => item.status === "FAIL").length,
    results, evidence };
  writeFileSync(new URL("verification-results.json", directory), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`V19-L2 OFFLINE ${summary.failed ? "FAIL" : "CHECKS_COMPLETE"}: ${summary.passed} PASS, ${summary.knownLimitationDiagnostics} known limitation, ${summary.failed} FAIL; real API/Provider/DB=0; new PB06 semantics unvalidated`);
  if (summary.failed) process.exitCode = 1;
} finally {
  globalThis.fetch = previousFetch;
}
