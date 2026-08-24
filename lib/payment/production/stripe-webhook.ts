import { createHash } from "node:crypto";
import Stripe from "stripe";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import {
  normalizeStripeCheckoutSessionV1,
  validateStripeCheckoutSessionSnapshotV1,
} from "./stripe-session.ts";
import type { StripePaymentEvidenceV1 } from "./types.ts";

const supportedEventTypes = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export class StripeWebhookEvidenceVerifierV1 {
  private readonly stripe = new Stripe("webhook-signature-verification-only");
  private readonly webhookSecret: string;

  constructor(webhookSecret: string) {
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
    try {
      const snapshot = normalizeStripeCheckoutSessionV1(session, false);
      validateStripeCheckoutSessionSnapshotV1(snapshot, false);
      return {
        evidenceSource: "webhook",
        providerEventId: event.id,
        eventType: event.type as StripePaymentEvidenceV1["eventType"],
        providerCreatedAt: new Date(event.created * 1000).toISOString(),
        payloadSha256: createHash("sha256").update(rawBody).digest("hex"),
        environment: snapshot.environment,
        purchaseReference: snapshot.purchaseReference,
        providerCheckoutSessionId: snapshot.providerCheckoutSessionId,
        providerPaymentId: snapshot.providerPaymentId,
        mode: snapshot.mode,
        paymentStatus: snapshot.paymentStatus,
        amountTotal: snapshot.amountTotal,
        currency: snapshot.currency,
      };
    } catch {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_EVIDENCE_INVALID", 400);
    }
  }
}
