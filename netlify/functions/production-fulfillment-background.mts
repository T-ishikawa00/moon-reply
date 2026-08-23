import {
  asyncWorkloadFn,
  type AsyncWorkloadConfig,
} from "@netlify/async-workloads";
import {
  PRODUCTION_FULFILLMENT_EVENT_NAME,
  type ProductionFulfillmentJobEvent,
} from "../../lib/payment/production/async-workloads-contract.ts";
import {
  processProductionFulfillmentWorkloadEvent,
  PRODUCTION_FULFILLMENT_MAX_RETRIES,
} from "../../lib/payment/production/async-workloads-worker.ts";
import {
  processProductionFulfillmentJobById,
  quarantineProductionFulfillmentJobAfterAsyncRetryExhaustion,
} from "../../lib/payment/production/worker-service.ts";

/**
 * Async Workloads owns routing and asynchronous execution. The supported
 * `-background` suffix deliberately gives the workload Netlify's 15-minute
 * execution window. Do not add a `path` or `schedule` to this workload.
 */
export const asyncWorkloadConfig: AsyncWorkloadConfig<ProductionFulfillmentJobEvent> = {
  events: [PRODUCTION_FULFILLMENT_EVENT_NAME],
  maxRetries: PRODUCTION_FULFILLMENT_MAX_RETRIES,
  backoffSchedule: (attempt) => `${Math.min(30 * 2 ** (attempt - 1), 15 * 60)}s`,
};

export default asyncWorkloadFn<ProductionFulfillmentJobEvent>(
  (event) =>
    processProductionFulfillmentWorkloadEvent(event, {
      processJob: processProductionFulfillmentJobById,
      quarantineAfterRetryExhaustion:
        quarantineProductionFulfillmentJobAfterAsyncRetryExhaustion,
    }),
);
