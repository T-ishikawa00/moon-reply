import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { answerProductionClarification } from "@/lib/assessment/production/service";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 16_384;

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

function decodeBody(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !Object.prototype.hasOwnProperty.call(value, "clarificationCapability") ||
    !Object.prototype.hasOwnProperty.call(value, "answer")
  ) {
    throw new M2RuntimeError("PRODUCTION_PREPARATION_INVALID_REQUEST", 400);
  }
  return value as {
    clarificationCapability: unknown;
    answer: unknown;
  };
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    const body = decodeBody(
      await readStrictJsonRequest(request, maximumBodyBytes),
    );
    const outcome = await answerProductionClarification(
      body.clarificationCapability,
      body.answer,
    );
    return json({ data: outcome }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "PRODUCTION_CLARIFICATION_REQUEST_FAILED",
    );
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
