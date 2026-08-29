import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { M2RuntimeError } from "../lib/assessment/runtime/errors.ts";
import {
  AssessmentPipeline,
  PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES,
  validatePurchaseReadyAuthorityForFulfillment,
} from "../lib/assessment/runtime/pipeline.ts";
import {
  FakeAiStageTransport,
  FakeAssessmentRepository,
} from "../lib/assessment/runtime/fakes.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../lib/assessment/runtime/schema-catalog.ts";

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

function controlledOutputs(directory) {
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

function ids() {
  let index = 0;
  return () =>
    `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
}

function safeCode(error) {
  return error instanceof M2RuntimeError ? error.safeCode : null;
}

const controlled = readJson(`${packageRoot}/controlled-provider-inputs-v1.json`);
const selected = controlled.cases.find(
  (candidate) => candidate.fixture_id === "polite_thank_you_with_draft",
);
assert.ok(selected);

const request = {
  currentSituation: selected.assessment_input.currentSituation,
  optionalMessage: selected.assessment_input.optionalMessage,
  relationship: selected.assessment_input.relationship,
  requestedTopics: [...selected.assessment_input.requestedTopics],
  privacyAcknowledged: true,
};
const requestId = "00000000-0000-4000-8000-000000000101";
const preparationRunContext = {
  requestId,
  runId: "00000000-0000-4000-8000-000000000102",
  model: "gpt-5.6-luna",
  promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
  startedAt: selected.fixed_clock,
};
const catalog = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
const preparationRepository = new FakeAssessmentRepository();
const persistedRequest = await preparationRepository.createRequest({
  id: requestId,
  idempotencyKey: "purchase-ready-authority-diagnostics-preparation",
  source: "production_fulfillment_runtime",
  ...request,
  now: selected.fixed_clock,
});
const preparationTransport = new FakeAiStageTransport({
  outputs: controlledOutputs(
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  ),
});
const preparationPipeline = new AssessmentPipeline({
  repository: preparationRepository,
  transport: preparationTransport,
  definitions: catalog.definitions,
  now: () => selected.fixed_clock,
  uuid: ids(),
  timeZone: selected.timezone,
  beforeProviderInvocation: async () => {},
});
const preparation = await preparationPipeline.prepare(
  request,
  preparationRunContext,
);
assert.equal(preparation.eligibility, "purchase_ready");
const validAuthority = preparation.authority;

// Clarification resume passes this persisted runtime shape through an
// AssessmentInput boundary, so the snapshot must project only semantic fields.
const clarificationRepository = new FakeAssessmentRepository();
const clarificationRequestId = "00000000-0000-4000-8000-000000000201";
const clarificationRequest = {
  ...request,
  privacyAcknowledged: true,
};
const persistedClarificationRequest =
  await clarificationRepository.createRequest({
    id: clarificationRequestId,
    idempotencyKey: "case02-clarification-snapshot-diagnostics",
    source: "production_fulfillment_runtime",
    ...clarificationRequest,
    now: selected.fixed_clock,
  });
const clarificationTransport = new FakeAiStageTransport({
  outputs: controlledOutputs(
    "2026-08-18-case5-polite-draft-ai-first-v16-cd1518ce",
  ),
});
const clarificationPipeline = new AssessmentPipeline({
  repository: clarificationRepository,
  transport: clarificationTransport,
  definitions: catalog.definitions,
  now: () => selected.fixed_clock,
  uuid: ids(),
  timeZone: selected.timezone,
  beforeProviderInvocation: async () => {},
});
const clarificationResumeContext = {
  requestId: clarificationRequestId,
  runId: "00000000-0000-4000-8000-000000000203",
  model: "gpt-5.6-luna",
  promptBundleVersion: catalog.promptBundleVersion,
  schemaSetVersion: catalog.schemaSetVersion,
  startedAt: selected.fixed_clock,
};
const clarificationPreparation =
  await clarificationPipeline.prepare(
    persistedClarificationRequest,
    clarificationResumeContext,
  );
assert.equal(clarificationPreparation.eligibility, "purchase_ready");
assert.deepEqual(
  clarificationPreparation.authority.request,
  clarificationRequest,
);
assert.deepEqual(
  Object.keys(clarificationPreparation.authority.request).sort(),
  [
    "currentSituation",
    "optionalMessage",
    "privacyAcknowledged",
    "relationship",
    "requestedTopics",
  ],
);
assert.doesNotThrow(() =>
  validatePurchaseReadyAuthorityForFulfillment({
    persistedRequest: persistedClarificationRequest,
    authority: clarificationPreparation.authority,
    runContext: clarificationResumeContext,
    activeStageTopologyVersion: "split-base-candidate-v1",
    providerInvocationFencePresent: true,
  }),
);

const legacyClarificationAuthority = structuredClone(
  clarificationPreparation.authority,
);
legacyClarificationAuthority.request = structuredClone(
  persistedClarificationRequest,
);
assert.doesNotThrow(() =>
  validatePurchaseReadyAuthorityForFulfillment({
    persistedRequest: persistedClarificationRequest,
    authority: legacyClarificationAuthority,
    runContext: clarificationResumeContext,
    activeStageTopologyVersion: "split-base-candidate-v1",
    providerInvocationFencePresent: true,
  }),
);
const mismatchedLegacyClarificationAuthority = structuredClone(
  legacyClarificationAuthority,
);
mismatchedLegacyClarificationAuthority.request.currentSituation +=
  " synthetic mismatch";
assert.throws(
  () =>
    validatePurchaseReadyAuthorityForFulfillment({
      persistedRequest: persistedClarificationRequest,
      authority: mismatchedLegacyClarificationAuthority,
      runContext: clarificationResumeContext,
      activeStageTopologyVersion: "split-base-candidate-v1",
      providerInvocationFencePresent: true,
    }),
  (error) =>
    safeCode(error) ===
    PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
      .persistedRequestSnapshotMismatch,
);
assert.equal(clarificationTransport.actualProviderCalls, 0);

const codes = Object.values(PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES);
assert.equal(codes.length, 11);
assert.equal(new Set(codes).size, 11);

const baseFulfillmentRunContext = {
  ...preparationRunContext,
  runId: "00000000-0000-4000-8000-000000000103",
};
const cases = [
  {
    name: "authority schema version",
    code: PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.authoritySchemaVersionMismatch,
    mutate(input) {
      input.authority.schemaVersion = "invalid-authority-schema";
    },
  },
  {
    name: "authority model",
    code: PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.authorityModelMismatch,
    mutate(input) {
      input.authority.runtimeIdentity.model = "invalid-model";
    },
  },
  {
    name: "authority prompt bundle expected version",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
        .authorityPromptBundleExpectedVersionMismatch,
    mutate(input) {
      input.authority.runtimeIdentity.promptBundleVersion =
        "prompt-bundle-runtime-v16.0.0";
      input.runContext.promptBundleVersion = "prompt-bundle-runtime-v16.0.0";
    },
  },
  {
    name: "authority prompt bundle run context",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
        .authorityPromptBundleRunContextMismatch,
    mutate(input) {
      input.runContext.promptBundleVersion = "prompt-bundle-runtime-v16.0.0";
    },
  },
  {
    name: "authority schema set expected version",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
        .authoritySchemaSetExpectedVersionMismatch,
    mutate(input) {
      input.authority.runtimeIdentity.schemaSetVersion =
        "pipeline-schema-runtime-v5.0.0";
      input.runContext.schemaSetVersion = "pipeline-schema-runtime-v5.0.0";
    },
  },
  {
    name: "authority schema set run context",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
        .authoritySchemaSetRunContextMismatch,
    mutate(input) {
      input.runContext.schemaSetVersion = "pipeline-schema-runtime-v5.0.0";
    },
  },
  {
    name: "authority stage topology",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.authorityStageTopologyMismatch,
    mutate(input) {
      input.authority.runtimeIdentity.stageTopologyVersion = "legacy-six-v1";
    },
  },
  {
    name: "active pipeline topology",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.activePipelineTopologyMismatch,
    mutate(input) {
      input.activeStageTopologyVersion = "legacy-six-v1";
    },
  },
  {
    name: "Provider invocation fence",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.providerInvocationFenceMissing,
    mutate(input) {
      input.providerInvocationFencePresent = false;
    },
  },
  {
    name: "persisted request ID",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES.persistedRequestIdMismatch,
    mutate(input) {
      input.runContext.requestId =
        "00000000-0000-4000-8000-000000000199";
    },
  },
  {
    name: "persisted request snapshot",
    code:
      PURCHASE_READY_AUTHORITY_DIAGNOSTIC_CODES
        .persistedRequestSnapshotMismatch,
    mutate(input) {
      input.authority.request.currentSituation =
        "CUSTOMER_CONTENT_MUST_NOT_APPEAR_IN_DIAGNOSTIC_LOG";
    },
  },
];

for (const diagnosticCase of cases) {
  const input = {
    persistedRequest: structuredClone(persistedRequest),
    authority: structuredClone(validAuthority),
    runContext: structuredClone(baseFulfillmentRunContext),
    activeStageTopologyVersion: "split-base-candidate-v1",
    providerInvocationFencePresent: true,
  };
  diagnosticCase.mutate(input);
  const logs = [];
  const originalConsoleError = console.error;
  console.error = (...arguments_) => logs.push(structuredClone(arguments_));
  try {
    assert.throws(
      () => validatePurchaseReadyAuthorityForFulfillment(input),
      (error) => safeCode(error) === diagnosticCase.code,
      diagnosticCase.name,
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(logs.length, 1, diagnosticCase.name);
  assert.equal(
    logs[0][0],
    "M2_PURCHASE_READY_AUTHORITY_VALIDATION_FAILED",
    diagnosticCase.name,
  );
  assert.deepEqual(
    logs[0][1],
    {
      diagnosticCode: diagnosticCase.code,
      requestId: input.runContext.requestId,
      runId: input.runContext.runId,
    },
    diagnosticCase.name,
  );
  const serializedLog = JSON.stringify(logs);
  assert.equal(
    serializedLog.includes("CUSTOMER_CONTENT_MUST_NOT_APPEAR_IN_DIAGNOSTIC_LOG"),
    false,
    diagnosticCase.name,
  );
  assert.equal(serializedLog.includes("authority.request"), false);
  assert.equal(serializedLog.includes("sha256"), false);
  assert.equal(serializedLog.includes("token"), false);
  assert.equal(serializedLog.includes("email"), false);
}

const validFulfillmentTransport = new FakeAiStageTransport({ outputs: {} });
const providerFenceCalls = [];
const validFulfillmentPipeline = new AssessmentPipeline({
  repository: preparationRepository,
  transport: validFulfillmentTransport,
  definitions: catalog.definitions,
  now: () => selected.fixed_clock,
  uuid: ids(),
  timeZone: selected.timezone,
  beforeProviderInvocation: async (stageId, attemptNumber) => {
    providerFenceCalls.push(`${stageId}:${attemptNumber}`);
  },
});
await assert.rejects(
  () =>
    validFulfillmentPipeline.fulfillPrepared(
      persistedRequest,
      validAuthority,
      baseFulfillmentRunContext,
    ),
  (error) => safeCode(error) === "M2_FAKE_STAGE_OUTPUT_MISSING",
);
assert.deepEqual(validFulfillmentTransport.calls, ["PB-04"]);
assert.deepEqual(providerFenceCalls, ["PB-04:1"]);

const pipelineSource = readText("lib/assessment/runtime/pipeline.ts");
const fulfillPreparedStart = pipelineSource.indexOf("  async fulfillPrepared(");
const fulfillPreparedEnd = pipelineSource.indexOf(
  "  private async executeSplit(",
  fulfillPreparedStart,
);
assert.ok(fulfillPreparedStart >= 0);
assert.ok(fulfillPreparedEnd > fulfillPreparedStart);
const fulfillPreparedSource = pipelineSource.slice(
  fulfillPreparedStart,
  fulfillPreparedEnd,
);
assert.ok(
  fulfillPreparedSource.indexOf(
    "validatePurchaseReadyAuthorityForFulfillment({",
  ) < fulfillPreparedSource.indexOf("this.validateRuntimeIdentity(runContext);"),
);
assert.ok(
  fulfillPreparedSource.indexOf(
    "validatePurchaseReadyAuthorityForFulfillment({",
  ) < fulfillPreparedSource.indexOf("await this.repository.createRun({"),
);
assert.ok(
  fulfillPreparedSource.indexOf(
    "validatePurchaseReadyAuthorityForFulfillment({",
  ) < fulfillPreparedSource.indexOf("return await this.completeV1A2Ready({"),
);
assert.equal(
  (fulfillPreparedSource.match(/M2_PURCHASE_READY_AUTHORITY_INVALID/gu) ?? [])
    .length,
  0,
);

const fulfillmentApplicationSource = readText(
  "lib/payment/production/application.ts",
);
assert.match(
  fulfillmentApplicationSource,
  /if \(safe\.safeCode === "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS"\) \{\s*return \{ status: "manual_review" \};\s*\}\s*return \{ status: "temporary_problem", retryable: true \};/u,
);
assert.doesNotMatch(
  fulfillmentApplicationSource,
  /M2_PURCHASE_READY_[A-Z_]+[\s\S]{0,200}status: "manual_review"/u,
);

const workerSource = readText(
  "lib/payment/production/async-workloads-worker.ts",
);
assert.match(
  workerSource,
  /PRODUCTION_FULFILLMENT_MAX_RETRIES = 8/u,
);
assert.match(
  workerSource,
  /if \(outcome\.status === "temporary_problem"\) \{\s*throw new Error\("PRODUCTION_FULFILLMENT_RETRYABLE_FAILURE"\);\s*\}/u,
);
assert.match(
  workerSource,
  /if \(outcome\.status === "manual_review"\) \{\s*throw new ErrorDoNotRetry\("PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS"\);\s*\}/u,
);

console.log(
  "M2 purchase-ready authority diagnostics verification PASS " +
    JSON.stringify({
      diagnosticCodes: codes.length,
      preProviderFailures: cases.length,
      validAuthorityFirstProviderStage: validFulfillmentTransport.calls[0],
      retryPolicyChanged: false,
      providerAmbiguityChanged: false,
    }),
);
