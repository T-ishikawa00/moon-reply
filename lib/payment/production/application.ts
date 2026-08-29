import { randomUUID } from "node:crypto";
import {
  VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION,
  type AssessmentGrantHandleV1,
  type VerifiedPurchaseAuthorityV1,
} from "../../assessment/production/types.ts";
import {
  asM2RuntimeError,
  M2RuntimeError,
} from "../../assessment/runtime/errors.ts";
import { hashOpaqueProductionCapability } from "../../assessment/production/capabilities.ts";
import {
  RC2_CHECKOUT_SESSION_EXPIRATION_SECONDS,
  RC2_PRODUCT,
} from "./constants.ts";
import { requestProductionFulfillmentDispatch } from "./fulfillment-dispatch.ts";
import { parseCustomerResultPath } from "../purchase-status-contract.ts";
import {
  createPaymentCapability,
  createVerificationCode,
  decryptDeliveryEmail,
  deriveProviderIdempotencyKey,
  derivePurchaseStatusCapability,
  encryptDeliveryEmail,
  hashDeliveryEmail,
  hashPaymentCapability,
  hashProviderIdempotencyKey,
  hashVerificationSecret,
  maskDeliveryEmail,
  normalizeDeliveryEmail,
} from "./crypto.ts";
import type { TransactionalEmailAdapterV1 } from "./transactional-email.ts";
import type {
  CheckoutProviderV1,
  CheckoutStartOutcome,
  CustomerPurchaseStatus,
  EmailVerificationCompleteOutcome,
  EmailVerificationPolicyV1,
  EmailVerificationStartOutcome,
  FulfillmentJobClaim,
  FulfillmentRetryExhaustionOutcome,
  PaymentDeliveryRepository,
  PaymentEnvironment,
  PaymentEvidenceVerification,
  ProductionFulfillmentDispatcherV1,
  ProductionGrantProcessorV1,
  PurchaseIntentRecord,
  RecordedPaymentEvidence,
  ServerFulfillmentOutcome,
  StripePaymentEvidenceV1,
} from "./types.ts";
type FulfillmentClaimOutcome =
  | Readonly<{
      status: "completed";
      resultToken: string | null;
      notificationPending: boolean;
      notificationManualReview: boolean;
    }>
  | Readonly<{ status: "in_progress" }>
  | Readonly<{ status: "manual_review" }>
  | Readonly<{ status: "temporary_problem"; retryable: true }>;

const internalUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function confirmationPendingStatus(
  purchaseIntent: PurchaseIntentRecord,
  accountFallback: boolean,
): CustomerPurchaseStatus {
  return {
    status: "confirmation_pending",
    paymentVerified: purchaseIntent.successfulPaymentId !== null,
    accountFallback,
  };
}

type PaymentDeliveryApplicationOptions = {
  repository: PaymentDeliveryRepository;
  checkoutProvider: CheckoutProviderV1;
  transactionalEmail: TransactionalEmailAdapterV1;
  grantProcessor: ProductionGrantProcessorV1;
  fulfillmentDispatcher: ProductionFulfillmentDispatcherV1;
  policy: EmailVerificationPolicyV1;
  environment: PaymentEnvironment;
  siteOrigin: string;
  payPayEnabled: boolean;
  verificationPepper: string;
  emailEncryptionKey: string;
  purchaseStatusSigningSecret: string;
  fulfillmentLeaseSeconds: number;
  onVerifiedPaymentRecorded?: (
    recorded: Pick<
      RecordedPaymentEvidence,
      "disposition" | "verifiedPaymentId"
    >,
  ) => void;
  now?: () => string;
  uuid?: () => string;
  capability?: () => string;
  verificationCode?: () => string;
};

function addSeconds(instant: string, seconds: number) {
  const milliseconds = Date.parse(instant);
  if (!Number.isFinite(milliseconds) || !Number.isSafeInteger(seconds) || seconds < 1) {
    throw new M2RuntimeError("PAYMENT_POLICY_INVALID", 503);
  }
  return new Date(milliseconds + seconds * 1000).toISOString();
}

function safeSiteOrigin(value: string, environment: PaymentEnvironment) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  if (url.origin !== value || !["http:", "https:"].includes(url.protocol)) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  if (environment === "live" && url.protocol !== "https:") {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return url.origin;
}

export class ProductionPaymentDeliveryApplication {
  private readonly options: PaymentDeliveryApplicationOptions;
  private readonly now: () => string;
  private readonly uuid: () => string;
  private readonly capability: () => string;
  private readonly verificationCode: () => string;
  private readonly siteOrigin: string;

  constructor(options: PaymentDeliveryApplicationOptions) {
    this.options = options;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
    this.capability = options.capability ?? createPaymentCapability;
    this.verificationCode = options.verificationCode ?? createVerificationCode;
    this.siteOrigin = safeSiteOrigin(options.siteOrigin, options.environment);
    if (
      options.policy.challengeTtlSeconds < 60 ||
      options.policy.trustedSessionTtlSeconds < 60 ||
      options.policy.maximumVerificationAttempts < 1 ||
      options.fulfillmentLeaseSeconds < 30
    ) {
      throw new M2RuntimeError("PAYMENT_POLICY_INVALID", 503);
    }
  }

  async startEmailVerification(input: {
    preparationCapability: unknown;
    email: unknown;
    trustedSessionToken?: unknown;
  }): Promise<EmailVerificationStartOutcome> {
    const preparationCapabilityHash = hashOpaqueProductionCapability(
      input.preparationCapability,
    );
    const preparation =
      await this.options.repository.findPurchaseReadyPreparation(
        preparationCapabilityHash,
      );
    if (!preparation || preparation.status !== "purchase_ready") {
      throw new M2RuntimeError("PAYMENT_PURCHASE_READY_REQUIRED", 403);
    }
    const normalizedEmail = normalizeDeliveryEmail(input.email);
    const emailHash = hashDeliveryEmail(
      normalizedEmail,
      this.options.verificationPepper,
    );
    const now = this.now();
    if (input.trustedSessionToken !== undefined && input.trustedSessionToken !== null) {
      let trustedEmailBound = false;
      try {
        trustedEmailBound =
          await this.options.repository.bindTrustedEmailSessionToPreparation({
            preparationCapabilityHash,
            sessionTokenHash: hashPaymentCapability(
              input.trustedSessionToken,
              "trusted-email-session",
            ),
            emailHash,
            now,
          });
      } catch (error) {
        if (
          !(error instanceof M2RuntimeError) ||
          error.safeCode !== "PAYMENT_CAPABILITY_INVALID"
        ) {
          throw error;
        }
      }
      if (trustedEmailBound) {
        return {
          status: "trusted_session_reused",
          maskedEmail: maskDeliveryEmail(normalizedEmail),
        };
      }
    }

    const challengeCapability = this.capability();
    const verificationCode = this.verificationCode();
    const challengeId = this.uuid();
    const expiresAt = addSeconds(
      now,
      this.options.policy.challengeTtlSeconds,
    );
    await this.options.repository.createEmailChallenge({
      preparationCapabilityHash,
      challenge: {
        id: challengeId,
        preparationId: preparation.id,
        challengeCapabilityHash: hashPaymentCapability(
          challengeCapability,
          "email-challenge",
        ),
        verificationSecretHash: hashVerificationSecret({
          challengeCapability,
          verificationCode,
          pepper: this.options.verificationPepper,
        }),
        emailHash,
        emailCiphertext: encryptDeliveryEmail(
          normalizedEmail,
          this.options.emailEncryptionKey,
        ),
        status: "pending",
        attemptCount: 0,
        maximumAttempts: this.options.policy.maximumVerificationAttempts,
        expiresAt,
        verifiedEmailAuthorityId: null,
        createdAt: now,
      },
    });
    try {
      await this.options.transactionalEmail.sendMailboxVerification({
        recipientEmail: normalizedEmail,
        verificationCode,
        expiresAt,
        messageIdempotencyKey: `email-challenge:${challengeId}`,
      });
    } catch (error) {
      const safe = asM2RuntimeError(
        error,
        "EMAIL_VERIFICATION_DELIVERY_FAILED",
      );
      await this.options.repository.markEmailChallengeDeliveryFailed({
        challengeId,
        now: this.now(),
        errorCode: safe.safeCode,
      });
      throw safe;
    }
    return {
      status: "verification_sent",
      challengeCapability,
      expiresAt,
    };
  }

  async completeEmailVerification(input: {
    challengeCapability: unknown;
    verificationCode: unknown;
  }): Promise<EmailVerificationCompleteOutcome> {
    const now = this.now();
    const trustedSessionToken = this.capability();
    const trustedSessionExpiresAt = addSeconds(
      now,
      this.options.policy.trustedSessionTtlSeconds,
    );
    const context = await this.options.repository.consumeEmailChallenge({
      challengeCapabilityHash: hashPaymentCapability(
        input.challengeCapability,
        "email-challenge",
      ),
      verificationSecretHash: hashVerificationSecret({
        challengeCapability: input.challengeCapability,
        verificationCode: input.verificationCode,
        pepper: this.options.verificationPepper,
      }),
      verifiedEmailAuthorityId: this.uuid(),
      deliveryAuthorityReference: `verified-email:${this.uuid()}`,
      trustedSessionId: this.uuid(),
      trustedSessionTokenHash: hashPaymentCapability(
        trustedSessionToken,
        "trusted-email-session",
      ),
      trustedSessionExpiresAt,
      now,
    });
    if (!context) {
      throw new M2RuntimeError("EMAIL_VERIFICATION_INVALID", 403);
    }
    const normalizedEmail = decryptDeliveryEmail(
      context.authority.emailCiphertext,
      this.options.emailEncryptionKey,
    );
    return {
      status: "verified",
      maskedEmail: maskDeliveryEmail(normalizedEmail),
      trustedSessionToken,
      trustedSessionExpiresAt,
    };
  }

  private async createCheckoutForIntent(
    purchaseIntent: PurchaseIntentRecord,
    statusCapability: string,
    now: string,
  ): Promise<CheckoutStartOutcome> {
    const candidateAttemptId = this.uuid();
    const firstIdempotencyKey = deriveProviderIdempotencyKey({
      purchaseIntentId: purchaseIntent.id,
      attemptIdentity: candidateAttemptId,
      signingSecret: this.options.purchaseStatusSigningSecret,
    });
    const reserved = await this.options.repository.reservePaymentAttempt({
      purchaseIntentId: purchaseIntent.id,
      attemptId: candidateAttemptId,
      providerIdempotencyKeyHash:
        hashProviderIdempotencyKey(firstIdempotencyKey),
      now,
    });
    const attempt = reserved.attempt;
    if (attempt.providerCheckoutUrl) {
      return {
        status: "checkout_ready",
        checkoutUrl: attempt.providerCheckoutUrl,
        statusCapability,
        duplicate: true,
      };
    }
    if (!["reserved", "unknown"].includes(attempt.state)) {
      throw new M2RuntimeError("PAYMENT_ATTEMPT_RECOVERY_REQUIRED", 409);
    }
    const providerIdempotencyKey = deriveProviderIdempotencyKey({
      purchaseIntentId: purchaseIntent.id,
      attemptIdentity: attempt.id,
      signingSecret: this.options.purchaseStatusSigningSecret,
    });
    if (
      hashProviderIdempotencyKey(providerIdempotencyKey) !==
      attempt.providerIdempotencyKeyHash
    ) {
      throw new M2RuntimeError("PAYMENT_ATTEMPT_INTEGRITY_FAILED", 503);
    }
    const customerEmail = decryptDeliveryEmail(
      purchaseIntent.emailCiphertext,
      this.options.emailEncryptionKey,
    );
    let checkout;
    try {
      checkout = await this.options.checkoutProvider.createCheckoutSession({
        purchaseReference: purchaseIntent.id,
        customerEmail,
        amount: RC2_PRODUCT.amount,
        currency: RC2_PRODUCT.currency,
        mode: "payment",
        quantity: 1,
        serviceName: RC2_PRODUCT.serviceName,
        productName: RC2_PRODUCT.productName,
        productDescription: RC2_PRODUCT.description,
        successUrl: `${this.siteOrigin}/purchase/return/${statusCapability}`,
        cancelUrl: `${this.siteOrigin}/purchase/return/${statusCapability}?cancelled=1`,
        expiresAt: addSeconds(now, RC2_CHECKOUT_SESSION_EXPIRATION_SECONDS),
        idempotencyKey: providerIdempotencyKey,
        payPayEnabled: this.options.payPayEnabled,
      });
    } catch (error) {
      const safe = asM2RuntimeError(error, "PAYMENT_CHECKOUT_CREATION_UNKNOWN");
      await this.options.repository.markPaymentAttemptUnknown({
        attemptId: attempt.id,
        now: this.now(),
        errorCode: safe.safeCode,
      });
      throw safe;
    }
    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(checkout.checkoutUrl);
    } catch {
      await this.options.repository.markPaymentAttemptUnknown({
        attemptId: attempt.id,
        now: this.now(),
        errorCode: "PAYMENT_CHECKOUT_SESSION_INVALID",
      });
      throw new M2RuntimeError("PAYMENT_CHECKOUT_SESSION_INVALID", 503);
    }
    const expectedSessionPrefix =
      this.options.environment === "live" ? "cs_live_" : "cs_test_";
    const expectedSessionPattern =
      this.options.environment === "live"
        ? /^cs_live_[A-Za-z0-9_]+$/u
        : /^cs_test_[A-Za-z0-9_]+$/u;
    if (
      checkoutUrl.origin !== "https://checkout.stripe.com" ||
      checkoutUrl.username !== "" ||
      checkoutUrl.password !== "" ||
      !checkout.providerCheckoutSessionId.startsWith(expectedSessionPrefix) ||
      !expectedSessionPattern.test(checkout.providerCheckoutSessionId) ||
      checkout.providerCheckoutSessionId.length > 255
    ) {
      await this.options.repository.markPaymentAttemptUnknown({
        attemptId: attempt.id,
        now: this.now(),
        errorCode: "PAYMENT_CHECKOUT_SESSION_INVALID",
      });
      throw new M2RuntimeError("PAYMENT_CHECKOUT_SESSION_INVALID", 503);
    }
    const attached = await this.options.repository.attachCheckoutSession({
      attemptId: attempt.id,
      providerCheckoutSessionId: checkout.providerCheckoutSessionId,
      providerCheckoutUrl: checkoutUrl.toString(),
      now: this.now(),
    });
    if (!attached.providerCheckoutUrl) {
      throw new M2RuntimeError("PAYMENT_CHECKOUT_SESSION_UNAVAILABLE", 503);
    }
    return {
      status: "checkout_ready",
      checkoutUrl: attached.providerCheckoutUrl,
      statusCapability,
      duplicate: reserved.duplicate,
    };
  }

  async startCheckout(input: {
    preparationCapability: unknown;
    trustedSessionToken: unknown;
  }): Promise<CheckoutStartOutcome> {
    const now = this.now();
    const preparationCapabilityHash = hashOpaqueProductionCapability(
      input.preparationCapability,
    );
    const preparation =
      await this.options.repository.findPurchaseReadyPreparation(
        preparationCapabilityHash,
      );
    if (!preparation || preparation.status !== "purchase_ready") {
      throw new M2RuntimeError("PAYMENT_PURCHASE_READY_REQUIRED", 403);
    }
    const trustedSessionTokenHash = hashPaymentCapability(
      input.trustedSessionToken,
      "trusted-email-session",
    );
    const trusted = await this.options.repository.findTrustedEmailSession({
      sessionTokenHash: trustedSessionTokenHash,
      now,
    });
    if (!trusted) {
      throw new M2RuntimeError("PAYMENT_VERIFIED_EMAIL_REQUIRED", 403);
    }
    const candidatePurchaseIntentId = this.uuid();
    const candidateStatusCapability = derivePurchaseStatusCapability(
      candidatePurchaseIntentId,
      this.options.purchaseStatusSigningSecret,
    );
    const candidate: PurchaseIntentRecord = {
      id: candidatePurchaseIntentId,
      preparationId: preparation.id,
      verifiedEmailAuthorityId: trusted.authority.id,
      trustedEmailSessionId: trusted.session.id,
      customerOwnershipBindingId: null,
      deliveryAuthorityReference: `purchase-delivery:${candidatePurchaseIntentId}`,
      emailCiphertext: trusted.authority.emailCiphertext,
      expectedProductCode: RC2_PRODUCT.code,
      expectedAmount: RC2_PRODUCT.amount,
      currency: RC2_PRODUCT.currency,
      purchaseKind: RC2_PRODUCT.purchaseKind,
      environment: this.options.environment,
      provider: "stripe",
      state: "requires_payment",
      currentPaymentAttemptId: null,
      successfulPaymentId: null,
      statusCapabilityHash: hashPaymentCapability(
        candidateStatusCapability,
        "purchase-status",
      ),
      finalConfirmationAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const purchaseIntent = await this.options.repository.beginPurchaseIntent({
      purchaseIntent: candidate,
      preparationCapabilityHash,
      trustedSessionTokenHash,
      now,
    });
    const statusCapability = derivePurchaseStatusCapability(
      purchaseIntent.id,
      this.options.purchaseStatusSigningSecret,
    );
    if (
      hashPaymentCapability(statusCapability, "purchase-status") !==
      purchaseIntent.statusCapabilityHash
    ) {
      throw new M2RuntimeError("PAYMENT_STATUS_CAPABILITY_INTEGRITY_FAILED", 503);
    }
    return this.createCheckoutForIntent(purchaseIntent, statusCapability, now);
  }

  async startAuthenticatedCheckout(input: {
    preparationCapability: unknown;
    customerUserId: string;
  }): Promise<CheckoutStartOutcome> {
    if (!internalUuidPattern.test(input.customerUserId)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    }
    const now = this.now();
    const preparationCapabilityHash = hashOpaqueProductionCapability(
      input.preparationCapability,
    );
    const candidatePurchaseIntentId = this.uuid();
    const candidateStatusCapability = derivePurchaseStatusCapability(
      candidatePurchaseIntentId,
      this.options.purchaseStatusSigningSecret,
    );
    const candidate: PurchaseIntentRecord = {
      id: candidatePurchaseIntentId,
      preparationId: candidatePurchaseIntentId,
      verifiedEmailAuthorityId: null,
      trustedEmailSessionId: null,
      customerOwnershipBindingId: null,
      deliveryAuthorityReference: `purchase-delivery:${candidatePurchaseIntentId}`,
      emailCiphertext: "resolved-only-by-owned-database-function",
      expectedProductCode: RC2_PRODUCT.code,
      expectedAmount: RC2_PRODUCT.amount,
      currency: RC2_PRODUCT.currency,
      purchaseKind: RC2_PRODUCT.purchaseKind,
      environment: this.options.environment,
      provider: "stripe",
      state: "requires_payment",
      currentPaymentAttemptId: null,
      successfulPaymentId: null,
      statusCapabilityHash: hashPaymentCapability(
        candidateStatusCapability,
        "purchase-status",
      ),
      finalConfirmationAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const purchaseIntent =
      await this.options.repository.beginAuthenticatedPurchaseIntent({
        purchaseIntent: candidate,
        customerUserId: input.customerUserId,
        preparationCapabilityHash,
        now,
      });
    if (
      purchaseIntent.customerOwnershipBindingId === null ||
      purchaseIntent.verifiedEmailAuthorityId !== null ||
      purchaseIntent.trustedEmailSessionId !== null
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_PURCHASE_LANE_INVALID", 503);
    }
    const statusCapability = derivePurchaseStatusCapability(
      purchaseIntent.id,
      this.options.purchaseStatusSigningSecret,
    );
    if (
      hashPaymentCapability(statusCapability, "purchase-status") !==
      purchaseIntent.statusCapabilityHash
    ) {
      throw new M2RuntimeError("PAYMENT_STATUS_CAPABILITY_INTEGRITY_FAILED", 503);
    }
    return this.createCheckoutForIntent(purchaseIntent, statusCapability, now);
  }

  async startAuthenticatedCheckoutFromContinuation(input: {
    continuationToken: unknown;
    customerUserId: string;
  }): Promise<CheckoutStartOutcome> {
    if (!internalUuidPattern.test(input.customerUserId)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    }
    const now = this.now();
    const candidatePurchaseIntentId = this.uuid();
    const candidateStatusCapability = derivePurchaseStatusCapability(
      candidatePurchaseIntentId,
      this.options.purchaseStatusSigningSecret,
    );
    const candidate: PurchaseIntentRecord = {
      id: candidatePurchaseIntentId,
      preparationId: candidatePurchaseIntentId,
      verifiedEmailAuthorityId: null,
      trustedEmailSessionId: null,
      customerOwnershipBindingId: null,
      deliveryAuthorityReference: `purchase-delivery:${candidatePurchaseIntentId}`,
      emailCiphertext: "resolved-only-by-owned-database-function",
      expectedProductCode: RC2_PRODUCT.code,
      expectedAmount: RC2_PRODUCT.amount,
      currency: RC2_PRODUCT.currency,
      purchaseKind: RC2_PRODUCT.purchaseKind,
      environment: this.options.environment,
      provider: "stripe",
      state: "requires_payment",
      currentPaymentAttemptId: null,
      successfulPaymentId: null,
      statusCapabilityHash: hashPaymentCapability(
        candidateStatusCapability,
        "purchase-status",
      ),
      finalConfirmationAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const purchaseIntent =
      await this.options.repository.beginAuthenticatedPurchaseIntentFromContinuation({
        purchaseIntent: candidate,
        customerUserId: input.customerUserId,
        continuationTokenHash: hashPaymentCapability(
          input.continuationToken,
          "customer-auth-continuation",
        ),
        now,
      });
    if (
      purchaseIntent.customerOwnershipBindingId === null ||
      purchaseIntent.verifiedEmailAuthorityId !== null ||
      purchaseIntent.trustedEmailSessionId !== null
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_PURCHASE_LANE_INVALID", 503);
    }
    const statusCapability = derivePurchaseStatusCapability(
      purchaseIntent.id,
      this.options.purchaseStatusSigningSecret,
    );
    if (
      hashPaymentCapability(statusCapability, "purchase-status") !==
      purchaseIntent.statusCapabilityHash
    ) {
      throw new M2RuntimeError("PAYMENT_STATUS_CAPABILITY_INTEGRITY_FAILED", 503);
    }
    return this.createCheckoutForIntent(purchaseIntent, statusCapability, now);
  }

  async restartCheckout(input: {
    statusCapability: unknown;
    trustedSessionToken: unknown;
  }): Promise<CheckoutStartOutcome> {
    const now = this.now();
    const statusCapabilityHash = hashPaymentCapability(
      input.statusCapability,
      "purchase-status",
    );
    const status =
      await this.options.repository.findPurchaseStatus(statusCapabilityHash);
    if (!status) {
      throw new M2RuntimeError("PAYMENT_STATUS_NOT_FOUND", 404);
    }
    const intent = status.purchaseIntent;
    if (intent.state !== "payment_failed" && intent.state !== "canceled") {
      throw new M2RuntimeError("PAYMENT_NEW_ATTEMPT_PROHIBITED", 409);
    }
    const trusted = await this.options.repository.findTrustedEmailSession({
      sessionTokenHash: hashPaymentCapability(
        input.trustedSessionToken,
        "trusted-email-session",
      ),
      now,
    });
    if (
      !trusted ||
      trusted.authority.id !== intent.verifiedEmailAuthorityId ||
      trusted.session.id !== intent.trustedEmailSessionId
    ) {
      throw new M2RuntimeError("PAYMENT_VERIFIED_EMAIL_REQUIRED", 403);
    }
    const statusCapability = derivePurchaseStatusCapability(
      intent.id,
      this.options.purchaseStatusSigningSecret,
    );
    if (
      statusCapability !== input.statusCapability ||
      hashPaymentCapability(statusCapability, "purchase-status") !==
        intent.statusCapabilityHash
    ) {
      throw new M2RuntimeError("PAYMENT_STATUS_CAPABILITY_INTEGRITY_FAILED", 503);
    }
    return this.createCheckoutForIntent(intent, statusCapability, now);
  }

  async restartAuthenticatedCheckout(input: {
    statusCapability: unknown;
    customerUserId: string;
  }): Promise<CheckoutStartOutcome> {
    if (!internalUuidPattern.test(input.customerUserId)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    }
    const now = this.now();
    const statusCapabilityHash = hashPaymentCapability(
      input.statusCapability,
      "purchase-status",
    );
    const status = await this.options.repository.findAuthenticatedPurchaseStatus({
      customerUserId: input.customerUserId,
      statusCapabilityHash,
    });
    if (!status) throw new M2RuntimeError("PAYMENT_STATUS_NOT_FOUND", 404);
    const intent = status.purchaseIntent;
    if (intent.state !== "payment_failed" && intent.state !== "canceled") {
      throw new M2RuntimeError("PAYMENT_NEW_ATTEMPT_PROHIBITED", 409);
    }
    const statusCapability = derivePurchaseStatusCapability(
      intent.id,
      this.options.purchaseStatusSigningSecret,
    );
    if (
      statusCapability !== input.statusCapability ||
      hashPaymentCapability(statusCapability, "purchase-status") !==
        intent.statusCapabilityHash
    ) {
      throw new M2RuntimeError("PAYMENT_STATUS_CAPABILITY_INTEGRITY_FAILED", 503);
    }
    return this.createCheckoutForIntent(intent, statusCapability, now);
  }

  private async evaluateStripeEvidence(
    evidence: StripePaymentEvidenceV1,
  ): Promise<PaymentEvidenceVerification> {
    const evidenceIdentityValid =
      (evidence.evidenceSource === "webhook" &&
        /^evt_[A-Za-z0-9_]+$/u.test(evidence.providerEventId)) ||
      (evidence.evidenceSource === "reconciliation" &&
        /^reconcile_[0-9a-f]{64}$/u.test(evidence.providerEventId));
    if (
      !evidenceIdentityValid ||
      !/^[0-9a-f]{64}$/u.test(evidence.payloadSha256) ||
      !Number.isFinite(Date.parse(evidence.providerCreatedAt))
    ) {
      return {
        disposition: "rejected",
        reasonCode: "PAYMENT_EVIDENCE_IDENTITY_INVALID",
      };
    }
    const intent =
      await this.options.repository.findPurchaseIntentByReference(
        evidence.purchaseReference,
      );
    const attempt =
      await this.options.repository.findPaymentAttemptByCheckoutSession(
        evidence.providerCheckoutSessionId,
      );
    if (!intent || !attempt || attempt.purchaseIntentId !== intent.id) {
      return { disposition: "rejected", reasonCode: "PAYMENT_BINDING_INVALID" };
    }
    if (
      intent.expectedProductCode !== RC2_PRODUCT.code ||
      intent.expectedAmount !== RC2_PRODUCT.amount ||
      intent.currency !== RC2_PRODUCT.currency ||
      intent.purchaseKind !== RC2_PRODUCT.purchaseKind ||
      intent.environment !== evidence.environment ||
      intent.provider !== "stripe"
    ) {
      return { disposition: "rejected", reasonCode: "PAYMENT_EXPECTATION_INVALID" };
    }
    if (evidence.mode !== "payment") {
      return { disposition: "rejected", reasonCode: "PAYMENT_MODE_INVALID" };
    }
    const successEvent =
      evidence.eventType === "checkout.session.completed" ||
      evidence.eventType === "checkout.session.async_payment_succeeded";
    if (successEvent && evidence.paymentStatus === "paid") {
      if (
        evidence.amountTotal !== RC2_PRODUCT.amount ||
        evidence.currency?.toLowerCase() !== RC2_PRODUCT.currency ||
        !evidence.providerPaymentId
      ) {
        return {
          disposition: "rejected",
          reasonCode: "PAYMENT_ECONOMIC_EVIDENCE_INVALID",
        };
      }
      return { disposition: "verified", reasonCode: null };
    }
    if (evidence.eventType === "checkout.session.async_payment_failed") {
      return { disposition: "failed", reasonCode: null };
    }
    if (evidence.eventType === "checkout.session.expired") {
      return { disposition: "canceled", reasonCode: null };
    }
    return { disposition: "pending", reasonCode: null };
  }

  async verifyStripeEvidence(
    evidence: StripePaymentEvidenceV1,
    dispatchFulfillment = true,
  ): Promise<RecordedPaymentEvidence> {
    const verification = await this.evaluateStripeEvidence(evidence);
    const recorded = await this.options.repository.recordStripeEvidence({
      evidence,
      verification,
      verifiedPaymentId: this.uuid(),
      fulfillmentJobId: this.uuid(),
      now: this.now(),
    });
    this.options.onVerifiedPaymentRecorded?.(recorded);
    if (
      dispatchFulfillment &&
      recorded.fulfillmentJobId &&
      (recorded.disposition === "verified" ||
        recorded.disposition === "duplicate")
    ) {
      await this.requestFulfillmentDispatch(recorded.fulfillmentJobId, true);
    }
    return recorded;
  }

  async reconcilePaymentAttempt(
    paymentAttemptId: unknown,
    options: { dispatchFulfillment?: boolean } = {},
  ): Promise<RecordedPaymentEvidence> {
    if (
      typeof paymentAttemptId !== "string" ||
      !internalUuidPattern.test(paymentAttemptId)
    ) {
      throw new M2RuntimeError("PAYMENT_RECONCILIATION_REQUEST_INVALID", 400);
    }
    const attempt =
      await this.options.repository.findPaymentAttemptById(paymentAttemptId);
    if (!attempt) {
      throw new M2RuntimeError("PAYMENT_ATTEMPT_NOT_FOUND", 404);
    }
    if (!attempt.providerCheckoutSessionId) {
      throw new M2RuntimeError(
        "PAYMENT_RECONCILIATION_SESSION_REQUIRED",
        409,
      );
    }
    let evidence: StripePaymentEvidenceV1;
    try {
      evidence = await this.options.checkoutProvider.retrieveCheckoutSession({
        providerCheckoutSessionId: attempt.providerCheckoutSessionId,
        observedAt: this.now(),
      });
      if (
        evidence.evidenceSource !== "reconciliation" ||
        evidence.providerCheckoutSessionId !==
          attempt.providerCheckoutSessionId ||
        evidence.purchaseReference !== attempt.purchaseIntentId
      ) {
        throw new M2RuntimeError("PAYMENT_RECONCILIATION_EVIDENCE_INVALID", 503);
      }
    } catch (error) {
      if (
        ["reserved", "pending", "processing", "unknown"].includes(
          attempt.state,
        )
      ) {
        await this.options.repository.markPaymentAttemptUnknown({
          attemptId: attempt.id,
          now: this.now(),
          errorCode: "PAYMENT_RECONCILIATION_UNKNOWN",
        });
      }
      throw asM2RuntimeError(error, "PAYMENT_RECONCILIATION_UNKNOWN");
    }
    return this.verifyStripeEvidence(
      evidence,
      options.dispatchFulfillment ?? true,
    );
  }

  async dispatchFulfillmentJob(jobId: unknown) {
    if (typeof jobId !== "string" || !internalUuidPattern.test(jobId)) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_INVALID", 400);
    }
    return this.requestFulfillmentDispatch(jobId);
  }

  private async processClaimedFulfillmentJob(
    claim: FulfillmentJobClaim,
    ownerId: string,
  ): Promise<FulfillmentClaimOutcome> {
    if (claim.disposition === "in_progress") {
      return { status: "in_progress" };
    }
    if (claim.disposition === "manual_review") {
      return { status: "manual_review" };
    }
    const job = claim.job;
    const processNotification = async () => {
      try {
        await this.options.grantProcessor.processResultNotification(
          job.deliveryAuthorityReference,
        );
        return { pending: false, manualReview: false };
      } catch (error) {
        const safe = asM2RuntimeError(
          error,
          "PRODUCTION_NOTIFICATION_DELIVERY_FAILED",
        );
        if (safe.safeCode === "PRODUCTION_NOTIFICATION_MANUAL_REVIEW") {
          return { pending: false, manualReview: true };
        }
        // The durable RC-1 outbox and Async Workloads retry this independently.
        return { pending: true, manualReview: false };
      }
    };
    if (claim.disposition === "completed") {
      const notification = await processNotification();
      return {
        status: "completed",
        resultToken: null,
        notificationPending: notification.pending,
        notificationManualReview: notification.manualReview,
      };
    }
    let grant: AssessmentGrantHandleV1;
    try {
      if (job.grantId && job.logicalAssessmentId) {
        grant = {
          schemaVersion: "rc1-assessment-grant-handle-v1",
          grantId: job.grantId,
          logicalAssessmentId: job.logicalAssessmentId,
        };
      } else if (job.grantId || job.logicalAssessmentId) {
        throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_INVALID", 503);
      } else {
        const authority: VerifiedPurchaseAuthorityV1 = {
          schemaVersion: VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION,
          verificationSource: "future_verified_payment",
          purchaseAuthorityReference: `verified-payment:${job.verifiedPaymentId}`,
          verifiedPaymentId: job.verifiedPaymentId,
          preparationId: job.preparationId,
          deliveryAuthorityReference: job.deliveryAuthorityReference,
        };
        grant =
          await this.options.grantProcessor.issueProductionAssessmentGrant(
            authority,
          );
      }
      const fulfilled =
        await this.options.grantProcessor.fulfillProductionAssessmentGrant(grant);
      if (claim.disposition === "acquired") {
        await this.options.repository.completeFulfillmentJob({
          jobId: job.id,
          ownerId,
          now: this.now(),
        });
      }
      const notification = await processNotification();
      return {
        status: "completed",
        resultToken: fulfilled.resultToken,
        notificationPending: notification.pending,
        notificationManualReview: notification.manualReview,
      };
    } catch (error) {
      const safe = asM2RuntimeError(error, "PAYMENT_FULFILLMENT_FAILED");
      if (claim.disposition === "acquired") {
        try {
          await this.options.repository.failFulfillmentJob({
            jobId: job.id,
            ownerId,
            errorCode: safe.safeCode,
            now: this.now(),
          });
        } catch {
          // A lost or reclaimed lease must not overwrite the current owner.
        }
      }
      if (safe.safeCode === "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS") {
        return { status: "manual_review" };
      }
      return { status: "temporary_problem", retryable: true };
    }
  }

  private async requestFulfillmentDispatch(
    jobId: string,
    requireRouterAcceptance = false,
  ) {
    await requestProductionFulfillmentDispatch({
      repository: this.options.repository,
      dispatcher: this.options.fulfillmentDispatcher,
      jobId,
      now: this.now,
      uuid: this.uuid,
      requireRouterAcceptance,
    });
  }

  private async discloseCompletedResult(
    purchaseIntent: PurchaseIntentRecord,
    resultToken: string,
    trustedSessionToken: unknown,
  ): Promise<CustomerPurchaseStatus> {
    if (trustedSessionToken === undefined || trustedSessionToken === null) {
      return {
        status: "completed_check_verified_email",
        paymentVerified: true,
        accountFallback: false,
      };
    }
    let sessionTokenHash: string;
    try {
      sessionTokenHash = hashPaymentCapability(
        trustedSessionToken,
        "trusted-email-session",
      );
    } catch (error) {
      if (
        error instanceof M2RuntimeError &&
        error.safeCode === "PAYMENT_CAPABILITY_INVALID"
      ) {
        return {
          status: "completed_check_verified_email",
          paymentVerified: true,
          accountFallback: false,
        };
      }
      throw error;
    }
    const trusted = await this.options.repository.findTrustedEmailSession({
      sessionTokenHash,
      now: this.now(),
    });
    if (
      !trusted ||
      trusted.authority.id !== purchaseIntent.verifiedEmailAuthorityId ||
      trusted.session.id !== purchaseIntent.trustedEmailSessionId
    ) {
      return {
        status: "completed_check_verified_email",
        paymentVerified: true,
        accountFallback: false,
      };
    }
    const resultPath = parseCustomerResultPath(`/result/${resultToken}`);
    if (!resultPath) {
      return {
        status: "temporary_problem",
        paymentVerified: true,
        accountFallback: false,
        retryable: true,
      };
    }
    return {
      status: "completed",
      paymentVerified: true,
      accountFallback: false,
      resultPath,
    };
  }

  async processPurchaseStatus(
    statusCapability: unknown,
    trustedSessionToken?: unknown,
  ): Promise<CustomerPurchaseStatus> {
    const statusCapabilityHash = hashPaymentCapability(
      statusCapability,
      "purchase-status",
    );
    const status =
      await this.options.repository.findPurchaseStatus(statusCapabilityHash);
    if (!status) {
      throw new M2RuntimeError("PAYMENT_STATUS_NOT_FOUND", 404);
    }
    if (status.purchaseIntent.state === "manual_review") {
      return confirmationPendingStatus(status.purchaseIntent, false);
    }
    if (status.purchaseIntent.state !== "verified") {
      if (
        status.purchaseIntent.state === "payment_failed" ||
        status.purchaseIntent.state === "canceled"
      ) {
        return {
          status: "payment_not_completed",
          paymentVerified: false,
          accountFallback: false,
        };
      }
      return {
        status: "confirming_payment",
        paymentVerified: false,
        accountFallback: false,
      };
    }
    if (status.purchaseIntent.successfulPaymentId === null) {
      return confirmationPendingStatus(status.purchaseIntent, false);
    }
    const job = status.fulfillmentJob;
    if (!job) {
      return {
        status: "temporary_problem",
        paymentVerified: true,
        accountFallback: false,
        retryable: true,
      };
    }
    if (job.state === "manual_review") {
      return confirmationPendingStatus(status.purchaseIntent, false);
    }
    if (
      job.lastErrorCode === "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED"
    ) {
      return confirmationPendingStatus(status.purchaseIntent, false);
    }
    if (job.state === "completed") {
      if (!job.grantId || !job.logicalAssessmentId) {
        return confirmationPendingStatus(status.purchaseIntent, false);
      }
      try {
        const fulfilled =
          await this.options.grantProcessor.recoverCompletedProductionAssessmentGrant({
            schemaVersion: "rc1-assessment-grant-handle-v1",
            grantId: job.grantId,
            logicalAssessmentId: job.logicalAssessmentId,
          });
        return await this.discloseCompletedResult(
          status.purchaseIntent,
          fulfilled.resultToken,
          trustedSessionToken,
        );
      } catch {
        return {
          status: "temporary_problem",
          paymentVerified: true,
          accountFallback: false,
          retryable: true,
        };
      }
    }
    try {
      await this.requestFulfillmentDispatch(job.id);
    } catch {
      return {
        status: "temporary_problem",
        paymentVerified: true,
        accountFallback: false,
        retryable: true,
      };
    }
    return {
      status: "preparing_assessment",
      paymentVerified: true,
      accountFallback: false,
    };
  }

  async processAuthenticatedPurchaseStatus(
    statusCapability: unknown,
    customerUserId: string,
  ): Promise<CustomerPurchaseStatus> {
    if (!internalUuidPattern.test(customerUserId)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_REQUIRED", 401);
    }
    const statusCapabilityHash = hashPaymentCapability(
      statusCapability,
      "purchase-status",
    );
    const status = await this.options.repository.findAuthenticatedPurchaseStatus({
      customerUserId,
      statusCapabilityHash,
    });
    if (!status) throw new M2RuntimeError("PAYMENT_STATUS_NOT_FOUND", 404);
    if (status.purchaseIntent.state === "manual_review") {
      return confirmationPendingStatus(status.purchaseIntent, true);
    }
    if (status.purchaseIntent.state !== "verified") {
      if (
        status.purchaseIntent.state === "payment_failed" ||
        status.purchaseIntent.state === "canceled"
      ) {
        return {
          status: "payment_not_completed",
          paymentVerified: false,
          accountFallback: true,
        };
      }
      return {
        status: "confirming_payment",
        paymentVerified: false,
        accountFallback: true,
      };
    }
    if (status.purchaseIntent.successfulPaymentId === null) {
      return confirmationPendingStatus(status.purchaseIntent, true);
    }
    const job = status.fulfillmentJob;
    if (!job) {
      return {
        status: "temporary_problem",
        paymentVerified: true,
        accountFallback: true,
        retryable: true,
      };
    }
    if (job.state === "manual_review") {
      return confirmationPendingStatus(status.purchaseIntent, true);
    }
    if (
      job.lastErrorCode === "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED"
    ) {
      return confirmationPendingStatus(status.purchaseIntent, true);
    }
    if (job.state === "completed") {
      const deliveryId =
        await this.options.repository.resolveAuthenticatedResultDeliveryId({
          customerUserId,
          purchaseIntentId: status.purchaseIntent.id,
        });
      if (!deliveryId) {
        return {
          status: "temporary_problem",
          paymentVerified: true,
          accountFallback: true,
          retryable: true,
        };
      }
      const resultPath = parseCustomerResultPath(
        `/account/results/${deliveryId}`,
      );
      if (!resultPath) {
        return {
          status: "temporary_problem",
          paymentVerified: true,
          accountFallback: true,
          retryable: true,
        };
      }
      return {
        status: "completed",
        paymentVerified: true,
        accountFallback: true,
        resultPath,
      };
    }
    try {
      await this.requestFulfillmentDispatch(job.id);
    } catch {
      return {
        status: "temporary_problem",
        paymentVerified: true,
        accountFallback: true,
        retryable: true,
      };
    }
    return {
      status: "preparing_assessment",
      paymentVerified: true,
      accountFallback: true,
    };
  }

  async processFulfillmentJobById(
    jobId: unknown,
  ): Promise<ServerFulfillmentOutcome> {
    if (typeof jobId !== "string" || !internalUuidPattern.test(jobId)) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_ID_INVALID", 400);
    }
    const now = this.now();
    const ownerId = this.uuid();
    const claim = await this.options.repository.claimFulfillmentJobById({
      jobId,
      ownerId,
      leaseExpiresAt: addSeconds(
        now,
        this.options.fulfillmentLeaseSeconds,
      ),
      now,
    });
    if (!claim) {
      return { status: "temporary_problem", retryable: true };
    }
    const outcome = await this.processClaimedFulfillmentJob(claim, ownerId);
    if (outcome.status === "completed") {
      return {
        status: "completed",
        notificationPending: outcome.notificationPending,
        notificationManualReview: outcome.notificationManualReview,
      };
    }
    return outcome;
  }

  async quarantineFulfillmentJobAfterAsyncRetryExhaustion(
    jobId: unknown,
  ): Promise<FulfillmentRetryExhaustionOutcome> {
    if (typeof jobId !== "string" || !internalUuidPattern.test(jobId)) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_ID_INVALID", 400);
    }
    const outcome =
      await this.options.repository.quarantineFulfillmentJobAfterAsyncRetryExhaustion(
        { jobId, now: this.now() },
      );
    if (!outcome) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_INVALID", 503);
    }
    return outcome;
  }
}
