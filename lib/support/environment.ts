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
