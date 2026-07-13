# TASK_M1_I5_REVIEW.md

## Status

Human visually reviewed Task M1-I5 and accepted its overall page structure and direction at commit `6d8001c5c6068a9493e68791f0468e5b5766f038`. Human identified one legal-navigation active-state defect and authorized only Task M1-I5-R1 to correct it. The correction is implemented and automatically validated; final Human acceptance remains required. M1-I6 and all later milestones remain unauthorized.

## Base commit

`620792e61b002190aff100fd145e986b5ae4c89b`

The task started from a clean `main` working tree with `HEAD` and `origin/main` both equal to the base commit.

## Human acceptance of M1-I4

Human visually reviewed and accepted Task M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b`, then explicitly authorized Task M1-I5 only.

## Human review of M1-I5 and authorized correction

Human accepted the overall M1-I5 page structure and direction at commit `6d8001c5c6068a9493e68791f0468e5b5766f038` but found that the current item in shared legal navigation looked blacked out, disabled, visually heavy, and difficult to read.

Task M1-I5-R1 changes only that shared active state:

- the current card uses a warm pale-gold background, dark readable text, a stronger gold border, and a subtle inset-left gold accent;
- `現在` is a compact dark navy/purple badge with warm-white text;
- `aria-current="page"`, visible `現在` text, keyboard focus, touch target size, and narrow-screen wrapping are preserved; and
- legal substance, routes, Decision IDs and statuses, publication-gate state, request/Safety behavior, purchase confirmation, reports, and fixed product facts are unchanged.

M1-I5 still requires final Human acceptance after this correction. M1-I6 remains unauthorized. The correction record is `docs/phase1/TASK_M1_I5_R1_REVIEW.md`.

## Human incomplete-field presentation decision

Human approved structured status presentation for unresolved legal, operator, provider, commercial, privacy, date, and professional-review fields.

- No fake value, raw placeholder, blank value-like UI, or guessed operator/provider information is rendered.
- Allowed status categories are `運営者判断待ち`, `外部証拠待ち`, `専門家確認待ち`, and `内部方針決定済み・実装証拠待ち`.
- Decision IDs appear only in a visibly labeled `審査専用メタデータ` area and are not presented as customer-facing legal language.
- `施行日：未確定` and `最終更新日：未確定` are shown where applicable. The implementation date is not substituted.

## Goal

Create truthful review-only representations of legal-document structure, AI disclosure, unsupported-case handling, refund-policy structure, Tokushoho disclosure structure, and contact structure without making any page look publication-approved, complete, legally reviewed, binding, operational, or populated with invented facts.

No transaction, submission, email, database, AI, analytics, or external behavior is introduced.

## Routes implemented

- `/legal`
- `/legal/terms`
- `/legal/privacy`
- `/legal/tokushoho`
- `/legal/refund`
- `/legal/ai-disclosure`
- `/legal/unsupported-cases`
- `/contact`

## Shared review boundary

Every route uses `LegalReviewScaffold` and displays, before the page heading:

- `審査用ドラフト表示`
- `公開承認前・運営者情報未完了`
- `法的助言ではありません`
- `この画面は公開前の構成確認用です。現在の利用契約条件または正式な法務表示ではありません。`

The boundary has no dismiss control and does not rely on color alone. Shared legal navigation identifies the current page with `aria-current="page"` and visible status. Related links cover `/`, `/review`, purchase confirmation, sample report, Web鑑定ノート, and 保存用鑑定書. All legal/contact routes include `noindex, nofollow`; this is a route metadata control, not a claim that every external cache can be cleared.

## Fixed facts

The shared static source renders:

- 月の返事
- AIを活用した恋愛メッセージ分析・判断支援デジタルレポート
- 恋のメッセージ鑑定ノート
- 税込980円
- 1相談 / 1鑑定ノート
- 一度きりの購入
- 自動更新なし
- 18歳以上
- AI利用を明示
- no tarot, astrology, birth-date analysis, psychic, or supernatural method
- no guarantee of another person's true feelings, reply, reconciliation, future, or relationship improvement
- not medical, psychological, or legal advice
- Safety before payment; `rejected` and `needs_review` purchase-blocked in the initial MVP

## Unresolved-field treatment

`lib/legal/review-content.ts` is deterministic review/status content, not customer fixture data. It maps unresolved rows to relevant OP IDs without rendering underlying placeholder tokens or values.

Major mappings include:

- operator and contact: OP-001 through OP-009;
- payment, commercial, and delivery: OP-010 through OP-014;
- AI processing: OP-015 through OP-017;
- hosting, analytics, Cookie, retention, and deletion: OP-018 through OP-028;
- governing court: OP-030;
- professional review: OP-032;
- public support-resource verification: OP-033;
- initial `needs_review` treatment: OP-034; and
- report sharing/quotation: OP-035.

OP states are not changed by this task.

## Legal index

`/legal` displays the fixed product facts, active links to all eight M1-I5 routes, `審査用ドラフト` and `未承認` status on every inventory card, unresolved-category summaries, and publication-readiness cards.

It visibly states `現在の法務ページ群は販売開始または公開承認に使用できません。` and lists incomplete operator, provider, commercial, privacy, professional-review, date, and final Human approval categories.

## Terms review

`/legal/terms` uses the existing Terms draft as the only substance source and preserves its 18-section order:

1. 適用
2. サービス内容
3. 利用資格
4. 申込み
5. 料金および支払
6. 提供および納品
7. 入力内容
8. 禁止事項
9. 通常鑑定対象外
10. AI利用
11. 鑑定書の利用
12. 返金およびキャンセル
13. サービス停止・変更・終了
14. 非保証および責任制限
15. 個人情報
16. 規約変更
17. 準拠法・管轄
18. 問い合わせ

It does not finalize contract formation, payment, delivery, refund, contact, rights, changes, liability, or court terms and contains no acceptance checkbox.

## Privacy review

`/legal/privacy` distinguishes current M1 behavior from future production plans. It explicitly states that the current M1 review environment does not persist or transmit form data.

The page covers operator status, planned collection, prohibited input, purposes, AI processing, payload minimization, data hosting, payment, email, outsourcing/third-party/foreign processing, Cookie/analytics, retention, security candidates, access/correction/deletion, revisions, and contact.

Email, payment identifiers, external-provider customer IDs, purchase IDs, internal tokens, secrets, IP address, and User-Agent are identified as outside the intended future AI-generation payload. Provider names, region, retention duration, deletion SLA, and zero-retention claims are absent. Implementation verification remains incomplete.

## Tokushoho review

`/legal/tokushoho` prominently states `この画面は、完成した特定商取引法に基づく表記ではありません。`

Fixed rows are price, quantity, age, product/non-guarantee description, and planned Web result plus notification-email delivery method. Responsive unresolved cards cover sales operator, trade name, responsible person, address, phone, email, contact method, response time, payment method, payment timing, payment provider, delivery timing, refund conditions, operating environment, application validity, and last-updated date.

No horizontal table, fake omission/exemption, virtual-office claim, support contact, provider name, or complete purchase-disclosure claim is used.

## Refund review

`/legal/refund` labels the matrix `現時点の方針案` and prominently shows `決済事業者・専門家確認待ち`.

It covers before payment, after payment/before generation, successful delivery, AI failure, result-save failure, duplicate payment, accidentally paid `rejected`, accidentally paid `needs_review`, service outage, wrong email, lost result URL, dissatisfaction alone, chargeback, and statutory refund requirements.

Every row is a candidate or unresolved direction. The page does not claim automatic refunds, a fixed deadline, a conclusion on fees, or categorical non-refundability of every delivered report. It has no application form, support email, or provider.

## AI disclosure review

`/legal/ai-disclosure` covers intended AI use, AI limits, possible error/incompleteness, non-guarantee, professional-service boundary, unsafe/unsupported consultation handling, future payload minimization, and unresolved provider/endpoint/region/retention/account settings.

It states that current M1 pages use deterministic fixture data and make no AI API call. It names no AI provider and claims neither fixed retention nor zero retention. The draft report footer is labeled `最終承認前の候補`.

## Unsupported-cases review

`/legal/unsupported-cases` preserves the full existing public-draft category list and current `rejected` / `needs_review` vocabulary. It explains Safety-before-payment, links the two existing blocked review routes, and uses calm non-judgmental copy without ordinary romantic-message suggestions.

The emergency boundary states that the service is not emergency, police, medical, psychological, legal, or public-resource support. It includes no unverified hotline, public-resource link, phone number, or emergency-response claim. `/contact` is linked only as an inactive preparation page.

## Contact inactive state

`/contact` visibly states `お問い合わせ受付機能は現在準備中です`.

It displays structured unresolved rows for email, form URL, response time, operator, and identity verification; planned categories; a do-not-send list; and the emergency/professional-support boundary.

There is no form, input, textarea, submit button, server action, `mailto:`, support-email link, external-form link, or receipt claim.

## Cross-page consistency

All legal/contact pages use one shared component and one static review-content module for navigation, fixed facts, status categories, and Decision metadata. The fixed service definition, user-facing product label, price, quantity, purchase type, age, AI disclosure, Safety-before-payment direction, non-guarantee, professional boundary, and incomplete-publication status are consistent.

`docs/legal/LEGAL_DRAFT_CONSISTENCY_MATRIX.md` records only review-screen implementation status. It does not alter legal substance, publication-gate completion, or OP decision states.

## Existing-screen integration

- Global footer: `法務情報` links to `/legal`; `お問い合わせ` links to `/contact`; AI and unsupported-case review links are active and truthfully labeled.
- Purchase confirmation: the former non-clickable preparation list is replaced with seven legal/contact review links. Opening a link does not record consent; final conditions and purchase remain unavailable.
- Safety/request: blocked `needs_review` and `rejected` views link to `/legal/unsupported-cases`; classifier rules, severity, and allowed navigation are unchanged.
- Report/sample: the global footer provides legal, AI, unsupported-case, and contact review access; report content is not redesigned.

## Review-index update

`/review` moves the eight legal/contact routes into implemented/available status, keeps M1-I6 planned/not implemented, and sets the current gate to `M1-I5 の Human review 待ち`. Milestone 1 remains incomplete.

## Accessibility/responsive behavior

- one shared `h1` per page;
- logical `h2` / `h3` structure;
- early, non-dismissible, text-based review boundary;
- keyboard-accessible links and visible global focus;
- touch-sized legal and related-review navigation;
- `aria-current="page"` plus visible current-page treatment;
- status text that does not rely on color;
- single-column phone layouts and responsive grids at wider breakpoints;
- no wide legal tables or phone horizontal-scroll requirement;
- controlled long-text width and Japanese line height; and
- existing reduced-motion behavior preserved.

Human Visual QA at approximately 320px, 390px, tablet, and desktop remains required. No browser Visual QA is claimed.

## Files changed

- `app/globals.css`
- `app/contact/page.tsx`
- `app/legal/layout.tsx`
- `app/legal/page.tsx`
- `app/legal/terms/page.tsx`
- `app/legal/privacy/page.tsx`
- `app/legal/tokushoho/page.tsx`
- `app/legal/refund/page.tsx`
- `app/legal/ai-disclosure/page.tsx`
- `app/legal/unsupported-cases/page.tsx`
- `app/review/page.tsx`
- `components/legal/LegalReview.tsx`
- `components/layout/SiteFooter.tsx`
- `components/request/RequestForm.tsx`
- `components/review/ReviewPurchaseConfirmation.tsx`
- `components/review/ReviewRequestState.tsx`
- `lib/legal/review-content.ts`
- `docs/CURRENT_FOCUS.md`
- `docs/CODEX_HANDOFF.md`
- `docs/WBS.md`
- `docs/legal/LEGAL_DRAFT_CONSISTENCY_MATRIX.md`
- `docs/phase1/IMPLEMENTATION_WBS.md`
- `docs/phase1/M1_IMPLEMENTATION_SLICES.md`
- `docs/phase1/M1_UI_STATE_MATRIX.md`
- `docs/phase1/TASK_M1_I4_REVIEW.md`
- `docs/phase1/TASK_M1_I5_REVIEW.md`

## Validation

- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed with zero warnings.
- `npm.cmd run build`: passed and generated 27 pages. The first restricted run failed before compilation with environment-level `EPERM` on `.next/trace-build`; the permitted rerun passed.
- Raw HTTP checks: all 14 requested routes returned HTTP 200.
- Rendered metadata check: all seven `/legal` routes plus `/contact` contained `noindex, nofollow`.
- Rendered HTML assertions: all eight review routes had one `h1`, all four shared boundary statements, full legal navigation, and their route-specific required statement; `/contact` had no form/input/textarea/`mailto:` markup.
- Required shared-label search: passed.
- Raw-placeholder search: no matches in `app/legal`, `app/contact`, `components/legal`, or `lib/legal`.
- Fake operator/provider variable search: no matches in the same scope.
- Active-form/network search: no matches in the same scope.
- Package, Supabase, `lib/safety`, publication-gate, and OP-register diffs: empty.
- `next-env.d.ts`: unchanged.
- `git diff --check` and staged validation are completed in the final Git workflow.

## Prohibited work confirmed

No M1-I6 work, legal-substance rewrite, publication-gate checkbox, professional-review completion, operator identity, trade name, responsible person, address, phone, support email, contact URL, response SLA, payment provider/method/timing, delivery timing, refund timing, AI provider, email provider, storage region, retention duration, effective/update date, verified-emergency-resource claim, active contact form, `mailto:`, external submission, API route, server action, database access, Supabase read/write, AI/OpenAI call, email sending, payment, analytics, deployment configuration, package, external asset/font, price change, age-choice change, Safety logic change, legal acceptance checkbox, or accepted-flow redesign was added.

## Remaining Human checks

Human should inspect all eight routes at approximately 320px, 390px, tablet, and desktop for:

- early visibility and unmistakability of the review boundary;
- legal-document readability, heading order, line length, and density;
- Tokushoho/refund row wrapping without horizontal overflow;
- navigation current-state visibility, keyboard order, focus, and touch size;
- clear separation of fixed facts, candidate policy, unresolved status, and review metadata;
- no impression of publication approval, active contact, legal acceptance, or completed operator/provider decisions; and
- continued 月の返事 visual character without government-like, generic-admin, or fake-official treatment.

Mobile heading polish and favicon remain deferred to M1-I6.

## Next gate

Human accepts or requests corrections to Task M1-I5. M1-I6 remains unauthorized and does not begin automatically.
