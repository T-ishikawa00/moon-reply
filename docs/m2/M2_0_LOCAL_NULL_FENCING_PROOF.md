# M2-0 Local NULL / Fencing Exploit Proof

Status: `disposable_local_complete`

Executed: `2026-08-23`

Remote write count: `0`

Migration created: `0`

Provider, Stripe, webhook, Async event, Purchase, deploy, publish, and customer-data operations: `0`

## Environment and identity

- A fresh disposable Supabase project was created outside the repository.
- Local baseline `0001` plus the exact remote-matched migrations `0002..0016` were applied; the local list contained `0001..0016` without gaps.
- The target RPC bodies were the source bodies whose remote `pg_proc.prosrc` hashes and `pg_get_functiondef` matched in `M2_0_REMOTE_SUPABASE_CATALOG_EVIDENCE.md`.
- Only fixed synthetic UUIDs and synthetic non-customer values were used. No consultation body, email address, token, capability, secret, URL, project reference, or customer row was used.
- Concurrent calls were executed as two independent local CLI jobs.
- After capture, the local stack and data volumes were stopped without backup and the disposable directory was removed.

## Confirmed exploits

| Finding / case | Before | Invocation / disposition | After / row count | Side effects | Error |
| --- | --- | --- | --- | --- | --- |
| DB-01 — fulfillment claim NULL lease | Logical assessment `pending`; owner/lease NULL; attempt `0` | `claim_production_fulfillment_v2(grant, owner, NULL, now)` -> `acquired` | Logical row update `1`: `generating`, supplied owner, lease still NULL, attempt `1` | No delivery/credential/notification created at claim | none |
| DB-02a — fulfillment complete NULL caller owner | Logical assessment `generating`; real owner and future lease; generation started; grant issued; canonical runtime report present; delivery/credential/notification counts `0/0/0` | `complete_production_fulfillment_v2(..., p_owner_id=NULL, ...)` -> completed | Logical and grant each became `completed`; insert counts `1/1/1` for delivery/credential/notification | Full customer-delivery authority was created despite no caller owner fence | none |
| DB-02b — fulfillment complete stored NULL lease | Logical assessment `generating`; exact owner; stored lease NULL; generation started; grant issued; canonical runtime report present; side-effect counts `0/0/0` | `complete_production_fulfillment_v2(..., exact_owner, ...)` -> completed | Logical and grant each became `completed`; delivery/credential/notification insert counts `1/1/1` | Full completion crossed a missing lease fence | none |
| DB-03 — notification claim NULL lease | Notification `pending`; owner/lease NULL; attempt `0` | `claim_production_notification_v2(id, owner, NULL, now)` -> `acquired` | Notification row update `1`: `processing`, supplied owner, lease NULL, attempt `1` | Durable attempt consumed and row left for manual-review handling by later claim | none |

The cause is SQL three-valued logic plus RPC control flow:

- claim guards use `p_lease_expires_at <= p_now`; NULL makes the expression UNKNOWN and the PL/pgSQL `IF` does not fire;
- completion uses `locked.owner_id <> p_owner_id` and `locked.lease_expires_at <= p_now` inside one `IF`; a NULL argument/stored value can leave the composite predicate NULL, which PL/pgSQL treats as not true;
- logical/notification expand constraints explicitly allow a NULL lease. Their NOT VALID state is not required for the new mutation to pass.

## Constraint-closed / rejected blocker hypotheses

`Rejected` means the hypothesized exploit did not pass and is removed as an independent migration blocker. It remains a regression case.

| Case | Disposition | Before/after and side effects | Error / constraint |
| --- | --- | --- | --- |
| Fulfillment job claim with NULL lease | rejected | Job row unchanged; update count `0` | SQLSTATE `23514`; `production_fulfillment_job_owner` |
| Fulfillment dispatch claim with NULL lease | rejected | Job/dispatch row unchanged; update count `0` | SQLSTATE `23514`; `production_fulfillment_job_dispatch_lease` |
| Customer ownership binding with NULL customer user ID | rejected | Binding count stayed `0`; continuation stayed `pending` | SQLSTATE `23514`; `production_customer_ownership_state` |
| Model finalization with NULL returned model | rejected | Report count stayed `0`; run/request states unchanged | SQLSTATE `P0001`; `M2_FINALIZATION_MODEL_REQUIRED` |
| Logical completion/failure with mismatched non-NULL owner | rejected | Logical/grant/delivery/credential/notification unchanged | SQLSTATE `P0001`; `PRODUCTION_FULFILLMENT_STATE_CONFLICT` |
| Logical completion/failure with expired non-NULL lease | rejected | All target and side-effect rows unchanged | SQLSTATE `P0001`; `PRODUCTION_FULFILLMENT_STATE_CONFLICT` |
| Notification completion/failure with mismatched owner or expired lease | rejected | Notification state/attempt/provider reference unchanged | SQLSTATE `P0001`; `PRODUCTION_NOTIFICATION_STATE_CONFLICT` |
| Fulfillment job completion/failure with mismatched owner or expired lease | rejected | Job state/owner/lease unchanged | SQLSTATE `P0001`; `RC2_FULFILLMENT_JOB_CONFLICT` |
| Dispatch completion/failure with mismatched owner or expired lease | rejected | Dispatch marker/owner/lease/retry state unchanged | SQLSTATE `P0001`; `RC2_FULFILLMENT_DISPATCH_CONFLICT` |
| `mark_production_generation_started_v2` with NULL owner, NULL `p_now`, mismatch, or expired lease | rejected | Logical generation boundary unchanged | SQLSTATE `P0001`; `PRODUCTION_GENERATION_BOUNDARY_CONFLICT` |

## Exact valid owner/fence controls

- Logical claim with a non-NULL owner and future lease returned `acquired` and incremented once.
- `mark_production_generation_started_v2` with the exact owner and live lease set the generation boundary once.
- Logical completion with exact owner/live lease and canonical run/report completed and created exactly one delivery, credential, and notification.
- Logical, job, dispatch, and notification failure/complete cases with exact live fences succeeded in their expected fixture states.
- `finalize_completed_assessment` with exact `gpt-5.6-luna` inserted one report and completed exactly one run/request.
- Customer ownership with a valid synthetic auth user and verified binding fields succeeded in the valid control fixture.

## Concurrency

Two concurrent `claim_production_fulfillment_v2` calls against the same grant produced exactly one `acquired` disposition and one `in_progress` disposition. The logical assessment attempt count incremented once and one owner held the row; no double claim or duplicate side effect occurred. The row lock and ordinary non-NULL active fence therefore work. This does not mitigate the confirmed NULL input/completion bypasses.

## Constraint disposition

| Constraint | Validated | Proof meaning |
| --- | --- | --- |
| production_logical_assessments_owner | yes | generating requires owner/acquired time, but says nothing about lease |
| production_logical_assessments_lease_owner | no (`NOT VALID`) | NULL lease is explicitly allowed; non-NULL lease requires generating owner |
| production_notification_outbox_owner | yes | processing requires owner/start time, but says nothing about lease |
| production_notification_outbox_lease_owner | no (`NOT VALID`) | NULL lease is explicitly allowed; non-NULL lease requires processing owner |
| production_fulfillment_job_owner | yes | rejected NULL lease on processing job |
| production_fulfillment_job_dispatch_lease | yes | rejected one-sided NULL dispatch fence |
| production_customer_ownership_state | yes | rejected active NULL customer user and rolled back the statement |
| assessment run requested/returned model checks | yes | table restricts model identity; RPC also rejects NULL completion model |

## Final classification

Confirmed successor-migration targets:

1. DB-01: explicit NULL lease rejection in logical fulfillment claim.
2. DB-02: explicit NULL caller-owner and stored-lease rejection plus null-safe owner comparison in logical fulfillment completion.
3. DB-03: explicit NULL lease rejection in notification claim.

Rejected as separate blockers: job/dispatch NULL lease, customer user NULL, model NULL, mismatched non-NULL owner, expired lease, and the other fenced completion/failure/mark paths. No migration was created or applied in M2-0.

