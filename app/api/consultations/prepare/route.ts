import { NextResponse } from "next/server";
import { asM2RuntimeError } from "@/lib/assessment/runtime/errors";
import { prepareProductionConsultation } from "@/lib/assessment/production/service";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 65_536;

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

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const input = await readStrictJsonRequest(request, maximumBodyBytes);
    const outcome = await prepareProductionConsultation(
      input,
      request.headers.get("idempotency-key"),
    );
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "PRODUCTION_PREPARATION_REQUEST_FAILED",
    );
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
