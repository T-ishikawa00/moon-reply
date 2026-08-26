# M2-0 Next.js Security Baseline

Status: `source_candidate_pending_human_chatgpt_review`

Captured: `2026-08-23`; SEC-01 candidate overlay: `2026-08-26`

No dependency, lockfile, Netlify configuration, deploy, or external state was changed by M2-0.

Current SEC-01 overlay: exact stable `next@16.3.3` and `eslint-config-next@16.3.3` are prepared on `task/sec-01-next-16-3-3-r1` as `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`. React/React DOM remain `19.2.7`; Production patched, release integration, deploy, and Publish are not claimed. Canonical evidence is `docs/m2/SEC_01_NEXT_16_3_3_SECURITY_PATCH.md`.

## Exact pre-patch dependency/runtime baseline

| Surface | Exact resolved version / state |
| --- | --- |
| Next.js | `16.3.0` (`package.json` currently declares `^16.3.0`) |
| React | `19.2.7` |
| React DOM | `19.2.7` |
| `@netlify/async-workloads` | `0.0.92` |
| `@netlify/zip-it-and-ship-it` | `15.4.0` |
| `@supabase/ssr` | `0.12.4` |
| `@supabase/supabase-js` | `2.112.3` |
| Netlify Node runtime | No exact Node runtime version is pinned in repository source |
| Background runtime asset | `netlify/functions/production-fulfillment-background.mts` with the required `-background` suffix |
| Netlify source asset/config | `netlify.toml` and `scripts/verify-m1-4-background-runtime-assets.mjs` are protected authority assets |

At the M2-0 capture on 2026-08-23, the official Next.js blog had announced a scheduled security release and the exact fixed version was still unknown: <https://nextjs.org/blog/upcoming-nextjs-security-release-august-2026>. The later SEC-01 task independently reviewed the published stable `16.3.3` release and its two Critical advisories; the pre-publication instruction not to guess remains preserved as historical control evidence.

## Authority attack surface

- App Router under `app/`; server mutation is implemented with Route Handlers, not repository `use server` declarations/Server Actions.
- Node/force-dynamic Route Handlers include Customer Auth, payment Checkout/status, Stripe webhook, assessment, account result, and delivery paths.
- Root `proxy.ts` delegates to `lib/supabase/proxy.ts` for Account/Auth/Purchase-auth session refresh, PKCE/getClaims, CSRF cookie issuance, and cache boundary handling.
- `lib/supabase/server.ts` is the request-scoped publishable-key server client; `lib/supabase/admin.ts` is the separate server-only service-role client.
- Netlify Async Workloads route to the background fulfillment artifact. Packaging/runtime-asset verification is a security and availability boundary and may not be weakened during the framework patch.

## Patch-publication checklist

1. Confirm the official stable patched Next 16.3 version and its advisory; reject canary, preview, prerelease, or inferred version numbers.
2. Start a separate task from the exact accepted authority. Record clean tree, stash count, local/tracking/direct-remote refs, and protected-file hashes.
3. Change `next` and `eslint-config-next` to the exact reviewed patched version in both manifest and lockfile. Do not change React, React DOM, Supabase, Netlify, or unrelated packages unless the official advisory proves it is required and Human expands scope.
4. Run `npm audit --omit=dev` and full `npm audit`; classify every residual advisory without waiver or force update.
5. Run typecheck, zero-warning lint, production build, route inventory, all M1-4 runtime/async verifiers, RC-1, RC-2, Auth, Measurement, and the M2-0 verifier.
6. Exercise local-only App Router Route Handlers, Proxy/Auth refresh and cookie propagation, checkout/webhook parsing without Stripe writes, Account/Result cache headers, and Async Workloads packaging.
7. Verify no Server Action surface appeared, no route runtime changed unexpectedly, and no proxy/auth/CSRF/session semantics changed.
8. Diff-protect `netlify.toml`, background runtime source/artifacts, `scripts/verify-m1-4-background-runtime-assets.mjs`, Supabase migrations, React versions, and unrelated lock entries.
9. Use disposable local smoke data only. Do not call Stripe, OpenAI, Resend, remote Supabase writes, Async events, deploy, or publish.
10. Obtain Human/ChatGPT technical acceptance before any later deploy; a passing audit alone is not deploy authority.

## Exact pin policy

- The patch task must replace the current caret declaration with an exact stable version for both `next` and `eslint-config-next`.
- The lockfile must resolve the same exact version and integrity metadata.
- No `latest`, caret, tilde, override, forced update, canary, preview, RC, or prerelease is acceptable.
- React/React DOM stay at `19.2.7` unless the official advisory explicitly requires a React patch; that would require an expanded manifest and separate compatibility evidence.

## Rollback

- Roll back the application commit and lockfile to the exact prior accepted authority; do not force-push and do not roll back database migrations.
- Restore the prior deploy artifact/config only after explicit Human deploy authority.
- If the security advisory makes rollback to 16.3.0 unsafe, stop new checkout/paid operations and forward-fix. Do not silently restore a known-vulnerable Production version.
