import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { calculateUsageDerivedCostUsd } from "../runtime/cost.ts";
import { M2RuntimeError } from "../runtime/errors.ts";
import type { AiStageTransport, StageRequest } from "../runtime/types.ts";

export const PAID_RECOVERY_MAX_OUTPUT_TOKENS = 8192;
export interface PaidProviderBudgetRepository {
  reserve(input: { logicalAssessmentId: string; ownerId: string; reservationId: string;
    costUsd: number; now: string }): Promise<string>;
  complete(input: { logicalAssessmentId: string; ownerId: string; reservationId: string; now: string }): Promise<void>;
}

// Uses the repository's existing price snapshot, not a live-price claim.
// UTF-8 bytes conservatively bound input tokens; include schema and wire margin.
export function paidProviderReservationCost(request: StageRequest) {
  const inputTokens = Buffer.byteLength(JSON.stringify(request), "utf8") + 4096;
  return calculateUsageDerivedCostUsd({ inputTokens, cachedTokens: 0,
    outputTokens: PAID_RECOVERY_MAX_OUTPUT_TOKENS, reasoningTokens: 0 });
}

export function createPaidRecoveryTransport(input: {
  transport: AiStageTransport; repository: PaidProviderBudgetRepository;
  logicalAssessmentId: string; ownerId: string; now?: () => string; uuid?: () => string;
}): AiStageTransport {
  const now = input.now ?? (() => new Date().toISOString());
  return { async invoke(request) {
    const reservationId = (input.uuid ?? randomUUID)();
    const identity = { logicalAssessmentId: input.logicalAssessmentId, ownerId: input.ownerId, reservationId };
    const disposition = await input.repository.reserve({ ...identity,
      costUsd: paidProviderReservationCost(request), now: now() });
    if (disposition !== "reserved") {
      throw new M2RuntimeError(disposition === "concurrency_limited" ? "PAID_RECOVERY_CONCURRENCY_LIMITED"
        : disposition === "budget_exhausted" ? "PAID_RECOVERY_BUDGET_EXHAUSTED"
        : disposition === "financial_review" ? "PAID_RECOVERY_FINANCIAL_REVIEW_REQUIRED"
        : "PAID_RECOVERY_RESERVATION_REJECTED", 503);
    }
    // Reservation commits before any network call. Kill/timeout leaves a
    // bounded lease; cost/count remain consumed even after it expires.
    const result = await input.transport.invoke({ ...request, maxOutputTokens: PAID_RECOVERY_MAX_OUTPUT_TOKENS });
    try { await input.repository.complete({ ...identity, now: now() }); }
    catch { /* An acknowledgement loss keeps the conservative hold. */ }
    return result;
  } };
}

export class SupabasePaidProviderBudgetRepository implements PaidProviderBudgetRepository {
  private readonly client;
  constructor(url: string, secretKey: string) {
    this.client = createClient(url, secretKey, { auth: {
      autoRefreshToken: false, detectSessionInUrl: false, persistSession: false,
    } });
  }
  async reserve(input: Parameters<PaidProviderBudgetRepository["reserve"]>[0]) {
    const { data, error } = await this.client.rpc("reserve_paid_fulfillment_provider_v1", {
      p_logical_assessment_id: input.logicalAssessmentId, p_owner_id: input.ownerId,
      p_reservation_id: input.reservationId, p_cost_usd: input.costUsd, p_now: input.now,
    });
    if (error || !data || typeof data.disposition !== "string")
      throw new M2RuntimeError("PAID_RECOVERY_DATABASE_OPERATION_FAILED", 503);
    return data.disposition as string;
  }
  async complete(input: Parameters<PaidProviderBudgetRepository["complete"]>[0]) {
    const { error } = await this.client.rpc("complete_paid_fulfillment_provider_v1", {
      p_logical_assessment_id: input.logicalAssessmentId, p_owner_id: input.ownerId,
      p_reservation_id: input.reservationId, p_now: input.now,
    });
    if (error) throw new M2RuntimeError("PAID_RECOVERY_DATABASE_OPERATION_FAILED", 503);
  }
}
