import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ProductionFulfillmentApplication } from "../lib/assessment/production/application.ts";
import {
  hashProductionSnapshot,
  isProductionResultNotFoundError,
} from "../lib/assessment/production/capabilities.ts";
import {
  PRODUCTION_ACTUAL_EXCHANGE_CONTEXT_SCHEMA_VERSION,
  projectProductionBaseSituationV1,
  toAssessmentInput,
} from "../lib/assessment/production/consultation.ts";
import { FakeProductionFulfillmentRepository } from "../lib/assessment/production/fakes.ts";
import {
  DeterministicFakeDeliveryNotificationAdapterV1,
  UnconfiguredDeliveryNotificationAdapterV1,
} from "../lib/assessment/production/notification.ts";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import { FakeAssessmentRepository } from "../lib/assessment/runtime/fakes.ts";
import {
  validatePurchaseReadyAuthorityForFulfillment,
} from "../lib/assessment/runtime/pipeline.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "../lib/http/strict-json-request.ts";

const root = process.cwd();
const packageRoot =
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p3-v1-d";
const executionRoot = `${packageRoot}/controlled-provider-executions`;

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function readProductionAssessmentEnvironmentSources() {
  return [
    "lib/assessment/production/environment.ts",
    "lib/assessment/production/environment-runtime.ts",
  ]
    .map(readText)
    .join("\n");
}

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

function capabilities() {
  let index = 0;
  return () => Buffer.alloc(32, ++index).toString("base64url");
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

const controlled = readJson(`${packageRoot}/controlled-provider-inputs-v1.json`);
const safetyCases = readJson(
  "evals/runtime/m2-p4-i3-r1-c1-r3-r2-e-r3-r3-r3-p6-i1/safety-engine-cases-v1.json",
);

function fixture(fixtureId) {
  const selected = controlled.cases.find(
    (candidate) => candidate.fixture_id === fixtureId,
  );
  assert.ok(selected, fixtureId);
  return structuredClone(selected);
}

function outputs(directory) {
  const evidence = readJson(
    `${executionRoot}/${directory}/v16-stage-attempt-results-v1.json`,
  );
  const selected = {};
  for (const entry of evidence.stage_attempts) {
    if (
      entry.attemptNumber === 1 &&
      entry.outputJson !== null &&
      selected[entry.stageId] === undefined
    ) {
      selected[entry.stageId] = structuredClone(entry.outputJson);
    }
  }
  return selected;
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

function case5Outputs() {
  const result = outputs(
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  );
  const candidate =
    "今日はありがとうございました。お話しできてうれしかったです。";
  const plan = structuredClone(result["PB-04"]);
  plan.selected_decision = "send_now";
  plan.pre_action_check.check =
    "感謝だけを短く伝え、誘いや返信を求める表現を加えていないことを確認する。";
  plan.actions_to_take = ["候補文を変更せず、今夜一度だけ送る。"];
  plan.actions_to_avoid = [
    "候補文に誘いや関係性の確認を追加しない。",
    "送信後に感謝の追送を重ねない。",
  ];
  plan.recommended_message_draft = {
    text: candidate,
    policy: "required_now",
    use_timing: "now",
  };
  plan.message_draft_edit_metadata = candidatePreservedMetadata();
  plan.aftercare_plan[0].action =
    "候補文を一度送ったら、追加連絡をせず食事後の予定や休息に戻る。";
  plan.material_unknowns = plan.material_unknowns.filter(
    (entry) => entry.unknown_code !== "specific_message_text",
  );
  const report = structuredClone(result["PB-05"]);
  report.cover_line = "今夜は、感謝だけを短く自然に伝えられます。";
  report.decision_reason_summary =
    "同日中に感謝を伝えたい希望と、誘いや返信圧を含まない候補文が揃っているため、そのまま一度送る判断です。";
  report.message_draft_context =
    "感謝だけを短く伝える候補文を、文面を変えず今夜一度送るための最終案です。";
  report.action_rationales = [
    "候補文は感謝のみを伝え、誘いや返信要求を含まないため、今夜の目的に合っています。",
  ];
  return {
    ...result,
    "PB-04": plan,
    "PB-05": report,
    "PB-06": semanticPass(result["PB-06"]),
  };
}

function genuinelyUnusableClarificationOutputs() {
  const result = outputs(
    "2026-08-18-case9-one-clarification-ai-first-v16-cd1518ce",
  );
  const base = structuredClone(result["PB-01"]);
  base.timeline = [
    {
      event_id: "E101",
      sequence: 1,
      actor: "user",
      statement: "ユーザーには相談したい相手がいる。",
      source_refs: ["input:current_situation"],
    },
  ];
  base.context = [];
  base.observed_facts = [
    {
      fact_id: "F101",
      statement: "ユーザーは相手とのことを相談したい。",
      source_refs: ["input:current_situation"],
      support: "explicit",
    },
  ];
  base.user_assumptions = [];
  base.user_emotions = [];
  base.material_unknowns = [];
  base.decision_facts.latest_direct_message = {
    sender: "unknown",
    kind: "unknown",
    response_expectation: "unknown",
    user_reply_state: "unknown",
    sns_signal_only: false,
  };
  base.decision_facts.contact_state = {
    unanswered_user_message_count: 0,
    elapsed_since_latest_user_message_minutes: null,
    usual_cadence_relation: "unknown",
  };
  base.decision_facts.information_state.unresolved_fields = [];
  base.base_writing_signals.user_goal_detail = {
    value: "unknown",
    basis: "unresolved",
  };
  base.base_writing_signals.explicit_user_constraints = [];
  return { ...result, "PB-01": base };
}

function consultationFor(selected, overrides = {}) {
  return {
    ...structuredClone(safetyCases.base_input),
    currentSituation: selected.assessment_input.currentSituation,
    optionalMessage: selected.assessment_input.optionalMessage,
    relationship: selected.assessment_input.relationship,
    requestedTopics: selected.assessment_input.requestedTopics,
    consultationSchemaVersion: "rc1-production-consultation-v1",
    privacyAcknowledged: true,
    ...structuredClone(overrides),
  };
}

class ScriptedTransport {
  actualProviderCalls = 0;
  apiSpendUsd = 0;
  calls = [];
  requests = [];

  constructor(stageOutputs) {
    this.stageOutputs = structuredClone(stageOutputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    let output;
    if (
      request.stageId === "PB-01" &&
      request.input.run_mode === "clarification_resume"
    ) {
      const evidence = request.input.clarification_evidence;
      output = {
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
      };
    } else {
      output = this.stageOutputs[request.stageId];
    }
    if (output === undefined) {
      throw new M2RuntimeError("RC1_FAKE_STAGE_OUTPUT_MISSING");
    }
    const sequence = this.calls.length;
    return {
      responseId: `fake-response-${sequence}`,
      returnedModel: request.model,
      output: structuredClone(output),
      usage: {
        inputTokens: 100 + sequence,
        cachedTokens: 0,
        outputTokens: 20 + sequence,
        reasoningTokens: 5,
      },
      latencyMs: sequence,
    };
  }
}

async function harness(
  selected,
  stageOutputs,
  runtimeOptions = {},
  lifecycleOptions = {},
) {
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const runtimeRepository = new FakeAssessmentRepository(runtimeOptions);
  const lifecycleRepository = new FakeProductionFulfillmentRepository(
    runtimeRepository,
    lifecycleOptions,
  );
  const transport = new ScriptedTransport(stageOutputs);
  const application = new ProductionFulfillmentApplication({
    runtimeRepository,
    lifecycleRepository,
    transport,
    catalog,
    model: "gpt-5.6-luna",
    now: () => selected.fixed_clock,
    uuid: ids(),
    capability: capabilities(),
    timeZone: selected.timezone,
    allowSyntheticPurchaseAuthority: true,
  });
  return {
    application,
    runtimeRepository,
    lifecycleRepository,
    transport,
  };
}

function syntheticPurchase(preparationCapability) {
  return {
    schemaVersion: "rc1-verified-purchase-authority-v1",
    verificationSource: "rc1_test_fake",
    purchaseAuthorityReference: "fake-purchase-authority-0001",
    preparationCapability,
    deliveryAuthorityReference: "fake-delivery-authority-0001",
  };
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
    console.error(error);
  }
}

await check("production runtime identity is exact V17 and separately gated", async () => {
  const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  assert.deepEqual(
    {
      catalog: catalog.catalogVersion,
      prompt: catalog.promptBundleVersion,
      schema: catalog.schemaSetVersion,
      topology: catalog.stageTopologyVersion,
      model: "gpt-5.6-luna",
    },
    {
      catalog: "runtime-stage-catalog-v17.0.0",
      prompt: "prompt-bundle-runtime-v17.0.0",
      schema: "pipeline-schema-runtime-v6.0.0",
      topology: "split-base-candidate-v1",
      model: "gpt-5.6-luna",
    },
  );
  const pb01 = catalog.definitions.find((entry) => entry.stageId === "PB-01");
  const pb01c = catalog.definitions.find((entry) => entry.stageId === "PB-01C");
  assert.deepEqual(
    {
      pb01Prompt: pb01?.promptHash,
      pb01Schema: pb01?.schemaHash,
      pb01cPrompt: pb01c?.promptHash,
      pb01cSchema: pb01c?.schemaHash,
    },
    {
      pb01Prompt:
        "de55c3f8a99b3de5c52249f9252c09524f734a2046103c7de6cb27506d554757",
      pb01Schema:
        "049fc753c0fa3051b69b077e53c6be1e3c89b374f4939bab8783cbf96d2c2560",
      pb01cPrompt:
        "7d286a982bf34f5980a3be0dd6da59d683a38247fd01b2871742b9c18c4003d9",
      pb01cSchema:
        "65953c0b7227b0b922f6eaf556ced212f7193aa3cc221ab4494514042a217023",
    },
  );
  const environment = readProductionAssessmentEnvironmentSources();
  assert.match(environment, /ASSESSMENT_PRODUCTION_PREPARATION_ENABLED/u);
  assert.match(environment, /ASSESSMENT_PRODUCTION_RUNTIME_ENABLED/u);
  assert.match(environment, /ASSESSMENT_PRODUCTION_EMERGENCY_STOP/u);
  assert.doesNotMatch(environment, /M2_INTERNAL_RUNTIME_ENABLED/u);
});

await check("actual exchange reaches V17 Base without Candidate contamination", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const currentSituation = "UNIQUE_CURRENT_SITUATION_MARKER";
  const latestInboundMessage = "UNIQUE_INBOUND_MESSAGE_MARKER";
  const optionalMessage = "UNIQUE_OUTGOING_DRAFT_MARKER";
  const consultation = consultationFor(selected, {
    currentSituation,
    latestInboundMessage,
    optionalMessage,
  });
  const prepared = await run.application.prepare(
    consultation,
    crypto.randomUUID(),
  );
  assert.equal(prepared.status, "purchase_ready");
  const pb01 = run.transport.requests.find((entry) => entry.stageId === "PB-01");
  const pb01c = run.transport.requests.find(
    (entry) => entry.stageId === "PB-01C",
  );
  assert.ok(pb01);
  assert.ok(pb01c);
  assert.deepEqual(Object.keys(pb01.input.base_provider_input).sort(), [
    "current_situation",
    "relationship",
    "requested_topics",
  ]);
  const actualExchange = JSON.parse(
    pb01.input.base_provider_input.current_situation,
  );
  assert.deepEqual(actualExchange, {
    schemaVersion: PRODUCTION_ACTUAL_EXCHANGE_CONTEXT_SCHEMA_VERSION,
    currentSituation: {
      source: "customer_current_situation",
      exactText: currentSituation,
    },
    latestInboundMessage: {
      source: "other_person_latest_inbound_message",
      exactText: latestInboundMessage,
    },
  });
  assert.deepEqual(pb01c.input, {
    optional_message: optionalMessage,
    candidate_metadata: {
      message_owner: "user",
      message_status: "unsent_candidate",
    },
  });
  assert.equal(JSON.stringify(pb01c.input).includes(latestInboundMessage), false);
  assert.equal(
    pb01.input.base_provider_input.current_situation.includes(optionalMessage),
    false,
  );
  const stored = [...run.lifecycleRepository.preparations.values()][0];
  assert.equal(stored.consultationSnapshot.currentSituation, currentSituation);
  assert.equal(
    stored.consultationSnapshot.latestInboundMessage,
    latestInboundMessage,
  );
  assert.equal(stored.consultationSnapshot.optionalMessage, optionalMessage);
});

await check("no-inbound projection is byte-for-byte legacy and oversize fails closed", () => {
  const selected = fixture("polite_thank_you_with_draft");
  const consultation = consultationFor(selected, {
    currentSituation: "NO_INBOUND_LEGACY_MARKER",
    latestInboundMessage: null,
    optionalMessage: "NO_INBOUND_OUTGOING_MARKER",
  });
  const assessmentInput = toAssessmentInput(consultation);
  assert.equal(assessmentInput.currentSituation, consultation.currentSituation);
  assert.equal(assessmentInput.optionalMessage, consultation.optionalMessage);
  assert.equal(
    projectProductionBaseSituationV1(consultation),
    consultation.currentSituation,
  );
  assert.throws(
    () =>
      projectProductionBaseSituationV1({
        currentSituation: "x".repeat(4_900),
        latestInboundMessage: "y".repeat(200),
      }),
    (error) =>
      safeCode(error) === "PRODUCTION_ACTUAL_EXCHANGE_CONTEXT_TOO_LARGE",
  );
});

await check("public request boundary is strict, bounded, and has no Grant mint route", async () => {
  const valid = new Request("https://example.test/api/consultations/prepare", {
    method: "POST",
    headers: {
      origin: "https://example.test",
      "content-type": "application/json; charset=utf-8",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ value: 1 }),
  });
  enforceSameOrigin(valid);
  assert.deepEqual(await readStrictJsonRequest(valid, 1_024), { value: 1 });
  const oversized = new Request(
    "https://example.test/api/consultations/prepare",
    {
      method: "POST",
      headers: {
        origin: "https://example.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({ value: "x".repeat(2_000) }),
    },
  );
  await assert.rejects(
    () => readStrictJsonRequest(oversized, 128),
    (error) => safeCode(error) === "PRODUCTION_REQUEST_TOO_LARGE",
  );
  assert.equal(
    readText("lib/assessment/production/service.ts").startsWith(
      'import "server-only";',
    ),
    true,
  );
  assert.equal(
    readText("app/api/consultations/prepare/route.ts").includes(
      "issueProductionAssessmentGrant",
    ),
    false,
  );
});

await check("unsafe and client-forged authority stop before Provider, Payment, and Report", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const unsafe = consultationFor(selected, {
    contactBoundaryState: "urgent_safety",
    requestedAssistanceGoal: "urgent_safety_help",
    currentSituation: "今すぐ自分を傷つけたい気持ちがあります。",
  });
  assert.deepEqual(await run.application.prepare(unsafe, crypto.randomUUID()), {
    status: "safety_blocked",
  });
  assert.equal(run.transport.calls.length, 0);
  assert.equal(run.lifecycleRepository.preparations.size, 0);
  assert.equal(run.runtimeRepository.reports.size, 0);
  await assert.rejects(
    () => run.application.prepare(unsafe, null),
    (error) => safeCode(error) === "PRODUCTION_IDEMPOTENCY_KEY_INVALID",
  );
  assert.equal(run.transport.calls.length, 0);
  await assert.rejects(
    () =>
      run.application.prepare(
        { ...consultationFor(selected), paid: true, grant: true },
        crypto.randomUUID(),
      ),
    (error) => safeCode(error) === "PRODUCTION_PREPARATION_INVALID_REQUEST",
  );
  assert.equal(run.transport.calls.length, 0);
});

await check("ready preparation stops before PB-04/PB-05/PB-06 and persists authority", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const idempotencyKey = crypto.randomUUID();
  const consultation = consultationFor(selected);
  const prepared = await run.application.prepare(
    consultation,
    idempotencyKey,
  );
  assert.equal(prepared.status, "purchase_ready");
  assert.deepEqual(run.transport.calls, ["PB-01", "PB-01C", "PB-02", "PB-03"]);
  assert.equal(run.runtimeRepository.reports.size, 0);
  const stored = [...run.lifecycleRepository.preparations.values()][0];
  assert.equal(stored.purchaseReadyAuthority.runtimeIdentity.promptBundleVersion,
    "prompt-bundle-runtime-v17.0.0");
  assert.equal(
    JSON.stringify(stored).includes(prepared.preparationCapability),
    false,
  );
  assert.equal(run.transport.actualProviderCalls, 0);
  assert.equal(run.lifecycleRepository.actualSupabaseCalls, 0);
  const callsBeforeConflict = [...run.transport.calls];
  await assert.rejects(
    () =>
      run.application.prepare(
        consultationFor(selected, {
          currentSituation: `${consultation.currentSituation}\n別の入力`,
        }),
        idempotencyKey,
      ),
    (error) => safeCode(error) === "PRODUCTION_IDEMPOTENCY_CONFLICT",
  );
  assert.deepEqual(run.transport.calls, callsBeforeConflict);
});

await check("one clarification is reusable for the same answer and conflicting replay fails closed", async () => {
  const selected = fixture("one_clarification_answer_becomes_ready");
  selected.assessment_input.currentSituation =
    "相手とのことを相談したいです。どうすればいいですか？";
  selected.assessment_input.optionalMessage = null;
  selected.clarification.answer_payload = {
    choice: "reply_pressure",
    detail: "連絡の距離感をどうすべきか迷っています。",
  };
  const run = await harness(selected, genuinelyUnusableClarificationOutputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  assert.equal(prepared.status, "needs_one_clarifying_answer");
  assert.equal(prepared.maximumQuestionsTotal, 1);
  assert.equal(run.runtimeRepository.clarifications.size, 1);
  assert.equal(run.runtimeRepository.reports.size, 0);
  const answered = await run.application.answerClarification(
    prepared.clarificationCapability,
    selected.clarification.answer_payload,
  );
  assert.equal(answered.status, "purchase_ready");
  const clarificationStored = [
    ...run.lifecycleRepository.preparations.values(),
  ][0];
  assert.deepEqual(
    Object.keys(clarificationStored.purchaseReadyAuthority.request).sort(),
    [
      "currentSituation",
      "optionalMessage",
      "privacyAcknowledged",
      "relationship",
      "requestedTopics",
    ],
  );
  const clarificationPersistedRequest =
    run.runtimeRepository.requests.get(clarificationStored.requestId);
  assert.ok(clarificationPersistedRequest);
  assert.doesNotThrow(() =>
    validatePurchaseReadyAuthorityForFulfillment({
      persistedRequest: clarificationPersistedRequest,
      authority: clarificationStored.purchaseReadyAuthority,
      runContext: {
        requestId: clarificationStored.requestId,
        runId: "00000000-0000-4000-8000-000000000090",
        model: "gpt-5.6-luna",
        promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
        schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
        startedAt: selected.fixed_clock,
      },
      activeStageTopologyVersion: "split-base-candidate-v1",
      providerInvocationFencePresent: true,
    }),
  );
  const callsAfterAnswer = [...run.transport.calls];
  const replayed = await run.application.answerClarification(
    prepared.clarificationCapability,
    selected.clarification.answer_payload,
  );
  assert.equal(replayed.status, "purchase_ready");
  assert.deepEqual(run.transport.calls, callsAfterAnswer);
  await assert.rejects(
    () =>
      run.application.answerClarification(prepared.clarificationCapability, {
        choice: "distance",
        detail: "少し距離を置くべきか迷っています。",
      }),
    (error) => safeCode(error) === "PRODUCTION_CLARIFICATION_CONFLICT",
  );
  assert.equal(run.runtimeRepository.clarifications.size, 1);
  assert.equal(run.runtimeRepository.reports.size, 0);
  assert.equal(run.transport.calls.includes("PB-04"), false);
});

await check("server Grant is unique and concurrent fulfillment has one owner", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  assert.equal(prepared.status, "purchase_ready");
  const authority = syntheticPurchase(prepared.preparationCapability);
  const grant = await run.application.issueAssessmentGrant(authority);
  const duplicateGrant = await run.application.issueAssessmentGrant(authority);
  assert.deepEqual(duplicateGrant, grant);
  assert.equal(run.lifecycleRepository.grants.size, 1);
  assert.equal(run.lifecycleRepository.logicalAssessments.size, 1);
  const callsBeforeFulfillment = run.transport.calls.length;
  await assert.rejects(
    () =>
      run.application.fulfillAssessmentGrant({
        schemaVersion: "rc1-assessment-grant-handle-v1",
        grantId: crypto.randomUUID(),
        logicalAssessmentId: crypto.randomUUID(),
      }),
    (error) => safeCode(error) === "PRODUCTION_GRANT_INVALID",
  );
  assert.equal(run.transport.calls.length, callsBeforeFulfillment);
  const settled = await Promise.allSettled([
    run.application.fulfillAssessmentGrant(grant),
    run.application.fulfillAssessmentGrant(grant),
  ]);
  assert.equal(settled.filter((entry) => entry.status === "fulfilled").length, 1);
  assert.equal(settled.filter((entry) => entry.status === "rejected").length, 1);
  assert.equal(run.lifecycleRepository.deliveries.size, 1);
  assert.equal(run.runtimeRepository.reports.size, 1);
  assert.equal(run.lifecycleRepository.generationStartedTransitions, 1);
  const fulfilled = settled.find((entry) => entry.status === "fulfilled").value;
  assert.deepEqual(run.transport.calls.slice(-3), ["PB-04", "PB-05", "PB-06"]);
  assert.equal(
    JSON.stringify(run.lifecycleRepository.credentials).includes(
      fulfilled.resultToken,
    ),
    false,
  );
  const resolved = await run.application.resolveResult(fulfilled.resultToken);
  assert.deepEqual(resolved.projection, fulfilled.projection);
  const persistedDelivery = [...run.lifecycleRepository.deliveries.values()][0];
  assert.equal(
    persistedDelivery.projectionHash,
    hashProductionSnapshot(persistedDelivery.projection),
  );
  assert.equal(
    /(?:requestId|runId|responseId|providerId|factId)/u.test(
      JSON.stringify(resolved.projection),
    ),
    false,
  );
  await assert.rejects(
    () => run.application.resolveResult(Buffer.alloc(32, 250).toString("base64url")),
    (error) => safeCode(error) === "PRODUCTION_RESULT_NOT_FOUND",
  );
  await assert.rejects(
    () => run.application.resolveResult("malformed-token"),
    (error) => safeCode(error) === "PRODUCTION_RESULT_NOT_FOUND",
  );
  const originalCredential = [...run.lifecycleRepository.credentials.values()].find(
    (candidate) => candidate.purpose === "customer_handoff",
  );
  await run.lifecycleRepository.revokeResultCredential(
    originalCredential.id,
    selected.fixed_clock,
  );
  await assert.rejects(
    () => run.application.resolveResult(fulfilled.resultToken),
    (error) => safeCode(error) === "PRODUCTION_RESULT_NOT_FOUND",
  );
  const providerCalls = run.transport.calls.length;
  const replay = await run.application.fulfillAssessmentGrant(grant);
  assert.equal(replay.duplicate, true);
  assert.deepEqual(replay.projection, fulfilled.projection);
  assert.equal(run.transport.calls.length, providerCalls);
  assert.equal(run.lifecycleRepository.deliveries.size, 1);
  assert.equal(run.runtimeRepository.reports.size, 1);
});

await check("tampered canonical delivery fails every Customer read closed", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  const fulfilled = await run.application.fulfillAssessmentGrant(grant);
  const delivery = [...run.lifecycleRepository.deliveries.values()][0];
  delivery.projection.openingLine = `${delivery.projection.openingLine} tampered`;
  await assert.rejects(
    () => run.application.resolveResult(fulfilled.resultToken),
    (error) =>
      safeCode(error) ===
        "PRODUCTION_CANONICAL_DELIVERY_INTEGRITY_FAILED" &&
      !isProductionResultNotFoundError(error),
  );
  await assert.rejects(
    () => run.application.fulfillAssessmentGrant(grant),
    (error) =>
      safeCode(error) === "PRODUCTION_CANONICAL_DELIVERY_INTEGRITY_FAILED",
  );
});

await check("only result absence maps to 404; service faults propagate", async () => {
  assert.equal(
    isProductionResultNotFoundError(
      new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404),
    ),
    true,
  );
  for (const error of [
    new M2RuntimeError("PRODUCTION_DATABASE_OPERATION_FAILED", 503),
    new M2RuntimeError("PRODUCTION_RUNTIME_CONFIGURATION_INVALID", 503),
    new M2RuntimeError(
      "PRODUCTION_CANONICAL_DELIVERY_INTEGRITY_FAILED",
      503,
    ),
    new Error("unexpected"),
  ]) {
    assert.equal(isProductionResultNotFoundError(error), false);
  }
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  run.lifecycleRepository.resolveResultToken = async () => {
    throw new M2RuntimeError("PRODUCTION_DATABASE_OPERATION_FAILED", 503);
  };
  await assert.rejects(
    () =>
      run.application.resolveResult(
        Buffer.alloc(32, 249).toString("base64url"),
      ),
    (error) =>
      safeCode(error) === "PRODUCTION_DATABASE_OPERATION_FAILED" &&
      !isProductionResultNotFoundError(error),
  );
  const page = readText("app/result/[token]/page.tsx");
  assert.match(page, /catch \(error\)/u);
  assert.match(page, /isProductionResultNotFoundError\(error\)/u);
  assert.match(page, /throw error/u);
  assert.doesNotMatch(page, /catch\s*\{\s*notFound\(\)/u);
});

await check("pre-provider persistence failure leaves generation_started unset", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs(), {
    failOnceAt: "startStage:PB-04",
  });
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  assert.equal(prepared.status, "purchase_ready");
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  await assert.rejects(() => run.application.fulfillAssessmentGrant(grant));
  const logical = [...run.lifecycleRepository.logicalAssessments.values()][0];
  assert.equal(logical.generationStartedAt, null);
  assert.equal(run.lifecycleRepository.generationStartedTransitions, 0);
  assert.equal(run.runtimeRepository.reports.size, 0);
  assert.equal(run.lifecycleRepository.deliveries.size, 0);
});

await check("active logical lease cannot be stolen by a duplicate worker", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  const logical = run.lifecycleRepository.logicalAssessments.get(
    grant.logicalAssessmentId,
  );
  logical.status = "generating";
  logical.ownerId = crypto.randomUUID();
  logical.leaseExpiresAt = new Date(
    Date.parse(selected.fixed_clock) + 60_000,
  ).toISOString();
  const providerCalls = run.transport.calls.length;
  await assert.rejects(
    () => run.application.fulfillAssessmentGrant(grant),
    (error) => safeCode(error) === "PRODUCTION_FULFILLMENT_IN_PROGRESS",
  );
  assert.equal(run.transport.calls.length, providerCalls);
});

await check("expired pre-provider logical lease is safely reclaimable", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  const logical = run.lifecycleRepository.logicalAssessments.get(
    grant.logicalAssessmentId,
  );
  logical.status = "generating";
  logical.ownerId = crypto.randomUUID();
  logical.leaseExpiresAt = new Date(
    Date.parse(selected.fixed_clock) - 1_000,
  ).toISOString();
  logical.generationStartedAt = null;
  const fulfilled = await run.application.fulfillAssessmentGrant(grant);
  assert.equal(fulfilled.status, "completed");
  assert.deepEqual(run.transport.calls.slice(-3), ["PB-04", "PB-05", "PB-06"]);
});

await check("expired post-provider ambiguity is quarantined without Provider replay", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  const logical = run.lifecycleRepository.logicalAssessments.get(
    grant.logicalAssessmentId,
  );
  logical.status = "generating";
  logical.ownerId = crypto.randomUUID();
  logical.leaseExpiresAt = new Date(
    Date.parse(selected.fixed_clock) - 1_000,
  ).toISOString();
  logical.generationStartedAt = selected.fixed_clock;
  const providerCalls = run.transport.calls.length;
  await assert.rejects(
    () => run.application.fulfillAssessmentGrant(grant),
    (error) => safeCode(error) === "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS",
  );
  assert.equal(run.transport.calls.length, providerCalls);
  assert.equal(logical.status, "retryable");
  assert.equal(logical.lastErrorCode, "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS");
});

await check("post-Report canonicalization retry reuses V17 Report without Provider replay", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(
    selected,
    case5Outputs(),
    {},
    { failOnceAt: "completeFulfillment" },
  );
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  await assert.rejects(() => run.application.fulfillAssessmentGrant(grant));
  assert.equal(run.runtimeRepository.reports.size, 1);
  assert.equal(run.lifecycleRepository.deliveries.size, 0);
  const providerCalls = run.transport.calls.length;
  const recovered = await run.application.fulfillAssessmentGrant(grant);
  assert.equal(recovered.status, "completed");
  assert.equal(recovered.duplicate, true);
  assert.equal(run.transport.calls.length, providerCalls);
  assert.equal(run.runtimeRepository.reports.size, 1);
  assert.equal(run.lifecycleRepository.deliveries.size, 1);
  assert.equal(run.lifecycleRepository.generationStartedTransitions, 1);
});

await check("completed-result recovery is DB-only and cannot enter the Provider pipeline", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  await run.application.fulfillAssessmentGrant(grant);
  const providerCalls = run.transport.calls.length;
  const credentialCount = run.lifecycleRepository.credentials.size;
  const recovered = await run.application.recoverCompletedAssessmentGrant(grant);
  assert.equal(recovered.status, "completed");
  assert.equal(recovered.duplicate, true);
  assert.equal(run.transport.calls.length, providerCalls);
  assert.equal(run.lifecycleRepository.credentials.size, credentialCount + 1);
});

await check("notification failure retries independently without regenerating assessment", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  await run.application.fulfillAssessmentGrant(grant);
  const notification = [...run.lifecycleRepository.notifications.values()][0];
  const providerCalls = run.transport.calls.length;
  await assert.rejects(
    () =>
      run.application.processNotification(
        notification.id,
        new UnconfiguredDeliveryNotificationAdapterV1(),
      ),
    (error) =>
      safeCode(error) === "PRODUCTION_NOTIFICATION_PROVIDER_UNCONFIGURED",
  );
  assert.equal(
    run.lifecycleRepository.notifications.get(notification.id).status,
    "failed",
  );
  const fakeAdapter = new DeterministicFakeDeliveryNotificationAdapterV1();
  assert.deepEqual(
    await run.application.processNotification(notification.id, fakeAdapter),
    { status: "sent", duplicate: false },
  );
  assert.equal(
    run.lifecycleRepository.notifications.get(notification.id).status,
    "sent",
  );
  const deliveryCalls = fakeAdapter.requests.length;
  assert.deepEqual(
    await run.application.processNotification(notification.id, fakeAdapter),
    { status: "sent", duplicate: true },
  );
  assert.equal(fakeAdapter.requests.length, deliveryCalls);
  assert.equal(run.transport.calls.length, providerCalls);
  assert.equal(run.runtimeRepository.reports.size, 1);
  assert.equal(run.lifecycleRepository.deliveries.size, 1);
});

await check("notification ownership is fenced and only expired leases are reclaimable", async () => {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(
    consultationFor(selected),
    crypto.randomUUID(),
  );
  const grant = await run.application.issueAssessmentGrant(
    syntheticPurchase(prepared.preparationCapability),
  );
  await run.application.fulfillAssessmentGrant(grant);
  const notification = [...run.lifecycleRepository.notifications.values()][0];
  const manualReviewAdapter =
    new DeterministicFakeDeliveryNotificationAdapterV1();
  notification.status = "processing";
  notification.ownerId = crypto.randomUUID();
  await assert.rejects(
    () =>
      run.application.processNotification(notification.id, manualReviewAdapter),
    (error) => safeCode(error) === "PRODUCTION_NOTIFICATION_MANUAL_REVIEW",
  );
  assert.equal(manualReviewAdapter.requests.length, 0);
  notification.status = "pending";
  notification.ownerId = null;
  const oldOwner = crypto.randomUUID();
  const first = await run.lifecycleRepository.claimNotification({
    notificationId: notification.id,
    ownerId: oldOwner,
    leaseExpiresAt: new Date(
      Date.parse(selected.fixed_clock) + 5 * 60_000,
    ).toISOString(),
    now: selected.fixed_clock,
  });
  assert.equal(first.disposition, "acquired");
  const afterExpiry = new Date(
    Date.parse(selected.fixed_clock) + 6 * 60_000,
  ).toISOString();
  await assert.rejects(
    () =>
      run.lifecycleRepository.completeNotification({
        notificationId: notification.id,
        ownerId: oldOwner,
        providerMessageReference: "stale-owner-message",
        now: afterExpiry,
      }),
    (error) => safeCode(error) === "PRODUCTION_NOTIFICATION_STATE_CONFLICT",
  );
  const newOwner = crypto.randomUUID();
  const reclaimed = await run.lifecycleRepository.claimNotification({
    notificationId: notification.id,
    ownerId: newOwner,
    leaseExpiresAt: new Date(
      Date.parse(afterExpiry) + 5 * 60_000,
    ).toISOString(),
    now: afterExpiry,
  });
  assert.equal(reclaimed.disposition, "acquired");
  await run.lifecycleRepository.completeNotification({
    notificationId: notification.id,
    ownerId: newOwner,
    providerMessageReference: "reclaimed-message",
    now: afterExpiry,
  });
  assert.equal(notification.status, "sent");
});

await check("migration encodes durable uniqueness, ownership, result, and outbox invariants", () => {
  const migration = readText(
    "supabase/migrations/0010_rc1_production_fulfillment_core.sql",
  );
  for (const required of [
    "preparation_id uuid not null unique",
    "grant_id uuid not null unique",
    "logical_assessment_id uuid not null unique",
    "runtime_run_id uuid not null unique",
    "token_hash text not null unique",
    "delivery_id uuid not null unique",
    "mark_production_generation_started_v1",
    "complete_production_fulfillment_v1",
    "resolve_production_result_v1",
    "'projection_sha256', deliveries.projection_sha256",
    "production_notification_outbox",
    "prompt-bundle-runtime-v17.0.0",
    "reused_purchase_ready_authority",
  ]) {
    assert.ok(migration.includes(required), required);
  }
  assert.doesNotMatch(migration, /expires_at\s+timestamptz\s+not null/iu);
  const repository = readText(
    "lib/assessment/production/supabase-repository.ts",
  );
  assert.equal(
    repository.match(/decodeAndVerifyProductionCanonicalProjection/g)?.length,
    3,
  );
});

// F001 deterministic application fault states. Native process termination and
// SQL concurrency are separately exercised by verify-f001-recovery-db.mjs.
async function interruptedAfterReport() {
  const selected = fixture("polite_thank_you_with_draft");
  const run = await harness(selected, case5Outputs());
  const prepared = await run.application.prepare(consultationFor(selected), crypto.randomUUID());
  const grant = await run.application.issueAssessmentGrant(syntheticPurchase(prepared.preparationCapability));
  const complete = run.lifecycleRepository.completeFulfillment.bind(run.lifecycleRepository);
  const fail = run.lifecycleRepository.failFulfillment.bind(run.lifecycleRepository);
  let oldRecord;
  run.lifecycleRepository.completeFulfillment = async (record) => { oldRecord = record; throw new Error("synthetic abrupt stop before canonical write"); };
  run.lifecycleRepository.failFulfillment = async () => {}; // Model no compensating write after process loss.
  await assert.rejects(run.application.fulfillAssessmentGrant(grant));
  assert.equal(run.runtimeRepository.reports.size, 1);
  assert.equal(run.lifecycleRepository.deliveries.size, 0);
  run.lifecycleRepository.completeFulfillment = complete;
  run.lifecycleRepository.failFulfillment = fail;
  selected.fixed_clock = new Date(Date.parse(selected.fixed_clock) + 17 * 60_000).toISOString();
  return { run, grant, selected, oldRecord };
}

await check("F001 saved Report survives expired generating lease; stale owner cannot publish; canonical <=1", async () => {
  const { run, grant, selected, oldRecord } = await interruptedAfterReport();
  const calls = run.transport.calls.length;
  const results = await Promise.allSettled([
    run.application.fulfillAssessmentGrant(grant),
    run.application.fulfillAssessmentGrant(grant),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  await assert.rejects(run.lifecycleRepository.completeFulfillment({ ...oldRecord, now: selected.fixed_clock }));
  const duplicate = await run.application.fulfillAssessmentGrant(grant);
  assert.equal(duplicate.duplicate, true);
  assert.equal(run.transport.calls.length, calls);
  assert.equal(run.lifecycleRepository.deliveries.size, 1);
  assert.equal(run.lifecycleRepository.generationStartedTransitions, 1);
});

for (const fault of ["input", "contract", "report", "run", "grant"]) {
  await check(`F001 saved ${fault} inconsistency is never published or regenerated`, async () => {
    const { run, grant } = await interruptedAfterReport();
    const calls = run.transport.calls.length;
    const logical = run.lifecycleRepository.logicalAssessments.get(grant.logicalAssessmentId);
    const preparation = run.lifecycleRepository.preparations.get(logical.preparationId);
    if (fault === "input") {
      preparation.purchaseReadyAuthority.request.currentSituation += " changed";
      preparation.purchaseReadyAuthorityHash = hashProductionSnapshot(preparation.purchaseReadyAuthority);
    }
    if (fault === "contract") {
      preparation.purchaseReadyAuthority.runtimeIdentity.schemaSetVersion = "different-contract";
      preparation.purchaseReadyAuthorityHash = hashProductionSnapshot(preparation.purchaseReadyAuthority);
    }
    if (fault === "report") [...run.runtimeRepository.reports.values()][0].reportJson = {};
    if (fault === "run") {
      const reportId = [...run.runtimeRepository.reports.keys()][0];
      run.runtimeRepository.runs.get(reportId).promptBundleVersion = "different-contract";
    }
    if (fault === "grant") grant.logicalAssessmentId = crypto.randomUUID();
    await assert.rejects(run.application.fulfillAssessmentGrant(grant));
    assert.equal(run.transport.calls.length, calls);
    assert.equal(run.lifecycleRepository.deliveries.size, 0);
  });
}

if (failures.length > 0) {
  console.error(`\n${failures.length} RC-1 verifier check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nRC-1 Production Fulfillment Core: PASS ${checks}/${checks}`);
  console.log(
    "External operations: Provider=0 SupabaseRemote=0 MigrationApply=0 Payment=0 EmailSend=0 Deploy=0",
  );
}
