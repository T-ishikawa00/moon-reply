import "server-only";

import { createClient } from "@supabase/supabase-js";
import { M2RuntimeError } from "../assessment/runtime/errors.ts";
import { getSupabaseAdminEnv } from "../supabase/env.ts";
import {
  hashAccountOtpIdentity,
  requireAccountOtpAdmission,
  type AccountOtpPurpose,
} from "./account-otp-throttle.ts";

// Only Account OTP routes call this. Google/session/ownership auth retains its
// existing publishable client. A missing migration/store never falls back to Map.
export async function enforceAccountOtpThrottle(purpose: AccountOtpPurpose, email: unknown) {
  const identityHash = hashAccountOtpIdentity(
    email, process.env.EMAIL_VERIFICATION_SECRET_PEPPER ?? "",
  );
  let result: unknown;
  try {
    const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminEnv();
    const client = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const { data, error } = await client.rpc("consume_account_otp_attempt_v1", {
      p_identity_hash: identityHash, p_purpose: purpose,
    }).abortSignal(AbortSignal.timeout(5_000));
    if (error) throw new Error("ACCOUNT_OTP_STORE_FAILED");
    result = data;
  } catch {
    throw new M2RuntimeError("CUSTOMER_AUTH_RATE_LIMIT_UNAVAILABLE", 503);
  }
  requireAccountOtpAdmission(result);
}
