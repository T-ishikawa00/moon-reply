import { randomUUID } from "node:crypto";

import { M2RuntimeError } from "../runtime/errors.ts";
import { evaluateJpy980ProductScopeV1 } from "../runtime/jpy980-product-scope-validation-v1.ts";
import type { AssessmentRepository } from "../runtime/types.ts";
import { evaluatePrepaymentSafetyV1 } from "../../purchase/prepayment-safety-gate-v1.ts";
import {
  createOpaqueProductionCapability,
  hashOpaqueProductionCapability,
  hashProductionIdempotencyKey,
  hashProductionSnapshot,
} from "./capabilities.ts";
import {
  decodeProductionConsultationInputV1,
  toAssessmentInput,
  toPrepaymentSafetyInput,
} from "./consultation.ts";
import type { PrepaymentComputeAuthorityRepository } from "./prepayment-compute.ts";
import type {
  ProductionFulfillmentRepository,
  ProductionPreparationRecord,
  PublicPreparationOutcome,
} from "./types.ts";

type ProviderFreeIntakeOptions = {
  runtimeRepository: Pick<AssessmentRepository, "findClarificationById">;
  lifecycleRepository: Pick<
    ProductionFulfillmentRepository,
    "rotateClarificationCapability" | "rotatePurchaseCapability"
  >;
  prepaymentComputeAuthority?: Pick<
    PrepaymentComputeAuthorityRepository,
    "beginPrepaymentIntake"
  >;
  now?: () => string;
  uuid?: () => string;
  capability?: () => string;
};

export class ProviderFreeIntakeApplication {
  private readonly options: ProviderFreeIntakeOptions;
  private readonly now: () => string;
  private readonly uuid: () => string;
  private readonly capability: () => string;

  constructor(options: ProviderFreeIntakeOptions) {
    this.options = options;
    this.now = options.now ?? (() => new Date().toISOString());
    this.uuid = options.uuid ?? randomUUID;
    this.capability = options.capability ?? createOpaqueProductionCapability;
  }

  async replayPreparation(
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
      if (!preparation.clarificationId || !preparation.clarificationQuestion) {
        throw new M2RuntimeError("PRODUCTION_PREPARATION_STATE_INVALID");
      }
      const persisted = await this.options.runtimeRepository.findClarificationById(
        preparation.clarificationId,
      );
      if (
        !persisted ||
        persisted.questionSnapshot !== preparation.clarificationQuestion
      ) {
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
        target: persisted.target,
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

  async beginProviderFreePreparation(
    value: unknown,
    idempotencyKey: unknown,
  ): Promise<PublicPreparationOutcome> {
    const authority = this.options.prepaymentComputeAuthority;
    if (!authority) {
      throw new M2RuntimeError("PREPAYMENT_COMPUTE_AUTHORIZATION_REQUIRED", 503);
    }
    const consultation = decodeProductionConsultationInputV1(value);
    const idempotencyKeyHash = hashProductionIdempotencyKey(idempotencyKey);
    const safetyAuthority = evaluatePrepaymentSafetyV1(
      toPrepaymentSafetyInput(consultation),
    );
    if (!safetyAuthority.purchaseGateSatisfied) {
      return { status: "safety_blocked" };
    }
    const productScope = evaluateJpy980ProductScopeV1(consultation);
    if (!productScope.accepted) {
      return { status: "not_full_product_candidate" };
    }
    const assessmentInput = toAssessmentInput(consultation);
    const consultationSnapshotHash = hashProductionSnapshot({
      consultation,
      safetyAuthority,
    });
    const capability = this.capability();
    const now = this.now();
    const begun = await authority.beginPrepaymentIntake({
      preparationId: this.uuid(),
      requestId: this.uuid(),
      idempotencyKeyHash,
      consultationSnapshotHash,
      consultationSnapshot: consultation,
      assessmentInput,
      safetyAuthority,
      executionCapabilityHash: hashOpaqueProductionCapability(capability),
      now,
    });
    if (begun.preparation.consultationSnapshotHash !== consultationSnapshotHash) {
      throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_CONFLICT", 409);
    }
    if (
      begun.preparation.status === "preparing" &&
      begun.executionDisposition === "awaiting_auth"
    ) {
      return {
        status: "authentication_required",
        preparationCapability: capability,
      };
    }
    return this.replayPreparation(
      begun.preparation,
      consultationSnapshotHash,
    );
  }
}
