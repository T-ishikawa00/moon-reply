import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { isCustomerAuthFoundationEnabled } from "../customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "../customer-auth/service";
import { getSupabaseAdminEnv } from "../supabase/env";
import { CustomerSupportApplicationV1 } from "./application";
import { requireCustomerSupportCasesEnabled } from "./environment";
import { SupabaseCustomerSupportCaseRepositoryV1 } from "./supabase-repository";

export async function createAuthenticatedCustomerSupportCase(input: {
  purchaseIntentId: unknown;
  category: unknown;
  customerNote: unknown;
  idempotencyKey: unknown;
}) {
  requireCustomerSupportCasesEnabled();
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
  }
  const identity = await (
    await createCustomerIdentityAuthApplication()
  ).getFreshIdentity();
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminEnv();
  return new CustomerSupportApplicationV1({
    repository: new SupabaseCustomerSupportCaseRepositoryV1(
      supabaseUrl,
      supabaseSecretKey,
    ),
  }).createCase({
    ...input,
    customerUserId: identity.customerUserId,
  });
}
