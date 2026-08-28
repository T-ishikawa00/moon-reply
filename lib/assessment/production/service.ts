import "server-only";
import { M2RuntimeError } from "../runtime/errors.ts";
import { SupabaseAssessmentRepository } from "../runtime/supabase-repository.ts";
import { hashProductionResultCapability } from "./capabilities.ts";
import {
  isProductionPreparationAvailable,
  isProductionResultAccessAvailable,
  readProductionResultEnvironment,
} from "./environment.ts";
import { readProductionPersistenceEnvironment } from "./environment-runtime.ts";
import { UnconfiguredDeliveryNotificationAdapterV1 } from "./notification.ts";
import { ProviderFreeIntakeApplication } from "./provider-free-intake.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";
import {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
  recoverCompletedProductionAssessmentGrant,
} from "./worker-service.ts";
import {
  isPrepaymentComputeBudgetEnabled,
  readPrepaymentComputePolicy,
} from "./prepayment-compute-policy.ts";
import { isCustomerAuthFoundationEnabled } from "../../customer-auth/environment.ts";
import { createCustomerIdentityAuthApplication } from "../../customer-auth/service.ts";
import { hashCustomerAuthContinuation } from "../../customer-auth/crypto.ts";

export {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
  recoverCompletedProductionAssessmentGrant,
};

function createProviderFreeProductionAssessmentApplication() {
  const environment = readProductionPersistenceEnvironment();
  const lifecycleRepository = new SupabaseProductionFulfillmentRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  return new ProviderFreeIntakeApplication({
    runtimeRepository: new SupabaseAssessmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    ),
    lifecycleRepository,
    prepaymentComputeAuthority: lifecycleRepository,
  });
}

async function createApplication(options?: {
  allowSyntheticPurchaseAuthority?: boolean;
}) {
  const { createProductionAssessmentApplication } = await import(
    "./application-runtime.ts"
  );
  return createProductionAssessmentApplication(options);
}

function requirePreparationRuntime() {
  if (!isProductionPreparationAvailable()) {
    throw new M2RuntimeError("PRODUCTION_PREPARATION_UNAVAILABLE", 404);
  }
}

export async function prepareProductionConsultation(
  value: unknown,
  idempotencyKey: unknown,
) {
  requirePreparationRuntime();
  if (isPrepaymentComputeBudgetEnabled()) {
    readPrepaymentComputePolicy();
    if (!isCustomerAuthFoundationEnabled()) {
      throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
    }
    const providerFree = createProviderFreeProductionAssessmentApplication();
    const begun = await providerFree.beginProviderFreePreparation(
      value,
      idempotencyKey,
    );
    return begun;
  }
  return (await createApplication()).prepare(value, idempotencyKey);
}

export async function answerProductionClarification(
  clarificationCapability: unknown,
  answer: unknown,
) {
  requirePreparationRuntime();
  if (isPrepaymentComputeBudgetEnabled()) {
    const policy = readPrepaymentComputePolicy();
    if (!isCustomerAuthFoundationEnabled()) {
      throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
    }
    const identity = await (
      await createCustomerIdentityAuthApplication()
    ).getFreshIdentity();
    return (await createApplication()).answerClarification(
      clarificationCapability,
      answer,
      { customerUserId: identity.customerUserId, policy },
    );
  }
  return (await createApplication()).answerClarification(
    clarificationCapability,
    answer,
  );
}

export async function continueAuthenticatedProductionPreparation(input: {
  continuationToken: unknown;
}) {
  requirePreparationRuntime();
  const policy = readPrepaymentComputePolicy();
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
  }
  const identity = await (
    await createCustomerIdentityAuthApplication()
  ).getFreshIdentity();
  const application = await createApplication();
  return application.executeAuthenticatedPrepaymentFromContinuation({
    customerUserId: identity.customerUserId,
    continuationTokenHash: hashCustomerAuthContinuation(input.continuationToken),
    policy,
  });
}

export async function processProductionNotification(notificationId: string) {
  return processProductionNotificationWithAdapter(
    notificationId,
    new UnconfiguredDeliveryNotificationAdapterV1(),
  );
}

export async function resolveProductionResult(token: unknown) {
  if (!isProductionResultAccessAvailable()) {
    throw new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404);
  }
  const environment = readProductionResultEnvironment();
  const repository = new SupabaseProductionFulfillmentRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  const result = await repository.resolveResultToken(
    hashProductionResultCapability(token),
    new Date().toISOString(),
  );
  if (!result) {
    throw new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404);
  }
  return result;
}
