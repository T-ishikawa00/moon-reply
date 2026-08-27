import { NextResponse } from "next/server";
import { asM2RuntimeError } from "@/lib/assessment/runtime/errors";
import { prepareProductionConsultation } from "@/lib/assessment/production/service";
import {
  classifyPreparationOutcomeStatus,
  isPreparationResponseCorrelationId,
  PREPARATION_RESPONSE_ATTEMPT_HEADER,
  PREPARATION_RESPONSE_CORRELATION_HEADER,
  readPreparationResponseAttempt,
  type PreparationResponseDiagnostic,
} from "@/lib/assessment/production/preparation-response-recovery";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 65_536;

function json(
  body: unknown,
  status: number,
  correlationId: string,
  attempt: 0 | 1,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
      [PREPARATION_RESPONSE_CORRELATION_HEADER]: correlationId,
      [PREPARATION_RESPONSE_ATTEMPT_HEADER]: String(attempt),
    },
  });
}

function elapsedMilliseconds(startedAt: number) {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function logPreparationResponse(diagnostic: PreparationResponseDiagnostic) {
  try {
    console.info("M2_PREPARATION_RESPONSE_SERVER", diagnostic);
  } catch {
    // Diagnostics must never change the HTTP response.
  }
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  const requestedCorrelationId = request.headers.get(
    PREPARATION_RESPONSE_CORRELATION_HEADER,
  );
  const correlationId = isPreparationResponseCorrelationId(
    requestedCorrelationId,
  )
    ? requestedCorrelationId
    : crypto.randomUUID();
  const attempt = readPreparationResponseAttempt(
    request.headers.get(PREPARATION_RESPONSE_ATTEMPT_HEADER),
  );
  try {
    enforceSameOrigin(request);
    const input = await readStrictJsonRequest(request, maximumBodyBytes);
    const outcome = await prepareProductionConsultation(
      input,
      request.headers.get("idempotency-key"),
    );
    logPreparationResponse({
      correlationId,
      attempt,
      classification: classifyPreparationOutcomeStatus(outcome.status),
      httpStatus: 200,
      safeCode: null,
      elapsedMilliseconds: elapsedMilliseconds(startedAt),
    });
    return json({ data: outcome }, 200, correlationId, attempt);
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "PRODUCTION_PREPARATION_REQUEST_FAILED",
    );
    logPreparationResponse({
      correlationId,
      attempt,
      classification: "HTTP_ERROR_WITH_SAFE_CODE",
      httpStatus: safe.httpStatus,
      safeCode: safe.safeCode,
      elapsedMilliseconds: elapsedMilliseconds(startedAt),
    });
    return json(
      { error: { code: safe.safeCode } },
      safe.httpStatus,
      correlationId,
      attempt,
    );
  }
}
