import { AsyncLocalStorage } from "node:async_hooks";
import { performance } from "node:perf_hooks";
import { M2RuntimeError } from "./errors.ts";

// The background worker has 15 minutes. Stop Provider work after 12 minutes
// from worker entry, reserving 3 minutes for validation/persistence/recovery.
// These are defensive execution ceilings, not measured latency or a SLA.
export const PROVIDER_STAGE_TIMEOUT_MS = 180_000;
export const FULFILLMENT_PROVIDER_BUDGET_MS = 12 * 60_000;
const executionDeadline = new AsyncLocalStorage<number>();

export function withProviderDeadline<T>(operation: () => Promise<T>, budgetMs = FULFILLMENT_PROVIDER_BUDGET_MS) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > FULFILLMENT_PROVIDER_BUDGET_MS) {
    throw new M2RuntimeError("PRODUCTION_RUNTIME_CONFIGURATION_INVALID", 503);
  }
  const deadline = Math.min(executionDeadline.getStore() ?? Infinity, performance.now() + budgetMs);
  return executionDeadline.run(deadline, operation);
}

export async function boundedProviderCall<T>(operation: (signal: AbortSignal) => PromiseLike<T>) {
  const remaining = (executionDeadline.getStore() ?? Infinity) - performance.now();
  if (remaining <= 0) throw new M2RuntimeError("M2_PROVIDER_DEADLINE_EXCEEDED", 503);
  const deadlineLimited = remaining <= PROVIDER_STAGE_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new M2RuntimeError(deadlineLimited ? "M2_PROVIDER_DEADLINE_EXCEEDED" : "M2_STAGE_PROVIDER_TIMEOUT", 503));
      controller.abort();
    }, Math.min(remaining, PROVIDER_STAGE_TIMEOUT_MS));
  });
  try {
    // The race also bounds body collection and ignores late results from a
    // transport that ignores abort. Physical Provider completion is UNKNOWN.
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), expiry]);
  } finally {
    clearTimeout(timer);
  }
}
