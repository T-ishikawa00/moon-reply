import type {
  CustomerAuthGoogleObservationPhase,
  CustomerAuthGoogleObserver,
} from "./types";

const maximumObservationDurationMs = 600_000;

function safeNow(now: () => number) {
  try {
    const value = now();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function notify(
  observe: CustomerAuthGoogleObserver | undefined,
  phase: CustomerAuthGoogleObservationPhase,
  startedAtMs: number | null,
  completedAtMs: number | null,
  outcome: "success" | "failed",
) {
  try {
    if (observe === undefined || startedAtMs === null || completedAtMs === null) {
      return;
    }
    const elapsed = completedAtMs - startedAtMs;
    if (elapsed < 0 || elapsed > maximumObservationDurationMs) return;
    const durationMs = Math.round(elapsed);
    if (!Number.isSafeInteger(durationMs)) return;
    observe({ phase, durationMs, outcome });
  } catch {
    // Observation has no Auth authority.
  }
}

export async function observeCustomerAuthGoogleOperation<Result>(input: {
  phase: CustomerAuthGoogleObservationPhase;
  operation: () => Promise<Result>;
  observe?: CustomerAuthGoogleObserver;
  now?: () => number;
}): Promise<Result> {
  if (input.observe === undefined) return input.operation();
  const now = input.now ?? (() => performance.now());
  const startedAtMs = safeNow(now);
  try {
    const result = await input.operation();
    notify(input.observe, input.phase, startedAtMs, safeNow(now), "success");
    return result;
  } catch (error) {
    notify(input.observe, input.phase, startedAtMs, safeNow(now), "failed");
    throw error;
  }
}
