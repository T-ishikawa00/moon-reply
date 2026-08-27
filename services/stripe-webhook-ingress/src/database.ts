import { X509Certificate } from "node:crypto";
import { checkServerIdentity } from "node:tls";
import postgres from "postgres";
import type { StripePaymentEvidenceV1 } from "../../../lib/payment/production/types.ts";

export const ingressDatabaseSecretName = "STRIPE_INGRESS_DATABASE_URL";
export const ingressDatabaseCaName = "STRIPE_INGRESS_DATABASE_CA_PEM";

export const ingressDatabaseDiagnosticCodes = [
  "INGRESS_DATABASE_CONFIGURATION_FAILED",
  "INGRESS_DATABASE_TLS_FAILED",
  "INGRESS_DATABASE_CONNECTION_FAILED",
  "INGRESS_DATABASE_AUTHORITY_FAILED",
  "INGRESS_DATABASE_RPC_FAILED",
  "INGRESS_DATABASE_OPERATION_FAILED",
  "INGRESS_DATABASE_DISPOSITION_INVALID",
  "INGRESS_DATABASE_CLOSE_FAILED",
] as const;

export type IngressDatabaseDiagnosticCode =
  (typeof ingressDatabaseDiagnosticCodes)[number];

export class IngressDatabaseDiagnosticError extends Error {
  readonly diagnosticCode: IngressDatabaseDiagnosticCode;
  readonly secondaryDiagnosticCodes: readonly IngressDatabaseDiagnosticCode[];

  constructor(
    diagnosticCode: IngressDatabaseDiagnosticCode,
    secondaryDiagnosticCodes: readonly IngressDatabaseDiagnosticCode[] = [],
  ) {
    super(diagnosticCode);
    this.name = "IngressDatabaseDiagnosticError";
    this.diagnosticCode = diagnosticCode;
    this.secondaryDiagnosticCodes = [...secondaryDiagnosticCodes];
  }
}

const tlsFailureCodes = new Set([
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ERR_OSSL_PEM_NO_START_LINE",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

const connectionFailureCodes = new Set([
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

function runtimeErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}

export function classifyIngressDatabaseOperationFailure(
  error: unknown,
  transactionStarted: boolean,
) {
  if (error instanceof IngressDatabaseDiagnosticError) return error;
  const code = runtimeErrorCode(error);
  if (
    code !== null &&
    (tlsFailureCodes.has(code) || code.startsWith("ERR_TLS_"))
  ) {
    return new IngressDatabaseDiagnosticError("INGRESS_DATABASE_TLS_FAILED");
  }
  if (
    code !== null &&
    (connectionFailureCodes.has(code) || code.startsWith("08"))
  ) {
    return new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_CONNECTION_FAILED",
    );
  }
  if (code !== null && (code.startsWith("28") || code === "42501")) {
    return new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_AUTHORITY_FAILED",
    );
  }
  if (transactionStarted) {
    return new IngressDatabaseDiagnosticError("INGRESS_DATABASE_RPC_FAILED");
  }
  return new IngressDatabaseDiagnosticError(
    "INGRESS_DATABASE_OPERATION_FAILED",
  );
}

export function preservePrimaryIngressDatabaseFailure(
  primary: IngressDatabaseDiagnosticError,
  cleanup: IngressDatabaseDiagnosticError | null,
) {
  return cleanup === null
    ? primary
    : new IngressDatabaseDiagnosticError(primary.diagnosticCode, [
        ...primary.secondaryDiagnosticCodes,
        cleanup.diagnosticCode,
      ]);
}

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
    throw new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_CONFIGURATION_FAILED",
    );
  }
  let configuration: ReturnType<
    typeof buildVerifiedIngressDatabaseConfiguration
  >;
  try {
    configuration = buildVerifiedIngressDatabaseConfiguration(
      connectionString,
      process.env[ingressDatabaseCaName],
    );
  } catch {
    throw new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_CONFIGURATION_FAILED",
    );
  }
  let sql: ReturnType<typeof postgres>;
  try {
    sql = postgres(configuration.connectionString, {
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
  } catch {
    throw new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_CONFIGURATION_FAILED",
    );
  }
  let transactionStarted = false;
  let primaryFailure: IngressDatabaseDiagnosticError | null = null;
  let disposition: string | undefined;
  try {
    const rows = await sql.begin(async (transaction) => {
      transactionStarted = true;
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
    disposition = rows[0]?.disposition;
    if (!disposition || !safeDispositions.has(disposition)) {
      throw new IngressDatabaseDiagnosticError(
        "INGRESS_DATABASE_DISPOSITION_INVALID",
      );
    }
  } catch (error) {
    primaryFailure = classifyIngressDatabaseOperationFailure(
      error,
      transactionStarted,
    );
  }
  let cleanupFailure: IngressDatabaseDiagnosticError | null = null;
  try {
    await sql.end({ timeout: 1 });
  } catch {
    cleanupFailure = new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_CLOSE_FAILED",
    );
  }
  if (primaryFailure !== null) {
    throw preservePrimaryIngressDatabaseFailure(
      primaryFailure,
      cleanupFailure,
    );
  }
  if (cleanupFailure !== null) throw cleanupFailure;
  if (disposition === undefined) {
    throw new IngressDatabaseDiagnosticError(
      "INGRESS_DATABASE_DISPOSITION_INVALID",
    );
  }
  return { disposition };
}
