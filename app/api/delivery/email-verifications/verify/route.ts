import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { serializeTrustedEmailCookie } from "@/lib/payment/production/cookie";
import { completeProductionEmailVerification } from "@/lib/payment/production/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number, setCookie?: string) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      ...(setCookie ? { "Set-Cookie": setCookie } : {}),
    },
  });
}

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !("challengeCapability" in value) ||
    !("verificationCode" in value)
  ) {
    throw new M2RuntimeError("EMAIL_VERIFICATION_REQUEST_INVALID", 400);
  }
  return value as {
    challengeCapability: unknown;
    verificationCode: unknown;
  };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    enforceProductionRouteRateLimit(
      "email-verification-complete",
      String(body.challengeCapability),
    );
    const outcome = await completeProductionEmailVerification(body);
    return json(
      {
        data: {
          status: outcome.status,
          maskedEmail: outcome.maskedEmail,
        },
      },
      200,
      serializeTrustedEmailCookie({
        token: outcome.trustedSessionToken,
        expiresAt: outcome.trustedSessionExpiresAt,
      }),
    );
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "EMAIL_VERIFICATION_REQUEST_FAILED",
    );
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
