# M1-P2 Experience & Visual Direction Revision Plan

## 1. Status and authority

- Task: `M1-P2 Experience & Visual Direction Revision`.
- Current phase: Phase 1 / Milestone 1 post-M1-P2 authorization gate.
- Status: accepted by Human; implementation remains unauthorized.
- Base commit for this planning task: `38319adbe019826180db71e0b32302a000cc4a02`.
- M1-I6 was not accepted by Human and is formally closed as superseded by M1-P2.
- Its implementation and evidence remain historical records.
- Its known defects, including the contemplated M1-I6-R1 corrections, are carried into M1-I7 through M1-I12 and final M1-I12 QA.
- This is not M1-I6 acceptance and does not complete Milestone 1. No further M1-I6 Human Visual QA or disposition gate is required.
- M1-P2 is a planning task. Creating or accepting this document does not authorize implementation.
- M1-I7 is not yet authorized or implemented.
- Every proposed implementation slice requires separate explicit Human authorization before work starts and separate Human acceptance before the next slice can be authorized.
- Milestone 1 remains incomplete. This revision stays inside Milestone 1 and does not advance the project to Milestone 2.
- Milestone 2 and every later milestone remain unauthorized.
- `docs/ROADMAP.md` continues to control product definition, milestone order, and initial paid Web MVP completion.

Repository-wide ID inspection at the base commit found no existing use of `M1-P2` or `M1-I7` through `M1-I12`. The proposed IDs therefore do not conflict at the time of planning. A later conflict must be reported to Human; no agent may silently rename an ID.

## 2. Background

M1-I1 through M1-I5 and M1-I5-R1 established and Human-accepted the review shell, request states, payment-free confirmation, report fixtures, and legal/contact review pages. M1-I6 then applied bounded responsive, accessibility, terminology, indexing, and visual hardening.

M1-I6 review background:

- Partial Human visual review was performed manually in external Edge.
- It identified unresolved visual/accessibility defects and broader product-experience concerns.
- Full cross-width and keyboard QA was not completed.
- Human chose M1-P2 redesign instead of an isolated M1-I6-R1 correction.

Human has determined that the next issue is broader than a list of isolated M1-I6 micro-corrections. The product experience needs a coherent revision across the brand system, the reading note, the LP, the request sheet, and legal review screens. Continuing a narrow M1-I6-R1 polish pass before fixing that hierarchy would risk refining surfaces that are about to be restructured.

M1-P2 therefore documents a controlled Milestone 1 redesign lane. It preserves product facts, Safety meaning, fail-closed behavior, fixed judgment, core scenario facts, and runtime boundaries while reopening customer-facing experience architecture, presentation fixtures, field composition, and visual direction for separately authorized Human-gated implementation slices.

## 3. Confirmed Human design direction

The following direction is confirmed by Human and controls this plan:

1. Do not proceed with the currently contemplated fine M1-I6-R1 corrections.
2. Redesign the product experience and UI as a connected system rather than as unrelated page-level polish.
3. Redesign the Web reading note and its save-oriented companion as the central paid-product artifact.
4. Redesign the LP so that it sells and explains that artifact clearly and truthfully.
5. Redesign the request sheet so that it feels like a calm guided worksheet while preserving the 18+ restriction, acknowledgement meaning, Safety-before-payment order, fail-closed behavior, and runtime boundary.
6. Redesign the legal review experience so that draft status, fixed facts, and unresolved facts are understandable without looking like either a finished publication or an internal engineering dashboard.
7. Keep this work within Milestone 1.
8. Do not change product specification, price, Safety meaning, classification meaning, fixed judgment, core scenario facts, or runtime boundaries.

Sections 6 through 10 translate this confirmed direction into the Human-accepted implementation brief. Implementation remains separately gated by slice.

## 4. Product facts that remain fixed

| Topic | Fixed fact |
| --- | --- |
| Canonical category | `AIを活用した恋愛メッセージ分析・判断支援デジタルレポート` |
| User-facing product | `恋のメッセージ鑑定ノート` |
| Unit | 1 consultation / 1 reading note |
| Price | JPY 980, tax included |
| Commercial model | One-shot purchase; no automatic renewal, subscription, coins, points, or tickets |
| Audience | Users aged 18 or older under the accepted self-declared age-group policy |
| AI disclosure | AI use is disclosed; the service does not guarantee the other person's feelings, future behavior, or a relationship outcome |
| Safety order | Safety enforcement occurs before payment |
| Safety continuation | Only `normal_allowed` can continue; `needs_review` and `rejected` stop; invalid, contradictory, missing-consent, and unknown states fail closed |
| Milestone 1 transaction state | Payment remains unavailable and the purchase action remains disabled or preparation-only |
| Delivered-product model | A long Web鑑定ノート and a distinct save-oriented 鑑定書 presentation, not one duplicated layout |
| Safety and scenario contract | Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, recommendation meaning, and core scenario facts remain unchanged |
| Presentation change control | Presentation fixtures and schemas may be extended or reorganized only inside the separately authorized relevant slice, require Human review, and must not activate runtime behavior |
| Fixed normal result | The accepted `result-normal-001` judgment and its complete recommendation meaning remain unchanged |
| Mobile CTA | A fixed/sticky mobile CTA is rejected for Milestone 1; only non-fixed CTAs are allowed |

Visual redesign may change hierarchy, spacing, composition, component presentation, and responsive arrangement. It must not change any fact or behavioral contract in this table.

## 5. Runtime boundary

M1-P2 and all proposed M1-P2 implementation slices retain the current Milestone 1 runtime boundary:

- deterministic fixture/mock data and browser-memory-only request state;
- no form-state transmission or persistence;
- no real AI or OpenAI call;
- no production or public DB/Supabase read or write;
- no payment, checkout, provider SDK, webhook, refund transaction, or paid state;
- no email sending or active contact submission;
- no API route, server action, analytics, external form, or deployment;
- no file, PDF, or image generation and no download, copy, share, print, upload, OCR, or image-analysis behavior;
- no package addition or external design dependency;
- no change to `lib/safety`, Safety fixtures, classification meaning, Safety vocabulary, severity, branching, fail-closed behavior, fixed judgment, or core scenario facts; and
- presentation fixture or schema extensions only inside the separately authorized relevant slice, with Human review and no runtime activation.

Existing dormant foundations do not become active merely because a redesigned screen refers to a future service step. All future-state copy must remain explicitly non-operational.

## 6. Global brand UI principles

1. **Product artifact before software chrome.** 月の返事 should feel like a considered editorial reading product, not a generic AI dashboard, chat interface, admin console, or collection of interchangeable cards.
2. **Restrained lunar atmosphere.** Deep navy, ivory/paper, and pale gold remain the core direction. The result must avoid occult symbols, cheap fortune-telling cues, excessive glow, decorative astrology, or theatrical mysticism.
3. **Hierarchy before decoration.** Typography, spacing, measure, section rhythm, and a small number of surface types should establish priority before borders, badges, shadows, or color blocks are added.
4. **The note is the visual nucleus.** LP previews, request framing, and supporting pages should point toward the 鑑定ノート as the product, rather than making the form or AI technology the hero.
5. **Calm agency.** The interface should reduce anxiety, state uncertainty honestly, and leave decisions with the user. It must not use urgency, emotional coercion, guaranteed outcomes, or manipulative CTA repetition.
6. **One primary action per decision point.** Secondary navigation remains visibly secondary. Fixed/sticky mobile CTA behavior is not used in Milestone 1.
7. **Few reusable surface roles.** Define and consistently use brand, paper-note, worksheet, status, caution, and legal-document surfaces. Avoid a page-specific proliferation of card styles.
8. **Public and review language stay separate.** Public pages use customer-readable product language. Technical fixture, route, slice, and review metadata stays inside clearly marked review-only regions.
9. **Mobile is a first-class reading layout.** Narrow screens must preserve reading rhythm, tap targets, and visible focus without compressing the note into dense cards or covering content with fixed actions.
10. **Accessibility is structural.** Semantic landmarks, heading order, labels, errors, status text, keyboard order, focus visibility, touch targets, contrast, and reduced-motion behavior are designed with the composition, not patched at the end.

## 7. Reading note redesign

The Web鑑定ノート is the primary product experience and must establish the visual grammar used elsewhere.

### Required direction

- Present one authored note with clear reading progression, not a dashboard of equal-weight modules.
- Make the conclusion and immediate recommended action quickly findable without reducing the rationale, uncertainty, timing, change conditions, message guidance, three-day direction, or cautions.
- Use editorial section rhythm, controlled line length, restrained dividers, and a limited note-surface hierarchy. Repeated bordered cards must have a defined information role rather than being the default container.
- Keep the review/fixture boundary clear without allowing review metadata to dominate the product artifact.
- Keep uncertainty and limitations legible near the advice they qualify; do not bury them solely in the footer.
- Treat the 保存用鑑定書 as a purpose-built save-oriented note. It must remain visually and functionally distinct from the long Web note and must not be a shortened duplicate.
- Do not imply PDF/image generation, download, printing, copying, sharing, purchase, AI execution, or delivery.

### Human-approved structure

1. Cover
2. Short letter from 月の返事
3. 今夜の答え
4. この鑑定の読み方
5. 今の関係をほどく
6. 相手にどう届く可能性があるか
7. 不安の核
8. 文面の温度
9. 今夜の推奨アクション
10. 送る場合の文面案
11. 3日間の月明かりプラン
12. 方針を変える条件
13. まだ断定できないこと
14. 月の返事からの締め

The redesign must preserve scenario facts, the fixed normal judgment, recommendation meaning, uncertainty/non-guarantee, and Safety and limitation meaning.

Within separately authorized M1-I8, section count, section names, section order, customer-facing copy, presentation hierarchy, fixture presentation schema/content, and visual composition may change. Fixture IDs and core scenario facts may remain stable, but fixture additions or schema extensions required for the approved structure are allowed only within M1-I8 and require Human review.

### Save-oriented note purpose

The save-oriented note prioritizes:

- 今夜の答え;
- 今やること;
- やらないこと;
- 文面案;
- 次の判断日;
- 方針を変える条件; and
- 今夜覚えておく一文.

It is not a shortened duplicate of the Web note.

### Experience outcome

A reviewer should be able to answer three questions without explanation: what the conclusion is, why the conclusion was reached, and what the user can do next. A longer read should still feel coherent, calm, and specific to 月の返事.

## 8. LP redesign

The LP must explain and sell the reading-note product without looking like a generic AI landing page.

### Required direction

- The first view states the product purpose, `税込980円`, one consultation/one note, one-shot/no-renewal model, and a non-fixed CTA to `/request`.
- The 鑑定ノート preview should be the strongest proof of product value. It must be recognizable as an artifact, not as decorative cards or an AI-feature list.
- AI remains a disclosed method, not the main brand promise.
- Show both the long Web note and save-oriented presentation with truthful, customer-readable labels and clear differences.
- Keep `/request` separate; do not embed the full request sheet in the LP.
- Preserve all truthful limitations, payment-unavailable status, and 18+ boundary.
- Use no fake reviews, sales counts, ratings, provider approval, operator facts, urgency, discounts, free-complete-reading claim, or advertising promise.
- Preserve non-fixed CTA placement. No sticky, floating, or fixed-bottom mobile CTA may be introduced.
- Reduce repeated cards, repeated explanations, oversized headings, excessive whitespace, technical/review terms, and excessive English eyebrows.

### Human-approved LP sequence

1. Hero
2. Three answers the user receives
3. Empathy/problem framing
4. Reading-note artifact preview
5. Three-step service flow
6. Fictional sample
7. Price
8. What the service can and cannot do
9. FAQ
10. Final CTA

The reading-note artifact is the primary value proof.

## 9. Request sheet redesign

The request experience should feel like a calm, guided worksheet that helps the user organize context before a reading.

### Required direction

- Use clear section purpose, progress, field grouping, and plain guidance rather than a dense application-form or admin-console appearance.
- Make correction paths, first-error focus, labels, descriptions, and status messages unambiguous and keyboard reachable.
- Present Safety questions with calm seriousness. Do not reduce visibility, change severity, soften a stop into a continuation, or use color as the only state signal.
- Add no file/image input, OCR, automatic masking, persistence, transmission, or active submission.

### Human-approved user-facing input

Required:

- 18+ self-declaration;
- one large free-text field for current situation;
- relationship chips;
- what-do-you-want-to-know chips;
- Safety confirmation; and
- one required acknowledgement.

Optional:

- nickname;
- actual partner message;
- intended message; and
- urgency, only if retained after design review.

The sheet must clearly warn users not to enter real names, addresses, phone numbers, employer/school details, or account IDs.

Email is collected after request/Safety confirmation and before purchase confirmation. It must not be requested at the beginning of the consultation sheet.

Future AI will structure free-text internally. Milestone 1 may show a truthful fixture/review representation using `このように受け取りました`, but it must not execute AI or pretend that AI processing occurred.

Within separately authorized M1-I10, the visible field set, grouping, number of user-facing steps, field order, age-band UI, confirmation composition, and fixture schema required to represent this UX may change.

M1-I10 must preserve the 18+ restriction, Safety before payment, `normal_allowed`-only continuation, fail-closed handling for `needs_review`, `rejected`, invalid, contradictory, missing-consent, and unknown states, acknowledgement meaning, and the prohibition on persistence, transmission, real AI, and payment.

Existing detailed fields may be removed from the primary UI, merged into free-text, or retained internally only when justified. They are not immutable product requirements.

## 10. Legal review redesign

Legal and contact screens should read as coherent draft documents with an explicit review boundary, not as completed public legal pages and not as raw internal status dashboards.

### Required direction

- Preserve `/legal`, Terms, Privacy, Tokushoho, Refund, AI disclosure, Unsupported Cases, and inactive Contact routes.
- Keep `審査用ドラフト表示`, `公開承認前・運営者情報未完了`, and `法的助言ではありません` visible and understandable.
- Use restrained document navigation, readable long-form measure, meaningful headings, responsive rows, and a persistent but non-obscuring current-page indication.
- Withhold or status-label unresolved operator, provider, contact, address, phone, delivery, retention, effective-date, and response-time facts. Do not invent values.
- Keep contact visibly inactive with no form, input, button, `mailto:`, endpoint, or implied response SLA.
- Preserve Safety and AI limitations and do not visually demote them to make the product appear more certain.
- Retain `noindex, nofollow` review/publication boundaries without presenting metadata as proof of external index removal.

### Human-approved three-layer structure

Layer 1:

- user-readable legal/support document body.

Layer 2:

- publication-readiness checklist and unresolved Human decisions.

Layer 3:

- collapsed review-only metadata such as Decision ID and source references.

Each page has one primary status. Decision IDs must not appear repeatedly inside the reading flow. `/legal` uses a document-index list rather than a repeated card grid. Review metadata is collapsed and subordinate. English uppercase labels, dashed metadata cards, and repeated status badges are minimized. Review mode now and future Public mode are defined separately. Legal substance and unresolved operator facts remain unchanged.

## 11. Known defects carried forward

M1-I6 was not accepted and is closed as superseded by M1-P2. It has no remaining Human Visual QA, acceptance, or disposition gate. Its implementation and automated evidence remain historical records.

The following defects and incomplete checks are carried into the relevant M1-I7 through M1-I12 slices and final M1-I12 QA:

- unresolved visual/accessibility defects and broader product-experience concerns identified during partial Human review;
- incomplete cross-width review at approximately 320px, 390px, 768px/tablet, and desktop;
- incomplete keyboard-only walkthrough and actual focus observation;
- incomplete final visual contrast judgment under real display and antialiasing conditions;
- limits of source and rendered-HTML checks for pixel-level wrapping, clipping, and horizontal overflow; and
- the contemplated M1-I6-R1 micro-correction backlog, reconciled against the new design direction rather than patched as an isolated correction.

Each carried item must be assigned to the separately authorized relevant slice and resolved or explicitly deferred with Human rationale by final M1-I12 QA. This does not reopen M1-I6 or convert its closure into acceptance.

## 12. Out of scope

- reopening M1-I6, treating its closure as acceptance, or completing Milestone 1 by documentation alone;
- implementation of M1-I6-R1 or any M1-I7 through M1-I12 slice;
- product-definition, price, age-policy, Safety meaning, classification meaning, fixed judgment, recommendation-meaning, or core-scenario changes;
- new product routes, new runtime states, new required consent, or an activated purchase flow;
- fixed/sticky/floating mobile CTA;
- real AI, OpenAI, DB/Supabase runtime, persistence, payment, provider integration, refund transaction, email, active contact, API, server action, analytics, or deployment;
- package, external font, external asset, tracking, or design-system dependency additions;
- presentation fixture/schema changes outside the separately authorized relevant slice, Safety fixture/rule edits, prompt execution, legal-substance decisions, or operator/provider decisions;
- file/PDF/image generation, download, print, copy, share, upload, OCR, or image analysis;
- Milestone 2 or later milestone work; and
- branch creation, PR creation, force push, browser use, or screenshot acquisition as part of this documentation task.

## 13. Proposed implementation slices

The following IDs are proposed because the repository-wide conflict check found no duplicates:

| Slice | Name | Bounded outcome |
| --- | --- | --- |
| M1-I7 | Brand Foundation | Establish the accepted visual system, token roles, typography hierarchy, spacing rhythm, surface roles, and shared primitives without changing product behavior. |
| M1-I8 | Reading Note Product Redesign | Redesign the Web鑑定ノート and save-oriented note around the approved structure and accepted brand foundation while preserving fixed judgment, recommendation meaning, Safety/limitations, and core scenario facts. |
| M1-I9 | LP Redesign | Rebuild LP hierarchy and product storytelling around the redesigned reading-note artifact while preserving offer, limits, and CTA destinations. |
| M1-I10 | Request Sheet Redesign | Redesign the request experience around the approved free-text/chip input, privacy warning, email timing, and truthful fixture representation while preserving 18+, Safety, fail-closed, acknowledgement, and runtime boundaries. |
| M1-I11 | Legal Review Redesign | Redesign legal/contact review presentation without changing legal substance, unresolved decisions, indexing boundaries, or inactive status. |
| M1-I12 | Responsive, Accessibility and Final QA | Perform cross-surface responsive/accessibility hardening, reconcile carried defects, and prepare the complete Milestone 1 Human acceptance package. |

Listing these slices does not authorize any of them.

## 14. Slice dependencies

The dependency chain is sequential:

```text
M1-P2 Human acceptance
  -> explicit M1-I7 authorization
  -> M1-I7 Human acceptance
  -> explicit M1-I8 authorization
  -> M1-I8 Human acceptance
  -> explicit M1-I9 authorization
  -> M1-I9 Human acceptance
  -> explicit M1-I10 authorization
  -> M1-I10 Human acceptance
  -> explicit M1-I11 authorization
  -> M1-I11 Human acceptance
  -> explicit M1-I12 authorization
  -> M1-I12 Human acceptance
  -> explicit final Milestone 1 acceptance review
```

- M1-I7 is the visual-system dependency for every later redesign slice.
- M1-I8 precedes M1-I9 so the LP advertises an accepted product artifact rather than inventing a preview before the product surface is settled.
- M1-I9, M1-I10, and M1-I11 remain separate Human-reviewable product surfaces even when they reuse M1-I7 primitives.
- M1-I12 starts only after M1-I7 through M1-I11 are Human-accepted; it may fix evidenced cross-surface defects but may not introduce a new visual direction or product behavior.
- No dependency or shared component permits work from a later slice to be pulled forward.
- M1-I6 is already formally closed as superseded by M1-P2 without Human acceptance. No later M1-I6 disposition gate exists.

## 15. Per-slice acceptance criteria

### M1-I7 Brand Foundation

- A small, documented set of color, typography, spacing, radius, border, shadow, focus, and motion roles supports brand, paper-note, worksheet, status, caution, and legal-document surfaces.
- Shared primitives express an unmistakable 月の返事 hierarchy without an AI-dashboard, chat, generic SaaS, or cheap fortune-telling appearance.
- Existing route behavior, content meaning, CTA destinations, Safety fixtures, classification meaning, fixed judgment, core scenario facts, and runtime behavior remain unchanged.
- Public and review-only metadata treatments are distinct.
- Focus, contrast, reduced-motion, and touch-target rules are defined with the foundation.
- Human reviews representative shared surfaces in ordinary external Edge and explicitly accepts M1-I7 before M1-I8 authorization.

### M1-I8 Reading Note Product Redesign

- The Web鑑定ノート reads as one coherent editorial product using the approved 14-part structure in Section 7.
- Scenario facts, the fixed normal judgment, recommendation meaning, uncertainty/non-guarantee, and Safety/limitation meaning remain intact.
- Section count, names, order, customer-facing copy, hierarchy, visual composition, and presentation fixture/schema may change only within M1-I8 and require Human review.
- The Web and save-oriented presentations have clearly different purposes and information density; the save-oriented note is not a shortened duplicate.
- Review metadata remains subordinate but visible; no purchase, generation, delivery, download, print, copy, or share claim is added.
- Long Japanese text remains readable at narrow and desktop measures with semantic heading order.
- Human reviews the long and save-oriented experiences separately in ordinary external Edge and explicitly accepts M1-I8 before M1-I9 authorization.

### M1-I9 LP Redesign

- The first view communicates purpose, `税込980円`, one consultation/one note, one-shot/no-renewal terms, and a non-fixed `/request` CTA.
- Page sequence follows the approved ten-part architecture in Section 8 and makes the reading-note artifact, not AI technology or the form, the principal value proof.
- Web and save-oriented previews agree with the accepted M1-I8 design and do not claim real generation or purchase.
- Safety, limitations, 18+ status, payment-unavailable status, and legal/support boundaries remain visible.
- No fake evidence, manipulative urgency, embedded full request sheet, or fixed/sticky mobile CTA is added.
- Human reviews phone and desktop LP hierarchy in ordinary external Edge and explicitly accepts M1-I9 before M1-I10 authorization.

### M1-I10 Request Sheet Redesign

- Required input is the 18+ self-declaration, one large current-situation free-text field, relationship chips, what-to-know chips, Safety confirmation, and one required acknowledgement; optional input follows Section 9.
- The sheet clearly warns against real names, addresses, phone numbers, employer/school details, and account IDs.
- Email appears only after request/Safety confirmation and before purchase confirmation.
- Visible field set, grouping, step count, order, age-band UI, confirmation composition, and presentation fixture schema may change only within M1-I10 and require Human review.
- A fixture may truthfully show `このように受け取りました`; no AI is executed or implied.
- `normal_allowed` alone can continue; every blocked, invalid, contradictory, missing-consent, and unknown state remains fail closed.
- State meaning is not color-only, and labels, descriptions, errors, focus order, and touch targets remain accessible.
- No file input, persistence, transmission, API, DB, real AI, payment, Safety rule, new acknowledgement meaning, or marketing consent is added.
- Human walks through the normal and stop-state flows in ordinary external Edge and explicitly accepts M1-I10 before M1-I11 authorization.

### M1-I11 Legal Review Redesign

- All current legal/contact routes remain reachable, review-labeled, and `noindex, nofollow` as applicable.
- The three layers in Section 10 are visually and semantically distinct: user-readable body, publication-readiness/unresolved Human decisions, and collapsed review-only metadata.
- Each page has one primary status; Decision IDs are not repeated in the reading flow; `/legal` uses a document-index list rather than a repeated card grid.
- Long text, navigation, current-page indication, responsive rows, and focus behavior remain readable and operable.
- No raw placeholder is presented as final, no unresolved fact is invented, and contact remains visibly inactive.
- Legal, AI, refund, and Safety limitations are not hidden or visually demoted.
- Human reviews representative index, long-form, row-heavy, Safety, and contact pages in ordinary external Edge and explicitly accepts M1-I11 before M1-I12 authorization.

### M1-I12 Responsive, Accessibility and Final QA

- All Milestone 1 routes are checked for narrow-to-desktop layout, overflow, wrapping, readable measure, focus, keyboard order, touch targets, contrast, state communication, and link integrity.
- Human completes visual checks at approximately 320px, 390px, 768px/tablet, and desktop in ordinary external Edge.
- The carried M1-I6/M1-I6-R1 defect inventory is resolved or explicitly deferred with Human rationale; M1-I12 does not reopen M1-I6.
- Automated source, typecheck, lint, build, raw HTTP, rendered-markup, and prohibited-scope evidence remains separate from Human visual evidence. No agent browser evidence is used.
- Product facts, Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, core scenario facts, runtime boundaries, route behavior, and the non-fixed CTA decision remain unchanged.
- M1-I12 produces a final Milestone 1 acceptance package but does not reopen or accept the closed M1-I6 and does not itself mark Milestone 1 accepted.

## 16. Human Visual QA process

Human owns visual acceptance. CodeX may prepare route lists, local run instructions, expected-state checklists, and non-browser automated evidence after a slice is explicitly authorized, but CodeX must not open or control a browser or claim a visual pass.

For each authorized slice:

1. CodeX completes only the authorized file/surface scope and supplies non-browser validation evidence.
2. Human opens the local application manually in ordinary external Microsoft Edge.
3. Human checks the slice at the relevant widths, including approximately 320px, 390px, 768px/tablet, and desktop when responsive behavior is in scope.
4. Human checks hierarchy, wrapping, overflow, reading rhythm, action clarity, anxiety/agency, focus visibility, keyboard order, touch reachability, contrast, and truthful review/public boundaries.
5. Human records a written decision: accepted, bounded correction requested, or rejected/replan required.
6. The next slice remains unauthorized until Human accepts the current slice and separately authorizes the next slice.

At M1-I12, Human repeats a representative end-to-end review covering the LP, request and stop states, request confirmation, purchase-free confirmation, sample, Web note, save-oriented note, legal/contact pages, and fail-closed/error states. Screenshots are not required or acquired by CodeX.

## 17. Browser-use prohibition

Browser use by CodeX or any agent is prohibited for M1-P2 and its proposed slices. This includes:

- Browser use;
- the Codex in-app browser;
- CDP;
- Playwright;
- Puppeteer;
- Selenium;
- any GUI browser control; and
- screenshot acquisition.

No browser-derived observation may be reported as agent evidence. When an implementation slice is separately authorized, permitted non-browser checks may include source inspection, typecheck, lint, build, raw HTTP, and rendered-markup assertions within that slice's scope. Screen confirmation is performed only by Human, manually, in ordinary external Microsoft Edge.

## 18. Change-control rules

1. M1-P2 documentation is not implementation authorization.
2. Human acceptance of M1-P2 is satisfied. M1-I7 still requires separate explicit Human authorization before any work starts.
3. Each slice requires explicit authorization, a bounded mutation manifest, validation, Human review, Human acceptance, and separate authorization of the next slice.
4. One slice must not absorb another slice's work because shared code makes it convenient.
5. Proposed IDs must remain `M1-I7` through `M1-I12`. If a later conflict appears, stop and report it; do not rename an ID without Human direction.
6. Any requested change to product definition, price, age policy, Safety meaning, classification meaning, fixed judgment, core scenario facts, runtime, milestone order, or MVP completion definition requires a separate Human decision and controlling-document update before implementation.
7. Safety fixtures, classification meaning, fail-closed behavior, fixed judgment, and core scenario facts remain fixed. Presentation fixtures and schemas may be extended or reorganized only inside the separately authorized relevant slice, require Human review, and must not activate runtime behavior.
8. Any contemplated M1-I6-R1 item must be inventoried and assigned to an authorized M1-I7 through M1-I12 slice or explicitly deferred; it may not be patched opportunistically or treated as a new M1-I6 gate.
9. M1-I6 was not accepted and is formally closed as superseded by M1-P2; its implementation and evidence remain historical records.
10. Milestone 2 remains unauthorized even after M1-P2 or any individual M1-P2 slice is accepted.
11. This planning task changes documentation only and performs no implementation. Branch creation, PR creation, force push, browser use, and screenshot acquisition remain prohibited.

## 19. Final Milestone 1 acceptance criteria

Milestone 1 may be accepted only when all of the following are true:

- Human has accepted the M1-P2 plan and every separately authorized M1-I7 through M1-I12 slice.
- M1-I6 remains recorded as not accepted and formally closed as superseded by M1-P2; this is not an acceptance prerequisite or a future gate.
- A reviewer can understand what is sold, `税込980円`, the one-shot/no-renewal model, the request flow, Safety boundaries, payment-free final confirmation, expected Web/save outputs, and legal/support status without real payment or AI.
- The reading note, LP, request sheet, and legal review screens form one coherent 月の返事 experience without looking like a generic AI product or cheap fortune-telling service.
- Product definition, price, 18+ rule, AI disclosure, non-guarantee, Safety-before-payment behavior, Safety fixture/classification meaning, fixed judgment, recommendation meaning, and core scenario facts remain unchanged.
- Only `normal_allowed` continues; all non-normal and unknown states remain fail closed.
- Human Visual QA in ordinary external Edge covers representative routes at phone, tablet, and desktop sizes, plus keyboard/focus and final contrast review.
- Every known M1-I6/M1-I6-R1 issue carried forward is resolved or explicitly deferred with Human rationale by final M1-I12 QA.
- Automated checks and Human visual evidence are recorded separately and no browser-derived agent evidence is claimed.
- No real AI, DB, payment, email, API, deployment, active contact, file generation, or other prohibited runtime behavior exists.
- Status documents agree on the current phase, current task, M1-I6 disposition, M1-P2 state, implementation authorization, next Human gate, Browser-use prohibition, and Milestone 2 prohibition.
- Human explicitly declares Milestone 1 accepted.

Milestone 1 acceptance still does not authorize Milestone 2. Milestone 2 requires a separate Human authorization under `docs/ROADMAP.md`.

## 20. Next Human gate

The M1-P2 documentation package is accepted by Human. The next Human gate is a separate explicit authorization decision for only `M1-I7 Brand Foundation`.

M1-I7 is not yet authorized or implemented. M1-I8 through M1-I12 remain proposals only. M1-I6 remains formally closed as superseded without acceptance, Milestone 1 remains incomplete, and Milestone 2 remains unauthorized.
