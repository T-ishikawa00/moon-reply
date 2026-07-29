import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "72d4121ff4ad0682bcafbeed4f72f6491e697ffa";
const failures = new Map();

const gateOrder = [
  "M2_P3_RUNTIME_CAPABILITY_GATE",
  "M2_P3_INTERNAL_ROUTE_GATE",
  "M2_P3_PRODUCTION_DISABLE_GATE",
  "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
  "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
  "M2_P3_STORE_FALSE_GATE",
  "M2_P3_SUPABASE_SERVER_ONLY_GATE",
  "M2_P3_RLS_GATE",
  "M2_P3_DATABASE_SCHEMA_GATE",
  "M2_P3_IDEMPOTENCY_GATE",
  "M2_P3_PIPELINE_ORDER_GATE",
  "M2_P3_SAFETY_GATE",
  "M2_P3_DECISION_POLICY_GATE",
  "M2_P3_STAGE_PERSISTENCE_GATE",
  "M2_P3_FAIL_CLOSED_GATE",
  "M2_P3_NO_RETRY_GATE",
  "M2_P3_NO_REPAIR_GATE",
  "M2_P3_NO_FALLBACK_GATE",
  "M2_P3_USAGE_LEDGER_GATE",
  "M2_P3_FAKE_RUNTIME_GATE",
  "M2_P3_ZERO_LIVE_NETWORK_GATE",
  "M2_P3_ZERO_SPEND_GATE",
  "M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE",
];

for (const gateName of gateOrder) failures.set(gateName, []);

function source(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(source(relativePath));
}

function check(gateName, condition, detail) {
  if (!condition) failures.get(gateName).push(detail);
}

function gate(gateName, verification) {
  try {
    verification();
  } catch (error) {
    failures
      .get(gateName)
      .push(error instanceof Error ? error.message : String(error));
  }
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
  {
    FakeAiStageTransport,
    FakeAssessmentRepository,
    needsMoreInformationStageOutputs,
    safetyBlockedStageOutputs,
    wait003StageOutputs,
  },
  { loadCanonicalStageCatalog },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
]);

const catalog = await loadCanonicalStageCatalog();
const wait003Input = {
  currentSituation:
    "交際中です。2時間前に、最近寂しいと感じていることを長めのメッセージで送りました。まだ返信はありません。",
  optionalMessage:
    "怒ってる？さっきの重かったよね、ごめん。何か言ってほしい。",
  relationship: "in_relationship",
  requestedTopics: ["decide_send_or_wait", "message_impact"],
  privacyAcknowledged: true,
};

function makeApplication({
  outputs,
  repository = new FakeAssessmentRepository(),
  transportOptions = {},
  trace = [],
} = {}) {
  const transport = new FakeAiStageTransport({
    outputs: outputs ?? wait003StageOutputs(),
    ...transportOptions,
  });
  const application = new AssessmentApplication({
    repository,
    transport,
    model: "gpt-5.6-luna",
    promptBundleVersion: catalog.promptBundleVersion,
    schemaSetVersion: catalog.schemaSetVersion,
    definitions: catalog.definitions,
    observe: (event) => trace.push(event),
    now: () => "2026-07-29T00:00:00.000Z",
    uuid: deterministicUuidFactory(),
  });
  return { application, repository, transport, trace };
}

async function expectSafeFailure(application, expectedCode, key) {
  try {
    await application.submit(wait003Input, key);
    assert.fail(`expected ${expectedCode}`);
  } catch (error) {
    assert.equal(error?.safeCode, expectedCode);
  }
}

const happy = makeApplication();
const happyResult = await happy.application.submit(
  wait003Input,
  "10000000-0000-4000-8000-000000000001",
);
assert.equal(happyResult.eligibility, "ready");

const expectedTrace = [
  "PB-01",
  "LOCAL_SCHEMA_PB-01",
  "PB-02",
  "LOCAL_SCHEMA_PB-02",
  "PB-03",
  "LOCAL_SCHEMA_PB-03",
  "LOCAL_SAFETY_AGGREGATION",
  "LOCAL_ELIGIBILITY_GATE",
  "LOCAL_DECISION_POLICY",
  "PB-04",
  "LOCAL_SCHEMA_AND_PLAN_VALIDATION",
  "PB-05",
  "LOCAL_SCHEMA_AND_REPORT_VALIDATION",
  "PB-06",
  "LOCAL_SEMANTIC_DISPOSITION",
  "SAVE_FINAL_REPORT",
  "COMPLETE_RUN",
];

const duplicate = await happy.application.submit(
  wait003Input,
  "10000000-0000-4000-8000-000000000001",
);

const needsMore = makeApplication({
  outputs: needsMoreInformationStageOutputs(),
});
const needsMoreResult = await needsMore.application.submit(
  wait003Input,
  "20000000-0000-4000-8000-000000000001",
);

const safetyBlocked = makeApplication({
  outputs: safetyBlockedStageOutputs(),
});
const safetyBlockedResult = await safetyBlocked.application.submit(
  wait003Input,
  "30000000-0000-4000-8000-000000000001",
);

const schemaFailureOutputs = wait003StageOutputs();
schemaFailureOutputs["PB-01"] = {
  schema_version: "pipeline-schema-v1.0.0",
};
const schemaFailure = makeApplication({ outputs: schemaFailureOutputs });
await expectSafeFailure(
  schemaFailure.application,
  "M2_STAGE_SCHEMA_INVALID",
  "40000000-0000-4000-8000-000000000001",
);

const modelMismatch = makeApplication({
  transportOptions: {
    returnedModelAtStage: { "PB-02": "unexpected-model" },
  },
});
await expectSafeFailure(
  modelMismatch.application,
  "M2_STAGE_MODEL_MISMATCH",
  "50000000-0000-4000-8000-000000000001",
);

const databaseFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "completeStage:PB-03",
  }),
});
await expectSafeFailure(
  databaseFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "60000000-0000-4000-8000-000000000001",
);

const pb05Failure = makeApplication({
  transportOptions: { failAtStage: "PB-05" },
});
await expectSafeFailure(
  pb05Failure.application,
  "M2_FAKE_STAGE_FAILURE",
  "70000000-0000-4000-8000-000000000001",
);

const runtimeManifest = json(
  "evals/runtime/m2-p3-runtime-capabilities-v1.json",
);
const routeSource = source("app/api/internal/assessments/route.ts");
const pageSource = source("app/review/runtime/page.tsx");
const environmentSource = source("lib/assessment/runtime/environment.ts");
const transportSource = source(
  "lib/assessment/runtime/openai-transport.ts",
);
const repositorySource = source(
  "lib/assessment/runtime/supabase-repository.ts",
);
const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
const applicationSource = source("lib/assessment/runtime/application.ts");
const policySource = source("lib/assessment/runtime/policy.ts");
const fakeSource = source("lib/assessment/runtime/fakes.ts");
const migrationSource = source(
  "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
);
gate("M2_P3_RUNTIME_CAPABILITY_GATE", () => {
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    runtimeManifest.task_id === "M2-P3-A" &&
      runtimeManifest.baseline.commit === baselineSha &&
      Object.values(runtimeManifest.enabled_capabilities).every(Boolean) &&
      Object.values(runtimeManifest.disabled_capabilities).every(
        (value) => value === false,
      ),
    "M2-P3 successor capability manifest differs",
  );
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    runtimeManifest.historical_snapshots.length >= 3,
    "historical capability snapshots are not preserved explicitly",
  );
});

gate("M2_P3_INTERNAL_ROUTE_GATE", () => {
  for (const required of [
    'export async function POST',
    '"idempotency-key"',
    "maximumBodyBytes",
    "allowedFields",
    "privacyAcknowledged",
    "validateOrigin",
  ]) {
    check(
      "M2_P3_INTERNAL_ROUTE_GATE",
      routeSource.includes(required),
      `route is missing ${required}`,
    );
  }
});

gate("M2_P3_PRODUCTION_DISABLE_GATE", () => {
  check(
    "M2_P3_PRODUCTION_DISABLE_GATE",
    environmentSource.includes('process.env.NODE_ENV !== "production"') &&
      environmentSource.includes(
        'process.env.M2_INTERNAL_RUNTIME_ENABLED === "true"',
      ) &&
      pageSource.includes('process.env.NODE_ENV === "production"') &&
      pageSource.includes("notFound()"),
    "development-only fail-closed boundary differs",
  );
});

gate("M2_P3_SERVER_SECRET_BOUNDARY_GATE", () => {
  const secretSources = [
    environmentSource,
    transportSource,
    repositorySource,
    source("lib/assessment/runtime/service.ts"),
  ].join("\n");
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    secretSources.match(/import "server-only";/gu)?.length === 4,
    "live secret owners are not server-only fenced",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    ![
      routeSource,
      source("components/runtime/RuntimeAssessmentForm.tsx"),
      source("components/runtime/RuntimeAssessmentNote.tsx"),
    ]
      .join("\n")
      .includes("OPENAI_API_KEY"),
    "browser or route code names the OpenAI secret",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    !source(".env.example").includes("sk-") &&
      !source(".env.example").includes("service_role") &&
      source(".gitignore").includes(".env.local"),
    "environment example or ignore contract is unsafe",
  );
  check(
    "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
    !secretSources.includes("console."),
    "runtime logs secret-owner state",
  );
});

gate("M2_P3_OPENAI_REQUEST_CONTRACT_GATE", () => {
  for (const required of [
    "this.client.responses.create",
    "service_tier: \"default\"",
    "truncation: \"disabled\"",
    "effort: \"low\"",
    "type: \"json_schema\"",
    "strict: true",
    "tools: []",
    "stream: false",
    "background: false",
  ]) {
    check(
      "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
      transportSource.includes(required),
      `OpenAI contract is missing ${required}`,
    );
  }
  check(
    "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
    !transportSource.includes("previous_response_id") &&
      !transportSource.includes("conversation:"),
    "stateful Responses field is present",
  );
});

gate("M2_P3_STORE_FALSE_GATE", () => {
  check(
    "M2_P3_STORE_FALSE_GATE",
    transportSource.includes("store: false"),
    "store false is absent",
  );
});

gate("M2_P3_SUPABASE_SERVER_ONLY_GATE", () => {
  check(
    "M2_P3_SUPABASE_SERVER_ONLY_GATE",
    repositorySource.includes('import "server-only";') &&
      repositorySource.includes("persistSession: false") &&
      repositorySource.includes("autoRefreshToken: false") &&
      environmentSource.includes('required("SUPABASE_SECRET_KEY")') &&
      !source("components/runtime/RuntimeAssessmentForm.tsx").includes(
        "@supabase/supabase-js",
      ),
    "Supabase server-only boundary differs",
  );
});

gate("M2_P3_RLS_GATE", () => {
  const tables = [
    "assessment_requests",
    "assessment_runs",
    "assessment_stage_runs",
    "assessment_reports",
  ];
  check(
    "M2_P3_RLS_GATE",
    tables.every((table) =>
      migrationSource.includes(
        `alter table public.${table} enable row level security`,
      ),
    ) && !/\bcreate\s+policy\b/iu.test(migrationSource),
    "RLS or no-public-policy contract differs",
  );
});

gate("M2_P3_DATABASE_SCHEMA_GATE", () => {
  for (const required of [
    "create table public.assessment_requests",
    "idempotency_key text not null unique",
    "create table public.assessment_runs",
    "usage_derived_cost_usd numeric",
    "create table public.assessment_stage_runs",
    "unique (run_id, stage_id)",
    "prompt_hash text not null",
    "schema_hash text not null",
    "create table public.assessment_reports",
    "run_id uuid not null unique",
    "on delete cascade",
  ]) {
    check(
      "M2_P3_DATABASE_SCHEMA_GATE",
      migrationSource.includes(required),
      `migration is missing ${required}`,
    );
  }
  check(
    "M2_P3_DATABASE_SCHEMA_GATE",
    !/\bif\s+not\s+exists\b/iu.test(migrationSource),
    "migration masks unexpected state",
  );
});

gate("M2_P3_IDEMPOTENCY_GATE", () => {
  check(
    "M2_P3_IDEMPOTENCY_GATE",
    applicationSource.includes("findByIdempotencyKey") &&
      applicationSource.includes("M2_DUPLICATE_SUBMISSION") &&
      duplicate.duplicate === true &&
      happy.transport.calls.length === 6,
    "duplicate submission was not returned without new Stage calls",
  );
});

gate("M2_P3_PIPELINE_ORDER_GATE", () => {
  check(
    "M2_P3_PIPELINE_ORDER_GATE",
    JSON.stringify(happy.trace) === JSON.stringify(expectedTrace) &&
      JSON.stringify(happy.transport.calls) ===
        JSON.stringify(["PB-01", "PB-02", "PB-03", "PB-04", "PB-05", "PB-06"]),
    `pipeline order differs: ${JSON.stringify(happy.trace)}`,
  );
});

gate("M2_P3_SAFETY_GATE", () => {
  check(
    "M2_P3_SAFETY_GATE",
    safetyBlockedResult.eligibility === "safety_blocked" &&
      safetyBlocked.transport.calls.length === 3 &&
      needsMoreResult.eligibility === "needs_more_information" &&
      needsMoreResult.questionCodes.length <= 3,
    "Safety or eligibility stop behavior differs",
  );
});

gate("M2_P3_DECISION_POLICY_GATE", () => {
  check(
    "M2_P3_DECISION_POLICY_GATE",
    policySource.includes("buildDecisionPolicy") &&
      policySource.includes("allowed_decisions: [selected]") &&
      happyResult.decision === "wait_and_reassess",
    "system-owned decision policy differs",
  );
});

gate("M2_P3_STAGE_PERSISTENCE_GATE", () => {
  check(
    "M2_P3_STAGE_PERSISTENCE_GATE",
    happy.repository.stageRuns.size === 6 &&
      [...happy.repository.stageRuns.values()].every(
        (stage) =>
          stage.status === "completed" &&
          stage.completion?.outputJson &&
          stage.requestHash.length === 64 &&
          stage.promptHash.length === 64 &&
          stage.schemaHash.length === 64,
      ),
    "completed Stage records are incomplete",
  );
  check(
    "M2_P3_STAGE_PERSISTENCE_GATE",
    [...schemaFailure.repository.stageRuns.values()].some(
      (stage) => stage.status === "failed" && stage.failure?.outputJson,
    ),
    "failed Stage output was not persisted",
  );
});

gate("M2_P3_FAIL_CLOSED_GATE", () => {
  check(
    "M2_P3_FAIL_CLOSED_GATE",
    schemaFailure.transport.calls.length === 1 &&
      modelMismatch.transport.calls.length === 2 &&
      databaseFailure.transport.calls.length === 3 &&
      pb05Failure.transport.calls.length === 5 &&
      !pb05Failure.transport.calls.includes("PB-06"),
    "a failure executed a later Stage",
  );
});

gate("M2_P3_NO_RETRY_GATE", () => {
  check(
    "M2_P3_NO_RETRY_GATE",
    schemaFailure.transport.calls.filter((stage) => stage === "PB-01").length ===
      1 &&
      modelMismatch.transport.calls.filter((stage) => stage === "PB-02")
        .length === 1 &&
      !pipelineSource.includes("while (") &&
      !pipelineSource.includes("setTimeout("),
    "retry behavior is present",
  );
});

gate("M2_P3_NO_REPAIR_GATE", () => {
  check(
    "M2_P3_NO_REPAIR_GATE",
    !pipelineSource.includes('"PB-07"') &&
      !catalog.definitions.some((definition) => definition.stageId === "PB-07"),
    "PB-07 or Repair execution is present",
  );
});

gate("M2_P3_NO_FALLBACK_GATE", () => {
  check(
    "M2_P3_NO_FALLBACK_GATE",
    environmentSource.includes('model !== "gpt-5.6-luna"') &&
      transportSource.includes("model: stageRequest.model") &&
      pipelineSource.includes("M2_STAGE_MODEL_MISMATCH"),
    "single-model fail-closed behavior differs",
  );
});

gate("M2_P3_USAGE_LEDGER_GATE", () => {
  check(
    "M2_P3_USAGE_LEDGER_GATE",
    happyResult.usage.totalInputTokens > 0 &&
      happyResult.usage.totalOutputTokens > 0 &&
      happyResult.usage.totalReasoningTokens > 0 &&
      happyResult.usage.usageDerivedCostUsd > 0 &&
      source("lib/assessment/runtime/cost.ts").includes(
        "prevents reasoning from being double-counted",
      ),
    "usage-derived cost ledger differs",
  );
});

gate("M2_P3_FAKE_RUNTIME_GATE", () => {
  check(
    "M2_P3_FAKE_RUNTIME_GATE",
    fakeSource.includes("class FakeAssessmentRepository") &&
      fakeSource.includes("class FakeAiStageTransport") &&
      happyResult.report.content.cover_line.length > 0 &&
      needsMoreResult.eligibility === "needs_more_information" &&
      safetyBlockedResult.eligibility === "safety_blocked",
    "required fake runtime scenarios did not pass",
  );
});

gate("M2_P3_ZERO_LIVE_NETWORK_GATE", () => {
  const fakes = [
    happy,
    needsMore,
    safetyBlocked,
    schemaFailure,
    modelMismatch,
    databaseFailure,
    pb05Failure,
  ];
  check(
    "M2_P3_ZERO_LIVE_NETWORK_GATE",
    fakes.every(
      (runtime) =>
        runtime.transport.actualProviderCalls === 0 &&
        runtime.repository.actualSupabaseCalls === 0,
    ),
    "a live provider or Supabase call was recorded",
  );
});

gate("M2_P3_ZERO_SPEND_GATE", () => {
  check(
    "M2_P3_ZERO_SPEND_GATE",
    happy.transport.apiSpendUsd === 0 &&
      runtimeManifest.task_execution_evidence.api_spend_usd === 0,
    "actual API spend is not zero",
  );
});

gate("M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE", () => {
  const publicDiff = gitText([
    "diff",
    "--name-only",
    baselineSha,
    "--",
    "app/page.tsx",
    "app/request",
    "components/request",
    "components/report",
    "fixtures/public",
    "fixtures/review",
  ]).trim();
  const baseCss = gitText(["show", `${baselineSha}:app/globals.css`]);
  const currentCss = source("app/globals.css");
  const normalizedBaseCss = baseCss.replace(/\r\n/gu, "\n");
  const normalizedCurrentCss = currentCss.replace(/\r\n/gu, "\n");
  check(
    "M2_P3_PUBLIC_PRODUCT_UNCHANGED_GATE",
    publicDiff === "" &&
      normalizedCurrentCss.startsWith(normalizedBaseCss) &&
      normalizedCurrentCss.includes(
        "M2-P3 internal development runtime. No public navigation entry.",
      ),
    `public product diff is not isolated: ${publicDiff}`,
  );
});

for (const gateName of gateOrder) {
  for (const detail of failures.get(gateName)) {
    console.error(`FAIL_DETAIL | gate=${gateName} | ${detail}`);
  }
  console.log(
    `${gateName}: ${failures.get(gateName).length === 0 ? "PASS" : "FAIL"}`,
  );
}

const passed = gateOrder.every(
  (gateName) => failures.get(gateName).length === 0,
);
console.log(`M2_P3_RUNTIME_VERTICAL_SLICE_GATE: ${passed ? "PASS" : "FAIL"}`);
process.exitCode = passed ? 0 : 1;
