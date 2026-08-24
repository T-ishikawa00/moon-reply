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
