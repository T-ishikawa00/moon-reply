# PAYMENT_PROVIDER_RISK_NOTE.md

## 0. Purpose

This document records payment provider risk for 月の返事.

Payment provider must not be assumed before checking category rules and review requirements.

---

## 1. Current Policy

Stripe Checkout is the Human + ChatGPT accepted strategic primary Web direction to investigate and prepare. Do not treat that Product/strategy acceptance as Stripe feasibility, account/contact, approval/activation, formal selection, or implementation authority.

月の返事の内部公式定義は「AIを活用した恋愛メッセージ分析・判断支援デジタルレポート」である。一方、provider may interpret the complete service as:

- fortune-telling or a restricted adjacent category
- love diagnosis
- AI-assisted emotional guidance
- digital consultation-like service

Because of this, payment provider category rules must be checked before Stage 5 Payment implementation.

Stripe's Japan-specific prohibited-business list includes Psychic services and fortune tellers. Moon Reply's truthful non-divination alignment is not approval. Customer-facing 鑑定ノート wording, AI use, actual behavior, methods not used, and non-guarantees must be disclosed without disguise. Actual account/business/site/category/Live Payment and method-specific evidence is required.

---

## 2. Candidate Providers

Potential candidates:

- Stripe — accepted strategic primary direction; no feasibility/account/contact/approval/activation/formal selection evidence
- PAY.JP
- KOMOJU
- STORES
- Square
- Other Japan-friendly payment providers

PAY.JP is paused fallback. No provider is approved or formally selected.

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
- Confirm cards, Apple Pay, Google Pay, and PayPay separately for the actual account/category/flow
- Confirm whether 特商法表記 is required before review

For Stripe:

- feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete
- preserve actual truthful account/business/site/category/Live Payment and each method outcome
- preserve Checkout/product/price, test/live, webhook, refund/dispute, descriptor, linkage, fee/settlement, and future RevenueCat evidence
- return to explicit Human launch review if any desired method is unavailable; PayPay unavailable is not automatic approval to omit it

For PAY.JP, preserved readiness and application requirements remain paused fallback evidence. Any reactivation requires current-source re-review and separate Human authority. Other fallbacks must use their own verified route.

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

For any future Stripe evidence acquisition, this complete truthful description must not hide 鑑定ノート or AI use; wording changes do not guarantee approval. For PAY.JP after possible reactivation, the description belongs in its application route; support does not provide pre-application approval.

---

## 5. Implementation Rule

Payment implementation must not start until truthful Customer-facing/public-copy alignment, authoritative Stripe feasibility/method evidence, Human formal Provider selection, and separate implementation authorization are complete. Production QA does not authorize Production Payment; Soft Launch requires separate Production Payment authorization.

Payment implementation must remain provider-abstracted where practical.

Do not hard-code business logic around a single payment provider unless approved.
