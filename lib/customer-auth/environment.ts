import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { isCustomerAuthCutoverSelected } from "./cutover";

export type CustomerAuthEnvironment = Readonly<{
  siteOrigin: string;
  continuationTtlSeconds: number;
  emailHashPepper: string;
  emailEncryptionKey: string;
  emailKeyVersion: string;
}>;

function enabled(name: string) {
  return process.env[name] === "true";
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  return value;
}

function boundedInteger(name: string, minimum: number, maximum: number) {
  const value = required(name);
  if (!/^\d+$/u.test(value)) {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  }
  return parsed;
}

function exactSiteOrigin(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  }
  if (
    parsed.origin !== value ||
    !["http:", "https:"].includes(parsed.protocol) ||
    (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  }
  return parsed.origin;
}

export function isCustomerAuthFoundationEnabled() {
  return isCustomerAuthCutoverSelected() && !enabled("CUSTOMER_AUTH_EMERGENCY_STOP");
}

export function isCustomerAuthGoogleEnabled() {
  return isCustomerAuthFoundationEnabled() && enabled("CUSTOMER_AUTH_GOOGLE_ENABLED");
}

export function isCustomerAuthEmailOtpEnabled() {
  return isCustomerAuthFoundationEnabled() && enabled("CUSTOMER_AUTH_EMAIL_OTP_ENABLED");
}

export function readCustomerAuthEnvironment(): CustomerAuthEnvironment {
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
  }
  const emailKeyVersion = required("CUSTOMER_AUTH_EMAIL_KEY_VERSION");
  if (!/^[A-Za-z0-9._-]{1,32}$/u.test(emailKeyVersion)) {
    throw new M2RuntimeError("CUSTOMER_AUTH_CONFIGURATION_INVALID", 503);
  }
  return {
    siteOrigin: exactSiteOrigin(required("NEXT_PUBLIC_APP_URL")),
    continuationTtlSeconds: boundedInteger(
      "CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS",
      60,
      1_800,
    ),
    emailHashPepper: required("EMAIL_VERIFICATION_SECRET_PEPPER"),
    emailEncryptionKey: required("EMAIL_ADDRESS_ENCRYPTION_KEY"),
    emailKeyVersion,
  };
}
