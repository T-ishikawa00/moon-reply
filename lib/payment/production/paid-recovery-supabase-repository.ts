import { createClient } from "@supabase/supabase-js";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { PaidRecoveryRepository } from "./paid-recovery.ts";
import type { FulfillmentJobClaim, FulfillmentJobRecord, PaymentEnvironment } from "./types.ts";

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new M2RuntimeError("PAID_RECOVERY_DATABASE_INVALID", 503);
  return value as Record<string, unknown>;
}

export class SupabasePaidRecoveryRepository implements PaidRecoveryRepository {
  private readonly client;
  constructor(url: string, secretKey: string) {
    this.client = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
  }
  private async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await this.client.rpc(name, args);
    if (error) throw new M2RuntimeError("PAID_RECOVERY_DATABASE_OPERATION_FAILED", 503);
    return data as unknown;
  }
  async claimJob(input: Parameters<PaidRecoveryRepository["claimJob"]>[0]): Promise<FulfillmentJobClaim | null> {
    const value = await this.rpc("claim_rc2_fulfillment_job_by_id_v3", {
      p_fulfillment_job_id: input.jobId, p_owner_id: input.ownerId,
      p_lease_expires_at: input.leaseExpiresAt, p_now: input.now, p_recovery_cycle: input.recoveryCycle,
    });
    if (value === null) return null;
    const result = record(value);
    const { data, error } = await this.client.from("production_fulfillment_jobs").select("*").eq("id", input.jobId).single();
    if (error || !data) throw new M2RuntimeError("PAID_RECOVERY_DATABASE_OPERATION_FAILED", 503);
    const row = record(data);
    if (!["acquired", "in_progress", "completed", "manual_review"].includes(String(result.disposition)))
      throw new M2RuntimeError("PAID_RECOVERY_DATABASE_INVALID", 503);
    return { disposition: result.disposition as FulfillmentJobClaim["disposition"], job: {
      id: String(row.id), purchaseIntentId: String(row.purchase_intent_id), verifiedPaymentId: String(row.verified_payment_id),
      preparationId: String(row.preparation_id), deliveryAuthorityReference: String(row.delivery_authority_reference),
      state: row.state as FulfillmentJobRecord["state"], ownerId: row.owner_id as string | null,
      leaseExpiresAt: row.lease_expires_at as string | null, attemptCount: Number(row.attempt_count),
      grantId: row.grant_id as string | null, logicalAssessmentId: row.logical_assessment_id as string | null,
      lastErrorCode: row.last_error_code as string | null, completedAt: row.completed_at as string | null,
      recoveryCycle: Number(row.recovery_cycle_count), recoveryNextAttemptAt: row.recovery_next_attempt_at as string | null,
      recoveryReasonCode: row.recovery_reason_code as string | null,
    } };
  }
  async schedule(input: Parameters<PaidRecoveryRepository["schedule"]>[0]) {
    await this.rpc("schedule_paid_fulfillment_recovery_v1", {
      p_fulfillment_job_id: input.jobId, p_owner_id: input.ownerId, p_reason_code: input.reasonCode,
      p_retryable: input.retryable, p_next_attempt_at: input.nextAttemptAt, p_now: input.now,
      p_recovery_cycle: input.recoveryCycle,
    });
  }
  async refresh(input: { environment: PaymentEnvironment; now: string; limit: number }) {
    await this.rpc("refresh_paid_fulfillment_recovery_v1", {
      p_environment: input.environment, p_now: input.now, p_limit: input.limit,
    });
  }
  async inspect(jobId: string) {
    return record(await this.rpc("inspect_paid_fulfillment_recovery_v1", { p_fulfillment_job_id: jobId }));
  }
  async listDue(input: { environment: PaymentEnvironment; now: string; limit: number }) {
    const result = await this.rpc("list_due_paid_fulfillment_dispatch_v1", {
      p_environment: input.environment, p_now: input.now, p_limit: input.limit,
    });
    if (!Array.isArray(result)) throw new M2RuntimeError("PAID_RECOVERY_DATABASE_INVALID", 503);
    return result.map((row: unknown) => String(record(row).fulfillment_job_id));
  }
  async resume(input: Parameters<PaidRecoveryRepository["resume"]>[0]) {
    await this.rpc("resume_paid_fulfillment_recovery_v1", {
      p_fulfillment_job_id: input.jobId, p_reviewed_artifact_sha256: input.artifactHash,
      p_expected_reason_code: input.expectedReasonCode,
      p_operator_reference: input.operatorReference, p_now: input.now,
    });
  }
}
