# PAYMENT_PROVIDER_RISK_NOTE.md

## 0. Purpose

This document records payment provider risk for 月の返事.

Payment provider must not be assumed before checking category rules and review requirements.

---

## 1. Current Policy

Do not assume Stripe as the default payment provider.

月の返事 may be interpreted as:

- fortune-telling
- love diagnosis
- AI-assisted emotional guidance
- digital consultation-like service

Because of this, payment provider category rules must be checked before Stage 5 Payment implementation.

---

## 2. Candidate Providers

Potential candidates:

- PAY.JP
- KOMOJU
- STORES
- Square
- Stripe
- Other Japan-friendly payment providers

No provider is approved yet.

---

## 3. Provider Inquiry Requirement

Before implementing real payment:

- Confirm whether AI-assisted love diagnosis / fortune-telling-like digital service is allowed
- Confirm whether one-shot digital diagnosis is allowed
- Confirm refund policy requirements
- Confirm prohibited wording
- Confirm required legal disclosures
- Confirm whether PayPay or credit card support is available
- Confirm whether 特商法表記 is required before review

---

## 4. Product Description for Provider Inquiry

Use this neutral description when contacting providers:

```text
恋愛メッセージに関するAI鑑定ノートサービスを検討しています。

サービス内容は、返信待ち・追いメッセージ・曖昧な関係などの恋愛相談について、AIを活用して占い/エンタメ/感情整理目的の鑑定書を作成し、ユーザーにデジタル納品するものです。

医療、診断、カウンセリング、法律相談、相手の本心断定、復縁保証、返信保証は行いません。

単発価格は税込980円程度を予定しています。
納品形式はWeb上の結果ページまたはメールでのデジタル鑑定書です。

このようなAIを活用した恋愛鑑定/占い寄りのデジタルサービスで、決済利用は可能でしょうか？
また、利用にあたって必要な注意書きや制限があれば教えてください。
```

---

## 5. Implementation Rule

Stage 5 Payment must not start until provider risk is reviewed.

Payment implementation must remain provider-abstracted where practical.

Do not hard-code business logic around a single payment provider unless approved.
