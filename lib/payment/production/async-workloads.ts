import "server-only";

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

function readAsyncWorkloadsApiKey() {
  const apiKey = process.env.AWL_API_KEY_P100;
  if (!apiKey) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  return apiKey;
}

function readAsyncWorkloadsBaseUrl() {
  const configured = process.env.DEPLOY_URL ?? process.env.URL;
  if (!configured) {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      throw new Error("invalid workload origin");
    }
    return parsed.origin;
  } catch {
    throw new M2RuntimeError("PAYMENT_CONFIGURATION_INVALID", 503);
  }
}

/**
 * Creates the production client with the explicitly selected server-only key.
 * The key is never included in the returned adapter or an error message.
 */
export function createProductionFulfillmentEventDispatcher(): ProductionFulfillmentEventDispatcher {
  const client = new AsyncWorkloadsClient<ProductionFulfillmentJobEvent>({
    baseUrl: readAsyncWorkloadsBaseUrl(),
    apiKey: readAsyncWorkloadsApiKey(),
  });
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
  } = {},
): Promise<EnqueueProductionFulfillmentOutcome> {
  const payload = { jobId: parseProductionFulfillmentJobId(jobId) };
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
