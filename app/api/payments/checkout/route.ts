import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { readTrustedEmailCookie } from "@/lib/payment/production/cookie";
import {
  createProductionStripeCheckout,
  restartProductionStripeCheckout,
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
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !(
      "preparationCapability" in value ||
      "statusCapability" in value
    )
  ) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_REQUEST_INVALID", 400);
  }
  return value as
    | { preparationCapability: unknown }
    | { statusCapability: unknown };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    const trustedSessionToken = readTrustedEmailCookie(
      request.headers.get("cookie"),
    );
    if (!trustedSessionToken) {
      throw new M2RuntimeError("PAYMENT_VERIFIED_EMAIL_REQUIRED", 403);
    }
    const identity =
      "preparationCapability" in body
        ? body.preparationCapability
        : body.statusCapability;
    enforceProductionRouteRateLimit("stripe-checkout-create", String(identity));
    const outcome =
      "preparationCapability" in body
        ? await createProductionStripeCheckout({
            preparationCapability: body.preparationCapability,
            trustedSessionToken,
          })
        : await restartProductionStripeCheckout({
            statusCapability: body.statusCapability,
            trustedSessionToken,
          });
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAYMENT_CHECKOUT_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
