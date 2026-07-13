# TASK_M1_I6_REVIEW.md

## Status

Task M1-I6 is implemented and automatically validated under explicit Human authorization. Final device-based visual review, complete keyboard walkthrough, and final Milestone 1 acceptance remain Human work. Milestone 1 is not complete, and Milestone 2 remains unauthorized.

## Base commit

`7a232b8feef446200cde5425cb3a98eb683b4391`

The task started from a clean `main` working tree with `HEAD` and `origin/main` both equal to the base commit.

## Human acceptance of M1-I5 and M1-I5-R1

Human visually reviewed and accepted Task M1-I5 and Task M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`, then explicitly authorized only M1-I6 Responsive, Accessibility and Visual QA Hardening.

## Human fixed-mobile-CTA decision

The fixed-mobile-CTA decision is `rejected for Milestone 1`. The accepted non-fixed request CTAs and their `/request` destinations are preserved. No sticky, fixed-bottom, or floating CTA was added.

## Audit method

- Read all task-authoritative product, positioning, result, AI, legal, M1 planning, state, slice, decision, and prior review records before editing.
- Inventoried all `app/**`, `components/**`, and `fixtures/**` files and classified every finding before applying a patch.
- Audited headings, widths, wrapping, overflow containment, active links, focus indicators, touch-target classes, disabled semantics, public/review terminology, legal current state, and long-form measures in source.
- Calculated contrast ratios for primary CTA, dark CTA, legal current state, current badge, disabled purchase control, secondary copy, footer copy, and review metadata accent.
- Searched source for prohibited runtime and file/feature behavior and inspected diffs for package, Supabase, Safety, fixture, and integration changes.
- Built the production application and used a dedicated bounded production server on port 3010 for raw HTTP and rendered-HTML assertions. No in-app browser was used.
- Recorded automated and Human-pending evidence separately in `M1_FINAL_QA_MATRIX.md`.

## Confirmed defects

1. Major Japanese headings had no shared balanced-wrap and strict line-breaking treatment, while the LP's mobile type floor could produce awkward final-line fragments around 390px.
2. The application had no local Next.js icon route.
3. `/review/**` did not centrally inherit `noindex, nofollow` metadata.
4. Customer-facing subscription and coin/point/ticket rows exposed the internal literal `none`.
5. The public sample presented four status chips and `sample ID` near the top, producing an unnecessarily developer-oriented first impression.
6. The shared comparison block described three result experiences but rendered a fourth review-hub card; its public use also exposed `審査用route` and `固定fixture` wording.
7. LP links to the Web and save examples included review-process wording instead of customer-readable labels.
8. `/review` still said M1-I5 awaited review and M1-I6 was unauthorized after Human had accepted M1-I5/M1-I5-R1 and authorized M1-I6.

## Accepted design preserved

- The deep-navy, ivory-paper, and pale-gold 月の返事 design system remains unchanged.
- The non-fixed CTA design, CTA destinations, vertical LP order, request flow, and review banner remain unchanged.
- The M1-I5-R1 warm legal-navigation current state, visible `現在`, `aria-current="page"`, active hover treatment, and distinct focus ring remain unchanged.
- Web鑑定ノート keeps its nine chapters, controlled `50rem` measure, conclusion near the top, chapter spacing, and accepted fixture text.
- 保存用鑑定書 keeps its separate quick-reference hierarchy, `52rem` measure, readable screen type, and no-file boundary.
- The native disabled purchase control remains disabled, non-focusable, non-transactional, and described in normal reading order.
- Request fields, age choices, acknowledgement behavior, Safety severity/vocabulary, fixtures, price, judgment, legal substance, unresolved Decision states, and publication gates are unchanged.

## Deferred items

- Final 320px, 390px, 768px/tablet, and desktop visual inspection is Human pending.
- A complete keyboard-only walkthrough and device/browser focus observation are Human pending.
- Final visual contrast judgment, including antialiasing and display conditions, is Human pending.
- Operator, provider, publication, professional-review, active-contact, and all Milestone 2 decisions remain outside M1-I6.

## Responsive corrections

Shared heading rules now use safe overflow wrapping and strict Japanese line breaking. Major `h1`/`h2` headings use balanced wrapping. At 640px and below, the LP hero and shared LP/review/final-CTA headings use narrower responsive type ranges and adjusted line height. Existing min-width, grid-collapse, flexible navigation, long-identifier breaking, and viewport padding rules were retained.

Static source and rendered-HTML evidence supports containment, but it is not a substitute for Human device inspection.

## Mobile typography corrections

- LP hero heading: `clamp(2.2rem, 9.8vw, 2.75rem)`, `line-height: 1.42`, and a small negative letter-spacing adjustment below 640px.
- LP section, review-hub, and final-CTA headings: `clamp(1.8rem, 7.6vw, 2.35rem)` and `line-height: 1.55` below 640px.
- `h1` and `h2` use `text-wrap: balance`; `h1`, `h2`, and `h3` use `line-break: strict` and safe overflow wrapping.
- No new brittle `<br>`, nowrap heading, approved-meaning change, or desktop hierarchy reduction was introduced.

## Favicon

Added the original local `app/icon.svg`: a pale-gold crescent on deep navy with a restrained gold boundary. It uses no text dependency, external request, copied mark, package, or third-party asset. The production build generated `/icon.svg`; the root HTML references it as the icon and the route returned HTTP 200 with `image/svg+xml`.

## CTA/contrast corrections

No accepted CTA color needed replacement. Automated contrast calculations were:

- primary CTA `#171226` on `#e7c76e`: `11.11:1`;
- dark CTA/current badge `#fff8e8` on `#2a2440`: `13.93:1`;
- legal current text `#2b2335` on `#f1dfb0`: `11.42:1`;
- disabled purchase text `#514b43` on `#d7d0c3`: `5.62:1`;
- secondary copy `#67596b` on `#fffdf5`: `6.41:1`;
- footer copy `#d8cebd` on `#080b1a`: `12.56:1`; and
- review metadata accent `#d9bb75` on `#18152e`: `9.54:1`.

The disabled control still uses visible text plus native disabled semantics, and current/blocked states still include text rather than relying on color. Final visual contrast remains Human pending.

## Public/review terminology corrections

- LP labels now read `Web鑑定ノートの見本を見る` and `保存用鑑定書の見本を見る`.
- `ReportComparisonNavigation` now has an explicit public/review presentation boundary. Public use contains three customer-readable result links and no `route` or `fixture` wording. Review use retains technical labels and presents the review-hub return link separately.
- The review-only `/review` page now records the current M1-I6 Human Visual QA gate and keeps M1/Milestone terminology within the review boundary.
- Rendered public text on `/`, `/request`, and `/sample-report` contains no `M1-I`, `Task`, `slice`, route inventory, `Decision ID`, `fixture ID`, implementation-status label, or raw `none`.

## Customer-facing localization

The purchase product rows now render `サブスクリプション：なし` and `コイン・ポイント・チケット：なし`. The fixture contract retains the internal literal `none`; no fixture data changed.

## Long-form readability

### Web鑑定ノート

The accepted `50rem` article width, phone padding, `leading-8`/`leading-9` paragraphs, nine-section hierarchy, chapter spacing, early conclusion, and fixed caution remain. Shared heading wrapping improves narrow-screen containment. No report text or fixture meaning changed.

### 保存用鑑定書

The accepted `52rem` surface, readable screen typography, quick-reference cards, two-column-to-single-column response, and separate Web/save hierarchy remain. It is still a rendered review view, not a generated PDF/image/file, and no download, print, copy, or share behavior was added.

### Legal pages

Legal navigation, fixed facts, candidate policy, unresolved status cards, and review metadata remain visually distinct. Existing `minmax(0,1fr)`, `min-w-0`, flexible navigation, and identifier-breaking rules are retained for Tokushoho/refund and narrow viewports. The accepted warm current state was not altered.

## Accessibility

- Every one of the 30 audited route responses rendered exactly one `h1`.
- Native links, controls, summaries, checkbox/radio inputs, disabled semantics, labels, field errors, review boundaries, and heading hierarchy remain semantic.
- The new sample metadata uses a native `<details>/<summary>` disclosure with a minimum 44px summary target.
- The request form's first-error focus and final confirmation focus behavior remain unchanged.
- State meaning remains present in visible text and is not color-only.

## Touch targets

Source audit confirmed primary links/buttons use `min-h-11`, `min-h-12`, or larger; navigation links meet at least 44px; the FAQ and review-detail summaries meet at least 44px; and checkbox/radio labels provide at least 48px clickable rows. The native checkbox/radio controls retain visible focus and label activation.

## Focus behavior

The global 3px pale-gold `:focus-visible` outline remains. Key actions retain explicit focus rings, legal current-page focus remains purple with an ivory offset distinct from the persistent gold current state, and hover does not replace the current indication. No keyboard trap or positive `tabindex` was added. A complete device/browser keyboard walkthrough is Human pending.

## Review-route indexing boundary

`app/review/layout.tsx` now centrally applies `index: false` and `follow: false`, including Googlebot metadata, to `/review/**`. All 19 audited review URLs rendered `noindex, nofollow`. The eight legal/contact routes retained their existing boundary. `/`, `/request`, and `/sample-report` did not gain `noindex`. This metadata does not claim to clear an external search cache.

## Link integrity

All 25 distinct active internal link targets discovered across the 30 rendered route responses returned HTTP 200. Review correction hashes remain backed by the accepted request-form hash handler. Planned/unavailable items remain non-clickable or status-labeled, and review destinations retain their no-transaction banner.

## Fail-closed audit

The five explicit unknown/non-allowlisted routes returned HTTP 200 with failure content and no normal fallback. Assertions confirmed absence of normal request confirmation, normal purchase price/control, the fixed normal Web judgment, save-report content, and generated-file status as applicable. `needs_review`, `rejected`, contradictory selection, invalid age, missing consent, and unknown/error states retain no forward purchase or ordinary-report path.

## Network/integration audit

No fetch, API route, server action, Supabase use, database read/write, OpenAI/AI call, email send, payment/checkout/webhook, analytics, external asset, localStorage, sessionStorage, Cookie persistence, deployment behavior, clipboard, share, print, upload, OCR, or file generation was added. Existing explanatory legal text and dormant pre-M1 library foundations were not wired into M1 routes.

## Files changed

Application:

- `app/globals.css`
- `app/icon.svg`
- `app/page.tsx`
- `app/review/layout.tsx`
- `app/review/page.tsx`
- `components/report/PublicSampleReport.tsx`
- `components/report/ReportComparisonNavigation.tsx`
- `components/review/ReviewPurchaseConfirmation.tsx`

Documentation:

- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_UI_STATE_MATRIX.md`
- `docs/phase1/TASK_M1_I5_REVIEW.md`
- `docs/phase1/TASK_M1_I5_R1_REVIEW.md`
- `docs/phase1/TASK_M1_I6_REVIEW.md`
- `docs/phase1/M1_FINAL_QA_MATRIX.md`

No fixture or `lib` file changed.

## Automated validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run build`: passed; 28 static/SSG pages were generated, including `/icon.svg`.
- HTTP/rendered assertions: 30 documented routes returned HTTP 200 and exactly one `h1` each.
- Active internal links: 25 distinct rendered targets returned HTTP 200.
- Review robots: 19 audited `/review/**` URLs rendered `noindex, nofollow`.
- Legal/contact robots/current state: eight routes retained `noindex, nofollow`, exactly one `aria-current="page"`, and visible `現在`.
- Fail-closed: all five explicit unknown/non-allowlisted routes passed negative-content assertions.
- Rendered checks passed for public terminology, sample truth/metadata placement, localized product rows, disabled purchase control, inactive contact, and icon metadata/route.
- `next-env.d.ts`: unchanged after build.
- No in-app browser was used.

## Human Visual QA still required

`Human Visual QA remains required.`

Human must inspect representative LP, request, sample, Web report, save report, purchase confirmation, legal, contact, blocked, and error routes at 320px, 390px, 768px/tablet, and desktop. Human must also complete the keyboard-only walkthrough and final visual contrast judgment.

## Known limitations

- Static source and rendered-HTML checks do not prove pixel-level wrapping, shadow clipping, or lack of horizontal overflow in every browser/font combination.
- Class inspection and contrast math do not replace device/browser focus and contrast observation.
- `noindex, nofollow` is a page instruction, not proof that an external cache or index has been cleared.
- Contact, legal publication, operator/provider facts, persistence, transaction, AI, email, file delivery, and deployment remain intentionally unavailable.

## Next gate

Human performs final Visual QA and either accepts M1-I6 or requests a bounded correction. Milestone 1 remains Human-review pending until that acceptance. M1-I6 does not authorize Milestone 2 or any later milestone.
