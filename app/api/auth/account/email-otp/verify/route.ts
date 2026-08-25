import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  clearAccountLoginAttempt,
  readAccountLoginAttempt,
} from "@/lib/customer-auth/account-attempt";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { issueAuthSessionCsrfCookie } from "@/lib/customer-auth/cookies";
import { readCustomerAuthSiteOrigin } from "@/lib/customer-auth/environment";
import {
  enforceCustomerAuthRateLimit,
  enforceCustomerAuthSameOrigin,
} from "@/lib/customer-auth/request-security";
import { customerAuthJson } from "@/lib/customer-auth/route-response";
import { requireCustomerAuthMethod } from "@/lib/customer-auth/service";
import { readStrictJsonRequest } from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !("email" in value) ||
    !("otp" in value)
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value as { email: unknown; otp: unknown };
}

export async function POST(request: NextRequest) {
  try {
    requireCustomerAuthMethod("email_otp");
    const siteOrigin = readCustomerAuthSiteOrigin();
    enforceCustomerAuthSameOrigin(request, siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 4_096));
    const attempt = readAccountLoginAttempt(request);
    if (!attempt) {
      throw new M2RuntimeError("CUSTOMER_AUTH_LOGIN_ATTEMPT_INVALID", 403);
    }
    enforceCustomerAuthRateLimit("account-email-otp-verify", attempt.secret);
    await (await createCustomerAccountAuthApplication()).verifyEmailOtp(body);
    const response = customerAuthJson({ data: { status: "signed_in" } }, 200);
    clearAccountLoginAttempt(response);
    issueAuthSessionCsrfCookie(response);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_EMAIL_OTP_INVALID");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
