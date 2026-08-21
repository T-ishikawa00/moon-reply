import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { M2RuntimeError } from "../assessment/runtime/errors";
import type { JsonValue } from "../assessment/runtime/types";
import { decodeAndVerifyProductionCanonicalProjection } from "../assessment/production/canonical-delivery";
import type {
  CustomerAccountHistoryItem,
  CustomerAuthContinuation,
  CustomerIdentityRepository,
  CustomerOwnedResult,
  CustomerOwnershipBinding,
} from "./types";

type RuntimeFunction = { Args: Record<string, unknown>; Returns: JsonValue };
type CustomerIdentityDatabase = {
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      create_customer_auth_continuation_v1: RuntimeFunction;
      validate_customer_auth_continuation_v1: RuntimeFunction;
      bind_production_preparation_to_customer_v1: RuntimeFunction;
      resolve_customer_account_history_v1: RuntimeFunction;
      resolve_customer_account_result_v1: RuntimeFunction;
      detach_production_customer_identity_v1: RuntimeFunction;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

function databaseFailure(error?: unknown): never {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  if (message.includes("CUSTOMER_AUTH_BINDING_CONFLICT")) {
    throw new M2RuntimeError("CUSTOMER_AUTH_BINDING_CONFLICT", 409);
  }
  if (message.includes("CUSTOMER_AUTH_CONTINUATION_INVALID")) {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
  }
  if (message.includes("CUSTOMER_AUTH_PURCHASE_READY_REQUIRED")) {
    throw new M2RuntimeError("CUSTOMER_AUTH_PURCHASE_READY_REQUIRED", 403);
  }
  throw new M2RuntimeError("CUSTOMER_AUTH_DATABASE_OPERATION_FAILED", 503);
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

function nullableString(value: unknown) {
  if (value === null) return null;
  return string(value);
}

function mapContinuation(value: unknown): CustomerAuthContinuation {
  const row = record(value);
  return {
    id: string(row.continuation_id),
    preparationId: string(row.preparation_id),
    flowKind: string(row.flow_kind) as CustomerAuthContinuation["flowKind"],
    state: string(row.state) as CustomerAuthContinuation["state"],
    expiresAt: string(row.expires_at),
  };
}

export class SupabaseCustomerIdentityRepositoryV1
  implements CustomerIdentityRepository
{
  private readonly client: SupabaseClient<CustomerIdentityDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<CustomerIdentityDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  async createContinuation(input: Parameters<CustomerIdentityRepository["createContinuation"]>[0]) {
    const { data, error } = await this.client.rpc(
      "create_customer_auth_continuation_v1",
      {
        p_continuation_id: input.id,
        p_preparation_capability_hash: input.preparationCapabilityHash,
        p_continuation_token_hash: input.continuationTokenHash,
        p_csrf_token_hash: input.csrfTokenHash,
        p_flow_kind: input.flowKind,
        p_expires_at: input.expiresAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    return mapContinuation(data);
  }

  async validateContinuation(input: Parameters<CustomerIdentityRepository["validateContinuation"]>[0]) {
    const { data, error } = await this.client.rpc(
      "validate_customer_auth_continuation_v1",
      {
        p_continuation_token_hash: input.continuationTokenHash,
        p_csrf_token_hash: input.csrfTokenHash,
        p_flow_kind: input.flowKind,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    return data === null ? null : mapContinuation(data);
  }

  async bindPreparation(input: Parameters<CustomerIdentityRepository["bindPreparation"]>[0]) {
    const { data, error } = await this.client.rpc(
      "bind_production_preparation_to_customer_v1",
      {
        p_binding_id: input.bindingId,
        p_ownership_reference_id: input.ownershipReferenceId,
        p_continuation_token_hash: input.continuationTokenHash,
        p_csrf_token_hash: input.csrfTokenHash,
        p_customer_user_id: input.customerUserId,
        p_delivery_email_sha256: input.deliveryEmailHash,
        p_delivery_email_ciphertext: input.deliveryEmailCiphertext,
        p_delivery_email_key_version: input.deliveryEmailKeyVersion,
        p_delivery_email_verified_source: input.deliveryEmailVerifiedSource,
        p_delivery_email_verified_at: input.deliveryEmailVerifiedAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const row = record(data);
    return {
      id: string(row.binding_id),
      preparationId: string(row.preparation_id),
      customerUserId: nullableString(row.customer_user_id),
      state: string(row.state) as CustomerOwnershipBinding["state"],
    };
  }

  async listAccountHistory(customerUserId: string) {
    const { data, error } = await this.client.rpc(
      "resolve_customer_account_history_v1",
      { p_customer_user_id: customerUserId },
    );
    if (error || !Array.isArray(data)) databaseFailure(error);
    return data.map((value): CustomerAccountHistoryItem => {
      const row = record(value);
      return {
        purchaseIntentId: string(row.purchase_intent_id),
        deliveryId: nullableString(row.delivery_id),
        date: string(row.created_at),
        state: string(row.state) as CustomerAccountHistoryItem["state"],
      };
    });
  }

  async resolveOwnedResult(input: Parameters<CustomerIdentityRepository["resolveOwnedResult"]>[0]): Promise<CustomerOwnedResult | null> {
    const { data, error } = await this.client.rpc(
      "resolve_customer_account_result_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_delivery_id: input.deliveryId,
      },
    );
    if (error) databaseFailure(error);
    if (data === null) return null;
    const row = record(data);
    const hash = string(row.projection_sha256);
    return {
      deliveryId: string(row.delivery_id),
      projection: decodeAndVerifyProductionCanonicalProjection(
        row.experience_projection_json,
        hash,
      ),
    };
  }

  async detachIdentity(input: Parameters<CustomerIdentityRepository["detachIdentity"]>[0]) {
    const { error } = await this.client.rpc(
      "detach_production_customer_identity_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_request_id: input.requestId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
  }
}
