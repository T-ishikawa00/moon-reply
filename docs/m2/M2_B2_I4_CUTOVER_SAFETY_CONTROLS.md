# M2-B2-I4 Cutover Safety Controls

## Status and boundary

- Base authority: `release/private-ready@680398b243f69f80cab6392cc6155ed0be789120` after exact ff-only I3 integration.
- Task branch: `task/m2-b2-i4-cutover-safety-controls-r1`.
- Remote database remains exact `0002..0019`; pending `0`, unknown `0`.
- 0018 SHA-256 remains `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010`.
- 0019 SHA-256 remains `b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c`.
- Current Published customer source remains `0befd512219eb2897fb1edf969ad37d7e8c56b0d`.

I4 is a B2-internal source hardening task, not a new Milestone or Gate. It performs no remote database write, migration, credential/password operation, Netlify project/config/deploy/publish/visibility change, scheduler invocation, Stripe operation, Purchase, real Async event, Provider/OpenAI call, email, or `main` change.

## Dedicated schedule authority

The two Private Scheduled Functions now require independent exact-true gates:

| Schedule | Dedicated gate | Existing required authority | Existing stop authority |
| --- | --- | --- | --- |
| Fulfillment dispatch | `PAYMENT_FULFILLMENT_DISPATCH_SCHEDULED_ENABLED=true` | `PAYMENT_FULFILLMENT_PROCESSING_ENABLED=true` | `PAYMENT_FULFILLMENT_EMERGENCY_STOP!=true` |
| Payment reconciliation | `STRIPE_RECONCILIATION_SCHEDULED_ENABLED=true` | `STRIPE_RECONCILIATION_ENABLED=true` | `PAYMENT_EMERGENCY_STOP!=true` |

Only the exact string `true` enables a dedicated gate. Missing, empty, `false`, malformed, differently cased, numeric-looking, or whitespace-padded values are disabled. The dedicated gates are additional subordinate controls; they do not replace or weaken existing processing, reconciliation, or emergency-stop authority and do not alter customer Checkout visibility.

When a dedicated gate is disabled, the configured runtime service returns exact `{ "disabled": true }`. The Netlify wrapper serializes that outcome as JSON with HTTP `200`. The return happens before scheduler database environment reads, Supabase repository construction, Stripe environment reads/client construction, Async Workloads client creation, DB RPCs, Provider/email work, or customer-data access. A deployed schedule with both gates false is therefore an operational no-op rather than a recurring false-positive `5xx`.

If a dedicated gate is true while its broader authority is false or its existing emergency stop is true, the existing unavailable error remains unchanged and no external dependency is initialized. With every required authority true, the accepted bounded dispatch/reconciliation core is unchanged.

Both values are declared exactly once as `false` in `.env.example`. The branch-independent I4 verifier treats exact false as the required initial cutover state and also proves that neither flag is inferred from its broader parent flag. A later value change is deploy-versioned and requires a fresh exact Deploy ID, review, and Human Publish authorization.

## Schedule and runtime invariants

- Dispatch cadence remains `* * * * *`; reconciliation remains `*/5 * * * *`.
- Dispatch retains batch four, serial DB0016 claim/marker/owner/lease/retry/ambiguity fencing, 22-second budget, and one same-site Async acceptance.
- Reconciliation retains batch four, concurrency two, two-minute webhook grace, 24-second lease, five-read durable budget, Stripe retry zero/timeout five seconds, and no Checkout creation/direct dispatch.
- `production-fulfillment-background` and its `included_files` remain unchanged. An already accepted Async event is not gated by the new dispatch-schedule flag.
- Actual Scheduled Function ZIPs must remain syntax-valid and dynamically importable with `server-only=0`, exact manifests/cadence, disabled HTTP `200`, and import/invocation fetch calls `0`. Disabled configured-runtime proof also omits all credentials and requires success, which proves the dependency readers and client constructors were not reached.

## Public ingress Node 22 pin

The planned separate ingress project requires exact Base Directory `services/stripe-webhook-ingress`; no project exists yet, so the resolved remote base remains action-time evidence. I4 adds the single source-controlled file `services/stripe-webhook-ingress/.node-version` containing major `22` at that required base. Netlify officially searches the site base for `.node-version`/`.nvmrc`; a major value selects the current patched release in that supported major. See [Manage build dependencies](https://docs.netlify.com/build/configure-builds/manage-dependencies/) and [available build software](https://docs.netlify.com/build/configure-builds/available-software-at-build-time/).

`package.json#engines`, esbuild `target: node22`, `@types/node`, and `node_bundler` are not treated as Netlify runtime selectors. No sixth application environment variable is added. The required future base contains no `.nvmrc` that could override `.node-version`.

For Functions deployed on current Netlify, the runtime normally follows the build Node version, but an unsupported/deprecating Lambda runtime can fall back to Netlify's current default. `AWS_LAMBDA_JS_RUNTIME` is external project configuration and cannot be set in `netlify.toml`. Therefore local evidence proves the source pin, build graph, ZIP dependency presence, syntax, and importability, but not the actual remote build/runtime version or absence of an external override. Build log `node --version`, effective base, effective `NODE_VERSION`/`AWS_LAMBDA_JS_RUNTIME` names without secret values, and deployed Function runtime remain mandatory action-time checks. See [Netlify Functions runtime](https://docs.netlify.com/build/functions/configuration/#node-js-version-for-runtime).

## Ingress artifact contract

The branch-independent I4 proof builds from the ingress package and creates a local Netlify ZIP. It requires:

- source pin `22` at the required future base;
- exact `postgres@3.4.9` and `stripe@22.5.0` in source and the actual ZIP;
- esbuild target Node 22 and external-package packaging;
- empty `dist/public`;
- exact `/api/payments/stripe/webhook` path;
- dynamic import success with import-time fetch calls `0`;
- no customer/Review/Account/fulfillment surface or forbidden Stripe API, Supabase service-role, Async, Provider/OpenAI, email, or customer Auth secret name in the built function.

The local ZIP does not prove Netlify project Base/Package resolution, Linux/native ABI, deployed cold start, Public visibility, Production method routing, effective environment scope, verified remote TLS, or actual Function runtime. Those remain external cutover preflight items and must not be inferred from local PASS.

## Preserved contracts and stop boundary

0018/0019, DB0016/0017, migration history, event allowlist, raw-body signature verification, ingress DB authority/TLS, schedules, batch/concurrency/lease/retry budgets, Async retry authority, B1, customer visibility, pricing, and economics are unchanged. Next.js remains `16.3.0`; SEC-01 remains the separate next task after I4 acceptance and integration.

No current deploy is authorized for Publish. External wiring remains blocked until I4 is independently accepted/integrated, SEC-01 is accepted, final source is frozen, and every credential/Netlify/Stripe/schedule/Purchase action receives fresh Human action-time authorization.

## Local regression evidence

- I4 branch-independent cutover verifier: `9/9`; disabled configured runtimes return before dependency reads, exact-true configured runtimes reach the missing-credential boundary, and fetch calls remain `0`.
- Actual Scheduled Function ZIP proof: both functions package, pass Node syntax, dynamically import, contain no `server-only`, retain exact schedules, and return disabled HTTP `200`; fetch calls `0`.
- I2: `15/15`, including fresh local exact 0002–0019 reconciliation/concurrency and reusable ingress privilege proof. The local stack was stopped without backup after verification.
- I1 descendant: `15/15`; B1 descendant: `15/15`; A1 descendant: `12/12`; RC-2: `50/50`; RC-1: `19/19`; Background durability: `21/21`.
- Async worker graph/artifacts, background runtime assets, Customer Auth entry, Product Intent, Clarification, root typecheck, zero-warning lint, ingress typecheck/build, customer Production build `38/38`, and Git diff check pass.
- The exact `0002..0019` migration inventory has no delta from the I3 base; 0017/0018/0019 accepted Git-blob identities remain exact. No migration, `netlify.toml`, schedule, event allowlist, package dependency, Next.js, customer visibility, or external state changed.

Historical RC2 activation and branch-pinned R3 evidence/verifiers remain unchanged. The branch-independent I4 verifier owns the current cutover flag names, exact default-false requirement, configured no-op/true-path behavior, exclusion from customer Purchase activation policy, migration inventory, and Node pin without weakening historical assertions.
