# M2-P2-B1-A Artifact and Security Policy

## Authorization boundary

`approval-lock-v1.json` fixes live and paid authorization false, paid completion false, spend USD 0, `WAIT-003`, `gpt-5.6-luna`, six simulated stages, and `MOON_REPLY_B1_A_OFFLINE_REPLAY_ONLY`. Its canonical hash is registered by the report manifest. Any lock edit invalidates preflight; B1-A has no mechanism to convert the lock into live authority.

## Actual versus synthetic ledger

Actual fields are fixed to provider calls 0, spend USD 0, and usage unavailable. Synthetic references separately record accepted static HIGH input estimates, nominal output assumptions, unknown reasoning usage, and a cost reference. They are never labeled actual usage, billed cost, or provider evidence.

The happy path proves:

- static hard cap USD 0.213223 is at or below the USD 0.30 preflight ceiling;
- cumulative synthetic cost reference stays under the hard cap; and
- actual spend stays exactly USD 0.

## Repository evidence

Only these reports are written:

- `evals/calibration/b1a/reports/offline-happy-path-v1.json`
- `evals/calibration/b1a/reports/offline-failure-matrix-v1.json`
- `evals/calibration/b1a/reports/offline-runner-summary-v1.md`

The future paid-run location under `%LOCALAPPDATA%` is not created. Reports exclude keys, authorization material, environment values, holdout and real-user data, reasoning text, chain of thought, unrelated machine information, volatile timestamps, absolute paths, usernames, hostnames, and process IDs. Repeated runs must be byte-identical.

## Isolation

The six Runner scripts may import only non-network Node built-ins and exact peers among those six paths. Child-process execution is confined to the permanent verifier and only invokes the exact local Node scripts required by this task. No provider, database, authentication, payment, email, application, UI, API-route, or server-action integration exists.
