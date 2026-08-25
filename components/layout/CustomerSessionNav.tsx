"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CUSTOMER_AUTH_STATE_CHANGED_EVENT } from "@/lib/customer-auth/browser-events";

type SessionState = "signed_in" | "signed_out";

export function CustomerSessionNav() {
  const pathname = usePathname();
  const [state, setState] = useState<SessionState>("signed_out");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function refresh() {
      try {
        const response = await fetch("/api/account/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const body: unknown = await response.json();
        const candidate =
          typeof body === "object" &&
          body !== null &&
          "data" in body &&
          typeof body.data === "object" &&
          body.data !== null &&
          "state" in body.data
            ? body.data.state
            : null;
        if (active && candidate === "signed_in") setState("signed_in");
        if (active && candidate !== "signed_in") setState("signed_out");
      } catch {
        // Navigation remains safely useful as the signed-out presentation.
      }
    }

    void refresh();
    window.addEventListener(CUSTOMER_AUTH_STATE_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      controller.abort();
      window.removeEventListener(CUSTOMER_AUTH_STATE_CHANGED_EVENT, refresh);
    };
  }, [pathname]);

  return state === "signed_in" ? (
    <Link href="/account" className="site-nav__link site-nav__identity">
      私の鑑定ノート
    </Link>
  ) : (
    <Link href="/login" className="site-nav__link site-nav__identity">
      ログイン
    </Link>
  );
}
