import { asM2RuntimeError } from "../../../../lib/assessment/runtime/errors.ts";
import {
  enforceSameOrigin,
  readStrictJsonRequest,
} from "../../../../lib/http/strict-json-request.ts";
import { evaluateJpy980ProductScopeV1 } from "../../../../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts";
import { evaluatePrepaymentSafetyV1 } from "../../../../lib/purchase/prepayment-safety-gate-v1.ts";
import {
  decodePrepaymentSafetyInputV1,
  PrepaymentSafetyValidationError,
} from "../../../../lib/purchase/prepayment-safety-types-v1.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumBodyBytes = 49_152;

function json(body: unknown, status: number) {
  return Response.json(body, {
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
    const value = await readStrictJsonRequest(request, maximumBodyBytes);
    const input = decodePrepaymentSafetyInputV1(value);
    return json(
      {
        data: {
          ...evaluatePrepaymentSafetyV1(input),
          productScope: evaluateJpy980ProductScopeV1(input),
        },
      },
      200,
    );
  } catch (error) {
    if (error instanceof PrepaymentSafetyValidationError) {
      return json({ error: { code: error.safeCode } }, 400);
    }
    const safe = asM2RuntimeError(
      error,
      "PREPAYMENT_PRODUCTION_CLASSIFICATION_FAILED",
    );
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
