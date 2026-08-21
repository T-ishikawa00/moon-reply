import { NextResponse, type NextRequest } from "next/server";

import {
  clearAuthContinuationCookies,
  clearAuthCallbackCsrfCookie,
  issueAuthSessionCsrfCookie,
  readAuthCallbackCsrfCookie,
  readAuthContinuationCookie,
} from "@/lib/customer-auth/cookies";
import { readCustomerAuthEnvironment } from "@/lib/customer-auth/environment";
import { enforceCustomerAuthRateLimit } from "@/lib/customer-auth/request-security";
import {
  createCustomerIdentityAuthApplication,
  requireCustomerAuthMethod,
} from "@/lib/customer-auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirect(
  siteOrigin: string,
  path: "/purchase/auth/continue" | "/account?auth=failed",
) {
  const response = NextResponse.redirect(new URL(path, siteOrigin), 303);
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export async function GET(request: NextRequest) {
  let siteOrigin: string;
  try {
    requireCustomerAuthMethod("google");
    const environment = readCustomerAuthEnvironment();
    siteOrigin = environment.siteOrigin;
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
    const response = redirect(siteOrigin, "/account?auth=failed");
    clearAuthContinuationCookies(response);
    return response;
  };
  try {
    const url = new URL(request.url);
    if (
      url.origin !== siteOrigin ||
      request.headers.get("host") !== new URL(siteOrigin).host ||
      [...url.searchParams.keys()].some((key) => key !== "code")
    ) {
      return failed();
    }
    const code = url.searchParams.get("code");
    const continuationToken = readAuthContinuationCookie(request);
    const csrfToken = readAuthCallbackCsrfCookie(request);
    if (!code || !continuationToken || !csrfToken) return failed();
    enforceCustomerAuthRateLimit("google-callback", continuationToken);
    const application = await createCustomerIdentityAuthApplication();
    await application.completeGoogleCallback({
      continuationToken,
      csrfToken,
      code,
    });
    const response = redirect(siteOrigin, "/purchase/auth/continue");
    clearAuthCallbackCsrfCookie(response);
    issueAuthSessionCsrfCookie(response);
    return response;
  } catch {
    return failed();
  }
}
