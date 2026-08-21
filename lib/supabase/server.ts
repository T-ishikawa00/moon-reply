import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { CUSTOMER_AUTH_COOKIE_POLICY } from "./cookie-policy";
import { getSupabaseCustomerAuthEnv } from "./env";

export async function createCustomerAuthServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } =
    getSupabaseCustomerAuthEnv();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
    },
    cookieOptions: CUSTOMER_AUTH_COOKIE_POLICY,
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              ...CUSTOMER_AUTH_COOKIE_POLICY,
              domain: undefined,
            });
          }
        } catch {
          // Server Components cannot always write cookies. proxy.ts performs
          // the request-scoped refresh and propagates every Set-Cookie header.
        }
      },
    },
  });
}
