import type { CustomerAssessmentExperienceProjectionV2 } from "../runtime/customer-assessment-experience-projection-v2.ts";
import type {
  AssessmentInput,
  JsonObject,
  Jpy980ClarificationTarget,
  PersistedAssessmentRequest,
  PurchaseReadyRuntimeAuthorityV1,
} from "../runtime/types.ts";
import type {
  PrepaymentSafetyInputV1,
  PrepaymentSafetyResultV1,
} from "../../purchase/prepayment-safety-types-v1.ts";

export const PRODUCTION_CONSULTATION_SCHEMA_VERSION =
  "rc1-production-consultation-v1" as const;
export const PRODUCTION_PREPARATION_SCHEMA_VERSION =
  "rc1-production-preparation-v1" as const;
export const VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION =
  "rc1-verified-purchase-authority-v1" as const;

export type ProductionConsultationInputV1 = PrepaymentSafetyInputV1 & {
  consultationSchemaVersion: typeof PRODUCTION_CONSULTATION_SCHEMA_VERSION;
  privacyAcknowledged: true;
};

export type ProductionPreparationStatus =
  | "preparing"
  | "awaiting_clarification"
  | "purchase_ready"
  | "stopped"
  | "failed"
  | "consumed"
  | "revoked";

export type ProductionPreparationStopReason =
  | "not_full_product_candidate"
  | "safety_blocked";

export type ProductionPreparationRecord = {
  id: string;
  requestId: string;
  idempotencyKeyHash: string;
  consultationSnapshotHash: string;
  consultationSnapshot: ProductionConsultationInputV1;
  assessmentInput: AssessmentInput;
  safetyAuthority: PrepaymentSafetyResultV1;
  status: ProductionPreparationStatus;
  stopReason: ProductionPreparationStopReason | null;
  clarificationId: string | null;
  clarificationCapabilityHash: string | null;
  clarificationQuestion: string | null;
  clarificationAnswerFingerprint: string | null;
  purchaseCapabilityHash: string | null;
  purchaseReadyAuthority: PurchaseReadyRuntimeAuthorityV1 | null;
  purchaseReadyAuthorityHash: string | null;
  lastErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BeginProductionPreparationRecord = {
  preparationId: string;
  requestId: string;
  idempotencyKeyHash: string;
  consultationSnapshotHash: string;
  consultationSnapshot: ProductionConsultationInputV1;
  assessmentInput: AssessmentInput;
  safetyAuthority: PrepaymentSafetyResultV1;
  now: string;
};

export type BeginProductionPreparationOutcome = {
  disposition: "created" | "existing";
  preparation: ProductionPreparationRecord;
  request: PersistedAssessmentRequest;
};

export type FinalizeProductionPreparationRecord = {
  preparationId: string;
  status: "awaiting_clarification" | "purchase_ready" | "stopped";
  stopReason: ProductionPreparationStopReason | null;
  clarificationId: string | null;
  clarificationCapabilityHash: string | null;
  clarificationQuestion: string | null;
  clarificationAnswerFingerprint: string | null;
  purchaseCapabilityHash: string | null;
  purchaseReadyAuthority: PurchaseReadyRuntimeAuthorityV1 | null;
  purchaseReadyAuthorityHash: string | null;
  now: string;
};

export type PublicPreparationOutcome =
  | Readonly<{
      status: "purchase_ready";
      preparationCapability: string;
    }>
  | Readonly<{
      status: "needs_one_clarifying_answer";
      clarificationCapability: string;
      target: Jpy980ClarificationTarget;
      question: string;
      maximumQuestionsTotal: 1;
    }>
  | Readonly<{
      status: "not_full_product_candidate" | "safety_blocked";
    }>;

export type VerifiedPurchaseAuthorityV1 =
  | Readonly<{
      schemaVersion: typeof VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION;
      verificationSource: "future_verified_payment";
      purchaseAuthorityReference: string;
      verifiedPaymentId: string;
      preparationId: string;
      deliveryAuthorityReference: string;
    }>
  | Readonly<{
      schemaVersion: typeof VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION;
      verificationSource: "rc1_test_fake";
      purchaseAuthorityReference: string;
      preparationCapability: string;
      deliveryAuthorityReference: string;
    }>;

export type AssessmentGrantHandleV1 = Readonly<{
  schemaVersion: "rc1-assessment-grant-handle-v1";
  grantId: string;
  logicalAssessmentId: string;
}>;

export type ProductionFulfillmentClaim = {
  disposition: "acquired" | "in_progress" | "completed";
  grantId: string;
  logicalAssessmentId: string;
  ownerId: string | null;
  preparation: ProductionPreparationRecord;
  request: PersistedAssessmentRequest;
  canonicalDelivery: ProductionCanonicalDeliveryRecord | null;
  recoverableRuntimeRunId: string | null;
};

export type ProductionCanonicalDeliveryRecord = {
  id: string;
  logicalAssessmentId: string;
  runtimeRunId: string;
  projection: CustomerAssessmentExperienceProjectionV2;
  projectionHash: string;
  deliveryAuthorityReference: string;
  createdAt: string;
};

export type CompleteProductionFulfillmentRecord = {
  grantId: string;
  logicalAssessmentId: string;
  ownerId: string;
  runtimeRunId: string;
  deliveryId: string;
  projection: CustomerAssessmentExperienceProjectionV2;
  projectionHash: string;
  resultCredentialId: string;
  resultTokenHash: string;
  notificationId: string;
  now: string;
};

export type ProductionFulfillmentResultV1 = Readonly<{
  status: "completed";
  resultToken: string;
  projection: CustomerAssessmentExperienceProjectionV2;
  duplicate: boolean;
}>;

export type ResolvedProductionResult = {
  deliveryId: string;
  projection: CustomerAssessmentExperienceProjectionV2;
};

export type ProductionNotificationRecord = {
  id: string;
  deliveryId: string;
  deliveryAuthorityReference: string;
  status: "pending" | "processing" | "failed" | "sent";
  attemptCount: number;
  ownerId: string | null;
};

export type ProductionFulfillmentRepository = {
  beginPreparation(
    record: BeginProductionPreparationRecord,
  ): Promise<BeginProductionPreparationOutcome>;
  finalizePreparation(
    record: FinalizeProductionPreparationRecord,
  ): Promise<ProductionPreparationRecord>;
  failPreparation(input: {
    preparationId: string;
    errorCode: string;
    now: string;
  }): Promise<void>;
  getPreparationByIdempotency(
    idempotencyKeyHash: string,
  ): Promise<ProductionPreparationRecord | null>;
  getPreparationByClarificationCapability(
    capabilityHash: string,
  ): Promise<ProductionPreparationRecord | null>;
  rotateClarificationCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ): Promise<void>;
  rotatePurchaseCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ): Promise<void>;
  issueGrant(input: {
    grantId: string;
    purchaseId: string;
    logicalAssessmentId: string;
    preparationCapabilityHash: string;
    purchaseAuthorityReferenceHash: string;
    deliveryAuthorityReference: string;
    now: string;
  }): Promise<AssessmentGrantHandleV1>;
  issueVerifiedPaymentGrant(input: {
    grantId: string;
    purchaseId: string;
    logicalAssessmentId: string;
    verifiedPaymentId: string;
    preparationId: string;
    purchaseAuthorityReferenceHash: string;
    deliveryAuthorityReference: string;
    now: string;
  }): Promise<AssessmentGrantHandleV1>;
  claimFulfillment(input: {
    grantId: string;
    ownerId: string;
    now: string;
  }): Promise<ProductionFulfillmentClaim>;
  markGenerationStarted(input: {
    logicalAssessmentId: string;
    ownerId: string;
    now: string;
  }): Promise<string>;
  completeFulfillment(
    record: CompleteProductionFulfillmentRecord,
  ): Promise<ProductionCanonicalDeliveryRecord>;
  failFulfillment(input: {
    logicalAssessmentId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }): Promise<void>;
  addResultCredential(input: {
    credentialId: string;
    deliveryId: string;
    tokenHash: string;
    purpose: "customer_handoff" | "notification" | "recovery";
    now: string;
  }): Promise<void>;
  revokeResultCredential(
    credentialId: string,
    now: string,
  ): Promise<void>;
  resolveResultToken(tokenHash: string, now: string): Promise<ResolvedProductionResult | null>;
  claimNotification(input: {
    notificationId: string;
    ownerId: string;
    now: string;
  }): Promise<ProductionNotificationRecord | null>;
  completeNotification(input: {
    notificationId: string;
    ownerId: string;
    providerMessageReference: string;
    now: string;
  }): Promise<void>;
  failNotification(input: {
    notificationId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }): Promise<void>;
  findNotificationIdByDeliveryAuthorityReference(
    deliveryAuthorityReference: string,
  ): Promise<string | null>;
};

export function asJsonObject(value: object): JsonObject {
  return value as unknown as JsonObject;
}
