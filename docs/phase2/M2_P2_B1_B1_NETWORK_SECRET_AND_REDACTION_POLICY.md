# M2-P2-B1-B1 Network, Secret, and Redaction Policy

Status: Human / ChatGPT accepted and complete at implementation commit `efdf10067fb3c1b4072c891ab5f3f1d2c949de55`. M2-P2-B1-B2-A live HTTP executor/environment secret binding and M2-P2-B1-B2-B paid execution remain unauthorized and not started.

## Immutable network lock

The fixed B1-B1 state is:

```text
execution_mode: network_blocked_provider_adapter_test
live_execution_authorized: false
paid_run_authorized: false
network_executor_bound: false
secret_provider_bound: false
actual_provider_calls: 0
api_spend_usd: 0
```

The adapter returns `LIVE_EXECUTION_NOT_AUTHORIZED` before either injected interface is called. The network-blocked harness proves zero secret resolutions, zero executor calls, zero provider calls, and USD 0 spend.

## Secret-provider boundary

B1-B1 defines only an injected interface. It does not read or enumerate environment values, implement the future process-environment source, accept a CLI/config secret, create an environment file, or serialize/log a key, authorization value, prefix, or length. Opaque runtime secret values are marked non-serializable.

## Redaction

Deterministic redaction covers authorization fields, API-key fields, bearer values, secret fields, and environment values. Repository evidence contains only synthetic receipts.

## Artifact sanitizer

Artifact sanitization is implemented inside `scripts/lib/m2-p2-b1-b1-redaction.mjs` to preserve the exact 39-file manifest. It rejects rather than silently repairs:

- secret-shaped values or a bound authorization value;
- environment dumps;
- absolute local paths;
- username, hostname, or process identifiers;
- real-user or holdout data; and
- internal reasoning text.

No paid-run directory under the future local application-data location is created.

## Dependency isolation

The ten implementation scripts use Node built-ins and exact B1-B1 peers only. Network built-ins, global network clients, provider/database/auth/payment/email SDKs, application/UI imports, API routes, and server actions are prohibited.

Acceptance preserves the fixed state: no HTTP executor, environment secret provider, global fetch, or direct network client exists; actual secret-resolution, executor, and provider calls remain zero; API spend remains USD 0; and live authorization remains false.
