import { createHash, randomUUID } from "node:crypto";

import { M2RuntimeError } from "../assessment/runtime/errors.ts";
import {
  customerSupportCategoryRequiresPurchase,
  isCustomerSupportCategory,
  type CustomerSupportCaseRepository,
} from "./types.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{16,128}$/u;
const unsafeControlCharacterPattern =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

function invalid(): never {
  throw new M2RuntimeError("CUSTOMER_SUPPORT_REQUEST_INVALID", 400);
}

function hash(domain: string, value: string) {
  return createHash("sha256")
    .update(`moon-reply:customer-support:${domain}:v1:${value}`, "utf8")
    .digest("hex");
}

function normalizeCustomerNote(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") invalid();
  const normalized = value.replace(/\r\n?/gu, "\n").trim();
  if (normalized.length === 0) return null;
  if (
    normalized.length > 1_000 ||
    unsafeControlCharacterPattern.test(normalized)
  ) {
    invalid();
  }
  return normalized;
}

export class CustomerSupportApplicationV1 {
  private readonly options: {
    repository: CustomerSupportCaseRepository;
    now?: () => string;
    uuid?: () => string;
  };

  constructor(options: {
    repository: CustomerSupportCaseRepository;
    now?: () => string;
    uuid?: () => string;
  }) {
    this.options = options;
  }

  async createCase(input: {
    customerUserId: unknown;
    purchaseIntentId: unknown;
    category: unknown;
    customerNote: unknown;
    idempotencyKey: unknown;
  }) {
    if (
      typeof input.customerUserId !== "string" ||
      !uuidPattern.test(input.customerUserId) ||
      !isCustomerSupportCategory(input.category) ||
      typeof input.idempotencyKey !== "string" ||
      !idempotencyKeyPattern.test(input.idempotencyKey)
    ) {
      invalid();
    }
    const purchaseRequired = customerSupportCategoryRequiresPurchase(
      input.category,
    );
    const purchaseIntentId =
      typeof input.purchaseIntentId === "string" &&
      uuidPattern.test(input.purchaseIntentId)
        ? input.purchaseIntentId
        : null;
    if (
      (purchaseRequired && purchaseIntentId === null) ||
      (!purchaseRequired && input.purchaseIntentId !== null)
    ) {
      invalid();
    }
    const customerNote = normalizeCustomerNote(input.customerNote);
    const caseInputSha256 = hash(
      "input",
      JSON.stringify([
        input.customerUserId,
        input.category,
        purchaseIntentId,
        customerNote,
      ]),
    );
    const uuid = this.options.uuid ?? randomUUID;
    return this.options.repository.createCase({
      caseId: uuid(),
      eventId: uuid(),
      customerUserId: input.customerUserId,
      purchaseIntentId,
      category: input.category,
      customerNote,
      idempotencyKeyHash: hash("idempotency", input.idempotencyKey),
      caseInputSha256,
      now: (this.options.now ?? (() => new Date().toISOString()))(),
    });
  }
}
