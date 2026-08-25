import {
  isCustomerAuthEmailOtpEnabled,
  isCustomerAuthFoundationEnabled,
  isCustomerAuthGoogleEnabled,
} from "@/lib/customer-auth/environment";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { customerAuthJson } from "@/lib/customer-auth/route-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const methods = {
    google: isCustomerAuthGoogleEnabled(),
    emailOtp: isCustomerAuthEmailOtpEnabled(),
  } as const;
  if (!isCustomerAuthFoundationEnabled()) {
    return customerAuthJson({ data: { state: "unavailable", methods } }, 200);
  }
  try {
    const state = await (
      await createCustomerAccountAuthApplication()
    ).getFreshSessionState();
    return customerAuthJson({ data: { state, methods } }, 200);
  } catch {
    return customerAuthJson({ data: { state: "unavailable", methods } }, 200);
  }
}
