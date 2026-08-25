# M2-E3 — Account / My Reports / Authenticated Result Recovery

Status: `SOURCE CANDIDATE — PENDING HUMAN/CHATGPT REVIEW`

- ACC-01: `ACCOUNT / MY REPORTS SOURCE CANDIDATE`
- RES-01: `AUTHENTICATED RESULT RECOVERY SOURCE CANDIDATE`
- ERR-01: `ACCOUNT/RESULT SLICE FURTHER ADDRESSED — NOT CLOSED`
- Source base: `release/private-ready@ba9fa78b69da62f9abd24b54fe2a3c850001d785`
- Task branch: `task/m2-e3-account-my-reports-result-r1`
- `main`: `61e33a10e195fad17e253a6b9719217e1992f273` (unchanged)
- Published customer source: `0befd512219eb2897fb1edf969ad37d7e8c56b0d` (unchanged)

This is source/local evidence, not Production deployment, Human visual acceptance, External Beta, or Public Launch authority.

## 1. Pre-E3 gap

Before E3, `/account` represented Auth disabled, signed-out, and any privileged history-read failure with the same nullable value. A signed-in Customer could therefore be told to log in again after an RPC/config/decode failure. Cards showed only a server-local calendar date, so same-day reports were indistinguishable. The authenticated result route caught every resolution failure and returned 404, including Auth infrastructure, DB, and canonical-projection validation failures.

## 2. Existing authority and data contract

Account list authority remains:

`fresh Supabase getUser()` → exact server-owned `CustomerUserId` → `resolve_customer_account_history_v1`

The existing RPC returns only `purchaseIntentId`, nullable `deliveryId`, `created_at`, and `processing | completed`. Its `created_at` is the Purchase Intent creation timestamp. Customer copy therefore uses the neutral label `日付・時刻`, not an invented “購入日時” or “依頼日時”. SQL already orders newest first; source also sorts validated timestamps descending and uses a non-visible purchase UUID only to make equal timestamps deterministic.

Result authority remains:

`fresh Supabase getUser()` → exact server-owned `CustomerUserId` + untrusted `deliveryId` selector → `resolve_customer_account_result_v1` → verified canonical projection

No CustomerUserId is accepted from URL, form, client state, or E3 cookie. Unknown and not-owned deliveries both resolve to the same not-found state.

## 3. No-migration decision

E3 migration count is `0`. The existing safe four-field history projection is sufficient for customer presentation. E3 adds no DB object, client identity, per-card result read, or result projection preview.

Remote DB remains read-only and exact `0002..0021`, pending `0`, unknown `0`. Accepted 0021 SHA-256 remains `49dd851643dc85716dc8ca0fb712e2d51bc37e8d04116fd0ae24555b7d27bc9a`; 0020 is unchanged.

## 4. Strict history boundary

`decodeCustomerAccountHistoryRow` requires:

- valid Purchase Intent UUID;
- delivery UUID or `null`;
- a real ISO timestamp with an explicit offset;
- exact state `processing` or `completed`;
- `processing` with no delivery and `completed` with a usable delivery.

Unknown state, invalid selector, invalid timestamp, and inconsistent state/delivery combinations fail as Account-data errors. They are not coerced and are not mislabeled signed-out.

## 5. Privacy-safe card contract

Each card contains only:

- title: `<JST month/day hour:minute>の鑑定ノート`;
- explicit `日付・時刻` with `（日本時間）`;
- visible state label;
- state-derived summary;
- allowed result and feature-gated Support actions.

The Account list never imports or renders consultation text, message/draft content, email, Customer UUID, result body, projection excerpt, or provider data. Purchase and delivery UUIDs remain non-secret selectors only in keyed/server-owned actions and are never visible labels, tooltips, aria labels, logs, or previews.

## 6. Japan-time and same-day distinction

All customer timestamps use explicit IANA zone `Asia/Tokyo`; server/Netlify local timezone is irrelevant. Seconds are omitted. Synthetic proof locks `2026-08-24T18:05:00Z` to `8月25日 03:05`, proving UTC-to-JST date rollover. Two same-day samples render visibly distinct `8月25日 10:05` and `8月25日 18:42` titles without customer content.

## 7. State, loading, empty, and error semantics

Account server resolution is explicit:

| State | Customer disposition |
| --- | --- |
| Auth unavailable | `現在、ログイン状態を確認できません` + fixed Account retry |
| Signed out | `ログインが必要です` + fixed `/login` action |
| History load failed | `鑑定ノートの一覧を読み込めませんでした` + fixed Account retry; never “log in again” |
| Empty | `まだ鑑定ノートはありません` + fixed `/request` action |
| History | privacy-safe cards from one owned-history read |

`app/account/loading.tsx` says only `鑑定ノートを確認しています。`; it fabricates no titles or customer data.

Status mapping is:

- `processing` → `処理中` / `鑑定ノートを準備しています。` / no result CTA;
- `completed` with validated delivery → `完了` / `鑑定ノートを確認できます。` / canonical CTA.

The existing SQL and strict decoder establish that `completed` without delivery is invalid, so E3 cannot display a false completed card with no result.

## 8. Canonical authenticated result and recovery split

`/account/results/[deliveryId]` is the preferred authenticated revisit lane. Completed Account cards link only to it. The result page resolves a fresh session first, then uses the existing owned-result application/repository and verified canonical projection. It adds only generic metadata and fixed navigation back to `私の鑑定ノート`; `CustomerAssessmentNote` content is unchanged.

Error semantics are locked:

| Condition | Disposition |
| --- | --- |
| Signed out / identity race | fixed `/login` recovery, no client destination |
| Auth disabled/infrastructure unavailable | scoped recoverable error, not 404 |
| Invalid, unknown, or cross-Customer delivery | privacy-safe not-found; ownership/existence is not disclosed |
| DB/canonical projection/unexpected runtime failure | propagated to scoped error boundary, not converted to 404 |

The scoped not-found and error pages show no selector, Customer ID, safe code, raw error, DB/RPC detail, provider state, or result content. Result metadata is the generic `鑑定ノート | 月の返事` with `noindex`, `nofollow`, `noarchive`, and `no-referrer`.

## 9. Legacy and adjacent-authority boundaries

- Legacy `/result/[token]` remains byte-unchanged as a bounded compatibility/recovery lane. New Account UI never promotes it.
- D2 `この購入について問い合わせる` remains controlled by the existing Support flag and exact purchase selector; Support schema/activation is unchanged.
- E2 standalone Login/session/account OAuth/OTP/logout routes, fixed redirects, attempt cookie, rate fences, and navigation files remain byte-unchanged.
- E1 `auth_latency`, T0–T4, trace/cookie, provider-roundtrip semantics, disabled adapter, and Measurement default remain byte-unchanged.
- Payment, fulfillment, Provider, email, Async, scheduler, Support/C1 activation, and Next.js 16.3.0 are unchanged.

## 10. Accessibility and viewport evidence

Cards use ordered-list items containing semantic `article` and `h2` structure, a real `time` element, and textual status. Result/Support actions wrap independently, expose at least 44px target height, retain visible keyboard focus, and use `overflow-wrap`/`min-width: 0` to contain localized text. Mobile layout stacks actions and status without color-only meaning.

The static synthetic `/review/account` fixture renders the same card CSS at fixed 320px, 390px, and 1280px frames. Local Production-build browser measurement established, for all three frames: two cards, both visible time-distinct headings, textual `完了` and `処理中`, result/Support actions, and horizontal overflow `0`. Action heights were at least 45px; the long Support action wrapped to 68px at 320px rather than colliding. The containing 1280px browser page had one H1 and horizontal overflow `0`. Human visual acceptance remains separate.

## 11. Verification and external boundary

The E3 verifier covers strict projection decoding, JST rollover, same-day distinction, deterministic sorting, all Account states, one-read/no-N+1 behavior, privacy vocabulary, canonical CTA, result failure split, scoped recovery copy, ownership source, legacy compatibility, E2/E1 byte freeze, loading/accessibility source, and zero migration/dependency/Next change.

Final source/local regression:

- E3 `40/40`, D2 `28/28`, D1 `30/30`, C1 `8/8`, Auth Entry `11/11`;
- Product Intent `18/18`, Purchase Eligibility `9/9`, Clarification `7/7`, B1 descendant `15/15`;
- RC-1 `19/19`, RC-2 `50/50`, Background Durability `21/21`, Async artifacts, Scheduled artifacts, runtime-assets, and I1 descendant `15/15` PASS;
- root and ingress typecheck, ingress build, zero-warning ESLint, Production build `39/39`, and `git diff --check` PASS;
- E1 completed every current source/semantic check before its unchanged historical literal `release/private-ready@9571b28...` pin; E2 stops at its unchanged historical literal `release/private-ready@b0bf810...` pin; Customer Auth completes the Account minimal-field checks before its older accepted-file lineage assertion. These verifiers were not weakened. E3 independently proves E1 measurement files and E2 standalone Auth/navigation files byte-unchanged from the current E3 base.

External writes in E3 are Git task-branch commit/push only. Remote DB write, migration, deploy, Production Publish, real Auth, Payment/Stripe, Provider/OpenAI, Support activation, telemetry activation, email, Async event, and scheduler action are `0` and prohibited.

## 12. Remaining work

- Human/ChatGPT independent SOURCE review and any requested correction;
- later authority integration/deploy and real authenticated revisit proof;
- F2 broader post-payment/recovery state vocabulary;
- ERR-01 remaining cross-flow failure vocabulary;
- E1 evidence-led Auth optimization only after Production measurement authority.

E3 does not start F1/F2 and does not declare Production, External Beta, or Public Launch readiness.
