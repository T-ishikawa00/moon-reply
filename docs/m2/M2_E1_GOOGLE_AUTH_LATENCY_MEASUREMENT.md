# M2-E1 — Google Auth Latency Measurement

Status: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`

Finding disposition:

- `AUTH-01`: `MEASUREMENT SOURCE CANDIDATE — OPTIMIZATION NOT STARTED`
- `PERF-01`: `MEASUREMENT SOURCE CANDIDATE — PRODUCTION DATA NOT YET COLLECTED`

This evidence establishes a privacy-bounded, fail-isolated source measurement seam. It does not establish the root cause of the Human-observed approximately 45–60 second handoff, activate telemetry, optimize Auth, deploy source, or close either finding.

## Authority and external boundary

- Source base: `release/private-ready@9571b28b199ff80fa956b64dad4b69d78ad40412`
- Task branch: `task/m2-e1-google-auth-latency-measurement-r1`
- `main`: `61e33a10e195fad17e253a6b9719217e1992f273`, unchanged
- Remote DB: exact `0002..0021`, pending `0`, unknown `0`
- Migration added: none
- Current Published customer source: `0befd512219eb2897fb1edf969ad37d7e8c56b0d`, unchanged
- External telemetry writes: `0`
- Real Google Auth runs: `0`
- Production adapter: disabled in-process adapter only
- Source default: `MEASUREMENT_ENABLED=false`
- Support and C1 activation remain unset/inactive; no environment or Netlify setting changed.

## Exact pre-E1 Google Auth call graph

1. `RequestForm` presents method-first Customer Auth. Selecting Google calls `runPhaseFour("google")` and enters the existing provider-free preparation/continuation flow.
2. `POST /api/auth/continuations` enforces enabled method, canonical same-origin, header/body CSRF equality, strict exact-object JSON, continuation rate limiting, and durable opaque continuation creation. It sets the existing continuation and callback-CSRF cookies.
3. `POST /api/auth/google/start` enforces Google availability, canonical same-origin, strict exact-object JSON, continuation cookie, rate limit, and durable continuation validation.
4. `CustomerIdentityAuthApplicationV1.startGoogle()` validates the current Google continuation, then calls `SupabaseCustomerAuthProviderV1.startGoogleOAuth()`.
5. The provider calls Supabase `signInWithOAuth()` with PKCE-compatible server Auth, `openid email profile`, the canonical `/api/auth/callback`, and `skipBrowserRedirect: true`. It accepts only an authorization URL at the configured Supabase origin with `/auth/v1/authorize`.
6. The start route returns the unchanged `{ status: "redirect_ready", authorizationUrl }`; the client validates HTTPS, records the existing `auth_start`, and navigates.
7. The browser travels through the Supabase Auth and Google provider boundary and returns to `GET /api/auth/callback`.
8. The callback accepts only the existing `code` query key, reads the existing continuation and callback-CSRF cookies, enforces the callback rate limit, and revalidates the durable continuation.
9. Supabase `exchangeCodeForSession()` exchanges the code; a fresh `getUser()` supplies the server identity; verified Google email normalization remains fail-closed.
10. The application atomically binds the fresh Customer identity to the preparation through the existing ownership repository.
11. The route records the existing `auth_complete`, creates the unchanged safe `303` to `/purchase/auth/continue`, clears callback CSRF, issues session CSRF, and returns.
12. `/purchase/auth/continue` again requires Customer Auth enabled, the continuation/session-CSRF cookies, and a fresh server `getUser()` before authenticated preparation execution or Checkout.

Network boundaries are: same-origin customer requests to the two server routes; server Supabase Auth calls at OAuth start, code exchange, and fresh identity; browser/Supabase/Google travel between the validated authorization URL and callback; and existing service-role repository calls for continuation validation and ownership binding. The observed 45–60 seconds is not attributed to any one boundary without Production samples.

## T0–T4 semantics and clock domains

| Checkpoint | Exact meaning | Clock domain |
| --- | --- | --- |
| T0 | The Google method click captures an in-memory timing anchor immediately before `runPhaseFour("google")`. | Browser `performance.now()` in the current document |
| T1 | `POST /api/auth/google/start` enters the route. | Server monotonic `performance.now()` for that request |
| T2 | The authorization URL has passed existing validation, the safe start response is ready, and the short-lived measurement anchor is attached immediately before return. | Server `Date.now()` anchor for cross-request wall time; start subphases use server monotonic time |
| T3 | `GET /api/auth/callback` enters the route and reads the optional measurement anchor before Auth processing. | Server `Date.now()` for the provider interval; callback subphases use server monotonic time |
| T4 | Existing callback work and safe response cookies/redirect are complete immediately before return. | Server monotonic `performance.now()` for that callback request |

Derived measurements:

- `client_start`: T0 through the continuation request, Google-start response, JSON decoding, and HTTPS authorization-URL validation, using one browser monotonic clock.
- `google_start_security`: T1 through method/environment/origin/body/cookie/rate-limit/application construction, using one server-request monotonic clock.
- `google_start_continuation`: durable continuation validation inside the application.
- `google_start_provider`: Supabase OAuth-start call and authorization-URL validation.
- `google_start_server`: T1 to the response-ready boundary.
- `provider_roundtrip`: the server-issued T2 wall-time anchor to server callback receipt T3. This intentionally includes response delivery, browser navigation, Supabase, Google/user interaction, and callback delivery; it does not claim Google alone consumed the interval.
- `google_callback_continuation`: callback durable-continuation validation.
- `google_callback_exchange`: exact `exchangeCodeForSession()` operation.
- `google_callback_identity`: exact fresh `getUser()` plus verified-identity normalization operation.
- `google_callback_binding`: exact ownership binding operation.
- `google_callback_server`: T3 to T4.

No duration subtracts a browser timestamp from a server timestamp. An exact T0→T4 single duration is deliberately **unavailable**: persisting T0 across the external navigation would conflict with the existing no-browser-storage Auth foundation, and summing independently measured browser/server phases would manufacture a cross-clock result. The schema reserves `end_to_end` for a future separately reviewed, same-clock mechanism, but E1 has no producer for it.

The T2→T3 wall-time mechanism is the explicitly allowed server-issued start-timestamp design. Negative, expired, non-finite, or over-ten-minute results are dropped. Platform wall-clock synchronization is therefore an operational assumption for that aggregate interval; the measurement is never used as Auth or business authority.

## Ephemeral correlation authority

- Trace format: fresh cryptographically random `mral_` plus 24 random bytes encoded as 32 base64url characters.
- Identity relationship: none. The trace is unrelated to Customer, preparation, purchase, delivery, Support, session, or provider identifiers.
- Lifetime: maximum `600` seconds.
- Persistence: no DB, localStorage, sessionStorage, or URL/query/hash.
- Start response: one non-authoritative response header exposes the opaque trace to the same initiating page solely to correlate `client_start`.
- Cross-provider anchor: `moon_reply_auth_latency_v1` contains only the trace and server-issued millisecond timestamp. It is HttpOnly, Secure in Production, SameSite=Lax, path `/api/auth`, max-age 600.
- Callback: validates exact format and bounded age, then clears the cookie on success or failure. Missing, malformed, expired, or duplicate-callback anchors make measurement unavailable while Auth continues.
- Authority: the trace/header/cookie cannot authorize, select, rate-limit, redirect, bind, or mutate anything.

The anchor is created only when `MEASUREMENT_ENABLED === "true"`. Missing, false, or malformed values create no trace, header, cookie, or server latency event.

## Event schema

`auth_latency` is a versioned extension that coexists with the accepted eight Measurement Foundation V1 events without redefining `auth_start` or `auth_complete`.

Exact payload:

```text
schemaVersion: 1
method: "google"
traceId: opaque mral_ identifier
phase: bounded enum
durationMs: integer 0..600000
outcome: "success" | "failed" | "cancelled" | "unavailable"
```

The validator requires the exact six keys. There is no generic metadata map. Fractional, negative, NaN, Infinity, over-bound, unknown phase/outcome, malformed trace, wrong method/version, and extra-key payloads are rejected or dropped.

Allowed values are limited to the six fields above. Prohibited values include email, Customer/Auth UUID, preparation/purchase/delivery/Support IDs, OAuth code, tokens, OTP, continuation/CSRF, authorization/callback/request URLs, query strings, cookies, IP, User-Agent, consultation/result content, provider payload, and arbitrary error details. No callback code or full URL is passed to a Measurement API.

## Fail isolation

Measurement helpers and observation notifications catch their own failures. A measurement adapter or observer exception cannot replace an Auth result; an Auth exception is rethrown unchanged. Cookie creation/read/clear and duration parsing are also isolated.

The E1 proof covers:

- throwing adapter;
- throwing observer during Auth success and Auth failure;
- malformed, expired, negative-time, and throwing cookie parser;
- missing trace/phase and storage-free unreturned journey;
- duplicate callback without an anchor;
- exact-disabled mode with no measurement side effect;
- unchanged start response body and authorization URL;
- unchanged successful callback `303` under malformed measurement state.

Measurement never reads or changes existing Auth cookies, OAuth state, rate-limit keys, continuation validity, callback destination, Customer ownership, session validity, Payment, fulfillment, Provider work, or Support state.

## Synthetic proof

`verify:m2-e1` uses deterministic clocks; it never sleeps for 45 seconds. It proves exact fast, 42,000 ms, 55,000 ms, and 600,000 ms durations; rejects negative and 600,001 ms values; exercises start/callback/cancelled/unreturned/failure cases; and scans latency payload producers for prohibited fields and URL/code leakage.

## Current limitation and future Production plan

Source correctness cannot identify the bottleneck. Production collection would still require separate Human/ChatGPT authority for all of the following:

1. review and connect a privacy-appropriate external adapter;
2. confirm the Production environment activation value and deployment;
3. collect a bounded sample without PII/secrets;
4. compare `client_start`, start subphases, provider aggregate, and callback subphases;
5. only then propose an optimization for the measured dominant phase.

No GA, PostHog, Sentry, Datadog, Mixpanel, Netlify Analytics, custom collector, Supabase telemetry table, or new secret is present in E1. Optimization remains explicitly not started.
