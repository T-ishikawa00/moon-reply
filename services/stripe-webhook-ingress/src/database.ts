import postgres from "postgres";
import type { StripePaymentEvidenceV1 } from "../../../lib/payment/production/types.ts";

export const ingressDatabaseSecretName = "STRIPE_INGRESS_DATABASE_URL";

const safeDispositions = new Set([
  "verified",
  "duplicate",
  "conflict",
  "pending",
  "failed",
  "canceled",
  "rejected",
  "stale",
]);

function validatePoolerUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("INGRESS_DATABASE_CONFIGURATION_INVALID");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".pooler.supabase.com") ||
    url.port !== "6543" ||
    !url.username.startsWith("m2_b2_stripe_ingress.") ||
    url.pathname !== "/postgres" ||
    url.searchParams.get("sslmode") !== "require" ||
    !url.username ||
    !url.password
  ) {
    throw new Error("INGRESS_DATABASE_CONFIGURATION_INVALID");
  }
  return value;
}

export async function recordStripeWebhookEvidence(
  evidence: StripePaymentEvidenceV1,
) {
  const connectionString = process.env[ingressDatabaseSecretName];
  if (!connectionString) {
    throw new Error("INGRESS_DATABASE_CONFIGURATION_INVALID");
  }
  const sql = postgres(validatePoolerUrl(connectionString), {
    ssl: "require",
    max: 1,
    connect_timeout: 5,
    idle_timeout: 1,
    max_lifetime: 60,
    prepare: false,
    fetch_types: false,
    onnotice: () => undefined,
    connection: { application_name: "moon-reply-stripe-ingress" },
  });
  try {
    const rows = await sql.begin(async (transaction) => {
      await transaction`set local statement_timeout = '5s'`;
      await transaction`set local lock_timeout = '2s'`;
      return transaction<{ disposition: string }[]>`
        select private_payment_ingress.record_stripe_webhook_evidence_v1(
          ${evidence.providerEventId},
          ${evidence.eventType},
          ${evidence.providerCreatedAt},
          ${evidence.payloadSha256},
          ${evidence.environment},
          ${evidence.purchaseReference},
          ${evidence.providerCheckoutSessionId},
          ${evidence.providerPaymentId},
          ${evidence.mode},
          ${evidence.paymentStatus},
          ${evidence.amountTotal},
          ${evidence.currency}
        ) as disposition
      `;
    });
    const disposition = rows[0]?.disposition;
    if (!disposition || !safeDispositions.has(disposition)) {
      throw new Error("INGRESS_DATABASE_DISPOSITION_INVALID");
    }
    return { disposition };
  } finally {
    await sql.end({ timeout: 1 });
  }
}
