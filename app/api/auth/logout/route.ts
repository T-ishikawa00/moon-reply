import type { NextRequest } from "next/server";

import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  clearAuthSessionCsrfCookie,
  readAuthSessionCsrfCookie,
} from "@/lib/customer-auth/cookies";
import { equalCustomerAuthSecret } from "@/lib/customer-auth/crypto";
import { readCustomerAuthEnvironment } from "@/lib/customer-auth/environment";
import {
  enforceCustomerAuthRateLimit,
  enforceCustomerAuthSameOrigin,
} from "@/lib/customer-auth/request-security";
import { customerAuthJson } from "@/lib/customer-auth/route-response";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import { readStrictJsonRequest } from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !("csrfToken" in value) ||
    !("scope" in value) ||
    (value.scope !== "local" && value.scope !== "global")
  ) {
    throw new M2RuntimeError("CUSTOMER_AUTH_REQUEST_INVALID", 400);
  }
  return value as { csrfToken: unknown; scope: "local" | "global" };
}

export async function POST(request: NextRequest) {
  try {
    const environment = readCustomerAuthEnvironment();
    enforceCustomerAuthSameOrigin(request, environment.siteOrigin);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    const cookieCsrf = readAuthSessionCsrfCookie(request);
    if (!equalCustomerAuthSecret(cookieCsrf, body.csrfToken)) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CSRF_REJECTED", 403);
    }
    enforceCustomerAuthRateLimit("logout", cookieCsrf ?? "missing");
    const application = await createCustomerIdentityAuthApplication();
    await application.logout(body.scope);
    const response = customerAuthJson({ data: { status: "logged_out" } }, 200);
    clearAuthSessionCsrfCookie(response);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_AUTH_LOGOUT_FAILED");
    return customerAuthJson({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
