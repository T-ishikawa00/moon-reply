import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
} from "node:fs";
import { inspect } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  B1B1,
  buildAllStageRequests,
  validateJsonSchema,
} from "./lib/m2-p2-b1-b1-request-builder.mjs";
import {
  actualEnvironmentSecretMetrics,
  assertSafeLogValue,
  createFixtureEnvironmentSecretProvider,
  createSecretHandle,
  isSecretHandle,
} from "./lib/m2-p2-b1-b2-a-env-secret-provider.mjs";
import {
  OPENAI_HTTPS_BINDING,
  actualHttpsExecutorMetrics,
  createOpenAiHttpsExecutor,
} from "./lib/m2-p2-b1-b2-a-https-executor.mjs";
import {
  DORMANT_APPROVAL_STATE,
  FIXED_LIVE_APPROVAL_TARGET,
  validateHumanApprovalRecord,
} from "./lib/m2-p2-b1-b2-a-human-approval.mjs";
import {
  LIVE_BUDGET_POLICY,
  LIVE_PRICING_SNAPSHOT,
  assertLivePreflightBudget,
  assertPricingSnapshotFresh,
  assertSequentialHumanCeiling,
  computeLiveExecutionGuard,
} from "./lib/m2-p2-b1-b2-a-budget-guard.mjs";
import {
  actualExecutionGuardMetrics,
  createFixtureGitExecutionGuard,
  gitExecutionGuardContract,
} from "./lib/m2-p2-b1-b2-a-execution-guard.mjs";
import {
  createInMemoryAuthorizationFileSystem,
  createOneTimeAuthorization,
} from "./lib/m2-p2-b1-b2-a-one-time-authorization.mjs";
import {
  artifactBundleContract,
  createInMemoryArtifactFileSystem,
  writeSanitizedArtifactBundle,
} from "./lib/m2-p2-b1-b2-a-artifact-bundle.mjs";
import {
  serializeArtifactFailClosed,
} from "./lib/m2-p2-b1-b2-a-runtime-redaction.mjs";
import {
  LIVE_RUNNER_SEQUENCE,
  registeredRequestHashes,
} from "./lib/m2-p2-b1-b2-a-live-runner.mjs";
import {
  buildLiveBindingEvidence,
  failureScenarioStopCodes,
  implementationManifest,
  renderLiveBindingEvidence,
  reportPaths,
} from "./prepare-m2-p2-b1-b2-a-live-bindings.mjs";
import {
  parseDormantPreflightArguments,
  runBlockedDormantPreflight,
} from "./run-m2-p2-b1-b2-a-preflight-blocked.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const environmentKeyName = ["OPENAI", "API", "KEY"].join("_");
const processEnvironmentPattern = new RegExp(
  `\\b${["process", "env"].join("\\.")}(?:\\.|\\[)`,
  "u",
);
const correctionCommit =
  "fa222917f0e6ff4a4e25d11da239717c062af6d0";
const exactScriptPaths = implementationManifest
  .map((entry) => entry.path)
  .filter((file) => file.startsWith("scripts/"));
const capabilityPaths = Object.freeze({
  environment:
    "scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs",
  https: "scripts/lib/m2-p2-b1-b2-a-https-executor.mjs",
  childProcess:
    "scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs",
});

const gateOrder = [
  "M2_B1_B2_A_EXACT_SCOPE_GATE",
  "M2_B1_B2_A_CONTRACT_LINK_GATE",
  "M2_B1_B2_A_CASE_GATE",
  "M2_B1_B2_A_MODEL_GATE",
  "M2_B1_B2_A_MODEL_NON_SELECTION_GATE",
  "M2_B1_B2_A_STAGE_GATE",
  "M2_B1_B2_A_HUMAN_APPROVAL_SCHEMA_GATE",
  "M2_B1_B2_A_APPROVAL_ABSENT_GATE",
  "M2_B1_B2_A_LIVE_AUTHORIZATION_FALSE_GATE",
  "M2_B1_B2_A_SECRET_PROVIDER_GATE",
  "M2_B1_B2_A_SECRET_OPAQUE_GATE",
  "M2_B1_B2_A_ZERO_REAL_ENV_READ_GATE",
  "M2_B1_B2_A_HTTPS_EXECUTOR_GATE",
  "M2_B1_B2_A_FIXED_ENDPOINT_GATE",
  "M2_B1_B2_A_TLS_GATE",
  "M2_B1_B2_A_BODY_LIMIT_GATE",
  "M2_B1_B2_A_TIMEOUT_GATE",
  "M2_B1_B2_A_ZERO_EXTERNAL_NETWORK_GATE",
  "M2_B1_B2_A_ZERO_SECRET_RESOLUTION_GATE",
  "M2_B1_B2_A_ZERO_HTTPS_REQUEST_GATE",
  "M2_B1_B2_A_ZERO_PROVIDER_CALL_GATE",
  "M2_B1_B2_A_ZERO_SPEND_GATE",
  "M2_B1_B2_A_STATIC_CAP_GATE",
  "M2_B1_B2_A_CACHE_WRITE_PROTECTION_GATE",
  "M2_B1_B2_A_LONG_INPUT_PRICING_GATE",
  "M2_B1_B2_A_LIVE_COST_GUARD_GATE",
  "M2_B1_B2_A_HUMAN_CEILING_GATE",
  "M2_B1_B2_A_ONE_TIME_AUTHORIZATION_GATE",
  "M2_B1_B2_A_GIT_EXECUTION_GUARD_GATE",
  "M2_B1_B2_A_ARTIFACT_POLICY_GATE",
  "M2_B1_B2_A_REDACTION_GATE",
  "M2_B1_B2_A_NO_RETRY_GATE",
  "M2_B1_B2_A_NO_REPAIR_GATE",
  "M2_B1_B2_A_NO_FALLBACK_GATE",
  "M2_B1_B2_A_ORACLE_ISOLATION_GATE",
  "M2_B1_B2_A_HOLDOUT_ISOLATION_GATE",
  "M2_B1_B2_A_REAL_USER_DATA_GATE",
  "M2_B1_B2_A_FAILURE_MATRIX_GATE",
  "M2_B1_B2_A_DETERMINISM_GATE",
  "M2_B1_B2_A_REPORT_HASH_GATE",
];
const failures = new Map(gateOrder.map((gate) => [gate, []]));
const overallFailures = [];

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function source(relativePath) {
  return readFileSync(absolute(relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(source(relativePath));
}

function sha256(text) {
  return createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function fail(gate, detail) {
  failures.get(gate).push(detail);
}

function assert(gate, condition, detail) {
  if (!condition) fail(gate, detail);
}

function moduleSpecifiers(text) {
  const result = [];
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"'\r\n]+)["']/gu,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/gu,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) result.push(match[1]);
  }
  return [...new Set(result)];
}

function verifyExactScopeAndCapabilities(reportManifest) {
  const expectedPaths = implementationManifest.map((entry) => entry.path);
  const uniquePaths = new Set(expectedPaths);
  const counts = Object.fromEntries(
    ["A", "M", "D"].map((status) => [
      status,
      implementationManifest.filter((entry) => entry.status === status)
        .length,
    ]),
  );
  assert(
    "M2_B1_B2_A_EXACT_SCOPE_GATE",
    implementationManifest.length === 41 &&
      uniquePaths.size === 41 &&
      deepEqual(counts, { A: 37, M: 4, D: 0 }) &&
      implementationManifest.every((entry) =>
        ["A", "M"].includes(entry.status),
      ) &&
      expectedPaths.every((file) => existsSync(absolute(file))) &&
      deepEqual(
        reportManifest.implementation_manifest,
        implementationManifest,
      ) &&
      !expectedPaths.includes("package.json") &&
      !expectedPaths.some((file) =>
        /^(?:app|components|lib|fixtures|public|supabase)\//u.test(file),
      ),
    "machine-readable 41-file implementation manifest differs",
  );
  assert(
    "M2_B1_B2_A_EXACT_SCOPE_GATE",
    correctionCommit ===
      "fa222917f0e6ff4a4e25d11da239717c062af6d0" &&
      !expectedPaths.some((file) =>
        file.includes("HISTORICAL_SCOPE") ||
        file.includes("R1_SCOPE_AND_LIVE_BINDING_BOUNDARY"),
      ),
    "correction files entered the implementation manifest",
  );

  for (const file of exactScriptPaths) {
    const text = source(file);
    const specifiers = moduleSpecifiers(text);
    assert(
      "M2_B1_B2_A_SECRET_PROVIDER_GATE",
      !processEnvironmentPattern.test(text) ||
        file === capabilityPaths.environment,
      `${file}: environment capability escaped its exact owner`,
    );
    assert(
      "M2_B1_B2_A_SECRET_PROVIDER_GATE",
      !text.includes(environmentKeyName) ||
        file === capabilityPaths.environment,
      `${file}: environment-key name escaped its exact owner`,
    );
    for (const specifier of ["node:https", "node:tls"]) {
      assert(
        "M2_B1_B2_A_HTTPS_EXECUTOR_GATE",
        !specifiers.includes(specifier) ||
          file === capabilityPaths.https,
        `${file}: ${specifier} escaped its exact owner`,
      );
    }
    assert(
      "M2_B1_B2_A_GIT_EXECUTION_GUARD_GATE",
      !specifiers.includes("node:child_process") ||
        file === capabilityPaths.childProcess,
      `${file}: child-process capability escaped its exact owner`,
    );
  }
  assert(
    "M2_B1_B2_A_SECRET_PROVIDER_GATE",
    processEnvironmentPattern.test(source(capabilityPaths.environment)) &&
      source(capabilityPaths.environment).includes(environmentKeyName),
    "environment provider does not contain the single approved binding",
  );
  assert(
    "M2_B1_B2_A_HTTPS_EXECUTOR_GATE",
    moduleSpecifiers(source(capabilityPaths.https)).includes(
      "node:https",
    ) &&
      moduleSpecifiers(source(capabilityPaths.https)).includes(
        "node:tls",
      ),
    "HTTPS executor lacks exact HTTPS/TLS imports",
  );
  assert(
    "M2_B1_B2_A_GIT_EXECUTION_GUARD_GATE",
    moduleSpecifiers(source(capabilityPaths.childProcess)).includes(
      "node:child_process",
    ),
    "execution guard lacks exact child-process import",
  );
}

function verifyContracts() {
  const contracts = {
    live: readJson(
      "evals/calibration/b1b2a/live-binding-contract-v1.json",
    ),
    secret: readJson(
      "evals/calibration/b1b2a/secret-provider-contract-v1.json",
    ),
    https: readJson(
      "evals/calibration/b1b2a/https-executor-contract-v1.json",
    ),
    approval: readJson(
      "evals/calibration/b1b2a/human-approval-contract-v1.json",
    ),
    oneTime: readJson(
      "evals/calibration/b1b2a/one-time-run-contract-v1.json",
    ),
    artifact: readJson(
      "evals/calibration/b1b2a/artifact-contract-v1.json",
    ),
    failure: readJson(
      "evals/calibration/b1b2a/failure-injection-catalog-v1.json",
    ),
  };
  for (const [dataPath, schemaPath] of [
    [
      "evals/calibration/b1b2a/live-binding-contract-v1.json",
      "evals/calibration/b1b2a/schemas/live-binding-contract.schema.json",
    ],
    [
      "evals/calibration/b1b2a/secret-provider-contract-v1.json",
      "evals/calibration/b1b2a/schemas/secret-provider-contract.schema.json",
    ],
    [
      "evals/calibration/b1b2a/https-executor-contract-v1.json",
      "evals/calibration/b1b2a/schemas/https-executor-contract.schema.json",
    ],
    [
      "evals/calibration/b1b2a/one-time-run-contract-v1.json",
      "evals/calibration/b1b2a/schemas/one-time-run-contract.schema.json",
    ],
    [
      "evals/calibration/b1b2a/artifact-contract-v1.json",
      "evals/calibration/b1b2a/schemas/artifact-contract.schema.json",
    ],
    [
      reportPaths.manifest,
      "evals/calibration/b1b2a/schemas/report-manifest.schema.json",
    ],
  ]) {
    const errors = validateJsonSchema(
      readJson(dataPath),
      readJson(schemaPath),
    );
    assert(
      "M2_B1_B2_A_CONTRACT_LINK_GATE",
      errors.length === 0,
      `${dataPath}: ${errors.join("; ")}`,
    );
  }
  const approvalSchema = readJson(
    "evals/calibration/b1b2a/schemas/human-approval-contract.schema.json",
  );
  assert(
    "M2_B1_B2_A_HUMAN_APPROVAL_SCHEMA_GATE",
    deepEqual(
      approvalSchema.required,
      contracts.approval.future_b1_b2_b_required_fields,
    ) &&
      approvalSchema.properties.live_execution_authorized.const === true &&
      approvalSchema.properties.paid_run_authorized.const === true &&
      approvalSchema.properties.one_time_only.const === true &&
      approvalSchema.properties.approved_case.const === "WAIT-003" &&
      approvalSchema.properties.approved_model.const === "gpt-5.6-luna" &&
      approvalSchema.properties.max_provider_calls.const === 6 &&
      approvalSchema.properties.absolute_ceiling_usd.const === 1 &&
      approvalSchema.properties.preflight_ceiling_usd.const === 0.3,
    "future paid approval Schema differs",
  );
  assert(
    "M2_B1_B2_A_CONTRACT_LINK_GATE",
    contracts.live.source_b0_contract_hash === B1B1.b0ContractHash &&
      contracts.live.accepted_provider_adapter_task === "M2-P2-B1-B1",
    "B0 or B1-B1 contract link differs",
  );
  assert(
    "M2_B1_B2_A_CASE_GATE",
    contracts.live.case_id === B1B1.caseId,
    "WAIT-003 is not the only case",
  );
  assert(
    "M2_B1_B2_A_MODEL_GATE",
    contracts.live.model === B1B1.model,
    "gpt-5.6-luna is not the fixed candidate",
  );
  assert(
    "M2_B1_B2_A_MODEL_NON_SELECTION_GATE",
    contracts.live.product_or_baseline_model_selected === false &&
      contracts.live.model_role === "calibration_candidate_only",
    "candidate was selected as product or baseline model",
  );
  assert(
    "M2_B1_B2_A_STAGE_GATE",
    deepEqual(contracts.live.provider_stages, B1B1.stageIds) &&
      contracts.live.maximum_future_provider_calls === 6,
    "provider Stage list or call limit differs",
  );
  assert(
    "M2_B1_B2_A_APPROVAL_ABSENT_GATE",
    deepEqual(contracts.live.approval_state, {
      approval_record_present: false,
      live_execution_authorized: false,
      paid_run_authorized: false,
      paid_run_completed: false,
    }) &&
      deepEqual(
        contracts.approval.current_state,
        DORMANT_APPROVAL_STATE,
      ),
    "approval absent state differs",
  );
  assert(
    "M2_B1_B2_A_LIVE_AUTHORIZATION_FALSE_GATE",
    contracts.live.approval_state.live_execution_authorized === false &&
      contracts.live.approval_state.paid_run_authorized === false &&
      contracts.approval.cli_flag_can_create_approval === false &&
      contracts.approval.environment_value_can_create_approval === false &&
      contracts.approval.config_edit_can_create_approval === false,
    "live authorization can be enabled in B1-B2-A",
  );
  return contracts;
}

async function captureStop(operation) {
  try {
    await operation();
    return "NO_STOP";
  } catch (error) {
    return error?.stopCode ?? "UNKNOWN_STOP";
  }
}

function validApprovalRecord(requestHashes) {
  return {
    approval_id: "fixture-approval-id",
    live_execution_authorized: true,
    paid_run_authorized: true,
    one_time_only: true,
    approved_runner_commit_sha: "a".repeat(40),
    approved_contract_hash: FIXED_LIVE_APPROVAL_TARGET.contract_hash,
    approved_case: FIXED_LIVE_APPROVAL_TARGET.case_id,
    approved_model: FIXED_LIVE_APPROVAL_TARGET.model,
    approved_stages: FIXED_LIVE_APPROVAL_TARGET.stages,
    max_provider_calls: 6,
    absolute_ceiling_usd: 1,
    preflight_ceiling_usd: 0.3,
    exact_request_hashes: requestHashes,
    price_snapshot_verified_at: "2026-07-28T00:00:00.000Z",
    approval_created_at: "2026-07-28T00:00:00.000Z",
    approval_expires_at: "2026-07-29T00:00:00.000Z",
    one_time_confirmation_hash: "b".repeat(64),
    human_chatgpt_decision_reference: "fixture-only-future-schema-test",
  };
}

async function runFailureScenarios(stageRequests, liveGuard) {
  const requestHashes = registeredRequestHashes(stageRequests);
  const valid = validApprovalRecord(requestHashes);
  const approvalStop = (record) =>
    captureStop(() =>
      validateHumanApprovalRecord({
        record,
        expectedRunnerCommitSha: "a".repeat(40),
        expectedRequestHashes: requestHashes,
        executionTime: "2026-07-28T12:00:00.000Z",
      }),
    );
  const actual = [];
  actual.push(await approvalStop(null));
  actual.push(
    await approvalStop({ ...valid, live_execution_authorized: false }),
  );
  actual.push(
    await approvalStop({ ...valid, paid_run_authorized: false }),
  );
  actual.push(
    await approvalStop({
      ...valid,
      approved_runner_commit_sha: "c".repeat(40),
    }),
  );
  actual.push(
    await approvalStop({
      ...valid,
      approved_contract_hash: "d".repeat(64),
    }),
  );
  actual.push(await approvalStop({ ...valid, approved_case: "OTHER" }));
  actual.push(await approvalStop({ ...valid, approved_model: "OTHER" }));
  actual.push(
    await approvalStop({ ...valid, approved_stages: ["PB-01"] }),
  );
  actual.push(
    await approvalStop({ ...valid, max_provider_calls: 7 }),
  );
  actual.push(
    await approvalStop({ ...valid, absolute_ceiling_usd: 2 }),
  );
  actual.push(
    await approvalStop({
      ...valid,
      approval_expires_at: "2026-07-28T11:00:00.000Z",
    }),
  );
  actual.push(
    await captureStop(() =>
      assertPricingSnapshotFresh({
        verifiedAt: "2026-07-26T00:00:00.000Z",
        executionTime: "2026-07-28T12:00:00.000Z",
      }),
    ),
  );

  const authorizationFileSystem =
    createInMemoryAuthorizationFileSystem();
  const authorization = createOneTimeAuthorization({
    fileSystem: authorizationFileSystem,
  });
  const authorizationInput = {
    approvalId: "fixture-approval-id",
    approvalHash: "c".repeat(64),
    runnerCommitSha: "a".repeat(40),
    confirmationHash: "b".repeat(64),
  };
  authorization.consume(authorizationInput);
  actual.push(
    await captureStop(() => authorization.consume(authorizationInput)),
  );

  for (const fixture of [
    {
      branch: "main",
      head: "b".repeat(40),
      origin_main: "a".repeat(40),
      porcelain_status: "",
    },
    {
      branch: "main",
      head: "a".repeat(40),
      origin_main: "a".repeat(40),
      porcelain_status: "?? unexpected",
    },
    {
      branch: "feature",
      head: "a".repeat(40),
      origin_main: "a".repeat(40),
      porcelain_status: "",
    },
  ]) {
    actual.push(
      await captureStop(() =>
        createFixtureGitExecutionGuard(fixture).verify({
          expectedRunnerSha: "a".repeat(40),
        }),
      ),
    );
  }
  actual.push(
    await captureStop(() =>
      assertLivePreflightBudget(liveGuard, {
        staticHardCapUsd: 0.31,
      }),
    ),
  );
  actual.push(
    await captureStop(() =>
      assertLivePreflightBudget({
        ...liveGuard,
        live_execution_guard_cost_usd: 0.31,
      }),
    ),
  );
  actual.push(
    await captureStop(() =>
      assertLivePreflightBudget(liveGuard, {
        forceLongInputFailure: true,
      }),
    ),
  );

  const fixtureKey = ["OPENAI", "API", "KEY"].join("_");
  actual.push(
    await captureStop(() =>
      createFixtureEnvironmentSecretProvider({}).resolveSecret(),
    ),
  );
  actual.push(
    await captureStop(() =>
      createFixtureEnvironmentSecretProvider({
        [fixtureKey]: "fixture value",
      }).resolveSecret(),
    ),
  );
  const handle = createSecretHandle("fixture-credential-value");
  actual.push(
    await captureStop(() => JSON.stringify(handle)),
  );
  actual.push(
    await captureStop(() => assertSafeLogValue(handle)),
  );

  const fakeSuccess = async () => ({
    statusCode: 200,
    bodyText: "{}",
  });
  for (const override of [
    { host: "example.invalid" },
    { path: "/other" },
    { method: "GET" },
    { headers: { Test: "value" } },
  ]) {
    actual.push(
      await captureStop(() =>
        createOpenAiHttpsExecutor({
          requestImplementation: fakeSuccess,
          externalNetwork: false,
        }).execute({ body: {}, secretHandle: handle, ...override }),
      ),
    );
  }
  actual.push(
    await captureStop(() =>
      createOpenAiHttpsExecutor({
        requestImplementation: fakeSuccess,
        externalNetwork: false,
      }).execute({
        body: { oversized: "x".repeat(2 * 1024 * 1024) },
        secretHandle: handle,
      }),
    ),
  );
  actual.push(
    await captureStop(() =>
      createOpenAiHttpsExecutor({
        requestImplementation: fakeSuccess,
        externalNetwork: false,
      }).execute({
        body: {},
        secretHandle: handle,
        timeout: 1,
      }),
    ),
  );
  actual.push(
    await captureStop(() =>
      createOpenAiHttpsExecutor({
        externalNetwork: false,
        requestImplementation: async () => ({
          statusCode: 200,
          bodyText: "x".repeat(4 * 1024 * 1024 + 1),
        }),
      }).execute({ body: {}, secretHandle: handle }),
    ),
  );
  for (const statusCode of [302, 400, 401, 403, 404, 429, 500]) {
    actual.push(
      await captureStop(() =>
        createOpenAiHttpsExecutor({
          externalNetwork: false,
          requestImplementation: async () => ({
            statusCode,
            bodyText: "discarded fixture error body",
          }),
        }).execute({ body: {}, secretHandle: handle }),
      ),
    );
  }
  actual.push(
    await captureStop(() =>
      createOpenAiHttpsExecutor({
        externalNetwork: false,
        requestImplementation: async () => {
          throw new Error("fixture network failure");
        },
      }).execute({ body: {}, secretHandle: handle }),
    ),
  );
  actual.push(
    await captureStop(() =>
      createOpenAiHttpsExecutor({
        externalNetwork: false,
        requestImplementation: async () => {
          const error = new Error("fixture timeout");
          error.code = "ETIMEDOUT";
          throw error;
        },
      }).execute({ body: {}, secretHandle: handle }),
    ),
  );
  actual.push(
    await captureStop(() =>
      assertSequentialHumanCeiling({
        usageDerivedConservativeCostSoFar: 0.9,
        remainingStageLiveGuardCost: 0.2,
        providerCallsCompleted: 5,
      }),
    ),
  );
  return actual;
}

async function verifyRuntimeAndEvidence(contracts) {
  const stageRequests = buildAllStageRequests();
  const liveGuard = computeLiveExecutionGuard(stageRequests);
  const blockedArguments = [
    "--mode",
    "dormant-live-preflight",
    "--case",
    "WAIT-003",
    "--model",
    "gpt-5.6-luna",
    "--contract-hash",
    B1B1.b0ContractHash,
    "--confirm",
    "MOON_REPLY_B1_B2_A_NO_LIVE_EXECUTION",
  ];
  assert(
    "M2_B1_B2_A_CASE_GATE",
    parseDormantPreflightArguments(blockedArguments).case ===
      B1B1.caseId,
    "blocked CLI case differs",
  );
  const blocked = await runBlockedDormantPreflight(blockedArguments);
  assert(
    "M2_B1_B2_A_APPROVAL_ABSENT_GATE",
    blocked.status === "stopped" &&
      blocked.stop_code === "HUMAN_APPROVAL_MISSING" &&
      deepEqual(blocked.completed_steps, [LIVE_RUNNER_SEQUENCE[0]]),
    "blocked runner did not stop at Human approval",
  );
  const rejectedCliInputs = [
    [...blockedArguments, "--live", "true"],
    [
      ...blockedArguments.slice(0, -2),
      "--model",
      "gpt-5.6-luna",
    ],
    blockedArguments.map((value, index) =>
      index === 5 ? "other-model" : value,
    ),
    blockedArguments.map((value, index) =>
      index === 0 ? "--unknown" : value,
    ),
  ];
  assert(
    "M2_B1_B2_A_LIVE_AUTHORIZATION_FALSE_GATE",
    (
      await Promise.all(
        rejectedCliInputs.map((argv) =>
          captureStop(() =>
            parseDormantPreflightArguments(argv),
          ),
        ),
      )
    ).every((stopCode) => stopCode === "CLI_ARGUMENT_REJECTED"),
    "prohibited, duplicate, unknown, or overridden CLI input was accepted",
  );

  const fixtureKey = ["OPENAI", "API", "KEY"].join("_");
  const fixtureProvider = createFixtureEnvironmentSecretProvider({
    [fixtureKey]: "fixture-credential-value",
  });
  const handle = await fixtureProvider.resolveSecret();
  assert(
    "M2_B1_B2_A_SECRET_OPAQUE_GATE",
    isSecretHandle(handle) &&
      Object.keys(handle).length === 0 &&
      String(handle) === "[REDACTED_SECRET_HANDLE]" &&
      inspect(handle) === "[REDACTED_SECRET_HANDLE]" &&
      (await captureStop(() => JSON.stringify(handle))) ===
        "SECRET_SERIALIZATION_PROHIBITED",
    "opaque SecretHandle behavior differs",
  );
  assert(
    "M2_B1_B2_A_ZERO_REAL_ENV_READ_GATE",
    actualEnvironmentSecretMetrics().actual_environment_reads === 0 &&
      fixtureProvider.metrics().actual_environment_reads === 0,
    "a real environment value was read",
  );
  assert(
    "M2_B1_B2_A_ZERO_SECRET_RESOLUTION_GATE",
    actualEnvironmentSecretMetrics().actual_secret_resolutions === 0 &&
      blocked.actual_secret_resolutions === 0,
    "an actual secret was resolved",
  );

  assert(
    "M2_B1_B2_A_FIXED_ENDPOINT_GATE",
    OPENAI_HTTPS_BINDING.protocol === "https:" &&
      OPENAI_HTTPS_BINDING.host === "api.openai.com" &&
      OPENAI_HTTPS_BINDING.port === 443 &&
      OPENAI_HTTPS_BINDING.method === "POST" &&
      OPENAI_HTTPS_BINDING.path === "/v1/responses" &&
      OPENAI_HTTPS_BINDING.redirects_allowed === false &&
      OPENAI_HTTPS_BINDING.proxy_environment_used === false &&
      OPENAI_HTTPS_BINDING.connection_reuse === false,
    "fixed HTTPS endpoint binding differs",
  );
  assert(
    "M2_B1_B2_A_TLS_GATE",
    OPENAI_HTTPS_BINDING.minimum_tls === "TLSv1.2",
    "minimum TLS differs",
  );
  assert(
    "M2_B1_B2_A_BODY_LIMIT_GATE",
    OPENAI_HTTPS_BINDING.maximum_request_body_bytes === 2097152 &&
      OPENAI_HTTPS_BINDING.maximum_response_body_bytes === 4194304,
    "request or response body limit differs",
  );
  assert(
    "M2_B1_B2_A_TIMEOUT_GATE",
    OPENAI_HTTPS_BINDING.timeout_ms === 180000,
    "fixed timeout differs",
  );
  assert(
    "M2_B1_B2_A_ZERO_EXTERNAL_NETWORK_GATE",
    actualHttpsExecutorMetrics().actual_https_requests === 0,
    "external network execution occurred",
  );
  assert(
    "M2_B1_B2_A_ZERO_HTTPS_REQUEST_GATE",
    actualHttpsExecutorMetrics().actual_https_requests === 0 &&
      blocked.actual_https_requests === 0,
    "an actual HTTPS request occurred",
  );
  assert(
    "M2_B1_B2_A_ZERO_PROVIDER_CALL_GATE",
    blocked.actual_provider_calls === 0,
    "an actual provider call occurred",
  );
  assert(
    "M2_B1_B2_A_ZERO_SPEND_GATE",
    blocked.api_spend_usd === 0 &&
      contracts.live.actual_execution.api_spend_usd === 0,
    "API spend is not USD 0",
  );

  assert(
    "M2_B1_B2_A_STATIC_CAP_GATE",
    LIVE_BUDGET_POLICY.historical_static_hard_cap_usd === 0.213223 &&
      LIVE_BUDGET_POLICY.historical_static_hard_cap_usd <= 0.3,
    "historical static cap differs",
  );
  assert(
    "M2_B1_B2_A_CACHE_WRITE_PROTECTION_GATE",
    LIVE_PRICING_SNAPSHOT
      .cache_write_protection_input_per_million_usd === 1.25 &&
      LIVE_PRICING_SNAPSHOT.cached_read_discount_used_for_approval ===
        false &&
      liveGuard.stage_envelopes.every(
        (entry) =>
          entry.cache_write_protected_input_cost_usd > 0,
      ),
    "cache-write-protected input pricing differs",
  );
  assert(
    "M2_B1_B2_A_LONG_INPUT_PRICING_GATE",
    liveGuard.long_input_pricing_guard_passed === true &&
      liveGuard.stage_envelopes.every(
        (entry) =>
          entry.conservative_input_token_upper_bound < 272000,
      ),
    "long-input pricing guard failed",
  );
  assert(
    "M2_B1_B2_A_LIVE_COST_GUARD_GATE",
    liveGuard.live_execution_guard_cost_usd === 0.26079625 &&
      liveGuard.preflight_guard_passed === true,
    `live guard differs: ${liveGuard.live_execution_guard_cost_usd}`,
  );
  assert(
    "M2_B1_B2_A_HUMAN_CEILING_GATE",
    assertSequentialHumanCeiling({
      usageDerivedConservativeCostSoFar: 0,
      remainingStageLiveGuardCost:
        liveGuard.live_execution_guard_cost_usd,
      providerCallsCompleted: 0,
    }) === true,
    "Human ceiling guard differs",
  );

  const markerFileSystem = createInMemoryAuthorizationFileSystem();
  const authorization = createOneTimeAuthorization({
    fileSystem: markerFileSystem,
  });
  const markerReceipt = authorization.consume({
    approvalId: "fixture-approval",
    approvalHash: "a".repeat(64),
    runnerCommitSha: "b".repeat(40),
    confirmationHash: "c".repeat(64),
  });
  assert(
    "M2_B1_B2_A_ONE_TIME_AUTHORIZATION_GATE",
    markerReceipt.status === "consumed" &&
      markerFileSystem.entries().length === 1 &&
      !markerFileSystem.entries()[0].content.includes(
        "fixture-credential-value",
      ),
    "one-time authorization behavior differs",
  );

  const gitContract = gitExecutionGuardContract();
  assert(
    "M2_B1_B2_A_GIT_EXECUTION_GUARD_GATE",
    gitContract.shell === false &&
      gitContract.user_controlled_arguments === false &&
      deepEqual(gitContract.exact_commands, [
        ["git", "branch", "--show-current"],
        ["git", "rev-parse", "HEAD"],
        ["git", "rev-parse", "origin/main"],
        ["git", "status", "--porcelain=v1"],
      ]) &&
      actualExecutionGuardMetrics().actual_child_process_calls === 0,
    "exact Git execution guard differs",
  );

  const artifactFileSystem = createInMemoryArtifactFileSystem();
  const artifactValues = Object.fromEntries(
    artifactBundleContract().future_files.map((file) => [
      file,
      file.endsWith(".md")
        ? "# Fixture sanitized summary"
        : { fixture: true },
    ]),
  );
  const artifactReceipt = writeSanitizedArtifactBundle({
    fileSystem: artifactFileSystem,
    artifactValues,
  });
  assert(
    "M2_B1_B2_A_ARTIFACT_POLICY_GATE",
    artifactReceipt.files.length === 11 &&
      Object.keys(artifactFileSystem.snapshot()).length === 11 &&
      artifactBundleContract().repository_directory_created === false &&
      artifactBundleContract()
        .local_application_data_directory_created === false,
    "artifact bundle contract differs",
  );
  const authorizationFieldName = ["author", "ization"].join("");
  const redactionStop = await captureStop(() =>
    serializeArtifactFailClosed({
      [authorizationFieldName]:
        `${["Bear", "er"].join("")} fixture-token`,
    }),
  );
  assert(
    "M2_B1_B2_A_REDACTION_GATE",
    redactionStop === "ARTIFACT_SECRET_POLICY_VIOLATION",
    "fail-closed artifact redaction differs",
  );

  const actualStops = await runFailureScenarios(
    stageRequests,
    liveGuard,
  );
  const expectedStops = failureScenarioStopCodes.map(
    ([, stopCode]) => stopCode,
  );
  assert(
    "M2_B1_B2_A_FAILURE_MATRIX_GATE",
    actualStops.length === 40 &&
      deepEqual(actualStops, expectedStops) &&
      contracts.failure.scenario_count === 40 &&
      deepEqual(
        contracts.failure.scenarios.map((entry) => [
          entry.scenario_id,
          entry.expected_stop_code,
        ]),
        failureScenarioStopCodes,
      ),
    `40-scenario stop matrix differs: ${JSON.stringify(actualStops)}`,
  );

  assert(
    "M2_B1_B2_A_NO_RETRY_GATE",
    contracts.live.retry_allowed === false &&
      contracts.failure.retry_allowed === false,
    "retry became authorized",
  );
  assert(
    "M2_B1_B2_A_NO_REPAIR_GATE",
    contracts.live.repair_allowed === false &&
      contracts.failure.repair_allowed === false,
    "Repair became authorized",
  );
  assert(
    "M2_B1_B2_A_NO_FALLBACK_GATE",
    contracts.live.fallback_allowed === false &&
      contracts.failure.fallback_allowed === false,
    "fallback became authorized",
  );
  assert(
    "M2_B1_B2_A_ORACLE_ISOLATION_GATE",
    !stageRequests.some((request) =>
      JSON.stringify(request.body).includes('"oracle"'),
    ),
    "oracle entered a provider request",
  );
  assert(
    "M2_B1_B2_A_HOLDOUT_ISOLATION_GATE",
    contracts.live.holdout_execution_allowed === false &&
      contracts.failure.external_network_calls === 0,
    "holdout execution entered the implementation",
  );
  assert(
    "M2_B1_B2_A_REAL_USER_DATA_GATE",
    contracts.live.real_user_execution_allowed === false &&
      contracts.failure.actual_provider_calls === 0,
    "real-user execution entered the implementation",
  );
}

async function verifyDeterminismAndReports() {
  const first = await renderLiveBindingEvidence();
  const second = await renderLiveBindingEvidence();
  assert(
    "M2_B1_B2_A_DETERMINISM_GATE",
    deepEqual(first, second),
    "repeated evidence builds differ",
  );
  for (const [key, relativePath] of [
    ["live", reportPaths.live],
    ["secret", reportPaths.secret],
    ["executor", reportPaths.executor],
    ["failure", reportPaths.failure],
    ["summary", reportPaths.summary],
  ]) {
    assert(
      "M2_B1_B2_A_DETERMINISM_GATE",
      source(relativePath) === first.rendered[key],
      `${relativePath}: checked-in bytes differ`,
    );
  }
  const manifest = readJson(reportPaths.manifest);
  assert(
    "M2_B1_B2_A_REPORT_HASH_GATE",
    manifest.reports.every(
      (entry) => sha256(source(entry.path)) === entry.sha256,
    ) &&
      deepEqual(manifest, first.manifest),
    "report manifest hash differs",
  );
  const evidence = await buildLiveBindingEvidence();
  assert(
    "M2_B1_B2_A_ZERO_EXTERNAL_NETWORK_GATE",
    evidence.failure.external_network_calls === 0,
    "generated evidence reports external network activity",
  );
}

function printResults() {
  for (const gate of gateOrder) {
    for (const detail of failures.get(gate)) {
      console.error(`FAIL_DETAIL | gate=${gate} | ${detail}`);
    }
    console.log(
      `${gate}: ${failures.get(gate).length === 0 ? "PASS" : "FAIL"}`,
    );
  }
  for (const detail of overallFailures) {
    console.error(
      `FAIL_DETAIL | gate=M2_P2_B1_B2_A_DORMANT_LIVE_BINDING_GATE | ${detail}`,
    );
  }
  const passed =
    gateOrder.every((gate) => failures.get(gate).length === 0) &&
    overallFailures.length === 0;
  console.log(
    `M2_P2_B1_B2_A_DORMANT_LIVE_BINDING_GATE: ${
      passed ? "PASS" : "FAIL"
    }`,
  );
  return passed;
}

try {
  const reportManifest = readJson(reportPaths.manifest);
  verifyExactScopeAndCapabilities(reportManifest);
  const contracts = verifyContracts();
  await verifyRuntimeAndEvidence(contracts);
  await verifyDeterminismAndReports();
  if (!printResults()) process.exitCode = 1;
} catch (error) {
  overallFailures.push(
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  printResults();
  process.exitCode = 1;
}
