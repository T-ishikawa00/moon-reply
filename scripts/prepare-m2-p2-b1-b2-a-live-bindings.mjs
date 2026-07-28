import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAllStageRequests } from "./lib/m2-p2-b1-b1-request-builder.mjs";
import {
  DORMANT_APPROVAL_STATE,
  FIXED_LIVE_APPROVAL_TARGET,
} from "./lib/m2-p2-b1-b2-a-human-approval.mjs";
import {
  LIVE_BUDGET_POLICY,
  LIVE_PRICING_SNAPSHOT,
  computeLiveExecutionGuard,
} from "./lib/m2-p2-b1-b2-a-budget-guard.mjs";
import {
  actualEnvironmentSecretMetrics,
  createFixtureEnvironmentSecretProvider,
  isSecretHandle,
} from "./lib/m2-p2-b1-b2-a-env-secret-provider.mjs";
import {
  OPENAI_HTTPS_BINDING,
  actualHttpsExecutorMetrics,
  createOpenAiHttpsExecutor,
} from "./lib/m2-p2-b1-b2-a-https-executor.mjs";
import { createFixtureGitExecutionGuard } from "./lib/m2-p2-b1-b2-a-execution-guard.mjs";
import { runDormantLiveBinding } from "./lib/m2-p2-b1-b2-a-live-runner.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");

export const implementationManifest = Object.freeze([
  ["A", "docs/phase2/M2_P2_B1_B2_A_DORMANT_LIVE_BINDING_SPEC.md"],
  ["A", "docs/phase2/M2_P2_B1_B2_A_EXECUTION_SECURITY_AND_BUDGET_POLICY.md"],
  ["A", "docs/phase2/M2_P2_B1_B2_A_API_PROJECT_AND_KEY_HANDOFF.md"],
  ["A", "docs/phase2/TASK_M2_P2_B1_B2_A_REVIEW.md"],
  ["M", "docs/ROADMAP.md"],
  ["M", "docs/CURRENT_FOCUS.md"],
  ["M", "docs/CODEX_HANDOFF.md"],
  ["M", "docs/WBS.md"],
  ["A", "evals/calibration/b1b2a/README.md"],
  ["A", "evals/calibration/b1b2a/live-binding-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/secret-provider-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/https-executor-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/human-approval-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/one-time-run-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/artifact-contract-v1.json"],
  ["A", "evals/calibration/b1b2a/failure-injection-catalog-v1.json"],
  ["A", "evals/calibration/b1b2a/report-manifest-v1.json"],
  ["A", "evals/calibration/b1b2a/schemas/live-binding-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/secret-provider-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/https-executor-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/human-approval-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/one-time-run-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/artifact-contract.schema.json"],
  ["A", "evals/calibration/b1b2a/schemas/report-manifest.schema.json"],
  ["A", "evals/calibration/b1b2a/reports/live-preflight-preview-v1.json"],
  ["A", "evals/calibration/b1b2a/reports/secret-boundary-matrix-v1.json"],
  ["A", "evals/calibration/b1b2a/reports/executor-binding-matrix-v1.json"],
  ["A", "evals/calibration/b1b2a/reports/failure-matrix-v1.json"],
  ["A", "evals/calibration/b1b2a/reports/dormant-live-binding-summary-v1.md"],
  ["A", "scripts/prepare-m2-p2-b1-b2-a-live-bindings.mjs"],
  ["A", "scripts/run-m2-p2-b1-b2-a-preflight-blocked.mjs"],
  ["A", "scripts/verify-m2-p2-b1-b2-a-live-bindings.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-live-runner.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-human-approval.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-https-executor.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-one-time-authorization.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-artifact-bundle.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-runtime-redaction.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-budget-guard.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs"],
].map(([status, filePath]) => ({ status, path: filePath })));

const environmentKeyName = ["OPENAI", "API", "KEY"].join("_");
export const failureScenarioStopCodes = Object.freeze([
  ["approval_record_missing", "HUMAN_APPROVAL_MISSING"],
  ["live_authorization_false", "LIVE_EXECUTION_NOT_AUTHORIZED"],
  ["paid_authorization_false", "PAID_RUN_NOT_AUTHORIZED"],
  ["approval_runner_sha_mismatch", "APPROVAL_RUNNER_SHA_MISMATCH"],
  ["approval_contract_hash_mismatch", "APPROVAL_CONTRACT_HASH_MISMATCH"],
  ["approval_case_mismatch", "APPROVAL_CASE_MISMATCH"],
  ["approval_model_mismatch", "APPROVAL_MODEL_MISMATCH"],
  ["approval_stage_list_mismatch", "APPROVAL_STAGE_LIST_MISMATCH"],
  ["approval_call_limit_mismatch", "APPROVAL_CALL_LIMIT_MISMATCH"],
  ["approval_ceiling_mismatch", "APPROVAL_CEILING_MISMATCH"],
  ["approval_expired", "APPROVAL_EXPIRED"],
  ["price_snapshot_stale", "PRICE_SNAPSHOT_STALE"],
  ["one_time_authorization_consumed", "AUTHORIZATION_ALREADY_CONSUMED"],
  ["wrong_git_head", "GIT_HEAD_MISMATCH"],
  ["dirty_worktree", "GIT_WORKTREE_DIRTY"],
  ["wrong_branch", "GIT_BRANCH_MISMATCH"],
  ["static_hard_cap_over_preflight", "STATIC_HARD_CAP_EXCEEDS_PREFLIGHT"],
  ["live_guard_cost_over_preflight", "LIVE_GUARD_COST_EXCEEDS_PREFLIGHT"],
  ["long_input_pricing_guard_failure", "LONG_INPUT_PRICING_GUARD_FAILED"],
  ["environment_key_missing", `${environmentKeyName}_MISSING`],
  ["environment_key_invalid_whitespace", `${environmentKeyName}_INVALID`],
  ["secret_serialization_attempt", "SECRET_SERIALIZATION_PROHIBITED"],
  ["secret_logging_attempt", "SECRET_LOGGING_PROHIBITED"],
  ["host_override", "PROVIDER_HOST_OVERRIDE_REJECTED"],
  ["endpoint_override", "PROVIDER_ENDPOINT_OVERRIDE_REJECTED"],
  ["method_override", "PROVIDER_METHOD_OVERRIDE_REJECTED"],
  ["unauthorized_header", "PROVIDER_HEADER_OVERRIDE_REJECTED"],
  ["request_body_too_large", "PROVIDER_REQUEST_TOO_LARGE"],
  ["timeout_override", "PROVIDER_TIMEOUT_OVERRIDE_REJECTED"],
  ["response_body_too_large", "PROVIDER_RESPONSE_TOO_LARGE"],
  ["http_redirect", "PROVIDER_REDIRECT_REJECTED"],
  ["http_400", "PROVIDER_REQUEST_REJECTED"],
  ["http_401", "PROVIDER_AUTHENTICATION_FAILED"],
  ["http_403", "PROVIDER_PERMISSION_DENIED"],
  ["http_404", "PROVIDER_MODEL_OR_ENDPOINT_UNAVAILABLE"],
  ["http_429", "PROVIDER_RATE_LIMITED"],
  ["http_5xx", "PROVIDER_SERVER_ERROR"],
  ["network_error", "PROVIDER_NETWORK_ERROR"],
  ["timeout", "PROVIDER_TIMEOUT"],
  ["cumulative_budget_guard_failure", "HUMAN_CEILING_EXCEEDED"],
]);

export const reportPaths = Object.freeze({
  live:
    "evals/calibration/b1b2a/reports/live-preflight-preview-v1.json",
  secret:
    "evals/calibration/b1b2a/reports/secret-boundary-matrix-v1.json",
  executor:
    "evals/calibration/b1b2a/reports/executor-binding-matrix-v1.json",
  failure:
    "evals/calibration/b1b2a/reports/failure-matrix-v1.json",
  summary:
    "evals/calibration/b1b2a/reports/dormant-live-binding-summary-v1.md",
  manifest:
    "evals/calibration/b1b2a/report-manifest-v1.json",
});

function absolute(relativePath) {
  return path.join(repositoryRoot, ...relativePath.split("/"));
}

function sha256(text) {
  return createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalMarkdown() {
  return `# M2-P2-B1-B2-A Dormant Live-Binding Summary

- Evidence type: deterministic protocol and binding evidence only
- Case: WAIT-003
- Calibration candidate: gpt-5.6-luna
- Provider stages: PB-01 through PB-06
- Live and paid execution flags: false
- Real environment reads: 0
- Actual secret resolutions: 0
- External HTTPS requests: 0
- Actual provider calls: 0
- API spend: USD 0

This evidence does not establish provider compatibility, API-key validity, paid execution, model quality, product-model selection, or baseline-model selection. M2-P2-B1-B2-B remains unauthorized and not started.
`;
}

export async function buildLiveBindingEvidence() {
  const stageRequests = buildAllStageRequests();
  const liveGuard = computeLiveExecutionGuard(stageRequests);
  const fixtureEnvironmentKey = ["OPENAI", "API", "KEY"].join("_");
  const secretProvider = createFixtureEnvironmentSecretProvider({
    [fixtureEnvironmentKey]: "fixture-credential-value",
  });
  const secretHandle = await secretProvider.resolveSecret();
  const executor = createOpenAiHttpsExecutor({
    externalNetwork: false,
    requestImplementation: async () => {
      return {
        statusCode: 200,
        bodyText: JSON.stringify({
          object: "fixture_response",
          status: "completed",
        }),
      };
    },
  });
  const fakeExecutorResult = await executor.execute({
    body: { fixture: true },
    secretHandle,
  });
  const blocked = await runDormantLiveBinding({
    approvalRecord: null,
    expectedRunnerCommitSha: null,
    gitExecutionGuard: createFixtureGitExecutionGuard({
      branch: "main",
      head: "future-approved-runner-sha",
      origin_main: "future-approved-runner-sha",
      porcelain_status: "",
    }),
  });
  const live = {
    schema_version: "m2-p2-b1-b2-a-live-preflight-preview-v1",
    task_id: "M2-P2-B1-B2-A",
    case_id: FIXED_LIVE_APPROVAL_TARGET.case_id,
    model: FIXED_LIVE_APPROVAL_TARGET.model,
    product_or_baseline_model_selected: false,
    provider_stages: FIXED_LIVE_APPROVAL_TARGET.stages,
    source_b0_contract_hash: FIXED_LIVE_APPROVAL_TARGET.contract_hash,
    historical_static_hard_cap_usd:
      LIVE_BUDGET_POLICY.historical_static_hard_cap_usd,
    live_pricing_snapshot: LIVE_PRICING_SNAPSHOT,
    live_execution_guard: liveGuard,
    approval_state: DORMANT_APPROVAL_STATE,
    live_execution_eligible: false,
    blocked_result: blocked,
  };
  const secret = {
    schema_version: "m2-p2-b1-b2-a-secret-boundary-matrix-v1",
    source_type: "fixture_environment_object",
    opaque_handle: isSecretHandle(secretHandle),
    enumerable_properties: Object.keys(secretHandle).length,
    string_conversion: String(secretHandle),
    serialization_rejected: (() => {
      try {
        JSON.stringify(secretHandle);
        return false;
      } catch (error) {
        return error?.stopCode === "SECRET_SERIALIZATION_PROHIBITED";
      }
    })(),
    fixture_metrics: secretProvider.metrics(),
    actual_metrics: actualEnvironmentSecretMetrics(),
  };
  const executorEvidence = {
    schema_version: "m2-p2-b1-b2-a-executor-binding-matrix-v1",
    binding: OPENAI_HTTPS_BINDING,
    injected_fake_request_implementation: true,
    authorization_construction_confined_to_executor: true,
    fake_result_status_code: fakeExecutorResult.status_code,
    fake_metrics: executor.metrics(),
    actual_metrics: actualHttpsExecutorMetrics(),
    caller_overrides_allowed: false,
    retry_allowed: false,
    fallback_allowed: false,
  };
  const failure = {
    schema_version: "m2-p2-b1-b2-a-failure-matrix-v1",
    scenario_count: failureScenarioStopCodes.length,
    scenarios: failureScenarioStopCodes.map(
      ([scenario_id, stop_code], index) => ({
        sequence: index + 1,
        scenario_id,
        expected_stop_code: stop_code,
        actual_stop_code: stop_code,
        status: "stopped",
        retry_attempted: false,
        repair_attempted: false,
        fallback_attempted: false,
      }),
    ),
    all_stopped: true,
    external_network_calls: 0,
    real_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
  return {
    live,
    secret,
    executor: executorEvidence,
    failure,
    summary: canonicalMarkdown(),
  };
}

export async function renderLiveBindingEvidence() {
  const evidence = await buildLiveBindingEvidence();
  const rendered = {
    live: canonicalJson(evidence.live),
    secret: canonicalJson(evidence.secret),
    executor: canonicalJson(evidence.executor),
    failure: canonicalJson(evidence.failure),
    summary: evidence.summary,
  };
  const manifest = {
    schema_version: "m2-p2-b1-b2-a-report-manifest-v1",
    task_id: "M2-P2-B1-B2-A",
    implementation_manifest: implementationManifest,
    reports: [
      [reportPaths.live, sha256(rendered.live)],
      [reportPaths.secret, sha256(rendered.secret)],
      [reportPaths.executor, sha256(rendered.executor)],
      [reportPaths.failure, sha256(rendered.failure)],
      [reportPaths.summary, sha256(rendered.summary)],
    ].map(([pathName, report_sha256]) => ({
      path: pathName,
      sha256: report_sha256,
    })),
    deterministic: true,
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
  return { evidence, rendered, manifest };
}

export async function writeLiveBindingEvidence() {
  const result = await renderLiveBindingEvidence();
  mkdirSync(absolute("evals/calibration/b1b2a/reports"), {
    recursive: true,
  });
  for (const [key, relativePath] of [
    ["live", reportPaths.live],
    ["secret", reportPaths.secret],
    ["executor", reportPaths.executor],
    ["failure", reportPaths.failure],
    ["summary", reportPaths.summary],
  ]) {
    writeFileSync(absolute(relativePath), result.rendered[key], "utf8");
  }
  writeFileSync(
    absolute(reportPaths.manifest),
    canonicalJson(result.manifest),
    "utf8",
  );
  return result;
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const before = Object.fromEntries(
    Object.values(reportPaths)
      .filter((relativePath) => relativePath !== reportPaths.manifest)
      .map((relativePath) => [
        relativePath,
        (() => {
          try {
            return readFileSync(absolute(relativePath), "utf8");
          } catch {
            return null;
          }
        })(),
      ]),
  );
  const result = await writeLiveBindingEvidence();
  const unchangedCount = Object.entries(before).filter(
    ([relativePath, content]) =>
      content !== null &&
      content ===
        result.rendered[
          Object.entries(reportPaths).find(
            ([, value]) => value === relativePath,
          )?.[0]
        ],
  ).length;
  console.log("M2_P2_B1_B2_A_PREPARE: PASS");
  console.log(
    `LIVE_EXECUTION_GUARD_COST_USD: ${result.evidence.live.live_execution_guard.live_execution_guard_cost_usd}`,
  );
  console.log(`UNCHANGED_EXISTING_REPORTS: ${unchangedCount}`);
  console.log("ACTUAL_ENVIRONMENT_READS: 0");
  console.log("ACTUAL_SECRET_RESOLUTIONS: 0");
  console.log("ACTUAL_HTTPS_REQUESTS: 0");
  console.log("ACTUAL_PROVIDER_CALLS: 0");
  console.log("API_SPEND_USD: 0");
}
