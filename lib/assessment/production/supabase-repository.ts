/**
 * Server-runtime infrastructure shared by the guarded Next service and the
 * Netlify worker. Credentials are constructor-injected; browser reachability
 * is rejected by the async-router worker-graph verifier.
 */
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { M2RuntimeError } from "../runtime/errors.ts";
import type {
  AssessmentRequestSource,
  JsonObject,
  JsonValue,
  PersistedAssessmentRequest,
  PurchaseReadyRuntimeAuthorityV1,
  RelationshipValue,
  RequestedTopic,
} from "../runtime/types.ts";
import type { PrepaymentSafetyResultV1 } from "../../purchase/prepayment-safety-types-v1.ts";
import {
  decodeProductionConsultationInputV1,
  toAssessmentInput,
} from "./consultation.ts";
import { decodeAndVerifyProductionCanonicalProjection } from "./canonical-delivery.ts";
import type {
  BeginPrepaymentIntakeRecord,
  PrepaymentComputeAuthorityRepository,
} from "./prepayment-compute.ts";
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
  ProductionNotificationClaim,
  ProductionPreparationRecord,
  ResolvedProductionResult,
} from "./types.ts";

type RequestRow = {
  id: string;
  idempotency_key: string;
  source: AssessmentRequestSource;
  raw_situation: string;
  optional_message: string | null;
  relationship: RelationshipValue;
  requested_topics: RequestedTopic[];
  privacy_acknowledged: boolean;
  status: "processing" | "awaiting_clarification" | "completed" | "failed";
  created_at: string;
  updated_at: string;
};

type PreparationRow = {
  id: string;
  assessment_request_id: string;
  idempotency_key_hash: string;
  consultation_snapshot_sha256: string;
  consultation_snapshot_json: JsonObject;
  safety_authority_json: JsonObject;
  status:
    | "preparing"
    | "awaiting_clarification"
    | "purchase_ready"
    | "stopped"
    | "failed"
    | "consumed"
    | "revoked";
  stop_reason: "not_full_product_candidate" | "safety_blocked" | null;
  clarification_id: string | null;
  clarification_capability_hash: string | null;
  clarification_question: string | null;
  clarification_answer_fingerprint: string | null;
  purchase_capability_hash: string | null;
  purchase_ready_authority_json: JsonObject | null;
  purchase_ready_authority_sha256: string | null;
  last_error_code: string | null;
  created_at: string;
  updated_at: string;
};

type DeliveryRow = {
  id: string;
  logical_assessment_id: string;
  runtime_run_id: string;
  experience_projection_json: JsonObject;
  projection_sha256: string;
  delivery_authority_reference: string;
  created_at: string;
};

type LogicalAssessmentIdentityRow = {
  id: string;
  grant_id: string;
  status: "pending" | "generating" | "retryable" | "completed" | "revoked";
};

type NotificationRow = {
  id: string;
  delivery_id: string;
  delivery_authority_reference: string;
  status: "pending" | "processing" | "failed" | "sent";
  attempt_count: number;
  owner_id: string | null;
};

type RuntimeTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type ProductionDatabase = {
  public: {
    Tables: {
      assessment_requests: RuntimeTable<RequestRow>;
      production_preparations: RuntimeTable<PreparationRow>;
      production_logical_assessments: RuntimeTable<LogicalAssessmentIdentityRow>;
      production_customer_deliveries: RuntimeTable<DeliveryRow>;
      production_result_credentials: RuntimeTable<{
        id: string;
        delivery_id: string;
        token_hash: string;
        purpose: "customer_handoff" | "notification" | "recovery";
        issued_at: string;
        expires_at: string | null;
        revoked_at: string | null;
      }>;
      production_notification_outbox: RuntimeTable<NotificationRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      begin_production_preparation_v1: RuntimeFunction;
      finalize_production_preparation_v1: RuntimeFunction;
      fail_production_preparation_v1: RuntimeFunction;
      rotate_production_preparation_capability_v1: RuntimeFunction;
      issue_production_assessment_grant_v1: RuntimeFunction;
      issue_rc2_production_assessment_grant_v2: RuntimeFunction;
      claim_production_fulfillment_v2: RuntimeFunction;
      mark_production_generation_started_v2: RuntimeFunction;
      complete_production_fulfillment_v2: RuntimeFunction;
      fail_production_fulfillment_v2: RuntimeFunction;
      resolve_production_result_v1: RuntimeFunction;
      claim_production_notification_v3: RuntimeFunction;
      prepare_production_notification_email_v1: RuntimeFunction;
      begin_production_notification_send_v1: RuntimeFunction;
      complete_production_notification_v2: RuntimeFunction;
      fail_production_notification_v2: RuntimeFunction;
      begin_production_prepayment_intake_v1: RuntimeFunction;
      resolve_production_prepayment_continuation_v1: RuntimeFunction;
      claim_production_prepayment_execution_v1: RuntimeFunction;
      begin_production_prepayment_clarification_v1: RuntimeFunction;
      finalize_production_prepayment_execution_v1: RuntimeFunction;
      fail_production_prepayment_execution_v1: RuntimeFunction;
      claim_production_prepayment_compute_unit_v1: RuntimeFunction;
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type RuntimeFunction = {
  Args: Record<string, unknown>;
  Returns: JsonValue;
};

function databaseFailure(error?: unknown): never {
  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";
  if (
    message.includes("PRODUCTION_IDEMPOTENCY_CONFLICT")
  ) {
    throw new M2RuntimeError("PRODUCTION_IDEMPOTENCY_CONFLICT", 409);
  }
  if (message.includes("M2_C1_EXECUTION_AUTHORIZATION_INVALID")) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_AUTHORIZATION_INVALID", 403);
  }
  if (message.includes("M2_C1_COMPUTE_POLICY_INVALID")) {
    throw new M2RuntimeError("PREPAYMENT_COMPUTE_CONFIGURATION_INVALID", 503);
  }
  throw new M2RuntimeError("PRODUCTION_DATABASE_OPERATION_FAILED", 503);
}

function recordValue(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    databaseFailure();
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown) {
  if (typeof value !== "string" || value.length === 0) databaseFailure();
  return value;
}

function mapRequest(row: RequestRow): PersistedAssessmentRequest {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    source: row.source,
    currentSituation: row.raw_situation,
    optionalMessage: row.optional_message,
    relationship: row.relationship,
    requestedTopics: [...row.requested_topics],
    privacyAcknowledged: true,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPreparation(row: PreparationRow): ProductionPreparationRecord {
  const consultation = decodeProductionConsultationInputV1(
    row.consultation_snapshot_json,
  );
  return {
    id: row.id,
    requestId: row.assessment_request_id,
    idempotencyKeyHash: row.idempotency_key_hash,
    consultationSnapshotHash: row.consultation_snapshot_sha256,
    consultationSnapshot: consultation,
    assessmentInput: toAssessmentInput(consultation),
    safetyAuthority: structuredClone(
      row.safety_authority_json,
    ) as unknown as PrepaymentSafetyResultV1,
    status: row.status,
    stopReason: row.stop_reason,
    clarificationId: row.clarification_id,
    clarificationCapabilityHash: row.clarification_capability_hash,
    clarificationQuestion: row.clarification_question,
    clarificationAnswerFingerprint: row.clarification_answer_fingerprint,
    purchaseCapabilityHash: row.purchase_capability_hash,
    purchaseReadyAuthority:
      row.purchase_ready_authority_json === null
        ? null
        : (structuredClone(
            row.purchase_ready_authority_json,
          ) as unknown as PurchaseReadyRuntimeAuthorityV1),
    purchaseReadyAuthorityHash: row.purchase_ready_authority_sha256,
    lastErrorCode: row.last_error_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDelivery(row: DeliveryRow): ProductionCanonicalDeliveryRecord {
  return {
    id: row.id,
    logicalAssessmentId: row.logical_assessment_id,
    runtimeRunId: row.runtime_run_id,
    projection: decodeAndVerifyProductionCanonicalProjection(
      row.experience_projection_json,
      row.projection_sha256,
    ),
    projectionHash: row.projection_sha256,
    deliveryAuthorityReference: row.delivery_authority_reference,
    createdAt: row.created_at,
  };
}

export class SupabaseProductionFulfillmentRepository
  implements ProductionFulfillmentRepository, PrepaymentComputeAuthorityRepository
{
  private readonly client: SupabaseClient<ProductionDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<ProductionDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  async getPreparationById(preparationId: string) {
    const { data, error } = await this.client
      .from("production_preparations")
      .select("*")
      .eq("id", preparationId)
      .maybeSingle();
    if (error) databaseFailure();
    return data ? mapPreparation(data) : null;
  }

  private async getRequest(requestId: string) {
    const { data, error } = await this.client
      .from("assessment_requests")
      .select("*")
      .eq("id", requestId)
      .maybeSingle();
    if (error || !data) databaseFailure();
    return mapRequest(data);
  }

  private async getDeliveryByLogicalAssessment(logicalAssessmentId: string) {
    const { data, error } = await this.client
      .from("production_customer_deliveries")
      .select("*")
      .eq("logical_assessment_id", logicalAssessmentId)
      .maybeSingle();
    if (error) databaseFailure();
    return data ? mapDelivery(data) : null;
  }

  async beginPreparation(
    record: BeginProductionPreparationRecord,
  ): Promise<BeginProductionPreparationOutcome> {
    const { data, error } = await this.client.rpc(
      "begin_production_preparation_v1",
      {
        p_preparation_id: record.preparationId,
        p_request_id: record.requestId,
        p_idempotency_key_hash: record.idempotencyKeyHash,
        p_consultation_snapshot_sha256: record.consultationSnapshotHash,
        p_consultation_snapshot_json: record.consultationSnapshot,
        p_safety_authority_json: record.safetyAuthority,
        p_current_situation: record.assessmentInput.currentSituation,
        p_optional_message: record.assessmentInput.optionalMessage,
        p_relationship: record.assessmentInput.relationship,
        p_requested_topics: record.assessmentInput.requestedTopics,
        p_now: record.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    const disposition = result.disposition;
    if (disposition !== "created" && disposition !== "existing") {
      databaseFailure();
    }
    const preparationId = stringValue(result.preparation_id);
    const preparation = await this.getPreparationById(preparationId);
    if (!preparation) databaseFailure();
    return {
      disposition,
      preparation,
      request: await this.getRequest(preparation.requestId),
    };
  }
  async beginPrepaymentIntake(record: BeginPrepaymentIntakeRecord) {
    const { data, error } = await this.client.rpc(
      "begin_production_prepayment_intake_v1",
      {
        p_preparation_id: record.preparationId,
        p_request_id: record.requestId,
        p_idempotency_key_hash: record.idempotencyKeyHash,
        p_consultation_snapshot_sha256: record.consultationSnapshotHash,
        p_consultation_snapshot_json: record.consultationSnapshot,
        p_safety_authority_json: record.safetyAuthority,
        p_current_situation: record.assessmentInput.currentSituation,
        p_optional_message: record.assessmentInput.optionalMessage,
        p_relationship: record.assessmentInput.relationship,
        p_requested_topics: record.assessmentInput.requestedTopics,
        p_execution_capability_hash: record.executionCapabilityHash,
        p_now: record.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    const disposition = result.disposition;
    const executionDisposition = result.execution_disposition;
    if (
      (disposition !== "created" && disposition !== "existing") ||
      ![
        "awaiting_auth",
        "executing",
        "awaiting_clarification",
        "completed",
        "failed",
      ].includes(String(executionDisposition))
    ) {
      databaseFailure();
    }
    const preparationId = stringValue(result.preparation_id);
    const preparation = await this.getPreparationById(preparationId);
    if (!preparation) databaseFailure();
    return {
      disposition: disposition as "created" | "existing",
      executionDisposition: executionDisposition as
        | "awaiting_auth"
        | "executing"
        | "awaiting_clarification"
        | "completed"
        | "failed",
      preparation,
      request: await this.getRequest(preparation.requestId),
    };
  }

  async resolvePrepaymentContinuation(input: {
    customerUserId: string;
    continuationTokenHash: string;
    now: string;
  }) {
    const { data, error } = await this.client.rpc(
      "resolve_production_prepayment_continuation_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_continuation_token_hash: input.continuationTokenHash,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    return data === null ? null : stringValue(data);
  }

  async claimPrepaymentExecution(input: {
    customerUserId: string;
    preparationId: string;
    now: string;
  }) {
    const { data, error } = await this.client.rpc(
      "claim_production_prepayment_execution_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_preparation_id: input.preparationId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const disposition = stringValue(data);
    if (!["acquired", "in_progress", "completed"].includes(disposition)) {
      databaseFailure();
    }
    const preparation = await this.getPreparationById(input.preparationId);
    if (!preparation) databaseFailure();
    return {
      disposition: disposition as "acquired" | "in_progress" | "completed",
      preparationId: input.preparationId,
      preparation,
      request: await this.getRequest(preparation.requestId),
    };
  }

  async beginPrepaymentClarification(input: {
    customerUserId: string;
    preparationId: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "begin_production_prepayment_clarification_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_preparation_id: input.preparationId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
  }

  async finalizePrepaymentExecution(record: FinalizeProductionPreparationRecord) {
    const { error } = await this.client.rpc(
      "finalize_production_prepayment_execution_v1",
      {
        p_preparation_id: record.preparationId,
        p_status: record.status,
        p_stop_reason: record.stopReason,
        p_clarification_id: record.clarificationId,
        p_clarification_capability_hash: record.clarificationCapabilityHash,
        p_clarification_question: record.clarificationQuestion,
        p_clarification_answer_fingerprint:
          record.clarificationAnswerFingerprint,
        p_purchase_capability_hash: record.purchaseCapabilityHash,
        p_purchase_ready_authority_json: record.purchaseReadyAuthority,
        p_purchase_ready_authority_sha256:
          record.purchaseReadyAuthorityHash,
        p_now: record.now,
      },
    );
    if (error) databaseFailure(error);
  }

  async failPrepaymentExecution(input: {
    preparationId: string;
    errorCode: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "fail_production_prepayment_execution_v1",
      {
        p_preparation_id: input.preparationId,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
  }

  async claimComputeUnit(
    input: Parameters<PrepaymentComputeAuthorityRepository["claimComputeUnit"]>[0],
  ) {
    const { data, error } = await this.client.rpc(
      "claim_production_prepayment_compute_unit_v1",
      {
        p_customer_user_id: input.customerUserId,
        p_preparation_id: input.preparationId,
        p_now: input.now,
        p_policy_version: input.policy.policyVersion,
        p_window_seconds: input.policy.windowSeconds,
        p_max_provider_invocations: input.policy.maximumProviderInvocations,
        p_stage_id: input.stageId,
        p_attempt_number: input.attemptNumber,
      },
    );
    if (error) databaseFailure(error);
    const disposition = stringValue(data);
    if (disposition !== "acquired" && disposition !== "exhausted") {
      databaseFailure();
    }
    return disposition;
  }

  async finalizePreparation(record: FinalizeProductionPreparationRecord) {
    const { error } = await this.client.rpc(
      "finalize_production_preparation_v1",
      {
        p_preparation_id: record.preparationId,
        p_status: record.status,
        p_stop_reason: record.stopReason,
        p_clarification_id: record.clarificationId,
        p_clarification_capability_hash: record.clarificationCapabilityHash,
        p_clarification_question: record.clarificationQuestion,
        p_clarification_answer_fingerprint:
          record.clarificationAnswerFingerprint,
        p_purchase_capability_hash: record.purchaseCapabilityHash,
        p_purchase_ready_authority_json: record.purchaseReadyAuthority,
        p_purchase_ready_authority_sha256:
          record.purchaseReadyAuthorityHash,
        p_now: record.now,
      },
    );
    if (error) databaseFailure();
    const preparation = await this.getPreparationById(record.preparationId);
    if (!preparation) databaseFailure();
    return preparation;
  }

  async failPreparation(input: {
    preparationId: string;
    errorCode: string;
    now: string;
  }) {
    const { error } = await this.client.rpc("fail_production_preparation_v1", {
      p_preparation_id: input.preparationId,
      p_error_code: input.errorCode,
      p_now: input.now,
    });
    if (error) databaseFailure();
  }

  async getPreparationByIdempotency(idempotencyKeyHash: string) {
    const { data, error } = await this.client
      .from("production_preparations")
      .select("*")
      .eq("idempotency_key_hash", idempotencyKeyHash)
      .maybeSingle();
    if (error) databaseFailure();
    return data ? mapPreparation(data) : null;
  }

  async getPreparationByClarificationCapability(capabilityHash: string) {
    const { data, error } = await this.client
      .from("production_preparations")
      .select("*")
      .eq("clarification_capability_hash", capabilityHash)
      .maybeSingle();
    if (error) databaseFailure();
    return data ? mapPreparation(data) : null;
  }

  private async rotateCapability(
    preparationId: string,
    capabilityKind: "clarification" | "purchase",
    capabilityHash: string,
    now: string,
  ) {
    const { error } = await this.client.rpc(
      "rotate_production_preparation_capability_v1",
      {
        p_preparation_id: preparationId,
        p_capability_kind: capabilityKind,
        p_capability_hash: capabilityHash,
        p_now: now,
      },
    );
    if (error) databaseFailure();
  }

  rotateClarificationCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ) {
    return this.rotateCapability(
      preparationId,
      "clarification",
      capabilityHash,
      now,
    );
  }

  rotatePurchaseCapability(
    preparationId: string,
    capabilityHash: string,
    now: string,
  ) {
    return this.rotateCapability(
      preparationId,
      "purchase",
      capabilityHash,
      now,
    );
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
    const { data, error } = await this.client.rpc(
      "issue_production_assessment_grant_v1",
      {
        p_grant_id: input.grantId,
        p_purchase_id: input.purchaseId,
        p_logical_assessment_id: input.logicalAssessmentId,
        p_preparation_capability_hash: input.preparationCapabilityHash,
        p_purchase_authority_reference_hash:
          input.purchaseAuthorityReferenceHash,
        p_delivery_authority_reference: input.deliveryAuthorityReference,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
    const result = recordValue(data);
    return {
      schemaVersion: "rc1-assessment-grant-handle-v1",
      grantId: stringValue(result.grant_id),
      logicalAssessmentId: stringValue(result.logical_assessment_id),
    };
  }

  async claimFulfillment(input: {
    grantId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<ProductionFulfillmentClaim> {
    const { data, error } = await this.client.rpc(
      "claim_production_fulfillment_v2",
      {
        p_grant_id: input.grantId,
        p_owner_id: input.ownerId,
        p_lease_expires_at: input.leaseExpiresAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
    const result = recordValue(data);
    const disposition = result.disposition;
    if (
      disposition !== "acquired" &&
      disposition !== "in_progress" &&
      disposition !== "completed" &&
      disposition !== "manual_review"
    ) {
      databaseFailure();
    }
    const preparationId = stringValue(result.preparation_id);
    const preparation = await this.getPreparationById(preparationId);
    if (!preparation) databaseFailure();
    const logicalAssessmentId = stringValue(result.logical_assessment_id);
    return {
      disposition,
      grantId: stringValue(result.grant_id),
      logicalAssessmentId,
      ownerId:
        typeof result.owner_id === "string" ? result.owner_id : null,
      leaseExpiresAt:
        typeof result.lease_expires_at === "string"
          ? result.lease_expires_at
          : null,
      preparation,
      request: await this.getRequest(preparation.requestId),
      canonicalDelivery:
        disposition === "completed"
          ? await this.getDeliveryByLogicalAssessment(logicalAssessmentId)
          : null,
      recoverableRuntimeRunId:
        typeof result.recoverable_runtime_run_id === "string"
          ? result.recoverable_runtime_run_id
          : null,
    };
  }

  async markGenerationStarted(input: {
    logicalAssessmentId: string;
    ownerId: string;
    now: string;
  }) {
    const { data, error } = await this.client.rpc(
      "mark_production_generation_started_v2",
      {
        p_logical_assessment_id: input.logicalAssessmentId,
        p_owner_id: input.ownerId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
    return stringValue(data);
  }

  async completeFulfillment(record: CompleteProductionFulfillmentRecord) {
    const { error } = await this.client.rpc(
      "complete_production_fulfillment_v2",
      {
        p_grant_id: record.grantId,
        p_logical_assessment_id: record.logicalAssessmentId,
        p_owner_id: record.ownerId,
        p_runtime_run_id: record.runtimeRunId,
        p_delivery_id: record.deliveryId,
        p_experience_projection_json: record.projection,
        p_projection_sha256: record.projectionHash,
        p_result_credential_id: record.resultCredentialId,
        p_result_token_hash: record.resultTokenHash,
        p_notification_id: record.notificationId,
        p_now: record.now,
      },
    );
    if (error) databaseFailure();
    const delivery = await this.getDeliveryByLogicalAssessment(
      record.logicalAssessmentId,
    );
    if (!delivery) databaseFailure();
    return delivery;
  }

  async failFulfillment(input: {
    logicalAssessmentId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "fail_production_fulfillment_v2",
      {
        p_logical_assessment_id: input.logicalAssessmentId,
        p_owner_id: input.ownerId,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
  }

  async addResultCredential(input: {
    credentialId: string;
    deliveryId: string;
    tokenHash: string;
    purpose: "customer_handoff" | "notification" | "recovery";
    now: string;
  }) {
    const { error } = await this.client
      .from("production_result_credentials")
      .insert({
        id: input.credentialId,
        delivery_id: input.deliveryId,
        token_hash: input.tokenHash,
        purpose: input.purpose,
        issued_at: input.now,
        expires_at: null,
        revoked_at: null,
      });
    if (error) databaseFailure();
  }

  async revokeResultCredential(credentialId: string, now: string) {
    const { error } = await this.client
      .from("production_result_credentials")
      .update({ revoked_at: now })
      .eq("id", credentialId)
      .is("revoked_at", null);
    if (error) databaseFailure();
  }

  async resolveResultToken(
    tokenHash: string,
    now: string,
  ): Promise<ResolvedProductionResult | null> {
    const { data, error } = await this.client.rpc(
      "resolve_production_result_v1",
      { p_token_hash: tokenHash, p_now: now },
    );
    if (error) databaseFailure();
    if (data === null) return null;
    const result = recordValue(data);
    const projectionHash = result.projection_sha256;
    return {
      deliveryId: stringValue(result.delivery_id),
      projection: decodeAndVerifyProductionCanonicalProjection(
        result.experience_projection_json,
        projectionHash,
      ),
    };
  }

  async findCompletedDeliveryForGrant(input: {
    grantId: string;
    logicalAssessmentId: string;
  }) {
    const { data, error } = await this.client
      .from("production_logical_assessments")
      .select("id,grant_id,status")
      .eq("id", input.logicalAssessmentId)
      .eq("grant_id", input.grantId)
      .eq("status", "completed")
      .maybeSingle();
    if (error) databaseFailure();
    if (!data) return null;
    return this.getDeliveryByLogicalAssessment(input.logicalAssessmentId);
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
    const { data, error } = await this.client.rpc(
      "issue_rc2_production_assessment_grant_v2",
      {
        p_grant_id: input.grantId,
        p_purchase_id: input.purchaseId,
        p_logical_assessment_id: input.logicalAssessmentId,
        p_verified_payment_id: input.verifiedPaymentId,
        p_preparation_id: input.preparationId,
        p_purchase_authority_reference_hash:
          input.purchaseAuthorityReferenceHash,
        p_delivery_authority_reference: input.deliveryAuthorityReference,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    return {
      schemaVersion: "rc1-assessment-grant-handle-v1",
      grantId: stringValue(result.grant_id),
      logicalAssessmentId: stringValue(result.logical_assessment_id),
    };
  }

  async claimNotification(input: {
    notificationId: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<ProductionNotificationClaim | null> {
    const { data, error } = await this.client.rpc(
      "claim_production_notification_v3",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_lease_expires_at: input.leaseExpiresAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
    if (data === null) return null;
    const result = recordValue(data);
    const disposition = stringValue(result.disposition);
    if (
      disposition === "in_progress" ||
      disposition === "sent" ||
      disposition === "manual_review"
    ) {
      return { disposition, notification: null };
    }
    if (disposition !== "acquired" && disposition !== "reclaimed") {
      databaseFailure();
    }
    const notification: ProductionNotificationRecord = {
      id: stringValue(result.id),
      deliveryId: stringValue(result.delivery_id),
      deliveryAuthorityReference: stringValue(
        result.delivery_authority_reference,
      ),
      status: "processing",
      attemptCount:
        typeof result.attempt_count === "number"
          ? result.attempt_count
          : databaseFailure(),
      ownerId: input.ownerId,
      payloadCiphertext: result.email_payload_ciphertext === null
        ? null : stringValue(result.email_payload_ciphertext),
    };
    return { disposition: "acquired", notification };
  }

  async prepareNotificationEmail(input: {
    notificationId: string; ownerId: string; credentialId: string;
    tokenHash: string; payloadCiphertext: string; now: string;
  }) {
    const { data, error } = await this.client.rpc("prepare_production_notification_email_v1", {
      p_notification_id: input.notificationId, p_owner_id: input.ownerId,
      p_credential_id: input.credentialId, p_token_hash: input.tokenHash,
      p_payload_ciphertext: input.payloadCiphertext, p_now: input.now,
    });
    if (error) databaseFailure();
    return stringValue(data);
  }

  async beginNotificationSend(input: { notificationId: string; ownerId: string; now: string }) {
    const { error } = await this.client.rpc("begin_production_notification_send_v1", {
      p_notification_id: input.notificationId, p_owner_id: input.ownerId, p_now: input.now,
    });
    if (error) databaseFailure();
  }

  async completeNotification(input: {
    notificationId: string;
    ownerId: string;
    providerMessageReference: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "complete_production_notification_v2",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_provider_message_reference: input.providerMessageReference,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
  }

  async failNotification(input: {
    notificationId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "fail_production_notification_v2",
      {
        p_notification_id: input.notificationId,
        p_owner_id: input.ownerId,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure();
  }

  async findNotificationIdByDeliveryAuthorityReference(
    deliveryAuthorityReference: string,
  ) {
    const { data, error } = await this.client
      .from("production_notification_outbox")
      .select("id")
      .eq("delivery_authority_reference", deliveryAuthorityReference)
      .maybeSingle();
    if (error) databaseFailure();
    return data?.id ?? null;
  }
}
