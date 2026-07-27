# M2-P2-B0 Security and Budget Policy

## 1. Current authorization

M2-P2-B0 is Human / ChatGPT accepted and complete at implementation commit `cf75679f2d116132f7519256cd762ba1a51a0af9`. Acceptance does not authorize live execution or M2-P2-B1.

| Control | Value |
| --- | ---: |
| current task spend authorized | USD 0.00 |
| future Human approval ceiling | USD 1.00 |
| preflight contract ceiling | USD 0.30 |
| expected static conservative cost | USD 0.163123 |
| recomputed standard hard-cap cost | USD 0.213223 |
| live execution authorized | false |

M2-P2-B0 cannot read an API key, perform network access, invoke a provider, or incur API spend.

## 2. Price and cost contract

The accepted versioned Luna snapshot is:

- standard input: USD 1.00 per 1M tokens;
- standard output: USD 6.00 per 1M tokens;
- Batch: prohibited for the approval baseline;
- Priority: prohibited;
- cache discount: excluded from the approval baseline.

Cached input, if a future B1 reports it, remains informational. Budget protection prices all input conservatively as uncached. Neither Batch nor cache savings can make an otherwise ineligible contract pass.

The standard hard-cap formula is:

```text
(conservative HIGH input tokens × USD 1 / 1,000,000)
+ (configured output-cap tokens × USD 6 / 1,000,000)
```

The recomputed value must be no greater than USD 0.30. If it exceeds USD 0.30, future live execution is ineligible regardless of the USD 1 absolute Human ceiling.

## 3. B0 secret boundary

B0 scripts must have:

- no process-environment access;
- no API-key variable-name material in generated artifacts;
- no secret-shaped value;
- no authorization header;
- no provider SDK or invocation;
- no network built-in or network call; and
- no environment-file unignore exception.

`.gitignore` has no unsafe environment-file unignore rule, so B0 does not modify it. If a concrete unsafe rule were found, this task would stop and report instead of broadening `.gitignore`.

## 4. Future B1 key handling

A future authorized B1 must:

- supply the key only through the process environment;
- prefer an ephemeral shell environment for this one calibration;
- keep the key out of the repository, command-line arguments, JSON configuration, and run artifacts;
- never log an authorization header;
- never dump environment values;
- never log a substring, prefix, or value length;
- never expose the key client-side; and
- never commit an environment file.

The key value must never be displayed. B0 implements none of this live handling.

## 5. Future evidence location

The default conceptual location is outside the repository:

```text
%LOCALAPPDATA%\moon-reply\calibration-runs\<run_id>\
```

B0 creates no paid-run directory.

Required future files:

- `run-manifest.json`
- `stage-records.json`
- `gate-results.json`
- `cost-summary.json`
- `calibration-summary.md`
- `outputs/PB-01.json` through `outputs/PB-06.json`

## 6. Allowed evidence

Allowed evidence is limited to:

- run and fixture case IDs;
- Prompt, Schema, and contract hashes;
- requested and returned model IDs;
- response IDs and status;
- input, cached-input, output, reasoning, and total usage numbers;
- latency milliseconds;
- Schema and gate results;
- usage-derived cost estimate; and
- static-versus-usage comparison.

The cost term is `usage-derived cost estimate`. It must not be described as final billed cost.

## 7. Prohibited evidence and data

Artifacts must not contain:

- an API key or authorization header;
- environment values;
- real-user or holdout data;
- internal chain of thought or reasoning text; or
- unrelated machine information.

Reasoning usage numbers may be recorded; reasoning text may not.

## 8. Budget guard after each Stage

After each future Stage, cumulative usage-derived cost estimate must be recomputed at standard pricing with cached input treated conservatively as uncached. Any budget-guard failure stops immediately.

No retry, Repair, fallback, model switch, or synthetic continuation is allowed after failure.

## 9. Human lock

USD 1 is only a future absolute approval ceiling. It is not current spend authorization. A separate committed Human approval must bind the exact contract hash, case, model, Stage list, and USD 1 ceiling before a future live CLI could be authorized.

M2-P2-B1 remains unauthorized and not started.
