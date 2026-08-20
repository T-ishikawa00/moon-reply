import { createHash } from "node:crypto";
import Stripe from "stripe";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  CheckoutProviderV1,
  CheckoutSessionReconciliationRequestV1,
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

export type StripeCheckoutSessionSnapshotV1 = Readonly<{
  providerCheckoutSessionId: string;
  environment: PaymentEnvironment;
  purchaseReference: string;
  clientReferenceId: string | null;
  providerPaymentId: string | null;
  paymentIntentPurchaseReference: string | null;
  mode: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  currency: string | null;
  checkoutStatus: string | null;
}>;

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizedSession(
  session: Stripe.Checkout.Session,
  requireExpandedPaymentIntent: boolean,
): StripeCheckoutSessionSnapshotV1 {
  const purchaseReference = session.metadata?.moon_purchase_reference;
  const environment: PaymentEnvironment = session.livemode ? "live" : "test";
  const expectedSessionPrefix = session.livemode ? "cs_live_" : "cs_test_";
  if (
    !purchaseReference ||
    !purchaseReferencePattern.test(purchaseReference) ||
    session.client_reference_id !== purchaseReference ||
    typeof session.id !== "string" ||
    !session.id.startsWith(expectedSessionPrefix)
  ) {
    throw new M2RuntimeError("PAYMENT_STRIPE_EVIDENCE_INVALID", 503);
  }
  const paymentIntent = session.payment_intent;
  if (
    requireExpandedPaymentIntent &&
    typeof paymentIntent === "string"
  ) {
    throw new M2RuntimeError("PAYMENT_STRIPE_EVIDENCE_INVALID", 503);
  }
  const providerPaymentId =
    typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent?.id ?? null;
  const paymentIntentPurchaseReference =
    typeof paymentIntent === "object" && paymentIntent !== null
      ? paymentIntent.metadata?.moon_purchase_reference ?? null
      : null;
  if (
    paymentIntentPurchaseReference !== null &&
    paymentIntentPurchaseReference !== purchaseReference
  ) {
    throw new M2RuntimeError("PAYMENT_STRIPE_EVIDENCE_INVALID", 503);
  }
  if (
    requireExpandedPaymentIntent &&
    providerPaymentId !== null &&
    paymentIntentPurchaseReference !== purchaseReference
  ) {
    throw new M2RuntimeError("PAYMENT_STRIPE_EVIDENCE_INVALID", 503);
  }
  return {
    providerCheckoutSessionId: session.id,
    environment,
    purchaseReference,
    clientReferenceId: session.client_reference_id,
    providerPaymentId,
    paymentIntentPurchaseReference,
    mode: session.mode,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency?.toLowerCase() ?? null,
    checkoutStatus: session.status,
  };
}

function validateSnapshot(
  snapshot: StripeCheckoutSessionSnapshotV1,
  requirePaymentIntentBinding: boolean,
) {
  const expectedSessionPrefix =
    snapshot.environment === "live" ? "cs_live_" : "cs_test_";
  if (
    !purchaseReferencePattern.test(snapshot.purchaseReference) ||
    snapshot.clientReferenceId !== snapshot.purchaseReference ||
    !snapshot.providerCheckoutSessionId.startsWith(expectedSessionPrefix) ||
    (requirePaymentIntentBinding &&
      snapshot.providerPaymentId !== null &&
      snapshot.paymentIntentPurchaseReference !== snapshot.purchaseReference)
  ) {
    throw new M2RuntimeError("PAYMENT_STRIPE_EVIDENCE_INVALID", 503);
  }
}

export function buildStripeReconciliationEvidenceV1(
  snapshot: StripeCheckoutSessionSnapshotV1,
  observedAt: string,
): StripePaymentEvidenceV1 {
  validateSnapshot(snapshot, true);
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
      normalizedSession(session, true),
      request.observedAt,
    );
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
    if (session.livemode !== event.livemode) {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
    }
    let snapshot: StripeCheckoutSessionSnapshotV1;
    try {
      snapshot = normalizedSession(session, false);
      validateSnapshot(snapshot, false);
    } catch {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
    }
    return {
      evidenceSource: "webhook",
      providerEventId: event.id,
      eventType: event.type as StripePaymentEvidenceV1["eventType"],
      providerCreatedAt: new Date(event.created * 1000).toISOString(),
      payloadSha256: sha256(rawBody),
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
}

export function paymentEnvironmentFromSecretKey(
  secretKey: string,
): PaymentEnvironment {
  if (secretKey.startsWith("sk_test_")) return "test";
  if (secretKey.startsWith("sk_live_")) return "live";
  throw new M2RuntimeError("STRIPE_CONFIGURATION_INVALID", 503);
}
