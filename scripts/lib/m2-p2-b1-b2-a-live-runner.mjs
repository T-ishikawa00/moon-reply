import {
  B1B1,
  buildAllStageRequests,
} from "./m2-p2-b1-b1-request-builder.mjs";
import { invokeProviderAdapter } from "./m2-p2-b1-b1-provider-adapter.mjs";
import { markOpaqueSecretValue } from "./m2-p2-b1-b1-secret-provider-contract.mjs";
import {
  DORMANT_APPROVAL_STATE,
  validateHumanApprovalRecord,
} from "./m2-p2-b1-b2-a-human-approval.mjs";
import {
  assertLivePreflightBudget,
  assertPricingSnapshotFresh,
  assertSequentialHumanCeiling,
  computeLiveExecutionGuard,
  usageDerivedConservativeCost,
} from "./m2-p2-b1-b2-a-budget-guard.mjs";

export const LIVE_RUNNER_SEQUENCE = Object.freeze([
  "verify_exact_git_repository_state",
  "verify_human_approval_record",
  "verify_approval_expiry",
  "verify_exact_approved_runner_sha",
  "verify_b0_contract_hash",
  "verify_case_model_stage_list",
  "verify_request_hashes",
  "verify_pricing_snapshot_freshness",
  "verify_static_and_live_budget_guards",
  "verify_one_time_authorization_unused",
  "atomically_consume_one_time_authorization",
  "resolve_secret",
  "execute_pb_01",
  "parse_validate_record_update_budget",
  "continue_sequentially_through_pb_06",
  "write_sanitized_artifact_bundle",
  "complete_once",
]);

function stopped(stopCode, completedSteps = []) {
  return {
    task_id: "M2-P2-B1-B2-A",
    mode: "dormant-live-preflight",
    status: "stopped",
    stop_code: stopCode,
    completed_steps: completedSteps,
    approval_state: DORMANT_APPROVAL_STATE,
    actual_environment_reads: 0,
    actual_secret_resolutions: 0,
    actual_https_requests: 0,
    actual_provider_calls: 0,
    actual_child_process_calls: 0,
    api_spend_usd: 0,
    retry_attempted: false,
    repair_attempted: false,
    fallback_attempted: false,
  };
}

export function registeredRequestHashes(stageRequests) {
  return Object.fromEntries(
    stageRequests.map((request) => [
      request.stage_id,
      {
        request_body_sha256: request.request_body_sha256,
        request_contract_sha256: request.request_contract_sha256,
      },
    ]),
  );
}

export async function runDormantLiveBinding({
  approvalRecord = null,
  expectedRunnerCommitSha = null,
  executionTime = "2026-07-28T00:00:00.000Z",
  gitExecutionGuard,
  oneTimeAuthorization,
  secretProvider,
  httpsExecutor,
  artifactWriter,
  providerAdapter = invokeProviderAdapter,
} = {}) {
  const completedSteps = [];
  const stageRequests = buildAllStageRequests();
  const requestHashes = registeredRequestHashes(stageRequests);
  try {
    if (
      !gitExecutionGuard ||
      typeof gitExecutionGuard.inspect !== "function" ||
      typeof gitExecutionGuard.verify !== "function"
    ) {
      throw Object.assign(
        new Error("An injected exact Git execution guard is required"),
        { stopCode: "GIT_EXECUTION_GUARD_UNBOUND" },
      );
    }
    const gitReceipt = gitExecutionGuard.inspect();
    completedSteps.push(LIVE_RUNNER_SEQUENCE[0]);
    const approval = validateHumanApprovalRecord({
      record: approvalRecord,
      expectedRunnerCommitSha,
      expectedRequestHashes: requestHashes,
      executionTime,
    });
    completedSteps.push(
      ...LIVE_RUNNER_SEQUENCE.slice(1, 8),
    );
    gitExecutionGuard.verify({
      expectedRunnerSha: expectedRunnerCommitSha,
      receipt: gitReceipt,
    });
    assertPricingSnapshotFresh({
      verifiedAt: approval.price_snapshot_verified_at,
      executionTime,
    });
    const liveGuard = computeLiveExecutionGuard(stageRequests);
    assertLivePreflightBudget(liveGuard);
    completedSteps.push(LIVE_RUNNER_SEQUENCE[8]);
    const authorizationReceipt = oneTimeAuthorization.consume({
      approvalId: approval.approval_id,
      approvalHash: approval.approval_hash,
      runnerCommitSha: expectedRunnerCommitSha,
      confirmationHash: approval.one_time_confirmation_hash,
    });
    completedSteps.push(
      LIVE_RUNNER_SEQUENCE[9],
      LIVE_RUNNER_SEQUENCE[10],
    );
    const secretHandle = await secretProvider.resolveSecret();
    completedSteps.push(LIVE_RUNNER_SEQUENCE[11]);
    let conservativeCost = 0;
    let callsCompleted = 0;
    for (const [index, stageRequest] of stageRequests.entries()) {
      const remaining = liveGuard.stage_envelopes
        .slice(index)
        .reduce((sum, stage) => sum + stage.live_guard_cost_usd, 0);
      assertSequentialHumanCeiling({
        usageDerivedConservativeCostSoFar: conservativeCost,
        remainingStageLiveGuardCost: remaining,
        providerCallsCompleted: callsCompleted,
      });
      const result = await providerAdapter({
        stageRequest,
        approvalProof: approvalRecord,
        secretProvider: {
          resolveSecret: async () => ({
            available: true,
            source_type: "future_process_environment",
            secret_value: markOpaqueSecretValue(secretHandle),
          }),
        },
        requestExecutor: {
          execute: async ({ body }) =>
            (
              await httpsExecutor.execute({
                body,
                secretHandle,
              })
            ).response,
        },
        timeoutController: {
          createSignal: () => null,
        },
        ledger: {
          cumulative_usage_derived_cost_usd: conservativeCost,
        },
        usagePolicy: {
          static_hard_cap_usd: B1B1.staticHardCapUsd,
          preflight_ceiling_usd: B1B1.preflightCeilingUsd,
          future_human_ceiling_usd: B1B1.futureHumanCeilingUsd,
          stage_hard_caps_usd: Object.fromEntries(
            liveGuard.stage_envelopes.map((stage) => [
              stage.stage_id,
              stage.live_guard_cost_usd,
            ]),
          ),
        },
      });
      if (result.status !== "completed") {
        return stopped(result.stop_code, completedSteps);
      }
      if (
        result.parsed_receipt.returned_model !== B1B1.model ||
        result.parsed_receipt.schema_valid !== true
      ) {
        return stopped(
          "PROVIDER_RECEIPT_VALIDATION_FAILED",
          completedSteps,
        );
      }
      conservativeCost = Number(
        (
          conservativeCost +
          usageDerivedConservativeCost(
            result.parsed_receipt.usage,
          )
        ).toFixed(12),
      );
      callsCompleted += 1;
      completedSteps.push(
        index === 0
          ? LIVE_RUNNER_SEQUENCE[12]
          : LIVE_RUNNER_SEQUENCE[14],
        LIVE_RUNNER_SEQUENCE[13],
      );
    }
    if (!artifactWriter || typeof artifactWriter.write !== "function") {
      return stopped("ARTIFACT_WRITER_UNBOUND", completedSteps);
    }
    const artifactReceipt = await artifactWriter.write({
      approval_id: approval.approval_id,
      runner_commit_sha: expectedRunnerCommitSha,
      request_hashes: requestHashes,
      usage_derived_conservative_cost_usd: conservativeCost,
      completion_state: "completed_once",
    });
    completedSteps.push(
      LIVE_RUNNER_SEQUENCE[15],
      LIVE_RUNNER_SEQUENCE[16],
    );
    return {
      status: "completed",
      authorization_receipt: authorizationReceipt,
      artifact_receipt: artifactReceipt,
      actual_provider_calls: callsCompleted,
      conservative_cost_usd: conservativeCost,
    };
  } catch (error) {
    return stopped(
      error?.stopCode ?? "DORMANT_LIVE_BINDING_STOPPED",
      completedSteps,
    );
  }
}
