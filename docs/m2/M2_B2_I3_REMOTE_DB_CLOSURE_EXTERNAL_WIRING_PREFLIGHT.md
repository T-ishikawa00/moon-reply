# M2-B2-I3 Remote DB Closure / External Sandbox Wiring Preflight

## Status and authority boundary

- Base authority: `release/private-ready@d38ee363cf2b74823180b80364430eb82b7189b6`.
- Task branch: `task/m2-b2-i3-remote-closure-wiring-preflight-r1`.
- Remote database: exact `0002..0019`; pending `0`; unknown `0`.
- Applied 0018 Git-blob SHA-256: `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010`.
- Applied 0019 Git-blob SHA-256: `b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c`.
- Current customer Published source: `0befd512219eb2897fb1edf969ad37d7e8c56b0d`.
- Reviewed current-source deploy: `6a8bf7a11d6580000811392c`, exact `d38ee363`, successful, UNPUBLISHED, Auto Publishing Locked.

This is a B2-internal closure and wiring runbook, not a new Milestone or Gate. I3 changes documentation only. It performs no database write, credential/password operation, Netlify project/configuration/deploy/publish/visibility change, Stripe operation, scheduler invocation, Async event, Purchase, Provider/OpenAI call, email, or `main` change.

## 1. Canonical remote DB closure

Revised 0018 and unchanged 0019 were applied exactly once in one reviewed remote push. The earlier 0018 candidate `53cd8f20be9a50569060f6566d04092bbe4613366c543e1d3b0643e3fd2c7805` failed at its own guard, rolled back transactionally, was never recorded, and is permanently superseded. It must never be retried.

Remote postflight established:

- `public.rls_auto_enable()` lost only PUBLIC EXECUTE; explicit postgres/anon/authenticated/service_role grants remain;
- `rls_auto_enable()` body, signature, owner, security, search path, and OID remain unchanged;
- `ensure_rls` remains enabled with the same function binding, event, and exact DDL tags;
- `m2_b2_stripe_ingress` is LOGIN with `PASSWORD NULL`, no inheritance/elevated role attributes, and connection limit four;
- the ingress has USAGE on `private_payment_ingress` and EXECUTE only on `record_stripe_webhook_evidence_v1`; application relation, sequence, non-target function, and schema CREATE authority are zero;
- postgres-owned future functions receive no implicit PUBLIC EXECUTE and require an explicit intended-role GRANT;
- 0019 reconciliation metadata, four constraints, one partial index, and two service-role-only RPCs are present;
- DB0016 dispatch and DB0017 NULL-fence identities remain unchanged;
- existing payment-attempt business state did not change during migration.

The DB foundation is therefore remotely closed. B2 as a whole remains open until isolated external wiring, customer Publish, and controlled Sandbox E2E complete.

## 2. Locked activation topology

```text
Stripe Sandbox
  -> separate Public Netlify ingress project
  -> POST /api/payments/stripe/webhook only
  -> exact raw-body Stripe signature verification
  -> dedicated verify-full Postgres login
  -> private_payment_ingress.record_stripe_webhook_evidence_v1
  -> durable Stripe evidence / verified Payment / fulfillment job

Private customer Netlify project
  -> accepted Published customer runtime
  -> production-fulfillment-dispatch-scheduled
  -> same-site Async Workloads router
  -> production-fulfillment-background
  -> result / Account / completion email

Private customer reconciliation scheduler
  -> persisted Checkout Session READ only
  -> 0019 owner / lease / retry / budget fence
  -> existing record_rc2_stripe_evidence_v2 authority
```

The customer project and `/review/**` remain Private throughout rehearsal, cutover, incident response, and rollback. The Public ingress never owns customer pages, Review, Checkout creation, Provider/OpenAI, email, result handling, fulfillment execution, or Async routing.

## 3. Current source contract

### Public ingress package

Repository: `T-ishikawa00/moon-reply`.

Effective build root must be `services/stripe-webhook-ingress`. The future Netlify project must set Base directory to that exact path and leave Package directory unset because it is not different from the base. If Netlify auto-detection produces another effective base/package combination, stop and correct it before any deploy. Build logs must prove `npm run build` executed against the ingress package, not the repository-root customer package.

Repository-owned settings are:

- build command: `npm run build`;
- publish directory: `dist/public` and intentionally empty;
- Functions directory: `dist/functions`;
- bundler: `esbuild`;
- entry: `src/stripe-webhook.ts` -> `dist/functions/stripe-webhook.mjs`;
- exact custom surface: `POST /api/payments/stripe/webhook`;
- body: one `arrayBuffer()` read with declared and actual limit `1,048,576` bytes;
- signature: official Stripe verifier over unchanged bytes and `Stripe-Signature`;
- acknowledgment: `2xx` only for valid unsupported evidence or after durable wrapper commit;
- disabled state: any `STRIPE_WEBHOOK_ENABLED` value other than exact `true` fails closed with `404`.

The exact five application-owned environment keys are:

1. `PAYMENT_ENVIRONMENT`
2. `STRIPE_WEBHOOK_ENABLED`
3. `STRIPE_WEBHOOK_SECRET`
4. `STRIPE_INGRESS_DATABASE_URL`
5. `STRIPE_INGRESS_DATABASE_CA_PEM`

The Public ingress must receive no `STRIPE_SECRET_KEY`, Supabase secret/service-role key, postgres/admin credential, OpenAI/Provider key, email/Resend credential, customer Auth/session/capability secret, encryption secret, Async Workloads key, or customer-project shared secret. The source allowlist is a verifier contract, not a runtime guarantee that Netlify injected no additional team/shared variables. Action-time preflight must inventory effective Production/Functions environment names without reading values and stop on any forbidden inherited name.

`STRIPE_INGRESS_DATABASE_URL` must remain a transaction-pooler URL accepted by source: `postgres`/`postgresql`, `*.pooler.supabase.com`, port `6543`, database `/postgres`, ingress username prefix, nonempty password, exactly one `sslmode=verify-full`, and no other query key or fragment. Runtime independently pins the configured CA, requires `rejectUnauthorized: true`, and performs hostname/SNI verification.

### Exact Stripe Sandbox event allowlist

The future endpoint subscribes to exactly:

1. `checkout.session.completed`
2. `checkout.session.async_payment_succeeded`
3. `checkout.session.async_payment_failed`
4. `checkout.session.expired`

Do not subscribe to `*` or any additional event. The endpoint is for the account itself, not Connected accounts. It is Sandbox/test mode only, uses an independent endpoint signing secret, creates no live endpoint, and performs no real payment.

### Private customer schedules

- `production-fulfillment-dispatch-scheduled`: `* * * * *`; batch four; serial; 22-second run budget; DB0016 30-second dispatch lease; same-site Async only after claim; no Stripe/Provider/customer selection.
- `production-payment-reconciliation-scheduled`: `*/5 * * * *`; batch four; concurrency two; two-minute webhook grace; 24-second lease; five-read budget; Stripe retry zero and timeout five seconds; persisted Session READ only; no Checkout creation and no direct dispatch.

The root `production-fulfillment-background` `included_files` block remains protected. Scheduled Functions run automatically only for a Published deploy and cannot be staged safely merely by leaving a deploy UNPUBLISHED. Netlify also captures Function environment values at deploy creation; changing settings requires another build/deploy before the new value can run. See [Netlify Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) and [Function environment variables](https://docs.netlify.com/build/functions/environment-variables/).

## 4. Action-time blockers discovered by I3

The topology is sound, but current `d38ee363` is not a safe final customer cutover candidate.

### 4.1 Dedicated scheduler safe-off flags are missing

Dispatch currently depends on the broader `PAYMENT_FULFILLMENT_PROCESSING_ENABLED`/emergency-stop contract. Reconciliation currently depends on the broader `STRIPE_RECONCILIATION_ENABLED`/payment-emergency-stop contract. If those accepted Production values are already enabled, publishing the current source can immediately send existing due jobs to Async or read existing persisted Stripe Sessions.

Before the next customer Publish, a bounded B2 source hardening must add:

- `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED`, exact `true` to run and default false/fail closed;
- `STRIPE_RECONCILIATION_SCHEDULED_ENABLED`, exact `true` to run and default false/fail closed.

Each remains subordinate to its existing processing-enabled and emergency-stop authority. Both must enter the customer activation-readiness verifier. This is a B2 cutover prerequisite, not a new Milestone or Gate.

### 4.2 Environment changes are deploy-versioned

Every enable/disable, secret rotation, or emergency-stop change must produce a new build that captures the intended environment, then identify and verify the exact Deploy ID before Publish. An environment edit alone does not alter the currently Published Function. Auto Publishing must remain locked for both projects.

### 4.3 Effective secret isolation is not proven by source imports

The separate ingress project provides the real project-level credential boundary. Before a Public deploy, read effective environment names for Production + Functions scope, including team/shared inheritance, and prove only the five application keys plus documented Netlify platform-provided names are present. Deploy Preview, Branch deploy, and local contexts receive none of the five secrets. If shared-variable exclusion cannot be proven, stop.

The two Private schedules have source/import and responsibility separation but share one customer-project environment. Do not describe them as separate Netlify credential stores. Dispatch must remain incapable by source path of Stripe/provider use; reconciliation must remain incapable by source path of Async dispatch and Provider/email work.

### 4.4 Build/runtime and endpoint versions need exact pins

`esbuild target: node22` does not pin the Netlify build or Function runtime. Before Public ingress creation, add and review a source-controlled Node 22 build pin in the ingress base, then confirm the actual Function runtime in the deploy artifact. Do not add a sixth application env key merely to work around this requirement.

Because the ingress build marks packages external, the first actual Netlify ZIP must prove `postgres@3.4.9` and `stripe@22.5.0` are packaged, the function dynamically imports, and import-time external operations remain zero.

The Stripe endpoint API version is not pinned in repository source. At action-time, read the Sandbox account/endpoint version without event/API mutation, select an exact version reviewed against the pinned Stripe SDK and accepted session schema, and record it before endpoint creation. Do not infer or guess it.

## 5. Dedicated credential operation plan

Credential provisioning requires a new Human action-time authorization. Do not use the Supabase SQL editor, a literal `ALTER ROLE ... PASSWORD '<secret>'`, CLI argument, command history, source file, `.env` file, Chat/Codex message, log, or build artifact.

Exact procedure:

1. Freeze authority, remote history `0002..0019`, accepted migration hashes, role OID/attributes, `PASSWORD NULL`, wrapper identity, ACL matrix, Data API schemas, and ingress privilege preflight.
2. Human generates at least 32 cryptographically random bytes locally and retains the base64url credential only in a Human-controlled password manager. Codex receives only presence/disposition, never the value.
3. Open one interactive `psql -X --no-readline` administrative session over verified TLS using a secure connection prompt/service configuration that does not place the admin password in arguments or output.
4. Run only `\password m2_b2_stripe_ingress`. Enter the locally generated credential twice at the hidden prompts. PostgreSQL documents that `\password` encrypts the value client-side and avoids cleartext command history/server-log exposure: [psql `\password`](https://www.postgresql.org/docs/current/app-psql.html).
5. Exit the administrative session. Do not print the generated password or the resulting verifier/hash.
6. Read catalog booleans only: LOGIN true; password non-null true; INHERIT/SUPERUSER/BYPASSRLS/CREATEDB/CREATEROLE/REPLICATION false; connection limit four; exact role settings unchanged.
7. Re-run the branch-independent ingress privilege preflight and confirm wrapper-only authority, relation/sequence/non-target function/schema CREATE zero, and Data API exposure unchanged.
8. From a separate verified-TLS client, use the dedicated login for read-only identity/privilege checks only. Do not invoke the evidence wrapper because it is a write path. Record only success/failure and bounded booleans.
9. Construct the ingress pooler URL in secure configuration from the password-manager value. Never fall back to service_role, a Supabase secret key, postgres, or an Async key if the dedicated login fails.

### Rotation

For planned rotation with no controlled event in flight:

1. stop new Checkout/Purchase;
2. disable the Stripe Sandbox destination;
3. publish a reviewed ingress deploy captured with `STRIPE_WEBHOOK_ENABLED=false` and confirm the endpoint returns its disabled disposition;
4. generate a new random credential and use interactive `\password` once;
5. update only `STRIPE_INGRESS_DATABASE_URL`, create a new disabled ingress deploy, verify its exact ID/TLS/wrapper-only login, then publish it;
6. re-enable ingress and Stripe only through the reviewed activation sequence;
7. never restore or reuse the old credential.

### Emergency containment

If the ingress project or credential may be compromised, database containment takes precedence over the normal pre-event order: set the role `NOLOGIN` and `PASSWORD NULL`, terminate existing sessions owned by `m2_b2_stripe_ingress`, then disable the Stripe destination and publish a disabled/private ingress deploy. `NOLOGIN` or password rotation alone does not terminate existing sessions. Restore LOGIN only with a new credential after a separately reviewed incident recovery. Migrations and durable evidence remain untouched.

## 6. Separate Public Netlify ingress project plan

No project exists yet. Future action-time configuration is:

- repository: `T-ishikawa00/moon-reply`;
- Base directory: `services/stripe-webhook-ingress`;
- Package directory: unset because it is identical to the base;
- configuration file: the package-local `netlify.toml`;
- build: `npm run build`;
- publish: `dist/public` and empty;
- functions: `dist/functions`;
- Production Auto Publishing: locked/manual exact-Deploy-ID Publish;
- initial project visibility: Private while build/artifact/config are verified;
- later ingress visibility: Public only after the disabled exact deploy passes;
- customer project visibility: Private, unchanged;
- initial `PAYMENT_ENVIRONMENT=test` and `STRIPE_WEBHOOK_ENABLED=false`;
- secrets: Production context + Functions scope only; no values for previews/branches/local;
- application env-name ceiling: exact five keys above;
- no redirect/proxy/root/customer/Review/static/default-Functions surface.

Netlify currently recommends a package-local configuration for monorepos and requires paths to resolve against the effective base; action-time must compare the resolved build configuration to repository intent before build: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/) and [Functions configuration](https://docs.netlify.com/build/functions/configuration/).

Disabled-deploy verification must prove:

- exact Git source and ingress package lockfile;
- Node pin and actual runtime;
- build success and empty publish directory;
- exactly one custom POST path and no default `/.netlify/functions/stripe-webhook` reachability;
- GET/other methods rejected, oversize rejected, disabled POST fail closed;
- actual ZIP includes/imports the external dependencies and performs zero import-time network/database work;
- effective env names meet the five-key/platform-only boundary;
- logs contain no body, signature, endpoint secret, DB URL/password, provider IDs, customer data, or stack detail;
- Auto Publishing stays locked.

## 7. Stripe Sandbox endpoint plan

Endpoint creation is a separate Stripe write and remains prohibited in I3. The future Workbench operation must:

1. confirm Sandbox/test mode and own-account events, not live mode or Connected accounts;
2. pin the reviewed exact Stripe API version;
3. set the exact Public ingress HTTPS URL plus `/api/payments/stripe/webhook`;
4. select exactly the four repository event types and never `*`;
5. create one endpoint-specific signing secret, place it only in `STRIPE_WEBHOOK_SECRET`, and never copy it to the customer project;
6. leave/return the destination disabled until a new disabled ingress deploy has captured and verified the secret;
7. perform no test event, resend, Stripe API read, Purchase, or real payment until separately authorized.

Stripe requires a publicly reachable HTTPS URL, exact raw-body signature verification, endpoint-specific secrets, duplicate safety, and the minimum required event list: [Stripe webhooks](https://docs.stripe.com/webhooks) and [Workbench event destinations](https://docs.stripe.com/workbench/event-destinations).

## 8. Mixed-version prevention and SEC-01

Do not activate Stripe delivery against the new ingress while customer Production remains `0befd512219eb2897fb1edf969ad37d7e8c56b0d`. The ingress could commit a durable Payment/job while B1 Return convergence and the browser-independent schedules remain unpublished.

`STRIPE_WEBHOOK_ENABLED=true`, Stripe destination enablement, and any controlled Sandbox event belong only to the final reviewed cutover. Current deploy `6a8bf7a11d6580000811392c` must not be Published as that cutover candidate because:

- Production Publish is not authorized;
- SEC-01 has not evaluated the planned 2026-08-26 Next security release;
- the two scheduler-specific default-false flags are absent;
- the current deploy did not capture future cutover environment values.

SEC-01 remains a separate task. Do not guess-upgrade Next 16.3.0 in I3.

## 9. Exact future cutover sequence

No step below is authorized by I3. Each external write and Publish requires fresh Human action-time confirmation.

### A. Freeze accepted source

The final customer authority contains B1, B2 I1/I2/R3, SEC-01, the two scheduler-specific default-false flags, and their activation/artifact verification. The ingress authority additionally contains the reviewed Node pin. Freeze Git refs, migration identities, both project visibilities, effective env-name baselines, Stripe Sandbox endpoint baseline, and rollback targets.

### B. Provision the dedicated DB credential

Execute the `\password` procedure once. Verify password-present boolean, unchanged role attributes, wrapper-only authority, verified-TLS dedicated login, and no service-role fallback.

### C. Create the separate ingress project disabled

Create/link the exact repository with the exact ingress base, Private visibility, Auto Publishing Locked, Production/Functions-only config, `PAYMENT_ENVIRONMENT=test`, and `STRIPE_WEBHOOK_ENABLED=false`. Prove no inherited forbidden env names.

### D. Build and publish a disabled ingress deploy

Build exact source, inspect the real ZIP/dependencies/surface/log policy, publish the exact disabled Deploy ID, then make only the ingress project Public. Verify root/customer/review/default-function paths are absent and the custom POST remains fail closed. Customer project stays Private.

### E. Create the Stripe Sandbox endpoint

Create the exact four-event, own-account, pinned-version endpoint at the exact Public URL. Capture its independent signing secret securely and leave/return the destination disabled. No event or Purchase.

### F. Capture the webhook secret in a disabled ingress deploy

Configure `STRIPE_WEBHOOK_SECRET` while `STRIPE_WEBHOOK_ENABLED=false`, build a new exact-source deploy because env changes are deploy-versioned, inspect it, and publish that exact disabled Deploy ID. Keep the Stripe destination disabled.

### G. Publish the final customer runtime safely

Publish the exact accepted customer Deploy ID containing B1, both schedules, Async/background artifacts, SEC-01, and both dedicated schedule flags captured false. Customer visibility remains Private and Auto Publishing remains locked.

### H. Activate schedules without an external event

Observe both schedules boot/no-op with dedicated flags false; do not use Run now. Obtain count-only due-job and due-reconciliation-attempt inventories. Under explicit authority, enable dispatch first through a new exact Deploy ID, verify no unauthorized existing send, then enable reconciliation through another exact Deploy ID after approving its bounded Stripe READ budget. Every flag change requires build, exact ID verification, and Publish.

### I. Enable ingress last

After the Private schedules and Account/Return runtime are live, set `STRIPE_WEBHOOK_ENABLED=true`, build and verify a new exact ingress Deploy ID, publish it, then enable the Stripe Sandbox destination. This is the first point at which new webhook delivery may commit durable evidence.

### J. Send one separately authorized controlled Sandbox event/Purchase

Do not reuse an old event or use a live payment. Track exact operation count, do not retry an ambiguous result, and stop for read-only outcome confirmation.

### K. Verify true E2E

Verify Stripe -> Public ingress -> DB evidence/Payment/job -> Private dispatch scheduler -> same-site Async -> worker -> result -> Account -> Return convergence -> completion email. Confirm duplicate delivery produces one Payment/job/result and no second charge/fulfillment. Customer and Review surfaces remain Private throughout.

## 10. Rollback and recovery

### Pre-event/planned rollback

1. Stop new Checkout/Purchase.
2. Disable the Stripe Sandbox destination.
3. Publish an exact ingress deploy captured with `STRIPE_WEBHOOK_ENABLED=false`, or return the ingress project to Private if the endpoint itself is suspect.
4. Confirm no in-flight delivery remains.
5. Clear or rotate the dedicated DB credential; terminate ingress sessions when immediate containment is required.
6. Keep the customer project Private. Do not roll back 0018/0019 or repair migration history.

### After durable Payment/job exists

1. Disable external ingress first so no new durable jobs can be committed.
2. Preserve event, Payment, attempt, job, grant, result, and notification evidence; delete nothing.
3. Keep dispatch/Account recovery available for already committed work unless the incident specifically requires containment. If schedules must stop, do so only after ingress is off and durable backlog disposition is known.
4. Use count/state-only inventory, current fences, and append-only forward fixes. Never edit/delete 0018/0019 or restore an old compromised credential.
5. The old customer webhook behind Private visibility is not a reachable fallback, and making the customer project Public is never a rollback action.

## 11. Human action-time confirmation boundaries

Fresh Human confirmation is required immediately before each of:

- credential generation/use, `\password`, rotation, clear, NOLOGIN, or session termination;
- Netlify project creation/linkage, base/package/build/runtime setting, effective env configuration, visibility change, deploy, or Publish;
- Stripe endpoint creation/version/event list/secret/enable/disable/delete;
- customer or ingress exact Deploy-ID Publish;
- schedule flag activation or Run now;
- Stripe read/event/resend/Purchase;
- real Async event, Provider/OpenAI, or email action.

Any Git, migration, role/ACL, env-name, visibility, endpoint, API-version, build-artifact, due-count, or rollback-target drift is a hard STOP. An ambiguous external result is never retried without read-only outcome confirmation and new authority.
