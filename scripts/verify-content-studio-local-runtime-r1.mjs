import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import {
  CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION,
  CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION,
} from "../tools/content-studio-local/lib/contracts.ts";
import { assertLocalContentStudioLoopbackRequest } from "../tools/content-studio-local/lib/request-security.ts";
import { LocalContentStudioService } from "../tools/content-studio-local/lib/service.ts";
import { BoundedLocalContentStudioSessionStore } from "../tools/content-studio-local/lib/session-store.ts";

const repositoryRoot = process.cwd();
const fixtureRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${fixtureRoot}/controlled-provider-executions`;
const executionDirectories = {
  ordinary_reply_waiting:
    "2026-08-18-case1-ordinary-reply-waiting-v16-bc973d02",
  polite_thank_you_with_draft:
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  kansai_persona_draft:
    "2026-08-18-case6-kansai-draft-ai-first-v16-cd1518ce",
  one_clarification_answer_becomes_ready:
    "2026-08-18-case9-one-clarification-ai-first-v16-cd1518ce",
};

function readJson(relativePath) {
  return JSON.parse(
    readFileSync(path.join(repositoryRoot, relativePath), "utf8"),
  );
}

const controlledInputs = readJson(
  `${fixtureRoot}/controlled-provider-inputs-v1.json`,
);

function fixture(fixtureId) {
  const selected = controlledInputs.cases.find(
    (candidate) => candidate.fixture_id === fixtureId,
  );
  assert.ok(selected, fixtureId);
  return structuredClone(selected);
}

function evidence(fixtureId) {
  const directory = executionDirectories[fixtureId];
  assert.ok(directory, fixtureId);
  return readJson(
    `${executionRoot}/${directory}/v16-stage-attempt-results-v1.json`,
  );
}

function outputPlan(fixtureId) {
  const byStage = {};
  for (const entry of evidence(fixtureId).stage_attempts) {
    if (entry.outputJson === null) continue;
    byStage[entry.stageId] ??= [];
    byStage[entry.stageId].push(structuredClone(entry.outputJson));
  }
  return {
    outputs: Object.fromEntries(
      Object.entries(byStage).map(([stageId, values]) => [stageId, values[0]]),
    ),
    outputSequence: Object.fromEntries(
      Object.entries(byStage)
        .filter(([, values]) => values.length > 1)
        .map(([stageId, values]) => [stageId, values]),
    ),
  };
}

function candidatePreservedMetadata() {
  return {
    source_status: "candidate_preserved",
    preserved_meaning: true,
    style_delta: [],
    communicative_intent_delta: {
      gratitude_change: "unchanged",
      apology_change: "unchanged",
      question_count_delta: 0,
      invitation_presence_delta: "unchanged_present",
      invitation_specificity_delta: "unchanged",
      affection_strength_delta: "unchanged",
      commitment_strength_delta: "unchanged",
      response_pressure_delta: "unchanged",
      boundary_strength_delta: "unchanged",
      closure_intent_delta: "unchanged_present",
      practical_requirement_fulfillment: "not_applicable",
    },
    change_reasons: ["no_change_needed"],
    change_summary: null,
  };
}

function semanticPass(output) {
  return {
    ...structuredClone(output),
    semantic_checks: [],
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

function semanticFinding(findingCode, jsonPath) {
  return {
    finding_code: findingCode,
    severity: "major",
    json_path: jsonPath,
    evidence_refs: [],
    detail: "offline local diagnostic fixture",
  };
}

function semanticOutput(output, findings) {
  return {
    ...structuredClone(output),
    validation_mode: "semantic_findings_only",
    deterministic_checks: [],
    semantic_checks: structuredClone(findings),
    final_disposition: null,
    repair_strategy: null,
    failed_codes: [],
  };
}

class ClarificationGroundingFakeTransport extends FakeAiStageTransport {
  async invoke(stageRequest) {
    if (stageRequest.input.run_mode !== "clarification_resume") {
      return super.invoke(stageRequest);
    }
    this.calls.push(stageRequest.stageId);
    this.requests.push(structuredClone(stageRequest));
    const evidence = stageRequest.input.clarification_evidence;
    assert.equal(typeof evidence, "object");
    assert.ok(evidence !== null && !Array.isArray(evidence));
    return {
      responseId: "fake-response-clarification-grounding",
      returnedModel: stageRequest.model,
      output: {
        schema_version: "pipeline-schema-clarification-grounding-v1.0.0",
        target: evidence.target,
        source_identity: evidence.source_identity,
        answer_fingerprint: evidence.answer_fingerprint,
        materially_resolves_target: evidence.resolves_target,
        clarification_safety_result: {
          classification: "normal_allowed",
          reason_codes: [],
          response_mode: "none",
        },
      },
      usage: {
        inputTokens: 0,
        cachedTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
      },
      latencyMs: 0,
    };
  }
}

function readyOutputPlan() {
  const plan = outputPlan("polite_thank_you_with_draft");
  const candidate = "今日はありがとうございました。お話しできてうれしかったです。";
  const decisionPlan = structuredClone(plan.outputs["PB-04"]);
  decisionPlan.selected_decision = "send_now";
  decisionPlan.pre_action_check.check =
    "感謝だけを短く伝え、誘いや返信を求める表現を加えていないことを確認する。";
  decisionPlan.actions_to_take = ["候補文を変更せず、今夜一度だけ送る。"];
  decisionPlan.actions_to_avoid = [
    "候補文に誘いや関係性の確認を追加しない。",
    "送信後に感謝の追送を重ねない。",
  ];
  decisionPlan.recommended_message_draft = {
    text: candidate,
    policy: "required_now",
    use_timing: "now",
  };
  decisionPlan.message_draft_edit_metadata = candidatePreservedMetadata();
  decisionPlan.aftercare_plan[0].action =
    "候補文を一度送ったら、追加連絡をせず食事後の予定や休息に戻る。";
  decisionPlan.material_unknowns = decisionPlan.material_unknowns.filter(
    (entry) => entry.unknown_code !== "specific_message_text",
  );
  const report = structuredClone(plan.outputs["PB-05"]);
  report.cover_line = "今夜は、感謝だけを短く自然に伝えられます。";
  report.decision_reason_summary =
    "同日中に感謝を伝えたい希望と、誘いや返信圧を含まない候補文が揃っているため、そのまま一度送る判断です。";
  report.message_draft_context =
    "感謝だけを短く伝える候補文を、文面を変えず今夜一度送るための最終案です。";
  report.action_rationales = [
    "候補文は感謝のみを伝え、誘いや返信要求を含まないため、今夜の目的に合っています。",
  ];
  return {
    outputs: {
      ...plan.outputs,
      "PB-04": decisionPlan,
      "PB-05": report,
      "PB-06": semanticPass(plan.outputs["PB-06"]),
    },
  };
}

function qualityRetryOutputPlan() {
  const plan = outputPlan("kansai_persona_draft");
  const cleanReport = structuredClone(plan.outputs["PB-05"]);
  cleanReport.action_rationales[1] =
    "候補文の関西弁、短い改行、絵文字は、普段のコミュニケーションに合っており、意味や表現を変える必要はありません。";
  return {
    outputs: plan.outputs,
    outputSequence: {
      ...plan.outputSequence,
      "PB-05": [plan.outputs["PB-05"], cleanReport],
      "PB-06": [
        plan.outputs["PB-06"],
        semanticPass(plan.outputs["PB-06"]),
      ],
    },
  };
}

function qualityExhaustionOutputPlan(findingCode, jsonPath) {
  const plan = readyOutputPlan();
  const finding = semanticFinding(findingCode, jsonPath);
  return {
    outputs: structuredClone(plan.outputs),
    outputSequence: {
      "PB-04": [
        structuredClone(plan.outputs["PB-04"]),
        structuredClone(plan.outputs["PB-04"]),
      ],
      "PB-05": [
        structuredClone(plan.outputs["PB-05"]),
        structuredClone(plan.outputs["PB-05"]),
      ],
      "PB-06": [
        semanticOutput(plan.outputs["PB-06"], [finding]),
        semanticOutput(plan.outputs["PB-06"], [finding]),
      ],
    },
  };
}

function localIntegrityExhaustionOutputPlan() {
  const plan = readyOutputPlan();
  const invalidPlan = structuredClone(plan.outputs["PB-04"]);
  invalidPlan.recommended_message_draft.text =
    "候補文を保持したと表示しながら内容を変更した診断用fixture";
  const semanticPassOutput = semanticPass(plan.outputs["PB-06"]);
  return {
    outputs: {
      ...structuredClone(plan.outputs),
      "PB-04": invalidPlan,
      "PB-06": semanticPassOutput,
    },
    outputSequence: {
      "PB-04": [structuredClone(invalidPlan), structuredClone(invalidPlan)],
      "PB-05": [
        structuredClone(plan.outputs["PB-05"]),
        structuredClone(plan.outputs["PB-05"]),
      ],
      "PB-06": [
        structuredClone(semanticPassOutput),
        structuredClone(semanticPassOutput),
      ],
    },
  };
}

function consultationEnvelope(selected, overrides = {}) {
  const assessment = selected.assessment_input;
  return {
    schemaVersion: CONTENT_STUDIO_LOCAL_GENERATE_SCHEMA_VERSION,
    syntheticOnlyAcknowledged: true,
    consultation: {
      consultationSchemaVersion: "rc1-production-consultation-v1",
      privacyAcknowledged: true,
      schemaVersion: "prepayment-safety-input-v1",
      adultConfirmed: true,
      currentSituation: assessment.currentSituation,
      latestInboundMessage: null,
      optionalMessage: assessment.optionalMessage,
      relationship: assessment.relationship,
      requestedTopics: assessment.requestedTopics,
      contactBoundaryState: "no_restriction_known",
      requestedAssistanceGoal: "understand_and_organize",
      clarificationAnswers: {
        submissionCount: 0,
        clarifiedContactBoundaryState: null,
        practicalPermissionExplicit: null,
        currentRequestPracticalScopeOnly: null,
        replyExplicitlyInvited: null,
        replyLimitedToExactSubject: null,
        professionalScopeLimitedToNonprofessionalOrganization: null,
        unsafeExecutionIntent: null,
        currentSafetyStatus: null,
      },
      scopeAcknowledgements: {
        pauseAssessmentDisclosureAcknowledged: true,
        boundarySupportOnlyDisclosureAcknowledged: true,
        scopedReplyScopeAcknowledged: true,
        businessOnlyScopeAcknowledged: true,
      },
      attestationConfirmed: true,
      safetyPolicyVersion: "prepayment-safety-policy-v1",
      ...overrides,
    },
  };
}

function serviceWith(catalog, transport, store = undefined) {
  const repositories = [];
  const service = new LocalContentStudioService({
    catalog,
    transport,
    store,
    repositoryFactory: () => {
      const repository = new FakeAssessmentRepository();
      repositories.push(repository);
      return repository;
    },
  });
  return { service, repositories, store };
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

function request(url, host, method = "GET", origin = null) {
  const headers = new Headers({ host });
  if (origin !== null) headers.set("origin", origin);
  return { method, url, headers };
}

let checks = 0;
const failures = [];

async function check(name, callback) {
  try {
    await callback();
    checks += 1;
    console.log(`PASS ${String(checks).padStart(2, "0")} ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
  }
}

const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();

await check("cross-root v17 runtime assets load with exact identity", () => {
  assert.equal(catalog.catalogVersion, "runtime-stage-catalog-v17.0.0");
  assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v17.0.0");
  assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v6.0.0");
  assert.equal(catalog.stageTopologyVersion, "split-base-candidate-v1");
});

await check("production, disabled, Netlify, and non-loopback requests fail closed", () => {
  const allowedEnvironment = {
    NODE_ENV: "development",
    CONTENT_STUDIO_LOCAL_ENABLED: "true",
  };
  assert.doesNotThrow(() =>
    assertLocalContentStudioLoopbackRequest(
      request("http://127.0.0.1:3101/", "127.0.0.1:3101"),
      allowedEnvironment,
    ),
  );
  for (const environment of [
    { ...allowedEnvironment, NODE_ENV: "production" },
    { ...allowedEnvironment, CONTENT_STUDIO_LOCAL_ENABLED: "false" },
    { ...allowedEnvironment, NETLIFY: "true" },
    { ...allowedEnvironment, CONTEXT: "production" },
  ]) {
    assert.throws(
      () =>
        assertLocalContentStudioLoopbackRequest(
          request("http://127.0.0.1:3101/", "127.0.0.1:3101"),
          environment,
        ),
      (error) => safeCode(error) === "CONTENT_STUDIO_LOCAL_UNAVAILABLE" && error.httpStatus === 404,
    );
  }
  assert.throws(
    () =>
      assertLocalContentStudioLoopbackRequest(
        request("http://192.168.1.20:3101/", "192.168.1.20:3101"),
        allowedEnvironment,
      ),
    (error) => safeCode(error) === "CONTENT_STUDIO_LOCAL_UNAVAILABLE" && error.httpStatus === 404,
  );
});

await check("same-origin POST is accepted and cross-origin POST is denied", () => {
  const environment = {
    NODE_ENV: "development",
    CONTENT_STUDIO_LOCAL_ENABLED: "true",
  };
  assert.doesNotThrow(() =>
    assertLocalContentStudioLoopbackRequest(
      request(
        "http://127.0.0.1:3101/api/generation",
        "127.0.0.1:3101",
        "POST",
        "http://127.0.0.1:3101",
      ),
      environment,
    ),
  );
  assert.throws(
    () =>
      assertLocalContentStudioLoopbackRequest(
        request(
          "http://127.0.0.1:3101/api/generation",
          "127.0.0.1:3101",
          "POST",
          "https://example.com",
        ),
        environment,
      ),
    (error) => safeCode(error) === "CONTENT_STUDIO_LOCAL_UNAVAILABLE",
  );
});

await check("prepayment safety stops before any fake Provider or repository call", async () => {
  const transport = new FakeAiStageTransport(readyOutputPlan());
  const run = serviceWith(catalog, transport);
  const stopped = await run.service.generate(
    consultationEnvelope(fixture("polite_thank_you_with_draft"), {
      requestedAssistanceGoal: "monitor_track_or_manipulate",
    }),
  );
  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.reason, "prepayment_safety");
  assert.equal(transport.calls.length, 0);
  assert.equal(run.repositories.length, 0);
});

await check("100 synthetic ready generations keep Provider/Supabase/commercial state at zero", async () => {
  const transport = new FakeAiStageTransport(readyOutputPlan());
  const run = serviceWith(catalog, transport);
  const input = consultationEnvelope(fixture("polite_thank_you_with_draft"));
  for (let index = 0; index < 100; index += 1) {
    const outcome = await run.service.generate(structuredClone(input));
    assert.equal(outcome.status, "ready", `generation ${index + 1}`);
    assert.deepEqual(Object.keys(outcome).sort(), ["projection", "status"]);
    assert.doesNotMatch(
      JSON.stringify(outcome),
      /(?:requestId|runId|stageId|providerId|opaqueClarificationId)/u,
    );
  }
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(run.repositories.length, 100);
  assert.ok(run.repositories.every((repository) => repository.actualSupabaseCalls === 0));
  assert.equal(run.service.diagnosticSnapshot().sessionCount, 0);
});

await check("one clarification resumes by local handle without exposing Core IDs", async () => {
  const selected = fixture("ordinary_reply_waiting");
  const plan = outputPlan(selected.fixture_id);
  const base = structuredClone(plan.outputs["PB-01"]);
  base.decision_facts.latest_direct_message = {
    sender: "unknown",
    kind: "unknown",
    response_expectation: "unknown",
    user_reply_state: "unknown",
    sns_signal_only: false,
  };
  base.decision_facts.contact_state.unanswered_user_message_count = null;
  base.decision_facts.information_state.can_proceed_without_followup = true;
  base.decision_facts.information_state.unresolved_fields = [
    "latest_direct_message.sender",
    "latest_direct_message.kind",
    "latest_direct_message.response_expectation",
    "latest_direct_message.user_reply_state",
    "contact_state.unanswered_user_message_count",
  ];
  plan.outputs["PB-01"] = base;
  delete plan.outputSequence["PB-01"];
  plan.outputs["PB-06"] = semanticPass(plan.outputs["PB-06"]);
  if (plan.outputSequence["PB-06"]) {
    plan.outputSequence["PB-06"] = plan.outputSequence["PB-06"].map(semanticPass);
  }
  const transport = new ClarificationGroundingFakeTransport(plan);
  const run = serviceWith(catalog, transport);
  const initial = await run.service.generate(consultationEnvelope(selected));
  assert.equal(initial.status, "needs_more_information");
  assert.equal(initial.target, "material_relationship_or_communication_concern");
  assert.deepEqual(Object.keys(initial).sort(), [
    "maximumQuestionsTotal",
    "question",
    "runHandle",
    "status",
    "target",
  ]);
  assert.doesNotMatch(JSON.stringify(initial), /opaqueClarificationId|requestId|runId/u);
  const completed = await run.service.answerClarification({
    schemaVersion: CONTENT_STUDIO_LOCAL_ACTION_SCHEMA_VERSION,
    action: "answer_clarification",
    runHandle: initial.runHandle,
    answer: {
      choice: "reply_pressure",
      detail: "追加連絡を重ねずに距離感を保つ判断を知りたいです。",
    },
  });
  assert.equal(completed.status, "ready");
  assert.equal(run.service.diagnosticSnapshot().sessionCount, 0);
  assert.ok(run.repositories.every((repository) => repository.actualSupabaseCalls === 0));
});

await check("quality defects trigger one bounded attempt 2 and then become ready", async () => {
  const transport = new FakeAiStageTransport(qualityRetryOutputPlan());
  const run = serviceWith(catalog, transport);
  const outcome = await run.service.generate(
    consultationEnvelope(fixture("kansai_persona_draft")),
  );
  assert.equal(outcome.status, "ready");
  assert.equal(
    transport.calls.filter((stageId) => stageId === "PB-05").length,
    2,
  );
  assert.equal(
    [...run.repositories[0].stageRuns.values()].some(
      (stage) => stage.attemptNumber > 2,
    ),
    false,
  );
  assert.equal(run.repositories[0].actualSupabaseCalls, 0);
  assert.equal(run.service.diagnosticSnapshot().sessionCount, 0);
});

await check("soft-only exhaustion stays ready and retains only sanitized diagnostics", async () => {
  let nowMs = 0;
  const store = new BoundedLocalContentStudioSessionStore({
    sessionTtlMs: 60_000,
    now: () => nowMs,
  });
  const transport = new FakeAiStageTransport(
    qualityExhaustionOutputPlan(
      "TEMPLATE_GENERICITY",
      "report_content.short_letter[0]",
    ),
  );
  const run = serviceWith(catalog, transport, store);
  const outcome = await run.service.generate(
    consultationEnvelope(fixture("polite_thank_you_with_draft")),
  );
  assert.equal(outcome.status, "ready");
  assert.equal(outcome.diagnostic.disposition, "deliver_latest_valid_candidate");
  assert.equal(outcome.diagnostic.attemptNumber, 2);
  assert.deepEqual(outcome.diagnostic.findingCodes, ["TEMPLATE_GENERICITY"]);
  assert.match(outcome.runHandle, /^[0-9a-f-]{36}$/u);
  assert.deepEqual(
    Object.keys(outcome.diagnostic).sort(),
    ["attemptNumber", "disposition", "findingCodes"],
  );
  const retained = store.readTerminalDiagnostic(outcome.runHandle);
  assert.deepEqual(retained, outcome.diagnostic);
  assert.equal(run.service.diagnosticSnapshot().terminalDiagnosticCount, 1);
  assert.equal(transport.actualProviderCalls, 0);
  assert.ok(run.repositories.every((repository) => repository.actualSupabaseCalls === 0));
  nowMs = 60_001;
  assert.equal(store.readTerminalDiagnostic(outcome.runHandle), null);
});

await check("hard exhaustion stays failed closed without raw or identifying data", async () => {
  const store = new BoundedLocalContentStudioSessionStore();
  const transport = new FakeAiStageTransport(
    qualityExhaustionOutputPlan(
      "SAFETY_REGRESSION",
      "decision_plan.actions_to_take[0]",
    ),
  );
  const run = serviceWith(catalog, transport, store);
  const outcome = await run.service.generate(
    consultationEnvelope(fixture("polite_thank_you_with_draft")),
  );
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.errorCode, "M2_PRODUCT_QUALITY_REASSESSMENT_EXHAUSTED");
  assert.equal(outcome.diagnostic.disposition, "fail_closed");
  assert.equal(outcome.diagnostic.attemptNumber, 2);
  assert.deepEqual(outcome.diagnostic.findingCodes, ["SAFETY_REGRESSION"]);
  assert.deepEqual(store.readTerminalDiagnostic(outcome.runHandle), outcome.diagnostic);
  assert.equal(run.service.diagnosticSnapshot().sessionCount, 0);
  assert.equal(run.service.diagnosticSnapshot().terminalDiagnosticCount, 1);
  const exposed = JSON.stringify(outcome);
  assert.doesNotMatch(
    exposed,
    /(?:consultation|currentSituation|optionalMessage|candidate|provider|prompt|responseId|assessmentId|stageId|requestId|runId|api[_-]?key)/iu,
  );
  assert.doesNotMatch(
    exposed,
    /今日はありがとうございました。お話しできてうれしかったです。/u,
  );
  assert.equal(transport.actualProviderCalls, 0);
  assert.ok(run.repositories.every((repository) => repository.actualSupabaseCalls === 0));
  assert.equal(
    [...run.repositories[0].stageRuns.values()].some(
      (stage) => stage.attemptNumber > 2,
    ),
    false,
  );
});

await check("local integrity B uses the same best-available diagnostic directive", async () => {
  const transport = new FakeAiStageTransport(localIntegrityExhaustionOutputPlan());
  const run = serviceWith(catalog, transport);
  const outcome = await run.service.generate(
    consultationEnvelope(fixture("polite_thank_you_with_draft")),
  );
  assert.equal(outcome.status, "ready");
  assert.equal(
    outcome.diagnostic.disposition,
    "deliver_latest_valid_candidate",
  );
  assert.deepEqual(outcome.diagnostic.findingCodes, ["DRAFT_SOURCE_INTEGRITY"]);
  assert.equal(transport.actualProviderCalls, 0);
  assert.equal(run.repositories[0].actualSupabaseCalls, 0);
});

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(failure.error);
  }
  console.error(
    `CONTENT_STUDIO_LOCAL_RUNTIME_R1: FAIL (${failures.length}/${checks + failures.length})`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `CONTENT_STUDIO_LOCAL_RUNTIME_R1: PASS (${checks}/${checks}; synthetic_generations=100; provider_calls=0; supabase_calls=0)`,
  );
}
