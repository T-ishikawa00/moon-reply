import { NextRequest } from "next/server";

import {
  HOSTED_CONTINUATION_SCHEMA_VERSION,
  hostedStatusFromOutcomeV1,
  type HostedContinuationActionV1,
} from "@/lib/assessment/production/hosted-continuation-contract-r1";
import {
  continueAuthenticatedProductionPreparation,
  readAuthenticatedProductionPreparationStatus,
  replayAuthenticatedProductionPreparation,
} from "@/lib/assessment/production/service";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  readAuthContinuationCookie,
  readAuthSessionCsrfCookie,
} from "@/lib/customer-auth/cookies";
import { equalCustomerAuthSecret } from "@/lib/customer-auth/crypto";
import { customerAuthJson } from "@/lib/customer-auth/route-response";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusResponse(
  status:
    | "processing"
    | "awaiting_clarification"
    | "purchase_ready"
    | "not_full_product_candidate"
    | "safety_blocked"
    | "failed"
    | "authentication_required",
) {
  return customerAuthJson(
    {
      data: {
        schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
        kind: "status",
        status,
      },
    },
    200,
  );
}

function decode(value: unknown): {
  action: HostedContinuationActionV1;
  csrfToken: unknown;
} {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    Object.keys(value).length !== 2 ||
    !("action" in value) ||
    !("csrfToken" in value) ||
    !["status", "execute", "resolve"].includes(String(value.action))
  ) {
    throw new M2RuntimeError("PRODUCTION_PREPARATION_REQUEST_INVALID", 400);
  }
  return {
    action: value.action as HostedContinuationActionV1,
    csrfToken: value.csrfToken,
  };
}

export async function POST(request: NextRequest) {
  let action: HostedContinuationActionV1 | null = null;
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 1_024));
    action = body.action;
    const continuationToken = readAuthContinuationCookie(request);
    if (
      !continuationToken ||
      !equalCustomerAuthSecret(
        readAuthSessionCsrfCookie(request),
        body.csrfToken,
      )
    ) {
      throw new M2RuntimeError("CUSTOMER_AUTH_CSRF_REJECTED", 403);
    }
    enforceProductionRouteRateLimit(
      `authenticated-preparation:${action}`,
      continuationToken,
    );

    if (action === "status") {
      const status = await readAuthenticatedProductionPreparationStatus({
        continuationToken,
      });
      return statusResponse(status ?? "authentication_required");
    }
    if (action === "execute") {
      const outcome = await continueAuthenticatedProductionPreparation({
        continuationToken,
      });
      return statusResponse(
        outcome ? hostedStatusFromOutcomeV1(outcome) : "authentication_required",
      );
    }
    const outcome = await replayAuthenticatedProductionPreparation({
      continuationToken,
    });
    if (!outcome) return statusResponse("authentication_required");
    return customerAuthJson(
      {
        data: {
          schemaVersion: HOSTED_CONTINUATION_SCHEMA_VERSION,
          kind: "outcome",
          outcome,
        },
      },
      200,
    );
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "PRODUCTION_PREPARATION_REQUEST_FAILED",
    );
    if (safe.safeCode === "PRODUCTION_PREPARATION_IN_PROGRESS") {
      return statusResponse("processing");
    }
    if (safe.safeCode === "PRODUCTION_PREPARATION_RECOVERY_REQUIRED") {
      return statusResponse("failed");
    }
    if (
      safe.safeCode === "CUSTOMER_AUTH_REQUIRED" ||
      safe.safeCode === "CUSTOMER_AUTH_CONTINUATION_INVALID"
    ) {
      return statusResponse("authentication_required");
    }
    return customerAuthJson(
      { error: { code: safe.safeCode, action } },
      safe.httpStatus,
    );
  }
}
