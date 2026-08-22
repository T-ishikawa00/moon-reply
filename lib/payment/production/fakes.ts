import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  AssessmentGrantHandleV1,
  ProductionFulfillmentResultV1,
  VerifiedPurchaseAuthorityV1,
} from "../../assessment/production/types.ts";
import { equalSha256 } from "./crypto.ts";
import {
  buildStripeReconciliationEvidenceV1,
  type StripeCheckoutSessionSnapshotV1,
} from "./stripe.ts";
import type {
  CheckoutProviderV1,
  CheckoutSessionRequestV1,
  EmailChallengeRecord,
  FulfillmentDispatchClaim,
  FulfillmentJobClaim,
  FulfillmentJobRecord,
  FulfillmentRetryExhaustionOutcome,
  PaymentAttemptRecord,
  PaymentDeliveryRepository,
  PreparationEmailBinding,
  ProductionFulfillmentDispatcherV1,
  ProductionGrantProcessorV1,
  PurchaseIntentRecord,
  PurchaseReadyPreparation,
  PurchaseStatusRecord,
  RecordedPaymentEvidence,
  StripePaymentEvidenceV1,
  TrustedEmailContext,
  TrustedEmailSession,
  VerifiedEmailAuthority,
} from "./types.ts";

function clone<T>(value: T): T {
  return structuredClone(value);
}

type Mutable<T> = { -readonly [Key in keyof T]: T[Key] };

type SeededPreparation = PurchaseReadyPreparation & {
  preparationCapabilityHash: string;
};

type FakeVerifiedPayment = {
  id: string;
  purchaseIntentId: string;
  paymentAttemptId: string;
  providerPaymentId: string;
  providerCheckoutSessionId: string;
};

type FakeFulfillmentDispatch = {
  marker: string;
  ownerId: string | null;
  leaseExpiresAt: string | null;
  retryAfter: string | null;
  completedAt: string | null;
  lastErrorCode: string | null;
};

export class FakePaymentDeliveryRepository
  implements PaymentDeliveryRepository
{
  readonly preparations = new Map<string, SeededPreparation>();
  readonly challenges = new Map<string, Mutable<EmailChallengeRecord>>();
  readonly authorities = new Map<string, Mutable<VerifiedEmailAuthority>>();
  readonly sessions = new Map<string, Mutable<TrustedEmailSession>>();
  readonly deliveryEmailBindings = new Map<
    string,
    Mutable<PreparationEmailBinding>
  >();
  readonly intents = new Map<string, Mutable<PurchaseIntentRecord>>();
  readonly attempts = new Map<string, Mutable<PaymentAttemptRecord>>();
  readonly evidence = new Map<
    string,
    { event: StripePaymentEvidenceV1; disposition: string }
  >();
  readonly verifiedPayments = new Map<string, FakeVerifiedPayment>();
  readonly jobs = new Map<string, Mutable<FulfillmentJobRecord>>();
  readonly dispatches = new Map<string, FakeFulfillmentDispatch>();
  readonly authenticatedBindings = new Map<
    string,
    { bindingId: string; customerUserId: string; emailCiphertext: string }
  >();
  readonly authenticatedResultDeliveries = new Map<string, string>();
  dispatchCompletionFailuresRemaining = 0;

  seedPurchaseReady(input: {
    id: string;
    preparationCapabilityHash: string;
    purchaseReadyAuthorityHash?: string;
  }) {
    this.preparations.set(input.id, {
      id: input.id,
      status: "purchase_ready",
      preparationCapabilityHash: input.preparationCapabilityHash,
      purchaseReadyAuthorityHash:
        input.purchaseReadyAuthorityHash ?? "a".repeat(64),
    });
  }

  seedAuthenticatedBinding(input: {
    preparationId: string;
    bindingId: string;
    customerUserId: string;
    emailCiphertext: string;
  }) {
    this.authenticatedBindings.set(input.preparationId, {
      bindingId: input.bindingId,
      customerUserId: input.customerUserId,
      emailCiphertext: input.emailCiphertext,
    });
  }

  async findPurchaseReadyPreparation(preparationCapabilityHash: string) {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.preparationCapabilityHash === preparationCapabilityHash,
    );
    return preparation ? clone(preparation) : null;
  }

  async findTrustedEmailSession(input: {
    sessionTokenHash: string;
    emailHash?: string;
    now: string;
  }): Promise<TrustedEmailContext | null> {
    const session = [...this.sessions.values()].find(
      (candidate) => candidate.sessionTokenHash === input.sessionTokenHash,
    );
    if (
      !session ||
      session.revokedAt !== null ||
      Date.parse(session.expiresAt) <= Date.parse(input.now)
    ) {
      return null;
    }
    const authority = this.authorities.get(session.verifiedEmailAuthorityId);
    if (
      !authority ||
      authority.revokedAt !== null ||
      (input.emailHash !== undefined && authority.emailHash !== input.emailHash)
    ) {
      return null;
    }
    return { session: clone(session), authority: clone(authority) };
  }

  async bindTrustedEmailSessionToPreparation(input: {
    preparationCapabilityHash: string;
    sessionTokenHash: string;
    emailHash: string;
    now: string;
  }) {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.preparationCapabilityHash ===
          input.preparationCapabilityHash &&
        candidate.status === "purchase_ready",
    );
    if (!preparation) {
      throw new M2RuntimeError("PAYMENT_PURCHASE_READY_REQUIRED", 403);
    }
    const trusted = await this.findTrustedEmailSession({
      sessionTokenHash: input.sessionTokenHash,
      emailHash: input.emailHash,
      now: input.now,
    });
    if (!trusted) return false;
    const existingIntent = [...this.intents.values()].find(
      (intent) => intent.preparationId === preparation.id,
    );
    const existingBinding = this.deliveryEmailBindings.get(preparation.id);
    if (existingIntent) {
      return Boolean(
        existingBinding?.state === "verified" &&
          existingBinding.intendedEmailHash === trusted.authority.emailHash &&
          existingBinding.verifiedEmailAuthorityId === trusted.authority.id &&
          existingBinding.trustedEmailSessionId === trusted.session.id,
      );
    }
    this.deliveryEmailBindings.set(preparation.id, {
      preparationId: preparation.id,
      intendedEmailHash: trusted.authority.emailHash,
      verifiedEmailAuthorityId: trusted.authority.id,
      trustedEmailSessionId: trusted.session.id,
      state: "verified",
      updatedAt: input.now,
    });
    return true;
  }

  async createEmailChallenge(input: {
    preparationCapabilityHash: string;
    challenge: EmailChallengeRecord;
  }) {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.preparationCapabilityHash ===
          input.preparationCapabilityHash &&
        candidate.id === input.challenge.preparationId &&
        candidate.status === "purchase_ready",
    );
    if (!preparation) {
      throw new M2RuntimeError("PAYMENT_PURCHASE_READY_REQUIRED", 403);
    }
    if (
      [...this.intents.values()].some(
        (intent) => intent.preparationId === preparation.id,
      )
    ) {
      throw new M2RuntimeError("PAYMENT_PURCHASE_INTENT_CONFLICT", 409);
    }
    for (const challenge of this.challenges.values()) {
      if (
        challenge.preparationId === preparation.id &&
        challenge.status === "pending"
      ) {
        challenge.status = "revoked";
      }
    }
    this.challenges.set(input.challenge.id, clone(input.challenge));
    this.deliveryEmailBindings.set(preparation.id, {
      preparationId: preparation.id,
      intendedEmailHash: input.challenge.emailHash,
      verifiedEmailAuthorityId: null,
      trustedEmailSessionId: null,
      state: "verification_pending",
      updatedAt: input.challenge.createdAt,
    });
  }

  async markEmailChallengeDeliveryFailed(input: {
    challengeId: string;
    now: string;
    errorCode: string;
  }) {
    void input.now;
    void input.errorCode;
    const challenge = this.challenges.get(input.challengeId);
    if (challenge?.status === "pending") challenge.status = "delivery_failed";
  }

  async consumeEmailChallenge(input: {
    challengeCapabilityHash: string;
    verificationSecretHash: string;
    verifiedEmailAuthorityId: string;
    deliveryAuthorityReference: string;
    trustedSessionId: string;
    trustedSessionTokenHash: string;
    trustedSessionExpiresAt: string;
    now: string;
  }): Promise<TrustedEmailContext | null> {
    const challenge = [...this.challenges.values()].find(
      (candidate) =>
        candidate.challengeCapabilityHash === input.challengeCapabilityHash,
    );
    if (
      !challenge ||
      challenge.status !== "pending" ||
      Date.parse(challenge.expiresAt) <= Date.parse(input.now)
    ) {
      return null;
    }
    if (
      !equalSha256(
        challenge.verificationSecretHash,
        input.verificationSecretHash,
      )
    ) {
      challenge.attemptCount += 1;
      if (challenge.attemptCount >= challenge.maximumAttempts) {
        challenge.status = "revoked";
      }
      return null;
    }
    const binding = this.deliveryEmailBindings.get(challenge.preparationId);
    if (
      !binding ||
      binding.state !== "verification_pending" ||
      binding.intendedEmailHash !== challenge.emailHash
    ) {
      return null;
    }
    challenge.status = "consumed";
    const authority: Mutable<VerifiedEmailAuthority> = {
      id: input.verifiedEmailAuthorityId,
      deliveryAuthorityReference: input.deliveryAuthorityReference,
      emailHash: challenge.emailHash,
      emailCiphertext: challenge.emailCiphertext,
      verifiedAt: input.now,
      revokedAt: null,
    };
    challenge.verifiedEmailAuthorityId = authority.id;
    const session: Mutable<TrustedEmailSession> = {
      id: input.trustedSessionId,
      verifiedEmailAuthorityId: authority.id,
      sessionTokenHash: input.trustedSessionTokenHash,
      expiresAt: input.trustedSessionExpiresAt,
      revokedAt: null,
    };
    this.authorities.set(authority.id, authority);
    this.sessions.set(session.id, session);
    this.deliveryEmailBindings.set(challenge.preparationId, {
      preparationId: challenge.preparationId,
      intendedEmailHash: challenge.emailHash,
      verifiedEmailAuthorityId: authority.id,
      trustedEmailSessionId: session.id,
      state: "verified",
      updatedAt: input.now,
    });
    return { authority: clone(authority), session: clone(session) };
  }

  async beginPurchaseIntent(input: {
    purchaseIntent: PurchaseIntentRecord;
    preparationCapabilityHash: string;
    trustedSessionTokenHash: string;
    now: string;
  }) {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.preparationCapabilityHash ===
          input.preparationCapabilityHash &&
        candidate.id === input.purchaseIntent.preparationId &&
        candidate.status === "purchase_ready",
    );
    const trusted = await this.findTrustedEmailSession({
      sessionTokenHash: input.trustedSessionTokenHash,
      now: input.now,
    });
    const binding = preparation
      ? this.deliveryEmailBindings.get(preparation.id)
      : null;
    if (
      !preparation ||
      !trusted ||
      !binding ||
      binding.state !== "verified" ||
      binding.intendedEmailHash !== trusted.authority.emailHash ||
      binding.verifiedEmailAuthorityId !== trusted.authority.id ||
      binding.trustedEmailSessionId !== trusted.session.id ||
      trusted.authority.id !== input.purchaseIntent.verifiedEmailAuthorityId ||
      trusted.session.id !== input.purchaseIntent.trustedEmailSessionId
    ) {
      throw new M2RuntimeError("PAYMENT_VERIFIED_EMAIL_REQUIRED", 403);
    }
    const existing = [...this.intents.values()].find(
      (candidate) => candidate.preparationId === preparation.id,
    );
    if (existing) {
      if (
        existing.verifiedEmailAuthorityId !== trusted.authority.id ||
        existing.trustedEmailSessionId !== trusted.session.id ||
        existing.environment !== input.purchaseIntent.environment ||
        existing.expectedAmount !== input.purchaseIntent.expectedAmount ||
        existing.currency !== input.purchaseIntent.currency ||
        existing.expectedProductCode !==
          input.purchaseIntent.expectedProductCode
      ) {
        throw new M2RuntimeError("PAYMENT_PURCHASE_INTENT_CONFLICT", 409);
      }
      return clone(existing);
    }
    this.intents.set(input.purchaseIntent.id, clone(input.purchaseIntent));
    return clone(input.purchaseIntent);
  }

  async beginAuthenticatedPurchaseIntent(input: {
    purchaseIntent: PurchaseIntentRecord;
    customerUserId: string;
    preparationCapabilityHash: string;
    now: string;
  }) {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.preparationCapabilityHash === input.preparationCapabilityHash &&
        candidate.status === "purchase_ready",
    );
    const binding = preparation
      ? this.authenticatedBindings.get(preparation.id)
      : null;
    if (!preparation || !binding || binding.customerUserId !== input.customerUserId) {
      throw new M2RuntimeError("CUSTOMER_AUTH_OWNERSHIP_REQUIRED", 403);
    }
    const existing = [...this.intents.values()].find(
      (candidate) => candidate.preparationId === preparation.id,
    );
    if (existing) {
      if (
        existing.customerOwnershipBindingId !== binding.bindingId ||
        existing.verifiedEmailAuthorityId !== null ||
        existing.trustedEmailSessionId !== null
      ) {
        throw new M2RuntimeError("CUSTOMER_AUTH_PURCHASE_INTENT_CONFLICT", 409);
      }
      return clone(existing);
    }
    const intent: Mutable<PurchaseIntentRecord> = {
      ...clone(input.purchaseIntent),
      preparationId: preparation.id,
      customerOwnershipBindingId: binding.bindingId,
      verifiedEmailAuthorityId: null,
      trustedEmailSessionId: null,
      emailCiphertext: binding.emailCiphertext,
      finalConfirmationAcceptedAt: input.now,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.intents.set(intent.id, intent);
    return clone(intent);
  }

  async beginAuthenticatedPurchaseIntentFromContinuation(input: {
    purchaseIntent: PurchaseIntentRecord;
    customerUserId: string;
    continuationTokenHash: string;
    now: string;
  }) {
    const preparation = [...this.preparations.values()].find(
      (candidate) => candidate.preparationCapabilityHash === input.continuationTokenHash,
    );
    if (!preparation) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
    }
    return this.beginAuthenticatedPurchaseIntent({
      purchaseIntent: input.purchaseIntent,
      customerUserId: input.customerUserId,
      preparationCapabilityHash: preparation.preparationCapabilityHash,
      now: input.now,
    });
  }

  async reservePaymentAttempt(input: {
    purchaseIntentId: string;
    attemptId: string;
    providerIdempotencyKeyHash: string;
    now: string;
  }) {
    const intent = this.intents.get(input.purchaseIntentId);
    if (!intent) {
      throw new M2RuntimeError("PAYMENT_PURCHASE_INTENT_NOT_FOUND", 404);
    }
    const current = intent.currentPaymentAttemptId
      ? this.attempts.get(intent.currentPaymentAttemptId)
      : null;
    if (
      current &&
      ["reserved", "pending", "processing", "unknown", "succeeded"].includes(
        current.state,
      )
    ) {
      return { attempt: clone(current), duplicate: true };
    }
    if (intent.state === "verified" || intent.state === "manual_review") {
      throw new M2RuntimeError("PAYMENT_NEW_ATTEMPT_PROHIBITED", 409);
    }
    const sequence = current ? current.sequence + 1 : 1;
    const attempt: Mutable<PaymentAttemptRecord> = {
      id: input.attemptId,
      purchaseIntentId: intent.id,
      sequence,
      state: "reserved",
      providerIdempotencyKeyHash: input.providerIdempotencyKeyHash,
      providerCheckoutSessionId: null,
      providerPaymentId: null,
      providerCheckoutUrl: null,
      lastProviderEventCreatedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.attempts.set(attempt.id, attempt);
    intent.currentPaymentAttemptId = attempt.id;
    intent.updatedAt = input.now;
    return { attempt: clone(attempt), duplicate: false };
  }

  async attachCheckoutSession(input: {
    attemptId: string;
    providerCheckoutSessionId: string;
    providerCheckoutUrl: string;
    now: string;
  }) {
    const attempt = this.attempts.get(input.attemptId);
    if (
      attempt?.state === "pending" &&
      attempt.providerCheckoutSessionId === input.providerCheckoutSessionId &&
      attempt.providerCheckoutUrl === input.providerCheckoutUrl
    ) {
      return clone(attempt);
    }
    if (
      !attempt ||
      !["reserved", "unknown"].includes(attempt.state) ||
      (attempt.providerCheckoutSessionId !== null &&
        attempt.providerCheckoutSessionId !== input.providerCheckoutSessionId) ||
      (attempt.providerCheckoutUrl !== null &&
        attempt.providerCheckoutUrl !== input.providerCheckoutUrl)
    ) {
      throw new M2RuntimeError("PAYMENT_ATTEMPT_STATE_CONFLICT", 409);
    }
    if (
      [...this.attempts.values()].some(
        (candidate) =>
          candidate.id !== attempt.id &&
          candidate.providerCheckoutSessionId ===
            input.providerCheckoutSessionId,
      )
    ) {
      throw new M2RuntimeError("PAYMENT_PROVIDER_ID_CONFLICT", 409);
    }
    attempt.state = "pending";
    attempt.providerCheckoutSessionId = input.providerCheckoutSessionId;
    attempt.providerCheckoutUrl = input.providerCheckoutUrl;
    attempt.updatedAt = input.now;
    const intent = this.intents.get(attempt.purchaseIntentId)!;
    intent.state = "pending";
    intent.updatedAt = input.now;
    return clone(attempt);
  }

  async markPaymentAttemptUnknown(input: {
    attemptId: string;
    now: string;
    errorCode: string;
  }) {
    void input.errorCode;
    const attempt = this.attempts.get(input.attemptId);
    if (
      !attempt ||
      !["reserved", "pending", "processing", "unknown"].includes(
        attempt.state,
      )
    ) {
      throw new M2RuntimeError("PAYMENT_ATTEMPT_STATE_CONFLICT", 409);
    }
    attempt.state = "unknown";
    attempt.updatedAt = input.now;
    const intent = this.intents.get(attempt.purchaseIntentId)!;
    intent.state = "unknown";
    intent.updatedAt = input.now;
  }

  async findPurchaseIntentByReference(purchaseReference: string) {
    const intent = this.intents.get(purchaseReference);
    return intent ? clone(intent) : null;
  }

  async findPaymentAttemptById(paymentAttemptId: string) {
    const attempt = this.attempts.get(paymentAttemptId);
    return attempt ? clone(attempt) : null;
  }

  async findPaymentAttemptByCheckoutSession(
    providerCheckoutSessionId: string,
  ) {
    const attempt = [...this.attempts.values()].find(
      (candidate) =>
        candidate.providerCheckoutSessionId === providerCheckoutSessionId,
    );
    return attempt ? clone(attempt) : null;
  }

  async recordStripeEvidence(input: {
    evidence: StripePaymentEvidenceV1;
    verification: {
      disposition: "verified" | "pending" | "failed" | "canceled" | "rejected";
      reasonCode: string | null;
    };
    verifiedPaymentId: string;
    fulfillmentJobId: string;
    now: string;
  }): Promise<RecordedPaymentEvidence> {
    const existingEvent = this.evidence.get(input.evidence.providerEventId);
    if (existingEvent) {
      const intent = this.intents.get(input.evidence.purchaseReference);
      const verified = intent?.successfulPaymentId
        ? this.verifiedPayments.get(intent.successfulPaymentId)
        : null;
      const job = verified
        ? [...this.jobs.values()].find(
            (candidate) => candidate.verifiedPaymentId === verified.id,
          )
        : null;
      return {
        disposition: "duplicate",
        purchaseIntentId: intent?.id ?? null,
        verifiedPaymentId: verified?.id ?? null,
        fulfillmentJobId: job?.id ?? null,
      };
    }
    this.evidence.set(input.evidence.providerEventId, {
      event: clone(input.evidence),
      disposition: input.verification.disposition,
    });
    const intent = this.intents.get(input.evidence.purchaseReference);
    const attempt = [...this.attempts.values()].find(
      (candidate) =>
        candidate.providerCheckoutSessionId ===
        input.evidence.providerCheckoutSessionId,
    );
    if (
      input.verification.disposition === "rejected" ||
      !intent ||
      !attempt ||
      attempt.purchaseIntentId !== intent.id
    ) {
      return {
        disposition: "rejected",
        purchaseIntentId: intent?.id ?? null,
        verifiedPaymentId: null,
        fulfillmentJobId: null,
      };
    }
    const isTerminalSuccess = input.verification.disposition === "verified";
    if (
      !isTerminalSuccess &&
      (intent.state === "verified" ||
        intent.state === "manual_review" ||
        attempt.id !== intent.currentPaymentAttemptId ||
        ["failed", "canceled", "succeeded"].includes(attempt.state) ||
        (attempt.lastProviderEventCreatedAt !== null &&
          Date.parse(input.evidence.providerCreatedAt) <
            Date.parse(attempt.lastProviderEventCreatedAt)))
    ) {
      this.evidence.get(input.evidence.providerEventId)!.disposition = "stale";
      return {
        disposition: "stale",
        purchaseIntentId: intent.id,
        verifiedPaymentId: intent.successfulPaymentId,
        fulfillmentJobId:
          [...this.jobs.values()].find(
            (candidate) =>
              candidate.verifiedPaymentId === intent.successfulPaymentId,
          )?.id ?? null,
      };
    }
    attempt.lastProviderEventCreatedAt = input.evidence.providerCreatedAt;
    attempt.updatedAt = input.now;
    if (input.verification.disposition === "pending") {
      attempt.state = "processing";
      intent.state = "processing";
      intent.updatedAt = input.now;
      return {
        disposition: "pending",
        purchaseIntentId: intent.id,
        verifiedPaymentId: null,
        fulfillmentJobId: null,
      };
    }
    if (
      input.verification.disposition === "failed" ||
      input.verification.disposition === "canceled"
    ) {
      attempt.state =
        input.verification.disposition === "failed" ? "failed" : "canceled";
      intent.state =
        input.verification.disposition === "failed"
          ? "payment_failed"
          : "canceled";
      intent.updatedAt = input.now;
      return {
        disposition: input.verification.disposition,
        purchaseIntentId: intent.id,
        verifiedPaymentId: null,
        fulfillmentJobId: null,
      };
    }
    const existingVerified = intent.successfulPaymentId
      ? this.verifiedPayments.get(intent.successfulPaymentId)
      : null;
    if (existingVerified) {
      if (
        existingVerified.providerPaymentId === input.evidence.providerPaymentId &&
        existingVerified.providerCheckoutSessionId ===
          input.evidence.providerCheckoutSessionId
      ) {
        return {
          disposition: "duplicate",
          purchaseIntentId: intent.id,
          verifiedPaymentId: existingVerified.id,
          fulfillmentJobId:
            [...this.jobs.values()].find(
              (candidate) =>
                candidate.verifiedPaymentId === existingVerified.id,
            )?.id ?? null,
        };
      }
      intent.state = "manual_review";
      return {
        disposition: "conflict",
        purchaseIntentId: intent.id,
        verifiedPaymentId: existingVerified.id,
        fulfillmentJobId: null,
      };
    }
    if (!input.evidence.providerPaymentId) {
      throw new M2RuntimeError("PAYMENT_ECONOMIC_EVIDENCE_INVALID", 409);
    }
    const verified: FakeVerifiedPayment = {
      id: input.verifiedPaymentId,
      purchaseIntentId: intent.id,
      paymentAttemptId: attempt.id,
      providerPaymentId: input.evidence.providerPaymentId,
      providerCheckoutSessionId: input.evidence.providerCheckoutSessionId,
    };
    const job: Mutable<FulfillmentJobRecord> = {
      id: input.fulfillmentJobId,
      purchaseIntentId: intent.id,
      verifiedPaymentId: verified.id,
      preparationId: intent.preparationId,
      deliveryAuthorityReference: intent.deliveryAuthorityReference,
      state: "pending",
      ownerId: null,
      leaseExpiresAt: null,
      attemptCount: 0,
      grantId: null,
      logicalAssessmentId: null,
      lastErrorCode: null,
      completedAt: null,
    };
    this.verifiedPayments.set(verified.id, verified);
    this.jobs.set(job.id, job);
    attempt.state = "succeeded";
    attempt.providerPaymentId = verified.providerPaymentId;
    intent.state = "verified";
    intent.successfulPaymentId = verified.id;
    intent.updatedAt = input.now;
    return {
      disposition: "verified",
      purchaseIntentId: intent.id,
      verifiedPaymentId: verified.id,
      fulfillmentJobId: job.id,
    };
  }

  async findPurchaseStatus(
    statusCapabilityHash: string,
  ): Promise<PurchaseStatusRecord | null> {
    const intent = [...this.intents.values()].find(
      (candidate) =>
        candidate.statusCapabilityHash === statusCapabilityHash,
    );
    if (!intent) return null;
    const job = [...this.jobs.values()].find(
      (candidate) => candidate.purchaseIntentId === intent.id,
    );
    return {
      purchaseIntent: clone(intent),
      fulfillmentJob: job ? clone(job) : null,
    };
  }

  async findAuthenticatedPurchaseStatus(input: {
    customerUserId: string;
    statusCapabilityHash: string;
  }): Promise<PurchaseStatusRecord | null> {
    const status = await this.findPurchaseStatus(input.statusCapabilityHash);
    if (!status) return null;
    const binding = this.authenticatedBindings.get(
      status.purchaseIntent.preparationId,
    );
    if (
      !binding ||
      binding.customerUserId !== input.customerUserId ||
      binding.bindingId !== status.purchaseIntent.customerOwnershipBindingId
    ) {
      return null;
    }
    return status;
  }

  async resolveAuthenticatedResultDeliveryId(input: {
    customerUserId: string;
    purchaseIntentId: string;
  }) {
    const intent = this.intents.get(input.purchaseIntentId);
    const binding = intent
      ? this.authenticatedBindings.get(intent.preparationId)
      : null;
    if (!intent || !binding || binding.customerUserId !== input.customerUserId) {
      return null;
    }
    return this.authenticatedResultDeliveries.get(input.purchaseIntentId) ?? null;
  }

  async claimFulfillmentDispatch(input: {
    jobId: string;
    dispatchMarker: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentDispatchClaim | null> {
    const job = this.jobs.get(input.jobId);
    if (!job) return null;
    if (job.state === "completed" || job.state === "manual_review") {
      return { disposition: "terminal" };
    }
    let dispatch = this.dispatches.get(input.jobId);
    if (!dispatch) {
      dispatch = {
        marker: input.dispatchMarker,
        ownerId: null,
        leaseExpiresAt: null,
        retryAfter: null,
        completedAt: null,
        lastErrorCode: null,
      };
      this.dispatches.set(input.jobId, dispatch);
    }
    if (dispatch.marker !== input.dispatchMarker) {
      job.state = "manual_review";
      return { disposition: "terminal" };
    }
    if (dispatch.completedAt !== null) {
      return { disposition: "dispatched" };
    }
    if (
      dispatch.ownerId !== null &&
      dispatch.leaseExpiresAt !== null &&
      Date.parse(dispatch.leaseExpiresAt) > Date.parse(input.now)
    ) {
      return { disposition: "in_progress" };
    }
    if (dispatch.ownerId !== null && dispatch.retryAfter === null) {
      job.state = "manual_review";
      job.ownerId = null;
      job.leaseExpiresAt = null;
      job.lastErrorCode = "PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS";
      dispatch.ownerId = null;
      dispatch.leaseExpiresAt = null;
      dispatch.lastErrorCode =
        "PAYMENT_FULFILLMENT_DISPATCH_OUTCOME_AMBIGUOUS";
      return { disposition: "terminal" };
    }
    if (
      dispatch.retryAfter !== null &&
      Date.parse(dispatch.retryAfter) > Date.parse(input.now)
    ) {
      return { disposition: "retry_later" };
    }
    dispatch.ownerId = input.ownerId;
    dispatch.leaseExpiresAt = input.leaseExpiresAt;
    dispatch.retryAfter = null;
    return { disposition: "acquired" };
  }

  async completeFulfillmentDispatch(input: {
    jobId: string;
    dispatchMarker: string;
    ownerId: string;
    now: string;
  }) {
    if (this.dispatchCompletionFailuresRemaining > 0) {
      this.dispatchCompletionFailuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_DISPATCH_ACCEPTANCE_PERSIST_FAILED", 503);
    }
    const dispatch = this.dispatches.get(input.jobId);
    if (
      !dispatch ||
      dispatch.marker !== input.dispatchMarker ||
      dispatch.ownerId !== input.ownerId ||
      dispatch.leaseExpiresAt === null ||
      Date.parse(dispatch.leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_DISPATCH_CONFLICT", 409);
    }
    dispatch.ownerId = null;
    dispatch.leaseExpiresAt = null;
    dispatch.completedAt = input.now;
    dispatch.lastErrorCode = null;
  }

  async failFulfillmentDispatch(input: {
    jobId: string;
    dispatchMarker: string;
    ownerId: string;
    errorCode: string;
    retryAfter: string;
    now: string;
  }) {
    const dispatch = this.dispatches.get(input.jobId);
    if (
      !dispatch ||
      dispatch.marker !== input.dispatchMarker ||
      dispatch.ownerId !== input.ownerId ||
      dispatch.leaseExpiresAt === null ||
      Date.parse(dispatch.leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_DISPATCH_CONFLICT", 409);
    }
    dispatch.ownerId = null;
    dispatch.leaseExpiresAt = null;
    dispatch.retryAfter = input.retryAfter;
    dispatch.lastErrorCode = input.errorCode;
  }

  async claimFulfillmentJob(input: {
    statusCapabilityHash: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentJobClaim | null> {
    const status = await this.findPurchaseStatus(input.statusCapabilityHash);
    if (!status?.fulfillmentJob) return null;
    return this.claimJob({
      jobId: status.fulfillmentJob.id,
      ownerId: input.ownerId,
      leaseExpiresAt: input.leaseExpiresAt,
      now: input.now,
    });
  }

  async claimFulfillmentJobById(input: {
    jobId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentJobClaim | null> {
    const job = this.jobs.get(input.jobId);
    if (!job) return null;
    const intent = this.intents.get(job.purchaseIntentId);
    if (intent?.state !== "verified") return null;
    return this.claimJob(input);
  }

  private claimJob(input: {
    jobId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): FulfillmentJobClaim | null {
    const job = this.jobs.get(input.jobId);
    if (!job) return null;
    if (job.state === "completed") {
      return { disposition: "completed", job: clone(job) };
    }
    if (
      job.state === "manual_review" ||
      (job.state === "processing" && job.leaseExpiresAt === null)
    ) {
      return { disposition: "manual_review", job: clone(job) };
    }
    if (
      job.state === "processing" &&
      job.leaseExpiresAt !== null &&
      Date.parse(job.leaseExpiresAt) > Date.parse(input.now)
    ) {
      return { disposition: "in_progress", job: clone(job) };
    }
    if (
      !["pending", "retryable", "processing"].includes(job.state)
    ) {
      return null;
    }
    job.state = "processing";
    job.ownerId = input.ownerId;
    job.leaseExpiresAt = input.leaseExpiresAt;
    job.attemptCount += 1;
    return { disposition: "acquired", job: clone(job) };
  }

  recordGrantForVerifiedPayment(
    verifiedPaymentId: string,
    grant: AssessmentGrantHandleV1,
  ) {
    const job = [...this.jobs.values()].find(
      (candidate) => candidate.verifiedPaymentId === verifiedPaymentId,
    );
    if (!job) throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_INVALID", 503);
    job.grantId = grant.grantId;
    job.logicalAssessmentId = grant.logicalAssessmentId;
  }

  async completeFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    now: string;
  }) {
    const job = this.jobs.get(input.jobId);
    if (
      !job ||
      job.state !== "processing" ||
      job.ownerId !== input.ownerId ||
      job.leaseExpiresAt === null ||
      Date.parse(job.leaseExpiresAt) <= Date.parse(input.now) ||
      !job.grantId ||
      !job.logicalAssessmentId
    ) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_CONFLICT", 409);
    }
    job.state = "completed";
    job.ownerId = null;
    job.leaseExpiresAt = null;
    job.completedAt = input.now;
  }

  async failFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const job = this.jobs.get(input.jobId);
    if (
      !job ||
      job.state !== "processing" ||
      job.ownerId !== input.ownerId ||
      job.leaseExpiresAt === null ||
      Date.parse(job.leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_CONFLICT", 409);
    }
    const retriesExhausted =
      job.lastErrorCode === "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED";
    job.state =
      retriesExhausted ||
      input.errorCode === "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS"
        ? "manual_review"
        : "retryable";
    job.ownerId = null;
    job.leaseExpiresAt = null;
    job.lastErrorCode = retriesExhausted
      ? "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED"
      : input.errorCode;
  }

  async quarantineFulfillmentJobAfterAsyncRetryExhaustion(input: {
    jobId: string;
    now: string;
  }): Promise<FulfillmentRetryExhaustionOutcome | null> {
    const job = this.jobs.get(input.jobId);
    if (!job) return null;
    const dispatch = this.dispatches.get(input.jobId);
    if (!dispatch?.completedAt) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_RETRY_AUTHORITY_INVALID", 409);
    }
    if (job.state === "completed") return { disposition: "completed" };
    if (job.state === "manual_review") {
      return { disposition: "manual_review" };
    }
    if (
      job.state === "processing" &&
      job.leaseExpiresAt !== null &&
      Date.parse(job.leaseExpiresAt) > Date.parse(input.now)
    ) {
      job.lastErrorCode = "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED";
      return { disposition: "quarantined_active" };
    }
    job.state = "manual_review";
    job.ownerId = null;
    job.leaseExpiresAt = null;
    job.lastErrorCode = "PRODUCTION_ASYNC_WORKLOAD_RETRIES_EXHAUSTED";
    return { disposition: "quarantined" };
  }

  async resolveDeliveryEmailCiphertext(
    deliveryAuthorityReference: string,
  ) {
    const intent = [...this.intents.values()].find(
      (candidate) =>
        candidate.deliveryAuthorityReference === deliveryAuthorityReference,
    );
    if (!intent) return null;
    if (intent.customerOwnershipBindingId !== null) {
      const binding = this.authenticatedBindings.get(intent.preparationId);
      return binding?.bindingId === intent.customerOwnershipBindingId
        ? binding.emailCiphertext
        : null;
    }
    if (intent.verifiedEmailAuthorityId === null) return null;
    const authority = this.authorities.get(intent.verifiedEmailAuthorityId);
    return authority?.revokedAt === null ? authority.emailCiphertext : null;
  }
}

export class FakeProductionFulfillmentDispatcherV1
  implements ProductionFulfillmentDispatcherV1
{
  readonly jobIds: string[] = [];
  readonly attempts: string[] = [];
  failuresRemaining = 0;

  async enqueue(jobId: string) {
    this.attempts.push(jobId);
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_FULFILLMENT_DISPATCH_FAILED", 503);
    }
    this.jobIds.push(jobId);
    return { eventId: `event-${String(this.jobIds.length).padStart(8, "0")}` };
  }
}

export class FakeCheckoutProviderV1 implements CheckoutProviderV1 {
  readonly requests: CheckoutSessionRequestV1[] = [];
  failuresRemaining = 0;
  unknownAfterCreateFailuresRemaining = 0;
  retrievalFailuresRemaining = 0;
  private readonly sessionsByIdempotencyKey = new Map<
    string,
    {
      result: { providerCheckoutSessionId: string; checkoutUrl: string };
      snapshot: StripeCheckoutSessionSnapshotV1;
    }
  >();

  async createCheckoutSession(request: CheckoutSessionRequestV1) {
    this.requests.push(clone(request));
    const existing = this.sessionsByIdempotencyKey.get(request.idempotencyKey);
    if (existing) return clone(existing.result);
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_STRIPE_UNKNOWN", 503);
    }
    const sequence = this.sessionsByIdempotencyKey.size + 1;
    const result = {
      providerCheckoutSessionId: `cs_test_rc2_${sequence}`,
      checkoutUrl: `https://checkout.stripe.com/c/pay/cs_test_rc2_${sequence}`,
    };
    this.sessionsByIdempotencyKey.set(request.idempotencyKey, {
      result,
      snapshot: {
        providerCheckoutSessionId: result.providerCheckoutSessionId,
        environment: "test",
        purchaseReference: request.purchaseReference,
        clientReferenceId: request.purchaseReference,
        providerPaymentId: null,
        paymentIntentPurchaseReference: null,
        mode: request.mode,
        paymentStatus: "unpaid",
        amountTotal: request.amount,
        currency: request.currency,
        checkoutStatus: "open",
      },
    });
    if (this.unknownAfterCreateFailuresRemaining > 0) {
      this.unknownAfterCreateFailuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_STRIPE_UNKNOWN_AFTER_CREATE", 503);
    }
    return clone(result);
  }

  setReconciliationState(
    providerCheckoutSessionId: string,
    overrides: Partial<StripeCheckoutSessionSnapshotV1>,
  ) {
    const stored = [...this.sessionsByIdempotencyKey.values()].find(
      (candidate) =>
        candidate.result.providerCheckoutSessionId === providerCheckoutSessionId,
    );
    if (!stored) {
      throw new M2RuntimeError("FAKE_STRIPE_SESSION_NOT_FOUND", 404);
    }
    stored.snapshot = { ...stored.snapshot, ...clone(overrides) };
  }

  async retrieveCheckoutSession(input: {
    providerCheckoutSessionId: string;
    observedAt: string;
  }) {
    if (this.retrievalFailuresRemaining > 0) {
      this.retrievalFailuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_STRIPE_RETRIEVAL_UNKNOWN", 503);
    }
    const stored = [...this.sessionsByIdempotencyKey.values()].find(
      (candidate) =>
        candidate.result.providerCheckoutSessionId ===
        input.providerCheckoutSessionId,
    );
    if (!stored) {
      throw new M2RuntimeError("FAKE_STRIPE_SESSION_NOT_FOUND", 404);
    }
    return buildStripeReconciliationEvidenceV1(
      clone(stored.snapshot),
      input.observedAt,
    );
  }
}

export class FakeProductionGrantProcessorV1
  implements ProductionGrantProcessorV1
{
  readonly issueCalls: VerifiedPurchaseAuthorityV1[] = [];
  readonly fulfillCalls: AssessmentGrantHandleV1[] = [];
  readonly notificationCalls: string[] = [];
  readonly grants = new Map<string, AssessmentGrantHandleV1>();
  readonly generated = new Set<string>();
  readonly canonicalReports = new Map<
    string,
    ProductionFulfillmentResultV1["projection"]
  >();
  readonly issuedResultTokens: string[] = [];
  providerInvocationCalls = 0;
  fulfillmentFailuresRemaining = 0;
  notificationFailuresRemaining = 0;
  private tokenSequence = 0;
  private readonly repository?: FakePaymentDeliveryRepository;

  constructor(repository?: FakePaymentDeliveryRepository) {
    this.repository = repository;
  }

  async issueProductionAssessmentGrant(
    authority: VerifiedPurchaseAuthorityV1,
  ): Promise<AssessmentGrantHandleV1> {
    this.issueCalls.push(clone(authority));
    if (authority.verificationSource !== "future_verified_payment") {
      throw new M2RuntimeError("PRODUCTION_VERIFIED_PURCHASE_REQUIRED", 403);
    }
    let grant = this.grants.get(authority.verifiedPaymentId);
    if (!grant) {
      const suffix = String(this.grants.size + 1).padStart(12, "0");
      grant = {
        schemaVersion: "rc1-assessment-grant-handle-v1",
        grantId: `10000000-0000-4000-8000-${suffix}`,
        logicalAssessmentId: `20000000-0000-4000-8000-${suffix}`,
      };
      this.grants.set(authority.verifiedPaymentId, grant);
      this.repository?.recordGrantForVerifiedPayment(
        authority.verifiedPaymentId,
        grant,
      );
    }
    return clone(grant);
  }

  async fulfillProductionAssessmentGrant(
    grant: AssessmentGrantHandleV1,
  ): Promise<ProductionFulfillmentResultV1> {
    this.fulfillCalls.push(clone(grant));
    if (this.fulfillmentFailuresRemaining > 0) {
      this.fulfillmentFailuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_FULFILLMENT_TEMPORARY_FAILURE", 503);
    }
    const duplicate = this.generated.has(grant.logicalAssessmentId);
    if (!duplicate) {
      this.generated.add(grant.logicalAssessmentId);
      this.providerInvocationCalls += 1;
    }
    let projection = this.canonicalReports.get(grant.logicalAssessmentId);
    if (!projection) {
      projection = {} as ProductionFulfillmentResultV1["projection"];
      this.canonicalReports.set(grant.logicalAssessmentId, projection);
    }
    this.tokenSequence += 1;
    const resultToken = Buffer.alloc(32, this.tokenSequence).toString("base64url");
    this.issuedResultTokens.push(resultToken);
    return {
      status: "completed",
      resultToken,
      projection: clone(projection),
      duplicate,
    };
  }

  async recoverCompletedProductionAssessmentGrant(
    grant: AssessmentGrantHandleV1,
  ): Promise<ProductionFulfillmentResultV1> {
    this.fulfillCalls.push(clone(grant));
    const projection = this.canonicalReports.get(grant.logicalAssessmentId);
    if (!this.generated.has(grant.logicalAssessmentId) || !projection) {
      throw new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404);
    }
    this.tokenSequence += 1;
    const resultToken = Buffer.alloc(32, this.tokenSequence).toString("base64url");
    this.issuedResultTokens.push(resultToken);
    return {
      status: "completed",
      resultToken,
      projection: clone(projection),
      duplicate: true,
    };
  }

  async processResultNotification(deliveryAuthorityReference: string) {
    this.notificationCalls.push(deliveryAuthorityReference);
    if (this.notificationFailuresRemaining > 0) {
      this.notificationFailuresRemaining -= 1;
      throw new M2RuntimeError("RESULT_EMAIL_DELIVERY_FAILED", 503);
    }
  }
}
