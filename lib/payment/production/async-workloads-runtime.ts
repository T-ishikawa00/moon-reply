import { AsyncWorkloadsClient } from "@netlify/async-workloads";
import { M2RuntimeError } from "../../assessment/runtime/errors.ts";
import {
  parseProductionFulfillmentJobId,
  PRODUCTION_FULFILLMENT_EVENT_NAME,
  type ProductionFulfillmentJobEvent,
  type ProductionFulfillmentJobEventData,
} from "./async-workloads-contract.ts";

export type ProductionFulfillmentEventSendResult = Readonly<{
  eventId: string;
  sendStatus: "succeeded" | "failed";
}>;

export type ProductionFulfillmentEventDispatcher = {
  send(
    eventName: typeof PRODUCTION_FULFILLMENT_EVENT_NAME,
    options: { data: ProductionFulfillmentJobEventData },
  ): Promise<ProductionFulfillmentEventSendResult>;
};

export type ProductionFulfillmentEventDispatcherFactory = () =>
  ProductionFulfillmentEventDispatcher;

/**
 * Uses Netlify's same-site contract. The extension selects the highest-priority
 * site API key and current site origin without exposing either to application
 * code, so key rotation never requires a source change.
 */
export function createProductionFulfillmentEventDispatcher(): ProductionFulfillmentEventDispatcher {
  const client = new AsyncWorkloadsClient<ProductionFulfillmentJobEvent>();
  return {
    send: (eventName, options) => client.send(eventName, options),
  };
}

export type EnqueueProductionFulfillmentOutcome = Readonly<{
  status: "enqueued";
  eventId: string;
}>;

/**
 * Enqueues only an already-valid job ID and confirms router acceptance.
 * Database claim/lease authority remains in processProductionFulfillmentJobById.
 */
export async function enqueueProductionFulfillmentJob(
  jobId: unknown,
  dependencies: {
    dispatcher?: ProductionFulfillmentEventDispatcher;
    recoveryCycle?: number;
  } = {},
): Promise<EnqueueProductionFulfillmentOutcome> {
  const payload = { jobId: parseProductionFulfillmentJobId(jobId),
    ...(dependencies.recoveryCycle === undefined ? {} : { recoveryCycle: dependencies.recoveryCycle }) };
  const dispatcher =
    dependencies.dispatcher ?? createProductionFulfillmentEventDispatcher();
  const result = await dispatcher.send(PRODUCTION_FULFILLMENT_EVENT_NAME, {
    data: payload,
  });
  if (result.sendStatus !== "succeeded" || !result.eventId) {
    throw new M2RuntimeError("PAYMENT_FULFILLMENT_UNAVAILABLE", 503);
  }
  return { status: "enqueued", eventId: result.eventId };
}
