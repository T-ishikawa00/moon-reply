import "server-only";
import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type { JsonValue } from "../../assessment/runtime/types.ts";
import type {
  EmailChallengeRecord,
  FulfillmentJobClaim,
  FulfillmentJobRecord,
  PaymentAttemptRecord,
  PaymentDeliveryRepository,
  PaymentEnvironment,
  PaymentEvidenceVerification,
  PurchaseIntentRecord,
  PurchaseReadyPreparation,
  PurchaseStatusRecord,
  RecordedPaymentEvidence,
  StripePaymentEvidenceV1,
  TrustedEmailContext,
  TrustedEmailSession,
  VerifiedEmailAuthority,
} from "./types.ts";

type RuntimeTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type RuntimeFunction = {
  Args: Record<string, unknown>;
  Returns: JsonValue;
};

type PreparationRow = {
  id: string;
  status: string;
  purchase_capability_hash: string | null;
  purchase_ready_authority_sha256: string | null;
};

type VerifiedEmailRow = {
  id: string;
  delivery_authority_reference: string;
  email_sha256: string;
  email_ciphertext: string;
  verified_at: string;
  revoked_at: string | null;
};

type TrustedSessionRow = {
  id: string;
  verified_email_authority_id: string;
  session_token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

type PurchaseIntentRow = {
  id: string;
  preparation_id: string;
  verified_email_authority_id: string;
  trusted_email_session_id: string;
  delivery_authority_reference: string;
  expected_product_code: string;
  expected_amount: number;
  currency: "jpy";
  purchase_kind: "one_time";
  environment: PaymentEnvironment;
  provider: "stripe";
  state: PurchaseIntentRecord["state"];
  current_payment_attempt_id: string | null;
  successful_payment_id: string | null;
  status_capability_hash: string;
  final_confirmation_accepted_at: string;
  created_at: string;
  updated_at: string;
};

type PaymentAttemptRow = {
  id: string;
  purchase_intent_id: string;
  sequence_number: number;
  state: PaymentAttemptRecord["state"];
  provider_idempotency_key_hash: string;
  provider_checkout_session_id: string | null;
  provider_payment_id: string | null;
  provider_checkout_url: string | null;
  last_provider_event_created_at: string | null;
  created_at: string;
  updated_at: string;
};

type FulfillmentJobRow = {
  id: string;
  purchase_intent_id: string;
  verified_payment_id: string;
  preparation_id: string;
  delivery_authority_reference: string;
  state: FulfillmentJobRecord["state"];
  owner_id: string | null;
  lease_expires_at: string | null;
  attempt_count: number;
  grant_id: string | null;
  logical_assessment_id: string | null;
  last_error_code: string | null;
  completed_at: string | null;
};

type PaymentDatabase = {
  public: {
    Tables: {
      production_preparations: RuntimeTable<PreparationRow>;
      production_verified_email_authorities: RuntimeTable<VerifiedEmailRow>;
      production_trusted_email_sessions: RuntimeTable<TrustedSessionRow>;
      production_purchase_intents: RuntimeTable<PurchaseIntentRow>;
      production_payment_attempts: RuntimeTable<PaymentAttemptRow>;
      production_fulfillment_jobs: RuntimeTable<FulfillmentJobRow>;
    };
    Views: { [_ in never]: never };
    Functions: {
      begin_rc2_email_challenge_v1: RuntimeFunction;
      mark_rc2_email_challenge_delivery_failed_v1: RuntimeFunction;
      consume_rc2_email_challenge_v1: RuntimeFunction;
      begin_rc2_purchase_intent_v1: RuntimeFunction;
      reserve_rc2_payment_attempt_v1: RuntimeFunction;
      attach_rc2_checkout_session_v1: RuntimeFunction;
      mark_rc2_payment_attempt_unknown_v1: RuntimeFunction;
      record_rc2_stripe_evidence_v1: RuntimeFunction;
      claim_rc2_fulfillment_job_v1: RuntimeFunction;
      complete_rc2_fulfillment_job_v1: RuntimeFunction;
      fail_rc2_fulfillment_job_v1: RuntimeFunction;
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
  const known = [
    ["RC2_EMAIL_VERIFICATION_INVALID", 403],
    ["RC2_PURCHASE_READY_REQUIRED", 403],
    ["RC2_VERIFIED_EMAIL_REQUIRED", 403],
    ["RC2_PURCHASE_INTENT_CONFLICT", 409],
    ["RC2_PAYMENT_ATTEMPT_BLOCKED", 409],
    ["RC2_FULFILLMENT_JOB_CONFLICT", 409],
  ] as const;
  for (const [code, status] of known) {
    if (message.includes(code)) throw new M2RuntimeError(code, status);
  }
  throw new M2RuntimeError("PAYMENT_DATABASE_OPERATION_FAILED", 503);
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

function nullableString(value: unknown) {
  if (value === null) return null;
  return stringValue(value);
}

function mapAuthority(row: VerifiedEmailRow): VerifiedEmailAuthority {
  return {
    id: row.id,
    deliveryAuthorityReference: row.delivery_authority_reference,
    emailHash: row.email_sha256,
    emailCiphertext: row.email_ciphertext,
    verifiedAt: row.verified_at,
    revokedAt: row.revoked_at,
  };
}

function mapSession(row: TrustedSessionRow): TrustedEmailSession {
  return {
    id: row.id,
    verifiedEmailAuthorityId: row.verified_email_authority_id,
    sessionTokenHash: row.session_token_hash,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
  };
}

function mapAttempt(row: PaymentAttemptRow): PaymentAttemptRecord {
  return {
    id: row.id,
    purchaseIntentId: row.purchase_intent_id,
    sequence: row.sequence_number,
    state: row.state,
    providerIdempotencyKeyHash: row.provider_idempotency_key_hash,
    providerCheckoutSessionId: row.provider_checkout_session_id,
    providerPaymentId: row.provider_payment_id,
    providerCheckoutUrl: row.provider_checkout_url,
    lastProviderEventCreatedAt: row.last_provider_event_created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapJob(row: FulfillmentJobRow): FulfillmentJobRecord {
  return {
    id: row.id,
    purchaseIntentId: row.purchase_intent_id,
    verifiedPaymentId: row.verified_payment_id,
    preparationId: row.preparation_id,
    deliveryAuthorityReference: row.delivery_authority_reference,
    state: row.state,
    ownerId: row.owner_id,
    leaseExpiresAt: row.lease_expires_at,
    attemptCount: row.attempt_count,
    grantId: row.grant_id,
    logicalAssessmentId: row.logical_assessment_id,
    lastErrorCode: row.last_error_code,
    completedAt: row.completed_at,
  };
}

export class SupabasePaymentDeliveryRepository
  implements PaymentDeliveryRepository
{
  private readonly client: SupabaseClient<PaymentDatabase>;

  constructor(url: string, secretKey: string) {
    this.client = createClient<PaymentDatabase>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  private async getAuthority(authorityId: string) {
    const { data, error } = await this.client
      .from("production_verified_email_authorities")
      .select("*")
      .eq("id", authorityId)
      .maybeSingle();
    if (error) databaseFailure(error);
    return data ? mapAuthority(data) : null;
  }

  private async mapIntent(row: PurchaseIntentRow): Promise<PurchaseIntentRecord> {
    const authority = await this.getAuthority(row.verified_email_authority_id);
    if (!authority) databaseFailure();
    return {
      id: row.id,
      preparationId: row.preparation_id,
      verifiedEmailAuthorityId: row.verified_email_authority_id,
      trustedEmailSessionId: row.trusted_email_session_id,
      deliveryAuthorityReference: row.delivery_authority_reference,
      emailCiphertext: authority.emailCiphertext,
      expectedProductCode: row.expected_product_code,
      expectedAmount: row.expected_amount,
      currency: row.currency,
      purchaseKind: row.purchase_kind,
      environment: row.environment,
      provider: row.provider,
      state: row.state,
      currentPaymentAttemptId: row.current_payment_attempt_id,
      successfulPaymentId: row.successful_payment_id,
      statusCapabilityHash: row.status_capability_hash,
      finalConfirmationAcceptedAt: row.final_confirmation_accepted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findPurchaseReadyPreparation(
    preparationCapabilityHash: string,
  ): Promise<PurchaseReadyPreparation | null> {
    const { data, error } = await this.client
      .from("production_preparations")
      .select("id,status,purchase_capability_hash,purchase_ready_authority_sha256")
      .eq("purchase_capability_hash", preparationCapabilityHash)
      .in("status", ["purchase_ready", "consumed"])
      .maybeSingle();
    if (error) databaseFailure(error);
    if (
      !data ||
      (data.status !== "purchase_ready" && data.status !== "consumed") ||
      !data.purchase_ready_authority_sha256
    ) {
      return null;
    }
    return {
      id: data.id,
      status: data.status,
      purchaseReadyAuthorityHash: data.purchase_ready_authority_sha256,
    };
  }

  async findTrustedEmailSession(input: {
    sessionTokenHash: string;
    emailHash?: string;
    now: string;
  }): Promise<TrustedEmailContext | null> {
    const { data, error } = await this.client
      .from("production_trusted_email_sessions")
      .select("*")
      .eq("session_token_hash", input.sessionTokenHash)
      .is("revoked_at", null)
      .gt("expires_at", input.now)
      .maybeSingle();
    if (error) databaseFailure(error);
    if (!data) return null;
    const authority = await this.getAuthority(data.verified_email_authority_id);
    if (
      !authority ||
      authority.revokedAt !== null ||
      (input.emailHash !== undefined && authority.emailHash !== input.emailHash)
    ) {
      return null;
    }
    return { session: mapSession(data), authority };
  }

  async createEmailChallenge(input: {
    preparationCapabilityHash: string;
    challenge: EmailChallengeRecord;
  }) {
    const { error } = await this.client.rpc("begin_rc2_email_challenge_v1", {
      p_preparation_capability_hash: input.preparationCapabilityHash,
      p_challenge_id: input.challenge.id,
      p_challenge_capability_hash: input.challenge.challengeCapabilityHash,
      p_verification_secret_hash: input.challenge.verificationSecretHash,
      p_email_sha256: input.challenge.emailHash,
      p_email_ciphertext: input.challenge.emailCiphertext,
      p_maximum_attempts: input.challenge.maximumAttempts,
      p_expires_at: input.challenge.expiresAt,
      p_now: input.challenge.createdAt,
    });
    if (error) databaseFailure(error);
  }

  async markEmailChallengeDeliveryFailed(input: {
    challengeId: string;
    now: string;
    errorCode: string;
  }) {
    const { error } = await this.client.rpc(
      "mark_rc2_email_challenge_delivery_failed_v1",
      {
        p_challenge_id: input.challengeId,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
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
    const { data, error } = await this.client.rpc(
      "consume_rc2_email_challenge_v1",
      {
        p_challenge_capability_hash: input.challengeCapabilityHash,
        p_verification_secret_hash: input.verificationSecretHash,
        p_verified_email_authority_id: input.verifiedEmailAuthorityId,
        p_delivery_authority_reference: input.deliveryAuthorityReference,
        p_trusted_session_id: input.trustedSessionId,
        p_trusted_session_token_hash: input.trustedSessionTokenHash,
        p_trusted_session_expires_at: input.trustedSessionExpiresAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    if (data === null) return null;
    const result = recordValue(data);
    if (result.disposition !== "verified") return null;
    const authority = await this.getAuthority(
      stringValue(result.verified_email_authority_id),
    );
    const { data: sessionRow, error: sessionError } = await this.client
      .from("production_trusted_email_sessions")
      .select("*")
      .eq("id", stringValue(result.trusted_session_id))
      .maybeSingle();
    if (sessionError || !authority || !sessionRow) databaseFailure(sessionError);
    return { authority, session: mapSession(sessionRow) };
  }

  async beginPurchaseIntent(input: {
    purchaseIntent: PurchaseIntentRecord;
    preparationCapabilityHash: string;
    trustedSessionTokenHash: string;
    now: string;
  }) {
    const { data, error } = await this.client.rpc(
      "begin_rc2_purchase_intent_v1",
      {
        p_purchase_intent_id: input.purchaseIntent.id,
        p_preparation_capability_hash: input.preparationCapabilityHash,
        p_trusted_session_token_hash: input.trustedSessionTokenHash,
        p_status_capability_hash: input.purchaseIntent.statusCapabilityHash,
        p_delivery_authority_reference:
          input.purchaseIntent.deliveryAuthorityReference,
        p_expected_product_code: input.purchaseIntent.expectedProductCode,
        p_expected_amount: input.purchaseIntent.expectedAmount,
        p_currency: input.purchaseIntent.currency,
        p_purchase_kind: input.purchaseIntent.purchaseKind,
        p_environment: input.purchaseIntent.environment,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    const intentId = stringValue(result.purchase_intent_id);
    const { data: row, error: readError } = await this.client
      .from("production_purchase_intents")
      .select("*")
      .eq("id", intentId)
      .maybeSingle();
    if (readError || !row) databaseFailure(readError);
    return this.mapIntent(row);
  }

  async reservePaymentAttempt(input: {
    purchaseIntentId: string;
    attemptId: string;
    providerIdempotencyKeyHash: string;
    now: string;
  }) {
    const { data, error } = await this.client.rpc(
      "reserve_rc2_payment_attempt_v1",
      {
        p_purchase_intent_id: input.purchaseIntentId,
        p_attempt_id: input.attemptId,
        p_provider_idempotency_key_hash: input.providerIdempotencyKeyHash,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    const attemptId = stringValue(result.payment_attempt_id);
    const { data: row, error: readError } = await this.client
      .from("production_payment_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    if (readError || !row) databaseFailure(readError);
    return { attempt: mapAttempt(row), duplicate: result.disposition === "existing" };
  }

  async attachCheckoutSession(input: {
    attemptId: string;
    providerCheckoutSessionId: string;
    providerCheckoutUrl: string;
    now: string;
  }) {
    const { error } = await this.client.rpc("attach_rc2_checkout_session_v1", {
      p_attempt_id: input.attemptId,
      p_provider_checkout_session_id: input.providerCheckoutSessionId,
      p_provider_checkout_url: input.providerCheckoutUrl,
      p_now: input.now,
    });
    if (error) databaseFailure(error);
    const { data, error: readError } = await this.client
      .from("production_payment_attempts")
      .select("*")
      .eq("id", input.attemptId)
      .maybeSingle();
    if (readError || !data) databaseFailure(readError);
    return mapAttempt(data);
  }

  async markPaymentAttemptUnknown(input: {
    attemptId: string;
    now: string;
    errorCode: string;
  }) {
    const { error } = await this.client.rpc(
      "mark_rc2_payment_attempt_unknown_v1",
      {
        p_attempt_id: input.attemptId,
        p_error_code: input.errorCode,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
  }

  async findPurchaseIntentByReference(purchaseReference: string) {
    const { data, error } = await this.client
      .from("production_purchase_intents")
      .select("*")
      .eq("id", purchaseReference)
      .maybeSingle();
    if (error) databaseFailure(error);
    return data ? this.mapIntent(data) : null;
  }

  async findPaymentAttemptByCheckoutSession(
    providerCheckoutSessionId: string,
  ) {
    const { data, error } = await this.client
      .from("production_payment_attempts")
      .select("*")
      .eq("provider_checkout_session_id", providerCheckoutSessionId)
      .maybeSingle();
    if (error) databaseFailure(error);
    return data ? mapAttempt(data) : null;
  }

  async recordStripeEvidence(input: {
    evidence: StripePaymentEvidenceV1;
    verification: PaymentEvidenceVerification;
    verifiedPaymentId: string;
    fulfillmentJobId: string;
    now: string;
  }): Promise<RecordedPaymentEvidence> {
    const { data, error } = await this.client.rpc(
      "record_rc2_stripe_evidence_v1",
      {
        p_provider_event_id: input.evidence.providerEventId,
        p_event_type: input.evidence.eventType,
        p_provider_created_at: input.evidence.providerCreatedAt,
        p_payload_sha256: input.evidence.payloadSha256,
        p_environment: input.evidence.environment,
        p_purchase_reference: input.evidence.purchaseReference,
        p_provider_checkout_session_id:
          input.evidence.providerCheckoutSessionId,
        p_provider_payment_id: input.evidence.providerPaymentId,
        p_mode: input.evidence.mode,
        p_payment_status: input.evidence.paymentStatus,
        p_amount_total: input.evidence.amountTotal,
        p_currency: input.evidence.currency,
        p_application_disposition: input.verification.disposition,
        p_application_reason_code: input.verification.reasonCode,
        p_verified_payment_id: input.verifiedPaymentId,
        p_fulfillment_job_id: input.fulfillmentJobId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    const result = recordValue(data);
    return {
      disposition: stringValue(
        result.disposition,
      ) as RecordedPaymentEvidence["disposition"],
      purchaseIntentId: nullableString(result.purchase_intent_id),
      verifiedPaymentId: nullableString(result.verified_payment_id),
      fulfillmentJobId: nullableString(result.fulfillment_job_id),
    };
  }

  async findPurchaseStatus(
    statusCapabilityHash: string,
  ): Promise<PurchaseStatusRecord | null> {
    const { data, error } = await this.client
      .from("production_purchase_intents")
      .select("*")
      .eq("status_capability_hash", statusCapabilityHash)
      .maybeSingle();
    if (error) databaseFailure(error);
    if (!data) return null;
    const purchaseIntent = await this.mapIntent(data);
    const { data: job, error: jobError } = await this.client
      .from("production_fulfillment_jobs")
      .select("*")
      .eq("purchase_intent_id", purchaseIntent.id)
      .maybeSingle();
    if (jobError) databaseFailure(jobError);
    return {
      purchaseIntent,
      fulfillmentJob: job ? mapJob(job) : null,
    };
  }

  async claimFulfillmentJob(input: {
    statusCapabilityHash: string;
    ownerId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<FulfillmentJobClaim | null> {
    const { data, error } = await this.client.rpc(
      "claim_rc2_fulfillment_job_v1",
      {
        p_status_capability_hash: input.statusCapabilityHash,
        p_owner_id: input.ownerId,
        p_lease_expires_at: input.leaseExpiresAt,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
    if (data === null) return null;
    const result = recordValue(data);
    const jobId = stringValue(result.fulfillment_job_id);
    const { data: row, error: readError } = await this.client
      .from("production_fulfillment_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();
    if (readError || !row) databaseFailure(readError);
    return {
      disposition: stringValue(
        result.disposition,
      ) as FulfillmentJobClaim["disposition"],
      job: mapJob(row),
    };
  }

  async completeFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    now: string;
  }) {
    const { error } = await this.client.rpc(
      "complete_rc2_fulfillment_job_v1",
      {
        p_fulfillment_job_id: input.jobId,
        p_owner_id: input.ownerId,
        p_now: input.now,
      },
    );
    if (error) databaseFailure(error);
  }

  async failFulfillmentJob(input: {
    jobId: string;
    ownerId: string;
    errorCode: string;
    now: string;
  }) {
    const { error } = await this.client.rpc("fail_rc2_fulfillment_job_v1", {
      p_fulfillment_job_id: input.jobId,
      p_owner_id: input.ownerId,
      p_error_code: input.errorCode,
      p_now: input.now,
    });
    if (error) databaseFailure(error);
  }

  async resolveDeliveryEmailCiphertext(
    deliveryAuthorityReference: string,
  ) {
    const { data: intent, error } = await this.client
      .from("production_purchase_intents")
      .select("verified_email_authority_id")
      .eq("delivery_authority_reference", deliveryAuthorityReference)
      .maybeSingle();
    if (error) databaseFailure(error);
    if (!intent) return null;
    const authority = await this.getAuthority(
      intent.verified_email_authority_id,
    );
    return authority?.revokedAt === null ? authority.emailCiphertext : null;
  }
}
