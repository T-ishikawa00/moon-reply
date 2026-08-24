# M2 Master Backlog

Status: `canonical_current_operational_backlog`

Authority date: `2026-08-24`

Current source authority: `release/private-ready@7b850ff9b2c2188691605797983202416ddc5d88`

Current Published runtime source: `0befd512219eb2897fb1edf969ad37d7e8c56b0d`

Current remote database: exact migrations `0002..0017`; M2-A1 Production DB closure `Human/ChatGPT PASS`

This is the canonical execution backlog adopted from the Human/ChatGPT-PASS Site-wide Product / UX / Contract / Launch Readiness Audit. It is an existing M2 execution artifact, not a new milestone or gate. M1 True E2E remains closed. Historical plans and acceptance records remain evidence; this current document controls M2 ordering when they describe an older operational state.

## Evidence vocabulary

- `CONFIRMED_LIVE`: current Production, Human operation, or read-only remote catalog establishes the fact.
- `CONFIRMED_SOURCE`: authority source establishes the implementation or contract.
- `CONFIRMED_LOCAL_DB`: a disposable synthetic local database reproduced the behavior.
- `CONFIRMED_REMOTE_CLOSED`: the reviewed successor is applied remotely and fresh read-only history/catalog identity proves the Production DB closure.
- `REMOTE_CATALOG_PENDING`: source suggests the finding but current remote catalog has not established it.
- `HUMAN_VISUAL`: current Human visual/operational observation establishes the symptom.
- `EXTERNAL_RELEASE_PENDING`: an external release, provider state, legal decision, or public-launch operation is still required.

Evidence states are cumulative. Technical evidence does not replace a required Human visual, action-time, legal, provider, deployment, or public-launch decision.

## Operating boundary

| Stage | Who | Payment | Visibility | Mandatory before entry |
| --- | --- | --- | --- | --- |
| Self Dogfood | Human Product Owner only | Stripe Sandbox only | Private site | M2-before-dogfood technical acceptance and Human action-time confirmation |
| External Private Beta | Invited third party | Real payment may occur | Private/restricted customer surface | Current legal copy, Contact/support/refund handling, operational monitoring, recovery, explicit Human authorization |

Self Dogfood success does not authorize External Private Beta. External Private Beta is not Public Launch.

## Canonical finding register

| ID | Category / severity | User-visible symptom and root area | Evidence status | Proposed disposition | Dependency / acceptance | Target / scope |
| --- | --- | --- | --- | --- | --- | --- |
| REL-01 | Return reliability / BLOCKER — CLOSED IN SOURCE | `/purchase/return` previously stopped after a transient poll failure although `/account` was completed | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Closed by bounded backoff/jitter/budgets, no overlap, terminal stops, one completed navigation, and Account fallback | B1 Human/ChatGPT PASS; integrated at `8fcb7861` | Production publish/Human return-flow proof remains separate |
| REL-02 | Return contract / HIGH — CLOSED IN SOURCE | Return decoder previously rejected the authenticated result destination and lacked uniform durable payment truth | `CONFIRMED_SOURCE` | Closed by one strict typed contract for legacy token/authenticated UUID paths and durable-only `paymentVerified` | B1 Human/ChatGPT PASS; adversarial malformed/external paths fail closed | Production publish/Human return-flow proof remains separate |
| REL-03 | Webhook ingress / BLOCKER — I1 LOCAL CANDIDATE | Private Netlify access and Stripe webhook ingress are coupled; Private visibility rejects the current webhook route | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE`, `CONFIRMED_LOCAL_DB` | Separate minimal Public ingress implemented locally with raw signature and wrapper-only DB authority; customer/review stays Private; I2 owns Private dispatch | I1 review, remote 0018 apply/credential, ingress project/config, Sandbox rehearsal, I2, and publish remain separate | M2-before-dogfood / L |
| DB-01 | Logical lease input / BLOCKER — CLOSED | Pre-0017 `claim_production_fulfillment_v2` accepted a NULL requested lease because SQL UNKNOWN bypassed the argument guard | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE`, `CONFIRMED_LOCAL_DB`, `CONFIRMED_REMOTE_CLOSED` | Closed by exact 0017 explicit NULL owner/lease and future-lease guard before mutation; v1 retained | A1 closed; remote body exact, invalid side effects `0`, valid/concurrent one winner | Closed on Production DB |
| DB-02 | Logical completion fence / BLOCKER — CLOSED | Pre-0017 `complete_production_fulfillment_v2` could admit NULL caller owner or stored NULL lease and create completion side effects | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE`, `CONFIRMED_LOCAL_DB`, `CONFIRMED_REMOTE_CLOSED` | Closed by exact 0017 explicit NULL fences and `IS DISTINCT FROM` owner comparison before every side-effect INSERT | A1 closed; remote body exact, invalid delivery/credential/notification `+0`, valid/replay/concurrency exactly once | Closed on Production DB |
| DB-03 | Notification lease input / HIGH — CLOSED | Pre-0017 `claim_production_notification_v2` accepted a NULL requested lease, moved processing state, and consumed an attempt | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE`, `CONFIRMED_LOCAL_DB`, `CONFIRMED_REMOTE_CLOSED` | Closed by exact 0017 NULL owner/lease and future-lease guard before attempt mutation; reclaim semantics retained | A1 closed; remote body exact, invalid attempt delta `0`, valid/concurrent exclusive | Closed on Production DB |
| AI-01 | Pre-payment cost / BLOCKER | AI preparation can occur before durable verified payment, creating avoidable provider-cost and abuse exposure | `CONFIRMED_SOURCE` | Define a server-owned pre-payment compute budget and the minimum no-paid-provider preparation path | C1; anonymous repetition cannot generate unbounded paid calls; payment path remains usable | M2-before-dogfood / L |
| AI-02 | Cost/idempotency / HIGH | There is no single durable customer/intent budget spanning retries, auth continuation, and checkout recreation | `CONFIRMED_SOURCE` | Durable idempotency and quota authority with privacy-safe observability | C1; concurrent/replayed attempts consume at most one authorized unit | M2-before-dogfood / L |
| SEC-01 | Framework security / BLOCKER | Next 16.3.0 precedes the official scheduled 2026-08-26 critical security release for 16.3 | `CONFIRMED_SOURCE`, `EXTERNAL_RELEASE_PENDING` | Do not guess a version; evaluate the exact stable patch in a separate task after publication | Published stable patch; full checklist in M2-0 security baseline | M2-before-dogfood / M |
| SEC-02 | DB authority / HIGH | Legacy v1 and current v2 RPCs coexist; RLS is enabled but service-role bypass remains the effective caller authority | `CONFIRMED_LIVE`, `CONFIRMED_SOURCE` | Inventory actual call paths, retain required expand compatibility, plan later v1 revoke/contract only after zero-use proof | A2 after A1; no current caller loses authority and PUBLIC/anon/authenticated remain zero | M2-before-dogfood / M |
| LEG-01 | Legal drift / BLOCKER for external beta | Customer-visible legal/review copy contains historical Payment/Runtime/selection states inconsistent with current operation | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE`, `EXTERNAL_RELEASE_PENDING` | Separate current customer legal copy from immutable historical review evidence; Human/legal approval required | D1; current facts on every legal route, no internal gate labels/customer promises | M2-before-dogfood for current truth; external-beta hard boundary / M |
| CON-01 | Contact/support / BLOCKER for external beta | Support, refund, payment-recovery, and failed-result escalation are not a complete customer-operable surface | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE`, `EXTERNAL_RELEASE_PENDING` | One current Contact path with ownership-safe recovery and operator runbook | D2; customer can report a paid failure without exposing tokens/content | M2-before-dogfood design, external-beta completion / M |
| IA-01 | Information architecture / HIGH | Logged-out and logged-in navigation do not present a coherent Home/Login/My Reports/New Request system | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Define state-aware global navigation before visual polish | E2; keyboard/mobile/desktop routes expose the correct actions without duplicate authority | M2-before-dogfood / M |
| AUTH-01 | Auth journey / HIGH | Google handoff takes about 45–60 seconds and lacks actionable waiting/recovery context | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | First add PII-free phase measurement, then optimize only measured bottlenecks | E1; T0–T4 recorded without PII/secrets and auth security remains unchanged | M2-before-dogfood measurement; during-dogfood optimization / M |
| ACC-01 | Account / HIGH | Same-day reports are difficult to distinguish and `/account` is not yet a strong “私の鑑定ノート” revisit surface | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Add privacy-safe title/summary/time/status/result CTA and robust empty/loading/error states | E3 after B1/E2; cross-customer isolation and no consultation-body listing | M2-before-dogfood / L |
| RES-01 | Result recovery / HIGH | Completed result revisit and stuck/manual-review recovery are distributed across bearer and account routes | `CONFIRMED_SOURCE` | Define canonical authenticated result first, retain explicitly bounded legacy/recovery lane | B1 then E3; not-found only is 404 and other failures remain observable/recoverable | M2-before-dogfood / M |
| PROD-01 | Purchase clarity / HIGH | JPY 980, one-time charge, Stripe handoff, and the primary action lack sufficient visual priority at the final decision point | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Selectively port Purchase Trust UI without changing checkout authority | F1 after B1/C1; exact economics and legal links visible before one primary CTA | M2-before-dogfood / S |
| UX-01 | Post-payment trust / HIGH | Customer cannot clearly distinguish payment verified, generating, completed, and manual-review/recovery states | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | State-based copy/UI backed only by server contract; no invented chronology or promise | F2 after B1; each state is contract-derived and terminal/retry actions are correct | M2-before-dogfood / M |
| PERF-01 | Auth latency / HIGH | Google start is slow but the route/application/client phase contribution is not yet measured in Production | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Isolated PII-free latency instrumentation; no speculative optimization | E1; bounded telemetry schema, fail-isolated, no raw URL/email/user/token | M2-before-dogfood / M |
| PERF-02 | Fulfillment latency / MEDIUM | Normal M1 fulfillment took about 41 seconds; no genuine value indication appears near the future 10-second product goal | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Separate actual pipeline optimization from honest perceived-progress UX | G1 then during-dogfood measurement; no fabricated progress or partial result | M2-during-dogfood / L |
| ERR-01 | Failure UX / HIGH | Polling, auth, checkout, fulfillment, and email errors lack one consistent recover/retry/contact vocabulary | `CONFIRMED_SOURCE`, `HUMAN_VISUAL` | Contract-owned recoverable/terminal error matrix and one escalation path | B1/D2/E2; every failure has one safe next action and no sensitive cause leakage | M2-before-dogfood / M |
| NAV-01 | Login/revisit navigation / HIGH | Home/header lacks an independent login entry and a natural logged-in path to My Reports | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE` | Add auth-aware navigation without changing session authority | E2; signed-out Login and signed-in My Reports/Logout work on mobile/desktop | M2-before-dogfood / S |
| OPS-01 | Observability/operations / BLOCKER for external beta | No single operator view/runbook closes webhook, async, provider, delivery, email, stuck, refund, and rollback handling | `CONFIRMED_SOURCE`, `EXTERNAL_RELEASE_PENDING` | Privacy-safe correlated states/alerts and executable runbooks | G1/G2; synthetic failure drill identifies and recovers every paid order | M2-during-dogfood; external-beta hard boundary / XL |
| WEB-01 | Private hosting / BLOCKER — I1 LOCAL CANDIDATE | Current private-site control is incompatible with always-available third-party webhook ingress | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `CONFIRMED_SOURCE`, `CONFIRMED_LOCAL_DB`, `EXTERNAL_RELEASE_PENDING` | Separate project boundary plus exact path/raw signature/least-privilege 0018 candidate; no current customer visibility change | I1 source proof complete; external project/config/publish still required | M2-before-dogfood / L |
| GOV-01 | Release governance / BLOCKER for external beta | Self Dogfood and External Private Beta can otherwise be conflated despite different payment/legal/support risk | `CONFIRMED_LIVE`, `HUMAN_VISUAL`, `EXTERNAL_RELEASE_PENDING` | Enforce the two definitions in current operational docs and action-time confirmations | G2; no third party or real payment under Self Dogfood authority | M2-before-dogfood / XS |

### DB closure disposition

- `DB-01`, `DB-02`, and `DB-03` are remotely closed by exact migration `0017_m2_a1_null_fence_integrity.sql`, immutable Git-blob SHA-256 `b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380`.
- Fresh post-apply evidence established history `0002..0017`, pending `0`, unknown `0`, exact three target bodies, unchanged v1/signature/ACL/`SECURITY INVOKER`/search path, and non-target RPC/table/constraint/policy drift `0`.
- NULL customer user ID, NULL returned model, mismatched non-NULL owner, expired lease, and NULL-fence attempts against other completion/failure RPCs that failed closed are **not separate blockers**. They remain regression cases in A1.
- NOT VALID is not the cause of all NULL behavior: PostgreSQL still enforces a NOT VALID CHECK on new inserts/updates. The exploitable logical/notification lease CHECKs explicitly permit a NULL lease for legacy expand compatibility; the RPC argument/completion guards are the defect.

## Immediate M2 execution queue

`Yes later` means the implementation task may prepare an append-only migration or deployable change, but the remote apply/deploy remains a separate exact Human action-time confirmation. No queue entry is pre-authorized by this plan.

| Task | Dependency and safe rollout order | Remote write? | Migration? | Deploy? | Human action-time confirmation | Rollback | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M2-A1 — NULL lease/fence integrity — CLOSED | Exact 0017 integrated and remotely applied; current v2 hardened, v1 retained | One reviewed remote apply completed | Exact append-only 0017 applied | No runtime publish required; Published 0befd512 is compatible | Human/ChatGPT remote closure PASS | Forward-fix successor only; never edit/delete 0017 or repair history | Remote `0002..0017`; target identity exact; non-target drift 0; NULL/mismatch/expired zero-effect; valid/concurrent one winner |
| M2-A2 — RPC surface/legacy containment | After A1; inventory current code/runtime callers and zero-use evidence before any revoke | No during inventory; Yes later if grants change | Possible later contract migration | Possible caller cutover | Before v1 EXECUTE revoke or FORCE-RLS/ACL change | Restore prior grant only under explicit incident authority; keep v2 callable | v1/v2 caller map complete; PUBLIC/anon/authenticated zero; service-role semantics explicit; no orphan caller |
| M2-B1 — Return/account convergence — CLOSED IN SOURCE | B1 Human/ChatGPT PASS and exact ff-only integration at `8fcb7861` | No | No | Yes later | Before Production deploy and Human return-flow check | Revert one application commit; DB unchanged | Source/tests closed; Production deploy and Human flow remain separate |
| M2-B2 — Private-site/webhook convergence — I1 LOCAL CANDIDATE | Design integrated; I1 exact ingress/verifier/0018 and disposable proof complete; I2 dispatch/reconciliation and Sandbox are later | Remote/config writes `0`; Yes later | Candidate exact append-only 0018; remote pending only | Yes later | Before 0018 apply/credential, ingress project/config/visibility/endpoint/secret, I2 scheduler, event/API read, or publish | Customer project never Public; revoke ingress credential/disable endpoint and preserve durable rows; DB forward-fix only after apply | I1 `13/13`, fresh `0002..0018`, role-only wrapper, invalid zero-effect, race `verified 1/duplicate 1`, one Payment/job |
| M2-C1 — Pre-payment compute budget | After A1, parallel with B1 source work; define cost authority before UI | Possible remote write later | Likely append-only durable budget/idempotency migration | Yes later | Before remote apply, provider-enabled test, or deploy | Feature flag off; preserve safety and paid fulfillment; forward-fix durable rows | Anonymous/replayed/concurrent paths cannot exceed budget; no paid call before authorized boundary |
| M2-C2 — Auth/checkout abuse and recovery | After C1 contract; rate limits, repeat checkout, abandonment, duplicate webhook/payment recovery | Possible remote/provider config later | Possible | Yes later | Before rate-limit/provider/Stripe/remote changes | Disable new limiter/checkout path without invalidating verified payments | No double charge/authority; safe retry; false positives recoverable; audit fields contain no secrets |
| M2-D1 — Current legal/customer copy | Parallel after M2-0; separate customer current copy from historical review material | No | No | Yes later | Human/legal approval immediately before publish | Revert copy commit; historical evidence untouched | No stale operational claims; exact price/refund/privacy/provider wording approved for intended audience |
| M2-D2 — Contact/support/review separation | Parallel after D1 inventory; build customer Contact and isolate fixture/review routes | No | Maybe if support case persistence is approved | Yes later | Before support channel publication or any persistent case intake | Disable intake, retain safe static contact; no customer-data deletion implied | Paid failure/refund/recovery path operable; review fixtures never appear as production truth |
| M2-E1 — Google latency measurement | After privacy schema review; independent of B/F UI | No external telemetry write until later authorization | No | Yes later | Before enabling external measurement or Production deploy | Measurement default off; remove instrumentation commit | PII-free T0–T4 and server phases; fail-isolated; auth/security regressions zero |
| M2-E2 — Auth/navigation/recovery | After B1 and E1 baseline; method-first auth, header/Login/My Reports/Logout | No | No unless session policy requires later data | Yes later | Before provider/config/deploy and Human mobile/desktop check | Revert UI/routes; preserve existing purchase auth lane | Fresh session authority; state-aware navigation; no open redirect/cache/session leak |
| M2-E3 — Account/My Reports/Result | After B1/E2; data projection before visual hierarchy | No | Possible read-model/index migration later | Yes later | Before migration/apply/deploy and Human result-revisit review | Feature flag/list projection rollback; canonical result stays available | Same-day distinction, empty/loading/error, ownership isolation, correct result CTA and no body leakage |
| M2-F1 — Purchase Trust UI | After B1/C1; port B-only component/CSS hunks | No | No | Yes later | Human visual immediately before deploy | Revert component/CSS commit | JPY 980/tax/one-time/Stripe/legal visible; one strong CTA; payment gate unchanged |
| M2-F2 — Post-payment state Trust UX | After B1 state contract; port status UI, then review fixture | No | No | Yes later | Human visual on every state before deploy | Revert UI while retaining hardened contract | Only server-owned states shown; payment verified/generating/completed/recovery distinct; no invented promise |
| M2-G1 — Correlated observability | After A/B/C contracts stabilize; event schema, dashboards/alerts, failure drills | External write/config later | Possible event store | Yes later | Before telemetry/provider config and alert routing | Disable adapter/alerts; product paths fail isolated | Paid order traceable across webhook/job/assessment/delivery/email without customer content or secrets |
| M2-G2 — Operations and 7-day Dogfood package | Last before 7-day run; runbooks, budgets, backup/restore evidence, incident/refund/support matrix | Operational actions later | No expected | No code deploy required after accepted baseline | At Self Dogfood start, each external action, and any External Private Beta transition | Stop new checkout; revert release/config per exact runbook; preserve evidence | Seven-day entry/exit metrics, incident ownership, cost ceilings, recovery drill; external beta remains separately unauthorized |

## Dependency graph

```text
M2-A1 -> M2-A2
  |       |
  +-> M2-B1 -> M2-B2
  |      |        |
  +-> M2-C1 -> M2-C2
         |        |
M2-D1 -> M2-D2    |
M2-E1 -> M2-E2 -> M2-E3
            |       |
            +-> M2-F1 -> M2-F2
                     \       /
                      M2-G1 -> M2-G2 -> 7-day Self Dogfood
```

The graph is a safe ordering, not authorization to perform remote or external actions.
