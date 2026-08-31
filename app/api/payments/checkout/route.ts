import { NextResponse, type NextRequest } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { enforceProductionRouteRateLimit } from "@/lib/http/production-route-rate-limit";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "@/lib/http/strict-json-request";
import { readTrustedEmailCookie } from "@/lib/payment/production/cookie";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import {
  clearAuthContinuationCookies,
  readAuthContinuationCookie,
  readAuthSessionCsrfCookie,
} from "@/lib/customer-auth/cookies";
import { equalCustomerAuthSecret } from "@/lib/customer-auth/crypto";
import {
  createAuthenticatedProductionStripeCheckout,
  createAuthenticatedProductionStripeCheckoutFromContinuation,
  createProductionStripeCheckout,
  restartAuthenticatedProductionStripeCheckout,
  restartProductionStripeCheckout,
} from "@/lib/payment/production/service";
import { MEASUREMENT_ATTRIBUTION_COOKIE_NAME } from "@/lib/measurement/attribution";
import { openMeasurementAttributionCookie } from "@/lib/measurement/attribution-cookie";
import { readMeasurementR1Config } from "@/lib/measurement/config";

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
    !(
      (Object.keys(value).length === 1 &&
        ("preparationCapability" in value || "statusCapability" in value)) ||
      (Object.keys(value).length === 2 &&
        "authContinuation" in value &&
        value.authContinuation === true &&
        "csrfToken" in value)
    )
  ) {
    throw new M2RuntimeError("PAYMENT_CHECKOUT_REQUEST_INVALID", 400);
  }
  return value as
    | { preparationCapability: unknown }
    | { statusCapability: unknown }
    | { authContinuation: true; csrfToken: unknown };
}

export async function POST(request: NextRequest) {
  try {
    enforceSameOrigin(request);
    const body = decode(await readStrictJsonRequest(request, 2_048));
    const identity =
      "preparationCapability" in body
        ? body.preparationCapability
        : "statusCapability" in body
          ? body.statusCapability
          : readAuthContinuationCookie(request) ?? "missing";
    enforceProductionRouteRateLimit("stripe-checkout-create", String(identity));
    const measurementConfig = readMeasurementR1Config(process.env);
    const measurementAttribution = measurementConfig
      ? await openMeasurementAttributionCookie(
          request.cookies.get(MEASUREMENT_ATTRIBUTION_COOKIE_NAME)?.value,
          measurementConfig.attributionSecret,
        )
      : null;
    let outcome;
    if (isCustomerAuthFoundationEnabled()) {
      const customerIdentity = await (
        await createCustomerIdentityAuthApplication()
      ).getFreshIdentity();
      if ("authContinuation" in body) {
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
        outcome =
          await createAuthenticatedProductionStripeCheckoutFromContinuation({
            continuationToken,
            customerUserId: customerIdentity.customerUserId,
            measurementAttribution,
          });
      } else {
        outcome =
          "preparationCapability" in body
            ? await createAuthenticatedProductionStripeCheckout({
                preparationCapability: body.preparationCapability,
                customerUserId: customerIdentity.customerUserId,
                measurementAttribution,
              })
            : await restartAuthenticatedProductionStripeCheckout({
                statusCapability: body.statusCapability,
                customerUserId: customerIdentity.customerUserId,
              });
      }
    } else {
      if ("authContinuation" in body) {
        throw new M2RuntimeError("CUSTOMER_AUTH_UNAVAILABLE", 404);
      }
      const trustedSessionToken = readTrustedEmailCookie(
        request.headers.get("cookie"),
      );
      if (!trustedSessionToken) {
        throw new M2RuntimeError("PAYMENT_VERIFIED_EMAIL_REQUIRED", 403);
      }
      outcome =
        "preparationCapability" in body
          ? await createProductionStripeCheckout({
              preparationCapability: body.preparationCapability,
              trustedSessionToken,
              measurementAttribution,
            })
          : await restartProductionStripeCheckout({
              statusCapability: body.statusCapability,
              trustedSessionToken,
            });
    }
    const response = json({ data: outcome }, 200);
    if ("authContinuation" in body) clearAuthContinuationCookies(response);
    return response;
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAYMENT_CHECKOUT_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
