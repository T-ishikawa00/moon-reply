export const CUSTOMER_AUTH_LATENCY_SCHEMA_VERSION =
  "customer-auth-google-redirect-latency-v1" as const;

export type CustomerAuthServerLatencyPhase =
  | "continuation_create"
  | "continuation_validation"
  | "oauth_url_generation";

export type CustomerAuthServerLatencyObservation = Readonly<{
  phase: CustomerAuthServerLatencyPhase;
  durationMs: number;
  outcome: "success" | "failure";
}>;

export type CustomerAuthServerLatencyObserver = (
  observation: CustomerAuthServerLatencyObservation,
) => void;

export type GoogleAuthClientLatencyRecord = Readonly<{
  schema_version: typeof CUSTOMER_AUTH_LATENCY_SCHEMA_VERSION;
  scope: "client";
  outcome: "redirect_ready" | "failed";
  failed_at:
    | "before_continuation"
    | "continuation_request"
    | "google_start_request"
    | "authorization_url"
    | "location_assign"
    | null;
  t0_to_t1_start_ms: number | null;
  t1_continuation_round_trip_ms: number | null;
  t1_continuation_create_server_ms: number | null;
  t2_google_start_round_trip_ms: number | null;
  t2_continuation_validation_server_ms: number | null;
  t2_oauth_url_generation_server_ms: number | null;
  t3_to_t4_handoff_ms: number | null;
  t0_to_t4_total_ms: number;
}>;

type ClientLatencyPhase = NonNullable<GoogleAuthClientLatencyRecord["failed_at"]>;
type ClientLatencyReporter = (record: GoogleAuthClientLatencyRecord) => void;

const serverTimingMetricNames = {
  auth_continuation_create: "continuation_create",
  auth_continuation_validation: "continuation_validation",
  auth_oauth_url_generation: "oauth_url_generation",
} as const;

function duration(start: number | null, end: number | null) {
  if (start === null || end === null) return null;
  return Math.max(0, Math.round(end - start));
}

function safeServerDuration(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 300_000) return null;
  return Math.round(parsed);
}

export function readCustomerAuthServerTiming(value: string | null) {
  const result: Partial<Record<CustomerAuthServerLatencyPhase, number>> = {};
  for (const entry of value?.split(",") ?? []) {
    const match = entry
      .trim()
      .match(/^([a-z_]+);dur=([0-9]+(?:[.][0-9]+)?)$/u);
    if (!match) continue;
    const phase =
      serverTimingMetricNames[
        match[1] as keyof typeof serverTimingMetricNames
      ];
    const parsed = safeServerDuration(match[2]);
    if (phase && parsed !== null) result[phase] = parsed;
  }
  return result;
}

function defaultClientReporter(record: GoogleAuthClientLatencyRecord) {
  try {
    console.info("CUSTOMER_AUTH_GOOGLE_REDIRECT_LATENCY", record);
  } catch {
    // Diagnostic measurement must never affect the authentication flow.
  }
}

export function startGoogleAuthRedirectLatencyMeasurement(options?: {
  now?: () => number;
  report?: ClientLatencyReporter;
}) {
  const now = options?.now ?? (() => performance.now());
  const report = options?.report ?? defaultClientReporter;
  const t0 = now();
  let phase: ClientLatencyPhase = "before_continuation";
  let t1Start: number | null = null;
  let t1End: number | null = null;
  let t2Start: number | null = null;
  let t2End: number | null = null;
  let t3: number | null = null;
  let continuationCreateServerMs: number | null = null;
  let continuationValidationServerMs: number | null = null;
  let oauthUrlGenerationServerMs: number | null = null;
  let reported = false;

  function emit(outcome: GoogleAuthClientLatencyRecord["outcome"]) {
    if (reported) return;
    reported = true;
    const t4 = now();
    const record: GoogleAuthClientLatencyRecord = Object.freeze({
      schema_version: CUSTOMER_AUTH_LATENCY_SCHEMA_VERSION,
      scope: "client",
      outcome,
      failed_at: outcome === "failed" ? phase : null,
      t0_to_t1_start_ms: duration(t0, t1Start),
      t1_continuation_round_trip_ms: duration(t1Start, t1End),
      t1_continuation_create_server_ms: continuationCreateServerMs,
      t2_google_start_round_trip_ms: duration(t2Start, t2End),
      t2_continuation_validation_server_ms: continuationValidationServerMs,
      t2_oauth_url_generation_server_ms: oauthUrlGenerationServerMs,
      t3_to_t4_handoff_ms: duration(t3, t4),
      t0_to_t4_total_ms: duration(t0, t4) ?? 0,
    });
    try {
      report(record);
    } catch {
      // A custom diagnostic reporter is also fail-isolated.
    }
  }

  return {
    markContinuationStart() {
      phase = "continuation_request";
      t1Start = now();
    },
    markContinuationEnd(serverTiming: string | null) {
      t1End = now();
      continuationCreateServerMs =
        readCustomerAuthServerTiming(serverTiming).continuation_create ?? null;
    },
    markGoogleStart() {
      phase = "google_start_request";
      t2Start = now();
    },
    markGoogleEnd(serverTiming: string | null) {
      t2End = now();
      const parsed = readCustomerAuthServerTiming(serverTiming);
      continuationValidationServerMs =
        parsed.continuation_validation ?? null;
      oauthUrlGenerationServerMs = parsed.oauth_url_generation ?? null;
    },
    markAuthorizationUrlReceived() {
      phase = "authorization_url";
      t3 = now();
    },
    markLocationAssignStart() {
      phase = "location_assign";
      emit("redirect_ready");
    },
    markFailed() {
      emit("failed");
    },
  };
}

type ServerLatencyRoute = "continuation" | "google_start";
type ServerLatencyRecord = Readonly<{
  schema_version: typeof CUSTOMER_AUTH_LATENCY_SCHEMA_VERSION;
  scope: "server";
  route: ServerLatencyRoute;
  outcome: "success" | "failure";
  route_total_ms: number;
  continuation_create_ms: number | null;
  continuation_validation_ms: number | null;
  oauth_url_generation_ms: number | null;
}>;

function defaultServerReporter(record: ServerLatencyRecord) {
  try {
    console.info("CUSTOMER_AUTH_SERVER_LATENCY", record);
  } catch {
    // Diagnostic measurement must never affect the authentication flow.
  }
}

export function createCustomerAuthServerLatencyMeasurement(options: {
  route: ServerLatencyRoute;
  now?: () => number;
  report?: (record: ServerLatencyRecord) => void;
}) {
  const now = options.now ?? (() => performance.now());
  const report = options.report ?? defaultServerReporter;
  const routeStarted = now();
  const observations = new Map<
    CustomerAuthServerLatencyPhase,
    CustomerAuthServerLatencyObservation
  >();

  const observe: CustomerAuthServerLatencyObserver = (observation) => {
    if (
      !Number.isFinite(observation.durationMs) ||
      observation.durationMs < 0 ||
      observation.durationMs > 300_000
    ) {
      return;
    }
    observations.set(observation.phase, {
      ...observation,
      durationMs: Math.round(observation.durationMs),
    });
  };

  function finish<T extends Response>(
    response: T,
    outcome: ServerLatencyRecord["outcome"],
  ) {
    const routeTotalMs = duration(routeStarted, now()) ?? 0;
    const serverTiming = [
      ["auth_route_total", routeTotalMs],
      [
        "auth_continuation_create",
        observations.get("continuation_create")?.durationMs,
      ],
      [
        "auth_continuation_validation",
        observations.get("continuation_validation")?.durationMs,
      ],
      [
        "auth_oauth_url_generation",
        observations.get("oauth_url_generation")?.durationMs,
      ],
    ]
      .filter((entry): entry is [string, number] => typeof entry[1] === "number")
      .map(([name, value]) => `${name};dur=${value}`)
      .join(", ");
    response.headers.set("Server-Timing", serverTiming);
    try {
      report(
        Object.freeze({
          schema_version: CUSTOMER_AUTH_LATENCY_SCHEMA_VERSION,
          scope: "server",
          route: options.route,
          outcome,
          route_total_ms: routeTotalMs,
          continuation_create_ms:
            observations.get("continuation_create")?.durationMs ?? null,
          continuation_validation_ms:
            observations.get("continuation_validation")?.durationMs ?? null,
          oauth_url_generation_ms:
            observations.get("oauth_url_generation")?.durationMs ?? null,
        }),
      );
    } catch {
      // A custom diagnostic reporter is also fail-isolated.
    }
    return response;
  }

  return { observe, finish } as const;
}
