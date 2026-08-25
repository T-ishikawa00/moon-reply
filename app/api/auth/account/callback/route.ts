import { NextResponse, type NextRequest } from "next/server";

import {
  clearAccountLoginAttempt,
  readAccountLoginAttempt,
} from "@/lib/customer-auth/account-attempt";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { issueAuthSessionCsrfCookie } from "@/lib/customer-auth/cookies";
import { readConfiguredCustomerSiteOrigin } from "@/lib/customer-auth/environment";
import { enforceCustomerAuthRateLimit } from "@/lib/customer-auth/request-security";
import { requireCustomerAuthMethod } from "@/lib/customer-auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountCallbackDestination = "/account" | "/login?status=google_failed";

function redirect(siteOrigin: string, destination: AccountCallbackDestination) {
  const response = NextResponse.redirect(new URL(destination, siteOrigin), 303);
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  response.headers.set("Vary", "Cookie");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export async function GET(request: NextRequest) {
  let siteOrigin: string;
  try {
    siteOrigin = readConfiguredCustomerSiteOrigin();
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }
  const failed = () => {
    const response = redirect(siteOrigin, "/login?status=google_failed");
    clearAccountLoginAttempt(response);
    return response;
  };
  try {
    requireCustomerAuthMethod("google");
    const url = new URL(request.url);
    if ([...url.searchParams.keys()].some((key) => key !== "code")) {
      return failed();
    }
    const code = url.searchParams.get("code");
    const attempt = readAccountLoginAttempt(request);
    if (!code || !attempt) return failed();
    enforceCustomerAuthRateLimit("account-google-callback", attempt.secret);
    await (await createCustomerAccountAuthApplication()).completeGoogleCallback(code);
    const response = redirect(siteOrigin, "/account");
    clearAccountLoginAttempt(response);
    issueAuthSessionCsrfCookie(response);
    return response;
  } catch {
    return failed();
  }
}
