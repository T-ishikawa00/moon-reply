# V19-L4 local verification

LOCAL ONLY / NO API。実装範囲・提供条件は [Product記録](../../docs/product/GUIDANCE_QUALITY_V19_L4.md)、候補hashは [catalog-identity.json](catalog-identity.json)。保存済み実出力、作成したfake、編集上の修復例、実モデル評価を混同しない。

## 実行するlocal検証

リポジトリrootから、ネットワークもProduction DBも使わずに実行する。

```powershell
node --experimental-transform-types evals/guidance-quality-v19-l4/verify-repair-unit.mjs
node --experimental-transform-types evals/guidance-quality-v19-l4/verify-runtime.mjs
node --experimental-transform-types evals/guidance-quality-v19-l4/verify-contracts.mjs
```

- unit: 適格性、1field binding、immutability、残存finding、6項目と検証receiptの正しさを純粋関数で確認する。
- runtime: 実 `AssessmentApplication` → pipeline → schema / semantic disposition →保存／projectionを、FakeRepositoryとFakeTransportで通す。保存済みsynthetic GQ05/GQ24/GQ13の両attemptを必要に応じてそのまま使う。GQ29-P3の初回PB06は保存されていないため、finding、patch、修復後verdictは明示的な作成fixture。
- contracts: PB01〜04／通常Report schema不変、PB05の追加節以外の全文維持、PB06時間整合以降の規則維持、旧契約／Protected source／既存ケース不変、元pilot243filesのraw hashを確認する。prompt例の存在検査はモデルの言語理解の証明ではない。

新結果ファイルとidentityはこのL4 directoryだけへ出力する。旧L1/L2/L3 verifierを直接起動して、過去の結果JSONを上書きしない。

## 結果と証拠の強さ

| 検査 | 結果 | 証明する範囲 |
| --- | --- | --- |
| 純粋関数 | 100 PASS | eligibility / patch / verification binding |
| runtime replay | 23検証群・50 fakeシナリオ PASS、[実行結果](verification-runtime-results.json) | 実Applicationでのfake routing / 保存 / projection / fail-closed |
| 契約・保護 | 6 PASS、[結果](verification-contract-results.json) | 新版分離、旧文面・hash維持 |
| 旧Paid quality回帰 | 4/4 PASS | 旧契約維持。F007全体解決ではない |
| 旧Wave1 A/B / runtime | 12/12、24/24 PASS | 既存fixtureの回帰なし |
| 既存30case matrix | 30 assertion PASS | 18方向contract一致、1機能範囲、2既知gap、9入力coverageのみ。30実回答PASSではない |
| typecheck | PASS | `npm run typecheck -- --incremental false` |
| source lint | PASS、warning 0 | `app components lib scripts` と新L4 eval scripts |
| build | PASS、47/47 static pages | `npm run build`、local buildのみ |
| diff check | PASS | 意図しないwhitespace問題なし |

runtime結果中の旧L3 major消尽後readyは **KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS** と別記。旧runの全249ファイルはreplay開始／終了で不変、そのうち元243ファイルは凍結manifestとも照合する。原出力、Human回答／解釈note、STOP、mapping、ledgerを変えない。

GQ29修復成功対照ではPB04=1、PB05=2、PB06=2。Plan、draft、正しいreason、3日間plan、対象外の全Report値を保持する。失敗時はready Reportを保存せず、repairを行った事実を納品条件にしない。

**実モデルによるfact訂正、PB06 detection precision/recall、HumanによるL4受入は未検証。** 全体lint／ブラウザ視覚QAは今回未実施。既存の一時ファイルやignoreは変更していない。独立コード／接続reviewは実施済み、blockerなし。

## 次の評価

[限定API提案と12-case計画](next-evaluation-plan.md)は未承認／未実行。新しいevaluation profile、PB05 patch identity対応、current pricing／token上限／budget accountingのfake検証を先に固定する。既存runnerとledgerを再利用し、過去のrun／lock／承認を再利用しない。
