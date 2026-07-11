# DELIVERY_WORKFLOW.md

## 0. Purpose

This document defines the automated public delivery workflow for the Phase 1 MVP.

Manual delivery may be used during development only.

The public MVP target is automatic result page generation and email notification after payment success.

---

## 1. Corrected Public Delivery Workflow

Public MVP delivery flow:

1. Payment success is confirmed
2. AI judgment is generated
3. AI full diagnosis is generated
4. Diagnosis result is saved
5. Result page URL is created
6. Result URL is sent by email
7. User opens result page
8. Feedback request is shown

Manual delivery may be used during development only.

---

## 2. Safety Branch

If dangerous content is detected:

- Do not generate normal romantic diagnosis
- Do not provide message wording that enables harm, stalking, coercion, or manipulation
- Use safety response
- Do not proceed to normal payment flow when detected before payment
- Refund if payment already happened due to an exceptional state
- Record as safety-rejected case

Danger types:

- self-harm
- harm to others
- DV/abuse
- stalking/waiting outside home/workplace
- threats
- monitoring/surveillance
- minor-related romantic/meeting request
- doxxing or personal information exposure

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

---

## 4. Delivery Format

Public MVP delivery:

- Result page protected by an unguessable token or equivalent
- Email notification containing the result URL
- Disclaimer and feedback link included in the email or result page

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
