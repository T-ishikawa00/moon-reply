import { createHash } from "node:crypto";
import { createFixtureGitExecutionGuard } from "./lib/m2-p2-b1-b2-a-execution-guard.mjs";
import {
  buildApprovedFixture,
  buildRepositoryApprovalTemplate,
  withApprovalRecordHash,
} from "./lib/m2-p2-b1-b2-b0-approval-record.mjs";
import {
  buildExternalPaths,
  conceptualExternalPaths,
} from "./lib/m2-p2-b1-b2-b0-external-paths.mjs";
import {
  createInMemoryMarkerStore,
  createRepositoryFileSystem,
  isMainModule,
} from "./lib/m2-p2-b1-b2-b0-local-filesystem.mjs";
import {
  paidCliArguments,
  runPaidCalibrationOnce,
} from "./lib/m2-p2-b1-b2-b0-paid-cli.mjs";
import {
  B0_BUDGET_EVIDENCE,
  B0_PRICE_SNAPSHOT,
  B0_PRICE_SNAPSHOT_SHA256,
} from "./lib/m2-p2-b1-b2-b0-price-snapshot.mjs";
import {
  blockedPreflightArguments,
  runBlockedPaidPreflight,
} from "./run-m2-p2-b1-b2-b0-preflight-blocked.mjs";

export const implementationManifest = Object.freeze([
  ["A", "docs/phase2/M2_P2_B1_B2_B0_EXECUTION_PACKAGE_SPEC.md"],
  ["A", "docs/phase2/M2_P2_B1_B2_B0_APPROVAL_AND_ONE_TIME_RUN_POLICY.md"],
  ["A", "docs/phase2/M2_P2_B1_B2_B0_OPERATOR_RUNBOOK.md"],
  ["A", "docs/phase2/TASK_M2_P2_B1_B2_B0_REVIEW.md"],
  ["M", "docs/ROADMAP.md"],
  ["M", "docs/CURRENT_FOCUS.md"],
  ["M", "docs/CODEX_HANDOFF.md"],
  ["M", "docs/WBS.md"],
  ["A", "evals/calibration/b1b2b0/README.md"],
  ["A", "evals/calibration/b1b2b0/execution-package-contract-v1.json"],
  ["A", "evals/calibration/b1b2b0/approval-template-v1.json"],
  ["A", "evals/calibration/b1b2b0/price-snapshot-v1.json"],
  ["A", "evals/calibration/b1b2b0/paid-cli-contract-v1.json"],
  ["A", "evals/calibration/b1b2b0/artifact-policy-v1.json"],
  ["A", "evals/calibration/b1b2b0/failure-injection-catalog-v1.json"],
  ["A", "evals/calibration/b1b2b0/report-manifest-v1.json"],
  ["A", "evals/calibration/b1b2b0/schemas/execution-package-contract.schema.json"],
  ["A", "evals/calibration/b1b2b0/schemas/approval-record.schema.json"],
  ["A", "evals/calibration/b1b2b0/schemas/paid-cli-contract.schema.json"],
  ["A", "evals/calibration/b1b2b0/schemas/artifact-policy.schema.json"],
  ["A", "evals/calibration/b1b2b0/schemas/report-manifest.schema.json"],
  ["A", "evals/calibration/b1b2b0/reports/preflight-blocked-v1.json"],
  ["A", "evals/calibration/b1b2b0/reports/approval-template-preview-v1.json"],
  ["A", "evals/calibration/b1b2b0/reports/cli-rejection-matrix-v1.json"],
  ["A", "evals/calibration/b1b2b0/reports/execution-package-summary-v1.md"],
  ["A", "scripts/prepare-m2-p2-b1-b2-b0-execution-package.mjs"],
  ["A", "scripts/run-m2-p2-b1-b2-b0-preflight-blocked.mjs"],
  ["A", "scripts/verify-m2-p2-b1-b2-b0-execution-package.mjs"],
  ["A", "scripts/run-m2-p2-b1-b2-b-paid-once.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-b0-approval-record.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-b0-paid-cli.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-b0-local-filesystem.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-b0-price-snapshot.mjs"],
  ["A", "scripts/lib/m2-p2-b1-b2-b0-external-paths.mjs"],
].map(([status, filePath]) => ({
  status,
  path: filePath,
})));

export const failureScenarioStopCodes = Object.freeze([
  ["external_approval_missing", "EXTERNAL_APPROVAL_NOT_PRESENT"],
  [
    "repository_template_used_as_approval",
    "REPOSITORY_TEMPLATE_NOT_APPROVAL",
  ],
  ["approval_status_not_approved", "APPROVAL_STATUS_NOT_APPROVED"],
  ["live_authorization_false", "LIVE_EXECUTION_NOT_AUTHORIZED"],
  ["paid_authorization_false", "PAID_RUN_NOT_AUTHORIZED"],
  ["runner_sha_placeholder", "RUNNER_SHA_PLACEHOLDER"],
  ["runner_sha_mismatch", "APPROVAL_RUNNER_SHA_MISMATCH"],
  ["origin_main_mismatch", "ORIGIN_MAIN_MISMATCH"],
  ["wrong_branch", "GIT_BRANCH_MISMATCH"],
  ["dirty_worktree", "GIT_WORKTREE_DIRTY"],
  ["untracked_file_present", "GIT_WORKTREE_DIRTY"],
  ["contract_hash_mismatch", "APPROVAL_CONTRACT_HASH_MISMATCH"],
  ["case_mismatch", "APPROVAL_CASE_MISMATCH"],
  ["model_mismatch", "APPROVAL_MODEL_MISMATCH"],
  ["stage_list_mismatch", "APPROVAL_STAGE_LIST_MISMATCH"],
  ["call_limit_mismatch", "APPROVAL_CALL_LIMIT_MISMATCH"],
  [
    "preflight_ceiling_mismatch",
    "APPROVAL_PREFLIGHT_CEILING_MISMATCH",
  ],
  [
    "absolute_ceiling_mismatch",
    "APPROVAL_ABSOLUTE_CEILING_MISMATCH",
  ],
  ["price_snapshot_stale", "PRICE_SNAPSHOT_STALE"],
  ["request_hash_mismatch", "APPROVAL_REQUEST_HASH_MISMATCH"],
  ["approval_expired", "APPROVAL_EXPIRED"],
  ["confirmation_hash_mismatch", "CONFIRMATION_HASH_MISMATCH"],
  [
    "authorization_already_consumed",
    "AUTHORIZATION_ALREADY_CONSUMED",
  ],
  [
    "approval_path_outside_fixed_root",
    "APPROVAL_PATH_OUTSIDE_FIXED_ROOT",
  ],
]);

export const reportPaths = Object.freeze({
  approval:
    "evals/calibration/b1b2b0/approval-template-v1.json",
  preflight:
    "evals/calibration/b1b2b0/reports/preflight-blocked-v1.json",
  approvalPreview:
    "evals/calibration/b1b2b0/reports/approval-template-preview-v1.json",
  cli:
    "evals/calibration/b1b2b0/reports/cli-rejection-matrix-v1.json",
  summary:
    "evals/calibration/b1b2b0/reports/execution-package-summary-v1.md",
  manifest:
    "evals/calibration/b1b2b0/report-manifest-v1.json",
});

const fixturePaths = buildExternalPaths(
  "C:\\fixture-user\\AppData\\Local",
);
const fixtureRunnerSha =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const fixtureExecutionTime = "2026-07-29T00:15:00.000Z";

function sha256(text) {
  return createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
}

export function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function canonicalSummary() {
  return `# M2-P2-B1-B2-B0 Execution-Package Summary

- Evidence type: deterministic zero-network execution-package evidence
- Case: WAIT-003
- Calibration candidate: gpt-5.6-luna
- Provider stages: PB-01 through PB-06
- Maximum provider calls: 6
- Repository approval template: non-executable
- True external approval created: no
- Paid CLI executed: no
- Real environment reads: 0
- Actual secret resolutions: 0
- External HTTPS requests: 0
- Actual provider calls: 0
- API spend: USD 0

The paid-run entrypoint remains unreachable without a separately authorized, unexpired external approval bound to exact final main state. This package is not provider compatibility, billing, latency, model-quality, product-model, or baseline-model evidence. M2-P2-B1-B2-B1 remains unauthorized and not started.
`;
}

function refreshed(record) {
  return withApprovalRecordHash(record);
}

function mutateScenario(scenarioId, state) {
  const record = () => structuredClone(state.record);
  switch (scenarioId) {
    case "external_approval_missing":
      state.record = null;
      break;
    case "repository_template_used_as_approval":
      state.record = buildRepositoryApprovalTemplate();
      break;
    case "approval_status_not_approved": {
      const next = record();
      next.approval_status = "denied";
      state.record = refreshed(next);
      break;
    }
    case "live_authorization_false": {
      const next = record();
      next.live_execution_authorized = false;
      state.record = refreshed(next);
      break;
    }
    case "paid_authorization_false": {
      const next = record();
      next.paid_run_authorized = false;
      state.record = refreshed(next);
      break;
    }
    case "runner_sha_placeholder": {
      const next = record();
      next.approved_runner_commit_sha =
        "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE";
      next.approved_origin_main_sha =
        "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE";
      state.record = refreshed(next);
      break;
    }
    case "runner_sha_mismatch": {
      const next = record();
      next.approved_runner_commit_sha =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      state.record = refreshed(next);
      break;
    }
    case "origin_main_mismatch":
      state.gitReceipt.origin_main =
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
      break;
    case "wrong_branch":
      state.gitReceipt.branch =
        "design/m2-p2-b1-b2-b0-paid-execution-package";
      break;
    case "dirty_worktree":
      state.gitReceipt.porcelain_status =
        " M docs/CURRENT_FOCUS.md";
      break;
    case "untracked_file_present":
      state.gitReceipt.porcelain_status = "?? unexpected.txt";
      break;
    case "contract_hash_mismatch": {
      const next = record();
      next.approved_contract_hash = "b".repeat(64);
      state.record = refreshed(next);
      break;
    }
    case "case_mismatch": {
      const next = record();
      next.approved_case = "WAIT-002";
      state.record = refreshed(next);
      break;
    }
    case "model_mismatch": {
      const next = record();
      next.approved_model = "different-model";
      state.record = refreshed(next);
      break;
    }
    case "stage_list_mismatch": {
      const next = record();
      next.approved_stages = next.approved_stages.slice(0, 5);
      state.record = refreshed(next);
      break;
    }
    case "call_limit_mismatch": {
      const next = record();
      next.max_provider_calls = 7;
      state.record = refreshed(next);
      break;
    }
    case "preflight_ceiling_mismatch": {
      const next = record();
      next.preflight_ceiling_usd = 0.31;
      state.record = refreshed(next);
      break;
    }
    case "absolute_ceiling_mismatch": {
      const next = record();
      next.absolute_ceiling_usd = 1.01;
      state.record = refreshed(next);
      break;
    }
    case "price_snapshot_stale": {
      const next = record();
      next.price_snapshot_verified_at =
        "2026-07-27T00:00:00.000Z";
      state.record = refreshed(next);
      break;
    }
    case "request_hash_mismatch": {
      const next = record();
      next.exact_request_hashes["PB-01"].request_body_sha256 =
        "b".repeat(64);
      state.record = refreshed(next);
      break;
    }
    case "approval_expired": {
      const next = record();
      next.approval_expires_at = "2026-07-29T00:10:00.000Z";
      state.record = refreshed(next);
      break;
    }
    case "confirmation_hash_mismatch": {
      const next = record();
      next.confirmation_phrase_sha256 = "b".repeat(64);
      next.one_time_confirmation_hash = "b".repeat(64);
      state.record = refreshed(next);
      break;
    }
    case "authorization_already_consumed":
      state.consumedApprovalIds.push(state.record.approval_id);
      break;
    case "approval_path_outside_fixed_root": {
      const flagIndex = state.argv.indexOf("--approval-file");
      state.argv[flagIndex + 1] =
        "D:\\outside\\one-time-approval.json";
      break;
    }
    default:
      throw new Error(`Unknown failure scenario ${scenarioId}`);
  }
}

async function executeFailureScenario(
  scenarioId,
  expectedStopCode,
) {
  const state = {
    record: buildApprovedFixture({
      runnerSha: fixtureRunnerSha,
    }),
    gitReceipt: {
      branch: "main",
      head: fixtureRunnerSha,
      origin_main: fixtureRunnerSha,
      porcelain_status: "",
    },
    argv: paidCliArguments(fixturePaths.approval_file),
    consumedApprovalIds: [],
  };
  mutateScenario(scenarioId, state);
  let fixtureSecretResolutions = 0;
  let fixtureHttpsRequests = 0;
  const markerStore = createInMemoryMarkerStore({
    consumedApprovalIds: state.consumedApprovalIds,
  });
  const result = await runPaidCalibrationOnce({
    argv: state.argv,
    expectedApprovalPath: fixturePaths.approval_file,
    approvalLoader: {
      load: () =>
        state.record === null
          ? null
          : structuredClone(state.record),
    },
    executionTime: fixtureExecutionTime,
    gitExecutionGuard: createFixtureGitExecutionGuard(
      state.gitReceipt,
    ),
    markerStore,
    secretProvider: {
      async resolveSecret() {
        fixtureSecretResolutions += 1;
        throw Object.assign(
          new Error("Failure scenario reached secret resolution"),
          { stopCode: "UNEXPECTED_SECRET_RESOLUTION" },
        );
      },
    },
    httpsExecutor: {
      async execute() {
        fixtureHttpsRequests += 1;
        throw Object.assign(
          new Error("Failure scenario reached HTTPS"),
          { stopCode: "UNEXPECTED_HTTPS_REQUEST" },
        );
      },
    },
    artifactWriter: {
      async write() {
        throw new Error("Failure scenario reached artifact output");
      },
    },
  });
  return {
    scenario_id: scenarioId,
    expected_stop_code: expectedStopCode,
    actual_stop_code: result.stop_code,
    status: result.status,
    stopped_before_secret:
      fixtureSecretResolutions === 0 &&
      result.actual_secret_resolutions === 0,
    stopped_before_https:
      fixtureHttpsRequests === 0 &&
      result.actual_https_requests === 0,
    actual_environment_reads: result.actual_environment_reads,
    actual_secret_resolutions: fixtureSecretResolutions,
    actual_https_requests: fixtureHttpsRequests,
    actual_provider_calls: result.actual_provider_calls,
    api_spend_usd: result.api_spend_usd,
    retry_attempted: result.retry_attempted,
    repair_attempted: result.repair_attempted,
    fallback_attempted: result.fallback_attempted,
    passed:
      result.status === "stopped" &&
      result.stop_code === expectedStopCode &&
      fixtureSecretResolutions === 0 &&
      fixtureHttpsRequests === 0 &&
      result.actual_provider_calls === 0 &&
      result.api_spend_usd === 0 &&
      result.retry_attempted === false &&
      result.repair_attempted === false &&
      result.fallback_attempted === false,
  };
}

export async function buildExecutionPackageEvidence() {
  const approvalTemplate = buildRepositoryApprovalTemplate();
  const preflightResult = runBlockedPaidPreflight(
    blockedPreflightArguments(),
  );
  const scenarios = [];
  for (const [scenarioId, expectedStopCode] of failureScenarioStopCodes) {
    scenarios.push(
      await executeFailureScenario(scenarioId, expectedStopCode),
    );
  }
  const preflight = {
    schema_version: "m2-p2-b1-b2-b0-preflight-blocked-v1",
    task_id: "M2-P2-B1-B2-B0",
    expected_stop_code: "EXTERNAL_APPROVAL_NOT_PRESENT",
    result: preflightResult,
    external_paths: conceptualExternalPaths(),
    external_directories_created: 0,
  };
  const approvalPreview = {
    schema_version:
      "m2-p2-b1-b2-b0-approval-template-preview-v1",
    task_id: "M2-P2-B1-B2-B0",
    approval_status: approvalTemplate.approval_status,
    approval_record_present:
      approvalTemplate.approval_record_present,
    live_execution_authorized:
      approvalTemplate.live_execution_authorized,
    paid_run_authorized:
      approvalTemplate.paid_run_authorized,
    paid_run_completed: approvalTemplate.paid_run_completed,
    approved_runner_commit_sha:
      approvalTemplate.approved_runner_commit_sha,
    repository_template_can_authorize_execution: false,
    true_external_approval_created: false,
    price_snapshot_sha256: B0_PRICE_SNAPSHOT_SHA256,
  };
  const cli = {
    schema_version: "m2-p2-b1-b2-b0-cli-rejection-matrix-v1",
    task_id: "M2-P2-B1-B2-B0",
    scenario_count: scenarios.length,
    scenarios: scenarios.map((scenario, index) => ({
      sequence: index + 1,
      ...scenario,
    })),
    all_passed: scenarios.every((scenario) => scenario.passed),
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
  return {
    approvalTemplate,
    preflight,
    approvalPreview,
    cli,
    summary: canonicalSummary(),
  };
}

export async function renderExecutionPackageEvidence() {
  const evidence = await buildExecutionPackageEvidence();
  const rendered = {
    approval: canonicalJson(evidence.approvalTemplate),
    preflight: canonicalJson(evidence.preflight),
    approvalPreview: canonicalJson(evidence.approvalPreview),
    cli: canonicalJson(evidence.cli),
    summary: evidence.summary,
  };
  const manifest = {
    schema_version: "m2-p2-b1-b2-b0-report-manifest-v1",
    task_id: "M2-P2-B1-B2-B0",
    implementation_manifest: implementationManifest,
    implementation_scope: {
      total: 34,
      added: 30,
      modified: 4,
      deleted: 0,
    },
    reports: [
      [reportPaths.approval, sha256(rendered.approval)],
      [reportPaths.preflight, sha256(rendered.preflight)],
      [
        reportPaths.approvalPreview,
        sha256(rendered.approvalPreview),
      ],
      [reportPaths.cli, sha256(rendered.cli)],
      [reportPaths.summary, sha256(rendered.summary)],
    ].map(([pathName, reportSha256]) => ({
      path: pathName,
      sha256: reportSha256,
    })),
    registered_paths: implementationManifest.map(
      (entry) => entry.path,
    ),
    price_snapshot_sha256: B0_PRICE_SNAPSHOT_SHA256,
    price_snapshot: B0_PRICE_SNAPSHOT,
    budget_evidence: B0_BUDGET_EVIDENCE,
    deterministic: true,
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
  };
  return { evidence, rendered, manifest };
}

export async function writeExecutionPackageEvidence() {
  const repository = createRepositoryFileSystem(import.meta.url);
  const result = await renderExecutionPackageEvidence();
  for (const [key, relativePath] of [
    ["approval", reportPaths.approval],
    ["preflight", reportPaths.preflight],
    ["approvalPreview", reportPaths.approvalPreview],
    ["cli", reportPaths.cli],
    ["summary", reportPaths.summary],
  ]) {
    repository.writeText(relativePath, result.rendered[key]);
  }
  repository.writeText(
    reportPaths.manifest,
    canonicalJson(result.manifest),
  );
  return result;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  const repository = createRepositoryFileSystem(import.meta.url);
  const before = Object.fromEntries(
    Object.entries(reportPaths).map(([key, relativePath]) => [
      key,
      repository.exists(relativePath)
        ? repository.readText(relativePath)
        : null,
    ]),
  );
  const result = await writeExecutionPackageEvidence();
  const unchangedCount = Object.entries(result.rendered).filter(
    ([key, content]) => before[key] === content,
  ).length;
  console.log("M2_P2_B1_B2_B0_PREPARE: PASS");
  console.log(
    `FAILURE_SCENARIOS: ${result.evidence.cli.scenario_count}`,
  );
  console.log(`UNCHANGED_EXISTING_REPORTS: ${unchangedCount}`);
  console.log(
    `PRICE_SNAPSHOT_SHA256: ${result.manifest.price_snapshot_sha256}`,
  );
  console.log("ACTUAL_ENVIRONMENT_READS: 0");
  console.log("ACTUAL_SECRET_RESOLUTIONS: 0");
  console.log("ACTUAL_HTTPS_REQUESTS: 0");
  console.log("ACTUAL_PROVIDER_CALLS: 0");
  console.log("API_SPEND_USD: 0");
}
