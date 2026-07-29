import {
  createInMemoryArtifactFileSystem,
  writeSanitizedArtifactBundle,
} from "./m2-p2-b1-b2-a-artifact-bundle.mjs";
import { runDormantLiveBinding } from "./m2-p2-b1-b2-a-live-runner.mjs";
import {
  FIXED_PAID_TARGET,
  FIXED_REQUEST_HASHES,
  PAID_CONFIRMATION_PHRASE,
  assertApprovalExpiry,
  assertApprovalRecordHash,
  assertApprovedState,
  assertConfirmationHash,
  assertExactRequestHashes,
  assertRunnerSha,
  approvalRecordHash,
  validateApprovalRecordShape,
} from "./m2-p2-b1-b2-b0-approval-record.mjs";
import { assertFixedApprovalPath } from "./m2-p2-b1-b2-b0-external-paths.mjs";
import {
  B0_BUDGET_EVIDENCE,
  B0_PRICE_SNAPSHOT,
  B0_PRICE_SNAPSHOT_SHA256,
  assertExactPriceSnapshot,
  assertHumanCeiling,
  assertLiveGuard,
  assertLongInputGuard,
  assertPriceSnapshotFresh,
} from "./m2-p2-b1-b2-b0-price-snapshot.mjs";

export const PAID_PRENETWORK_SEQUENCE = Object.freeze([
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

const fixedCliValues = Object.freeze({
  mode: "paid-one-case",
  case: FIXED_PAID_TARGET.case_id,
  model: FIXED_PAID_TARGET.model,
  "contract-hash": FIXED_PAID_TARGET.contract_hash,
  confirm: PAID_CONFIRMATION_PHRASE,
});

const exactPaidFlags = Object.freeze([
  "mode",
  "case",
  "model",
  "contract-hash",
  "approval-file",
  "confirm",
]);

const stageIds = Object.freeze([...FIXED_PAID_TARGET.stages]);

function cliError(stopCode, message) {
  return Object.assign(new Error(message), { stopCode });
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parseFlagPairs(argv) {
  if (
    !Array.isArray(argv) ||
    argv.length !== exactPaidFlags.length * 2
  ) {
    throw cliError(
      "CLI_ARGUMENT_REJECTED",
      "The exact six paid-run flags are required",
    );
  }
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const rawFlag = argv[index];
    const value = argv[index + 1];
    if (
      typeof rawFlag !== "string" ||
      !rawFlag.startsWith("--") ||
      typeof value !== "string" ||
      value.length === 0
    ) {
      throw cliError(
        "CLI_ARGUMENT_REJECTED",
        "Every paid-run flag requires one explicit value",
      );
    }
    const flag = rawFlag.slice(2);
    if (
      !exactPaidFlags.includes(flag) ||
      Object.hasOwn(parsed, flag)
    ) {
      throw cliError(
        "CLI_ARGUMENT_REJECTED",
        "Unknown, prohibited, or duplicate paid-run flag",
      );
    }
    parsed[flag] = value;
  }
  return parsed;
}

function assertFixedCliValues(parsed) {
  for (const [flag, expected] of Object.entries(fixedCliValues)) {
    if (parsed[flag] !== expected) {
      throw cliError(
        "CLI_FIXED_VALUE_MISMATCH",
        `The fixed --${flag} value differs`,
      );
    }
  }
  return true;
}

export function paidCliArguments(approvalPath) {
  return [
    "--mode",
    fixedCliValues.mode,
    "--case",
    fixedCliValues.case,
    "--model",
    fixedCliValues.model,
    "--contract-hash",
    fixedCliValues["contract-hash"],
    "--approval-file",
    approvalPath,
    "--confirm",
    fixedCliValues.confirm,
  ];
}

export function parsePaidCliArguments(
  argv,
  { expectedApprovalPath },
) {
  const parsed = parseFlagPairs(argv);
  assertFixedCliValues(parsed);
  assertFixedApprovalPath({
    candidate: parsed["approval-file"],
    expectedApprovalPath,
  });
  return parsed;
}

function stoppedResult(error, completedSteps) {
  return {
    task_id: "M2-P2-B1-B2-B0",
    mode: "paid-one-case",
    status: "stopped",
    stop_code:
      error?.stopCode ?? "PAID_EXECUTION_PREFLIGHT_STOPPED",
    completed_steps: [...completedSteps],
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
    retry_attempted: false,
    repair_attempted: false,
    fallback_attempted: false,
  };
}

function assertMainBranch(receipt) {
  if (receipt?.branch !== "main") {
    throw cliError(
      "GIT_BRANCH_MISMATCH",
      "Paid execution requires branch main",
    );
  }
}

function assertExactHead(record, receipt) {
  assertRunnerSha(record, receipt?.head);
}

function assertOriginMain(record, receipt) {
  if (
    receipt?.origin_main !== receipt?.head ||
    record.approved_origin_main_sha !== receipt?.origin_main
  ) {
    throw cliError(
      "ORIGIN_MAIN_MISMATCH",
      "origin/main differs from the approved runner",
    );
  }
}

function assertCleanWorktree(receipt) {
  if (receipt?.porcelain_status !== "") {
    throw cliError(
      "GIT_WORKTREE_DIRTY",
      "Paid execution requires no tracked or untracked changes",
    );
  }
}

function assertContractHash(record) {
  if (record.approved_contract_hash !== FIXED_PAID_TARGET.contract_hash) {
    throw cliError(
      "APPROVAL_CONTRACT_HASH_MISMATCH",
      "The approved B0 contract hash differs",
    );
  }
}

function assertCaseModelStageCallLimit(record) {
  if (record.approved_case !== FIXED_PAID_TARGET.case_id) {
    throw cliError(
      "APPROVAL_CASE_MISMATCH",
      "The approved case differs",
    );
  }
  if (record.approved_model !== FIXED_PAID_TARGET.model) {
    throw cliError(
      "APPROVAL_MODEL_MISMATCH",
      "The approved model differs",
    );
  }
  if (!same(record.approved_stages, FIXED_PAID_TARGET.stages)) {
    throw cliError(
      "APPROVAL_STAGE_LIST_MISMATCH",
      "The approved provider Stage list differs",
    );
  }
  if (record.max_provider_calls !== FIXED_PAID_TARGET.max_provider_calls) {
    throw cliError(
      "APPROVAL_CALL_LIMIT_MISMATCH",
      "The approved provider-call limit differs",
    );
  }
}

function assertSnapshotContract(record, snapshot, executionTime) {
  assertExactPriceSnapshot(snapshot);
  if (
    record.price_snapshot_sha256 !== B0_PRICE_SNAPSHOT_SHA256 ||
    record.price_snapshot_checked_at !== snapshot.checked_at
  ) {
    throw cliError(
      "PRICE_SNAPSHOT_HASH_MISMATCH",
      "The approved price snapshot hash differs",
    );
  }
  assertPriceSnapshotFresh({
    snapshot,
    verifiedAt: record.price_snapshot_verified_at,
    executionTime,
  });
}

function assertPreflightCeiling(record) {
  if (
    record.preflight_ceiling_usd !==
    FIXED_PAID_TARGET.preflight_ceiling_usd
  ) {
    throw cliError(
      "APPROVAL_PREFLIGHT_CEILING_MISMATCH",
      "The approved preflight ceiling differs",
    );
  }
  if (
    record.historical_static_cap_usd !==
      B0_BUDGET_EVIDENCE.historical_static_cap_usd ||
    record.live_guard_cost_usd !==
      B0_BUDGET_EVIDENCE.live_guard_cost_usd
  ) {
    throw cliError(
      "APPROVAL_BUDGET_EVIDENCE_MISMATCH",
      "The approved static or live guard differs",
    );
  }
  assertLiveGuard();
}

function assertAbsoluteCeiling(record) {
  if (
    record.absolute_ceiling_usd !==
    FIXED_PAID_TARGET.absolute_ceiling_usd
  ) {
    throw cliError(
      "APPROVAL_ABSOLUTE_CEILING_MISMATCH",
      "The approved absolute ceiling differs",
    );
  }
  assertHumanCeiling();
}

export async function runPaidCalibrationOnce({
  argv,
  expectedApprovalPath,
  approvalLoader,
  executionTime,
  gitExecutionGuard,
  markerStore,
  secretProvider,
  httpsExecutor,
  artifactWriter,
  priceSnapshot = B0_PRICE_SNAPSHOT,
  liveRunner = runDormantLiveBinding,
} = {}) {
  const completedSteps = [];
  try {
    const parsed = parseFlagPairs(argv);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[0]);
    assertFixedCliValues(parsed);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[1]);
    assertFixedApprovalPath({
      candidate: parsed["approval-file"],
      expectedApprovalPath,
    });
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[2]);
    if (!approvalLoader || typeof approvalLoader.load !== "function") {
      throw cliError(
        "APPROVAL_LOADER_UNBOUND",
        "A fixed external approval loader is required",
      );
    }
    const loadedRecord = await approvalLoader.load(
      parsed["approval-file"],
    );
    if (loadedRecord === null || loadedRecord === undefined) {
      throw cliError(
        "EXTERNAL_APPROVAL_NOT_PRESENT",
        "The fixed external approval record is absent",
      );
    }
    const approvalRecord =
      validateApprovalRecordShape(loadedRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[3]);
    assertApprovedState(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[4]);
    assertApprovalExpiry(approvalRecord, executionTime);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[5]);
    assertConfirmationHash(
      approvalRecord,
      parsed.confirm,
    );
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[6]);
    if (
      !gitExecutionGuard ||
      typeof gitExecutionGuard.inspect !== "function" ||
      typeof gitExecutionGuard.verify !== "function"
    ) {
      throw cliError(
        "GIT_EXECUTION_GUARD_UNBOUND",
        "An exact Git execution guard is required",
      );
    }
    const gitReceipt = gitExecutionGuard.inspect();
    assertMainBranch(gitReceipt);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[7]);
    assertExactHead(approvalRecord, gitReceipt);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[8]);
    assertOriginMain(approvalRecord, gitReceipt);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[9]);
    assertCleanWorktree(gitReceipt);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[10]);
    assertApprovalRecordHash(approvalRecord);
    gitExecutionGuard.verify({
      expectedRunnerSha:
        approvalRecord.approved_runner_commit_sha,
      receipt: gitReceipt,
    });
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[11]);
    assertContractHash(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[12]);
    assertExactRequestHashes(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[13]);
    assertCaseModelStageCallLimit(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[14]);
    assertSnapshotContract(
      approvalRecord,
      priceSnapshot,
      executionTime,
    );
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[15]);
    assertLongInputGuard();
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[16]);
    assertPreflightCeiling(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[17]);
    assertAbsoluteCeiling(approvalRecord);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[18]);
    if (
      !markerStore ||
      typeof markerStore.exists !== "function" ||
      typeof markerStore.consume !== "function"
    ) {
      throw cliError(
        "AUTHORIZATION_MARKER_STORE_UNBOUND",
        "A fixed external marker store is required",
      );
    }
    if (
      markerStore.exists({
        approvalId: approvalRecord.approval_id,
      })
    ) {
      throw cliError(
        "AUTHORIZATION_ALREADY_CONSUMED",
        "The one-time authorization was already consumed",
      );
    }
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[19]);
    const marker = {
      approval_id: approvalRecord.approval_id,
      approval_hash: approvalRecordHash(approvalRecord),
      runner_sha: approvalRecord.approved_runner_commit_sha,
      contract_hash: FIXED_PAID_TARGET.contract_hash,
      consumed_at: executionTime,
      status: "consumed_before_first_request",
    };
    const markerReceipt = await markerStore.consume(marker);
    completedSteps.push(PAID_PRENETWORK_SEQUENCE[20]);
    const cachedGitGuard = Object.freeze({
      inspect: () => structuredClone(gitReceipt),
      verify: ({ expectedRunnerSha }) =>
        gitExecutionGuard.verify({
          expectedRunnerSha,
          receipt: gitReceipt,
        }),
    });
    const consumedAuthorization = Object.freeze({
      consume: () => structuredClone(markerReceipt),
    });
    const liveResult = await liveRunner({
      approvalRecord,
      expectedRunnerCommitSha:
        approvalRecord.approved_runner_commit_sha,
      executionTime,
      gitExecutionGuard: cachedGitGuard,
      oneTimeAuthorization: consumedAuthorization,
      secretProvider,
      httpsExecutor,
      artifactWriter,
    });
    if (liveResult.status !== "completed") {
      return {
        ...stoppedResult(
          Object.assign(
            new Error("Dormant binding stopped the paid run"),
            {
              stopCode:
                liveResult.stop_code ??
                "PAID_EXECUTION_BINDING_STOPPED",
            },
          ),
          completedSteps,
        ),
        actual_environment_reads:
          liveResult.actual_environment_reads ?? 0,
        actual_secret_resolutions:
          liveResult.actual_secret_resolutions ?? 0,
        actual_https_requests:
          liveResult.actual_https_requests ?? 0,
        actual_provider_calls:
          liveResult.actual_provider_calls ?? 0,
      };
    }
    return {
      task_id: "M2-P2-B1-B2-B1",
      mode: "paid-one-case",
      status: "completed_once",
      completed_steps: [...PAID_PRENETWORK_SEQUENCE],
      approval_id: approvalRecord.approval_id,
      runner_sha: approvalRecord.approved_runner_commit_sha,
      actual_provider_calls: liveResult.actual_provider_calls,
      conservative_cost_usd: liveResult.conservative_cost_usd,
      retry_attempted: false,
      repair_attempted: false,
      fallback_attempted: false,
    };
  } catch (error) {
    return stoppedResult(error, completedSteps);
  }
}

function extractStructuredOutput(response, stageId) {
  const contentItems = Array.isArray(response?.output)
    ? response.output.flatMap((item) =>
        Array.isArray(item?.content) ? item.content : [],
      )
    : [];
  const outputText = contentItems.find(
    (item) =>
      item?.type === "output_text" &&
      typeof item.text === "string",
  )?.text;
  if (typeof outputText !== "string") {
    return {
      stage_id: stageId,
      capture_status: "structured_output_not_persisted",
    };
  }
  try {
    return {
      stage_id: stageId,
      capture_status: "structured_output_captured",
      output: JSON.parse(outputText),
    };
  } catch {
    return {
      stage_id: stageId,
      capture_status: "structured_output_not_persisted",
    };
  }
}

export function createResponseCapturingExecutor({
  executor,
  responseCapture,
}) {
  let sequence = 0;
  return Object.freeze({
    async execute(invocation) {
      const result = await executor.execute(invocation);
      const stageId = stageIds[sequence] ?? "UNEXPECTED_STAGE";
      responseCapture.push(
        extractStructuredOutput(result.response, stageId),
      );
      sequence += 1;
      return result;
    },
    metrics() {
      return executor.metrics();
    },
  });
}

export function createPaidArtifactWriter({
  responseCapture,
  fileSystemFactory,
}) {
  return Object.freeze({
    async write(receipt) {
      if (
        responseCapture.length !== stageIds.length ||
        responseCapture.some(
          (item, index) => item.stage_id !== stageIds[index],
        )
      ) {
        throw cliError(
          "ARTIFACT_RESPONSE_COUNT_MISMATCH",
          "Exactly six ordered structured outputs are required",
        );
      }
      const fileSystem = fileSystemFactory({
        approvalId: receipt.approval_id,
      });
      const artifactValues = {
        "run-manifest.json": {
          schema_version: "m2-p2-b1-b2-b1-run-manifest-v1",
          approval_id: receipt.approval_id,
          runner_sha: receipt.runner_commit_sha,
          completion_state: receipt.completion_state,
          case_id: FIXED_PAID_TARGET.case_id,
          model: FIXED_PAID_TARGET.model,
          stages: stageIds,
          provider_call_limit: FIXED_PAID_TARGET.max_provider_calls,
        },
        "stage-records.json": {
          stages: stageIds.map((stageId) => ({
            stage_id: stageId,
            status: "completed_once",
          })),
        },
        "gate-results.json": {
          pre_network_sequence: PAID_PRENETWORK_SEQUENCE.map(
            (step) => ({ step, status: "passed" }),
          ),
          retry_attempted: false,
          repair_attempted: false,
          fallback_attempted: false,
        },
        "cost-summary.json": {
          historical_static_cap_usd:
            FIXED_PAID_TARGET.historical_static_cap_usd,
          live_guard_cost_usd:
            FIXED_PAID_TARGET.live_guard_cost_usd,
          absolute_ceiling_usd:
            FIXED_PAID_TARGET.absolute_ceiling_usd,
          usage_derived_conservative_cost_usd:
            receipt.usage_derived_conservative_cost_usd,
        },
        "calibration-summary.md": `# One-Time Paid Calibration Summary

- Case: WAIT-003
- Candidate: gpt-5.6-luna
- Stages: PB-01 through PB-06
- Completion: completed once
- Product/baseline selection: none
`,
        ...Object.fromEntries(
          responseCapture.map((item) => [
            `outputs/${item.stage_id}.json`,
            item,
          ]),
        ),
      };
      return writeSanitizedArtifactBundle({
        fileSystem,
        artifactValues,
      });
    },
  });
}

export function exerciseInMemoryArtifactWriter() {
  const responseCapture = stageIds.map((stageId) => ({
    stage_id: stageId,
    capture_status: "structured_output_captured",
    output: { fixture: stageId },
  }));
  const fileSystem = createInMemoryArtifactFileSystem();
  const writer = createPaidArtifactWriter({
    responseCapture,
    fileSystemFactory: () => fileSystem,
  });
  return { writer, fileSystem };
}

export function paidCliContract() {
  return {
    exact_flags: [...exactPaidFlags],
    fixed_values: { ...fixedCliValues },
    pre_network_sequence: [...PAID_PRENETWORK_SEQUENCE],
    request_hashes: structuredClone(FIXED_REQUEST_HASHES),
    secret_resolution_step: 22,
    first_provider_request_step: 23,
    retry_allowed: false,
    repair_allowed: false,
    fallback_allowed: false,
  };
}
