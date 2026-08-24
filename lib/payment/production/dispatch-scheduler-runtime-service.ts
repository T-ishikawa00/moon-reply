import { randomUUID } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { enqueueProductionFulfillmentJob } from "./async-workloads-runtime.ts";
import {
  isPaidFulfillmentProcessingAvailable,
  readProductionSchedulerDatabaseEnvironment,
} from "./environment-runtime.ts";
import { requestProductionFulfillmentDispatch } from "./fulfillment-dispatch.ts";
import { runProductionFulfillmentDispatchSchedule } from "./recovery-schedulers.ts";
import { SupabasePaymentDeliveryRepository } from "./supabase-repository.ts";

export async function runConfiguredProductionFulfillmentDispatchSchedule() {
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  const environment = readProductionSchedulerDatabaseEnvironment();
  const repository = new SupabasePaymentDeliveryRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  return runProductionFulfillmentDispatchSchedule({
    repository,
    dispatchJob: (jobId) =>
      requestProductionFulfillmentDispatch({
        repository,
        dispatcher: {
          async enqueue(id) {
            const sent = await enqueueProductionFulfillmentJob(id);
            return { eventId: sent.eventId };
          },
        },
        jobId,
        now: () => new Date().toISOString(),
        uuid: randomUUID,
      }),
  });
}
