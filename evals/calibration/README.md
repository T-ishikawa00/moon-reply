# M2-P2-B0 One-Case Calibration Contract

This directory contains the machine-readable, zero-cost contract for a possible future one-case paid calibration.

The only registered path is:

- development fixture `WAIT-003`;
- candidate `gpt-5.6-luna`;
- PB-01 through PB-06, each at most once;
- six provider calls maximum;
- four local deterministic steps;
- no retry, Repair, fallback, Batch, Priority, cache-discount reliance, holdout, real-user data, or automatic continuation after failure; and
- a standard-pricing hard-cap estimate at or below USD 0.30.

M2-P2-B0 does not call an API, read an API key, implement a provider executor, authorize spend, select a product model, or authorize M2-P2-B1. `live_execution_authorized` remains `false`, `paid_run_completed` remains `false`, and `api_spend_usd` remains `0`.

Run the local-only contract tools:

```text
node scripts/prepare-m2-p2-b0-calibration-contract.mjs
node scripts/verify-m2-p2-b0-calibration-contract.mjs
```

The prepare script recomputes the accepted local-envelope sizes, LOW/CENTRAL/HIGH input estimates, configured output-cap ceiling, conservative standard cost, hard-cap standard cost, source hashes, and deterministic contract preview. Repeated runs from unchanged sources must produce byte-identical preview JSON.

Future paid-run evidence is repository-external by default. B0 creates no paid-run directory and no live CLI.
