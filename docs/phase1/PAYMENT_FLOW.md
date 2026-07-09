# PAYMENT_FLOW.md

## 0. Purpose

This document defines payment flow candidates for Phase 1 sales MVP.

No payment API implementation is planned in this phase.

Use external payment links or simple storefront tools where possible.

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

---

## 3. Preferred Phase 1 Flow

Preferred:

1. User submits diagnosis request form
2. User pays via external payment link
3. Payment confirmation is manually checked
4. Diagnosis is delivered manually

Alternative:

1. User pays first
2. User receives order form link
3. User fills order form
4. Diagnosis is delivered manually

Recommended initial flow:

- Form first, then payment

Reason:

- Safety screening can happen before payment
- Dangerous or unsupported cases can be rejected before payment
- Reduces refund burden

---

## 4. Payment Provider Inquiry Copy

Inquiry message:

```text
恋愛メッセージに関するAI鑑定ノートサービスを検討しています。

サービス内容は、返信待ち・追いメッセージ・曖昧な関係などの恋愛相談について、AIを活用して占い/エンタメ/感情整理目的の鑑定書を作成し、ユーザーにデジタル納品するものです。

医療、診断、カウンセリング、法律相談、相手の本心断定、復縁保証、返信保証は行いません。

単発価格は税込980円程度を予定しています。
納品形式はメールまたは専用URLでのデジタル鑑定書です。

このようなAIを活用した恋愛鑑定/占い寄りのデジタルサービスで、決済利用は可能でしょうか？
また、利用にあたって必要な注意書きや制限があれば教えてください。
```

---

## 5. Refund Policy Draft

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
