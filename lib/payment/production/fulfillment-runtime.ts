import {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
  recoverCompletedProductionAssessmentGrant,
} from "../../assessment/production/worker-service.ts";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { ProductionPaymentDeliveryApplication } from "./application.ts";
import { readPaymentDeliveryEnvironment } from "./environment-runtime.ts";
import { VerifiedEmailResultNotificationAdapterV1 } from "./result-notification.ts";
import { SupabasePaymentDeliveryRepository } from "./supabase-repository.ts";
import { createConfiguredTransactionalEmailAdapter } from "./transactional-email-runtime.ts";
import type { CheckoutSessionInspectorV1 } from "./stripe-session.ts";
import type {
  CheckoutProviderV1,
  PaymentEnvironment,
  ProductionFulfillmentDispatcherV1,
  ProductionGrantProcessorV1,
} from "./types.ts";

class FulfillmentRuntimeCheckoutProviderV1 implements CheckoutProviderV1 {
  async createCheckoutSession(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 503);
  }

  async retrieveCheckoutSession(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_UNAVAILABLE", 503);
  }
}

export function createActiveProductionFulfillmentApplication(input: {
  paymentEnvironment: PaymentEnvironment;
  fulfillmentDispatcher: ProductionFulfillmentDispatcherV1;
  checkoutSessionInspector?: CheckoutSessionInspectorV1;
}) {
  const environment = readPaymentDeliveryEnvironment();
  const repository = new SupabasePaymentDeliveryRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  const transactionalEmail = createConfiguredTransactionalEmailAdapter();
  const grantProcessor: ProductionGrantProcessorV1 = {
    issueProductionAssessmentGrant,
    fulfillProductionAssessmentGrant,
    recoverCompletedProductionAssessmentGrant,
    async processResultNotification(deliveryAuthorityReference) {
      const notificationId =
        await findProductionNotificationForDelivery(
          deliveryAuthorityReference,
        );
      if (!notificationId) {
        throw new M2RuntimeError("RESULT_NOTIFICATION_NOT_FOUND", 503);
      }
      await processProductionNotificationWithAdapter(
        notificationId,
        new VerifiedEmailResultNotificationAdapterV1(
          repository,
          transactionalEmail,
          environment.emailEncryptionKey,
          environment.siteOrigin,
        ),
      );
    },
  };
  return new ProductionPaymentDeliveryApplication({
    repository,
    checkoutProvider: new FulfillmentRuntimeCheckoutProviderV1(),
    checkoutSessionInspector: input.checkoutSessionInspector,
    transactionalEmail,
    grantProcessor,
    fulfillmentDispatcher: input.fulfillmentDispatcher,
    policy: environment.policy,
    environment: input.paymentEnvironment,
    siteOrigin: environment.siteOrigin,
    payPayEnabled: false,
    verificationPepper: environment.verificationPepper,
    emailEncryptionKey: environment.emailEncryptionKey,
    purchaseStatusSigningSecret: environment.purchaseStatusSigningSecret,
    fulfillmentLeaseSeconds: 16 * 60,
  });
}
