import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = process.cwd();
const canonicalOrigin = "https://customer.example";
const internalOrigin = "https://moon-reply-internal.netlify.app";
const acceptedAuthority = "9571b28b199ff80fa956b64dad4b69d78ad40412";
const expectedMain = "61e33a10e195fad17e253a6b9719217e1992f273";
const routeState = {
  googleStarts: 0,
  googleCallbacks: 0,
  failGoogleCallback: false,
  latencyEvents: [],
  observations: [],
};

const mockServiceUrl = `data:text/javascript,${encodeURIComponent(`
export function requireCustomerAuthMethod(method) {
  if (method !== "google") throw new Error("METHOD_INVALID");
}
export async function createCustomerIdentityAuthApplication() {
  return {
    async startGoogle(input, observe) {
      globalThis.routeState.googleStarts += 1;
      observe?.({ phase: "start_continuation", durationMs: 3, outcome: "success" });
      observe?.({ phase: "start_provider", durationMs: 7, outcome: "success" });
      return { authorizationUrl: "https://local-supabase.invalid/auth/v1/authorize?provider=google" };
    },
    async completeGoogleCallback(input, observe) {
      globalThis.routeState.googleCallbacks += 1;
      observe?.({ phase: "callback_continuation", durationMs: 2, outcome: "success" });
      if (globalThis.routeState.failGoogleCallback) {
        observe?.({ phase: "callback_exchange", durationMs: 11, outcome: "failed" });
        throw new Error("SYNTHETIC_CALLBACK_AUTH_FAILURE");
      }
      observe?.({ phase: "callback_exchange", durationMs: 11, outcome: "success" });
      observe?.({ phase: "callback_identity", durationMs: 5, outcome: "success" });
      observe?.({ phase: "callback_binding", durationMs: 4, outcome: "success" });
    },
  };
}
`)}`;
const mockMeasurementServerUrl = `data:text/javascript,${encodeURIComponent(`
export function isServerMeasurementEnabled() {
  return process.env.MEASUREMENT_ENABLED === "true";
}
export function trackServerGoogleAuthLatency(input) {
  globalThis.routeState.latencyEvents.push(input);
  return { status: "accepted" };
}
`)}`;
globalThis.routeState = routeState;

function resolveLocalModule(specifier, parentURL) {
  const relative = specifier.startsWith("@/")
    ? specifier.slice(2)
    : specifier.startsWith("./") || specifier.startsWith("../")
      ? path.resolve(path.dirname(fileURLToPath(parentURL)), specifier)
      : null;
  if (relative === null) return null;
  const base = path.isAbsolute(relative) ? relative : path.join(root, relative);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate).href;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export%20{}", shortCircuit: true };
    }
    if (specifier === "next/server") {
      return {
        url: pathToFileURL(path.join(root, "node_modules/next/server.js")).href,
        shortCircuit: true,
      };
    }
    if (specifier === "@/lib/customer-auth/service") {
      return { url: mockServiceUrl, shortCircuit: true };
    }
    if (
      specifier === "./server" &&
      context.parentURL?.endsWith("/lib/measurement/auth-latency-server.ts")
    ) {
      return { url: mockMeasurementServerUrl, shortCircuit: true };
    }
    const local = context.parentURL
      ? resolveLocalModule(specifier, context.parentURL)
      : null;
    if (local) return { url: local, shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && (url.endsWith(".ts") || url.endsWith(".tsx"))) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          verbatimModuleSyntax: true,
        },
        fileName: fileURLToPath(url),
      });
      return { format: "module", source: transpiled.outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

process.env.NODE_ENV = "production";
process.env.NEXT_PUBLIC_APP_URL = canonicalOrigin;
process.env.CUSTOMER_AUTH_ENABLED = "true";
process.env.CUSTOMER_AUTH_GOOGLE_ENABLED = "true";
process.env.CUSTOMER_AUTH_EMAIL_OTP_ENABLED = "true";
process.env.CUSTOMER_AUTH_EMERGENCY_STOP = "false";
process.env.CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS = "600";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MODE = "in_memory_seam";
process.env.CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS = "100";
process.env.CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS = "60";
process.env.CUSTOMER_AUTH_EMAIL_KEY_VERSION = "v1";
process.env.EMAIL_VERIFICATION_SECRET_PEPPER = "p".repeat(64);
process.env.EMAIL_ADDRESS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.MEASUREMENT_ENABLED = "true";

const events = await import(
  pathToFileURL(path.join(root, "lib/measurement/events.ts")).href
);
const latency = await import(
  pathToFileURL(path.join(root, "lib/measurement/auth-latency.ts")).href
);
const latencyServer = await import(
  pathToFileURL(path.join(root, "lib/measurement/auth-latency-server.ts")).href
);
const observation = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/observation.ts")).href
);
const authProvider = await import(
  pathToFileURL(path.join(root, "lib/customer-auth/supabase-provider.ts")).href
);
const { NextRequest, NextResponse } = await import("next/server");
const { POST: googleStart } = await import(
  pathToFileURL(path.join(root, "app/api/auth/google/start/route.ts")).href
);
const { GET: googleCallback } = await import(
  pathToFileURL(path.join(root, "app/api/auth/callback/route.ts")).href
);

let passed = 0;
function text(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
function git(args) {
  return execFileSync(
    "git.exe",
    ["-c", "safe.directory=C:/projects/moon-reply", ...args],
    { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  ).trim();
}
function check(name, run) {
  run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}
async function checkAsync(name, run) {
  await run();
  passed += 1;
  console.log(`[PASS] ${name}`);
}

const traceId = `mral_${"A".repeat(32)}`;
const validPayload = {
  schemaVersion: 1,
  method: "google",
  traceId,
  phase: "provider_roundtrip",
  durationMs: 42_000,
  outcome: "success",
};

check("auth_latency coexists with the exact accepted V1 event list", () => {
  assert.equal(events.MEASUREMENT_AUTH_LATENCY_EVENT_NAME, "auth_latency");
  assert.deepEqual([...events.MEASUREMENT_EVENT_NAMES], [
    "page_view",
    "sample_view",
    "request_start",
    "request_complete",
    "auth_start",
    "auth_complete",
    "checkout_start",
    "purchase",
  ]);
});

check("latency payload is exact-object allowlisted and frozen", () => {
  const event = events.createMeasurementEvent("auth_latency", validPayload);
  assert.equal(event.name, "auth_latency");
  assert.deepEqual(Object.keys(event.payload).sort(), [
    "durationMs",
    "method",
    "outcome",
    "phase",
    "schemaVersion",
    "traceId",
  ]);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.payload), true);
  assert.throws(() =>
    events.createMeasurementEvent("auth_latency", {
      ...validPayload,
      metadata: {},
    }),
  );
});

check("duration schema rejects negative, fractional, non-finite, and over-TTL values", () => {
  for (const durationMs of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 600_001]) {
    assert.throws(() =>
      events.createMeasurementEvent("auth_latency", {
        ...validPayload,
        durationMs,
      }),
    );
  }
  assert.equal(
    events.createMeasurementEvent("auth_latency", {
      ...validPayload,
      durationMs: 600_000,
    }).payload.durationMs,
    600_000,
  );
});

check("trace, phase, method, outcome, and schema version are bounded", () => {
  for (const mutation of [
    { traceId: "customer-id" },
    { phase: "raw_provider_detail" },
    { method: "email_otp" },
    { outcome: "provider_error_code" },
    { schemaVersion: 2 },
  ]) {
    assert.throws(() =>
      events.createMeasurementEvent("auth_latency", {
        ...validPayload,
        ...mutation,
      }),
    );
  }
});

check("synthetic clocks produce exact fast and 45-60 second durations without sleeping", () => {
  assert.equal(latency.toBoundedDurationMs(1_000, 1_012), 12);
  assert.equal(latency.toBoundedDurationMs(10_000, 52_000), 42_000);
  assert.equal(latency.toBoundedDurationMs(10_000, 65_000), 55_000);
  assert.equal(latency.toBoundedDurationMs(0, 600_000), 600_000);
  assert.equal(latency.toBoundedDurationMs(10, 9), null);
  assert.equal(latency.toBoundedDurationMs(0, 600_001), null);
  assert.equal(latency.toBoundedDurationMs(Number.NaN, 1), null);
  assert.equal(latency.toBoundedDurationMs(0, Number.POSITIVE_INFINITY), null);
});

check("client T0 to navigation-ready uses one injected browser monotonic clock", () => {
  const captured = [];
  const adapter = {
    dispatch(event) {
      captured.push(event);
      return { status: "disabled" };
    },
  };
  const anchor = latency.beginGoogleAuthClientTiming(() => 100);
  const result = latency.completeGoogleAuthClientTiming(anchor, {
    traceId,
    outcome: "success",
    now: () => 145,
    adapter,
  });
  assert.deepEqual(result, { status: "disabled" });
  assert.equal(captured.length, 1);
  assert.equal(captured[0].payload.phase, "client_start");
  assert.equal(captured[0].payload.durationMs, 45);
});

check("missing trace, missing phase, and expired client timing are dropped", () => {
  const anchor = latency.beginGoogleAuthClientTiming(() => 0);
  assert.deepEqual(
    latency.completeGoogleAuthClientTiming(anchor, {
      traceId: null,
      outcome: "unavailable",
      now: () => 1,
    }),
    { status: "unavailable" },
  );
  assert.deepEqual(
    latency.completeGoogleAuthClientTiming(anchor, {
      traceId,
      outcome: "unavailable",
      now: () => 600_001,
    }),
    { status: "unavailable" },
  );
  assert.throws(() =>
    events.createMeasurementEvent("auth_latency", {
      ...validPayload,
      phase: undefined,
    }),
  );
});

check("cancelled and unreturned synthetic journeys remain telemetry-only", () => {
  const cancelled = events.createMeasurementEvent("auth_latency", {
    ...validPayload,
    phase: "provider_roundtrip",
    durationMs: 55_000,
    outcome: "cancelled",
  });
  assert.equal(cancelled.payload.outcome, "cancelled");
  const unreturned = latency.completeGoogleAuthClientTiming(
    latency.beginGoogleAuthClientTiming(() => 0),
    {
      traceId,
      outcome: "unavailable",
      now: () => 600_001,
    },
  );
  assert.deepEqual(unreturned, { status: "unavailable" });
});

check("adapter failure is unavailable and never escapes", () => {
  const result = latency.dispatchGoogleAuthLatency(validPayload, {
    dispatch() {
      throw new Error("SYNTHETIC_ADAPTER_FAILURE");
    },
  });
  assert.deepEqual(result, { status: "unavailable" });
});

await checkAsync("observer failure cannot change a successful Auth operation", async () => {
  let authMutations = 0;
  const result = await observation.observeCustomerAuthGoogleOperation({
    phase: "callback_binding",
    now: (() => {
      const times = [10, 25];
      return () => times.shift();
    })(),
    operation: async () => {
      authMutations += 1;
      return "BOUND";
    },
    observe() {
      throw new Error("SYNTHETIC_OBSERVER_FAILURE");
    },
  });
  assert.equal(result, "BOUND");
  assert.equal(authMutations, 1);
});

await checkAsync("observer failure cannot turn Auth failure into success", async () => {
  const expected = new Error("AUTH_FAILURE");
  await assert.rejects(
    observation.observeCustomerAuthGoogleOperation({
      phase: "callback_exchange",
      now: (() => {
        const times = [0, 4];
        return () => times.shift();
      })(),
      operation: async () => {
        throw expected;
      },
      observe() {
        throw new Error("SYNTHETIC_OBSERVER_FAILURE");
      },
    }),
    (error) => error === expected,
  );
});

await checkAsync("callback provider failures are measured as failed without changing Auth error", async () => {
  const observations = [];
  const provider = new authProvider.SupabaseCustomerAuthProviderV1(
    {
      auth: {
        async exchangeCodeForSession() {
          return { data: null, error: new Error("SYNTHETIC_PROVIDER_ERROR") };
        },
      },
    },
    canonicalOrigin,
    "https://local-supabase.invalid",
    (() => {
      const times = [0, 9];
      return () => times.shift();
    })(),
  );
  await assert.rejects(
    provider.exchangeGoogleCallback(
      "valid-provider-code-0001",
      (entry) => observations.push(entry),
    ),
    /CUSTOMER_AUTH_CALLBACK_INVALID/u,
  );
  assert.deepEqual(observations, [
    { phase: "callback_exchange", durationMs: 9, outcome: "failed" },
  ]);
});

check("server trace is random, opaque, one-attempt, and measurement-only", () => {
  const first = latencyServer.beginServerGoogleAuthLatencyTrace();
  const second = latencyServer.beginServerGoogleAuthLatencyTrace();
  assert.match(first.traceId, /^mral_[A-Za-z0-9_-]{32}$/u);
  assert.match(second.traceId, /^mral_[A-Za-z0-9_-]{32}$/u);
  assert.notEqual(first.traceId, second.traceId);
  assert.equal(latencyServer.GOOGLE_AUTH_LATENCY_TTL_SECONDS, 600);
});

check("server anchor cookie is HttpOnly Secure Lax, narrow-path, and URL-free", () => {
  const response = new NextResponse(null, { status: 200 });
  const anchor = latencyServer.attachServerGoogleAuthLatencyAnchor(
    response,
    { traceId },
    1_800_000_000_000,
  );
  assert.deepEqual(anchor, { traceId, issuedAtMs: 1_800_000_000_000 });
  const setCookie = response.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /moon_reply_auth_latency_v1=/u);
  assert.match(setCookie, /HttpOnly/iu);
  assert.match(setCookie, /Secure/iu);
  assert.match(setCookie, /SameSite=lax/iu);
  assert.match(setCookie, /Path=\/api\/auth/iu);
  assert.doesNotMatch(setCookie, /https?:|\?|#/u);
  assert.equal(
    response.headers.get(latency.GOOGLE_AUTH_LATENCY_TRACE_HEADER),
    traceId,
  );
});

check("provider roundtrip uses the server-issued wall-clock anchor only", () => {
  const issuedAtMs = 1_800_000_000_000;
  const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=ignored`, {
    headers: {
      cookie: `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=${traceId}.${issuedAtMs}`,
    },
  });
  assert.deepEqual(
    latencyServer.readServerGoogleAuthLatencyAnchor(request, issuedAtMs + 42_000),
    { traceId, issuedAtMs },
  );
});

check("malformed, expired, negative, and throwing cookie reads are unavailable", () => {
  for (const raw of [
    "malformed",
    `${traceId}.1800000000000.extra`,
    `${traceId}.not-a-time`,
  ]) {
    const request = new NextRequest(`${internalOrigin}/api/auth/callback`, {
      headers: { cookie: `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=${raw}` },
    });
    assert.equal(
      latencyServer.readServerGoogleAuthLatencyAnchor(request, 1_800_000_042_000),
      null,
    );
  }
  const expired = new NextRequest(`${internalOrigin}/api/auth/callback`, {
    headers: {
      cookie: `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=${traceId}.1800000000000`,
    },
  });
  assert.equal(
    latencyServer.readServerGoogleAuthLatencyAnchor(expired, 1_800_000_600_001),
    null,
  );
  assert.equal(
    latencyServer.readServerGoogleAuthLatencyAnchor(expired, 1_799_999_999_999),
    null,
  );
  assert.equal(
    latencyServer.readServerGoogleAuthLatencyAnchor({
      cookies: { get() { throw new Error("COOKIE_PARSE_FAILURE"); } },
    }, 1_800_000_000_001),
    null,
  );
});

check("measurement disabled creates no trace, cookie, header, or event side effect", () => {
  process.env.MEASUREMENT_ENABLED = "false";
  assert.equal(latencyServer.beginServerGoogleAuthLatencyTrace(), null);
  const response = new NextResponse(null, { status: 200 });
  assert.equal(
    latencyServer.attachServerGoogleAuthLatencyAnchor(response, null),
    null,
  );
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(response.headers.get(latency.GOOGLE_AUTH_LATENCY_TRACE_HEADER), null);
  process.env.MEASUREMENT_ENABLED = "true";
});

function googleStartRequest() {
  return new NextRequest(`${internalOrigin}/api/auth/google/start`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: "moon_reply_auth_continuation=" + "k".repeat(43),
      origin: canonicalOrigin,
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ csrfToken: "c".repeat(43) }),
  });
}

await checkAsync("Google start response body and authorization authority remain exact", async () => {
  const response = await googleStart(googleStartRequest());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: {
      status: "redirect_ready",
      authorizationUrl:
        "https://local-supabase.invalid/auth/v1/authorize?provider=google",
    },
  });
  assert.equal(routeState.googleStarts, 1);
  assert.match(
    response.headers.get(latency.GOOGLE_AUTH_LATENCY_TRACE_HEADER) ?? "",
    /^mral_[A-Za-z0-9_-]{32}$/u,
  );
  assert.doesNotMatch(
    (await Promise.resolve(
      "https://local-supabase.invalid/auth/v1/authorize?provider=google",
    )),
    /mral_/u,
  );
});

await checkAsync("disabled measurement leaves the successful Google start contract exact", async () => {
  process.env.MEASUREMENT_ENABLED = "false";
  try {
    const response = await googleStart(googleStartRequest());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      data: {
        status: "redirect_ready",
        authorizationUrl:
          "https://local-supabase.invalid/auth/v1/authorize?provider=google",
      },
    });
    assert.equal(
      response.headers.get(latency.GOOGLE_AUTH_LATENCY_TRACE_HEADER),
      null,
    );
    assert.equal(response.cookies.get(latencyServer.GOOGLE_AUTH_LATENCY_COOKIE), undefined);
  } finally {
    process.env.MEASUREMENT_ENABLED = "true";
  }
});

await checkAsync("Google start validation failure stays the existing safe Auth error", async () => {
  const request = googleStartRequest();
  const invalid = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ csrfToken: "c".repeat(43), extra: true }),
  });
  const response = await googleStart(invalid);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: "CUSTOMER_AUTH_REQUEST_INVALID" },
  });
});

await checkAsync("malformed measurement cookie leaves callback success and redirect exact", async () => {
  const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=provider-code`, {
    headers: {
      cookie: [
        `moon_reply_auth_continuation=${"k".repeat(43)}`,
        `moon_reply_auth_callback_csrf=${"q".repeat(43)}`,
        `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=malformed`,
      ].join("; "),
    },
  });
  const response = await googleCallback(request);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${canonicalOrigin}/purchase/auth/continue`);
  assert.equal(routeState.googleCallbacks, 1);
  assert.match(response.headers.get("set-cookie") ?? "", /moon_reply_auth_latency_v1=/u);
});

await checkAsync("callback Auth failure keeps the existing safe redirect", async () => {
  const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=provider-code`);
  const response = await googleCallback(request);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${canonicalOrigin}/account?auth=failed`);
});

await checkAsync("duplicate callback without an anchor adds no measurement authority", async () => {
  const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=provider-code`, {
    headers: {
      cookie: [
        `moon_reply_auth_continuation=${"k".repeat(43)}`,
        `moon_reply_auth_callback_csrf=${"q".repeat(43)}`,
      ].join("; "),
    },
  });
  const response = await googleCallback(request);
  assert.equal(response.status, 303);
  assert.equal(routeState.googleCallbacks, 2);
  assert.equal(latencyServer.readServerGoogleAuthLatencyAnchor(request), null);
});

await checkAsync("provider roundtrip and callback server both succeed on a successful callback", async () => {
  const receivedAtMs = 1_800_000_042_000;
  const issuedAtMs = receivedAtMs - 42_000;
  const originalDateNow = Date.now;
  routeState.latencyEvents.length = 0;
  Date.now = () => receivedAtMs;
  try {
    const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=provider-code`, {
      headers: {
        cookie: [
          `moon_reply_auth_continuation=${"k".repeat(43)}`,
          `moon_reply_auth_callback_csrf=${"q".repeat(43)}`,
          `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=${traceId}.${issuedAtMs}`,
        ].join("; "),
      },
    });
    const response = await googleCallback(request);
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), `${canonicalOrigin}/purchase/auth/continue`);
    assert.deepEqual(
      routeState.latencyEvents.find((event) => event.phase === "provider_roundtrip"),
      {
        traceId,
        phase: "provider_roundtrip",
        durationMs: 42_000,
        outcome: "success",
      },
    );
    assert.equal(
      routeState.latencyEvents.find((event) => event.phase === "google_callback_server")?.outcome,
      "success",
    );
  } finally {
    Date.now = originalDateNow;
  }
});

await checkAsync("provider roundtrip stays successful when downstream callback Auth fails", async () => {
  const failedTraceId = `mral_${"B".repeat(32)}`;
  const receivedAtMs = 1_800_000_055_000;
  const issuedAtMs = receivedAtMs - 55_000;
  const originalDateNow = Date.now;
  routeState.latencyEvents.length = 0;
  routeState.failGoogleCallback = true;
  Date.now = () => receivedAtMs;
  try {
    const request = new NextRequest(`${internalOrigin}/api/auth/callback?code=provider-code`, {
      headers: {
        cookie: [
          `moon_reply_auth_continuation=${"k".repeat(43)}`,
          `moon_reply_auth_callback_csrf=${"q".repeat(43)}`,
          `${latencyServer.GOOGLE_AUTH_LATENCY_COOKIE}=${failedTraceId}.${issuedAtMs}`,
        ].join("; "),
      },
    });
    const response = await googleCallback(request);
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), `${canonicalOrigin}/account?auth=failed`);
    assert.deepEqual(
      routeState.latencyEvents.find((event) => event.phase === "provider_roundtrip"),
      {
        traceId: failedTraceId,
        phase: "provider_roundtrip",
        durationMs: 55_000,
        outcome: "success",
      },
    );
    assert.equal(
      routeState.latencyEvents.find((event) => event.phase === "google_callback_exchange")?.outcome,
      "failed",
    );
    assert.equal(
      routeState.latencyEvents.find((event) => event.phase === "google_callback_server")?.outcome,
      "failed",
    );
  } finally {
    Date.now = originalDateNow;
    routeState.failGoogleCallback = false;
  }
});

check("T0 precedes continuation and T2 follows validated authorization response", () => {
  const requestSource = text("components/request/RequestForm.tsx");
  const start = requestSource.indexOf("async function beginCustomerAuth(");
  const end = requestSource.indexOf("async function submitCustomerAuthEmailOtp(", start);
  const method = requestSource.slice(start, end);
  const selectionStart = requestSource.indexOf(
    "function selectCustomerAuthMethod(method: CustomerAuthMethod)",
  );
  const selectionEnd = requestSource.indexOf(
    "function switchToOrganization()",
    selectionStart,
  );
  const selection = requestSource.slice(selectionStart, selectionEnd);
  assert.ok(
    selection.indexOf("beginGoogleAuthClientTiming()") <
      selection.indexOf("runPhaseFour(method)"),
  );
  assert.ok(
    method.indexOf("googleAuthClientTimingRef.current") <
      method.indexOf('fetch("/api/auth/continuations"'),
  );
  assert.ok(
    method.indexOf('fetch("/api/auth/google/start"') <
      method.indexOf("readGoogleAuthLatencyTraceHeader(response)"),
  );
  assert.ok(
    method.indexOf("new URL(data.authorizationUrl)") <
      method.indexOf('completeGoogleTiming("success")'),
  );
  assert.ok(
    method.indexOf('completeGoogleTiming("success")') <
      method.indexOf("window.location.assign"),
  );
});

check("start and callback server phases cover exact Auth operations", () => {
  const application = text("lib/customer-auth/application.ts");
  const provider = text("lib/customer-auth/supabase-provider.ts");
  for (const marker of [
    'phase: "start_continuation"',
    'phase: "start_provider"',
    'phase: "callback_continuation"',
    'phase: "callback_binding"',
  ]) assert.match(application, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  assert.match(provider, /phase: "callback_exchange"[\s\S]*?exchangeCodeForSession\(code\)/u);
  assert.match(
    provider,
    /phase: "callback_identity"[\s\S]*?getFreshIdentityFor\(\s*"google_verified_identity",?\s*\)/u,
  );
});

check("existing auth_start and auth_complete semantics remain present once", () => {
  const requestSource = text("components/request/RequestForm.tsx");
  const callbackSource = text("app/api/auth/callback/route.ts");
  assert.equal(
    [...requestSource.matchAll(/trackClientMeasurement\("auth_start", \{ method: "google" \}\)/gu)].length,
    1,
  );
  assert.equal(
    [...callbackSource.matchAll(/trackServerAuthComplete\("google"\)/gu)].length,
    1,
  );
});

check("latency producers contain no arbitrary metadata or prohibited payload fields", () => {
  const eventSource = text("lib/measurement/events.ts");
  const start = eventSource.indexOf("auth_latency: Readonly<{");
  const end = eventSource.indexOf("checkout_start:", start);
  const payloadContract = eventSource.slice(start, end);
  assert.doesNotMatch(
    payloadContract,
    /metadata|email|customerUserId|verifiedEmail|purchaseIntent|preparation|delivery|consultation|resultToken|continuationToken|csrfToken|otp|access_token|refresh_token|authorizationUrl|request\.url|searchParams|providerPayment|providerCheckout/iu,
  );
});

check("raw callback code and full URLs never enter Measurement APIs", () => {
  const callbackSource = text("app/api/auth/callback/route.ts");
  const latencySources = [
    "lib/measurement/auth-latency.ts",
    "lib/measurement/auth-latency-server.ts",
    "lib/measurement/server.ts",
  ].map(text).join("\n");
  assert.doesNotMatch(
    callbackSource,
    /(?:recordServerGoogleAuthLatency|createServerGoogleAuthObserver)\([^)]*\bcode\b/u,
  );
  assert.doesNotMatch(latencySources, /request\.url|searchParams|authorizationUrl|callbackUrl|https?:\/\//iu);
});

check("no browser persistence, new secret, network adapter, database, or migration is introduced", () => {
  const changed = git(["diff", "--name-only", acceptedAuthority]);
  const source = [
    "lib/measurement/auth-latency.ts",
    "lib/measurement/auth-latency-server.ts",
    "lib/measurement/events.ts",
    "lib/measurement/server.ts",
  ].map(text).join("\n");
  const authLatencyOnly = [
    "lib/measurement/auth-latency.ts",
    "lib/measurement/auth-latency-server.ts",
  ].map(text).join("\n");
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/iu);
  assert.doesNotMatch(source, /GA4|PostHog|Sentry|Datadog|Mixpanel|Netlify Analytics|createClient|createServerClient|supabase\.rpc/iu);
  assert.doesNotMatch(authLatencyOnly, /MEASUREMENT_[A-Z_]*SECRET/u);
  const workspaceChanges = git(["status", "--porcelain=v1"]);
  assert.equal(
    `${changed}\n${workspaceChanges}`
      .split(/\r?\n/u)
      .some((entry) => entry.includes("supabase/migrations/")),
    false,
  );
});

check("measurement exceptions cannot touch Auth cookies, state, rate keys, or redirects", () => {
  const measurementServer = text("lib/measurement/auth-latency-server.ts");
  const observationSource = text("lib/customer-auth/observation.ts");
  assert.doesNotMatch(
    measurementServer,
    /AUTH_CONTINUATION_COOKIE|AUTH_CALLBACK_CSRF_COOKIE|AUTH_SESSION_CSRF_COOKIE|enforceCustomerAuthRateLimit|completeGoogleCallback|bindPreparation/u,
  );
  assert.match(observationSource, /catch \{[\s\S]*?Observation has no Auth authority/u);
});

check("T0-T4 clocks are not combined into a fabricated end-to-end duration", () => {
  const clientSource = text("lib/measurement/auth-latency.ts");
  const serverSource = text("lib/measurement/auth-latency-server.ts");
  assert.match(clientSource, /performance\.now\(\)/u);
  assert.match(serverSource, /Date\.now\(\)/u);
  assert.doesNotMatch(clientSource, /Date\.now\(\)/u);
  assert.doesNotMatch(serverSource, /startedAtMs.*performance\.now[\s\S]*issuedAtMs/u);
  const requestSource = text("components/request/RequestForm.tsx");
  assert.doesNotMatch(requestSource, /end_to_end|Date\.now\(\)/u);
});

check("no Production external measurement adapter is enabled", () => {
  const adapters = text("lib/measurement/adapters.ts");
  assert.match(adapters, /DisabledMeasurementAdapter/u);
  assert.doesNotMatch(adapters, /fetch\(|XMLHttpRequest|sendBeacon|https?:\/\//u);
  assert.match(text(".env.example"), /^MEASUREMENT_ENABLED=false$/mu);
});

check("D2 and C1 source-controlled safe-off defaults remain exact", () => {
  const env = text(".env.example");
  assert.equal([...env.matchAll(/^CUSTOMER_SUPPORT_CASES_ENABLED=false$/gmu)].length, 1);
  assert.equal([...env.matchAll(/^PREPAYMENT_COMPUTE_BUDGET_ENABLED=false$/gmu)].length, 1);
});

check("canonical evidence locks clocks, privacy, fail-isolation, and non-claims", () => {
  const evidence = text("docs/m2/M2_E1_GOOGLE_AUTH_LATENCY_MEASUREMENT.md");
  for (const marker of [
    "T0",
    "T1",
    "T2",
    "T3",
    "T4",
    "performance.now()",
    "Date.now()",
    "External telemetry writes: `0`",
    "OPTIMIZATION NOT STARTED",
    "PRODUCTION DATA NOT YET COLLECTED",
    "No duration subtracts a browser timestamp from a server timestamp",
  ]) assert.equal(evidence.includes(marker), true, marker);
  assert.match(evidence, /email, Customer\/Auth UUID[\s\S]*OAuth code[\s\S]*consultation\/result content/u);
  assert.match(evidence, /exact T0→T4 single duration is deliberately \*\*unavailable\*\*/u);
});

check("current operational overlays identify E1 as a candidate only", () => {
  for (const relativePath of [
    "docs/CURRENT_FOCUS.md",
    "docs/WBS.md",
    "docs/CODEX_HANDOFF.md",
    "docs/m2/M2_MASTER_BACKLOG.md",
  ]) {
    const source = text(relativePath);
    assert.match(source, /M2-E1/u);
    assert.match(source, /SOURCE CANDIDATE/u);
    assert.doesNotMatch(source, /M2-E1[^\n]*CLOSED/u);
  }
});

check("E1 verifier is registered and authority refs remain untouched", () => {
  const packageJson = JSON.parse(text("package.json"));
  assert.equal(
    packageJson.scripts["verify:m2-e1"],
    "node scripts/verify-m2-e1-google-auth-latency-measurement.mjs",
  );
  assert.equal(git(["rev-parse", "release/private-ready"]), acceptedAuthority);
  assert.equal(git(["rev-parse", "main"]), expectedMain);
});

console.log(`M2_E1_GOOGLE_AUTH_LATENCY_MEASUREMENT: PASS ${passed}/${passed}`);
