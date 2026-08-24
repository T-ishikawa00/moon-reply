import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { ProductionPaymentDeliveryApplication } from "./application.ts";
import {
  isStripeReconciliationAvailable,
  readProductionSchedulerDatabaseEnvironment,
} from "./environment-runtime.ts";
import { readStripeCheckoutEnvironment } from "./stripe-environment-runtime.ts";
import { runProductionPaymentReconciliationSchedule } from "./recovery-schedulers.ts";
import { StripeCheckoutProviderV1 } from "./stripe.ts";
import { SupabasePaymentDeliveryRepository } from "./supabase-repository.ts";
import type {
  ProductionFulfillmentDispatcherV1,
  ProductionGrantProcessorV1,
} from "./types.ts";
import type { TransactionalEmailAdapterV1 } from "./transactional-email.ts";

const unavailableEmail: TransactionalEmailAdapterV1 = {
  async sendMailboxVerification(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
  async sendAssessmentResult(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
};

const unavailableGrant: ProductionGrantProcessorV1 = {
  async issueProductionAssessmentGrant(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
  async fulfillProductionAssessmentGrant(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
  async recoverCompletedProductionAssessmentGrant(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
  async processResultNotification(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
};

const unavailableDispatcher: ProductionFulfillmentDispatcherV1 = {
  async enqueue(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_SCOPE_VIOLATION", 503);
  },
};

export async function runConfiguredProductionPaymentReconciliationSchedule() {
  if (!isStripeReconciliationAvailable()) {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_UNAVAILABLE", 503);
  }
  const database = readProductionSchedulerDatabaseEnvironment();
  const stripe = readStripeCheckoutEnvironment();
  const repository = new SupabasePaymentDeliveryRepository(
    database.supabaseUrl,
    database.supabaseSecretKey,
  );
  const application = new ProductionPaymentDeliveryApplication({
    repository,
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey, {
      maxNetworkRetries: 0,
      timeout: 5_000,
    }),
    transactionalEmail: unavailableEmail,
    grantProcessor: unavailableGrant,
    fulfillmentDispatcher: unavailableDispatcher,
    policy: {
      challengeTtlSeconds: 60,
      trustedSessionTtlSeconds: 60,
      maximumVerificationAttempts: 1,
    },
    environment: stripe.environment,
    siteOrigin: "https://scheduler.invalid",
    payPayEnabled: false,
    verificationPepper: "scheduler-scope-disabled",
    emailEncryptionKey: "scheduler-scope-disabled",
    purchaseStatusSigningSecret: "scheduler-scope-disabled",
    fulfillmentLeaseSeconds: 30,
  });
  return runProductionPaymentReconciliationSchedule({
    repository,
    reconcileAttempt: (paymentAttemptId) =>
      application.reconcilePaymentAttempt(paymentAttemptId, {
        dispatchFulfillment: false,
      }),
  });
}
