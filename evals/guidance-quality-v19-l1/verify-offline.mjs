import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { loadV19L1StageCatalog } from "../../lib/assessment/runtime/v19-l1-stage-catalog.ts";
import { V19_L1_CATALOG_VERSION, V19_L1_PROMPT_BUNDLE_VERSION, V19_L1_SCHEMA_SET_VERSION } from "../../lib/assessment/runtime/v19-l1-runtime-identity.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../../lib/assessment/runtime/schema-catalog.ts";
import { loadGuidanceQualityWave1StageCatalog } from "../../lib/assessment/runtime/guidance-stage-catalog-v1.ts";
import { evaluateJpy980InputSufficiencyV4 } from "../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts";
import { buildEffectiveDecisionPolicyV2 } from "../../lib/assessment/runtime/effective-decision-policy-v2.ts";
import { evaluateV19L1InputSufficiency, buildV19L1EffectiveDecisionPolicy, classifyV19L1AcknowledgementPurpose } from "../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts";
import { projectCustomerAssessmentV1 } from "../../lib/assessment/runtime/customer-assessment-projection-v1.ts";
import { projectCustomerAssessmentExperienceV2 } from "../../lib/assessment/runtime/customer-assessment-experience-projection-v2.ts";
import { requireReadyAssessmentResult } from "../../lib/assessment/runtime/runtime-result-normalization-v1.ts";
import { validateStageOutput } from "../../lib/assessment/runtime/validation.ts";
import { evaluateDraftSourceIntegrityV2 } from "../../lib/assessment/runtime/draft-source-integrity-v2.ts";
import { AssessmentApplication } from "../../lib/assessment/runtime/application.ts";
import { AssessmentPipeline } from "../../lib/assessment/runtime/pipeline.ts";
import { FakeAssessmentRepository, FakeAiStageTransport } from "../../lib/assessment/runtime/fakes.ts";
import { createOpaqueClarificationIdV1, clarificationSourceIdentityV1, validateClarificationAnswerV1 } from "../../lib/assessment/runtime/clarification-evidence-v1.ts";
import { makeRuntimeFixture } from "../guidance-quality-wave1/runtime-fixtures.mjs";
import { BASELINE, RUN_ROOT, STORED_REPLAY_PROVENANCE, EDITED_FIXTURE_PROVENANCE, OPTIONAL_REASON, makeStoredFixture, deriveAuthority, mutateFixture, makeEditedAcknowledgementFixture, executeOffline, comparableSufficiency, comparableEffectivePolicy } from "./fixtures.mjs";

const baseline = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
const candidate = await loadV19L1StageCatalog();
const checks = [];
const evidence = [];
const check = async (name, action) => {
  try { await action(); checks.push({ name, status: "PASS" }); console.log(`PASS ${checks.length} ${name}`); }
  catch (error) { checks.push({ name, status: "FAIL", error: error.safeCode ?? error.message }); console.error(`FAIL ${checks.length} ${name}: ${error.safeCode ?? error.message}`); }
};
const withoutPrompt = (definition) => {
  const rest = structuredClone(definition);
  delete rest.promptVersion; delete rest.promptHash; delete rest.developerPrompt;
  return rest;
};
const failuresWithCode = (action, code) => assert.rejects(action, (error) => error.safeCode === code);
const zeroExternal = (execution) => {
  assert.equal(execution.transport.actualProviderCalls, 0);
  assert.equal(execution.repository.actualSupabaseCalls, 0);
};
const policies = (fixture) => {
  const a = deriveAuthority(fixture);
  return { ...a, currentInput: evaluateJpy980InputSufficiencyV4(a.policyInput), candidateInput: evaluateV19L1InputSufficiency(a.policyInput),
    currentPolicy: buildEffectiveDecisionPolicyV2(a), candidatePolicy: buildV19L1EffectiveDecisionPolicy(a) };
};
const sameAsV17 = (fixture) => {
  const result = policies(fixture);
  assert.deepEqual(comparableSufficiency(result.candidateInput), comparableSufficiency(result.currentInput));
  assert.deepEqual(comparableEffectivePolicy(result.candidatePolicy), comparableEffectivePolicy(result.currentPolicy));
  return result;
};

await check("frozen inputs, pilot evidence, V17/V18 contracts and protected policy sources unchanged", () => {
  const paths = ["evals/guidance-quality-r1/cases.json", "evals/guidance-quality-wave1/pilot-inputs.json", RUN_ROOT,
    "lib/assessment/production/application-runtime.ts", "lib/assessment/runtime/contracts/runtime-stage-catalog-v17.json", "lib/assessment/runtime/contracts/runtime-stage-catalog-v18.json",
    "lib/assessment/runtime/contracts/pb-01-clarification-aware-v1.developer.md", "lib/assessment/runtime/contracts/pb-04-v17-product-recovery-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-05-v17-customer-product-v1.developer.md", "lib/assessment/runtime/contracts/pb-06-v17-product-quality-v1.developer.md",
    "lib/assessment/runtime/contracts/pb-04-v18-guidance-wave1.developer.md", "lib/assessment/runtime/contracts/pb-05-v18-guidance-wave1.developer.md", "lib/assessment/runtime/contracts/pb-06-v18-guidance-wave1.developer.md",
    "lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts", "lib/assessment/runtime/effective-decision-policy-v2.ts", "lib/assessment/runtime/quality-reassessment-v2.ts"];
  execFileSync("git", ["diff", "--exit-code", BASELINE, "--", ...paths], { encoding: "utf8" });
});
await check("V19 identity and all schemas remain V17; only PB01 and necessary PB05 timing wording change", () => {
  assert.equal(candidate.catalogVersion, V19_L1_CATALOG_VERSION);
  assert.equal(candidate.promptBundleVersion, V19_L1_PROMPT_BUNDLE_VERSION);
  assert.equal(candidate.schemaSetVersion, V19_L1_SCHEMA_SET_VERSION);
  assert.equal(candidate.schemaSetVersion, baseline.schemaSetVersion);
  assert.equal(candidate.definitions.length, 7);
  for (const old of baseline.definitions) {
    const next = candidate.definitions.find((item) => item.stageId === old.stageId);
    if (["PB-01", "PB-05"].includes(old.stageId)) { assert.notEqual(next.promptHash, old.promptHash); assert.deepEqual(withoutPrompt(next), withoutPrompt(old)); }
    else assert.deepEqual(next, old);
  }
});
await check("PB05 successor changes only title and newly generated draft timing phrase", () => {
  const current = baseline.definitions.find((stage) => stage.stageId === "PB-05").developerPrompt;
  const next = candidate.definitions.find((stage) => stage.stageId === "PB-05").developerPrompt;
  const body = (prompt) => prompt.replace(/^# PB-05[^\r\n]*$/m, "# PB-05 TITLE").replaceAll("\r\n", "\n");
  assert.ok(current.includes("newly generated future-use copy"));
  assert.equal(body(next), body(current).replace("newly generated future-use copy", "newly generated copy for the Plan-authorized use_timing (now or later)"));
  // Static contract consistency only; no claim that a model follows the prompt.
});
await check("candidate purpose adapters do not import V18 helpers", () => {
  const source = readFileSync("lib/assessment/runtime/v19-l1-acknowledgement-policy.ts", "utf8");
  for (const path of ["guidance-communication-purpose-v1", "jpy980-input-sufficiency-policy-v5", "effective-decision-policy-v3"]) assert.equal(source.includes(`from \"./${path}.ts\"`), false);
});

for (const runtime of ["runtime-stage-catalog-v17.0.0", "runtime-stage-catalog-v18.0.0"]) {
  await check(`saved GQ24 ${runtime}: root cause survives unchanged extraction`, async () => {
    const fixture = makeStoredFixture("GQ-24", runtime);
    const p = sameAsV17(fixture);
    assert.equal(p.currentInput.state, "needs_one_clarifying_answer");
    assert.deepEqual(p.currentInput.missingMaterialDimensions, ["usable_action_context"]);
    assert.deepEqual(p.currentPolicy.policy.allowed_decisions, ["wait_and_reassess"]);
    assert.equal(classifyV19L1AcknowledgementPurpose(p.authority), null);
    const replay = await executeOffline(fixture, candidate); zeroExternal(replay);
    assert.equal(replay.result.eligibility, fixture.savedSession.finalOutput.eligibility);
    assert.equal(replay.result.clarification.question, fixture.savedSession.finalOutput.clarification.question);
    assert.equal(replay.transport.calls.length, 3);
    evidence.push({ caseId: "GQ-24", sourcePath: fixture.sourcePath, provenance: STORED_REPLAY_PROVENANCE,
      replay: "unchanged_saved_taxonomy_still_clarifies", actualModelRuns: 0 });
  });
  await check(`GQ24 ${runtime}: taxonomy-only change still needs both V17 adapters`, () => {
    const fixture = mutateFixture(makeStoredFixture("GQ-24", runtime), (base) => {
      base.base_writing_signals.user_goal_detail = { value: "respond_politely", basis: "current_situation_explicit" };
    });
    const p = policies(fixture);
    assert.equal(p.currentInput.state, "needs_one_clarifying_answer");
    assert.deepEqual(p.currentPolicy.policy.allowed_decisions, ["wait_and_reassess"]);
    assert.equal(p.candidateInput.state, "full_paid_ready_candidate");
    assert.deepEqual(p.candidatePolicy.policy.allowed_decisions, ["reply_now"]);
    assert.equal(p.candidatePolicy.policy.message_draft_policy, "required_now");
    assert.equal(p.base.decision_facts.latest_direct_message.response_expectation, "optional");
    assert.equal(p.base.base_writing_signals.incoming_message_profile.response_expectation, "optional");
  });
}

const edited = makeEditedAcknowledgementFixture();
let editedReady;
await check("edited GQ24 completes six fake stages with V17 Plan/Report/card and optional prose", async () => {
  const execution = await executeOffline(edited, candidate); zeroExternal(execution);
  assert.equal(execution.result.eligibility, "ready");
  assert.deepEqual(execution.transport.calls, ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]);
  editedReady = requireReadyAssessmentResult(execution.result);
  assert.equal(editedReady.decision, "reply_now");
  assert.equal(editedReady.report.schemaVersion, "m2-p4-split-runtime-report-v1");
  assert.equal(editedReady.report.decisionPlan.schema_version, "pipeline-schema-v2.0.0");
  assert.equal(editedReady.decisionCard.schemaVersion, "m2-p3-decision-card-v1");
  const projection = projectCustomerAssessmentV1(editedReady, edited.request.requestedTopics);
  assert.equal(projection.primaryReason, OPTIONAL_REASON);
  assert.equal(projection.finalDraft.text, "ありがとう。またね。");
  assert.equal(editedReady.report.decisionPlan.message_draft_edit_metadata.source_status, "generated_without_candidate");
  assert.equal(editedReady.report.decisionPlan.message_draft_edit_metadata.preserved_meaning, false);
  for (const stageId of ["PB-04", "PB-05", "PB-06"]) {
    const input = execution.transport.requests.find((request) => request.stageId === stageId).input;
    assert.equal(input.effective_assessment_authority.effectiveDecisionContext.decisionFacts.latest_direct_message.response_expectation, "optional");
    if (stageId !== "PB-05") assert.equal(input.decision_policy_result.reason_codes[0], "optional_thanks_reply_without_response_obligation");
    else assert.equal(input.decision_plan.selected_decision, "reply_now");
  }
  evidence.push({ caseId: "GQ-24", provenance: EDITED_FIXTURE_PROVENANCE, stagesCompleted: 6, clarification: false, primaryDecision: "reply_now",
    optionalityTextRetained: projection.primaryReason, actualModelRuns: 0, actualSemanticDetection: "NOT_TESTED" });
});

for (const caseId of ["GQ-05", "GQ-13", "GQ-29-P3"]) {
  await check(`${caseId}: saved V17 outputs replay identically through V17 and V19`, async () => {
    const fixture = makeStoredFixture(caseId);
    sameAsV17(fixture);
    const current = await executeOffline(fixture, baseline), next = await executeOffline(fixture, candidate);
    zeroExternal(current); zeroExternal(next);
    assert.equal(next.result.eligibility, fixture.savedSession.finalOutput.eligibility);
    assert.deepEqual(next.transport.calls, current.transport.calls);
    if (caseId === "GQ-05") {
      for (const replay of [current, next]) {
        assert.equal(replay.result.eligibility, "needs_more_information");
        assert.equal(replay.result.clarification.question, fixture.savedSession.finalOutput.clarification.question);
        assert.deepEqual(replay.result.reasonCodes, fixture.savedSession.finalOutput.reasonCodes);
      }
      evidence.push({ caseId, sourcePath: fixture.sourcePath, provenance: STORED_REPLAY_PROVENANCE, preserved: "same clarification; Human tie/no issues retained", newQualityJudgment: "NONE" });
    } else {
      const saved = requireReadyAssessmentResult(fixture.savedSession.finalOutput);
      for (const replay of [current, next]) {
        assert.deepEqual(replay.result.report, saved.report);
        assert.deepEqual(replay.result.decisionCard, saved.decisionCard);
        assert.equal(replay.result.decision, saved.decision);
        assert.deepEqual(projectCustomerAssessmentV1(replay.result, fixture.request.requestedTopics), projectCustomerAssessmentV1(saved, fixture.request.requestedTopics));
        assert.deepEqual(projectCustomerAssessmentExperienceV2(replay.result, fixture.request.requestedTopics), projectCustomerAssessmentExperienceV2(saved, fixture.request.requestedTopics));
      }
      evidence.push({ caseId, sourcePath: fixture.sourcePath, provenance: STORED_REPLAY_PROVENANCE,
        preserved: "exact saved Plan/Report/card/base projection/experience projection",
        unchangedOpening: saved.report.content.short_letter,
        unchangedCurrentActions: saved.report.decisionPlan.actions_to_take,
        unchangedPeriodPlan: saved.report.decisionPlan.aftercare_plan,
        warmthOrConcretenessScore: "NOT_AUTOMATICALLY_SCORED; text equality only", actualModelRuns: 0 });
    }
  });
}

const contrasts = [
  ["goal other", (base) => { base.base_writing_signals.user_goal_detail = { value: "other", basis: "current_situation_explicit" }; }],
  ["goal unknown", (base) => { base.base_writing_signals.user_goal_detail = { value: "unknown", basis: "unresolved" }; }],
  ["goal chip only", (base) => { base.base_writing_signals.user_goal_detail.basis = "requested_topics"; }],
  ...["clarify_relationship", "express_affection", "end_contact", "move_closer"].map((value) => [`goal ${value}`, (base) => { base.base_writing_signals.user_goal_detail.value = value; }]),
  ["reply already sent", (base) => { base.decision_facts.latest_direct_message.user_reply_state = "replied"; }],
  ["own outbound follow-up even with polite goal", (base) => {
    Object.assign(base.decision_facts.latest_direct_message, { sender: "user", kind: "question", user_reply_state: "not_applicable", response_expectation: "reasonable" });
    base.decision_facts.contact_state.unanswered_user_message_count = 1;
    base.base_writing_signals.message_signals = [{ author: "user", status: "sent_by_user" }];
    Object.assign(base.base_writing_signals.incoming_message_profile, { present: false, dialogue_acts: [], response_expectation: "none", closure_signal: "none" });
  }],
  ["explicit response not needed is none, not optional", (base) => {
    base.decision_facts.latest_direct_message.response_expectation = "none";
    base.base_writing_signals.incoming_message_profile.response_expectation = "none";
  }],
  ["explicit no-contact refusal even with polite goal", (base) => {
    base.decision_facts.boundary_state = { kind: "no_contact", status: "explicit", repeated_unanswered_contact: false };
  }],
  ["refused reinvitation even with polite goal", (base) => {
    base.base_writing_signals.incoming_message_profile.dialogue_acts = ["thanks", "decline"];
    base.base_writing_signals.incoming_message_profile.practical_requirements = ["acknowledge_decline"];
  }],
  ["user business-only contact constraint", (base, request) => {
    request.currentSituation += " 自分からの連絡は仕事の用件だけにするつもりです。";
    base.observed_facts.push({ fact_id: "F900", statement: "ユーザーは自分からの連絡を仕事の用件に限っている。", source_refs: ["input:current_situation"], support: "explicit" });
    base.decision_facts.user_contact_constraint = { kind: "business_only", status: "explicit", supporting_fact_ids: ["F900"] };
    base.base_writing_signals.explicit_user_constraints = [{ kind: "no_private_contact_at_work", bounded_summary: null }];
  }],
  ["SNS-only signal", (base) => { base.decision_facts.latest_direct_message.sns_signal_only = true; }],
  ["explicit closure", (base) => { base.base_writing_signals.incoming_message_profile.closure_signal = "explicit"; }],
  ["unknown closure", (base) => { base.base_writing_signals.incoming_message_profile.closure_signal = "unknown"; }],
  ...["decline", "hold", "boundary", "affection_expression", "other", "unknown"].map((act) => [`incoming ${act}`, (base) => { base.base_writing_signals.incoming_message_profile.dialogue_acts = ["thanks", act]; }]),
  ["no thanks act", (base) => { base.base_writing_signals.incoming_message_profile.dialogue_acts = ["conversation_closure"]; }],
  ["pending outbound count", (base) => { base.decision_facts.contact_state.unanswered_user_message_count = 1; }],
  ["repeated unanswered contact", (base) => { base.decision_facts.boundary_state.repeated_unanswered_contact = true; }],
  ["practical need exists", (base) => { base.decision_facts.practical_reason = { kind: "thank_you", active: true, deadline: "none" }; }],
  ["additional requested period", (base, request) => { request.requestedTopics.push("next_three_days"); base.decision_facts.selected_requests = [...request.requestedTopics]; }],
  ...["no_followup_message", "no_private_contact_at_work", "no_self_invitation"].map((kind) => [`user constraint ${kind}`, (base) => { base.base_writing_signals.explicit_user_constraints = [{ kind, bounded_summary: null }]; }]),
];
for (const [name, mutation] of contrasts) {
  await check(`structured negative contrast: ${name} delegates to V17`, () => {
    const p = sameAsV17(mutateFixture(edited, mutation));
    assert.equal(classifyV19L1AcknowledgementPurpose(p.authority), null);
  });
}
await check("thanks plus a question remains the existing reasonable-reply path", () => {
  const fixture = mutateFixture(edited, (base) => {
    base.decision_facts.latest_direct_message.kind = "question";
    base.decision_facts.latest_direct_message.response_expectation = "reasonable";
    Object.assign(base.base_writing_signals.incoming_message_profile, { dialogue_acts: ["thanks", "question"], unanswered_obligations: ["question"], practical_requirements: ["answer_question"], closure_signal: "none", response_expectation: "reasonable" });
  });
  const p = sameAsV17(fixture);
  assert.equal(p.currentInput.state, "full_paid_ready_candidate");
  assert.deepEqual(p.currentPolicy.policy.allowed_decisions, ["reply_now"]);
});
await check("style-only constraints retain optional-thanks eligibility", () => {
  for (const kind of ["keep_polite_register", "keep_casual_register", "no_emoji"]) {
    const p = policies(mutateFixture(edited, (base) => { base.base_writing_signals.explicit_user_constraints = [{ kind, bounded_summary: null }]; }));
    assert.equal(p.candidateInput.state, "full_paid_ready_candidate");
  }
});
await check("Safety needs_review/rejected preserve V17 blocked outcome", () => {
  const p = deriveAuthority(edited);
  for (const classification of ["needs_review", "rejected"]) {
    const input = structuredClone(p.policyInput); input.basePolicyInput.aggregateSafety.classification = classification;
    assert.equal(evaluateV19L1InputSufficiency(input).state, "safety_blocked");
    assert.deepEqual(comparableSufficiency(evaluateV19L1InputSufficiency(input)), comparableSufficiency(evaluateJpy980InputSufficiencyV4(input)));
  }
});
await check("purpose guard rejects candidate presence and used clarification authority", () => {
  const { authority } = deriveAuthority(edited);
  const withCandidate = structuredClone(authority); withCandidate.effectiveWritingContext.candidateEnvelope.presence = true;
  const withClarification = structuredClone(authority); withClarification.clarificationAuthorityRef = "clarification:synthetic:answer:1";
  assert.equal(classifyV19L1AcknowledgementPurpose(withCandidate), null);
  assert.equal(classifyV19L1AcknowledgementPurpose(withClarification), null);
  // Deliberately only a matcher guard test: these mutated authority objects are not full valid source fixtures.
});

await check("wrong direction remains rejected by deterministic policy", async () => {
  const fixture = structuredClone(edited);
  fixture.outputs["PB-04"] = makeStoredFixture("GQ-29-P3").outputs["PB-04"];
  await failuresWithCode(() => executeOffline(fixture, candidate), "M2_PLAN_POLICY_VIOLATION");
});
await check("send/reply still requires an immediate draft; V18 zero-avoid contract is not inherited", async () => {
  for (const mutation of [
    (plan) => { plan.recommended_message_draft = null; plan.message_draft_edit_metadata = null; },
    (plan) => { plan.actions_to_avoid = []; },
    (plan) => { plan.schema_version = "guidance-decision-plan-v1"; },
  ]) {
    const fixture = structuredClone(edited); mutation(fixture.outputs["PB-04"]);
    await failuresWithCode(() => executeOffline(fixture, candidate), "M2_STAGE_SCHEMA_INVALID");
  }
});
await check("known inherited integrity limit: generated-draft preservation claim remains after one repair", async () => {
  const trace = [];
  for (const catalog of [baseline, candidate]) {
    const fixture = makeRuntimeFixture("GQ-03", { candidate: false, detailed: true });
    fixture.outputs["PB-04"].message_draft_edit_metadata.preserved_meaning = true;
    const localDefects = evaluateDraftSourceIntegrityV2({ candidateEnvelope: fixture.candidateEnvelope,
      optionalMessage: null, requestedTopics: fixture.request.requestedTopics,
      decisionPolicy: { message_draft_policy: "required_now" }, decisionPlan: fixture.outputs["PB-04"] });
    assert.equal(localDefects[0].findingCode, "DRAFT_SOURCE_INTEGRITY");
    assert.equal(localDefects[0].normalizedRepairRequirementCode, "RESTORE_TRUTHFUL_GENERATED_DRAFT_METADATA");
    const replay = await executeOffline(fixture, catalog); zeroExternal(replay);
    assert.equal(replay.result.eligibility, "ready");
    assert.equal(replay.result.report.decisionPlan.message_draft_edit_metadata.preserved_meaning, true);
    assert.equal(replay.transport.calls.filter((stage) => stage === "PB-04").length, 2);
    const directive = replay.transport.requests.filter((stage) => stage.stageId === "PB-04")[1].input.quality_reassessment_directive;
    assert.equal(directive.scope, "plan_and_report");
    assert.equal(directive.defects[0].normalizedRepairRequirementCode, "RESTORE_TRUTHFUL_GENERATED_DRAFT_METADATA");
    trace.push({ catalog: catalog.catalogVersion, localDefects, actualRepairDirective: directive,
      finalPreservedMeaning: replay.result.report.decisionPlan.message_draft_edit_metadata.preserved_meaning, finalEligibility: replay.result.eligibility });
  }
  evidence.push({ caseId: "GQ-03", provenance: "Injected invalid preservation metadata with fake PB06; no model call.",
    knownLimitation: "V17 and V19 both retain generated_without_candidate + preserved_meaning=true after one Plan repair and reach ready.",
    status: "KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS", scope: "Existing integrity/disposition behavior; no F007 classifier or F008 recovery change.", trace });
});
await check("existing report-only repair retains the optional-prose fixture", async () => {
  const verdict = structuredClone(edited.outputs["PB-06"]);
  verdict.semantic_checks = [{ finding_code: "TEMPLATE_GENERICITY", severity: "major", json_path: "report_content.cover_line", evidence_refs: [], detail: "Injected finding; detector quality is not tested." }];
  const replay = await executeOffline(edited, candidate, { outputSequence: { "PB-06": [verdict, edited.outputs["PB-06"]] } }); zeroExternal(replay);
  assert.equal(replay.result.eligibility, "ready");
  assert.equal(replay.transport.calls.filter((stage) => stage === "PB-04").length, 1);
  assert.equal(replay.transport.calls.filter((stage) => stage === "PB-05").length, 2);
  assert.equal(replay.transport.calls.filter((stage) => stage === "PB-06").length, 2);
  assert.equal(projectCustomerAssessmentV1(replay.result, edited.request.requestedTopics).primaryReason, OPTIONAL_REASON);
});
await check("existing combined Plan/Report repair succeeds once and retains optionality", async () => {
  const verdict = structuredClone(edited.outputs["PB-06"]);
  verdict.semantic_checks = [{ finding_code: "ACTION_CONSISTENCY", severity: "critical", json_path: "decision_plan.actions_to_take[0]", evidence_refs: [], detail: "Injected repair-path fixture; actual detection not tested." }];
  const replay = await executeOffline(edited, candidate, { outputSequence: { "PB-06": [verdict, edited.outputs["PB-06"]] } }); zeroExternal(replay);
  assert.equal(replay.result.eligibility, "ready");
  for (const stage of ["PB-04", "PB-05", "PB-06"]) assert.equal(replay.transport.calls.filter((item) => item === stage).length, 2);
  const directive = replay.transport.requests.filter((request) => request.stageId === "PB-04")[1].input.quality_reassessment_directive;
  assert.equal(directive.scope, "plan_and_report");
  assert.equal(replay.result.decision, "reply_now");
  assert.equal(projectCustomerAssessmentV1(replay.result, edited.request.requestedTopics).primaryReason, OPTIONAL_REASON);
});
await check("injected critical integrity findings and technical failures remain failures", async () => {
  const fixture = structuredClone(edited);
  fixture.outputs["PB-06"].semantic_checks = [{ finding_code: "FACT_FIDELITY", severity: "critical", json_path: "report_content.decision_reason_summary", evidence_refs: [], detail: "Injected finding; detector quality is not tested." }];
  await failuresWithCode(() => executeOffline(fixture, candidate), "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  await failuresWithCode(() => executeOffline(edited, candidate, { failAtStage: "PB-05" }), "M2_FAKE_STAGE_FAILURE");
});
await check("V19 catalog cannot be relabeled as V17 or mixed with V18", async () => {
  const v18 = await loadGuidanceQualityWave1StageCatalog();
  for (const catalog of [
    { ...candidate, promptBundleVersion: baseline.promptBundleVersion },
    { ...baseline, promptBundleVersion: candidate.promptBundleVersion },
    { ...v18, promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion },
    { ...candidate, schemaSetVersion: v18.schemaSetVersion },
  ]) await failuresWithCode(() => executeOffline(edited, catalog), "M2_STAGE_TOPOLOGY_INVALID");
});
await check("swapping only PB05 between V17 and V19 is rejected in both directions", async () => {
  for (const [catalog, donor] of [[candidate, baseline], [baseline, candidate]]) {
    const mixed = { ...catalog, definitions: catalog.definitions.map((stage) => stage.stageId === "PB-05" ? donor.definitions.find((item) => item.stageId === "PB-05") : stage) };
    await failuresWithCode(() => executeOffline(edited, mixed), "M2_STAGE_TOPOLOGY_INVALID");
  }
});
await check("V19 purchase preparation rejects before any fake stage or paid run", async () => {
  const repository = new FakeAssessmentRepository(), transport = new FakeAiStageTransport({ outputs: edited.outputs });
  const pipeline = new AssessmentPipeline({ repository, transport, definitions: candidate.definitions, timeZone: "Asia/Tokyo" });
  await failuresWithCode(() => pipeline.prepare(edited.request, {
    requestId: "00000000-0000-4000-8000-000000000001", runId: "00000000-0000-4000-8000-000000000002", model: "gpt-5.6-luna",
    promptBundleVersion: candidate.promptBundleVersion, schemaSetVersion: candidate.schemaSetVersion, startedAt: "2026-09-07T10:00:00.000Z",
  }), "M2_PRODUCTION_PREPARATION_IDENTITY_INVALID");
  assert.equal(transport.calls.length, 0); assert.equal(repository.runs.size, 0); zeroExternal({ repository, transport });
});
await check("hypothetical GQ05 no-concern clarification keeps the V17 single-answer outcome", async () => {
  const fixture = makeStoredFixture("GQ-05"), now = "2026-09-07T10:00:00.000Z";
  const clarificationId = createOpaqueClarificationIdV1(new Uint8Array(32).fill(9));
  const answer = { choice: "no_material_concern" };
  const validated = validateClarificationAnswerV1({ target: "material_relationship_or_communication_concern", answer, resumeStartedAt: now });
  const groundingOutput = { schema_version: "pipeline-schema-clarification-grounding-v1.0.0", target: "material_relationship_or_communication_concern",
    source_identity: clarificationSourceIdentityV1(clarificationId), answer_fingerprint: validated.answerFingerprint, materially_resolves_target: false,
    clarification_safety_result: { classification: "normal_allowed", reason_codes: [], response_mode: "none" } };
  const outcomes = [];
  for (const catalog of [baseline, candidate]) {
    const repository = new FakeAssessmentRepository();
    const transport = new FakeAiStageTransport({ outputs: fixture.outputs, outputSequence: { "PB-01": [fixture.outputs["PB-01"], groundingOutput] } });
    let n = 0;
    const application = new AssessmentApplication({ repository, transport, model: "gpt-5.6-luna", definitions: catalog.definitions,
      promptBundleVersion: catalog.promptBundleVersion, schemaSetVersion: catalog.schemaSetVersion, now: () => now,
      uuid: () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`, clarificationId: () => clarificationId, timeZone: "Asia/Tokyo" });
    const initial = await application.submit(fixture.request, "synthetic-no-concern-resume");
    assert.equal(initial.eligibility, "needs_more_information");
    const result = await application.answerClarification(clarificationId, answer); zeroExternal({ repository, transport });
    assert.equal(result.eligibility, "not_full_product_candidate"); assert.equal(result.clarification, null);
    assert.deepEqual(transport.calls, ["PB-01", "PB-02", "PB-03", "PB-01"]); assert.equal(repository.clarifications.size, 1);
    outcomes.push({ eligibility: result.eligibility, reasonCodes: result.reasonCodes });
  }
  assert.deepEqual(outcomes[0], outcomes[1]);
  evidence.push({ caseId: "GQ-05", provenance: "Hypothetical offline no_material_concern answer, reusing the existing clarification integration test contract. Not answered by the Human or real pilot.",
    result: outcomes[0], historicalHumanJudgment: "UNCHANGED: tie/no issues for the original initial question", actualModelRuns: 0 });
});
await check("legacy report normalization rejects V18 marker mixing", () => {
  assert.ok(editedReady, "full-chain fixture must have completed before normalization checks");
  for (const target of ["report", "plan", "card"]) {
    const result = structuredClone(editedReady);
    if (target === "report") result.report.schemaVersion = "guidance-runtime-report-v1";
    if (target === "plan") result.report.decisionPlan.schema_version = "guidance-decision-plan-v1";
    if (target === "card") result.decisionCard.schemaVersion = "guidance-decision-card-v1";
    assert.throws(() => requireReadyAssessmentResult(result));
  }
  validateStageOutput(candidate.definitions.find((stage) => stage.stageId === "PB-04"), edited.outputs["PB-04"]);
});

const summary = {
  schemaVersion: "guidance-v19-l1-offline-verification-v1", baseline: BASELINE,
  candidate: { catalog: candidate.catalogVersion, promptBundle: candidate.promptBundleVersion, schemaSet: candidate.schemaSetVersion,
    stageHashes: candidate.definitions.map(({ stageId, promptHash, schemaHash }) => ({ stageId, promptHash, schemaHash })) },
  evidenceKind: "offline_contracts_and_stored_output_replay", actualModelRuns: 0, actualProviderCalls: 0, actualDatabaseCalls: 0,
  successorPb01Extraction: "NOT_RUN", newAnswerQuality: "NOT_RUN", newHumanAcceptance: "NONE",
  checks: checks.length, passed: checks.filter((item) => item.status === "PASS").length,
  contractAndReplayChecks: checks.filter((item) => !item.name.startsWith("known inherited integrity limit:")).length,
  knownLimitationDiagnostics: checks.filter((item) => item.name.startsWith("known inherited integrity limit:")).length,
  failed: checks.filter((item) => item.status === "FAIL").length, results: checks, evidence,
};
writeFileSync(new URL("./verification-results.json", import.meta.url), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(`V19-L1 OFFLINE ${summary.failed ? "FAIL" : "PASS"} ${summary.passed}/${summary.checks}; actual model/Provider/DB=0`);
if (summary.failed) process.exitCode = 1;
