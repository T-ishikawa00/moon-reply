"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackClientMeasurement } from "@/lib/measurement/client";
import type { MeasurementPageArea } from "@/lib/measurement/events";

function measurementPageArea(pathname: string): MeasurementPageArea {
  if (pathname === "/") return "home";
  if (pathname === "/sample-report") return "sample";
  if (pathname === "/request") return "request";
  if (pathname.startsWith("/account/results/")) return "account_result";
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    return "account";
  }
  if (pathname.startsWith("/purchase/auth/")) return "purchase_auth";
  if (pathname.startsWith("/purchase/return/")) return "purchase_return";
  if (pathname.startsWith("/result/")) return "legacy_result";
  if (pathname === "/contact" || pathname.startsWith("/contact/")) {
    return "contact";
  }
  if (pathname.startsWith("/legal/")) return "legal";
  if (pathname.startsWith("/review/")) return "review";
  return "other";
}

export function MeasurementPageView() {
  const pathname = usePathname();
  const lastMeasuredPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastMeasuredPathname.current) return;
    lastMeasuredPathname.current = pathname;
    trackClientMeasurement("page_view", {
      page: measurementPageArea(pathname),
    });
  }, [pathname]);

  return null;
}
