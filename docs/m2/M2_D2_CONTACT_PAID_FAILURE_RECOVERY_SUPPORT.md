# M2-D2 — Contact / Paid-failure Recovery Support

Status: `Human/ChatGPT SOURCE/LOCAL PASS`

CON-01 disposition: `CUSTOMER SUPPORT PATH CLOSED IN SOURCE/LOCAL — REMOTE AUTHORITY + EXTERNAL OPERATOR CHANNEL + ACTIVATION PENDING`.

This is the existing M2-D2 backlog task, not a new Milestone or Gate. Human/ChatGPT accepted reviewed source `task/m2-d2-contact-paid-failure-recovery-support-r1@041b246d5ae9fec699c676bdf297cacfa5685cba`, based on `release/private-ready@12752953348f5b993afe59ad7a9d09b0af60270c`; `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`. Production Publish, remote migration apply, support activation, Netlify configuration, Stripe/refund/Payment mutation, Checkout, Provider, Async event, email, and scheduler operations remain outside this acceptance.

## 1. Pre-D2 gap and exact current inventory

Before D2, `/contact` truthfully reported that no intake channel existed. Account and delivery recovery were individually durable, but there was no customer-operable durable escalation record that safely correlated a paid order without pasted Payment or result credentials.

The existing customer paths are:

- `/account` uses enabled Customer Auth, a fresh `getUser()` identity, then `resolve_customer_account_history_v1`. Its purchase intent UUID is a non-secret selector; the RPC filters through the active `production_customer_ownership_bindings` row for the exact CustomerUserId.
- `/account/results/[deliveryId]` resolves a result through fresh Customer identity and owned-delivery authority.
- `/purchase/return` polls server-owned Payment/fulfillment state and may enter the separately authorized reconciliation/dispatch/recovery paths. A Support case does not call any of those paths.
- Payment authority is held in purchase intents, Payment attempts, durable verified payments, the Stripe evidence ledger, reconciliation state, and adjustment records.
- Fulfillment authority is held in fulfillment jobs, grants/logical assessments, durable delivery, recovery credentials, and notification outbox state. Pending, retryable, processing, completed, and manual-review dispositions remain owned by those systems.
- Existing recovery mechanisms remain Account fallback, Return polling, reconciliation, dispatch scheduler, background worker, result recovery, and notification retry/manual review. D2 only records and correlates a problem.

Historical Contact review material had six broad areas: delivery/result, ordinary cancellation/refund, payment integrity, privacy/data requests, seller/contact disclosure, and other. D2 preserves the useful customer breadth without reusing review jargon: delivery/result maps to `result_delivery`; payment integrity to `payment_charge`; cancellation/refund to `refund_cancellation`; privacy to `privacy_data`; Auth access becomes `account_login`; remaining safe issues use `other`. Seller identity/contact disclosure remains a D1 external-beta blocker and is not fabricated as D2 customer content.

## 2. Customer contract and ownership authority

The exact customer categories are:

1. 鑑定ノートの受取り・結果表示
2. 支払い・請求
3. 返金・取消し
4. アカウント・ログイン
5. プライバシー・データ
6. その他

The first three require an owned purchase. The client may select a `purchaseIntentId`, but it is an untrusted, non-secret selector only. The server obtains CustomerUserId from a fresh Customer Auth identity, and `create_production_customer_support_case_v1` proves that the selected intent and preparation share an active ownership binding for that exact CustomerUserId before any Support mutation. Unknown, cross-Customer, or detached bindings fail with zero case mutation. CustomerUserId is never accepted from the request body.

A displayed Support case UUID is a reference, not bearer authority. D2 adds no read-by-reference customer route. Subsequent customer history or operator context must use fresh identity or service-role authority respectively.

## 3. Candidate 0021 authority

Candidate migration: `0021_m2_d2_customer_support_cases.sql`, local only. Git-normalized SHA-256: `49dd851643dc85716dc8ca0fb712e2d51bc37e8d04116fd0ae24555b7d27bc9a`.

It creates exactly two RLS-enabled tables:

- `production_customer_support_cases`: case/customer identity, nullable owned purchase, six-category enum, five-state status, optional plain-text note, hashed idempotency authority, input hash, and timestamps.
- `production_customer_support_case_events`: append-only submitted/transition metadata, safe status pair, optional bounded reason code, and timestamp.

It creates exactly three `SECURITY INVOKER`, empty-`search_path`, service-role-only RPCs:

- `create_production_customer_support_case_v1`
- `resolve_production_support_case_context_v1`
- `transition_production_support_case_v1`

PUBLIC, anon, authenticated, and `m2_b2_stripe_ingress` have zero RPC EXECUTE and zero direct table DML. Service role receives select/insert/update on cases, but only select/insert on events, preserving application-level append-only audit history. Migration 0018's default removal of future PUBLIC EXECUTE remains unchanged.

No Support table contains consultation/result bodies, email, card data, Stripe/provider identifiers, Checkout/result URLs, Auth/OTP/capability/token values, or Provider request/response data. The optional note is 1–1000 characters after normalization, plain text only, and no attachments or HTML are accepted.

## 4. State, idempotency, and non-mutation

States are deliberately small: `open`, `in_review`, `waiting_customer`, `resolved`, `closed`. Customer submission creates only `open`. Only internal service authority can apply a valid transition. Support status never changes Payment, refund, fulfillment, Provider, delivery, or notification state.

The client provides a 16–128 character idempotency key; only a domain-separated SHA-256 hash is persisted. The case-input hash covers server-resolved CustomerUserId, category, normalized purchase selector, and normalized note.

- same Customer + same key + same input returns the same case;
- same key + different input raises a conflict;
- an active case for the same Customer + purchase + paid category is returned instead of inserting another active case;
- advisory transaction locks plus database uniqueness make 20 concurrent identical submissions converge on one durable case;
- once a prior case is closed, a later distinct submission may create a new case.

Source and disposable DB fingerprint proofs show that Support creation changes zero purchase, Payment, verified-payment, Stripe-evidence, adjustment, fulfillment, logical-assessment, delivery, and notification rows. It never calls Checkout, refund, Provider, dispatch, reconciliation, worker, Async, or email code.

## 5. API, Contact, Account, and privacy

`POST /api/support/cases` is Node/server-only, same-origin, strict JSON, bounded to 8192 bytes, guarded by exact `CUSTOMER_SUPPORT_CASES_ENABLED=true`, and requires enabled Customer Auth plus a fresh identity. A 2xx is returned only after the service-role RPC durably commits. The response contains only case reference, category, safe status, and creation time. Error bodies use safe codes and no-store headers.

The source-controlled default is `CUSTOMER_SUPPORT_CASES_ENABLED=false`. The Production/Netlify value is unset / not configured, and External Private Beta activation remains separately pending; Support is not operational. The feature flag is deliberately absent from new-purchase activation readiness. A Support outage cannot disable Auth, Checkout, Payment, fulfillment, or Account result access.

When disabled, `/contact` retains the D1 current truth: the channel is preparing and no fake form or SLA is shown. When enabled and signed in, it shows the six categories, owned-purchase selector for paid categories, optional bounded note, privacy warning, submit action, and durable case reference. It never asks for a Stripe ID, receipt/payment identifier, card number, result URL/token, OTP, Auth token, capability, or consultation. Account history adds only “この購入について問い合わせる”; the query UUID is a non-secret selector and is revalidated against server ownership.

Logs contain no customer note, email, consultation, Payment ID, result token, Auth/OTP/capability, or URL. D2 adds no operator email. Safe operational logging, if added later, is limited to case reference, category, outcome/status, timestamp, and route status.

## 6. Privacy-safe operator context

The service-role-only context projection correlates Support case → ownership → purchase → attempt/verified Payment → fulfillment → logical assessment → delivery → notification. It returns only operational state: category/status, purchase existence/ownership and expected JPY980 product facts, Payment/verification state, fulfillment/recovery disposition, delivery/result availability, notification state, and reconciliation due/stopped booleans.

It returns no consultation, result body/projection, email, credentials, capability, raw URL, Stripe/provider IDs, or Provider body. Customers cannot execute it. Synthetic local fixtures proved unpaid, verified/pending, processing, manual review, completed, and completed-with-email-failure contexts.

## 7. Paid-failure operator decision matrix

| Scenario | A. Read-only diagnosis | B. Safe customer response | C. Existing recovery path | D. Separate authority required | E. Never do |
| --- | --- | --- | --- | --- | --- |
| Payment not completed or uncertain | intent/attempt/evidence and reconciliation due/stopped | 支払い状況を確認します | current Return polling/reconciliation | any manual Payment action or new Checkout | treat pasted Stripe data as authority; claim Payment completed |
| Payment verified, job pending | durable verified-payment and job state | お支払いを確認済みで、鑑定ノートの状態を確認します | dispatch scheduler | manual scheduler/dispatch mutation | ask the paid customer to pay again |
| Dispatch pending/retryable | job dispatch/retry fence | 処理の受付状態を確認します | existing retryable dispatch | Run-now/manual mutation | create a second purchase or bypass fencing |
| Post-router Async accepted | accepted marker and job/dispatch state | 受付後の処理状態を確認します | existing Async worker path | real event resend | represent acceptance as completion |
| Provider execution retryable | logical recovery state and attempt fence | 鑑定ノートの処理状態を確認します | existing pre-provider/same-assessment retry | Provider retry execution | create a new Checkout or unbounded retry |
| Post-Provider ambiguity/manual review | manual-review state, durable run/job evidence | 安全に確認している状態です | manual-review runbook only | Human-reviewed forward recovery | blindly resend Provider work or fabricate success |
| Delivery completed but inaccessible | ownership, delivery/result availability | 完成済みの鑑定ノートへのアクセスを確認します | Account owned-result recovery | credential rotation if separately authorized | ask for result token/URL or expose result body |
| Result complete, email failed | result availability and notification state | 鑑定ノートはアカウントから確認でき、通知状態を確認します | notification retry/manual review | actual email resend | treat email failure as result loss; include note/result in email |
| Duplicate or wrong charge | attempts, verified Payment, adjustment ledger | 請求状態を確認し、必要な対応を案内します | Payment-integrity review | separately authorized Stripe correction/refund | auto-refund or mutate Payment from the case |
| Refund/cancellation request | ownership, Payment, delivery/fulfillment, policy | 状態と返金方針に基づいて確認します | manual refund review | Stripe refund as separate external Payment operation | promise approval/day; call refund API automatically |
| Customer Auth/access issue | Auth availability without accepting Payment claims | 安全な本人確認手段を案内します | future external fallback | real monitored contact channel | accept pasted IDs/tokens or invent an address |

The preserved invariant is that a customer who paid JPY980 is never sent back to Checkout merely to recover the same purchase. A Support case is not a refund, Provider retry, email resend, Payment restart, or fulfillment completion.

## 8. Local proof and activation boundary

A fresh unlinked disposable Supabase applied exact migrations 0002–0021. Migration history contained 20 exact versions. Fixed synthetic Customer A/B fixtures proved owned creation, cross-Customer/unknown/detached rejection, paid/non-paid category rules, replay/conflict, active dedupe, closed-then-later creation, state transitions, RLS/ACL, service-role-only context, and existing-authority non-mutation. Twenty concurrent identical submissions produced exactly one `created`, nineteen `replay`, one durable case, and one submitted event. The stack was stopped with no backup; containers, volumes, and networks are zero. The empty disposable configuration directory may remain because recursive cleanup was rejected by the execution safety boundary; it contains no live database volume or project link.

External Private Beta remains blocked until all of the following are separately accepted and activated:

- D2 source review PASS and remote 0021 apply under a new explicit Human/ChatGPT authorization;
- `CUSTOMER_SUPPORT_CASES_ENABLED=true` in the target environment;
- actual monitored operator procedure/channel;
- unauthenticated/Auth-failure fallback;
- current refund/cancellation operating procedure;
- D1 seller/contact disclosures reconciled.

No Production environment value was set, no remote DB write occurred, and no support channel or Production runtime was activated.

## 9. Source regression result

- D2 verifier: 28/28 PASS.
- Fresh local DB: exact 0002–0021 apply/history PASS; 20-way identical submission `created=1`, `replay=19`; ownership/idempotency/context/ACL/RLS/non-mutation SQL PASS.
- D1: 30/30; C1: 8/8; Auth Entry: 11/11; Product Intent: 18/18; Purchase Eligibility: 9/9; Clarification Contract: 7/7.
- B1 descendant-regression mode: 15/15; RC-1: 19/19; RC-2: 50/50; Background Durability: 21/21.
- Async graph/artifacts, background runtime assets, scheduled artifacts, independent ingress build/typecheck, and branch-independent ingress catalog privilege preflight: PASS.
- I4 executed its six current scheduler-safety checks successfully, then stopped at its preserved historical literal migration inventory, which intentionally expects only 0002–0019 and therefore rejects accepted 0020 plus candidate 0021. The verifier was not changed.
- I1's direct historical mode stopped at its original task-branch pin; its built-in descendant-regression mode passed 15/15. The separate branch-independent catalog preflight passed after 0021 with ingress EXECUTE on new RPCs exactly zero.
- Root TypeScript, zero-warning ESLint, Production build (37/37 static generation with the new dynamic Support API), and `git diff --check`: PASS.

Linked read-only migration inventory after candidate creation shows remote history exact 0002–0020, pending exact 0021, unknown 0. Existing Git identities 0017/0018/0019/0020 remain unchanged; no remote apply occurred.
