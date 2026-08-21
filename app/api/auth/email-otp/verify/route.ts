import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  clearAuthCallbackCsrfCookie,
  issueAuthSessionCsrfCookie,
  readAuthContinuationCookie,
} from "@/lib/customer-auth/cookies";
import { readCustomerAuthEnvironment } from "@/lib/customer-auth/environment";
import {
  enforceCustomerAuthRateLimit,
  enforceCustomerAuthSameOrigin,
} from "@/lib/customer-auth/request-security";
import { customerAuthJson } from "@/lib/customer-auth/route-response";
import {
  createCustomerIdentityAuthApplication,
  requireCustomerAuthMethod,
} from "@/lib/customer-auth/service";
import { readStrictJsonRequest } from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 3 ||
    !("csrfToken" in value) ||
    !("email" in value) ||
    !("otp" in value)
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    requireCustomerAuthMethod("email_otp");
    const environment = readCustomerAuthEnvironment();
    enforceCustomerAuthSameOrigin(request, environment.siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 4_096));
    const continuationToken = readAuthContinuationCookie(request);
    if (!continuationToken) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
    }
    enforceCustomerAuthRateLimit("email-otp-verify", continuationToken);
    const application = await createCustomerIdentityAuthApplication();
    await application.verifyEmailOtp({
      continuationToken,
      csrfToken: body.csrfToken,
      email: body.email,
      otp: body.otp,
    });
    const response = customerAuthJson({ data: { status: "customer_bound" } }, 200);
    // Retain the one-use, consumed continuation through the short TTL so a
    // verified Customer can safely resume Purchase Intent creation after a
    // transient failure. The checkout endpoint clears it after success.
    clearAuthCallbackCsrfCookie(response);
    issueAuthSessionCsrfCookie(response);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_EMAIL_OTP_INVALID");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
