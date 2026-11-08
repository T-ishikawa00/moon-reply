# V19-L4 — Reportの局所fact修復と修復後検証

2026-09-08、LOCAL ONLY。開始 `release/private-ready@1b24003d545d16d0102828a3577444d994520f42`。開始時の未commit Human Review資料4件は内容を変えず、`b3f3620` に別commitで保存した。以下はV19-L3実装を継承するlocal候補であり、Production選択・購入準備・Paid契約はV17のまま。

## Authorityと問題の範囲

[固定Human回答と解釈note（公開準備候補では詳細記録を非同梱）](../service-record/EVALUATION_EVIDENCE_SUMMARY.md)を維持。GQ05はtie、GQ24/GQ13はV19-L3選好、GQ29-P3はV17選好。「重すぎる」を短文化の要求に置き換えず、GQ13の「その他」の理由を推測しない。旧runのSTOP、出力、finding、費用台帳、mappingを変更・補完しない。

今回の対象は、正しい送信事実をPB05が未確認の到達へ強めたGQ29-P3と、Reportの局所fact問題を修復した後の提供条件。旧PB05には一般的なmessage-state fidelity指示があったが、[今回の実出力（公開準備候補では詳細記録を非同梱）](../service-record/EVALUATION_EVIDENCE_SUMMARY.md)の `short_letter[1]` で「すでに質問は一度届いており」が再発した。正しい送信・未返信事実、現在の追送を控えるPlan、3日間の具体的な行動は保持できる。

当該sessionのPB06は呼ばれていない。新しいlocal検証で与えるPB06 finding、patch、6項目の判定はすべて**作成したfake fixture**であり、保存済み実PB06の判定や実モデル修復ではない。

## Candidate identityと互換性

| 項目 | 新候補 |
| --- | --- |
| Product | V19-L4 |
| Catalog / bundle | v22.0.0 |
| schemaSet | v8.0.0 |
| PB05通常生成 | v12.0.0、既存Report v2 schema |
| PB05局所repair | v1.0.0、`report-fact-repair-v1` |
| PB06 | v10.0.0、`validation-result-v19-l4-v1` |

[全stageとhash](../../evals/guidance-quality-v19-l4/catalog-identity.json)、[catalog manifest](../../lib/assessment/runtime/contracts/runtime-stage-catalog-v22.json)、[明示local loader](../../lib/assessment/runtime/v19-l4-stage-catalog.ts)を正本とする。schemaSet v7はV18で使用済みのためv8へ分離した。

既存7stageと一度のattempt 2を再利用する。PB05 definitionに候補専用の任意 `reportFactRepair` contractを持たせ、局所修復時だけ切り替える。通常Reportとpatchを同一schemaとして扱わない。新executor・PB07・Recovery engineはない。最終Report schema、projection、rendering、PB01/PB04、旧版prompt/schema/hashは不変。Production loaderは新catalogを選択せず、L4の購入準備はstage呼出し前に拒否される。

## A — PB05 fact precision

[PB05 v12](../../lib/assessment/runtime/contracts/pb-05-v19-l4-fact-precision.developer.md)へ具体的な許容／非許容例を追加した。

| 入力根拠 | 許容する表現の機能 | 根拠がなければ追加しないこと |
| --- | --- | --- |
| 送った／まだ返信はない | 送信済みと未返信という観測 | 到達、既読、理解 |
| 返信が観測されていない | 「まだ返信はありません」 | 独立した相手の行為としての「相手は返信していません」、意図 |
| 配達済み表示 | その表示があるという事実 | 既読、理解 |
| Customerが既読表示を明示 | 既読表示が付いたという事実 | 理解、好意、拒絶、故意の無視 |
| 相手が理解したと発言 | その発言の正確な帰属 | 独立して確認した内心、同意や行動の約束 |
| お礼の受信を明示 | そのメッセージが届いたこと | 恋愛感情や関係進展 |

「届く」の禁止やCustomer向け状態チェック表ではない。既存の鑑定ノートの量、温かさ、具体性、意味上の役割は維持し、注意書きを増やす指示は加えない。

## B — 局所修復の適格性

[Application helper](../../lib/assessment/runtime/report-fact-repair-v1.ts)は、初回PB06のReport fact findingを修復先へ振り分ける。code/severityは経路の候補抽出だけに用い、提供許可に使わない。

適格条件はすべて必要：

- Safety aggregateが `normal_allowed`。通常のPlan、source、draft、選択依頼、Customer表示整合検証でlocal defectがない。
- Report factのmaterial findingが1件だけ。対象は既存の `short_letter[n]` または `observed_fact_commentary[n].commentary` の一つの非空文字列。
- 生ReportとApplication grounding後の対象文字列が一致。Application所有field、draft、Plan、理由の主field、期間計画は修復対象外。
- findingの根拠は実在するBaseのFact IDのみ。重複、未知ID、policyだけ、Clarification/Candidateの混合根拠は対象外。Fact-ID付き説明ではそのID自身を根拠に含める。
- 他のmaterial／意味／行動／Safety問題がない。既存分類で非blockingの軽微な表現上のfindingは、既存のReport文字列を指す場合だけ併存可能。軽微なfact問題まで表現として許容しない。

適格でないReport factは旧full-Report再生成へ流さず `M2_REPORT_FACT_REPAIR_INELIGIBLE` で提供しない。この結果は「今回の局所修復契約では成立を確認できない」であり、相談全体が回答不能というProduct判定へ読み替えない。

## 一つの修復と保持される内容

PB04は再呼出ししない。元のBase／Plan／生Report／grounded Reportをclone・freeze・hashし、対象path、原文、根拠Fact IDs、選択したfindingを修復入力へ渡す。元Reportとfindingは訂正対象の資料であり、外部事実の根拠ではない。

[PB05 repair prompt](../../lib/assessment/runtime/contracts/pb-05-v19-l4-fact-repair.developer.md)は5fieldのpatchだけを返す。Applicationが元hash・path・原文・schemaを確認し、別cloneの一つの文字列へ適用する。元receiptはpatch原本として保存し、手修正した全文を実モデル出力に見せない。

同じ原文の返却、空白だけの変更、空文字、範囲外の変更、700文字超、schema違反は失敗。修復対象のfield上限も既存Report schemaで再確認する。それ以外の文字列・配列・metadata、正しいreasoning・draft・3日間Planはdeep equalityで保持する。対象段落内の意味や温かさの保持は、次の独立semantic検証も必要。

## 修復後の提供条件

統合後の全文に通常のReport schema・grounding・source・draft・依頼充足・Customer surface検証を再実行する。その後、[PB06 v10](../../lib/assessment/runtime/contracts/pb-06-v19-l4-post-repair.developer.md)へ修復前後と凍結authorityを渡し、次の6項目を独立して評価する。

1. fact/source integrity
2. input fidelity
3. meaning preservation
4. direction consistency
5. action consistency
6. Safety

6項目すべて `pass`、かつ今回のgrounded Report hash・対象path・実文字列・根拠IDが一致する検証receiptを必要とする。通常の `semantic_checks` も省かず、残存／新規material findingやlocal defectがあれば提供不可。`unknown`、欠落、古いhash、別対象、失敗したstageも提供不可。評価モデルの「6項目pass」だけで残るfindingを消せない。

このbranchは旧F007の修復消尽後許容処理へ入らない。修復失敗後の再修復・attempt 3・古い候補へのfallbackはない。一通send/replyの後に追送せずwaitする時間整合は維持し、同一時点の相反や明確な連絡拒否は許容しない。

## 検証と留保

[検証資産と結果](../../evals/guidance-quality-v19-l4/README.md)を参照。実Application／pipelineに保存synthetic出力と明示fakeを通したlocal replay、bindingの純粋関数検証、契約／旧証拠hashの静的検証を実施した。GQ05の確認、GQ24の任意返信、GQ13の境界と温かさ、GQ29-P3の方向性と期間計画を保持する検査を含む。独立integration reviewでblockerなし。

意味の正誤、修復案の精度、PB06の見逃し率はfakeでは実証できない。特に既存V7の `ignored` 判定はそのままであり、新しい六項目のsemantic評価も含め、実モデルの正確さは別評価が必要。今回のroute以外のF007（真正なaction majorが旧修復消尽後readyになり得る問題など）、source metadataのKnown Open、F008は解決していない。

source lint・typecheck・buildはlocal結果。全体lintは今回未実行で、過去の一時ファイル警告を解決済みと扱わず、削除／ignore追加はしない。ブラウザ視覚QAは未実施、保存済み表示projectionと本文の一致をlocal replayで確認した。

## 次段階

[GQ29-P3 targeted比較と12-case QA計画](../../evals/guidance-quality-v19-l4/next-evaluation-plan.md)。最初は固定上流のL3/L4比較だけ。各初回PB05→PB06、L4の適格な場合だけ一度のpatch→PB06を加え、最大6 HTTP、提案上限USD $0.20。現行公式単価と新入力サイズは実行前に再確認し、別Human承認を得る。旧runのSTOPや未成立sessionを埋めない。

その確認後に既存12-caseのexpanded Blind QAを計画する。新candidate対応の薄いevaluation profileとfake費用検証が必要で、現時点で実API実行可能とはしていない。4-case全再生成を既定にしない。

Production変更・push/deploy・実API実行は0。Local Technical PASS ≠ Real-model repair quality ≠ Human Acceptance ≠ Production Authorization。
