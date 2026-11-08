# Guidance Quality R1 — 局所調査・改善候補・実行記録

2026-09-07 / LOCAL ONLY。調査対象source：release/private-ready@7db33b03f0348424bb426c8afb6d01ea4e472297。file:lineはこのbaselineに対する参照。新Product方針は [正本](GUIDANCE_QUALITY_R1.md)。

## 1. 状態と証拠の区別

開始時local確認：指定checkout・branch・HEAD一致、作業ツリーclean、stash空。別worktreeの存在はGit一覧で確認しただけで、C:\tmp\mrexp-e98、C:\tmp\mrexp-ea4へ移動・ファイル読取・変更はしていない。remote/tracking refsはlocal記録であり現在のremote実測ではない。

Humanから今回共有されたR1状態：

- Remediation Release R1はProduction反映・販売再開済み。
- 直前共有のProduction / remote / local SHA：7db33b03f0348424bb426c8afb6d01ea4e472297。migrationsは0032まで。R1 Production Technical PASS。
- Human Acceptance：「問題なし」。確認された画面は本番トップ、依頼画面、Googleログイン、Account。
- 修正版での新規実購入→鑑定生成→実メール受信は未実施。購入後生成・回答品質・実メール到達までのHuman Acceptanceへ拡張しない。

これは今回のHuman報告を日付付きで記録したもの。Production再監査・外部接続はしていないため、本Taskによる現在のProduction／remote／DB実測はUNKNOWN。過去のCURRENT_FOCUS等の「Current」見出しも現在実測とは扱わない。

## 2. 経路と原因の分離

Productionの入口は [application-runtime.ts](../../lib/assessment/production/application-runtime.ts):14–23,44–48 のV17 catalog。汎用runtime/serviceの別catalogと混同しない。

| 経路 | 実装・主責任 | 役割 |
| --- | --- | --- |
| 入力前段 | production/application.ts:389、provider-free-intake.ts:196 → jpy980-product-scope-validation-v1.ts | 対象目的・必要な文面の確認 |
| 構造化とSafety | PB01・grounding V3、prepayment-safety-rules-v1.ts | 発話者・事実・境界の出所、通常／境界支援／Safety |
| 入力成立 | pipeline.ts:1267–1275 → jpy980-input-sufficiency-policy-v4.ts → V3 | 普通の不明点吸収、一問／terminal |
| 方向選択 | effective-decision-policy-v2.ts → V1 → contextual policy V3 → policy-v2.ts | application-ownedの許容Decisionを決定 |
| Plan生成 | PB04 V17、decision-plan-v2.schema.json、pipeline.ts:535–574 | 決定の説明、文面、行動・見直し |
| 本文生成 | PB05 V17、report-content-v2.schema.json | Planと事実から本文を作る。最終draftの所有権はPB04 |
| 品質と局所検査 | PB06 V17 → semantic-disposition-v7.ts、semantic shape／draft source／customer surface／selected request | 意味、出典、依頼充足と構造の検査 |
| 一回再評価・提供 | pipeline.ts:1598–1634,1673–1705、quality-reassessment-v2.ts | 同じPolicyで最大attempt2、残留欠陥分類、完全Reportの組立 |
| 表示 | customer-assessment-projection-v1.ts、CustomerAssessmentNote.tsx、experience-projection-v2.ts | optional draft・詳細planの条件表示、opening/closing等の構造制約 |

## 3. 新方針との差分・発生し得る箇所

証拠の強さ：S＝現行sourceの条件／経路を直接確認。H＝過去の実モデルによる架空相談記録。I＝その条件に該当する入力で生じ得るとの推論。Sは本番での頻度を証明しない。本Taskの30ケースは実モデルNOT_RUN、現在の停止率・待つ偏重発生率はUNKNOWN。

| ID / 論点 | 原因層とfile:line | 仕組み・具体例 | 評価と証拠 |
| --- | --- | --- | --- |
| GQR-01 / A | deterministic：[sufficiency V3](../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts):291–323、[V4](../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts):148–188 | decide系では明示境界・連投・相手への返信義務・期限か、少なくとも自分の連絡が未返信という形を求める。初回のお礼／誘いがどれにも入らないとusable_action_context不足→一問→未解決ならterminalになり得る | S＋I。PB01抽出と選択目的次第。短い相談全般を止めるという結論ではない |
| GQR-02 / A | deterministic scope：[scope V1](../../lib/assessment/runtime/jpy980-product-scope-validation-v1.ts):89–99 | message_impact選択で原文なしなら、他の目的に答えられても全体needs_clarification。お礼判断＋対象文の印象の複合相談 | S。原文の印象を確認する一問自体は妥当。部分成立の保持が未設計 |
| GQR-03 / B | prompt：[PB04](../../lib/assessment/runtime/contracts/pb-04-v17-product-recovery-v1.developer.md):62–66 | take/avoid各2〜4、aftercare三段階、change_conditions1〜4。単純なお礼にも量を要求 | S。schemaはaftercare最小数を要求せず、主因はprompt。現行実発生率UNKNOWN |
| GQR-04 / B | schema＋deterministic：[Plan schema](../../lib/assessment/runtime/contracts/decision-plan-v2.schema.json):105–139,304,571–586、[pipeline](../../lib/assessment/runtime/pipeline.ts):550–574 | send/replyは一案必須。各take/avoid min1、review timing非空。文面不要の送信判断や文面編集にも形式の負担が残る | S。schema変更なしにsendのdraft省略はできない |
| GQR-05 / B | completeness＋prompt：[selected request V2](../../lib/assessment/runtime/selected-request-product-completeness-v2.ts):128–155、PB04:13 | draft_message明示選択＋later_onlyなら、今は控える回答でも将来文面と文脈を要求 | S。境界でnot_allowedならこの要求は適用しない。draft未選択のwaitへ一律必須ではない |
| GQR-06 / C,D | deterministic：[policy-v2](../../lib/assessment/runtime/policy-v2.ts):299–305,338–370 | reasonableの受信応答、activeな実用理由以外はallowed decisionをwait一つに固定。optionalな挨拶返信等は他の理由がなければwaitになり得る | S＋I。本心不明という直接条件は見つからない。実際のPB01分類・偏りは未確認 |
| GQR-07 / B,D | prompt：PB04:13,43–54、[draft source V2](../../lib/assessment/runtime/draft-source-integrity-v2.ts):53–57 | 無候補・draft未選択を:13ではpolicyがnull許可時に限定、:54では無条件null。send/reply必須draftと衝突し得る | S＋I。validator側はrequired_now例外を既に持つ。promptの条件一致候補 |
| GQR-08 / F | prompt / classifier：[PB06](../../lib/assessment/runtime/contracts/pb-06-v17-product-quality-v1.developer.md):72–78 | 事実・行動が成立しても独立した情緒的受け止めが足りないとmajor REQUIRED_SECTION。短い実用回答の再生成要因になり得る | S。現行R2ではこれ単独ならattempt2後に提供可。必ず最終停止とは言わない |
| GQR-09 / F | reassessment：[quality V2](../../lib/assessment/runtime/quality-reassessment-v2.ts):237–242 → [V1](../../lib/assessment/runtime/quality-reassessment-v1.ts):451–465、pipeline:1611–1613 | PB06 blocking findingが12件超なら重複除去前にdirective生成失敗。13件の軽微な重複でも、blocking扱いなら修復に到達せず全体失敗の可能性 | S＋I。実発生未確認。未知path／壊れた検査証拠による失敗とは分ける |
| GQR-10 / F・F007 | quality classifier：[quality V2](../../lib/assessment/runtime/quality-reassessment-v2.ts):117–182、[回帰](../../scripts/verify-paid-quality-delivery-guarantee-r1.mjs):247–263 | 現行R2はSafety等を停止する一方、major FACT_FIDELITY、ASSUMPTION_AS_FACT、UNSUPPORTED_CERTAINTY、DRAFT_SOURCE_INTEGRITYは単独で提供不可にならない。正常なpath等を持つ残留findingなら提供可の組合せがある | S。過剰停止とは逆のリスク。具体的な捏造・意味／由来破壊なら新方針の保護対象。発生率UNKNOWN |
| GQR-11 / G・F008 | reassessment / final delivery：[pipeline](../../lib/assessment/runtime/pipeline.ts):1673–1705 | 初回の軽いfindingで再評価し、改善版がJSON不正や技術障害になった場合、初回の完全な候補を採用する経路がない | S＋I。全検査正常の初回なら再評価しない。以前の候補が採用適格かは別判定。Recovery未実装 |

## 4. 問題がない部分・既存改善

- [sufficiency V4](../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts):21–28,129–145は返信時刻・頻度、懸念、意図、文体等の六つの普通の不明点を回答へ吸収する。既存V4を別名で作り直さない。
- [primary product](../../lib/assessment/runtime/jpy980-primary-product-function-v1.ts):6–16は関係整理・感情整理を主目的として認める。GQ-18の支援に整合。
- [grounding V3](../../lib/assessment/runtime/base-structured-intake-grounding-v3.ts):47–106は明示境界のsourceを守り、V2の既存canonicalizationを継承。不明な本心を拒否と扱う必要はない。
- [prepayment safety](../../lib/purchase/prepayment-safety-rules-v1.ts):1046–1064はtemporary pauseとboundary supportを、危険な接触支援と区別。境界の相談全体をSafety不適格と混同しない。
- policy-v2:84–91,353–359はthank_you／initial_apology／single_invitationを既に送信理由と認める。[effective policy V2](../../lib/assessment/runtime/effective-decision-policy-v2.ts):90–128,149–163には当日・低圧お礼の補完もある。お礼や初回の誘いが全禁止という監査結論は誤り。
- effective policy V2:65–87,140–148は普段の返信範囲内・期限のない予定調整をwaitに補正し、同日／翌日期限を例外にする。予定確認と催促の区別は既に一部存在する。
- PB04:48は文面一案のみ。Plan schema:33–38は解釈0件も許容し、:69–81はaftercare/change_conditionsの空配列も許容。複数案・固定3日をschema必須とは報告しない。
- PB06:50–52,58,84,88は軽い表現・label差を実質的な意味／行動破壊と区別し、短さや暖かさだけでfailにしない。既存materiality指示を維持する。
- E：pipeline:1356–1372,1405–1420,1688–1694は再評価でも同じdecisionPolicyを使い、:535–541で別Decisionを拒否。report-onlyはPlanを再生成しない。再評価だけで有効なsendがwaitへ変わり正常納品される経路は確認していない。ただし本文内の行動矛盾は別の品質評価対象。
- [customer projection](../../lib/assessment/runtime/customer-assessment-projection-v1.ts):137–154、[note](../../components/runtime/CustomerAssessmentNote.tsx):144–153,255–268は詳細aftercare／draftを条件表示する。rendererの一律section強制と推定しない。opening/closing各min1は[Report schema](../../lib/assessment/runtime/contracts/report-content-v2.schema.json):38,121とexperience-projection-v2:216,221に残る。

## 5. 過去の実出力が示す範囲

[2026-08-19 V17 Case7 summary（公開準備候補では詳細記録を非同梱）](../service-record/EVALUATION_EVIDENCE_SUMMARY.md):3–14は、fcd54a0c…、実モデルgpt-5.6-luna、HTTP9回、再評価exhausted、Human review pending。同directoryのauthorization-record-v1.json:5,11,19でsnapshot/model/synthetic_onlyを確認。

同directoryのv17-stage-attempt-results-v1.json:653–661では、予約期限の翌日12時までしか示されず、選択されたnext_three_daysの見通しが不足と初回PB06が判定。改善版は:934–942で将来条件の「連絡する方向へ見直す」が追加催促とも読めると判定した。初回・改善版ともsend_now。

これは「項目充足要求と再評価が回答を失わせ得た」過去の一例（H）。next_three_days自体は相談者が選択しているので、初回findingが必ず不当だったとは断定しない。初回候補は当時PASS認定済みではなく、F008で採用できる正常候補の証明にもならない。

当時から現行HEADまでPB04/05/06 promptのGit差分は0。一方、sufficiency V4、pipeline、quality classifierは後続変更があるため、当時のexhaustedを現行停止結果として再利用しない。限定確認された過去の架空実行記録でsend→wait変化は見つからなかったが、一般的な不在証明にも本番率の推定にもならない。

[旧canonical cases](../../evals/quality/m2-p4-i3-r1-canonical-suite-v2.json) INC-04/05/06/08、OWN-02、既存Primary Product・PB01・paid qualityの検証資産は [評価対応表](../../evals/guidance-quality-r1/evaluation-plan.md) に再利用先を記載。過去の判断改善を重複実装しない。古い「soft3種類だけ提供可」という記録は現行R2と異なり、今回の現在事実には採用しない。

## 6. 維持・削除・緩和・修復へ変更する条件候補

すべて実装提案。今回のruntime変更は0。F007/F008は[Wave1](../remediation/REMEDIATION_WAVE_1_2026-09-06.md):157–158でHuman decision待ちだった事項で、過去Acceptance違反とは断定しない。

| 処置候補 | 現行条件が守るもの | 新方針に沿う扱い・具体例 |
| --- | --- | --- |
| 維持 | 事実、source、Safety、接触境界、Policy整合、技術的完全性 | 「土曜は無理」を逆転させる文面、拒否回避、曖昧なProvider結果はそのまま提供しない |
| 維持 | 原文を要する編集の忠実性 | GQ-17の対象文面だけ一問。一般的なプロフィール質問を足さない |
| 維持 | V4 soft uncertainty、Primary Product、自然な実用理由 | 普通の不明点吸収と自然なお礼／返信の既修正を再利用 |
| 削除候補 | PB04の固定数で実用価値を確保 | take/avoid2件以上、全相談のaftercare三段階というprompt要求を除き、schemaの既存min/max内で必要量へ |
| 緩和候補 | usable action contextで無内容な鑑定を防ぐ | 初回のお礼／誘いでも観測事実＋目的が成立すれば不足扱いしない。単なる文字数による通過にはしない |
| 緩和候補 | 意味のある返信を選ぶ | optionalな挨拶返信を自然な返信候補にできるか検討。明示境界・連投・催促との区別を残す |
| 緩和候補 | send/replyに使える行動を保証 | 目的と次の一歩が明確な送信判断には将来draft任意化を検討。現行schema/validatorのversioned後継設計が必要 |
| 緩和候補 | draft明示依頼を未回答にしない | 今は控えるのが主提案で文面が有用でないなら、理由を返せば足りる場合を分ける。黙って依頼を消さない |
| 修復へ変更する候補 | 情緒的支援・読みやすさ・section充足 | 方向と理由が成立した短い回答の軽い硬さやclosing不足は改善対象。相談全体の不成立へ変換しない |
| 修復へ変更する候補 | boundedな検査指示の扱い | 同内容findingの重複は、証拠を保持した上で正規化して修復可能にする案。未知pathや証拠破壊は単なる表現扱いにしない |
| 修復後の再確認を必須とする候補 | 現行R2の提供継続と過剰停止回避 | 捏造・意味／由来破壊はseverityがmajorでも未修復のまま提供しない。軽い文体と同じcodeを持つ場合は具体的な影響で分離 |
| 候補保存・採用契約を先に設計 | F008の正常回答喪失防止と誤採用防止 | 完全な同一入力の候補＋検査証拠の組のみ検討。最新だから採用、以前だから正常、stage片で代替はいずれも不可 |

## 7. 次の最小local実装バッチ一つ

**GQ-L1：PB04の出力量を相談に合わせる、非稼働の互換候補と検証harness。**

scopeは [候補prompt B](../../evals/guidance-quality-r1/candidate-prompts.md) の固定数削減とnull条件の整合だけ。変更対象案は新規evals/guidance-quality-r1/pb04-compatible-v1/配下のcandidate契約、限定Plan/Report fixture、local実行harness。現在のruntimeファイル、読み込むcatalog、Provider/model、Safety/classifier、Payment/Auth/通知、R1、既存snapshot/hash/versionには変更しない。

互換性：decision-plan-v2とreport-content-v2をそのまま検証に用い、allowed_decisions、send/replyのrequired_now一案、take/avoid min1、review_timing、opening/closingを維持。aftercare0〜3、不要解釈0は既存schema範囲。next_three_days明示依頼の充足は変更しない。実schema適合だけでなく、既存local validatorsとprojectionで通るかを確認し、失敗した既存検査を黙って緩めない。

tests（Providerなし）：自然なお礼・質問への返信・期限付き予定確認・文面未依頼の通常待機・明示境界・next_three_days明示依頼の6系統。各組で短くしても方向、理由、文面の意味／出所、条件表示を保持するか確認。sendのdraft=null、反転引用、境界違反をnegative controlとし、意図しない許容を検出する。最小形が既存validatorに拒否された場合は原因層を記録し、このバッチ外へ広げない。

残る判断事項：最低1件のavoidとopening/closingまで任意化するschema後継、部分成立の表示、入力Gateと待つdefault、F007/F008。これらをGQ-L1に混ぜない。GQ-L1のfake/static PASSは実文章品質の証明ではなく、実モデル比較は必要なら別途上限付きで行う。

## 8. 今回の検証・commit記録

このTaskで作成したのはProduct正本、局所調査、30件の架空ケース、評価基準、候補prompt、6件の編集上の目標例、限定local検査、Product/current-state文書への参照だけ。実モデル比較計画は [evaluation-plan](../../evals/guidance-quality-r1/evaluation-plan.md) に対象12件、最大24セッション／288 HTTP試行と費用見積方法を記載。今回のAPI実行は0。

local検証結果：

| 検証 | 結果と限界 |
| --- | --- |
| node evals/guidance-quality-r1/verify-assets.mjs | PASS。30件、聞き方3ペア、事実差7ペア、localリンク、変更許可10ファイル、runtime参照0。意味品質は人による期待値レビューのみ |
| npm.cmd run verify:paid-quality-delivery-guarantee-r1 | 4/4 PASS。現行R2のfake/static回帰。F007の新Product境界への適合を証明しない |
| npm.cmd run verify:final-primary-product-function-r1 | 11/11 PASS。Provider/DB/Stripe 0。関係整理・感情整理の既存動作を維持 |
| 追加verify-assets.mjsのESLint | PASS、warning 0。既存runtimeを変更せず追加した検査scriptのみ |
| 変更scope / git diff --check | 許可したdocs/evalsだけ。runtime・既存契約・R1防御の差分0、空白エラー0 |

実モデルのケース評価はNOT_RUN。全体buildや外部監査は、このdocs/evals限定変更では実行していない。commit SHAは最終報告に記載し、このファイル自身へ循環するhashを作らない。外部操作・push/deploy・remote apply・Provider評価・DB操作は0。現在の回答品質／待つ偏重発生率はUNKNOWN。

変更ファイルは次の10件だけ：

- [PRODUCT_SPEC](../PRODUCT_SPEC.md)
- [CURRENT_FOCUS](../CURRENT_FOCUS.md)
- [CODEX_HANDOFF](../CODEX_HANDOFF.md)
- [Product正本](GUIDANCE_QUALITY_R1.md)
- [本局所調査報告](GUIDANCE_QUALITY_R1_SOURCE_REVIEW.md)
- [cases.json](../../evals/guidance-quality-r1/cases.json)
- [evaluation-plan.md](../../evals/guidance-quality-r1/evaluation-plan.md)
- [candidate-prompts.md](../../evals/guidance-quality-r1/candidate-prompts.md)
- [editorial-examples.md](../../evals/guidance-quality-r1/editorial-examples.md)
- [verify-assets.mjs](../../evals/guidance-quality-r1/verify-assets.mjs)
