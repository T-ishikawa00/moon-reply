import { createHash } from "node:crypto";
import {
  FIXED_PAID_TARGET,
  PAID_CONFIRMATION_PHRASE,
  buildApprovedFixture,
  validateApprovalRecordShape,
} from "./lib/m2-p2-b1-b2-b0-approval-record.mjs";
import {
  assertFixedApprovalPath,
  buildExternalPaths,
  conceptualExternalPaths,
} from "./lib/m2-p2-b1-b2-b0-external-paths.mjs";
import {
  createInMemoryMarkerStore,
  createRepositoryFileSystem,
  isMainModule,
} from "./lib/m2-p2-b1-b2-b0-local-filesystem.mjs";
import {
  PAID_PRENETWORK_SEQUENCE,
  exerciseInMemoryArtifactWriter,
  paidCliArguments,
  paidCliContract,
  parsePaidCliArguments,
} from "./lib/m2-p2-b1-b2-b0-paid-cli.mjs";
import {
  B0_BUDGET_EVIDENCE,
  B0_PRICE_SNAPSHOT,
  B0_PRICE_SNAPSHOT_SHA256,
  assertHumanCeiling,
  assertLiveGuard,
  assertLongInputGuard,
  assertPriceSnapshotFresh,
  priceSnapshotHash,
} from "./lib/m2-p2-b1-b2-b0-price-snapshot.mjs";
import {
  failureScenarioStopCodes,
  implementationManifest,
  renderExecutionPackageEvidence,
  reportPaths,
} from "./prepare-m2-p2-b1-b2-b0-execution-package.mjs";
import {
  blockedPreflightArguments,
  runBlockedPaidPreflight,
} from "./run-m2-p2-b1-b2-b0-preflight-blocked.mjs";

const gateOrder = Object.freeze([
  "M2_B1_B2_B0_EXACT_SCOPE_GATE",
  "M2_B1_B2_B0_CONTRACT_LINK_GATE",
  "M2_B1_B2_B0_CASE_GATE",
  "M2_B1_B2_B0_MODEL_GATE",
  "M2_B1_B2_B0_MODEL_NON_SELECTION_GATE",
  "M2_B1_B2_B0_STAGE_GATE",
  "M2_B1_B2_B0_CALL_LIMIT_GATE",
  "M2_B1_B2_B0_APPROVAL_TEMPLATE_FALSE_GATE",
  "M2_B1_B2_B0_APPROVAL_SCHEMA_GATE",
  "M2_B1_B2_B0_RUNNER_SHA_PLACEHOLDER_GATE",
  "M2_B1_B2_B0_PRICE_SNAPSHOT_GATE",
  "M2_B1_B2_B0_PRICE_STALENESS_GATE",
  "M2_B1_B2_B0_STATIC_CAP_GATE",
  "M2_B1_B2_B0_LIVE_GUARD_GATE",
  "M2_B1_B2_B0_HUMAN_CEILING_GATE",
  "M2_B1_B2_B0_PAID_CLI_GATE",
  "M2_B1_B2_B0_NO_KEY_ARGUMENT_GATE",
  "M2_B1_B2_B0_PRENETWORK_ORDER_GATE",
  "M2_B1_B2_B0_EXTERNAL_PATH_GATE",
  "M2_B1_B2_B0_ONE_TIME_MARKER_GATE",
  "M2_B1_B2_B0_ARTIFACT_POLICY_GATE",
  "M2_B1_B2_B0_ZERO_REAL_ENV_READ_GATE",
  "M2_B1_B2_B0_ZERO_SECRET_RESOLUTION_GATE",
  "M2_B1_B2_B0_ZERO_HTTPS_REQUEST_GATE",
  "M2_B1_B2_B0_ZERO_PROVIDER_CALL_GATE",
  "M2_B1_B2_B0_ZERO_SPEND_GATE",
  "M2_B1_B2_B0_NO_RETRY_GATE",
  "M2_B1_B2_B0_NO_REPAIR_GATE",
  "M2_B1_B2_B0_NO_FALLBACK_GATE",
  "M2_B1_B2_B0_HOLDOUT_ISOLATION_GATE",
  "M2_B1_B2_B0_REAL_USER_DATA_GATE",
  "M2_B1_B2_B0_FAILURE_MATRIX_GATE",
  "M2_B1_B2_B0_DETERMINISM_GATE",
  "M2_B1_B2_B0_REPORT_HASH_GATE",
  "M2_P2_B1_B2_B0_EXECUTION_PACKAGE_GATE",
]);

const expectedImplementationManifest = Object.freeze([
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

const exactPreNetworkSequence = Object.freeze([
  "parse_cli",
  "verify_fixed_cli_values",
  "verify_approval_file_path",
  "load_and_schema_validate_approval",
  "verify_approval_status",
  "verify_approval_expiry",
  "verify_confirmation_hash",
  "verify_exact_branch_main",
  "verify_exact_head",
  "verify_exact_origin_main",
  "verify_clean_worktree_index_untracked",
  "verify_exact_runner_sha_binding",
  "verify_b0_contract_hash",
  "verify_request_hashes",
  "verify_case_model_stage_call_limit",
  "verify_price_snapshot_freshness_hash",
  "verify_long_input_guard",
  "verify_live_guard_within_preflight_ceiling",
  "verify_human_absolute_ceiling",
  "verify_one_time_marker_unused",
  "atomically_consume_one_time_marker",
  "resolve_environment_secret",
  "begin_pb_01_request",
]);

const expectedArtifactFiles = Object.freeze([
  "run-manifest.json",
  "stage-records.json",
  "gate-results.json",
  "cost-summary.json",
  "calibration-summary.md",
  "outputs/PB-01.json",
  "outputs/PB-02.json",
  "outputs/PB-03.json",
  "outputs/PB-04.json",
  "outputs/PB-05.json",
  "outputs/PB-06.json",
]);

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sha256(text) {
  return createHash("sha256")
    .update(Buffer.from(text, "utf8"))
    .digest("hex");
}

function gateError(gate, detail) {
  return Object.assign(new Error(`${gate}: ${detail}`), { gate });
}

function assertGate(gate, condition, detail) {
  if (!condition) throw gateError(gate, detail);
}

function expectStop(gate, callback, expectedStopCode) {
  try {
    callback();
  } catch (error) {
    assertGate(
      gate,
      error?.stopCode === expectedStopCode,
      `expected ${expectedStopCode}, received ${error?.stopCode}`,
    );
    return;
  }
  throw gateError(gate, `expected ${expectedStopCode}`);
}

export async function verifyExecutionPackage() {
  const repository = createRepositoryFileSystem(import.meta.url);
  const passed = [];
  const recordPass = (gate) => passed.push(gate);
  const readJson = (relativePath) =>
    repository.readJson(relativePath);

  const executionContract = readJson(
    "evals/calibration/b1b2b0/execution-package-contract-v1.json",
  );
  const approvalTemplate = readJson(reportPaths.approval);
  const priceSnapshot = readJson(
    "evals/calibration/b1b2b0/price-snapshot-v1.json",
  );
  const paidCliMachineContract = readJson(
    "evals/calibration/b1b2b0/paid-cli-contract-v1.json",
  );
  const artifactPolicy = readJson(
    "evals/calibration/b1b2b0/artifact-policy-v1.json",
  );
  const failureCatalog = readJson(
    "evals/calibration/b1b2b0/failure-injection-catalog-v1.json",
  );
  const reportManifest = readJson(reportPaths.manifest);
  const preflightReport = readJson(reportPaths.preflight);
  const approvalPreview = readJson(reportPaths.approvalPreview);
  const cliReport = readJson(reportPaths.cli);
  const acceptedLiveReport = readJson(
    "evals/calibration/b1b2a/reports/live-preflight-preview-v1.json",
  );

  {
    const gate = gateOrder[0];
    const counts = implementationManifest.reduce(
      (result, entry) => {
        result[entry.status] += 1;
        return result;
      },
      { A: 0, M: 0, D: 0 },
    );
    assertGate(
      gate,
      same(implementationManifest, expectedImplementationManifest),
      "the source manifest differs from the exact 34 paths",
    );
    assertGate(
      gate,
      implementationManifest.length === 34 &&
        counts.A === 30 &&
        counts.M === 4 &&
        counts.D === 0,
      `unexpected scope counts ${JSON.stringify(counts)}`,
    );
    assertGate(
      gate,
      implementationManifest.every((entry) =>
        repository.exists(entry.path),
      ),
      "an exact implementation path is absent",
    );
    assertGate(
      gate,
      same(
        reportManifest.implementation_manifest,
        expectedImplementationManifest,
      ) &&
        same(reportManifest.implementation_scope, {
          total: 34,
          added: 30,
          modified: 4,
          deleted: 0,
        }),
      "the generated report manifest scope differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[1];
    assertGate(
      gate,
      executionContract.task_id === "M2-P2-B1-B2-B0" &&
        executionContract.source_b0_contract_hash ===
          FIXED_PAID_TARGET.contract_hash &&
        executionContract.source_dormant_binding_task ===
          "M2-P2-B1-B2-A" &&
        executionContract.correction_commit_sha ===
          "30c05ca2c383641676a3c1fde680e2e83d44397f",
      "execution-package source links differ",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[2];
    assertGate(
      gate,
      executionContract.case_id === FIXED_PAID_TARGET.case_id &&
        approvalTemplate.approved_case ===
          FIXED_PAID_TARGET.case_id,
      "WAIT-003 is not fixed",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[3];
    assertGate(
      gate,
      executionContract.calibration_candidate ===
        FIXED_PAID_TARGET.model &&
        approvalTemplate.approved_model ===
          FIXED_PAID_TARGET.model,
      "the calibration candidate differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[4];
    assertGate(
      gate,
      executionContract.product_model_selected === false &&
        executionContract.baseline_model_selected === false,
      "a product or baseline model was selected",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[5];
    assertGate(
      gate,
      same(
        executionContract.provider_stages,
        FIXED_PAID_TARGET.stages,
      ) &&
        same(
          approvalTemplate.approved_stages,
          FIXED_PAID_TARGET.stages,
        ),
      "PB-01 through PB-06 are not exact",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[6];
    assertGate(
      gate,
      executionContract.maximum_provider_calls === 6 &&
        approvalTemplate.max_provider_calls === 6,
      "the provider-call limit differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[7];
    assertGate(
      gate,
      approvalTemplate.approval_status === "draft" &&
        approvalTemplate.approval_record_present === false &&
        approvalTemplate.live_execution_authorized === false &&
        approvalTemplate.paid_run_authorized === false &&
        approvalTemplate.paid_run_completed === false &&
        approvalTemplate.one_time_only === true &&
        approvalPreview.repository_template_can_authorize_execution ===
          false &&
        approvalPreview.true_external_approval_created === false,
      "the repository approval template is executable",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[8];
    validateApprovalRecordShape(approvalTemplate);
    const approvedFixture = buildApprovedFixture();
    validateApprovalRecordShape(approvedFixture);
    const schema = readJson(
      "evals/calibration/b1b2b0/schemas/approval-record.schema.json",
    );
    assertGate(
      gate,
      schema.additionalProperties === false &&
        schema.required.length ===
          Object.keys(approvalTemplate).length,
      "approval Schema does not own the exact record shape",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[9];
    assertGate(
      gate,
      approvalTemplate.approved_runner_commit_sha ===
        "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE" &&
        approvalTemplate.approved_origin_main_sha ===
          "TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE",
      "the repository runner placeholder differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[10];
    assertGate(
      gate,
      same(priceSnapshot, B0_PRICE_SNAPSHOT) &&
        priceSnapshotHash(priceSnapshot) ===
          B0_PRICE_SNAPSHOT_SHA256 &&
        reportManifest.price_snapshot_sha256 ===
          B0_PRICE_SNAPSHOT_SHA256,
      "the versioned price snapshot or hash differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[11];
    assertPriceSnapshotFresh({
      snapshot: priceSnapshot,
      verifiedAt: "2026-07-29T00:00:00.000Z",
      executionTime: "2026-07-30T00:00:00.000Z",
    });
    expectStop(
      gate,
      () =>
        assertPriceSnapshotFresh({
          snapshot: priceSnapshot,
          verifiedAt: "2026-07-29T00:00:00.000Z",
          executionTime: "2026-07-30T00:00:00.001Z",
        }),
      "PRICE_SNAPSHOT_STALE",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[12];
    assertGate(
      gate,
      executionContract.historical_static_cap_usd ===
        B0_BUDGET_EVIDENCE.historical_static_cap_usd &&
        acceptedLiveReport.historical_static_hard_cap_usd ===
          B0_BUDGET_EVIDENCE.historical_static_cap_usd,
      "the accepted historical static cap differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[13];
    assertLiveGuard();
    assertGate(
      gate,
      executionContract.live_guard_cost_usd ===
        B0_BUDGET_EVIDENCE.live_guard_cost_usd &&
        acceptedLiveReport.live_execution_guard
          .live_execution_guard_cost_usd ===
          B0_BUDGET_EVIDENCE.live_guard_cost_usd,
      "the accepted live guard differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[14];
    assertHumanCeiling();
    assertGate(
      gate,
      executionContract.absolute_human_ceiling_usd === 1 &&
        approvalTemplate.absolute_ceiling_usd === 1,
      "the Human absolute ceiling differs",
    );
    recordPass(gate);
  }

  const fixturePaths = buildExternalPaths(
    "C:\\fixture-user\\AppData\\Local",
  );
  {
    const gate = gateOrder[15];
    const parsed = parsePaidCliArguments(
      paidCliArguments(fixturePaths.approval_file),
      { expectedApprovalPath: fixturePaths.approval_file },
    );
    const contract = paidCliContract();
    assertGate(
      gate,
      parsed.mode === "paid-one-case" &&
        parsed.case === FIXED_PAID_TARGET.case_id &&
        parsed.model === FIXED_PAID_TARGET.model &&
        parsed.confirm === PAID_CONFIRMATION_PHRASE &&
        same(
          paidCliMachineContract.exact_flags,
          contract.exact_flags,
        ) &&
        paidCliMachineContract.executed_in_this_task === false,
      "the fixed paid CLI contract differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[16];
    const successorSources = implementationManifest
      .filter(
        (entry) =>
          entry.path.startsWith("scripts/") &&
          entry.path.includes("b1-b2-b0"),
      )
      .map((entry) => repository.readText(entry.path))
      .join("\n");
    const secretFlag = `--${["api", "key"].join("-")}`;
    const environmentAccessToken = ["process", "env"].join(".");
    const environmentSecretName = [
      "OPENAI",
      "API",
      "KEY",
    ].join("_");
    assertGate(
      gate,
      !successorSources.includes(secretFlag) &&
        !successorSources.includes(environmentAccessToken) &&
        !successorSources.includes(environmentSecretName),
      "a B0 successor exposes a secret argument or direct environment access",
    );
    expectStop(
      gate,
      () =>
        parsePaidCliArguments(
          [
            ...paidCliArguments(fixturePaths.approval_file),
            secretFlag,
            "prohibited",
          ],
          { expectedApprovalPath: fixturePaths.approval_file },
        ),
      "CLI_ARGUMENT_REJECTED",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[17];
    assertGate(
      gate,
      same(PAID_PRENETWORK_SEQUENCE, exactPreNetworkSequence) &&
        same(
          paidCliMachineContract.pre_network_sequence,
          exactPreNetworkSequence,
        ) &&
        paidCliMachineContract.secret_resolution_step === 22 &&
        paidCliMachineContract.first_provider_request_step === 23,
      "the exact 23-step pre-network order differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[18];
    assertFixedApprovalPath({
      candidate: fixturePaths.approval_file,
      expectedApprovalPath: fixturePaths.approval_file,
    });
    for (const invalidPath of [
      "approval.json",
      "D:\\outside\\approval.json",
      "\\\\server\\share\\approval.json",
      "C:\\fixture-user\\AppData\\Local\\moon-reply\\..\\approval.json",
    ]) {
      expectStop(
        gate,
        () =>
          assertFixedApprovalPath({
            candidate: invalidPath,
            expectedApprovalPath: fixturePaths.approval_file,
          }),
        "APPROVAL_PATH_OUTSIDE_FIXED_ROOT",
      );
    }
    const conceptual = conceptualExternalPaths();
    assertGate(
      gate,
      conceptual.approval.startsWith("%LOCALAPPDATA%") &&
        conceptual.one_time_marker.startsWith("%LOCALAPPDATA%") &&
        conceptual.run_artifacts.startsWith("%LOCALAPPDATA%"),
      "the fixed external roots differ",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[19];
    const markerStore = createInMemoryMarkerStore();
    const marker = {
      approval_id: "fixture-approved-0001",
      approval_hash: "a".repeat(64),
      runner_sha: "a".repeat(40),
      contract_hash: FIXED_PAID_TARGET.contract_hash,
      consumed_at: "2026-07-29T00:15:00.000Z",
      status: "consumed_before_first_request",
    };
    assertGate(
      gate,
      markerStore.exists({
        approvalId: marker.approval_id,
      }) === false,
      "a fresh one-time marker is already consumed",
    );
    markerStore.consume(marker);
    assertGate(
      gate,
      markerStore.exists({
        approvalId: marker.approval_id,
      }) === true &&
        same(Object.keys(markerStore.snapshot()[0]).sort(), [
          "approval_hash",
          "approval_id",
          "consumed_at",
          "contract_hash",
          "runner_sha",
          "status",
        ]),
      "the consumed marker fields differ",
    );
    expectStop(
      gate,
      () => markerStore.consume(marker),
      "AUTHORIZATION_ALREADY_CONSUMED",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[20];
    const { writer, fileSystem } = exerciseInMemoryArtifactWriter();
    await writer.write({
      approval_id: "fixture-approved-0001",
      runner_commit_sha: "a".repeat(40),
      completion_state: "completed_once",
      usage_derived_conservative_cost_usd: 0.1,
    });
    const artifactFiles = Object.keys(fileSystem.snapshot()).sort();
    assertGate(
      gate,
      same(artifactFiles, [...expectedArtifactFiles].sort()) &&
        same(
          [...artifactPolicy.future_files].sort(),
          [...expectedArtifactFiles].sort(),
        ) &&
        artifactPolicy.repository_storage_allowed === false &&
        artifactPolicy
          .accepted_b1_b2_a_artifact_sanitizer_required === true &&
        artifactPolicy.write_once === true,
      "the exact sanitized artifact policy differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[21];
    assertGate(
      gate,
      reportManifest.actual_environment_reads === 0 &&
        preflightReport.result.actual_environment_reads === 0 &&
        cliReport.actual_environment_reads === 0,
      "a real environment read was recorded",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[22];
    assertGate(
      gate,
      reportManifest.actual_secret_resolutions === 0 &&
        preflightReport.result.actual_secret_resolutions === 0 &&
        cliReport.actual_secret_resolutions === 0,
      "a secret resolution was recorded",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[23];
    assertGate(
      gate,
      reportManifest.actual_https_requests === 0 &&
        preflightReport.result.actual_https_requests === 0 &&
        cliReport.actual_https_requests === 0,
      "an HTTPS request was recorded",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[24];
    assertGate(
      gate,
      reportManifest.actual_provider_calls === 0 &&
        preflightReport.result.actual_provider_calls === 0 &&
        cliReport.actual_provider_calls === 0,
      "a provider call was recorded",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[25];
    assertGate(
      gate,
      reportManifest.api_spend_usd === 0 &&
        preflightReport.result.api_spend_usd === 0 &&
        cliReport.api_spend_usd === 0,
      "non-zero API spend was recorded",
    );
    recordPass(gate);
  }

  for (const [gateIndex, property] of [
    [26, "retry_attempted"],
    [27, "repair_attempted"],
    [28, "fallback_attempted"],
  ]) {
    const gate = gateOrder[gateIndex];
    assertGate(
      gate,
      cliReport.scenarios.every(
        (scenario) => scenario[property] === false,
      ),
      `${property} was recorded`,
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[29];
    assertGate(
      gate,
      executionContract.holdout_allowed === false &&
        failureCatalog.common_expected_result.provider_calls === 0,
      "holdout isolation differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[30];
    assertGate(
      gate,
      executionContract.real_user_data_allowed === false &&
        artifactPolicy.forbidden_persistence.includes(
          "real_user_data",
        ),
      "real-user data is not prohibited",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[31];
    const expectedScenarioIds = failureScenarioStopCodes.map(
      ([scenarioId]) => scenarioId,
    );
    const expectedStopCodes = Object.fromEntries(
      failureScenarioStopCodes,
    );
    assertGate(
      gate,
      failureCatalog.scenario_count === 24 &&
        cliReport.scenario_count === 24 &&
        same(failureCatalog.scenarios, expectedScenarioIds) &&
        same(
          cliReport.scenarios.map(
            (scenario) => scenario.scenario_id,
          ),
          expectedScenarioIds,
        ) &&
        cliReport.scenarios.every(
          (scenario) =>
            scenario.expected_stop_code ===
              expectedStopCodes[scenario.scenario_id] &&
            scenario.actual_stop_code ===
              expectedStopCodes[scenario.scenario_id] &&
            scenario.passed === true &&
            scenario.stopped_before_secret === true &&
            scenario.stopped_before_https === true,
        ) &&
        cliReport.all_passed === true,
      "the exact 24-scenario failure matrix differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[32];
    const first = await renderExecutionPackageEvidence();
    const second = await renderExecutionPackageEvidence();
    assertGate(
      gate,
      same(first, second) &&
        same(first.manifest.registered_paths, [
          ...reportManifest.registered_paths,
        ]) &&
        first.manifest.price_snapshot_sha256 ===
          reportManifest.price_snapshot_sha256,
      "repeated evidence rendering is not byte-stable",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[33];
    assertGate(
      gate,
      reportManifest.reports.every(
        (report) =>
          sha256(repository.readText(report.path)) ===
          report.sha256,
      ) &&
        same(
          reportManifest.registered_paths,
          expectedImplementationManifest.map((entry) => entry.path),
        ),
      "a registered report or path hash differs",
    );
    recordPass(gate);
  }

  {
    const gate = gateOrder[34];
    const blocked = runBlockedPaidPreflight(
      blockedPreflightArguments(),
    );
    assertLongInputGuard();
    assertGate(
      gate,
      passed.length === gateOrder.length - 1 &&
        blocked.status === "stopped" &&
        blocked.stop_code === "EXTERNAL_APPROVAL_NOT_PRESENT" &&
        blocked.external_approval_directory_created === false &&
        blocked.one_time_marker_created === false &&
        blocked.run_artifact_directory_created === false &&
        blocked.actual_environment_reads === 0 &&
        blocked.actual_secret_resolutions === 0 &&
        blocked.actual_https_requests === 0 &&
        blocked.actual_provider_calls === 0 &&
        blocked.api_spend_usd === 0,
      "the aggregate execution-package boundary differs",
    );
    recordPass(gate);
  }

  assertGate(
    gateOrder[34],
    same(passed, gateOrder),
    "gate execution order differs",
  );
  return passed;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    const passed = await verifyExecutionPackage();
    for (const gate of passed) console.log(`${gate}: PASS`);
    console.log(`B0_REQUIRED_GATES: ${passed.length}/${gateOrder.length}`);
    console.log("ACTUAL_ENVIRONMENT_READS: 0");
    console.log("ACTUAL_SECRET_RESOLUTIONS: 0");
    console.log("ACTUAL_HTTPS_REQUESTS: 0");
    console.log("ACTUAL_PROVIDER_CALLS: 0");
    console.log("API_SPEND_USD: 0");
  } catch (error) {
    console.error(
      `${error?.gate ?? "M2_P2_B1_B2_B0_EXECUTION_PACKAGE_GATE"}: FAIL`,
    );
    console.error(
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
