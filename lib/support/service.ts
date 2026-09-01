import "server-only";

import { M2RuntimeError } from "../assessment/runtime/errors";
import { isCustomerAuthFoundationEnabled } from "../customer-auth/environment";
import { enforceCustomerAuthRateLimit } from "../customer-auth/request-security";
import { createCustomerIdentityAuthApplication } from "../customer-auth/service";
import { createResendTransactionalEmailAdapterV1 } from "../payment/production/resend-transactional-email-runtime";
import { SupabasePaymentDeliveryRepository } from "../payment/production/supabase-repository";
import { getSupabaseAdminEnv } from "../supabase/env";
import { CustomerSupportApplicationV1 } from "./application";
import {
  readPurchaseSupportEmailConfiguration,
  requireCustomerSupportCasesEnabled,
  requirePurchaseSupportEmailEnabled,
} from "./environment";
import { PurchaseSupportAuthorityResolverV1 } from "./purchase-authority";
import { PurchaseSupportInquiryApplicationV1 } from "./purchase-inquiry-application";
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

export async function sendAuthenticatedPurchaseSupportInquiry(input: {
  purchaseIntentId: unknown;
  category: unknown;
  customerMessage: unknown;
  idempotencyKey: unknown;
}) {
  requirePurchaseSupportEmailEnabled();
  if (!isCustomerAuthFoundationEnabled()) {
    throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
  }
  const identity = await (await createCustomerIdentityAuthApplication()).getFreshIdentity();
  enforceCustomerAuthRateLimit("purchase-support-inquiry", identity.customerUserId);
  const { supabaseUrl, supabaseSecretKey } = getSupabaseAdminEnv();
  const repository = new SupabasePaymentDeliveryRepository(supabaseUrl, supabaseSecretKey);
  const emailConfiguration = readPurchaseSupportEmailConfiguration();
  const email = createResendTransactionalEmailAdapterV1(emailConfiguration);
  return new PurchaseSupportInquiryApplicationV1({
    authority: new PurchaseSupportAuthorityResolverV1(repository),
    operatorEmail: {
      send: (request) =>
        email.sendPurchaseSupport(emailConfiguration.operatorEmail, request),
    },
  }).submit({
    ...input,
    customerUserId: identity.customerUserId,
    customerEmail: identity.verifiedEmail,
  });
}
