# PAYMENT_PROVIDER_RISK_NOTE.md

## 0. Purpose

This document records payment provider risk for 月の返事.

Payment provider must not be assumed before checking category rules and review requirements.

---

## 1. Current Policy

Do not assume Stripe as the default payment provider.

月の返事の内部公式定義は「AIを活用した恋愛メッセージ分析・判断支援デジタルレポート」である。一方、provider may interpret the complete service as:

- fortune-telling or a restricted adjacent category
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

- Disclose the actual AI relationship-message analysis and decision-support flow
- Disclose the user-facing `鑑定ノート` and `鑑定書` terms
- Confirm which category the provider applies; do not assert an exemption
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
AIを活用した恋愛メッセージ分析・判断支援デジタルレポートを検討しています。

利用者が恋愛関係の状況、返信状況、送信予定のメッセージ等を入力し、AIが整理・分析したうえで、文面が相手に与えうる印象、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案を提供します。

ユーザー向けの商品表現として「恋のメッセージ鑑定ノート」「鑑定ノート」「鑑定書」を使用します。タロット、占星術、生年月日、数秘術、霊感その他の超自然的な占術は使用しません。医療、診断、カウンセリング、法律相談、調査、相手の本心断定、復縁保証、返信保証または未来保証は行いません。

単発価格は税込980円程度を予定しています。
納品形式はWeb上の結果ページまたはメールでのデジタル鑑定書です。

上記の機能および表示内容を踏まえ、貴社ではどの業種・商品カテゴリとして扱われるか、また決済利用が可能かをご教示ください。
あわせて、必要な注意書き、制限、公開ページ、返金・デジタルコンテンツ要件、個人申込み要件、手数料、reserveまたは売上保留条件をご教示ください。
```

---

## 5. Implementation Rule

Stage 5 Payment must not start until provider risk is reviewed.

Payment implementation must remain provider-abstracted where practical.

Do not hard-code business logic around a single payment provider unless approved.
