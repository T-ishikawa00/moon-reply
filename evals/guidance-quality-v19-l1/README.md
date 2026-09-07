# V19-L1 — offline verification

V17を基準とするGQ24限定候補の契約・接続・保存出力再生用。新しい実モデル出力、品質合格、Human Acceptance、Production承認を示す資産ではない。

repo rootから実行する。

```text
node evals/guidance-quality-v19-l1/verify-offline.mjs
node node_modules/eslint/bin/eslint.js evals/guidance-quality-v19-l1 --max-warnings=0
```

`verification-results.json`に検証結果、candidate stage hash、保存元への参照、保持した本文、既知制約の追跡を出力する。すべて既存のFakeAssessmentRepository / FakeAiStageTransportを使用し、Provider・DB・実モデル呼出しは0。ケースIDは評価側の識別だけに使い、品質policyの成立条件に使わない。

結果の件数は契約・再生確認と既知制約の再現診断を別集計する。57件中56件が契約・再生確認、1件が下記の既知不整合の再現であり、57件の回答品質合格という意味ではない。

## 証拠を分ける

| 対象 | 入力・出力の由来 | 確認できること |
| --- | --- | --- |
| 保存GQ24両版 | 2026-09-07の実モデル・架空入力の保存PB01–03を無編集で再生 | goalがother/unknownならV19も同じ追加確認。保存結果を都合よく書き換えない |
| GQ24目的分類だけの対照 | 保存PB01のgoalだけをメモリ上でrespond_politely/current_situation_explicitへ変更 | V17は依然として追加確認・wait。V19の入口とpolicyの両adapterが必要 |
| GQ24完全経路 | 上記の編集Base＋手作りPlan/Report＋fake PB06。既存V17 fixtureは形だけ再利用 | PB01Cをskipし6stageでready、旧schema、required_nowの新規文面、任意終了の本文を保持。モデルがこの抽出・本文を生成/受理することは未検証 |
| GQ05 | 保存V17 PB01–03を両catalogで再生 | 同じ追加確認・理由。Humanの引き分け・両issuesなしを維持。追加確認を失敗扱いしない |
| GQ13 / GQ29-P3 | 保存V17 PB01–06を両catalogで再生 | 保存Plan/Report/cardと実projectionが完全一致。受け止めの文章・具体的行動は文字列として保持され、新しい温かさ/具体性スコアを自動付与しない |
| 否定・対照条件 | 検証済みBaseを基にしたメモリ上の構造対照 | 範囲外はV17と同じpolicy結果。実モデルの事実抽出精度の証明ではない |

Candidate存在・使用済みClarificationの2条件はmatcherに対する構造guard確認であり、有効な完全authorityを組み立てたend-to-end検証ではない。Safety・通常質問・保存境界事例・保存未返信事例は既存の有効なpolicy/runtime経路でも確認する。

GQ05のClarification再開は、既存integration fixtureの`no_material_concern`回答形式を使う別の架空対照で、V17/V19とも一問の後に同じ結果へ進むことを確認する。実pilotやHumanがこの回答を提出したという記録ではない。成功回答生成までのresumeは未検証。V19購入準備の入口拒否はfake stage呼出し0で確認する。

## 保持する契約

開始基準は `6ab70e6af379078b0f67f57d9ff2b91da3cbe8b3`。凍結30ケース、pilot入力・実出力・Human回答、V17/V18契約、Production selector、旧入力/policy/再評価は変更しない。V19はV17 schemaを使用する。PB01の目的taxonomy説明と、PB05の新規文面を常にfuture-useとする一節の必要最小修正だけをprompt差として許容する。PB05はタイトルと当該1句以外をV17と比較し、温かさ・量・sectionの変更が混入していないことを確認する。

主推奨replyと、本文の「ここで終えてもよい」は区別する。元の`response_expectation=optional`をreasonableへ変更しない。新規文面は`generated_without_candidate / preserved_meaning=false`で、原文の引用や編集と偽らない。

## 既知制約

`generated_without_candidate`へ`preserved_meaning=true`を注入した別の正常返信fixtureでは、V17/V19の両方で`DRAFT_SOURCE_INTEGRITY`のmajorと正しい修復directiveが生成される。しかし一回修復後も同じ不整合を返し、fake PB06が無findingならreadyになる。検証結果には元finding・修復directive・残存値を記録する。これは既存の不整合を再現したという意味の検証成功であり、integrity品質合格ではない。F007 classifier・F008 recoveryを変更していない。

critical integrity findingの注入による失敗、技術障害、誤方向、旧schema違反、catalog/marker混在の拒否も確認する。それでも意味の捏造・境界侵害・任意性の実検出精度は未検証。新しいPB01の分類が本当に安定するかは、別途承認された実モデル評価が必要。

既存のreport-onlyとplan-and-report両方について、一回のfake修復で正常な編集fixtureを提供できる経路を確認する。PB05だけをV17/V19間で取り替える混在も両方向で拒否する。実モデルが修復に成功する割合は測定していない。
