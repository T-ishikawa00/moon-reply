import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { M2RuntimeError } from "../assessment/runtime/errors";
import type { JsonValue } from "../assessment/runtime/types";
import type {
  CustomerSupportCaseCreation,
  CustomerSupportCaseRepository,
  CustomerSupportCaseStatus,
} from "./types";
import { isCustomerSupportCategory } from "./types";

type RuntimeFunction = { Args: Record<string, unknown>; Returns: JsonValue };
type SupportDatabase = {
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      create_production_customer_support_case_v1: RuntimeFunction;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

function databaseFailure(error?: unknown): never {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";
  if (message.includes("M2_D2_SUPPORT_IDEMPOTENCY_CONFLICT")) {
    throw new M2RuntimeError("CUSTOMER_SUPPORT_IDEMPOTENCY_CONFLICT", 409);
  }
  if (message.includes("M2_D2_SUPPORT_PURCHASE_NOT_OWNED")) {
    throw new M2RuntimeError("CUSTOMER_SUPPORT_PURCHASE_NOT_FOUND", 404);
  }
  if (
    message.includes("M2_D2_SUPPORT_PURCHASE_REQUIRED") ||
    message.includes("M2_D2_SUPPORT_CASE_INVALID")
  ) {
    throw new M2RuntimeError("CUSTOMER_SUPPORT_REQUEST_INVALID", 400);
  }
  throw new M2RuntimeError("CUSTOMER_SUPPORT_DATABASE_OPERATION_FAILED", 503);
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    databaseFailure();
  }
  return value as Record<string, unknown>;
}

function string(value: unknown) {
  if (typeof value !== "string" || value.length === 0) databaseFailure();
  return value;
}

export class SupabaseCustomerSupportCaseRepositoryV1
  implements CustomerSupportCaseRepository
{
  private readonly client: SupabaseClient<SupportDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<SupportDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  async createCase(
    input: Parameters<CustomerSupportCaseRepository["createCase"]>[0],
  ): Promise<CustomerSupportCaseCreation> {
    const { data, error } = await this.client.rpc(
      "create_production_customer_support_case_v1",
      {
        p_case_id: input.caseId,
        p_event_id: input.eventId,
        p_customer_user_id: input.customerUserId,
        p_purchase_intent_id: input.purchaseIntentId,
        p_category: input.category,
        p_customer_note: input.customerNote,
        p_idempotency_key_hash: input.idempotencyKeyHash,
        p_case_input_sha256: input.caseInputSha256,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const row = record(data);
    const disposition = string(row.disposition);
    const category = string(row.category);
    const status = string(row.status);
    if (
      disposition !== "created" &&
      disposition !== "replay" &&
      disposition !== "active_case"
    ) {
      databaseFailure();
    }
    if (!isCustomerSupportCategory(category)) databaseFailure();
    if (
      status !== "open" &&
      status !== "in_review" &&
      status !== "waiting_customer" &&
      status !== "resolved" &&
      status !== "closed"
    ) {
      databaseFailure();
    }
    return {
      caseId: string(row.case_id),
      category,
      status: status as CustomerSupportCaseStatus,
      createdAt: string(row.created_at),
      disposition,
    };
  }
}
