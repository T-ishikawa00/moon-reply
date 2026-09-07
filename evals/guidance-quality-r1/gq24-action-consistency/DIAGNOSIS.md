# GQ24 ACTION_CONSISTENCY — saved-evidence diagnosis

2026-09-07 / LOCAL EVIDENCE ONLY。開始`release/private-ready@6485d54822141ce384cbb825d029d8db132f9b25`、clean。新API・repair・retry・Production変更・push/deployは0。今回のA/B version mappingは開示しない。

## 1. 判定

**TYPE-C：このfindingは現在の返信と、送信後の待機・見直しを混同したfalse positive。** 保存されたPlanとReportは時間順序として整合している。主方向は`reply_now`であり、「待つ」の語数やaftercareの長さで分類を変えない。

これは保存された単一の`ACTION_CONSISTENCY`の診断確定であり、候補全体の品質合格・Human受入・納品許可ではない。元のpilot STOPを取り消さない。最終的なCustomer向け提供結果は存在せず、検証前の回答候補を調べている。

## 2. 指定された証拠の抽出

正本は保存receipt。版名を除いた[抽出JSON](evidence.json)へ、対象fieldを値のまま展開した。`extract.mjs`は固定8ファイルを読み、正規化JSON hashと由来を付け、元ファイル無変更を確認する。新しい回答は生成しない。

| 対象 | 保存値／意味 | 抽出根拠 |
| --- | --- | --- |
| PB01 communication purpose | `respond_politely` / `current_situation_explicit` | `evidence.json:39` |
| input sufficiency | `admitted_to_product`。保存出力から同じ実行sourceで再計算されたtraceは`full_paid_ready_candidate`、clarification=null | `evidence.json:44` |
| PB04 current decision | `reply_now` | `evidence.json:54` |
| PB04 recommended action | 今夜短く丁寧な一言を送る。送信後は追加メッセージを送らず、通常の予定や休息へ戻る | `evidence.json:55` |
| PB04 avoid actions | 根拠のない質問・誘いの追加、返答直後の追加メッセージ、返答の有無からの関係断定を避ける | `evidence.json:61` |
| PB04 aftercare / reassessment | 送信後は追加連絡なし。新たな具体的話題・質問が来たら内容に応じて返答検討。新規連絡なしなら待って見直す | `evidence.json:71`、`:100` |
| PB04 review timing | 「今夜の短い返答を送った後、相手から新しいメッセージが届いた時に見直す。」 | `evidence.json:117` |
| PB05 current answer | 「今夜は短く丁寧に応じる方向が合っています」。会話継続のための質問・誘いの追加は不要 | `evidence.json:126` |
| generated message draft | 「こちらこそ、ありがとう。」、`required_now / now` | `evidence.json:66`、`:134` |
| PB05 next action | 短く返す。送った後は追加連絡や反応確認を重ねず、通常の予定や休息へ戻る | `evidence.json:139` |
| PB05 reassessment condition | 生出力は`[]`。PB06へ渡す前にApplicationが条件ごとの中立的な見直し文2件へ補完 | `evidence.json:144` |

文面の生成主体・正本は**PB04**の`recommended_message_draft`。PB05は別文面を生成するfieldを持たず、既存文面の説明・行動理由を持つ。「PB05の文面」として別の文を捏造しない。

input sufficiencyのstateは、保存されたPB01/PB02とexact実行sourceによる既存postflight派生trace。モデルの新出力でも、当時そのfieldを直接記録したreceiptでもない。実際のPB04到達と`admitted_to_product`が直接の実行証拠で、両者を区別する。

## 3. 時間軸

| 時点 | 指示分類 | 対象となる行動 | 保存根拠 |
| --- | --- | --- | --- |
| T0 今夜、今回の一通を送る前 | **reply** | 相手のお礼へ短く一通返す | PB04 selected_decision・actions[0]・draft、PB05 action_rationales[0] |
| T1 その一通を送信した直後 | **do not send**（追加分） / wait | 今送った一通を取消す指示ではなく、続けて別のメッセージを送らない | PB04 actions[2]・aftercare[0]、PB05 action_rationales[1] |
| T2 新しい連絡が来ていない間 | **wait / reassess** | 追送せず生活へ戻る。新規情報がない状態で判断を決めつけない | PB04 change_conditions[1]、aftercare、review_timing |
| T3 新しい連絡が届いた後 | **reassess → 条件付きreply** | 新たな話題や質問の内容に応じて返答を検討する。全受信への返信義務ではない | PB04 aftercare[1–2]・change_conditions[0]・review_timing |

T0の対象は「今回の一通」、T1/T2の禁止対象は「その後の追加送信」。時点も対象も異なる。T0で同じ一通についてreplyとdo-not-sendを同時に要求する文はない。

`change_conditions[1].condition`単独には「送信後」の文字がないが、同じPlanのactions、aftercare、review_timingとPB05の「送ったあとは」が時間軸を明示している。元文を編集してこの結論へ合わせていない。条件fieldだけを切り出した読み違いの余地はあるが、全体を対象とする今回のTYPE判定をDにする不確定性ではない。

## 4. PB06 finding・repair・前後差分

| 項目 | 保存値 |
| --- | --- |
| finding code | `ACTION_CONSISTENCY` |
| severity | `major` |
| json path | `decision_plan.change_conditions[1].resulting_direction` |
| evidence refs | `policy:effective_decision_policy_result`、`policy:decision_policy_result`、`policy:action_context` |
| 説明 | 将来の`wait_and_reassess`を、現在の許可方向が`reply_now`だけであることを理由に不許可と判定。Reportの条件補足にも同じ不許可方向があると説明 |
| PB06 repair requirement | `repair_strategy=null`、`final_disposition=null`。PB06はfindingのみ返す契約 |
| Applicationの修復directive | 発行なし。評価transportがcallback前にSTOP |
| 実再評価・修復 | 0。PB04/PB05/PB06はすべてattempt 1のみ |

再評価前の値は`currentDecision=reply_now`、将来条件=`wait_and_reassess`。**再評価後の候補は存在しない**のでafter=null。修復で変更された、待機へ寄せ直された、あるいは修復済みとは報告しない。[実値](evidence.json:154)

PB05生出力の`change_condition_commentary=[]`とPB06入力の2文の差は、再評価ではなく既存Application grounding。補足文[1]は「『相手から新しいメッセージが届かない』が確認された場合は、その時点で状況を見直します。」で、現在の返信をやめる指示も将来waitの命令も書いていない。配列自体はPB06入力に存在するため、「PB06が存在しない配列を捏造した」という説明も採用しない。

## 5. exact root cause / layer

1. **PB06 evaluatorが時間的authorityを誤適用した。** 現在の`allowed_decisions`を、送信後の将来条件へそのまま要求した。既存contractは既に現在／将来の分離を要求する（`lib/assessment/runtime/contracts/pb-06-v17-product-quality-v1.developer.md:36`、`:116`）。したがって「ルールが全くなかった」ではなく、実応答が既存ルールを守らなかった事例。
2. **既存classifierの限定除外に入らなかった。** `semantic-disposition-v7.ts:35`は`ACTION_CONSISTENCY`かつfuture resulting_direction pathについて、参照が2種の現在policyだけなら除外する。`:18`の集合に`policy:action_context`は含まれず、`:51`の`every`がfalseとなる。別の中立commentary除外も、今回のfinding pathがPlan側なので該当しない。
3. **先行する通常blockingが残り、評価transportが即STOPした。** `semantic-disposition-v4.ts:150`の`material_product_outcome_path`が維持され、`evals/guidance-quality-wave1/real-pilot/transport.mjs:42`でmaterial対象となる。`:90`で手動receipt確認より先にthrowする。Productの再評価callbackは未到達。

保存request/responseを既存classifierへlocal再投入し、現行blockingを再現する。一方、参照の`policy:action_context`だけを**in-memory対照**で除くと`ignored / future_reassessment_is_not_current_policy_authority`へ変わる。元のreceipt・findingは変更しない。この対照は判定経路の因果確認で、正解に合わせた実出力編集ではない。

PB04生成・PB05生成・grounding/renderingが、今回の相反指示を作ったとは認められない。`change-condition-grounding-v4.ts:17`は条件＋中立見直し文だけを生成する。共有renderingを変更する理由はない。

## 6. 最小修正案と実装境界

**推奨はPB06 evaluatorの時間軸説明だけを、新しい候補契約で具体化すること。** [候補追記案](pb06-proposal.md)を用意した。current action、送信済みの一通と追加分、新規受信という条件、現在の許可方向と持続する境界を分ける。矛盾findingには、同じ条件・時点・対象で両立しない指示の具体的な根拠を既存detail内で説明させる。policy違反は命令と適用される制約を示す。

schema・PB04・PB05・rendering・Safety・fact/source/message integrityの変更は不要。section・finding code・retryを追加しない。V17/V19の既存prompt/hash/Paidは上書きしない。

今回は**稼働判定の修正を実装しない**。TYPE-Cは一意に確定したが、`action_context`を許容集合へ追加するだけのdeterministic修正は、同じmetadataを持つ本物の相反指示・即時追送も隠し得る。現在のPlan v2は行動・aftercare・triggerを自由文で持ち、`decision-plan-constraint-integrity-v1.ts:13`にその検証限界を明記している。この1件から安全な汎用の意味判定例外は導けない。Product/Safety境界を変えない範囲は、今回追加した証拠抽出・再現fixtures・未接続の改訂案までとする。

F007全体を緩和せず、元のSTOP/ledger/候補結果を保持する。候補prompt改訂を採用しても、それ自体は実モデルの誤検知改善を証明しない。

## 7. Regression fixtures

[fixtures.json](fixtures.json)は人手で時間軸と期待値を固定した架空の否定／肯定fixture。既存30caseや保存実出力の期待値を変えない。

| fixture | 主方向 | 意味上の期待 |
| --- | --- | --- |
| SEND_NOW_THEN_WAIT | send | PASS：一通送った後は追加なし |
| REPLY_NOW_THEN_WAIT | reply | PASS：一通返した後は追加なし |
| DO_NOT_SEND_AND_WAIT | no-send | PASS：現在の送信を控えて待つ |
| SEND_NOW_AND_DO_NOT_SEND_NOW | 不成立 | FAIL：同じ時点・同じ一通の相反指示 |
| SEND_NOW_THEN_SEND_AGAIN_IMMEDIATELY_WITHOUT_REASON | 不適切な追加send | 既存policyに従い検出：単なる待機aftercareではない |
| WAIT_UNTIL_REPLY_THEN_REPLY | wait | PASS：今は待つ。新たな受信後に内容・境界を再確認して返す |
| EXPLICIT_BOUNDARY_DO_NOT_CONTACT | no-send | PASS：境界に従って接触しない |

fixtureのPASS期待と、classifierへ人手のfindingを渡したlocalテストのPASSを混同しない。既存classifierは日本語の相反指示を独立に発見するNLP detectorではない。fixture否定例のfindingは手作業の合成入力である。実モデルのprecision/recallは今回測らない。

## 8. 新API前のlocal acceptance criteria

- 固定receipt・入力・Human評価・A/B対応表・ledger/STOPを無変更で保持し、今回のfindingが現行sourceで同じblockingへ至ることを再現できる。
- 時間軸期待を出力に合わせて変えず、send/reply→waitを主send/replyとして扱う。現在の同時点矛盾、理由のない即時追送、現在／将来の境界違反は検出対象として残す。
- 新候補を採用する場合、変更はPB06の時間軸説明に限定し、schema・他prompt・production selector・Paid・Safety/事実/文面由来を同一にする。新version/hashと明示local選択の互換確認が必要。今回はこの候補契約の接続は未実装。
- 7 fixtureと保存GQ24を使い、対照操作が他finding・他fieldの重大問題を消さないことを確認する。code/severity/path/参照名だけによる一括許容を禁止する。
- runtimeを接続する段階では対応した既存回帰、typecheck、変更source lintを実施する。fake/保存出力再生は実モデル品質確認と区別する。
- runnerの即STOP・予約・retry0は維持。今回の停止runを再利用しない。新APIは新しい費用・session範囲のHuman承認後に限る。残予算や本診断は実行許可にならない。

## Local verification

`node evals/guidance-quality-r1/gq24-action-consistency/extract.mjs`：指定値の抽出、保存8ファイル無変更、version mapping非表示。

`node evals/guidance-quality-r1/gq24-action-consistency/verify.mjs`：**17/17 PASS**。既存classifier/境界validatorの保存再現と合成否定例を検証した。candidate promptによる新出力はない。独立担当者も同じ保存証拠からTYPE-Cと判断した。

対象2本のJavaScript ESLintは警告0 PASS。runtime変更がないためProduction build・全体typecheck・全体lintの再実行はしていない。既存未変更の一時ファイルへ触れず、全体lintの留保を解消済みとも扱わない。
