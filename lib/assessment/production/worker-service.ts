import { M2RuntimeError } from "../runtime/errors.ts";
import { createProductionAssessmentApplication } from "./application-runtime.ts";
import {
  isProductionFulfillmentAvailable,
  readProductionAssessmentEnvironment,
} from "./environment-runtime.ts";
import type { DeliveryNotificationAdapterV1 } from "./notification.ts";
import { SupabaseProductionFulfillmentRepository } from "./supabase-repository.ts";
import type {
  AssessmentGrantHandleV1,
  VerifiedPurchaseAuthorityV1,
} from "./types.ts";

function requireFulfillmentRuntime() {
  if (!isProductionFulfillmentAvailable()) {
    throw new M2RuntimeError("PRODUCTION_FULFILLMENT_UNAVAILABLE", 404);
  }
}

export async function issueProductionAssessmentGrant(
  authority: VerifiedPurchaseAuthorityV1,
) {
  requireFulfillmentRuntime();
  return (await createProductionAssessmentApplication()).issueAssessmentGrant(
    authority,
  );
}

export async function fulfillProductionAssessmentGrant(
  grant: AssessmentGrantHandleV1,
) {
  requireFulfillmentRuntime();
  return (await createProductionAssessmentApplication()).fulfillAssessmentGrant(
    grant,
  );
}

export async function recoverCompletedProductionAssessmentGrant(
  grant: AssessmentGrantHandleV1,
) {
  requireFulfillmentRuntime();
  return (
    await createProductionAssessmentApplication()
  ).recoverCompletedAssessmentGrant(grant);
}

export async function processProductionNotificationWithAdapter(
  notificationId: string,
  adapter: DeliveryNotificationAdapterV1,
) {
  requireFulfillmentRuntime();
  return (await createProductionAssessmentApplication()).processNotification(
    notificationId,
    adapter,
  );
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
