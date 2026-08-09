import { NextResponse } from "next/server";
import { isInternalRuntimeAvailable } from "@/lib/assessment/runtime/environment";
import { evaluatePrepaymentSafetyV1 } from "@/lib/purchase/prepayment-safety-gate-v1";
import { PrepaymentSafetyValidationError } from "@/lib/purchase/prepayment-safety-types-v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAXIMUM_BODY_BYTES = 49_152;
const JSON_CONTENT_TYPE = /^application\/json(?:\s*;\s*charset=utf-8)?$/iu;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function safeError(code: string, status: number) {
  return json({ error: { code } }, status);
}

function validateSameOrigin(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    origin !== expectedOrigin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    throw new LocalRequestError("PREPAYMENT_ORIGIN_REJECTED", 403);
  }
}

class LocalRequestError extends Error {
  readonly safeCode: string;
  readonly status: number;

  constructor(safeCode: string, status: number) {
    super(safeCode);
    this.name = "LocalRequestError";
    this.safeCode = safeCode;
    this.status = status;
  }
}

export async function POST(request: Request) {
  if (!isInternalRuntimeAvailable()) {
    return safeError("PREPAYMENT_INTERNAL_API_UNAVAILABLE", 404);
  }

  try {
    validateSameOrigin(request);

    const contentType = request.headers.get("content-type") ?? "";
    if (!JSON_CONTENT_TYPE.test(contentType.trim())) {
      throw new LocalRequestError("PREPAYMENT_INVALID_CONTENT_TYPE", 415);
    }

    const contentLength = request.headers.get("content-length");
    if (contentLength !== null) {
      if (!/^\d+$/u.test(contentLength)) {
        throw new LocalRequestError("PREPAYMENT_INVALID_REQUEST", 400);
      }
      if (Number(contentLength) > MAXIMUM_BODY_BYTES) {
        throw new LocalRequestError("PREPAYMENT_REQUEST_TOO_LARGE", 413);
      }
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAXIMUM_BODY_BYTES) {
      throw new LocalRequestError("PREPAYMENT_REQUEST_TOO_LARGE", 413);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new LocalRequestError("PREPAYMENT_INVALID_JSON", 400);
    }

    return json({ data: evaluatePrepaymentSafetyV1(parsed) }, 200);
  } catch (error) {
    if (error instanceof PrepaymentSafetyValidationError) {
      return safeError(error.safeCode, 400);
    }
    if (error instanceof LocalRequestError) {
      return safeError(error.safeCode, error.status);
    }
    return safeError("PREPAYMENT_LOCAL_CLASSIFICATION_FAILED", 500);
  }
}
