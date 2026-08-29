import { createHash, randomUUID } from "node:crypto";
import { asM2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { RecordedPaymentEvidence } from "./types.ts";

export const privateRecoverySchedulerPolicy = Object.freeze({
  dispatchBatchLimit: 4,
  reconciliationBatchLimit: 4,
  reconciliationConcurrency: 2,
  reconciliationGraceSeconds: 120,
  reconciliationLeaseSeconds: 24,
  reconciliationMaximumAttempts: 6,
  runtimeBudgetMilliseconds: 22_000,
});

export type ClaimedPaymentReconciliation = Readonly<{
  paymentAttemptId: string;
  providerCheckoutSessionId: string;
  attemptCount: number;
}>;

export type PaymentReconciliationFinish = Readonly<{
  paymentAttemptId: string;
  ownerId: string;
  outcome: "retry" | "stop" | "settled";
  retryAfter: string | null;
  errorCode: string | null;
  now: string;
}>;

export type PrivateRecoverySchedulerRepository = {
  listDueFulfillmentDispatchJobIds(input: {
    now: string;
    limit: number;
  }): Promise<string[]>;
  claimPaymentReconciliationBatch(input: {
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
    notNewerThan: string;
    limit: number;
    maximumAttempts: number;
  }): Promise<ClaimedPaymentReconciliation[]>;
  finishPaymentReconciliation(
    input: PaymentReconciliationFinish,
  ): Promise<void>;
};

function addMilliseconds(instant: string, milliseconds: number) {
  return new Date(Date.parse(instant) + milliseconds).toISOString();
}

function deterministicRetryDelaySeconds(
  paymentAttemptId: string,
  attemptCount: number,
) {
  const exponential = Math.min(60 * 2 ** Math.max(0, attemptCount - 1), 900);
  const jitter = createHash("sha256")
    .update(`${paymentAttemptId}:${attemptCount}`)
    .digest()[0] % 31;
  return exponential + jitter;
}

const permanentReconciliationErrors = new Set([
  "PAYMENT_RECONCILIATION_SESSION_INVALID",
  "PAYMENT_RECONCILIATION_SESSION_REQUIRED",
  "PAYMENT_RECONCILIATION_EVIDENCE_INVALID",
  "PAYMENT_BINDING_INVALID",
  "PAYMENT_EXPECTATION_INVALID",
  "PAYMENT_MODE_INVALID",
  "PAYMENT_ECONOMIC_EVIDENCE_INVALID",
]);

export async function runProductionFulfillmentDispatchSchedule(input: {
  repository: Pick<
    PrivateRecoverySchedulerRepository,
    "listDueFulfillmentDispatchJobIds"
  >;
  dispatchJob: (jobId: string) => Promise<"accepted" | "skipped">;
  now?: () => string;
  monotonicNow?: () => number;
  batchLimit?: number;
  runtimeBudgetMilliseconds?: number;
}) {
  const now = input.now ?? (() => new Date().toISOString());
  const monotonicNow = input.monotonicNow ?? (() => Date.now());
  const startedAt = monotonicNow();
  const budget =
    input.runtimeBudgetMilliseconds ??
    privateRecoverySchedulerPolicy.runtimeBudgetMilliseconds;
  const jobIds = await input.repository.listDueFulfillmentDispatchJobIds({
    now: now(),
    limit:
      input.batchLimit ?? privateRecoverySchedulerPolicy.dispatchBatchLimit,
  });
  let accepted = 0;
  let skipped = 0;
  let failed = 0;
  let deadlineReached = false;
  for (const jobId of jobIds) {
    if (monotonicNow() - startedAt >= budget) {
      deadlineReached = true;
      break;
    }
    try {
      const outcome = await input.dispatchJob(jobId);
      if (outcome === "accepted") accepted += 1;
      else skipped += 1;
    } catch {
      failed += 1;
    }
  }
  return {
    selected: jobIds.length,
    accepted,
    skipped,
    failed,
    deadlineReached,
  } as const;
}

function finishForRecordedEvidence(
  claim: ClaimedPaymentReconciliation,
  recorded: RecordedPaymentEvidence,
  now: string,
  ownerId: string,
): PaymentReconciliationFinish {
  if (recorded.disposition === "pending") {
    if (
      claim.attemptCount >=
      privateRecoverySchedulerPolicy.reconciliationMaximumAttempts
    ) {
      return {
        paymentAttemptId: claim.paymentAttemptId,
        ownerId,
        outcome: "stop",
        retryAfter: null,
        errorCode: "PAYMENT_RECONCILIATION_RETRY_EXHAUSTED",
        now,
      };
    }
    return {
      paymentAttemptId: claim.paymentAttemptId,
      ownerId,
      outcome: "retry",
      retryAfter: addMilliseconds(
        now,
        deterministicRetryDelaySeconds(
          claim.paymentAttemptId,
          claim.attemptCount,
        ) * 1_000,
      ),
      errorCode: "PAYMENT_RECONCILIATION_PENDING",
      now,
    };
  }
  if (
    ["verified", "duplicate", "failed", "canceled"].includes(
      recorded.disposition,
    )
  ) {
    return {
      paymentAttemptId: claim.paymentAttemptId,
      ownerId,
      outcome: "settled",
      retryAfter: null,
      errorCode: null,
      now,
    };
  }
  return {
    paymentAttemptId: claim.paymentAttemptId,
    ownerId,
    outcome: "stop",
    retryAfter: null,
    errorCode: "PAYMENT_RECONCILIATION_EVIDENCE_REJECTED",
    now,
  };
}

async function mapWithConcurrency<T>(
  values: readonly T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const current = values[cursor];
        cursor += 1;
        await worker(current);
      }
    }),
  );
}

export async function runProductionPaymentReconciliationSchedule(input: {
  repository: Pick<
    PrivateRecoverySchedulerRepository,
    "claimPaymentReconciliationBatch" | "finishPaymentReconciliation"
  >;
  reconcileAttempt: (
    paymentAttemptId: string,
  ) => Promise<RecordedPaymentEvidence>;
  now?: () => string;
  uuid?: () => string;
  batchLimit?: number;
  concurrency?: number;
}) {
  const now = input.now ?? (() => new Date().toISOString());
  const ownerId = (input.uuid ?? randomUUID)();
  const claimedAt = now();
  const claims = await input.repository.claimPaymentReconciliationBatch({
    ownerId,
    leaseExpiresAt: addMilliseconds(
      claimedAt,
      privateRecoverySchedulerPolicy.reconciliationLeaseSeconds * 1_000,
    ),
    now: claimedAt,
    notNewerThan: addMilliseconds(
      claimedAt,
      -privateRecoverySchedulerPolicy.reconciliationGraceSeconds * 1_000,
    ),
    limit:
      input.batchLimit ??
      privateRecoverySchedulerPolicy.reconciliationBatchLimit,
    maximumAttempts:
      privateRecoverySchedulerPolicy.reconciliationMaximumAttempts,
  });
  let stripeReads = 0;
  let settled = 0;
  let retried = 0;
  let stopped = 0;
  let finishConflicts = 0;
  await mapWithConcurrency(
    claims,
    input.concurrency ??
      privateRecoverySchedulerPolicy.reconciliationConcurrency,
    async (claim) => {
      let finish: PaymentReconciliationFinish;
      try {
        stripeReads += 1;
        const recorded = await input.reconcileAttempt(
          claim.paymentAttemptId,
        );
        finish = finishForRecordedEvidence(
          claim,
          recorded,
          now(),
          ownerId,
        );
      } catch (error) {
        const safe = asM2RuntimeError(
          error,
          "PAYMENT_RECONCILIATION_UNKNOWN",
        );
        const stoppedByPolicy =
          permanentReconciliationErrors.has(safe.safeCode) ||
          claim.attemptCount >=
            privateRecoverySchedulerPolicy.reconciliationMaximumAttempts;
        const finishedAt = now();
        finish = {
          paymentAttemptId: claim.paymentAttemptId,
          ownerId,
          outcome: stoppedByPolicy ? "stop" : "retry",
          retryAfter: stoppedByPolicy
            ? null
            : addMilliseconds(
                finishedAt,
                deterministicRetryDelaySeconds(
                  claim.paymentAttemptId,
                  claim.attemptCount,
                ) * 1_000,
              ),
          errorCode: stoppedByPolicy
            ? "PAYMENT_RECONCILIATION_STOPPED"
            : safe.safeCode,
          now: finishedAt,
        };
      }
      try {
        await input.repository.finishPaymentReconciliation(finish);
        if (finish.outcome === "settled") settled += 1;
        else if (finish.outcome === "retry") retried += 1;
        else stopped += 1;
      } catch {
        // A concurrent webhook may settle the attempt while this owner is
        // finalizing. The fence failure must not trigger another Stripe read.
        finishConflicts += 1;
      }
    },
  );
  return {
    claimed: claims.length,
    stripeReads,
    settled,
    retried,
    stopped,
    finishConflicts,
  } as const;
}
