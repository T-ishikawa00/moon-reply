# M1_REVIEWABLE_WEB_MVP_SPEC.md

## 0. Status

- Input authority: Human-accepted Task 18C-R3, the Task M1-P1-R1 Human UX decisions, and `docs/ROADMAP.md`
- Current task: Task M1-P1 plus Task M1-P1-R1 UI/UX Decision Alignment
- Status: Task M1-P1-R1 documentation alignment completed; both planning tasks await final Human review
- Implementation is not authorized by this document
- Real payment/refunds, OpenAI, real email, public database writes, image/file input, PDF/image generation, deployment, operator personal information, and package changes are prohibited

This specification defines Milestone 1 only: a payment-free, externally reviewable representation of the intended purchase and delivery experience. It does not claim that the production flow exists.

## 1. User and Reviewer Goals

### Primary user

Women around ages 25–34 who are experiencing reply waiting, follow-up-message anxiety, or an ambiguous relationship and want calm, specific decision support before sending a message.

The Human-approved emotional objective is not merely to return an answer. The experience should make the user's feelings slightly lighter, help them leave an isolated loop of overthinking, and restore a state in which they can choose the next action themselves. Anxiety amplification, pressure, blame, and claims about another person's true feelings are UX failures.

The user must understand that 月の返事 is:

- an AI-assisted relationship-message analysis and decision-support digital report;
- presented as a `恋のメッセージ鑑定ノート`;
- one request to one report, not chat;
- JPY 980 including tax when payment is later enabled;
- for users aged 18 or older; and
- unable to guarantee another person's true feelings, replies, reconciliation, or future outcomes.

### Primary reviewers

- Human product reviewer: evaluates clarity, emotional fit, route/state completeness, and scope discipline.
- Payment-provider reviewer: inspects the actual planned product, price, safety-before-payment flow, fulfillment, and disclosures without active payment.
- Legal/compliance reviewer: inspects the review presentation against the draft legal source documents without treating drafts as approved legal advice.
- Future implementation reviewer: checks that each implementation slice has a bounded route/file/evidence contract.

## 2. Review Experience

The complete review journey is:

1. Open `/` and follow a vertical, one-value-per-section explanation of the product, JPY 980 one-shot price, AI use, limits, Web鑑定ノート, 保存用鑑定書, and expected output.
2. Open `/sample-report` to inspect a clearly fictional marketing sample.
3. Open `/request` and inspect the actual request fields, required 18+ age-group selection, consent requirements, and local safety classification.
4. Open `/review` to access deterministic review states without inventing customer activity.
5. Inspect `normal_allowed`, `needs_review`, `rejected`, contradictory/invalid input, invalid age, missing consent, and unknown/error states.
6. From the normal fixture only, inspect request confirmation and the payment-free final purchase confirmation.
7. Inspect the production-shaped Web鑑定ノート fixture without a real token, AI call, email, purchase, or database record.
8. Compare the separate A4-oriented 保存用鑑定書 fixture preview without PDF/image generation, download, or a claim that a file exists.
9. Inspect the legal-information index, review-labeled legal pages, unsupported-cases page, and contact review page.
10. Confirm that every review page clearly states which parts are fixtures, unavailable, unresolved, or reserved for later milestones.

The review flow must not imply that payment, delivery, operator support, or production data processing is active.

### Request input boundary

The initial paid Web MVP is text-only. `/request` may accept the current situation, necessary copied conversation excerpts, the planned message, relationship/context selections, and the user's question. It must visibly guide the user to replace names with `相手`, `自分`, or `Aさん` and remove real names, phone numbers, addresses, workplaces, and other identifiers.

Image/file input, screenshots, OCR, image AI analysis, image storage, and automatic masking are out of scope. One-page versus multi-step form layout remains a Human gate before M1-I2; this specification does not resolve it.

### Free and advertising boundary

The initial MVP has no free complete first reading, ad-supported complete reading, ads, free tickets, free coins/points, or repeatable first-free path. The fictional `/sample-report`, short LP excerpts, output previews, input example, and usage flow are the free experience.

## 3. Exact Route Inventory

### Route-family decision

Use a dedicated `/review/**` namespace for deterministic state and production-shaped fixture inspection. This is preferred over query parameters on ordinary user routes because the review boundary remains visible in the URL, review states cannot be mistaken for real purchases, and later production routes can be introduced without accepting fixture identifiers.

All `/review/**` screens must share the same visible review banner and link back to `/review`.

| Route | Purpose and audience | Data source | Allowed actions | Prohibited actions | Links in / links out | Public-review safe | Implementation dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Explain the offer to users and all reviewers | Existing static product copy; no runtime data | Open request form, sample, legal index, contact | Checkout, fake metrics, fake reviews | In: direct; Out: `/request`, `/sample-report`, `/legal`, `/contact` | Yes after M1 content review; payment-unavailable notice required | M1-I1, then M1-I6 |
| `/request` | Interactive request form for users; inspect fields and client validation | Browser-local form state and deterministic local safety rules only | Enter/edit data, validate, view local classification, open review hub | Submit externally, persist, pay, call AI/email | In: `/`; Out: `/`, `/review`; valid local state may link to review confirmation only after M1-I2 | Yes with explicit no-send/no-payment notice | Existing foundation; M1-I2 refines states |
| `/review` | Reviewer-only route/state index | Static route metadata | Open every fixture/state/legal/result preview | Represent visits as users or purchases | In: footer/direct; Out: all `/review/**`, sample, legal pages | Yes only with persistent review labeling; indexing decision deferred to M3 | M1-I1 |
| `/review/request/normal-allowed` | Inspect normal safety state before confirmation | `request-normal-001` fixture | Continue to request confirmation, return to form | Real submission or generation | In: `/review`; Out: confirmation, `/request`, `/review` | Yes | M1-I2 |
| `/review/request/needs-review` | Inspect cautious stop state | `request-needs-review-001` fixture | Return/edit, open unsupported cases/contact review | Purchase, ordinary report preview, normal message suggestion | In: `/review`; Out: `/request`, `/legal/unsupported-cases`, `/contact`, `/review` | Yes | M1-I2 |
| `/review/request/rejected` | Inspect blocked state | `request-rejected-001` fixture | Return/edit, open unsupported cases/contact review | Purchase, ordinary report, unsafe advice, unverified emergency claims | In: `/review`; Out: `/request`, `/legal/unsupported-cases`, `/contact`, `/review` | Yes | M1-I2 |
| `/review/request/contradictory-selection` | Inspect contradictory safety choice error | `request-contradictory-001` fixture | Return to correct safety selection | Continue or purchase | In: `/review`; Out: `/request`, `/review` | Yes | M1-I2 |
| `/review/request/invalid-age` | Inspect under-18 or invalid age-value rejection | `request-invalid-age-001` fixture | Return to age field, leave service | Confirmation, purchase, report | In: `/review`; Out: `/request`, `/` | Yes | M1-I2 |
| `/review/request/missing-consent` | Inspect missing required consent | `request-missing-consent-001` fixture | Return to consent section | Confirmation or purchase | In: `/review`; Out: `/request`, legal pages | Yes | M1-I2 |
| `/review/request/unknown-error` | Inspect conservative unknown/error handling | `request-error-001` fixture | Retry locally, return to form/review hub | Assume normal, purchase, persist | In: `/review`; Out: `/request`, `/review` | Yes | M1-I2 |
| `/review/request/confirmation/normal-001` | Confirm a normal fixture request before purchase summary | `request-normal-001` fixture | Review/edit link, continue to review purchase confirmation | Real submit, DB write, access from blocked fixtures | In: normal state; Out: `/request`, review purchase confirmation, `/review` | Yes | M1-I2 |
| `/review/purchase/confirmation/normal-001` | Production-shaped final confirmation with payment unavailable | Normal request fixture plus mock purchase metadata | Review content, correct request/email/age, open legal pages | Checkout, provider widget, payment event | In: request confirmation, `/review`; Out: edit links, legal/contact, `/review` | Yes; disabled/preparation-only action required | M1-I3 |
| `/sample-report` | Marketing and expectation-setting sample | `sample-report-g001` fixture derived from approved sample direction | Read, return to LP/request | Imply real customer, purchase, testimonial, real AI run | In: `/`, `/review`; Out: `/`, `/request`, fixture-result explanation | Yes with fictional-sample label | M1-I4 |
| `/review/result/result-normal-001` | Review the final report UI and delivery shape | `result-normal-001` deterministic fixture | Read sections, inspect disclaimer, return to review hub | Real token, personalization claim, email send, database lookup | In: `/review`, sample comparison; Out: `/review`, `/sample-report`, legal/contact | Yes with fixture and not-purchased labels | M1-I4 |
| `/review/save-report/result-normal-001` | Review the separate 保存用鑑定書 hierarchy and readability | Save-presentation view of `result-normal-001`; deterministic fixture only | Read quick-reference sections, compare Web/sample, return to review hub | PDF/image generation, download, copy/share, file claim, Web screenshot, purchase/AI claim | In: `/review`, Web-result comparison; Out: `/review`, `/review/result/result-normal-001`, `/sample-report`, legal/contact | Yes with fixture and not-generated labels | M1-I4 |
| `/legal` | Legal/support navigation index | Static route metadata and draft-status summaries | Open every legal/contact review page | Claim publication approval | In: global footer, confirmation, result; Out: all legal pages and `/contact` | Yes with review status | M1-I5 |
| `/legal/terms` | Review presentation of Terms | Review-safe rendering based on `TERMS_OF_SERVICE_DRAFT.md` | Read, navigate back | Show unresolved operator/provider facts as final | In: footer, confirmation, `/legal`; Out: `/legal`, `/contact` | Yes only with draft/review label | M1-I5; M2 must complete facts before publication readiness |
| `/legal/privacy` | Review presentation of Privacy | Review-safe rendering based on `PRIVACY_POLICY_DRAFT.md` | Read, navigate | Assert unverified providers/retention | Same as Terms | Yes only with draft/review label | M1-I5; M2/M5 facts remain unresolved |
| `/legal/tokushoho` | Review Tokushoho information structure | Review-safe fixed facts plus withheld unresolved fields | Read, navigate | Display fictional name/address/phone/provider | In: footer, confirmation, `/legal`; Out: `/legal`, `/contact` | Yes only as incomplete review version | M1-I5; M2 blocks final public version |
| `/legal/refund` | Review refund cases and unresolved conditions | `REFUND_POLICY_DRAFT.md` review representation | Read, navigate | Present provider-dependent timing as confirmed | In: footer, confirmation, `/legal`; Out: `/legal`, `/contact` | Yes with review label | M1-I5; M2/M4 decisions remain |
| `/legal/ai-disclosure` | Explain AI use, limits, data minimization | `AI_DISCLOSURE_DRAFT.md` review representation | Read, navigate | Claim active provider/endpoint or retention | In: LP, confirmation, result, `/legal`; Out: `/legal`, `/contact` | Yes with review label | M1-I5 |
| `/legal/unsupported-cases` | Explain safety exclusions without blame | `UNSUPPORTED_CASES_PUBLIC_DRAFT.md` review representation | Read, return/edit, contact review | Unverified emergency numbers, ordinary report or purchase CTA | In: safety stops, footer, `/legal`; Out: `/request`, `/contact`, `/legal` | Yes with review label | M1-I5 |
| `/contact` | Review support categories and future contact structure | `CONTACT_PAGE_DRAFT.md`; no live endpoint | Read supported issue types and data-minimization warning | Send form, `mailto:` to invented address, claim response SLA | In: global footer, legal/safety/result; Out: `/legal`, `/`, `/review` | Yes with “contact not yet active” label | M1-I5; M2 must provide real contact method |
| `/review/error/missing-fixture` | Missing/invalid fixture inspection | Static error metadata | Return to review hub | Fall back to another fixture silently | In: invalid fixture path; Out: `/review` | Yes | M1-I4 |
| `/review/error/unavailable-report` | Unavailable report inspection | Static error metadata | Return to review hub/contact review | Claim generation retry or send email | In: `/review`; Out: `/review`, `/contact` | Yes | M1-I4 |

### Future production-route note

Milestone 1 does not authorize production request IDs, checkout sessions, or result tokens. Future production routes may use `/purchase/confirm` and `/result/[token]`, but their exact server contracts belong to Milestones 5–6. Review fixture IDs must never be accepted as production tokens.

## 4. State Ownership

| State | Recommended ownership | Reason | Rejected alternatives |
| --- | --- | --- | --- |
| Empty form and field validation | Inline on `/request` | Errors must stay attached to fields and preserve edit context | Separate error page fragments correction and harms accessibility |
| Missing consent | Inline on `/request`, plus `/review/request/missing-consent` preview | Real correction belongs beside checkboxes; reviewer needs deterministic access | Query-only hidden state is hard to audit |
| Invalid/under-18 age | Inline on `/request`, plus review preview | Correction or service exit belongs at the age field | A purchase-stage rejection is too late |
| Contradictory safety selection | Inline on `/request`, plus review preview | User must correct the conflicting choices | Treating it as `rejected` hides a correctable input error |
| `normal_allowed` | Inline status, then own review confirmation route | Enables clear request-summary review before purchase summary | Jumping directly to purchase loses a correction gate |
| `needs_review` | Own review-only stop screen | It must have no purchase or ordinary report path and needs distinct explanation | Warning-only continuation conflicts with the approved initial-MVP rule |
| `rejected` | Own blocked screen | Strong separation prevents unsafe continuation | Modal-only or hidden button is too weak and hard to audit |
| Purchase/final confirmation | Own `/review/purchase/confirmation/...` route | Contractual information needs a stable, auditable page | Inline accordion on request confirmation obscures conditions |
| Sample report | Public `/sample-report` | Marketing/expectation purpose differs from delivery review | Reusing result route could imply a customer purchase |
| Production-shaped fixture result | `/review/result/[fixtureId]` | Clearly review-only and deterministic | Token-looking public route risks implying production security |
| Save-report fixture preview | `/review/save-report/[fixtureId]` | Separates quick-reference presentation from the long Web report while reusing one structured fixture | A Web screenshot or compressed full report defeats the approved presentation split |
| Legal/contact | Own stable routes | Must be linkable from footer and confirmation | Modals are hard to reference, print, and review |
| Loading/error/empty | Review-only preview routes and inline skeleton where relevant | Reviewer can inspect deterministic states without network | Fake delays or network calls add no M1 value |

## 5. Safety State Matrix

| Safety/input state | Message category | Continuation | Purchase confirmation reachable | Ordinary report preview reachable | Review method | Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| `normal_allowed` | Calm eligibility confirmation; not an outcome promise | Yes, to request confirmation | Yes, through normal confirmation only | Fixture result is separately inspectable, not generated from this action | `/review/request/normal-allowed` | Local fixture only |
| `needs_review` | “通常鑑定の前に慎重な確認が必要”; non-judgmental | No in initial MVP | No | No ordinary report or message suggestion | `/review/request/needs-review` | May link to unsupported cases/contact review only |
| `rejected` | “通常鑑定として扱えない”; safety-first | No | No | No | `/review/request/rejected` | No romance advice, pressure, or unsupported emergency claim |
| Contradictory selection | Correctable input conflict | Only back to edit | No | No | `/review/request/contradictory-selection` | Not an emergency classification |
| Under-18/invalid age | Eligibility/validation message | Only back to edit or exit | No | No | `/review/request/invalid-age` | No identity document or DOB collection |
| Missing consent | Required-confirmation error | Only back to consent section | No | No | `/review/request/missing-consent` | Marketing consent is not part of required consent |
| Unknown/error | Conservative temporary error | Retry/edit only | No | No | `/review/request/unknown-error` | Never default to normal on unknown state |

No state may claim that an emergency exists merely from a rule match. No unverified hotline, agency, phone number, or jurisdiction-specific direction may be shown. 月の返事 is not an emergency service.

### Future post-payment failure requirement

Safety before payment remains controlling, but later milestones must handle an exceptional block or unrecoverable failure after payment:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

A Safety-blocked fulfillment does not produce a normal report. Recoverable technical failures may be retried; unrecoverable/unfulfillable service is a full-refund candidate. Future design must prevent duplicate refunds, record reasons/states, notify an operator, and communicate result/refund status to the user.

Automatic refunds, provider refund API capability, fee reimbursement, refund deadlines, reflection timing, and operator-console procedures remain unresolved. M1 implements none of these states.

## 6. Final Confirmation Specification

Route: `/review/purchase/confirmation/normal-001`.

### Required content

- Product name: `月の返事 単発鑑定ノート`
- Official description: `AIによる恋愛メッセージ分析・判断支援デジタルレポート`
- Price: `税込980円`
- Quantity: `1相談 / 1鑑定書`
- Purchase condition: one-shot, no automatic renewal, no free/ad-supported alternative
- Selected allowed age group
- Fixture email address, clearly labeled; use a reserved domain such as `sample@example.invalid`
- Request summary: relationship, reply-wait status, draft-message summary, main concern, desired action, and main question
- Delivery method: future Web result page plus result-URL email
- Expected delivery timing: display `提供時期は運営判断前のため未確定` in review mode; do not use an invented SLA
- Payment method and payment timing: display `決済事業者・支払方法・支払時期は未選定` as review status
- AI use and data-minimization summary
- No true-feeling, reply, reconciliation, future, or result guarantee
- Safety status: `normal_allowed` fixture; blocked states cannot route here
- Refund/cancellation summary identified as draft and dependent on applicable Provider evidence, current official-source legal/Customer-rights review, actual Product behavior, and applicable operator decisions; professional consultation is optional, not required
- Terms, Privacy, Refund, Tokushoho, AI disclosure, unsupported-cases, and contact links
- Edit links for request content, age group, and email

The review screen must also show the future required confirmations as a non-transactional inspection list: AI use, not medical/psychological/legal service, no result guarantee, Refund review, Terms agreement, and Privacy agreement. It must not record consent. Marketing email consent must be absent from required purchase confirmations and must not be implied.

### Action treatment

The primary control must be non-transactional and visually unmistakable:

- Label: `購入機能は現在準備中です`
- Disabled button or non-button status panel; no submit handler
- Supporting text: `審査用プレビューのため、決済・送信・AI生成は行われません。`

Do not show a provider logo, card fields, mock authorization, fake success state, or active checkout wording.

## 7. Sample Report vs Web鑑定ノート vs 保存用鑑定書

### Sample report

Route: `/sample-report`.

Purpose: marketing and expectation-setting. It should communicate voice, approximate depth, report structure, and limitation without imitating a purchased customer artifact.

Required label above the title:

`架空ケースによるサービス説明用サンプルです。実在の相談者、購入、レビュー、AI生成実績ではありません。`

Requirements:

- 700–1,000 Japanese characters as the free sample target from `RESULT_PRESENTATION_SPEC.md`;
- based on an approved sample direction such as G001, without claiming a real case;
- no testimonial, star rating, purchase date, customer count, or “利用者の声”;
- clear CTA back to product/request explanation, not checkout;
- fixed AI/non-guarantee disclaimer.

### Production-shaped fixture result

Route: `/review/result/result-normal-001`.

Purpose: review the long-form Web鑑定ノート UI, hierarchy, readability, delivery shape, and legal/disclosure treatment. It may imitate the final 1,800–2,400-character report shape but must not claim that it was purchased, generated, stored, or emailed.

Required report sections:

1. 今夜の結論
2. 今の関係の整理
3. 相手側にあり得る受け止め方
4. あなたが不安になっている核心
5. この文面がどう伝わる可能性があるか
6. 今夜の推奨アクション
7. 送る場合の文面案
8. 3日間の行動プラン
9. この分析の限界と注意点

The shared result contract requires every approved send, light-send, wait, and do-not-send outcome to communicate the judgment reason, review timing, conditions that change the direction, action while waiting, next option if no contact arrives, a later message draft when applicable, and what cannot be concluded. A single reading contains one judgment, not all mutually exclusive labels. `result-normal-001` is fixed to `今日は送らない方がいい` and must demonstrate the complete contract without inventing an unsupported exact time.

Required fixed disclaimer:

> このレポートは、入力された情報をもとにAIが整理・分析する予定の判断材料を、審査用fixtureで再現したものです。実在の相談者、購入、AI生成または納品記録ではありません。相手の本心や将来の出来事を断定・保証せず、医療・心理・法律上の助言ではありません。

It must use a readable fixture ID, not a random-looking result token, and must contain no real personal information, AI call, database lookup, email action, or purchased-state badge.

### 保存用鑑定書 fixture preview

Route: `/review/save-report/result-normal-001`.

Purpose: review whether a separate quick-reference presentation can be understood and saved without rereading the full Web鑑定ノート.

Required content direction:

1. title;
2. fixture creation/reading date label that cannot imply a real purchase;
3. 今夜の結論;
4. judgment-reason summary;
5. approved send/light-send/wait/do-not-send status;
6. review timing;
7. conditions that change the direction;
8. message draft when applicable;
9. three-day direction, including the waiting action and no-contact next option when applicable; and
10. fixed cautions, including explicit uncertainty and what cannot be concluded.

The save preview derives from the same `result-normal-001` structured fixture and must not introduce a different judgment or unsupported inference. It uses a separate layout and information priority from the Web result. It is not a screenshot and must not shrink the full Web report into an A4 surface.

M1-I4 direction is an A4-oriented readable fixture preview. A4 one/multiple pages, PDF/image/both, real download, browser print, smartphone-long version, save button, copy/share, file name, margins, and exact text volume remain deferred. No file is generated by M1-I4 unless a later task separately authorizes generation.

The preview must show the same two-level review banner, fixture ID, fictional/not-purchased status, and fixed AI/non-guarantee boundary. It contains no real customer, AI call, database lookup, email delivery, purchase, download, or generated-file claim.

## 8. Fixture and Mock Strategy

### Future file location

When an implementation slice is authorized, place review fixtures under:

`fixtures/review/`

Recommended future files:

- `fixtures/review/requests.ts`
- `fixtures/review/safety-states.ts`
- `fixtures/review/purchase-confirmations.ts`
- `fixtures/review/reports.ts`
- `fixtures/review/errors.ts`

No fixture file is created by Task M1-P1 or Task M1-P1-R1.

### Naming

- Request fixtures: `request-<state>-NNN`, for example `request-normal-001`
- Report fixtures: `result-<state>-NNN`, for example `result-normal-001`
- Save-report previews reuse the matching report fixture ID under `/review/save-report/`; they do not create an independent judgment fixture
- Sample fixtures: `sample-report-<approved-direction>`, for example `sample-report-g001`
- Error fixtures: `error-<condition>`, for example `error-missing-fixture`

### Data rules

- Use fictional labels such as `サンプル利用者` and reserved email domains ending in `.invalid`.
- Do not copy real conversations, names, handles, workplaces, locations, email addresses, or support data.
- Fictional contexts must be deliberately composed, non-identifying, and labeled as fixtures.
- Output is deterministic: the same fixture ID always returns the same content.
- The Web and save presentations use the same structured judgment; presentation-specific fields may summarize or reorder but may not disagree.
- Fixtures are imported locally; no fetch, server action, API route, public database read/write, analytics write, email, or AI call.
- Fixture IDs are allowlisted. Unknown IDs render the missing-fixture state and never fall back to a different record.
- Review fixtures must be structurally separated from future production repositories/data access.
- No fixture creates sales, satisfaction, conversion, delivery, or provider evidence.
- Every fixture page displays `審査用fixture` and its fixture ID.

## 9. Legal and Contact Presentation

### Review presentation rule

The existing Markdown files under `docs/legal/` remain internal source drafts. Milestone 1 implementation may create review representations, but it must not silently convert those drafts into approved legal text.

Each legal/contact route must show:

- `審査用ドラフト表示`
- `公開承認前・運営者情報未完了`
- `法的助言ではありません`
- a link back to `/legal`

### Fixed facts that may be shown

- service/product name and official definition;
- 18+ eligibility and required age-group selection;
- one purchase = one request = one report;
- intended price of JPY 980 including tax;
- AI use and non-guarantee;
- safety before payment;
- no subscription, coins, points, login, or account in the initial MVP;
- review-stage payment unavailable.

### Unresolved facts

Operator legal name, trade name, responsible person, address, phone, support email, contact-form URL, response time, payment provider/method/timing, delivery timing, retention periods, result-token lifetime, external providers, and effective dates must not appear as invented values.

Recommended M1 treatment:

- Withhold the value from ordinary review-page prose.
- Show a review-status row such as `Milestone 2で運営者による確定が必要`.
- Do not render raw `[[..._TBD]]` tokens as if they are user-facing copy.
- Tokushoho must explicitly state that the review version is incomplete and unavailable for real purchase.
- `/contact` must be non-functional and state that no inquiry is sent from the page.

Operator-information completion remains Milestone 2. Final publication readiness is not an M1 acceptance claim.

## 10. Review-Mode Boundary

### Persistent review banner

Human-approved two-level wording:

Always-visible short banner:

`審査用プレビュー｜実際の決済・送信は行われません`

Accessible detail:

`この画面は架空データを使用しています。AI生成、メール配信、データ保存も動作しません。`

The banner must:

- appear at the top of every `/review/**` page and the review hub;
- remain visible before the primary action;
- use text and icon, not color alone;
- expose the detailed explanation and link to `/review` for the review boundary and unresolved operator/legal facts;
- never resemble a success/purchase badge.

### Production-shaped versus active production

- “Production-shaped” means visual hierarchy and content structure only.
- Fixture pages display the fixture ID and fictional/sample label.
- Payment actions are disabled/preparation-only.
- Legal/contact pages distinguish fixed product facts from unresolved operator facts.
- Future integrations are named only as planned capabilities.
- Ordinary users must never see copy implying that a purchase, AI generation, email delivery, or operator response occurred.

## 11. Design Brief

### Product purpose

Help a user pause before sending a high-emotion relationship message and understand the eventual one-report purchase experience without exploiting anxiety.

### Target audience and page goal

- Primary audience: women around 25–34 with reply waiting, follow-up-message anxiety, or ambiguous relationships.
- Goal: establish emotional relevance, credibility, safety, and concrete report value; not simulate chat or urgency.

### Emotional tone

Calm, private, emotionally safe, quietly decisive, and realistic. The design may feel intimate but must not imply supernatural certainty.

### Visual direction

- Foundation: night, moonlight, letter, notebook.
- Color: deep navy, muted purple, pale gold, warm ivory, off-white paper.
- Use moonlight as atmosphere and hierarchy, not as a prediction mechanism.
- Paper/note surfaces should make long Japanese reading comfortable.
- Review banners and safety notices must remain operationally clear within the poetic brand.

### LP hierarchy and form separation

- Use a vertical LP with one primary value per section, large headings, short explanations, wide spacing, and concrete product previews.
- Approved order: first view; relevant concerns; what 月の返事 organizes; Web鑑定ノート preview; 保存用鑑定書 preview; usage flow; fictional sample; price/product conditions; AI/non-guarantee/Safety; FAQ; final CTA; legal/safety/contact navigation.
- Place a clear CTA mid-page and near the end.
- M1-I1 uses non-fixed CTAs. A mobile fixed CTA may be evaluated in M1-I6 only through the explicit Human gate and evidence rules in `M1_IMPLEMENTATION_SLICES.md`.
- On wider screens, explanation and preview may alternate left/right. Mobile keeps one logical vertical order and never uses horizontal scrolling.
- The LP is for understanding and expectation formation. `/request` is the independent, input-focused experience; do not embed the full form in the LP.

### External UX reference boundary

The Pattern is an inspiration for UX hierarchy only.

Adopt:

- vertical reading;
- one section/one value;
- large heading plus concise explanation plus real-product preview;
- generous spacing and clear section boundaries;
- wider-screen left/right alternation;
- concrete Web/save/input previews; and
- clear mid/final CTA and request starting point.

Transform its chart/screen/input roles into moonlight, tonight's conclusion, the three-day plan, Web鑑定ノート, 保存用鑑定書, relationship situation, conversation paste, planned message, and the user's question.

Reject astrology, natal charts, zodiac symbols, birth-data analysis, fate/life/true-feeling claims, circular-chart imitation (including a moon-themed reskin), proprietary copy/images/distinctive shapes/exact layout, copied colors/fonts, horizontal scrolling, and unnatural Japanese line breaks. External screenshots are not repository assets.

### Typography

- Japanese body text prioritizes system sans-serif readability and stable rendering.
- Display headings may use a restrained Japanese serif only if performance, glyph coverage, and readability are proven; no package/font addition in M1-P1.
- Body line-height target: 1.8–2.0; report line length roughly 32–42 Japanese characters on desktop.

### Spacing and layout

- Phone-first single-column reading; wider-screen LP sections may alternate columns while preserving the same DOM/reading order.
- 16–20 px page gutters on small screens; 24–32 px on wider layouts.
- 44–48 px minimum control height and generous section separation.
- Desktop uses centered content, not a dashboard; report content max width approximately 720–800 px.

### Motion

- Motion is optional and subordinate.
- Use short opacity/position transitions only for feedback and navigation context.
- No pulsing purchase CTA, countdown, parallax, simulated typing, or mystical animation.
- Respect `prefers-reduced-motion`.

### Trust and credibility

- Show price, AI use, safety limits, product quantity, and payment-unavailable status before action.
- Use no fake reviews, counts, ratings, provider logos, badges, or urgency.
- Keep legal/contact navigation consistently accessible.
- Clearly distinguish fixture content from evidence.

### Differentiation

- Not a generic AI app: no chat bubbles, prompt box, typing indicator, model selector, or “ask anything” language.
- Not a cheap fortune-telling app: no strong occult imagery, magic circles, excessive stars/sparkles, gaudy gold, fate claims, or mystery-based upsell.
- Not depressive: retain warm ivory and readable paper surfaces; do not make the interface uniformly black.

Implementation critique question:

> Is this truly designed for 月の返事, or could it be reused unchanged for an unrelated AI service?

If the answer is “it could be reused unchanged,” the implementation fails the design brief.

## 12. Accessibility and Responsive Requirements

- Phone-first completion and reading at 320 px viewport width without horizontal scrolling.
- Keyboard access to all links, controls, details, and correction actions.
- Visible focus indicator with at least a two-pixel perceivable outline/ring.
- Text/background contrast targets WCAG 2.2 AA: 4.5:1 for normal text and 3:1 for large text/UI boundaries.
- Minimum touch target: 44 by 44 CSS pixels; prefer 48 px for primary actions.
- Form errors associated through labels, `aria-invalid`, and `aria-describedby`; error summary links back to fields.
- One logical `h1`; descending heading hierarchy with no decorative heading skips.
- Safety meaning must use text, icon/label, and structure, not color alone.
- Long Japanese text uses sufficient line height, paragraph spacing, and constrained desktop measure.
- Status changes use appropriate `role=status` or `role=alert` without repeatedly announcing static copy.
- Disabled payment control must remain understandable to assistive technology and be followed by explanatory text.
- Review banner appears early in DOM order.
- Desktop review layout keeps the same reading order as mobile and does not hide information in hover-only UI.

## 13. Navigation Model

### Global header

- Brand link to `/`.
- Primary navigation: `鑑定依頼`, `サンプル鑑定書`, `法務・安全情報`, `お問い合わせ`.
- Review pages add a clearly separate `審査用プレビュー一覧` link.
- No login/account navigation.

### Global footer

- Product definition and AI-use summary.
- Links to `/legal`, each legal page, `/contact`, `/sample-report`, and `/review`.
- No fictional operator copyright year/name; use service name only until M2.

### Correction and return behavior

- Request confirmation: `入力内容を修正する`, `年齢層を修正する`, `メールを修正する` return to the corresponding form section.
- Purchase confirmation: correction links return to request confirmation/form; no blocked state may link forward.
- Safety stop states: primary action returns to the relevant request section; secondary links open unsupported cases/contact review.
- Sample report: links back to LP and request explanation.
- Web result fixture: links to review hub, fictional sample, and save-report comparison, not purchase.
- Save-report fixture: links to review hub, Web result, and fictional sample; no download/copy/share control is active.
- All review-only state pages link back to `/review`.

## 14. Analytics Boundary

Milestone 1 implements no analytics, tracking pixel, production event write, conversion metric, purchase record, or fake count.

If future planning needs stable names, the following are reserved candidates only:

- `lp_view`
- `request_view`
- `request_validation_error`
- `safety_state_view`
- `request_confirmation_view`
- `purchase_confirmation_view`
- `sample_report_view`
- `fixture_result_view`
- `legal_page_view`

No event is emitted by Milestone 1 unless a later task separately authorizes analytics, privacy treatment, consent behavior, provider choice, and verification.

## 15. Error and Empty States

| State | Review UI | Actions | Prohibited behavior |
| --- | --- | --- | --- |
| Missing fixture | “指定された審査用fixtureは存在しません”; show requested safe slug only | Return to `/review` | Silent fallback or database lookup |
| Invalid fixture ID | Same boundary as missing fixture; do not reflect unsafe raw content | Return to `/review` | Render arbitrary ID as HTML/content |
| Loading placeholder | Static skeleton with `審査用表示を準備しています` | None/return | Artificial delay or network call |
| Unavailable report | “審査用レポートを表示できません”; no generation claim | Review hub/contact review | Fake retry job or email |
| Broken contact path | Explain contact is inactive and M2-owned | Legal index/home | Invented email/form |
| General review error | Conservative error; no assumption of safety/payment success | Retry locally, review hub | Continue to purchase or report |

## 16. Planning Decisions and Remaining Human Gates

Task M1-P1-R1 supplies Human-approved decision inputs for the emotional objective, LP structure, input modality, report split, and two-level banner. The aligned Task M1-P1 package still requires final Human acceptance, and no row authorizes implementation.

| Decision | Recommended option | Alternatives | Reason | Consequence | Blocks implementation |
| --- | --- | --- | --- | --- | --- |
| Review route namespace | Dedicated `/review/**` routes | Query parameters on public routes; separate build | Clear boundary and deterministic inspection without duplicate deployment | Establishes route shell and fixture lookup | Yes: M1-I1 |
| Safety-state ownership | Inline validation plus separate review-only stop previews | All inline; separate public pages | Real correction stays local while reviewers can inspect every state | M1-I2 route/component shape | Yes: M1-I2 |
| Review banner wording | Use the Human-approved two-level wording in section 10 | Short “demo” badge; long always-visible technical sentence | Short constant boundary plus accessible detail prevents false activation claims without overwhelming the page | Affects every review page | Yes: M1-I1 after planning acceptance |
| Sample entry point | `/sample-report` linked from LP and review hub | LP-only excerpts; result-route reuse | Stable marketing sample without implying purchase | M1-I4 route and navigation | Yes: M1-I4 |
| Incomplete legal fields | Withhold values and show review-status rows | Render raw TBD tokens; hide legal pages | Truthful and inspectable without fictional facts | M1-I5 content model; M2 still required | Yes: M1-I5 |
| Contact review behavior | Non-functional page with supported categories and “not active” status | `mailto:`; inactive form | No real address or sending is authorized | M1-I5 route only, no handler | Yes: M1-I5 |
| Fixture result identifier | Readable `result-normal-001` under `/review/result/` | Random token-looking value; query parameter | Avoids false security/purchase impression | M1-I4 fixture and error handling | Yes: M1-I4 |
| Save-report preview | `/review/save-report/result-normal-001`, derived from the same structured fixture | Web screenshot; compressed Web report; omit save review | Preserves the approved two-presentation experience and makes quick-reference readability reviewable | M1-I4 route, fixture view, and comparison navigation | Yes: M1-I4 |
| Request-form layout | Human gate before M1-I2; keep one-page vs multi-step unresolved | Decide in R1 docs | Input burden and mobile flow require visual/prototype evidence | M1-I2 component/layout shape | Yes: M1-I2 |
| Review-site indexing posture | Reserve `/review/**` for `noindex`; final site-level decision in M3 | Index all; password protect | Review fixtures should not be search results; deployment method is not yet selected | No code in M1-P1; becomes M3 gate | No for M1-I1, yes before M3 deployment |
| Delivery timing in confirmation | Show “未確定” review status | Use 1 hour; use 24 hours | Both SLA values remain unresolved operator facts | Prevents false purchase condition | Yes: M1-I3 copy |

No unresolved operator fact is decided by the recommendations above.

## 17. Milestone 1 Exit Criteria

Milestone 1 is acceptable only when a reviewer can understand:

- what 月の返事 analyzes and what the user enters;
- the emotional goal of reducing anxiety and restoring user agency;
- the vertical LP hierarchy and why the LP remains separate from `/request`;
- the intended JPY 980 one-shot product and one-request/one-report quantity;
- that there is no initial free-complete/ad-supported route and `/sample-report` is the primary free experience;
- age, consent, safety, and correction behavior;
- why `needs_review` and `rejected` cannot reach purchase;
- the payment-free final confirmation and unavailable action;
- the difference among a fictional sample, the long Web鑑定ノート fixture, and the separate 保存用鑑定書 fixture preview;
- that a save preview is not a Web screenshot or generated/downloadable file and its exact format remains deferred;
- that every approved send, light-send, wait, and do-not-send recommendation includes timing, conditions, interim action, next options, and limits;
- the two-level review-banner wording;
- expected report structure, AI use, limits, and non-guarantee;
- legal, refund, unsupported-case, and contact structure;
- which operator/provider/data facts remain unresolved; and
- that payment, AI, email, database writes, PDF/image generation, refunds, provider inquiry, and deployment are not active.

Milestone 1 implementation may begin only after Human accepts Task M1-P1 and Task M1-P1-R1 together and separately authorizes M1-I1.
