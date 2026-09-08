import type { CustomAsyncWorkloadEvent } from "@netlify/async-workloads";

/** The event name is part of the durable wire contract; change it for breaking changes. */
export const PRODUCTION_FULFILLMENT_EVENT_NAME =
  "production.fulfillment.job.v1" as const;

export type ProductionFulfillmentJobEventData = Readonly<{
  jobId: string;
  recoveryCycle?: number;
}>;

export interface ProductionFulfillmentJobEvent
  extends CustomAsyncWorkloadEvent {
  eventName: typeof PRODUCTION_FULFILLMENT_EVENT_NAME;
  eventData: ProductionFulfillmentJobEventData;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Claim-check payload validation. The event carries only the durable job ID;
 * all authoritative state remains in the database and is read by the worker.
 */
export function parseProductionFulfillmentJobEventData(
  value: unknown,
): ProductionFulfillmentJobEventData {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "jobId" && key !== "recoveryCycle")) {
    throw new Error("PRODUCTION_FULFILLMENT_EVENT_INVALID");
  }
  const jobId = value.jobId;
  if (typeof jobId !== "string" || !UUID_PATTERN.test(jobId)) {
    throw new Error("PRODUCTION_FULFILLMENT_JOB_ID_INVALID");
  }
  if (value.recoveryCycle !== undefined &&
      (typeof value.recoveryCycle !== "number" || !Number.isSafeInteger(value.recoveryCycle) || value.recoveryCycle < 0)) {
    throw new Error("PRODUCTION_FULFILLMENT_EVENT_INVALID");
  }
  return { jobId, ...(value.recoveryCycle === undefined ? {} : { recoveryCycle: value.recoveryCycle }) };
}

export function parseProductionFulfillmentJobId(value: unknown): string {
  return parseProductionFulfillmentJobEventData({ jobId: value }).jobId;
}
