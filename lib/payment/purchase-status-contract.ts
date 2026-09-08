const legacyResultPathPattern = /^\/result\/[A-Za-z0-9_-]{43}$/u;
const authenticatedResultPathPattern =
  /^\/account\/results\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type CustomerResultPath =
  | `/result/${string}`
  | `/account/results/${string}`;

export type CustomerPurchaseStatus =
  | Readonly<{
      status: "confirming_payment";
      paymentVerified: false;
      accountFallback: boolean;
    }>
  | Readonly<{
      status: "payment_not_completed";
      paymentVerified: false;
      accountFallback: boolean;
    }>
  | Readonly<{
      status: "preparing_assessment" | "delayed_assessment";
      paymentVerified: true;
      accountFallback: boolean;
    }>
  | Readonly<{
      status: "temporary_problem";
      paymentVerified: true;
      accountFallback: boolean;
      retryable: true;
    }>
  | Readonly<{
      status: "confirmation_pending";
      paymentVerified: boolean;
      accountFallback: boolean;
    }>
  | Readonly<{
      status: "completed_check_verified_email";
      paymentVerified: true;
      accountFallback: boolean;
    }>
  | Readonly<{
      status: "completed";
      paymentVerified: true;
      accountFallback: boolean;
      resultPath: CustomerResultPath;
    }>;

export type CustomerPurchaseStatusName = CustomerPurchaseStatus["status"];

export const CUSTOMER_PURCHASE_STATUS_POLICY: Readonly<
  Record<
    CustomerPurchaseStatusName,
    Readonly<{
      automaticPolling: boolean;
      terminal: boolean;
      customerActionRequired: boolean;
      resultDestination: boolean;
      accountFallbackWhenAuthenticated: boolean;
    }>
  >
> = {
  confirming_payment: {
    automaticPolling: true,
    terminal: false,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  payment_not_completed: {
    automaticPolling: false,
    terminal: true,
    customerActionRequired: true,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  preparing_assessment: {
    automaticPolling: true,
    terminal: false,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  temporary_problem: {
    automaticPolling: true,
    terminal: false,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  delayed_assessment: {
    automaticPolling: false,
    terminal: false,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  confirmation_pending: {
    automaticPolling: false,
    terminal: true,
    customerActionRequired: false,
    resultDestination: false,
    accountFallbackWhenAuthenticated: true,
  },
  completed_check_verified_email: {
    automaticPolling: false,
    terminal: true,
    customerActionRequired: true,
    resultDestination: false,
    accountFallbackWhenAuthenticated: false,
  },
  completed: {
    automaticPolling: false,
    terminal: true,
    customerActionRequired: false,
    resultDestination: true,
    accountFallbackWhenAuthenticated: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
) {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

export function parseCustomerResultPath(
  value: unknown,
): CustomerResultPath | null {
  if (typeof value !== "string") return null;
  if (
    !legacyResultPathPattern.test(value) &&
    !authenticatedResultPathPattern.test(value)
  ) {
    return null;
  }
  return value as CustomerResultPath;
}

export function decodeCustomerPurchaseStatusResponse(
  value: unknown,
): CustomerPurchaseStatus | null {
  if (!isRecord(value) || !hasExactKeys(value, ["data"])) return null;
  const data = value.data;
  if (!isRecord(data) || typeof data.status !== "string") return null;
  if (typeof data.accountFallback !== "boolean") return null;

  if (
    data.status === "confirming_payment" ||
    data.status === "payment_not_completed"
  ) {
    if (
      !hasExactKeys(data, ["status", "paymentVerified", "accountFallback"]) ||
      data.paymentVerified !== false
    ) {
      return null;
    }
    return {
      status: data.status,
      paymentVerified: false,
      accountFallback: data.accountFallback,
    };
  }

  if (
    data.status === "preparing_assessment" ||
    data.status === "delayed_assessment" ||
    data.status === "completed_check_verified_email"
  ) {
    if (
      !hasExactKeys(data, ["status", "paymentVerified", "accountFallback"]) ||
      data.paymentVerified !== true
    ) {
      return null;
    }
    return {
      status: data.status,
      paymentVerified: true,
      accountFallback: data.accountFallback,
    };
  }

  if (data.status === "confirmation_pending") {
    if (
      !hasExactKeys(data, ["status", "paymentVerified", "accountFallback"]) ||
      typeof data.paymentVerified !== "boolean"
    ) {
      return null;
    }
    return {
      status: data.status,
      paymentVerified: data.paymentVerified,
      accountFallback: data.accountFallback,
    };
  }

  if (data.status === "temporary_problem") {
    if (
      !hasExactKeys(data, [
        "status",
        "paymentVerified",
        "accountFallback",
        "retryable",
      ]) ||
      data.paymentVerified !== true ||
      data.retryable !== true
    ) {
      return null;
    }
    return {
      status: data.status,
      paymentVerified: true,
      accountFallback: data.accountFallback,
      retryable: true,
    };
  }

  if (data.status === "completed") {
    if (
      !hasExactKeys(data, [
        "status",
        "paymentVerified",
        "accountFallback",
        "resultPath",
      ]) ||
      data.paymentVerified !== true
    ) {
      return null;
    }
    const resultPath = parseCustomerResultPath(data.resultPath);
    if (!resultPath) return null;
    return {
      status: data.status,
      paymentVerified: true,
      accountFallback: data.accountFallback,
      resultPath,
    };
  }

  return null;
}

export function shouldAutomaticallyPoll(status: CustomerPurchaseStatus) {
  return CUSTOMER_PURCHASE_STATUS_POLICY[status.status].automaticPolling;
}
