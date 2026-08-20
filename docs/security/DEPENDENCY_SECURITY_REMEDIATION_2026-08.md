# Dependency Security Remediation — 2026-08

Status: `Dependency Security Remediation implemented_pending_human_chatgpt_review`

Dependency blocker: `candidate_resolved_pending_acceptance`

This evidence is sanitized. It records no credential, remote project identifier, Customer data, Provider response, or secret value.

## 1. Authority and boundary

- Accepted Step D release authority: `22d9ec96d0b1cd3136a23aee7670abf7e150b497`.
- Branch: `task/dependency-security-next-16-3`.
- Scope: supported stable dependency remediation plus the minimum verifier/generated-type compatibility needed to prove the accepted repository state.
- Supabase operations, migration apply, Stripe, Payment, webhook, Email, OpenAI Provider, deploy, runtime flags, remote secrets, DNS, Public Launch, PR, and main merge: `0`.
- Migrations `0002..0013`, Production Runtime, V17, and Q0 remain unchanged.

## 2. Before state

- `next`: `16.2.12`.
- Next dependency `postcss`: `8.4.31`.
- Next optional dependency `sharp`: `0.34.5`.
- `npm audit --omit=dev`: `3 high`.
- Findings: PostCSS advisories `GHSA-qx2v-qp2m-jg93`, `GHSA-6g55-p6wh-862q`, `GHSA-fxqj-rqcc-2cmp`, `GHSA-r28c-9q8g-f849`; sharp/libvips advisory `GHSA-f88m-g3jw-g9cj`.

## 3. Upstream target and compatibility audit

The Human-authorized target is exact resolved `next@16.3.0` and `eslint-config-next@16.3.0`. The npm registry authority for `next@16.3.0` declares `postcss 8.5.23` and optional `sharp ^0.35.3`. The registry `latest` tag had already advanced to `16.3.1` during execution; the install therefore named `16.3.0` explicitly and the lock records exact `16.3.0`.

Primary references:

- Next.js 16.3 release: <https://nextjs.org/blog/next-16-3>
- ImageResponse/image-optimizer regression: <https://github.com/vercel/next.js/issues/96612>
- standalone plus build-adapter regression: <https://github.com/vercel/next.js/issues/96657>
- TypeScript 7 detection issue: <https://github.com/vercel/next.js/issues/95490>
- middleware redirect/rewrite issue: <https://github.com/vercel/next.js/issues/95195>
- Cache Components/custom bot-cache issue: <https://github.com/vercel/next.js/issues/96593>

Actual Moon Reply usage audit:

| Area | Actual usage | Disposition |
| --- | --- | --- |
| `ImageResponse` | none | NOT_APPLICABLE |
| `next/image` or custom image optimization | none | NOT_APPLICABLE |
| custom `images`/loader configuration | none | NOT_APPLICABLE |
| Server Actions | none | NOT_APPLICABLE |
| middleware/proxy | none | NOT_APPLICABLE |
| custom Next server | none; package start remains `next start` | NOT_APPLICABLE |
| rewrites/redirects | none in `next.config.ts` | NOT_APPLICABLE |
| `output: standalone` or build adapter | none | NOT_APPLICABLE |
| Cache Components/`use cache` | none | NOT_APPLICABLE |
| custom `htmlLimitedBots` | none | NOT_APPLICABLE |
| CSP nonce handling | none | NOT_APPLICABLE |
| TypeScript 7 | none; resolved TypeScript remains `6.0.3` | NOT_APPLICABLE |

No known reviewed 16.3.0 regression intersects an implemented Moon Reply feature. Production build and route/render smoke provide repository-specific confirmation.

## 4. Install and resolved tree

Normal supported flows only:

1. `npm install next@16.3.0 eslint-config-next@16.3.0 --save`.
2. `npm audit fix --dry-run` to inspect a non-force dev-only transitive repair.
3. One normal `npm audit fix`; no `--force`, override, resolution, canary, pre-release, or manual `node_modules` edit.

Direct manifest changes:

- `next`: `^16.2.12` -> `^16.3.0`.
- `eslint-config-next`: `^16.2.12` -> `^16.3.0`.
- React and React DOM remain `^19.2.7`.
- TypeScript remains `^6.0.3`.

Exact resolved tree:

- `next`: `16.3.0`.
- `eslint-config-next`: `16.3.0`.
- `postcss`: one deduplicated `8.5.23` for Next and Tailwind; no vulnerable nested PostCSS remains.
- `sharp`: `0.35.3` on the Next path.
- dev-only safe transitive repair: `brace-expansion 1.1.18` and `5.0.9`; `js-yaml 4.3.1`.

Next 16.3 generated one tracked type-reference delta in `next-env.d.ts`: `./.next/types/root-params.d.ts`. No handwritten application type or behavior changed.

## 5. Security gates

- Before production audit: `3 high`.
- After Next upgrade production audit: `found 0 vulnerabilities`.
- Intermediate full audit after only the Next upgrade: `2 high`, both dev-only (`brace-expansion`, `js-yaml`).
- Final `npm audit --omit=dev`: `found 0 vulnerabilities`.
- Final full `npm audit`: `found 0 vulnerabilities`.

No advisory was waived or suppressed.

## 6. Regression and verifier integrity

- `verify:rc2`: PASS `48/48`.
- `verify:rc1`: PASS `14/14`.
- `verify:rc2:activation-preflight`: PASS `15/15`.
- `verify:rc2:stepb`: PASS `18/18`.
- `verify:rc2:acl-hardening`: PASS `14/14`.
- typecheck: PASS.
- lint with zero warnings: PASS.
- Next 16.3.0 production build: PASS; generated static pages remain `38/38` and route inventory is unchanged.
- Git diff checks: PASS.

The activation preflight initially exposed a pre-existing structural defect: its tracked migration list ended at `0012`, although accepted Step D had already committed `0013`. The verifier was minimally corrected to require exact `0002..0013` and to pin accepted `0012`/`0013` blobs. It now passes without weakening any activation boundary.

## 7. Production route/render smoke

One local `next start` instance bound to `127.0.0.1` only and was stopped after proof.

HTTP results:

| Route | Expected/actual |
| --- | --- |
| `/` | `200` |
| `/request` | `200` |
| `/review` | `200` |
| `/legal` and all six linked legal detail pages | `200` |
| `/contact` | `200` |
| `/result/not-a-token` | `404` fail-closed before database access |

- Root-referenced static assets: `9/9` returned `200`.
- Browser-rendered representative pages: root, request, review, legal, contact, invalid result.
- Non-empty DOM and expected headings: PASS.
- Browser application/hydration error indicator: `0`.
- Browser console warning/error: `0`.
- Production server exception/warning requiring action: `0`.
- OpenAI, Stripe, Email, Supabase, or Customer-data call during smoke: `0`.
- Local listener after stop: `0`.

## 8. Activation ceiling

Dependency security is only `candidate_resolved_pending_acceptance`. PRIVATE RELEASE READY, Production Payment, Stripe, webhook, Email, OpenAI paid flow, runtime activation, monitoring/rehearsal, deploy, DNS, and Public Launch remain inactive or incomplete.

Exact next action: Human/ChatGPT review Dependency Security Remediation.
