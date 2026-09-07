# Guidance Quality Wave 1 — local verification

2026-09-07。実装の契約・接続検証用。実モデル出力、品質PASS、本番承認ではない。

正本・凍結期待値は [Guidance R1](../../docs/product/GUIDANCE_QUALITY_R1.md)、[30ケース](../guidance-quality-r1/cases.json)、[評価計画](../guidance-quality-r1/evaluation-plan.md)、[編集上の目標例](../guidance-quality-r1/editorial-examples.md)。作り直さず再利用する。
実装記録と保留は [Wave 1記録](../../docs/product/GUIDANCE_QUALITY_WAVE1.md)。

## 実行方法（repo root、外部呼出しなし）

```text
node evals/guidance-quality-wave1/verify-ab.mjs
node --experimental-transform-types evals/guidance-quality-wave1/verify-case-matrix.mjs
node evals/guidance-quality-wave1/verify-runtime.mjs
node evals/guidance-quality-wave1/render-preview.mjs
```

- AB: 5件のV17 prepare再現と後継関数・negative controls。
- case-matrix: 全30件の原文・不明事項・許容集合・ペアを保持。21件は手作成PB01をV17 prepareで実行し、同じ検証済みauthorityをV5/V3で比較。9件は入力対応のみ。GQ06/GQ17はKNOWN_GAP、GQ16は編集機能の方向性とpolicy enumを分ける。21件全部の候補generationを検証したものではない。
- runtime: 5件のV18完全execute、V17対照、最小/詳細/文面なし、要求計画の一回修復、契約混在拒否、技術障害、逆方向の回帰等。追加の詳細表示はnext_three_days/draft_messageを明示した派生fixtureであり凍結ケースの正解は変えない。
- render: fake pipeline→実projection→実CustomerAssessmentNoteのSSR。4画面を .tmp/guidance-quality-wave1 に出力する。コピー操作は未接続。SSR自体は実回答の品質証明にならない。

## 明示的な候補選択

loadGuidanceQualityWave1StageCatalog() を明示して既存 AssessmentApplication に definitions / promptBundleVersion / schemaSetVersion を渡す。再現可能な使用例は runtime-fixtures.mjs の runFixture。既定値を切り替えるenv設定・Productionルート・Providerへの接続は追加していない。
V18はこのlocal execute/clarification経路のみ。prepare / paid authority / fulfillPrepared はV17に固定したまま。古いPaidをV18として再解釈・書換えしない。

## 証拠の限界

PB01/PB01C/PB02/PB03のfixtureも人の編集であり、モデルの抽出能力を証明しない。PB06の無findingや注入findingはfake判定。意味改変・捏造・矛盾の検出精度は未検証。known F007（無効な理由Fact IDがsemantic shape修復後も残る合成反例）とF008（改善版の技術失敗で元候補を救済しない）は可視化し、成功品質に数えない。
全30件で実モデル品質NOT_RUN。件数の配分やenumのsend増加から、望ましい本番比率・本番偏重率を推定しない。

## 次回pilot（今回は実行0）

[pilot-plan.json](pilot-plan.json) は未承認の実行設計で、実行機能を持たない。最初はGQ05（初回の誘い）、24（任意の挨拶返信）、03（正常返信）、13（一人にしてほしい）を現行/候補で各1回、計8セッション。既存12件×2=24の内数であり、追加8ではない。聞き方ペア、期限/拒否の事実対照は同じ12件の残りで見る。

最大288の内訳: 24セッション×12枠。現行sourceで到達する最大は初回PB01/PB01C/PB02/PB03=4、確認回答時PB01=1（PB01C/PB02/PB03は再利用し呼ばない）、初回PB04/PB05/PB06=3、改善PB04/PB05/PB06=3、合計11。CandidateなしはPB01Cも0。したがって実経路の上限は264試行、pilotは88試行。旧計画の12番目は未使用の管理余裕で、追加retry・再サンプルの許可ではない。HTTP失敗・曖昧な結果も試行/セッション枠を消費する。

実行前に必要なこと:

1. current/candidateの正確なcommit/catalog/prompt/schema hash、同一model・low reasoning・入力adapter・synthetic確認回答を固定。原文をPB01へ渡し、過剰確認をfixtureで迂回しない。確認が不要なarmには回答を追加しない。
2. JSON記載のstage別input/output上限を、公式context制限と利用するtokenizerで確認。inputはprompt・schema・前段最大出力・修復directiveを含める。output上限はreasoning分も含む。既存transportにはmax_output_tokensがないため、このまま実行しない。次回承認範囲で評価専用の送信前token/budget確認とmax_output_tokens設定が必要。Production費用防御は変更しない。
3. 公式単価と取得日を別途確認し、上限USDをHumanへ提示。今回は価格取得0、料金未算出。上限の基礎は1セッションinput 508,000 / output 62,464 tokens、pilot合計 4064000 / 499712、全24合計 12192000 / 1499136。input単価をPi、output単価をPo（各USD/百万token）とするとpilot上限=4.064Pi+0.499712Po、全体上限=12.192Pi+1.499136Po。cache割引0、reasoning二重計上0。12枠を金額でも保守的に計上するなら未使用枠を最大96,000input/8,192outputとして、全体14.496Pi+1.695744Po。この余裕枠も消費承認ではない。
4. 承認済みUSD上限、session/HTTP上限、stage token上限のいずれかに達する前に停止。価格/identity不一致、token上限超過、結果不明・timeout、schema/source/Safetyの重大失敗、境界侵害や意味改変が判明した時はbatch停止し、結果を保存。手動の帳尻合わせ・自動再試行0。既存の一回Product修復以外の再実行0。
5. armを伏せた人のレビューで凍結6軸を採点。初回/改善版/最終可否を分け、主行動は意味で分類。Safety/境界/連投を通常waitから分離。実行者以外のレビューも予定する。PB06自己PASSのみで品質PASSとしない。

未購入の本番予算、Customer相談、Production DB・履歴を使わない。隔離した合成入力と専用の承認済み評価予算だけを予定する。API評価の費用・範囲は別承認。今回の実API・API費用0。
