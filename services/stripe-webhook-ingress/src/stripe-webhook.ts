import { randomUUID } from "node:crypto";
import { M2RuntimeError, asM2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { StripeWebhookEvidenceVerifierV1 } from "../../../lib/payment/production/stripe-webhook.ts";
import type { PaymentEnvironment, StripePaymentEvidenceV1 } from "../../../lib/payment/production/types.ts";
import {
  IngressDatabaseDiagnosticError,
  recordStripeWebhookEvidence,
} from "./database.ts";

export const maximumWebhookBytes = 1_048_576;
export const stripeWebhookPath = "/api/payments/stripe/webhook";
export const ingressSecretAllowlist = [
  "PAYMENT_ENVIRONMENT",
  "STRIPE_WEBHOOK_ENABLED",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_INGRESS_DATABASE_URL",
  "STRIPE_INGRESS_DATABASE_CA_PEM",
] as const;

export const ingressDiagnosticStages = [
  "REQUEST_RECEIVED",
  "RAW_BODY_READ",
  "SIGNATURE_VERIFIED",
  "EVENT_PARSED",
  "EVENT_POLICY_ACCEPTED",
  "DURABLE_RECORD_START",
  "DURABLE_RPC_RETURNED",
  "DURABLE_RECORD_SUCCEEDED",
  "RESPONSE_2XX",
] as const;

export type IngressDiagnosticStage =
  (typeof ingressDiagnosticStages)[number];

export type IngressDiagnostic = Readonly<{
  invocationId: string;
  stage: IngressDiagnosticStage;
  diagnosticCode?: string;
  httpStatus?: number;
  elapsedMilliseconds: number;
}>;

type EvidenceRecorder = (
  evidence: StripePaymentEvidenceV1,
) => Promise<{ disposition: string }>;

type IngressEnvironment = Readonly<{
  PAYMENT_ENVIRONMENT?: string;
  STRIPE_WEBHOOK_ENABLED?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}>;

class IngressRuntimeDiagnosticError extends Error {
  readonly diagnosticCode: string;

  constructor(diagnosticCode: string) {
    super(diagnosticCode);
    this.name = "IngressRuntimeDiagnosticError";
    this.diagnosticCode = diagnosticCode;
  }
}

function defaultDiagnosticSink(diagnostic: IngressDiagnostic) {
  console.info(JSON.stringify(diagnostic));
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function readEnvironment(environment: IngressEnvironment) {
  if (environment.STRIPE_WEBHOOK_ENABLED !== "true") {
    throw new M2RuntimeError("PAYMENT_WEBHOOK_UNAVAILABLE", 404);
  }
  if (
    environment.PAYMENT_ENVIRONMENT !== "test" &&
    environment.PAYMENT_ENVIRONMENT !== "live"
  ) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  if (!environment.STRIPE_WEBHOOK_SECRET) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return {
    paymentEnvironment: environment.PAYMENT_ENVIRONMENT as PaymentEnvironment,
    webhookSecret: environment.STRIPE_WEBHOOK_SECRET,
  };
}

export function createStripeWebhookIngressHandler(options?: {
  environment?: IngressEnvironment;
  recordEvidence?: EvidenceRecorder;
  diagnosticSink?: (diagnostic: IngressDiagnostic) => void;
  invocationId?: () => string;
  now?: () => number;
}) {
  const environment = options?.environment ?? process.env;
  const recordEvidence = options?.recordEvidence ?? recordStripeWebhookEvidence;
  const diagnosticSink = options?.diagnosticSink ?? defaultDiagnosticSink;
  const createInvocationId = options?.invocationId ?? randomUUID;
  const now = options?.now ?? Date.now;
  return async function stripeWebhookIngress(request: Request) {
    const startedAt = now();
    const invocationId = createInvocationId();
    let lastCompletedStage: IngressDiagnosticStage = "REQUEST_RECEIVED";
    const emitDiagnostic = (
      stage: IngressDiagnosticStage,
      diagnosticCode?: string,
      httpStatus?: number,
    ) => {
      const diagnostic: IngressDiagnostic = {
        invocationId,
        stage,
        ...(diagnosticCode === undefined ? {} : { diagnosticCode }),
        ...(httpStatus === undefined ? {} : { httpStatus }),
        elapsedMilliseconds: Math.max(0, Math.round(now() - startedAt)),
      };
      try {
        diagnosticSink(diagnostic);
      } catch {
        // Observability must never alter the Stripe-facing HTTP contract.
      }
    };
    const completeStage = (stage: IngressDiagnosticStage) => {
      lastCompletedStage = stage;
      emitDiagnostic(stage);
    };
    completeStage("REQUEST_RECEIVED");
    try {
      if (request.method !== "POST") {
        const response = json(
          { error: { code: "PAYMENT_WEBHOOK_METHOD_INVALID" } },
          405,
        );
        emitDiagnostic(
          lastCompletedStage,
          "PAYMENT_WEBHOOK_METHOD_INVALID",
          405,
        );
        return response;
      }
      const configured = readEnvironment(environment);
      const contentLength = request.headers.get("content-length");
      if (
        contentLength !== null &&
        (!/^\d+$/u.test(contentLength) ||
          Number(contentLength) > maximumWebhookBytes)
      ) {
        throw new M2RuntimeError("PAYMENT_WEBHOOK_TOO_LARGE", 413);
      }
      let rawBody: Buffer;
      try {
        rawBody = Buffer.from(await request.arrayBuffer());
      } catch {
        throw new IngressRuntimeDiagnosticError(
          "INGRESS_RAW_BODY_READ_FAILED",
        );
      }
      completeStage("RAW_BODY_READ");
      if (rawBody.byteLength > maximumWebhookBytes) {
        throw new M2RuntimeError("PAYMENT_WEBHOOK_TOO_LARGE", 413);
      }
      const evidence = new StripeWebhookEvidenceVerifierV1(
        configured.webhookSecret,
      ).verify(rawBody, request.headers.get("stripe-signature"));
      completeStage("SIGNATURE_VERIFIED");
      completeStage("EVENT_PARSED");
      if (!evidence) {
        const response = json(
          { received: true, disposition: "ignored" },
          200,
        );
        completeStage("RESPONSE_2XX");
        return response;
      }
      if (evidence.environment !== configured.paymentEnvironment) {
        throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
      }
      completeStage("EVENT_POLICY_ACCEPTED");
      completeStage("DURABLE_RECORD_START");
      const outcome = await recordEvidence(evidence);
      completeStage("DURABLE_RPC_RETURNED");
      completeStage("DURABLE_RECORD_SUCCEEDED");
      const response = json(
        { received: true, disposition: outcome.disposition },
        200,
      );
      completeStage("RESPONSE_2XX");
      return response;
    } catch (error) {
      const safe = asM2RuntimeError(error, "PAYMENT_WEBHOOK_REQUEST_FAILED");
      const response = json(
        { error: { code: safe.safeCode } },
        safe.httpStatus,
      );
      const diagnosticCode =
        error instanceof IngressDatabaseDiagnosticError ||
        error instanceof IngressRuntimeDiagnosticError
          ? error.diagnosticCode
          : safe.safeCode;
      emitDiagnostic(lastCompletedStage, diagnosticCode, safe.httpStatus);
      if (error instanceof IngressDatabaseDiagnosticError) {
        for (const secondaryCode of error.secondaryDiagnosticCodes) {
          emitDiagnostic(lastCompletedStage, secondaryCode, safe.httpStatus);
        }
      }
      return response;
    }
  };
}

export default createStripeWebhookIngressHandler();

export const config = {
  path: stripeWebhookPath,
  method: "POST",
};
