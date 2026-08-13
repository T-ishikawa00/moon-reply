# PAYMENT_CONFIRMATION_SCREEN_SPEC.md

## B2 Candidate status

`stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`. Human + ChatGPT review / acceptance is `complete / complete`. This specification-only alignment does not authorize UI/code implementation, Checkout, Provider operations, Payment, or publication.

## Status

Internal product/compliance specification.

This is not legal advice and is not an implemented or publication-approved screen.

Payment Charter v1 is `human_chatgpt_accepted_complete` as of `2026-08-12`. This specification is subordinate to the accepted Charter, but Charter acceptance and this specification do not authorize screen implementation, checkout, a Provider SDK/API, or a payment action.

---

## 0. Purpose

Defines the final review screen shown immediately before the contractual payment action.

This is a specification, not an implemented screen.

---

## 1. Required Information

Show together and clearly:

- Service: 月の返事
- Product: 恋のメッセージ鑑定ノート
- Product description: AIによる恋愛メッセージ分析・判断支援デジタルレポート
- Service eligibility: 月の返事は18歳以上を対象とする
- Dedicated adult self-attestation: `私は18歳以上です` with a required boolean value
- Verified delivery/recovery email state bound to the current Purchase authority
- Quantity: 1 consultation / 1 assessment note
- Total price: 税込980円
- Purchase type: one-time purchase
- Automatic renewal: none
- Additional charges: none, unless objectively applicable
- Payment method: [[PAYMENT_METHODS_TBD]] / Provider evidence pending
- Payment timing: [[PAYMENT_TIMING_TBD]] / Provider evidence pending
- Expected delivery timing: [[DELIVERY_TIMING_TBD]] / production-like measurement and Human approval pending
- Delivery method: protected result page plus notification to the applicable verified delivery/recovery email
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
- 私は18歳以上です

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
- review and correct the dedicated `私は18歳以上です` boolean self-attestation
- correct email address
- review or correct the customer-facing consultation/contact facts used for eligibility, without exposing internal classification terminology
- review purchase conditions
- cancel without payment

---

## 5. Delivery/Recovery Email Verification

The final confirmation must use a currently verified delivery/recovery email bound to the current purchase authority and Purchase Intent.

If the Customer edits the email:

- the previous verification binding cannot silently carry over;
- the current purchase authority must not treat the new email as verified; and
- the flow must return to the required mailbox-verification step before real Payment.

If a still-valid trusted session is server-verifiably bound to the same unchanged verified email, repeat verification is not required merely because the Customer is buying another assessment. Safety eligibility and final purchase confirmation are still required for every Purchase.

Browser, client, or localStorage state alone cannot assert verified or trusted status. The trusted session is neither Payment authority nor Safety authority and does not introduce mandatory account creation or login. Exact verification and session UI/implementation remain separately unauthorized.

---

## 6. Age Eligibility Gate

- Use the dedicated required checkbox `私は18歳以上です` as boolean self-attestation.
- Do not collect an age band, date of birth, or identity document solely for initial-MVP age eligibility.
- In the future real paid flow, server-owned Purchase authority must require confirmed adult self-attestation before Payment.
- B2 aligns the specification only and does not claim Production server enforcement.

The initial MVP uses required self-attestation, not strict identity verification. The current RequestForm and prepayment gate are already aligned and are not changed by B2.

---

## 7. Safety Gate

Only a current server-owned eligible result with `purchaseGateSatisfied=true` may reach a real contractual payment action.

Clarification, unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, and technical-error states must not reach real payment. Historical M1 `needs_review` and `rejected` review fixtures remain fail-closed evidence but are not the current purchase-authority vocabulary.

Waiting, not sending now, a temporary pause, or boundary-respecting support is not disqualifying by itself when the separate assistance eligibility is valid.

The server must enforce the gate. A browser display, redirect, client-side state, visible button, or hidden button is not payment or purchase authority.

---

## 8. Refund and fulfillment summary

The future final-confirmation surface must summarize these accepted directions without claiming implementation:

- before Payment: no charge; the Customer may stop;
- after successful Payment and objectively before `generation_started`: full JPY 980 ordinary refund only when server-authoritative evidence establishes the timing;
- Product or technical failure: bounded same-Purchase recovery, no recharge, and full JPY 980 ordinary refund if secure and valid fulfillment remains impossible;
- after generation starts and valid fulfillment succeeds: dissatisfaction alone is not ordinarily sufficient, without excluding statutory rights or serious Product-defect remedies;
- duplicate charge, wrong amount, wrong Customer, wrong Request, Safety bypass, or another unintended economic charge: Payment Integrity remediation that corrects the actual error without a JPY 980 cap.

The surface must allow review and correction before the contractual Payment action and provide appropriate Terms, Privacy, Tokushoho, Refund, Contact, AI-disclosure, and Unsupported-Cases references. Provider execution mechanics and concrete processing or delivery durations remain unresolved.
