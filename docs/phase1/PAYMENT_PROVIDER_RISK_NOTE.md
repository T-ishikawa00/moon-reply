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

## 3. Provider Review / Evidence Requirement

Before implementing real payment:

- Disclose the actual AI relationship-message analysis and decision-support flow
- Disclose the user-facing `鑑定ノート` and `鑑定書` terms
- Obtain the applicable provider/category decision through the provider's authoritative review route; do not self-declare an exemption or category
- Confirm whether the one-shot digital report is accepted
- Confirm refund policy requirements
- Confirm prohibited wording
- Confirm required legal disclosures
- Confirm whether PayPay or credit card support is available
- Confirm whether 特商法表記 is required before review

For PAY.JP specifically:

- PAY.JP is the strategic primary Web direction but remains Not approved / not selected
- disclose the complete truthful service in the production-use application
- complete Production Application Readiness and obtain explicit Human submission authorization before any future submission
- preserve the authoritative PAY.JP/card-company application/review outcome and every condition
- do not use optional support clarification as preapproval or as a substitute for formal review evidence

KOMOJU, STORES, or another fallback must use its own verified review/application/inquiry route. Do not generalize the PAY.JP process.

---

## 4. Product Description for Provider Review or Specific Clarification

Use this neutral description in an authoritative application/review or, when necessary, a narrowly scoped support clarification:

```text
AIを活用した恋愛メッセージ分析・判断支援デジタルレポートを検討しています。

利用者が恋愛関係の状況、返信状況、送信予定のメッセージ等を入力し、AIが整理・分析したうえで、文面が相手に与えうる印象、送る・待つ・修正するといった判断材料、メッセージ案および短期的な行動案を提供します。

ユーザー向けの商品表現として「恋のメッセージ鑑定ノート」「鑑定ノート」「鑑定書」を使用します。タロット、占星術、生年月日、数秘術、霊感その他の超自然的な占術は使用しません。医療、診断、カウンセリング、法律相談、調査、相手の本心断定、復縁保証、返信保証または未来保証は行いません。

単発価格は税込980円です。
納品形式はWeb上の結果ページまたはメールでのデジタル鑑定書です。

上記の機能および表示内容を省略せず、貴社の正式な申込・審査経路で審査を受けます。specific support clarificationを行う場合は、未解決の具体的な質問だけを確認します。
```

For PAY.JP, this description belongs in production-application readiness and the actual production-use application. Support does not provide pre-application approval.

---

## 5. Implementation Rule

Stage 5 Payment must not start until provider risk is reviewed.

Payment implementation must remain provider-abstracted where practical.

Do not hard-code business logic around a single payment provider unless approved.
