# PAYMENT_FLOW.md

## 0. Purpose

This document defines the payment flow for the Phase 1 automated public MVP.

No payment API implementation is included in this document.

The public MVP requires payment success verification before AI judgment or diagnosis generation.

---

## 1. Price

Initial price:

- 税込¥980 per request / one 鑑定ノート
- one-shot purchase
- no automatic renewal

The initial MVP has no free complete reading, ad-supported reading, advertising, free ticket/coin/point, subscription, or repeatable first-free path.

---

## 2. Payment Candidates

Candidates:

- STORES
- PAY.JP payment link or simple payment flow
- KOMOJU
- Square
- BASE as fallback if category allowed

Need confirmation:

- AI-assisted fortune-telling / love diagnosis category acceptance
- digital service delivery
- refund handling
- PayPay availability
- credit card availability
- platform rules around fortune-telling/counseling-like services
- webhook or success verification support

---

## 3. Required Public MVP Sequence

Required sequence:

1. User submits diagnosis request form
2. Server validates that the required age-group value is one of the allowed 18-or-older values
3. Safety screening runs
4. User proceeds to payment only if age eligibility is valid and normal diagnosis is allowed
5. Payment provider confirms success
6. System triggers AI judgment and diagnosis generation
7. Result page is created
8. Result URL is sent by email

The form → server-side age-group validation → safety check → payment order must be maintained in the public flow.

Reason:

- Safety screening can happen before payment
- Dangerous or unsupported cases can be rejected before payment
- Reduces refund burden
- Prevents generation without verified payment

`needs_review`, `rejected`, invalid age, missing consent, contradictory input, and unknown/error states never reach purchase confirmation or checkout.

---

## 4. Public MVP Payment Automation

Public MVP payment flow:

1. User passes safety screening and reaches the final confirmation screen
2. User reviews or corrects the selected age group
3. Server confirms that the final required age-group value is one of the allowed 18-or-older values
4. User starts payment
5. Payment provider confirms success
6. System marks request as paid
7. System triggers AI judgment and diagnosis generation
8. Result page is created
9. Result URL is sent by email

The production server validation described above is required before public release and is not implemented by Task 18C-R1. The age gate uses the required age-group selection; it does not use a separate age checkbox, date of birth, or identity document.

Manual payment confirmation is not the target public flow.

Manual payment confirmation may be used only during development, QA, or emergency incident handling.

Payment provider webhook or success verification is required before public release.

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

Do not deliver a normal report when fulfillment is Safety-blocked. Retry only technically recoverable failures. Treat unrecoverable/unfulfillable service as a full-refund candidate, prevent duplicate refunds, record reasons and state transitions, support operator notification, and communicate result/refund status to the user.

No payment, webhook, generation, refund, notification, or state-machine implementation is authorized by Task M1-P1-R1.

---

## 5. Payment Provider Inquiry Copy

Inquiry message:

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

Future full-refund eligibility candidates:

- duplicate payment
- payment completed but service cannot be delivered
- exceptional post-payment Safety block that cannot be handled as a normal diagnosis
- system/operator error

Refund not generally allowed:

- after digital diagnosis has been delivered
- user dislikes the result
- user did not get desired reply from partner
- partner reaction was different from expectation

Internal draft direction, not publication-ready wording:

デジタル鑑定書の性質上、納品後の返金は原則できません。
ただし、重複決済または決済後の提供不能が確認された場合は、全額返金の対象候補となります。具体的な返金方法・条件・時期は決済事業者選定後に確定します。

Do not claim automatic refund execution, provider refund API support, fee reimbursement, a refund deadline, reflection timing, or a concrete operator-console procedure before provider selection and later specification.
