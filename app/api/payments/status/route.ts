import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { readTrustedEmailCookie } from "@/lib/payment/production/cookie";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import {
  processAuthenticatedProductionPurchaseStatus,
  processProductionPurchaseStatus,
} from "@/lib/payment/production/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}
function decode(value: unknown) {
  const keys =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? Object.keys(value)
      : [];
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("statusCapability" in value) ||
    !(
      (keys.length === 1 && keys[0] === "statusCapability") ||
      (keys.length === 2 &&
        keys.includes("statusCapability") &&
        keys.includes("checkoutCancelled") &&
        "checkoutCancelled" in value &&
        value.checkoutCancelled === true)
    )
  ) {
    throw new M2RuntimeError("PAYMENT_STATUS_REQUEST_INVALID", 400);
  }
  return value as {
    statusCapability: unknown;
    checkoutCancelled?: true;
  };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    enforceProductionRouteRateLimit(
      "purchase-status-recovery",
      String(body.statusCapability),
    );
    const outcome = isCustomerAuthFoundationEnabled()
      ? await processAuthenticatedProductionPurchaseStatus(
          body.statusCapability,
          (
            await (
              await createCustomerIdentityAuthApplication()
            ).getFreshIdentity()
          ).customerUserId,
          body.checkoutCancelled === true,
        )
      : await processProductionPurchaseStatus(
          body.statusCapability,
          readTrustedEmailCookie(request.headers.get("cookie")),
          body.checkoutCancelled === true,
        );
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAYMENT_STATUS_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
