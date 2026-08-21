import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { readAuthContinuationCookie } from "@/lib/customer-auth/cookies";
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
    Object.keys(value).length !== 1 ||
    !("csrfToken" in value)
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    requireCustomerAuthMethod("google");
    const environment = readCustomerAuthEnvironment();
    enforceCustomerAuthSameOrigin(request, environment.siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    const continuationToken = readAuthContinuationCookie(request);
    if (!continuationToken) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CONTINUATION_INVALID", 403);
    }
    enforceCustomerAuthRateLimit("google-start", continuationToken);
    const application = await createCustomerIdentityAuthApplication();
    const outcome = await application.startGoogle({
      continuationToken,
      csrfToken: body.csrfToken,
    });
    return customerAuthJson(
      { data: { status: "redirect_ready", authorizationUrl: outcome.authorizationUrl } },
      200,
    );
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_GOOGLE_START_FAILED");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
