import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  B1B1,
  absolute,
  buildAllStageRequests,
  compactHash,
  readJson,
  sha256,
} from "./lib/m2-p2-b1-b1-request-builder.mjs";
import { parseProviderResponse } from "./lib/m2-p2-b1-b1-response-parser.mjs";
import {
  assertBudgetBeforeStage,
  createUsageLedger,
  recordUsage,
} from "./lib/m2-p2-b1-b1-usage-ledger.mjs";
import { invokeProviderAdapter } from "./lib/m2-p2-b1-b1-provider-adapter.mjs";
import { sanitizeArtifact } from "./lib/m2-p2-b1-b1-redaction.mjs";

const reportPaths = Object.freeze({
  request: "evals/calibration/b1b1/reports/request-preview-v1.json",
  response: "evals/calibration/b1b1/reports/response-parser-matrix-v1.json",
  network: "evals/calibration/b1b1/reports/network-blocked-matrix-v1.json",
  failure: "evals/calibration/b1b1/reports/failure-matrix-v1.json",
  summary: "evals/calibration/b1b1/reports/provider-adapter-summary-v1.md",
  manifest: "evals/calibration/b1b1/report-manifest-v1.json",
});

const implementationManifest = [
  ["A", "docs/phase2/M2_P2_B1_B1_PROVIDER_ADAPTER_SPEC.md"],
  ["A", "docs/phase2/M2_P2_B1_B1_REQUEST_AND_RESPONSE_CONTRACT.md"],
  ["A", "docs/phase2/M2_P2_B1_B1_NETWORK_SECRET_AND_REDACTION_POLICY.md"],
  ["A", "docs/phase2/TASK_M2_P2_B1_B1_REVIEW.md"],
  ["M", "docs/ROADMAP.md"],
  ["M", "docs/CURRENT_FOCUS.md"],
  ["M", "docs/CODEX_HANDOFF.md"],
  ["M", "docs/WBS.md"],
  ["A", "evals/calibration/b1b1/README.md"],
  ["A", "evals/calibration/b1b1/provider-adapter-contract-v1.json"],
  ["A", "evals/calibration/b1b1/request-profile-v1.json"],
  ["A", "evals/calibration/b1b1/response-profile-v1.json"],
  ["A", "evals/calibration/b1b1/usage-policy-v1.json"],
  ["A", "evals/calibration/b1b1/network-interlock-v1.json"],
  ["A", "evals/calibration/b1b1/secret-boundary-v1.json"],
  ["A", "evals/calibration/b1b1/approval-lock-v1.json"],
  ["A", "evals/calibration/b1b1/failure-injection-catalog-v1.json"],
  ["A", "evals/calibration/b1b1/report-manifest-v1.json"],
  ["A", "evals/calibration/b1b1/schemas/provider-adapter-contract.schema.json"],
  ["A", "evals/calibration/b1b1/schemas/request-profile.schema.json"],
  ["A", "evals/calibration/b1b1/schemas/response-profile.schema.json"],
  ["A", "evals/calibration/b1b1/schemas/usage-policy.schema.json"],
  ["A", "evals/calibration/b1b1/schemas/network-interlock.schema.json"],
  ["A", "evals/calibration/b1b1/schemas/report-manifest.schema.json"],
  ["A", "evals/calibration/b1b1/reports/request-preview-v1.json"],
  ["A", "evals/calibration/b1b1/reports/response-parser-matrix-v1.json"],
  ["A", "evals/calibration/b1b1/reports/network-blocked-matrix-v1.json"],
  ["A", "evals/calibration/b1b1/reports/failure-matrix-v1.json"],
  ["A", "evals/calibration/b1b1/reports/provider-adapter-summary-v1.md"],
  ["A", "scripts/prepare-m2-p2-b1-b1-provider-adapter.mjs"],
  ["A", "scripts/run-m2-p2-b1-b1-network-blocked.mjs"],
  ["A", "scripts/verify-m2-p2-b1-b1-provider-adapter.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-request-builder.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-response-parser.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-usage-ledger.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-provider-adapter.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-network-interlock.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-secret-provider-contract.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b1-redaction.mjs"],
].map(([status, pathName]) => ({ status, path: pathName }));

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function clone(value) {
  return structuredClone(value);
}

function makeSyntheticRawResponse(stageRequest, syntheticStage) {
  const inputTokens = syntheticStage.synthetic_usage_reference.synthetic_input_tokens;
  const outputTokens =
    syntheticStage.synthetic_usage_reference.synthetic_output_tokens;
  const reasoningTokens = Math.min(Math.floor(outputTokens / 10), outputTokens);
  return {
    object: "response",
    id: `resp_synthetic_${stageRequest.stage_id.toLowerCase().replace("-", "_")}`,
    model: B1B1.model,
    status: "completed",
    error: null,
    incomplete_details: null,
    output: [
      {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [
          {
            type: "output_text",
            text: JSON.stringify(syntheticStage.synthetic_output),
          },
        ],
      },
    ],
    usage: {
      input_tokens: inputTokens,
      input_tokens_details: {
        cached_tokens: 0,
      },
      output_tokens: outputTokens,
      output_tokens_details: {
        reasoning_tokens: reasoningTokens,
      },
      total_tokens: inputTokens + outputTokens,
    },
  };
}

function caughtStop(action) {
  try {
    const value = action();
    return { stopped: false, stop_code: null, value };
  } catch (error) {
    return {
      stopped: true,
      stop_code: error?.stopCode ?? "UNCLASSIFIED_FAILURE",
      receipt_recorded: Boolean(error?.receipt),
    };
  }
}

function responseScenario(stageRequest, rawResponse, mutate) {
  const candidate = clone(rawResponse);
  mutate(candidate);
  return caughtStop(() =>
    parseProviderResponse({ stageRequest, rawResponse: candidate }),
  );
}

function buildResponseMatrix(requests, replayCatalog, usagePolicy) {
  const ledger = createUsageLedger();
  const happy_paths = requests.map((stageRequest) => {
    const syntheticStage = replayCatalog.stages.find(
      (entry) => entry.stage_id === stageRequest.stage_id,
    );
    const rawResponse = makeSyntheticRawResponse(stageRequest, syntheticStage);
    const receipt = parseProviderResponse({ stageRequest, rawResponse });
    recordUsage(ledger, receipt, usagePolicy);
    return {
      stage_id: receipt.stage_id,
      response_id: receipt.response_id,
      requested_model: receipt.requested_model,
      returned_model: receipt.returned_model,
      response_status: receipt.response_status,
      schema_valid: receipt.schema_valid,
      usage: receipt.usage,
    };
  });
  const baseRequest = requests[0];
  const baseStage = replayCatalog.stages[0];
  const baseRaw = makeSyntheticRawResponse(baseRequest, baseStage);
  const malformed = [
    ["failed", (item) => { item.status = "failed"; }],
    ["incomplete", (item) => { item.status = "incomplete"; }],
    ["queued", (item) => { item.status = "queued"; }],
    ["in_progress", (item) => { item.status = "in_progress"; }],
    ["cancelled", (item) => { item.status = "cancelled"; }],
    [
      "refusal",
      (item) => {
        item.output[0].content = [{ type: "refusal", refusal: "synthetic" }];
      },
    ],
    ["usage_missing", (item) => { delete item.usage; }],
    ["output_text_missing", (item) => { item.output[0].content = []; }],
    ["invalid_json", (item) => { item.output[0].content[0].text = "{"; }],
    [
      "schema_failure",
      (item) => {
        item.output[0].content[0].text = JSON.stringify({ unexpected: true });
      },
    ],
    ["response_id_missing", (item) => { item.id = ""; }],
    ["returned_model_missing", (item) => { item.model = ""; }],
    [
      "usage_inconsistent",
      (item) => {
        item.usage.total_tokens += 1;
      },
    ],
  ].map(([scenario_id, mutate]) => ({
    scenario_id,
    ...responseScenario(baseRequest, baseRaw, mutate),
  }));
  return sanitizeArtifact({
    schema_version: "moon-reply-b1b1-response-parser-matrix-v1",
    task_id: B1B1.taskId,
    synthetic_only: true,
    happy_path_count: happy_paths.length,
    happy_paths,
    malformed,
    usage_ledger: ledger,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  });
}

function requestMutation(stageRequest, scenarioId) {
  const mutated = clone(stageRequest);
  const mutations = {
    wrong_contract_hash: () => {
      mutated.source_b0_contract_hash = "0".repeat(64);
    },
    wrong_case: () => {
      mutated.case_id = "WAIT-004";
    },
    wrong_model: () => {
      mutated.requested_model = "unregistered_model";
    },
    unauthorized_stage: () => {
      mutated.stage_id = "PB-07";
    },
    output_cap_override: () => {
      mutated.body.max_output_tokens += 1;
    },
    store_true: () => {
      mutated.body.store = true;
    },
    tools_nonempty: () => {
      mutated.body.tools = [{ type: "synthetic_prohibited_tool" }];
    },
    stream_true: () => {
      mutated.body.stream = true;
    },
    background_true: () => {
      mutated.body.background = true;
    },
    wrong_service_tier: () => {
      mutated.body.service_tier = "priority";
    },
    truncation_auto: () => {
      mutated.body.truncation = "auto";
    },
    wrong_reasoning_effort: () => {
      mutated.body.reasoning.effort = "medium";
    },
    schema_strict_false: () => {
      mutated.body.text.format.strict = false;
    },
    request_hash_mismatch: () => {
      mutated.request_body_sha256 = "0".repeat(64);
    },
  };
  mutations[scenarioId]?.();
  return mutated;
}

async function adapterScenario({
  scenario,
  baseRequest,
  usagePolicy,
}) {
  let secretCalls = 0;
  let executorCalls = 0;
  const stageRequest = requestMutation(baseRequest, scenario.scenario_id);
  const approvalProof = {
    live_execution_authorized: ![
      "approval_false",
      "paid_authorization_false",
    ].includes(scenario.scenario_id),
    paid_run_authorized: scenario.scenario_id !== "paid_authorization_false",
  };
  const secretProvider =
    scenario.scenario_id === "secret_provider_unbound"
      ? null
      : {
          resolveSecret() {
            secretCalls += 1;
            throw new Error("Network-blocked sentinel reached");
          },
        };
  const requestExecutor =
    scenario.scenario_id === "network_executor_unbound"
      ? null
      : {
          execute() {
            executorCalls += 1;
            throw new Error("Network-blocked sentinel reached");
          },
        };
  const receipt = await invokeProviderAdapter({
    stageRequest,
    approvalProof,
    secretProvider,
    requestExecutor,
    timeoutController: {
      createSignal() {
        throw new Error("Network-blocked timeout sentinel reached");
      },
    },
    ledger: createUsageLedger(),
    usagePolicy,
  });
  return {
    actual_stop_code: receipt.stop_code,
    stopped: receipt.status === "stopped",
    secret_provider_invocations: secretCalls,
    request_executor_invocations: executorCalls,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
}

function parserFailureScenario({
  scenarioId,
  stageRequest,
  baseRaw,
  usagePolicy,
}) {
  if (scenarioId === "budget_guard_failure") {
    const result = caughtStop(() =>
      assertBudgetBeforeStage({
        ledger: createUsageLedger(),
        nextStageId: "PB-01",
        usagePolicy,
        forceFailure: true,
      }),
    );
    return {
      ...result,
      secret_provider_invocations: 0,
      request_executor_invocations: 0,
      actual_provider_calls: 0,
      api_spend_usd: 0,
    };
  }
  const mutation = {
    response_status_failed: (item) => { item.status = "failed"; },
    response_status_incomplete: (item) => { item.status = "incomplete"; },
    refusal_present: (item) => {
      item.output[0].content = [{ type: "refusal", refusal: "synthetic" }];
    },
    usage_missing: (item) => { delete item.usage; },
    output_text_missing: (item) => { item.output[0].content = []; },
    invalid_json_output: (item) => { item.output[0].content[0].text = "{"; },
    response_schema_failure: (item) => {
      item.output[0].content[0].text = JSON.stringify({ unexpected: true });
    },
    returned_model_mismatch: (item) => { item.model = "synthetic_mismatch"; },
    usage_arithmetic_mismatch: (item) => { item.usage.total_tokens += 1; },
  }[scenarioId];
  const result = responseScenario(stageRequest, baseRaw, mutation);
  return {
    ...result,
    secret_provider_invocations: 0,
    request_executor_invocations: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
}

async function buildFailureMatrix(
  requests,
  replayCatalog,
  failureCatalog,
  usagePolicy,
) {
  const baseRequest = requests[0];
  const baseRaw = makeSyntheticRawResponse(baseRequest, replayCatalog.stages[0]);
  const rows = [];
  for (const scenario of failureCatalog.scenarios) {
    const result =
      failureCatalog.scenarios.indexOf(scenario) < 18
        ? await adapterScenario({ scenario, baseRequest, usagePolicy })
        : parserFailureScenario({
            scenarioId: scenario.scenario_id,
            stageRequest: baseRequest,
            baseRaw,
            usagePolicy,
          });
    rows.push({
      scenario_id: scenario.scenario_id,
      expected_stop_code: scenario.expected_stop_code,
      actual_stop_code: result.actual_stop_code ?? result.stop_code,
      stopped: result.stopped,
      pre_secret_and_executor: scenario.pre_secret_and_executor,
      secret_provider_invocations: result.secret_provider_invocations,
      request_executor_invocations: result.request_executor_invocations,
      actual_provider_calls: result.actual_provider_calls,
      api_spend_usd: result.api_spend_usd,
      retry_attempted: false,
      repair_attempted: false,
      fallback_attempted: false,
      passed:
        result.stopped === true &&
        (result.actual_stop_code ?? result.stop_code) ===
          scenario.expected_stop_code &&
        result.secret_provider_invocations === 0 &&
        result.request_executor_invocations === 0 &&
        result.actual_provider_calls === 0 &&
        result.api_spend_usd === 0,
    });
  }
  return sanitizeArtifact({
    schema_version: "moon-reply-b1b1-failure-matrix-v1",
    task_id: B1B1.taskId,
    scenario_count: rows.length,
    passed_count: rows.filter((entry) => entry.passed).length,
    all_stopped: rows.every((entry) => entry.stopped),
    actual_provider_calls: 0,
    api_spend_usd: 0,
    scenarios: rows,
  });
}

function buildRequestPreview(requests) {
  return sanitizeArtifact({
    schema_version: "moon-reply-b1b1-request-preview-v1",
    task_id: B1B1.taskId,
    case_id: B1B1.caseId,
    requested_model: B1B1.model,
    source_b0_contract_hash: B1B1.b0ContractHash,
    provider_validated: false,
    network_execution_authorized: false,
    oracle_included: false,
    holdout_data_used: false,
    real_user_data_used: false,
    stage_count: requests.length,
    requests,
  });
}

async function buildNetworkMatrix(baseRequest, usagePolicy) {
  let secretCalls = 0;
  let executorCalls = 0;
  const receipt = await invokeProviderAdapter({
    stageRequest: baseRequest,
    approvalProof: {
      live_execution_authorized: false,
      paid_run_authorized: false,
    },
    secretProvider: {
      resolveSecret() {
        secretCalls += 1;
        throw new Error("Network-blocked sentinel reached");
      },
    },
    requestExecutor: {
      execute() {
        executorCalls += 1;
        throw new Error("Network-blocked sentinel reached");
      },
    },
    timeoutController: {
      createSignal() {
        throw new Error("Network-blocked timeout sentinel reached");
      },
    },
    ledger: createUsageLedger(),
    usagePolicy,
  });
  return sanitizeArtifact({
    schema_version: "moon-reply-b1b1-network-blocked-matrix-v1",
    task_id: B1B1.taskId,
    execution_mode: B1B1.mode,
    scenarios: [
      {
        scenario_id: "approval_false",
        stopped: receipt.status === "stopped",
        stop_code: receipt.stop_code,
        secret_provider_invocations: secretCalls,
        request_executor_invocations: executorCalls,
        actual_provider_calls: 0,
        api_spend_usd: 0,
      },
    ],
  });
}

function buildSummary(failureMatrix) {
  return [
    "# M2-P2-B1-B1 Provider Adapter Summary",
    "",
    "- Evidence type: `offline protocol evidence`",
    "- Provider compatibility evidence: `no`",
    "- API execution evidence: `no`",
    "- Model-quality evidence: `no`",
    `- Case: \`${B1B1.caseId}\``,
    `- Calibration candidate: \`${B1B1.model}\``,
    "- Product or baseline model selected: `false`",
    "- Provider stages: `PB-01` through `PB-06`",
    "- HTTP executor implemented: `false`",
    "- Environment secret provider implemented: `false`",
    "- Actual secret-resolution calls: `0`",
    "- Actual executor calls: `0`",
    "- Actual provider calls: `0`",
    "- API spend: `USD 0`",
    `- Failure scenarios stopped: \`${failureMatrix.passed_count}/28\``,
    "- Retry, Repair, fallback, PB-07, Batch, holdout, and real-user execution: `prohibited`",
    "- M2-P2-B1-B2: `unauthorized_not_started`",
    "",
    "Synthetic Responses receipts prove parser, request-contract, ledger, and stop semantics only. They do not prove provider availability, compatibility, latency, billing, or model quality.",
    "",
  ].join("\n");
}

function buildManifest(renderedReports) {
  return {
    schema_version: "moon-reply-b1b1-report-manifest-v1",
    manifest_version: "provider-adapter-report-manifest-v1.0.0",
    report_paths: [
      reportPaths.request,
      reportPaths.response,
      reportPaths.network,
      reportPaths.failure,
      reportPaths.summary,
    ],
    report_hashes: Object.fromEntries(
      Object.entries(renderedReports).map(([key, rendered]) => [
        reportPaths[key],
        sha256(Buffer.from(rendered, "utf8")),
      ]),
    ),
    implementation_file_count: 39,
    added_file_count: 35,
    modified_file_count: 4,
    deleted_file_count: 0,
    implementation_manifest: implementationManifest,
  };
}

export async function buildProviderAdapterEvidence() {
  const requests = buildAllStageRequests();
  const replayCatalog = readJson(
    "evals/calibration/b1a/offline-replay-catalog-v1.json",
  );
  const usagePolicy = readJson("evals/calibration/b1b1/usage-policy-v1.json");
  const failureCatalog = readJson(
    "evals/calibration/b1b1/failure-injection-catalog-v1.json",
  );
  const request = buildRequestPreview(requests);
  const response = buildResponseMatrix(requests, replayCatalog, usagePolicy);
  const network = await buildNetworkMatrix(requests[0], usagePolicy);
  const failure = await buildFailureMatrix(
    requests,
    replayCatalog,
    failureCatalog,
    usagePolicy,
  );
  const summary = buildSummary(failure);
  const renderedReports = {
    request: renderJson(request),
    response: renderJson(response),
    network: renderJson(network),
    failure: renderJson(failure),
    summary,
  };
  const manifest = buildManifest(renderedReports);
  return {
    request,
    response,
    network,
    failure,
    summary,
    manifest,
    rendered: {
      ...renderedReports,
      manifest: renderJson(manifest),
    },
    deterministic_payload_sha256: compactHash({
      request,
      response,
      network,
      failure,
      summary,
      manifest,
    }),
  };
}

export async function writeProviderAdapterEvidence() {
  const evidence = await buildProviderAdapterEvidence();
  for (const [relativePath, rendered] of [
    [reportPaths.request, evidence.rendered.request],
    [reportPaths.response, evidence.rendered.response],
    [reportPaths.network, evidence.rendered.network],
    [reportPaths.failure, evidence.rendered.failure],
    [reportPaths.summary, evidence.rendered.summary],
    [reportPaths.manifest, evidence.rendered.manifest],
  ]) {
    mkdirSync(path.dirname(absolute(relativePath)), { recursive: true });
    writeFileSync(absolute(relativePath), rendered, "utf8");
  }
  return evidence;
}

function isDirectExecution() {
  return (
    typeof process.argv[1] === "string" &&
    path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  );
}

if (isDirectExecution()) {
  try {
    const first = await buildProviderAdapterEvidence();
    const second = await buildProviderAdapterEvidence();
    if (first.deterministic_payload_sha256 !== second.deterministic_payload_sha256) {
      throw new Error("Provider adapter evidence differs across repeated builds");
    }
    await writeProviderAdapterEvidence();
    console.log(`REQUEST_PREVIEW_REPORT: ${reportPaths.request}`);
    console.log(`RESPONSE_PARSER_MATRIX_REPORT: ${reportPaths.response}`);
    console.log(`NETWORK_BLOCKED_MATRIX_REPORT: ${reportPaths.network}`);
    console.log(`FAILURE_MATRIX_REPORT: ${reportPaths.failure}`);
    console.log("M2_B1_B1_DETERMINISM_GATE: PASS");
    console.log("Actual provider calls: 0. API spend: USD 0.");
  } catch (error) {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exitCode = 1;
  }
}

export { implementationManifest, makeSyntheticRawResponse, reportPaths };
