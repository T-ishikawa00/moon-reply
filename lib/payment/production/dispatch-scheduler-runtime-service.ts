import { randomUUID } from "node:crypto";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { enqueueProductionFulfillmentJob } from "./async-workloads-runtime.ts";
import {
  isPaidFulfillmentProcessingAvailable,
  isProductionFulfillmentDispatchScheduleEnabled,
  readConfiguredPaymentEnvironment,
  readProductionSchedulerDatabaseEnvironment,
} from "./environment-runtime.ts";
import { requestProductionFulfillmentDispatch } from "./fulfillment-dispatch.ts";
import { runNotificationCutoverRecovery } from "./notification-cutover-recovery.ts";
import { runProductionFulfillmentDispatchSchedule } from "./recovery-schedulers.ts";
import { SupabasePaymentDeliveryRepository } from "./supabase-repository.ts";

export async function runConfiguredProductionFulfillmentDispatchSchedule() {
  if (!isProductionFulfillmentDispatchScheduleEnabled()) {
    return { disabled: true as const };
  }
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  const environment = readProductionSchedulerDatabaseEnvironment();
  const repository = new SupabasePaymentDeliveryRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  const [dispatch, recovery] = await Promise.allSettled([
    runProductionFulfillmentDispatchSchedule({
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
    }),
    runNotificationCutoverRecovery({
      claim: (signal) =>
        repository.claimNotificationCutoverRecovery({
          environment: readConfiguredPaymentEnvironment(),
          signal,
        }),
      enqueue: (jobId) => enqueueProductionFulfillmentJob(jobId),
    }),
  ]);
  // Await both independent lanes even if ordinary dispatch fails immediately;
  // returning early could strand an otherwise healthy notification handoff.
  if (dispatch.status === "rejected") throw dispatch.reason;
  return {
    ...dispatch.value,
    notificationCutoverRecovery: recovery.status === "fulfilled"
      ? recovery.value
      : { status: "deferred" as const },
  };
}
