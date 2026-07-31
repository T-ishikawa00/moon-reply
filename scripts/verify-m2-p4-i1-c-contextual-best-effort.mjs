import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "c27120eea067f91c5e9ef4447e382f55a329e158";
const exactPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-03-projection-v3.developer.md",
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
  "lib/assessment/runtime/contracts/pb-04-decision-plan-v2.developer.md",
  "lib/assessment/runtime/contracts/pb-05-report-writer-v2.developer.md",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
  "lib/assessment/runtime/contextual-inference-v3.ts",
  "lib/assessment/runtime/eligibility-v3.ts",
  "lib/assessment/runtime/policy-v3.ts",
  "scripts/verify-m2-p4-i1-c-contextual-best-effort.mjs",
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_C_REVIEW.md",
  "lib/assessment/runtime/schema-catalog.ts",
  "lib/assessment/runtime/service.ts",
  "lib/assessment/runtime/pipeline.ts",
  "scripts/verify-m2-eval-foundation.mjs",
  "scripts/verify-m2-p3-runtime-vertical-slice.mjs",
  "docs/CURRENT_FOCUS.md",
  "docs/WBS.md",
  "docs/CODEX_HANDOFF.md",
];
const stageIds = ["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"];
const decisionNames = [
  "reply_now",
  "send_now",
  "wait_and_reassess",
  "pause_additional_contact",
];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function canonicalText(value) {
  return value.replace(/\r\n/gu, "\n");
}

function hashText(value) {
  return createHash("sha256")
    .update(Buffer.from(canonicalText(value), "utf8"))
    .digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function gitText(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function deterministicUuidFactory() {
  let sequence = 0;
  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`;
  };
}

const [
  { AssessmentApplication },
  { FakeAssessmentRepository, safetyBlockedStageOutputs, wait003StageOutputs },
  { loadM2P4ContextualRuntimeStageCatalog },
  { assertOpenAIStructuredOutputSchema, toOpenAiStructuredOutputSchema },
  {
    buildContextualDecisionPolicyV3,
    projectDecisionFactsV2ToV1,
    requireContextualDecisionFactsV3,
  },
  {
    buildLocalEligibilityResultV3,
    deriveRuntimeEligibilityV3,
    validateEligibilityProjectionV3,
  },
  { validateStageOutput },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
  import("../lib/assessment/runtime/policy-v3.ts"),
  import("../lib/assessment/runtime/eligibility-v3.ts"),
  import("../lib/assessment/runtime/validation.ts"),
]);

const protectedHistoricalPaths = [
  "lib/assessment/runtime/contracts/pb-01-structure-v2.developer.md",
  "lib/assessment/runtime/contracts/structured-intake-v2.schema.json",
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v2.json",
  "lib/assessment/runtime/policy-v2.ts",
  "scripts/verify-m2-p4-i1-b-runtime-integration.mjs",
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
  "docs/phase2/TASK_M2_P4_I1_B_REVIEW.md",
  "evals/quality/m2-p4-i1",
  "ai/prompts",
  "ai/schemas",
  "evals/development",
  "evals/holdout",
  "app",
  "components",
  "supabase",
  "package.json",
  "package-lock.json",
  "next-env.d.ts",
];
assert.equal(
  gitText(["diff", "--name-only", baselineSha, "--", ...protectedHistoricalPaths]).trim(),
  "",
);

const manifest = json(
  "lib/assessment/runtime/contracts/runtime-stage-catalog-v3.json",
);
assert.equal(manifest.schema_version, "m2-p4-runtime-stage-catalog-v1");
assert.equal(manifest.catalog_version, "runtime-stage-catalog-v3.0.0");
assert.equal(manifest.prompt_bundle_version, "prompt-bundle-runtime-v3.0.0");
assert.equal(manifest.schema_set_version, "pipeline-schema-runtime-v3.0.0");
assert.equal(manifest.baseline, baselineSha);
assert.deepEqual(manifest.stages.map((stage) => stage.stage_id), stageIds);
for (const stage of manifest.stages) {
  assert.equal(hashText(source(stage.prompt_path)), stage.prompt_sha256);
  assert.equal(hashText(source(stage.schema_path)), stage.schema_sha256);
}

const catalog = await loadM2P4ContextualRuntimeStageCatalog();
assert.equal(catalog.promptBundleVersion, "prompt-bundle-runtime-v3.0.0");
assert.equal(catalog.schemaSetVersion, "pipeline-schema-runtime-v3.0.0");
for (const definition of catalog.definitions) {
  const providerSchema = toOpenAiStructuredOutputSchema(definition.outputSchema);
  assert.doesNotThrow(() => assertOpenAIStructuredOutputSchema(providerSchema));
}

const structuredSchema = json(
  "lib/assessment/runtime/contracts/structured-intake-v3.schema.json",
);
const projectionSchema = json(
  "lib/assessment/runtime/contracts/eligibility-projection-v3.schema.json",
);
assert.equal(structuredSchema.type, "object");
assert.equal(structuredSchema.additionalProperties, false);
assert.deepEqual(structuredSchema.properties.decision_facts, {
  $ref: "#/$defs/decision_facts",
});
assert.equal(
  structuredSchema.$defs.decision_facts.properties.information_state.properties
    .can_proceed_without_followup.const,
  true,
);
assert.equal(
  structuredSchema.$defs.decision_facts.properties.information_state.properties
    .assessment_mode.const,
  "best_effort",
);
assert.equal(
  structuredSchema.$defs.context_inference.additionalProperties,
  false,
);
assert.deepEqual(
  sorted(structuredSchema.$defs.context_inference.required),
  sorted(Object.keys(structuredSchema.$defs.context_inference.properties)),
);
assert.ok(!Object.hasOwn(structuredSchema, "anyOf"));
assert.ok(!projectionSchema.properties.acknowledged_eligibility.enum.includes("needs_more_information"));
assert.deepEqual(projectionSchema.properties.acknowledged_eligibility.enum, [
  "ready",
  "safety_blocked",
]);
assert.deepEqual(sorted(projectionSchema.required), sorted(Object.keys(projectionSchema.properties)));

function verifyStrictObjects(node) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) verifyStrictObjects(child);
    return;
  }
  if (node.type === "object") {
    assert.equal(node.additionalProperties, false);
    assert.deepEqual(sorted(node.required), sorted(Object.keys(node.properties)));
  }
  for (const child of Object.values(node)) verifyStrictObjects(child);
}
verifyStrictObjects(structuredSchema);
verifyStrictObjects(projectionSchema);

const pb01Prompt = source(
  "lib/assessment/runtime/contracts/pb-01-structure-v3.developer.md",
);
for (const required of [
  "An incomplete consultation is normal",
  "infer contextually natural categorical facts",
  "decision_facts` is always an object",
  "do not block the consultation",
  "inner state",
  "future behavior",
  "reply probability",
  "Safety and boundary guardrails",
]) {
  assert.ok(pb01Prompt.includes(required), `PB-01 prompt missing ${required}`);
}
for (const prohibited of [
  "M2P4-LIVE-001",
  "REPLY-004",
  "case_id",
  "caseId",
  "oracle lookup",
  "currentSituation.match",
]) {
  assert.ok(!pb01Prompt.includes(prohibited), `PB-01 prompt contains ${prohibited}`);
}

function decisionFacts(overrides = {}) {
  const base = {
    schema_version: "m2-p4-decision-facts-v2",
    relationship_stage: "ambiguous",
    selected_requests: ["decide_send_or_wait", "draft_message"],
    latest_direct_message: {
      sender: "unknown",
      kind: "unknown",
      response_expectation: "unknown",
      user_reply_state: "unknown",
      sns_signal_only: false,
    },
    contact_state: {
      unanswered_user_message_count: null,
      elapsed_since_latest_user_message_minutes: null,
      usual_cadence_relation: "unknown",
      proposed_message_present: false,
    },
    boundary_state: {
      kind: "none",
      status: "none",
      repeated_unanswered_contact: false,
    },
    practical_reason: {
      kind: "none",
      active: false,
      deadline: "none",
    },
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
  return {
    ...base,
    ...overrides,
    latest_direct_message: {
      ...base.latest_direct_message,
      ...overrides.latest_direct_message,
    },
    contact_state: { ...base.contact_state, ...overrides.contact_state },
    boundary_state: { ...base.boundary_state, ...overrides.boundary_state },
    practical_reason: { ...base.practical_reason, ...overrides.practical_reason },
    information_state: {
      ...base.information_state,
      ...overrides.information_state,
    },
  };
}

function structuredIntake(facts, inferredFields = []) {
  return {
    schema_version: "pipeline-schema-v3.0.0",
    relationship_stage: facts.relationship_stage,
    user_goal: "decide_send_or_wait",
    timeline: [],
    boundaries:
      facts.boundary_state.status === "explicit"
        ? [
            {
              boundary_id: "B001",
              kind: facts.boundary_state.kind,
              status: "explicit",
              statement: "入力に明確な連絡境界がある。",
              source_refs: ["input:current_situation"],
            },
          ]
        : [],
    context: [],
    observed_facts: [
      {
        fact_id: "F001",
        statement: "判断対象となる相談入力がある。",
        source_refs: ["input:current_situation"],
        support: "explicit",
      },
    ],
    user_assumptions: [],
    user_emotions: [],
    material_unknowns: facts.information_state.unresolved_fields.map((field) => ({
      unknown_code: field.replaceAll(".", "_"),
      description: `${field} は入力だけでは解消していない。`,
      material_to: ["decision"],
    })),
    safety_signals: [],
    untrusted_embedded_instructions_detected: false,
    context_inferences: inferredFields.map((field, index) => ({
      inference_id: `I${String(index + 1).padStart(3, "0")}`,
      field_path: field,
      supporting_fact_ids: ["F001"],
      source_refs: ["input:current_situation"],
      rationale_summary: "相談文全体の役割と時系列から自然に分類できる。",
    })),
    decision_facts: facts,
  };
}

const incomingReply = {
  latest_direct_message: {
    sender: "other_person",
    kind: "thanks_or_followup",
    response_expectation: "reasonable",
    user_reply_state: "not_replied",
    sns_signal_only: false,
  },
};
const baselineFacts = decisionFacts({
  relationship_stage: "matching_app",
  ...incomingReply,
  contact_state: {
    unanswered_user_message_count: 0,
    elapsed_since_latest_user_message_minutes: null,
    usual_cadence_relation: "not_applicable",
    proposed_message_present: true,
  },
  information_state: {
    used_context_inference: true,
    unresolved_fields: ["contact_state.elapsed_since_latest_user_message_minutes"],
  },
});
const baselineInferenceFields = [
  "latest_direct_message.sender",
  "latest_direct_message.kind",
  "latest_direct_message.response_expectation",
  "latest_direct_message.user_reply_state",
];
const baselineIntake = structuredIntake(baselineFacts, baselineInferenceFields);
assert.doesNotThrow(() => validateStageOutput(catalog.definitions[0], baselineIntake));
assert.equal(requireContextualDecisionFactsV3(baselineIntake), baselineFacts);
assert.equal(projectDecisionFactsV2ToV1(baselineFacts).information_state.complete_for_decision, true);

assert.equal(deriveRuntimeEligibilityV3({ classification: "normal_allowed" }), "ready");
assert.equal(deriveRuntimeEligibilityV3({ classification: "needs_review" }), "safety_blocked");
assert.equal(deriveRuntimeEligibilityV3({ classification: "rejected" }), "safety_blocked");
assert.deepEqual(buildLocalEligibilityResultV3("ready"), {
  schema_version: "m2-p4-runtime-eligibility-v3",
  eligibility: "ready",
  question_codes: [],
  normal_flow_allowed: true,
  payment_allowed: true,
  report_generation: "allowed",
});
assert.throws(
  () => validateEligibilityProjectionV3({ acknowledged_eligibility: "safety_blocked" }, "ready"),
  (error) => error?.safeCode === "M2_ELIGIBILITY_PROJECTION_MISMATCH",
);

class OfflineFakeTransport {
  actualProviderCalls = 0;
  calls = [];
  requests = [];

  constructor(outputs) {
    this.outputs = structuredClone(outputs);
  }

  async invoke(request) {
    this.calls.push(request.stageId);
    this.requests.push(structuredClone(request));
    return {
      responseId: `offline-${request.stageId.toLowerCase()}-${this.calls.length}`,
      returnedModel: request.model,
      output: structuredClone(this.outputs[request.stageId]),
      usage: {
        inputTokens: 10,
        cachedTokens: 0,
        outputTokens: 10,
        reasoningTokens: 0,
      },
      latencyMs: 1,
    };
  }
}

function decisionPlanFor(outputs, decision) {
  const plan = { ...outputs["PB-04"], selected_decision: decision };
  plan.message_draft =
    decision === "reply_now" || decision === "send_now"
      ? {
          text: "ありがとうございます。予定を確認して、またご連絡します。",
          policy: "required_now",
          use_timing: "now",
        }
      : null;
  return plan;
}

function runtimeOutputs(testCase) {
  const outputs = testCase.safetyBlocked
    ? safetyBlockedStageOutputs()
    : wait003StageOutputs();
  outputs["PB-01"] = structuredIntake(testCase.facts, testCase.inferredFields ?? []);
  outputs["PB-03"] = {
    schema_version: "pipeline-schema-v3.0.0",
    acknowledged_eligibility: testCase.safetyBlocked ? "safety_blocked" : "ready",
  };
  outputs["PB-04"] = decisionPlanFor(outputs, testCase.expectedDecision);
  return outputs;
}

const testCases = [
  {
    id: "SPARSE-01",
    facts: decisionFacts({
      ...incomingReply,
      information_state: {
        used_context_inference: true,
        unresolved_fields: ["contact_state.elapsed_since_latest_user_message_minutes"],
      },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-02",
    facts: decisionFacts({
      ...incomingReply,
      information_state: {
        used_context_inference: true,
        unresolved_fields: ["contact_state.usual_cadence_relation"],
      },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-03",
    facts: decisionFacts({
      ...incomingReply,
      information_state: { used_context_inference: true },
    }),
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  {
    id: "SPARSE-04",
    facts: decisionFacts({
      latest_direct_message: {
        sender: "user",
        kind: "other",
        response_expectation: "optional",
        user_reply_state: "not_applicable",
        sns_signal_only: false,
      },
      information_state: { used_context_inference: true },
    }),
    inferredFields: ["latest_direct_message.sender"],
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-05",
    facts: decisionFacts({
      practical_reason: {
        kind: "schedule_coordination",
        active: true,
        deadline: "next_day",
      },
      information_state: { used_context_inference: true },
    }),
    inferredFields: ["practical_reason.kind", "practical_reason.active"],
    expectedDecision: "send_now",
  },
  {
    id: "SPARSE-06",
    facts: decisionFacts({
      information_state: {
        unresolved_fields: [
          "latest_direct_message.sender",
          "latest_direct_message.kind",
          "latest_direct_message.response_expectation",
        ],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-07",
    facts: decisionFacts({
      information_state: {
        unresolved_fields: ["latest_direct_message.sender"],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-08",
    facts: decisionFacts({
      latest_direct_message: {
        sender: "none",
        kind: "social_acknowledgement",
        response_expectation: "none",
        user_reply_state: "not_applicable",
        sns_signal_only: true,
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
  {
    id: "SPARSE-09",
    facts: decisionFacts({
      boundary_state: {
        kind: "no_contact",
        status: "explicit",
        repeated_unanswered_contact: false,
      },
    }),
    expectedDecision: "pause_additional_contact",
  },
  {
    id: "SPARSE-10",
    facts: decisionFacts({
      boundary_state: {
        kind: "none",
        status: "none",
        repeated_unanswered_contact: true,
      },
    }),
    expectedDecision: "pause_additional_contact",
  },
  {
    id: "SPARSE-11-SAFETY",
    facts: decisionFacts(),
    expectedDecision: "wait_and_reassess",
    safetyBlocked: true,
  },
  {
    id: "SPARSE-12",
    facts: decisionFacts({
      relationship_stage: "unknown",
      information_state: {
        unresolved_fields: [
          "relationship_stage",
          "latest_direct_message.sender",
          "latest_direct_message.kind",
          "latest_direct_message.response_expectation",
          "latest_direct_message.user_reply_state",
          "contact_state.unanswered_user_message_count",
          "contact_state.elapsed_since_latest_user_message_minutes",
          "contact_state.usual_cadence_relation",
        ],
      },
    }),
    expectedDecision: "wait_and_reassess",
  },
];

const syntheticInput = {
  currentSituation:
    "マッチング後に会った相手から、お礼と次の予定に触れる連絡が届きました。まだ返しておらず、短く返す文面を考えています。",
  optionalMessage: "こちらこそありがとう。次の予定も楽しみにしています。",
  relationship: "matching_app",
  requestedTopics: ["decide_send_or_wait", "draft_message"],
  privacyAcknowledged: true,
};

async function runCase(testCase, index) {
  const trace = [];
  const repository = new FakeAssessmentRepository();
  const transport = new OfflineFakeTransport(runtimeOutputs(testCase));
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    observe: (event) => trace.push(event),
    now: () => "2026-07-31T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  const result = await application.submit(
    syntheticInput,
    `90000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  );
  return { result, trace, repository, transport };
}

const caseResults = [];
for (const [index, testCase] of testCases.entries()) {
  const runtime = await runCase(testCase, index);
  caseResults.push(runtime);
  if (testCase.safetyBlocked) {
    assert.equal(runtime.result.eligibility, "safety_blocked");
    assert.deepEqual(runtime.transport.calls, ["PB-01", "PB-02", "PB-03"]);
    assert.equal(runtime.repository.reports.size, 0);
  } else {
    assert.equal(runtime.result.eligibility, "ready");
    assert.equal(runtime.result.decision, testCase.expectedDecision);
    assert.equal(runtime.result.decisionCard.decision, testCase.expectedDecision);
    assert.deepEqual(runtime.transport.calls, stageIds);
    assert.equal(runtime.repository.reports.size, 1);
  }
  assert.equal(runtime.transport.actualProviderCalls, 0);
  assert.equal(runtime.repository.actualSupabaseCalls, 0);
}

const baselineRuntime = await runCase(
  {
    id: "BASELINE-SANITIZED",
    facts: baselineFacts,
    inferredFields: baselineInferenceFields,
    expectedDecision: "reply_now",
  },
  20,
);
assert.equal(baselineRuntime.result.decision, "reply_now");
assert.equal(baselineRuntime.repository.reports.size, 1);
const baselinePb04 = baselineRuntime.transport.requests.find(
  (request) => request.stageId === "PB-04",
);
assert.equal(
  baselinePb04.input.eligibility_result.schema_version,
  "m2-p4-runtime-eligibility-v3",
);
assert.equal(baselinePb04.input.eligibility_result.eligibility, "ready");
assert.ok(!Object.hasOwn(baselinePb04.input, "application_eligibility_expectation"));

const fixtures = json(
  "evals/quality/m2-p4-i1/decision-facts-fixtures-v1.json",
);
assert.equal(fixtures.length, 40);
const categoryPasses = new Map(decisionNames.map((decision) => [decision, 0]));
for (const fixture of fixtures) {
  const factsV2 = {
    ...structuredClone(fixture.facts),
    schema_version: "m2-p4-decision-facts-v2",
    information_state: {
      assessment_mode: "best_effort",
      can_proceed_without_followup: true,
      used_context_inference: false,
      unresolved_fields: [],
    },
  };
  const contextual = buildContextualDecisionPolicyV3(factsV2);
  assert.equal(contextual.allowed_decisions[0], fixture.expected_decision);
  categoryPasses.set(
    fixture.expected_decision,
    categoryPasses.get(fixture.expected_decision) + 1,
  );
}
for (const decision of decisionNames) assert.equal(categoryPasses.get(decision), 10);

const policySource = source("lib/assessment/runtime/policy-v3.ts");
for (const marker of [
  "currentSituation",
  "current_situation",
  "case_id",
  "caseId",
  "reference_draft",
  "oracle",
  "evals/",
  "RegExp",
]) {
  assert.ok(!policySource.includes(marker), `policy-v3 contains ${marker}`);
}

const capabilityManifest = json(
  "evals/runtime/m2-p4-i1-c-capabilities-v1.json",
);
assert.equal(capabilityManifest.task_id, "M2-P4-I1-C");
assert.equal(capabilityManifest.status, "implementation_pending_human_chatgpt_review");
assert.equal(capabilityManifest.baseline.commit, baselineSha);
assert.deepEqual(capabilityManifest.implementation_paths, exactPaths);
assert.deepEqual(capabilityManifest.task_execution_evidence, {
  openai_live_calls: 0,
  database_operations: 0,
  migrations: 0,
  holdout_use: 0,
  real_user_data: 0,
  live_rerun_executed: false,
});

const changedPaths = new Set(
  gitText(["diff", "--name-only", baselineSha, "--"])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean),
);
for (const line of gitText(["status", "--porcelain=v1", "--untracked-files=all"])
  .split(/\r?\n/gu)
  .filter(Boolean)) {
  changedPaths.add(line.slice(3).trim().replaceAll("\\", "/"));
}
assert.deepEqual(sorted(changedPaths), sorted(exactPaths));

console.log("M2_P4_I1_C_CONTEXTUAL_BEST_EFFORT: PASS");
console.log("normal_information_gate_terminal: 0");
console.log("needs_more_information_runtime_path: 0");
console.log("contextual_inference_supported: PASS");
console.log("decision_facts_non_null: PASS");
console.log("sparse_normal_cases_ready: 11/11");
console.log("safety_blocked_cases: 1/1");
console.log("baseline_fake_decision: reply_now");
console.log("baseline_fake_report: 1");
console.log("policy_parity: 40/40");
console.log("openai_calls: 0");
console.log("db_operations: 0");
console.log("holdout_use: 0");
