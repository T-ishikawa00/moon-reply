# ORDER_FORM_SPEC.md

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
3. If rejected, normal diagnosis does not proceed
4. If allowed, user proceeds to payment

---

## 2. Form Sections

These are logical information groups, not a decision that the UI must use one page or six visible steps. One-page versus multi-step layout remains a Human gate before M1-I2.

The initial paid Web MVP is text-only. No image/file input, LINE screenshot upload, OCR, image AI analysis, image storage, or automatic personal-information masking is included.

### Section 1: Basic Information

Fields:

- 年齢層
- 呼ばれたい名前 or ニックネーム
- 鑑定結果の受け取りメールアドレス
- このサービスがAIを利用することへの同意
- 医療/診断/カウンセリングではないことへの同意

Age eligibility rules:

- 年齢層は必須入力
- 選択肢は`18〜24歳`、`25〜29歳`、`30〜34歳`、`35〜39歳`、`40歳以上`のみ
- `回答しない`は設けない
- 年齢層の入力欄付近に「月の返事は18歳以上の方を対象としています」と表示する
- 専用の「18歳以上です」チェックボックスは設けない
- 生年月日、身分証明書または公的本人確認書類は収集しない
- 公開フローでは、支払操作へ進む前にサーバー側でも許可された年齢層の値を検証する

This is a required self-declared age-group gate, not strict identity verification.

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
- Route to rejected or needs_review.
- Do not proceed to payment for normal diagnosis unless eligibility is cleared.
- Refund may be required if payment already occurred due to an exceptional state.

---

### Section 6: Consent

Required checkboxes:

- AIを利用した鑑定であることを理解しました
- 医療/診断/カウンセリングではないことを理解しました
- 相手の本心・返信・復縁を保証するものではないことを理解しました
- 実名・住所・電話番号など不要な個人情報を入力しません
- 危険相談は原則として決済前に通常鑑定を停止し、例外的な決済後の提供不能は将来の返金/operator対応対象になり得ることを理解しました
- 納品後は原則返金不可であることを理解しました

---

## 3. Form Completion Behavior

If safety screening returns normal_allowed:

- Show next step toward payment
- Do not generate diagnosis before payment success

If safety screening returns rejected:

- Show cannot-provide-normal-diagnosis message
- Do not send user to normal payment flow
- Provide safety/refund guidance where applicable

If safety screening returns needs_review:

- Stop the initial-MVP purchase flow.
- Do not show an ordinary report or normal message suggestion.
- Offer return/edit and review-safe unsupported-case/contact information only.

Refund guidance applies only to an exceptional state in which payment already succeeded before later fulfillment became blocked or failed. No provider capability, automatic refund, timing, or operator procedure is claimed by this form specification.

Development/QA may use mocked safety outcomes and placeholder payment routes, but the public MVP must keep the sequence:

form submission → safety screening → payment → generation.
