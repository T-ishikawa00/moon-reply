import { M2RuntimeError } from "../runtime/errors.ts";
import type { ProviderInvocationPermit } from "../runtime/pipeline.ts";
import type { PrepaymentComputeAuthorityRepository } from "./prepayment-compute.ts";

export const GLOBAL_UNPAID_COMPUTE_POLICY_VERSION = "f006-unpaid-invocations-v1" as const;
// F001 bounds one Provider invocation at 180s. Unknown outcomes retain their
// logical slot for another 60s; this is not proof of Provider-side cancellation.
export const GLOBAL_UNPAID_COMPUTE_LEASE_SECONDS = 240;
export const GLOBAL_UNPAID_COMPUTE_RPC_TIMEOUT_MS = 5_000;

export type GlobalUnpaidComputePolicy = Readonly<{
  windowSeconds: number;
  maximumProviderInvocations: number;
  maximumConcurrent: number;
}>;

const configurationError = () => new M2RuntimeError("PREPAYMENT_GLOBAL_COMPUTE_CONFIGURATION_INVALID", 503);
const unavailable = () => new M2RuntimeError("PREPAYMENT_GLOBAL_COMPUTE_UNAVAILABLE", 503);

export function readGlobalUnpaidComputePolicy(
  read: (name: string) => string | undefined = (name) => process.env[name],
): GlobalUnpaidComputePolicy {
  function integer(name: string, minimum: number, maximum: number) {
    const value = read(name);
    if (!value || !/^[1-9][0-9]*$/u.test(value)) throw configurationError();
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw configurationError();
    return number;
  }
  return Object.freeze({
    windowSeconds: integer("PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS", 60, 2_678_400),
    maximumProviderInvocations: integer("PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS", 1, 100_000),
    maximumConcurrent: integer("PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT", 1, 32),
  });
}

export type GlobalUnpaidComputeClaim = Omit<
  Parameters<PrepaymentComputeAuthorityRepository["claimComputeUnit"]>[0], "now"
> & {
  invocationId: string;
  globalPolicy: GlobalUnpaidComputePolicy;
};

export type GlobalUnpaidComputeAuthority = {
  claim(input: GlobalUnpaidComputeClaim): Promise<unknown>;
  release(input: { invocationId: string; slotNumber: number }): Promise<unknown>;
};

// Promise racing also bounds transports that do not promptly honor AbortSignal.
// A timed-out claim may have committed. Callers must not start Provider work or
// retry the reservation as if it were free; its unit and slot remain durable.
export async function boundedGlobalUnpaidComputeOperation<T>(
  operation: (signal: AbortSignal) => PromiseLike<T>,
  timeoutMs = GLOBAL_UNPAID_COMPUTE_RPC_TIMEOUT_MS,
): Promise<T> {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > GLOBAL_UNPAID_COMPUTE_RPC_TIMEOUT_MS) throw unavailable();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(unavailable()); }, timeoutMs);
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export async function requireGlobalUnpaidComputePermit(
  authority: GlobalUnpaidComputeAuthority,
  input: GlobalUnpaidComputeClaim,
): Promise<ProviderInvocationPermit> {
  let value: unknown;
  try { value = await authority.claim(input); } catch { throw unavailable(); }
  if (typeof value !== "object" || value === null || Array.isArray(value) || !("disposition" in value)) throw unavailable();
  if (value.disposition !== "acquired") {
    if (Object.keys(value).length !== 1) throw unavailable();
    if (value.disposition === "customer_exhausted") throw new M2RuntimeError("PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED", 429);
    if (value.disposition === "global_exhausted") throw new M2RuntimeError("PREPAYMENT_GLOBAL_COMPUTE_BUDGET_EXHAUSTED", 429);
    if (value.disposition === "concurrency_exhausted") throw new M2RuntimeError("PREPAYMENT_GLOBAL_COMPUTE_CONCURRENCY_EXHAUSTED", 429);
    throw unavailable();
  }
  if (Object.keys(value).sort().join() !== "disposition,invocation_id,lease_expires_at,slot_number" ||
      !("invocation_id" in value) || value.invocation_id !== input.invocationId ||
      !("slot_number" in value) || typeof value.slot_number !== "number" ||
      !Number.isInteger(value.slot_number) || value.slot_number < 1 || value.slot_number > input.globalPolicy.maximumConcurrent ||
      !("lease_expires_at" in value) || typeof value.lease_expires_at !== "string" ||
      !Number.isFinite(Date.parse(value.lease_expires_at))) throw unavailable();
  const slotNumber = value.slot_number;
  let finished = false;
  return {
    async finish(providerReturned) {
      if (finished) return;
      finished = true;
      if (!providerReturned) return;
      // Successful cleanup frees concurrency only, never a consumed unit. A
      // cleanup outage must not discard a Provider response or its validation.
      try { await authority.release({ invocationId: input.invocationId, slotNumber }); } catch { /* DB expiry recovers the slot. */ }
    },
  };
}
