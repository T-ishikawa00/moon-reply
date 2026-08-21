import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors.ts";

export type CustomerIdentityRuntimeRegime =
  | "legacy_custom_email"
  | "supabase_customer_auth";

export function customerIdentityRuntimeRegime(): CustomerIdentityRuntimeRegime {
  return process.env.CUSTOMER_AUTH_ENABLED === "true"
    ? "supabase_customer_auth"
    : "legacy_custom_email";
}

export function isCustomerAuthCutoverSelected() {
  return customerIdentityRuntimeRegime() === "supabase_customer_auth";
}

export function enforceLegacyCustomerEmailVerificationAllowed() {
  if (isCustomerAuthCutoverSelected()) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_UNAVAILABLE", 404);
  }
}
