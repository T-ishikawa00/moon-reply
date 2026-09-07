# V17 / V19-L2 Fresh Blind Pilot — Human authorization

2026-09-07。Humanはexact `64a1321477c5b76ed946ad8ecbe0dda888f9390f`で新規runを承認。V17対V19-L2（catalog/bundle v20、schemaSet v6、PB06 v9）、GQ05/GQ24/GQ13/GQ29-P3各1回ずつ、最大8 sessions。Production承認ではない。

`gpt-5.6-luna` / low / Standard、全run共通USD $2 hard cap、最大72 HTTP。HTTP retry・clarification answer・attempt3・additional sampleは0。既存runner/transport/budget/匿名UIをそのまま再利用する。raw PB06のACTION_CONSISTENCY major/criticalは既存classifierが除外する場合も新profileの評価専用checkpointでSTOPし、修復へ渡さない。その他material Safety/fact/source/meaning integrityは既存自動検査＋全receiptの手動技術確認でSTOP。停止後はrun全体を終了、後続session・repair・補完は0。

新規run名は`2026-09-07-authorized-pilot8-v19-l2`。旧run/session/output/mapping/Human票を新生成へ持ち込まない。入力は既存の固定synthetic JSONのinputだけ。A/Bをcaseごとに新規無作為割当してfirst API前にsealed保存。Humanへは同じ4問、空の回答欄を提示し、評価終了までmappingを公開しない。

候補HEADは実行中固定。新規評価profile・fake verifier・postflight・本書・価格記録・fake検証記録だけをuncommittedで許容し、全hashをmanifestへ保存する。既存trackedファイルは一切変更しない。旧契約・既存Paid・Production DB/Customer/Payment/Email・global/別worktree・push/deploy/remote migration操作は0。

公式の[モデル仕様](https://developers.openai.com/api/docs/models/gpt-5.6-luna)と[Standard公開単価](https://developers.openai.com/api/docs/pricing)を実行前に再確認。1Mあたりinput $0.20、cached $0.02、cache write $0.25、output $1.20。全inputを$0.25で予約し、全72試行の予約最大$1.5330112、上限$2を維持する。各call前に永続予約し、成功・timeout・unknownでも返却しない。usageから実費を記録し、cache-write内訳がなければ下限/上限を示す。請求確定額ではない。[価格記録](execution-prices.json)

実行は新profileのexact flagで一度のみ。既存CLIは再実行しない。実行前fake検証、独立review、HEAD/identity/予算/固定入力/匿名表示を確認する。失敗後の再実行権限はない。Technical completion ≠ Human Quality Acceptance ≠ Production Authorization。
