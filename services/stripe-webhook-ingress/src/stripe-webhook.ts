import { M2RuntimeError, asM2RuntimeError } from "../../../lib/assessment/runtime/errors.ts";
import { StripeWebhookEvidenceVerifierV1 } from "../../../lib/payment/production/stripe-webhook.ts";
import type { PaymentEnvironment, StripePaymentEvidenceV1 } from "../../../lib/payment/production/types.ts";
import { recordStripeWebhookEvidence } from "./database.ts";

export const maximumWebhookBytes = 1_048_576;
export const stripeWebhookPath = "/api/payments/stripe/webhook";
export const ingressSecretAllowlist = [
  "PAYMENT_ENVIRONMENT",
  "STRIPE_WEBHOOK_ENABLED",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_INGRESS_DATABASE_URL",
  "STRIPE_INGRESS_DATABASE_CA_PEM",
] as const;

type EvidenceRecorder = (
  evidence: StripePaymentEvidenceV1,
) => Promise<{ disposition: string }>;

type IngressEnvironment = Readonly<{
  PAYMENT_ENVIRONMENT?: string;
  STRIPE_WEBHOOK_ENABLED?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}>;

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
}) {
  const environment = options?.environment ?? process.env;
  const recordEvidence = options?.recordEvidence ?? recordStripeWebhookEvidence;
  return async function stripeWebhookIngress(request: Request) {
    try {
      if (request.method !== "POST") {
        return json({ error: { code: "PAYMENT_WEBHOOK_METHOD_INVALID" } }, 405);
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
      const rawBody = Buffer.from(await request.arrayBuffer());
      if (rawBody.byteLength > maximumWebhookBytes) {
        throw new M2RuntimeError("PAYMENT_WEBHOOK_TOO_LARGE", 413);
      }
      const evidence = new StripeWebhookEvidenceVerifierV1(
        configured.webhookSecret,
      ).verify(rawBody, request.headers.get("stripe-signature"));
      if (!evidence) {
        return json({ received: true, disposition: "ignored" }, 200);
      }
      if (evidence.environment !== configured.paymentEnvironment) {
        throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
      }
      const outcome = await recordEvidence(evidence);
      return json({ received: true, disposition: outcome.disposition }, 200);
    } catch (error) {
      const safe = asM2RuntimeError(error, "PAYMENT_WEBHOOK_REQUEST_FAILED");
      return json({ error: { code: safe.safeCode } }, safe.httpStatus);
    }
  };
}

export default createStripeWebhookIngressHandler();

export const config = {
  path: stripeWebhookPath,
  method: "POST",
};
