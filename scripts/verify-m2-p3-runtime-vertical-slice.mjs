import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const baselineSha = "72d4121ff4ad0682bcafbeed4f72f6491e697ffa";
const i1bBaselineSha =
  "554d2cb5a2f816ac82edf3cc247458fe34a4a74c";
const i1bAcceptedImplementationSha =
  "9588c8fd6ab47c265f5f661d4473a29d73885427";
const failures = new Map();

const gateOrder = [
  "M2_P3_RUNTIME_CAPABILITY_GATE",
  "M2_P3_INTERNAL_ROUTE_GATE",
  "M2_P3_PRODUCTION_DISABLE_GATE",
  "M2_P3_SERVER_SECRET_BOUNDARY_GATE",
  "M2_P3_OPENAI_REQUEST_CONTRACT_GATE",
  "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
  "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
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
  "M2_P3_DEPENDENCY_AUDIT_GATE",
  "M2_P3_PRODUCTION_VULNERABILITY_GATE",
  "M2_P3_SUPABASE_DEPENDENCY_GATE",
  "M2_P3_ATOMIC_FINALIZATION_GATE",
  "M2_P3_FINALIZATION_ROLLBACK_GATE",
  "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
  "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
  "M2_P3_R1_RUNTIME_HARDENING_GATE",
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

function deterministicUuidFactory(initialSequence = 0) {
  let sequence = initialSequence;
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
  { loadCanonicalStageCatalog, loadM2P4RuntimeStageCatalog },
  {
    createOpenAiProviderFailureDiagnostic,
  },
  {
    OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS,
    OPENAI_NULLABLE_FIELD_MAPPINGS,
    OpenAIStructuredOutputSchemaError,
    assertOpenAIStructuredOutputSchema,
    toOpenAiStructuredOutputSchema,
  },
] = await Promise.all([
  import("../lib/assessment/runtime/application.ts"),
  import("../lib/assessment/runtime/fakes.ts"),
  import("../lib/assessment/runtime/schema-catalog.ts"),
  import("../lib/assessment/runtime/openai-diagnostics.ts"),
  import("../lib/assessment/runtime/openai-schema.ts"),
]);

const canonicalCatalog = await loadCanonicalStageCatalog();
const catalog = await loadM2P4RuntimeStageCatalog();
const waitDecisionFacts = {
  schema_version: "m2-p4-decision-facts-v1",
  relationship_stage: "in_relationship",
  selected_requests: ["decide_send_or_wait", "message_impact"],
  latest_direct_message: {
    sender: "user",
    kind: "other",
    response_expectation: "optional",
    user_reply_state: "not_applicable",
    sns_signal_only: false,
  },
  contact_state: {
    unanswered_user_message_count: 1,
    elapsed_since_latest_user_message_minutes: 120,
    usual_cadence_relation: "within_usual",
    proposed_message_present: true,
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
    complete_for_decision: true,
  },
};
const wait003Input = {
  currentSituation:
    "交際中です。2時間前に、最近寂しいと感じていることを長めのメッセージで送りました。まだ返信はありません。",
  optionalMessage:
    "怒ってる？さっきの重かったよね、ごめん。何か言ってほしい。",
  relationship: "in_relationship",
  requestedTopics: ["decide_send_or_wait", "message_impact"],
  privacyAcknowledged: true,
};

function asM2P4RuntimeOutputs(outputs) {
  const runtimeOutputs = structuredClone(outputs);
  const structuredIntake = runtimeOutputs["PB-01"];
  if (
    !structuredIntake ||
    Object.keys(structuredIntake).length === 1
  ) {
    runtimeOutputs["PB-01"] = {
      schema_version: "pipeline-schema-v2.0.0",
    };
    return runtimeOutputs;
  }
  const ordinaryReady =
    runtimeOutputs["PB-03"]?.eligibility === "ready" &&
    runtimeOutputs["PB-02"]?.classification === "normal_allowed";
  runtimeOutputs["PB-01"] = {
    ...structuredIntake,
    schema_version: "pipeline-schema-v2.0.0",
    decision_facts: ordinaryReady ? waitDecisionFacts : null,
  };
  return runtimeOutputs;
}

function makeApplication({
  outputs,
  repository = new FakeAssessmentRepository(),
  transportOptions = {},
  trace = [],
  uuid = deterministicUuidFactory(),
} = {}) {
  const transport = new FakeAiStageTransport({
    outputs: asM2P4RuntimeOutputs(outputs ?? wait003StageOutputs()),
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
    uuid,
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

const reportInsertFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "finalizeCompletedAssessment:reportInsert",
  }),
});
await expectSafeFailure(
  reportInsertFailure.application,
  "M2_FINALIZATION_PERSISTENCE_FAILED",
  "71000000-0000-4000-8000-000000000001",
);

const runUpdateFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "finalizeCompletedAssessment:runUpdate",
  }),
});
await expectSafeFailure(
  runUpdateFailure.application,
  "M2_FINALIZATION_PERSISTENCE_FAILED",
  "72000000-0000-4000-8000-000000000001",
);

const finalizedRecord = [...happy.repository.reports.values()][0];
assert.ok(finalizedRecord);
let duplicateFinalizationCode = null;
try {
  await happy.repository.finalizeCompletedAssessment(finalizedRecord);
} catch (error) {
  duplicateFinalizationCode = error?.safeCode ?? null;
}

const concurrent = makeApplication();
const concurrentResults = await Promise.allSettled([
  concurrent.application.submit(
    wait003Input,
    "73000000-0000-4000-8000-000000000001",
  ),
  concurrent.application.submit(
    wait003Input,
    "73000000-0000-4000-8000-000000000001",
  ),
]);

const createRequestFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "createRequest",
  }),
});
await expectSafeFailure(
  createRequestFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "74000000-0000-4000-8000-000000000001",
);

const createRunFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "createRun",
  }),
});
await expectSafeFailure(
  createRunFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "75000000-0000-4000-8000-000000000001",
);

const firstStageStartFailure = makeApplication({
  repository: new FakeAssessmentRepository({
    failOnceAt: "startStage:PB-01",
  }),
});
await expectSafeFailure(
  firstStageStartFailure.application,
  "M2_FAKE_DATABASE_WRITE_FAILED",
  "76000000-0000-4000-8000-000000000001",
);

const resubmissionRepository = new FakeAssessmentRepository();
const failedSubmission = makeApplication({
  repository: resubmissionRepository,
  transportOptions: { failAtStage: "PB-05" },
  uuid: deterministicUuidFactory(100),
});
await expectSafeFailure(
  failedSubmission.application,
  "M2_FAKE_STAGE_FAILURE",
  "77000000-0000-4000-8000-000000000001",
);
const sameKeyAfterFailure = makeApplication({
  repository: resubmissionRepository,
  uuid: deterministicUuidFactory(200),
});
await expectSafeFailure(
  sameKeyAfterFailure.application,
  "M2_DUPLICATE_SUBMISSION",
  "77000000-0000-4000-8000-000000000001",
);
const deliberateResubmission = makeApplication({
  repository: resubmissionRepository,
  uuid: deterministicUuidFactory(300),
});
const deliberateResubmissionResult =
  await deliberateResubmission.application.submit(
    wait003Input,
    "78000000-0000-4000-8000-000000000001",
  );

const runtimeManifest = json(
  "evals/runtime/m2-p3-runtime-capabilities-v1.json",
);
const i1bRuntimeManifest = json(
  "evals/runtime/m2-p4-i1-b-runtime-capabilities-v1.json",
);
const dependencyAuditSummary = json(
  "evals/runtime/m2-p3-a-dependency-audit-summary-v1.json",
);
const packageManifest = json("package.json");
const packageLock = json("package-lock.json");
const dependencyReviewSource = source(
  "docs/phase2/M2_P3_A_DEPENDENCY_SECURITY_REVIEW.md",
);
const routeSource = source("app/api/internal/assessments/route.ts");
const pageSource = source("app/review/runtime/page.tsx");
const environmentSource = source("lib/assessment/runtime/environment.ts");
const transportSource = source(
  "lib/assessment/runtime/openai-transport.ts",
);
const diagnosticSource = source(
  "lib/assessment/runtime/openai-diagnostics.ts",
);
const repositorySource = source(
  "lib/assessment/runtime/supabase-repository.ts",
);
const pipelineSource = source("lib/assessment/runtime/pipeline.ts");
const applicationSource = source("lib/assessment/runtime/application.ts");
const policySource = source("lib/assessment/runtime/policy.ts");
const policyV2Source = source("lib/assessment/runtime/policy-v2.ts");
const fakeSource = source("lib/assessment/runtime/fakes.ts");
const migrationSource = source(
  "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
);
const atomicMigrationSource = source(
  "supabase/migrations/0003_m2_p3_atomic_finalization.sql",
);
const runtimePackageSource = source(
  "lib/assessment/runtime/package.json",
);
gate("M2_P3_RUNTIME_CAPABILITY_GATE", () => {
  const i1bSnapshot = i1bRuntimeManifest.implementation_snapshot;
  const lowercaseShaPattern = /^[0-9a-f]{40}$/u;
  const declaredI1bPaths = [...i1bRuntimeManifest.implementation_paths].sort();
  const historicalI1bPaths = gitText([
    "diff",
    "--name-only",
    i1bSnapshot.base_commit_sha,
    i1bSnapshot.end_commit_sha,
    "--",
  ])
    .split(/\r?\n/gu)
    .map((item) => item.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort();
  gitText(["cat-file", "-e", `${i1bSnapshot.base_commit_sha}^{commit}`]);
  gitText(["cat-file", "-e", `${i1bSnapshot.end_commit_sha}^{commit}`]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1bSnapshot.base_commit_sha,
    i1bSnapshot.end_commit_sha,
  ]);
  gitText([
    "merge-base",
    "--is-ancestor",
    i1bSnapshot.end_commit_sha,
    "HEAD",
  ]);
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
  check(
    "M2_P3_RUNTIME_CAPABILITY_GATE",
    canonicalCatalog.promptBundleVersion === "prompt-bundle-v1.0.0" &&
      canonicalCatalog.schemaSetVersion === "pipeline-schema-v1.0.0" &&
      catalog.promptBundleVersion === "prompt-bundle-runtime-v2.0.0" &&
      catalog.schemaSetVersion === "pipeline-schema-runtime-v2.0.0" &&
      i1bRuntimeManifest.task_id === "M2-P4-I1-B" &&
      i1bRuntimeManifest.status === "human_chatgpt_accepted_complete" &&
      i1bRuntimeManifest.accepted_implementation_commit ===
        i1bAcceptedImplementationSha &&
      i1bRuntimeManifest.baseline.commit === i1bBaselineSha &&
      JSON.stringify(i1bSnapshot) ===
        JSON.stringify({
          type: "historical_commit_range",
          base_commit_sha: i1bBaselineSha,
          end_commit_sha: i1bAcceptedImplementationSha,
          include_working_tree: false,
          immutable_snapshot: true,
        }) &&
      lowercaseShaPattern.test(i1bSnapshot.base_commit_sha) &&
      lowercaseShaPattern.test(i1bSnapshot.end_commit_sha) &&
      i1bRuntimeManifest.implementation_paths.length === 16 &&
      new Set(i1bRuntimeManifest.implementation_paths).size === 16 &&
      i1bRuntimeManifest.implementation_paths.every(
        (item) =>
          typeof item === "string" &&
          item.length > 0 &&
          !item.includes("*") &&
          !item.endsWith("/"),
      ) &&
      JSON.stringify(historicalI1bPaths) ===
        JSON.stringify(declaredI1bPaths),
    "M2-P4-I1-B successor boundary is not exact or historical catalog changed",
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

gate("M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE", () => {
  const projectedSchemas = catalog.definitions.map((definition) => ({
    stageId: definition.stageId,
    schema: toOpenAiStructuredOutputSchema(definition.outputSchema),
  }));
  const projectedJson = JSON.stringify(projectedSchemas);
  const canonicalJson = JSON.stringify(
    catalog.definitions.map((definition) => definition.outputSchema),
  );

  const validRoot = (properties = {}) => ({
    type: "object",
    properties,
    additionalProperties: false,
    required: Object.keys(properties),
  });
  const schemaViolation = (schema) => {
    try {
      assertOpenAIStructuredOutputSchema(schema);
      return null;
    } catch (error) {
      return error;
    }
  };
  const expectViolation = (schema, schemaPath, violatedRule) => {
    const error = schemaViolation(schema);
    return (
      error instanceof OpenAIStructuredOutputSchemaError &&
      error.schemaPath === schemaPath &&
      error.violatedRule === violatedRule &&
      error.message === `${schemaPath}: ${violatedRule}` &&
      Object.keys(error).every((key) =>
        ["name", "schemaPath", "violatedRule"].includes(key),
      )
    );
  };

  const nestedObjectWithoutAdditionalProperties = validRoot({
    nested: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
    },
  });
  const nestedObjectWithIncompleteRequired = validRoot({
    nested: {
      type: "object",
      properties: {
        first: { type: "string" },
        second: { type: "string" },
      },
      additionalProperties: false,
      required: ["first"],
    },
  });
  const objectWithExtraRequiredKey = {
    type: "object",
    properties: { value: { type: "string" } },
    additionalProperties: false,
    required: ["value", "not_a_property"],
  };
  const rootAnyOf = {
    ...validRoot(),
    anyOf: [validRoot()],
  };
  const nestedAllOf = validRoot({
    value: { allOf: [{ type: "string" }] },
  });
  const nestedOneOf = validRoot({
    value: { oneOf: [{ type: "string" }, { type: "null" }] },
  });
  const arrayWithUniqueItems = validRoot({
    values: {
      type: "array",
      items: { type: "string" },
      uniqueItems: true,
    },
  });
  const arrayWithPrefixItems = validRoot({
    values: {
      type: "array",
      items: { type: "string" },
      prefixItems: [{ type: "string" }],
    },
  });
  const validNestedAnyOf = validRoot({
    value: {
      anyOf: [{ type: "string" }, { type: "null" }],
    },
  });
  const validDefinitionReference = {
    ...validRoot({
      item: { $ref: "#/$defs/item" },
    }),
    $defs: {
      item: {
        type: "object",
        properties: { value: { type: "string" } },
        additionalProperties: false,
        required: ["value"],
      },
    },
  };
  const invalidReferenceSibling = {
    ...validRoot({
      item: {
        $ref: "#/$defs/item",
        type: "object",
      },
    }),
    $defs: {
      item: {
        type: "object",
        properties: {},
        additionalProperties: false,
        required: [],
      },
    },
  };

  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    expectViolation(
      nestedObjectWithoutAdditionalProperties,
      "#/properties/nested/additionalProperties",
      "object additionalProperties must be false",
    ) &&
      expectViolation(
        nestedObjectWithIncompleteRequired,
        "#/properties/nested/required",
        "object required must contain every properties key",
      ) &&
      expectViolation(
        objectWithExtraRequiredKey,
        "#/required",
        "object required must contain no extra keys",
      ) &&
      expectViolation(
        rootAnyOf,
        "#/anyOf",
        "root schema must not use anyOf",
      ) &&
      expectViolation(
        nestedAllOf,
        "#/properties/value/allOf",
        "allOf is prohibited",
      ) &&
      expectViolation(
        nestedOneOf,
        "#/properties/value/oneOf",
        "oneOf is prohibited",
      ) &&
      expectViolation(
        arrayWithUniqueItems,
        "#/properties/values/uniqueItems",
        "uniqueItems is prohibited",
      ) &&
      expectViolation(
        arrayWithPrefixItems,
        "#/properties/values/prefixItems",
        "prefixItems is prohibited",
      ),
    "provider schema validator missed a prohibited schema shape",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    schemaViolation(validNestedAnyOf) === null &&
      schemaViolation(validDefinitionReference) === null &&
      expectViolation(
        invalidReferenceSibling,
        "#/properties/item/type",
        "$ref must not have sibling validation keywords",
      ),
    "provider schema validator rejected a valid anyOf/ref or allowed ref siblings",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    projectedSchemas.every(({ schema }) => schemaViolation(schema) === null),
    "an actual PB-01 through PB-06 provider schema is invalid",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    canonicalJson.includes('"uniqueItems":true') &&
      !OPENAI_UNSUPPORTED_SCHEMA_KEYWORDS.some((keyword) =>
        projectedJson.includes(`${JSON.stringify(keyword)}:`),
      ) &&
      !projectedJson.includes('"items":false'),
    "provider schemas contain an unsupported Structured Outputs keyword",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    transportSource.includes(
      "toOpenAiStructuredOutputSchema(",
    ) &&
      transportSource.includes("assertOpenAIStructuredOutputSchema(") &&
      transportSource.indexOf("assertOpenAIStructuredOutputSchema(") <
        transportSource.indexOf("this.client.responses.create") &&
      transportSource.includes(
        "logDevelopmentOpenAIStructuredOutputSchemaFailure(error)",
      ) &&
      transportSource.includes(
        'throw new M2RuntimeError("M2_STAGE_PROVIDER_FAILED")',
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        '"M2_OPENAI_SCHEMA_CONFIGURATION_INVALID"',
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        "schemaPath: error.schemaPath",
      ) &&
      source("lib/assessment/runtime/openai-schema.ts").includes(
        "violatedRule: error.violatedRule",
      ) &&
      source("lib/assessment/runtime/validation.ts").includes(
        "ajv.compile(definition.outputSchema)",
      ),
    "provider projection or canonical AJV validation is missing",
  );
  check(
    "M2_P3_OPENAI_SCHEMA_COMPATIBILITY_GATE",
    JSON.stringify(OPENAI_NULLABLE_FIELD_MAPPINGS.map(
      ({ stageId, schemaPath }) => [stageId, schemaPath],
    )) ===
      JSON.stringify([
        ["PB-04", "#/properties/message_draft"],
        ["PB-05", "#/properties/message_draft_context"],
        ["PB-06", "#/properties/final_disposition"],
        ["PB-06", "#/properties/repair_strategy"],
        [
          "PB-06",
          "#/$defs/deterministic_check/properties/json_path",
        ],
      ]) &&
      OPENAI_NULLABLE_FIELD_MAPPINGS.every(
        (mapping) =>
          mapping.providerRepresentation.startsWith("required ") &&
          mapping.canonicalHandling ===
            "canonical schema accepts null directly",
      ),
    "nullable provider-field mappings are incomplete or imply adapter repair",
  );
});

gate("M2_P3_PROVIDER_DIAGNOSTIC_GATE", () => {
  const rawBodySentinel = "RAW_PROVIDER_BODY_MUST_NOT_BE_LOGGED";
  const exactSchemaContext = "Invalid schema context at properties.timeline";
  const apiError = new OpenAI.APIError(
    400,
    {
      type: "invalid_request_error",
      code: "invalid_json_schema",
      param: "text.format.schema",
      message: `${exactSchemaContext}\u0000 sk-test-secret sb_secret_test Bearer test-token ${"x".repeat(1200)}`,
      raw_body_sentinel: rawBodySentinel,
    },
    undefined,
    new Headers({ "x-request-id": "req_sanitized_test" }),
  );
  const diagnostic = createOpenAiProviderFailureDiagnostic(
    "PB-01",
    apiError,
  );
  check(
    "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
    assert.deepEqual(Object.keys(diagnostic).sort(), [
      "failureClassification",
      "httpStatus",
      "openaiErrorCode",
      "openaiErrorMessage",
      "openaiErrorParam",
      "openaiErrorType",
      "requestId",
      "stageId",
    ].sort()) === undefined &&
      diagnostic.stageId === "PB-01" &&
      diagnostic.httpStatus === 400 &&
      diagnostic.openaiErrorType === "invalid_request_error" &&
      diagnostic.openaiErrorCode === "invalid_json_schema" &&
      diagnostic.openaiErrorParam === "text.format.schema" &&
      diagnostic.openaiErrorMessage?.includes(exactSchemaContext) &&
      diagnostic.openaiErrorMessage.length <= 1000 &&
      !/[\u0000-\u001f\u007f]/u.test(diagnostic.openaiErrorMessage) &&
      !diagnostic.openaiErrorMessage.includes("sk-test-secret") &&
      !diagnostic.openaiErrorMessage.includes("sb_secret_test") &&
      !diagnostic.openaiErrorMessage.includes("Bearer") &&
      diagnostic.requestId === "req_sanitized_test" &&
      diagnostic.failureClassification === "openai_api_error" &&
      !JSON.stringify(diagnostic).includes(rawBodySentinel) &&
      createOpenAiProviderFailureDiagnostic(
        "PB-01",
        new Error("not an OpenAI SDK error"),
      ).openaiErrorMessage === null,
    "provider diagnostic fields are incomplete or unsafe",
  );
  check(
    "M2_P3_PROVIDER_DIAGNOSTIC_GATE",
    diagnosticSource.includes(
      'process.env.NODE_ENV !== "development"',
    ) &&
      diagnosticSource.includes('console.error(') &&
      transportSource.includes(
        "logDevelopmentOpenAiProviderFailure(stageRequest.stageId, error)",
      ),
    "development-only provider diagnostic logging is missing",
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
      policyV2Source.includes("buildDecisionPolicyV2") &&
      pipelineSource.includes("requireDecisionFacts(structuredIntake)") &&
      pipelineSource.includes("buildDecisionPolicyV2(decisionFacts)") &&
      !pipelineSource.includes("buildDecisionPolicy(request") &&
      happyResult.decision === "wait_and_reassess",
    "historical policy or active typed-facts decision policy differs",
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
    reportInsertFailure,
    runUpdateFailure,
    concurrent,
    createRequestFailure,
    createRunFailure,
    firstStageStartFailure,
    failedSubmission,
    sameKeyAfterFailure,
    deliberateResubmission,
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

gate("M2_P3_DEPENDENCY_AUDIT_GATE", () => {
  const requiredCommands = [
    "npm.cmd audit --omit=dev --json",
    "npm.cmd audit --json",
    "npm.cmd ls --depth=0",
  ];
  const requiredPackages = [
    "openai",
    "ajv",
    "@supabase/supabase-js",
    "next",
    "react",
  ];
  const permittedClassifications = new Set([
    "production-reachable",
    "production-installed but not runtime-reachable",
    "development-only",
    "false positive / not applicable",
  ]);
  const highOrCritical = dependencyAuditSummary.findings.filter((finding) =>
    ["high", "critical"].includes(finding.severity),
  );
  check(
    "M2_P3_DEPENDENCY_AUDIT_GATE",
    dependencyAuditSummary.schema_version ===
      "m2-p3-a-dependency-audit-summary-v1" &&
      JSON.stringify(dependencyAuditSummary.commands) ===
        JSON.stringify(requiredCommands) &&
      requiredPackages.every(
        (packageName) =>
          typeof dependencyAuditSummary.installed_packages[packageName]
            ?.version === "string",
      ) &&
      highOrCritical.length >= 4 &&
      highOrCritical.every(
        (finding) =>
          typeof finding.package === "string" &&
          typeof finding.direct === "boolean" &&
          ["production", "development"].includes(finding.dependency_scope) &&
          Array.isArray(finding.dependency_paths) &&
          finding.dependency_paths.length > 0 &&
          typeof finding.affected_version === "string" &&
          typeof finding.patched_version_availability === "string" &&
          permittedClassifications.has(finding.runtime_classification) &&
          typeof finding.runtime_reachability_evidence === "string" &&
          typeof finding.proposed_safe_remediation === "string" &&
          typeof finding.remediation_breaking === "boolean" &&
          typeof finding.resolved === "boolean",
      ) &&
      dependencyReviewSource.includes("MODULE_TYPELESS_PACKAGE_JSON"),
    "dependency evidence, classification, or warning review is incomplete",
  );
});

gate("M2_P3_PRODUCTION_VULNERABILITY_GATE", () => {
  const unresolvedProductionReachable =
    dependencyAuditSummary.findings.filter(
      (finding) =>
        !finding.resolved &&
        ["high", "critical"].includes(finding.severity) &&
        finding.runtime_classification === "production-reachable",
    );
  check(
    "M2_P3_PRODUCTION_VULNERABILITY_GATE",
    unresolvedProductionReachable.length === 0 &&
      dependencyAuditSummary.decision
        .unresolved_production_reachable_high_or_critical === 0 &&
      dependencyAuditSummary.decision.r1_automated_gate === "pass" &&
      dependencyReviewSource.includes(
        "Human / ChatGPT acceptance remains on hold",
      ),
    "an unresolved production-reachable high/critical finding remains",
  );
});

gate("M2_P3_SUPABASE_DEPENDENCY_GATE", () => {
  const baselinePackage = JSON.parse(
    gitText(["show", `${baselineSha}:package.json`]),
  );
  const installed = dependencyAuditSummary.installed_packages;
  check(
    "M2_P3_SUPABASE_DEPENDENCY_GATE",
    installed["@supabase/supabase-js"].version ===
      packageLock.packages["node_modules/@supabase/supabase-js"].version &&
      installed["@supabase/supabase-js"].dependency_status ===
        "direct production dependency" &&
      installed["@supabase/supabase-js"].introduction === "pre-existing" &&
      typeof baselinePackage.dependencies["@supabase/supabase-js"] ===
        "string" &&
      installed.openai.version ===
        packageLock.packages["node_modules/openai"].version &&
      installed.ajv.version === packageLock.packages["node_modules/ajv"].version &&
      installed.next.version ===
        packageLock.packages["node_modules/next"].version &&
      installed.react.version ===
        packageLock.packages["node_modules/react"].version &&
      packageManifest.dependencies["@supabase/supabase-js"] !== undefined,
    "required dependency versions or Supabase provenance differ",
  );
});

gate("M2_P3_ATOMIC_FINALIZATION_GATE", () => {
  const originalMigrationDiff = gitText([
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "supabase/migrations/0002_m2_p3_runtime_vertical_slice.sql",
  ]).trim();
  for (const required of [
    "create function public.finalize_completed_assessment(",
    "p_report_id uuid",
    "p_run_id uuid",
    "p_request_id uuid",
    "p_report_json jsonb",
    "p_decision_card_json jsonb",
    "security invoker",
    "set search_path = ''",
    "insert into public.assessment_reports",
    "update public.assessment_runs",
    "update public.assessment_requests",
    "from public",
    "from anon",
    "from authenticated",
    "to service_role",
  ]) {
    check(
      "M2_P3_ATOMIC_FINALIZATION_GATE",
      atomicMigrationSource.includes(required),
      `atomic migration is missing ${required}`,
    );
  }
  check(
    "M2_P3_ATOMIC_FINALIZATION_GATE",
    repositorySource.includes(
      'this.client.rpc("finalize_completed_assessment"',
    ) &&
      !repositorySource.includes(
        'this.client.from("assessment_reports").insert',
      ) &&
      pipelineSource.includes(
        "this.repository.finalizeCompletedAssessment",
      ) &&
      !pipelineSource.includes("this.repository.saveReport") &&
      !/\bexecute\s+(format|immediate)\b/iu.test(atomicMigrationSource) &&
      originalMigrationDiff === "" &&
      [
        "assessment_requests",
        "assessment_runs",
        "assessment_stage_runs",
        "assessment_reports",
      ].every((table) =>
        migrationSource.includes(
          `alter table public.${table} enable row level security`,
        ),
      ),
    "final writes are not isolated to one fixed, server-only transaction",
  );
});

gate("M2_P3_FINALIZATION_ROLLBACK_GATE", () => {
  const happyRun = happy.repository.runs.get(happyResult.runId);
  const happyRequest = happy.repository.requests.get(happyResult.requestId);
  const rollbackRuntimes = [reportInsertFailure, runUpdateFailure];
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    happy.repository.reports.size === 1 &&
      happyRun?.status === "completed" &&
      happyRun?.decision === happyResult.decision &&
      happyRequest?.status === "completed" &&
      happy.repository.events.includes("finalizeCompletedAssessment"),
    "successful final writes did not commit together",
  );
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    rollbackRuntimes.every(
      (runtime) =>
        runtime.repository.reports.size === 0 &&
        [...runtime.repository.runs.values()].every(
          (run) => run.status === "failed" && run.decision === undefined,
        ) &&
        runtime.repository.events.includes(
          "finalizeCompletedAssessment:rollback",
        ) &&
        runtime.transport.calls.length === 6,
    ),
    "a finalization failure left a partial report/run state",
  );
  check(
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    duplicateFinalizationCode === "M2_FINALIZATION_STATE_CONFLICT" &&
      happy.repository.reports.size === 1,
    "duplicate finalization was not rejected without a duplicate report",
  );
});

gate("M2_P3_CONCURRENT_IDEMPOTENCY_GATE", () => {
  const fulfilled = concurrentResults.filter(
    (result) => result.status === "fulfilled",
  );
  const rejected = concurrentResults.filter(
    (result) => result.status === "rejected",
  );
  check(
    "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
    fulfilled.length === 1 &&
      rejected.length === 1 &&
      rejected[0]?.reason?.safeCode === "M2_DUPLICATE_SUBMISSION" &&
      concurrent.repository.requests.size === 1 &&
      concurrent.repository.runs.size === 1 &&
      concurrent.repository.reports.size === 1 &&
      concurrent.transport.calls.length === 6 &&
      repositorySource.includes('error?.code === "23505"') &&
      repositorySource.includes('"M2_IDEMPOTENCY_CONFLICT"') &&
      applicationSource.includes(
        'error.safeCode === "M2_IDEMPOTENCY_CONFLICT"',
      ) &&
      sameKeyAfterFailure.transport.calls.length === 0 &&
      deliberateResubmissionResult.eligibility === "ready" &&
      deliberateResubmission.transport.calls.length === 6 &&
      resubmissionRepository.requests.size === 2,
    "concurrent submissions can create duplicate requests or provider runs",
  );
});

gate("M2_P3_PERSIST_BEFORE_PROVIDER_GATE", () => {
  const startWriteIndex = pipelineSource.indexOf(
    "await this.repository.startStage",
  );
  const providerCallIndex = pipelineSource.indexOf(
    "response = await this.transport.invoke",
  );
  const persistedStageIds = [...happy.repository.stageRuns.values()].map(
    (stage) => stage.stageId,
  );
  check(
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
    createRequestFailure.transport.calls.length === 0 &&
      createRunFailure.transport.calls.length === 0 &&
      firstStageStartFailure.transport.calls.length === 0 &&
      startWriteIndex >= 0 &&
      providerCallIndex > startWriteIndex &&
      happy.transport.calls.every((stageId) =>
        persistedStageIds.includes(stageId),
      ),
    "provider execution can occur before request/run/Stage start persistence",
  );
  check(
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
    !pb05Failure.transport.calls.includes("PB-06") &&
      needsMore.repository.reports.size === 0 &&
      safetyBlocked.repository.reports.size === 0,
    "a failed or unauthorized path reached PB-06/final report persistence",
  );
});

gate("M2_P3_R1_RUNTIME_HARDENING_GATE", () => {
  const prerequisiteGates = [
    "M2_P3_DEPENDENCY_AUDIT_GATE",
    "M2_P3_PRODUCTION_VULNERABILITY_GATE",
    "M2_P3_SUPABASE_DEPENDENCY_GATE",
    "M2_P3_ATOMIC_FINALIZATION_GATE",
    "M2_P3_FINALIZATION_ROLLBACK_GATE",
    "M2_P3_CONCURRENT_IDEMPOTENCY_GATE",
    "M2_P3_PERSIST_BEFORE_PROVIDER_GATE",
  ];
  check(
    "M2_P3_R1_RUNTIME_HARDENING_GATE",
    prerequisiteGates.every(
      (gateName) => failures.get(gateName).length === 0,
    ) &&
      JSON.parse(runtimePackageSource).type === "module" &&
      dependencyAuditSummary.execution_evidence.openai_calls === 0 &&
      dependencyAuditSummary.execution_evidence.supabase_calls === 0 &&
      dependencyAuditSummary.execution_evidence.api_spend_usd === 0,
    "one or more R1 hardening prerequisites failed",
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
