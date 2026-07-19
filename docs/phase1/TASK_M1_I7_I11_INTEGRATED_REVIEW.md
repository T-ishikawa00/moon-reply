# TASK_M1_I7_I11_INTEGRATED_REVIEW.md

## 1. Status and authority

- Task: `M1-I7 through M1-I11 Integrated Experience Batch`.
- Status: M1-I7 through M1-I11 implemented and automatically validated under explicit Human batch authorization; Human-accepted together as the integrated next-stage baseline.
- Bounded follow-up: M1-P2-R1 Public Sample Conclusion Diversification and M1-P2-R1-R1 implemented, automatically validated, and Human-accepted as part of the same baseline.
- Human decision: baseline accepted; this is not independent acceptance of each slice and not final Milestone 1 acceptance.
- M1-I12: unauthorized.
- Milestone 1: incomplete.
- Milestone 2 and later: unauthorized.
- Browser use and screenshot acquisition by CodeX/agents: prohibited.
- Commit and push: authorized only for the integrated baseline-closure task after all required validation passes.

## 2. Base commit and working-tree inheritance

- Branch: `main`.
- `HEAD`: `923d43057178da070a72f380d7054d60efca7daf`.
- `origin/main`: `923d43057178da070a72f380d7054d60efca7daf`.
- The pre-existing uncommitted M1-I7 Brand Foundation implementation matched the Human-provided modified and untracked file inventory exactly.
- The M1-I7 worktree was inherited without reset, stash, deletion, overwrite, commit, or push.

## 3. Human batch authorization

Human explicitly authorized one sequential internal implementation batch covering:

1. M1-I7 bounded correction and foundation completion;
2. M1-I8 Reading Note Product Redesign;
3. M1-I9 LP Redesign;
4. M1-I10 Request Sheet Redesign; and
5. M1-I11 Legal Review Redesign.

Internal checkpoints do not constitute Human acceptance. The complete batch remains subject to integrated Human Visual QA in ordinary external Microsoft Edge.

## 4. Initial mutation manifest

The manifest document was created as the first mutation before product-code work. The table below is its final file-level reconciliation, including inherited M1-I7 primitives and route-wrapper-only M1-I11 entries needed by the shared legal reading measure. `Runtime impact` distinguishes local presentation/state composition from prohibited external or production runtime activation. Manifest wording about a pending gate records the implementation-time state and does not override the current Human decision in Section 1.

| File | Slice | Reason | Audience | Acceptance condition | Runtime impact |
| --- | --- | --- | --- | --- | --- |
| `app/globals.css` | M1-I7–M1-I11 | Complete bounded wrapping/CTA/status fixes and add shared Reading Note, LP, Request Sheet, and Legal presentation roles | Shared customer/review UI | Responsive hierarchy, contrast, focus, Japanese wrapping, non-fixed actions | CSS presentation only; no external runtime |
| `app/review/page.tsx` | M1-I7, M1-I8, M1-I10, docs boundary | Fix semantic phrase grouping and synchronize review inventory/current batch gate | Review-only | Correct wraps, truthful route descriptions, batch Human gate | Static presentation only |
| `components/review/BrandFoundationPreview.tsx` | M1-I7 | Keep `今夜の答え` as one semantic phrase | Review-only | Approved M1-I7 bounded correction | Static presentation only |
| `components/brand/MoonSeal.tsx` | Inherited M1-I7 | Preserve the inherited original seal primitive used by integrated surfaces | Shared | Existing M1-I7 primitive remains unchanged and reusable | Static SVG only |
| `components/brand/LunarArc.tsx` | Inherited M1-I7 | Preserve the inherited decorative arc primitive used by integrated surfaces | Shared | Existing M1-I7 primitive remains aria-hidden and unchanged | Static decoration only |
| `components/brand/EditorialDivider.tsx` | Inherited M1-I7 | Preserve the inherited editorial divider used by the Reading Note and LP | Shared | Existing M1-I7 primitive remains unchanged | Static decoration only |
| `fixtures/review/reports.ts` | M1-I8 | Extend the presentation schema for the approved 14-part note and distinct save-oriented decision aid | Review fixture / public sample | Preserve scenario, fixed judgment, uncertainty, recommendation meaning, limitations | Deterministic presentation data only |
| `components/report/PublicSampleReport.tsx` | M1-I8 | Present the fictional sample as an editorial Reading Note without purchase implication | Customer-facing | Exact fictional-case disclosure; internal ID collapsed | Static fixture rendering only |
| `components/report/ReportComparisonNavigation.tsx` | M1-I8 | Clarify sample/Web/save purposes and reduce repeated card UI | Customer/review UI | Three distinct experiences; no purchase/generation claim | Navigation/presentation only |
| `components/report/ReviewWebReport.tsx` | M1-I8 | Implement the approved 14-part Web Reading Note | Review-only product artifact | Answer visible in 30 seconds; all approved sections and uncertainty retained | Static fixture rendering only |
| `components/report/ReviewSaveReport.tsx` | M1-I8 | Recompose the fixture as a quick decision aid rather than a shortened Web note | Review-only product artifact | Answer, do/do-not, draft, next date, change conditions, remembered line | Static fixture rendering only |
| `app/sample-report/page.tsx` | M1-I8 | Align metadata with the redesigned fictional Reading Note | Customer-facing | Truthful fictional sample description | Metadata only |
| `app/review/result/[fixtureId]/page.tsx` | M1-I8 | Align metadata with the redesigned Web Reading Note | Review-only | Review boundary and fixed-fixture truth | Metadata only |
| `app/review/save-report/[fixtureId]/page.tsx` | M1-I8 | Align metadata with the redesigned save-oriented note | Review-only | No file/download implication | Metadata only |
| `app/page.tsx` | M1-I9 | Rebuild the LP in the approved ten-part sequence around the Reading Note artifact | Customer-facing | Hero facts, three answers, artifact proof, three-step flow, sample, price, boundaries, FAQ, CTA | Static presentation/navigation only |
| `components/layout/SiteHeader.tsx` | M1-I9 | Align global navigation with the customer journey and remove review jargon from the LP header | Customer-facing | Clear active destinations and request CTA | Navigation only |
| `components/layout/SiteFooter.tsx` | M1-I9 | Align public labels and cross-surface destinations with the redesigned experience | Customer-facing | Product facts and inactive/review boundaries remain truthful | Navigation/presentation only |
| `app/request/page.tsx` | M1-I10 | Reframe the route as a calm 鑑定依頼シート | Customer-facing | Free-text-first concept and truthful local-only boundary | Static shell only |
| `components/request/RequestForm.tsx` | M1-I10 | Replace the dense questionnaire with the approved free-text/chip/Safety/acknowledgement/email sequence | Customer-facing local UI | Required/optional fields, privacy warning, Safety before confirmation, one acknowledgement, final revalidation | Browser-memory state only; no transmission/persistence |
| `fixtures/review/requests.ts` | M1-I10 | Reorganize presentation fixture fields for the approved Request Sheet | Review fixture | IDs, core scenario, Safety meaning, fictional data retained | Deterministic presentation data only |
| `fixtures/review/purchase-confirmations.ts` | M1-I10 | Keep purchase allowlisting/fail-closed checks aligned with the reorganized request fixture | Review fixture | Adult, acknowledged, normal-only continuation remains enforced | Deterministic local guard only; no transaction |
| `fixtures/review/safety-states.ts` | M1-I10 | Align correction destinations and customer wording with the redesigned sheet | Review fixture | Classification meaning and fail-closed behavior unchanged | Deterministic presentation data only |
| `components/review/ReviewRequestConfirmation.tsx` | M1-I10 | Render confirmation as one request memo with correction paths | Review-only | Approved summary structure and truthful fixture wording | Static fixture rendering only |
| `components/review/ReviewRequestState.tsx` | M1-I10 | Align normal/blocked/error views with the worksheet while preserving stops | Review-only | Only normal continues; every other state stops | Navigation/presentation only |
| `components/review/ReviewPurchaseConfirmation.tsx` | M1-I10 | Align final confirmation with the new request schema and required product disclosures | Review-only | Product, contents, JPY 980, one-shot, AI, non-guarantee, refund link, disabled purchase | Static fixture rendering only; no transaction |
| `components/legal/LegalReview.tsx` | M1-I11 | Implement document-first navigation, continuous reading, readiness hierarchy, and collapsed metadata | Review-only legal UI | Three layers, one page status, breadcrumbs, 48–52rem measure, responsive rows | Static presentation only |
| `lib/legal/review-content.ts` | M1-I11 | Align planned contact-category presentation while preserving all legal facts and Decision states | Review-only content data | No invented operator/provider/contact fact; legal substance unchanged | Static content only |
| `app/legal/page.tsx` | M1-I11 | Replace the legal card grid with a document index and prioritized readiness sections | Review-only | Name, description, one status, arrow; readiness categories | Static presentation only |
| `app/legal/terms/page.tsx` | M1-I11 | Apply the shared continuous legal reading measure to the existing terms body | Review-only | Existing clauses and decisions unchanged; 48–52rem document measure | Wrapper/presentation only |
| `app/legal/privacy/page.tsx` | M1-I11 | Apply the shared continuous legal reading measure to the existing privacy body | Review-only | Existing privacy substance and Decision states unchanged | Wrapper/presentation only |
| `app/legal/tokushoho/page.tsx` | M1-I11 | Apply the shared document measure and correct mixed-language presentation copy | Review-only | Definition rows stack responsively; no operator fact invented | Wrapper/copy presentation only |
| `app/legal/refund/page.tsx` | M1-I11 | Apply the shared continuous legal reading measure to the existing refund body | Review-only | Existing candidate policies and Decision states unchanged | Wrapper/presentation only |
| `app/legal/ai-disclosure/page.tsx` | M1-I11 | Apply the shared continuous legal reading measure to the existing AI disclosure body | Review-only | Existing AI-use and limitation substance unchanged | Wrapper/presentation only |
| `app/legal/unsupported-cases/page.tsx` | M1-I11 | Add the approved user-care reading order and fix light-surface/CTA contrast through shared roles | Review-only Safety/legal UI | Unsupported categories, reason, M1 stop, emergency boundary, inactive contact | Static presentation/navigation only |
| `app/contact/page.tsx` | M1-I11 | Present the approved inactive contact categories in the document hierarchy | Review-only | No form, mailto, send, receipt, or active-channel implication | Static presentation only |
| `docs/ROADMAP.md` | Documentation | Synchronize the current batch state only | Documentation | Milestone definition/order unchanged | None |
| `docs/CURRENT_FOCUS.md` | Documentation | Record implemented batch scope and pending integrated Human QA | Documentation | No Human acceptance or M1-I12 claim | None |
| `docs/CODEX_HANDOFF.md` | Documentation | Preserve exact authority, runtime, Browser, commit/push, and next-gate boundaries | Documentation | Honest continuation boundary | None |
| `docs/WBS.md` | Documentation | Record M1-I7–M1-I11 implementation/automation separately from acceptance | Documentation | Milestone 1 remains incomplete | None |
| `docs/phase1/IMPLEMENTATION_WBS.md` | Documentation | Synchronize batch authorization, completed automation, and pending Human gate | Documentation | M1-I12 remains unchecked/unauthorized | None |
| `docs/phase1/M1_IMPLEMENTATION_SLICES.md` | Documentation | Record the one-time integrated execution exception without changing slice IDs or product boundaries | Documentation | Sequential slice registry remains intact | None |
| `docs/phase1/TASK_M1_I7_REVIEW.md` | Documentation | Record bounded M1-I7 corrections and superseding integrated review gate | Documentation | No standalone M1-I7 acceptance claim | None |
| `docs/phase1/TASK_M1_I7_I11_INTEGRATED_REVIEW.md` | Documentation | Hold manifest, checkpoints, audits, evidence, Human checklist, and carry-forward | Documentation | Required integrated review record | None |

Explicit non-mutations: `package.json`, `package-lock.json`, `lib/safety/**`, `supabase/**`, API/server-action/runtime integration files, and `docs/phase1/M1_FINAL_QA_MATRIX.md`.

## 5. M1-I7 completion

- Preserved the inherited role-based token, typography, surface, MoonSeal, LunarArc, EditorialDivider, SoftGlow, PaperGrain, CTA/focus, reduced-motion, and review-only preview foundation.
- Kept `「今夜の答え」` as one semantic phrase while allowing the boundary before `用の強調面` to wrap.
- Kept `Web鑑定ノート` as one semantic phrase in the Current Gate CTA, added a desktop minimum inline size, and stacked the gate at intermediate widths without fixed/sticky behavior or destination/copy change.
- Kept the mobile status chips at content width with `max-width: 100%` and start alignment.
- Kept `三つの結果体験` and `ローディング状態` as semantic phrase groups without mass `<br>` insertion.
- M1-I7 is not recorded as independently Human-accepted; Human accepted it only as part of the integrated baseline.

Checkpoint:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS with zero warnings.
- `npm.cmd run build`: PASS; 28 static/SSG pages generated.
- `git diff --check`: PASS; only Git line-ending notices were emitted.

## 6. M1-I8 implementation

- Reframed the fixed result from a generic nine-section long report into a fourteen-part editorial Reading Note in the approved order: cover, short letter, answer, reading guide, relationship timeline, possible reception, anxiety reading, message temperature, tonight actions, draft, three-day plan, change conditions, limitations, and closing letter.
- Kept the fixed judgment and recommendation meaning intact while separating confirmed facts, plausible interpretations, and Moon Reply recommendations. No probability or confidence score was introduced.
- Added the approved quote-led four-lens message-temperature reading, do/do-not actions, exact draft-usage conditions, lunar three-day plan, send/hold conditions, and explicit capability/limitation split.
- Rebuilt the save-oriented route as a distinct high-contrast thirty-second decision card rather than a shortened copy of the Web note. It includes the answer, do/do-not, draft, next judgment date, change conditions, remembered line, and limitations without file generation or download behavior.
- Rebuilt the public sample as a clearly fictional, non-purchase artifact and used the exact approved public disclosure. Fixture identifiers and execution metadata remain collapsed inside review-only disclosure regions.
- Replaced repeated comparison cards with one editorial route list that distinguishes the public sample, full Web note, and saved decision card by purpose.
- Extended only deterministic presentation fixtures. The core scenario, fixed judgment, Safety meaning, and product limitations were preserved.

Checkpoint:

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS with zero warnings.
- `npm.cmd run build`: PASS; 28 static/SSG pages generated.
- `git diff --check`: PASS; only Git line-ending notices were emitted.
- Raw HTTP and rendered-text checks: PASS for all three required routes.

## 7. M1-I9 implementation

- Rebuilt `/` in the approved ten-part order: Hero, three answers, concise empathy, artifact preview, three-step flow, fictional sample, price, capabilities/boundaries, FAQ, and final CTA.
- Made the Reading Note the product proof. The Hero identifies the service, delivered artifact, JPY 980 tax-inclusive price, pay-per-use model, age 18+ boundary, one-consultation/one-note unit, and the answer/message/three-day outcomes within the first view.
- Kept AI out of the Hero subject position and removed public-header review terminology. The public header now leads to the note, flow, price, FAQ, fictional sample, and request sheet.
- Presented the full Web note and thirty-second saved decision card as distinct artifacts inside one composed preview, without linking the public LP to internal fixed-fixture review routes.
- Reduced the flow to situation entry, Safety check, and Reading Note receipt. The copy states that Safety precedes payment and that payment, generation, and email are not active.
- Preserved the JPY 980 one-time offer, no auto-renewal/coin model, exact non-guarantee boundaries, non-medical/psychological/legal boundary, and unavailable-purchase status.
- Added scoped responsive composition for desktop, tablet, and mobile without sticky/fixed CTA behavior.

Checkpoint:

- Source architecture audit: PASS; exactly ten top-level LP sections.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS with zero warnings.
- `npm.cmd run build`: PASS; 28 static/SSG pages generated.
- `git diff --check`: PASS; only Git line-ending notices were emitted.
- Raw HTTP and rendered-text check: PASS for `/`.

## 8. M1-I10 implementation

- Replaced the dense multi-field questionnaire with a calm Request Sheet centered on one required large free-text field, one relationship choice, and one-to-two intent chips.
- Kept only the approved required inputs: age-18+ self-declaration, current situation, relationship, intent chips, Safety, and one required acknowledgement. Nickname and two actual-message fields are optional; the message fields begin collapsed behind `実際のメッセージを追加する`.
- Placed the exact privacy list next to the main text area: real name, address, phone, employer, school, SNS account ID, face/photo, identity document, and third-party secrets.
- Reordered the local experience to consultation input, deterministic Safety, one Request Memo (`このように受け取りました`), result-email input, and preparation-only purchase confirmation. Email is not requested at the beginning.
- Preserved the existing Safety vocabulary and deterministic classifier without modifying `lib/safety/**`. Contradictory selection, needs_review, rejected, invalid-age, missing-acknowledgement, and unknown states remain fail closed; only normal_allowed can reach the memo and purchase-confirmation fixtures.
- Kept five acknowledgement points visible with the single required control `上記を確認し、鑑定依頼を続けます`.
- Revalidates the complete consultation, Safety, acknowledgement, normal-only classification, and email chain on the final local submit so hash/deep-link navigation cannot bypass prior gates.
- Rebuilt the fixed confirmation as one readable request memo and reduced the purchase confirmation to the required product, included contents, JPY 980, pay-per-use/no-renewal, AI-use, non-guarantee, refund-link, and disabled purchase facts.
- Reorganized only deterministic presentation fixture fields while preserving fixture IDs, the core normal scenario, state meanings, and allowlist relationships.

Checkpoint:

- Source boundary audit: PASS; `lib/safety/**` unchanged.
- Single required acknowledgement audit: PASS; one control plus its matching validation message.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS with zero warnings.
- `npm.cmd run build`: PASS; 28 static/SSG pages generated.
- `git diff --check`: PASS; only Git line-ending notices were emitted.
- Raw HTTP and rendered-text checks: PASS for all ten required routes.

## 9. M1-I11 implementation

- Replaced the card-dashboard presentation with a shared continuous-document renderer and a quiet archive-like visual hierarchy.
- Added breadcrumbs, document title, short description, and exactly one page-level status to every legal/Safety/contact header. Repetitive English uppercase labels are retained only as non-visible review keys rather than section eyebrows.
- Constrained the reading measure to 50rem (within the approved 48–52rem range), added numbered sections and thin rules, and removed card containers from the normal reading flow.
- Separated three layers: user-readable body; visible publication decisions/status; collapsed review metadata. Decision IDs, decision status, and publication gate now appear only inside `審査メタデータを表示` disclosures.
- Added an explicit `review`/future-`public` mode boundary to the shared scaffold. Only Review mode is instantiated in M1; boundary/navigation metadata are conditional and excluded by structure from a future Public mode.
- Rebuilt `/legal` as a document index list with name, purpose, one status, and arrow. Publication readiness is grouped into `公開を止める項目`, `運用開始前に決める項目`, and `将来の改善候補`.
- Kept Tokushoho fixed values and unresolved rows in a responsive definition-list presentation; no operator, address, telephone, email, provider, or other fictional fact was added.
- Reordered Unsupported cases for user care: excluded consultations, reason for not providing a normal reading, current M1 stop handling, emergency boundary, and inactive contact preparation. Light/dark foreground roles and CTA contrast are scoped explicitly.
- Reduced Contact to the five approved future categories and made the inactive boundary explicit. It contains no form, mailto, external send, receipt state, or active contact channel.
- Preserved the substantive legal/Safety text and existing Decision records. The only legal content-data change is the authorized contact-category presentation list.

Checkpoint:

- Contact-category source audit: PASS; all five approved categories present.
- Fixed-product-row mutation audit: PASS; no fixed legal product row changed.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS with zero warnings.
- `npm.cmd run build`: PASS; 28 static/SSG pages generated.
- `git diff --check`: PASS; only Git line-ending notices were emitted.
- Raw HTTP and rendered-text checks: PASS for all eight required routes; Contact has no form/mailto and Unsupported cases has no telephone link.

## 10. Product facts preserved

- Service name: `月の返事`.
- User-facing artifact: `恋のメッセージ鑑定ノート`.
- Long presentation: `Web鑑定ノート`.
- Short presentation: `保存用判断カード`.
- Residual application copy such as `保存用鑑定書` is not the current formal term and is deferred to a separately authorized M1-I8-R1; baseline closure does not change application copy.
- Product unit: `1相談 / 1鑑定ノート`.
- Price and purchase model: `税込980円`, `都度払い`, `自動更新なし`; no subscription, coin, point, or ticket model.
- Eligibility: `18歳以上`.
- Core non-guarantee: the product does not determine or guarantee the other person's true feelings, a reply, reconciliation, a relationship, the future, or relationship improvement.
- Professional-services boundary: the product does not replace medical care, diagnosis, psychological counselling, or legal advice.
- Method boundary: planned AI use is disclosed; tarot, astrology, birth-date analysis, numerology, psychic insight, and other divination or supernatural methods are not used.
- The fixed normal report retained both its original consultation theme `二度会った相手へ、返信を待つ今夜に追加のメッセージを送るか` and judgment `今日は送らない方がいい`. The public fictional sample retained `今夜は待つ`. All three strings were present in both `HEAD` and the final working tree.
- The public sample keeps the exact approved fictional-case disclosure and does not imply purchase, AI generation, delivery, or a real customer case.

## 11. Safety and fail-closed audit

- `git diff --exit-code -- lib/safety` returned zero; the deterministic classifier and its existing vocabulary were not modified.
- The seven review states retain their meanings. Exactly one (`normal_allowed`) has `canReachConfirmation: true`; the other six have `false`.
- `needs_review`, `rejected`, contradictory selection, invalid age, missing acknowledgement, and unknown/error conditions stop before the memo, purchase confirmation, payment, or normal report.
- The interactive Request Sheet evaluates Safety before acknowledgement/memo progression and checks for `normal_allowed` again before memo continuation and final local completion.
- Final submit re-runs consultation, Safety, acknowledgement, email, and phase-completion validation. Hash/deep-link navigation therefore cannot authorize a stale or blocked state.
- The purchase fixture resolver independently requires the allowlisted fixture ID, `normal_allowed`, a continuation-enabled state, adult confirmation, acknowledgement, the fixed fictional email boundary, and exactly the non-danger Safety choice. Any mismatch returns `undefined`.
- Purchase remains disabled and no blocked state gains a link to purchase or a normal report.

## 12. Fixture/schema changes

| Area | Before | After | Preservation / reason |
| --- | --- | --- | --- |
| M1-I8 report fixture | General long-report fields centered on conclusion, reasoning, facts, possibilities, unknowns, recommendation, timing, draft, and three-day plan | Added client/date/cover/letter/guide/timeline, message-temperature lenses, tonight do/do-not groups, hold conditions, capabilities, remembered line, and closing letter | Enables the approved fourteen-part Reading Note and distinct thirty-second card; scenario, fixed judgment, uncertainty, recommendations, and limitations remain intact |
| M1-I10 request fixture | Dense questionnaire with age band, relationship-status array, wait duration, multiple history/concern/action/question fields, and send-tonight choice | `adultConfirmed`, nickname, relationship, one-to-two `whatToKnow` chips, one `currentSituation`, optional partner/draft messages, email, Safety flags, and acknowledgement | Mirrors the free-text-first sheet; all fixture IDs and Safety scenarios remain stable |
| M1-I10 purchase fixture | `一度きりの購入` label with product facts and one normal fixture | `都度払い` label plus the explicit included pair `Web鑑定ノート` / `保存用判断カード` | Clarifies the approved offer without activating a transaction; normal-only resolver is stricter, not broader |
| M1-I10 Safety presentation fixture | Existing seven states and correction links | Same state names/classifications with correction destinations aligned to the new sheet anchors | Presentation-only wording/navigation; classifier semantics unchanged |
| M1-I11 legal content | Existing legal document facts, decisions, and unresolved operational facts | Same legal substance plus the five approved planned contact categories | Supports inactive contact presentation only; no operator, provider, address, phone, email, or policy fact invented |

## 13. Runtime-boundary audit

- All new behavior is static rendering, deterministic fixture composition, CSS presentation, or in-browser React state. No production service was activated.
- No new external network request, runtime API/route handler, server action, AI call, database write/read, payment transaction, email transmission, analytics, file generation, download, or persistence path was added.
- `package.json` and `package-lock.json` are unchanged; no package, font, image, icon, or external asset was added.
- `lib/safety/**` and `supabase/**` are unchanged. Existing inactive infrastructure was not connected to the redesigned surfaces.
- Review and legal route groups retain `noindex`/`nofollow`; Contact supplies page-level noindex metadata.
- Request completion is explicitly local and preparation-only, purchase controls remain disabled, Contact remains inactive, and all result examples remain fixed fictional fixtures.

## 14. Accessibility foundation

- Preserved one semantic page heading per route and used labelled `section`, `article`, `nav`, `aside`, ordered/unordered lists, definition lists, and native `details`/`summary` structures for reading and disclosure flows.
- Added route/progress state through `aria-current`, field relationships through `aria-describedby`/`aria-invalid`, and Safety/error feedback through `role="status"`, `role="alert"`, and an assertive error summary.
- Validation focuses the first invalid field; the Request Memo heading is programmatically focusable with `tabIndex={-1}` for phase-change focus management. No positive `tabIndex` was introduced.
- Text inputs, native controls, chips, links, and buttons have visible `:focus-visible` treatment. Primary interactive rows and controls use approximately 44px or larger minimum targets where applicable.
- Decorative brand SVGs remain hidden from assistive technology, while meaningful artifacts and navigation regions have accessible labels.
- Reduced-motion preferences disable smooth scrolling and animation/transition behavior. Browser-based keyboard order, screen-reader behavior, and final contrast perception remain Human/M1-I12 verification items.

## 15. Responsive design summary

- Desktop uses bounded editorial measures, fluid `clamp()` typography/spacing, a 50rem legal reading column, and multi-column artifact, LP, form, and index compositions.
- At 960px and below, LP/header/two-column compositions collapse or reflow; this covers the requested tablet inspection around 768px without horizontal masking.
- At 760px and below, Reading Note grids, Request Sheet progress/data/Safety grids, legal navigation/fact rows, and decision metadata collapse to single-column or compact two-column layouts.
- At 640px and below, LP facts/actions, artifact grids, request chips/actions/memo controls, and footer/navigation become full-width mobile compositions suitable for the requested 390px inspection.
- Japanese phrase grouping is semantic and scoped; no mass hard breaks, `overflow-x: hidden`, fixed/sticky CTA, or viewport-width masking was added.
- Complete 320px inspection and route-wide keyboard/focus QA remain M1-I12 work and are not claimed complete.

## 16. Per-slice validation results

| Slice | Typecheck | Lint | Build | Diff check | HTTP |
| --- | --- | --- | --- | --- | --- |
| M1-I7 | PASS | PASS | PASS (28 pages) | PASS | Not required by the per-slice instruction |
| M1-I8 | PASS | PASS | PASS (28 pages) | PASS | PASS (3/3 routes) |
| M1-I9 | PASS | PASS | PASS (28 pages) | PASS | PASS (1/1 route) |
| M1-I10 | PASS | PASS | PASS (28 pages) | PASS | PASS (10/10 routes) |
| M1-I11 | PASS | PASS | PASS (28 pages) | PASS | PASS (8/8 routes) |

## 17. Raw HTTP and rendered-text evidence

- M1-I8 temporary production server: `127.0.0.1:3012`, known PID `18520`; stopped after the checkpoint.
- `/sample-report`: HTTP 200; exact approved fictional-case disclosure found in rendered HTML.
- `/review/result/result-normal-001`: HTTP 200; `月の返事からの短い手紙` found in rendered HTML.
- `/review/save-report/result-normal-001`: HTTP 200; `迷った時に30秒で見返す、今夜の判断カード` found in rendered HTML.
- M1-I9 temporary production server: `127.0.0.1:3012`, known PID `584`; stopped after the checkpoint.
- `/`: HTTP 200; Hero copy, `税込980円`, `都度払い`, `18歳以上`, Safety-flow copy, and the approved capabilities/boundaries heading found in rendered HTML.
- M1-I10 temporary production server: `127.0.0.1:3012`, known PID `5592`; stopped after the checkpoint.
- `/request`: HTTP 200; Request Sheet concept copy found in rendered HTML.
- `/review/request/normal-allowed`: HTTP 200; normal continuation title found.
- `/review/request/needs-review`: HTTP 200; needs-review stop title found.
- `/review/request/rejected`: HTTP 200; rejected stop title found.
- `/review/request/contradictory-selection`: HTTP 200; contradictory-selection correction title found.
- `/review/request/invalid-age`: HTTP 200; age-18+ stop title found.
- `/review/request/missing-consent`: HTTP 200; missing-required-confirmation title found.
- `/review/request/unknown-error`: HTTP 200; unknown fail-closed title found.
- `/review/request/confirmation/normal-001`: HTTP 200; `このように受け取りました` found.
- `/review/purchase/confirmation/normal-001`: HTTP 200; disabled purchase-preparation text found.
- M1-I11 temporary production server: `127.0.0.1:3012`, known PID `26536`; stopped after the checkpoint.
- `/legal`: HTTP 200; document index and all three readiness categories found.
- `/legal/terms`: HTTP 200; terms body and collapsed review-metadata control found.
- `/legal/privacy`: HTTP 200; privacy title and do-not-enter section found.
- `/legal/tokushoho`: HTTP 200; commercial-disclosure title and fixed-row section found.
- `/legal/refund`: HTTP 200; refund title and case-policy content found.
- `/legal/ai-disclosure`: HTTP 200; AI disclosure title and limitations section found.
- `/legal/unsupported-cases`: HTTP 200; reason, M1 stop, and inactive-contact sections found; no `tel:` link.
- `/contact`: HTTP 200; all five approved planned categories found; no `<form>` or `mailto:`.

## 18. Known limitations

- No browser-derived visual evidence will be produced by CodeX/agents.
- Automated checks cannot establish pixel-level wrapping, perceived hierarchy, final contrast, visual rhythm, or complete keyboard/screen-reader behavior.
- Payment, AI generation, delivery, persistence, download, email transmission, and Contact receipt remain intentionally inactive; the current UI demonstrates preparation/review states only.
- Operator/provider/contact-channel facts and other Decision-gated legal items remain unresolved and are intentionally not fabricated.
- Complete 320px and route-wide keyboard/focus verification remain M1-I12 scope and are not authorized by this batch.

## 19. Human Visual QA checklist used for the baseline decision

Human used ordinary external Microsoft Edge for the integrated baseline decision. The checklist below remains the historical review scope; it is not CodeX/agent browser evidence and does not establish M1-I12 or final Milestone 1 acceptance.

- `/review`: confirm one `h1`, content-width status chips, semantic Japanese phrase wraps, the intermediate-width Current Gate CTA stack, all brand primitives, focus rings, and absence of fixed/sticky actions.
- `/sample-report`: confirm the exact fictional disclosure is prominent, the note reads as a public artifact rather than a review dashboard, and internal metadata stays subordinate/collapsed.
- `/review/result/result-normal-001`: confirm the answer is findable within thirty seconds, all fourteen Reading Note parts read in order, uncertainty remains legible, and long Japanese copy does not overflow.
- `/review/save-report/result-normal-001`: confirm it is visibly distinct from the Web note and that answer, do/do-not, draft, next date, change conditions, remembered line, and limitations scan quickly.
- `/`: confirm the ten-section order, first-view product/price/age/unit facts, artifact-led hierarchy, public navigation labels, fictional-sample boundary, responsive stacking, and CTA destinations.
- `/request`: keyboard through every phase; confirm free-text priority, one-to-two chip constraint, privacy warning proximity, optional message disclosure, Safety-before-memo ordering, exactly one required acknowledgement, error focus, deep-link/hash revalidation, email-last order, and disabled local-only completion.
- `/review/request/normal-allowed`, `/needs-review`, `/rejected`, `/contradictory-selection`, `/invalid-age`, `/missing-consent`, and `/unknown-error`: confirm only normal continues and all six non-normal states visibly stop with an appropriate correction path.
- `/review/request/confirmation/normal-001` and `/review/purchase/confirmation/normal-001`: confirm one readable request memo, correct product facts, AI/non-guarantee disclosures, refund link, and disabled purchase.
- `/legal`, `/legal/terms`, `/legal/privacy`, `/legal/tokushoho`, `/legal/refund`, `/legal/ai-disclosure`, `/legal/unsupported-cases`, and `/contact`: confirm continuous-document hierarchy, one page status, breadcrumbs, 48–52rem reading measure, collapsed review metadata, mobile row stacking, contrast, user-care order, and inactive Contact.
- Across all listed routes: confirm visible keyboard focus, logical focus order, 200% zoom usability, reduced-motion behavior, no horizontal scrolling at target widths, and no accidental public indexing language or runtime-availability claim.

## 20. M1-I12 carry-forward

M1-I12 remains unauthorized. Complete 320px, full-route keyboard/focus, and final visual/contrast acceptance remain outside this batch.

## 21. M1-P2-R1 bounded public-sample correction

Human feedback identified that the public examples appeared to return only a wait/do-not-send direction. The accepted bounded correction adds separate static public-only cases for wait, send, and stop additional contact; changes `/sample-report` to the complete `sample-send-001` example; and separates different-case conclusion comparison from same-case LP/Web/save format comparison.

The inherited integrated redesign remains preserved. The `result-normal-001` object block is byte-for-byte unchanged under the recorded extraction hash, existing Safety fixtures and `lib/safety/**` received no M1-P2-R1 mutation, and no runtime integration or fixed/sticky CTA was added. Typecheck, lint, build, and `git diff --check` passed without Browser use. Full evidence and the Human route checklist are recorded in `TASK_M1_P2_R1_PUBLIC_SAMPLE_CONCLUSION_DIVERSIFICATION_REVIEW.md`.

## 22. Human decision and next gate

Human accepted the current M1-I7 through M1-I11 integrated redesign, M1-P2-R1, and bounded M1-P2-R1-R1 correction as the baseline for the next planning stage. The baseline-closure commit containing this decision preserves the existing implementation exactly and records it with the status-document synchronization as one honest commit.

### M1-P3 record

- Task ID: `M1-P3`.
- Task name: `Reading Note Visual Excellence Specification`.
- Status: `Human-authorized; documentation/design only; not implementation authorization`.

Purpose:

- polish the Reading Note as the JPY 980 product artifact;
- improve editorial design and reading experience without changing content or judgment;
- determine PC and 390px-centered Figma/design handoff specifications;
- define 768px reflow and 320px fallback; and
- settle pre-implementation content lock, component anatomy, tokens, typography, chapter archetypes, responsive specification, acceptance criteria, and implementation plan.

Dependencies:

- current integrated redesign baseline closure commit;
- clean working tree; and
- Human decisions recorded.

Out of scope:

- implementation;
- product fact or price changes;
- fixture judgment or Safety changes;
- request/legal redesign;
- real AI, DB, payment, email, API, or deployment;
- external fonts, Storybook, or visual regression tooling; and
- PDF, download, share, print, or actual persistence.

Next gate: Human and ChatGPT prepare/review the M1-P3 design specification. M1-I8-R1 remains unauthorized until M1-P3 is explicitly accepted and M1-I8-R1 is separately authorized. M1-I9-R1 and M1-I12 remain unauthorized. Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
