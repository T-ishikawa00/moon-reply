// Shared server/native-worker repository dependency. This creates no client and
// reads no keys until the provider-free intake operation is actually invoked.
import { M2RuntimeError } from "../runtime/errors.ts";
import type { BeginPrepaymentIntakeRecord } from "./prepayment-compute.ts";
import {
  readAnonymousAdmissionPolicy,
  readTrustedAnonymousAdmissionIdentity,
  requireAnonymousAdmissionReceipt,
} from "./anonymous-admission.ts";

type AdmissionRpcClient = {
  rpc(name: string, args: Record<string, unknown>): {
    abortSignal(signal: AbortSignal): PromiseLike<{ data: unknown; error: unknown }>;
  };
};

export const ANONYMOUS_ADMISSION_RPC_TIMEOUT_MS = 5000;

// Called only by the provider-free intake repository seam. Paid fulfillment,
// authenticated computation, Account and reconciliation never consume this pool.
export async function beginAdmittedPrepaymentIntake(
  client: AdmissionRpcClient,
  record: BeginPrepaymentIntakeRecord,
): Promise<Record<string, unknown>> {
  const policy = readAnonymousAdmissionPolicy();
  const identityHash = readTrustedAnonymousAdmissionIdentity();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new M2RuntimeError("ANONYMOUS_ADMISSION_UNAVAILABLE", 503));
    }, ANONYMOUS_ADMISSION_RPC_TIMEOUT_MS);
  });
  let response: { data: unknown; error: unknown };
  try {
    response = await Promise.race([client.rpc("begin_production_prepayment_intake_v2", {
      p_preparation_id: record.preparationId,
      p_request_id: record.requestId,
      p_idempotency_key_hash: record.idempotencyKeyHash,
      p_consultation_snapshot_sha256: record.consultationSnapshotHash,
      p_consultation_snapshot_json: record.consultationSnapshot,
      p_safety_authority_json: record.safetyAuthority,
      p_current_situation: record.assessmentInput.currentSituation,
      p_optional_message: record.assessmentInput.optionalMessage,
      p_relationship: record.assessmentInput.relationship,
      p_requested_topics: record.assessmentInput.requestedTopics,
      p_execution_capability_hash: record.executionCapabilityHash,
      p_now: record.now,
      p_ip_identity_hash: identityHash,
      p_window_seconds: policy.windowSeconds,
      p_maximum_requests_per_ip: policy.maximumRequestsPerIp,
      p_maximum_requests_global: policy.maximumRequestsGlobal,
      p_maximum_intakes_per_ip: policy.maximumIntakesPerIp,
      p_maximum_intakes_global: policy.maximumIntakesGlobal,
    }).abortSignal(controller.signal), deadline]);
  } catch {
    throw new M2RuntimeError("ANONYMOUS_ADMISSION_UNAVAILABLE", 503);
  } finally {
    clearTimeout(timer);
  }
  if (response.error) throw new M2RuntimeError("ANONYMOUS_ADMISSION_UNAVAILABLE", 503);
  return requireAnonymousAdmissionReceipt(response.data, policy.windowSeconds);
}
