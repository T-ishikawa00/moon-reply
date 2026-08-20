import { createHash } from "node:crypto";
import Stripe from "stripe";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  CheckoutProviderV1,
  CheckoutSessionRequestV1,
  PaymentEnvironment,
  StripePaymentEvidenceV1,
} from "./types.ts";

const supportedEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);
const purchaseReferencePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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
}

export class StripeWebhookEvidenceVerifierV1 {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(secretKey: string, webhookSecret: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret;
  }

  verify(
    rawBody: Buffer,
    signature: string | null,
  ): StripePaymentEvidenceV1 | null {
    if (!signature) {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_SIGNATURE_INVALID", 400);
    }
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_SIGNATURE_INVALID", 400);
    }
    if (!supportedEventTypes.has(event.type)) return null;
    const session = event.data.object as Stripe.Checkout.Session;
    const purchaseReference = session.metadata?.moon_purchase_reference;
    const expectedSessionPrefix = event.livemode ? "cs_live_" : "cs_test_";
    if (
      !purchaseReference ||
      !purchaseReferencePattern.test(purchaseReference) ||
      typeof session.id !== "string" ||
      !session.id.startsWith(expectedSessionPrefix)
    ) {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
    }
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;
    return {
      providerEventId: event.id,
      eventType: event.type as StripePaymentEvidenceV1["eventType"],
      providerCreatedAt: new Date(event.created * 1000).toISOString(),
      payloadSha256: createHash("sha256").update(rawBody).digest("hex"),
      environment: event.livemode ? "live" : "test",
      purchaseReference,
      providerCheckoutSessionId: session.id,
      providerPaymentId: paymentIntent,
      mode: session.mode,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    };
  }
}

export function paymentEnvironmentFromSecretKey(
  secretKey: string,
): PaymentEnvironment {
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  throw new M2RuntimeError("STRIPE_CONFIGURATION_INVALID", 503);
}
