import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { readTrustedEmailCookie } from "@/lib/payment/production/cookie";
import { startProductionEmailVerification } from "@/lib/payment/production/service";

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
    Object.keys(value).length !== 2 ||
    !("preparationCapability" in value) ||
    !("email" in value)
  ) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_REQUEST_INVALID", 400);
  }
  return value as { preparationCapability: unknown; email: unknown };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 4_096));
    enforceProductionRouteRateLimit(
      "email-verification-start",
      String(body.preparationCapability),
    );
    const outcome = await startProductionEmailVerification({
      ...body,
      trustedSessionToken: readTrustedEmailCookie(
        request.headers.get("cookie"),
      ),
    });
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "EMAIL_VERIFICATION_REQUEST_FAILED",
    );
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
