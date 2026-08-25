import type { MeasurementAdapter } from "./adapters.ts";
import { disabledMeasurementAdapter } from "./adapters.ts";
import {
  createMeasurementEvent,
  GOOGLE_AUTH_LATENCY_MAX_DURATION_MS,
  GOOGLE_AUTH_LATENCY_SCHEMA_VERSION,
  type GoogleAuthLatencyOutcome,
  type GoogleAuthLatencyPhase,
  type MeasurementPayloadByName,
} from "./events.ts";

export type GoogleAuthLatencyPayload =
  MeasurementPayloadByName["auth_latency"];

export type GoogleAuthLatencyResult = Readonly<{
  status: "disabled" | "unavailable";
}>;

export type GoogleAuthClientTimingAnchor = Readonly<{
  startedAtMs: number;
}>;

export const GOOGLE_AUTH_LATENCY_TRACE_HEADER =
  "x-moon-reply-auth-latency-trace";

const traceIdPattern = /^mral_[A-Za-z0-9_-]{32}$/u;

export function readGoogleAuthLatencyTraceHeader(response: Response) {
  try {
    const value = response.headers.get(GOOGLE_AUTH_LATENCY_TRACE_HEADER);
    return value !== null && traceIdPattern.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function toBoundedDurationMs(
  startedAtMs: number,
  completedAtMs: number,
) {
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(completedAtMs)) {
    return null;
  }
  const elapsed = completedAtMs - startedAtMs;
  if (elapsed < 0 || elapsed > GOOGLE_AUTH_LATENCY_MAX_DURATION_MS) {
    return null;
  }
  const durationMs = Math.round(elapsed);
  return Number.isSafeInteger(durationMs) ? durationMs : null;
}

export function createGoogleAuthLatencyPayload(input: {
  traceId: string;
  phase: GoogleAuthLatencyPhase;
  durationMs: number;
  outcome: GoogleAuthLatencyOutcome;
}): GoogleAuthLatencyPayload {
  return {
    schemaVersion: GOOGLE_AUTH_LATENCY_SCHEMA_VERSION,
    method: "google",
    traceId: input.traceId,
    phase: input.phase,
    durationMs: input.durationMs,
    outcome: input.outcome,
  };
}

export function dispatchGoogleAuthLatency(
  payload: GoogleAuthLatencyPayload,
  adapter: MeasurementAdapter = disabledMeasurementAdapter,
): GoogleAuthLatencyResult {
  try {
    adapter.dispatch(createMeasurementEvent("auth_latency", payload));
    return { status: "disabled" };
  } catch {
    return { status: "unavailable" };
  }
}

export function beginGoogleAuthClientTiming(
  now: () => number = () => performance.now(),
): GoogleAuthClientTimingAnchor | null {
  try {
    const startedAtMs = now();
    return Number.isFinite(startedAtMs) ? { startedAtMs } : null;
  } catch {
    return null;
  }
}

export function completeGoogleAuthClientTiming(
  anchor: GoogleAuthClientTimingAnchor | null,
  input: {
    traceId: string | null;
    outcome: GoogleAuthLatencyOutcome;
    now?: () => number;
    adapter?: MeasurementAdapter;
  },
): GoogleAuthLatencyResult {
  try {
    if (anchor === null || input.traceId === null) {
      return { status: "unavailable" };
    }
    const completedAtMs = (input.now ?? (() => performance.now()))();
    const durationMs = toBoundedDurationMs(anchor.startedAtMs, completedAtMs);
    if (durationMs === null) return { status: "unavailable" };
    return dispatchGoogleAuthLatency(
      createGoogleAuthLatencyPayload({
        traceId: input.traceId,
        phase: "client_start",
        durationMs,
        outcome: input.outcome,
      }),
      input.adapter,
    );
  } catch {
    return { status: "unavailable" };
  }
}
