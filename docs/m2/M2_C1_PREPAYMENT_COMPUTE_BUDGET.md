# M2-C1 — Pre-payment Compute Budget / Abuse & Idempotency Authority

Status: `Human/ChatGPT SOURCE + REMOTE DB PASS — ACTIVATION PENDING`

This is an existing M2 task. It does not create a Milestone or Gate. Current source authority is `release/private-ready@3f170941fd16b6b997089c2959489758ac9553eb`; the reviewed implementation and acceptance sync are integrated; `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`. AI-01 and AI-02 are `CLOSED IN SOURCE + REMOTE AUTHORITY — ACTIVATION PENDING`. This does not close Production.

## Pre-C1 abuse path and exact topology

Before C1, signed-out `POST /api/consultations/prepare` passed same-origin and strict-JSON checks, then called `prepareProductionConsultation()` → `ProductionFulfillmentApplication.prepare()` → `begin_production_preparation_v1` → `M2AssessmentPipeline.prepare()` → OpenAI transport. Customer Auth began only after `purchase_ready`. Reuse of the same idempotency key was protected, but the authority was keyed to the client-supplied key, so one actor could submit fresh keys and snapshots. Clarification could re-enter the paid pipeline through the same signed-out capability route.

All current paid transport sites in `M2AssessmentPipeline` call `beforeProviderInvocation(stageId, attemptNumber)` immediately before `transport.invoke()`. No initial-preparation or clarification-resume bypass exists, so the C1 fence uses the existing hook without a wider Pipeline rewrite.

Current pre-payment Provider ceiling:

- Initial preparation: `PB-01` + optional `PB-01C` + `PB-02` + `PB-03`; maximum 4 calls when an optional draft exists, otherwise 3.
- Clarification resume: one `PB-01` clarification-grounding call; the prior initial authority is reused and the other initial stages are skipped.
- Pre-payment retry/reassessment: none in the current runtime; every current pre-payment call uses attempt 1. The quality-reassessment path belongs to paid fulfillment stages `PB-04/PB-05` and is outside this budget.
- Verified-payment fulfillment: `PB-04/PB-05/PB-06`; it does not call the C1 compute fence and is not blocked by pre-payment exhaustion.

## Chosen authority and customer flow

When C1 is enabled, the flow is:

`consultation input` → deterministic safety/product-scope validation → provider-free durable intake → `authentication_required` → opaque Customer Auth continuation → fresh server `getUser()` → verified-email ownership binding → durable execution claim → per-transport durable compute claim → Provider-backed preparation → optional one clarification → `purchase_ready` → authenticated Checkout.

Already signed-in Customers take the same provider-free begin, then bind and execute directly. The browser never supplies a trusted `CustomerUserId`; each Provider-backed entry obtains it from fresh server identity. The execution capability and Auth continuation are opaque hash-only bearer inputs, never URL query/hash data. Raw consultation, email, user identity, DB UUID, capability, and Auth tokens are not placed in URLs or browser storage.

The pre-auth public outcome is `authentication_required`; it never claims `purchase_ready`. Safety and deterministic scope stops remain provider-free. Sparse consultation, clarification default 0 / maximum 1, JPY 980, one consultation / one assessment note, Checkout-after-purchase-ready, Stripe/DB Payment verification, and durable post-payment fulfillment remain unchanged.

## 0020 durable authority

Applied `0020_m2_c1_prepayment_compute_budget.sql` adds:

- `production_prepayment_execution_authorities`: preparation-bound, hash-only execution capability and state.
- `production_prepayment_auth_continuations`: separate versioned C1 continuation because the existing 0014 continuation is purchase-ready-specific; one pending continuation per preparation, hash-only token/CSRF, expiry, revoke, consume.
- `production_prepayment_compute_budgets`: one row per `CustomerUserId` and policy version, with window timestamps and non-negative used invocation units only.

`claim_production_prepayment_compute_unit_v1` validates required arguments, server policy bounds, exact active Customer ownership, preparation/execution state, stage and attempt; serializes absent-row races with an advisory transaction lock and existing rows with `FOR UPDATE`; atomically rolls the window; increments exactly one unit when acquired; and does not mutate when exhausted. A claimed unit is not refunded after Provider failure or ambiguity.

All new tables have RLS. Direct table authority and function EXECUTE are zero for PUBLIC, `anon`, `authenticated`, and `m2_b2_stripe_ingress`; only `service_role` receives the explicit required grants. Functions are `SECURITY INVOKER` with `search_path=''`. The budget and continuation authorities store no consultation, message, email, nickname, Stripe data, result text, raw capability/token, IP, or Provider body.

0020 Git-blob SHA-256: `3e2683bf65a783047c1cec1b86b9663d4b315bcc1a8ebc080c8bc9bfcb7b9e75`.

Migrations 0002–0019 remain immutable. Verified 0018 SHA-256 is `1aa84f874e1f7585b51377dc5f201dc87f6448bc94574e342008597bb6270010`; 0019 SHA-256 is `b4e5ef6b06ef6e70c0904e7b1692c2863861c73738454d499ac3b730a082456c`. Exact 0020 was applied once under separate explicit Human authority. Fresh postflight established remote exact 0002–0020, pending 0, unknown 0, with 0020 recorded once.

Remote catalog postflight found exactly the three C1 tables and twelve C1 RPCs defined by Git 0020. All three tables have RLS enabled and no PUBLIC/anon/authenticated/ingress direct DML. All twelve RPCs are `SECURITY INVOKER`, `search_path=''`, explicitly executable by `service_role`, and not executable by PUBLIC, anon, authenticated, or `m2_b2_stripe_ingress`; `SECURITY DEFINER` count is zero. Protected existing functions, table/sequence ACLs, DB0016/0017/0019 identities, default function privileges, Data API schemas, and ingress effective authority had drift zero. Published source remained `0befd512219eb2897fb1edf969ad37d7e8c56b0d` and compatible.

## Configuration and activation

- `PREPAYMENT_COMPUTE_BUDGET_ENABLED`: exact `true` only; default `false`.
- `PREPAYMENT_COMPUTE_WINDOW_SECONDS`: required when enabled; strict integer from 60 through 2,678,400.
- `PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS`: required when enabled; strict integer from 1 through 1,000.
- Policy version: `m2-c1-prepayment-compute-v1`.

Missing or invalid enabled policy fails with a safe 503 before Provider. Exhaustion uses stable `PREPAYMENT_COMPUTE_BUDGET_EXHAUSTED` / 429 without exposing counts, identity, rows, Provider, or cost. C1 is subordinate to existing Customer Auth, production-runtime, provider, and emergency-stop gates. I4 scheduler flags are unchanged and uncoupled.

Activation readiness now requires Customer Auth enabled, C1 enabled, and a valid policy. Source-compatible C1-disabled mode remains available but is not Private Dogfood-ready.

The accepted future Self Dogfood activation policy is `PREPAYMENT_COMPUTE_BUDGET_ENABLED=true`, `PREPAYMENT_COMPUTE_WINDOW_SECONDS=86400`, and `PREPAYMENT_COMPUTE_MAX_PROVIDER_INVOCATIONS=10`. These values are recorded policy only: they are not set in Production or Netlify by this acceptance, and C1 remains disabled/unset there. This Self Dogfood decision is not a Public Launch final policy.

## Local evidence

- Fresh disposable DB applied exact migrations 0002–0020 in order.
- Anonymous abuse: 100 distinct valid snapshots with 100 fresh idempotency keys created 100 provider-free intakes, Provider transport calls 0, compute claims 0.
- Same-key/same-snapshot replay added Provider calls 0 and compute units 0; same-key/different-snapshot returned the existing 409 conflict before Provider.
- Fresh-key proof: four preparations for one synthetic Customer under quota 3 reached synthetic transport exactly 3 times; the fourth stopped at durable exhaustion before transport.
- DB concurrency: 20 simultaneous claims for Customer A produced acquired 3 / exhausted 17 / durable used 3. Customer B independently produced 3 / 17 / 3. An expired window under 20 simultaneous claims reset exactly once and produced 3 / 17 / 3.
- Continuation: pending validation passed before bind; successful bind consumed it; consumed validation returned null; same-Customer bind replay returned the existing binding; cross-Customer bind and resolution failed.
- Cross-Customer preparation claim, detached ownership, NULL Customer, NULL preparation, and invalid window/limit all failed before budget mutation.
- Ingress privilege preflight passed after 0020; unauthorized direct table/function authority remained zero.
- Source verifier proves both pipeline transport sites are immediately fenced, clarification resume uses the same compute fence, and verified-payment fulfillment contains no C1 claim.
- RC-1 passed 19/19 and RC-2 passed 50/50 offline, including clarification replay/conflict, checkout replay/recovery, Payment polling, and durable fulfillment with external operations zero.

Current regression PASS also includes Auth Entry 11/11, Product Intent 18/18, Clarification Contract 7/7, Purchase Eligibility 9/9, Background Durability 21/21, Async router/worker and generated artifacts, both scheduled-function artifacts, background runtime assets, ingress independent build/typecheck, root typecheck, zero-warning ESLint, customer Production build 38/38, and `git diff --check`.

Historical verifier disposition is recorded rather than weakened: Customer Auth Foundation completed its current functional/security checks through 31 PASS and then stopped at its older `dcccf1c` accepted-file snapshot; B1, I1, I1-R3, and A1 stop on their literal historical task-branch pins; I4 passes its six current scheduler checks then rejects the intentional new 0020 in its exact 0002–0019 list; I2 passes 13 source checks then expects the literal default local container name, while its DB proof and ingress privilege preflight passed directly on the fresh C1 database; RC-2 Activation passes all C1 flag/policy readiness checks, then retains older source-topology and exact migration-list failures. These are lineage/container assertions, not manufactured PASS and not C1 runtime failures.

Read-only remote postflight reports exact remote 0002–0020, pending 0, and unknown remote 0.

The separately authorized remote action applied exact 0020 once. No Provider, Payment, Stripe endpoint/event, email, Async event, Netlify write/deploy/publish, scheduler execution, or Production activation occurred; D1 performs no remote write.

## Human/ChatGPT Self Dogfood policy decision

The accepted initial Self Dogfood window is 86400 seconds with a maximum of 10 Provider invocation units. The evidence is: maximum legitimate initial preparation 4 units; clarification resume 1 unit; normal worst-case complete consultation 5 units; and every failed or ambiguous Provider invocation retains its claimed unit. One worst-case failed initial preparation (4), one complete retry initial preparation (4), and one clarification (1) total 9 units, so 10 permits one full worst-case recovery cycle with limited headroom. The 24-hour rolling window bounds authenticated pre-payment cost.

Any future quota/window increase is a separately reviewed configuration change; values must not be changed casually during an active window. `m2-c1-prepayment-compute-v1` remains stable while quota/window are environment policy. If later durable policy semantics materially change, review a policy-version bump rather than silently changing economic meaning.

Non-blocking follow-ups do not reopen C1 for Self Dogfood: anonymous provider-free intake DB write volume can be rate-limited independently while paid Provider cost remains zero; per-Customer authority does not stop deliberate multi-account abuse, so Public Launch later needs a separately reviewed global/provider/WAF spend ceiling.

Remote 0020 authority is closed. Environment activation, Production deploy/publish, Public Launch policy, and external E2E remain separately unauthorized. Production `PREPAYMENT_COMPUTE_*` values remain unset/disabled; the 86400 / 10 policy is recorded only.
