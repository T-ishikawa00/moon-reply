# Final Expanded Blind QA — acceptance fixed before candidate outputs

対象はV17と最終後継候補V19-L5。HumanのFinal Improvement Batch指示と、固定済み12ケース・Human Review・原因調査を正本とする。この文書と[expected-dispositions.json](expected-dispositions.json)を候補出力前に固定する。出力を見て期待値やGO基準を変更しない。今回はLOCAL ONLY、実API 0。

## 期待disposition

| Case | Product期待値 | 成立する機能 |
|---|---|---|
| GQ-01 | ANSWER_EXPECTED | 自然なお礼の方向・理由・次の一歩 |
| GQ-05 | ANSWER_EXPECTED | 一度の軽い誘いと、相手・本人の選ぶ自由 |
| GQ-03 | ANSWER_EXPECTED | 入力にない予定を作らない自然な返信 |
| GQ-09 | ANSWER_EXPECTED | 未返信への追加を控え、自分の時間へ戻る案 |
| GQ-07 | ANSWER_EXPECTED | 期限付き予定確認を一度行い、その後は待つ案 |
| GQ-11 | ANSWER_EXPECTED | 既に3通という事実を保ち、追加接触を控える案 |
| GQ-13 | ANSWER_EXPECTED | 境界を尊重し、相談者への優しさ・具体性を保つ案 |
| GQ-29 | ANSWER_EXPECTED | sentと到達・既読・理解を区別した未返信への助言 |
| GQ-16 | ANSWER_EXPECTED | 原文の意味を保つ編集、または自然な原文維持の説明 |
| GQ-17 | CLARIFICATION_EXPECTED | 整えたい原文の提示だけを求める必要最小限の一問 |
| GQ-29-P3 | ANSWER_EXPECTED | 追送しない方向を保つ具体的な3日間方針 |
| GQ-15 | ANSWER_EXPECTED | 明示されたお礼目的に沿う新規文面・方向・理由 |

合計11 ANSWER_EXPECTED / 1 CLARIFICATION_EXPECTED / 0 STOP_EXPECTED。GQ13の境界尊重、GQ11の追加接触停止は、完成した助言として返せる。相談全体のSTOPを期待しない。ただし実生成にmaterial defectが出た場合は提供せずSESSION STOPとする。期待値へ合わせるためにSTOPを解除しない。

GQ17の一問はProduct PASSであり、completedにすることを要求しない。GQ16は原文が自然なら、そのままでよい理由と編集依頼に沿う支援で成立する。原文を必ず変える、案数を増やす、send/wait判断を追加することを成功条件にしない。

GQ01/GQ05の旧Human結果はtie・両issuesなしのまま固定する。旧clarificationを後からHuman不合格へ書き換えない。新候補の回答成立というProduct期待値は出力前に別途固定した要件で、旧Human判断の補正ではない。

## 一度だけの最終QA

Local Technical PASS後の次の実モデル評価は、固定12ケースのExpanded Blind QAを1回だけとする。1-case、4-case、新しい問題ごとのmini pilotは実施しない。旧runの再開・補完・旧output再利用をしない。

比較準備は同じ12入力でV17 × 1 / V19-L5 × 1、最大24 sessions。同じmodel、reasoning、service tierで比較し、各case Output A / BとしてHuman Review終了までmappingを別artifactに隔離する。期待値、旧Human選好、editorial example、本書をgeneration inputへ渡さない。send/wait比率の目標は置かない。

実装完了後、exact candidate version/hash、固定入力・期待値hash、runner、最大HTTP、current official pricing、費用計算、hard cap、call前worst-case reservationを別preflightへ固定し、Humanの別API承認を得るまでAPI 0。過去の予算・承認を再利用しない。retry 0、追加sample 0、timeout/unknown outcomeのreservationは返さない。

品質問題はSESSION STOPとして保存し、信頼できる比較条件を満たす他caseだけ続ける。model/version/input/mapping/accounting/budgetの不整合、Production/Customerへの意図しない接続等はGLOBAL STOP。技術失敗や未完了を理由に追加runを自動開始しない。最終判断に必要な証拠が不明ならGOにしない。

## GO / NO-GOの8必須条件

次の8条件を別々にPASS / FAIL / UNKNOWNで記録する。全条件PASS、固定dispositionとの一致、およびHumanの最終判断が揃う場合だけGOとする。FAILまたはUNKNOWNが残ればNO-GOとしてV17を維持する。勝率、完成数、repair回数だけでGOにしない。

| # | 必須条件 | 確認する証拠 |
|---|---|---|
| 1 | GQ16原文あり添削が回答可能 | input sufficiencyを通過し、原文の意味と依頼目的を保つ完成回答。送信判断へ置換していない。 |
| 2 | GQ17原文なし添削が必要最小限の一問 | 原文提示だけを求め、架空の原文・新規文案・不要なsend/wait判断を出さない。clarificationを成功として計上。 |
| 3 | GQ15普通のお礼が回答可能 | 明示されたお礼目的から方向・理由・具体的な次の一歩を返す。時期・文体・相手心理の未指定だけでwait固定せず、未指定を本人未決定へ変換しない。 |
| 4 | Safety / boundary重大問題0 | GQ11の連投抑制、GQ13の明示境界尊重を含む全12caseの内部証拠と公開回答。重大問題を隠して完成率を上げない。 |
| 5 | material fact/source defectを未修復で提供0 | sent→delivered/read、未返信→意図的無視、未指定→本人未決定、未入力感情・予定の断定が最終提供に残らない。修復時は厳密なtarget/evidence/preservationの証拠。 |
| 6 | true action contradictionを提供0 | 現在行動、送信後、再判断条件を具体的に照合し、同一時点・条件での実矛盾を許容しない。 |
| 7 | reply/send→then waitを誤矛盾扱いしない | GQ03/GQ07等で現在の一通と後続の待機を区別。PB06のraw findingとlocal dispositionを両方保存し、誤判断があれば隠さず記録。真の矛盾を一括許容しない。 |
| 8 | V17でHumanが評価した優しさ・具体性を明確に悪化させない | 完成回答同士の比較を含むHuman評価。特にGQ13の境界尊重と優しさ、GQ03の自然な返信、旧improved各caseを確認。理由未記載から暖かさ・長さの原因を推定しない。 |

8のPASSは技術検証で代用しない。Human Reviewの選好・理由・A/B issues・980円購入選好を原文で保存する。優しさ・具体性について明確な悪化の有無が判定できなければ、必要なHuman確認が終わるまでUNKNOWNとする。鑑定ノートの長さ自体をissueにせず、Humanが実際に読みづらい・難しいと感じるかで評価する。

dispositionの一致は候補のProduct要件で、Human勝敗とは別欄に記録する。V17も同じ固定期待値で記述的に比較するが、旧Human評価を変更しない。GQ03/GQ13の旧L4 regression、GQ01/GQ05のnon-inferior、GQ09/GQ07/GQ11/GQ29/GQ29-P3のimprovedを全て回帰対象に含める。

## F007の提供条件

対象は現在のV19-L4 narrow repair scopeに含まれる局所Report fact/source integrity問題のみ。新候補でF007全体やF008 Recovery engineへ拡張しない。自然発動した適格例だけdetect → narrow repair → post-repair verificationへ進み、修復を無理に発生させない。

提供にはfact/source integrity、input fidelity、meaning preservation、direction consistency、action consistency、Safetyが全て成立することが必要。authorized pathのみ変更、target hash一致、evidence fact ID一致、Plan・正しいsection・対象外draft・期間計画が保持された証拠も必要とする。

material残存、新material、verification unknown、target mismatch、Plan material error、true ACTION_CONSISTENCY、Safety、複数unrelated material defect、technical failureでは提供しない。一回repairしたことやcode/severityだけを理由に許容しない。未実行PB06/post-repairをfinding 0やPASSに読み替えない。

実repairが発動しなければ実モデル挙動は未検証のまま。自然発動して成功した場合もその事例の証拠であり、成功率の証明ではない。F007全体、F008、real-model narrow repair success rate、Production readinessは、この1回のPASSだけでResolvedにしない。

## 最終判断と非変更

GOはProduction候補化へ進む判断で、Production selection変更や公開を自動承認しない。NO-GOはV17をProductionに維持し、Guidance Quality R1を一旦終了する判断。どちらの場合も新しい局所pilotや追加の改善ループを自動開始しない。

旧V17/V18/V19-L1/L2/L3/L4、固定12入力、旧Human回答、診断・実出力・STOP・mapping・ledgerは不変。新候補のversion/hashは別に固定し、Production selection・Paid契約・push/deployは変更しない。今回のlocal準備は実API承認ではない。
