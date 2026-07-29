# M2-P2-B1-B2-B0 Approval and One-Time Run Policy

## 1. Repository template

`evals/calibration/b1b2b0/approval-template-v1.json` is deliberately non-executable:

- `approval_status`: `draft`
- `approval_record_present`: `false`
- `live_execution_authorized`: `false`
- `paid_run_authorized`: `false`
- `paid_run_completed`: `false`
- `one_time_only`: `true`
- `approved_runner_commit_sha`: `TO_BE_BOUND_AFTER_MAIN_ACCEPTANCE`

The template cannot authorize a run even if copied to the external approval path.

## 2. Future true approval

A true approval is a separate Human-controlled file outside the repository. It is not created by M2-P2-B1-B2-B0. It must bind:

- a unique approval ID and approved status;
- live and paid authorization `true`;
- paid completion `false`;
- one-time-only `true`;
- exact final `main`, `HEAD`, and `origin/main`;
- the fixed B0 contract hash;
- `WAIT-003`, `gpt-5.6-luna`, PB-01 through PB-06, and six calls;
- USD 0.30 preflight and USD 1.00 absolute ceilings;
- all six request-body and request-contract hashes;
- the versioned price-snapshot hash and verification time;
- record creation and expiry;
- the confirmation-phrase hash;
- the canonical approval-record hash; and
- a Human / ChatGPT decision reference.

No feature-branch, historical, unpushed, dirty, divergent, or placeholder SHA is valid.

## 3. Expiry

Approval validity may not exceed 30 minutes. Expiry is mandatory, clock-skew tolerance is zero, and the run must begin within `[created_at, expires_at)`. An expired approval cannot be edited or renewed. A new approval ID and record are required.

The fixed price snapshot may not be older than 24 hours at execution time. M2-P2-B1-B2-B0 performs no network refresh.

## 4. Confirmation

The CLI confirmation phrase is:

`I_APPROVE_ONE_PAID_WAIT_003_RUN_UNDER_USD_1`

It is not a secret. The approval stores only its SHA-256 hash. Missing, changed, or duplicated CLI arguments are rejected.

## 5. Atomic consumption

Immediately before secret resolution, the Runner atomically creates a write-once marker with:

- `approval_id`
- `approval_hash`
- `runner_sha`
- `contract_hash`
- `consumed_at`
- `status: consumed_before_first_request`

An existing marker stops execution. The marker is never deleted during the run and contains no credential, consultation, output, or environment information.

A crash after marker creation consumes the authorization. Recovery requires a new Human decision, approval ID, and approval record; reuse is prohibited.

## 6. Artifact policy

Future artifacts are written only outside the repository through the accepted B1-B2-A fail-closed sanitizer. API credentials, authorization headers, environment dumps, raw request headers, secret handles, raw provider error bodies, chain of thought, internal reasoning text, holdout data, real-user data, machine identity, process identity, and repository absolute paths are prohibited.

## 7. Current status

No true approval file, authorization marker, or run directory is created by this Task. The paid CLI is not executed, no secret is accessed, no provider is called, and API spend remains USD 0.
