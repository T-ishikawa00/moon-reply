import { createHash } from "node:crypto";

import { M2RuntimeError } from "../assessment/runtime/errors.ts";
import { RC2_PRODUCT } from "../payment/production/constants.ts";
import {
  isPurchaseSupportInquiryCategory,
  type PurchaseSupportAuthorityResolver,
  type PurchaseSupportOperatorEmailAdapter,
} from "./types.ts";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const idempotency = /^[A-Za-z0-9._:-]{16,128}$/u;
const control = /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/u;

function invalid(): never {
  throw new M2RuntimeError("PURCHASE_SUPPORT_REQUEST_INVALID", 400);
}

function message(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") invalid();
  const normalized = value.replace(/\r\n?/gu, "\n").trim();
  if (normalized.length > 1_000 || control.test(normalized)) invalid();
  return normalized || null;
}

type SubmitInput = {
  customerUserId: unknown;
  customerEmail: unknown;
  purchaseIntentId: unknown;
  category: unknown;
  customerMessage: unknown;
  idempotencyKey: unknown;
};

export class PurchaseSupportInquiryApplicationV1 {
  private readonly authority: PurchaseSupportAuthorityResolver;
  private readonly operatorEmail: PurchaseSupportOperatorEmailAdapter;

  constructor(options: {
    authority: PurchaseSupportAuthorityResolver;
    operatorEmail: PurchaseSupportOperatorEmailAdapter;
  }) {
    this.authority = options.authority;
    this.operatorEmail = options.operatorEmail;
  }

  async submit(input: SubmitInput) {
    if (
      typeof input.customerUserId !== "string" || !uuid.test(input.customerUserId) ||
      typeof input.customerEmail !== "string" ||
      typeof input.purchaseIntentId !== "string" || !uuid.test(input.purchaseIntentId) ||
      !isPurchaseSupportInquiryCategory(input.category) ||
      typeof input.idempotencyKey !== "string" || !idempotency.test(input.idempotencyKey)
    ) invalid();

    const customerMessage = message(input.customerMessage);
    const authority = await this.authority.resolveOwnedPurchase({
      customerUserId: input.customerUserId,
      purchaseIntentId: input.purchaseIntentId,
    });
    if (!authority) {
      throw new M2RuntimeError("PURCHASE_SUPPORT_PURCHASE_NOT_FOUND", 404);
    }
    if (
      authority.purchaseIntentId !== input.purchaseIntentId ||
      authority.moonPurchaseReference !== input.purchaseIntentId ||
      authority.productName !== RC2_PRODUCT.productName ||
      authority.amount !== RC2_PRODUCT.amount || authority.currency !== RC2_PRODUCT.currency
    ) {
      throw new M2RuntimeError("PURCHASE_SUPPORT_AUTHORITY_INTEGRITY_FAILED", 503);
    }
    const digest = createHash("sha256").update(
      `moon-reply:purchase-support-email:v1:${JSON.stringify([
        input.customerUserId, input.purchaseIntentId, input.category,
        customerMessage, input.idempotencyKey,
      ])}`,
      "utf8",
    ).digest("hex");
    await this.operatorEmail.send({
      customerEmail: input.customerEmail,
      authority,
      category: input.category,
      customerMessage,
      messageIdempotencyKey: `purchase-support:${digest}`,
    });
    return { status: "accepted" as const };
  }
}
