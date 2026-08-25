# M2-E2 — Auth / Navigation / Recovery

Status: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`

- IA-01: `AUTH/NAV SOURCE CANDIDATE`
- NAV-01: `SOURCE CANDIDATE`
- AUTH-01: `MEASUREMENT SOURCE READY / JOURNEY UX SOURCE CANDIDATE / OPTIMIZATION NOT STARTED`
- ERR-01: `PARTIALLY ADDRESSED / NOT CLOSED`

## Authority and boundary

- Source base: `release/private-ready@b0bf81038a42178f032e0edb0572463e415dc086`
- Task: `task/m2-e2-auth-navigation-recovery-r1`
- `main`: `61e33a10e195fad17e253a6b9719217e1992f273` (unchanged)
- Published customer source: `0befd512219eb2897fb1edf969ad37d7e8c56b0d` (unchanged)
- Remote DB: exact `0002..0021`, pending `0`, unknown `0`
- Migration: `0`
- Production deploy, real Google login, real Email OTP, external telemetry, provider configuration, and Production Publish: `0`
- External writes: Git only

E2 changes source only. It does not integrate release authority, deploy, configure Auth, collect E1 telemetry, optimize Auth, activate Support/C1, or begin E3.

## Pre-E2 source inventory and gap

Before E2, the only Google and Email OTP Customer Auth lane was purchase-scoped:

`/request` → `/api/auth/continuations` → Google or Email OTP → purchase continuation validation → fresh identity → preparation ownership bind → `/purchase/auth/continue`.

That lane correctly required a preparation capability, continuation cookie, callback CSRF, and ownership binding. It could not serve as a standalone Account login without weakening or misrepresenting its contract. The global `SiteHeader` had no identity entry, and signed-out `/account` told the Customer to return to the purchase request flow.

The current shared shell is `app/layout.tsx` → static `SiteHeader`. Account history and result routes already use fresh identity plus repository ownership joins. Purchase and result authority are not changed by E2.

## Customer IA contract

Signed out:

- `ログイン` → `/login`
- `鑑定ノートを依頼する` → `/request`

Signed in only after a positive fresh session probe:

- `私の鑑定ノート` → `/account`
- `鑑定ノートを依頼する` → `/request`

The Header never displays email, provider identity, Customer UUID, avatar, token age, or internal Auth terminology. Informational Home anchors remain secondary on wide screens and are removed from the narrow primary-action row.

## Standalone Account Auth topology

Standalone Account Auth is isolated under `/api/auth/account/**`:

### Google

`/login` → same-origin strict `POST /api/auth/account/google/start` → server-owned account-login attempt → rate limit → publishable Supabase Auth `signInWithOAuth()` → validated Supabase authorization URL → fixed `/api/auth/account/callback` → current attempt proof → exact `code`-only callback query → `exchangeCodeForSession()` → fresh verified Google identity → session CSRF → fixed `303 /account`.

Failure goes only to the code-owned `303 /login?status=google_failed`. The start request accepts an empty object only. Neither route accepts `next`, `returnTo`, `redirect`, `callbackUrl`, or another destination.

### Email OTP

`/login` → method choice → email-only strict POST → current account-login attempt → rate limit → Supabase OTP request → OTP-only UI step → email+OTP strict POST → same attempt proof → rate limit → Supabase verify → fresh verified identity → session CSRF → client fixed navigation to `/account`.

Email and OTP exist only in transient React state and POST bodies. They do not enter URL/query/hash, browser storage, logs, response payloads, or navigation state. Password and magic-link handling are not added.

## Least privilege

`createCustomerAccountAuthApplication()` uses only:

- `createCustomerAuthServerClient()`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- fresh Supabase Auth `getUser()`

It does not instantiate `SupabaseCustomerIdentityRepositoryV1`, read `SUPABASE_SECRET_KEY`, call application RPCs, or access preparation, ownership, Purchase, Payment, fulfillment, delivery, or Support data. Standalone login establishes the Supabase session and session CSRF only.

## Ephemeral attempt and CSRF model

The separate `moon_reply_account_login_attempt` cookie is:

- cryptographically random and unrelated to identity
- one browser attempt only
- maximum lifetime `600` seconds
- HttpOnly
- Secure in Production
- SameSite=Lax
- path `/api/auth/account`
- not stored in DB or browser storage
- not placed in URL/query/hash
- cleared after terminal Google callback and successful Email OTP verification

Its value contains only a random opaque secret and issuance time. It proves the browser initiated the Account lane and supplies a server-owned rate-limit correlation key. It cannot authorize Account data, purchase, ownership, Payment, fulfillment, or Support. Same-origin enforcement protects start/email mutations; Supabase PKCE protects the provider exchange; fresh `getUser()` remains the identity authority; session CSRF remains required for logout and authenticated mutations.

## Purchase Auth isolation

The accepted Purchase routes remain byte-identical to the E2 base:

- `/api/auth/continuations`
- `/api/auth/google/start`
- `/api/auth/callback`
- `/api/auth/email-otp/request`
- `/api/auth/email-otp/verify`
- `/purchase/auth/continue`

Purchase Google still defaults to fixed `/api/auth/callback`, requires purchase continuation and callback CSRF, performs fresh verified identity normalization, binds the exact preparation owner, issues session CSRF, and redirects only to `/purchase/auth/continue`. Purchase Email OTP still requires its continuation/CSRF and bind.

Account routes never read purchase continuation/callback-CSRF cookies. Purchase routes never read the Account attempt. A valid standalone session alone cannot satisfy Purchase continuation or ownership authority.

## Fresh session probe and static rendering

`GET /api/account/session` calls fresh Supabase `getUser()` through the publishable Account Auth application. It returns only:

```json
{
  "data": {
    "state": "signed_in | signed_out | unavailable",
    "methods": {
      "google": true,
      "emailOtp": true
    }
  }
}
```

Method booleans disclose only configured customer availability. No PII, UUID, provider identity, token, expiry, or Account body is returned. Infrastructure/configuration uncertainty is `unavailable`, not a false `signed_out` assertion.

All responses are private, no-store, no-cache, `Vary: Cookie`, noindex/noarchive, and no-referrer. `app/layout.tsx` and the `SiteHeader` server shell perform no cookies/headers/network Auth lookup. A small client component probes once per normal route state and on a PII-free in-browser Auth-state event. It has no polling and no browser persistence. The safe initial/failure presentation is `ログイン`; only exact `signed_in` becomes `私の鑑定ノート`.

Header state is presentation only. Account/result routes keep their independent fresh identity and ownership authority.

## Login, Account, logout, and recovery copy

`/login` has one H1, noindex/nofollow/noarchive, no-referrer, customer-safe method-first Google/Email controls, a truthful unavailable state, and an already-authenticated path to `/account` after the fresh session probe.

`/account` now uses H1 `私の鑑定ノート`. Signed-out Customers receive `ログインが必要です` and `ログインする` → `/login`, while `新しく鑑定ノートを依頼する` remains available. E2 does not change history cards, result projection, ownership isolation, or D2 Support selection; those richer Account concerns remain E3.

Logout retains same-origin validation, session CSRF, fresh identity, and `scope: "local"`. It now uses the least-privilege Account Auth application, clears the session CSRF on success, emits only the PII-free browser refresh event, and goes to fixed `/login`. Failure leaves the Customer on the current page with one retry action.

Customer-visible failures use bounded copy for unavailable Auth, Google start/callback failure, OTP send/verify failure, signed-out Account, already-authenticated Login, and logout failure. No Supabase error, OAuth code, PKCE detail, continuation state, rate-limit key, UUID, or raw internal safe code is displayed.

## Redirect, cache, and privacy proof

- Callback destinations are a code-owned two-value type: `/account` or `/login?status=google_failed`.
- Account start accepts `{}` only; callback accepts `code` only; Email routes accept exact allowlisted bodies.
- No request-supplied destination exists.
- No Auth/session response is publicly cacheable; authenticated Account remains force-dynamic and proxy responses remain private/no-store.
- No session state is embedded in static shared HTML.
- No session, OAuth code, OTP, email, Customer UUID, profile, preparation/purchase ID, or full URL is logged.
- The Account attempt is not a bearer credential for Account data.
- Cross-customer Account/result repository authority is unchanged.

## E1 measurement boundary

Accepted E1 files, `auth_latency` schema, T0–T4 definitions, phase enum, `mral_` trace, 600-second measurement anchor, `provider_roundtrip` outcome semantics, and default-off adapter remain unchanged. Detailed E1 latency instrumentation stays scoped to the existing Purchase Google lane. E2 does not add a flow field or mix standalone Account login into that dataset.

Standalone Account routes emit neither `auth_start`/`auth_complete` nor detailed `auth_latency`: the accepted schemas have no safe flow discriminator, so E2 does not mix a second journey into the Purchase dataset. Existing Purchase measurement producers remain byte-identical. `MEASUREMENT_ENABLED=false` remains source default, the external adapter remains absent, Production samples remain `0`, and no root cause or optimization is claimed.

## Viewport and accessibility contract

Source/CSS smoke covers narrow mobile, typical mobile, and desktop:

- Header identity action and Request CTA remain a two-column primary row at `<=640px`.
- Secondary sample/anchor links leave the narrow row.
- identity/CTA minimum height is `2.75rem`; login controls are `3rem`.
- Login controls become full width below `480px`.
- navigation has an accessible label; form labels are explicit; keyboard focus uses the existing global focus ring.
- no duplicate identity action, forced fixed width, or horizontal overflow authority is introduced.

Human visual review and any Production viewport proof remain separate from source acceptance.

## Verification disposition

The dedicated E2 verifier covers the 25 required contract families plus route-level adversarial cases: fixed redirects, invalid origin/body, missing/expired attempt, email verification without attempt, fresh session states, Purchase-lane byte identity, privacy scans, static-shell proof, and migration/dependency non-change.

Current source/local results:

- E2 dedicated verifier: `32/32 PASS`.
- D2 `28/28`, D1 `30/30`, C1 `8/8`, Auth Entry `11/11`, Product Intent `18/18`, Purchase Eligibility `9/9`, Clarification `7/7`, B1 descendant `15/15`, RC-1 `19/19`, RC-2 `50/50`, Background Durability `21/21`, Async graph/artifacts, Scheduled artifacts, runtime-assets, I1 descendant `15/15`, root/ingress typecheck, ingress build, zero-warning ESLint, and Production build: PASS.
- Production build generated `38/38`; `/` and `/login` remain static, while only Account/session/Auth surfaces are dynamic as intended.
- I1 initially observed a local artifact race because its read and the independent ingress build ran concurrently; the ingress build completed and the required ordered I1 descendant rerun passed `15/15`. This was local verification ordering, not product or authority failure.
- Actual local viewport smoke with Auth forced disabled made no external Auth call: browser client widths `305` (320 override), `375` (390 override), and `1265` (1280 override) all had horizontal overflow `0`. Mobile exposed only `ログイン` and `鑑定ノートを依頼する`, both `44px` high; desktop exposed secondary links plus both primary actions without overlap. `/login` had exactly one H1 and truthful unavailable copy.
- Remote migration history was freshly listed read-only as exact `0002..0021`, pending `0`, unknown `0`. Git-blob SHA-256 remains exact: 0021 `49dd851643dc85716dc8ca0fb712e2d51bc37e8d04116fd0ae24555b7d27bc9a`; 0020 `3e2683bf65a783047c1cec1b86b9663d4b315bcc1a8ebc080c8bc9bfcb7b9e75`.

Historical literal lineage verifiers are not modified. Any accepted historical pin stop is reported separately; it is not converted into a false PASS. The branch-independent remote/ingress catalog recheck remains read-only and may retain the known saved-pooler credential limitation.

Observed historical stops remain exact: E1 passes its 37 current functional/privacy assertions and then expects its pre-integration release pointer `9571b28...`; Customer Auth Foundation passes 31 current functional/security assertions and then stops at its accepted historical file snapshot; I4 passes six current scheduler-safety assertions and then expects migrations only through 0019. No verifier was weakened. The standalone branch-independent ingress source verifier passed `15/15`; the direct remote catalog SQL could not be rerun because no working direct pooler credential is available to this E2 process. The linked migration inventory still succeeded read-only. E2 changes no DB, ingress, migration, or privilege authority, so this external catalog-access limitation does not alter the E2 source verdict.

## Remaining scope

- E3 still owns privacy-safe same-day report differentiation, card hierarchy, preview, richer status, and result-list UX.
- AUTH-01 optimization has not started; no Production E1 data exists.
- ERR-01 remains broader than Auth and is not closed by E2.
- Production Auth configuration, real Google/OTP execution, deployment, telemetry, and Human viewport review require separate authority.
- Real standalone Google activation must separately confirm that the exact code-owned `/api/auth/account/callback` is accepted by the existing Supabase/Google redirect configuration; E2 performs no dashboard/configuration write.
