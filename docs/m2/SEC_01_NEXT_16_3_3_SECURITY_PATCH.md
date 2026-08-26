# SEC-01 Next.js 16.3.3 Security Patch

Status: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`

Captured: `2026-08-26` (Asia/Tokyo)

## Authority and scope

- Exact base authority: `release/private-ready@3bd47e0ed8cf1a28da8ba14525718117df7bc99e`.
- Candidate branch: `task/sec-01-next-16-3-3-r1`.
- `main` remains `61e33a10e195fad17e253a6b9719217e1992f273`.
- Current Published customer source remains `0befd512219eb2897fb1edf969ad37d7e8c56b0d` under Auto Publishing Lock.
- Scope is the exact stable Next.js framework security patch plus the version-matched ESLint configuration, bounded verifier, and operational evidence. No application, UX, Auth, Payment, database, activation, environment, or Netlify configuration change is included.

## Reviewed upstream security authority

The reviewed stable release is [Next.js v16.3.3](https://github.com/vercel/next.js/releases/tag/v16.3.3). The release is marked Latest, uses verified release commit `a9a1cb7`, and identifies the following two Critical advisories. This evidence establishes only the reviewed SEC-01 scope; it is not a claim that every past or future Next.js vulnerability is fixed.

| Advisory | CVE | Exact affected ranges | Exact patched versions | Moon Reply disposition |
| --- | --- | --- | --- | --- |
| [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) | `CVE-2026-75604` | `>= 13.4 < 15.5.24`; `>= 16.0 < 16.3.3` | `15.5.24`; `16.3.3` | Current `16.3.0` is affected; candidate moves to exact `16.3.3`. |
| [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) | `No known CVE` | `>= 10.0.0 < 15.5.24`; `< 16.3.3` | `15.5.24`; `16.3.3` | Current `16.3.0` is affected; candidate moves to exact `16.3.3`. |

Official `v16.3.3` package metadata requires Node `>=20.9.0` and React / React DOM `^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0`. Local preflight used Node `v24.14.0` and npm `11.9.0`. The 16.3.3 release contains security fixes; the reviewed 16.3.1/16.3.2 patch notes do not impose a new 16.3.0-to-16.3.3 migration or breaking-change action.

## Dependency decision

| Package | Base manifest / resolution | Candidate manifest / resolution | Decision |
| --- | --- | --- | --- |
| `next` | `^16.3.0` / `16.3.0` | `16.3.3` / `16.3.3` | Exact runtime pin required by SEC-01. |
| `eslint-config-next` | `^16.3.0` / `16.3.0` | `16.3.3` / `16.3.3` | Exact version-matched stable configuration exists and is aligned. |
| React | `^19.2.7` / `19.2.7` | unchanged | React 19.2.7 satisfies the official Next 16.3.3 peer range. |
| React DOM | `^19.2.7` / `19.2.7` | unchanged | React DOM 19.2.7 satisfies the official Next 16.3.3 peer range. |

No React patch, migration, application compatibility edit, or unrelated dependency upgrade is required.

## Lockfile and supply-chain delta

- `next@16.3.3` resolves from `https://registry.npmjs.org/next/-/next-16.3.3.tgz` with integrity `sha512-tuRTx1nQ/yVw83cwJBo9F+njGUgMn3UHQycreWHB8XsStvvAh1AthbI8/4IpKnFaF58F+iSiHejYOlMQ/eq83g==`.
- `eslint-config-next@16.3.3` resolves from `https://registry.npmjs.org/eslint-config-next/-/eslint-config-next-16.3.3.tgz` with integrity `sha512-teqtsR26tnlfXFHfVLTM/4tzEzU8DMu6GS1sddZzhfGzgd2f2ofbgDUcsk6cssSCzX6Tk6fmWifJcdANSdPJrw==`.
- `@next/env`, `@next/eslint-plugin-next`, and all eight lockfile SWC platform packages move exactly `16.3.0 → 16.3.3`.
- `@swc/helpers` moves `0.5.15 → 0.5.23`, the exact direct dependency required by `next@16.3.3`.
- Added packages: `0`. Removed packages: `0`. Unexpected packages: `0`.
- `sharp` remains exact `0.35.3`; its `@img/sharp-*` / `@img/sharp-libvips-*` graph is unchanged. No explicit `libheif` lock entry existed before or after.
- `npm audit --omit=dev`: `found 0 vulnerabilities`. Full `npm audit`: `found 0 vulnerabilities`. Audit zero is supplementary and is not the SEC-01 acceptance basis.

## Next-sensitive source exposure review

- The repository uses App Router. Its 23 Route Handlers are explicitly `runtime = "nodejs"` and `dynamic = "force-dynamic"`; there is no Edge Route Handler.
- `proxy.ts` covers Account/Auth/Purchase-auth session refresh and cache/CSRF boundaries. `cookies()` is used in request-scoped Auth/Account paths; there is no direct `headers()` call.
- Dynamic Account, Result, and Purchase Return routes retain their existing `redirect()` / `notFound()` behavior. Review fixture routes alone use `generateStaticParams()`.
- Cache Components, `use cache`, PPR, `unstable_cache`, and repository `use server` declarations are absent.
- GHSA-p293-qw3h-jr36 context: Moon Reply exercises App Router without Cache Components, but the advisory's exploit condition also requires a Windows filesystem-hosted server. The actual Netlify Production host OS is not established by source evidence. The affected dependency range is sufficient to require the patch regardless.
- GHSA-2xp9-vwfh-vxw4 context: source contains no `next/image` use, no custom image loader/configuration, and no AVIF format selection; the generated image manifest uses WebP only. No directly exercised AVIF optimization path was found. The affected dependency range is sufficient to require the patch regardless.
- No vulnerability exploit or proof-of-concept code was added.

## Netlify, Async, Edge, and scheduled compatibility

- Root `netlify.toml`, background function source, two scheduled functions, and their packaging authorities are unchanged.
- Root source has no explicit Netlify Node pin. The separate Stripe ingress remains pinned to Node `22`, uses `target=node22`, and retains its existing `npm run build` / `dist/functions` configuration.
- Async Workloads background naming, event allowlist, bounded retry, schedule cadences, exact-true/default-off gates, and disabled-before-client-construction behavior are unchanged.
- The exact pre-patch authority deploy `6a8d642c534c420008a24600` was already successful and UNPUBLISHED at source `3bd47e0...`; its Netlify summary recorded 13 Functions and 1 Edge Function. This is comparison context only, not candidate deployment proof.
- Netlify's current [Next.js support documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) states that the maintained OpenNext adapter supports Next.js 13.5+ App Router, Route Handlers, Middleware, SSG, SSR, Turbopack, and is tested against each stable Next release. Moon Reply does not source-pin an older adapter.
- Candidate source/local proof passes the root Next build, ingress Node 22 build, generated Async/background artifacts, scheduled ZIP import/runtime checks, and Proxy generation. No Netlify settings write or manual deploy is part of SEC-01.

## Build characteristics

| Characteristic | Before (`next@16.3.0`) | Candidate (`next@16.3.3`) |
| --- | --- | --- |
| Production build | PASS, compile `4.5s`, TypeScript `3.2s` | PASS, compile `5.4s`, TypeScript `4.5s` |
| Static generation | `48/48` in `416ms` | `48/48` in `411ms` |
| Route classification | captured static/SSG/dynamic inventory | byte-for-byte same route names and classifications |
| Proxy / Edge classification | `Proxy (Middleware)` | unchanged `Proxy (Middleware)` |
| Warnings / deprecated API messages | `0 / 0` | `0 / 0` |
| Netlify deploy summary | existing source deploy: 13 Functions / 1 Edge Function | no deploy authorized; Async/background/scheduled packaging and Proxy generation PASS |

Timing differences are ordinary local build variance and are not used as a performance claim. Next 16.3 build output did not emit a bundle-size table. No material routing or runtime-generation delta was found.

## Verifier and full regression

Direct current-candidate passes:

| Command / contract | Result |
| --- | --- |
| `npm run verify:sec-01` | PASS `20/20` |
| M2-D2 Support | PASS `28/28` |
| M2-D1 legal current truth | PASS `30/30` |
| M2-C1 prepayment compute | PASS `8/8` |
| Auth Entry | PASS `11/11` |
| Product Intent | PASS `18/18` |
| Purchase Eligibility | PASS `9/9` |
| Clarification | PASS `7/7` |
| RC-1 | PASS `19/19` |
| RC-2 | PASS `50/50` |
| Background Durability | PASS `21/21` |
| Async graph | PASS, modules `107`, edges `363`, `server_only=0` |
| Async router/background artifacts | PASS, importable, `server_only=0`, external events `0` |
| Background runtime assets | PASS, configured `97`, required `81`, missing `0`, `server_only=0` |
| Scheduled artifacts | PASS for both exact cadences; syntax/import/runtime PASS; external calls `0` |
| Ingress typecheck / build | PASS / PASS with existing Node 22 target |
| Root typecheck / zero-warning ESLint / Production build | PASS / PASS / PASS |
| Lock regeneration | PASS; before/after SHA-256 both `cdf9f872693dd179e2ed7588aff0dd5085c80a0c5840cbbb9050a1f07c055782` |
| `npm audit --omit=dev` / full `npm audit` | `0` / `0` vulnerabilities |
| `git diff --check` | PASS |

Historical verifier disposition, preserved without edits:

- F1/F2, B1, I1, I1-R3, A1, M2-0, and skipped-stage verifiers stop on their exact historical task-branch/authority pins when run on the SEC-01 task branch. F1/F2 therefore must not be reported as a fresh `24/24`; it stopped before functional assertions.
- E2 stops on its exact historical base pin. E1 completes 37 assertions before its historical base pin stops the run. E3 completes 37 assertions before its historical protected-file rule detects the later accepted F1 `RequestForm` change. These are authority-lineage stops, not Next runtime failures.
- The Customer Auth foundation completes 31 assertions before detecting later accepted delivery-binding source; the older measurement foundation completes 10 assertions before a later accepted RequestForm ordering no longer matches its historical regex.
- I2 passes its source/runtime assertions until the disposable local-DB check, which could not start because Docker Desktop's Linux engine was unavailable. No remote DB fallback was used.
- I4 stops because its historical migration inventory ends at `0019`, while current accepted authority correctly contains `0020` and `0021`. The verifier was not weakened.
- The optional expand runtime verifier requires a separately configured local M1-4 expand database and stops with `M1_4_EXPAND_LOCAL_CONFIGURATION_REQUIRED`; no remote substitute was used.

The independent SEC-01 verifier proves every application/configuration source surface is unchanged from the accepted `3bd47e0...` authority, including Payment, E1, E2, E3, F1/F2, D2/C1, Netlify runtime source, migrations, and environment/secret surfaces. Together with the current direct functional suites, artifact packaging, typechecks, lint, and the identical route build, there is no framework-caused functional regression. Historical pin stops remain residual test-reporting limitations, not manufactured PASS output.

## Remote and external state

- Remote DB read-only check: exact migrations `0002..0021`; pending `0`; unknown `0`.
- Database writes/migrations: `0`.
- Netlify configuration/deploy/Publish writes: `0`.
- Stripe, Async event, Provider/OpenAI, email, real Auth, Support, telemetry, scheduler activation, C1/B2 activation: `0`.
- External writes: Git task-branch push only.

## Acceptance boundary

- Framework baseline: `Next 16.3.3 candidate`.
- Production patched: not claimed.
- Published runtime patched: not claimed.
- Self Dogfood, B2 activation, External Beta, and Public Launch authorization: not claimed.
- Remaining proof after Human/ChatGPT source acceptance is a separately authorized exact-source Production deploy review and Publish decision. This candidate does not integrate `release/private-ready` and does not deploy.
