import { createHash } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { FulfillmentJobClaim, PaymentEnvironment } from "./types.ts";

// Internal execution policy, not a customer delivery SLA. Counters and limits
// are enforced transactionally in 0033; a new queue event cannot reset them.
export const paidRecoveryPolicy = Object.freeze({
  batchLimit: 4,
  initialDelaySeconds: 300,
  maximumDelaySeconds: 3_600,
  maximumJitterSeconds: 60,
  delayNoticeSeconds: 900,
  operatorReviewSeconds: 3_600,
  maximumAutomaticAgeSeconds: 86_400,
});

const transient = new Set([
  "M2_STAGE_PROVIDER_RETRYABLE", "M2_STAGE_PROVIDER_TIMEOUT",
  "M2_STAGE_PROVIDER_OUTCOME_AMBIGUOUS", "M2_PROVIDER_DEADLINE_EXCEEDED",
  "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS",
  "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
  "PAYMENT_DATABASE_OPERATION_FAILED", "PRODUCTION_DATABASE_OPERATION_FAILED",
  "M2_DATABASE_OPERATION_FAILED", "PRODUCTION_FULFILLMENT_IN_PROGRESS",
  "PAID_RECOVERY_DATABASE_OPERATION_FAILED", "PAID_RECOVERY_CONCURRENCY_LIMITED",
]);

export function recoveryDisposition(reasonCode: string) {
  // Unknown/configuration/schema/quality/integrity errors require an inspected
  // artifact. Never turn every 500 into permission to regenerate.
  return transient.has(reasonCode) ? "retry" as const : "operator" as const;
}

export function nextPaidRecoveryAttempt(jobId: string, cycle: number, now: string) {
  const jitter = createHash("sha256").update(`${jobId}:${cycle}`).digest()[0]
    % (paidRecoveryPolicy.maximumJitterSeconds + 1);
  const delay = Math.min(paidRecoveryPolicy.initialDelaySeconds * 2 ** Math.min(cycle, 8),
    paidRecoveryPolicy.maximumDelaySeconds) + jitter;
  return new Date(Date.parse(now) + delay * 1_000).toISOString();
}

export interface PaidRecoveryRepository {
  claimJob(input: { jobId: string; ownerId: string; leaseExpiresAt: string;
    recoveryCycle: number; now: string }): Promise<FulfillmentJobClaim | null>;
  schedule(input: { jobId: string; ownerId: string | null; reasonCode: string;
    retryable: boolean; nextAttemptAt: string | null; recoveryCycle: number; now: string }): Promise<void>;
  refresh(input: { environment: PaymentEnvironment; now: string; limit: number }): Promise<void>;
  listDue(input: { environment: PaymentEnvironment; now: string; limit: number }): Promise<string[]>;
  inspect(jobId: string): Promise<Record<string, unknown>>;
  resume(input: { jobId: string; artifactHash: string; operatorReference: string;
    expectedReasonCode: string; now: string }): Promise<void>;
}

export async function schedulePaidRecovery(repository: PaidRecoveryRepository,
  input: { jobId: string; ownerId: string | null; reasonCode: string; recoveryCycle: number; now: string }) {
  const retryable = recoveryDisposition(input.reasonCode) === "retry";
  await repository.schedule({ ...input, retryable,
    nextAttemptAt: retryable ? nextPaidRecoveryAttempt(input.jobId, input.recoveryCycle, input.now) : null });
}

export async function enqueueReviewedNotificationRecovery(input: {
  repository: Pick<PaidRecoveryRepository, "inspect">; jobId: string;
  enqueue: (jobId: string, recoveryCycle: number) => Promise<unknown>;
}) {
  const state = await input.repository.inspect(input.jobId);
  if (state.reason_code && state.next_attempt_at === null) {
    throw new M2RuntimeError("PRODUCTION_NOTIFICATION_MANUAL_REVIEW", 409);
  }
  const cycle = Number(state.recovery_cycle);
  if (!Number.isSafeInteger(cycle) || cycle < 0) {
    throw new M2RuntimeError("PAID_RECOVERY_DATABASE_INVALID", 503);
  }
  return input.enqueue(input.jobId, cycle);
}
