# M2-B2-I1 Public Stripe Ingress / Least-Privilege DB Authority

## Status and boundaries

- Base authority: `release/private-ready@7b850ff9b2c2188691605797983202416ddc5d88` after the reviewed B2 design was integrated by exact fast-forward and normally pushed.
- Task branch: `task/m2-b2-i1-public-ingress-authority-r1`.
- Candidate migration: `supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql`.
- I1-R3 hardened candidate Git-blob SHA-256: `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010`.
- I1-R2 SHA `53cd8f20be9a50569060f6566d04092bbe4613366c543e1d3b0643e3fd2c7805` failed safely at the remote least-privilege guard and rolled back; it is superseded, not recorded, and must not be retried.
- Superseded pre-review candidate SHA-256: `8c16d8c84390890141b6c30217a4777f9c18758ab720ca4a396b5d834415bd2c`. It was never remotely applied and is not an action-time artifact.
- Current remote database is exact `0002..0019`; pending `0`, unknown `0`. Revised 0018 and unchanged 0019 were later applied exactly once in one reviewed successful push. The earlier 0018 transaction remains historical safe-rollback evidence and was never recorded or retried.
- The ingress role remains `PASSWORD NULL`. Netlify ingress project/config/visibility/write/publish, Stripe endpoint/API/resend/Purchase, Async event, Provider/OpenAI, email, and `main` operations remain `0` after DB closure.

## Exact architecture

The customer project remains Private. A later, separately authorized Netlify project will build only `services/stripe-webhook-ingress/` and expose one custom `POST /api/payments/stripe/webhook` function. It reads at most 1 MiB as raw bytes once, verifies `Stripe-Signature`, converts a supported event into minimized evidence, and connects through a dedicated Postgres login to one private wrapper. The wrapper revalidates the current Purchase Intent, Payment Attempt, Checkout Session, environment, Stripe provider, one-time product, JPY 980 economics, and event disposition before delegating to `public.record_rc2_stripe_evidence_v2`.

The ingress returns `2xx` only for a safely ignored valid-but-unsupported event or after the durable wrapper transaction commits. It never waits for fulfillment and never sends an Async event. I2 will separately own Private-project durable dispatch; reconciliation scheduling is also out of I1.

## Current exposed schema inventory

The official read-only Management API was queried on 2026-08-24. Current PostgREST `db_schema` is exact `public,graphql_public`; `db_extra_search_path` is exact `public, extensions`. The new `private_payment_ingress` schema is absent from both sets. It is therefore not a Data API schema and cannot be invoked through Supabase REST/RPC.

## Role and wrapper authority

`m2_b2_stripe_ingress` is created as `LOGIN PASSWORD NULL`, `NOINHERIT`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `NOBYPASSRLS`, with connection limit `4`, empty default search path, five-second statement/idle-transaction limits, and a two-second lock timeout. No real or synthetic credential appears in the migration; later password provisioning is a separate Human secret operation.

| Surface | Effective application authority |
| --- | --- |
| Private schema | Direct `USAGE` on `private_payment_ingress` only |
| Wrapper | `EXECUTE` only on `record_stripe_webhook_evidence_v1` |
| Public application tables/views/sequences | `0` SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER |
| Other `public` or private-ingress functions | `0` EXECUTE, including inherited `PUBLIC` function grants |
| Wrapper for `PUBLIC`, `anon`, `authenticated`, `service_role` | `0` EXECUTE |
| Schema creation | `0` CREATE on both `public` and `private_payment_ingress` |
| Future postgres-owned functions | Built-in global `PUBLIC EXECUTE` removed; explicit grant required |
| Role attributes | superuser/bypassrls/createdb/createrole/replication/inherit all false |

PostgreSQL's standard `PUBLIC` pseudo-role still gives all database roles effective `USAGE` on schema `public`; the ingress receives no direct grant there and has zero application relation or non-target function privilege behind it. Removing that cluster-wide schema grant would be a separate cross-runtime ACL change and is intentionally not smuggled into I1. Local catalog proof distinguishes this inherited name-resolution permission from usable object authority.

The pre-review 0018 was locally exploitable through PostgreSQL's separate built-in function default: a postgres-owned canary created without an explicit REVOKE was immediately executable by the ingress role in both `public` and `private_payment_ingress`. Schema-scoped default REVOKEs alone reproduced the same `true/true` result because PostgreSQL cannot use a per-schema default to subtract the built-in global grant. I1-R2 therefore applies the required global future-only `ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`, plus schema-scoped REVOKEs to clear any additive defaults. The unavoidable bounded consequence is that every future postgres-owned function, in any schema, requires an explicit grant; this is a future migration contract.

I1-R3 addresses one reviewed existing-function exception discovered by the safe remote rollback: remote-only `public.rls_auto_enable()` carried PUBLIC EXECUTE. Candidate 0018 now fail-closed verifies its exact routine/body/ACL and `ensure_rls` event-trigger binding, then removes only the PUBLIC grant. Explicit `postgres`, `anon`, `authenticated`, and `service_role` grants and event-trigger behavior remain unchanged. The least-privilege guard has no event-trigger exemption. Canonical evidence: `docs/m2/M2_B2_I1_R3_REMOTE_EVENT_TRIGGER_ACL_COMPATIBILITY.md`.

The wrapper is `SECURITY DEFINER`, owned by `postgres`, has `SET search_path = ''`, schema-qualifies every application relation/function, and hard-codes `evidence_source = 'webhook'`. The caller cannot provide durable IDs, processing time, source, application disposition, customer identity, grant, result, or worker authority. The wrapper returns only a bounded disposition string and never stores raw body, signature, endpoint secret, or customer content.

## Signature and HTTP proof

Synthetic tests cover valid, missing, wrong, expired/old, whitespace mutation, key-order mutation, encoding mutation, oversize, non-POST, valid unsupported, environment mismatch, and durable commit failure. Results:

- valid supported input: signature verified, one recorder call, `200` only after it resolves;
- missing/wrong/old or any byte mutation: `400`, DB calls `0`;
- oversize: `413`, DB calls `0`; non-POST: `405`, DB calls `0`;
- valid unsupported event: existing behavior preserved as `200 / ignored`, DB calls `0`;
- configured/evidence environment mismatch: `400`, DB calls `0`;
- DB failure before commit: non-2xx (`500`), no false acknowledgment.

The current customer webhook route remains byte-unchanged. Its environment reader still requires the current Checkout key as before cutover; only the reusable verifier constructor no longer consumes that key. RC-2 `50/50`, including raw-body response shape/idempotency/offline boundaries, passed.

## Database atomicity proof

A fresh, unlinked, disposable Supabase applied exact migrations `0002..0018`. One initial candidate apply rolled back before commit because the migration self-check counted Supabase internal-schema privileges; the check was narrowed to the intended `public` application surface, the disposable stack was destroyed/recreated, and exact `0002..0018` then applied successfully. No remote retry or remote operation occurred.

The rollback-only sequential matrix proved:

- first valid success `verified`; exact replay `duplicate`;
- a second event ID for the same provider payment `duplicate`;
- wrong environment, amount, currency, Checkout Session, and Purchase binding all `rejected` before ledger/payment/job mutation;
- failure before success becomes `failed -> verified` with one Payment/job;
- success before failure returns `stale` and remains verified;
- a different provider Payment on an already verified intent returns `conflict`, moves only that intent to manual review, and creates no second Payment/job;
- direct SELECT/UPDATE and non-target RPC execution by the dedicated role fail with insufficient privilege.

Two independent local clients then invoked the same event concurrently and returned exact `verified 1 / duplicate 1`. Catalog verification found event ledger `1`, verified Payment `1`, fulfillment job `1`, and terminal verified intent `1`.

I1-R2 privilege proof first reproduced the old candidate exploit as `public=true / private=true`; applying only the two schema-scoped default REVOKEs remained `true / true`. The global future-default hardening produced `false / false`, preserved existing function ACL/effective-authority drift at `0`, kept target-wrapper EXECUTE `true`, and proved that an explicit grant is required and effective for a new function. The reusable catalog-only preflight is branch-independent and checks target/non-target function authority, application relations/sequences, schema CREATE, and global/schema default ACLs after every future migration.

## Connection and secret boundary

The deployable adapter accepts only a Supavisor transaction-pooler URL (`*.pooler.supabase.com:6543`) with exactly one `sslmode=verify-full` query and no other query parameter. `STRIPE_INGRESS_DATABASE_CA_PEM` is mandatory, must contain actual-newline, currently valid CA certificates, and is parsed before connection. The postgres.js TLS object independently pins that CA, sets `rejectUnauthorized: true`, supplies the validated pooler hostname as SNI/server identity, and uses Node's built-in hostname check. Missing/malformed/expired CA, `require`, `disable`, absent/duplicate mode, and wrong hostname fail closed; `rejectUnauthorized=false` is absent from source and artifact. The adapter also enforces one connection per invocation, five-second connection/statement timeout, two-second lock timeout, one-second idle/end timeout, 60-second maximum lifetime, disabled prepared statements for transaction mode, disabled type-fetch queries, no retry loop, and `finally` cleanup. The DB role adds a global connection limit of four.

Exact ingress secret allowlist:

1. `PAYMENT_ENVIRONMENT`
2. `STRIPE_WEBHOOK_ENABLED`
3. `STRIPE_WEBHOOK_SECRET`
4. `STRIPE_INGRESS_DATABASE_URL`
5. `STRIPE_INGRESS_DATABASE_CA_PEM`

The built ingress artifact contains none of `STRIPE_SECRET_KEY`, Supabase secret/service-role key names, OpenAI, Resend/email, encryption/auth/session/capability, Async Workloads, customer routes, Review, Checkout creation, Provider, or worker imports. Its publish directory is empty; no root/static/proxy/redirect surface exists.

## Verification

- New I1-R2 verifier: PASS `15/15`.
- Disposable DB: fresh `0002..0018`, role/ACL/default-ACL/schema-CREATE, future-function canary, sequential atomicity/order/conflict, invalid zero-effect, and concurrent duplicate PASS.
- Current Customer Auth disposable DB: expiry/replay/CSRF, binding, Payment-to-Grant, mixed lane, Customer isolation, detach, ACL/RLS PASS.
- M2-B1: PASS `15/15` in an isolated exact historical verifier clone; the current task correctly fails its literal branch/authority pins and the verifier was not weakened.
- RC-2: PASS `50/50`; RC-1: PASS `19/19`; Background durability: PASS `21/21`.
- Async graph/artifacts and runtime-assets: PASS (`104` modules / `352` edges; generated router/background importable; configured `97`, required `81`, missing `0`).
- Product Intent `18/18`, Clarification `7/7`, Auth entry `11/11` PASS.
- Root typecheck, zero-warning lint, Production build `38/38`, ingress typecheck/build, and `git diff --check` PASS.
- The historical M2-A1 verifier remains branch/authority pinned and was not modified. Exact DB0017 remained byte-identical, fresh-applied before 0018, and its current local DB compatibility matrix artifact remains in the unchanged repository.

Next.js and `eslint-config-next` remain `16.3.0`. SEC-01 evaluation remains a separate task after the scheduled official 2026-08-26 release and before any next customer Production Publish.

## Stop and next action-time gates

0018 is immutable and remotely applied. Any future defect requires an append-only forward fix; never edit/delete 0018 or repair history. Separate Human confirmation and review remain required before ingress credential assignment, Netlify project/build setting/effective-env/visibility/secret/deploy/publish, Stripe endpoint/secret/event operation, schedule activation, or real reconciliation read. Revoke the dedicated credential/endpoint while preserving durable evidence rows if activation later fails.
