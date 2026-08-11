# PAYMENT_CONFIRMATION_SCREEN_SPEC.md

## Status

Internal product/compliance specification.

This is not legal advice and is not an implemented or publication-approved screen.

The Payment Charter v1 Candidate is formulated with status `payment_charter_v1_candidate_ready_pending_human_chatgpt_review`, but is not Human + ChatGPT accepted. This screen becomes subordinate to the Charter only after acceptance and separate implementation authorization; it does not authorize checkout, a Provider SDK/API, or a payment action.

---

## 0. Purpose

Defines the final review screen shown immediately before the contractual payment action.

This is a specification, not an implemented screen.

---

## 1. Required Information

Show together and clearly:

- Product: 月の返事 単発鑑定ノート
- Product description: AIによる恋愛メッセージ分析・判断支援デジタルレポート
- Service eligibility: 月の返事は18歳以上を対象とする
- Age group selected on the request form
- Quantity: 1 consultation / 1 reading
- Total price: 税込980円
- Additional charges: none, unless objectively applicable
- Payment method
- Payment timing
- Expected delivery timing
- Delivery method
- AI use
- Entertainment / information / emotional-organization purpose
- No tarot, astrology, birth-date, psychic, spiritual, or supernatural method
- No outcome guarantee
- Refund/cancellation summary
- Unsupported-case handling
- Contact link
- Terms link
- Privacy Policy link
- 特商法 disclosure link
- Refund Policy link

Displayed facts must match the final provider contract, operator disclosures, and approved legal-page drafts.

---

## 2. Required Confirmations

Required confirmations:

- AIが入力内容を整理・分析する鑑定ノートであることを理解しました
- 医療・心理・法律サービスではないことを理解しました
- 結果を保証しないことを理解しました
- 返金条件を確認しました
- 利用規約に同意します
- プライバシーポリシーに同意します

Marketing email consent must not be required for purchase.

Result-delivery consent and marketing-email consent must be separately identified and recorded.

---

## 3. Payment Button

The button must make the contractual action clear.

Candidate:

- `980円を支払い、鑑定を申し込む`

Do not use ambiguous labels such as:

- 次へ
- 続ける
- 確認
- 無料で開始

Final button wording must be checked against the implemented purchase flow and current official guidance.

---

## 4. Editability

Before payment, the user must be able to:

- return and revise request content
- review and correct the age group selected on the request form
- correct email address
- review or correct the customer-facing consultation/contact facts used for eligibility, without exposing internal classification terminology
- review purchase conditions
- cancel without payment

---

## 5. Age Eligibility Gate

- Do not use a dedicated `18歳以上です` checkbox.
- Use the required age-group selection made on the request form.
- Offer only the allowed 18-or-older age-group values.
- In the production flow, the server must validate an allowed age-group value before payment.
- Do not collect a date of birth or identity document for the initial MVP.

The initial MVP uses a required self-declared age-group gate, not strict identity verification.

---

## 6. Safety Gate

Only a current server-owned eligible result with `purchaseGateSatisfied=true` may reach a real contractual payment action.

Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error states must not reach real payment. Historical M1 `needs_review` and `rejected` review fixtures remain fail-closed evidence but are not the current purchase-authority vocabulary.

Waiting, not sending now, a temporary pause, or boundary-respecting support is not disqualifying by itself when the separate assistance eligibility is valid.

The server must enforce the gate. A browser display, redirect, client-side state, visible button, or hidden button is not payment or purchase authority.
