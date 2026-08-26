# M2 Self Dogfood Activation Freeze

Status: `SOURCE-ONLY CYCLE 3 RUNBOOK FROZEN — EXTERNAL ACTIONS NOT AUTHORIZED`

Captured: `2026-08-26` (Asia/Tokyo)

## 1. Authority and operating boundary

- Source lineage: `release/private-ready@3bd47e0ed8cf1a28da8ba14525718117df7bc99e` -> reviewed SEC-01 implementation `task/sec-01-next-16-3-3-r1@08ec7afc88874ad9cfb33cfee10801b4b874514a` -> the single SEC-01 acceptance-sync commit containing this runbook.
- `DOGFOOD_SOURCE_CANDIDATE` is the exact resulting `release/private-ready` commit after that ff-only integration. A Git commit cannot contain its own final object ID; Cycle 2 postflight and the Cycle 3 preflight must resolve and compare the literal SHA before any deploy.
- Current Published customer source remains `0befd512219eb2897fb1edf969ad37d7e8c56b0d` until a separately authorized Cycle 3 Publish.
- Current remote database is exact `0002..0021`, pending `0`, unknown `0`.
- Scope is one Human Product Owner, the Private customer site, Stripe Sandbox/test only, one controlled first purchase, then seven days of Self Dogfood with no third party. It is not External Private Beta or Public Launch.
- This document contains no secret value and authorizes no credential, Netlify, Supabase, Stripe, Auth, Async, Provider/OpenAI, email, scheduler, Purchase, deploy, or Publish action.

## 2. Exact customer-project environment inventory

Only exact string `true` enables source flags. Secret checks report only `PRESENT`/`MISSING`; values, prefixes, hashes, and screenshots are prohibited.

### Required values and project references

| Exact name | Classification | Cycle 3 frozen value or contract |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `REQUIRED_URL/PROJECT_REFERENCE` | Exact Private customer HTTPS origin, with no path or trailing slash. It must match Netlify and the Supabase Auth redirect allowlist. |
| `SUPABASE_URL` | `REQUIRED_URL/PROJECT_REFERENCE` | Exact project URL for the database whose migration history is `0002..0021`. |
| `SUPABASE_PUBLISHABLE_KEY` | `REQUIRED_URL/PROJECT_REFERENCE` | Publishable key for that same Supabase project; not a service/admin key. |
| `OPENAI_MODEL` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `gpt-5.6-luna`. |
| `PAYMENT_PROVIDER_ENVIRONMENT` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `test`; the server validator must report only `test`. |
| `TRANSACTIONAL_EMAIL_PROVIDER` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `resend` at activation. |
| `EMAIL_FROM_ADDRESS` | `REQUIRED_URL/PROJECT_REFERENCE` | Existing verified Resend sender/domain identity; never infer an address. |
| `EMAIL_FROM_NAME` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `月の返事`. |
| `CUSTOMER_AUTH_CONTINUATION_TTL_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `600`. Source range `60..1800`. |
| `CUSTOMER_AUTH_RATE_LIMIT_MODE` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `in_memory_seam`. Private Human-only Dogfood only; not distributed/Public-Launch protection. |
| `CUSTOMER_AUTH_RATE_LIMIT_MAX_REQUESTS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `100`. Source range `1..10000`. |
| `CUSTOMER_AUTH_RATE_LIMIT_WINDOW_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `60`. Source range `1..86400`. |
| `CUSTOMER_AUTH_EMAIL_KEY_VERSION` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `v1`. |
| `PREPAYMENT_COMPUTE_WINDOW_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `86400`. |
| `PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `10`. |
| `EMAIL_VERIFICATION_CHALLENGE_TTL_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `600`. Source range `60..86400`. |
| `TRUSTED_EMAIL_SESSION_TTL_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `86400`. Source range `60..31536000`. |
| `EMAIL_VERIFICATION_MAX_ATTEMPTS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `3`. Source range `1..20`. |
| `PAYMENT_FULFILLMENT_LEASE_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `120`. Source range `30..3600`. |
| `PAYMENT_ROUTE_RATE_LIMIT_MODE` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | Exact `in_memory_seam`. Private Human-only Dogfood only. |
| `PAYMENT_ROUTE_RATE_LIMIT_MAX_REQUESTS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `100`. Source range `1..10000`. |
| `PAYMENT_ROUTE_RATE_LIMIT_WINDOW_SECONDS` | `REQUIRED_VALUE_ALREADY_KNOWN_POLICY` | `60`. Source range `1..86400`. |

### Required Human-controlled secrets

| Exact name | Classification | Allowed report |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Same-project server secret: `PRESENT`/`MISSING` only. Do not substitute the legacy name `SUPABASE_SERVICE_ROLE_KEY`. |
| `OPENAI_API_KEY` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | `PRESENT`/`MISSING` only. |
| `STRIPE_SECRET_KEY` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Sandbox secret key; source must validate it against `PAYMENT_PROVIDER_ENVIRONMENT=test` without printing any prefix. |
| `EMAIL_API_KEY` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Resend server key: `PRESENT`/`MISSING` only. |
| `EMAIL_VERIFICATION_SECRET_PEPPER` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Server-only, `PRESENT`/`MISSING` only. |
| `EMAIL_ADDRESS_ENCRYPTION_KEY` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Server-only encryption key, `PRESENT`/`MISSING` only. |
| `PURCHASE_STATUS_SIGNING_SECRET` | `REQUIRED_SECRET_HUMAN_CONTROLLED` | Server-only signing secret, `PRESENT`/`MISSING` only. |

`STRIPE_WEBHOOK_SECRET` must be absent from the customer project. It exists only in the separate Public ingress project. Google OAuth client credentials and Email OTP provider configuration are Supabase Auth project settings, not customer Netlify environment names. The Supabase redirect allowlist must include the exact Private origin routes `/api/auth/callback` and `/api/auth/account/callback`. Async Workloads uses Netlify's same-site extension/site authority; repository source defines no customer-managed Async environment name.

### Initial-safe flags and eventual activation values

| Exact name | Classification | Initial | Activation | Rollback |
| --- | --- | ---: | ---: | ---: |
| `CUSTOMER_AUTH_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` | `false` or `CUSTOMER_AUTH_EMERGENCY_STOP=true` |
| `CUSTOMER_AUTH_GOOGLE_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` only after the existing Supabase Google provider and both callbacks are read-only proven | `false` |
| `CUSTOMER_AUTH_EMAIL_OTP_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` only after Supabase Email OTP delivery is proven ready | `false` |
| `PREPAYMENT_COMPUTE_BUDGET_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` with `86400` / `10` | `false` |
| `ASSESSMENT_PRODUCTION_PREPARATION_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` | `false` or assessment emergency stop |
| `ASSESSMENT_PRODUCTION_RUNTIME_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` | `false` or assessment emergency stop |
| `ASSESSMENT_PRODUCTION_RESULT_ACCESS_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` | `false` |
| `EMAIL_VERIFICATION_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` | keep paid-result recovery in mind; use its emergency stop only under incident authority |
| `PAYMENT_FULFILLMENT_PROCESSING_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` before its dedicated schedule | emergency stop; do not abandon a verified obligation |
| `STRIPE_RECONCILIATION_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | `true` before its dedicated schedule | `false` only after ingress/new Checkout is stopped and backlog is known |
| `STRIPE_WEBHOOK_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | customer activation contract requires `true`, but the signing secret remains ingress-only | `false` stops new Checkout visibility; ingress has its own independent flag |
| `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | exact `true` only after zero-due inventory | `false` |
| `STRIPE_RECONCILIATION_SCHEDULED_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | exact `true` only after dispatch and zero-due inventory | `false` |
| `PAYMENT_PRODUCTION_ENABLED` | `MUST_REMAIN_FALSE_INITIAL` | `false` | exact `true` last, after ingress and schedules are live | `false` first to stop new Checkout |

The stop flags are required known policy values during normal activation: `CUSTOMER_AUTH_EMERGENCY_STOP=false`, `ASSESSMENT_PRODUCTION_EMERGENCY_STOP=false`, `EMAIL_VERIFICATION_EMERGENCY_STOP=false`, `PAYMENT_EMERGENCY_STOP=false`, and `PAYMENT_FULFILLMENT_EMERGENCY_STOP=false`. Their rollback value is exact `true`, chosen only for the affected incident path. `STRIPE_PAYPAY_ENABLED=false` for all Self Dogfood.

### Optional or deliberately inactive

The following are `OPTIONAL/NOT_NEEDED_FOR_SELF_DOGFOOD` and must be absent or retain an inert value: `APP_ENV`, `OPENAI_MODEL_JUDGMENT`, `OPENAI_MODEL_DIAGNOSIS`, `PAYMENT_PROVIDER`, `PAYMENT_SECRET_KEY`, `PAYMENT_PUBLIC_KEY`, `PAYMENT_WEBHOOK_SECRET`, `RESULT_TOKEN_SECRET`, `REQUEST_TOKEN_SECRET`, `ENABLE_MOCK_PAYMENT`, `ENABLE_MOCK_AI`, `ENABLE_EMAIL_LOG_ONLY`, `ENABLE_HUMAN_QA_MODE`, and customer-project `STRIPE_WEBHOOK_SECRET`. They have no current customer runtime call path for this flow.

Keep `M2_INTERNAL_RUNTIME_ENABLED=false`, `CUSTOMER_SUPPORT_CASES_ENABLED=false`, and `MEASUREMENT_ENABLED=false`. `MEASUREMENT_TRANSACTION_SECRET` is therefore absent. Support and telemetry are not required for Human-only Self Dogfood and are not activated by this runbook.

## 3. Separate Public Stripe ingress freeze

- Customer Netlify project remains Private. Only the ingress project becomes Public.
- Repository is the same Moon Reply repository; Base directory is exact `services/stripe-webhook-ingress`, Package directory unset, package-local `netlify.toml` used.
- Source-controlled build/runtime contract: `.node-version` major `22`; `npm run build`; `src/stripe-webhook.ts` -> `dist/functions/stripe-webhook.mjs`; `dist/public` is empty; Functions directory `dist/functions`; esbuild target Node 22; exact packaged dependencies `postgres@3.4.9` and `stripe@22.5.0`.
- Exact application env allowlist is only `PAYMENT_ENVIRONMENT`, `STRIPE_WEBHOOK_ENABLED`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_INGRESS_DATABASE_URL`, and `STRIPE_INGRESS_DATABASE_CA_PEM`. Initial values are `PAYMENT_ENVIRONMENT=test` and `STRIPE_WEBHOOK_ENABLED=false`.
- `STRIPE_INGRESS_DATABASE_URL` is a Human-controlled dedicated transaction-pooler credential for `m2_b2_stripe_ingress`: `postgres`/`postgresql`, `*.pooler.supabase.com`, port `6543`, database `/postgres`, username prefix `m2_b2_stripe_ingress.`, exactly `sslmode=verify-full`, and no other query key or fragment.
- `STRIPE_INGRESS_DATABASE_CA_PEM` is the pinned CA PEM with real newlines. Runtime also enforces `rejectUnauthorized=true` and hostname/SNI verification.
- Migration `0018` already establishes least privilege: USAGE on `private_payment_ingress` and EXECUTE only on `private_payment_ingress.record_stripe_webhook_evidence_v1`; application relation, sequence, non-target function, schema CREATE, PUBLIC, anon, authenticated, service-role, admin, Stripe API, Provider, email, Auth/session, Async, and customer-secret authority are absent from ingress.
- The ingress has no customer Auth/session dependency. It reads the raw request body exactly once, enforces a 1,048,576-byte ceiling, verifies `Stripe-Signature` before parsing/DB work, and returns `2xx` only for valid unsupported evidence or after durable wrapper commit.
- Effective endpoint format after deployment is `https://<PUBLIC_INGRESS_HOST>/api/payments/stripe/webhook`. Never target the Private customer host or `/.netlify/functions/stripe-webhook`.
- Auto Publishing stays Locked. First verify a Private disabled deploy, then publish that exact disabled Deploy ID, then make only ingress Public. Inventory effective Production/Functions env names without values and stop on inherited forbidden names.

## 4. Stripe Sandbox endpoint freeze

Register exactly these four own-account Sandbox event types, derived from `lib/payment/production/stripe-webhook.ts` and migration `0018`:

1. `checkout.session.completed`
2. `checkout.session.async_payment_succeeded`
3. `checkout.session.async_payment_failed`
4. `checkout.session.expired`

The destination URL is the Public ingress URL only. Do not subscribe to `*`, live mode, or Connected-account events. Read and record the exact Sandbox endpoint API version before creation; repository source does not pin it, so guessing is prohibited. The endpoint-specific signing secret exists only as ingress `STRIPE_WEBHOOK_SECRET`. At Cycle 2 close the endpoint remains not created/disabled, and no Production/live endpoint exists.

## 5. Exact Cycle 3 activation order

Every env change is deploy-versioned. Build, inspect, and explicitly Publish one exact Deploy ID for each phase; Auto Publishing remains Locked. No `Run now` is used.

| Order | Action | Exact control | Prerequisite and PASS | Rollback |
| ---: | --- | --- | --- | --- |
| 1 | Freeze authority | `DOGFOOD_SOURCE_CANDIDATE=<Cycle 2 resulting release SHA>` | local/tracking/direct remote exact; clean tree; stash `0`; DB exact `0002..0021`; customer Private; Published still `0befd512...` | STOP; no external write |
| 2 | Provision dedicated ingress DB credential | `m2_b2_stripe_ingress` password via interactive `\password` | separate Human authorization; password-present boolean; unchanged role/ACL; verified-TLS login; no service-role fallback | endpoint remains absent; set `NOLOGIN`/`PASSWORD NULL` and terminate its sessions only under incident authority |
| 3 | Create ingress project disabled | `PAYMENT_ENVIRONMENT=test`, `STRIPE_WEBHOOK_ENABLED=false` | exact base/build/runtime, Private visibility, Auto Publishing Locked, five-name env ceiling | keep/delete project only under separate authority; no endpoint exists |
| 4 | Deploy customer initial safe-off | all `MUST_REMAIN_FALSE_INITIAL` flags exact `false`; permanent inactive flags false | exact source/build `48/48` or current expected count, unchanged routes, Functions/Edge compatible, customer Private | retain old Published source; do not Publish candidate |
| 5 | Prove scheduled no-op | both dedicated schedule flags `false` | natural schedule observations return HTTP `200` and exact `{ "disabled": true }` before Supabase/Stripe/Async/customer-data access | remain `false` |
| 6 | Stage internal authority | underlying Auth/C1/assessment/email/fulfillment/reconciliation/webhook flags `true`; `PAYMENT_PRODUCTION_ENABLED=false`; both dedicated schedule flags remain `false` | all required values/secrets present; Supabase providers and Resend sender proven; due-job and due-reconciliation count `0`; historical manual-review fixture excluded and untouched | restore underlying flags `false`; stops as required |
| 7 | Activate dispatch | `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED=true` | fulfillment processing true, emergency stop false, Async same-site route and background artifact proven; due count `0` | set dedicated dispatch flag `false`; do not cancel already accepted Async work blindly |
| 8 | Activate reconciliation | `STRIPE_RECONCILIATION_SCHEDULED_ENABLED=true` | reconciliation true, payment stop false, Stripe validator `test`, due count `0`, dispatch observation clean | set dedicated reconciliation flag `false`; preserve attempt state |
| 9 | Verify no-op again | both natural schedules | no due dispatch, no Stripe read when reconciliation inventory is empty, no Provider/email/Async work, historical manual-review fixture unchanged | disable the affected dedicated flag and investigate read-only |
| 10 | Publish disabled ingress | ingress `STRIPE_WEBHOOK_ENABLED=false` | actual ZIP/runtime/dependencies/path/log/env-name checks PASS; exact disabled Deploy ID; then only ingress Public; disabled POST fails closed | publish reviewed disabled ingress or return ingress Private |
| 11 | Create Sandbox endpoint disabled | exact Public URL, exact four events, own account, pinned Sandbox API version | separate Stripe authorization; endpoint left disabled; signing secret retained securely | disable/delete endpoint under separate authority; customer unchanged |
| 12 | Capture secret in disabled ingress | ingress `STRIPE_WEBHOOK_SECRET=PRESENT`, ingress flag still `false` | new exact disabled deploy proves cold start/path/secret isolation without logging values | publish prior disabled deploy; rotate secret if exposed |
| 13 | Enable ingress and destination | ingress `STRIPE_WEBHOOK_ENABLED=true`, then enable the Stripe Sandbox destination | customer exact runtime and both schedules already live; no due work; ingress exact enabled deploy verified | disable Stripe destination first, then publish ingress flag `false` |
| 14 | Open one-purchase gate last | customer `PAYMENT_PRODUCTION_ENABLED=true` with every RC2 required flag true and every blocking stop false | all earlier PASS evidence; rollback ready; Human authorizes exactly one purchase | customer `PAYMENT_PRODUCTION_ENABLED=false` first; do not retry an ambiguous purchase |
| 15 | Execute exactly one controlled Sandbox purchase | Human action only | Section 9; no second Checkout/Purchase without a new atomic authorization | Section 6 |

The dispatch schedule is `* * * * *`; reconciliation is `*/5 * * * *`. Dispatch is batch four/serial/22 seconds and sends only same-site Async after a DB0016 claim. Reconciliation is batch four/concurrency two/two-minute webhook grace/24-second lease/five-read budget, Stripe retries `0`, timeout five seconds, persisted Checkout Session READ only, and never dispatches directly.

## 6. Rollback order

For any normal ambiguity or incident after activation:

1. Set customer `PAYMENT_PRODUCTION_ENABLED=false` and stop all new Checkout/Purchase.
2. Disable the Stripe Sandbox destination.
3. Publish an exact ingress deploy captured with `STRIPE_WEBHOOK_ENABLED=false`; if ingress itself is suspect, return only ingress to Private.
4. Confirm whether an event, verified Payment, job, or Async event is already durable. Delete nothing and do not purchase again.
5. Disable `STRIPE_RECONCILIATION_SCHEDULED_ENABLED=false` when Stripe reads must stop.
6. Keep dispatch/result/Account recovery available for a verified paid obligation unless that path is the incident. If it must stop, set `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED=false` only after the durable backlog disposition is known.
7. Apply the narrow emergency stop for the affected customer path; do not use a stop to erase or abandon a verified obligation.
8. Clear/rotate the dedicated ingress credential and terminate its existing sessions only for credential/ingress compromise and only under separate Human authorization.
9. Keep the customer project Private; never roll back migrations `0018..0021`, repair history, delete durable evidence, expose the customer site, or fall back to the Private customer webhook.

The pre-existing historical `manual_review` fixture is a protected baseline. Never select it for repair, change its state, send it to Async, retry Provider work, resend notification, or touch it during no-op proof, E2E, daily checks, or rollback.

## 7. Minimum G1 read-only observability

Use opaque internal identifiers only in a secure operator session. Never select or log consultation text, email address, Checkout URL, capability/token/hash values, Stripe signature/body, `output_json`, `report_json`, `decision_card_json`, `experience_projection_json`, Provider body, or result content.

| Boundary | Existing object/log | Success evidence | Red flag |
| --- | --- | --- | --- |
| Stripe Sandbox | Stripe Workbench endpoint delivery | one expected test-mode event, exact registered type, one destination; delivery `2xx` | live-mode object, wrong endpoint/type, repeated manual resend, unresolved delivery |
| Public ingress | Netlify ingress Function deploy/log | exact Deploy ID/path, accepted request, bounded status, no sensitive log fields | `4xx/5xx`, wrong deploy/path, body/signature/DB URL in logs |
| Durable ingress evidence | `production_stripe_event_ledger` | one `environment=test` row; supported event reaches `applied` or duplicate delivery remains `duplicate`; linked IDs present | `conflict`, `rejected`, unexpected `stale`/`ignored`, live environment, multiple applied economics |
| Purchase/attempt | `production_purchase_intents`, `production_payment_attempts` | one intent, exact product/JPY 980/one-time/test; one current attempt; intent `verified`, attempt `succeeded` | `unknown`, `manual_review`, extra attempt, ambiguous provider IDs, duplicate successful attempt |
| Verified payment | `production_verified_payments` | exactly one row for intent/attempt, amount `980`, currency `jpy`, environment `test` | zero or more than one, live, mismatched economics |
| Fulfillment job | `production_fulfillment_jobs` | exactly one job; dispatch marker completed once; job reaches `completed`; bounded attempt counts; no last error | duplicate job/marker, stale owner/lease, retryable/manual-review, unexpected second dispatch |
| Async/background | Netlify Async Workloads event `production.fulfillment.job.v1` and `production-fulfillment-background` logs | one router acceptance for the job and one completed workload path | unexpected Async retry, `PRODUCTION_PROVIDER_OUTCOME_AMBIGUOUS`, retry exhaustion, second event for same job |
| Provider/runtime | `production_assessment_grants`, `production_logical_assessments`, `assessment_runs`, `assessment_stage_runs` using status/model/usage columns only | grant/logical/run completed, one logical assessment, six ordered completed stages, requested/returned model `gpt-5.6-luna`, bounded nonzero usage | unexpected Provider retry/attempt, failed/stale processing, model mismatch, `manual_review` |
| Delivery/result | `production_customer_deliveries`, `production_result_credentials` metadata only | exactly one delivery and intended active credential purpose; projection/hash/body not selected | missing/duplicate delivery, revoked/expired required credential |
| Notification/email | `production_notification_outbox`, Resend message status, Netlify worker log | outbox `sent`, one provider reference, Resend accepted/delivered; no email/body selected | failed/pending/stale processing, duplicate send, ambiguous acceptance that threatens recovery |
| Return/Account | Private `/purchase/return/<opaque>` and authenticated `/account`, `/account/results/<deliveryId>` | Return reaches completed once; Account shows one completed item; canonical authenticated result opens | result inaccessible after verified payment, false completed, auth/DB error collapsed to retry |
| Reconciliation | reconciliation columns on `production_payment_attempts` plus scheduled Function log | webhook success leaves no due attempt; no stale owner/lease/error; schedule processes zero | unexpected Stripe read, stopped/error state, exhausted budget, state divergence |
| C1 budget | `production_prepayment_execution_authorities`, `production_prepayment_compute_budgets` | authority reaches completed; one policy window; `used_provider_invocation_units <= 10` | more than 10 units, duplicate authority/window, failed/ambiguous execution |
| DB/source | Supabase migration list and Netlify deploy metadata | exact `0002..0021`; exact frozen SHA; Private customer; Public ingress only | schema drift, unknown/pending migration, source mismatch, customer Public |

Daily for seven days: recheck project visibilities, exact Published SHAs, DB migration inventory, Stripe Sandbox/no-live proof, no unexpected endpoint delivery, no due/stale reconciliation or fulfillment owner, no new manual-review/duplicate state, C1 units within `10`, result accessible in Account, and notification status. Full dashboards, alerts, Support activation, and telemetry are deferred.

## 8. Minimum G2 Human checklist

Before the first purchase:

- Confirm Human Product Owner only, customer Private, ingress-only Public, Stripe Sandbox only, seven-day window, no third party.
- Compare `DOGFOOD_SOURCE_CANDIDATE` to customer/ingress deploy source, local/tracking/direct remote; Auto Publishing Locked.
- Confirm remote DB exact `0002..0021`, pending `0`, unknown `0`.
- Obtain two independent Sandbox proofs: source validator returns only `test`, and Stripe Workbench is visibly Sandbox with no live endpoint/object.
- Confirm customer initial/final flags against Section 2, both schedules against Section 5, ingress flag/destination state, and no `Run now`.
- Confirm C1 exact `true / 86400 / 10`; inspect only usage counts.
- Confirm due dispatch/reconciliation counts `0`; identify the historical manual-review fixture only as protected/excluded, without opening content.
- Confirm the rollback deploy IDs/values, password-manager custody, and one authorized operator.

Hard STOP: ambiguous payment; duplicate Payment evidence; fulfillment ownership ambiguity; unexpected Provider retry; duplicate dispatch/fulfillment; result inaccessible after verified Payment; email/notification ambiguity that threatens recovery; DB/schema drift; source/deploy mismatch; customer unexpectedly Public; or any live-mode Stripe object.

If Payment or result state is ambiguous: **do not purchase again; do not blindly retry Provider, fulfillment, Async, webhook resend, reconciliation, or email; perform read-only investigation first and require a new atomic Human decision.**

## 9. One Sandbox true-E2E script

1. Human opens the exact frozen customer deploy through the Private site gate. PASS: source SHA and Private visibility match; no public customer route.
2. Human starts one new self-owned consultation and submits once. PASS: one `production_preparations` / `production_prepayment_execution_authorities` lineage is created; anonymous intake makes no Provider call.
3. At method-first Auth, Human uses one already-proven method. The default script uses Email OTP; Google may replace it only if its existing Supabase configuration and both callback paths passed the same action-time proof. PASS: one Supabase Customer identity and ownership binding; no duplicate continuation; no email/identity logged.
4. The authenticated C1 preparation resumes. If the product asks its single allowed clarification, Human answers once and continues on the same authority. PASS: budget window `86400`, used units at most `10`, preparation ready, no fresh-key bypass or unexpected Provider retry. Ambiguity is STOP.
5. Human checks the final panel before paying: `税込 980円`, `1相談 / 1鑑定ノート`, `都度払い・自動更新なし`, Stripe/AI/non-guarantee/legal facts, and one `お支払いに進む`. PASS: exact source-owned eligibility is available; no client-invented readiness.
6. Human clicks once and verifies one Stripe Checkout Session in Sandbox/test, `mode=payment`, quantity `1`, amount `980`, currency `jpy`, product code `moon_reply_love_message_assessment_note_v1`. Complete with Stripe's official successful Sandbox card data. PASS: exactly one test Checkout/attempt; no live object. Do not repeat the click.
7. Stripe sends one allowed event to the Public ingress. PASS: raw-signature verification precedes parse/DB; ingress returns `2xx` only after durable acceptance; one ledger row reaches the valid disposition. A Stripe network redelivery may be idempotent, but Human must not manually resend.
8. Read-only DB check. PASS: intent `verified`, attempt `succeeded`, exactly one verified Payment with `980/jpy/test`, exactly one fulfillment job, no conflict/manual-review/duplicate economics.
9. Natural dispatch schedule claims once and the same-site Async router accepts event `production.fulfillment.job.v1`. PASS: one completed dispatch marker and one event for that job; no `Run now`, no second dispatch.
10. Background worker executes the accepted job. PASS: one logical assessment reaches completed, six ordered stage rows complete with model `gpt-5.6-luna`, one delivery is created, no unexpected Provider retry or manual-review state. Do not inspect Provider/result bodies in operator evidence.
11. Return page converges from strict server state to completed once. PASS: `paymentVerified` is durable-authority true, no fake progress, no repayment path, and navigation occurs once. If polling exhausts, use Account/read-only checks; never repurchase.
12. Human opens `/account`, sees the completed item, opens `/account/results/<deliveryId>`, and reads the canonical result. PASS: authenticated ownership succeeds and the result is accessible after verified Payment.
13. Check notification. PASS: one outbox row reaches `sent`, Resend has one accepted/delivered message, and the Human receives the completion email without result content leakage. If Account/result is sound but email is unclear, stop and investigate before any resend.
14. Record only bounded states/counts/timestamps and close the one-purchase authorization. Start the seven-day window only through authorization group I. No second purchase is implied.

## 10. Atomic Human authorization groups

- **A — Dedicated DB credential:** generate/store the secret, interactive `\password`, login/ACL proof, rotation/clear/NOLOGIN/session termination if needed.
- **B — Public ingress project:** create/link project, exact base/build/runtime, env-name scope, Auto Publishing Lock, and visibility changes.
- **C — Customer external configuration:** customer Netlify env names/values; Supabase Google/Email provider and redirect settings; Resend sender; Netlify Async Workloads linkage. Each service write remains separately confirmable inside this group; no secret value enters Chat/Codex.
- **D — Customer deploy/Publish:** build, inspect, and Publish each exact customer Deploy ID, including initial disabled, staged internal, schedule, and final purchase-gate phases.
- **E — Ingress deploy/Publish:** disabled deploy, public visibility, secret-captured disabled deploy, enabled deploy; each exact Deploy ID separately confirmed.
- **F — Stripe Sandbox endpoint:** read/pin API version, create exact four-event destination, capture secret, enable/disable/delete. No live endpoint.
- **G — Dispatch/reconciliation:** each dedicated schedule flag and each deploy/Publish is atomic; no `Run now`.
- **H — One Sandbox purchase:** exactly one Checkout/Purchase and its read-only outcome verification; ambiguity consumes the authorization and forbids retry.
- **I — Seven-day Self Dogfood:** starts only after H PASS; Human-only/Private/Sandbox/no-third-party. Any later purchase is a new H authorization.

## 11. Deferred items are not Self Dogfood blockers

No new source evidence promotes these items back into the Human-only Private Sandbox Self Dogfood gate:

- SEC-02 / M2-A2 legacy RPC containment: retain compatibility; PUBLIC/anon/authenticated remain zero; revoke/contract work requires later zero-use proof.
- M2-C2 distributed Auth/Checkout abuse controls: the process-local seams are bounded for one Human on a Private site, not External Beta/Public Launch authority.
- D1/D2 residual seller disclosure, external support/refund operation, unauthenticated fallback, monitoring, and Support activation: External Beta residue; `CUSTOMER_SUPPORT_CASES_ENABLED=false` during Self Dogfood.
- Full OPS/G1 dashboard/alerting: external-beta hard boundary; the read-only correlated checks in Section 7 are the minimum Self Dogfood control.
- AUTH optimization and Production telemetry: measure during Dogfood only after separate authority; `MEASUREMENT_ENABLED=false` initially.
- Broader ERR polish: existing strict Return/Account recovery plus the hard-stop rule is sufficient for bounded Self Dogfood; broader vocabulary remains deferred.

Any new source, DB, deploy, environment-name, provider, endpoint, visibility, due-count, or historical-fixture drift remains a hard STOP. This conclusion does not authorize Cycle 3.
