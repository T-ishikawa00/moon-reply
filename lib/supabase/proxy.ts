import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isCustomerAuthFoundationEnabled } from "../customer-auth/environment";
import {
  issueAuthSessionCsrfCookie,
  readAuthSessionCsrfCookie,
} from "../customer-auth/cookies";
import { CUSTOMER_AUTH_COOKIE_POLICY } from "./cookie-policy";
import { getSupabaseCustomerAuthEnv } from "./env";

export async function refreshCustomerAuthSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0, must-revalidate",
  );
  response.headers.set("Vary", "Cookie");

  if (!isCustomerAuthFoundationEnabled()) return response;

  const { supabaseUrl, supabasePublishableKey } =
    getSupabaseCustomerAuthEnv();
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false },
    cookieOptions: CUSTOMER_AUTH_COOKIE_POLICY,
    cookies: {
      getAll() {
        return request.cookies.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, {
            ...options,
            ...CUSTOMER_AUTH_COOKIE_POLICY,
            domain: undefined,
          });
        }
        for (const [name, value] of Object.entries(headers)) {
          response.headers.set(name, value);
        }
        response.headers.set(
          "Cache-Control",
          "private, no-store, no-cache, max-age=0, must-revalidate",
        );
        response.headers.set("Vary", "Cookie");
      },
    },
  });

  // getClaims performs the minimum reviewed refresh/validation work. It does
  // not authorize a high-impact operation; those routes call fresh getUser().
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.sub && !readAuthSessionCsrfCookie(request)) {
    // Auth sessions can outlive the independent logout/checkout CSRF cookie.
    // Re-issue it only after locally validated claims and only on the response.
    issueAuthSessionCsrfCookie(response);
  }
  return response;
}
