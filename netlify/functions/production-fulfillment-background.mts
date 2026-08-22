import {
  asyncWorkloadFn,
  ErrorDoNotRetry,
  ErrorRetryAfterDelay,
  type AsyncWorkloadConfig,
} from "@netlify/async-workloads";
import { processProductionFulfillmentJobById } from "../../lib/payment/production/service.ts";
import {
  parseProductionFulfillmentJobEventData,
  PRODUCTION_FULFILLMENT_EVENT_NAME,
  type ProductionFulfillmentJobEvent,
} from "../../lib/payment/production/async-workloads-contract.ts";

/**
 * Async Workloads owns routing and asynchronous execution. The supported
 * `-background` suffix deliberately gives the workload Netlify's 15-minute
 * execution window. Do not add a `path` or `schedule` to this workload.
 */
export const asyncWorkloadConfig: AsyncWorkloadConfig<ProductionFulfillmentJobEvent> = {
  events: [PRODUCTION_FULFILLMENT_EVENT_NAME],
  maxRetries: 8,
  backoffSchedule: (attempt) => `${Math.min(30 * 2 ** (attempt - 1), 15 * 60)}s`,
};

export default asyncWorkloadFn<ProductionFulfillmentJobEvent>(
  async (event) => {
    let payload: ReturnType<typeof parseProductionFulfillmentJobEventData>;
    try {
      payload = parseProductionFulfillmentJobEventData(event.eventData);
    } catch {
      throw new ErrorDoNotRetry("PRODUCTION_FULFILLMENT_EVENT_INVALID");
    }

    const outcome = await processProductionFulfillmentJobById(payload.jobId);
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
  },
);
