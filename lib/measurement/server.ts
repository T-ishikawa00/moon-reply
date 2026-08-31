import "server-only";

import { disabledMeasurementAdapter } from "./adapters.ts";
import {
  createMeasurementEvent,
  type GoogleAuthLatencyOutcome,
  type GoogleAuthLatencyPhase,
  type MeasurementAuthMethod,
  type MeasurementPayloadByName,
} from "./events.ts";
import { dispatchGoogleAuthLatency } from "./auth-latency.ts";

export type ServerMeasurementResult = Readonly<{
  status: "disabled" | "not_applicable" | "unavailable";
}>;

export function isServerMeasurementEnabled() {
  return process.env.MEASUREMENT_ENABLED === "true";
}

export function trackServerAuthComplete(
  method: MeasurementAuthMethod,
): ServerMeasurementResult {
  try {
    if (!isServerMeasurementEnabled()) return { status: "disabled" };
    disabledMeasurementAdapter.dispatch(
      createMeasurementEvent("auth_complete", { method }),
    );
    return { status: "disabled" };
  } catch {
    return { status: "unavailable" };
  }
}

export function trackServerGoogleAuthLatency(input: {
  traceId: string;
  phase: GoogleAuthLatencyPhase;
  durationMs: number;
  outcome: GoogleAuthLatencyOutcome;
}): ServerMeasurementResult {
  try {
    if (!isServerMeasurementEnabled()) return { status: "disabled" };
    const payload: MeasurementPayloadByName["auth_latency"] = {
      schemaVersion: 1,
      method: "google",
      traceId: input.traceId,
      phase: input.phase,
      durationMs: input.durationMs,
      outcome: input.outcome,
    };
    return dispatchGoogleAuthLatency(payload);
  } catch {
    return { status: "unavailable" };
  }
}
