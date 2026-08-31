import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isMeasurementTransactionId } from "./events.ts";
import type {
  PurchaseMeasurementJob,
  PurchaseMeasurementJobRepository,
} from "./purchase-job.ts";

type JobRow = Record<string, unknown>;

function mapJob(row: JobRow): PurchaseMeasurementJob {
  const transactionId = row.transaction_id;
  if (
    typeof row.id !== "string" ||
    typeof row.verified_payment_id !== "string" ||
    (row.environment !== "test" && row.environment !== "live") ||
    !isMeasurementTransactionId(transactionId) ||
    typeof row.measurement_client_id !== "string" ||
    typeof row.measurement_session_id !== "number" ||
    typeof row.landing_path !== "string" ||
    row.value !== 980 || row.currency !== "JPY" ||
    typeof row.state !== "string" ||
    typeof row.attempt_count !== "number"
  ) throw new Error("MEASUREMENT_JOB_INVALID");
  return {
    id: row.id,
    verifiedPaymentId: row.verified_payment_id,
    environment: row.environment,
    transactionId,
    clientId: row.measurement_client_id,
    sessionId: row.measurement_session_id,
    utmSource: typeof row.utm_source === "string" ? row.utm_source : null,
    utmMedium: typeof row.utm_medium === "string" ? row.utm_medium : null,
    utmCampaign: typeof row.utm_campaign === "string" ? row.utm_campaign : null,
    utmContent: typeof row.utm_content === "string" ? row.utm_content : null,
    gclid: typeof row.gclid === "string" ? row.gclid : null,
    landingPath: row.landing_path,
    value: 980,
    currency: "JPY",
    state: row.state as PurchaseMeasurementJob["state"],
    attemptCount: row.attempt_count,
  };
}

export class SupabasePurchaseMeasurementJobRepository
  implements PurchaseMeasurementJobRepository
{
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseSecretKey: string) {
    this.client = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async claim(input: Parameters<PurchaseMeasurementJobRepository["claim"]>[0]) {
    const { data, error } = await this.client.rpc(
      "claim_production_purchase_measurement_batch_r1",
      {
        p_environment: input.environment,
        p_owner_id: input.ownerId,
        p_now: input.now,
        p_lease_expires_at: input.leaseExpiresAt,
        p_limit: input.limit,
      },
    );
    if (error || !Array.isArray(data)) throw new Error("MEASUREMENT_JOB_CLAIM_FAILED");
    return data.map((row) => mapJob(row as JobRow));
  }

  async complete(input: Parameters<PurchaseMeasurementJobRepository["complete"]>[0]) {
    const { error } = await this.client.rpc(
      "complete_production_purchase_measurement_r1",
      { p_job_id: input.jobId, p_owner_id: input.ownerId, p_now: input.now },
    );
    if (error) throw new Error("MEASUREMENT_JOB_COMPLETE_FAILED");
  }

  async fail(input: Parameters<PurchaseMeasurementJobRepository["fail"]>[0]) {
    const { error } = await this.client.rpc(
      "fail_production_purchase_measurement_r1",
      {
        p_job_id: input.jobId,
        p_owner_id: input.ownerId,
        p_retryable: input.retryable,
        p_error_code: input.errorCode,
        p_retry_after: input.retryAfter,
        p_now: input.now,
      },
    );
    if (error) throw new Error("MEASUREMENT_JOB_FAIL_FAILED");
  }
}
