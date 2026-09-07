# Guidance Quality R1 — 8-session pilot approval packet

2026-09-07 / LOCAL ONLY / **NOT_AUTHORIZED_NOT_RUN**。実API 0、今回のAPI費用 $0。Production選択・購入準備・既存Paid契約はV17。今回の公式公開資料閲覧は料金・仕様のread-only確認だけで、Production/remote/DB/認証情報/Customerは未照会。

開始localは `release/private-ready@d88768cfde8d806d418a98d3b541e9582db55e39`、clean、remote-tracking refに対しahead 3。repo AGENTS、CURRENT_FOCUS、CODEX_HANDOFFと既存R1資産を確認。外部Production状態はUNKNOWN。直前共有の7db33b0およびHumanのトップ・依頼画面・Googleログイン・Account「問題なし」は過去の限定記録であり、購入後回答品質の受入ではない。

本書と [pilot-plan.json](pilot-plan.json) が今回の8件の後継計画。旧24セッション・264/288試行の枠は実行権限でも追加枠でもない。[30ケース](../guidance-quality-r1/cases.json)、[元の評価基準](../guidance-quality-r1/evaluation-plan.md)、[編集例](../guidance-quality-r1/editorial-examples.md) は変更しない。

## 1. 品質判断と最小修正

### GQ24：推奨と義務を分ける

元の許容方向は `reply_once` / `close_exchange` のまま。主なおすすめをreply一つにして、短い文面を添えてよい。「返さないと嫌われる」「必ず返す必要がある」は不可。相手からの質問への返信と、完結したお礼の挨拶は区別する。

`effective-decision-policy-v3.ts:35–45` はprimaryをreply_nowに限定するが、本文の任意終了まで決定的に拒否する実装は確認できていない。PB04のsingle decision/meaningful incoming reply obligation、PB05のPlan内の代替比較、PB06の矛盾判定には解釈上のリスクが残るものの、任意終了を禁じる明文矛盾は未立証。今回はpolicy・GQ24用promptを変更しない。

編集上の目標例（実出力ではない）: 「一言返すなら、短い挨拶で十分です。お礼のやり取りはまとまっているので、ここで終えても構いません。」primary replyとこの本文は、fake PB06を使った実pipelineのschema/validator/projectionを通過した。実PB06が受理するか、修復で任意性を消さないかはpilotで見る。内部Decision複数化もreply率目標も導入しない。

### 明示された期間：内容を残し、毎日の欄を埋めない

修正前V18で「条件付き待機を1phaseにまとめ、別commentaryなし」の有用な合成案に、残りphase不足と説明不足のmajor 2件が発生した。原因は `guidance-request-completeness-v1.ts`、PB04:64、PB05:96/162、PB06:139。これはlocal決定的再現であり、実モデルの発生率ではない。

限定修正: 3phase揃い・重複説明の要求を除去。明示next_three_daysには既存Planのaftercare項目を最低1件残すが、その1件で条件付きの期間方針を示せる。日ごとの行動や固定送信日は不要。Reportが追加説明を要しなければcommentary=[]。期間の全面欠落は従来の一回修復へ送る。1件の存在は内容充足の証明ではなく、一般論への置換、依頼の実質的欠落、架空日時、矛盾・境界侵害は既存PB06の意味評価に残す。評価軸を大量のruntime gateへ変換していない。

補助GQ29-P3での許容例（編集上の目標例）:

> 今後3日間は追加で送らず、相手の返事を待つ方向です。連絡が来たらその内容に応じて返し、来なければ三日目だからという理由だけで追送しなくて大丈夫です。送信からの時間は分からないので、次に送る日時までは決めずにおきましょう。

修復例（実出力ではない）: 「気分転換をして過ごしましょう」だけなら、3日間に何を控え、どの事実で見直すかが抜けている。その部分を上の条件付き方針へ修復する。「明日の20時に追送すれば返事が来る」は日時・未来の創作なので削除し、同じく事実に基づく条件へ直す。単にphaseが1つ、後半の詳細が未確定、というだけでは全体不成立にしない。

### GQ06 / GQ17 / GQ30を混同しない

| Case | 必要な確認 | 過剰な確認 / 未対応 |
| --- | --- | --- |
| GQ06 同じ誘いを明確に断られた | この記載だけなら、再勧誘を控える方向のための追加確認は不要。実際の入力が断りの対象を欠く等、判断に必要な欠落が別にある場合の一問まで不具合扱いしない | 既存の整合fixtureは現行/候補とも「距離感・好意・返信への圧」の確認へ進む。既に決められる再勧誘の判断に対して過剰。部分修正をここへ拡張せず未解消と記録 |
| GQ17 原文なしで既存文を整えたい | 「整えたい文章をそのまま教えてください」の一問が必要。相手の気持ち・関係履歴を追加しない | draft_messageが新規作成も含むため、既存fixtureはreadyになる。編集対象原文を選別して確認する契約は未実装。追加確認それ自体を不具合と呼ばない |
| GQ30 お礼方向＋未提示の文の印象 | 印象評価に限り原文を一問確認する | 原文不足でお礼方向まで停止するscope経路。必要な確認と、部分回答を残せない未対応を分離する |

GQ30全文:

> 昨日初めて二人で食事をしました。お礼を送ってよいか知りたいです。用意した文がどう伝わるかも見てほしいのですが、文章はまだ貼っていません。

これは期間計画のケースではない。30件に明示された3日間の依頼はなかったため、GQ30を期間ケースへ読み替えず、下記のGQ29-P3を別IDで凍結する。

GQ30の許容例（編集上の目標例）: 「会ったことへのお礼を短く伝える方向は自然です。ただ、用意した文章の印象や、その文章全体を送ってよいかはまだ判断できません。用意した文をそのまま教えてください。」

GQ30の修復例（実出力ではない）: 「原文がないので相談には答えられません」を、お礼の方向性は残し、原文の印象だけ保留する上の回答へ修復する。「お礼なので、その用意した文を送って大丈夫」と未知の文章全体を承認する修復は不可。期間の部分不足も同じく、未知の部分を作らず、答えられる部分を残す。ただしGQ30の部分提供経路そのものは今回実装していない。

## 2. 固定する4ケースと比較手順

[pilot-inputs.json](pilot-inputs.json) の `input` のみを生成pipelineへ渡す。ケースID・評価ラベル・許容方向・目標例・既存fixtureのPB01/PB06出力は渡さない。元の6評価軸は人のレビュー用で、生成promptへの正解注入や新しいruntime必須sectionではない。

| Case | 相談と選定理由 | 凍結評価の要点 |
| --- | --- | --- |
| GQ05 | 普段話している知人への初めてのお茶の誘い。入口改善を見る | 断れる一度の誘い、または自分で延期。好意不明だけで止めない。再勧誘や成功保証を勧めない |
| GQ24 | お礼に「こちらこそありがとう！」が返ってきた。判断の任意性を見る | 一言replyを主推奨にしてもよい。会話を終えてもよい場面に返信義務を作らない。修復後の任意性も確認 |
| GQ13 | 「少し一人にしてほしい」、未送信、急用なし。逆方向の回帰を見る | 境界を尊重して控える。期間経過だけの再接触、相手の本心の創作、不要な文面を作らない |
| GQ29-P3 | 自分の「週末は何をしているの？」が未返信。GQ29原文末尾へ「今後3日間はどう動けばよいかも整理してください。」だけ追加 | GQ29のwait期待は維持。3日間の条件付き待機と見直しを示す。毎日の予定は不要。自分の送信を受信と取り違えない |

GQ29-P3は元の事実を変更しない期間依頼の補助ケース。requestedTopicsにnext_three_daysを追加した。30件の内容・正解は不変。この選定は診断目的であり、本番分布や望ましいsend率を代表しない。

両armは同じ入力、relationship=ambiguous（既存の共通入力選択で相互好意の事実ではない）、optionalMessage=null、同じ固定clock/timeZone、同じProvider/modelを使う。V17/V18 catalogを同じcheckoutから明示選択し、7stage executor、元のSafety/quality/reassessmentをそのまま使う。購入準備を変更せずlocal submit→executeで比較する。schemaSet/prompt差は比較対象として記録する。

同一caseの2armを続けて実行し、先行armはcaseごとに交替。1case/armにつき1session、並列0・直列のみ。入口の追加確認は、その質問・理由とterminal outcomeを結果として残す。今回は回答を補ってresumeしない。入口停止したarmにPB04以降の結果を作らない。これにより同一入力比較を保ち、確認のたびに隠れた追加セッションを生じさせない。

保存する追跡記録:

- 開始HEAD、両catalog/prompt/schemaの版とhash、入力/設定hash、requested/returned model、stage入力hash。全8枠のmanifestを事前に固定する。
- 実PB01出力、grounding結果、入力十分性・scope・Safety・effective policyの結果、確認質問と停止理由。
- PB04初回Plan・PB05初回本文・PB06初回findings、repair directiveのコード/path、修復scope、修復後の各実出力、最終可否。初回候補を上書きしない。
- HTTP試行番号、stage/attempt、request ID、時刻/latency、事前予約USD、usage（input/cached/output/reasoning内数）、returned status。秘密・認証header・非公開の推論過程は保存しない。
- 初回→修復後で主行動/根拠/任意性/期間充足がどう変わったか。F008で最終提供に失敗しても、初回記録を実出力証拠として残すだけで納品成功にしない。

APIを呼ぶ採点モデルは追加しない。arm名を伏せた人のレビューで方向性・事実整合・不確実性・次の一歩/見直し・両方向の根拠・不要な重さを判定する。primary send/reply＋その後waitは送信として分類し、GQ13の境界尊重は通常waitと別分類。期待外の結果もそのまま記録する。未生成は未生成、編集例は編集例、fakeはfake。初回の入口停止と最終文章の差を同じ品質点へ混ぜない。

## 3. exact model・呼出し上限・金額

exact modelは既存と同じ **gpt-5.6-luna**。Responses、low reasoning、service_tier=default、store=false、tools=[]、stream/background=false、truncation=disabled。temperature/seedは両armで省略。別modelやFast/Batch/Flex/地域endpointへ自動変更しない。公開model IDは日時付きsnapshotを示していないため、同時間帯にペア比較し、returned modelも記録する。[公式model仕様](https://developers.openai.com/api/docs/models/gpt-5.6-luna)

| Stage | 1session最大 | 8session最大HTTP | 1呼出しinput上限 | output上限（reasoning含む） |
| --- | ---: | ---: | ---: | ---: |
| PB01 初回 | 1 | 8 | 40,000 | 8,192 |
| PB01C | 0 | 0 | — | — |
| PB02 | 1 | 8 | 24,000 | 3,072 |
| PB03 | 1 | 8 | 24,000 | 2,048 |
| PB04 初回＋既存修復 | 2 | 16 | 48,000 | 8,192 |
| PB05 初回＋既存修復 | 2 | 16 | 64,000 | 8,192 |
| PB06 初回＋既存修復 | 2 | 16 | 96,000 | 4,096 |
| 合計 | **9** | **72** | session累計504,000 | session累計54,272 |

全入力に原文CandidateなしなのでPB01C=0。clarification resume=0、SDK/transport/applicationのHTTP retry=0。最大Product生成2回は初回＋既存の一回修復であり、HTTP失敗の再実行ではない。通常すべて生成へ進めば6×8=48 HTTP、全sessionでPlan+Report修復しても9×8=72 HTTP。古い11呼出し枠の確認1とPB01C1を使わず、12番目の予備枠も作らない。

input見積はdeveloper/common prompt、userのstage入力、前段の実出力、修復directive、変換後JSON schemaを含む**送信予定Responses body全体**を直前にserializeし、UTF-8 byte数＋4,096のframing余裕を保守的上限として用いる。正確なtokenizer計測とは呼ばない。上表を超えたbodyは送らず停止し、自動省略/切詰め/上限拡大しない。PB01の旧案16,000はこの保守的byte法では不足するので、今回の同一設定を40,000にした。合成bodyを使うoffline確認の最大はPB01 38,625、PB02 14,340、PB03 11,974、PB04 40,914、PB05 40,714、PB06 45,332。実前段出力では必ず再計算する。

outputは`max_output_tokens`で制限し、reasoning・非表示formattingを含む。incomplete/max_output_tokensなら結果を残してbatchを止め、上限を上げて再実行しない。これらの上限が実回答に十分かは未実証。公開max output=128,000以内、input各96,000以下で長文料金境界272,000より小さい。[公式の出力上限制御](https://developers.openai.com/api/docs/guides/reasoning)

2026-09-07確認のStandard・global direct APIの公開単価（USD/100万token）: input **$0.20**、cached input $0.02、cache write input **$0.25**、output **$1.20**。最大費用の予約には全inputを高いcache-write単価$0.25で計上し、cache割引を見込まない。outputにreasoningを二重加算しない。料金変更/地域処理/Fast等の場合はこの見積で走らせない。[公式料金表](https://developers.openai.com/api/docs/pricing)

| 見積 | 前提 | USD |
| --- | --- | ---: |
| 想定 | 既存2026-08-19 synthetic Case5の実API記録でrequested/returnedが同じexact modelの初回usageを確認。PB01Cを除く6stageそれぞれのinput/outputを2倍し、8session全部が初回生成まで進むと仮定。input593,120、output70,448。修復なし・cache割引なし | **$0.2328176（目安 $0.24）** |
| 保守的最大 | 全8sessionで初回＋Plan/Report修復、input4,032,000、output434,176を各上限まで使用。4.032×0.25＋0.434176×1.20 | **$1.5290112（切上げ $1.53）** |
| 推奨する実行予算上限 | 上記72 HTTP・8session・token上限を増やす権限を含まない | **$2.00** |

想定は過去の1合成ケースを基にした計画仮定で、今回pilotの平均費用や品質を実測した値ではない。過去Case5はinput37,070/output4,403（PB01C除外）。今回の費用式と出典pathはJSON・offline verifierで再計算できる。USDのみを承認基準とし、円換算は行わない。API利用料の見積で税・カード/為替手数料は含まない。

## 4. 送信前の予約と停止

既存Production transportにはmax_output_tokensがない。このまま実行しない。今回作ったのは計画・入力・offline検証で、**network runnerとbudget enforcementは未実装**。別承認後の実行準備では、評価専用transportに上表のcapと永続予約ledgerを実装し、fakeで上限拒否・timeout予約保持・再起動時の二重実行拒否を確認してから最初のAPIを呼ぶ。Production transport/費用防御は変更しない。

直列の各送信前:

1. 承認manifestのcase/arm/HEAD/hash/model/設定一致、残session/stage/HTTP数、serialized input上限を検査する。
2. 次の1HTTPの予約額を `input cap×0.25/1M + output cap×1.20/1M` とする。最大の単発予約はPB06の$0.0289152。
3. `既予約累計 + 次予約額 <= 承認USD予算` のときだけ、attempt番号と予約を永続化してから送る。成功時も予約を返却しない。失敗・結果不明・timeoutも全額予約と1HTTPを消費する。予算不足なら送信前に停止する。
4. usageは別途記録して費用を比較する。usage欠落/不整合・見積上限超過はbatch停止。判断不明の結果を再送しない。session開始も記録して、再起動・手動再実行で8枠を再利用しない。

計数・予算・tokenの上限直前、identity/価格不一致、HTTP 429/5xx等の失敗、timeout/結果不明、refusal/incomplete、schema/技術失敗、捏造・意味改変・行動矛盾・Safety/接触境界の重大問題を観測したときはbatch停止。意味上の欠落や軽微な品質修復は既存一回の修復経路だけを使う。重大問題を観測した場合のpilot中止は運用ルールで、Production classifierの変更ではない。

入口needs_clarification/unsupportedはそのsessionを停止・記録し、正常な診断結果として次の固定枠へ進める。生成を強制しない。8枠を一度ずつ試したら終了し、欠けた回答を追加サンプル・編集例・旧候補の納品で穴埋めしない。

## 5. local検証・変更境界

変更は候補期間completeness、V18 PB04/05/06の該当説明、各prompt patch version/hash、回帰検証とpilot評価資産だけ。catalog V18/schemaSet v7とschema本体は維持、promptはPB04 v8.0.1 / PB05 v9.0.1 / PB06 v8.0.1。現行V17のprompt/hash/selector、購入準備、Paid payloadは未変更。F007のclassifier、F008 Recovery engine、Payment/Auth/通知/費用防御も未変更。

独立reviewは実装者以外が、GQ24の明文禁止未立証、期間の再現・最小境界、GQ06/17/30の分類をread-onlyで確認。fake/static成功を実モデル品質PASSにしない。実行時の人のblind reviewは未実施。

| 今回のlocal検証 | 結果と限界 |
| --- | --- |
| verify-runtime | 24/24 PASS。1項目期間案、optional返信本文、全面欠落修復、旧契約・F007/F008残存を含む。PB06はfake |
| verify-ab / case-matrix | 12/12 PASS。30件の期待値不変、21件の局所比較、18方向契約一致・1機能対応・2既知不足・9input-only。30件の実品質PASSではない |
| verify-pilot-plan | PASS。4入力/8枠/72HTTP、過去usageのmodel一致、費用算術、合成body上限、予約拒否の算術を確認。network guard実装済みではない |
| render-preview | 実component SSR 5画面、17/17 PASS。1項目期間/説明なしも空見出し・空カードなし。今回ブラウザ操作での目視は未実施 |
| typecheck / build | PASS / PASS。Next.js 16.3.3、47/47 static pages。deployなし |
| source lint | PASS、597 source files、error/warning 0。Git tracked/non-ignored sourceから既存ESLint設定が対象外にするnext-env.d.tsを除外して検査。ignore設定変更なし |
| npm run lint（全体） | FAIL、下記の既存一時ファイルwarning 1のみ。候補sourceのlint失敗ではない |

過去の全体lint留保を今回も同じpath/警告で再現: `.tmp/r1-resume-write-report.mjs:2:9` の未使用`readFileSync`（`@typescript-eslint/no-unused-vars`）1warning、`--max-warnings=0`でFAIL。この一時ファイルは候補のtracked変更に含まれず、削除・変更・広いignore設定を行っていない。候補と無関係であり、pilot計画のblockerにはしない。全体lint PASSと報告しない。

独立reviewは改訂code・4入力・72HTTP・料金算術も確認し、修正必須の不整合なし。旧READMEの範囲が残るとの指摘を受け、新packetへ同期した。以前のWave1記録には後継案内を加え、過去証拠は保持した。

変更ファイル群: lib/assessment/runtime配下のcompleteness、候補loader、V18 PB04/05/06、V18 catalog（6件）。evals/guidance-quality-wave1配下のruntime/SSR検証、README、pilot-plan、pilot-inputs、pilot-review、verify-pilot-plan（7件）。CURRENT_FOCUS/CODEX_HANDOFF/Wave1記録へ後継案内（3件）。local commitはこのpacketを含むGit commitで特定し、最終HEAD/clean状態はTask最終報告へ記録する。

## 6. Humanが承認する実行範囲

「このcommitの固定入力 GQ05/GQ24/GQ13/GQ29-P3 × V17/V18、各1回の最大8sessionを、gpt-5.6-luna / low / Standardで比較する。評価専用のcap/予約ledgerを先にlocal実装・fake検証し、最大72 HTTP、USD $2.00、追加確認回答・HTTP retry・追加sample 0、既存Product修復は一回までとする。専用に承認した非Production評価予算のみを使い、Production/Customer/メール/購入/DB/push/deployへ触れない。停止条件に達したら再実行せず報告する。」

現時点ではこの金額・範囲の実API実行は未承認。Technical PASS ≠ 実モデル品質確認 ≠ Production Authorized。
