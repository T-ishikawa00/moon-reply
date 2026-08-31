import { NextResponse, type NextRequest } from "next/server";

import { refreshCustomerAuthSession } from "@/lib/supabase/proxy";
import {
  captureMeasurementAttribution,
  MEASUREMENT_ATTRIBUTION_COOKIE_NAME,
} from "@/lib/measurement/attribution";
import {
  measurementAttributionCookieOptions,
  openMeasurementAttributionCookie,
  sealMeasurementAttributionCookie,
} from "@/lib/measurement/attribution-cookie";
import { readMeasurementR1Config } from "@/lib/measurement/config";

function anonymousClientId() {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  return `${(values[0] % 2_147_483_646) + 1}.${(values[1] % 2_147_483_646) + 1}`;
}

function needsAuthRefresh(pathname: string) {
  return (
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/api/account/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/purchase/auth/")
  );
}

function isGoogleOrganicReferrer(value: string | null) {
  if (!value) return false;
  try {
    const referrer = new URL(value);
    return (
      referrer.protocol === "https:" &&
      ["google.com", "www.google.com", "google.co.jp", "www.google.co.jp"].includes(
        referrer.hostname.toLowerCase(),
      )
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const response = needsAuthRefresh(request.nextUrl.pathname)
    ? await refreshCustomerAuthSession(request)
    : NextResponse.next({ request });
  const measurement = readMeasurementR1Config(process.env);
  if (!measurement || request.method !== "GET") return response;
  try {
    const now = new Date();
    const existing = await openMeasurementAttributionCookie(
      request.cookies.get(MEASUREMENT_ATTRIBUTION_COOKIE_NAME)?.value,
      measurement.attributionSecret,
      now,
    );
    const captured = captureMeasurementAttribution({
      url: request.nextUrl,
      existing,
      now,
      clientId: anonymousClientId(),
      googleOrganic: isGoogleOrganicReferrer(request.headers.get("referer")),
    });
    if (captured.changed) {
      response.cookies.set({
        ...measurementAttributionCookieOptions,
        value: await sealMeasurementAttributionCookie(
          captured.snapshot,
          measurement.attributionSecret,
        ),
      });
    }
  } catch {
    // Invalid/malformed attribution never changes an existing cookie or product path.
  }
  return response;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/api/account/:path*",
    "/api/auth/:path*",
    "/purchase/auth/:path*",
    "/",
    "/sample-report",
    "/request",
    "/contact",
    "/legal/:path*",
  ],
};
