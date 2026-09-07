# V17 / V19-L2 — fresh 8-session Blind Pilot 準備

**NOT_AUTHORIZED_NOT_RUN。今回の実APIは0。** この計画は前回の消費済み承認を引き継がない。Local Technical PASS後も、実行するexact HEAD・金額・8-session範囲の別Human承認を必要とする。[固定plan](pilot-plan.json)

候補のProduct名はV19-L2、repo上の数値契約はcatalog/bundle v20、schemaSet v6。V19-L1からPB06の時間軸評価指示だけを分離した候補とV17を比較する。PB01/PB04/PB05、Production選択、Paid契約の変更をこの計画は認めない。identityの正本は[catalog-identity](catalog-identity.json)であり、計画の開始SHAを将来の実行承認SHAと混同しない。

## 比較対象とHuman評価

以前と同じ[固定synthetic input](../guidance-quality-wave1/pilot-inputs.json)をそのまま参照する。新しいcaseも追加sampleも作らない。

| Case | 比較目的（reviewer向け。生成inputへ渡さない） |
| --- | --- |
| GQ05 | 受け入れられた追加確認を、確認削減だけを目的に変えていないか |
| GQ24 | 目の前のお礼への任意返信を相談に即して扱い、返信義務や好意を捏造していないか。時間順序を誤って相反と判定していないか |
| GQ13 | 境界を守りながら相談者の気遣いも受け止める温かさを維持するか |
| GQ29-P3 | 3日間の依頼を、生活に落とせる具体的な方針と条件で返すか。抽象語の反復で認知負荷を増やしていないか |

各caseにV17×1、V19-L2×1の最大8 sessions。診断用の4caseであり、Production分布・望ましいsend率の代表ではない。「今、一通送信／返信→その後待つ」の主方向はsend/replyである。短さ・send率・過去の勝敗を成功指標にしない。

新しいrun名・session ID・one-shot lock・共通ledgerを作り、A/Bは新しくcaseごとに一度だけ独立に無作為割当し、最初のAPI前にsealed内部artifactへ保存する。偶然過去と同じA/Bになる可能性はあるが、過去mappingを読み取って再利用・調整しない。今はrun directoryもmappingも作らない。

生成に渡すのは固定JSONの`input`のみ。case ID、評価ラベル、期待方向、目標回答、過去Human回答・勝敗・実出力は渡さない。旧runの途中sessionを補完・混入しない。Humanには同じ4問だけを表示し、versionは評価完了まで伏せる。

1. 月の返事としてどちらが良い？ A / B / 引き分け / どちらも不可
2. 理由は一言で何？
3. A/Bそれぞれに重大な問題はある？ 事実の捏造 / 意味のズレ / 不必要に待たせる / 不必要に送らせる / 重すぎる / 依頼を落としている / その他 / なし
4. 980円で受け取るならどちら？ A / B / 引き分け / どちらも不可

回答欄は空から始める。新run専用のlocalStorage keyで旧回答を拾わない。Human回答を自動修正・推測しない。実出力の欠落を編集例で埋めない。

## 同一条件と上限

`gpt-5.6-luna`、reasoning `low`、Standard（API `service_tier=default`）。前回と同じstrict schema、output cap、`store=false`、toolsなし、非stream、temperature/seed省略、`truncation=disabled`、frozenApplicationNow、Asia/Tokyoを使う。concurrency 1。

| Stage | 最大回数/session | input予約上限 | output上限（reasoning込み） |
| --- | ---: | ---: | ---: |
| PB01 | 1 | 42,000 | 8,192 |
| PB01C | 0 | 0 | 0 |
| PB02 | 1 | 24,000 | 3,072 |
| PB03 | 1 | 24,000 | 2,048 |
| PB04 | 2 | 48,000 | 8,192 |
| PB05 | 2 | 64,000 | 8,192 |
| PB06 | 2 | 96,000 | 4,096 |

8×(1+1+1+2+2+2)＝最大72 HTTP。生成attempt2は既存の修復が必要な場合だけ。HTTP retry 0、clarification answer 0、attempt3 0、追加sample 0。入口が追加確認ならそのsessionの結果として記録し、無理に生成を進めない。

完全なserialized Responses requestのUTF-8 bytes＋4,096を保守的input ceilingとし、stage capを超えたら送信前STOP。これはtokenizerの実測値ではない。PB01 42,000は前回の両条件共通予約枠を維持したもの。今回のPB06追記も同じ数え方で予約内かlocal preflightで確認する。過去PB06入力のbyte検証は保存入力を使うlocalサイズ検証だけであり、新しい実生成入力として混ぜない。未来の全PB06入力が必ず収まるとの保証ではなく、実行時も毎call同じ検査をする。

`node evals/guidance-quality-v19-l2/preflight.mjs`はPASS。4固定入力のPB01はV17で38,537〜38,630、候補で40,964〜41,057となり42,000以内。保存GQ24 PB06入力をサイズ検証だけに使うとV17で47,796、候補で50,443となり96,000以内。追加予約枠の変更は不要。候補PB06 combined prompt hashは`d316eedfb6a5ec1cdb62f556e9aba8a788438ab6129cbc9a42f1b68f65d65e0f`。この測定は実API 0、fresh run/mapping作成0。

## 予算と再利用する制御

USD **$2.00 HARD CAP**を全8sessions共通で提案する。旧予約/実費を新runへ移さない。前回確認済みの2026-09-07公式単価証拠を計画値に再利用している。今回外部照会は0であり、実行前には別承認範囲で公開価格を再確認し、不一致ならSTOPする。

1M token当たりinput $0.20、cache read $0.02、cache write $0.25、output $1.20。予約は全inputを$0.25で評価し、cache割引を期待しない。最大はinput 4,048,000 / output 434,176 tokensで、**$1.5330112**。以前の履歴に基づく想定費用$0.24は計画仮定であり、新候補の実測平均ではない。円換算なし、税・支払手数料は含めない。

既存の[budget](../guidance-quality-wave1/real-pilot/budget.mjs)、[transport](../guidance-quality-wave1/real-pilot/transport.mjs)、[runnerのrunConfiguredPilot](../guidance-quality-wave1/real-pilot/runner.mjs)、[Blind renderer](../guidance-quality-wave1/real-pilot/review.mjs)、[stage receipt確認](../guidance-quality-v19-l1/real-pilot.mjs)を再利用する。同じ機能を別実装しない。消費済みV19-L1 CLIを起動・改変しない。新承認後の薄いprofileで、承認されたexact HEAD/contract・このplan・新runだけを束縛する。今回live entryは作らない。

各HTTP前にstage全上限をdurable予約し、次予約が残予算内でなければ送信しない。成功しても予約を戻さず、timeout/unknown outcomeでも予約を維持する。actual usage受領後に別途実費を記録する。cache-write内訳が不明なら下限/上限を分け、請求確定額とは称さない。

## STOP・証拠・未完了run

model/version/hash/input/settings不一致、上限超過見込み、HTTP失敗/timeout/incomplete/schema-invalid、Safety重大問題、material fact/source/message integrity、本物の同一時点矛盾、accounting不整合でSTOP。再試行・追加sample・別model補完はしない。ACTION_CONSISTENCYのコード名やseverityを一括許容しない。候補PB06が同じfalse positiveを再出力して既存STOP条件へ入る場合も、実行中の評価者判断で解除しない。

各responseを保存しusage精算・schema/既存品質検査を終えた後、次stage前に既存receipt inspectionを行う。現在行動と送信後条件を時間軸で照合するが、Humanの品質投票は代行しない。case、匿名A/B、actual version、PB01目的、入口判定、PB04初回候補、PB05本文、PB06、再評価前後、最終render、usage/cost、error/STOP reasonを内部保存し、盲検artifactからversionとmappingを除く。

F007の原文なし生成文面に`preserved_meaning=true`が残り得るKnown Openは未解決。既存の評価専用draft-source integrity検査を維持し、検出した場合はSTOPする。Human A/Bの勝敗でResolvedにしない。

追加のoffline否定例では、同時点・同一対象の本物の矛盾を`ACTION_CONSISTENCY / major`で2回返すとL1/L2とも修復消尽後にreadyへ戻る既存F007制約を再現した。Product期待はFAILのまま、今回修正しない。次pilotは既存EvaluationTransportの初回major/critical STOPを使うため、この修復消尽経路へ進まない。候補差分のTechnical PASSは、Productionにおける真正矛盾の最終非提供保証ではない。

旧V17/V19-L1 runは追記status（参照原本はPrivate保全・候補には非同梱）により **diagnostic-only / incomplete**。既存のraw output、ledger、lock、STOP、Human回答、sealed mappingを変更せず、Human quality comparisonの勝敗に使用しない。TYPE-C診断の承認は、旧runのSTOP解除や残sessionの実行権限ではない。

実行準備の完了と実API承認は別。最初のcall前にexact HEAD/契約、固定8入力と全設定、価格、$2/72/無retry、fresh one-shot/mapping、fake STOP/ledger/匿名表示を再確認する。Technical completion ≠ Human Quality Acceptance ≠ Production Authorization。
