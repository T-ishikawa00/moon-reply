import { NextResponse } from "next/server";

import {
  asM2RuntimeError,
  M2RuntimeError,
} from "@/lib/assessment/runtime/errors";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { requireCustomerSupportCasesEnabled } from "@/lib/support/environment";
import { createAuthenticatedCustomerSupportCase } from "@/lib/support/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function decode(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 4 ||
    !("category" in value) ||
    !("purchaseIntentId" in value) ||
    !("customerNote" in value) ||
    !("idempotencyKey" in value)
  ) {
    throw new M2RuntimeError("CUSTOMER_SUPPORT_REQUEST_INVALID", 400);
  }
  return value as {
    category: unknown;
    purchaseIntentId: unknown;
    customerNote: unknown;
    idempotencyKey: unknown;
  };
}

export async function POST(request: Request) {
  try {
    requireCustomerSupportCasesEnabled();
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 8_192));
    const outcome = await createAuthenticatedCustomerSupportCase(body);
    return json(
      {
        data: {
          caseReference: outcome.caseId,
          category: outcome.category,
          status: outcome.status,
          createdAt: outcome.createdAt,
        },
      },
      200,
    );
  } catch (error) {
    const safe = asM2RuntimeError(error, "CUSTOMER_SUPPORT_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
