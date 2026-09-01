import { M2RuntimeError } from "../assessment/runtime/errors.ts";
import { RC2_PRODUCT } from "../payment/production/constants.ts";
import type { PaymentDeliveryRepository } from "../payment/production/types.ts";
import type {
  PurchaseSupportAuthorityResolver,
  PurchaseSupportAuthoritySnapshot,
} from "./types.ts";

type SupportRepository = Pick<
  PaymentDeliveryRepository,
  | "findPurchaseIntentByReference"
  | "findAuthenticatedPurchaseStatus"
  | "findPaymentAttemptById"
  | "resolveAuthenticatedResultDeliveryId"
>;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function integrityFailure(): never {
  throw new M2RuntimeError("PURCHASE_SUPPORT_AUTHORITY_INTEGRITY_FAILED", 503);
}

export class PurchaseSupportAuthorityResolverV1
  implements PurchaseSupportAuthorityResolver
{
  private readonly repository: SupportRepository;

  constructor(repository: SupportRepository) {
    this.repository = repository;
  }

  async resolveOwnedPurchase(input: {
    customerUserId: string;
    purchaseIntentId: string;
  }): Promise<PurchaseSupportAuthoritySnapshot | null> {
    if (!uuid.test(input.customerUserId) || !uuid.test(input.purchaseIntentId)) {
      return null;
    }
    // Selector lookup is never ownership authority. Its stored hash is used
    // only for the active-ownership RPC immediately below.
    const selected = await this.repository.findPurchaseIntentByReference(
      input.purchaseIntentId,
    );
    if (!selected) return null;
    const status = await this.repository.findAuthenticatedPurchaseStatus({
      customerUserId: input.customerUserId,
      statusCapabilityHash: selected.statusCapabilityHash,
    });
    if (!status || status.purchaseIntent.id !== input.purchaseIntentId) return null;

    const intent = status.purchaseIntent;
    if (
      intent.expectedProductCode !== RC2_PRODUCT.code ||
      intent.expectedAmount !== RC2_PRODUCT.amount ||
      intent.currency !== RC2_PRODUCT.currency ||
      intent.purchaseKind !== RC2_PRODUCT.purchaseKind ||
      intent.provider !== "stripe" ||
      !Number.isFinite(Date.parse(intent.createdAt))
    ) {
      integrityFailure();
    }
    const attempt = intent.currentPaymentAttemptId
      ? await this.repository.findPaymentAttemptById(intent.currentPaymentAttemptId)
      : null;
    if (
      (intent.currentPaymentAttemptId === null && attempt !== null) ||
      (intent.currentPaymentAttemptId !== null &&
        (attempt?.id !== intent.currentPaymentAttemptId ||
          attempt.purchaseIntentId !== intent.id))
    ) {
      integrityFailure();
    }
    const job = status.fulfillmentJob;
    if (
      job &&
      (intent.successfulPaymentId === null ||
        job.purchaseIntentId !== intent.id ||
        job.verifiedPaymentId !== intent.successfulPaymentId)
    ) {
      integrityFailure();
    }
    const deliveryId = await this.repository.resolveAuthenticatedResultDeliveryId({
      customerUserId: input.customerUserId,
      purchaseIntentId: intent.id,
    });
    if (deliveryId && job?.state !== "completed") integrityFailure();

    return Object.freeze({
      purchaseIntentId: intent.id,
      purchasedAt: intent.createdAt,
      productName: RC2_PRODUCT.productName,
      amount: RC2_PRODUCT.amount,
      currency: RC2_PRODUCT.currency,
      moonPurchaseReference: intent.id,
      paymentState: Object.freeze({
        purchase: intent.state,
        attempt: attempt?.state ?? "none",
        verified: intent.state === "verified" && intent.successfulPaymentId !== null,
      }),
      fulfillmentState: job?.state ?? "not_created",
      deliveryState: deliveryId
        ? "completed"
        : job?.state === "completed"
          ? "missing"
          : "pending",
    });
  }
}
