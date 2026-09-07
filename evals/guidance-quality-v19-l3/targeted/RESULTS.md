# GQ29-P3 Targeted Verification — 2026-09-08

V19-L2／V19-L3のPB05→PB06を各1回、合計4 HTTPで終了。追加生成・retry・repairは0。これは固定上流を使う局所検証で、Human Preference比較や有料回答の提供完了ではない。

## 1. 事実の確度は強められていないか

今回の**両条件とも、未確認の到達・既読・理解・意図的な無視を事実として追加していない**。L3は対象基準を満たす観察結果。ただしL2でも旧問題が再現しなかったため、この各1回だけでL3修正による発生率低下や因果効果は証明できない。

| Input fact | V19-L2 PB05 | V19-L3 PB05 | PB06 |
| --- | --- | --- | --- |
| F101：「週末は何をしているの？」と質問を送った | 「具体的な質問を一つ送っているため、相手が返答するためのきっかけは提示できています」 | 「返答できるきっかけになる質問を送っているため」「相手が返す余地は残っています」 | 両条件ともsemantic finding 0 |
| F102：現時点で返事はない | 「返事がない理由や相手の意図までは、この事実だけでは分かりません」 | 「返事がないことは確認できますが、その理由や相手の意図までは分かりません」 | 両条件ともsemantic finding 0 |

「きっかけ」「余地」は、相談者が返答可能な質問を送ったことの説明であり、相手への到達確認や既読を主張していない。単語の禁止による採点ではなく、全文と根拠を主担当・独立レビューで照合した。PB06自体は肯定理由を返していないため、上の意味解釈は保存回答に対するレビュー判断。

## 2. 役立つ方向性は残ったか

両条件とも**今は追送せず、最初の質問への返事を待つ**。理由は送信済み・未返信・経過時間不明・追加連絡の必要性や期限が未確認という正確な範囲で成立。到達を断定する必要はなかった。

- L2：「通常の予定や休息に戻る」「今後3日間は、返事が来た場合だけその内容に沿って自然に返し」
- L3：「通常の予定や休息へ戻る」「返事が来た場合だけ内容に沿って自然に返し、来ない間は新しい話題を重ねない」

3日間の依頼、返信後の条件付き返信、予定・期限・新しい境界が判明した場合の見直しを保持。両条件PB06のmaterial fact/source finding、ACTION_CONSISTENCY finding、Safety findingはすべて0。今回の1ケースに違反は見つからなかったが、明確な連絡拒否など別入力の実モデル回帰を新たに検証したことにはならない。

## 3. 新しい不自然さはないか

L3に到達不明を長く説明する注意書きや、逐語的な断定回避文の追加はない。一方、軽微な留保は残る。

- L3 aftercareの「**その後の3日間**」は、依頼と固定Planの「今後3日間」より期間の始点が曖昧。3日間の依頼自体は残り、送信日時や将来事実は作っていない。
- 「きっかけ／余地」は意味が重なり、coverの「新しい動き／余白」は抽象的。経過時間や返信ペースが不明という説明も複数箇所で反復する。L2にも抽象的な説明・反復があり、この1回からL3変更の因果効果とは断定できない。

これらをmaterial integrity不合格へ広げず、読みやすさの観察として残す。元の回答は編集していない。

## 4. 次のFresh Blind Pilotへ進めるか

**別承認のFresh Blind Pilotへ進める局所確認結果**。GQ29-P3の対象挙動にblockerは観測されなかった。ただし、L3が一般に改善した・Humanが好む・4ケース全体が退行しないという結論ではない。期間表現と反復の留保も次の評価へ残す。ここから自動実行しない。

旧Fresh runはincompleteのまま。旧session・output・費用台帳・A/B対応表は不変で、今回の2条件を旧runへ継ぎ足していない。旧A/B mappingは非開示。

## 実行・費用証拠

| 条件 | HTTP | input tokens | output tokens（reasoning含む） | usageによるUSD費用 |
| --- | ---: | ---: | ---: | ---: |
| V19-L2 | 2 | 17,438 | 1,399 | $0.00603800 |
| V19-L3 | 2 | 17,823 | 1,514 | $0.00511305 |
| 合計 | 4 | 35,261 | 2,913 | **$0.01115105** |

reasoning 800 tokensはoutputの内数で、二重計上していない。cached input 5,040、cache-write input 30,209、通常input 12。全receiptにcache-write usageがあり、推定下限・上限は一致。請求書照会ではなく、API usageと確認済み公開単価による算出額。予約額は$0.1094912、共通hard cap $0.15内。予約返却なし、unknown usage・HTTP failure・全体STOPは0。

使用modelは`gpt-5.6-luna`、reasoning `low`、Standard（API `default`）。[公式価格](https://developers.openai.com/api/docs/pricing)と[model仕様](https://developers.openai.com/api/docs/models/gpt-5.6-luna)を実行前に再確認。価格snapshotは[verified-pricing.json](verified-pricing.json)。USD基準、円換算なし。

実行HEAD：`cc899b92e94e26b71d83eae3a747f0b849874ddc`＋manifestに記録された新規評価専用source。L2 catalog/bundle v20・PB05 v10、L3 catalog/bundle v21・PB05 v11。schemaSet v6・PB06 v9共通。Productionの選択・runtimeは変更0。

- Input→PB05→PB06、全文・usage・local groundingの対応（参照原本はPrivate保全・候補には非同梱）
- 共有費用台帳（参照原本はPrivate保全・候補には非同梱）
- 実行集計（参照原本はPrivate保全・候補には非同梱）
- [18件の実行前fake検証](verification.json)：実モデル品質の証明には使用しない。

postflight：台帳再読込一致、両条件PB05入力・固定Plan一致、旧186ファイルのraw-byte hash一致、実行source hash不変、source lint・diff check PASS。広いbuild/typecheckはruntime無変更のため追加実行していない。

Production変更・Customer/DB/Payment/Email操作・push/deploy＝0。Technical completion ≠ Human Quality Acceptance ≠ Production Authorization。
