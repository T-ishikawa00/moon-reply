# PAYMENT_FLOW.md

> **CURRENT Stripe Lane B B4b Private Review Hard Gate acceptance:** `stripe_lane_b_b4b_private_review_hard_gate_human_chatgpt_accepted_complete`; Acceptance date `2026-08-15`; Technical Evidence Closure SHA `ae20d3540a890f0a0b567695fd982b1d5a57d7f9`; `technicalEvidence = complete`.
>
> ChatGPT final review `PASS / complete`; Human final review `PASS / complete`; B4b acceptance `complete`; Netlify Hard Gate `human_chatgpt_accepted_complete_private_review_scope_only`; acceptance scope `private_review_technical_scope_only`; Production B4a SHA `025e28a82c0b773d21ececfd8064af045922079d` remains `unchanged / locked`; Paid Production Hosting `provisional`; Production readiness `not established`. This acceptance is limited to B4b Private Review technical evidence closure and the Netlify Private Review Hard Gate. Payment remains unimplemented; Production Runtime / Production Payment / Stripe approval or formal selection / additional Provider operations / public visibility / domain-DNS / legal publication / Public Launch remain unapproved or unauthorized. Exact next candidate is **Paid Production Readiness Planning** (`planning only / not started / no external authority created`). Historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md.

## B2 accepted status

`stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`. Human + ChatGPT review / acceptance is `complete / complete`. B2 changes specification authority only; Payment implementation and Production Payment remain `false / false`.

## 0. Purpose

This document defines the intended Web flow for the initial automated paid product. It is subordinate to `docs/payment/PAYMENT_PLATFORM_MONETIZATION_STRATEGY.md` and the accepted `docs/payment/PAYMENT_CHARTER.md`.

No Payment API implementation is included or authorized by this document. Payment Charter v1 is `human_chatgpt_accepted_complete` as of `2026-08-12`, while Payment implementation authority remains `false`.

The public MVP requires payment success verification before AI judgment or diagnosis generation.

---

## 1. Price

Initial price:

- 税込¥980 per request / one 鑑定ノート
- one-shot purchase
- no automatic renewal

The initial MVP has no free complete reading, ad-supported reading, advertising, free ticket/coin/point, subscription, or repeatable first-free path.

---

## 2. Platform and Provider Direction

Initial Web direction:

- Stripe Checkout as the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare
- supported credit/debit cards
- Apple Pay
- Google Pay
- PayPay
- JPY 980 including tax for every enabled initial method

Strategy acceptance does not establish Stripe feasibility, account/contact, approval/activation, formal selection, or method eligibility. Credit/debit cards, Apple Pay, Google Pay, and PayPay each require actual account/category/method evidence. No desired method may be silently removed; PayPay unavailable returns the project to explicit Human launch review.

RevenueCat is not required for initial Web fulfillment. Future cross-platform synchronization is desired and unresolved. PAY.JP is paused fallback with preserved evidence. Payment Charter acceptance is complete, while Provider evidence, formal selection, implementation authorization, and Production Payment authorization remain separate and incomplete.

---

## 3. Required Public MVP Sequence

Required sequence:

1. User submits diagnosis request form
2. Server verifies the required boolean adult self-attestation `私は18歳以上です`
3. The accepted server-owned Safety and purchase-eligibility gate runs
4. User proceeds only when the current result is eligible and `purchaseGateSatisfied=true`
5. User supplies or confirms the delivery/recovery email
6. When no valid trusted session is bound to the same verified email, server-authoritative mailbox verification is completed
7. The verified delivery/recovery email is bound to the current purchase authority and Purchase Intent
8. User completes the final JPY 980 purchase confirmation
9. After separate implementation authorization, the Charter-defined Payment flow begins
10. Server-authoritative Provider evidence verifies Payment success
11. The system normalizes one Purchase, issues one Assessment Grant, and starts one Logical Assessment
12. Fulfillment completes and the canonical result is delivered or recovered through the verified delivery/recovery channel

For a still-valid trusted session bound to the unchanged verified delivery/recovery email, step 6 may be skipped. Safety eligibility and final purchase confirmation cannot be skipped. A trusted session is neither Payment authority nor Safety authority, and browser/client/localStorage state alone cannot assert trusted or verified status.

The request → server-authoritative adult-confirmation requirement → Safety/purchase eligibility → verified delivery/recovery email binding → final confirmation → Payment order must be maintained in the public flow. The initial MVP remains no-login; trusted delivery/recovery state is not a Customer account.

Reason:

- Safety screening can happen before payment
- Dangerous or unsupported cases can be rejected before payment
- Reduces refund burden
- Prevents generation without verified payment

Clarification, unsafe, urgent, unsupported professional-assistance, invalid age, missing consent, contradictory input, and unknown/error states never reach real checkout. Historical M1 `normal_allowed` / `needs_review` / `rejected` fixtures remain review evidence and are not the current purchase authority.

Waiting, not sending now, a temporary pause, and boundary-respecting assessment outcomes do not block purchase when the separate server-owned assistance eligibility is valid.

---

## 4. Public MVP Payment Automation

Public MVP payment flow:

1. User passes safety screening and reaches the final confirmation screen
2. User reviews or corrects the dedicated `私は18歳以上です` boolean self-attestation and relevant customer-facing consultation/contact facts
3. User reviews or corrects the delivery/recovery email
4. Server confirms adult self-attestation and current server-owned purchase eligibility
5. If no valid trusted session is bound to the same verified email, mailbox control is verified and server-authoritatively bound to the current purchase authority and Purchase Intent
6. User reviews and confirms the final JPY 980 purchase terms
7. After separate implementation authorization, the user starts the Charter-defined Payment flow
8. Server-authoritative Provider evidence verifies Payment success; browser display is not authority
9. System creates at most one normalized Purchase and issues exactly one Assessment Grant for the verified Purchase
10. System starts one Logical Assessment and performs fulfillment
11. Result delivery/recovery uses the currently verified delivery/recovery email and canonical Report
12. The Assessment Grant is consumed exactly once under Charter-defined recovery rules

When the Customer changes the delivery/recovery email, any prior binding cannot carry over silently and the new email must be verified before real Payment. A valid trusted session bound to the unchanged verified email may avoid repeat mailbox verification only; it cannot avoid Safety or final purchase confirmation.

The production server validation described above is required before public release and is not implemented by B2. The age gate uses the dedicated required boolean checkbox `私は18歳以上です`; it does not collect age bands, date of birth, or identity documents solely for eligibility. The current RequestForm and prepayment gate already follow this direction and are not modified by B2.

Manual payment confirmation is not the target public flow.

Manual payment confirmation may be used only during development, QA, or emergency incident handling.

Provider callback or other server-authoritative success verification is required before public release. The accepted Charter states Provider-independent integrity rules, but exact Stripe/PAY.JP objects, events, signatures, ordering, retries, reconciliation evidence, timeouts, refund relations, and recovery mechanics remain Provider-evidence-gated and unimplemented.

### Exceptional post-payment fulfillment failure

Safety-before-payment remains the controlling design, but later milestones must handle an exceptional failure after confirmed payment, including server-side reclassification, output-Safety failure, repeated AI-generation failure, or a system outage.

Required future state sequence:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

Do not deliver a normal report when fulfillment is Safety-blocked. Retry only technically recoverable failures. For Product or technical failure, perform bounded same-Purchase recovery without recharge. If secure and valid fulfillment remains impossible, use a full JPY 980 ordinary refund, prevent duplicate refunds, record reasons and state transitions, support operator notification, and communicate result/refund status to the user. Do not automatically deliver delayed output after a refund has been finalized. An unintended post-Payment Safety bypass is Payment Integrity remediation rather than ordinary cancellation and corrects the actual unintended economic charge without a JPY 980 cap.

No payment, webhook, generation, refund, notification, or state-machine implementation is authorized by Task M1-P1-R1.

---

## 5. Accepted Stripe Strategy / Evidence Boundary and PAY.JP Historical Clarification Copy

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

Current status: The Customer-facing / Public-copy Alignment, Stripe Feasibility Evidence Preparation, Lane B Human Decision Package, B2 authority, and B3 review-ready Website/Public Surface implementation remain accepted complete at their separate levels. Lane A remains `preparation_human_approved / external_action_not_authorized / not_submitted / null` but is preserved inactive. Stripe Sales is `not_used_by_human_direction`, which is not a Provider outcome. Lane B/C remain blocked pending downstream requirements, and actual Stripe contact/submission and account/business/site/category/Live Payment or payment-method evidence acquisition remain unauthorized and evidence-gated. Stripe feasibility/account/contact/approval/activation/formal selection and desired-method eligibility remain absent, incomplete, or unverified. PAY.JP is paused fallback; its production-use application remains Not submitted and it is Not approved or selected.

Accepted refund/fulfillment direction: before Payment, cancellation is `JPY 0`; after successful Payment and before `generation_started`, full `JPY 980` cancellation/refund is allowed only when server-authoritative evidence objectively proves the timing; after generation starts or successful fulfillment, dissatisfaction alone is not ordinarily sufficient, without excluding statutory rights or serious defects. Technical failure uses bounded same-Purchase recovery without recharge and full JPY 980 refund if fulfillment remains impossible. Payment Integrity remediation corrects the actual economic error without a JPY 980 cap. Generation starts only after server-authoritative Payment success; result-page delivery and verified delivery/recovery-email notification use the same Purchase. No concrete delivery duration, state machine, Provider capability, or implementation is established here.

PAY.JP provides no pre-application screening. The following copy is preserved as an unsent historical fallback artifact and may be adapted only after separate reactivation/contact authority. It is not send-ready, not a current prerequisite, and not approval evidence.

Historical/optional clarification copy:

```text
AIを活用した恋愛メッセージ分析・判断支援デジタルレポートを検討しています。

利用者が恋愛関係の状況、返信状況、送信予定のメッセージ等を入力し、AIが整理・分析したうえで、文面が相手に与えうる印象、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案をデジタルレポートとして提供します。

ユーザー向けの商品表現として「恋のメッセージ鑑定ノート」「鑑定ノート」「鑑定書」を使用します。タロット、占星術、生年月日、数秘術、霊感その他の超自然的な占術は使用しません。医療、診断、カウンセリング、法律相談、調査、相手の本心断定、復縁保証、返信保証または未来保証は行いません。

単発価格は税込980円程度を予定しています。
納品形式はメールまたは専用URLでのデジタル鑑定書です。

上記の機能および表示内容を踏まえ、貴社ではどの業種・商品カテゴリとして扱われるか、また決済利用が可能かをご教示ください。
利用に必要な注意書き、制限、公開ページ、返金・デジタルコンテンツ要件、個人申込み要件、手数料、reserveまたは売上保留条件も教えてください。

公開MVPでは、フォーム送信後に安全チェックを行い、通常鑑定が可能な場合のみ決済へ進みます。
決済成功後に鑑定書生成と結果URL通知を自動化する予定です。
Webhookまたは決済成功確認の利用可否も確認したいです。
```

---

## 6. Refund Policy Draft

Accepted future ordinary-refund or Payment Integrity directions, subject to implementation and Provider evidence:

- duplicate payment: Payment Integrity remediation of the actual unintended economic amount, not an ordinary Product refund
- payment completed but service cannot be delivered: bounded same-Purchase recovery without recharge, then full JPY 980 ordinary refund if secure and valid fulfillment remains impossible
- exceptional post-payment Safety bypass: Payment Integrity remediation, not ordinary cancellation
- system/operator Product fulfillment error: same-Purchase recovery, no recharge, then full JPY 980 ordinary refund if fulfillment remains impossible

Refund not generally allowed:

- after digital diagnosis has been delivered
- user dislikes the result
- user did not get desired reply from partner
- partner reaction was different from expectation

Internal draft direction, not publication-ready wording:

正常な納品後は、鑑定内容への不満のみを理由とする返金は原則対象外です。ただし、法令上の権利および重大なProduct defectの救済を排除しません。
Productまたは技術上の提供不能では同一Purchaseで復旧し、再課金せず、安全かつ有効な履行が不可能な場合は税込980円を全額返金する方向です。重複決済その他の意図しない経済的chargeはPayment Integrity remediationとして実際の誤りを上限なく是正します。具体的な返金方法・条件・時期は決済事業者選定後に確定します。

Do not claim automatic refund execution, provider refund API support, fee reimbursement, a refund deadline, reflection timing, or a concrete operator-console procedure before provider selection and later specification.
