# M2-P2-A Zero-Cost Estimator

This directory contains deterministic, repository-only planning inputs for M2-P2-A.

The estimator:

- renders canonical local request envelope drafts for PB-01 through PB-06;
- renders PB-07 only inside the separate repair-stress scenario;
- projects only fixture input into model-facing payloads;
- uses deterministic synthetic, Schema-shaped upstream artifacts;
- estimates token bands from exact UTF-8 byte counts;
- applies the versioned USD price snapshot without selecting a model; and
- writes byte-identical JSON and Markdown reports when sources do not change.

It does not call an API, access a network, read an API key or environment secret, import a provider SDK, or connect to application runtime.

Run:

```text
node scripts/render-m2-dry-run-requests.mjs
node scripts/estimate-m2-static-costs.mjs
node scripts/verify-m2-zero-cost-estimator.mjs
```

`MODEL_UNSELECTED_PLACEHOLDER` is a local planning marker. Rendered objects are canonical local request envelope drafts, not live or provider-validated API requests.

The LOW, CENTRAL, and HIGH token values are estimates, not actual usage. The default formulas are `ceil(UTF8 bytes / 4)`, `ceil(UTF8 bytes / 3)`, and `ceil(UTF8 bytes / 2)`. Japanese text, JSON structure, tokenizer changes, and reasoning behavior can materially change actual usage.

No API cost was incurred. M2-P2-B is not authorized.
