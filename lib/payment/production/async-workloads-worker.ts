import {
  ErrorDoNotRetry,
  ErrorRetryAfterDelay,
  type AsyncWorkloadEvent,
} from "@netlify/async-workloads";
import {
  parseProductionFulfillmentJobEventData,
  type ProductionFulfillmentJobEvent,
} from "./async-workloads-contract.ts";
import type {
  FulfillmentRetryExhaustionOutcome,
  ServerFulfillmentOutcome,
} from "./types.ts";

export const PRODUCTION_FULFILLMENT_MAX_RETRIES = 8;

export type ProductionFulfillmentWorkloadDependencies = Readonly<{
  processJob(jobId: string, recoveryCycle?: number): Promise<ServerFulfillmentOutcome>;
  quarantineAfterRetryExhaustion(
    jobId: string,
    recoveryCycle?: number,
  ): Promise<FulfillmentRetryExhaustionOutcome>;
}>;

/**
 * Async Workloads owns short retries. Exhaustion hands the same purchase to
 * the durable DB recovery schedule and never enters the Provider pipeline.
 */
export async function processProductionFulfillmentWorkloadEvent(
  event: Pick<
    AsyncWorkloadEvent<ProductionFulfillmentJobEvent>,
    "attempt" | "eventData"
  >,
  dependencies: ProductionFulfillmentWorkloadDependencies,
) {
  let payload: ReturnType<typeof parseProductionFulfillmentJobEventData>;
  try {
    payload = parseProductionFulfillmentJobEventData(event.eventData);
  } catch {
    throw new ErrorDoNotRetry("PRODUCTION_FULFILLMENT_EVENT_INVALID");
  }

  if (event.attempt >= PRODUCTION_FULFILLMENT_MAX_RETRIES) {
    const terminal = await dependencies.quarantineAfterRetryExhaustion(
      payload.jobId,
      payload.recoveryCycle ?? 0,
    );
    if (terminal.disposition === "completed") {
      const completed = await dependencies.processJob(payload.jobId, payload.recoveryCycle ?? 0);
      if (
        completed.status === "completed" &&
        !completed.notificationPending &&
        !completed.notificationManualReview
      ) {
        return;
      }
    }
    throw new ErrorDoNotRetry(
      "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED",
    );
  }

  const outcome = await dependencies.processJob(payload.jobId, payload.recoveryCycle ?? 0);
  if (outcome.status === "temporary_problem") {
    throw new Error("PRODUCTION_FULFILLMENT_RETRYABLE_FAILURE");
  }
  if (outcome.status === "manual_review") {
    throw new ErrorDoNotRetry("PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS");
  }
  if (outcome.status === "in_progress") {
    throw new ErrorRetryAfterDelay({
      message: "PRODUCTION_FULFILLMENT_ACTIVE_LEASE",
      retryDelay: "1m",
    });
  }
  if (outcome.notificationPending) {
    throw new Error("PRODUCTION_NOTIFICATION_RETRYABLE_FAILURE");
  }
  if (outcome.notificationManualReview) {
    throw new ErrorDoNotRetry("PRODUCTION_NOTIFICATION_MANUAL_REVIEW");
  }
}
