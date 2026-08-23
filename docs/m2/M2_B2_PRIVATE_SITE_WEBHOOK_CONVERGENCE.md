# M2-B2 Private Site / Stripe Webhook Convergence

## Decision record

- Task branch: `task/m2-b2-private-site-webhook-convergence-r1`
- Base authority: `release/private-ready@8fcb7861c45b2ff29a45d5bf1ac1207b957dc893`
- Scope: `REL-03` / `WEB-01` architecture, platform feasibility, security design, rollback, and synthetic rehearsal planning only.
- Decision: keep the customer project Private and create a separate, minimal Public Netlify ingress project from this repository. It exposes one exact `POST` function path, verifies the untouched Stripe body, and records evidence through a least-privilege wrapper over the existing database idempotency authority. It contains no customer, Account, Review, Checkout, Provider, email, or fulfillment-worker surface.
- Dispatch decision: the public ingress must not own the Provider worker or its secrets. After the durable payment/job transaction commits, a non-URL-addressable Scheduled Function in the Private customer project scans a bounded due set and requests the existing same-site Async Workload. Existing status reads remain a fenced opportunistic trigger; DB0016 dispatch claim/lease/marker semantics allow one router acceptance and preserve Async Workloads as the only post-acceptance retry authority.
- This task performed no Production Publish, Netlify/Stripe configuration write, webhook resend, Stripe API call, Purchase, Async event, Provider call, remote Supabase write, migration, or `main` change.

## 1. Current protection topology

Read-only evidence was captured on 2026-08-24.

| Layer | Current fact | Consequence |
| --- | --- | --- |
| Netlify Project Visibility | Production and previews are `Private`; Auto Publishing is locked | Unauthenticated traffic is rejected before application routing |
| Unauthenticated probes | `/`, `/review`, `/api/payments/stripe/webhook`, and a Functions-namespace path each returned `401` | Private visibility covers pages, the Next route, and Functions; Stripe cannot reach the current endpoint |
| Firewall / WAF | Traffic rules currently allow all; no path exception; WAF is not the visibility authority | Firewall IP/geography rules cannot create a safe webhook-only exception to Private visibility |
| `netlify.toml` | Only background runtime `included_files`; no redirects, proxy, edge routing, or visibility exception | Repository configuration contains no webhook bypass |
| Next `proxy.ts` | Matches `/account/**`, `/api/account/**`, `/api/auth/**`, and `/purchase/auth/**` only | `/review/**` has no application-level authentication and relies on site-level Private protection |
| Webhook route | Next Node route accepts POST, caps at 1 MiB, reads `request.arrayBuffer()` once, and verifies `Stripe-Signature` | The raw-body/security seam is reusable, but its current host is unreachable to Stripe |
| Stripe evidence | Supported event allowlist, environment/binding/economic checks, SHA-256, event ledger, verified-payment uniqueness, and one fulfillment job | Duplicate, conflicting, and out-of-order evidence converges at the database authority |
| Async dispatch | Same-site `AsyncWorkloadsClient`; DB0016 marker/claim/lease/completion; worker owns retry after router acceptance | Moving the webhook alone to another project must not silently retarget the event router |
| Reconciliation | Server-only service retrieves a persisted Checkout Session and records deterministic `reconcile_<sha256>` evidence | Miss recovery requires a Stripe API read and currently has no scheduler/route |

The existing reachability defect is therefore platform-level, not a missing Next redirect. Making the current project Public would expose `/review/**` and every other surface not independently authenticated. That is prohibited.

## 2. Official platform behavior

- [Netlify Project Visibility](https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/) states that a Private project is unreachable by unauthenticated requests and explicitly names Stripe webhooks as unsupported unless the project is Public. Visibility is a project/deploy setting; no path-level exception is documented.
- [Netlify Function configuration](https://docs.netlify.com/build/functions/configuration/?fn-language=js) allows one custom `path` and HTTP `method`; setting a custom path removes the default `/.netlify/functions/<name>` URL. `excludedPath` only changes function routing and does not bypass Project Visibility.
- [Netlify monorepo configuration](https://docs.netlify.com/build/configure-builds/monorepos/) supports multiple sites/apps from one repository with a package directory and site-local `netlify.toml`.
- [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) are platform-invoked, cannot be called through a production URL, run only from a published deploy on schedule, and have a 30-second limit.
- [Netlify Async Workloads sending](https://docs.netlify.com/build/async-workloads/sending-events/) documents same-site implicit routing and cross-site `baseUrl` plus `apiKey`. Cross-site access through this project's Private visibility is not documented; B2 must not assume that it bypasses the visibility layer.
- [Stripe Webhooks](https://docs.stripe.com/webhooks?lang=node) requires a publicly reachable HTTPS POST endpoint, retries failures with backoff, can duplicate events, and does not guarantee order.
- [Stripe signature verification](https://docs.stripe.com/webhooks/signature?lang=node) requires the exact, unmodified request body, signature header, and endpoint secret.
- [Stripe undelivered-event recovery](https://docs.stripe.com/webhooks/process-undelivered-events) requires a Stripe API read, database processing fences, and duplicate-safe success responses while automatic retries may still race.
- [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) confirms that secret/service-role keys have full data access and bypass RLS. A different secret key improves component rotation but does not create least privilege.
- [Supabase Postgres roles](https://supabase.com/docs/guides/database/postgres/roles) recommends a separate user for each trusted external service and supports object-level grants; [Database Functions](https://supabase.com/docs/guides/database/functions) documents explicit function grants and the required safe `search_path` discipline for `SECURITY DEFINER`.

## 3. Architecture candidates

| Candidate | Reachability / customer privacy | Security and correctness | Operations / rollback | Decision |
| --- | --- | --- | --- | --- |
| A. Path exclusion on current Private project | Infeasible: Project Visibility rejects unauthenticated Stripe before path routing | `excludedPath`, redirects, Edge Functions, and function paths cannot override visibility | No valid rollout exists | Reject |
| A2. Make current project Public and gate paths in app/Edge | Stripe reaches it, but `/review/**` and other surfaces lack complete app auth | One missed matcher or static/function route becomes an exposure; materially weakens origin/auth | High-risk exhaustive cutover; rollback can strand webhooks | Prohibited |
| B. Separate Public Netlify ingress project | Stripe reaches one Public project; customer project remains Private | Exact custom POST path, raw-body signature, scoped DB login/wrapper, existing idempotency; Private dispatcher preserves worker isolation | Same repository, straightforward endpoint/credential rollback; one extra project | **Recommend** |
| C. Isolated non-Netlify ingress service | Feasible and can be narrowly public | Same raw-body and secret requirements; adds a second platform/control plane | Higher cost, monitoring, IAM, and rollback complexity | Reserve fallback |
| D. Signed relay/proxy | Still needs a Public receiver | Extra signer/key and raw-body mutation risk; relay signature never replaces Stripe signature | More failure points; no benefit over B | Reject |
| E. Stripe EventBridge destination | Public HTTPS endpoint unnecessary | Changes event/auth/raw-body contract and introduces AWS infrastructure; does not preserve the required Stripe-signature contract | Materially different operating model | Reject for B2 |

## 4. Threat model and required controls

| Threat | Required control / proof |
| --- | --- |
| Spoofed request | Verify `Stripe-Signature` with the ingress endpoint's secret before accepting evidence; fail closed on missing/invalid signature |
| Raw-body mutation | Read bytes once, no JSON/body middleware before verification, retain 1 MiB bound, fixture-test whitespace/order/encoding mutations |
| Replay / duplicate | Stripe timestamp tolerance in the official library plus `provider_event_id` ledger identity; identical duplicate returns safe `2xx` without a second Payment/job |
| Different events for one payment | Purchase/session/payment/economics/environment bindings and verified-payment uniqueness; conflict becomes terminal/manual review, never a second fulfillment |
| Delayed/out-of-order event | Persist provider-created time; terminal success cannot regress; failure-before-success and success-before-failure matrices |
| Webhook/reconciliation race | Both evidence lanes enter the same record RPC and verified-payment/job uniqueness; one winner, duplicate/stale/conflict for the other |
| Router failure before acceptance | Durable job remains undispatched or gets bounded `dispatch_retry_after`; Private scheduler/status trigger reclaims through DB0016 dispatch fencing |
| Ambiguous router outcome | Existing marker with no completed acceptance and no explicit retry authority is quarantined; never open a second event |
| Public ingress compromise | No customer pages, Review, Checkout, Provider, email, AI, result, or Async worker; no Stripe API key/service-role key after verifier split; dedicated DB login has only wrapper `EXECUTE`; safe logs contain no body/signature/IDs/secrets |
| Enumeration / flood | POST-only custom path, default function URL absent, body limit, platform rate limit where plan supports it, bounded database work; signature remains authority even if IP defense is used |
| Config drift | Verifier asserts exact package directory, custom path/method, empty publish surface, secret allowlist, main project still Private, and no current `netlify.toml` regression |
| Dual-endpoint cutover | Database idempotency is the authority; overlap is permitted only during the bounded Sandbox cutover and must still yield one verified Payment/job |

Stripe IP filtering is optional defense in depth, not authentication and not the architecture. The endpoint secret must remain server-only and independently rotatable per endpoint.

The current `SUPABASE_SECRET_KEY` / legacy `service_role` is **not accepted** for the new Public ingress: official Supabase behavior gives it full data access with `BYPASSRLS`. A per-component Supabase secret is separately rotatable but still broad. B2 implementation must instead prove a dedicated Postgres login with no `BYPASSRLS`, no table privileges, and `EXECUTE` only on one webhook-record wrapper. That wrapper is `SECURITY DEFINER`, has empty `search_path`, hard-codes `evidence_source = 'webhook'`, delegates to the existing atomic v2 record authority, and is revoked from `PUBLIC`, `anon`, `authenticated`, and `service_role` unless a reviewed internal caller needs it. Credential creation/rotation is a separate secret operation and never enters Git or logs.

## 5. Recommended architecture

```text
Stripe
  -> Public ingress Netlify project
       -> exact POST path only
       -> size bound -> raw bytes -> signature/type/binding validation
       -> scoped DB login -> one definer wrapper -> existing atomic evidence RPC
       -> event ledger / verified payment / job

Private customer Netlify project (visibility unchanged)
  -> non-addressable Scheduled Function, bounded due scan
       -> existing DB0016 dispatch claim/lease/marker
       -> same-site Async Workloads router
       -> existing background worker (sole post-acceptance retry authority)

Customer Return / Account status read
  -> existing fenced opportunistic dispatch + canonical result recovery
```

The ingress acknowledges `2xx` only after invalid evidence has been rejected or the durable evidence transaction has committed. It does not wait for Provider fulfillment. This is a deliberate handoff change from “router accepted” to “database outbox committed”; it requires explicit implementation review and synthetic atomicity proof. A committed job is then browser-independent because the Private scheduled dispatcher owns bounded pre-router recovery.

Cross-site Async dispatch from the ingress is not the primary design. Although the SDK accepts `baseUrl`/`apiKey`, interaction with Private Project Visibility is undocumented, it expands secret scope, and it would make the public ingress responsible for private runtime routing. It may be tested later only as an isolated Sandbox feasibility experiment; failure must fall back to the scheduled outbox design, not to making the customer project Public.

## 6. Exact future change surface

No item below is implemented or authorized by this design commit.

| Future surface | Planned change |
| --- | --- |
| `services/stripe-webhook-ingress/package.json` | Minimal independent package and dependency set |
| `services/stripe-webhook-ingress/netlify.toml` | Empty/non-customer publish surface; one Functions directory; no proxy to the customer project |
| `services/stripe-webhook-ingress/netlify/functions/stripe-webhook.ts` | Custom exact path, `POST` only, raw byte limit, safe response/logging |
| `lib/payment/production/stripe.ts` | Split webhook signature verification from Checkout API client so ingress needs no `STRIPE_SECRET_KEY` |
| `lib/payment/production/application.ts` | Separate atomic evidence recording from immediate dispatch; retain current combined method for customer/reconciliation callers until tested cutover |
| `lib/payment/production/service.ts` | Add a minimal ingress-only service and a server-only due-dispatch/reconciliation service; do not load email/Provider/customer secrets in ingress |
| `lib/payment/production/types.ts` | Typed deferred-dispatch and bounded-recovery contracts |
| `lib/payment/production/supabase-repository.ts` | Bounded, ordered due-job and due-attempt inventory; service-role only; no customer-supplied selector |
| `supabase/migrations/0018_m2_b2_webhook_ingress_authority.sql` (candidate name) | Append-only dedicated NO-BYPASSRLS ingress role, one hardened webhook-only `SECURITY DEFINER` wrapper, exact grants/revokes; no password/secret in migration |
| `services/stripe-webhook-ingress/lib/scoped-database.ts` | Direct pooled Postgres client using the dedicated login; call only the wrapper; bounded timeouts/connections |
| `netlify/functions/production-payment-recovery-scheduled.ts` | Private-project Scheduled Function; bounded batch, overlap-safe DB claims, no URL |
| `netlify.toml` | Add only the scheduled-function declaration while preserving background `included_files` exactly |
| `scripts/verify-m2-b2-private-webhook-convergence.mjs` and package metadata | Topology, bundle, secret-import, route, raw-body, idempotency, race, scheduler, runtime-asset, and artifact assertions |
| Tests under the existing payment test surface | Synthetic signatures, duplicates/order/races, due-scan concurrency, dispatch ambiguity, reconciliation outcomes |

The current DB0016 columns and atomic dispatch RPC can fence concurrent schedulers by job ID, so no new dispatch-state columns are assumed. A successor migration is nevertheless expected for least-privilege ingress authority. If exact implementation proof also shows that a safe bounded due scan cannot be expressed without broad access or lost atomicity, add that selector to the same reviewed successor or stop for another append-only proposal; never modify DB0017 or migration history.

Ingress secret allowlist target: `PAYMENT_ENVIRONMENT`, `STRIPE_WEBHOOK_ENABLED`, `STRIPE_WEBHOOK_SECRET`, and one dedicated ingress database connection secret. Explicitly absent: Supabase secret/service-role key, Stripe API/Checkout key, OpenAI/Provider keys, email credentials, customer-session/capability secrets, encryption keys, and Async Workloads key.

## 7. Rollback / recovery

1. Never change the current customer project's Private visibility, including during rehearsal.
2. Before Stripe endpoint cutover, preserve the previous endpoint ID/config and both endpoint secrets without logging them.
3. If ingress validation or persistence fails before cutover, leave Stripe unchanged, disable the unpublished ingress deploy, and revoke/rotate only the dedicated ingress DB credential.
4. During Sandbox overlap, remove/disable the new endpoint and restore the previous exact endpoint if acceptance fails. Duplicate deliveries remain safe through the event ledger.
5. Disable the scheduled recovery flag before reverting its code. A durable undispatched job remains recoverable through the accepted forward path/status trigger; never delete ledger/payment/job rows.
6. After a Production evidence commit, do not repair migration history or roll DB bodies back. Quarantine ambiguous dispatches and use an append-only forward fix if a durable invariant is defective.
7. Stop new Checkout before any emergency visibility or endpoint operation. Making the customer project Public is never a rollback action.

## 8. Sandbox rehearsal plan

Every external step requires fresh Human action-time confirmation.

1. Local-only tests: exact raw body, missing/wrong/old signature, whitespace/key-order/encoding mutation, unsupported type, wrong environment/session/purchase/economics, oversize body, and non-POST methods.
2. Local disposable DB: dedicated role has wrapper-only authority and cannot select/mutate tables or call non-target RPCs; identical duplicate, concurrent duplicate, two-event same payment, failure/success in both orders, webhook/reconciliation in both orders, and exactly one verified Payment/job.
3. Scheduled recovery fixture: bounded ordered selection; two simultaneous schedulers; fresh job, explicit retry-after, active lease, expired pre-router lease, completed dispatch, terminal job, and ambiguous marker. Prove one router send and zero post-acceptance competing retry.
4. Build both packages locally; assert ingress bundle/import graph contains no customer page, `/review`, Checkout creation, Provider, email, fulfillment worker, prompts/schemas, or forbidden secrets.
5. Create a separate ingress Netlify project but keep it non-operational until reviewed. Confirm root/customer/review/default-function URLs are absent and only the exact POST path is configured.
6. Under separate publish authority, publish the reviewed recovery scheduler to the customer project while its Production visibility remains Private; Scheduled Functions do not run automatically from an unpublished deploy.
7. Under a new configuration confirmation, make only the ingress project Public, configure Sandbox-only secrets, and create a Stripe Sandbox endpoint for only the required event types.
8. Send one controlled Sandbox fixture/event only when separately authorized. Verify valid `2xx`, invalid `4xx`, duplicate `2xx`, one ledger/payment/job, Private scheduled dispatch, Async acceptance, and current customer `/` and `/review` still unauthenticated `401`.
9. Exercise missed-webhook reconciliation with synthetic/local adapters first. Any real Stripe API read or event replay is a separate action and is not authorized by this plan.
10. Disable the Sandbox endpoint and ingress/recovery flags; confirm rollback leaves the customer project Private and durable rows intact.

## 9. Missed-webhook reconciliation

### Current reconstructable authority

- `production_payment_attempts` persists attempt ID, purchase intent, state, provider Checkout Session ID (when attached), provider Payment ID, and provider event time.
- `reconcileProductionStripePaymentAttempt(attemptId)` retrieves the attached Checkout Session with expanded Payment Intent, validates the stored purchase binding, and emits deterministic reconciliation evidence.
- `record_rc2_stripe_evidence_v2` and related uniqueness/fencing make webhook and reconciliation converge without double Payment or fulfillment.
- Attempts with no attached Checkout Session cannot be reconstructed by this service. They remain the existing idempotent Checkout-creation recovery lane and must not be converted into an automatic new Checkout.

### Scheduled recovery design

- Private Scheduled Function selects a small ordered batch of non-terminal attempts with an attached session, age beyond a safety threshold, and no durable successful Payment. Candidate states are `pending`, `processing`, and `unknown`; `reserved` without a session, `failed`, `canceled`, and `succeeded` are excluded.
- A repository claim/lease or equivalent atomic selector must ensure overlapping schedules do not multiply Stripe reads. If current rows cannot support that safely, an append-only lease/outbox successor is required under separate authorization.
- Each claimed attempt performs one bounded Stripe Checkout Session read. Network ambiguity records `unknown` and a capped next eligibility; it never creates Checkout or claims Payment.
- Retrieved evidence enters the same database record path. Webhook-before-reconciliation, reconciliation-before-webhook, automatic Stripe retry, and concurrent schedule races must produce exactly one successful Payment and one fulfillment job.
- The primary automatic recovery is per-attempt Checkout Session retrieval. Stripe's undelivered-event listing is an operator incident tool only: it needs a real API read, is limited in retention, and must use database processing fences while automatic retries continue.
- Observability records only internal correlation IDs, state/disposition, attempt count, and bounded timestamps/error codes. It must not log webhook bodies, signatures, secrets, Checkout URLs, email, consultation content, result tokens, or provider payloads.

## 10. Human action-time confirmation boundaries

Separate fresh authorization is mandatory before each class of action:

- create/link or change a Netlify ingress project;
- create/alter the dedicated database login, set/rotate its credential, apply the wrapper migration, or change its grants;
- change either project's visibility, build settings, Functions configuration, environment variables, rate limits, domains, or deploy/publish state;
- add or rotate the Stripe webhook endpoint/secret or event allowlist;
- send/resend a Stripe event, perform a Stripe API read, or create a Purchase;
- enable/run a Scheduled Function or emit an Async event;
- apply any remote database migration or change grants/policies;
- publish the customer runtime or cut over/roll back Production traffic.

Action-time preflight must pin the exact Git commit, ingress bundle hash, endpoint path/method, secret-name allowlist (presence only), current and proposed Netlify visibility, current Stripe endpoint state, DB history, verification matrix, execution count, and rollback target. Any drift stops the action; no retry after an ambiguous external result.

## Verification completed in this design task

- B1 authority integration: exact ff-only `8fcb7861c45b2ff29a45d5bf1ac1207b957dc893`.
- New Netlify Production build: exact source, successful, `38/38` static pages, 11 Functions and 1 Edge Function, UNPUBLISHED; Auto Publishing remained locked.
- Published source remained `0befd512219eb2897fb1edf969ad37d7e8c56b0d`.
- `verify:m1-4:background-runtime-assets`: PASS.
- `verify:m1-4:async-router-artifacts`: PASS.
- `verify:m1-4:async-router-worker-graph`: PASS (`104` modules / `352` edges).
- `verify:rc2`: PASS `50/50`; external operations `0`.
