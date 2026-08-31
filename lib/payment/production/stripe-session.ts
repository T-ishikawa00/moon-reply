import type Stripe from "stripe";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  CheckoutSessionReconciliationRequestV1,
  PaymentEnvironment,
} from "./types.ts";

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

export type CheckoutSessionInspectorV1 = {
  inspectCheckoutSession(
    request: CheckoutSessionReconciliationRequestV1,
  ): Promise<StripeCheckoutSessionSnapshotV1>;
};

export function normalizeStripeCheckoutSessionV1(
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
  if (requireExpandedPaymentIntent && typeof paymentIntent === "string") {
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

export function validateStripeCheckoutSessionSnapshotV1(
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
