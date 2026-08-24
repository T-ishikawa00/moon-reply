# M2-B2-I2 Private Durable Dispatch / Payment Reconciliation

## Status and boundary

- Base authority: `release/private-ready@f0376ac87e3fb7b11ab525b958142d1fd7ba488b` after exact ff-only I1/I1-R2 integration and normal push.
- Task branch: `task/m2-b2-i2-private-recovery-schedulers-r1`.
- I1 integration deploy: `6a8bcb3131e9e0000898a260`, exact source `f0376ac`, successful, UNPUBLISHED, Auto Publishing Locked; 11 Functions and 1 Edge Function. Published source remains `0befd512219eb2897fb1edf969ad37d7e8c56b0d`.
- Current remote database is exact `0002..0019`; pending `0`, unknown `0`.
- Hardened 0018 Git-blob SHA-256 `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010` was later applied exactly once; the former candidate failed safely, rolled back, and was never recorded.
- 0019 Git-blob SHA-256 `b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c` was later applied exactly once after 0018.

## Contract inventory and 0019 decision

DB0016 already owns dispatch marker, owner, lease, retry-after, completion, attempt count, deterministic marker conflict, and post-router ambiguity quarantine. `claim_rc2_fulfillment_dispatch_v2` row-locks the job and returns `in_progress`, `retry_later`, `dispatched`, or `terminal` before any send; completion/failure are fenced by marker, exact owner, and live lease. Adding another dispatch table/RPC would create competing authority, so I2 adds only a bounded ID selector in source.

`production_payment_attempts` had no reconciliation owner, lease, retry-after, attempt budget, or durable stop marker. Two schedulers could therefore read the same Stripe Session, and failures had no durable no-infinite-retry contract. This proved 0019 necessary. It adds only reconciliation metadata plus two `SECURITY INVOKER`, empty-search-path, service-role-only RPCs:

- `claim_rc2_payment_reconciliation_batch_v1`: current attempt, state `pending|processing|unknown`, persisted Session, webhook grace, due retry, no stop, no active lease, remaining budget, deterministic `FOR UPDATE SKIP LOCKED` selection.
- `finish_rc2_payment_reconciliation_v1`: NULL-safe exact-owner/live-lease fence and one of `retry`, `stop`, or state-validated `settled`.

PUBLIC, `anon`, `authenticated`, and `m2_b2_stripe_ingress` receive no EXECUTE. The permanent I1 default-privilege rule remains effective: all new postgres-owned functions require explicit grants.

## I2-R1 Scheduled runtime artifact hardening

The reviewed I2 source had the same artifact defect class as the earlier Async Workloads incident. Exact `@netlify/zip-it-and-ship-it@15.4.0` ZIPs existed and passed `node --check`, but each Scheduled Function artifact contained two static `server-only` imports, contained no `node_modules/server-only` package, and failed dynamic import with `ERR_MODULE_NOT_FOUND`.

The fix preserves every Next boundary and splits only the Netlify-reachable graph:

- `async-workloads.ts`, `environment.ts`, `dispatch-scheduler-service.ts`, and `reconciliation-scheduler-service.ts` remain `server-only` wrappers for Next-owned callers.
- `async-workloads-runtime.ts` and `stripe-environment-runtime.ts` contain the sentinel-free runtime seams.
- `dispatch-scheduler-runtime-service.ts` and `reconciliation-scheduler-runtime-service.ts` compose only runtime-safe modules.
- The two Netlify entries import the runtime services directly.

The branch-independent Scheduled Function artifact smoke now packages the exact two functions into ZIPs, extracts them, runs `node --check`, dynamically imports each entry with all Production secrets empty, checks the exact manifest name/path/schedule, and rejects static `server-only` import/require or package leakage. Both artifacts pass with `server_only=0`, `importable=1`, and external operation counts `0`. I1-R3 changes only the pending 0018 event-trigger ACL compatibility block; 0019, scheduler fences/cadence, Stripe retry/timeout, and Async retry authority remain exact.

## Private dispatch scheduler

`production-fulfillment-dispatch-scheduled` runs every minute only after a future Production publish. Each invocation selects at most four verified-intent job IDs, ordered by due retry/creation/ID, excludes terminal/completed/future-retry/active-dispatch work, and then calls the unchanged DB0016 fence before same-site Async submission.

- No Stripe/API, Provider/OpenAI, worker execution, webhook logic, reconciliation, Checkout creation, or customer payload selection.
- Request overlap is harmless: two schedules and status polling can select the same ID, but one DB claim wins.
- Router failure before acceptance sets the existing 30-second retry-after.
- Router acceptance followed by completion ambiguity never calls fail/retry; the existing expired-lease path quarantines to manual review and never resends.
- After recorded router acceptance, Async Workloads remains the sole retry authority.
- Batch four plus a 22-second internal run budget stays below Netlify's 30-second Scheduled Function ceiling.

## Private reconciliation scheduler

`production-payment-reconciliation-scheduled` runs every five minutes only after a future Production publish. It claims at most four attempts, waits at least two minutes after the latest attempt update, and performs only a READ of the already persisted Checkout Session ID. Concurrency is two, the scheduler-specific Stripe client uses network retries `0` and timeout `5s`, and the durable budget is five reads.

Pending outcomes receive capped exponential backoff plus deterministic jitter. Transient read failures use the same bounded retry path. Missing/permanently invalid Session, invalid binding/economics, rejected evidence, or budget exhaustion sets a durable stop marker. Reserved attempts without Session and succeeded/failed/canceled attempts are never claimed. A crashed final lease is converted to stopped after expiry without another Stripe read.

The application reconciliation seam records through the existing `record_rc2_stripe_evidence_v2` authority with `dispatchFulfillment: false`. Thus the reconciliation scheduler cannot send Async work; the separate dispatch scheduler later sees the one durable fulfillment job. Existing customer/manual reconciliation retains its previous default immediate-dispatch behavior.

## Race and side-effect proof

- Dispatch: simultaneous two schedulers plus a status trigger produced router send `1`; repeated invocation after recorded completion produced send `0`.
- Pre-router failure: one failed send opened retry; retry before due sent `0`; after due one accepted send succeeded.
- Ambiguous acceptance: router accepted once, completion persistence failed, expired owner became manual review, and the second router send count stayed `0`.
- Reconciliation: actual two-client local claims against one due attempt produced winner `1` and durable attempt count `1`.
- Webhook during a live reconciliation lease produced `verified` then exact duplicate, verified Payment count `1`, fulfillment job count `1`, and no state regression. Webhook-before is excluded as terminal; reconciliation-before and webhook-after converge through the same unique evidence/Payment/job authority.
- No synthetic path called Checkout creation, a real Stripe endpoint, Async Workloads, Provider/OpenAI, email, or Purchase.

## Netlify schedule contract

The repository preserves the existing `production-fulfillment-background` `included_files` block byte-for-byte in meaning and adds only two named schedule declarations. Per current Netlify documentation, Scheduled Functions execute automatically only from a published Production deploy, are not available through a production function URL when configured as scheduled, and have a 30-second execution limit. Dashboard `Run now` remains a privileged operator action and is outside this task.

Official evidence: [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/), [Functions API and endpoints](https://docs.netlify.com/build/functions/api/), [Functions configuration](https://docs.netlify.com/build/functions/configuration/), and [file-based configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/).

## Local proof and regressions

- Fresh disposable local Supabase applied exact `0002..0019` successfully.
- I2 verifier: `15/15`, including DB/ACL proof and the branch-independent I1 privilege preflight.
- Scheduled Function artifact smoke: both exact ZIPs `syntax=1`, `importable=1`, `server_only=0`, expected schedule manifests present, external operations `0`.
- Separate actual two-client reconciliation claim: winner `1`.
- Applied 0018 identity and DB0017 immutable identity: exact.
- Required I1, B1, RC-2, RC-1, Background durability, Async artifact, runtime-assets, Product Intent, Clarification, typecheck, zero-warning lint, customer Production build, ingress independent build, and diff-check results are recorded in the final task report.
- Current Customer Auth behavior checks passed (`auth-entry-phase04` `11/11`; the foundation verifier passed its first 31 security assertions). The full historical foundation command then stopped at its literal old accepted-source diff pin because later accepted payment/repository work is intentionally present; that historical verifier was not weakened to manufacture a PASS.

## Rollback and stop boundary

0019 is immutable and remotely applied. Never edit/delete it or repair migration history; disable external ingress before disabling schedules, preserve durable payment/evidence/job rows, and use an append-only forward fix. Customer project visibility must remain Private.

DB foundation closure does not authorize any additional remote DB write/migration, credential/configuration write, Netlify ingress project creation, deploy/publish, Stripe endpoint/API/read/resend/Purchase, schedule activation/Run now, real Async event, Provider/OpenAI, email, or `main` change.
