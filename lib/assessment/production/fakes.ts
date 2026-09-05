import { M2RuntimeError } from "../runtime/errors.ts";
import type { FakeAssessmentRepository } from "../runtime/fakes.ts";
import type {
  PersistedAssessmentRequest,
  PurchaseReadyRuntimeAuthorityV1,
} from "../runtime/types.ts";
import type {
  AssessmentGrantHandleV1,
  BeginProductionPreparationOutcome,
  BeginProductionPreparationRecord,
  CompleteProductionFulfillmentRecord,
  FinalizeProductionPreparationRecord,
  ProductionCanonicalDeliveryRecord,
  ProductionFulfillmentClaim,
  ProductionFulfillmentRepository,
  ProductionNotificationRecord,
  ProductionPreparationRecord,
} from "./types.ts";
import { decodeAndVerifyProductionCanonicalProjection } from "./canonical-delivery.ts";

function clone<T>(value: T): T {
  return structuredClone(value);
}

type FakeGrant = {
  id: string;
  preparationId: string;
  purchaseId: string;
  purchaseAuthorityReferenceHash: string;
  deliveryAuthorityReference: string;
  logicalAssessmentId: string;
  status: "issued" | "completed";
};

type FakeLogicalAssessment = {
  id: string;
  grantId: string;
  preparationId: string;
  requestId: string;
  status: "pending" | "generating" | "retryable" | "completed";
  ownerId: string | null;
  leaseExpiresAt: string | null;
  generationStartedAt: string | null;
  attemptCount: number;
  lastErrorCode: string | null;
};

type FakeCredential = {
  id: string;
  deliveryId: string;
  tokenHash: string;
  purpose: "customer_handoff" | "notification" | "recovery";
  revokedAt: string | null;
};

export class FakeProductionFulfillmentRepository
  implements ProductionFulfillmentRepository
{
  readonly actualSupabaseCalls = 0;
  readonly preparations = new Map<string, ProductionPreparationRecord>();
  readonly grants = new Map<string, FakeGrant>();
  readonly logicalAssessments = new Map<string, FakeLogicalAssessment>();
  readonly deliveries = new Map<string, ProductionCanonicalDeliveryRecord>();
  readonly credentials = new Map<string, FakeCredential>();
  readonly notifications = new Map<string, ProductionNotificationRecord>();
  readonly notificationLeases = new Map<string, string>();
  readonly notificationIdentities = new Map<string, {
    credentialId: string | null; firstSendStartedAt: string | null;
    sendAttemptCount: number; lastErrorCode: string | null;
  }>();
  readonly events: string[] = [];
  generationStartedTransitions = 0;
  private readonly runtimeRepository: FakeAssessmentRepository;
  private failOnceAt?: string;

  constructor(
    runtimeRepository: FakeAssessmentRepository,
    options: { failOnceAt?: string } = {},
  ) {
    this.runtimeRepository = runtimeRepository;
    this.failOnceAt = options.failOnceAt;
  }

  private maybeFail(point: string) {
    if (this.failOnceAt === point) {
      this.failOnceAt = undefined;
      throw new M2RuntimeError("PRODUCTION_FAKE_DATABASE_WRITE_FAILED", 503);
    }
  }

  private request(requestId: string): PersistedAssessmentRequest {
    const request = this.runtimeRepository.requests.get(requestId);
    if (!request) {
      throw new M2RuntimeError("PRODUCTION_FAKE_REQUEST_NOT_FOUND");
    }
    return request;
  }

  async beginPreparation(
    record: BeginProductionPreparationRecord,
  ): Promise<BeginProductionPreparationOutcome> {
    const existing = [...this.preparations.values()].find(
      (candidate) => candidate.idempotencyKeyHash === record.idempotencyKeyHash,
    );
    if (existing) {
      if (
        existing.consultationSnapshotHash !== record.consultationSnapshotHash
      ) {
        throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_CONFLICT", 409);
      }
      return {
        disposition: "existing",
        preparation: clone(existing),
        request: clone(this.request(existing.requestId)),
      };
    }
    const request = await this.runtimeRepository.createRequest({
      id: record.requestId,
      idempotencyKey: record.idempotencyKeyHash,
      source: "production_fulfillment_runtime",
      ...record.assessmentInput,
      now: record.now,
    });
    const preparation: ProductionPreparationRecord = {
      id: record.preparationId,
      requestId: record.requestId,
      idempotencyKeyHash: record.idempotencyKeyHash,
      consultationSnapshotHash: record.consultationSnapshotHash,
      consultationSnapshot: clone(record.consultationSnapshot),
      assessmentInput: clone(record.assessmentInput),
      safetyAuthority: clone(record.safetyAuthority),
      status: "preparing",
      stopReason: null,
      clarificationId: null,
      clarificationCapabilityHash: null,
      clarificationQuestion: null,
      clarificationAnswerFingerprint: null,
      purchaseCapabilityHash: null,
      purchaseReadyAuthority: null,
      purchaseReadyAuthorityHash: null,
      lastErrorCode: null,
      createdAt: record.now,
      updatedAt: record.now,
    };
    this.preparations.set(preparation.id, preparation);
    this.events.push("beginPreparation");
    return {
      disposition: "created",
      preparation: clone(preparation),
      request: clone(request),
    };
  }

  async finalizePreparation(record: FinalizeProductionPreparationRecord) {
    const preparation = this.preparations.get(record.preparationId);
    if (
      !preparation ||
      !["preparing", "awaiting_clarification", "failed"].includes(
        preparation.status,
      )
    ) {
      throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_CONFLICT", 409);
    }
    Object.assign(preparation, clone(record), {
      id: preparation.id,
      status: record.status,
      lastErrorCode: null,
      updatedAt: record.now,
    });
    this.events.push(`finalizePreparation:${record.status}`);
    return clone(preparation);
  }

  async failPreparation(input: {
    preparationId: string;
    errorCode: string;
    now: string;
  }) {
    const preparation = this.preparations.get(input.preparationId);
    if (!preparation) {
      throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_CONFLICT", 409);
    }
    preparation.status = "failed";
    preparation.lastErrorCode = input.errorCode;
    preparation.updatedAt = input.now;
    this.events.push("failPreparation");
  }

  async getPreparationByIdempotency(idempotencyKeyHash: string) {
    return clone(
      [...this.preparations.values()].find(
        (candidate) => candidate.idempotencyKeyHash === idempotencyKeyHash,
      ) ?? null,
    );
  }

  async getPreparationByClarificationCapability(capabilityHash: string) {
    return clone(
      [...this.preparations.values()].find(
        (candidate) =>
          candidate.clarificationCapabilityHash === capabilityHash,
      ) ?? null,
    );
  }

  async rotateClarificationCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ) {
    const preparation = this.preparations.get(preparationId);
    if (!preparation || preparation.status !== "awaiting_clarification") {
      throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_CONFLICT", 409);
    }
    preparation.clarificationCapabilityHash = capabilityHash;
    preparation.updatedAt = now;
  }

  async rotatePurchaseCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ) {
    const preparation = this.preparations.get(preparationId);
    if (!preparation || preparation.status !== "purchase_ready") {
      throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_CONFLICT", 409);
    }
    preparation.purchaseCapabilityHash = capabilityHash;
    preparation.updatedAt = now;
  }

  async issueGrant(input: {
    grantId: string;
    purchaseId: string;
    logicalAssessmentId: string;
    preparationCapabilityHash: string;
    purchaseAuthorityReferenceHash: string;
    deliveryAuthorityReference: string;
    now: string;
  }): Promise<AssessmentGrantHandleV1> {
    const preparation = [...this.preparations.values()].find(
      (candidate) =>
        candidate.purchaseCapabilityHash === input.preparationCapabilityHash,
    );
    if (
      !preparation ||
      !["purchase_ready", "consumed"].includes(preparation.status)
    ) {
      throw new M2RuntimeError("PRODUCTION_VERIFIED_PURCHASE_REQUIRED", 403);
    }
    const existing = [...this.grants.values()].find(
      (candidate) => candidate.preparationId === preparation.id,
    );
    if (existing) {
      if (
        existing.purchaseAuthorityReferenceHash !==
          input.purchaseAuthorityReferenceHash ||
        existing.deliveryAuthorityReference !== input.deliveryAuthorityReference
      ) {
        throw new M2RuntimeError("PRODUCTION_PURCHASE_AUTHORITY_CONFLICT", 409);
      }
      return {
        schemaVersion: "rc1-assessment-grant-handle-v1",
        grantId: existing.id,
        logicalAssessmentId: existing.logicalAssessmentId,
      };
    }
    const grant: FakeGrant = {
      id: input.grantId,
      preparationId: preparation.id,
      purchaseId: input.purchaseId,
      purchaseAuthorityReferenceHash: input.purchaseAuthorityReferenceHash,
      deliveryAuthorityReference: input.deliveryAuthorityReference,
      logicalAssessmentId: input.logicalAssessmentId,
      status: "issued",
    };
    this.grants.set(grant.id, grant);
    this.logicalAssessments.set(input.logicalAssessmentId, {
      id: input.logicalAssessmentId,
      grantId: input.grantId,
      preparationId: preparation.id,
      requestId: preparation.requestId,
      status: "pending",
      ownerId: null,
      leaseExpiresAt: null,
      generationStartedAt: null,
      attemptCount: 0,
      lastErrorCode: null,
    });
    preparation.status = "consumed";
    preparation.updatedAt = input.now;
    this.events.push("issueGrant");
    return {
      schemaVersion: "rc1-assessment-grant-handle-v1",
      grantId: grant.id,
      logicalAssessmentId: grant.logicalAssessmentId,
    };
  }

  async issueVerifiedPaymentGrant(input: {
    grantId: string;
    purchaseId: string;
    logicalAssessmentId: string;
    verifiedPaymentId: string;
    preparationId: string;
    purchaseAuthorityReferenceHash: string;
    deliveryAuthorityReference: string;
    now: string;
  }): Promise<AssessmentGrantHandleV1> {
    const preparation = this.preparations.get(input.preparationId);
    if (!preparation?.purchaseCapabilityHash || !input.verifiedPaymentId) {
      throw new M2RuntimeError("PRODUCTION_VERIFIED_PURCHASE_REQUIRED", 403);
    }
    return this.issueGrant({
      grantId: input.grantId,
      purchaseId: input.purchaseId,
      logicalAssessmentId: input.logicalAssessmentId,
      preparationCapabilityHash: preparation.purchaseCapabilityHash,
      purchaseAuthorityReferenceHash: input.purchaseAuthorityReferenceHash,
      deliveryAuthorityReference: input.deliveryAuthorityReference,
      now: input.now,
    });
  }

  async claimFulfillment(input: {
    grantId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<ProductionFulfillmentClaim> {
    const grant = this.grants.get(input.grantId);
    const logical = grant
      ? this.logicalAssessments.get(grant.logicalAssessmentId)
      : null;
    if (!grant || !logical) {
      throw new M2RuntimeError("PRODUCTION_GRANT_INVALID", 403);
    }
    const preparation = this.preparations.get(logical.preparationId);
    if (!preparation) {
      throw new M2RuntimeError("PRODUCTION_FULFILLMENT_STATE_INVALID");
    }
    const base = {
      grantId: grant.id,
      logicalAssessmentId: logical.id,
      preparation: clone(preparation),
      request: clone(this.request(logical.requestId)),
    };
    if (logical.status === "completed") {
      const delivery = [...this.deliveries.values()].find(
        (candidate) => candidate.logicalAssessmentId === logical.id,
      );
      return {
        ...base,
        disposition: "completed",
        ownerId: null,
        leaseExpiresAt: null,
        canonicalDelivery: delivery
          ? {
              ...clone(delivery),
              projection: decodeAndVerifyProductionCanonicalProjection(
                delivery.projection,
                delivery.projectionHash,
              ),
            }
          : null,
        recoverableRuntimeRunId: null,
      };
    }
    if (
      logical.status === "generating" &&
      logical.leaseExpiresAt !== null &&
      Date.parse(logical.leaseExpiresAt) > Date.parse(input.now)
    ) {
      return {
        ...base,
        disposition: "in_progress",
        ownerId: logical.ownerId,
        leaseExpiresAt: logical.leaseExpiresAt,
        canonicalDelivery: null,
        recoverableRuntimeRunId: null,
      };
    }
    const request = this.request(logical.requestId);
    const completedRun = request.status === "completed" ? [...this.runtimeRepository.reports.keys()].find((runId) => {
      const run = this.runtimeRepository.runs.get(runId);
      return run?.requestId === request.id && run.runKind === "fulfillment_resume" &&
        run.promptBundleVersion === "prompt-bundle-runtime-v17.0.0" && run.status === "completed" &&
        run.eligibility === "ready" && run.requestedModel === "gpt-5.6-luna" &&
        run.schemaSetVersion === "pipeline-schema-runtime-v6.0.0" &&
        run.stageTopologyVersion === "split-base-candidate-v1";
    }) : null;
    if (logical.status === "generating" && logical.generationStartedAt !== null && !completedRun) {
      logical.status = "retryable";
      logical.ownerId = null;
      logical.leaseExpiresAt = null;
      logical.lastErrorCode = "PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS";
      return {
        ...base,
        disposition: "manual_review",
        ownerId: null,
        leaseExpiresAt: null,
        canonicalDelivery: null,
        recoverableRuntimeRunId: null,
      };
    }
    let recoverableRuntimeRunId: string | null = null;
    if (request.status === "completed") {
      recoverableRuntimeRunId = completedRun ?? null;
      if (!recoverableRuntimeRunId) {
        throw new M2RuntimeError("PRODUCTION_FULFILLMENT_RECOVERY_INVALID");
      }
    } else if (request.status === "failed") {
      request.status = "processing";
    } else if (request.status !== "processing") {
      throw new M2RuntimeError("PRODUCTION_FULFILLMENT_STATE_CONFLICT", 409);
    }
    logical.status = "generating";
    logical.ownerId = input.ownerId;
    logical.leaseExpiresAt = input.leaseExpiresAt;
    logical.attemptCount += 1;
    this.events.push("claimFulfillment");
    return {
      ...base,
      request: clone(request),
      disposition: "acquired",
      ownerId: input.ownerId,
      leaseExpiresAt: input.leaseExpiresAt,
      canonicalDelivery: null,
      recoverableRuntimeRunId,
    };
  }

  async markGenerationStarted(input: {
    logicalAssessmentId: string;
    ownerId: string;
    now: string;
  }) {
    const logical = this.logicalAssessments.get(input.logicalAssessmentId);
    if (
      !logical ||
      logical.status !== "generating" ||
      logical.ownerId !== input.ownerId ||
      logical.leaseExpiresAt === null ||
      Date.parse(logical.leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PRODUCTION_GENERATION_BOUNDARY_CONFLICT");
    }
    if (logical.generationStartedAt === null) {
      logical.generationStartedAt = input.now;
      this.generationStartedTransitions += 1;
    }
    this.events.push("markGenerationStarted");
    return logical.generationStartedAt;
  }

  async completeFulfillment(record: CompleteProductionFulfillmentRecord) {
    this.maybeFail("completeFulfillment");
    const grant = this.grants.get(record.grantId);
    const logical = this.logicalAssessments.get(record.logicalAssessmentId);
    if (
      !grant ||
      !logical ||
      logical.status !== "generating" ||
      logical.ownerId !== record.ownerId ||
      logical.leaseExpiresAt === null ||
      Date.parse(logical.leaseExpiresAt) <= Date.parse(record.now) ||
      logical.generationStartedAt === null ||
      !this.runtimeRepository.reports.has(record.runtimeRunId) ||
      [...this.deliveries.values()].some(
        (candidate) => candidate.logicalAssessmentId === logical.id,
      )
    ) {
      throw new M2RuntimeError("PRODUCTION_FULFILLMENT_STATE_CONFLICT", 409);
    }
    const delivery: ProductionCanonicalDeliveryRecord = {
      id: record.deliveryId,
      logicalAssessmentId: logical.id,
      runtimeRunId: record.runtimeRunId,
      projection: clone(record.projection),
      projectionHash: record.projectionHash,
      deliveryAuthorityReference: grant.deliveryAuthorityReference,
      createdAt: record.now,
    };
    this.deliveries.set(delivery.id, delivery);
    this.credentials.set(record.resultCredentialId, {
      id: record.resultCredentialId,
      deliveryId: delivery.id,
      tokenHash: record.resultTokenHash,
      purpose: "customer_handoff",
      revokedAt: null,
    });
    this.notifications.set(record.notificationId, {
      id: record.notificationId,
      deliveryId: delivery.id,
      deliveryAuthorityReference: grant.deliveryAuthorityReference,
      status: "pending",
      attemptCount: 0,
      ownerId: null,
    });
    logical.status = "completed";
    logical.ownerId = null;
    logical.leaseExpiresAt = null;
    grant.status = "completed";
    this.events.push("completeFulfillment");
    return {
      ...clone(delivery),
      projection: decodeAndVerifyProductionCanonicalProjection(
        delivery.projection,
        delivery.projectionHash,
      ),
    };
  }

  async failFulfillment(input: {
    logicalAssessmentId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const logical = this.logicalAssessments.get(input.logicalAssessmentId);
    if (
      !logical ||
      logical.status !== "generating" ||
      logical.ownerId !== input.ownerId ||
      logical.leaseExpiresAt === null ||
      Date.parse(logical.leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PRODUCTION_FULFILLMENT_STATE_CONFLICT", 409);
    }
    logical.status = "retryable";
    logical.ownerId = null;
    logical.leaseExpiresAt = null;
    logical.lastErrorCode = input.errorCode;
    this.events.push("failFulfillment");
  }

  async addResultCredential(input: {
    credentialId: string;
    deliveryId: string;
    tokenHash: string;
    purpose: "customer_handoff" | "notification" | "recovery";
    now: string;
  }) {
    if (
      !this.deliveries.has(input.deliveryId) ||
      [...this.credentials.values()].some(
        (candidate) => candidate.tokenHash === input.tokenHash,
      )
    ) {
      throw new M2RuntimeError("PRODUCTION_RESULT_CREDENTIAL_CONFLICT", 409);
    }
    this.credentials.set(input.credentialId, {
      id: input.credentialId,
      deliveryId: input.deliveryId,
      tokenHash: input.tokenHash,
      purpose: input.purpose,
      revokedAt: null,
    });
  }

  async revokeResultCredential(credentialId: string, now: string) {
    const credential = this.credentials.get(credentialId);
    if (credential && credential.revokedAt === null) credential.revokedAt = now;
  }

  async resolveResultToken(tokenHash: string, now: string) {
    void now;
    const credential = [...this.credentials.values()].find(
      (candidate) =>
        candidate.tokenHash === tokenHash && candidate.revokedAt === null,
    );
    const delivery = credential
      ? this.deliveries.get(credential.deliveryId)
      : null;
    return delivery
      ? {
          deliveryId: delivery.id,
          projection: decodeAndVerifyProductionCanonicalProjection(
            delivery.projection,
            delivery.projectionHash,
          ),
        }
      : null;
  }

  async findCompletedDeliveryForGrant(input: {
    grantId: string;
    logicalAssessmentId: string;
  }) {
    const logical = this.logicalAssessments.get(input.logicalAssessmentId);
    if (
      !logical ||
      logical.grantId !== input.grantId ||
      logical.status !== "completed"
    ) {
      return null;
    }
    const delivery = [...this.deliveries.values()].find(
      (candidate) => candidate.logicalAssessmentId === input.logicalAssessmentId,
    );
    return delivery ? clone(delivery) : null;
  }

  async claimNotification(input: {
    notificationId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }) {
    if (!input.ownerId || !input.now || !input.leaseExpiresAt ||
        Date.parse(input.leaseExpiresAt) <= Date.parse(input.now)) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_LEASE_INVALID", 409);
    }
    const notification = this.notifications.get(input.notificationId);
    if (!notification) return null;
    if (notification.status === "sent") {
      return { disposition: "sent" as const, notification: null };
    }
    if (notification.status === "processing") {
      const leaseExpiresAt = this.notificationLeases.get(notification.id);
      if (!leaseExpiresAt) {
        return { disposition: "manual_review" as const, notification: null };
      }
      if (Date.parse(leaseExpiresAt) > Date.parse(input.now)) {
        return { disposition: "in_progress" as const, notification: null };
      }
    }
    let identity = this.notificationIdentities.get(notification.id);
    if ((!identity && (notification.attemptCount !== 0 || notification.status !== "pending")) ||
        identity?.lastErrorCode === "PRODUCTION_NOTIFICATION_PAYLOAD_CONFLICT" ||
        (identity?.credentialId && this.credentials.get(identity.credentialId)?.revokedAt !== null)) {
      return { disposition: "manual_review" as const, notification: null };
    }
    if (!identity) {
      identity = { credentialId: null, firstSendStartedAt: null, sendAttemptCount: 0, lastErrorCode: null };
      this.notificationIdentities.set(notification.id, identity);
    }
    notification.status = "processing";
    notification.ownerId = input.ownerId;
    notification.attemptCount += 1;
    this.notificationLeases.set(
      notification.id,
      input.leaseExpiresAt,
    );
    this.events.push("claimNotification");
    return {
      disposition: "acquired" as const,
      notification: clone(notification),
    };
  }

  private ownedNotification(notificationId: string, ownerId: string, now: string) {
    const notification = this.notifications.get(notificationId);
    const lease = this.notificationLeases.get(notificationId);
    if (!notification || notification.status !== "processing" || !ownerId ||
        notification.ownerId !== ownerId || !lease || !now ||
        Date.parse(lease) <= Date.parse(now)) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_STATE_CONFLICT", 409);
    }
    return notification;
  }

  async prepareNotificationEmail(input: {
    notificationId: string; ownerId: string; credentialId: string;
    tokenHash: string; payloadCiphertext: string; now: string;
  }) {
    const notification = this.ownedNotification(input.notificationId, input.ownerId, input.now);
    const identity = this.notificationIdentities.get(input.notificationId);
    if (!identity) throw new M2RuntimeError("PRODUCTION_NOTIFICATION_STATE_CONFLICT", 409);
    if (notification.payloadCiphertext) return notification.payloadCiphertext;
    this.maybeFail("prepareNotificationEmail");
    if (!this.deliveries.has(notification.deliveryId) || this.credentials.has(input.credentialId) ||
        [...this.credentials.values()].some((item) => item.tokenHash === input.tokenHash)) {
      throw new M2RuntimeError("PRODUCTION_RESULT_CREDENTIAL_CONFLICT", 409);
    }
    // No await between the fence and this atomic fake transaction.
    this.credentials.set(input.credentialId, { id: input.credentialId,
      deliveryId: notification.deliveryId, tokenHash: input.tokenHash,
      purpose: "notification", revokedAt: null });
    notification.payloadCiphertext = input.payloadCiphertext;
    identity.credentialId = input.credentialId;
    this.events.push("prepareNotificationEmail");
    return input.payloadCiphertext;
  }

  async beginNotificationSend(input: { notificationId: string; ownerId: string; now: string }) {
    const notification = this.ownedNotification(input.notificationId, input.ownerId, input.now);
    const identity = this.notificationIdentities.get(input.notificationId);
    if (!notification.payloadCiphertext || !identity?.credentialId ||
        this.credentials.get(identity.credentialId)?.revokedAt !== null) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_STATE_CONFLICT", 409);
    }
    identity.firstSendStartedAt ??= input.now;
    identity.sendAttemptCount += 1;
    this.events.push("beginNotificationSend");
  }

  async completeNotification(input: {
    notificationId: string;
    ownerId: string;
    providerMessageReference: string;
    now: string;
  }) {
    this.maybeFail("completeNotification");
    void input.providerMessageReference;
    const notification = this.notifications.get(input.notificationId);
    const leaseExpiresAt = this.notificationLeases.get(input.notificationId);
    if (
      !notification ||
      notification.status !== "processing" ||
      notification.ownerId !== input.ownerId ||
      !leaseExpiresAt ||
      Date.parse(leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_STATE_CONFLICT", 409);
    }
    notification.status = "sent";
    notification.ownerId = null;
    this.notificationLeases.delete(notification.id);
    this.events.push("completeNotification");
  }

  async failNotification(input: {
    notificationId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const identity = this.notificationIdentities.get(input.notificationId);
    const notification = this.notifications.get(input.notificationId);
    const leaseExpiresAt = this.notificationLeases.get(input.notificationId);
    if (
      !notification ||
      notification.status !== "processing" ||
      notification.ownerId !== input.ownerId ||
      !leaseExpiresAt ||
      Date.parse(leaseExpiresAt) <= Date.parse(input.now)
    ) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_STATE_CONFLICT", 409);
    }
    notification.status = "failed";
    if (identity) identity.lastErrorCode = input.errorCode;
    notification.ownerId = null;
    this.notificationLeases.delete(notification.id);
    this.events.push("failNotification");
  }

  async findNotificationIdByDeliveryAuthorityReference(
    deliveryAuthorityReference: string,
  ) {
    return (
      [...this.notifications.values()].find(
        (notification) =>
          notification.deliveryAuthorityReference ===
          deliveryAuthorityReference,
      )?.id ?? null
    );
  }

  seedPurchaseReadyPreparation(input: {
    preparation: ProductionPreparationRecord;
    authority: PurchaseReadyRuntimeAuthorityV1;
  }) {
    this.preparations.set(input.preparation.id, clone(input.preparation));
    const preparation = this.preparations.get(input.preparation.id)!;
    preparation.purchaseReadyAuthority = clone(input.authority);
  }
}
