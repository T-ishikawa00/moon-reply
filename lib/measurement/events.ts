export const MEASUREMENT_EVENT_NAMES = [
  "page_view",
  "sample_view",
  "request_start",
  "request_complete",
  "auth_start",
  "auth_complete",
  "checkout_start",
  "purchase",
] as const;

export const MEASUREMENT_PURCHASE_VALUE = 980 as const;
export const MEASUREMENT_PURCHASE_CURRENCY = "JPY" as const;

export const MEASUREMENT_PAGE_AREAS = [
  "home",
  "sample",
  "request",
  "account",
  "account_result",
  "purchase_auth",
  "purchase_return",
  "legacy_result",
  "legal",
  "contact",
  "review",
  "other",
] as const;

export type MeasurementEventName = (typeof MEASUREMENT_EVENT_NAMES)[number];
export type MeasurementPageArea = (typeof MEASUREMENT_PAGE_AREAS)[number];
export type MeasurementAuthMethod = "google" | "email_otp";
export type MeasurementTransactionId = string & {
  readonly __measurementTransactionId: unique symbol;
};

export type MeasurementPayloadByName = Readonly<{
  page_view: Readonly<{ page: MeasurementPageArea }>;
  sample_view: Readonly<{ sample: "public_sample" }>;
  request_start: Readonly<{ experience: "consultation_request" }>;
  request_complete: Readonly<{ outcome: "purchase_ready" }>;
  auth_start: Readonly<{ method: MeasurementAuthMethod }>;
  auth_complete: Readonly<{ method: MeasurementAuthMethod }>;
  checkout_start: Readonly<{ provider: "stripe" }>;
  purchase: Readonly<{
    transactionId: MeasurementTransactionId;
    value: typeof MEASUREMENT_PURCHASE_VALUE;
    currency: typeof MEASUREMENT_PURCHASE_CURRENCY;
  }>;
}>;

export type MeasurementEvent<
  Name extends MeasurementEventName = MeasurementEventName,
> = {
  [CurrentName in Name]: Readonly<{
    name: CurrentName;
    payload: MeasurementPayloadByName[CurrentName];
  }>;
}[Name];

const transactionIdPattern = /^mrp_[A-Za-z0-9_-]{43}$/u;

function exactObject(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
  }
  const record = value as Record<string, unknown>;
  const actualKeys = Object.keys(record).sort();
  const expectedKeys = [...keys].sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
  }
  return record;
}

function oneOf<const Value extends string>(
  value: unknown,
  allowed: readonly Value[],
): value is Value {
  return typeof value === "string" && allowed.includes(value as Value);
}

export function isMeasurementTransactionId(
  value: unknown,
): value is MeasurementTransactionId {
  return typeof value === "string" && transactionIdPattern.test(value);
}

function validateMeasurementPayload(
  name: MeasurementEventName,
  payload: unknown,
) {
  switch (name) {
    case "page_view": {
      const value = exactObject(payload, ["page"]);
      if (!oneOf(value.page, MEASUREMENT_PAGE_AREAS)) {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "sample_view": {
      const value = exactObject(payload, ["sample"]);
      if (value.sample !== "public_sample") {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "request_start": {
      const value = exactObject(payload, ["experience"]);
      if (value.experience !== "consultation_request") {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "request_complete": {
      const value = exactObject(payload, ["outcome"]);
      if (value.outcome !== "purchase_ready") {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "auth_start":
    case "auth_complete": {
      const value = exactObject(payload, ["method"]);
      if (!oneOf(value.method, ["google", "email_otp"] as const)) {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "checkout_start": {
      const value = exactObject(payload, ["provider"]);
      if (value.provider !== "stripe") {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
      return;
    }
    case "purchase": {
      const value = exactObject(payload, [
        "transactionId",
        "value",
        "currency",
      ]);
      if (
        !isMeasurementTransactionId(value.transactionId) ||
        value.value !== MEASUREMENT_PURCHASE_VALUE ||
        value.currency !== MEASUREMENT_PURCHASE_CURRENCY
      ) {
        throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      }
    }
  }
}

export function createMeasurementEvent<Name extends MeasurementEventName>(
  name: Name,
  payload: MeasurementPayloadByName[Name],
): MeasurementEvent<Name> {
  validateMeasurementPayload(name, payload);
  return Object.freeze({
    name,
    payload: Object.freeze({ ...payload }),
  }) as MeasurementEvent<Name>;
}
