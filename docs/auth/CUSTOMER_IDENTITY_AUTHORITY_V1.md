# Customer Identity Authority V1

- Status: `Customer Identity Architecture V1 designed_pending_human_chatgpt_review`
- Branch: `task/customer-identity-supabase-auth-architecture`
- Design base: accepted Step E release `a785e5c9dacfed28b359befab29e4adb5b76fb07`
- Design date / source access date: `2026-08-21`

R1 correction authority:

- Supabase automatic identity linking is directional for this V1 policy: an OAuth sign-in may link to an existing verified Email identity with the same email, but an Email OTP/signup attempt after an OAuth-only account must not be assumed to add or link an Email identity.
- Customer cookie/session Auth uses only `SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY`. Privileged repositories/admin operations use `SUPABASE_SECRET_KEY` in a separate trust domain.
- V1 is a traditional server-only web Auth model. It has no browser Supabase client, no `createBrowserClient`, no localStorage Auth token, and no client-side provider token.
- The desired one-hour JWT, 24-hour inactivity, and 30-day absolute limits remain activation policy; Supabase time-box/inactivity controls require Pro or higher and are not assumed by Foundation R1.

## 1. Authority decision

Supabase Auth is adopted as the formal Customer Identity Authority for Moon Reply, subject to Human/ChatGPT review of this design. The canonical identity is:

`CustomerUserId = auth.users.id`

Email, Google email, Stripe email, browser state, preparation capabilities, status capabilities, and result credentials are attributes or narrow capabilities. None is the canonical Customer identity.

| Decision | V1 decision |
| --- | --- |
| Identity authority | Supabase Auth `auth.users.id` |
| Initial methods | Google OpenID Connect and Supabase Email OTP |
| Password login | Excluded from the initial release |
| Authentication gate | After the server has produced a purchase-ready preparation and before that preparation is bound or a Purchase Intent/Stripe Checkout is created |
| Browsing and consultation | Anonymous; authentication is not required |
| Ownership model | Option B: one canonical `production_customer_ownership_bindings` table |
| Existing custom mailbox verification | Clean cutover: Auth OFF may operate the accepted legacy lane; Auth ON blocks every new legacy verification flow while retaining historical schema/data compatibility |
| Database access | Server-mediated; no browser DML grant to `authenticated` |
| Result access | Option D: authenticated account/history, with the existing result capability retained as a narrow recovery and legacy path |
| Initial account UX | A minimal `/account` history ships with the first Private Release |
| Account deletion | Revoke access, detach/anonymize identity, delete the Auth user, and retain only legally or operationally required evidence without an active CustomerUserId |
| Exact next task | `Customer Identity Auth Foundation R1 — server-side Supabase Auth and ownership binding` |

This document is an architecture authority candidate. It does not mean Auth is implemented, Google or Email OTP is connected, email works, Stripe is active, Runtime is active, or the product is ready for Private Release or Public Launch.

## 2. Product boundary and customer journey

The low-friction path remains:

`public browsing -> anonymous consultation drafting -> anonymous server qualification -> purchase-ready preparation -> authentication -> server ownership binding -> Purchase Intent -> Stripe Checkout -> verified Payment -> Assessment Grant -> logical Assessment -> Customer Delivery`

Authentication occurs exactly once at the paid-flow boundary. A successful login resumes the existing purchase-ready preparation; it must not repeat qualification, clarification, or consultation input.

The initial UI is deliberately narrow:

- `Googleで続ける`
- `メールで続ける`
- Email flow: enter email -> receive OTP -> enter OTP -> authenticated
- After authentication: continue directly to the final purchase step

No avatar, username, social graph, profile page, subscription dashboard, notification center, or Customer password system belongs in V1.

## 3. Current identity and delivery audit

### 3.1 Current authority chain

The accepted RC-2 implementation is a purchase-local mailbox and capability model, not a durable Customer account model:

`email verification challenge -> verified email authority -> trusted email session -> preparation email binding -> Purchase Intent -> verified Payment -> Assessment Grant -> logical Assessment -> Customer Delivery -> result credential / notification`

### 3.2 What each current control proves

| Question | Current proof | Exact limitation |
| --- | --- | --- |
| What proves mailbox ownership? | A correct one-time code consumes `production_email_verification_challenges` before `expires_at` and within its attempt ceiling. The system then creates `production_verified_email_authorities` and a hash-only `production_trusted_email_sessions` token. | It proves control of one mailbox at one time. It does not prove a stable person or account. |
| What proves purchase ownership? | `production_preparation_email_bindings`, the verified-email authority, the trusted session, and the Purchase Intent's foreign-key chain bind one preparation and purchase to that mailbox authority. | Ownership is purchase-local and email-session-based, not CustomerUserId-based. |
| What allows checkout? | A purchase-ready preparation capability plus the exact valid trusted-email cookie and matching preparation email binding, followed by application and database invariants. | Neither a capability nor cookie proves Payment. |
| What allows status lookup? | A derived, opaque, HMAC-backed purchase-status capability identifies one Purchase Intent. | It is a narrow bearer capability, not account ownership. |
| What allows result access? | `production_result_credentials` stores only a token hash, purpose, issue/revocation state, and nullable expiry. `/result/[token]` resolves a valid bearer token. Status may disclose the result token only when the Purchase-bound trusted email session is valid. | The result URL remains bearer access after disclosure. Current notification credentials do not establish a universal expiration. |
| What allows result-email delivery? | The Purchase Intent joins to the verified email authority; the encrypted delivery address is decrypted server-side and the accepted Step E adapter sends the minimal result notification. | Delivery address authority is tied to the custom verification lane. |
| What proves Payment? | Provider evidence is verified and persisted against exact product, amount, currency, environment, Provider identity, Purchase Intent, and Payment Attempt. Webhook and reconciliation converge on the same authority. | Redirects, cookies, capabilities, email, and Auth sessions never prove Payment. |

### 3.3 Current storage and capability details

- `production_email_verification_challenges` stores challenge and verification secrets hash-only, a keyed email hash, AES-256-GCM email ciphertext, bounded attempts, a non-null expiry, and consumed/revoked/delivery state.
- `production_verified_email_authorities` stores a unique delivery authority reference, keyed email hash, encrypted email, verification time, and revocation.
- `production_trusted_email_sessions` stores a hash-only session token, expiry, revocation, and its verified-email authority.
- `production_preparation_email_bindings` permits one verified mailbox binding per preparation.
- `production_purchase_intents` currently depends on the custom verified-email authority, trusted session, and preparation binding.
- The purchase-status capability is opaque and purchase-local.
- `production_result_credentials.expires_at` is nullable. Current notification credential creation leaves it null; architecture must not imply an expiry that runtime does not establish.
- Result notification idempotency remains based on the durable notification identity and the accepted Step E forwarding contract.

### 3.4 Runtime `owner_id` audit

Every current production `owner_id` is an ephemeral processing lease, not Customer identity:

1. `production_logical_assessments.owner_id` — generation/fulfillment lease owner.
2. `production_notification_outbox.owner_id` — notification processing lease owner.
3. `production_fulfillment_jobs.owner_id` — RC-2 fulfillment-worker lease owner.

They are random Runtime owner IDs, are cleared or replaced through lease processing, and must never be renamed, reused, joined, or reinterpreted as `CustomerUserId`. Customer identity uses only `customer_user_id` or an explicit Customer ownership binding.

## 4. Authentication methods

### 4.1 Google

Google login is authentication only. Request only:

- `openid`
- `email`
- `profile`

Do not request Gmail, Drive, Calendar, Contacts, or any other Google API scope. Do not persist or use Google access or refresh tokens; discard any provider token returned to the application. Ownership is attached to the resulting Supabase `auth.users.id`, never to the Google email or provider token.

The sign-in control must use Google's current approved assets, wording, spacing, colors, and trademark treatment. It must not imply Google endorsement.

### 4.2 Email OTP

Use Supabase Auth passwordless Email OTP. The initial release has no Customer password storage, reset flow, password policy, or password-based login.

The OTP request endpoint must set `shouldCreateUser` according to the intended sign-up/sign-in screen, return a non-enumerating response, enforce application rate limits in addition to Supabase limits, and support CAPTCHA/Turnstile when abuse thresholds require it. OTP verification is performed server-side.

### 4.3 Resend responsibility split

| Mail type | Authority and transport |
| --- | --- |
| Supabase Auth login/OTP mail | Supabase Auth is the template and authentication authority; Resend custom SMTP is the preferred production transport after separate Human configuration. |
| Moon Reply result/transactional mail | The accepted direct Resend SDK adapter remains the application transport. Its sender validation, minimal content, privacy constraints, idempotency forwarding, and safe errors remain authoritative. |
| Legacy custom 8-digit verification | Customer-facing only while `CUSTOMER_AUTH_ENABLED=false`; retained structurally for historical compatibility after Auth cutover, but no new start or completion is allowed while Auth is ON. |

Use distinct sender identities or subdomains for Auth and application transactional mail where deliverability configuration permits. Disable link tracking for Auth links; V1 prefers a numeric OTP to reduce single-use-link scanner risk.

## 5. Existing custom email-verification disposition

Decision: **Option B — retained compatibility schema with one clean Customer-facing runtime regime.**

For new authenticated purchases, a verified Supabase Auth session is the mailbox/identity authority. Requiring the existing Moon Reply 8-digit verification again would create two independent login authorities without a concrete security gain.

V1 selects the runtime regime solely from `CUSTOMER_AUTH_ENABLED`:

- `false`: the accepted legacy custom-email verification and Purchase lane may operate, subject to every existing Payment/Runtime activation gate;
- `true`: every new paid-flow identity uses Supabase Customer Auth, and both new legacy verification start and completion fail closed;
- `CUSTOMER_AUTH_EMERGENCY_STOP=true` stops Customer Auth but never falls back to the legacy lane when `CUSTOMER_AUTH_ENABLED=true`.

The accepted custom schema and core legacy behavior remain retained for historical/database compatibility:

- no table is deleted in this design;
- no accepted migration is rewritten;
- Auth OFF preserves the accepted legacy route/application behavior;
- the dual-lane database CHECK and versioned Payment/Grant functions remain structurally compatible with historical rows and rollback/forward recovery;
- Auth ON creates no new `production_email_verification_challenges`, `production_verified_email_authorities`, `production_trusted_email_sessions`, or `production_preparation_email_bindings`;
- the existing `/result/[token]` bearer capability remains valid according to its own credential authority and does not require reopening legacy mailbox verification.

Before `CUSTOMER_AUTH_ENABLED` may become true on the real remote project, a separately authorized read-only inventory must count relevant rows/state in the four legacy authority tables plus Purchase Intent, Verified Payment, Assessment Grant, and Customer Delivery. The clean prelaunch cutover requires no real Customer-owned legacy Purchase needing recovery. Any such row/state is a hard STOP: do not activate Auth and do not strand it; design and accept a separate recovery transition first.

A later append-only deprecation migration is permitted only after production telemetry proves there are no active legacy dependencies and a reviewed recovery plan exists.

For new purchases, the canonical ownership binding stores a separately encrypted, verified delivery-email snapshot as an attribute. This preserves result-email delivery without treating email as identity and without writing new rows into the legacy verification lane.

## 6. Anonymous preparation to authenticated ownership

### 6.1 State machine

| State | Durable condition | Permitted transition |
| --- | --- | --- |
| `anonymous_purchase_ready` | Existing purchase-ready preparation; no Customer binding | Start a short-lived Auth continuation from the same-origin purchase-ready flow |
| `auth_in_progress` | Hash-only, one-use, expiring Auth continuation bound to the preparation and browser flow | Complete Google PKCE callback or Email OTP; otherwise expire/revoke |
| `customer_bound` | One ownership-binding row names a verified `customer_user_id` and that preparation | Atomically create/attach the Purchase Intent for that same binding |
| `purchase_created` | Purchase Intent references the binding and the same preparation | Existing Checkout/Payment state machine |
| `paid_fulfillment` | Existing verified Payment -> Grant -> Assessment -> Delivery chain | Account/history and narrow recovery access |
| `identity_detached` | Account deletion workflow cleared `customer_user_id`, revoked access, and retained a non-identifying ownership reference | No Customer recovery; only authorized legal/operational handling |

### 6.2 Binding transaction

The server must:

1. Verify the Supabase session using a trusted server client and obtain `auth.users.id`. Never accept a CustomerUserId from the browser body.
2. Verify and consume a hash-only Auth continuation that is bound to the exact purchase-ready preparation, has not expired, and originated from an allowlisted same-origin flow.
3. Lock the preparation and any existing ownership binding.
4. Require the preparation to remain purchase-ready and not already consumed or bound to another Customer.
5. Insert the canonical binding with the verified CustomerUserId and a verified, encrypted delivery-email snapshot.
6. Treat an exact replay by the same Customer and preparation as idempotent success.
7. Treat a different-Customer conflict as a generic fail-closed conflict; do not reveal the other identity.
8. Create or attach the Purchase Intent in the same database transaction, or leave the binding safely resumable without creating Checkout.

A raw preparation capability alone never causes binding. It is one input to starting the short-lived continuation; the authenticated server session and atomic database decision are mandatory.

An unbound anonymous preparation is intentionally device/continuation scoped. After binding, the same Customer may sign in on another device and safely resume through account history. V1 does not silently transfer an unbound anonymous preparation between devices. A future explicit transfer flow would require its own one-time, short-lived, reviewed capability.

Capability leakage cannot steal paid history: once bound, uniqueness and CustomerUserId ownership checks reject every other user. Before binding, continuation expiry, one-use consumption, same-origin initiation, rate limiting, and prompt authentication reduce claim risk; any conflict fails closed.

## 7. Canonical ownership data model

### 7.1 Options considered

| Option | Assessment |
| --- | --- |
| A — add `customer_user_id` to many production tables | Simple local joins but duplicates authority, creates drift, expands account-deletion updates, and increases migration/ACL churn. Rejected. |
| B — one canonical ownership-binding table | One identity edge, minimal downstream changes, existing Purchase/Payment/Delivery foreign-key chain remains authoritative, and identity can be detached without rewriting financial evidence. Selected. |
| C — hybrid replicated identity | Can optimize later reads but introduces two ownership authorities before a proven performance need. Rejected for Private Release. |

### 7.2 Selected binding

Future `production_customer_ownership_bindings` is the only application table that directly references `auth.users.id`. It contains:

- `id` — internal binding ID;
- `ownership_reference_id` — random, non-reversible internal reference retained after identity deletion;
- `customer_user_id` — nullable only after the explicit identity-detachment workflow;
- `preparation_id` — unique; one preparation can belong to only one binding;
- encrypted delivery-email snapshot, keyed hash, encryption key version, verification source, and verification time;
- `state`, `bound_at`, `identity_detached_at`, `created_at`, and `updated_at`.

`production_purchase_intents` gains `customer_ownership_binding_id`, not a copied CustomerUserId. A composite foreign key or equivalent database constraint must prove the Purchase Intent and binding reference the same preparation. A lane CHECK allows exactly one of:

- legacy custom-email ownership fields; or
- the new Customer ownership binding.

The existing chain then propagates ownership:

`auth.users.id -> ownership binding -> preparation -> Purchase Intent -> verified Payment -> Assessment Grant -> logical Assessment -> Customer Delivery`

Account queries start with the authenticated CustomerUserId and join forward through this chain. Email equality never participates.

## 8. Identity linking and conflicts

Supabase-supported verified identity linking is authoritative; Moon Reply must not merge users by comparing raw email strings.

| Scenario | V1 behavior |
| --- | --- |
| Email OTP first, then Google with the same verified email | A later OAuth/Google sign-in may be automatically linked by Supabase to the existing verified Email user. Verify the actual configured behavior in local/staging before activation. |
| Google first, then Email OTP with the same verified email | Do not assume linking or creation of an Email identity. Supabase may return an obfuscated response and send no verification email. In V1 the Customer must use Google again. |
| Google changes its email | Existing ownership remains with the same Supabase user ID/provider identity. An email attribute change never transfers Purchase ownership. Any delivery-email change requires a new verified snapshot for future purchases. |
| Two different verified emails | Treat as separate Supabase users unless the signed-in Customer deliberately completes a supported, reauthenticated linking flow. |
| Accidental duplicate users | Freeze any transfer. Do not rewrite bindings or merge by email. Route to a documented support review and a later audited, idempotent ownership-transfer operation. |
| Account-link conflict | Fail closed, preserve both users and all ownership bindings, disclose no cross-account data, and require Human-supported recovery. |

Both Google and Email OTP remain valid first account-creation choices. The Email OTP request response remains non-enumerating and may show generic guidance equivalent to `メールが届かない場合、Googleで登録した方はGoogleで続けてください。` It must not reveal whether an account exists, which provider owns an email, or whether Supabase sent a message.

Manual identity linking is disabled for the initial Private Release. Supabase documents it as a separately configurable capability; enabling it requires future Human approval, reauthentication design, conflict tests, and provider-dashboard verification. Application-side raw-email merging remains forbidden. The local/staging test matrix must cover both orderings even though V1 deliberately supports no symmetric Google-first -> Email OTP fallback promise.

## 9. Session, cookie, redirect, and CSRF architecture

- V1 chooses a traditional server-only web Auth model. Use request-scoped `@supabase/ssr` `createServerClient` instances only.
- Do not add `createBrowserClient`, a browser Supabase Auth client, a `NEXT_PUBLIC` Auth key, localStorage Auth tokens, or client-side provider-token persistence.
- Google initiation, callback exchange, Email OTP request/verification, refresh, logout, and sensitive identity checks are server-route operations.
- Store Auth session material only in framework-managed cookies. Production cookies are `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and host-only with no `Domain`. Local development may omit `Secure` only where localhost requires it.
- If a future task introduces a browser Supabase Auth client, the HttpOnly decision must receive a new security review; it must not be silently weakened.
- Use PKCE for Google/OAuth and exchange the authorization code server-side. Bind a high-entropy, single-use continuation to the preparation; validate callback state and exact flow before binding.
- Allow only exact production and local-development redirect origins. Do not use a broad production wildcard. A post-auth return target is a server-selected relative path, not an arbitrary URL.
- Disable caching, static generation, and route prefetch side effects for Auth callback and Customer account responses. Authenticated responses send private/no-store cache policy.
- Use a fresh server `getUser()` lookup for binding, checkout, deletion, ownership-sensitive result/history access, and other high-impact operations; also require an active, non-detached binding. Never authorize from unverified `getSession().user` data.
- Protect every state-changing application endpoint with same-origin checks, an anti-CSRF token bound to the session/continuation, and non-GET methods. `SameSite=Lax` is defense in depth, not the sole CSRF control.
- Use the reviewed Next.js server refresh mechanism: a request-scoped server client plus a narrowly scoped `proxy.ts` only where session refresh is required. Proxy must perform no application rewrite or arbitrary redirect and must exclude static assets. Next 16.3 hard/client navigation, URL, cache, redirect-loop, static-asset, and console/server-error behavior requires focused proof if Proxy is introduced.
- The refresh proxy uses verified `getClaims()` behavior for refresh/page protection and propagates rotated cookies to both the request and response; it is not a substitute for fresh `getUser()` checks at high-impact boundaries.
- The target policy remains an approximately one-hour access JWT, 24-hour inactivity timeout, and 30-day absolute session lifetime. Supabase time-boxed and inactivity controls are Pro-plan features. Foundation R1 must not assume they are configured or available and is not blocked from local implementation by that external plan fact.
- Before Private Release, Human must either use a Supabase plan/configuration supporting the reviewed limits or accept a separately reviewed application-level equivalent. Until then the inactivity/absolute policy is an activation gate, not implemented evidence.
- Refresh occurs server-side and rotates the refresh token through response cookies. Refresh failure clears local cookies and returns the Customer to the Auth gate without rebinding or recreating a purchase.
- Normal logout ends the current-device session. Account deletion and explicit security recovery revoke all Supabase sessions. Because an access JWT can remain valid until expiry, sensitive endpoints also verify current user/session state and detached ownership state.

### 9.1 Supabase credential trust-domain separation

The Customer Auth client and privileged application repository are distinct trust domains even though both target Supabase:

| Trust domain | Allowed credentials | Forbidden authority |
| --- | --- | --- |
| Cookie-bound Customer Auth | `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` | `SUPABASE_SECRET_KEY`, service-role/admin DB bypass |
| Existing privileged repository/admin | `SUPABASE_URL` + `SUPABASE_SECRET_KEY` | `SUPABASE_PUBLISHABLE_KEY` as repository authority, Customer cookie inheritance |

Hard invariants:

- `SUPABASE_SECRET_KEY` is never passed to `createServerClient` for Customer cookie/session Auth.
- `SUPABASE_PUBLISHABLE_KEY` never replaces the privileged repository authority.
- No Auth operation inherits the service-role client's RLS-bypass authority.
- No module-scope Customer Auth client retains request cookies or session state.
- Static and runtime tests must fail on secret/publishable mixing.

## 10. Database access and RLS

Decision: **Model 1 — keep the production data layer server-mediated.**

Supabase Auth proves identity; it does not justify opening application tables to the browser.

- RLS remains enabled on all production/runtime tables.
- PUBLIC, `anon`, and `authenticated` table DML remains zero.
- The accepted Step D service-role least-privilege matrix remains authoritative.
- New Customer tables grant only the minimum server/runtime operations; no Runtime DELETE privilege is introduced.
- The server secret/service-role client remains server-only and disables client session persistence.
- Every repository/RPC receiving a verified CustomerUserId must constrain the ownership join in the same database operation.
- A service-role query without an explicit ownership predicate is a security defect because service role bypasses RLS.
- Direct JWT/RLS Customer reads may be reconsidered only after a concrete performance or product requirement and a separate ACL/RLS review.

## 11. Result access and recovery

Decision: **Option D — Auth session for account/history; existing capability retained for narrow recovery.**

For new authenticated purchases:

- `/account` lists only deliveries reached through the authenticated CustomerUserId ownership chain.
- Opening a result from account uses an authenticated server route and an ownership-constrained repository/RPC. The browser does not receive or choose a CustomerUserId.
- The purchase-status capability may continue to poll one Purchase, but it cannot disclose a result credential unless the current authenticated Customer owns the binding.
- The accepted result credential and `/result/[token]` path remain available according to their own narrow bearer authority. They are not redefined as account ownership and do not authorize a new legacy mailbox-verification flow after Auth cutover.
- Result emails for new authenticated purchases should prefer an account/result route. The existing bearer URL remains a compatibility capability until a separately reviewed migration can narrow it further.
- Revocation, purpose, optional expiry, no-sharing guidance, privacy-safe content, and Step E idempotency remain intact. Do not claim expiry unless a specific credential has one.

This choice supports another-device login without deleting the accepted RC-1/RC-2 bearer mechanism. It does not claim simultaneous operation of both Customer-facing identity regimes.

## 12. Minimal account history

A minimal `/account` page is required for the initial Private Release. Adding durable identity without exposing its main recovery value would impose login friction without a corresponding Customer benefit.

The list contains only:

- purchase/result date;
- a generic safe title such as `鑑定ノート`;
- `処理中` or `閲覧できます` status;
- an open-result action.

No consultation text, inbound message, draft, assessment excerpt, relationship detail, email address, Stripe identifier, capability, or result-token value appears in list previews. The account page is private, server-rendered, no-store, and ownership constrained.

## 13. Account deletion and retention

Deletion is an explicit orchestration, not a blind cascade:

1. Reauthenticate the Customer and create an idempotent deletion request.
2. Immediately block new checkout, account/history reads, and recovery issuance; revoke Auth sessions and result credentials where policy allows.
3. Delete or anonymize Customer content according to the reviewed retention schedule.
4. In one database transaction, replace the active Customer link with `ownership_reference_id`, clear `customer_user_id`, and mark `identity_detached`.
5. Delete the Supabase Auth user through the Admin API. If this external step fails, access remains denied and deletion is retried; ownership is never rebound automatically.
6. Retain only the minimum required payment/integrity/security evidence under the non-identifying internal reference.

| Data class | V1 disposition | Reason / duration |
| --- | --- | --- |
| Auth identity | Delete after detachment; revoke all sessions immediately | No product need after account deletion. Exact completion retry policy is an implementation requirement. |
| Profile/identity attributes | Delete; do not retain Google provider tokens | Identity minimization. |
| Consultation data | Delete or irreversibly anonymize | Exact retention period is an unresolved Japanese legal/Product decision before Private Release. |
| Assessment/result content | Delete or irreversibly anonymize unless an established dispute/legal hold applies | Exact retention period and Customer notice remain unresolved. |
| Result credentials | Revoke immediately, then delete/anonymize under the approved retention job | Prevent post-deletion bearer recovery. |
| Delivery email | Delete ciphertext and keyed hash when delivery, support, refund/dispute, and legal needs end | Exact duration remains unresolved; never retain merely for identity matching. |
| Stripe/payment evidence | Retain the minimum transaction/refund/dispute/accounting evidence; sever active CustomerUserId | Payment Integrity and legal/accounting needs. Exact statutory/processor-aligned duration requires legal confirmation. |
| Immutable integrity ledger | Retain non-identifying integrity facts and `ownership_reference_id` | Fraud, reconciliation, and audit integrity; no raw email or Auth user ID after detachment. Duration unresolved. |
| Operational/security logs | Retain minimized, access-controlled security events | Abuse/incident response. Exact duration unresolved; consultation and tokens must not enter ordinary logs. |

Unresolved duration decisions are release blockers for the deletion notice and retention job, not permission to retain indefinitely. This architecture does not claim final legal compliance.

## 14. Legal and privacy changes required before Private Release

`legal_changes_required_before_private_release`:

| File | Required correction |
| --- | --- |
| `docs/legal/PRIVACY_POLICY_DRAFT.md` | Add account authentication, email, minimal Google identity data, Supabase Auth, Resend Auth mail, account/history purposes, deletion/request flow, retention classes, processors, and overseas handling. |
| `docs/legal/TERMS_OF_SERVICE_DRAFT.md` | Add session/account responsibility, unauthorized access reporting, multiple identities/link conflicts, suspension, deletion effects, and retained transaction evidence. |
| `docs/legal/LEGAL_DRAFT_CONSISTENCY_MATRIX.md` | Supersede the current no-account/no-Google-login assumption and align all Auth/account surfaces. |
| `docs/legal/LEGAL_SOURCE_REGISTER.md` | Record current Supabase, Google, Resend, and Japanese privacy primary sources and review dates. |
| `docs/legal/LEGAL_DRAFT_PUBLICATION_GATE.md` | Add Auth configuration, Google production identity, processor/overseas review, deletion/retention, and branding gates. |
| `docs/legal/LEGAL_PAGES_REQUIREMENTS.md` | Add account, history, login, deletion, session, processor, and Google identity disclosures. |
| `lib/legal/review-content.ts` | Add reviewed Customer-facing Terms/Privacy facts consumed by the application; do not publish placeholder conclusions. |
| `app/legal/privacy/page.tsx` | Render the accepted Auth/processor/deletion/privacy facts. |
| `app/legal/terms/page.tsx` | Render the accepted account/session/deletion/multiple-identity terms. |

Human legal review must determine the exact retention periods, cross-border/processor disclosures and safeguards, lawful handling basis, contact/request procedure, and whether additional consent or notice is required. Supabase, Google, Resend, Stripe, and OpenAI roles must reflect actual configured data flows, not planned assumptions.

## 15. Google production identity and Human setup

Google OAuth private development/testing may occur before Public Launch under separately authorized non-production configuration. This design performs none.

Future Human production setup, not authorized in this task:

- create/configure the Google OAuth client under an owned project;
- configure the exact Supabase callback URI and exact application redirect allowlist;
- set only `openid email profile` scopes;
- verify the production homepage, owned/authorized domain, application name, logo, Privacy Policy, and Terms;
- complete any Google brand/consent-screen verification required for the final configuration;
- use approved Sign in with Google assets and avoid endorsement claims;
- configure Supabase Google provider credentials, Email OTP template, redirect URLs, session limits, rate limits, CAPTCHA, and custom SMTP;
- configure Resend SMTP sender/domain authentication for Auth mail separately from the existing direct SDK adapter;
- verify automatic identity-linking behavior and duplicate/conflict cases in a non-production test matrix;
- record processor, region, contract/DPA, overseas handling, and deletion/retention decisions.

Final production publishing still requires an owned/authorized domain, publicly accessible homepage, Privacy Policy, accurate application identity, exact redirect URIs, and compliant Google branding. Only `openid email profile` scopes are permitted; Gmail, Drive, Calendar, and Contacts remain prohibited. No Google production verification is claimed.

No dashboard, credential, sender, DNS, provider, or account change is performed by this design.

## 16. Stripe and Payment impact

The future checkout precondition becomes:

`verified Supabase session -> Customer-bound purchase-ready preparation -> Purchase Intent -> Checkout`

Changes:

- Checkout verifies the current Supabase user server-side and requires the canonical binding for the same preparation.
- New Purchase Intents reference `customer_ownership_binding_id` instead of legacy email-authority/session/binding fields.
- Stripe email remains a delivery/provider attribute and never establishes ownership.
- Status disclosure for a new purchase requires the matching Auth Customer for private result data.
- Closing or reopening the browser is recoverable through login and `/account`; the status capability still supports narrow same-Purchase polling.

Unchanged:

- exactly one Purchase Intent per preparation;
- sequential Attempts and unresolved-attempt blocking;
- server-derived idempotency;
- no double charge;
- same-Purchase Checkout recovery;
- webhook/reconciliation convergence;
- exact product/amount/currency/environment verification;
- server-only Payment authority;
- one verified Payment -> one Grant -> one logical Assessment/delivery;
- browser redirect, Auth session, email, and capability never prove Payment.

No Stripe operation or Payment occurs in this design task.

## 17. Threat model

The mandatory 15-case threat model and fail-closed requirements are in `docs/auth/CUSTOMER_IDENTITY_THREAT_MODEL_V1.md`. Its controlling principles are:

- never trust browser-supplied Customer identity;
- bind once under a row lock and unique constraint;
- treat service-role access as requiring explicit ownership predicates;
- make all continuations/capabilities narrow, hash-only, revocable, and expiring where runtime establishes expiry;
- do not merge accounts by email;
- preserve Payment authority and recovery independently of Auth/provider availability;
- deny private disclosure on uncertainty.

## 18. Migration authority

No migration is created in this task. Accepted migrations `0002..0013` remain byte-identical. The future append-only design is `0014_customer_identity_authority_v1.sql` and is specified in `docs/auth/CUSTOMER_IDENTITY_MIGRATION_PLAN_V1.md`.

## 19. Exact next implementation task

After Human/ChatGPT acceptance of this architecture, the exact next task is:

**`Customer Identity Auth Foundation R1 — server-side Supabase Auth and ownership binding`**

Bounded scope:

1. add the reviewed `@supabase/ssr` dependency and server-only Supabase Auth clients;
2. add server routes for Google initiation/callback, Email OTP request/verify, logout, and session refresh;
3. add the purchase-bound Auth gate without re-running consultation qualification;
4. implement reviewed append-only `0014_customer_identity_authority_v1.sql` and deterministic local DB proof;
5. implement atomic preparation binding and new Purchase Intent ownership lane;
6. enforce Auth ownership on checkout, new-purchase status disclosure, result/account reads, and minimal `/account` history;
7. preserve the legacy schema/core behavior and bearer result capability, prove Auth OFF legacy compatibility, and prove Auth ON blocks every new legacy verification write;
8. add deterministic fakes/verifiers, privacy/secret scans, and the full baseline gates.

Explicitly excluded from that code task unless separately authorized: Supabase/Google/Resend dashboard changes, credentials, real OTP/email, DNS, Stripe calls, Payment, migration apply to remote, deploy, Runtime activation, main merge, Private Release, and Public Launch.

## 20. Official primary sources

All sources were accessed `2026-08-21`. Conclusions are paraphrased; this register is technical/product research, not legal advice.

| Source | Relevant conclusion |
| --- | --- |
| [Supabase Auth overview](https://supabase.com/docs/guides/auth) | Auth provides passwordless and social methods, issues JWTs, and uses `auth.users` as the user authority. |
| [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless) | Email OTP/magic-link flows are supported without a Customer password. |
| [Supabase signInWithOtp reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp) and [verifyOtp reference](https://supabase.com/docs/reference/javascript/auth-verifyotp) | OTP issuance, account-creation control, and verification must be implemented through the supported Auth APIs. |
| [Supabase Google social login](https://supabase.com/docs/guides/auth/social-login/auth-google) | Google provider setup requires the provider credentials and exact callback configuration; login needs only identity scopes. |
| [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking) | OAuth sign-in may automatically link to an existing same-email verified user. Email signup after an OAuth-only account can instead return an obfuscated response with no verification email; V1 must not promise symmetric linking. |
| [Supabase Next.js server client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&queryGroups=framework) | Next.js SSR uses cookie-backed, request-scoped server clients and a server refresh mechanism. V1 deliberately omits the optional browser client. |
| [Supabase SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) | PKCE callback exchange, cookie refresh, and Next.js prefetch/cache behavior require deliberate handling. |
| [Supabase server package guidance](https://supabase.com/docs/guides/auth/choosing-a-server-package) | `@supabase/ssr` is the supported direction for server-rendered frameworks. |
| [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) | Publishable keys are the low-privilege client/Auth credential; secret keys are backend-only elevated authority and must remain outside Customer cookie Auth. |
| [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) and [sign out](https://supabase.com/docs/guides/auth/signout) | Access/refresh-token behavior, multi-device sessions, sign-out scope, and JWT-expiry caveats shape the policy. Time-box and inactivity controls require Pro or higher; traditional server-only applications may use HttpOnly cookies. |
| [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) | `redirectTo` must match the configured allowlist; the production Site URL must be exact. |
| [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits) and [CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha) | Auth endpoints have platform limits and optional CAPTCHA; application abuse controls are still required. |
| [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) and [email templates](https://supabase.com/docs/guides/auth/auth-email-templates) | Production Auth mail should use custom SMTP; templates and link tracking require deliberate configuration. |
| [Supabase managing user data](https://supabase.com/docs/guides/auth/managing-user-data) | References should target the `auth.users` primary key; user deletion and still-valid access JWTs require explicit design. |
| [Supabase cascade-delete guidance](https://supabase.com/docs/guides/database/postgres/cascade-deletes) and [Auth user deletion FK troubleshooting](https://supabase.com/docs/guides/troubleshooting/resolving-500-status-authentication-errors-7bU5U8) | Foreign-key delete semantics can destroy dependent data or block Auth deletion; explicit detachment is safer for retained Payment evidence. |
| [Google OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes) | Request the smallest scopes; Moon Reply needs identity only and no Google product-data scope. |
| [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server) | The authorization-code flow requires exact redirects and CSRF protection such as validated state; established libraries are preferred. |
| [Google OAuth policy](https://developers.google.com/identity/protocols/oauth2/policies) | Production application identity, owned domain, homepage, Privacy Policy, Terms, and non-deceptive behavior must be accurate. |
| [Google branding guidance](https://developers.google.com/identity/branding-guidelines) | Sign in with Google assets and trademarks must follow Google's current presentation rules. |
| [Google production brand verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification) | Production consent-screen identity and domain/policy links may require verification. |
| [PPC Japan general guidelines](https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/) | Purpose specification, security controls, and awareness of foreign handling conditions are relevant to Auth and processors. |
| [PPC Japan foreign-third-party guidelines](https://www.ppc.go.jp/personalinfo/legal/guidelines_offshore/) | Overseas processor/third-party handling requires an actual-role, safeguards, contract, and supervision assessment. |
| [PPC Japan APPI Q&A](https://www.ppc.go.jp/personalinfo/faq/APPI_QA/) | Disclosure/consent or recognized safeguards for foreign handling depends on the actual arrangement and requires legal review. |
