# M2-P2-B1-B2-A Execution Security and Budget Policy

## Accepted status

M2-P2-B1-B2-A-R1 is Human / ChatGPT accepted and complete at `fa222917f0e6ff4a4e25d11da239717c062af6d0`. The dormant live-binding implementation is Human / ChatGPT accepted and complete at `76ceb4a25cc565e84b9537bd25dbe703f87bd342`. Acceptance does not create a paid approval, activate a binding, authorize B1-B2-B, select a model, or authorize Project, billing, key, secret, or API operations.

## Approval boundary

B1-B2-A defines the future approval Schema but creates no approval record. The current state fixes `approval_record_present`, `live_execution_authorized`, `paid_run_authorized`, and `paid_run_completed` to false and spend to USD 0. No CLI flag, environment value, or config edit can create approval.

A future B1-B2-B approval must bind one approval ID to the exact runner SHA, B0 contract hash, request hashes, `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, six-call maximum, USD 0.30 preflight ceiling, USD 1.00 absolute ceiling, price verification time, creation/expiry times, one-time confirmation hash, and Human / ChatGPT decision reference.

## Secret boundary

Only `scripts/lib/m2-p2-b1-b2-a-env-secret-provider.mjs` contains the environment capability and the literal `process.env.OPENAI_API_KEY`. It does not enumerate the environment, load `.env`, accept a CLI/config/default/fallback secret, read at import time, or expose key material in logs, errors, receipts, prefixes, or lengths.

The returned SecretHandle has no enumerable secret value. JSON serialization throws, string and inspection conversion are `[REDACTED_SECRET_HANDLE]`, and raw access occurs only inside a closure. Missing values stop with `OPENAI_API_KEY_MISSING`; any whitespace or newline stops with `OPENAI_API_KEY_INVALID`. B1-B2-A uses fixture environment objects only, so actual environment reads and actual secret resolutions remain zero.

## HTTPS boundary

Only `scripts/lib/m2-p2-b1-b2-a-https-executor.mjs` imports `node:https` and `node:tls`. The executor fixes HTTPS, `api.openai.com:443`, `POST /v1/responses`, TLS 1.2 minimum, 180000 ms timeout, no redirects, no proxy environment, no connection reuse, a 2 MiB request limit, and a 4 MiB response limit.

Callers cannot supply host, port, path, method, timeout, or headers. The bearer authorization value is constructed only inside the executor call stack and is never returned, logged, persisted, previewed, or included in an error or artifact. B1-B2-A tests inject a fake request implementation; actual HTTPS requests remain zero.

HTTP 200 is the only success. Redirects, 400, 401, 403, 404, 429, 5xx, network errors, timeout, and oversized responses map to sanitized stop codes. Raw error bodies are discarded. There is no retry, backoff, fallback, alternate model, or second request for a failed Stage.

## Budget boundary

The accepted historical static hard cap remains USD 0.213223. The separate live guard uses the 2026-07-28 planning snapshot: USD 1.25 per million input tokens for cache-write protection and USD 6.00 per million configured output-cap tokens. Cached-read discounts are not used and reasoning tokens are not double-counted.

Each exact registered request body is bounded conservatively at one token per two UTF-8 bytes. Every Stage must remain below 272000 input tokens. The recomputed live guard must remain at or below USD 0.30.

The accepted recomputed cache-write-protected live execution guard is USD 0.26079625. It is a conservative preflight protection value, not actual token usage, actual spend, or billed cost.

Before each future provider call:

```text
usage-derived conservative cost so far
+
remaining Stage live-guard cost
<=
USD 1.00
```

Completed provider calls must remain below six. Any pricing, usage, model, Schema, deterministic Stage, or next-Stage budget failure stops without retry or continuation.

## One-time, Git, artifact, and redaction boundaries

The one-time marker is atomically created outside the repository before the first HTTPS request and is bound to the approval ID. Existing markers stop with `AUTHORIZATION_ALREADY_CONSUMED`; a crash requires new Human approval. B1-B2-A uses only an in-memory filesystem and creates no real marker.

Only `scripts/lib/m2-p2-b1-b2-a-execution-guard.mjs` imports `node:child_process`. It allows four fixed Git commands, uses no shell and no user-controlled arguments, and requires main, exact equal HEAD/origin-main, and a fully clean porcelain status. B1-B2-A uses fixture results and performs zero actual child-process calls.

Artifacts are written through an injected filesystem. The future conceptual local-app-data bundle contains only sanitized run, Stage, gate, cost, summary, and PB-01 through PB-06 output records. Fail-closed redaction rejects authorization data, bearer values, key fields, secret values, environment dumps, headers, raw HTTP error bodies, internal reasoning, holdout/real-user data, local paths, usernames, hostnames, and process identifiers. B1-B2-A creates no real run directory.
