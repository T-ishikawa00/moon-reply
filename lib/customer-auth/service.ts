import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { getSupabaseAdminEnv } from "../supabase/env";
import { createCustomerAuthServerClient } from "../supabase/server";
import { CustomerIdentityAuthApplicationV1 } from "./application";
import {
  isCustomerAuthEmailOtpEnabled,
  isCustomerAuthFoundationEnabled,
  isCustomerAuthGoogleEnabled,
  readCustomerAuthEnvironment,
} from "./environment";
import { SupabaseCustomerAuthProviderV1 } from "./supabase-provider";
import { SupabaseCustomerIdentityRepositoryV1 } from "./supabase-repository";

export async function createCustomerIdentityAuthApplication() {
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
  }
  const environment = readCustomerAuthEnvironment();
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminEnv();
  const provider = new SupabaseCustomerAuthProviderV1(
    await createCustomerAuthServerClient(),
    environment.siteOrigin,
    supabaseUrl,
  );
  return new CustomerIdentityAuthApplicationV1({
    environment,
    provider,
    repository: new SupabaseCustomerIdentityRepositoryV1(
      supabaseUrl,
      supabaseSecretKey,
    ),
  });
}

export function requireCustomerAuthMethod(method: "google" | "email_otp") {
  const available =
    method === "google"
      ? isCustomerAuthGoogleEnabled()
      : isCustomerAuthEmailOtpEnabled();
  if (!available) {
    throw new M2RuntimeError("CUSTOMER_AUTH_METHOD_UNAVAILABLE", 404);
  }
}
