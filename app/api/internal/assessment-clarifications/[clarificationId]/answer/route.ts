import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { isInternalRuntimeAvailable } from "@/lib/assessment/runtime/environment";
import { answerInternalAssessmentClarification } from "@/lib/assessment/runtime/service";
import { createCustomerAssessmentDeliveryV2 } from "@/lib/assessment/runtime/customer-assessment-delivery-v2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 4_096;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
function validateOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    !origin ||
    origin !== new URL(request.url).origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    throw new M2RuntimeError("M2_ORIGIN_REJECTED", 403);
  }
}

function validateBody(value: unknown) {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !Object.prototype.hasOwnProperty.call(value, "answer")
  ) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  return (value as { answer: unknown }).answer;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ clarificationId: string }> },
) {
  if (!isInternalRuntimeAvailable()) {
    return json({ error: { code: "M2_RUNTIME_UNAVAILABLE" } }, 404);
  }
  try {
    validateOrigin(request);
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      throw new M2RuntimeError("M2_INVALID_CONTENT_TYPE", 415);
    }
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > maximumBodyBytes) {
      throw new M2RuntimeError("M2_REQUEST_TOO_LARGE", 413);
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > maximumBodyBytes) {
      throw new M2RuntimeError("M2_REQUEST_TOO_LARGE", 413);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new M2RuntimeError("M2_INVALID_JSON", 400);
    }
    const answer = validateBody(parsed);
    const { clarificationId } = await context.params;
    const result = await answerInternalAssessmentClarification(
      clarificationId,
      answer,
    );
    if (!result.authoritativeRequestedTopics) {
      throw new M2RuntimeError("M2_PERSISTED_REQUESTED_TOPICS_MISSING");
    }
    const delivery = createCustomerAssessmentDeliveryV2(
      result,
      result.authoritativeRequestedTopics,
    );
    return json({ data: delivery }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(error);
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
