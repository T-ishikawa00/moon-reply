import { NextResponse } from "next/server";
import { asM2RuntimeError, M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { verifyAndRecordProductionStripeWebhook } from "@/lib/payment/production/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maximumWebhookBytes = 1_048_576;

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get("content-length");
    if (
      contentLength !== null &&
      (!/^\d+$/u.test(contentLength) ||
        Number(contentLength) > maximumWebhookBytes)
    ) {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_TOO_LARGE", 413);
    }
    const rawBody = Buffer.from(await request.arrayBuffer());
    if (rawBody.byteLength > maximumWebhookBytes) {
      throw new M2RuntimeError("PAYMENT_WEBHOOK_TOO_LARGE", 413);
    }
    const outcome = await verifyAndRecordProductionStripeWebhook(
      rawBody,
      request.headers.get("stripe-signature"),
    );
    return json({ received: true, disposition: outcome.disposition }, 200);
  } catch (error) {
    const safe = asM2RuntimeError(error, "PAYMENT_WEBHOOK_REQUEST_FAILED");
    return json({ error: { code: safe.safeCode } }, safe.httpStatus);
  }
}
