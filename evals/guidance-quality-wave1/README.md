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

## 確定した8-session pilot準備（実API未承認・未実行）

後継の [承認用packet / 評価基準](pilot-review.md)、[上限・料金JSON](pilot-plan.json)、[生成入力のみ](pilot-inputs.json) を使用する。GQ05 / GQ24 / GQ13 / GQ29-P3 × V17/V18 = 8sessionのみ。GQ29-P3は既存GQ29へ明示3日間の依頼を加えた補助ケースで、凍結30件とGQ30は変更しない。

確認回答0、PB01C0、HTTP retry0、既存Product修復一回まで。最大72 HTTP、費用想定 $0.24、保守的最大 $1.53、提案する承認予算 $2.00 USD。24session / 264・288試行への拡張はない。価格は2026-09-07の公式公開資料で確認済み。

node evals/guidance-quality-wave1/verify-pilot-plan.mjs は、入力凍結・8枠・上限算術・過去usage出典・合成bodyのbyte上限を外部呼出しなしで検査する。正確なtoken計測や実モデル品質評価ではない。network runner / budget enforcementは未実装であり、このJSONは実行機能を持たない。金額・範囲の別承認後、評価専用capと予約ledgerのlocal実装・fake検証が最初のAPI呼出しの前提。

GQ24はprimary replyでも本文で任意性を残せるかを観測する。期間計画は1項目の条件付き方針を許容し、3phase/重複説明を要求しない。GQ06の過剰確認、GQ17の必要原文確認が未実装、GQ30の部分提供未対応はpacketで分離している。

実API・今回のAPI費用0。Production/Customer/DB/メール/購入/既存Paid/費用防御は変更しない。
