import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { equalCustomerAuthSecret } from "@/lib/customer-auth/crypto";
import { setAuthContinuationCookies } from "@/lib/customer-auth/cookies";
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
    !("preparationCapability" in value) ||
    !("csrfToken" in value) ||
    !("flowKind" in value) ||
    (value.flowKind !== "google" && value.flowKind !== "email_otp")
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value as {
    preparationCapability: unknown;
    csrfToken: unknown;
    flowKind: "google" | "email_otp";
  };
}

export async function POST(request: NextRequest) {
  try {
    const environment = readCustomerAuthEnvironment();
    enforceCustomerAuthSameOrigin(request, environment.siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 4_096));
    requireCustomerAuthMethod(body.flowKind);
    if (
      !equalCustomerAuthSecret(
        request.headers.get("x-moon-reply-csrf"),
        body.csrfToken,
      )
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CSRF_REJECTED", 403);
    }
    enforceCustomerAuthRateLimit(
      "continuation-create",
      String(body.preparationCapability),
    );
    const application = await createCustomerIdentityAuthApplication();
    const outcome = await application.createContinuation(body);
    const response = customerAuthJson(
      {
        data: {
          status: "continuation_ready",
          csrfToken: outcome.csrfToken,
          expiresAt: outcome.expiresAt,
        },
      },
      200,
    );
    setAuthContinuationCookies(response, {
      continuation: outcome.continuationToken,
      csrf: outcome.csrfToken,
      ttlSeconds: outcome.ttlSeconds,
    });
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_REQUEST_FAILED");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
