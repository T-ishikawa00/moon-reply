# LP_STRUCTURE.md

## 0. Purpose

This document defines the vertically scrolling LP direction for the initial paid Web MVP and its Milestone 1 review representation.

The LP is not a full app.

It explains the product, forms realistic expectations, shows the future outputs, and helps a visitor decide whether to begin at the independent `/request` page. Task M1-P1-R1 changes documentation only and does not authorize an LP implementation.

---

## 1. LP Goal

Primary goal:

- Reduce relationship-message anxiety enough for the visitor to understand the service and choose the next action without pressure.
- Support an informed start of the independent request flow.

Secondary goals:

- Explain what 月の返事 is
- Show emotional fit
- Show sample quality
- Reduce suspicion
- Clarify safety and refund rules
- Make the request flow simple
- Route users to the self-hosted diagnosis request form

The LP must not amplify anxiety, rush or blame the visitor, claim another person's true feelings, or imply that purchase controls fate. It must preserve user agency.

### Approved section order

The LP uses one primary value per section, a large heading, concise explanation, generous spacing, and concrete UI/deliverable previews.

1. ファーストビュー
2. どんな悩みに向いているか
3. 月の返事が整理する内容
4. Web鑑定ノートのプレビュー
5. 保存用鑑定書のプレビュー
6. 利用の流れ
7. サンプル鑑定書
8. 料金と商品条件
9. AI利用・非保証・Safety
10. FAQ
11. 最終CTA
12. 法務・安全・問い合わせnavigation

On wider screens, explanation and preview may alternate left/right between sections. Mobile keeps a single logical reading order with no horizontal scrolling. A full request form is not embedded in the LP; a form preview may explain the future input experience, and the CTA leads to `/request`.

---

## 2. First View

### Main Copy

送る前に読む、恋のメッセージ鑑定ノート。

### Sub Copy

返信待ち、追いメッセージ、曖昧な関係で不安になる夜に。
関係状況やメッセージをAIが整理・分析し、「このメッセージを送っていいか」「今は待つべきか」の判断材料を、月の鑑定書としてお返しします。

### CTA

鑑定ノートを依頼する

The first view must also show, without requiring later-section reading:

- AI-assisted relationship-message analysis and decision support;
- `月の返事 鑑定ノート` is returned;
- `税込980円`;
- `1相談につき1鑑定ノート`;
- one-shot purchase; and
- no automatic renewal.

---

## 3. Public MVP CTA Behavior

Public MVP CTA:

- Opens the independent self-hosted diagnosis request form at `/request`
- Does not embed or expand the full form inside the LP

Milestone 1 review rule:

- Every active LP request CTA points to the existing `/request` route.
- Any LP form/input preview is non-interactive, collects nothing, and exists only to explain where and how input begins.
- Do not add an LP mock form, partial submission, placeholder destination, or alternative input path.

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

- AIによる恋愛メッセージ分析と判断支援
- エンターテインメントおよび情報提供目的
- 1相談ごとに鑑定書として返す
- チャットではなく、保存して見返せる鑑定書
- 送る/待つ/修正する/送らないの判断材料を整理するサービス

Not:

- 医療
- 診断
- カウンセリング
- 相手の本心断定
- 復縁保証
- 返信保証
- タロット、占星術、霊感その他の占術・超自然的手法
- 相手を操作するサービス

---

## 6. What You Receive

The LP separately previews two future paid presentation products:

- `月の返事 鑑定ノート`: a chaptered, vertically read Web experience with the conclusion first, reasoning, message analysis/draft, a three-day plan, and limitations.
- `保存用鑑定書`: a quick-reference, A4-oriented direction that recomposes the conclusion, reason summary, review timing, change conditions, message draft, three-day direction, and fixed cautions.

The 保存用鑑定書 is not a screenshot of the Web鑑定ノート and must not compress the full Web text into small type. Exact page count, PDF/image format, download, print, copy/share, and file details remain deferred.

Every normal result must go beyond the judgment label. Send, light-send, wait, and do-not-send outputs include a reason, review timing, conditions that change the direction, an interim action, a no-contact next option, a later message draft when applicable, and explicit limits.

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

The fictional `/sample-report` is the primary free experience. It must be labeled as a fictional service-explanation sample and must not imply a real customer, purchase, review, AI generation record, or testimonial.

Short LP excerpts and Web/save-report previews support this sample. The initial MVP does not provide a free complete first reading, ad-supported complete reading, advertising, free tickets, free coins/points, or repeatable first-free use.

Use approved G001/G002/G003 snippets only within the applicable fictional-sample boundary.

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

- 単発鑑定 税込¥980
- 1相談につき1鑑定ノート
- 自動更新なし

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

Delivery timing is unresolved in Milestone 1 review content. Do not present `1時間以内`, `24時間以内`, or any other SLA as an approved purchase condition.

The later public-MVP target is automatic result-page generation and result-URL email notification after payment success, but provider, delivery timing, and runtime behavior require later Human-approved planning and implementation.

---

## 12. Safety Notes

Must include:

- AIを利用しています
- エンターテインメントおよび情報提供目的です
- タロット、占星術、霊感その他の占術・超自然的手法は使用しません
- 医療/診断/カウンセリングではありません
- 自傷、DV、ストーカー、脅迫、未成年絡みなどは通常鑑定できません
- Safetyと通常の有料鑑定の利用資格は決済前にサーバー側で確認し、利用資格が成立しない間は支払いへ進みません。待つこと、今は送らないこと、一時的に連絡を控えることまたは相手の境界を尊重する支援を求めることだけを理由に、当然に購入不可とは扱いません
- 例外的な決済後の提供不能は、将来の`refund_required`およびoperator対応要件として扱います
- 実名や個人情報は入力しないでください

The LP must not claim automatic refunds, provider refund API capability, fee reimbursement, refund timing, or a concrete operator procedure.

---

## 13. FAQ

Include:

### Q. AIですか？

はい。AIが入力された恋愛関係の状況やメッセージを整理・分析し、判断材料を鑑定書としてお返しします。
開発中または管理されたベータでは、人間が品質確認する場合があります。

### Q. 相手の本心は分かりますか？

相手の本心を断定するものではありません。
入力された状況や文面から、考えられる可能性と次の一手を整理する鑑定ノートです。

### Q. 必ず返信が来ますか？

返信や復縁を保証するものではありません。

### Q. どんな相談でもできますか？

自傷、DV、ストーカー、脅迫、未成年絡みなどの危険相談は通常鑑定として扱いません。

### Q. 返金できますか？

デジタル鑑定書のため納品後は原則返金不可です。
Safetyは原則として決済前に確認します。重複決済または例外的な決済後の提供不能は将来の全額返金候補ですが、具体的な返金手段、期限、反映時期は決済事業者選定後に確定します。

---

## 14. CTA

Primary CTA:

- 鑑定ノートを依頼する

Secondary CTA:

- 鑑定サンプルを見る

A clear primary CTA appears at least once mid-page and again near the end. M1-I1 uses non-fixed CTAs. A mobile fixed CTA is a candidate only; M1-I6 evaluates a Human-approved variant against reading, viewport obstruction, keyboard/focus, and user agency, then records `adopted`, `rejected`, or `deferred`. It is not committed without explicit Human adoption.

## 15. Legal, safety and contact navigation

The final area links to legal information, AI/non-guarantee disclosure, unsupported cases, privacy information, refund information, and contact review. Unresolved operator/provider facts remain review-labeled and must not be invented.

## 16. External UX reference boundary

The Pattern is a structural UX reference only.

Adopt: vertical reading, one section/one value, large heading plus short explanation plus UI preview, generous whitespace, wider-screen left/right alternation, concrete output previews, and clear mid/final CTAs.

Transform: chart/content previews become moonlight, Web鑑定ノート, 保存用鑑定書, tonight's conclusion, a three-day plan, relationship context, copied conversation, planned message, and the user's question.

Reject: astrology, natal charts, zodiac symbols, birth-data analysis, fate or life claims, circular-chart imitation, reference copy/assets/exact layout, copied colors/fonts, horizontal scrolling, and unnatural Japanese line breaks. External screenshots are not repository assets.
