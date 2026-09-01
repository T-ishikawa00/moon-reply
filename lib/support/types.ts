export const customerSupportCategories = [
  {
    value: "result_delivery",
    label: "鑑定ノートの受取り・結果表示",
    purchaseRequired: true,
  },
  {
    value: "payment_charge",
    label: "支払い・請求",
    purchaseRequired: true,
  },
  {
    value: "refund_cancellation",
    label: "返金・取消し",
    purchaseRequired: true,
  },
  {
    value: "account_login",
    label: "アカウント・ログイン",
    purchaseRequired: false,
  },
  {
    value: "privacy_data",
    label: "プライバシー・データ",
    purchaseRequired: false,
  },
  { value: "other", label: "その他", purchaseRequired: false },
] as const;

export type CustomerSupportCategory =
  (typeof customerSupportCategories)[number]["value"];

export type CustomerSupportCaseStatus =
  | "open"
  | "in_review"
  | "waiting_customer"
  | "resolved"
  | "closed";

export type CustomerSupportCaseCreation = Readonly<{
  caseId: string;
  category: CustomerSupportCategory;
  status: CustomerSupportCaseStatus;
  createdAt: string;
  disposition: "created" | "replay" | "active_case";
}>;

export type CustomerSupportCaseRepository = {
  createCase(input: {
    caseId: string;
    eventId: string;
    customerUserId: string;
    purchaseIntentId: string | null;
    category: CustomerSupportCategory;
    customerNote: string | null;
    idempotencyKeyHash: string;
    caseInputSha256: string;
    now: string;
  }): Promise<CustomerSupportCaseCreation>;
};

export const purchaseSupportInquiryCategories = [
  { value: "missing_delivery", label: "支払ったのに鑑定が届かない" },
  { value: "refund_request", label: "返金を希望する" },
  { value: "suspected_duplicate_charge", label: "二重請求の疑い" },
  { value: "other", label: "その他" },
] as const;

export type PurchaseSupportInquiryCategory = (typeof purchaseSupportInquiryCategories)[number]["value"];

export type PurchaseSupportAuthoritySnapshot = Readonly<{
  purchaseIntentId: string;
  purchasedAt: string;
  productName: "恋のメッセージ鑑定ノート";
  amount: 980;
  currency: "jpy";
  moonPurchaseReference: string;
  paymentState: Readonly<{ purchase: string; attempt: string; verified: boolean }>;
  fulfillmentState: string;
  deliveryState: "pending" | "completed" | "missing";
}>;

export type PurchaseSupportAuthorityResolver = {
  resolveOwnedPurchase(input: {
    customerUserId: string;
    purchaseIntentId: string;
  }): Promise<PurchaseSupportAuthoritySnapshot | null>;
};

export type PurchaseSupportOperatorEmailRequest = Readonly<{
  customerEmail: string;
  authority: PurchaseSupportAuthoritySnapshot;
  category: PurchaseSupportInquiryCategory;
  customerMessage: string | null;
  messageIdempotencyKey: string;
}>;

export type PurchaseSupportOperatorEmailAdapter = {
  send(request: PurchaseSupportOperatorEmailRequest): Promise<{
    providerMessageReference: string;
  }>;
};

export function isCustomerSupportCategory(
  value: unknown,
): value is CustomerSupportCategory {
  return customerSupportCategories.some((category) => category.value === value);
}

export function customerSupportCategoryRequiresPurchase(
  category: CustomerSupportCategory,
) {
  return customerSupportCategories.find((candidate) => candidate.value === category)!
    .purchaseRequired;
}

export function isPurchaseSupportInquiryCategory(
  value: unknown,
): value is PurchaseSupportInquiryCategory {
  return purchaseSupportInquiryCategories.some((category) => category.value === value);
}
