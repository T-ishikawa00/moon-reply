# F004 — Release R1 local cutover safety

Date: 2026-09-07 JST. Scope: F004 only. Technical verification does not authorize Production operations.

Successor: [0032 non-superuser compatibility](F004_PRIVILEGE_COMPATIBILITY_2026-09-07.md) replaces the custom-GUC implementation after its Production transaction rolled back with SQLSTATE 42501. This historical report's local install used superuser authority; its 18/18 result did not establish non-superuser installation. The successor records the corrected unapplied artifact and mandatory three-layer verification.

## Authority

Start: `release/private-ready@7ccfc2a4b563f9a355815075dff6e38fd1228077`, worktree clean, stash 0. Current Git, source, migrations and local verifiers are the implementation authority.

Human supplied the following Production facts in this task; they were not queried or revalidated here: Published `63520234267af67f319f1eb7b7999498239a3909`; Netlify/Supabase target match; migrations 0002–0023 applied and 0024–0031 unapplied; one successful LIVE payment of JPY980, no refund; verified payment/job/completed job/delivery/sent notification each 1; incomplete job/unsent/processing/failed/attempted-unsent/stopped-unresolved each 0. These aggregate facts do not establish a sent notification's individual attempt count. Migration 0032 checks that condition atomically rather than assuming it.

This record supersedes only the F004 old-sender hold/drain procedure in the historical [R1.1 review](../payment/F004_REMEDIATION_R11_VERIFICATION_ROLLOUT.md). Other Findings, Product, Safety, Payment, Quality and explicit identity-detachment semantics are unchanged.

## Why 0024 was insufficient

0024 preserves the existing v2 claim for unversioned pending notifications. Its old-worker guard only rejects already-versioned rows. The exact published application creates a token after an acquired claim and revokes it in its send/completion catch block. Thus 0024 alone neither prevents a new legacy send nor protects a sent legacy URL from a delayed completion-acknowledgement failure.

The normal fulfillment dispatch selector omits completed jobs. Old queue events can exhaust their existing eight retries while notification admission is held; a DB claim fence alone would preserve data without providing a deployment-gap recovery path. Earlier local F004 tests covered immutable new identities and old v2 versus versioned rows, not this cutover invariant. Their historical PASS remains valid only for that narrower scope.

## Implementation and successful-cutover invariant

Only 0032 is new. Migrations 0002–0031 are byte-unchanged. Apply R1 migrations in order **0024 → 0025 → 0026 → 0027 → 0028 → 0029 → 0030 → 0031 → 0032**, then publish the compatible runtime.

0032 locks outbox and credentials in one transaction with a five-second lock timeout. It accepts only pristine, unclaimed pending rows without a notification credential, or legacy sent rows with exactly one claim, exactly one active notification credential, and a completed acknowledgement. Any versioned prehistory, attempted unsent state, processing state including expired/NULL lease, multiple-attempt sent state, missing/revoked/expired credential, or inconsistent legacy shape causes the entire 0032 transaction to fail. No row is converted, repaired, deleted, or placed into manual review by that failure.

After a successful 0032 commit:

- Old v1 returns no claim. Old v2 returns `in_progress` for every unsent row and `sent` for a sent row. The exact published caller exits before credential creation, send, failure mutation or manual-review conversion.
- A row trigger also fences an old SQL body already executing before function replacement. Only a claim that increments the new generation atomically with a v3 identity may acquire or reclaim processing ownership. Replacing the function alone is not the proof.
- Existing sent legacy credentials gain a protection marker. A service-role direct automatic revoke is rejected, including an old UPDATE waiting behind the migration lock. Token hash, expiry, existing revocation and canonical payload values are not rewritten.
- The existing `detach_production_customer_identity_v1` keeps its body, invoker authority, ACL and search path. A function-local setting preserves its intentional credential revocation and identity removal, and is restored on success and exception. Explicit owner revocation remains available. This setting distinguishes existing trusted runtime paths; it is not an authentication boundary against arbitrary privileged SQL.
- New v3 claims preserve the 0024 credential, payload, ownership and send-outcome behavior. One untouched pending row is handed back to the existing completed-job worker at most once per minute globally, with a five-minute per-row transport reservation. Least-recent handoff ordering prevents starvation. Only matching-environment, verified, canonically bound completed jobs qualify.
- Recovery does not claim the notification, change its attempts/state, or create a token. It submits the existing job ID. The completed-job application branch processes only the notification and returns before grant creation or assessment execution. A lost enqueue acknowledgement leaves the same pending row eligible after its reservation expires. New sender admission ends eligibility for this lane.

This replaces Human proof of total old-process termination with a **successful atomic DB cutover**. It cannot cancel a network send whose old claim was already acquired; such unresolved history makes migration fail closed. On preflight/lock failure, stop before new runtime publication. Do not reset leases, discard queues, force sent state, weaken the preflight or apply the runtime anyway.

## Local verification

All test/build children use sanitized process environments; no environment file is changed. External network attempts are blocked. PostgreSQL tests use owned disposable PostgreSQL 17 clusters on loopback and stop them in `finally`.

| Check | Result |
| --- | --- |
| Focused runtime, exact old Git application/repository/worker plus current runtime | 15/15 PASS |
| Focused actual 0002–0032 PostgreSQL chain | 18/18 PASS |
| Existing F004 immutable-identity fake / DB verifiers | 26/26 and 16/16 PASS in cumulative run |
| Relevant cumulative Waves 1–3 plus cutover | 42/42 verifiers PASS; external attempts 0 |
| Typecheck / lint | PASS / PASS, warnings 0 |
| Offline Next build / final diff check | PASS, static generation 47/47 and external attempts 0 / PASS |

Focused coverage includes pre/post-cutover pending, old worker attempts 0–8 with no new runtime, old/new concurrency, old claim and revoke waiting on the migration lock, acquired-old-claim preflight rejection, unknown send and queue acknowledgement, completion acknowledgement loss, immutable canonical result and URL, exact intentional detach success/exception behavior, ACL, environment/authority exclusion, fairness, bounded hung handoff, and retained-schema forward fix. Local assertions: old sends 0, notification loss 0, duplicate effective fake delivery 0, token regeneration 0, assessment regeneration 0. Initial token issuance by the new sender occurs once as expected.

Reproduce with `node scripts/verify-remediation-wave3.mjs`. Cumulative logs: `C:/Users/PUBLIC_USER/AppData/Local/Temp/moon-reply-wave3-regression-xCfJ8t`. The final focused DB run additionally tightens the migration-lock test to include the delayed old revoke. Test scripts remain the durable evidence if temporary logs expire.

The first Email verifier run failed two historical shape assertions: migration inventory excluded 0032 (`verify-rc2-resend-email-provider.mjs`, prior line 576), and the Wave 3 evidence helper required current runtime to equal `864aa146...` (prior helper line 84). Classification B: exact authorized successor mismatch, not a behavior or security failure. E3 and I4 share the same inventory contract. The update retains every historical fixed SHA/blob, pins the pre-cutover `7ccfc2a4...` authority, and permits only the literal 0032 blob and three exact runtime blobs. No wildcard or current-HEAD fallback was introduced.

Fake idempotency does not establish an external provider's retention period or unlimited-time exactly-once delivery. Already-attempted new notifications retain their existing retry/unknown/manual-review behavior; F002 terminal-obligation policy is not expanded by this cutover lane.

## Future Production order — requires one separate authorization

1. Authorize the exact final local source SHA, 0024–0032 and the R1 configuration together. Use the Human-confirmed target/baseline. If either has changed at execution, stop and reconcile the difference rather than treating this evidence as timeless permission.
2. Stop only new Checkout admission with `PAYMENT_PRODUCTION_ENABLED=false`, and verify the stop is effective. If a configuration rebuild is required, use the existing Published source for that stop before migrating. Keep webhook, reconciliation, paid fulfillment, result/account access and email processing available. Do not use `PAYMENT_EMERGENCY_STOP` or stop/delete the existing paid queue.
3. Stage the R1 bootstrap values below and the previously required R1 settings. Preserve `EMAIL_ADDRESS_ENCRYPTION_KEY`, verification pepper and delivery configuration. No additional F004 environment variable or scheduler is introduced; recovery uses the existing fulfillment scheduler gate, payment-processing gate, `PAYMENT_PROVIDER_ENVIRONMENT` and Async Workloads dispatch configuration.
4. Apply only 0024–0032 in numeric order to the authorized target. 0032 must commit with its automatic preflight, claim-generation trigger, legacy URL guard, scoped detach configuration and service-only recovery RPC intact. Failure means STOP; pending and canonical records are retained. No linked CLI query or temporary credential acquisition is part of this procedure.
5. Publish the exact reviewed R1 runtime with Sales Stop still effective. Keep the existing encryption key. Old senders may remain alive; successful 0032 makes their subsequent claims non-mutating. Retain all queued events. Verify new scheduler/router/worker registration and that newly enqueued events reach the new runtime.
6. Run the authorized no-purchase smoke: homepage, login, Google/OTP entry, preparation, Account, stopped Checkout admission, result access boundaries, security headers and runtime health. Observe natural scheduler/worker execution and count-only pending/sent/error outcomes. Do not trigger a paid assessment, manual resend or token recreation as smoke. Recovery reports only `idle`, `enqueued` or `deferred`; no customer payload is returned in diagnostics.
7. Reopen new Checkout only after source/schema/config pairing and the existing-paid paths pass. Observe pending age/count, actual new sender uptake, send outcomes, canonical/delivery counts and F004 safe codes. Existing purchase proof is Human historical evidence; a fresh end-to-end purchase remains unproved without a separately authorized real purchase.

R1 bootstrap caps supplied by Human, unchanged by this fix:

| Exact name | Value |
| --- | --- |
| `ANONYMOUS_ADMISSION_IP_SOURCE` | `netlify_context` |
| `ANONYMOUS_ADMISSION_WINDOW_SECONDS` | `600` |
| `ANONYMOUS_ADMISSION_MAX_REQUESTS_PER_IP` | `120` |
| `ANONYMOUS_ADMISSION_MAX_REQUESTS_GLOBAL` | `1200` |
| `ANONYMOUS_ADMISSION_MAX_INTAKES_PER_IP` | `30` |
| `ANONYMOUS_ADMISSION_MAX_INTAKES_GLOBAL` | `300` |
| `PREPAYMENT_GLOBAL_COMPUTE_WINDOW_SECONDS` | `86400` |
| `PREPAYMENT_GLOBAL_COMPUTE_MAX_PROVIDER_INVOCATIONS` | `100` |
| `PREPAYMENT_GLOBAL_COMPUTE_MAX_CONCURRENT` | `2` |

No new code contradiction was found with these bootstrap values. This task does not retune them or establish a permanent capacity recommendation.

## Retained-schema rollback and forward fix

Retain 0024–0032, all notification IDs, credentials/ciphertexts, canonical records, cutover markers and queue evidence. Never restore v1/v2 send admission or drop/rewrite durable identities. An old-runtime rollback keeps notifications held and can delay email; it does not resume an old sender. Restore a compatible v3 runtime/router by forward fix. Untouched pending notifications remain discoverable even if old events expired; already-attempted notification recovery retains its existing contract and is not silently reset. Keep encryption-key continuity through any runtime or configuration rollback. Intentional customer identity detachment and explicit security revocation remain valid operations.

Local commit is permitted only after Technical PASS. No Production connection, remote query/apply, external read/write, provider execution, environment change, push or deploy was performed. `C:/tmp/mrexp-e98` was not accessed or changed.
