# Guidance Quality R1 — Local Implementation Wave 1

2026-09-07 / LOCAL ONLY。Technical verification of scoped candidate。実モデル品質確認・Production Authorizedではない。

後継記録: [8-session Pilot準備packet](../../evals/guidance-quality-wave1/pilot-review.md)。以下はWave1終了時の記録を保持する。後継では期間の3phase/重複説明要求を最小修正し、GQ05/24/13/29-P3×2、最大72 HTTP、提案USD $2に限定した。下記旧24session/264・288枠・料金未確認の記述を、現在の計画や実行権限として使わない。

## Authority / baseline

- 開始時local: release/private-ready、HEAD 46fa02a52e39a5c5c4d62bf4e66292619a8b286f、clean、stash空。前Taskの正本・局所調査・30ケース・編集例・評価計画を再利用した。
- Humanの今回の後継指示が、前Taskの「runtime変更禁止／GQ-L1だけ」を今回のA/B/C local候補実装について置き換える。過去記録・凍結期待値は変更しない。
- 直前共有Production revisionは7db33b03f0348424bb426c8afb6d01ea4e472297。本TaskはProduction／remote／DBを照会していない。現在の外部状態UNKNOWN。
- R1 Human Acceptanceは本番トップ・依頼画面・Googleログイン・Accountへの「問題なし」に限定。修正版の新規実購入→鑑定生成→実メール受信、購入後回答品質の受入は未実施。
- 別worktree、global設定、Payment/Auth/通知/価格/支払順序/費用防御/Provider/model/Safety/DB/既存Paid snapshotは変更しない。push/deploy/remote apply/実API評価0。

## 1. A/B/Cの変更・維持・保留

| 対象 | 変更 | 維持 / 保留 |
| --- | --- | --- |
| A 入口 | V5が既存V4を呼び、唯一の不足がusable_action_contextで、検証済みBaseに限定した自然な対人目的がある場合だけready候補へ進める | V4が実際にV3を呼ぶことを確認。元V3/V4は未変更。Safety、根拠事実不足、明示制約、未返信、原文を要するmessage_impact、一問予算は維持。GQ06/GQ17/GQ30の残課題は下記 |
| B 判断 | V3がeffective-policy V2を呼び、optionalな受信挨拶に自然に返す目的を持つ場合だけ、従来waitからreplyへ選択を変更 | お礼／初回誘い自体は元々sendが選べ、主因はA。質問返信も既に正常。無用件・自己送信未返信・連投・境界・断り等へ例外を広げない。send率目標・好意の確定条件なし |
| C 量と形式 | V18 PB04/05/06に必要量原則。actions_to_take=1〜4、avoid=0〜4、aftercare=0〜3、余分なrationale/解釈を作らない。別Plan/report/card marker。候補表示の主行動をactions_to_take[0]へ | send/replyの今使う文面は必須維持。wait/pauseに不要な文面はnull。明示draft・3日依頼を保持。既存の短いopening/closing、reason、review_timingは残す。全section任意化を目的にしない |

Cのschema変更が必要なのはavoid最小件数と識別marker。aftercare=0は既存schemaでも許容され、旧promptが一律三段階を要求していた。Plan schema以外を複製する必要はない。既存rendererは空array/nullの非表示を実装済みなので、描画component自体は変更せずprojectionとdecoderを整合させた。

「3日間をお願い」と明示したのに計画そのものが空なら、候補限定のcompletenessが既存combined repairへ載せる。初回は修復、同じ完全欠落が残る場合は提供しない。全相談に3項目を必須化するgateではない。一部phase不足や説明不足は既存major処理を継承し、必ず提供不可にする変更はしていない。

## 2. 再現と証拠の強さ

| 箇所 | 仕組み・到達性 | 結果と強さ |
| --- | --- | --- |
| pipeline.ts:1279 → jpy980-input-sufficiency-policy-v4.ts:112 → V3 | 現行V17がV4、その内部がV3の不足を利用。普通のunknownはV4で緩和済みだがusable_action_contextは残る | 実際のV17 prepare/execute＋手作成PB01でGQ01/02/05/24/28等の一問確認を再現。モデル抽出・本番発生率は未確認 |
| guidance-communication-purpose-v1.ts:24、jpy980-input-sufficiency-policy-v5.ts:20 | explicitな目的＋Base構造化事実を使用。Candidateの文言や日本語キーワードから事実を起こさない | 候補のGQ28/05/24完全executeはready。関係性、好意、返信時刻を追加しない |
| effective-decision-policy-v3.ts:20 | 元V2がwaitのoptional受信ackに限る | GQ24はwait→reply。元々sendのGQ05/28はpolicy変更不要。自然な質問返信GQ03はreply維持、自己未返信GQ29はwait維持 |
| contracts/pb-04-v18-guidance-wave1.developer.md:58、guidance-decision-plan-v1.schema.json | 一律2〜4行動/注意・三段階aftercareを候補で解消。schemaのavoid min1とpromptを同時変更 | synthetic最小Planはvalidate→projectionまで通過。旧schemaではavoid0を拒否。実モデルが余分な文章を減らすかはNOT_RUN |
| customer-assessment-projection-v1.ts:101 | 旧版はtonight aftercareを主行動に使う。新report markerではcurrent actionを優先 | 同じ「送る＋送った後は待つ」の合成fixtureで主行動の差を再現。旧Paid表示は旧挙動を維持 |
| guidance-request-completeness-v1.ts:7、pipeline.ts:1536 | 明示3日依頼の全計画欠落を候補だけで検知し一回修復 | 欠落→修正でready、全欠落継続でexhausted。部分不足と意味の充足は別評価 |

実装の決定的な通路は確認できた。現行モデルがどの頻度でそのPB01を出すか、実回答の品質が改善するか、本番のwait偏重率はUNKNOWN。過去のV17実モデルCase7は初回/修復ともsendだった歴史的証拠であり、今回の発生率には使用しない。

再現しなかった仮説: お礼・初回の誘いすべてをpolicy-v2がwaitにする、相手の質問返信を常にwaitにする、aftercare0を旧schema自体が拒否する、rendererがすべての空optional sectionを表示する、という一律の問題は認められなかった。該当箇所を無理に変更しない。

## 3. 現行と候補の処理経路

| 層 | 現行 | 候補 |
| --- | --- | --- |
| 選択 | Production application-runtimeがV17を明示 | loadGuidanceQualityWave1StageCatalogをlocalから明示選択。Productionからimportなし |
| 入口 | 同一PB01/PB01C/PB02/PB03→grounding/authority→V4(V3継承) | 同一の抽出・Safety→V5(V4継承) |
| 判断 | effective policy V2→既存decision-policy v2 | effective policy V3→限定ackのみ後継選択。内側v2構造とsingle decision契約を維持 |
| 生成 | 既存PB04/05/06 | 候補PB04/05/06、PB05/06へ明示requested_topicsも渡す |
| 検証・修復 | semantic disposition V7、combined R2、一回修復 | 同じclassifier・修復回数。候補だけ明示期間の構造的欠落を追加。F007一括変更/F008回復実装なし |
| 提供・表示 | old report/Plan/card、旧projection | candidate report/Plan/card、整合decoder、主行動優先。実rendererは共用 |

pipelineを複製せず、既存executorに約50行の限定差分で接続した。候補はlocal AssessmentApplication.submit→executeを通る。prepare、purchase-ready authority、fulfillPreparedは既存V17固定のまま。候補の購入経路・Paid運用まで実装済みとは扱わない。実API runnerも追加していない。

## 4. 代表ケースと逆方向の回帰

全て[凍結30ケース](../../evals/guidance-quality-r1/cases.json)の許容集合を維持。下表はfixtureの方向性契約検査で、文章品質の採点ではない。

| Case | 許容する方向と理由 | 現行→候補の観測 | 避ける回答 |
| --- | --- | --- | --- |
| GQ28 会った後のお礼、文面なし | 一通送る。お礼の目的は既に分かる | 一問確認→完全executeでsend/ready | 原文がないので全停止、好意が確実になるまで待つ |
| GQ05 初めての誘い | 断れる形で一度誘う／自分の選択で延期 | 一問確認→完全executeでsend/ready | 絶対OK、無返信なら再度誘う |
| GQ24 お礼への挨拶返信 | 一言返信／ここで締める、どちらも妥当 | 一問確認＋wait制約→完全executeでreply/ready | 質問でないから危険、返さないと嫌われる |
| GQ03/29 質問の発話者だけが違う | 相手の質問へreply／自分の未返信ならwait | 両版で区別維持。両候補完全executeでready | 発話者の取り違え、週末予定の創作 |
| GQ07/08 明日の確認／期限なし | 期限の用件だけ一通確認／新材料がなければ待つ | intake/policyでsend／wait維持 | 実務確認を気持ちの催促と同一視 |
| GQ11/12 未返信3通／1通 | 連投を止める／普通の待機 | intake/policyでpause／wait維持 | どちらも単にSafetyのwait件数へ合算 |
| GQ13/14 一人にして／連絡拒否 | 境界を尊重し送らない | intake/policyでpause維持 | お礼なら例外、期間経過だけで自動再送 |

GQ24はProductの許容集合にcloseも残す。single decision契約ではcandidate policyは今回の明示的な返信目的をもとにreplyを推奨する。全許容方向をモデルが自由選択できる新契約ではない。元のresponse_expectation=optionalは保持する。会話上の返信義務という事実は追加しないが、この狭い条件の実行policyはreply一択である。全相談の既定値は変えていない。GQ05の自分で延期する自由もProduct上残る。判断の妥当性は実文章の理由と任意性を今後レビューする。

聞き方3ペアは同じtyped事実なら同じ結果、期限・連投・境界・送受信の対照は重要事実へ感度があることを検証した。PB01の質問同調をこのfake検査だけで否定しない。

## 5. 互換性

- current: catalog/prompt V17、schemaSet v6。ファイル・hash・Production selectorはbaselineから不変。
- candidate: catalog/prompt V18、schemaSet v7。PB04 prompt v8、PB05 v9、PB06 v8。
- candidate Plan=guidance-decision-plan-v1、report=guidance-runtime-report-v1、card=guidance-decision-card-v1。Report content schema v2は共用。
- catalogの組合せ／hash照合、旧新report/Plan/cardの6混在組合せ・未知marker拒否、旧avoid min1を保持。
- 過去の有効なPaid payloadの値・意味・表示処理を候補へ変換しない。新候補の受信対応を共用decoderに足すだけ。既存snapshot/hash/契約を黙って上書きしない。

## 6. 検証結果・限界

| 検査 | 結果 |
| --- | --- |
| verify-ab.mjs | 12/12 PASS、現行の到達性と候補関数、negative controls |
| verify-case-matrix.mjs | 30件: 18方向契約一致、1編集機能対応、2KNOWN_GAP、9input-only。V17 prepare21件＋V5/V3直接21件。これを30品質PASSと呼ばない |
| verify-runtime.mjs | 22/22 PASS。5候補完全execute、現行対照、量/契約/修復/逆方向回帰。known F007/F008も残存として検査 |
| render-preview.mjs | 実component SSR 4画面、13/13 PASS |
| ブラウザ確認 | localhostの4ページを確認。最小・waitは空注意/計画/文面カードなし。詳細の補足展開を確認。候補primary送信、旧primary aftercareを確認。wait画面1265pxで横はみ出し0、空heading0。mobile/コピー/hydrationは未検証 |
| 既存paid品質回帰 | 4/4 PASS、既存R2 soft/critical分類の挙動維持 |
| 既存final-product-scope | PASS、既存正常・確認・対象外・Safetyの境界維持 |
| typecheck | PASS |
| build | PASS、Next.js 16.3.3、47/47 static pages |
| npm run lint | 未変更のignored .tmp/r1-resume-write-report.mjs:2 unused readFileSync警告1件でFAIL。今回の変更に起因しないため未編集 |
| source lint | eslint . --max-warnings=0 --ignore-pattern '.tmp/**' PASS。設定ファイルは変更せず、既存一時ファイルを検査対象から除外して切り分け |

独立reviewは実装者以外がコード・凍結期待・否定例・表示資産を確認。指摘された明示3日全欠落は修復経路へ追加。拒否変異テストが「新例外なし」しか証明しない点は整合GQ06 fixtureで再検査しKNOWN_GAPとして残した。

fakeのPB06 verdictを実品質の証明にしない。実モデルが未知の事実・文面意味改変・矛盾を検出できる確率は未検証。criticalな事実/文面/行動findingを手注入した場合の既存一回修復とfail-closedだけを検証した。

## 7. 未解消と次段階の境界

- GQ06: 同じ誘いを断られた、という範囲を全連絡拒否に広げない正確なfixtureでは、現行/候補とも一問確認。候補policyはwaitで再勧誘を追加しないが、境界を尊重する回答の提供には届かない。このWaveの自然交流例外を曖昧なother境界全体へ広げない。
- GQ17: 原文なしの「その文面を整えたい」はdraft_messageだけだと現行/候補ともready判定。draft_messageは新規作成も意味し、既存Base schemaに「特定原文を編集する依頼」の専用authorityがない。全draft依頼に原文を要求する代替は不可。次の限定契約で生成/編集対象を分け、編集原文だけ一問確認するのを推奨。PB01/schema/clarificationの追加改定が必要で、このWaveでは未実装。承認済みProduct原則を再質問しない。
- GQ30: message_impactの原文欠落はscope段階で確認になる。併存するお礼方向を部分納品する経路はまだない。購入準備/Paidに及ぶ契約変更を本Waveへ混ぜない。
- F007: fake PB06を無findingにして理由Fact IDだけF999へ変えると、現行/候補ともsemantic-shape修復後の既存R2によりreadyになる合成反例を確認。入力にない事実を許容するProduct承認ではない。classifierを一括修正していないため残存として明記する。同じく一部3日phase/説明の不足がmajorとして残った場合の完全充足は保証しない。
- F008: 初回が成立していてもreport-only改善版がschema/技術失敗なら旧候補を救済しない。既存の失敗経路を再現、Recovery engineは未実装。
- 許容済み複数方向をruntime policy上も複数選択可能にすること、opening/closingや文面をさらに任意化することは今回の目的にしない。

残る品質判断の具体例: 「3日間のうち後半の見直しだけが薄いが、今の行動・理由は有効」なら、推奨は不足部分の修復と本文による評価であり、項目数だけの全体停止ではない。全面欠落とは区別する。厳密な提供境界は実モデル比較時のHumanレビューへ残す。Productの送る/待つ比率や既承認思想の再承認は不要。

## 8. 最小pilot準備

[評価用READMEと上限内訳](../../evals/guidance-quality-wave1/README.md)、[未承認pilot plan](../../evals/guidance-quality-wave1/pilot-plan.json)を参照。GQ05/24/03/13×現行/候補=8セッション。既存24セッションの内数。最大288管理枠は24×12だが、source上の最大は11呼出し/セッション=264。残1は未使用枠でretry許可ではない。pilotのsource上限88、管理枠96。

stage別token上限案と積算式を固定した。価格の外部取得・金額確定は未実施。既存transportにmax_output_tokensがないため、そのままAPI試験を走らせない。次回は評価専用の上限実装、公式料金確認、費用・実行範囲の別承認が必要。未購入の本番予算やCustomerデータは使用しない。今回は実API0、API費用0。

## 9. 変更ファイル・local commit

Implementation commit: 196fd6848ad1b49b79c5ab5753243bda8c5f3660。この記録・CURRENT_FOCUS/CODEX_HANDOFFの後継overlayは別のlocal docs commitにまとめる。最終HEADはTask最終報告およびgit logで特定する。

- source既存8: pipeline.ts、fakes.ts、types.ts、runtime-result-normalization-v1.ts、customer-assessment-projection-v1.ts、customer-assessment-experience-projection-v2.ts、report-grounding-v4.ts、selected-request-product-completeness-v2.ts（全てlib/assessment/runtime配下）。
- source新規6: guidance-runtime-identity-v1.ts、guidance-stage-catalog-v1.ts、guidance-communication-purpose-v1.ts、jpy980-input-sufficiency-policy-v5.ts、effective-decision-policy-v3.ts、guidance-request-completeness-v1.ts（別executorは作らない）。
- contracts新規5: runtime-stage-catalog-v18.json、guidance-decision-plan-v1.schema.json、PB04/05/06のv18 developer契約。
- eval資産9: ab-fixtures.mjs、verify-ab.mjs、case-matrix.mjs、verify-case-matrix.mjs、runtime-fixtures.mjs、verify-runtime.mjs、render-preview.mjs、README.md、pilot-plan.json。
- docs3: 本書、docs/CURRENT_FOCUS.md、docs/CODEX_HANDOFF.md。

全てlocal commitのみ。保護対象と凍結ケースの変更0。生成した表示資産はignored .tmp内で管理し、Product出力や正式snapshotとしてcommitしない。
