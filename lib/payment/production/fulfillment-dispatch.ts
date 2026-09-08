import { asM2RuntimeError, M2RuntimeError } from "../../assessment/runtime/errors.ts";
import type {
  PaymentDeliveryRepository,
  ProductionFulfillmentDispatcherV1,
} from "./types.ts";

function addSeconds(instant: string, seconds: number) {
  const milliseconds = Date.parse(instant);
  if (!Number.isFinite(milliseconds) || seconds < 1) {
    throw new M2RuntimeError("PAYMENT_POLICY_INVALID", 503);
  }
  return new Date(milliseconds + seconds * 1_000).toISOString();
}

export async function requestProductionFulfillmentDispatch(input: {
  repository: Pick<
    PaymentDeliveryRepository,
    | "claimFulfillmentDispatch"
    | "completeFulfillmentDispatch"
    | "failFulfillmentDispatch"
  >;
  dispatcher: ProductionFulfillmentDispatcherV1;
  jobId: string;
  now: () => string;
  uuid: () => string;
  requireRouterAcceptance?: boolean;
}): Promise<"accepted" | "skipped"> {
  const now = input.now();
  const ownerId = input.uuid();
  const dispatchMarker = `rc2-dispatch:${input.jobId}`;
  const claim = await input.repository.claimFulfillmentDispatch({
    jobId: input.jobId,
    dispatchMarker,
    ownerId,
    leaseExpiresAt: addSeconds(now, 30),
    now,
  });
  if (!claim || claim.disposition === "retry_later") {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_DISPATCH_RETRYABLE", 503);
  }
  if (claim.disposition !== "acquired") {
    if (
      input.requireRouterAcceptance &&
      claim.disposition === "in_progress"
    ) {
      throw new M2RuntimeError(
        "PAYMENT_FULFILLMENT_DISPATCH_IN_PROGRESS",
        503,
      );
    }
    return "skipped";
  }

  let routerAccepted = false;
  try {
    await input.dispatcher.enqueue(input.jobId, claim.recoveryCycle ?? 0);
    routerAccepted = true;
    await input.repository.completeFulfillmentDispatch({
      jobId: input.jobId,
      dispatchMarker,
      ownerId,
      now: input.now(),
    });
    return "accepted";
  } catch (error) {
    const safe = asM2RuntimeError(
      error,
      "PAYMENT_FULFILLMENT_DISPATCH_FAILED",
    );
    if (!routerAccepted) {
      try {
        const failedAt = input.now();
        await input.repository.failFulfillmentDispatch({
          jobId: input.jobId,
          dispatchMarker,
          ownerId,
          errorCode: safe.safeCode,
          retryAfter: addSeconds(failedAt, 30),
          now: failedAt,
        });
      } catch {
        // A stale dispatch owner cannot overwrite the current fencing token.
      }
    }
    throw safe;
  }
}
