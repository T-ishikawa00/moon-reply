# Measurement Foundation V1

## Status and authority

- Status: `Measurement Foundation V1 implemented_pending_human_chatgpt_review`.
- Branch: `task/measurement-foundation-v1`.
- Exact base and accepted Product authority: Customer Identity Auth Foundation release `fb90b89de51b91753bbdf25278f4a0e4960a5c6e`.
- This foundation defines and instruments a vendor-neutral event contract. It does not connect, configure, call, or authorize any analytics or advertising Provider.
- `MEASUREMENT_ENABLED=false` is the default. The only V1 adapter is an in-process disabled adapter; enabling the flag alone still connects nothing.

## V1 event contract

| Event | Sole V1 semantic boundary | Explicit non-authority |
| --- | --- | --- |
| `page_view` | One application page view or App Router navigation | React render alone |
| `sample_view` | The Customer opens the public sample assessment experience | A link impression or sample CTA impression |
| `request_start` | First meaningful consultation-form field change in one mounted request experience | Loading `/request` |
| `request_complete` | The server response has been decoded as `purchase_ready`, including the one-clarification path | Submit, client validation, or Safety result alone |
| `auth_start` | A continuation exists and Google returned a valid HTTPS authorization URL, or Email OTP request returned `accepted` | Auth button click |
| `auth_complete` | Server-side identity verification and preparation binding completed successfully | OTP entry, callback arrival, or button interaction |
| `checkout_start` | The server returned `checkout_ready` and the client accepted a credential-free Stripe Checkout HTTPS URL | Checkout button click |
| `purchase` | `recordStripeEvidence` durably returned a `verified` or idempotent `duplicate` result with the existing Verified Payment ID | Stripe redirect, query, browser state, status polling, or fulfillment state |

## Explicit payload allowlist

No generic property bag is accepted. `createMeasurementEvent` checks exact keys and literal/enum values at runtime as well as through TypeScript.

| Event | Allowed payload only |
| --- | --- |
| `page_view` | `page`: a coarse route area enum; never a URL, query, token, ID, or free text |
| `sample_view` | `sample: "public_sample"` |
| `request_start` | `experience: "consultation_request"` |
| `request_complete` | `outcome: "purchase_ready"` |
| `auth_start` | `method: "google" | "email_otp"` |
| `auth_complete` | `method: "google" | "email_otp"` |
| `checkout_start` | `provider: "stripe"` |
| `purchase` | `transactionId`, `value: 980`, `currency: "JPY"` |

The payload contract cannot accept consultation text, `partnerMessage`, `draftMessage`, nickname, relationship detail, requested topic, email, Google email, CustomerUserId, Supabase user ID, preparation/status capability, result token/URL, delivery ID, raw Purchase Intent or Verified Payment ID, any raw Stripe ID, verification code, OTP, access token, or refresh token.

## Client and server boundary

- `lib/measurement/events.ts` owns event names, exact payloads, runtime validation, and canonical JPY 980 values.
- `lib/measurement/client.ts` permits only non-authoritative browser events. Its type excludes `auth_complete` and `purchase`, and it dispatches only to the disabled adapter.
- `lib/measurement/server.ts` owns `auth_complete` and Verified-Payment-backed `purchase`. All entrypoints are fail-isolated and return a status; they never throw into Auth or Payment.
- `lib/measurement/adapters.ts` contains only the disabled in-process adapter. It has no network, script, SDK, cookie, browser storage, queue, or database behavior.

App Router page measurement sends a coarse area such as `account_result` or `legacy_result`, never the dynamic pathname. The sample observer and page observer use effect/ref occurrence guards. Request start/complete guards are per mounted request experience. Auth and checkout calls occur only in post-response success branches, not event handlers at click time.

## Purchase authority and transaction identity

`ProductionPaymentDeliveryApplication.verifyStripeEvidence` first performs the existing exact Product, amount, currency, environment, Checkout, Payment, and Purchase-reference evaluation. It then awaits the existing repository's atomic durable record operation. Only the returned `RecordedPaymentEvidence` is offered to the measurement seam.

The seam constructs `purchase` only for:

- disposition `verified` with a durable Verified Payment ID; or
- disposition `duplicate` with the repository-returned existing Verified Payment ID.

The external-safe `transactionId` is:

`mrp_` + Base64URL(HMAC-SHA-256(dedicated secret, `moon-reply:measurement:purchase:v1:` + immutable Verified Payment UUID))

The secret is `MEASUREMENT_TRANSACTION_SECRET`; it is server-only, at least 32 bytes, and must never reuse Payment status, email, Customer Auth, Supabase, or Stripe secrets. The HMAC is deterministic for the same Verified Payment and secret, opaque, domain-separated, and contains no raw internal/provider ID. Secret rotation would change transaction identity and therefore requires a separately reviewed migration/idempotency plan.

Webhook retry and same-Payment reconciliation receive the existing Verified Payment ID from the durable repository and therefore derive the same transaction ID. Browser refresh, return navigation, status polling, and fulfillment retry do not sit on the construction path. Conflict, stale, pending, failed, canceled, and rejected dispositions do not construct a purchase event.

## Disabled operation and reliability ceiling

- Default configuration is `MEASUREMENT_ENABLED=false` with an empty dedicated secret.
- Disabled operation returns before reading the secret. A missing/invalid secret while enabled is contained as `unavailable`.
- Measurement is invoked only after durable Payment recording and cannot fail, reverse, duplicate, or delay that recording. It cannot block fulfillment.
- There is no analytics outbox in V1 because there is no external delivery.
- External purchase adapters may **not** be activated until delivery, retry, and idempotency semantics are separately reviewed. A future external call must not be added inline to the Payment transaction path.

## Reserved future Provider mappings — not connected

| Moon Reply | GA4 reserve | Google Ads reserve | Meta reserve | X reserve |
| --- | --- | --- | --- | --- |
| `page_view` | page view | no conversion | page-view equivalent | page-view equivalent |
| `sample_view` | custom sample view | optional future funnel signal | custom equivalent | custom equivalent |
| `request_start` | custom request start | optional future funnel signal | lead-start equivalent | custom equivalent |
| `request_complete` | custom request complete | optional future conversion | lead equivalent | conversion equivalent |
| `auth_start` | custom auth start | no conversion | custom equivalent | custom equivalent |
| `auth_complete` | custom auth complete | optional future funnel signal | custom equivalent | custom equivalent |
| `checkout_start` | begin-checkout equivalent | optional future conversion | checkout-init equivalent | conversion equivalent |
| `purchase` | purchase equivalent | future purchase conversion | future purchase equivalent | future purchase equivalent |

These are naming/intent reservations only. No Provider SDK, script, endpoint, account, destination ID, API token, browser cookie, advertising cookie, or network adapter exists.

## Consent and legal activation gate

No consent UI is added solely for this disconnected no-op foundation. Before any external analytics or advertising adapter is activated, Human/ChatGPT review must approve the exact transmitted fields, Privacy disclosures, cookie/storage behavior, consent and opt-out requirements for actual launch jurisdictions, applicable Provider terms, and sensitive-category restrictions. This document makes no legal-compliance claim.

## Verification and operation boundary

`npm run verify:measurement-foundation` proves the exact names and allowlists, runtime rejection, server-only purchase path, deterministic HMAC, disabled/failure isolation, semantic instrumentation, absence of Provider/network/cookie code, and accepted migration/Auth authority preservation. Existing RC-2, RC-1, activation, Step B, ACL, email, Customer Auth, typecheck, zero-warning lint, build, diff, and both audit gates remain mandatory.

External operation counters for this candidate are all `0`: remote Supabase read/write/apply, Supabase Auth/Google/Resend/Stripe/Payment, analytics or advertising Provider, external measurement call, cookie, deployment, runtime activation, production secret, DNS, Public Launch, PR, release merge, and main merge.

Exact next action: **Human/ChatGPT review Measurement Foundation V1.**
