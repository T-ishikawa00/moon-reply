# PAYMENT_FLOW.md

## 0. Purpose

This document defines the payment flow for the Phase 1 automated public MVP.

No payment API implementation is included in this document.

The public MVP requires payment success verification before AI judgment or diagnosis generation.

---

## 1. Price

Initial price:

- ¥980 per diagnosis

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
2. Safety screening runs
3. User proceeds to payment only if normal diagnosis is allowed
4. Payment provider confirms success
5. System triggers AI judgment and diagnosis generation
6. Result page is created
7. Result URL is sent by email

The form first → safety check → payment order must be maintained.

Reason:

- Safety screening can happen before payment
- Dangerous or unsupported cases can be rejected before payment
- Reduces refund burden
- Prevents generation without verified payment

---

## 4. Public MVP Payment Automation

Public MVP payment flow:

1. User passes safety screening
2. User starts payment
3. Payment provider confirms success
4. System marks request as paid
5. System triggers AI judgment and diagnosis generation
6. Result page is created
7. Result URL is sent by email

Manual payment confirmation is not the target public flow.

Manual payment confirmation may be used only during development, QA, or emergency incident handling.

Payment provider webhook or success verification is required before public release.

---

## 5. Payment Provider Inquiry Copy

Inquiry message:

```text
恋愛メッセージに関するAI鑑定ノートサービスを検討しています。

サービス内容は、返信待ち・追いメッセージ・曖昧な関係などの恋愛相談について、AIを活用して占い/エンタメ/感情整理目的の鑑定書を作成し、ユーザーにデジタル納品するものです。

医療、診断、カウンセリング、法律相談、相手の本心断定、復縁保証、返信保証は行いません。

単発価格は税込980円程度を予定しています。
納品形式はメールまたは専用URLでのデジタル鑑定書です。

このようなAIを活用した恋愛鑑定/占い寄りのデジタルサービスで、決済利用は可能でしょうか？
また、利用にあたって必要な注意書きや制限があれば教えてください。

公開MVPでは、フォーム送信後に安全チェックを行い、通常鑑定が可能な場合のみ決済へ進みます。
決済成功後に鑑定書生成と結果URL通知を自動化する予定です。
Webhookまたは決済成功確認の利用可否も確認したいです。
```

---

## 6. Refund Policy Draft

Refund allowed:

- duplicate payment
- payment completed but service cannot be delivered
- dangerous consultation that cannot be handled as normal diagnosis
- system/operator error

Refund not generally allowed:

- after digital diagnosis has been delivered
- user dislikes the result
- user did not get desired reply from partner
- partner reaction was different from expectation

Required wording:

デジタル鑑定書の性質上、納品後の返金は原則できません。
ただし、重複決済、提供不能、危険相談により通常鑑定を提供できない場合は返金対象となります。
