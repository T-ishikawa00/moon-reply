import "server-only";

import { createHmac } from "node:crypto";

import type { RecordedPaymentEvidence } from "../payment/production/types.ts";
import { disabledMeasurementAdapter } from "./adapters.ts";
import {
  createMeasurementEvent,
  isMeasurementTransactionId,
  MEASUREMENT_PURCHASE_CURRENCY,
  MEASUREMENT_PURCHASE_VALUE,
  type MeasurementAuthMethod,
  type MeasurementTransactionId,
} from "./events.ts";

const verifiedPaymentIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const purchaseIdentityDomain = "moon-reply:measurement:purchase:v1:";

export type ServerMeasurementResult = Readonly<{
  status: "disabled" | "not_applicable" | "unavailable";
}>;

function measurementEnabled() {
  return process.env.MEASUREMENT_ENABLED === "true";
}

function readMeasurementTransactionSecret() {
  const value = process.env.MEASUREMENT_TRANSACTION_SECRET;
  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new Error("MEASUREMENT_TRANSACTION_SECRET_UNAVAILABLE");
  }
  return value;
}

export function deriveMeasurementTransactionId(
  verifiedPaymentId: string,
  measurementTransactionSecret: string,
): MeasurementTransactionId {
  if (
    !verifiedPaymentIdPattern.test(verifiedPaymentId) ||
    Buffer.byteLength(measurementTransactionSecret, "utf8") < 32
  ) {
    throw new TypeError("MEASUREMENT_TRANSACTION_ID_INPUT_INVALID");
  }
  const transactionId = `mrp_${createHmac(
    "sha256",
    measurementTransactionSecret,
  )
    .update(`${purchaseIdentityDomain}${verifiedPaymentId}`, "utf8")
    .digest("base64url")}`;
  if (!isMeasurementTransactionId(transactionId)) {
    throw new TypeError("MEASUREMENT_TRANSACTION_ID_INVALID");
  }
  return transactionId;
}

export function trackServerAuthComplete(
  method: MeasurementAuthMethod,
): ServerMeasurementResult {
  try {
    if (!measurementEnabled()) return { status: "disabled" };
    disabledMeasurementAdapter.dispatch(
      createMeasurementEvent("auth_complete", { method }),
    );
    return { status: "disabled" };
  } catch {
    return { status: "unavailable" };
  }
}

export function trackVerifiedPaymentPurchase(
  recorded: Pick<RecordedPaymentEvidence, "disposition" | "verifiedPaymentId">,
): ServerMeasurementResult {
  try {
    if (!measurementEnabled()) return { status: "disabled" };
    if (
      !["verified", "duplicate"].includes(recorded.disposition) ||
      recorded.verifiedPaymentId === null
    ) {
      return { status: "not_applicable" };
    }
    const transactionId = deriveMeasurementTransactionId(
      recorded.verifiedPaymentId,
      readMeasurementTransactionSecret(),
    );
    disabledMeasurementAdapter.dispatch(
      createMeasurementEvent("purchase", {
        transactionId,
        value: MEASUREMENT_PURCHASE_VALUE,
        currency: MEASUREMENT_PURCHASE_CURRENCY,
      }),
    );
    return { status: "disabled" };
  } catch {
    return { status: "unavailable" };
  }
}
