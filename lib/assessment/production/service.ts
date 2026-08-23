import "server-only";
import { M2RuntimeError } from "../runtime/errors.ts";
import { createProductionAssessmentApplication } from "./application-runtime.ts";
import { hashProductionResultCapability } from "./capabilities.ts";
import {
  isProductionPreparationAvailable,
  isProductionResultAccessAvailable,
  readProductionResultEnvironment,
} from "./environment.ts";
import { UnconfiguredDeliveryNotificationAdapterV1 } from "./notification.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";
import {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
  recoverCompletedProductionAssessmentGrant,
} from "./worker-service.ts";

export {
  findProductionNotificationForDelivery,
  fulfillProductionAssessmentGrant,
  issueProductionAssessmentGrant,
  processProductionNotificationWithAdapter,
  recoverCompletedProductionAssessmentGrant,
};

async function createApplication(options?: {
  allowSyntheticPurchaseAuthority?: boolean;
}) {
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
  return (await createApplication()).prepare(value, idempotencyKey);
}

export async function answerProductionClarification(
  clarificationCapability: unknown,
  answer: unknown,
) {
  requirePreparationRuntime();
  return (await createApplication()).answerClarification(
    clarificationCapability,
    answer,
  );
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
