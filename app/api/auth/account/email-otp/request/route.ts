import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  createAccountLoginAttempt,
  readAccountLoginAttempt,
  setAccountLoginAttempt,
} from "@/lib/customer-auth/account-attempt";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { enforceAccountOtpThrottle } from "@/lib/customer-auth/account-otp-throttle-runtime";
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

const ACCOUNT_EMAIL_OTP_REQUEST_GLOBAL_RATE_LIMIT_KEY =
  "account-email-otp-request-global-v1";

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !("email" in value)
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value as { email: unknown };
}

export async function POST(request: NextRequest) {
  try {
    requireCustomerAuthMethod("email_otp");
    const siteOrigin = readCustomerAuthSiteOrigin();
    enforceCustomerAuthSameOrigin(request, siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 4_096));
    enforceCustomerAuthRateLimit(
      "account-email-otp-request-global",
      ACCOUNT_EMAIL_OTP_REQUEST_GLOBAL_RATE_LIMIT_KEY,
    );
    const attempt = readAccountLoginAttempt(request) ?? createAccountLoginAttempt();
    enforceCustomerAuthRateLimit("account-email-otp-request", attempt.secret);
    await enforceAccountOtpThrottle("request", body.email);
    await (await createCustomerAccountAuthApplication()).requestEmailOtp(body.email);
    const response = customerAuthJson(
      { data: { status: "accepted" } },
      200,
    );
    setAccountLoginAttempt(response, attempt);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_EMAIL_OTP_REQUEST_FAILED");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
