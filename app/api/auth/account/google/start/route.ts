import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  createAccountLoginAttempt,
  readAccountLoginAttempt,
  setAccountLoginAttempt,
} from "@/lib/customer-auth/account-attempt";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
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
    Object.keys(value).length !== 0
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireCustomerAuthMethod("google");
    const siteOrigin = readCustomerAuthSiteOrigin();
    enforceCustomerAuthSameOrigin(request, siteOrigin);
    decode(await readStrictJsonRequest(request, 256));
    const attempt = readAccountLoginAttempt(request) ?? createAccountLoginAttempt();
    enforceCustomerAuthRateLimit("account-google-start", attempt.secret);
    const outcome = await (await createCustomerAccountAuthApplication()).startGoogle();
    const response = customerAuthJson(
      {
        data: {
          status: "redirect_ready",
          authorizationUrl: outcome.authorizationUrl,
        },
      },
      200,
    );
    setAccountLoginAttempt(response, attempt);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_GOOGLE_START_FAILED");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
