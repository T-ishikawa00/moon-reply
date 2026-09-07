# GQ29-P3 PB05 STOP — 保存証拠の追跡と局所修復例

保存されたfresh pilotのSTOPは維持する。新生成・実repair・retry・PB06再評価は行っていない。A/Bとversionの対応は非開示。元のBlind Review（参照原本はPrivate保全・候補には非同梱）は変更していない。

以下の正本は、version情報を除いたwhitelist抽出証拠（参照原本はPrivate保全・候補には非同梱）。元responseの`outputText`はJSON文字列なので、示したJSON Pointerはそれをparseした本文に適用する。生のsession/manifest/mappingやstage requestへのリンクは公開しない。

## 取得済み結果の使える範囲

正常終了6件＝完成回答3件＋追加確認3件、途中STOP1件、未開始1件。HTTPは32、実usage換算費用USD $0.04852951。今回の追加APIは0。集計正本（参照原本はPrivate保全・候補には非同梱）、抽出証拠 `/aggregate`・`/anonymousCaseAvailability`。

| Case | Output A | Output B | Humanが比較できる範囲 |
| --- | --- | --- | --- |
| GQ05 | 追加確認 | 追加確認 | 確認質問の体験を比較する。確認があるだけで失敗に置き換えない |
| GQ24 | 完成回答 | 追加確認 | 回答と追加確認の体験比較。完成回答同士の品質比較ではない |
| GQ13 | 完成回答 | 完成回答 | 両方の完成回答について、温かさ・境界の尊重・読みやすさをBlind Reviewできる |
| GQ29-P3 | 未開始 | PB05でSTOP | 完成回答の比較は成立しない。未実施や途中回答を修復例で埋めない |

ここでの「完成」は保存された`ready_local_only`という技術状態であり、Humanの品質受入やversionの勝敗ではない。GQ13の優劣、GQ24の任意返信の自然さなどはHuman評価を待つ。

GQ24 Output AはPB01→PB02→PB03→PB04（`reply_now`）→PB05→PB06まで到達し、PB06のsemantic findingは0件、最終提供判定は`ready_local_only`。Output BはPB03後に追加確認となり、PB04の判断・PB05の回答生成・PB06の検証は未実行。両方ともclarification answerとrepairは0。抽出証拠 `/gq24StageReach`。この到達差だけでHumanの選好や改善成功を決めない。

## 原因が生じた箇所

相談の全文は次のとおり。元の[固定入力](../guidance-quality-wave1/pilot-inputs.json) `/cases/3/input/currentSituation`と、このsessionのPB01 requestが一致している。

> こちらから「週末は何をしているの？」と送って、まだ返事がありません。もう一通送っていい？ 今後3日間はどう動けばよいかも整理してください。

| 段階 | 保存された値 | 判断上の意味と参照 |
| --- | --- | --- |
| PB01 | `latest_direct_message.sender=user`、`message_signals[0]={author:user,status:sent_by_user}` | 相談者が送った。相手への到達・既読の確認はない。抽出 `/pb01/latestDirectMessage`・`/pb01/messageSignals` |
| PB01 | F101「ユーザーは相手に『週末は何をしているの？』と質問を送った。」、F102「その質問に対する相手からの返事は、現時点でない。」 | 明示事実は送信と未返信。抽出 `/pb01/observedFacts/value/0`・`/1` |
| PB04 | `selected_decision=wait_and_reassess`、理由参照F101/F102/F103/F104 | 経過時間・通常の返信ペースが不明で、追加送信の具体的必要性・期限が確認されていない。抽出 `/pb04/decisionReasonFactIds`・`/pb04/preActionCheck` |
| PB05 | F101の説明だけが「すでに届いているため」と記述 | 送信事実を未確認の到達事実へ格上げし、提案の因果的根拠に使った。抽出 `/pb05/badField` |

PB04の行動は以下の3件で、未確認の到達を根拠にしていない。`actions_to_take`の保存値であり、今回書き直した案ではない。PB04元response（参照原本はPrivate保全・候補には非同梱）、抽出 `/pb04/actionsToTake`。

- 「今夜は追加の一通を送らず、最初の質問への返信を待つ。」
- 「追加メッセージの文面を作成・送信する代わりに、通常の予定や休息に戻る。」
- 「今後3日間は、返信が来た場合だけ内容に応じて自然に返し、返信がない場合は追加送信を重ねずに状況を見直す。」

Planは、短い間隔で同じ質問を言い換えて追送することを避け、返信や具体的な予定・期限など新しい事実が出たら見直す。今回の欠陥について、Planや現在方向を再生成する必要はない。

PB05の近接文を合わせると、問題は次の1fieldに局所化できる。ただし、局所的に修復できることと軽微な文体問題であることは同義ではない。PB05元response（参照原本はPrivate保全・候補には非同梱）。

**判断の要約** — `/decision_reason_summary`：

> すでに週末の予定を尋ねるメッセージを一通送っていて、現時点では返事がありません。経過時間や普段の返信ペースが分からず、今夜中に追加で伝える必要性や期限も確認されていないため、今は追送せず、返信や新しい事情が出た時点で見直す方向が合っています。

**問題のF101説明** — `/observed_fact_commentary/0/commentary`：

> 週末の予定を尋ねる質問はすでに届いているため、同じ話題について今すぐ補足しなければならない状態ではありません。

**直後のF102説明** — `/observed_fact_commentary/1/commentary`：

> 現時点で返事がないことは確認できますが、それだけでは返信しない理由や関係性の変化までは判断できません。

要約は「送っていて」、次の事実説明は「返事がない」と、入力の範囲を保っている。一方でF101説明は「届いている」を確定事実として使っている。既読や相手の気持ちを断定した問題とは区別し、**未確認の到達状態を根拠へ混入したmaterial fact/source fidelity failure**という元の分類を維持する。

## 停止と修復を混同しない

PB05の既存自動reviewは`stopReason=null`だったが、保存receiptのmanual inspectionが上記のmaterial issueを確認し`action=stop`を記録した。これはPB06のfindingではない。PB05 stageはfailedとなり、PB06・repair・retryは0、`reassessment=[]`。元のSTOP理由`MATERIAL_MANUAL_INTEGRITY_OR_SAFETY`を解除・格下げしない。manual STOP記録（参照原本はPrivate保全・候補には非同梱）、抽出 `/stop`。

**編集上の1field修復例（実モデルの修復結果ではない）**

対象は`/observed_fact_commentary/0/commentary`だけ。「すでに届いている」→「すでに送っている」の置換だけを行うと次になる。

> 週末の予定を尋ねる質問はすでに送っているため、同じ話題について今すぐ補足しなければならない状態ではありません。

この例はPlan・方向性・文面案・他のReport fieldを変えない。実responseへ適用しておらず、提供済み回答、実repair成功、PB06再評価PASSとして扱わない。元のmaterial classificationとSTOPはそのまま残す。例の来歴と正確な差分（参照原本はPrivate保全・候補には非同梱） `/editorialRepairExample`。

## 後継候補との切り分け

新しいlocal候補の名称はV19-L3、catalog v21／PB05 v11／schemaSet v6。PB06 v9の時間軸評価をV19-L2から継承し、PB05の送信・到達・既読の区別に限定する。これは新候補の系譜説明であり、上記A/Bがどの評価済みversionに対応するかは示していない。候補実装・検証・今後の実行計画は別の成果物で管理する。

今回の追跡では、新API・実repair・retry・Production変更・push/deployは0。保存出力・ledger・STOP・Blind Review・Human回答は変更0。
