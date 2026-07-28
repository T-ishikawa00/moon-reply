# M2-P2-B1-B1 Network-Disabled OpenAI Provider Adapter Foundation

## Status and authority

- Task: `M2-P2-B1-B1`
- Mode: `network_blocked_provider_adapter_test`
- Case: `WAIT-003`
- Calibration candidate: `gpt-5.6-luna`
- Product/baseline model selection: false
- Provider stages: PB-01 through PB-06
- Actual secret-resolution calls: 0
- Actual executor calls: 0
- Actual provider calls: 0
- API spend: USD 0
- Human / ChatGPT final review: pending
- M2-P2-B1-B2: unauthorized and not started

This task implements provider protocol logic only. It includes no endpoint host, HTTP executor, environment secret provider, provider SDK, live approval, API call, paid run, application runtime, database, authentication, payment, email, API route, server action, or UI integration.

## Architecture

The adapter receives five injected values:

```text
providerAdapter.invoke({
  stageRequest,
  approvalProof,
  secretProvider,
  requestExecutor,
  timeoutController
}) -> providerReceipt
```

The future abstract interfaces are:

```text
secretProvider.resolveSecret() -> secretReceipt

requestExecutor.execute({
  endpointPath,
  headers,
  body,
  signal
}) -> rawResponseReceipt
```

B1-B1 provides neither live interface. Its sentinels throw if reached.

## Fixed protocol

The endpoint path is `/v1/responses`; host binding remains B1-B2 work. Every Stage uses `POST`, `store: false`, `tools: []`, `stream: false`, `background: false`, `service_tier: default`, `truncation: disabled`, low reasoning effort, and strict JSON Schema output.

Caps are PB-01 4000, PB-02 800, PB-03 700, PB-04 4500, PB-05 8000, and PB-06 2500. PB-07, retry, Repair, fallback, Batch, 14-case, 70-case, holdout, and real-user execution are absent.

## Pre-secret boundary

Request-contract validation, approval validation, the immutable network interlock, and the sequential budget guard all precede secret resolution. The B1-B1 lock always returns `LIVE_EXECUTION_NOT_AUTHORIZED`; no CLI, config, environment, or file approval can open it.

## Evidence meaning

Checked-in evidence uses synthetic raw Response objects. It proves deterministic request construction, strict response parsing, usage-ledger arithmetic, budget guard behavior, redaction, artifact rejection, and fail-closed adapter sequencing. It does not prove provider availability, compatibility, actual usage, latency, billed cost, model quality, or runtime readiness.
