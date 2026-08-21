import "server-only";
import {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
} from "../../assessment/production/service.ts";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import { enforceLegacyCustomerEmailVerificationAllowed } from "../../customer-auth/cutover.ts";
import { ProductionPaymentDeliveryApplication } from "./application.ts";
import {
  isCheckoutAvailable,
  isCustomerEmailDeliveryAvailable,
  isEmailVerificationAvailable,
  isPaidFulfillmentProcessingAvailable,
  isStripeReconciliationAvailable,
  isStripeWebhookAvailable,
  readConfiguredPaymentEnvironment,
  readPaymentDeliveryEnvironment,
  readStripeCheckoutEnvironment,
  readStripeWebhookEnvironment,
} from "./environment.ts";
import { VerifiedEmailResultNotificationAdapterV1 } from "./result-notification.ts";
import {
  StripeCheckoutProviderV1,
  StripeWebhookEvidenceVerifierV1,
} from "./stripe.ts";
import { SupabasePaymentDeliveryRepository } from "./supabase-repository.ts";
import { createResendTransactionalEmailAdapterV1 } from "./resend-transactional-email.ts";
import {
  UnconfiguredTransactionalEmailAdapterV1,
  type TransactionalEmailAdapterV1,
} from "./transactional-email.ts";
import type {
  CheckoutProviderV1,
  ProductionGrantProcessorV1,
} from "./types.ts";

class UnavailableCheckoutProviderV1 implements CheckoutProviderV1 {
  async createCheckoutSession(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 503);
  }

  async retrieveCheckoutSession(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_UNAVAILABLE", 503);
  }
}

class UnavailableGrantProcessorV1 implements ProductionGrantProcessorV1 {
  async issueProductionAssessmentGrant(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }

  async fulfillProductionAssessmentGrant(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }

  async processResultNotification(): Promise<never> {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
}

export function createTransactionalEmailAdapter(): TransactionalEmailAdapterV1 {
  if (!isCustomerEmailDeliveryAvailable()) {
    return new UnconfiguredTransactionalEmailAdapterV1();
  }
  const configured = process.env.TRANSACTIONAL_EMAIL_PROVIDER;
  if (!configured || configured === "unconfigured") {
    return new UnconfiguredTransactionalEmailAdapterV1();
  }
  if (configured === "resend") {
    return createResendTransactionalEmailAdapterV1({
      apiKey: process.env.EMAIL_API_KEY,
      fromAddress: process.env.EMAIL_FROM_ADDRESS,
      fromName: process.env.EMAIL_FROM_NAME,
    });
  }
  throw new M2RuntimeError("TRANSACTIONAL_EMAIL_PROVIDER_UNSUPPORTED", 503);
}

function base() {
  const environment = readPaymentDeliveryEnvironment();
  const repository = new SupabasePaymentDeliveryRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  return { environment, repository };
}

function createApplication(input: {
  checkoutProvider: CheckoutProviderV1;
  transactionalEmail: TransactionalEmailAdapterV1;
  grantProcessor: ProductionGrantProcessorV1;
  paymentEnvironment: "test" | "live";
  payPayEnabled: boolean;
}) {
  const { environment, repository } = base();
  return {
    application: new ProductionPaymentDeliveryApplication({
      repository,
      checkoutProvider: input.checkoutProvider,
      transactionalEmail: input.transactionalEmail,
      grantProcessor: input.grantProcessor,
      policy: environment.policy,
      environment: input.paymentEnvironment,
      siteOrigin: environment.siteOrigin,
      payPayEnabled: input.payPayEnabled,
      verificationPepper: environment.verificationPepper,
      emailEncryptionKey: environment.emailEncryptionKey,
      purchaseStatusSigningSecret: environment.purchaseStatusSigningSecret,
      fulfillmentLeaseSeconds: environment.fulfillmentLeaseSeconds,
    }),
    environment,
    repository,
  };
}

function inactiveDependencies(paymentEnvironment: "test" | "live") {
  return createApplication({
    checkoutProvider: new UnavailableCheckoutProviderV1(),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment,
    payPayEnabled: false,
  });
}

export async function startProductionEmailVerification(input: {
  preparationCapability: unknown;
  email: unknown;
  trustedSessionToken?: unknown;
}) {
  enforceLegacyCustomerEmailVerificationAllowed();
  if (!isEmailVerificationAvailable()) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_UNAVAILABLE", 404);
  }
  const paymentEnvironment = readConfiguredPaymentEnvironment();
  const { application } = createApplication({
    checkoutProvider: new UnavailableCheckoutProviderV1(),
    transactionalEmail: createTransactionalEmailAdapter(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment,
    payPayEnabled: false,
  });
  return application.startEmailVerification(input);
}

export async function completeProductionEmailVerification(input: {
  challengeCapability: unknown;
  verificationCode: unknown;
}) {
  enforceLegacyCustomerEmailVerificationAllowed();
  if (!isEmailVerificationAvailable()) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_UNAVAILABLE", 404);
  }
  const paymentEnvironment = readConfiguredPaymentEnvironment();
  const { application } = inactiveDependencies(paymentEnvironment);
  return application.completeEmailVerification(input);
}

export async function createProductionStripeCheckout(input: {
  preparationCapability: unknown;
  trustedSessionToken: unknown;
}) {
  if (!isCheckoutAvailable()) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 404);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: stripe.payPayEnabled,
  });
  return application.startCheckout(input);
}

export async function createAuthenticatedProductionStripeCheckout(input: {
  preparationCapability: unknown;
  customerUserId: string;
}) {
  if (!isCheckoutAvailable()) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 404);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: stripe.payPayEnabled,
  });
  return application.startAuthenticatedCheckout(input);
}

export async function createAuthenticatedProductionStripeCheckoutFromContinuation(input: {
  continuationToken: unknown;
  customerUserId: string;
}) {
  if (!isCheckoutAvailable()) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 404);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: stripe.payPayEnabled,
  });
  return application.startAuthenticatedCheckoutFromContinuation(input);
}

export async function restartProductionStripeCheckout(input: {
  statusCapability: unknown;
  trustedSessionToken: unknown;
}) {
  if (!isCheckoutAvailable()) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 404);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: stripe.payPayEnabled,
  });
  return application.restartCheckout(input);
}

export async function restartAuthenticatedProductionStripeCheckout(input: {
  statusCapability: unknown;
  customerUserId: string;
}) {
  if (!isCheckoutAvailable()) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_UNAVAILABLE", 404);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: stripe.payPayEnabled,
  });
  return application.restartAuthenticatedCheckout(input);
}

export async function verifyAndRecordProductionStripeWebhook(
  rawBody: Buffer,
  signature: string | null,
) {
  if (!isStripeWebhookAvailable()) {
    throw new M2RuntimeError("PAYMENT_WEBHOOK_UNAVAILABLE", 404);
  }
  const stripe = readStripeWebhookEnvironment();
  const verifier = new StripeWebhookEvidenceVerifierV1(
    stripe.secretKey,
    stripe.webhookSecret,
  );
  const evidence = verifier.verify(rawBody, signature);
  if (!evidence) return { disposition: "ignored" as const };
  const { application } = inactiveDependencies(stripe.environment);
  return application.verifyStripeEvidence(evidence);
}

export async function reconcileProductionStripePaymentAttempt(
  paymentAttemptId: unknown,
) {
  if (!isStripeReconciliationAvailable()) {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_UNAVAILABLE", 503);
  }
  const stripe = readStripeCheckoutEnvironment();
  const { application } = createApplication({
    checkoutProvider: new StripeCheckoutProviderV1(stripe.secretKey),
    transactionalEmail: new UnconfiguredTransactionalEmailAdapterV1(),
    grantProcessor: new UnavailableGrantProcessorV1(),
    paymentEnvironment: stripe.environment,
    payPayEnabled: false,
  });
  return application.reconcilePaymentAttempt(paymentAttemptId);
}

function activeFulfillmentApplication(paymentEnvironment: "test" | "live") {
  const { environment, repository } = base();
  const transactionalEmail = createTransactionalEmailAdapter();
  const grantProcessor: ProductionGrantProcessorV1 = {
    issueProductionAssessmentGrant,
    fulfillProductionAssessmentGrant,
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
    checkoutProvider: new UnavailableCheckoutProviderV1(),
    transactionalEmail,
    grantProcessor,
    policy: environment.policy,
    environment: paymentEnvironment,
    siteOrigin: environment.siteOrigin,
    payPayEnabled: false,
    verificationPepper: environment.verificationPepper,
    emailEncryptionKey: environment.emailEncryptionKey,
    purchaseStatusSigningSecret: environment.purchaseStatusSigningSecret,
    fulfillmentLeaseSeconds: environment.fulfillmentLeaseSeconds,
  });
}

export async function processProductionPurchaseStatus(
  statusCapability: unknown,
  trustedSessionToken?: unknown,
) {
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  const paymentEnvironment = readConfiguredPaymentEnvironment();
  return activeFulfillmentApplication(
    paymentEnvironment,
  ).processPurchaseStatus(statusCapability, trustedSessionToken);
}

export async function processAuthenticatedProductionPurchaseStatus(
  statusCapability: unknown,
  customerUserId: string,
) {
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  const paymentEnvironment = readConfiguredPaymentEnvironment();
  return activeFulfillmentApplication(
    paymentEnvironment,
  ).processAuthenticatedPurchaseStatus(statusCapability, customerUserId);
}

export async function processProductionFulfillmentJobById(jobId: unknown) {
  if (!isPaidFulfillmentProcessingAvailable()) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  const paymentEnvironment = readConfiguredPaymentEnvironment();
  return activeFulfillmentApplication(
    paymentEnvironment,
  ).processFulfillmentJobById(jobId);
}
