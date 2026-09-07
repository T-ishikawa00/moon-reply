# V19-L2 — ACTION_CONSISTENCY temporal evaluator successor

2026-09-07 / LOCAL ONLY。開始`release/private-ready@122696691cac6ab5ba2fa9c453e833bb45b74cb8`、clean。HumanはGQ24のTYPE-C診断を承認し、V19-L1をbaselineにPB06だけを改訂する後継候補を承認した。実APIとProductionへの反映は未承認。

## 原因と守る意味

保存GQ24では、PB04/PB05が今夜の一通reply、送信後の追加送信禁止、新規連絡なしのwait、新規連絡後のreassessを時系列で指示していた。PB06は現在の許可方向`reply_now`を将来の`wait_and_reassess`にも要求し、`ACTION_CONSISTENCY / major`を出した。`policy:action_context`参照が含まれたため、既存classifierの現在policy限定の将来条件除外にも入らなかった。[診断正本](../../evals/guidance-quality-r1/gq24-action-consistency/DIAGNOSIS.md)

「今一通送る／返す→送った後は追加連絡せず待つ」は主send/replyであり矛盾ではない。「同一時点・同一対象に送れ／送るな」は矛盾として維持する。待機語の数、send率、文章の短さを成功指標にしない。

## Exact change

[新PB06契約](../../lib/assessment/runtime/contracts/pb-06-v19-l2-temporal-action.developer.md)は、V19-L1が使用する旧PB06本文を維持し、見出しと`Temporal scope of ACTION_CONSISTENCY`の一節だけを変更した。[前Taskの追記案](../../evals/guidance-quality-r1/gq24-action-consistency/pb06-proposal.md)を再利用している。

- actor、今回の一通／追加分という対象、条件、送信に対する前後を比較する。同じ「今夜」というaction horizonでも別の行動になり得る。
- 現在の`allowed_decisions`は現在のselected Decisionとその実行に適用する。将来の条件付きdirectionとの違いだけでfindingにしない。
- 現在reply/send→追加なしのwait、現在no-send→wait、新規受信後の条件付きreplyを区別する。新規受信も継続中の境界を自動解除しない。
- 同時点相反、理由のない即時追加送信、反応要求、境界回避は引き続き検出対象。aftercareというfield名は免責にならない。
- findingの既存`detail`へ、両指示、時点、対象、両立しない理由を具体的に示すよう指示。policy違反なら指示と適用制約を示す。新schema・finding code・必須Product sectionは追加しない。

PB01/PB04/PB05、全schema、意味判定classifier、Safety・fact/source/message integrity、修復回数、F007/F008は変更しない。旧版が持つ限界もそのまま残る。今回の変更は誤ったfindingの発生を減らす評価指示であり、出されたfindingを後処理で消す仕組みではない。

## Candidate identity / compatibility

Product呼称は**V19-L2**。repoの連番に従い、数値catalog/bundleは**v20**を使用する。

| 項目 | identity |
| --- | --- |
| 実装baseline | V19-L1 `f5e5dc34b1a35a45652b2fd3f458ec04a541ecc6` |
| Catalog | `runtime-stage-catalog-v20.0.0` |
| Prompt bundle | `prompt-bundle-runtime-v20.0.0` |
| Schema set | `pipeline-schema-runtime-v6.0.0`（V19-L1と同じ） |
| PB06 prompt | `v9.0.0` |
| PB06 combined prompt SHA256 | `d316eedfb6a5ec1cdb62f556e9aba8a788438ab6129cbc9a42f1b68f65d65e0f` |

[明示local loader](../../lib/assessment/runtime/v19-l2-stage-catalog.ts)はL1 loaderを再利用し、manifestの差分をPB06 source/version/hashと候補identity/baselineだけに制限する。[全stage identity](../../evals/guidance-quality-v19-l2/catalog-identity.json)に実際のhashを保存する。PB01〜PB05のStageDefinitionはL1と完全一致。PB06のschema/出力形式も同一。

共有pipeline/fake repositoryへの差分は、追加identityを既存L1入口/判断・V17品質経路へ振り分ける接続だけ。L1の既存identity関数やpolicyは変更せず、新しいwrapperでv20を追加する。PB06新版とbundleの混在は拒否する。L1/V17/V18の有効な組合せと挙動は維持する。

入力十分性とeffective policyの内部identityはL1のまま継承する。新しい外側の実行bundle/catalogはv20として記録する。アルゴリズムが同じ内部policyに別の意味や品質の向上を仮定しない。Production selector、購入準備、既存Paid snapshot/contractへ接続しない。

## Offline evaluationと証拠の限界

[新候補の検証資産](../../evals/guidance-quality-v19-l2/README.md)は既存のfixture/helper、FakeAssessmentRepository、FakeAiStageTransportを再利用する。新しいモデル回答を合成したとは扱わない。

| 検証対象 | localで確認すること | 確認しないこと |
| --- | --- | --- |
| 保存GQ24の実PB06 finding | 同じ保存入力・findingは既存classifierで引き続きblocking。STOPの履歴を保持 | 新PB06が同じfindingを返さないこと |
| 保存Plan/Report＋手作業のPB06対照 | 誤findingがない場合の既存pipeline/表示接続と主reply保持 | モデルがPASSと再評価したという証明 |
| 7 temporal fixture＋reply同時点相反 | 期待する意味と手作業findingへの拒否を固定 | 日本語の自動検出性能・precision/recall |
| GQ05 | 保存された追加確認がL1/L2で同じ | 確認削減を成功とする判断 |
| GQ13 / GQ29-P3 | 保存Plan/Report/card/projectionと、境界/待機の具体的な本文を保持 | 温かさ・読みやすさを新たに生成した実証 |
| 追送・明確な拒否・同時点相反 | 既存policyとblocking、境界保護を維持 | broad allowによる納品 |

実モデルを呼ばないため、新promptによる意味評価は未実施。保存された古いPB06 verdictを新しいモデル評価として使わず、対照の空findingは明示したfakeだけで使う。期待値を結果に合わせて変更しない。

### 既存の最終提供制約：未解決

否定例「今、この一通を返信する。同じ今、同じ一通を返信しない」をPB04へ置き、PB06に同時点・同対象の`ACTION_CONSISTENCY`を2回返すfake検証を行った。`critical`ではL1/L2とも修復1回後にfail-closed、Report 0。`major`では**L1/L2とも矛盾を残したままready**になる。これは許容する回答でも、品質PASSでもない。

原因は既存[quality-reassessment-v2.ts:160–183](../../lib/assessment/runtime/quality-reassessment-v2.ts#L160)が、このfindingの最終非提供を`critical`かつcurrent action pathに限っていること。新PB06はfindingを出す指示を維持しており、初回blockingも維持するが、既存の修復消尽時の全ての真正矛盾を最終FAILにする変更ではない。今回禁止されたF007全体の改修へ広げず、`KNOWN_LIMITATION_REPRODUCED_NOT_QUALITY_PASS`として別記した。期待するProduct outcomeはFAILのままである。

次の限定pilotでは、既存[評価transportの初回検査](../../evals/guidance-quality-wave1/real-pilot/transport.mjs#L42)がblocking `ACTION_CONSISTENCY / major・critical`でSTOPし、[次stage前に例外を返す](../../evals/guidance-quality-wave1/real-pilot/transport.mjs#L90)。この経路は修復消尽へ進まない。新候補の保存GQ24 findingと人手の真正矛盾の両方でSTOPすることをlocalで確認した。これはProduction classifierの解決ではなく、限定評価の停止境界である。別実装者による独立レビューも、この制約を明示した上で候補差分のTechnical PASSとfresh pilot準備は妥当と判断した。

### 実施したlocal検証

| 検証 | 結果 |
| --- | --- |
| 新候補focused verifier | 契約・保存出力再生・手作業finding routing **34 PASS**、既存制約の再現 **1件**、検査失敗0。実モデル評価ではない |
| temporal fixtures | 旧7件の期待値を保持＋reply/no-reply同時点相反1件、計8件。意味判定の実モデル性能は未検証 |
| 保存GQ24診断verifier | 17/17 PASS、元finding/receipt/STOP不変 |
| 既存Wave1 A/B / runtime回帰 | 12/12 / 24/24 PASS、fakeのみ |
| 既存Paid quality delivery回帰 | 4/4 PASS、fake Provider/DB/Stripe 0。前述の既存制約を解決したという意味ではない |
| identity独立レビュー | 旧v1〜19 predicate 19/19不変、正常L1/L2受理、混合2組拒否、PB01〜05 deep-equal |
| typecheck | `npm run typecheck -- --incremental false` PASS |
| source lint | Git管理＋新候補source、既存ESLint対象619ファイル、errors 0 / warnings 0 |
| build | `npm run build` PASS、47/47 pages |
| fresh pilot preflight | PASS、固定8入力/全stage identity/予約上限/旧run除外、API/key読取0 |

全体lintは今回再実行していない。[既存証拠](GUIDANCE_QUALITY_V19_L1.md#L74)の`.tmp/r1-resume-write-report.mjs:2:9`未使用`readFileSync` warningによる全体lint FAILは留保として残す。source lint PASSで解消したとは扱わず、一時ファイルの削除・変更、ignore追加は0。最終diff checkとlocal commitの状態はGitで記録する。

検証資産の仕上げでは、旧ファイルの列挙を単一Git引数列へ渡したためWindowsの`ENAMETOOLONG`が1回発生した。Git差分のファイル名とbaselineの保護対象集合の照合へ変更し、同じ保護期待を維持して再実行PASS。runtime・意味期待値の変更ではない。

## 変更ファイル

- Candidate source：`v19-l2-runtime-identity.ts`、`v19-l2-stage-catalog.ts`、`contracts/runtime-stage-catalog-v20.json`、`contracts/pb-06-v19-l2-temporal-action.developer.md`を追加。共有`pipeline.ts`、`fakes.ts`はidentity接続だけを変更。
- Evaluation：`evals/guidance-quality-v19-l2/`のREADME、8fixture、focused verifier/result、catalog identity、pilot plan/review、preflightの8ファイルを追加。
- History：旧途中runに`diagnostic-status.json`を新規追記。
- Documents：本書、`CURRENT_FOCUS.md`、`CODEX_HANDOFF.md`。

既存契約/旧receipt/凍結入力/Production selector/品質classifier等の無変更をbaseline Git差分と保存hashで検証する。local commit後のexact HEADは最終報告を正本とし、将来の実API承認でそのSHAを明示する。今回の計画は実行承認HEADを先取りしない。

## Aborted pilot / fresh pilot

途中停止したV17対V19-L1 runには、追記status（参照原本はPrivate保全・候補には非同梱）として`diagnostic-only / incomplete`を記録した。Human品質比較の勝敗には使わない。元のreceipt・出力・STOP・ledger・lock・mapping・Human回答は無変更。今回のTYPE-C承認は旧runの続行承認ではない。

次は[新しい8-session計画](../../evals/guidance-quality-v19-l2/pilot-review.md)。同一GQ05/GQ24/GQ13/GQ29-P3でV17×1／新候補×1。新しいrun/session/mappingと空のHuman評価欄を用い、旧sessionを混ぜない。既存runner・共通$2 hard cap・各call前予約・実usage精算・retry0・最大72 HTTPを再利用する。live entryは別承認後にexact HEADへ束縛する薄いprofileだけを用意する予定で、今回の実行は0。

新契約のPB01/PB06 serialized requestは既存予約枠内。最大予約$1.5330112は前回の公開価格証拠に基づく計画値で、今回外部照会なし。実行前の価格再確認とexact候補HEAD/金額/範囲のHuman承認が必要。実行中に同じfalse positiveが再度STOP条件へ入っても、今回の診断を根拠に自動許容しない。

Technical PASS ≠ 実モデル品質確認 ≠ Human Quality Acceptance ≠ Production Authorization。

**READY FOR FRESH BLIND PILOT** — PB06候補差分と上記停止境界のlocal準備。実行承認は別途必要。Production全体の真正矛盾拒否をPASSとした判定ではない。
