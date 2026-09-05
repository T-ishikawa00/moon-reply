import "server-only";

import { createHmac } from "node:crypto";
import { M2RuntimeError } from "../assessment/runtime/errors.ts";
import { normalizeDeliveryEmail } from "../payment/production/crypto.ts";

export type AccountOtpPurpose = "request" | "verify";
export const ACCOUNT_OTP_THROTTLE_POLICY = {
  windowSeconds: 600,
  requestMaximum: 5,
  verifyMaximum: 10,
} as const;

export function hashAccountOtpIdentity(email: unknown, pepper: string) {
  const normalized = normalizeDeliveryEmail(email);
  if (Buffer.byteLength(pepper, "utf8") < 32) {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNCONFIGURED", 503);
  }
  return createHmac("sha256", pepper)
    .update(`moon-reply:account-otp-throttle:v1:${normalized}`, "utf8")
    .digest("hex");
}

export function requireAccountOtpAdmission(value: unknown) {
  if (
    typeof value !== "object" || value === null || Array.isArray(value) ||
    Object.keys(value).length !== 2 || !("allowed" in value) ||
    !("retry_after_seconds" in value) || typeof value.allowed !== "boolean" ||
    typeof value.retry_after_seconds !== "number" ||
    !Number.isInteger(value.retry_after_seconds) ||
    (value.allowed ? value.retry_after_seconds !== 0 :
      value.retry_after_seconds < 1 || value.retry_after_seconds > ACCOUNT_OTP_THROTTLE_POLICY.windowSeconds)
  ) throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNAVAILABLE", 503);
  if (!value.allowed) throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMITED", 429);
}
