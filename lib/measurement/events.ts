export const MEASUREMENT_EVENT_NAMES = [
  "landing_view",
  "page_view",
  "sample_view",
  "request_start",
  "request_complete",
  "auth_start",
  "auth_complete",
  "checkout_start",
  "purchase",
] as const;

export const MEASUREMENT_AUTH_LATENCY_EVENT_NAME = "auth_latency" as const;

export const GOOGLE_AUTH_LATENCY_PHASES = [
  "client_start",
  "google_start_security",
  "google_start_continuation",
  "google_start_provider",
  "google_start_server",
  "provider_roundtrip",
  "google_callback_continuation",
  "google_callback_exchange",
  "google_callback_identity",
  "google_callback_binding",
  "google_callback_server",
  "end_to_end",
] as const;

export const GOOGLE_AUTH_LATENCY_OUTCOMES = [
  "success",
  "failed",
  "cancelled",
  "unavailable",
] as const;

export const GOOGLE_AUTH_LATENCY_SCHEMA_VERSION = 1 as const;
export const GOOGLE_AUTH_LATENCY_MAX_DURATION_MS = 600_000 as const;

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

export type MeasurementEventName =
  | (typeof MEASUREMENT_EVENT_NAMES)[number]
  | typeof MEASUREMENT_AUTH_LATENCY_EVENT_NAME;
export type MeasurementPageArea = (typeof MEASUREMENT_PAGE_AREAS)[number];
export type MeasurementAuthMethod = "google" | "email_otp";
export type GoogleAuthLatencyPhase =
  (typeof GOOGLE_AUTH_LATENCY_PHASES)[number];
export type GoogleAuthLatencyOutcome =
  (typeof GOOGLE_AUTH_LATENCY_OUTCOMES)[number];
export type MeasurementTransactionId = string & {
  readonly __measurementTransactionId: unique symbol;
};

export type MeasurementPayloadByName = Readonly<{
  landing_view: Readonly<{
    landingPath: string;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    utmContent: string | null;
    gclid: string | null;
  }>;
  page_view: Readonly<{ page: MeasurementPageArea }>;
  sample_view: Readonly<{ sample: "public_sample" }>;
  request_start: Readonly<{ experience: "consultation_request" }>;
  request_complete: Readonly<{ outcome: "purchase_ready" }>;
  auth_start: Readonly<{ method: MeasurementAuthMethod }>;
  auth_complete: Readonly<{ method: MeasurementAuthMethod }>;
  auth_latency: Readonly<{
    schemaVersion: typeof GOOGLE_AUTH_LATENCY_SCHEMA_VERSION;
    method: "google";
    traceId: string;
    phase: GoogleAuthLatencyPhase;
    durationMs: number;
    outcome: GoogleAuthLatencyOutcome;
  }>;
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
const authLatencyTraceIdPattern = /^mral_[A-Za-z0-9_-]{32}$/u;

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
    case "landing_view": {
      const value = exactObject(payload, [
        "landingPath",
        "utmSource",
        "utmMedium",
        "utmCampaign",
        "utmContent",
        "gclid",
      ]);
      if (
        typeof value.landingPath !== "string" ||
        ![
          "/", "/sample-report", "/request", "/contact", "/legal",
          "/legal/privacy", "/legal/terms", "/legal/refund",
          "/legal/tokushoho", "/legal/unsupported-cases",
          "/legal/ai-disclosure",
        ].includes(value.landingPath) ||
        ![value.utmSource, value.utmMedium].every(
          (item) => item === null || (typeof item === "string" && item.length <= 64 && /^[A-Za-z0-9._~-]+$/u.test(item)),
        ) ||
        ![value.utmCampaign, value.utmContent].every(
          (item) => item === null || (typeof item === "string" && item.length <= 100 && /^[A-Za-z0-9._~-]+$/u.test(item)),
        ) ||
        !(value.gclid === null || (typeof value.gclid === "string" && value.gclid.length <= 200 && /^[A-Za-z0-9_-]+$/u.test(value.gclid)))
      ) throw new TypeError("MEASUREMENT_PAYLOAD_INVALID");
      return;
    }
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
    case "auth_latency": {
      const value = exactObject(payload, [
        "schemaVersion",
        "method",
        "traceId",
        "phase",
        "durationMs",
        "outcome",
      ]);
      if (
        value.schemaVersion !== GOOGLE_AUTH_LATENCY_SCHEMA_VERSION ||
        value.method !== "google" ||
        typeof value.traceId !== "string" ||
        !authLatencyTraceIdPattern.test(value.traceId) ||
        !oneOf(value.phase, GOOGLE_AUTH_LATENCY_PHASES) ||
        typeof value.durationMs !== "number" ||
        !Number.isSafeInteger(value.durationMs) ||
        value.durationMs < 0 ||
        value.durationMs > GOOGLE_AUTH_LATENCY_MAX_DURATION_MS ||
        !oneOf(value.outcome, GOOGLE_AUTH_LATENCY_OUTCOMES)
      ) {
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
