# DELIVERY_WORKFLOW.md

## 0. Purpose

This document defines the automated public delivery workflow for the Phase 1 MVP.

Manual delivery may be used during development only.

The public MVP target is automatic result page generation and email notification after payment success.

Task M1-P1-R1 records future requirements only. It does not authorize AI generation, storage, result routes, file generation, email, payment, refund, or operator workflow implementation.

---

## 1. Corrected Public Delivery Workflow

Public MVP delivery flow:

1. Payment success is confirmed
2. AI judgment is generated
3. AI full diagnosis is generated
4. Output Safety and schema checks run
5. If allowed, the structured result is saved
6. Web鑑定ノート URL is created
7. 保存用鑑定書 presentation data is prepared from the same structured result
8. Result URL is sent by email
9. User opens the Web鑑定ノート and may review the save presentation
10. Feedback request is shown

Manual delivery may be used during development only.

---

## 2. Safety Branch

If dangerous content is detected:

- Do not generate normal romantic diagnosis
- Do not provide message wording that enables harm, stalking, coercion, or manipulation
- Use safety response
- Do not proceed to normal payment flow when detected before payment
- If payment already succeeded in an exceptional state, do not deliver a normal report and enter the future downstream failure/refund workflow
- Record the semantic unsafe, urgent, unsupported-assistance, clarification, or other fail-closed reason and the server-owned eligibility decision without treating a historical enum as Purchase authority

No delivery-generation path may begin unless valid Payment authority exists. Real Payment itself may be reached only after current server-owned eligibility establishes `purchaseGateSatisfied=true`; browser/client/localStorage state cannot establish that authority.

Danger types:

- self-harm
- harm to others
- DV/abuse
- stalking/waiting outside home/workplace
- threats
- monitoring/surveillance
- minor-related romantic/meeting request
- doxxing or personal information exposure

Future downstream sequence for an exceptional post-payment Safety block or unrecoverable technical failure:

```text
payment_succeeded
  -> fulfillment_blocked or fulfillment_failed
  -> refund_required
  -> operator_attention_required
  -> refunded
```

Recoverable technical failure may be retried. Unrecoverable or unfulfillable service is a full-refund candidate. Later implementation must prevent duplicate refunds, record the reason and state, notify an operator, and let the user receive a result or refund-status explanation. Automatic refund capability, provider API support, fees, deadlines, reflection timing, and operator-console steps remain unresolved.

---

## 3. Diagnosis Creation

Use approved golden samples as quality references:

- G001: waiting/reply anxiety
- G002: urge to send long follow-up
- G003: ambiguous relationship with positive alternative

Diagnosis must include:

- 今夜の結論
- 今の関係の整理
- 相手側にあり得る受け止め方
- あなたが不安になっている核心
- この文面がどう伝わる可能性があるか
- 今夜の推奨アクション
- 送る場合の文面案
- 3日間の行動プラン
- この分析の限界と注意点
- 逆効果なこと
- 今夜の判定
- 送るならこの一文
- 送らない場合/送った後の過ごし方
- 3日以内の方針
- 月からの一言
- 保存用メモ
- 感情タグ

For `送っていい`, `軽く送るならあり`, `今夜は待つ`, and `今日は送らない方がいい`, the result must also make the recommendation complete:

- current judgment and reason;
- when to review it again;
- conditions that change the direction;
- what to do while waiting;
- the next option if no contact arrives;
- a later message draft when appropriate; and
- what cannot be concluded.

Do not invent unsupported precision such as an exact reply or review time.

---

## 4. Delivery Format

Public MVP delivery:

- Web鑑定ノート result page protected by an unguessable token or equivalent
- Separate 保存用鑑定書 presentation derived from the same structured result
- Email notification containing the Web result URL
- Disclaimer and feedback link included in the email or result page

Presentation rules:

- Web鑑定ノート is the long, chaptered reading experience.
- 保存用鑑定書 is a quick-reference recomposition, not a screenshot or compressed full Web report.
- Exact page count, PDF/image format, download, print, copy/share, filename, margins, and exact text volume remain deferred.
- M1-I4 may implement fixture previews only after authorization; no real file generation is authorized in M1.

Development delivery options:

- Email logged to console or development logs
- Result page preview using fixture data
- Manual QA review before test delivery

The normal public path should not require manual copy/paste delivery for every order.

---

## 5. Delivery Email Template

Subject:

月の返事｜今夜の鑑定書をお届けします

Body:

```text
ご依頼ありがとうございます。
月の返事です。

今回の鑑定書を以下にお届けします。

[鑑定書URL]

このレポートは、入力された情報をもとにAIが整理・分析した判断材料です。
タロット、占星術、生年月日、霊感その他の占術・超自然的手法は使用しません。医療・診断・カウンセリングではなく、相手の本心や将来の出来事を断定・保証するものではありません。

よろしければ、今後の改善のために短い感想をいただけると嬉しいです。

[フィードバックフォームURL]
```

---

## 6. Feedback Request

Ask after delivery:

- 読んで気持ちは少し整理されましたか？
- 判定に納得できましたか？
- 保存したいと思いましたか？
- ¥980の価値はありましたか？
- ChatGPTで十分だと思いましたか？
- また使いたいと思いましたか？
- 率直な感想
