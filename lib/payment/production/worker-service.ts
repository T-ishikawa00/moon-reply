import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import {
  isPaidFulfillmentProcessingAvailable,
  readConfiguredPaymentEnvironment,
} from "./environment-runtime.ts";
import { createActiveProductionFulfillmentApplication } from "./fulfillment-runtime.ts";
import type { ProductionFulfillmentDispatcherV1 } from "./types.ts";

const workerDispatchBoundary: ProductionFulfillmentDispatcherV1 = {
  async enqueue(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  },
};

function activeWorkerApplication() {
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  return createActiveProductionFulfillmentApplication({
    paymentEnvironment: readConfiguredPaymentEnvironment(),
    fulfillmentDispatcher: workerDispatchBoundary,
  });
}

export async function processProductionFulfillmentJobById(jobId: unknown) {
  return activeWorkerApplication().processFulfillmentJobById(jobId);
}

export async function quarantineProductionFulfillmentJobAfterAsyncRetryExhaustion(
  jobId: unknown,
) {
  return activeWorkerApplication().quarantineFulfillmentJobAfterAsyncRetryExhaustion(
    jobId,
  );
}
