# M2-B1 Return / Account Convergence

## Scope and authority

- Task branch: `task/m2-b1-return-account-convergence-r1`
- Base authority: `release/private-ready@1b4863985fb1bd32e769ddfac884a27b236472cb`
- Primary backlog: `REL-01` / `REL-02`
- Explicitly deferred: `REL-03` webhook ingress (`M2-B2`)
- Remote database remains `0002` through `0017`; this task adds no migration or remote write.
- Production Publish, Netlify configuration changes, Stripe writes, webhook resends, Async events, Provider calls, and Purchase operations remain prohibited.

## M2-A1 closure inherited by this task

- `0017_m2_a1_null_fence_integrity.sql` is applied remotely and M2-A1 is closed through Production DB.
- Immutable Git blob SHA-256: `b5c2534dbc8bdb97e6fa77612143b8bf9ec78c2955908ceab3d360bab30f9380`.
- The confirmed NULL owner/lease fulfillment and notification exploits are closed remotely.
- Production Publish was unnecessary for M2-A1. Published source `0befd512219eb2897fb1edf969ad37d7e8c56b0d` was confirmed compatible with DB0017.
- Existing deploy `6a8af2575d156800089493ec` remains UNPUBLISHED and is not a publish candidate for this task.

## Customer purchase status contract

`paymentVerified` is server-owned. It is true only after durable payment authority exists; for `confirmation_pending` that authority is the persisted `successfulPaymentId`, never the status name itself.

| Status | Payment verified | Automatic polling | Customer action | Terminal | Result destination | Authenticated Account fallback |
| --- | --- | --- | --- | --- | --- | --- |
| `confirming_payment` | false | bounded steady polling | none | no | none | available |
| `payment_not_completed` | false | stopped | explicit Checkout restart only | yes | none | available |
| `preparing_assessment` | true | bounded steady polling | none | no | none | available |
| `temporary_problem` | true | bounded backoff, then manual recovery | manual refresh after budget | no at server; client recovery after budget | none | available |
| `confirmation_pending` | durable-authority dependent | stopped | wait for review; no automatic repayment | yes | none | available |
| `completed_check_verified_email` | true | stopped | check verified mailbox | yes | none | unavailable for legacy lane |
| `completed` | true | stopped | none | yes | canonical allowlisted path | available for authenticated lane |

The response decoder is strict and rejects missing or extra fields. `accountFallback` is also server-owned so the legacy/email lane cannot acquire authenticated navigation authority from browser inference.

## Canonical result destinations

Completed responses accept only these two relative paths:

1. Legacy: `/result/<43-character base64url token>`
2. Authenticated: `/account/results/<RFC 4122 UUID with valid version and variant>`

External and protocol-relative URLs, query strings, fragments, traversal, malformed UUIDs, malformed tokens, suffixes, prefixes, and wildcard paths fail closed. The server and client use the same parser. A malformed server-side destination is downgraded to `temporary_problem`; it is never returned as a redirect.

## Polling and recovery

- One recursive timeout is scheduled only after the preceding request settles; request overlap is zero.
- Steady polling uses 2.5 seconds. Transient transport/decode failures and retryable `temporary_problem` use capped exponential delay: 1.5 seconds base, 30 seconds cap, and plus/minus 20 percent jitter.
- Transient failures and `temporary_problem` each have an eight-retry budget. All automatic requests also share a 120-request ceiling.
- Budget exhaustion exposes a customer-safe manual refresh and, when authorized, `私の鑑定ノートを確認する` linking to `/account`. It never creates Checkout.
- `payment_not_completed`, `confirmation_pending`, and `completed_check_verified_email` are terminal and do not loop.
- `completed` validates its destination and calls replace once behind a navigation latch.
- Unmount aborts the in-flight fetch, clears the timer, and prevents later state or navigation updates.

## Customer and payment safety

- A verified or review-pending payment never receives a repayment CTA.
- `追加のお支払いは必要ありません` is shown for `confirmation_pending` only when durable server authority sets `paymentVerified: true`.
- Unverified review state makes no payment-confirmation claim and no guaranteed-contact promise.
- Status reads retain the existing bounded dispatch seam. Dispatch idempotency, webhook semantics, Stripe semantics, DB0017, and Async retry authority are unchanged.
- Return is no longer the only authenticated recovery surface: the server-authorized Account fallback is available without weakening Customer Auth or the legacy result-token contract.

## Candidate use

Reference inspected: `task/m2-purchase-trust-ux-r1@1b8b61b32b1f284f843593777d8f0520ce13281b`.

Concepts reimplemented on current authority, without merge or cherry-pick:

- explicit legacy and authenticated result-path alternatives;
- explicit `paymentVerified` discriminator;
- state-specific, close-safe customer assurances.

Rejected from the candidate:

- catch handling that permanently stopped polling after one transient failure;
- wholesale component or commit transfer from its stale authority;
- progress treatment outside bounded Return/Account recovery scope;
- any Netlify, runtime-assets, background-artifact, webhook, Stripe, database, or Async authority change.

## Verification contract

`npm run verify:m2-b1` covers the required 15-case Return/Account matrix, path adversaries, bounded backoff, no overlap, budget exhaustion, terminal states, unmount cleanup, exact-once navigation, and protected-surface identity. RC-2 additionally executes server application status flows for unverified/verified `confirmation_pending` and authenticated completed delivery decoded by the client contract.

Completed local results:

- M2-B1 `15/15`; RC-2 Payment/Delivery `50/50`; RC-1 `19/19`.
- Background Fulfillment Durability `21/21`; Async worker graph and generated artifacts PASS; packaged runtime-assets PASS.
- Purchase Eligibility `9/9`; Customer Auth entry `11/11`; Product Intent `18/18`; Clarification Contract `7/7`.
- TypeScript PASS; ESLint zero-warning PASS; Next production build PASS with all 38 static pages generated; `git diff --check` PASS.
- No Provider, remote Supabase, migration, Stripe, webhook, Async event, Purchase, deploy, publish, or Netlify configuration operation was performed.

Historical `verify:m2-a1` is intentionally not rewritten or forced to pass because it pins the completed M2-A1 branch/base state. M2-B1 instead verifies the accepted M2-A1 migration and proof files are byte-identical to its base.

The standalone EA4 runtime verifier was invoked but stopped before proof execution with `M1_4_EXPAND_LOCAL_CONFIGURATION_REQUIRED` because no disposable local Supabase configuration was present. Its exact A-H compatibility coverage still passed inside the current Background Fulfillment Durability verifier. The historical Customer Auth Foundation verifier is likewise not rewritten because it pins its accepted branch/SHA; current Auth entry plus RC-2 authenticated-completion execution cover the changed path.

A new deployable visual-review route was not added: doing so would enlarge the Production review surface and overlap the separate M2-F2 visual task. Customer copy/state projection is exercised offline through the pure presentation contract; no external Purchase was used.
