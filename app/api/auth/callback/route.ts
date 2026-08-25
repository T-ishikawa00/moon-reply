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
import { trackServerAuthComplete } from "@/lib/measurement/server";
import {
  clearServerGoogleAuthLatencyAnchor,
  createServerGoogleAuthObserver,
  readServerGoogleAuthLatencyAnchor,
  recordServerGoogleAuthLatency,
} from "@/lib/measurement/auth-latency-server";

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
  const routeStartedAtMs = performance.now();
  const receivedAtMs = Date.now();
  const latencyAnchor = readServerGoogleAuthLatencyAnchor(
    request,
    receivedAtMs,
  );
  const finish = (
    response: NextResponse,
    outcome: "success" | "failed",
  ) => {
    clearServerGoogleAuthLatencyAnchor(response);
    if (latencyAnchor !== null) {
      recordServerGoogleAuthLatency(latencyAnchor, {
        phase: "provider_roundtrip",
        startedAtMs: latencyAnchor.issuedAtMs,
        completedAtMs: receivedAtMs,
        outcome: "success",
      });
    }
    recordServerGoogleAuthLatency(latencyAnchor, {
      phase: "google_callback_server",
      startedAtMs: routeStartedAtMs,
      outcome,
    });
    return response;
  };
  let siteOrigin: string;
  try {
    requireCustomerAuthMethod("google");
    const environment = readCustomerAuthEnvironment();
    siteOrigin = environment.siteOrigin;
  } catch {
    return finish(new NextResponse(null, {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    }), "failed");
  }
  const failed = () => {
    const response = redirect(siteOrigin, "/account?auth=failed");
    clearAuthContinuationCookies(response);
    return finish(response, "failed");
  };
  try {
    const url = new URL(request.url);
    if ([...url.searchParams.keys()].some((key) => key !== "code")) {
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
    }, createServerGoogleAuthObserver(latencyAnchor));
    trackServerAuthComplete("google");
    const response = redirect(siteOrigin, "/purchase/auth/continue");
    clearAuthCallbackCsrfCookie(response);
    issueAuthSessionCsrfCookie(response);
    return finish(response, "success");
  } catch {
    return failed();
  }
}
