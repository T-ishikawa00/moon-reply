# ORDER_FORM_SPEC.md

## B2 accepted status

`stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete` on `2026-08-13`. Human + ChatGPT review / acceptance is `complete / complete`. This specification-only alignment does not authorize UI/code mutation, Payment implementation, or publication.

## 0. Purpose

This document defines the Phase 1 diagnosis request form.

The product is `月の返事 単発鑑定ノート`: an AI-assisted relationship-message analysis and decision-support digital report. `鑑定ノート` is a user-facing report-format and brand term; the service does not use divination or supernatural methods.

The form should collect enough context to create a high-quality diagnosis while avoiding unnecessary personal information.

The public MVP target is a self-hosted form, not Google Forms as the production tool.

Task M1-P1-R1 aligns documentation only. It does not authorize a form redesign, file input, route change, submission, persistence, or other implementation.

---

## 1. Public MVP Form Tool

Public MVP:

- Self-hosted form inside the Next.js app

Development/QA:

- Mock form or temporary Google Forms may be used for copy/testing only

Public submission flow:

1. User submits request
2. Safety screening runs
3. Server-owned eligibility evaluates adult confirmation, Safety, assistance scope, input validity, and authority evidence
4. Clarification and fail-closed semantic conditions do not proceed to normal diagnosis or Payment
5. The user proceeds toward Payment only when the current server-owned result establishes `purchaseGateSatisfied=true`; the form/browser cannot assert this

---

## 2. Form Sections

These are logical information groups, not a decision that the UI must use one page or six visible steps. One-page versus multi-step layout remains a Human gate before M1-I2.

The initial paid Web MVP is text-only. No image/file input, LINE screenshot upload, OCR, image AI analysis, image storage, or automatic personal-information masking is included.

### Section 1: Basic Information

Fields:

- `私は18歳以上です` の必須boolean自己申告
- 呼ばれたい名前 or ニックネーム
- 鑑定結果の受け取りメールアドレス
- このサービスがAIを利用することへの同意
- 医療/診断/カウンセリングではないことへの同意

Age eligibility rules:

- Customer-facing controlは専用チェックボックス `私は18歳以上です`
- 値は必須boolean自己申告
- 年齢適格性の確認だけを目的として、年齢層、生年月日、身分証明書または公的本人確認書類を収集しない
- 将来の実決済フローでは、支払操作へ進む前にserver-owned Purchase authorityが成人確認済みであることを要求する
- B2はdocument/spec alignmentであり、Production server enforcementの実装完了を意味しない

This is required self-attestation, not strict identity verification. The current RequestForm and prepayment gate already follow this direction and are not B2 mutation targets.

Do not ask for:

- full legal name
- phone number
- address
- exact workplace
- unnecessary personal identifiers

---

### Section 2: Relationship Context

Fields:

- 相手との関係
  - 付き合う前
  - 交際中
  - 元恋人
  - マッチングアプリ
  - 職場/学校/趣味の知り合い
  - 曖昧な関係
  - その他

- 相手との状況
  - 最近出会った
  - 何度か会っている
  - 毎日連絡している
  - 最近返信が遅い
  - 既読/未読のまま止まっている
  - 断られた/予定が流れた
  - 復縁未満
  - その他

---

### Section 3: Message Context

Fields:

- 現在の状況
- 実際のやり取り（LINE等から必要部分をコピーして貼り付け可能）
- 最後に相手から来たメッセージ
- 最後に自分が送ったメッセージ
- 送ろうとしている文面
- いつから返事がないか
- 直近のやり取りの流れ
- スクショではなく、必要な範囲で文章として入力してもらう

Required guidance direction near the conversation field:

> LINEなどのやり取りは、必要な部分だけコピーして貼り付けられます。名前は「相手」「自分」「Aさん」などに置き換え、実名・電話番号・住所・勤務先などは削除してください。

The guidance must not request an entire conversation. The information architecture must make at least `現在の状況`, `実際のやり取り`, and `送ろうとしている文面` understandable even if the eventual UI groups or progressively discloses fields differently.

---

### Section 4: Emotion and Desired Outcome

Fields:

- 今いちばん不安なこと
- 本当はどうしたいか
- 鑑定で一番知りたいこと
- 送るか待つか迷っているか
- 今夜中に送ろうとしているか

---

### Section 5: Safety Screening

Ask yes/no:

- 自分を傷つけたい気持ちがある
- 相手を傷つけたい気持ちがある
- 相手の家や職場に行こうとしている
- 待ち伏せを考えている
- 相手を脅す文面を送りたい
- DV/モラハラ/強い束縛/恐怖がある
- 未成年との恋愛・面会に関する相談である
- 実名や個人情報を晒したい
- 監視・ログイン確認・居場所確認をしたい

If any yes:

- Do not provide normal diagnosis.
- Route to the appropriate semantic unsafe, urgent, unsupported-assistance, clarification, or other fail-closed handling.
- Do not proceed to payment for normal diagnosis unless current server-owned eligibility establishes `purchaseGateSatisfied=true`.
- Do not infer Purchase authority from browser, client, route, or localStorage state.
- Refund may be required if payment already occurred due to an exceptional state.

---

### Section 6: Consent

Required checkboxes:

- 私は18歳以上です
- AIを利用した鑑定であることを理解しました
- 医療/診断/カウンセリングではないことを理解しました
- 相手の本心・返信・復縁を保証するものではないことを理解しました
- 実名・住所・電話番号など不要な個人情報を入力しません
- 危険相談は原則として決済前に通常鑑定を停止し、意図しない決済後のSafety bypassは通常取消ではなくPayment Integrity remediationの対象となることを理解しました
- 正常な納品後は不満のみを理由とする返金は原則対象外ですが、法令上の権利および重大なProduct defectの救済を排除しないことを理解しました

---

## 3. Form Completion Behavior

If current server-owned eligibility establishes `purchaseGateSatisfied=true`:

- Show next step toward payment
- Do not generate diagnosis before payment success

If an unsafe, urgent, unsupported professional-assistance, invalid, contradictory, unknown, or technical-error condition remains:

- Show cannot-provide-normal-diagnosis message
- Do not send user to normal payment flow
- Provide safety/refund guidance where applicable

If clarification or additional information is required before eligibility can be established:

- Stop the initial-MVP purchase flow.
- Do not show an ordinary report or normal message suggestion.
- Offer return/edit and review-safe unsupported-case/contact information only.

Waiting, not-sending-now, temporary pause, and boundary-respecting support are not automatically disqualifying when separate assistance eligibility remains valid. They still require a fresh current server-owned result before Payment.

Refund guidance applies only to an exceptional state in which payment already succeeded before later fulfillment became blocked or failed. Product/technical failure uses bounded same-Purchase recovery without recharge and a full JPY 980 ordinary refund if secure, valid fulfillment remains impossible. Safety bypass and other unintended economic charges are Payment Integrity remediation rather than ordinary cancellation. No Provider capability, automatic refund, timing, or operator procedure is claimed by this form specification.

Development/QA may use mocked safety outcomes and placeholder payment routes, but the public MVP must keep the sequence:

form submission → adult confirmation and safety/assistance evaluation → server-owned purchase eligibility → payment → generation.
