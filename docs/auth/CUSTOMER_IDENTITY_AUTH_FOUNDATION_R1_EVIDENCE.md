# Customer Identity Auth Foundation R1 Evidence

Status: `Customer Identity Auth Foundation R1 implemented_pending_human_chatgpt_review`.

This record is technical implementation evidence. It is not Human/ChatGPT acceptance, production activation, migration authorization, Private Release readiness, or Public Launch authorization.

## Authority and lineage

- Step E accepted release authority: `a785e5c9dacfed28b359befab29e4adb5b76fb07`.
- Architecture candidate: `97274812f88c189636a7f25e194f17a79ff33016`.
- Architecture R1 correction: `2af7e9d5c36485736676fde21428325f70b58ab0` (`docs: correct customer identity auth assumptions`).
- Architecture acceptance and ff-only `release/private-ready`: `8bf6c4e9c0a860b48826708676f0abe7c4395714` (`docs: accept customer identity authority v1`).
- Foundation branch: `task/customer-identity-auth-foundation-r1`, created from exact accepted Architecture release `8bf6c4e9c0a860b48826708676f0abe7c4395714`.
- `main` authority remains `61e33a10e195fad17e253a6b9719217e1992f273`.
- Architecture R1 corrected only `CUSTOMER_IDENTITY_AUTHORITY_V1.md`, `CUSTOMER_IDENTITY_MIGRATION_PLAN_V1.md`, and `CUSTOMER_IDENTITY_THREAT_MODEL_V1.md`; no implementation changed in Phase A.

## Architecture R1 disposition

- Identity linking is intentionally asymmetric. Email-OTP-first may later gain a verified same-email Google OAuth identity through Supabase automatic linking. Google-first must use Google again in V1; Email OTP is not promised as fallback.
- Application raw-email merge and manual identity linking remain prohibited. Both orderings remain an activation test obligation.
- Cookie-bound Customer Auth uses only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Privileged repositories use only `SUPABASE_SECRET_KEY`; the two clients are separate trust domains.
- V1 is server-only: no `createBrowserClient`, browser Supabase Auth client, localStorage Auth token, or client-side provider-token persistence.
- Production cookies are Secure, HttpOnly, SameSite=Lax, Path=/, and host-only. Secure is omitted only for exact loopback hosts in local proof.
- Desired inactivity and absolute session limits remain an activation gate because reviewed Supabase time-box/inactivity controls require a supporting plan or a separately reviewed application equivalent. Foundation high-impact operations use fresh `getUser()` and detached-binding checks.
- Google production publishing, owned domain, public policy pages, approved redirects, accurate identity, and branding remain external future work. The requested scope is only `openid email profile`.

## Dependency and environment contract

- Exact stable dependencies: `@supabase/ssr@0.12.4` and `@supabase/supabase-js@2.112.3`.
- Blank Customer Auth credential contract: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and the existing separately privileged `SUPABASE_SECRET_KEY`.
- Fail-closed flags: `CUSTOMER_AUTH_ENABLED=false`, `CUSTOMER_AUTH_GOOGLE_ENABLED=false`, `CUSTOMER_AUTH_EMAIL_OTP_ENABLED=false`, and `CUSTOMER_AUTH_EMERGENCY_STOP=false`.
- Continuation TTL defaults to 600 seconds and is bounded to 60..1800 seconds. Rate-limit configuration remains a server seam and is blank by default. Email key version defaults to `v1`; real secrets remain blank.
- Static verification rejects publishable/secret authority mixing, browser Auth clients, token persistence/logging, browser-supplied CustomerUserId, raw-email merge, manual linking, and activation-default drift.

## Server Auth, refresh, and routes

- `lib/supabase/server.ts` creates a request-scoped `@supabase/ssr` server client from the request/response cookie store. It is never module-scoped and never receives `SUPABASE_SECRET_KEY`.
- `lib/supabase/admin.ts` remains the distinct, non-persistent privileged repository client and never receives the publishable key.
- `proxy.ts` matches only `/account/:path*`, `/api/account/:path*`, and `/api/auth/:path*`. It performs claims refresh/session-cookie propagation and cache safety only: no rewrites, application redirects, or business decisions.
- High-impact binding, checkout, status, result, and logout paths call fresh `getUser()` through the provider seam. The proxy claim check is not treated as authorization.
- Server routes cover continuation creation, Google start/callback, Email OTP request/verify, and logout. Mutating routes require non-GET, exact Origin/Host, CSRF, valid unexpired continuation where applicable, and the rate-limit seam.
- The Google callback is bound to PKCE/code exchange, exact continuation cookie, callback CSRF/state authority, one-use consumption, a server-selected redirect, and callback rate limiting.
- The production Google path remains behind disabled flags. Deterministic fakes prove Google start/callback and verified-email requirements without credentials or a real sign-in.
- Email OTP responses are non-enumerating and do not promise delivery. The UI advises Google-registered Customers to continue with Google without revealing account existence or another address's providers.

## Continuation, ownership, and migration 0014

- Append-only migration: `supabase/migrations/0014_customer_identity_authority_v1.sql`.
- It creates exactly two tables: `production_customer_auth_continuations` and `production_customer_ownership_bindings`.
- Only continuation/CSRF hashes are persisted. Raw values stay in short-lived host-only HttpOnly cookies and are not accepted from a CustomerUserId browser field or logged.
- Continuations are bounded, one-use, preparation-bound, flow-bound, expiry checked, CSRF checked, and row-locked. Consumed continuation state is retained briefly to support safe Purchase Intent resume while replayed identity binding remains idempotent only for the same Customer.
- Binding requires a still purchase-ready preparation, fresh verified Auth identity, verified delivery-email source, encrypted delivery-email snapshot, keyed email index, and an atomic row-lock transition.
- `customer_user_id` references `auth.users.id ON DELETE RESTRICT`. Detachment nulls identity/PII and changes state without deleting required Payment/integrity evidence; Auth-user deletion remains restricted before detachment.
- Runtime `owner_id` columns are untouched and remain lease-owner authority only.
- Purchase Intent gains an exact XOR: authenticated `customer_ownership_binding_id` lane or the unchanged legacy verified-email/trusted-session lane. Mixed ownership is rejected.
- Versioned Payment-evidence and Grant successors preserve JPY 980, one-time Purchase semantics, Stripe-environment binding, attempt ordering, idempotency, reconciliation convergence, and one Payment -> one Grant -> one Assessment. They require an active, non-detached Customer binding for the Auth lane.
- Existing `production_email_verification_challenges`, `production_verified_email_authorities`, `production_trusted_email_sessions`, and `production_preparation_email_bindings` remain intact. There is no email backfill, CustomerUserId inference, or new Auth-lane legacy verification write.

## Account and disclosure boundary

- `/account` exposes only date, generic `鑑定ノート`, processing/completed state, and a result action. It exposes no consultation preview, partner message, draft, assessment excerpt, email, Stripe ID, capability, or result token.
- `/account/results/[deliveryId]` derives CustomerUserId from a fresh server session and uses an ownership-constrained repository function.
- Checkout and private status use the same server-verified CustomerUserId boundary for the Auth lane.
- Existing `/result/[token]` and its bearer capability remain unchanged for legacy/narrow recovery. No unsupported token-expiry claim was added.
- Every privileged Auth-lane disclosure/write uses an explicit binding ownership predicate; RLS is not relied on as service-role isolation.

## Disposable local proof

- A fresh disposable local Supabase/Docker root applied migrations `0002..0014` and a clean `db reset` replayed them successfully. The workspace/index bytes for accepted `0002..0013` remained immutable.
- Real local SQL proof passed continuation expiry, replay rejection, CSRF rejection, same-Customer idempotent replay, different-Customer denial, binding rollback/resume, authenticated Payment-to-Grant, mixed-lane rejection, legacy-lane validity, cross-Customer history/result denial, detached-Customer denial, Auth-user delete restriction/detach behavior, exact ACL/RLS, direct-role denial, and transaction rollback.
- Independent concurrent sessions produced exactly one canonical binding: the first transaction committed and the second failed with generic `CUSTOMER_AUTH_BINDING_CONFLICT`; no second binding persisted.
- Local Supabase Auth plus local Mailpit proved a synthetic Email OTP session, request/response cookie round trip, HttpOnly/Lax/host-only localhost policy, request-scoped fresh `getUser()`, and a separate secret-key repository RPC. No Resend or real Email was used.
- Production cookie policy was statically proven Secure/HttpOnly/Lax/Path=/host-only; exact loopback validation rejects host-suffix tricks and is the only production-mode HTTP/Secure exception used by local smoke.
- Next 16.3 production smoke passed unauthenticated handling, authenticated `/account` empty state, hard navigation, client Link navigation, stable URL, no redirect loop/rewrite, private no-store session response, Next JS static asset HTTP 200, browser console errors/warnings 0, and server errors 0.
- The first diagnostic loopback smoke exposed an over-broad production HTTP/Secure exception. It was narrowed to exact loopback hosts before the final clean proof above.

## Verification and security result

- `verify:rc2`: `48/48` PASS.
- `verify:rc1`: `14/14` PASS.
- `verify:rc2:activation-preflight`: `15/15` PASS.
- `verify:rc2:stepb`: `18/18` PASS.
- `verify:rc2:acl-hardening`: `14/14` PASS.
- `verify:rc2:email-provider`: `14/14` PASS.
- `verify:customer-auth-foundation`: `45/45` PASS.
- TypeScript typecheck PASS; ESLint zero-warning PASS; Next 16.3 production build `38/38` PASS; `git diff --check` PASS.
- `npm audit --omit=dev`: `0 vulnerabilities`; full `npm audit`: `0 vulnerabilities`.
- Three requested read-only Luna audits completed with edit `0`, commit `0`, remote write `0`, and credential retrieval `0`. Their Auth/SSR, schema/ACL/concurrency, and cross-Customer/legacy findings were resolved in the parent implementation.

## Operation counters and non-claims

- Allowed local/tooling operations: one npm install batch, npm registry/audit reads, one disposable local Supabase root, local Auth and synthetic mail capture, local HTTP/browser smoke, and normal Git pushes.
- Prohibited operations remain exactly `0`: remote Supabase migration; remote Supabase Auth configuration; Google Cloud configuration; Google OAuth credentials; real Google sign-in; Resend SMTP/API; real Email; Stripe API; Payment; webhook registration; OpenAI Provider; Netlify deploy; runtime activation; production secrets; DNS; Public Launch; PR; Foundation merge to `release/private-ready`; and main merge.
- Not claimed: Google connected, Email OTP production connected, Auth production active, remote 0014 applied, real Email, Stripe active, `PRIVATE RELEASE READY`, or Public Launch.
- Exact next action: **Human/ChatGPT review Customer Identity Auth Foundation R1**. Do not apply 0014 remotely or configure Google, Resend, or Supabase Auth production settings before that review.
