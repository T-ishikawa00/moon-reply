import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";

export function isCustomerSupportCasesEnabled() {
  return process.env.CUSTOMER_SUPPORT_CASES_ENABLED === "true";
}

export function requireCustomerSupportCasesEnabled() {
  if (!isCustomerSupportCasesEnabled()) {
    throw new M2RuntimeError("CUSTOMER_SUPPORT_UNAVAILABLE", 404);
  }
}

export function isPurchaseSupportEmailEnabled() {
  return process.env.PURCHASE_SUPPORT_EMAIL_ENABLED === "true";
}

export function requirePurchaseSupportEmailEnabled() {
  if (!isPurchaseSupportEmailEnabled())
    throw new M2RuntimeError("PURCHASE_SUPPORT_UNAVAILABLE", 404);
}

export function readPurchaseSupportEmailConfiguration() {
  requirePurchaseSupportEmailEnabled();
  if (process.env.TRANSACTIONAL_EMAIL_PROVIDER !== "resend")
    throw new M2RuntimeError("PURCHASE_SUPPORT_EMAIL_CONFIGURATION_INVALID", 503);
  return {
    apiKey: process.env.EMAIL_API_KEY,
    fromAddress: process.env.EMAIL_FROM_ADDRESS,
    fromName: process.env.EMAIL_FROM_NAME,
    operatorEmail: process.env.PURCHASE_SUPPORT_OPERATOR_EMAIL,
  };
}
