# M1_IMPLEMENTATION_SLICES.md

## 0. Status and Execution Rule

- Planning output for Task M1-P1, aligned by Task M1-P1-R1
- No slice is authorized by this document
- Human acceptance of the planning package and the preceding slice, plus separate explicit authorization, is required before each slice starts
- Human accepted M1-I4 at commit `620792e61b002190aff100fd145e986b5ae4c89b`, explicitly authorized M1-I5, and approved the incomplete-field presentation rule; M1-I6 remains unauthorized
- Each slice is one bounded task, one commit, validation evidence, and one Human gate
- A later slice must not be pulled into an earlier commit because a shared component is convenient

The proposed six-slice structure is retained. Repository inspection supports it because the current app has only `/`, `/request`, and one request-form component. Separating route/navigation, safety/confirmation, purchase confirmation, report fixtures, legal/contact pages, and QA prevents a large unverifiable page bundle and preserves the approved dependency chain.

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
- Include review-hub link metadata for the Web鑑定ノート and 保存用鑑定書 previews, clearly labeled as later M1-I4 scope.
- Add static route/state inventory with `not implemented in this slice` labels.
- Preserve the existing `/request` route and behavior.
- Do not commit final font/color choices; fixed mobile CTA remains an M1-I6 decision candidate.
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

Implement three deliberately differentiated review presentations: a fictional marketing sample, a production-shaped long Web鑑定ノート fixture, and an A4-oriented 保存用鑑定書 fixture preview derived from the same structured result.

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
- Replace the LP's M1-I1 output-preview placeholders with concrete, deterministic Web鑑定ノート and 保存用鑑定書 previews; do not add an embedded form or a new submission path.
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

Implementation status: implemented and automatically validated under explicit Human authorization; awaiting Human review and acceptance.

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
- Keep `月の返事 鑑定ノート` / `保存用鑑定書` terminology, two-level review banner, and Web/save/legal/contact navigation consistent.
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

Human accepts M1-I5 before M1-I6 starts.

## M1-I6: Responsive, Accessibility and Visual QA Hardening

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
- Evaluate the mobile fixed-CTA candidate through a Human-approved Visual QA variant. No fixed CTA is committed unless the Human explicitly authorizes adoption within M1-I6 after reviewing interference evidence; otherwise the non-fixed CTA design remains.

### Prohibited changes

- Redesigning product strategy, adding pages/features beyond the explicitly gated fixed-CTA decision above, altering fixture meaning, enabling integrations, or deciding operator facts.
- Adding a fixed CTA without the M1-I6 Human gate or using it to change the `/request` destination/product flow.
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
- Long Web鑑定ノート reading and 保存用鑑定書 quick-reference readability are evaluated separately.
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

Human-accepted M1-I5.

### Next Human gate

Human acceptance of M1-I6 closes Milestone 1 implementation/validation only after the complete Milestone 1 exit evidence is reviewed. It does not authorize Milestone 2 automatically.

## Final Sequence

```text
Task M1-P1 + Task M1-P1-R1 Human acceptance
  → M1-I1 Human acceptance
  → M1-I2 Human acceptance
  → M1-I3 Human acceptance
  → M1-I4 Human acceptance
  → M1-I5 Human acceptance
  → M1-I6 Human acceptance
  → Milestone 1 completion review
```

Current state: M1-I5 is implemented and automatically validated, awaiting Human review. M1-I6 remains unauthorized and cannot start until Human accepts M1-I5 and separately authorizes M1-I6.
