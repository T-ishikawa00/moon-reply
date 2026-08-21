# RC-2 Production Activation Runbook

<!-- CUSTOMER-AUTH-CLEAN-CUTOVER-R2:BEGIN -->
## Customer Auth clean-cutover activation gate — not executed

- Foundation R2 selects one Customer-facing identity regime: `CUSTOMER_AUTH_ENABLED=false` permits the accepted legacy lane; `true` requires Supabase Customer Auth for every new paid flow and blocks new legacy verification start/completion.
- Before enabling Auth remotely, run a separately authorized read-only inventory of `production_email_verification_challenges`, `production_verified_email_authorities`, `production_trusted_email_sessions`, `production_preparation_email_bindings`, `production_purchase_intents`, `production_verified_payments`, `production_assessment_grants`, and `production_customer_deliveries`.
- Required clean prelaunch result: no real Customer-owned legacy Purchase requires recovery. Any contrary row/state is a hard STOP; keep Auth disabled and design a separate accepted legacy recovery transition.
- The dual-lane schema remains for historical compatibility, append-only migration safety, and rollback/forward recovery. Existing `/result/[token]` remains governed by its own bearer credential authority.
- This R2 task performs remote inventory `0`, remote migration `0`, Auth configuration `0`, and runtime flag change `0`.
<!-- CUSTOMER-AUTH-CLEAN-CUTOVER-R2:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-E:BEGIN -->
## Step E — Transactional Email Provider Implementation (Resend)

Status: `RC-2 Production Activation Step E Transactional Email Provider Implementation implemented_pending_human_chatgpt_review`

- Dependency remediation was accepted and ff-only integrated at `243e8655098ba9e0972e0e1efd68f83fbc2ded30`; Step E branch `task/rc2-resend-email-provider` starts from that exact release.
- Exact stable SDK: `resend@6.20.0`; production/full audits both `0 vulnerabilities`.
- Server-only adapter: exact provider value `resend`, generic `EMAIL_API_KEY`/`EMAIL_FROM_ADDRESS`/`EMAIL_FROM_NAME`, validated sender, safe fail-closed configuration, and unsupported-provider rejection.
- Durable idempotency: existing `messageIdempotencyKey` is forwarded unchanged as the SDK `idempotencyKey`; no second identity and no hidden adapter retry.
- Customer content: separate Japanese verification/result text plus minimal HTML; verification contains only code/expiry/share warning, while result contains only 鑑定ノート readiness/protected URL/access guidance. Consultation, Candidate, assessment body, decision, and relationship detail remain absent.
- Provider success requires a valid message ID and returns only `providerMessageReference`; mailbox/result failures map to the existing narrow delivery codes.
- Focused fake/verifier `14/14`; RC-2 `48/48`; RC-1 `14/14`; activation `15/15`; Step B `18/18`; ACL `14/14`; typecheck, zero-warning lint, build `38/38`, unchanged route inventory, diff, migration `0002..0013`, and V17/Q0 checks PASS.
- `.env.example` remains inactive: provider `unconfigured`, credentials blank, every production activation flag false.
- Resend API/account/real Email, Supabase remote, migration apply, Stripe/Payment/webhook, OpenAI Provider, deploy, runtime flag/remote secret/DNS change, PR, main merge, and Public Launch: `0`.
- `release/private-ready` remains `243e8655098ba9e0972e0e1efd68f83fbc2ded30` and does not include Step E. `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`.

Sanitized evidence: `docs/payment/RC2_STEP_E_TRANSACTIONAL_EMAIL_PROVIDER_EVIDENCE.md`.

Exact next Human action: review Step E. After acceptance, separately authorize Resend account/sender configuration and the first bounded email test. Do not configure Stripe or send a real email from this task.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-E:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-D:BEGIN -->
## Step D — Service-Role Least-Privilege Hardening

Status: `RC-2 Production Activation Step D Service-Role Least-Privilege Hardening implemented_pending_human_chatgpt_review`

Step C is `accepted_complete` at release authority `403b9af17431bf7c18a4e28ddbe63889409dc10c`. Step D adds only append-only `0013_rc2_service_role_acl_hardening.sql`, its static verifier, and sanitized evidence/status documentation.

- Actual local/remote migration and application-table creator role: one unambiguous `postgres` owner matching the migration executor/session.
- Existing 22 tables: explicit revoke-all for PUBLIC/anon/authenticated/service_role, followed by the exact audited service-role matrix.
- Final matrix: 18 tables SELECT/INSERT/UPDATE; three tables SELECT/INSERT; `production_payment_adjustment_ledger` no service-role privilege.
- All 22 tables: service-role DELETE/TRUNCATE/REFERENCES/TRIGGER `0`; PUBLIC/anon/authenticated authority `0`; RLS `22/22`.
- `production_verified_email_authorities` and `production_verified_payments` retain UPDATE ACL solely because accepted SECURITY INVOKER RPCs use `SELECT ... FOR UPDATE`; Verified Payment direct mutation remains rejected by the immutable trigger.
- Future public-schema defaults for the actual creator role no longer grant table authority to PUBLIC/anon/authenticated/service_role.
- Disposable local final proof: `PASS_0002_THROUGH_0013_FRESH_APPLY`, actual service-role runtime regression PASS, and `PASS_0002_THROUGH_0013_FRESH_REPLAY`.
- Remote pre-state: exact `0002..0012`; dry-run: exact `0013`; one official apply; post-state exact `0002..0013`.
- `REMOTE_MIGRATION_HISTORY_0002_THROUGH_0013 = PASS`.
- Remote post-state: exact 22-table matrix, default ACL, RLS, and unchanged `0012` triggers/CHECK/RPC all PASS.
- Customer data read, synthetic remote rows, and remote non-migration writes: `0 / 0 / 0`.
- Remaining dependency blocker: `npm audit --omit=dev` exactly `3 high`.

Sanitized evidence: `docs/payment/RC2_STEP_D_SERVICE_ROLE_ACL_HARDENING_EVIDENCE.md`.

Production Payment, Stripe, webhook, Email, OpenAI Provider, runtime activation, deploy, DNS, PRIVATE RELEASE READY, and Public Launch remain inactive or false. Exact next action: Human/ChatGPT review Step D; do not start dependency remediation or Provider/runtime activation.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-D:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-C:BEGIN -->
## Step C — Remote Supabase State and Authorized Migration Apply

Status: `RC-2 Production Activation Step C implemented_pending_human_chatgpt_review`

On `2026-08-20`, Human authorization amendment C0 accepted the independently verified remote state `0002..0003` and authorized the exact pending suffix `0004..0012`, subject to pre-write schema consistency and exact dry-run gates.

- Starting authority: `release/private-ready` at `b8036a91b157870f038e2bf7d431bb0ca9e1795a`.
- Branch: `task/rc2-activation-stepc-remote-supabase`.
- `AUTH = PRESENT`; `REMOTE_PROJECT_IDENTITY = MATCH`; `DB_AUTH = READY`.
- Pre-write catalog consistency for the accepted `0002..0003` schema: PASS.
- Conflicting later-migration objects before apply: none.
- `PRE_APPLY_SCHEMA_SNAPSHOT = NOT_AVAILABLE`; no Customer data dump or row export occurred.
- Official dry-run exact pending set: `0004, 0005, 0006, 0007, 0008, 0009, 0010, 0011, 0012`.
- Official linked migration push: exactly one invocation, applying exactly `0004..0012`, PASS.
- Post-apply history: exact `0002..0012`; `REMOTE_MIGRATION_HISTORY_0002_THROUGH_0012 = PASS`.
- Required assessment, RC-1, and RC-2 tables; 22/22 zero-row table SELECT capability calls; RLS; assessment service-role ACL; anon/authenticated denial; `0012` triggers and CHECK; hardened Stripe evidence RPC; and pure helper RPC test/live-prefix smoke: PASS.
- Customer rows accessed: `0`; remote non-migration writes: `0`.
- Repository regressions, typecheck, zero-warning lint, build, diff checks, migration immutability, and V17/Q0 immutability: PASS.
- `npm audit --omit=dev` remains exactly `3 high`; dependency closure is a separate blocker.

Least-privilege review item: Supabase's pre-existing defaults leave DELETE granted to `service_role` on the 17 RC-1/RC-2 production tables. The required five-table assessment matrix is exact and has no DELETE. No out-of-scope ACL repair was attempted; Human/ChatGPT must disposition the broader production-table authority before runtime activation.

Only remote Supabase migration alignment through `0012` is newly established. Production Payment, Stripe, webhook, Email Provider, actual Email, actual Payment, OpenAI Provider, production runtime flags, remote application secrets, deployment, DNS, PRIVATE RELEASE READY, and Public Launch remain inactive or unchanged. No PR, release merge, or main merge occurred.

Sanitized evidence: `docs/payment/RC2_STEP_C_REMOTE_SUPABASE_EVIDENCE.md`.

Exact next action: Human/ChatGPT review this Step C candidate and the recorded least-privilege finding. Do not proceed to any Provider or runtime activation from this task.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-C:END -->

<!-- RC-2-PRODUCTION-ACTIVATION-STEP-B:BEGIN -->
## Step B — Disposable PostgreSQL / Supabase Compatibility and Hardening

Status: `RC-2 Production Activation Step B implemented_pending_human_chatgpt_review`

This Step B overlay records local-only implementation and evidence from `2026-08-20`. The previous Step B `BLOCKED` result was valid: the fresh database proved that service-role RPC execution alone did not provide the assessment-table DML needed by `SECURITY INVOKER` functions and the Runtime repository. It also exposed a missing DB-level Stripe Checkout environment binding. Neither failure was bypassed.

### Authority and append-only remediation

- Starting Product authority: `release/private-ready` at `3cfa1728ccfc2c4e0bf78a7697dfe62c650be67a`.
- Main remains `61e33a10e195fad17e253a6b9719217e1992f273`.
- Implementation branch: `task/rc2-activation-stepb-local-db-compat`.
- New migration: `supabase/migrations/0012_rc2_activation_database_hardening.sql`.
- Accepted migrations `0002..0011` remain byte-identical. In particular, `0010` is `8b5bd5b02ca7756299049cf6215af299ace69e3c` and `0011` is `70dc2c62631de6f1a81e5257eb076f45c4078565`.
- Q0/V17 Product semantics remain byte-identical.

### Assessment authority before and after

Before `0012`, service_role had no DML authority on these five tables. After `0012`, the explicit matrix is:

| Table | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `assessment_requests` | yes | yes | yes | no |
| `assessment_runs` | yes | yes | yes | no |
| `assessment_stage_runs` | yes | yes | yes | no |
| `assessment_reports` | yes | yes | no | no |
| `assessment_clarifications` | yes | yes | yes | no |

`GRANT ALL` is not used. public, anon, and authenticated are explicitly revoked. RLS is enabled on all five tables, including the previously uncovered `assessment_clarifications` gap. Existing and new functions remain `SECURITY INVOKER` with empty `search_path`.

The actual local service-role JWT, held only in process memory, proved:

- `begin_production_preparation_v1`, request INSERT/SELECT, and preparation INSERT/SELECT;
- Runtime createRun, startStage, and stage UPDATE;
- clarification INSERT by RPC, SELECT, acceptance/resume INSERT+UPDATE, and direct grounding UPDATE;
- report INSERT by `finalize_completed_assessment` and report SELECT.

`SERVICE_ROLE_REAL_RUNTIME_RPC_PROOF = PASS`

Actual REST requests using anon and a process-only signed authenticated JWT received 401/403 for all five assessment-table SELECTs and representative INSERT, UPDATE, and RPC calls. Catalog ACL checks also show no assessment DML or key RPC execution authority for either role.

### Stripe environment binding

`0012` establishes the following DB authority:

- a strict helper maps `test` only to `cs_test_*` and `live` only to `cs_live_*`;
- a Payment Attempt trigger validates the parent Purchase Intent on every INSERT and UPDATE;
- Purchase Intent environment is immutable;
- Verified Payment has an independent same-row CHECK plus parent Intent/Attempt/Checkout trigger;
- mismatched Stripe evidence is inserted into the event ledger, then changed to `rejected/PAYMENT_ENVIRONMENT_MISMATCH` before any Attempt, Intent, Verified Payment, or Job state can advance;
- normal and direct-db Verified Payment row mutation is prohibited.

Accepted functions use `SELECT ... FOR UPDATE` on Verified Payment rows. PostgreSQL therefore requires UPDATE table ACL even though the functions do not update those rows. `0012` grants that row-lock prerequisite to service_role and immediately pairs it with an immutable BEFORE UPDATE trigger; the successful chain and an attempted real UPDATE proved both sides.

### Fresh database, objects, and Payment Integrity

- Disposable workspace: new repo-external root; no repo `supabase/.temp` or linked-project metadata was consumed.
- Supabase CLI: temporary `npx` execution of stable `2.115.0`; no repo dependency or global installation.
- PostgreSQL: `17.6`.
- `0002` through `0012`: 11/11 recorded in the local migration catalog.
- RLS, exact grants, function ACL/security/search path, four hardening triggers, and the Verified Payment CHECK were confirmed in the real catalog.

`PASS_0002_THROUGH_0012_FRESH_APPLY`

| Case | Local real-DB result |
| --- | --- |
| A | duplicate Purchase Intent collapsed to existing; exactly one row |
| B | duplicate successful Payment returned duplicate; Payment and Job remained exactly one |
| C | duplicate Payment Attempt sequence rejected by the unique constraint |
| D | amount other than 980 rejected |
| E | currency other than `jpy` rejected |
| F | purchase kind other than `one_time` rejected |
| G | environment outside `test/live` rejected |
| H | email/preparation/trusted-session mismatch rejected |
| I | valid synthetic Purchase Intent and Attempt path accepted |
| J | test Intent + `cs_live_*` rejected |
| K | live Intent + `cs_test_*` rejected |
| L | test Intent + `cs_test_*` accepted |
| M | live Intent + `cs_live_*` accepted |
| N | environment and prefix mismatch evidence ledgered as rejected; Verified Payment 0, Job 0, Attempt unchanged |
| O | matching verified evidence produced exactly one Verified Payment and one Job |

`PAYMENT_INTEGRITY_A_THROUGH_O = PASS`

The service-role chain also completed preparation finalization, email challenge/consumption/binding, Purchase Intent creation, Attempt reservation, Checkout attachment, Stripe evidence recording, Verified Payment/Job production, Job claim, and RC-2 Grant/logical-assessment handoff. No postgres-superuser bypass is counted as runtime acceptance evidence.

### Atomicity and clean replay

The disposable workspace alone received temporary `0013__rc2_atomicity_probe.sql`. The official local migration runner created a table and then hit intentional SQLSTATE `22012`. After failure:

- `ATOMICITY_PROBE_OBJECT_ABSENT = true`
- probe migration version absent = `true`

The probe file was removed from the disposable workspace and never existed in the repository. A complete reset then applied only repo-authoritative `0002..0012`:

`PASS_0002_THROUGH_0012_FRESH_REPLAY`

### Repository regression snapshot

- `verify:rc2`: `PASS 48/48`.
- `verify:rc1`: `PASS 14/14`.
- `verify:rc2:activation-preflight`: `PASS 15/15`.
- `verify:rc2:stepb`: `PASS 18/18`.
- typecheck, zero-warning lint, production build, and Git diff checks: PASS.
- `next-env.d.ts`, accepted `0010`/`0011`, and Q0/V17: no working-tree blob drift.
- `npm audit --omit=dev`: nonzero with exactly `3 high` through Next/PostCSS/sharp. Dependency closure is not claimed and remains a separate blocker.

### Cleanup

- The Step B local Supabase stack was stopped with no backup.
- Matching disposable containers / volumes / network after stop: `0 / 0 / 0`.
- Docker Desktop remains running.
- Recursive workspace deletion was rejected by the execution safety guard before deletion began; it was not bypassed. `C:\temp\moon-reply-rc2-stepb-20260820-204213` and the earlier `C:\temp\moon-reply-rc2-stepb-20260820-200603` therefore remain as disposable local paths.

### Remote and activation boundary

`REMOTE_SUPABASE_STATE = UNRESOLVED`

No safely identity-verifiable existing read-only path was used. Ignored historical Supabase metadata was not treated as authority. Supabase remote read/write, remote migration apply/repair, Stripe API/Dashboard/charge/Payment/webhook registration, Email, OpenAI Provider, Netlify deploy, remote secret/env change, DNS, PR, release merge, main merge, and Public Launch all remain `0`.

Production Payment: inactive. Stripe: not connected. Email: inactive. Remote migration applied: not established. `PRIVATE RELEASE READY = false`. `Public Launch = false`.

Exact next action: Human/ChatGPT review this Step B commit and evidence. Remote migration application or Provider setup requires a later, separately authorized task after acceptance.
<!-- RC-2-PRODUCTION-ACTIVATION-STEP-B:END -->

Status: `RC-2 Production Activation Step A implemented_pending_human_chatgpt_review`

This runbook prepares a later, separately authorized Stripe Sandbox and Supabase activation. It does not authorize or perform Provider setup, a Payment, a migration apply, secret injection, email delivery, OpenAI execution, deployment, or public release.

## 1. Authority and present boundary

- Starting Product authority: `release/private-ready` at `dcccf1c780619e9716b72764d2f2f7f93a961543`.
- Main authority remains `61e33a10e195fad17e253a6b9719217e1992f273`.
- Step A branch: `task/rc2-production-activation-preflight`.
- Human Stripe Sandbox account: created as of `2026-08-20`.
- Stripe secrets: not connected.
- Stripe API calls / Dashboard operations / webhook registration / Payment: `0 / 0 / 0 / 0`.
- Supabase remote writes / migration apply / migration repair: `0 / 0 / 0`.
- Email / OpenAI Provider calls / deploy: `0 / 0 / 0`.
- Production Payment: inactive.
- Email: inactive; the production adapter remains unconfigured and unsupported.
- OpenAI paid flow: not executed.
- `PRIVATE RELEASE READY = false`.
- `Public Launch = false`.

## 2. Secret-handling rule

Never paste or copy a secret into Git, Codex/chat, a ticket, a document, a test fixture, command output, or a screenshot. A check may report only `KEY_NAME = PRESENT` or `KEY_NAME = MISSING`.

Do not print prefixes to identify a Stripe environment. After secure provisioning in a later task, use the existing server-side `readStripeCheckoutEnvironment()` validator and report only `test`, `live`, or fail-closed. It rejects a mismatch between `PAYMENT_PROVIDER_ENVIRONMENT` and the Stripe key environment.

`.env.local` is ignored and untracked. All other `.env*` files are also ignored except `.env.example`. Secrets must ultimately live in an approved local or hosting secret store, never in a tracked env file.

Step A local presence snapshot (process environment or `.env.local`; values were not output):

| Key name | State |
| --- | --- |
| `STRIPE_SECRET_KEY` | `MISSING` |
| `STRIPE_WEBHOOK_SECRET` | `MISSING` |
| `SUPABASE_SERVICE_ROLE_KEY` | `MISSING` |
| `SUPABASE_SECRET_KEY` | `PRESENT` |
| `OPENAI_API_KEY` | `PRESENT` |
| `EMAIL_API_KEY` | `MISSING` |
| `EMAIL_VERIFICATION_SECRET_PEPPER` | `MISSING` |
| `EMAIL_ADDRESS_ENCRYPTION_KEY` | `MISSING` |
| `PURCHASE_STATUS_SIGNING_SECRET` | `MISSING` |

Presence is not validity, authorization, correct project binding, or successful connectivity. No listed value was used in Step A.

## 3. Activation environment matrix

### A. Stripe Sandbox test E2E

| Environment name | Step A state / later contract |
| --- | --- |
| `PAYMENT_PROVIDER_ENVIRONMENT` | Later target is exactly `PAYMENT_PROVIDER_ENVIRONMENT=test`; blank in the tracked example today. |
| `STRIPE_SECRET_KEY` | Server-only secret; `MISSING`; provision securely only in a separately authorized task. |
| `STRIPE_WEBHOOK_SECRET` | Separate server-only endpoint secret; `MISSING`; required only after separate webhook registration authority. |
| `NEXT_PUBLIC_APP_URL` | Must be one exact origin. Live mode requires HTTPS. Checkout success/cancel URLs are derived only from this origin. |
| `STRIPE_PAYPAY_ENABLED` | Keep exactly `STRIPE_PAYPAY_ENABLED=false`; PayPay approval and activation are absent. |
| `PAYMENT_PRODUCTION_ENABLED` | Keep exactly `PAYMENT_PRODUCTION_ENABLED=false`. |
| `STRIPE_WEBHOOK_ENABLED` | Keep exactly `STRIPE_WEBHOOK_ENABLED=false`. |
| `STRIPE_RECONCILIATION_ENABLED` | Keep exactly `STRIPE_RECONCILIATION_ENABLED=false`. |

The resolved dependency is `stripe@22.5.0`. Checkout is server-confined, `mode=payment`, quantity `1`, exact `JPY 980`, and metadata contains only the internal purchase reference. Reconciliation retrieves the known Checkout Session and converges on the same central evidence authority as a signed webhook.

### B. Supabase

| Environment name / artifact | Step A state / later contract |
| --- | --- |
| `SUPABASE_URL` | Required server-side endpoint; presence alone is not project-binding evidence. |
| `SUPABASE_SECRET_KEY` | RC-1/RC-2 server runtime credential; local presence `PRESENT`, but it was not used. |
| `SUPABASE_SERVICE_ROLE_KEY` | Older admin seam name; local presence `MISSING`. Do not substitute names without checking the consuming code. |
| `0010_rc1_production_fulfillment_core.sql` | Accepted immutable artifact; Git blob `8b5bd5b02ca7756299049cf6215af299ace69e3c`. |
| `0011_rc2_production_payment_delivery.sql` | Present current artifact; no remote-apply evidence. Treat as not applied. |

`0011` depends on the RC-1 tables created by `0010`, creates `pgcrypto` in the `extensions` schema if permitted, adds Payment/email/fulfillment tables and RPCs, enables RLS, revokes direct public/anon/authenticated authority, and grants the required RPC/table seams only to `service_role`.

### C. Email Provider connection

| Environment name | Step A state / later contract |
| --- | --- |
| `TRANSACTIONAL_EMAIL_PROVIDER` | `unconfigured`; current production wiring rejects every configured provider as unsupported. |
| `EMAIL_API_KEY` | Provider-specific secret; `MISSING`; not consumed by a production adapter today. |
| `EMAIL_FROM_ADDRESS` / `EMAIL_FROM_NAME` | Sender identity inputs for a future adapter; sender/domain verification remains absent. |
| `EMAIL_VERIFICATION_SECRET_PEPPER` | Server-only secret; `MISSING`. |
| `EMAIL_ADDRESS_ENCRYPTION_KEY` | Server-only AES-256-GCM key; `MISSING`. |
| `PURCHASE_STATUS_SIGNING_SECRET` | Server-only signing secret; `MISSING`. |
| `EMAIL_VERIFICATION_CHALLENGE_TTL_SECONDS` | Human policy required later; validator range `60..86400`. |
| `TRUSTED_EMAIL_SESSION_TTL_SECONDS` | Human policy required later; validator range `60..31536000`. |
| `EMAIL_VERIFICATION_MAX_ATTEMPTS` | Human policy required later; validator range `1..20`. |

`EMAIL_VERIFICATION_ENABLED=false` must remain unchanged in Step A. A live email adapter, sender/domain evidence, privacy/deliverability review, and a separately authorized test are blockers before any customer Payment can be exposed.

### D. OpenAI real assessment

| Environment name | Step A state / later contract |
| --- | --- |
| `OPENAI_API_KEY` | Local presence `PRESENT`; not used in Step A. |
| `OPENAI_MODEL` | Accepted runtime identity is exactly `gpt-5.6-luna`. |
| `ASSESSMENT_PRODUCTION_PREPARATION_ENABLED` | Keep false in Step A. |
| `ASSESSMENT_PRODUCTION_RUNTIME_ENABLED` | Keep false in Step A. |
| `ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED` | Keep false in Step A. |

No OpenAI call, paid-flow assessment, semantic fidelity claim, or Provider evidence is created by this preflight.

### E. Keep OFF through this task and until a later hard gate

The tracked defaults and Step A runtime intent are:

```text
PAYMENT_PRODUCTION_ENABLED=false
STRIPE_WEBHOOK_ENABLED=false
STRIPE_RECONCILIATION_ENABLED=false
EMAIL_VERIFICATION_ENABLED=false
PAYMENT_FULFILLMENT_PROCESSING_ENABLED=false
STRIPE_PAYPAY_ENABLED=false
ASSESSMENT_PRODUCTION_PREPARATION_ENABLED=false
ASSESSMENT_PRODUCTION_RUNTIME_ENABLED=false
ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED=false
```

Do not flip one flag in isolation. New purchase visibility, new email verification, and Checkout now require every preparation/runtime/result, email, Payment, webhook, reconciliation, and fulfillment enable flag together, and require every relevant emergency stop to be clear. This prevents a partially enabled state from accepting a charge while verification or fulfillment is disabled.

Webhook ingestion, reconciliation, customer email delivery, and already-paid fulfillment retain independent operational switches. A Payment emergency stop blocks new purchases but does not silently discard already-arriving evidence or abandon a verified paid obligation. Their dedicated stop controls remain authoritative.

## 4. Supabase compatibility result

Step A detected no existing `psql`, Docker, Supabase CLI, local Supabase config, or bundled Supabase CLI. A large install or new configuration was not authorized.

`LOCAL_POSTGRES_COMPATIBILITY_NOT_EXECUTED`

Static migration structure is coherent: files `0002` through `0011` are ordered; `0011` references the accepted RC-1 tables; FK, uniqueness, RLS, revoke/grant, RPC, JPY 980, JPY, one-time, environment, and conflicting-success invariants are present. This is not proof of PostgreSQL parsing or successful application.

Before remote apply, a separate task must run `0002..0011` in order against a fresh disposable PostgreSQL/Supabase environment and record syntax, FK dependency, RPC creation, RLS, grants/revokes, uniqueness, and transaction behavior. `0011` does not contain the explicit `begin;` / `commit;` wrapper used by `0002..0010`; therefore the chosen migration runner's atomicity must be proved or an explicit migration correction must be separately reviewed. Never repair migration history by inference.

## 5. Remote Supabase state

No existing Supabase CLI, authenticated session, or linked-project marker was available. No login was requested and no remote query was attempted.

`REMOTE_SUPABASE_STATE = UNRESOLVED`

Without actual read-only evidence, `0011` is reported as not applied. A later task may perform only a credential-safe, read-only migration-state inspection first. `db push`, `migration up`, `migration repair`, SQL writes, schema changes, settings changes, and secret changes remain prohibited until separately authorized.

## 6. Security and operational blockers

Step A does not clear the following blockers:

- production transactional-email adapter and verified sender/domain are absent;
- the route limiter is an in-memory seam, not distributed multi-instance enforcement or a WAF;
- canonical host/proxy enforcement and the deployed exact origin have no production evidence;
- local PostgreSQL compatibility and remote migration state are unresolved;
- Stripe key/project/webhook binding and actual sandbox evidence are absent;
- `npm audit --omit=dev --json` reports exactly `3 high`: direct `next`, transitive `postcss`, and transitive `sharp`;
- monitoring, alerting, incident/rollback rehearsal, RC-3, PRIVATE RELEASE READY, and Public Launch remain incomplete.

The emergency-stop matrix is deliberate: new purchase/email-verification/Checkout uses the complete hard gate; evidence ingestion and already-paid fulfillment use their own switches so an incident stop cannot strand an existing paid Customer. Human operational approval is still required before any flag transition.

## 7. Later activation order — not authorized by Step A

1. Human + ChatGPT review and accept this Step A branch.
2. In a separate task, establish a disposable local PostgreSQL/Supabase environment and apply `0002..0011` fresh. Stop on any error.
3. Obtain read-only remote migration state without logging in through Codex or exposing a credential. Resolve project identity before any write.
4. Review and separately authorize the exact remote `0011` apply; record pre/post migration state. Never use repair as a shortcut.
5. Implement and review one production transactional-email adapter, sender/domain configuration, and privacy/deliverability evidence.
6. Provision test-only credentials through an approved secret store. Report key names and `PRESENT/MISSING` only.
7. Validate Stripe key environment through the server validator. Keep PayPay off.
8. Register the test webhook in a separately authorized Dashboard step; record endpoint identity without the signing secret.
9. Establish distributed rate limiting/WAF, monitoring, alerts, kill-switch ownership, and rollback evidence.
10. Enable downstream evidence/recovery/fulfillment controls before enabling new purchase visibility. Perform one separately authorized test-mode E2E only after the complete gate passes.

Any environment mismatch, unexpected Git drift, migration discrepancy, wrong project, missing policy value, unsupported email provider, non-HTTPS live origin, dependency-policy rejection, or secret exposure is an immediate stop condition.

## 8. Step A verification

Run without secrets:

```text
npm run verify:rc2:activation-preflight
```

The verifier is static/offline. It validates routes, env names/defaults, the all-flags purchase gate, Stripe environment mismatch behavior, exact Checkout contract, raw webhook handling, reconciliation, email policy requirements, migration order and protected blobs, public Grant-route absence, tracked-secret signatures, `.env.local` tracking absence, and V17/Q0 immutability. A PASS is Step A technical evidence only; it is not Provider, database, Payment, email, Runtime, deployment, or release evidence.

## 9. Exact next Human action

Review and either accept or reject this Step A branch. Do not provide a Stripe secret yet. If accepted, authorize a separate local disposable PostgreSQL compatibility task as the first Step B action; remote migration apply, webhook registration, secret provisioning, and actual test Payment remain outside that authorization.
