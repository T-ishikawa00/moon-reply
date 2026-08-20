import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  AssessmentGrantHandleV1,
  ProductionFulfillmentResultV1,
  VerifiedPurchaseAuthorityV1,
} from "../../assessment/production/types.ts";
import { equalSha256 } from "./crypto.ts";
import type {
  CheckoutProviderV1,
  CheckoutSessionRequestV1,
  EmailChallengeRecord,
  FulfillmentJobClaim,
  FulfillmentJobRecord,
  PaymentAttemptRecord,
  PaymentDeliveryRepository,
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

export class FakePaymentDeliveryRepository
  implements PaymentDeliveryRepository
{
  readonly preparations = new Map<string, SeededPreparation>();
  readonly challenges = new Map<string, Mutable<EmailChallengeRecord>>();
  readonly authorities = new Map<string, Mutable<VerifiedEmailAuthority>>();
  readonly sessions = new Map<string, Mutable<TrustedEmailSession>>();
  readonly intents = new Map<string, Mutable<PurchaseIntentRecord>>();
  readonly attempts = new Map<string, Mutable<PaymentAttemptRecord>>();
  readonly evidence = new Map<
    string,
    { event: StripePaymentEvidenceV1; disposition: string }
  >();
  readonly verifiedPayments = new Map<string, FakeVerifiedPayment>();
  readonly jobs = new Map<string, Mutable<FulfillmentJobRecord>>();

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
    for (const priorChallenge of this.challenges.values()) {
      if (
        priorChallenge.preparationId !== preparation.id ||
        priorChallenge.emailHash === input.challenge.emailHash ||
        !priorChallenge.verifiedEmailAuthorityId
      ) {
        continue;
      }
      const priorAuthority = this.authorities.get(
        priorChallenge.verifiedEmailAuthorityId,
      );
      if (priorAuthority) priorAuthority.revokedAt = input.challenge.createdAt;
      for (const priorSession of this.sessions.values()) {
        if (
          priorSession.verifiedEmailAuthorityId ===
          priorChallenge.verifiedEmailAuthorityId
        ) {
          priorSession.revokedAt = input.challenge.createdAt;
        }
      }
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
    challenge.status = "consumed";
    for (const priorChallenge of this.challenges.values()) {
      if (
        priorChallenge.id === challenge.id ||
        priorChallenge.preparationId !== challenge.preparationId ||
        !priorChallenge.verifiedEmailAuthorityId
      ) {
        continue;
      }
      const priorAuthority = this.authorities.get(
        priorChallenge.verifiedEmailAuthorityId,
      );
      if (priorAuthority) priorAuthority.revokedAt = input.now;
      for (const priorSession of this.sessions.values()) {
        if (
          priorSession.verifiedEmailAuthorityId ===
          priorChallenge.verifiedEmailAuthorityId
        ) {
          priorSession.revokedAt = input.now;
        }
      }
    }
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
    if (
      !preparation ||
      !trusted ||
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
    if (!attempt || attempt.state !== "reserved") {
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
    if (!attempt || !["reserved", "pending", "processing"].includes(attempt.state)) {
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

  async claimFulfillmentJob(input: {
    statusCapabilityHash: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentJobClaim | null> {
    const status = await this.findPurchaseStatus(input.statusCapabilityHash);
    if (!status?.fulfillmentJob) return null;
    const job = this.jobs.get(status.fulfillmentJob.id)!;
    if (job.state === "completed") {
      return { disposition: "completed", job: clone(job) };
    }
    if (
      job.state === "processing" &&
      job.leaseExpiresAt !== null &&
      Date.parse(job.leaseExpiresAt) > Date.parse(input.now)
    ) {
      return { disposition: "in_progress", job: clone(job) };
    }
    if (
      job.state === "manual_review" ||
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
    void input.now;
    const job = this.jobs.get(input.jobId);
    if (!job || job.state !== "processing" || job.ownerId !== input.ownerId) {
      throw new M2RuntimeError("PAYMENT_FULFILLMENT_JOB_CONFLICT", 409);
    }
    job.state = "retryable";
    job.ownerId = null;
    job.leaseExpiresAt = null;
    job.lastErrorCode = input.errorCode;
  }

  async resolveDeliveryEmailCiphertext(
    deliveryAuthorityReference: string,
  ) {
    const intent = [...this.intents.values()].find(
      (candidate) =>
        candidate.deliveryAuthorityReference === deliveryAuthorityReference,
    );
    if (!intent) return null;
    const authority = this.authorities.get(intent.verifiedEmailAuthorityId);
    return authority?.revokedAt === null ? authority.emailCiphertext : null;
  }
}

export class FakeCheckoutProviderV1 implements CheckoutProviderV1 {
  readonly requests: CheckoutSessionRequestV1[] = [];
  failuresRemaining = 0;

  async createCheckoutSession(request: CheckoutSessionRequestV1) {
    this.requests.push(clone(request));
    if (this.failuresRemaining > 0) {
      this.failuresRemaining -= 1;
      throw new M2RuntimeError("FAKE_STRIPE_UNKNOWN", 503);
    }
    const sequence = this.requests.length;
    return {
      providerCheckoutSessionId: `cs_test_rc2_${sequence}`,
      checkoutUrl: `https://checkout.stripe.com/c/pay/cs_test_rc2_${sequence}`,
    };
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
  providerInvocationCalls = 0;
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
    const duplicate = this.generated.has(grant.logicalAssessmentId);
    if (!duplicate) {
      this.generated.add(grant.logicalAssessmentId);
      this.providerInvocationCalls += 1;
    }
    this.tokenSequence += 1;
    return {
      status: "completed",
      resultToken: Buffer.alloc(32, this.tokenSequence).toString("base64url"),
      projection: {} as ProductionFulfillmentResultV1["projection"],
      duplicate,
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
