# LP_STRUCTURE.md

## 0. Purpose

This document defines the one-page LP structure for the Phase 1 automated public MVP.

The LP is not a full app.

It is a sales page designed to convert visitors into paid diagnosis requests through the automated public MVP flow.

---

## 1. LP Goal

Primary goal:

- Convert visitors into paid diagnosis requests.

Secondary goals:

- Explain what 月の返事 is
- Show emotional fit
- Show sample quality
- Reduce suspicion
- Clarify safety and refund rules
- Make the request flow simple
- Route users to the self-hosted diagnosis request form

---

## 2. First View

### Main Copy

送る前に読む、恋のメッセージ鑑定ノート。

### Sub Copy

返信待ち、追いメッセージ、曖昧な関係で不安になる夜に。
「このメッセージを送っていいか」「今は待つべきか」を、月の鑑定書としてお返しします。

### CTA

今夜の返事を鑑定する

---

## 3. Public MVP CTA Behavior

Public MVP CTA:

- Opens self-hosted diagnosis request form

Development placeholder:

- May point to a placeholder route or mock form until implementation is complete

Final public flow:

LP CTA → request form → safety check → payment → generated result

---

## 4. Problem Section

Use emotional but non-fear-based copy.

Examples:

- 返事が来ないだけで、心が何度も画面に戻ってしまう
- 送りたいけど、重いと思われたくない
- 追いメッセージしたいけど、後悔しそうで怖い
- 曖昧な関係に、どこまで時間を使っていいか分からない
- 友達に同じ相談を何度もするのが申し訳ない

Avoid fear-based copy.

Do not use:

- 今見ないと手遅れ
- 鑑定しないと彼が離れる
- 送らないと未来が悪くなる

---

## 5. Service Explanation

月の返事 is:

- AIを活用した恋愛メッセージ鑑定ノート
- 占い/エンタメ/感情整理目的
- 1相談ごとに鑑定書として返す
- チャットではなく、保存して見返せる鑑定書
- 送る/待つ/距離を見るを整理するサービス

Not:

- 医療
- 診断
- カウンセリング
- 相手の本心断定
- 復縁保証
- 返信保証
- 相手を操作するサービス

---

## 6. What You Receive

User receives:

- 今夜の月の流れ
- 今の恋の流れ
- 相手の気持ちの可能性
- あなたが不安になっている核心
- 送ろうとしている文面の見え方
- 今やると逆効果なこと
- 今夜の判定
- 送るならこの一文
- 送らない場合の過ごし方
- 3日以内の方針
- 月からの一言
- 保存用メモ
- 感情タグ

---

## 7. Judgment Labels

The diagnosis will include one of four normal judgment labels:

- 送っていい
- 軽く送るならあり
- 今夜は待つ
- 今日は送らない方がいい

Safety screening may also route a request to 通常鑑定不可.

Explain:

The judgment is not the whole diagnosis.
It is the final label inside a full diagnosis note.

---

## 8. Sample Section

Use approved G001/G002/G003 snippets.

Recommended snippets:

G001:

返事が来ない夜、
その沈黙を「嫌われた」と決めるには
まだ月明かりが足りません。

G002:

大切にされたいと思うことは、
重いことではありません。

ただ、その願いを届けるなら、
あなた自身を傷つけない言葉で。

G003:

今夜は、不安で引きすぎるより、
相手が差し出した小さな橋を
やさしく渡ってみていい夜です。

---

## 9. Price Section

Price:

- 単発鑑定 ¥980

Copy:

1相談ごとに、あなた専用の鑑定書をお返しします。
追加課金で引き延ばすことはありません。

---

## 10. Flow Section

Public MVP order flow:

1. 鑑定依頼フォームに入力
2. 安全チェック
3. 通常鑑定OKの場合のみ決済
4. 決済成功確認
5. AI判定
6. AI鑑定書生成
7. 結果ページ作成
8. メールで結果URL通知
9. 任意で感想回答

Development may use placeholder routes, mock payment, mock AI generation, or logged email while implementation is incomplete.

---

## 11. Delivery Window

Initial SLA:

- 決済成功後、原則1時間以内

If difficult operationally, use:

- 原則24時間以内

The public MVP target is automatic result page generation and email notification after payment success.

---

## 12. Safety Notes

Must include:

- AIを利用しています
- 占い/エンタメ/感情整理目的です
- 医療/診断/カウンセリングではありません
- 自傷、DV、ストーカー、脅迫、未成年絡みなどは通常鑑定できません
- 危険相談の場合は通常鑑定を提供せず、返金対象とします
- 実名や個人情報は入力しないでください

---

## 13. FAQ

Include:

### Q. AIですか？

はい。AIを活用し、品質基準に沿って鑑定書としてお返しします。
開発中または管理されたベータでは、人間が品質確認する場合があります。

### Q. 相手の本心は分かりますか？

相手の本心を断定するものではありません。
状況や文面から、可能性と次の一手を整理する鑑定です。

### Q. 必ず返信が来ますか？

返信や復縁を保証するものではありません。

### Q. どんな相談でもできますか？

自傷、DV、ストーカー、脅迫、未成年絡みなどの危険相談は通常鑑定として扱いません。

### Q. 返金できますか？

デジタル鑑定書のため納品後は原則返金不可です。
ただし、重複決済、提供不能、危険相談で通常鑑定不可の場合は返金対象です。

---

## 14. CTA

Primary CTA:

- 今夜の返事を鑑定する

Secondary CTA:

- 鑑定サンプルを見る
