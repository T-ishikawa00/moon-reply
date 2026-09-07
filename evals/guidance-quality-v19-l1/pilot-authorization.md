# V17 / V19-L1 — authorized blind pilot

2026-09-07、HumanはこのTaskで固定4case × 2条件、最大8sessionの実モデル比較を承認した。開始Gitは`release/private-ready@f5e5dc34b1a35a45652b2fd3f458ec04a541ecc6`、clean、一致を確認済み。Production承認ではない。

## 固定範囲

前回の`evals/guidance-quality-wave1/pilot-inputs.json`を無変更で使用する。GQ05/GQ24/GQ13/GQ29-P3に対しV17とV19を各1回。追加case/sample/clarification answer/HTTP retry/attempt3は0。V19は当該HEADのcatalog v19・schemaSet v6。V17/V18旧契約、Paid、Production、Customer、DB、Payment/Auth/通知には変更・接続しない。

`gpt-5.6-luna`、reasoning low、Standard（API `service_tier=default`）。前回と同じoutput token cap・timeZone・frozenApplicationNow・temperature/seed省略・strict structured output・store false・toolなし。実行順も前回のV18枠をV19に置換するだけ。ケースラベル、期待方向、編集例、前回Human回答/勝敗は生成inputへ渡さない。

## 再利用とidentity

前回の`real-pilot/budget.mjs`、transportの予約/HTTP制御、`executeSession`、blind rendererを再利用。旧実行directory・lock・plan・実証拠は変更しない。旧CLIの消費済み承認を再使用しない。

新しい入口は`real-pilot.mjs --execute-human-authorized-v19-pilot8`。candidate HEADを実行時もexactに維持し、許可された評価専用ファイルだけを未commit状態で認め、その内容hashを実行manifestへ保存する。runtime/source/入力の差分や予期しないファイルがあれば最初のcall前にSTOPする。run名は`2026-09-07-authorized-pilot8-v19-l1`、新しいone-shot lockを保持し削除しない。

A/Bはcaseごとに一度だけ無作為割当し、API前にsealed内部mappingを保存する。公開UIにはactual version、実行順、mappingを含めず、Humanの4問は既存UIと同じ。Human評価は自動補正・推定しない。

## 費用制御

USD $2 hard cap、全session共通、各HTTP前に全stage cap相当をdurable予約し、成功時も予約を戻さない。timeout/不明usageでも予約を保持。usage受領後の実費計算と予約額は別々に記録。次の予約が残予算に収まらなければ送信しない。

| Stage | 最大回数/session | input上限 | output上限（reasoning込み） |
| --- | ---: | ---: | ---: |
| PB01 | 1 | 42,000 | 8,192 |
| PB01C | 0 | 0 | 0 |
| PB02 | 1 | 24,000 | 3,072 |
| PB03 | 1 | 24,000 | 2,048 |
| PB04 | 2 | 48,000 | 8,192 |
| PB05 | 2 | 64,000 | 8,192 |
| PB06 | 2 | 96,000 | 4,096 |

8 × (1+1+1+2+2+2) = 最大72 HTTP。不要stageや修復を上限まで走らせない。完全requestのUTF-8 bytes + 4,096を入力tokenの保守上限として予約前確認し、cap超過はSTOP。切捨て・cap増額・再試行しない。

事前fake検証では、V19 PB01の完全request byte ceilingは40,964～41,057で旧40,000予約枠を超えた。実API前のlocal再現であり、HTTP失敗や実session消費ではない。今回Humanが指定した$2/8session/72HTTPの範囲内で、両条件のPB01入力予約枠だけ42,000へ合わせた。実際の入力、モデルに渡す設定、出力上限、byte+4096の見積方式は不変。旧planやcost-control自体は変更しない。この調整は事前にHumanへ報告した。

公式料金を今回read-only再確認した。[model](https://developers.openai.com/api/docs/models/gpt-5.6-luna)、[pricing](https://developers.openai.com/api/docs/pricing)：1M token当たりinput $0.20、cache read $0.02、cache write $0.25、output $1.20。272K超のlong-context料金帯には入らない。予約は全inputを$0.25で評価し、全72callを使った予約上限は **$1.5330112**（旧枠との差$0.004、承認済み$2以内）。API usageにcache-write内訳がなければ実usage換算額を下限/上限で記録し、請求額確定と偽らない。円換算なし。

## 即時STOPと証拠

既存のHTTP失敗/timeout/incomplete/schema/モデル・契約不一致/会計異常/予算超過見込みのSTOPを維持する。PB04の生成文面由来検証も再利用する。Known Openの`generated_without_candidate + preserved_meaning=true`はこの評価用検証ではPB04直後にSTOPし、F007/F008本体を変更しない。

既存PB06のSTOPコード一覧だけでは実質的な矛盾を網羅できないため、**全stageの実responseを保存・usage精算・schema検証後、次stage前に停止点を置く**。担当agentが入力事実、意味/由来、断定、相手の境界、現在の行動矛盾を確認する。全PB06 findingを確認し、codeやseverity名だけで一括判断しない。文体・量・非実質的な表現は元の一回修復に委ねる。

続行/停止の判断はexact response hash・stage・attempt・理由に結び付けてlocal保存する。停止点中のHTTPは0。wrong receipt、不正decision、待機timeoutもSTOP。これはagentによる技術的な実質確認であり、Humanの品質投票や追加モデル呼出しではない。GQ24のclarificationやGQ05の確認が残ることだけで、Safety/integrity STOPに置き換えない。

STOP後は次HTTP、retry、sample追加、別model、編集例での穴埋めを行わない。保存済み部分だけを匿名表示する。最終回答以外にも各stage/request/receipt、初回Plan、修復、PB01目的、入力十分性の再現、最終表示、usage/cost/errorを内部保存する。

実行前のfake検証は機構・上限の確認だけで、実回答品質の証明ではない。Human review完了まで対応表・勝敗・改善結論は開示しない。Known Openは投票でResolvedにしない。
