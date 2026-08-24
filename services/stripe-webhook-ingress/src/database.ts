import { X509Certificate } from "node:crypto";
import { checkServerIdentity } from "node:tls";
import postgres from "postgres";
import type { StripePaymentEvidenceV1 } from "../../../lib/payment/production/types.ts";

export const ingressDatabaseSecretName = "STRIPE_INGRESS_DATABASE_URL";
export const ingressDatabaseCaName = "STRIPE_INGRESS_DATABASE_CA_PEM";

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
    url.searchParams.getAll("sslmode").length !== 1 ||
    url.searchParams.get("sslmode") !== "verify-full" ||
    [...url.searchParams.keys()].some((key) => key !== "sslmode") ||
    url.hash !== "" ||
    !url.username ||
    !url.password
  ) {
    throw new Error("INGRESS_DATABASE_CONFIGURATION_INVALID");
  }
  return url;
}

function validateCaBundle(value: string | undefined, now: number) {
  if (!value || value.includes("\\n")) {
    throw new Error("INGRESS_DATABASE_CA_INVALID");
  }
  const normalized = value.trim();
  const certificates = normalized.match(
    /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/gu,
  );
  if (!certificates || certificates.join("\n") !== normalized) {
    throw new Error("INGRESS_DATABASE_CA_INVALID");
  }
  try {
    for (const pem of certificates) {
      const certificate = new X509Certificate(pem);
      const validFrom = Date.parse(certificate.validFrom);
      const validTo = Date.parse(certificate.validTo);
      if (
        !certificate.ca ||
        !Number.isFinite(validFrom) ||
        !Number.isFinite(validTo) ||
        now < validFrom ||
        now > validTo
      ) {
        throw new Error("INGRESS_DATABASE_CA_INVALID");
      }
    }
  } catch {
    throw new Error("INGRESS_DATABASE_CA_INVALID");
  }
  return normalized;
}

export function buildVerifiedIngressDatabaseConfiguration(
  connectionString: string,
  caPem: string | undefined,
  now = Date.now(),
) {
  const url = validatePoolerUrl(connectionString);
  const ca = validateCaBundle(caPem, now);
  return {
    connectionString,
    ssl: {
      ca,
      rejectUnauthorized: true,
      servername: url.hostname,
      checkServerIdentity,
    },
  } as const;
}

export async function recordStripeWebhookEvidence(
  evidence: StripePaymentEvidenceV1,
) {
  const connectionString = process.env[ingressDatabaseSecretName];
  if (!connectionString) {
    throw new Error("INGRESS_DATABASE_CONFIGURATION_INVALID");
  }
  const configuration = buildVerifiedIngressDatabaseConfiguration(
    connectionString,
    process.env[ingressDatabaseCaName],
  );
  const sql = postgres(configuration.connectionString, {
    ssl: configuration.ssl,
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
