# M2-P2-B1-A Offline One-Case Calibration Runner Specification

## Status and authority

- Task: `M2-P2-B1-A`
- Mode: `offline_replay` only
- Run kind: `calibration_plumbing_preview`
- Case: `WAIT-003` only
- Candidate: `gpt-5.6-luna` only
- Product/baseline model selection: false
- Simulated provider stages: PB-01 through PB-06
- Actual provider calls: 0
- API spend: USD 0
- Live authorization: false
- Product model: unselected
- Baseline model: unselected
- M2-P2-B1-A-R1: Human / ChatGPT accepted and complete at `22bbf6f69ad2e21d3d43808e3518970eb1dc48e7`
- M2-P2-B1-A: automated validation and Human / ChatGPT final review complete; accepted and complete at `630cde811d63e0304ed528dc2e426400e81506a6`
- M2-P2-B1-B1 live transport planning/implementation: unauthorized and not started
- M2-P2-B1-B2 paid calibration execution: unauthorized and not started

This task exercises reusable Runner plumbing with deterministic synthetic replay. It does not read a key or environment value, contain a live provider transport, access a network, validate provider compatibility, or produce model-quality evidence.

## Architecture

The Runner core receives an injected transport implementing:

```text
transport.invoke(stage_request) -> transport_receipt
```

B1-A provides exactly one implementation, `offline_replay`. Any other transport kind fails before Stage execution. The core depends only on local contract assets and has no application-runtime, UI, database, provider, or secret boundary.

## Fixed CLI

The only accepted command shape is:

```text
node scripts/run-m2-p2-b1-a-offline.mjs --mode offline-replay --case WAIT-003 --model gpt-5.6-luna --contract-hash c3dfdc5ec6cb503a8d91ed4080c8734c9af9c7bf944e1bb6b5798536bb6c38e2 --confirm MOON_REPLY_B1_A_OFFLINE_REPLAY_ONLY
```

All five flag/value pairs are mandatory and exact. Unknown, duplicate, missing, live/network, case/model/hash, multi-case, Stage, output-cap, budget, retry, Repair, and fallback inputs are rejected. No CLI value can authorize live execution.

## Local deterministic policy steps

The Runner performs:

- strictest local Safety aggregation;
- readiness assertion;
- Decision Policy candidate restriction;
- plan consistency validation;
- report consistency validation;
- final semantic-finding disposition;
- separate actual and synthetic-reference budget ledger checks; and
- artifact/approval-lock validation.

These are calibration-tool operations only and are not wired to Next.js, Request UI, report runtime, API routes, server actions, database, authentication, payment, or email.

## Schema validation

PB-01 through PB-06 synthetic outputs are validated against the accepted output Schemas. The local validator supports the exact used subset, including references, type, properties, required, additional properties, enum, const, one-of/any-of/all-of, conditionals, arrays, prefix items, uniqueness, length, numeric limits, patterns, and accepted null structures. Accepted Schemas are unchanged.

## Evidence boundary

Generated reports are deterministic repository evidence. Synthetic token and cost references come from the accepted M2-P2-A nominal Stage rows and remain distinct from actual usage and spend. Repeated happy-path and failure-matrix generation must be byte-identical.

The accepted synthetic cumulative cost reference is USD 0.116065, the static hard cap is USD 0.213223, the preflight ceiling is USD 0.30, and the future absolute Human ceiling is USD 1.00. These are static or synthetic boundaries; actual API spend remains USD 0.

Offline replay is plumbing evidence only and must not be described as a successful API integration. Synthetic output is not model-quality evidence, synthetic usage is not actual token usage, and synthetic cost is not billed cost. Provider compatibility, actual token usage, actual reasoning tokens, actual latency, actual API cost, and model quality remain unknown.
