import {
  B1B1,
  validateStageRequest,
} from "./m2-p2-b1-b1-request-builder.mjs";
import { evaluateNetworkInterlock } from "./m2-p2-b1-b1-network-interlock.mjs";
import { validateSecretReceipt } from "./m2-p2-b1-b1-secret-provider-contract.mjs";
import { parseProviderResponse } from "./m2-p2-b1-b1-response-parser.mjs";
import { assertBudgetBeforeStage } from "./m2-p2-b1-b1-usage-ledger.mjs";

function stopped(stageRequest, stopCode, message) {
  return {
    task_id: B1B1.taskId,
    execution_mode: B1B1.mode,
    stage_id: stageRequest?.stage_id ?? null,
    status: "stopped",
    stop_code: stopCode,
    message,
    secret_provider_invocations: 0,
    request_executor_invocations: 0,
    actual_provider_calls: 0,
    api_spend_usd: 0,
    retry_attempted: false,
    repair_attempted: false,
    fallback_attempted: false,
  };
}

export async function invokeProviderAdapter({
  stageRequest,
  approvalProof,
  secretProvider,
  requestExecutor,
  timeoutController,
  ledger,
  usagePolicy,
}) {
  try {
    validateStageRequest(stageRequest);
  } catch (error) {
    return stopped(
      stageRequest,
      error?.stopCode ?? "REQUEST_CONTRACT_INVALID",
      error instanceof Error ? error.message : String(error),
    );
  }

  if (
    !approvalProof ||
    approvalProof.live_execution_authorized !== true ||
    approvalProof.paid_run_authorized !== true
  ) {
    return stopped(
      stageRequest,
      "LIVE_EXECUTION_NOT_AUTHORIZED",
      "Approval proof does not authorize live or paid execution",
    );
  }

  const interlock = evaluateNetworkInterlock();
  if (!interlock.allowed) {
    return stopped(
      stageRequest,
      interlock.stop_code,
      "The B1-B1 network interlock is immutable and closed",
    );
  }

  try {
    assertBudgetBeforeStage({
      ledger,
      nextStageId: stageRequest.stage_id,
      usagePolicy,
    });
  } catch (error) {
    return stopped(
      stageRequest,
      error?.stopCode ?? "BUDGET_GUARD_FAILED",
      error instanceof Error ? error.message : String(error),
    );
  }

  if (!secretProvider || typeof secretProvider.resolveSecret !== "function") {
    return stopped(
      stageRequest,
      "SECRET_PROVIDER_UNBOUND",
      "No secret provider interface is bound",
    );
  }
  if (!requestExecutor || typeof requestExecutor.execute !== "function") {
    return stopped(
      stageRequest,
      "REQUEST_EXECUTOR_UNBOUND",
      "No request executor interface is bound",
    );
  }
  if (!timeoutController || typeof timeoutController.createSignal !== "function") {
    return stopped(
      stageRequest,
      "TIMEOUT_CONTROLLER_UNBOUND",
      "No timeout controller interface is bound",
    );
  }

  const secretReceipt = await secretProvider.resolveSecret();
  validateSecretReceipt(secretReceipt);
  const rawResponse = await requestExecutor.execute({
    endpointPath: B1B1.endpointPath,
    headers: {
      content_type: "application/json",
      authorization_opaque: secretReceipt.secret_value,
    },
    body: stageRequest.body,
    signal: timeoutController.createSignal(),
  });
  return {
    task_id: B1B1.taskId,
    execution_mode: B1B1.mode,
    stage_id: stageRequest.stage_id,
    status: "completed",
    stop_code: null,
    parsed_receipt: parseProviderResponse({ stageRequest, rawResponse }),
  };
}
