import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { getSupabaseCustomerAuthEnv } from "../supabase/env";
import { createCustomerAuthServerClient } from "../supabase/server";
import { CustomerAccountAuthApplicationV1 } from "./account-application";
import {
  isCustomerAuthFoundationEnabled,
  readCustomerAuthSiteOrigin,
} from "./environment";
import { SupabaseCustomerAuthProviderV1 } from "./supabase-provider";

export async function createCustomerAccountAuthApplication() {
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
  }
  const { supabaseUrl } = getSupabaseCustomerAuthEnv();
  const provider = new SupabaseCustomerAuthProviderV1(
    await createCustomerAuthServerClient(),
    readCustomerAuthSiteOrigin(),
    supabaseUrl,
  );
  return new CustomerAccountAuthApplicationV1(provider);
}
