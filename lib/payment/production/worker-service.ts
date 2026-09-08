import { asM2RuntimeError, M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { withProviderDeadline } from "../../assessment/runtime/provider-deadline.ts";
import {
  isPaidFulfillmentProcessingAvailable,
  readConfiguredPaymentEnvironment,
  readProductionSchedulerDatabaseEnvironment,
} from "./environment-runtime.ts";
import { createActiveProductionFulfillmentApplication } from "./fulfillment-runtime.ts";
import type { ProductionFulfillmentDispatcherV1 } from "./types.ts";
import { SupabasePaidRecoveryRepository } from "./paid-recovery-supabase-repository.ts";
import { schedulePaidRecovery } from "./paid-recovery.ts";
import { parseProductionFulfillmentJobId } from "./async-workloads-contract.ts";

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

export async function processProductionFulfillmentJobById(jobId: unknown, recoveryCycle = 0) {
  // Disabled/emergency-stopped workers retain their existing no-DB boundary.
  if (!isPaidFulfillmentProcessingAvailable()) throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  const id = parseProductionFulfillmentJobId(jobId);
  try {
    return await withProviderDeadline(() => activeWorkerApplication().processFulfillmentJobById(id, recoveryCycle));
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAID_RECOVERY_WORKER_CONFIGURATION_UNKNOWN");
    const environment = readProductionSchedulerDatabaseEnvironment();
    await schedulePaidRecovery(new SupabasePaidRecoveryRepository(environment.supabaseUrl, environment.supabaseSecretKey), {
      jobId: id, ownerId: null, reasonCode: safe.safeCode, recoveryCycle, now: new Date().toISOString(),
    });
    return { status: "manual_review" as const };
  }
}

export async function quarantineProductionFulfillmentJobAfterAsyncRetryExhaustion(
  jobId: unknown,
  recoveryCycle = 0,
) {
  return activeWorkerApplication().quarantineFulfillmentJobAfterAsyncRetryExhaustion(
    jobId,
    recoveryCycle,
  );
}
