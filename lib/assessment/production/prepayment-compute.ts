import type { M2StageId, StageAttemptNumber } from "../runtime/types.ts";
import type {
  BeginProductionPreparationOutcome,
  BeginProductionPreparationRecord,
  FinalizeProductionPreparationRecord,
  ProductionPreparationRecord,
} from "./types.ts";
import type { PersistedAssessmentRequest } from "../runtime/types.ts";

export const PREPAYMENT_COMPUTE_POLICY_VERSION =
  "m2-c1-prepayment-compute-v1" as const;

export type PrepaymentComputePolicyV1 = Readonly<{
  policyVersion: typeof PREPAYMENT_COMPUTE_POLICY_VERSION;
  windowSeconds: number;
  maximumProviderInvocations: number;
}>;

export type BeginPrepaymentIntakeRecord = BeginProductionPreparationRecord & {
  executionCapabilityHash: string;
};

export type BeginPrepaymentIntakeOutcome = BeginProductionPreparationOutcome & {
  executionDisposition:
    | "awaiting_auth"
    | "executing"
    | "awaiting_clarification"
    | "completed"
    | "failed";
};

export type PrepaymentExecutionClaim = Readonly<{
  disposition: "acquired" | "in_progress" | "completed";
  preparationId: string;
  preparation: ProductionPreparationRecord;
  request: PersistedAssessmentRequest;
}>;

export type PrepaymentComputeAuthorityRepository = {
  getPreparationById(
    preparationId: string,
  ): Promise<ProductionPreparationRecord | null>;
  beginPrepaymentIntake(
    record: BeginPrepaymentIntakeRecord,
  ): Promise<BeginPrepaymentIntakeOutcome>;
  resolvePrepaymentContinuation(input: {
    customerUserId: string;
    continuationTokenHash: string;
    now: string;
  }): Promise<string | null>;
  claimPrepaymentExecution(input: {
    customerUserId: string;
    preparationId: string;
    now: string;
  }): Promise<PrepaymentExecutionClaim>;
  beginPrepaymentClarification(input: {
    customerUserId: string;
    preparationId: string;
    now: string;
  }): Promise<void>;
  finalizePrepaymentExecution(
    record: FinalizeProductionPreparationRecord,
  ): Promise<void>;
  failPrepaymentExecution(input: {
    preparationId: string;
    errorCode: string;
    now: string;
  }): Promise<void>;
  claimComputeUnit(input: {
    customerUserId: string;
    preparationId: string;
    now: string;
    policy: PrepaymentComputePolicyV1;
    stageId: M2StageId;
    attemptNumber: StageAttemptNumber;
  }): Promise<"acquired" | "exhausted">;
};
