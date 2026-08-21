import type { NextRequest } from "next/server";

import { refreshCustomerAuthSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshCustomerAuthSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/api/account/:path*",
    "/api/auth/:path*",
  ],
};
