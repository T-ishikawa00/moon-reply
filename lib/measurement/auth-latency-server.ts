import "server-only";

import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";

import type { NextRequest, NextResponse } from "next/server";

import { CUSTOMER_AUTH_COOKIE_POLICY } from "../supabase/cookie-policy";
import type {
  CustomerAuthGoogleObservation,
  CustomerAuthGoogleObservationPhase,
} from "../customer-auth/types";
import {
  GOOGLE_AUTH_LATENCY_TRACE_HEADER,
  toBoundedDurationMs,
} from "./auth-latency";
import type {
  GoogleAuthLatencyOutcome,
  GoogleAuthLatencyPhase,
} from "./events";
import {
  isServerMeasurementEnabled,
  trackServerGoogleAuthLatency,
} from "./server";

export const GOOGLE_AUTH_LATENCY_COOKIE = "moon_reply_auth_latency_v1";
export const GOOGLE_AUTH_LATENCY_TTL_SECONDS = 600;

const cookiePattern = /^(mral_[A-Za-z0-9_-]{32})\.([0-9]{13})$/u;

export type GoogleAuthLatencyTrace = Readonly<{ traceId: string }>;
export type GoogleAuthLatencyAnchor = Readonly<{
  traceId: string;
  issuedAtMs: number;
}>;

function measurementCookieOptions(maxAge: number) {
  return {
    ...CUSTOMER_AUTH_COOKIE_POLICY,
    path: "/api/auth",
    maxAge,
  };
}

export function beginServerGoogleAuthLatencyTrace(): GoogleAuthLatencyTrace | null {
  try {
    if (!isServerMeasurementEnabled()) return null;
    return { traceId: `mral_${randomBytes(24).toString("base64url")}` };
  } catch {
    return null;
  }
}

export function attachServerGoogleAuthLatencyAnchor(
  response: NextResponse,
  trace: GoogleAuthLatencyTrace | null,
  issuedAtMs: number = Date.now(),
) {
  try {
    if (
      trace === null ||
      !Number.isSafeInteger(issuedAtMs) ||
      issuedAtMs < 0
    ) {
      return null;
    }
    response.headers.set(GOOGLE_AUTH_LATENCY_TRACE_HEADER, trace.traceId);
    response.cookies.set(
      GOOGLE_AUTH_LATENCY_COOKIE,
      `${trace.traceId}.${issuedAtMs}`,
      measurementCookieOptions(GOOGLE_AUTH_LATENCY_TTL_SECONDS),
    );
    return { traceId: trace.traceId, issuedAtMs } satisfies GoogleAuthLatencyAnchor;
  } catch {
    return null;
  }
}

export function clearServerGoogleAuthLatencyAnchor(response: NextResponse) {
  try {
    response.cookies.set(
      GOOGLE_AUTH_LATENCY_COOKIE,
      "",
      measurementCookieOptions(0),
    );
  } catch {
    // Measurement cleanup is never Auth authority.
  }
}

export function readServerGoogleAuthLatencyAnchor(
  request: NextRequest,
  receivedAtMs: number = Date.now(),
): GoogleAuthLatencyAnchor | null {
  try {
    if (!isServerMeasurementEnabled()) return null;
    const raw = request.cookies.get(GOOGLE_AUTH_LATENCY_COOKIE)?.value;
    const match = raw?.match(cookiePattern);
    if (!match || !Number.isSafeInteger(receivedAtMs)) return null;
    const issuedAtMs = Number(match[2]);
    const durationMs = toBoundedDurationMs(issuedAtMs, receivedAtMs);
    if (durationMs === null) return null;
    return { traceId: match[1], issuedAtMs };
  } catch {
    return null;
  }
}

export function recordServerGoogleAuthLatency(
  trace: GoogleAuthLatencyTrace | GoogleAuthLatencyAnchor | null,
  input: {
    phase: GoogleAuthLatencyPhase;
    startedAtMs: number;
    completedAtMs?: number;
    outcome: GoogleAuthLatencyOutcome;
  },
) {
  try {
    if (trace === null) return { status: "disabled" } as const;
    const completedAtMs = input.completedAtMs ?? performance.now();
    const durationMs = toBoundedDurationMs(input.startedAtMs, completedAtMs);
    if (durationMs === null) return { status: "unavailable" } as const;
    return trackServerGoogleAuthLatency({
      traceId: trace.traceId,
      phase: input.phase,
      durationMs,
      outcome: input.outcome,
    });
  } catch {
    return { status: "unavailable" } as const;
  }
}

const observationPhaseMap: Record<
  CustomerAuthGoogleObservationPhase,
  GoogleAuthLatencyPhase
> = {
  start_continuation: "google_start_continuation",
  start_provider: "google_start_provider",
  callback_continuation: "google_callback_continuation",
  callback_exchange: "google_callback_exchange",
  callback_identity: "google_callback_identity",
  callback_binding: "google_callback_binding",
};

export function createServerGoogleAuthObserver(
  trace: GoogleAuthLatencyTrace | GoogleAuthLatencyAnchor | null,
) {
  if (trace === null) return undefined;
  return (observation: CustomerAuthGoogleObservation) => {
    try {
      trackServerGoogleAuthLatency({
        traceId: trace.traceId,
        phase: observationPhaseMap[observation.phase],
        durationMs: observation.durationMs,
        outcome: observation.outcome,
      });
    } catch {
      // Observation must never alter Auth.
    }
  };
}
