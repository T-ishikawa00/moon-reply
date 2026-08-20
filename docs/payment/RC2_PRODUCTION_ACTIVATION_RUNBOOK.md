# RC-2 Production Activation Runbook — Step A Preflight

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
