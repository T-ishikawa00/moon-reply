# RC-2 Production Activation Step D — Service-Role ACL Hardening Evidence

Status: `RC-2 Production Activation Step D Service-Role Least-Privilege Hardening implemented_pending_human_chatgpt_review`

Evidence date: `2026-08-20`

This record is sanitized. It contains no Supabase URL, project reference, access token, database password, service-role/secret key, Provider identifier, or Customer row content.

## 1. Accepted authority and scope

- Accepted Step C candidate: `d32b85347a5badb4955566008140bc2226e4c25f`.
- Step C acceptance commit: `403b9af17431bf7c18a4e28ddbe63889409dc10c`.
- `release/private-ready` was fast-forwarded to the same acceptance commit with no merge commit, squash, cherry-pick, or force.
- Step D branch: `task/rc2-service-role-acl-hardening`.
- New append-only migration: `supabase/migrations/0013_rc2_service_role_acl_hardening.sql`.
- Accepted migrations `0002..0012`, Product Runtime code, Q0, and V17 remain byte-identical.

## 2. Exact intended table authority

All 22 tables explicitly revoke every table privilege from PUBLIC, anon, authenticated, and service_role before narrow re-grants. RLS remains enabled on every table.

| Table | SELECT | INSERT | UPDATE | DELETE/TRUNCATE/REFERENCES/TRIGGER |
| --- | --- | --- | --- | --- |
| `assessment_requests` | yes | yes | yes | no |
| `assessment_runs` | yes | yes | yes | no |
| `assessment_stage_runs` | yes | yes | yes | no |
| `assessment_reports` | yes | yes | no | no |
| `assessment_clarifications` | yes | yes | yes | no |
| `production_preparations` | yes | yes | yes | no |
| `production_purchases` | yes | yes | no | no |
| `production_assessment_grants` | yes | yes | yes | no |
| `production_logical_assessments` | yes | yes | yes | no |
| `production_customer_deliveries` | yes | yes | no | no |
| `production_result_credentials` | yes | yes | yes | no |
| `production_notification_outbox` | yes | yes | yes | no |
| `production_email_verification_challenges` | yes | yes | yes | no |
| `production_verified_email_authorities` | yes | yes | yes | no |
| `production_trusted_email_sessions` | yes | yes | yes | no |
| `production_preparation_email_bindings` | yes | yes | yes | no |
| `production_purchase_intents` | yes | yes | yes | no |
| `production_payment_attempts` | yes | yes | yes | no |
| `production_verified_payments` | yes | yes | yes | no |
| `production_stripe_event_ledger` | yes | yes | yes | no |
| `production_fulfillment_jobs` | yes | yes | yes | no |
| `production_payment_adjustment_ledger` | no | no | no | no |

The accepted Runtime audit proved two narrower cases than the prior grant text:

- `production_purchases` is read/insert only; no accepted update path exists.
- `production_payment_adjustment_ledger` has no accepted Runtime repository or RPC operation, so service_role receives no table privilege.

`production_verified_email_authorities UPDATE` remains required. Accepted SECURITY INVOKER RPCs lock authority rows with `SELECT ... FOR UPDATE`. `production_verified_payments UPDATE` also remains required for accepted row-lock paths, while the immutable BEFORE UPDATE trigger continues to reject actual row mutation.

## 3. Migration creator and future defaults

Local and remote real-catalog proof identified one unambiguous application-table creator/owner role: `postgres`. The migration executor and session role matched that owner.

`0013` fails closed unless all 22 tables exist, share exactly one owner, and that owner is the current migration executor. It then removes PUBLIC/anon/authenticated/service_role table defaults for that actual role in schema `public`. It does not hardcode a platform role and does not grant future service-role authority. Future application migrations must grant required table privileges explicitly.

Remote pre-state default ACL evidence:

- global excess entries: `0`;
- public-schema excess entries for the covered roles: `24`;
- future service-role DELETE default entry: present.

Remote post-state default ACL evidence:

- global/public excess entries for PUBLIC/anon/authenticated/service_role: `0`.

## 4. Disposable local proof

- Supabase CLI: exact `2.115.0`, temporary `npx` execution.
- PostgreSQL: Supabase local PostgreSQL 17 line.
- Fresh repo-external workspace; no repo link metadata or remote credential was consumed.
- Repo-authoritative `0002..0013`: 12/12 copied byte-for-byte with no extra migration.
- `PASS_0002_THROUGH_0013_FRESH_APPLY`.
- Migration history: exact `0002..0013`.
- Actual catalog: exact service-role matrix PASS; RLS `22/22`.
- service_role DELETE/TRUNCATE/REFERENCES/TRIGGER: `0/22` for each.
- PUBLIC direct privileges: `0`; anon/authenticated effective privileges: `0`.
- creator/executor/session role match: PASS.
- default ACL catalog: PASS.
- Transactional future-table default probe: all covered role privileges absent; probe table removed.

An actual `service_role` transaction proved:

- preparation create/read/update;
- assessment request/run/stage, clarification, and report lifecycles;
- verified email authority, session, binding, and challenge lifecycles;
- Purchase Intent and Payment Attempt lifecycles;
- accepted Stripe evidence RPC -> Verified Payment -> fulfillment job;
- accepted job claim and verified-payment row-lock-dependent Grant/logical-assessment RPC;
- customer delivery, result credential, and notification outbox lifecycles;
- assessment and production DELETE attempts fail with insufficient privilege;
- `production_purchases` UPDATE fails with insufficient privilege;
- adjustment-ledger SELECT/INSERT/UPDATE fail with insufficient privilege because no accepted lifecycle exists;
- direct Verified Payment UPDATE reaches and is rejected by `RC2_VERIFIED_PAYMENT_IMMUTABLE`.

The runtime proof transaction was rolled back. Persisted application rows after proof: `0`.

The workspace was reset again from only the byte-identical repo migrations:

`PASS_0002_THROUGH_0013_FRESH_REPLAY`

Post-replay history, ACL, RLS, creator role, and default ACL remained PASS. The matching local containers, volumes, and network were stopped/removed: `0 / 0 / 0` remain.

## 5. Remote pre-write gate and apply

- `AUTH = PRESENT`.
- `REMOTE_PROJECT_IDENTITY = MATCH`.
- Pre-state migration history: exact `0002..0012`.
- Application tables: `22`; RLS: `22/22`; creator/owner role count: `1`.
- Assessment matrix: exact.
- Known production overgrant reproduced: DELETE/TRUNCATE/REFERENCES/TRIGGER each present on `17/17` production tables.
- PUBLIC table privilege count: `0`; anon/authenticated effective privilege count: `0`.
- `0012` functions/triggers/CHECK: present.
- Official dry-run pending set: exact `0013` only.

Sol invoked the official linked migration push exactly once with Vault changes skipped. The command exited successfully. Its structured success payload did not enumerate the filename, so no retry was attempted; the immediately following official history query established exact `0002..0013`.

`REMOTE_MIGRATION_HISTORY_0002_THROUGH_0013 = PASS`

## 6. Remote post-apply proof

- Exact service-role matrix: PASS across 22/22 tables.
- service_role DELETE: `0/22`.
- service_role TRUNCATE: `0/22`.
- service_role REFERENCES: `0/22`.
- service_role TRIGGER: `0/22`.
- PUBLIC direct privileges: `0`.
- anon/authenticated effective privileges: `0`.
- RLS: `22/22`.
- Default privilege hardening: PASS; excess default entries `0`.
- `0012` functions: `6/6`, SECURITY INVOKER, empty `search_path`, service-role EXECUTE, anon/authenticated denial.
- `0012` triggers: `4/4`, enabled.
- Verified Payment CHECK: present/validated.
- Verified Payment UPDATE ACL: present.
- Verified Payment immutable BEFORE UPDATE trigger: present/enabled.
- Customer data read: `0`; synthetic remote rows: `0`; remote non-migration writes: `0`.

## 7. Verification and blockers

- `verify:rc2`: `PASS 48/48`.
- `verify:rc1`: `PASS 14/14`.
- `verify:rc2:activation-preflight`: `PASS 15/15`.
- `verify:rc2:stepb`: `PASS 18/18`.
- `verify:rc2:acl-hardening`: `PASS 14/14`.
- typecheck, zero-warning lint, production build, and Git diff checks: PASS.
- `0002..0012`, especially `0010`/`0011`/`0012`: immutable.
- V17/Q0: immutable.
- `npm audit --omit=dev`: nonzero with exactly `3 high`; no dependency remediation was attempted.

## 8. Operation accounting and activation ceiling

Remote Supabase operations in Step D:

- project-list identity read: `1`;
- migration-history reads: `3` total; one pre-state parser-only failure, one successful pre-state read, one successful post-state read;
- linked catalog query invocations: `5`; one SQL alias parse failure before execution, four successful read-only proofs;
- dry-run: `1`, exact `0013`;
- migration apply: `1`, success;
- link / repair / remote reset / manual SQL write: `0 / 0 / 0 / 0`;
- Customer-row read / synthetic remote row write / remote non-migration write: `0 / 0 / 0`.

Local-only proof accounting:

- stack-start invocations: `2`; one pre-migration PATH failure, one success;
- local reset invocations: `3`; one initial draft audit cycle, one final fresh apply, one final clean replay;
- actual service-role runtime transaction: `1`, rolled back;
- Customer/Provider operations: `0`.

Stripe API/Dashboard, Payment/charge, webhook registration, Email, OpenAI Provider, Netlify deploy, runtime flag activation, remote application secret change, DNS, Public Launch, PR, and main merge all remain `0`.

Production Payment, Stripe, webhook, Email, OpenAI paid flow, PRIVATE RELEASE READY, and Public Launch remain inactive or false. Exact next action: Human/ChatGPT review Step D. Dependency remediation and every Provider/runtime activation remain outside this task.
