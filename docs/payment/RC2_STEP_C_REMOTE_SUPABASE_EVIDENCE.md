# RC-2 Production Activation Step C — Remote Supabase Evidence

Status: `RC-2 Production Activation Step C implemented_pending_human_chatgpt_review`

Evidence date: `2026-08-20`

This is a sanitized technical evidence record. It contains no Supabase URL, project reference, Provider ID, credential, secret, secret prefix, connection string, or Customer row content.

## 1. Authority and execution boundary

- Starting Product authority: `release/private-ready` at `b8036a91b157870f038e2bf7d431bb0ca9e1795a`.
- Implementation branch: `task/rc2-activation-stepc-remote-supabase`.
- `main` remained `61e33a10e195fad17e253a6b9719217e1992f273`.
- `AUTH = PRESENT`.
- `REMOTE_PROJECT_IDENTITY = MATCH`.
- `DB_AUTH = READY`.
- Supabase CLI: temporary `npx` execution of exact version `2.115.0`; no repository dependency or global installation.
- Human amendment class C0 was applied exactly: remote history `0002..0003`; expected pending suffix `0004..0012`.
- Parent Sol was the only remote-write executor. Luna A/B/C were read-only and made no repository edits.

## 2. Pre-write schema consistency

Official linked migration history reported the exact contiguous applied set `0002, 0003` and no unknown or extra migration.

Read-only PostgreSQL catalog queries established:

- `assessment_requests`, `assessment_runs`, `assessment_stage_runs`, and `assessment_reports` existed with the expected columns, constraints, and indexes from `0002..0003`;
- RLS was enabled on all four tables and no table policy or user trigger was present;
- `finalize_completed_assessment` had the expected signature, definition, invoker-security posture, empty `search_path`, and ACL state;
- objects introduced by pending migrations `0004..0012` were absent; and
- migration history and material schema state were consistent.

`PREAPPLY_SCHEMA_CONSISTENCY = PASS`

`PRE_APPLY_SCHEMA_SNAPSHOT = NOT_AVAILABLE`

The schema-only dump was skipped after the official dump path proved unavailable in this environment. No Customer data dump or row export was attempted.

## 3. Dry-run and migration apply

The final official structured dry-run reported exactly:

`0004, 0005, 0006, 0007, 0008, 0009, 0010, 0011, 0012`

No unknown or extra migration was present. The exact-set gate passed before the write.

Parent Sol then invoked the normal linked Supabase migration push path exactly once. It applied exactly `0004..0012` and succeeded. There was no migration retry, repair, reset, down migration, `--include-all`, seed, or manual SQL workaround.

The post-apply linked migration history was exactly aligned through `0002..0012`.

`REMOTE_MIGRATION_HISTORY_0002_THROUGH_0012 = PASS`

## 4. Post-apply remote database proof

Read-only catalog verification established:

- all 22 expected public application tables exist: five assessment tables, seven RC-1 production tables, and ten RC-2 production tables;
- RLS is enabled on all 22 tables and no table policy exists;
- public, anon, and authenticated have zero table DML privileges;
- the five assessment tables have the exact `0012` service-role matrix: SELECT/INSERT/UPDATE without DELETE, except `assessment_reports`, which has SELECT/INSERT only;
- all required RC-1/RC-2 service-role capabilities are present;
- the four `0012` triggers exist, are enabled, bind to the expected tables/events, and call the expected functions;
- `production_verified_payments` has the independent environment/session CHECK;
- `record_rc2_stripe_evidence_v1` has the expected hardened signature, definition characteristics, invoker security, empty `search_path`, and ACL;
- `rc2_checkout_session_matches_environment_v1` and the other `0012` functions have the expected definitions, security posture, search path, and ACL.

Runtime-facing REST checks used `limit=0` against each of the 22 required assessment and production tables. All 22 calls succeeded and returned zero rows, proving table SELECT capability without reading Customer row content.

The four trigger controls are:

- Purchase Intent environment immutability;
- Payment Attempt environment binding;
- Verified Payment parent/environment/session binding; and
- Verified Payment immutability.

### Least-privilege review item

The remote Supabase defaults leave DELETE granted to `service_role` on all 17 RC-1/RC-2 production tables. The accepted `0010`/`0011` migrations grant narrower named privileges but do not first revoke the existing default service-role grant. The authorized Step C exact-matrix gate applies to the five assessment tables, and that matrix passed. No unauthorized ACL remediation was attempted. The broader production-table DELETE authority remains an explicit Human/ChatGPT least-privilege review item before runtime activation.

## 5. Pure helper RPC smoke

The existing secure local server key was used only after project identity matched. It remained process-only and was never printed or persisted.

| Synthetic input | Expected | Observed |
| --- | --- | --- |
| `test` + test-form Checkout identifier | true | true |
| `test` + live-form Checkout identifier | false | false |
| `live` + live-form Checkout identifier | true | true |
| `live` + test-form Checkout identifier | false | false |

`PURE_HELPER_RPC_TEST_LIVE_PREFIX_SMOKE = PASS`

No Purchase, Payment, Email, Assessment, or other synthetic remote row was inserted.

## 6. Repository regression evidence

- `verify:rc2`: `PASS 48/48`.
- `verify:rc1`: `PASS 14/14`.
- `verify:rc2:activation-preflight`: `PASS 15/15`.
- `verify:rc2:stepb`: `PASS 18/18`.
- typecheck: PASS.
- lint: PASS with zero warnings.
- production build: PASS with `38/38` static pages.
- Git diff checks: PASS.
- accepted migrations `0010`, `0011`, and `0012`: byte-identical to the starting authority.
- V17/Q0 Product semantics: byte-identical to the starting authority.
- `npm audit --omit=dev`: nonzero with exactly `3 high`; dependency closure remains a separate blocker and is not claimed.

## 7. External operation counters

| Operation | Count / result |
| --- | --- |
| Project-list read | 4 |
| Linked migration-history read | 8 |
| Schema-only dump attempt | 2; unavailable, no data dump |
| Read-only catalog query | 6 |
| Zero-row table SELECT capability call | 22; all PASS, zero rows returned |
| Dry-run invocation | 4; three official previews succeeded, one local wrapper failed before a usable CLI result |
| Actual migration push | 1; success |
| Pure helper RPC call | 4; read-only/pure |
| Capability-probe launcher | 2; first stopped locally before network because no environment was loaded, second completed the 22 calls |
| Project link | 0 |
| Migration repair / reset / down / manual SQL | 0 / 0 / 0 / 0 |
| Customer rows accessed | 0 |
| Remote non-migration writes | 0 |
| Stripe / webhook / Payment / Email / OpenAI Provider / deploy / remote flag or secret change / DNS | 0 |

## 8. Activation ceiling

Only remote Supabase migration alignment through `0012` is newly established. Production Payment is inactive; Stripe is not connected; no webhook is registered; Email Provider and actual Email are inactive; no actual Stripe Payment occurred; production runtime flags and remote application secrets are unchanged; PRIVATE RELEASE READY and Public Launch remain false.

Exact next action: Human/ChatGPT review this Step C candidate and explicitly disposition the production-table service-role least-privilege finding. Do not start Stripe, webhook, Email, OpenAI Provider, runtime activation, actual Payment, deployment, or release integration from this task.
