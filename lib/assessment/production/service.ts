import "server-only";
import { M2RuntimeError } from "../runtime/errors.ts";
import { OpenAiResponsesTransport } from "../runtime/openai-transport.ts";
import { loadM2P4FinalProductRecoveryRuntimeStageCatalog } from "../runtime/schema-catalog.ts";
import { SupabaseAssessmentRepository } from "../runtime/supabase-repository.ts";
import { ProductionFulfillmentApplication } from "./application.ts";
import { hashProductionResultCapability } from "./capabilities.ts";
import {
  isProductionFulfillmentAvailable,
  isProductionPreparationAvailable,
  isProductionResultAccessAvailable,
  readProductionAssessmentEnvironment,
  readProductionResultEnvironment,
} from "./environment.ts";
import { UnconfiguredDeliveryNotificationAdapterV1 } from "./notification.ts";
import type { DeliveryNotificationAdapterV1 } from "./notification.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";
import type {
  AssessmentGrantHandleV1,
  VerifiedPurchaseAuthorityV1,
} from "./types.ts";

async function createApplication(options?: {
  allowSyntheticPurchaseAuthority?: boolean;
}) {
  const environment = readProductionAssessmentEnvironment();
  const loaded = await loadM2P4FinalProductRecoveryRuntimeStageCatalog();
  const runtimeRepository = new SupabaseAssessmentRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  );
  return new ProductionFulfillmentApplication({
    runtimeRepository,
    lifecycleRepository: new SupabaseProductionFulfillmentRepository(
      environment.supabaseUrl,
      environment.supabaseSecretKey,
    ),
    transport: new OpenAiResponsesTransport(environment.openAiApiKey),
    catalog: {
      catalogVersion: "runtime-stage-catalog-v17.0.0",
      promptBundleVersion: "prompt-bundle-runtime-v17.0.0",
      schemaSetVersion: "pipeline-schema-runtime-v6.0.0",
      stageTopologyVersion: "split-base-candidate-v1",
      definitions: loaded.definitions,
    },
    model: environment.openAiModel,
    allowSyntheticPurchaseAuthority:
      options?.allowSyntheticPurchaseAuthority ?? false,
  });
}

function requirePreparationRuntime() {
  if (!isProductionPreparationAvailable()) {
    throw new M2RuntimeError("PRODUCTION_PREPARATION_UNAVAILABLE", 404);
  }
}

function requireFulfillmentRuntime() {
  if (!isProductionFulfillmentAvailable()) {
    throw new M2RuntimeError("PRODUCTION_FULFILLMENT_UNAVAILABLE", 404);
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

export async function issueProductionAssessmentGrant(
  authority: VerifiedPurchaseAuthorityV1,
) {
  requireFulfillmentRuntime();
  return (await createApplication()).issueAssessmentGrant(authority);
}

export async function fulfillProductionAssessmentGrant(
  grant: AssessmentGrantHandleV1,
) {
  requireFulfillmentRuntime();
  return (await createApplication()).fulfillAssessmentGrant(grant);
}

export async function recoverCompletedProductionAssessmentGrant(
  grant: AssessmentGrantHandleV1,
) {
  requireFulfillmentRuntime();
  return (await createApplication()).recoverCompletedAssessmentGrant(grant);
}

export async function processProductionNotification(notificationId: string) {
  requireFulfillmentRuntime();
  return (await createApplication()).processNotification(
    notificationId,
    new UnconfiguredDeliveryNotificationAdapterV1(),
  );
}

export async function processProductionNotificationWithAdapter(
  notificationId: string,
  adapter: DeliveryNotificationAdapterV1,
) {
  requireFulfillmentRuntime();
  return (await createApplication()).processNotification(notificationId, adapter);
}

export async function findProductionNotificationForDelivery(
  deliveryAuthorityReference: string,
) {
  requireFulfillmentRuntime();
  const environment = readProductionAssessmentEnvironment();
  return new SupabaseProductionFulfillmentRepository(
    environment.supabaseUrl,
    environment.supabaseSecretKey,
  ).findNotificationIdByDeliveryAuthorityReference(
    deliveryAuthorityReference,
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
