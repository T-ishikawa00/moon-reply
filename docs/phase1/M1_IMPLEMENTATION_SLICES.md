# M1_IMPLEMENTATION_SLICES.md

## 0. Status and Execution Rule

- Original planning output for Task M1-P1, aligned by Task M1-P1-R1, with the current M1-P2 revision registry appended below
- No slice is authorized by this document
- Human acceptance of the applicable planning package and the dependency stated for that slice, plus separate explicit authorization, is required before each slice starts
- Human accepted M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`, explicitly authorized M1-I6, and rejected a fixed/sticky mobile CTA for Milestone 1; M1-I6 was implemented and automatically validated, was not accepted by Human, and is formally closed as superseded by M1-P2
- M1-I6 implementation and evidence remain historical records; known M1-I6 and contemplated M1-I6-R1 defects are carried into M1-I7 through M1-I12 and final M1-I12 QA, with no later M1-I6 Human Visual QA or disposition gate
- M1-P2 documentation is accepted by Human but did not itself authorize implementation; Human subsequently authorized M1-I7 and then the one-time integrated M1-I7 through M1-I11 batch
- M1-I7 through M1-I11 are implemented, automatically validated, and Human-accepted together as the integrated next-stage baseline; no standalone acceptance record is inferred for an individual slice
- M1-P2-R1 public-sample conclusion diversification and the bounded M1-P2-R1-R1 correction are Human-accepted as part of that baseline
- M1-P3 Reading Note Visual Excellence Specification is Human and ChatGPT accepted as the authoritative, complete documentation/design specification and grants no implementation authority
- M1-P3-R1 preflight stopped before coded visual prototype implementation on `SEM-UNSUPPORTED-CASES`; the bounded M1-I2-R1 Safety correction is implemented, automatically validated, Human-accepted at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`, and synchronized to `main`, resolving the previous hard stop
- M1-P3-R1 review-only A/B coded visual prototypes are implemented and automatically validated; Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`
- The coded-prototype design gate is complete. Figma is optional and non-authoritative. Checkpoint A is Human-accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and synchronized to `main`. Checkpoint B is implemented and automatically validated on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`; Human Visual QA is pending and merge to `main` is prohibited. M1-I9-R1 and M1-I12 remain unauthorized and unimplemented
- Milestone 1 remains incomplete, and Milestone 2 and every later milestone remain unauthorized
- Browser use and screenshot acquisition by CodeX/agents are prohibited; visual review is performed only by Human in ordinary external Microsoft Edge
- The normal rule is one bounded slice, validation evidence, one commit, and one Human gate; the Human-authorized integrated batch is a documented exception now closed through one integrated Human baseline decision and one honest baseline commit
- Outside the documented exception, a later slice must not be pulled into an earlier commit because a shared component is convenient

The Human-directed M1-P2 revision does not treat M1-I6 as accepted. M1-I6 is already formally closed as superseded, and that closure does not complete Milestone 1. Human acceptance of M1-P2, integrated implementation authorization, and integrated baseline acceptance of M1-I7 through M1-I11 plus the bounded public-sample corrections are satisfied. M1-I2-R1 is a separately authorized and Human-accepted Safety enforcement correction whose automated gates pass without waiver. M1-P3-R1 A/B coded prototypes are implemented and automatically validated; Human selected B and rejected A, completing the design-selection gate. Checkpoint A is separately authorized, implemented, automatically validated, Human-accepted, and synchronized to `main`. Checkpoint B is separately authorized, implemented, and automatically validated on its dedicated branch; Human Visual QA remains pending. M1-I12 still requires separate explicit authorization and remains unimplemented.

The original M1-I1 through M1-I6 structure remains the historical implementation record. The M1-P2 registry adds six revision slices, M1-I7 through M1-I12, without changing fixed product, Safety, fail-closed, or runtime boundaries. The one-time integrated authorization applies only to implementation and automated validation of M1-I7 through M1-I11.

## Shared Prohibitions for M1-I1 through M1-I6

Every slice prohibits:

- real payment, provider SDK, checkout, webhook, or payment event;
- OpenAI or other AI calls;
- real email sending;
- Supabase/public database writes or production reads;
- API routes or server actions unless a later non-M1 task explicitly authorizes them;
- deployment;
- real operator personal information;
- package additions;
- changes to production age or safety logic unless separately authorized;
- fake users, reviews, purchases, metrics, provider responses, or delivery evidence;
- subscription, login, account, coins, points, or native-app scope; and
- file/image upload, OCR, image analysis, PDF/image generation, download/copy/share behavior, advertising, or a free-complete-reading path unless separately authorized by a later task.

## M1-I1: Route Shell and Review Navigation

### Goal

Create the vertical LP/navigation foundation, shared review-mode shell, route index, global navigation, footer, and unmistakable two-level review boundary without implementing request outcomes, purchase confirmation, reports, or legal page bodies.

### Expected files/routes

Expected new or changed files after explicit authorization:

- `app/layout.tsx`
- `app/page.tsx`
- `app/review/page.tsx`
- `app/globals.css`
- shared navigation/review-banner/footer components under `components/`
- route metadata only for links to future slice routes

Routes completed:

- `/`
- `/review`

### Allowed changes

- Replace stale Stage 2/4 copy with truthful Milestone 1 review copy.
- Establish the approved vertical LP order with one value per section, wide spacing, product-preview placeholders, and a separate `/request` CTA; do not embed the full form.
- Present 税込980円, one request/one report, one-shot purchase, and no automatic renewal clearly.
- Add global header/footer and legal/sample/contact/review links.
- Add the Human-approved two-level review banner for `/review/**` shell.
- Include review-hub link metadata for the Web鑑定ノート and the then-named 保存用鑑定書 previews, now formally named 保存用判断カード, clearly labeled as later M1-I4 scope.
- Add static route/state inventory with `not implemented in this slice` labels.
- Preserve the existing `/request` route and behavior.
- At M1-I1 time, final font/color choices and the fixed mobile CTA were deferred; Human later rejected the fixed/sticky CTA for Milestone 1 before authorizing M1-I6.
- Keep any LP input preview non-interactive and non-collecting. Every active request-start CTA goes directly to `/request`.

### Prohibited changes

- Request-form state redesign.
- Safety-state routes.
- Fixture data files.
- Purchase confirmation, sample/report, or legal route bodies.
- Active analytics or deployment configuration.

### Fixture requirements

None. The review hub uses static route metadata only and must not claim that fixtures exist yet.

### Acceptance criteria

- `/` follows the approved vertical hierarchy and describes the product, 税込980円, one report, one-shot/no-renewal conditions, AI use, safety-before-payment, separate Web/save outputs, limitations, and payment-unavailable status.
- The first view shows product purpose, 税込980円, one request/one report, one-shot/no-renewal conditions, and an active CTA to `/request`.
- At least one mid-page CTA and the final CTA also go to `/request`; M1-I1 does not add a fixed/sticky CTA.
- `/review` clearly identifies itself as a review index.
- The review banner uses the Human-approved wording.
- Header/footer navigation is keyboard accessible and contains no dead link presented as complete; unavailable slices are labeled.
- No login/account or active-purchase control appears.
- Existing `/request` remains local-only.
- LP and `/request` remain separate, and mobile has no horizontal scrolling or forced alternating-column layout.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
rg -n "fetch\(|app/api|server action|supabase|openai|checkout|webhook" app components
```

### Manual review evidence

- Phone and desktop screenshots of `/` and `/review`.
- Keyboard traversal of global navigation and review banner link.
- Link inventory with status for each destination.
- Browser network capture showing no API/payment/AI/email/analytics request.

### Rollback boundary

Revert only the M1-I1 commit. `/request`, safety logic, Supabase foundation, and all documentation remain intact.

### Dependency

Human acceptance of Task M1-P1 and Task M1-P1-R1, plus explicit authorization of M1-I1.

### Next Human gate

Human accepts M1-I1 before M1-I2 starts.

## M1-I2: Request Confirmation and Safety Review States

### Goal

Align the text-only request and review experience with the approved safety rule: only `normal_allowed` reaches request confirmation; `needs_review`, `rejected`, invalid age, missing consent, contradictory input, and unknown/error states stop safely and remain deterministically inspectable.

### Expected files/routes

- `app/request/page.tsx`
- `components/request/RequestForm.tsx`
- new request confirmation and review-state components under `components/request/` or `components/review/`
- future `fixtures/review/requests.ts`
- future `fixtures/review/safety-states.ts`
- `app/review/request/[stateId]/page.tsx`
- `app/review/request/confirmation/[fixtureId]/page.tsx`

Routes completed:

- `/request`
- `/review/request/normal-allowed`
- `/review/request/needs-review`
- `/review/request/rejected`
- `/review/request/contradictory-selection`
- `/review/request/invalid-age`
- `/review/request/missing-consent`
- `/review/request/unknown-error`
- `/review/request/confirmation/normal-001`

### Allowed changes

- Preserve deterministic local classification while changing M1 review copy and navigation.
- Organize at least current situation, actual conversation, and planned message as understandable text-input regions.
- Add conversation copy/paste guidance and anonymization guidance near the relevant field.
- Implement the Human-selected three-step layout: Step 1 situation, Step 2 messages/concern, and Step 3 email/Safety/unified acknowledgement.
- Display the five acknowledgement meanings as a readable list followed by exactly one required unchecked checkbox; do not include refund conditions or marketing consent.
- Add typed deterministic fixtures under `fixtures/review/`.
- Add review-only route allowlist and unknown-state failure.
- Add request summary and correction links for the normal fixture.
- Make `needs_review` a stop state for the initial MVP review experience.

### Prohibited changes

- Change rule severity or approved age choices.
- Add server validation, persistence, API routes, server actions, or network calls.
- Add payment or ordinary report links to non-normal states.
- Present fixtures as actual submissions.
- Add file/image input, screenshot upload, OCR, image analysis/storage, or automatic masking.

### Fixture requirements

- Use only allowlisted IDs from `M1_UI_STATE_MATRIX.md`.
- Use fictional labels and `.invalid` email addresses.
- Include one fixture for each required state.
- Unknown IDs render a safe error and never select a default fixture.

### Acceptance criteria

- All required input/safety states are inspectable from `/review`.
- `normal_allowed` alone can open request confirmation.
- `needs_review` and `rejected` have no purchase or ordinary-report path.
- Invalid age, missing consent, and contradictory input return to the correct form section.
- Unknown/error states fail closed.
- State meaning is conveyed without color alone.
- Review labels and fixture IDs are visible.
- No external send or persistence occurs.
- The form is text-only, explains necessary-excerpt paste/anonymization, and contains no file input.
- Evidence records the Human-selected three-step layout and unified required acknowledgement.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
rg -n "normal_allowed|needs_review|rejected|invalid-age|missing-consent|contradictory-selection|unknown-error" app components fixtures
rg -n "fetch\(|app/api|server action|insert\(|update\(|checkout|openai" app components fixtures lib
```

### Manual review evidence

- Screenshot and URL for every M1-S02 through M1-S10 state.
- Keyboard correction flow and focus placement after validation.
- Direct-path test proving blocked fixture IDs cannot reach confirmation.
- Browser network capture showing zero external submission.

### Rollback boundary

Revert M1-I2; the M1-I1 shell remains. Existing Stage 4 classifier files remain unchanged unless a separately approved patch explicitly scopes them.

### Dependency

Human-accepted M1-I1 plus an explicit Human decision on one-page versus multi-step form layout. M1-I2 must not start while that layout gate is unresolved.

### Next Human gate

Human accepts M1-I2 before M1-I3 starts.

## M1-I2-R1: Safety Policy Enforcement Alignment

### Status

Human-accepted at implementation commit `23ee6f3b98837e48628b59b41eab811da627e730`; implemented and automatically validated on the dedicated correction branch. This correction was authorized after M1-P3-R1 preflight and does not reopen M1-I2 UI scope.

### Goal

Make the actual deterministic classifier enforce the exact locked 13 unsupported-case categories. `needs_review` and `rejected` both stop ordinary confirmation. The locked category list, existing structured classification/severity, and canonical UI remain unchanged.

### Authorized files

- `lib/safety/types.ts`
- `lib/safety/rules.ts`
- `lib/safety/classify.ts`
- `lib/safety/index.ts` only if required
- `scripts/verify-m1-safety-policy.mjs`
- the named current-status, WBS, slice, and task-review documents

### Acceptance criteria

- All 13 exact `unsupportedCaseCategories` labels classify to the Human-fixed state and reason.
- `illegal_conduct` and `third_party_secret` exist without changing prior reason-code meaning.
- The five confirmed coverage gaps have at least two natural-language regression cases each.
- The five named benign controls remain `normal_allowed`.
- Every existing structured flag preserves its classification/severity/result reason.
- Danger flag plus `NONE_SAFETY_FLAG` remains rejected as contradictory.
- The unsupported-case source-slice hash remains exact and `SEM-UNSUPPORTED-CASES` passes without waiver.
- Typecheck, lint, production build, `git diff --check`, and prohibited-scope audits pass without Browser or screenshot use.

### Permanent verification

`scripts/verify-m1-safety-policy.mjs` compiles and executes the actual TypeScript classifier and legal category export with the existing compiler in an OS temporary directory, removes the temporary output, and returns exit code 0/1 for the complete gate.

### Acceptance outcome

Human accepted M1-I2-R1, resolving the previous M1-P3-R1 hard stop. At that acceptance handoff, prototype implementation was still zero. M1-P3-R1 A/B coded prototypes are now implemented and automatically validated. Human subsequently selected and accepted B — `Lunar Contrast Edition` and rejected A — `Quiet Editorial Letter`. Checkpoint A is separately authorized, implemented, automatically validated, Human-accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda`, and synchronized to `main`. Checkpoint B is separately authorized, implemented, and automatically validated on its dedicated branch; Human Visual QA is pending and merge is prohibited. M1-I9-R1, M1-I12, Milestone 1 acceptance, and Milestone 2 remain unauthorized.

## M1-I3: Final Purchase Confirmation Without Payment

### Goal

Create an auditable, production-shaped final purchase confirmation for a normal fixture while making transaction unavailability impossible to misunderstand.

### Expected files/routes

- `app/review/purchase/confirmation/[fixtureId]/page.tsx`
- purchase-summary components under `components/purchase/` or `components/review/`
- future `fixtures/review/purchase-confirmations.ts`
- navigation/correction-link changes needed from M1-I2 only

Route completed:

- `/review/purchase/confirmation/normal-001`

### Allowed changes

- Display product, official description, 税込980円, quantity, allowed age group, fixture email, request summary, intended delivery method, unresolved delivery/payment-provider conditions, AI use, non-guarantee, draft refund summary, future required confirmations, safety status, and legal/contact links.
- State one-shot purchase and no automatic renewal; do not present a free/ad-supported alternative.
- Add correction links.
- Add disabled or non-button purchase-unavailable control and explanatory copy.

### Prohibited changes

- Card fields, payment method selector, provider logo, provider SDK, checkout session, mock charge, success page, webhook, or transaction record.
- Invented delivery SLA, provider, operator, refund timing, or support contact.
- Entry from any non-normal fixture.

### Fixture requirements

- `normal-001` references `request-normal-001` and uses `sample@example.invalid` or equivalent reserved-domain address.
- Purchase metadata contains no provider/customer/payment ID and no paid/succeeded state.
- Safety status is fixed as review-fixture `normal_allowed`, not server-verified.

### Acceptance criteria

- Every required final-confirmation field in the M1 spec is visible.
- Delivery timing is truthfully unresolved.
- Provider, payment method, and payment timing are truthfully unresolved.
- Future required confirmations are inspectable but not recorded; marketing consent is not required.
- Legal/contact links are present and review-labeled.
- Correction links have clear destinations.
- Primary control reads `購入機能は現在準備中です` and cannot transact.
- Direct blocked-state access is rejected.
- No payment-related network or storage activity occurs.
- No free-complete, ad-supported, subscription, or automatic-renewal path is present.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
rg -n "税込980円|1相談|1鑑定書|購入機能は現在準備中|提供時期" app components fixtures
rg -n "checkout|webhook|card|payment_intent|provider customer|fetch\(" app components fixtures
```

### Manual review evidence

- Phone and desktop confirmation screenshots.
- Keyboard access to every correction and legal link.
- Disabled/non-transactional control inspection.
- Network capture and storage inspection showing no transaction artifacts.

### Rollback boundary

Revert M1-I3; request/safety review states remain available and stop at request confirmation.

### Dependency

Human-accepted M1-I2 — satisfied at commit `de332b9f7911cb09ca2e3f7b26ef24c692dc2ae1` — plus explicit Human authorization of M1-I3.

### Next Human gate

Satisfied: Human accepted M1-I3 at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25` and separately authorized M1-I4.

## M1-I4: Sample Report and Fixture Result Experience

Implementation status: implemented, automatically validated, visually reviewed, and accepted by Human at commit `620792e61b002190aff100fd145e986b5ae4c89b`.

### Goal

Implement three deliberately differentiated review presentations: a fictional marketing sample, a production-shaped long Web鑑定ノート fixture, and an A4-oriented short-presentation fixture preview, now formally named 保存用判断カード, derived from the same structured result.

### Expected files/routes

- `app/sample-report/page.tsx`
- `app/page.tsx` only for replacing M1-I1 output-preview placeholders with accepted, non-interactive sample/Web/save preview components
- `app/review/result/[fixtureId]/page.tsx`
- `app/review/save-report/[fixtureId]/page.tsx`
- `app/review/error/missing-fixture/page.tsx`
- `app/review/error/unavailable-report/page.tsx`
- report/sample components under `components/report/` or `components/review/`
- save-report presentation components under the same bounded review component area
- `fixtures/review/reports.ts`
- `fixtures/review/errors.ts`

Routes completed:

- `/sample-report`
- `/review/result/result-normal-001`
- `/review/save-report/result-normal-001`
- `/review/error/missing-fixture`
- `/review/error/unavailable-report`

### Allowed changes

- Render approved report hierarchy and deterministic content.
- Render a save-oriented summary/recomposition from the same structured fixture without changing its judgment.
- Replace the LP's M1-I1 output-preview placeholders with concrete, deterministic Web鑑定ノート and short-presentation previews, now formally named 保存用判断カード; do not add an embedded form or a new submission path.
- Add sample/fixture labels and fixed disclaimers.
- Add missing fixture, loading placeholder, and unavailable report previews.
- Add three-way sample/Web/save comparison and return navigation.

### Prohibited changes

- OpenAI calls, prompt execution, DB lookup, real result token, email send, PDF/image generation, feedback persistence, or purchase claim.
- Download, browser-print implementation, save button, copy/share, generated-file claim, or Web-result screenshot reuse.
- Testimonials, ratings, or implied sales.
- Reuse of a sample as a supposedly delivered report.

### Fixture requirements

- `sample-report-g001`: 700–1,000-character fictional marketing sample.
- `result-normal-001`: 1,800–2,400-character production-shaped nine-section Web鑑定ノート fixture with the fixed normal judgment `今日は送らない方がいい` and its complete recommendation content.
- `/review/save-report/result-normal-001`: A4-oriented readable presentation of the same structured fixture, with conclusion, reason summary, review timing, change conditions, message draft when applicable, three-day direction, and fixed cautions.
- For wait/do-not-send outcomes, the save presentation's three-day direction and cautions preserve the waiting action, no-contact next option, later-message direction, and explicit uncertainty from the Web result.
- Fixed labels and disclaimer from the M1 spec.
- No real name, direct identifier, copied message, purchase date, provider ID, or token.

### Acceptance criteria

- Sample, Web result, and save report have different routes, labels, purposes, and information density.
- The LP shows concrete, non-interactive previews of both future paid presentations and links to the applicable review/sample destinations without claiming purchase or generation.
- Result contains all nine required sections and fixed disclaimer.
- The fixed `今日は送らない方がいい` fixture includes reason, review timing, change conditions, interim action, no-contact option, later message draft when applicable, and uncertainty. The shared schema/prompt contract applies the same completeness rule to every approved send/light-send/wait/do-not-send label; a single fixture does not contain multiple mutually exclusive judgments.
- Save report agrees with the Web judgment, is readable as a quick-reference surface, and is neither a screenshot nor a compressed full Web report.
- No PDF/image/download/copy/share function or generated-file claim exists.
- Fixture ID is visible and readable, not token-like.
- Unknown fixture ID fails safely without fallback.
- Long Japanese text is phone-readable and desktop line length is controlled.
- No AI, DB, email, payment, or analytics request occurs.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
rg -n "架空ケース|実在の相談者|審査用fixture|今夜の結論|この分析の限界|保存用鑑定書|再判断" app components fixtures
rg -n "openai|generate|supabase|result token|send email|fetch\(" app components fixtures
```

### Manual review evidence

- Phone/desktop screenshots of sample, Web fixture result, save-report fixture, missing fixture, loading, and unavailable states.
- Character-count record for sample and fixture report.
- Side-by-side content audit proving the Web and save presentations share one judgment but use different hierarchy/layout.
- URL/direct-navigation test for allowlisted and invalid fixture IDs.
- Network capture proving local deterministic rendering only.

### Rollback boundary

Revert M1-I4; earlier request and purchase-confirmation previews remain.

### Dependency

Human-accepted M1-I3 at commit `5cec9ea7ae0525a125ac8c3a8d90b48cefc4df25` plus explicit Human authorization of M1-I4 — satisfied.

### Next Human gate

Satisfied: Human accepted M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b` and separately authorized M1-I5.

## M1-I5: Legal, Disclosure and Contact Review Pages

Implementation status: Human-accepted with M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`.

### Goal

Create truthful review representations of legal, AI, safety, refund, Tokushoho, and contact structures without publishing draft substance as final or inventing operator/provider facts.

### Expected files/routes

- `app/legal/page.tsx`
- `app/legal/terms/page.tsx`
- `app/legal/privacy/page.tsx`
- `app/legal/tokushoho/page.tsx`
- `app/legal/refund/page.tsx`
- `app/legal/ai-disclosure/page.tsx`
- `app/legal/unsupported-cases/page.tsx`
- `app/contact/page.tsx`
- shared legal-status and legal-navigation components
- no modification to legal draft substance unless separately authorized

### Allowed changes

- Render fixed approved product facts.
- Keep the product/long/short terminology consistent as `恋のメッセージ鑑定ノート` / `Web鑑定ノート` / `保存用判断カード`, together with the two-level review banner and Web/save/legal/contact navigation.
- Show review/draft/publication status and unresolved-decision rows.
- Withhold fictional/unresolved operator values.
- Add global footer, confirmation, result, and safety links.
- Show supported contact categories and data-minimization warning without a handler.

### Prohibited changes

- Real or invented operator name, address, phone, email, form URL, response SLA, provider, payment method, delivery time, retention period, or effective date.
- Active form, `mailto:`, database write, email send, or legal-publication claim.
- Editing the legal draft substance to disguise unresolved issues.
- Expanding legal substance solely to implement Task M1-P1-R1; this slice's R1 impact is terminology and navigation/banner consistency only.

### Fixture requirements

No customer fixture. Page status metadata may be static and must identify unresolved decision IDs/categories, not personal values.

### Acceptance criteria

- `/legal` links to every required legal/contact page.
- Each page shows `審査用ドラフト表示`, `公開承認前・運営者情報未完了`, and `法的助言ではありません`.
- Fixed product facts remain consistent across routes.
- Unresolved operator/provider facts are withheld or status-labeled.
- Tokushoho cannot be mistaken for a complete purchase disclosure.
- Contact is visibly inactive and sends nothing.
- Safety and AI pages contain no false guarantee or unverified emergency information.
- Web/save-report links and the two-level review boundary remain consistent without implying a generated file or purchase.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
rg -n "審査用ドラフト表示|公開承認前|法的助言ではありません" app components
rg -n "\[\[.*TBD.*\]\]|mailto:|SUPPORT_EMAIL|OPERATOR_LEGAL_NAME|PAYMENT_PROVIDER" app components
rg -n "action=|fetch\(|server action|insert\(|send" app components
```

### Manual review evidence

- Route/link inventory with phone and desktop screenshots.
- Cross-page consistency table for product, price, quantity, age, AI, safety, and non-guarantee.
- Contact interaction test proving no submission path.
- Footer/confirmation/result/safety link checks.

### Rollback boundary

Revert M1-I5; report and flow previews remain, but legal/contact destinations return to the M1-I1 unavailable labels.

### Dependency

Human-accepted M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b` and Human-approved incomplete-field presentation decision — satisfied.

### Next Human gate

Satisfied: Human accepted M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391` and separately authorized M1-I6.

## M1-I6: Responsive, Accessibility and Visual QA Hardening

Implementation status: implemented and automatically validated under explicit Human authorization; not accepted by Human and formally closed as superseded by M1-P2.

### Goal

Harden the complete Milestone 1 review experience without adding product scope, routes, integrations, or new data behavior.

### Expected files/routes

- Existing M1 route and component files only where QA evidence identifies a defect.
- `app/globals.css` for scoped accessibility/responsive fixes.
- No new product route unless Human authorizes a defect-specific exception.

All M1 routes are in scope for review; no route is newly authorized by this slice.

### Allowed changes

- Focus, contrast, touch-target, label/error association, heading, reduced-motion, responsive overflow, long-text measure, and visual-consistency fixes.
- Broken internal link corrections.
- Copy correction only when required for approved review labels/boundaries.
- Preserve the existing non-fixed CTA design. Human decided the mobile fixed/sticky CTA is `rejected for Milestone 1`.

### Prohibited changes

- Redesigning product strategy, adding pages/features, altering fixture meaning, enabling integrations, or deciding operator facts.
- Adding a fixed/sticky CTA or using CTA polish to change the `/request` destination or product flow.
- Hiding legal/safety/AI limitations to improve visual polish.
- Browser-specific hacks without documented evidence.

### Fixture requirements

Reuse the accepted fixture set unchanged. A fixture-content change requires explicit explanation and state-matrix review.

### Acceptance criteria

- 320 px through desktop layouts have no unintended horizontal scroll.
- Keyboard order, visible focus, headings, labels, errors, status announcements, and disabled-control explanation pass manual review.
- Normal text, large text, and essential UI boundaries meet stated contrast targets.
- Touch targets meet 44 by 44 CSS pixels minimum.
- Safety meaning does not rely on color alone.
- Long Japanese report/legal content remains readable.
- All M1 routes and links work.
- Review labels remain visible and no runtime integration exists.
- Design critique confirms the result is specific to 月の返事.
- UX review records whether the experience reduces anxiety or amplifies it and whether the user retains agency.
- Long Web鑑定ノート reading and 保存用判断カード quick-reference readability are evaluated separately.
- Night-sky atmosphere and paper surfaces remain balanced without occult or cheap fortune-telling appearance.
- The implementation satisfies the generalized hierarchy principles while avoiding any reference-site-specific look, copy, image, circular-chart, color/font, distinctive shape, or exact-layout resemblance.
- Mobile fixed-CTA interference is evaluated against long-reading, viewport obstruction, keyboard/focus, and user-agency evidence. The acceptance record states `adopted`, `rejected`, or `deferred`; adoption requires explicit Human authorization and remains limited to the existing `/request` CTA.
- The complete experience does not resemble a generic AI product.

### Validation commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
git diff --name-only
rg -n "focus:|focus-visible:|aria-|role=|prefers-reduced-motion" app components
rg -n "fetch\(|app/api|server action|supabase|openai|checkout|webhook|analytics" app components fixtures
```

### Manual review evidence

- Route-by-route phone and desktop screenshot set.
- Keyboard-only walkthrough recording/checklist.
- Contrast measurements for primary text/actions/status panels.
- Touch-target measurements for primary and legal navigation.
- Network capture covering the complete review journey.
- Final list of known limitations and any deferred M2/M3 decisions.

### Rollback boundary

Revert M1-I6 only; accepted functional slices M1-I1 through M1-I5 remain unchanged.

### Dependency

Human-accepted M1-I5 and M1-I5-R1 at commit `7a232b8feef446200cde5425cb3a98eb683b4391`, plus explicit Human authorization of M1-I6 — satisfied.

### Formal disposition and carried-forward boundary

M1-I6 was not accepted by Human and is formally closed as superseded by M1-P2. Its implementation and evidence remain historical records. Its known defects are carried into M1-I7 through M1-I12 and final M1-I12 QA. This is not M1-I6 acceptance and does not complete Milestone 1. M1-P2 is accepted; the immediate gate is separate explicit Human authorization of M1-I7, not another M1-I6 Human Visual QA, disposition gate, or opportunistic M1-I6-R1 correction.

## M1-P2 Revision Slice Registry

Detailed direction and acceptance criteria are controlled by `M1_P2_EXPERIENCE_REVISION_PLAN.md`.

One-time execution exception: Human explicitly authorized M1-I7 through M1-I11 as one integrated implementation batch. For this batch only, CodeX used sequential internal checkpoints instead of stopping for Human acceptance between slices. Human later accepted the result as one integrated next-stage baseline; this does not create standalone acceptance records for the individual slices or complete Milestone 1. M1-I12 remains outside the exception and unauthorized.

Repository-wide inspection at base commit `38319adbe019826180db71e0b32302a000cc4a02` found no existing M1-P2 or M1-I7 through M1-I12 IDs. The IDs below therefore do not conflict. If a later conflict appears, stop and report it; do not rename an ID without Human direction.

### Shared M1-P2 boundaries

Every proposed slice M1-I7 through M1-I12 must preserve:

- the canonical product definition, `税込980円`, one-shot/no-renewal model, 18+ policy, AI disclosure, non-guarantee, and Safety-before-payment order;
- the 18+ restriction, Safety-before-payment order, `normal_allowed`-only continuation, acknowledgement meaning, and fail-closed handling for every blocked, invalid, contradictory, missing-consent, and unknown state;
- Safety fixtures, classification meaning, fail-closed behavior, the fixed result judgment, recommendation meaning, core scenario facts, Safety vocabulary, severity, and branching;
- presentation fixtures and schemas may be extended or reorganized only inside the separately authorized relevant slice, require Human review, and must not activate runtime behavior;
- deterministic fixture/mock or browser-memory-only operation with no transmission or persistence;
- the Milestone 1 rejection of a fixed/sticky mobile CTA;
- no real AI, DB/Supabase runtime, payment, email, active contact, API, server action, analytics, deployment, or file generation;
- no package, external design dependency, upload, OCR, copy, share, print, or download addition;
- clear public/review and draft/publication boundaries; and
- Human-only manual visual review in ordinary external Microsoft Edge, with no CodeX/agent Browser use, in-app browser, CDP, Playwright, Puppeteer, Selenium, GUI browser control, or screenshot acquisition.

### M1-I7: Brand Foundation

Status: implemented and automatically validated; Human-accepted as part of the integrated next-stage baseline, with no standalone acceptance record.

Goal: establish the shared 月の返事 visual system—token roles, typography hierarchy, spacing rhythm, surface roles, focus, contrast, and motion rules—without changing product content or behavior.

Dependency: Human acceptance of M1-P2 and explicit M1-I7 authorization were satisfied. The later one-time batch authorization allowed implementation to continue through M1-I11 without intermediate acceptance; Human accepted the resulting batch through one integrated baseline decision.

Acceptance boundary: Human accepted the representative brand, paper-note, worksheet, status, caution, and legal-document surfaces as part of the integrated baseline. This does not authorize further implementation or establish final Milestone 1 acceptance.

### M1-I8: Reading Note Product Redesign

Status: implemented and automatically validated; Human-accepted as part of the integrated next-stage baseline.

Goal: redesign the Web鑑定ノート and short presentation, now formally named 保存用判断カード, as the central product artifact using the accepted M1-I7 foundation.

Dependency: the normal M1-I7 acceptance pause was replaced for implementation only by the explicit integrated M1-I7 through M1-I11 batch authorization.

Acceptance boundary: the Web note follows the Human-approved 14-part structure in `M1_P2_EXPERIENCE_REVISION_PLAN.md`; scenario facts, fixed normal judgment, recommendation meaning, uncertainty/non-guarantee, and Safety/limitation meaning remain intact. The 保存用判断カード prioritizes tonight's answer, do/do-not guidance, message draft, next decision date, change conditions, and one remembered sentence; it is not a shortened Web-note duplicate. Human accepted both presentations as part of the integrated baseline. M1-I8-R1 Checkpoint A technical preparation is Human-accepted. Checkpoint B implements and automatically validates the approved Lunar Contrast presentation on its dedicated branch; Human Visual QA is pending.

### M1-I9: LP Redesign

Status: implemented and automatically validated; Human-accepted as part of the integrated next-stage baseline.

Goal: redesign the LP hierarchy and product story around the accepted reading-note artifact while preserving the offer, price, limitations, and request destination.

Dependency: the normal M1-I8 acceptance pause was replaced for implementation only by the explicit integrated M1-I7 through M1-I11 batch authorization.

Acceptance boundary: the LP follows the approved sequence—Hero, three answers, empathy/problem framing, Reading Note preview, three-step service flow, fictional sample, price, can/cannot-do, FAQ, final CTA—with the Reading Note as primary value proof. The first view shows purpose, `税込980円`, one consultation/one note, one-shot/no-renewal terms, and a non-fixed `/request` CTA. No fake evidence, embedded full form, hidden limitation, or fixed/sticky mobile CTA is introduced. Human accepted it as part of the integrated baseline. Any M1-I9-R1 implementation remains separately unauthorized.

### M1-I10: Request Sheet Redesign

Status: implemented and automatically validated; Human-accepted as part of the integrated next-stage baseline.

Goal: redesign the request experience as a calm guided worksheet around one large current-situation free-text field, relationship and what-to-know chips, 18+, Safety, one required acknowledgement, privacy guidance, and post-Safety email timing.

Dependency: the normal M1-I9 acceptance pause was replaced for implementation only by the explicit integrated M1-I7 through M1-I11 batch authorization.

Acceptance boundary: required input is the 18+ self-declaration, one large current-situation free-text field, relationship chips, what-to-know chips, Safety confirmation, and one required acknowledgement. The UI warns against personal identifiers, and email appears after request/Safety confirmation and before purchase confirmation. `このように受け取りました` remains a truthful fixture/review representation; no AI is executed or implied. Only `normal_allowed` continues; all blocked and unknown states remain fail closed. Human accepted this surface as part of the integrated baseline.

### M1-I11: Legal Review Redesign

Status: implemented and automatically validated; Human-accepted as part of the integrated next-stage baseline.

Goal: redesign legal/contact review presentation as coherent draft documents while preserving legal substance, unresolved decisions, inactive contact, and indexing boundaries.

Dependency: the normal M1-I10 acceptance pause was replaced for implementation only by the explicit integrated M1-I7 through M1-I11 batch authorization.

Acceptance boundary: legal/support screens use three layers—user-readable document body; publication-readiness checklist and unresolved Human decisions; collapsed review-only metadata such as Decision ID and source references. Review mode and future Public mode remain separate, legal substance and unresolved operator facts remain unchanged, and no fact is invented or limitation demoted. Human accepted this surface as part of the integrated baseline. Separate M1-I12 authorization is still required before M1-I12 can begin.

### M1-P3: Reading Note Visual Excellence Specification

Status: Human and ChatGPT accepted; documentation/design specification complete; not implementation authorization.

Purpose: lock the fixed Reading Note content and define information hierarchy, Figma/design handoff, typography, chapter archetypes, component anatomy, tokens, PC/390px-centered responsive specification with 768px reflow and 320px fallback, acceptance criteria, and implementation plan without changing content or judgment.

Dependencies: current integrated redesign baseline closure commit, clean working tree, and recorded Human decisions.

Out of scope: implementation, product facts, price, fixture judgment, Safety, request/legal redesign, real AI, DB, payment, email, API, deployment, external fonts, Storybook, visual regression tooling, PDF, download, share, print, or persistence.

Design-gate outcome: Human selected and accepted B — `Lunar Contrast Edition` as the canonical design direction and rejected A — `Quiet Editorial Letter`. Figma is optional non-authoritative reference material and is not required. Prototype acceptance alone was not canonical visual implementation authorization. The later separate Human instruction accepted Checkpoint A at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and authorized Checkpoint B within its exact manifest. Checkpoint B is now implemented and automatically validated on its dedicated branch; Human Visual QA remains pending.

### M1-P3-R1: Coded Visual Prototype Gate

Status: A/B prototypes implemented and automatically validated; B — `Lunar Contrast Edition` Human-selected and accepted, A — `Quiet Editorial Letter` rejected.

Goal: compare two real coded treatments of the same fixed `result-normal-001` subset and semantic order without changing canonical report components, fixtures, Safety, packages, runtime behavior, LP, Request UI, or Legal UI.

Routes: `/review/visual-excellence`, `/review/visual-excellence/a`, and `/review/visual-excellence/b`. The existing `/review/**` noindex/nofollow boundary remains controlling. A uses quiet editorial paper/typography; B uses a restrained Night/Paper contrast. Both demonstrate Identity/Cover, Decision/Answer, Letter/Narrative, Evidence/Interpretation, Action/Time, and Limits/Closing.

Next Human gate: review the implemented and automatically validated Checkpoint B / M1-I8-R1 Visual Excellence on its dedicated branch. Checkpoint B must not merge to `main` before Human Visual QA and acceptance. M1-I9-R1 and M1-I12 remain unauthorized. The prototype routes/components remain review-only and are not merged into `main`.

### M1-I12: Responsive, Accessibility and Final QA

Status: proposed; unauthorized.

Goal: perform evidence-led cross-surface responsive/accessibility hardening, reconcile the held defect inventory, and prepare the final Milestone 1 acceptance package without introducing a new design direction.

Dependency: integrated Human baseline acceptance of M1-I7 through M1-I11 is satisfied. Separate explicit authorization of M1-I12 is not satisfied.

Acceptance boundary: Human performs manual external-Edge review at approximately 320px, 390px, 768px/tablet, and desktop, including keyboard/focus and final contrast review. Automated evidence remains non-browser and separate. M1-I12 reconciles the carried M1-I6/M1-I6-R1 defect inventory but does not reopen or accept M1-I6 and does not itself complete Milestone 1.

## Final Sequence

```text
Task M1-P1 + Task M1-P1-R1 Human acceptance
  → M1-I1 Human acceptance
  → M1-I2 Human acceptance
  → M1-I3 Human acceptance
  → M1-I4 Human acceptance
  → M1-I5 Human acceptance
  → M1-I6 not accepted / formally closed as superseded by M1-P2
  → M1-P2 Human acceptance
  → one-time integrated M1-I7 through M1-I11 implementation authorization
  → M1-I7 through M1-I11 plus bounded public-sample corrections accepted as one integrated baseline
  → M1-P3 documentation/design specification Human and ChatGPT accepted
  → M1-P3-R1 preflight stop before coded visual prototype implementation on SEM-UNSUPPORTED-CASES
  → M1-I2-R1 bounded Safety correction automated PASS
  → M1-I2-R1 Human acceptance; M1-P3-R1 hard stop resolved
  → M1-P3-R1 coded A/B prototypes implemented and automatically validated
  → Human selects and accepts B — Lunar Contrast Edition; A — Quiet Editorial Letter rejected; Figma optional and non-authoritative
  → Checkpoint A Technical Preparation separately authorized and implemented only within its exact manifest
  → Checkpoint A Human acceptance and `main` synchronization
  → Checkpoint B separately authorized, implemented, and automatically validated on its dedicated branch
  → Checkpoint B Human Visual QA and acceptance
  → separately authorized and accepted M1-I12
  → final Milestone 1 completion review
```

Current state: M1-I5 and M1-I5-R1 are Human-accepted. M1-I6 was not accepted and is formally closed as superseded by M1-P2; its implementation and evidence remain historical. M1-P2 documentation is Human-accepted. Human accepted the one-time M1-I7 through M1-I11 batch plus M1-P2-R1 and M1-P2-R1-R1 as one integrated next-stage baseline. M1-P3 is Human and ChatGPT accepted as the authoritative, complete documentation/design specification. M1-I2-R1 is implemented, automatically validated, Human-accepted, and synchronized to `main`. M1-P3-R1 A/B coded visual prototypes are implemented and automatically validated; B — `Lunar Contrast Edition` is Human-selected and accepted, A — `Quiet Editorial Letter` is rejected, and Figma is optional/non-authoritative. Checkpoint A is Human-accepted at implementation commit `7977f09eca733168c8bac3ae20670c21fa00cbda` and synchronized to `main` at `79011f274c35a0cf80f68af845ffaca95e8884c9`. Checkpoint B is implemented and automatically validated on `feat/m1-i8-r1-checkpoint-b-lunar-contrast`; Human Visual QA is pending and it remains off `main`. M1-I9-R1 and M1-I12 remain unauthorized and unimplemented. The prototype UI is not merged into `main`. Milestone 1 is not complete, Milestone 2 remains unauthorized, and CodeX/agent Browser use and screenshots are prohibited.
