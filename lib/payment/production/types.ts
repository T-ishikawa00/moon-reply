import type {
  AssessmentGrantHandleV1,
  ProductionFulfillmentResultV1,
  VerifiedPurchaseAuthorityV1,
} from "../../assessment/production/types.ts";

export type PaymentEnvironment = "test" | "live";
export type PaymentAttemptState =
  | "reserved"
  | "pending"
  | "processing"
  | "unknown"
  | "failed"
  | "canceled"
  | "succeeded";
export type PurchaseIntentState =
  | "requires_payment"
  | "pending"
  | "processing"
  | "unknown"
  | "payment_failed"
  | "canceled"
  | "verified"
  | "manual_review";

export type EmailVerificationPolicyV1 = Readonly<{
  challengeTtlSeconds: number;
  trustedSessionTtlSeconds: number;
  maximumVerificationAttempts: number;
}>;

export type PurchaseReadyPreparation = Readonly<{
  id: string;
  status: "purchase_ready" | "consumed";
  purchaseReadyAuthorityHash: string;
}>;

export type EmailChallengeRecord = Readonly<{
  id: string;
  preparationId: string;
  challengeCapabilityHash: string;
  verificationSecretHash: string;
  emailHash: string;
  emailCiphertext: string;
  status: "pending" | "delivery_failed" | "consumed" | "revoked";
  attemptCount: number;
  maximumAttempts: number;
  expiresAt: string;
  verifiedEmailAuthorityId: string | null;
  createdAt: string;
}>;

export type VerifiedEmailAuthority = Readonly<{
  id: string;
  deliveryAuthorityReference: string;
  emailHash: string;
  emailCiphertext: string;
  verifiedAt: string;
  revokedAt: string | null;
}>;

export type TrustedEmailSession = Readonly<{
  id: string;
  verifiedEmailAuthorityId: string;
  sessionTokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
}>;

export type TrustedEmailContext = Readonly<{
  session: TrustedEmailSession;
  authority: VerifiedEmailAuthority;
}>;

export type EmailVerificationStartOutcome =
  | Readonly<{
      status: "trusted_session_reused";
      maskedEmail: string;
    }>
  | Readonly<{
      status: "verification_sent";
      challengeCapability: string;
      expiresAt: string;
    }>;

export type EmailVerificationCompleteOutcome = Readonly<{
  status: "verified";
  maskedEmail: string;
  trustedSessionToken: string;
  trustedSessionExpiresAt: string;
}>;

export type PurchaseIntentRecord = Readonly<{
  id: string;
  preparationId: string;
  verifiedEmailAuthorityId: string;
  trustedEmailSessionId: string;
  deliveryAuthorityReference: string;
  emailCiphertext: string;
  expectedProductCode: string;
  expectedAmount: number;
  currency: "jpy";
  purchaseKind: "one_time";
  environment: PaymentEnvironment;
  provider: "stripe";
  state: PurchaseIntentState;
  currentPaymentAttemptId: string | null;
  successfulPaymentId: string | null;
  statusCapabilityHash: string;
  finalConfirmationAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
}>;

export type PaymentAttemptRecord = Readonly<{
  id: string;
  purchaseIntentId: string;
  sequence: number;
  state: PaymentAttemptState;
  providerIdempotencyKeyHash: string;
  providerCheckoutSessionId: string | null;
  providerPaymentId: string | null;
  providerCheckoutUrl: string | null;
  lastProviderEventCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type CheckoutSessionRequestV1 = Readonly<{
  purchaseReference: string;
  customerEmail: string;
  amount: 980;
  currency: "jpy";
  mode: "payment";
  quantity: 1;
  serviceName: "月の返事";
  productName: "恋のメッセージ鑑定ノート";
  productDescription: "1相談 / 1鑑定ノート";
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
  payPayEnabled: boolean;
}>;

export type CheckoutSessionResultV1 = Readonly<{
  providerCheckoutSessionId: string;
  checkoutUrl: string;
}>;

export type CheckoutProviderV1 = {
  createCheckoutSession(
    request: CheckoutSessionRequestV1,
  ): Promise<CheckoutSessionResultV1>;
};

export type CheckoutStartOutcome = Readonly<{
  status: "checkout_ready";
  checkoutUrl: string;
  statusCapability: string;
  duplicate: boolean;
}>;

export type StripeEvidenceEventType =
  | "checkout.session.completed"
  | "checkout.session.async_payment_succeeded"
  | "checkout.session.async_payment_failed"
  | "checkout.session.expired";

export type StripePaymentEvidenceV1 = Readonly<{
  providerEventId: string;
  eventType: StripeEvidenceEventType;
  providerCreatedAt: string;
  payloadSha256: string;
  environment: PaymentEnvironment;
  purchaseReference: string;
  providerCheckoutSessionId: string;
  providerPaymentId: string | null;
  mode: "payment" | string | null;
  paymentStatus: "paid" | "unpaid" | "no_payment_required" | string | null;
  amountTotal: number | null;
  currency: string | null;
}>;

export type PaymentEvidenceVerification = Readonly<{
  disposition: "verified" | "pending" | "failed" | "canceled" | "rejected";
  reasonCode: string | null;
}>;

export type RecordedPaymentEvidence = Readonly<{
  disposition:
    | "verified"
    | "pending"
    | "failed"
    | "canceled"
    | "rejected"
    | "stale"
    | "duplicate"
    | "conflict";
  purchaseIntentId: string | null;
  verifiedPaymentId: string | null;
  fulfillmentJobId: string | null;
}>;

export type FulfillmentJobState =
  | "pending"
  | "processing"
  | "retryable"
  | "completed"
  | "manual_review";

export type FulfillmentJobRecord = Readonly<{
  id: string;
  purchaseIntentId: string;
  verifiedPaymentId: string;
  preparationId: string;
  deliveryAuthorityReference: string;
  state: FulfillmentJobState;
  ownerId: string | null;
  leaseExpiresAt: string | null;
  attemptCount: number;
  grantId: string | null;
  logicalAssessmentId: string | null;
  lastErrorCode: string | null;
  completedAt: string | null;
}>;

export type FulfillmentJobClaim = Readonly<{
  disposition: "acquired" | "in_progress" | "completed";
  job: FulfillmentJobRecord;
}>;

export type PurchaseStatusRecord = Readonly<{
  purchaseIntent: PurchaseIntentRecord;
  fulfillmentJob: FulfillmentJobRecord | null;
}>;

export type CustomerPurchaseStatus =
  | Readonly<{ status: "confirming_payment" }>
  | Readonly<{ status: "preparing_assessment" }>
  | Readonly<{ status: "temporary_problem"; retryable: true }>
  | Readonly<{ status: "payment_not_completed" }>
  | Readonly<{ status: "completed"; resultPath: string }>;

export type PaymentDeliveryRepository = {
  findPurchaseReadyPreparation(
    preparationCapabilityHash: string,
  ): Promise<PurchaseReadyPreparation | null>;
  findTrustedEmailSession(input: {
    sessionTokenHash: string;
    emailHash?: string;
    now: string;
  }): Promise<TrustedEmailContext | null>;
  createEmailChallenge(input: {
    preparationCapabilityHash: string;
    challenge: EmailChallengeRecord;
  }): Promise<void>;
  markEmailChallengeDeliveryFailed(input: {
    challengeId: string;
    now: string;
    errorCode: string;
  }): Promise<void>;
  consumeEmailChallenge(input: {
    challengeCapabilityHash: string;
    verificationSecretHash: string;
    verifiedEmailAuthorityId: string;
    deliveryAuthorityReference: string;
    trustedSessionId: string;
    trustedSessionTokenHash: string;
    trustedSessionExpiresAt: string;
    now: string;
  }): Promise<TrustedEmailContext | null>;
  beginPurchaseIntent(input: {
    purchaseIntent: PurchaseIntentRecord;
    preparationCapabilityHash: string;
    trustedSessionTokenHash: string;
    now: string;
  }): Promise<PurchaseIntentRecord>;
  reservePaymentAttempt(input: {
    purchaseIntentId: string;
    attemptId: string;
    providerIdempotencyKeyHash: string;
    now: string;
  }): Promise<{ attempt: PaymentAttemptRecord; duplicate: boolean }>;
  attachCheckoutSession(input: {
    attemptId: string;
    providerCheckoutSessionId: string;
    providerCheckoutUrl: string;
    now: string;
  }): Promise<PaymentAttemptRecord>;
  markPaymentAttemptUnknown(input: {
    attemptId: string;
    now: string;
    errorCode: string;
  }): Promise<void>;
  findPurchaseIntentByReference(
    purchaseReference: string,
  ): Promise<PurchaseIntentRecord | null>;
  findPaymentAttemptByCheckoutSession(
    providerCheckoutSessionId: string,
  ): Promise<PaymentAttemptRecord | null>;
  recordStripeEvidence(input: {
    evidence: StripePaymentEvidenceV1;
    verification: PaymentEvidenceVerification;
    verifiedPaymentId: string;
    fulfillmentJobId: string;
    now: string;
  }): Promise<RecordedPaymentEvidence>;
  findPurchaseStatus(
    statusCapabilityHash: string,
  ): Promise<PurchaseStatusRecord | null>;
  claimFulfillmentJob(input: {
    statusCapabilityHash: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentJobClaim | null>;
  completeFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    now: string;
  }): Promise<void>;
  failFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }): Promise<void>;
  resolveDeliveryEmailCiphertext(
    deliveryAuthorityReference: string,
  ): Promise<string | null>;
};

export type ProductionGrantProcessorV1 = {
  issueProductionAssessmentGrant(
    authority: VerifiedPurchaseAuthorityV1,
  ): Promise<AssessmentGrantHandleV1>;
  fulfillProductionAssessmentGrant(
    grant: AssessmentGrantHandleV1,
  ): Promise<ProductionFulfillmentResultV1>;
  processResultNotification(deliveryAuthorityReference: string): Promise<void>;
};
