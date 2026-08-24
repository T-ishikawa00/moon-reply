import { createHash } from "node:crypto";
import Stripe from "stripe";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import {
  normalizeStripeCheckoutSessionV1,
  type StripeCheckoutSessionSnapshotV1,
  validateStripeCheckoutSessionSnapshotV1,
} from "./stripe-session.ts";
import type {
  CheckoutProviderV1,
  CheckoutSessionReconciliationRequestV1,
  CheckoutSessionRequestV1,
  PaymentEnvironment,
  StripePaymentEvidenceV1,
} from "./types.ts";

export type { StripeCheckoutSessionSnapshotV1 } from "./stripe-session.ts";

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function buildStripeReconciliationEvidenceV1(
  snapshot: StripeCheckoutSessionSnapshotV1,
  observedAt: string,
): StripePaymentEvidenceV1 {
  validateStripeCheckoutSessionSnapshotV1(snapshot, true);
  if (
    !Number.isFinite(Date.parse(observedAt)) ||
    new Date(observedAt).toISOString() !== observedAt
  ) {
    throw new M2RuntimeError("PAYMENT_RECONCILIATION_TIME_INVALID", 503);
  }
  const canonicalSnapshot = JSON.stringify({
    schemaVersion: "rc2-stripe-reconciliation-snapshot-v1",
    ...snapshot,
  });
  const payloadSha256 = sha256(canonicalSnapshot);
  const eventType =
    snapshot.paymentStatus === "paid"
      ? "checkout.session.completed"
      : snapshot.checkoutStatus === "expired"
        ? "checkout.session.expired"
        : "checkout.session.completed";
  return {
    evidenceSource: "reconciliation",
    providerEventId: `reconcile_${payloadSha256}`,
    eventType,
    providerCreatedAt: observedAt,
    payloadSha256,
    environment: snapshot.environment,
    purchaseReference: snapshot.purchaseReference,
    providerCheckoutSessionId: snapshot.providerCheckoutSessionId,
    providerPaymentId: snapshot.providerPaymentId,
    mode: snapshot.mode,
    paymentStatus: snapshot.paymentStatus,
    amountTotal: snapshot.amountTotal,
    currency: snapshot.currency,
  };
}

export class StripeCheckoutProviderV1 implements CheckoutProviderV1 {
  private readonly stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      maxNetworkRetries: 2,
      timeout: 10_000,
    });
  }

  async createCheckoutSession(request: CheckoutSessionRequestV1) {
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
      request.payPayEnabled ? ["card", "paypay"] : ["card"];
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: request.mode,
        payment_method_types: paymentMethodTypes,
        customer_email: request.customerEmail,
        client_reference_id: request.purchaseReference,
        line_items: [
          {
            quantity: request.quantity,
            price_data: {
              currency: request.currency,
              unit_amount: request.amount,
              product_data: {
                name: `${request.serviceName}｜${request.productName}`,
                description: request.productDescription,
              },
            },
          },
        ],
        metadata: {
          moon_purchase_reference: request.purchaseReference,
        },
        payment_intent_data: {
          metadata: {
            moon_purchase_reference: request.purchaseReference,
          },
        },
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
      },
      { idempotencyKey: request.idempotencyKey },
    );
    if (!session.url) {
      throw new M2RuntimeError("STRIPE_CHECKOUT_SESSION_UNAVAILABLE", 503);
    }
    return {
      providerCheckoutSessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async retrieveCheckoutSession(
    request: CheckoutSessionReconciliationRequestV1,
  ) {
    const session = await this.stripe.checkout.sessions.retrieve(
      request.providerCheckoutSessionId,
      { expand: ["payment_intent"] },
    );
    return buildStripeReconciliationEvidenceV1(
      normalizeStripeCheckoutSessionV1(session, true),
      request.observedAt,
    );
  }
}

export function paymentEnvironmentFromSecretKey(
  secretKey: string,
): PaymentEnvironment {
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  throw new M2RuntimeError("STRIPE_CONFIGURATION_INVALID", 503);
}
