import { randomUUID } from "node:crypto";
import {
  buildClarificationEvidenceV1,
  validateClarificationAnswerV1,
} from "../runtime/clarification-evidence-v1.ts";
import { projectCustomerAssessmentExperienceV2 } from "../runtime/customer-assessment-experience-projection-v2.ts";
import { asM2RuntimeError, M2RuntimeError } from "../runtime/errors.ts";
import { AssessmentPipeline } from "../runtime/pipeline.ts";
import { validateJpy980ProductScopeV1 } from "../runtime/jpy980-product-scope-validation-v1.ts";
import type {
  AiStageTransport,
  AssessmentRepository,
  M2StageId,
  PurchasePreparationExecutionResult,
  StageAttemptNumber,
  StageDefinition,
} from "../runtime/types.ts";
import { evaluatePrepaymentSafetyV1 } from "../../purchase/prepayment-safety-gate-v1.ts";
import {
  createOpaqueProductionCapability,
  hashOpaqueProductionCapability,
  hashProductionIdempotencyKey,
  hashProductionResultCapability,
  hashProductionSnapshot,
  hashServerAuthorityReference,
} from "./capabilities.ts";
import {
  decodeProductionConsultationInputV1,
  toAssessmentInput,
  toPrepaymentSafetyInput,
} from "./consultation.ts";
import type { DeliveryNotificationAdapterV1 } from "./notification.ts";
import {
  VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION,
  type AssessmentGrantHandleV1,
  type FinalizeProductionPreparationRecord,
  type ProductionFulfillmentRepository,
  type ProductionFulfillmentResultV1,
  type ProductionPreparationRecord,
  type PublicPreparationOutcome,
  type ResolvedProductionResult,
  type VerifiedPurchaseAuthorityV1,
} from "./types.ts";

type ProductionRuntimeCatalog = {
  catalogVersion: "runtime-stage-catalog-v17.0.0";
  promptBundleVersion: "prompt-bundle-runtime-v17.0.0";
  schemaSetVersion: "pipeline-schema-runtime-v6.0.0";
  stageTopologyVersion: "split-base-candidate-v1";
  definitions: StageDefinition[];
};

type ProductionFulfillmentApplicationOptions = {
  runtimeRepository: AssessmentRepository;
  lifecycleRepository: ProductionFulfillmentRepository;
  transport: AiStageTransport;
  catalog: ProductionRuntimeCatalog;
  model: "gpt-5.6-luna";
  now?: () => string;
  uuid?: () => string;
  capability?: () => string;
  timeZone?: string;
  allowSyntheticPurchaseAuthority?: boolean;
};

function validateCatalog(catalog: ProductionRuntimeCatalog) {
  if (
    catalog.catalogVersion !== "runtime-stage-catalog-v17.0.0" ||
    catalog.promptBundleVersion !== "prompt-bundle-runtime-v17.0.0" ||
    catalog.schemaSetVersion !== "pipeline-schema-runtime-v6.0.0" ||
    catalog.stageTopologyVersion !== "split-base-candidate-v1"
  ) {
    throw new M2RuntimeError("PRODUCTION_RUNTIME_IDENTITY_INVALID", 503);
  }
}

export class ProductionFulfillmentApplication {
  private readonly options: ProductionFulfillmentApplicationOptions;
  private readonly now: () => string;
  private readonly uuid: () => string;
  private readonly capability: () => string;

  constructor(options: ProductionFulfillmentApplicationOptions) {
    validateCatalog(options.catalog);
    this.options = options;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
    this.capability = options.capability ?? createOpaqueProductionCapability;
  }

  private pipeline(beforeProviderInvocation?: (
    stageId: M2StageId,
    attemptNumber: StageAttemptNumber,
  ) => Promise<void>) {
    return new AssessmentPipeline({
      repository: this.options.runtimeRepository,
      transport: this.options.transport,
      definitions: this.options.catalog.definitions,
      timeZone: this.options.timeZone ?? "Asia/Tokyo",
      uuid: this.uuid,
      beforeProviderInvocation,
    });
  }

  private runContext(requestId: string, runId: string, startedAt: string) {
    return {
      requestId,
      runId,
      model: this.options.model,
      promptBundleVersion: this.options.catalog.promptBundleVersion,
      schemaSetVersion: this.options.catalog.schemaSetVersion,
      startedAt,
    } as const;
  }

  private async replayPreparation(
    preparation: ProductionPreparationRecord,
    consultationSnapshotHash: string,
  ): Promise<PublicPreparationOutcome> {
    if (preparation.consultationSnapshotHash !== consultationSnapshotHash) {
      throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_CONFLICT", 409);
    }
    if (preparation.status === "purchase_ready") {
      const rawCapability = this.capability();
      await this.options.lifecycleRepository.rotatePurchaseCapability(
        preparation.id,
        hashOpaqueProductionCapability(rawCapability),
        this.now(),
      );
      return { status: "purchase_ready", preparationCapability: rawCapability };
    }
    if (preparation.status === "awaiting_clarification") {
      if (!preparation.clarificationQuestion) {
        throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_INVALID");
      }
      const rawCapability = this.capability();
      await this.options.lifecycleRepository.rotateClarificationCapability(
        preparation.id,
        hashOpaqueProductionCapability(rawCapability),
        this.now(),
      );
      return {
        status: "needs_one_clarifying_answer",
        clarificationCapability: rawCapability,
        question: preparation.clarificationQuestion,
        maximumQuestionsTotal: 1,
      };
    }
    if (preparation.status === "stopped" && preparation.stopReason) {
      return { status: preparation.stopReason };
    }
    if (preparation.status === "failed") {
      throw new M2RuntimeError("PRODUCTION_PREPARATION_RECOVERY_REQUIRED", 503);
    }
    throw new M2RuntimeError("PRODUCTION_PREPARATION_IN_PROGRESS", 409);
  }

  private async finalizePipelinePreparation(
    preparationId: string,
    result: PurchasePreparationExecutionResult,
    clarificationAnswerFingerprint: string | null,
    answeredClarification?: Pick<
      ProductionPreparationRecord,
      | "clarificationId"
      | "clarificationCapabilityHash"
      | "clarificationQuestion"
    >,
  ): Promise<PublicPreparationOutcome> {
    const now = this.now();
    let record: FinalizeProductionPreparationRecord;
    let publicOutcome: PublicPreparationOutcome;
    if (result.eligibility === "purchase_ready") {
      const capability = this.capability();
      record = {
        preparationId,
        status: "purchase_ready",
        stopReason: null,
        clarificationId: answeredClarification?.clarificationId ?? null,
        clarificationCapabilityHash:
          answeredClarification?.clarificationCapabilityHash ?? null,
        clarificationQuestion:
          answeredClarification?.clarificationQuestion ?? null,
        clarificationAnswerFingerprint,
        purchaseCapabilityHash: hashOpaqueProductionCapability(capability),
        purchaseReadyAuthority: result.authority,
        purchaseReadyAuthorityHash: hashProductionSnapshot(result.authority),
        now,
      };
      publicOutcome = {
        status: "purchase_ready",
        preparationCapability: capability,
      };
    } else if (result.eligibility === "needs_more_information") {
      if (!result.clarification || clarificationAnswerFingerprint !== null) {
        throw new M2RuntimeError("PRODUCTION_CLARIFICATION_STATE_INVALID");
      }
      const capability = this.capability();
      record = {
        preparationId,
        status: "awaiting_clarification",
        stopReason: null,
        clarificationId: result.clarification.opaqueClarificationId,
        clarificationCapabilityHash:
          hashOpaqueProductionCapability(capability),
        clarificationQuestion: result.clarification.question,
        clarificationAnswerFingerprint: null,
        purchaseCapabilityHash: null,
        purchaseReadyAuthority: null,
        purchaseReadyAuthorityHash: null,
        now,
      };
      publicOutcome = {
        status: "needs_one_clarifying_answer",
        clarificationCapability: capability,
        question: result.clarification.question,
        maximumQuestionsTotal: 1,
      };
    } else {
      const stopReason =
        result.eligibility === "safety_blocked"
          ? "safety_blocked"
          : "not_full_product_candidate";
      record = {
        preparationId,
        status: "stopped",
        stopReason,
        clarificationId: answeredClarification?.clarificationId ?? null,
        clarificationCapabilityHash:
          answeredClarification?.clarificationCapabilityHash ?? null,
        clarificationQuestion:
          answeredClarification?.clarificationQuestion ?? null,
        clarificationAnswerFingerprint,
        purchaseCapabilityHash: null,
        purchaseReadyAuthority: null,
        purchaseReadyAuthorityHash: null,
        now,
      };
      publicOutcome = { status: stopReason };
    }
    await this.options.lifecycleRepository.finalizePreparation(record);
    return publicOutcome;
  }

  async prepare(
    value: unknown,
    idempotencyKey: unknown,
  ): Promise<PublicPreparationOutcome> {
    const consultation = decodeProductionConsultationInputV1(value);
    const idempotencyKeyHash = hashProductionIdempotencyKey(idempotencyKey);
    const safetyAuthority = evaluatePrepaymentSafetyV1(
      toPrepaymentSafetyInput(consultation),
    );
    if (!safetyAuthority.purchaseGateSatisfied) {
      return { status: "safety_blocked" };
    }
    const assessmentInput = toAssessmentInput(consultation);
    validateJpy980ProductScopeV1(assessmentInput);
    const consultationSnapshotHash = hashProductionSnapshot({
      consultation,
      safetyAuthority,
    });
    const now = this.now();
    const begun = await this.options.lifecycleRepository.beginPreparation({
      preparationId: this.uuid(),
      requestId: this.uuid(),
      idempotencyKeyHash,
      consultationSnapshotHash,
      consultationSnapshot: consultation,
      assessmentInput,
      safetyAuthority,
      now,
    });
    if (begun.disposition === "existing") {
      return this.replayPreparation(
        begun.preparation,
        consultationSnapshotHash,
      );
    }
    try {
      const runId = this.uuid();
      const result = await this.pipeline().prepare(
        assessmentInput,
        this.runContext(begun.request.id, runId, now),
      );
      return await this.finalizePipelinePreparation(
        begun.preparation.id,
        result,
        null,
      );
    } catch (error) {
      const safe = asM2RuntimeError(
        error,
        "PRODUCTION_PREPARATION_EXECUTION_FAILED",
      );
      await this.options.lifecycleRepository.failPreparation({
        preparationId: begun.preparation.id,
        errorCode: safe.safeCode,
        now: this.now(),
      });
      throw safe;
    }
  }

  async answerClarification(
    clarificationCapability: unknown,
    answer: unknown,
  ): Promise<PublicPreparationOutcome> {
    const capabilityHash = hashOpaqueProductionCapability(
      clarificationCapability,
    );
    const preparation =
      await this.options.lifecycleRepository.getPreparationByClarificationCapability(
        capabilityHash,
      );
    if (!preparation || !preparation.clarificationId) {
      throw new M2RuntimeError("PRODUCTION_CLARIFICATION_NOT_FOUND", 404);
    }
    const persisted =
      await this.options.runtimeRepository.findClarificationById(
        preparation.clarificationId,
      );
    if (!persisted) {
      throw new M2RuntimeError("PRODUCTION_CLARIFICATION_NOT_FOUND", 404);
    }
    const resumeStartedAt = this.now();
    const validated = validateClarificationAnswerV1({
      target: persisted.target,
      answer,
      resumeStartedAt,
    });
    if (preparation.clarificationAnswerFingerprint !== null) {
      if (
        preparation.clarificationAnswerFingerprint !==
        validated.answerFingerprint
      ) {
        throw new M2RuntimeError("PRODUCTION_CLARIFICATION_CONFLICT", 409);
      }
      return this.replayPreparation(
        preparation,
        preparation.consultationSnapshotHash,
      );
    }
    const resumeRunId = this.uuid();
    const accepted =
      await this.options.runtimeRepository.acceptClarificationAndCreateResumeRun({
        clarificationId: preparation.clarificationId,
        answer: validated.validatedAnswer,
        answerFingerprint: validated.answerFingerprint,
        groundedNormalizedRepresentation:
          validated.groundedNormalizedRepresentation,
        answeredAt: resumeStartedAt,
        resumeRun: {
          id: resumeRunId,
          requestId: persisted.requestId,
          requestedModel: this.options.model,
          promptBundleVersion: this.options.catalog.promptBundleVersion,
          schemaSetVersion: this.options.catalog.schemaSetVersion,
          stageTopologyVersion: this.options.catalog.stageTopologyVersion,
          runKind: "clarification_resume",
          startedAt: resumeStartedAt,
        },
      });
    if (accepted.disposition === "duplicate") {
      throw new M2RuntimeError("PRODUCTION_CLARIFICATION_IN_PROGRESS", 409);
    }
    const initial =
      await this.options.runtimeRepository.getInitialAuthorityForResume(
        accepted.request.id,
      );
    const evidence = buildClarificationEvidenceV1(accepted.clarification);
    try {
      const result = await this.pipeline().resumePreparation(
        accepted.request,
        initial,
        evidence,
        this.runContext(
          accepted.request.id,
          accepted.resumeRunId,
          resumeStartedAt,
        ),
      );
      return await this.finalizePipelinePreparation(
        preparation.id,
        result,
        validated.answerFingerprint,
        preparation,
      );
    } catch (error) {
      const safe = asM2RuntimeError(
        error,
        "PRODUCTION_CLARIFICATION_EXECUTION_FAILED",
      );
      await this.options.lifecycleRepository.failPreparation({
        preparationId: preparation.id,
        errorCode: safe.safeCode,
        now: this.now(),
      });
      throw safe;
    }
  }

  async issueAssessmentGrant(
    authority: VerifiedPurchaseAuthorityV1,
  ): Promise<AssessmentGrantHandleV1> {
    if (
      authority.schemaVersion !==
        VERIFIED_PURCHASE_AUTHORITY_SCHEMA_VERSION ||
      (authority.verificationSource !== "future_verified_payment" &&
        authority.verificationSource !== "rc1_test_fake") ||
      (authority.verificationSource === "rc1_test_fake" &&
        !this.options.allowSyntheticPurchaseAuthority)
    ) {
      throw new M2RuntimeError("PRODUCTION_VERIFIED_PURCHASE_REQUIRED", 403);
    }
    return this.options.lifecycleRepository.issueGrant({
      grantId: this.uuid(),
      purchaseId: this.uuid(),
      logicalAssessmentId: this.uuid(),
      preparationCapabilityHash: hashOpaqueProductionCapability(
        authority.preparationCapability,
      ),
      purchaseAuthorityReferenceHash: hashServerAuthorityReference(
        authority.purchaseAuthorityReference,
      ),
      deliveryAuthorityReference: authority.deliveryAuthorityReference,
      now: this.now(),
    });
  }

  async fulfillAssessmentGrant(
    grant: AssessmentGrantHandleV1,
  ): Promise<ProductionFulfillmentResultV1> {
    if (grant.schemaVersion !== "rc1-assessment-grant-handle-v1") {
      throw new M2RuntimeError("PRODUCTION_GRANT_INVALID", 403);
    }
    const ownerId = this.uuid();
    const claim = await this.options.lifecycleRepository.claimFulfillment({
      grantId: grant.grantId,
      ownerId,
      now: this.now(),
    });
    if (claim.disposition === "in_progress") {
      throw new M2RuntimeError("PRODUCTION_FULFILLMENT_IN_PROGRESS", 409);
    }
    if (claim.disposition === "completed") {
      if (!claim.canonicalDelivery) {
        throw new M2RuntimeError("PRODUCTION_FULFILLMENT_STATE_INVALID");
      }
      const resultToken = this.capability();
      await this.options.lifecycleRepository.addResultCredential({
        credentialId: this.uuid(),
        deliveryId: claim.canonicalDelivery.id,
        tokenHash: hashOpaqueProductionCapability(resultToken),
        purpose: "recovery",
        now: this.now(),
      });
      return {
        status: "completed",
        resultToken,
        projection: claim.canonicalDelivery.projection,
        duplicate: true,
      };
    }
    try {
      const authority = claim.preparation.purchaseReadyAuthority;
      if (
        !authority ||
        !claim.preparation.purchaseReadyAuthorityHash ||
        hashProductionSnapshot(authority) !==
          claim.preparation.purchaseReadyAuthorityHash
      ) {
        throw new M2RuntimeError(
          "PRODUCTION_PURCHASE_READY_AUTHORITY_INVALID",
        );
      }
      let generationBoundaryRecorded = false;
      const beforeProviderInvocation = async (
        stageId: M2StageId,
        attemptNumber: StageAttemptNumber,
      ) => {
        if (generationBoundaryRecorded) return;
        if (stageId !== "PB-04" || attemptNumber !== 1) {
          throw new M2RuntimeError("PRODUCTION_GENERATION_BOUNDARY_INVALID");
        }
        await this.options.lifecycleRepository.markGenerationStarted({
          logicalAssessmentId: claim.logicalAssessmentId,
          ownerId,
          now: this.now(),
        });
        generationBoundaryRecorded = true;
      };
      const recovered = claim.recoverableRuntimeRunId
        ? await this.options.runtimeRepository.getCompletedAssessment(
            claim.request.id,
          )
        : null;
      if (
        claim.recoverableRuntimeRunId &&
        (!recovered || recovered.runId !== claim.recoverableRuntimeRunId)
      ) {
        throw new M2RuntimeError("PRODUCTION_FULFILLMENT_RECOVERY_INVALID");
      }
      const result = recovered
        ? {
            ...recovered,
            duplicate: true,
            authoritativeRequestedTopics: [...claim.request.requestedTopics],
          }
        : await this.pipeline(beforeProviderInvocation).fulfillPrepared(
            claim.request,
            authority,
            this.runContext(claim.request.id, this.uuid(), this.now()),
          );
      if (result.eligibility !== "ready") {
        throw new M2RuntimeError("PRODUCTION_FULFILLMENT_RESULT_INVALID");
      }
      const projection = projectCustomerAssessmentExperienceV2(
        result,
        claim.request.requestedTopics,
      );
      const resultToken = this.capability();
      const delivery =
        await this.options.lifecycleRepository.completeFulfillment({
          grantId: claim.grantId,
          logicalAssessmentId: claim.logicalAssessmentId,
          ownerId,
          runtimeRunId: result.runId,
          deliveryId: this.uuid(),
          projection,
          projectionHash: hashProductionSnapshot(projection),
          resultCredentialId: this.uuid(),
          resultTokenHash: hashOpaqueProductionCapability(resultToken),
          notificationId: this.uuid(),
          now: this.now(),
        });
      return {
        status: "completed",
        resultToken,
        projection: delivery.projection,
        duplicate: recovered !== null,
      };
    } catch (error) {
      const safe = asM2RuntimeError(error, "PRODUCTION_FULFILLMENT_FAILED");
      try {
        await this.options.lifecycleRepository.failFulfillment({
          logicalAssessmentId: claim.logicalAssessmentId,
          ownerId,
          errorCode: safe.safeCode,
          now: this.now(),
        });
      } catch (failureError) {
        if (
          safe.safeCode !==
          "PRODUCTION_CANONICAL_DELIVERY_INTEGRITY_FAILED"
        ) {
          throw failureError;
        }
      }
      throw safe;
    }
  }

  async resolveResult(token: unknown): Promise<ResolvedProductionResult> {
    const resolved = await this.options.lifecycleRepository.resolveResultToken(
      hashProductionResultCapability(token),
      this.now(),
    );
    if (!resolved) {
      throw new M2RuntimeError("PRODUCTION_RESULT_NOT_FOUND", 404);
    }
    return resolved;
  }

  async processNotification(
    notificationId: string,
    adapter: DeliveryNotificationAdapterV1,
  ) {
    const ownerId = this.uuid();
    const notification =
      await this.options.lifecycleRepository.claimNotification({
        notificationId,
        ownerId,
        now: this.now(),
      });
    if (!notification) {
      throw new M2RuntimeError("PRODUCTION_NOTIFICATION_NOT_AVAILABLE", 409);
    }
    const credentialId = this.uuid();
    const resultAccessToken = this.capability();
    await this.options.lifecycleRepository.addResultCredential({
      credentialId,
      deliveryId: notification.deliveryId,
      tokenHash: hashOpaqueProductionCapability(resultAccessToken),
      purpose: "notification",
      now: this.now(),
    });
    try {
      const sent = await adapter.send({
        deliveryAuthorityReference: notification.deliveryAuthorityReference,
        resultAccessToken,
      });
      await this.options.lifecycleRepository.completeNotification({
        notificationId,
        ownerId,
        providerMessageReference: sent.providerMessageReference,
        now: this.now(),
      });
      return { status: "sent" as const };
    } catch (error) {
      const safe = asM2RuntimeError(
        error,
        "PRODUCTION_NOTIFICATION_DELIVERY_FAILED",
      );
      await this.options.lifecycleRepository.revokeResultCredential(
        credentialId,
        this.now(),
      );
      await this.options.lifecycleRepository.failNotification({
        notificationId,
        ownerId,
        errorCode: safe.safeCode,
        now: this.now(),
      });
      throw safe;
    }
  }
}
