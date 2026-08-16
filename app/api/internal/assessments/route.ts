import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { isInternalRuntimeAvailable } from "@/lib/assessment/runtime/environment";
import { executeInternalAssessment } from "@/lib/assessment/runtime/service";
import { createCustomerAssessmentDeliveryV2 } from "@/lib/assessment/runtime/customer-assessment-delivery-v2";
import { validateJpy980ProductScopeV1 } from "@/lib/assessment/runtime/jpy980-product-scope-validation-v1";
import {
  RELATIONSHIP_VALUES,
  REQUESTED_TOPIC_VALUES,
  type AssessmentInput,
  type RelationshipValue,
  type RequestedTopic,
} from "@/lib/assessment/runtime/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 16_384;
const allowedFields = new Set([
  "currentSituation",
  "optionalMessage",
  "relationship",
  "requestedTopics",
  "privacyAcknowledged",
]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function unavailable() {
  return json({ error: { code: "M2_RUNTIME_UNAVAILABLE" } }, 404);
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

function requiredString(
  value: unknown,
  maximumLength: number,
  allowEmpty = false,
) {
  if (typeof value !== "string") {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  const normalized = value.trim();
  if ((!allowEmpty && normalized.length === 0) || normalized.length > maximumLength) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  return normalized;
}

function validateBody(value: unknown): AssessmentInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedFields.has(key))) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }

  const currentSituation = requiredString(record.currentSituation, 5_000);
  const optionalMessageText =
    record.optionalMessage === null || record.optionalMessage === undefined
      ? null
      : requiredString(record.optionalMessage, 2_000, true);
  const optionalMessage = optionalMessageText || null;

  if (
    typeof record.relationship !== "string" ||
    !RELATIONSHIP_VALUES.includes(record.relationship as RelationshipValue)
  ) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  if (
    !Array.isArray(record.requestedTopics) ||
    record.requestedTopics.length < 1 ||
    record.requestedTopics.length > 3 ||
    new Set(record.requestedTopics).size !== record.requestedTopics.length ||
    record.requestedTopics.some(
      (topic) =>
        typeof topic !== "string" ||
        !REQUESTED_TOPIC_VALUES.includes(topic as RequestedTopic),
    )
  ) {
    throw new M2RuntimeError("M2_INVALID_REQUEST", 400);
  }
  if (record.privacyAcknowledged !== true) {
    throw new M2RuntimeError("M2_PRIVACY_ACKNOWLEDGEMENT_REQUIRED", 400);
  }

  return {
    currentSituation,
    optionalMessage,
    relationship: record.relationship as RelationshipValue,
    requestedTopics: record.requestedTopics as RequestedTopic[],
    privacyAcknowledged: true,
  };
}

export async function POST(request: Request) {
  if (!isInternalRuntimeAvailable()) {
    return unavailable();
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
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || !uuidPattern.test(idempotencyKey)) {
      throw new M2RuntimeError("M2_IDEMPOTENCY_KEY_INVALID", 400);
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
    const input = validateBody(parsed);
    validateJpy980ProductScopeV1(input);
    const result = await executeInternalAssessment(input, idempotencyKey);
    const delivery = createCustomerAssessmentDeliveryV2(
      result,
      input.requestedTopics,
    );
    return json({ data: delivery }, 200);
  } catch (error) {
    const safeError = asM2RuntimeError(error);
    return json(
      { error: { code: safeError.safeCode } },
      safeError.httpStatus,
    );
  }
}
