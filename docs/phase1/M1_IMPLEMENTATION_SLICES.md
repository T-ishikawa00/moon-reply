# M1_IMPLEMENTATION_SLICES.md

## 0. Status and Execution Rule

- Planning output for Task M1-P1
- No slice is authorized by this document
- Human acceptance of Task M1-P1 is required before any slice starts
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
- fake users, reviews, purchases, metrics, provider responses, or delivery evidence; and
- subscription, login, account, coins, points, or native-app scope.

## M1-I1: Route Shell and Review Navigation

### Goal

Create the shared review-mode shell, route index, global navigation, footer, and unmistakable review boundary without implementing request outcomes, purchase confirmation, reports, or legal page bodies.

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
- Add global header/footer and legal/sample/contact/review links.
- Add persistent review banner for `/review/**` shell.
- Add static route/state inventory with `not implemented in this slice` labels.
- Preserve the existing `/request` route and behavior.

### Prohibited changes

- Request-form state redesign.
- Safety-state routes.
- Fixture data files.
- Purchase confirmation, sample/report, or legal route bodies.
- Active analytics or deployment configuration.

### Fixture requirements

None. The review hub uses static route metadata only and must not claim that fixtures exist yet.

### Acceptance criteria

- `/` describes the product, 税込980円, one report, AI use, safety-before-payment, limitations, and payment-unavailable status.
- `/review` clearly identifies itself as a review index.
- The review banner uses the Human-approved wording.
- Header/footer navigation is keyboard accessible and contains no dead link presented as complete; unavailable slices are labeled.
- No login/account or active-purchase control appears.
- Existing `/request` remains local-only.

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

Task M1-P1 Human acceptance.

### Next Human gate

Human accepts M1-I1 before M1-I2 starts.

## M1-I2: Request Confirmation and Safety Review States

### Goal

Align the review experience with the approved safety rule: only `normal_allowed` reaches request confirmation; `needs_review`, `rejected`, invalid age, missing consent, contradictory input, and unknown/error states stop safely and remain deterministically inspectable.

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
- Add typed deterministic fixtures under `fixtures/review/`.
- Add review-only route allowlist and unknown-state failure.
- Add request summary and correction links for the normal fixture.
- Make `needs_review` a stop state for the initial MVP review experience.

### Prohibited changes

- Change rule severity or approved age choices.
- Add server validation, persistence, API routes, server actions, or network calls.
- Add payment or ordinary report links to non-normal states.
- Present fixtures as actual submissions.

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

Human-accepted M1-I1.

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

Human-accepted M1-I2.

### Next Human gate

Human accepts M1-I3 before M1-I4 starts.

## M1-I4: Sample Report and Fixture Result Experience

### Goal

Implement two deliberately separate artifacts: a fictional marketing sample and a production-shaped fixture result for UI/delivery review.

### Expected files/routes

- `app/sample-report/page.tsx`
- `app/review/result/[fixtureId]/page.tsx`
- `app/review/error/missing-fixture/page.tsx`
- `app/review/error/unavailable-report/page.tsx`
- report/sample components under `components/report/` or `components/review/`
- future `fixtures/review/reports.ts`
- future `fixtures/review/errors.ts`

Routes completed:

- `/sample-report`
- `/review/result/result-normal-001`
- `/review/error/missing-fixture`
- `/review/error/unavailable-report`

### Allowed changes

- Render approved report hierarchy and deterministic content.
- Add sample/fixture labels and fixed disclaimers.
- Add missing fixture, loading placeholder, and unavailable report previews.
- Add links for sample/result comparison and return navigation.

### Prohibited changes

- OpenAI calls, prompt execution, DB lookup, real result token, email send, PDF/image generation, feedback persistence, or purchase claim.
- Testimonials, ratings, or implied sales.
- Reuse of a sample as a supposedly delivered report.

### Fixture requirements

- `sample-report-g001`: 700–1,000-character fictional marketing sample.
- `result-normal-001`: 1,800–2,400-character production-shaped nine-section fixture.
- Fixed labels and disclaimer from the M1 spec.
- No real name, direct identifier, copied message, purchase date, provider ID, or token.

### Acceptance criteria

- Sample and fixture result have different routes, labels, purpose, and content length.
- Result contains all nine required sections and fixed disclaimer.
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
rg -n "架空ケース|実在の相談者|審査用fixture|今夜の結論|この分析の限界" app components fixtures
rg -n "openai|generate|supabase|result token|send email|fetch\(" app components fixtures
```

### Manual review evidence

- Phone/desktop screenshots of sample, fixture result, missing fixture, loading, and unavailable states.
- Character-count record for sample and fixture report.
- URL/direct-navigation test for allowlisted and invalid fixture IDs.
- Network capture proving local deterministic rendering only.

### Rollback boundary

Revert M1-I4; earlier request and purchase-confirmation previews remain.

### Dependency

Human-accepted M1-I3.

### Next Human gate

Human accepts M1-I4 before M1-I5 starts.

## M1-I5: Legal, Disclosure and Contact Review Pages

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
- Show review/draft/publication status and unresolved-decision rows.
- Withhold fictional/unresolved operator values.
- Add global footer, confirmation, result, and safety links.
- Show supported contact categories and data-minimization warning without a handler.

### Prohibited changes

- Real or invented operator name, address, phone, email, form URL, response SLA, provider, payment method, delivery time, retention period, or effective date.
- Active form, `mailto:`, database write, email send, or legal-publication claim.
- Editing the legal draft substance to disguise unresolved issues.

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

Human-accepted M1-I4 and Human-approved incomplete-field presentation decision.

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

### Prohibited changes

- Redesigning product strategy, adding pages/features, altering fixture meaning, enabling integrations, or deciding operator facts.
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
Task M1-P1 Human acceptance
  → M1-I1 Human acceptance
  → M1-I2 Human acceptance
  → M1-I3 Human acceptance
  → M1-I4 Human acceptance
  → M1-I5 Human acceptance
  → M1-I6 Human acceptance
  → Milestone 1 completion review
```

The next task after Task M1-P1 acceptance is M1-I1 only, subject to explicit Human authorization.
