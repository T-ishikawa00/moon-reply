import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { processProductionPurchaseStatus } from "@/lib/payment/production/service";

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
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !("statusCapability" in value)
  ) {
    throw new M2RuntimeError("PAYMENT_STATUS_REQUEST_INVALID", 400);
  }
  return value as { statusCapability: unknown };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    enforceProductionRouteRateLimit(
      "purchase-status-recovery",
      String(body.statusCapability),
    );
    const outcome = await processProductionPurchaseStatus(
      body.statusCapability,
    );
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAYMENT_STATUS_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
