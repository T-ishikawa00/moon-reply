# Guidance Quality V19-L1 — V17 baseline / GQ24 only

2026-09-07。開始local `release/private-ready@6ab70e6af379078b0f67f57d9ff2b91da3cbe8b3`、clean。新しいHuman指示「V19-L1 Targeted Successor」を実装する。実API追加・Production照会/変更・push/deploy・DB・Customer・通知・外部操作は0。

## Authorityと変更対象

Human回答正本（参照原本はPrivate保全・候補には非同梱）と保存された実出力は変更しない。GQ05は引き分け/両issuesなし、GQ24は両方不可/意味のズレ、GQ13はV17の優しさ、GQ29-P3はV17の読みやすさを選好。未記載のHuman回答を補わない。

V18を改修して後継にする案、および前回分析のGQ-L2（PB04/PB05も変更する案）は、今回のHuman指示によって次バッチの方針としては置き換えられた。履歴・評価済みV18・Human評価はそのまま保存する。新候補のbaselineはV17。V18の簡潔化・optionalization・schemaSet v7は継承しない。

## GQ24のroot cause

相談は「こちらのお礼に、相手から『こちらこそありがとう！』と来ました。もう一言返してもいいですか。」。

保存PB01では受信お礼、未返信、任意の返信、soft closureは抽出済み。しかし目的はV18が`other / current_situation_explicit`、V17が`unknown / unresolved`だった。PB02はnormal_allowed、PB03はready。その後の入力判定が共通確認へ進み、PB04以降には到達していない。固定質問が距離感・好意・返信圧へ焦点を移した点が、当該相談との意味のずれを生み得る。Humanの未記載reasonをこの説明で補完しない。

現行sourceの局所再現では、V17の保存Baseの目的だけを`respond_politely / current_situation_explicit`に替えても、Input V4は`usable_action_context`の一問確認、Effective Policy V2は`waiting_preferred`のままだった。

- [Input V3](../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v3.ts)は通常の受信文脈として`reasonable`な返信義務を要求し、任意のお礼だけでは当たらない。[V4](../../lib/assessment/runtime/jpy980-input-sufficiency-policy-v4.ts)が不足を共通一問へ変換する。
- [Policy V2](../../lib/assessment/runtime/policy-v2.ts)も`reasonable`な受信、または実用理由がない場合はwaitへ進む。[Effective V2](../../lib/assessment/runtime/effective-decision-policy-v2.ts)のお礼例外にはCandidateが必要で、今回の入力には適用されない。
- したがってPB01の分類説明だけでは足りない。表示・PB05の文章・Safety拒否が直接のroot causeではない。

## Exact fix

1. [V19専用PB01](../../lib/assessment/runtime/contracts/pb-01-v19-l1-acknowledgement.developer.md)はV17文書の本文を保持し、任意のお礼応答の目的分類説明を追加。既に返ってきたお礼に短く応答する機能は`respond_politely`であり、好意・進展・実用理由・返信義務の認定ではない、と区別する。case ID・期待方向・目標回答はpromptへ渡さない。
2. [V19専用policy adapter](../../lib/assessment/runtime/v19-l1-acknowledgement-policy.ts)で、同じ限定purpose条件を入力と行動選択に使用する。InputはV4の`usable_action_context`単独の一問確認だけをreadyへ変更。行動はV2の既定`waiting_preferred`だけをprimary `reply_now / required_now`へ変更する。
3. `response_expectation=optional`とsoft closureは書き換えず、本文が「返しても自然。ここで終えてもよい」を扱える材料を保持する。`required_now`は主提案に対応する文面を提供する契約であり、相談者の返信義務を新設するものではない。単一Decisionという既存形式は維持する。
4. 独立レビューで、旧PB05の`generated_without_candidate`を一律`future-use copy`と説明する一文が、今回の`use_timing=now`と衝突することを確認した。[候補PB05](../../lib/assessment/runtime/contracts/pb-05-v19-l1-draft-timing.developer.md)だけで、この語句を`newly generated copy for the Plan-authorized use_timing (now or later)`へ置換。GQ24を正しい時点の文面として説明するために必要な最小変更で、温かさ・語彙方針・量・section・期間説明はV17のまま。旧PB05は変更しない。

対象条件は、初回評価/Candidateなし/`decide_send_or_wait`単独、現在の明示目的`respond_politely`、相手の未返信のお礼、双方optional、thanksを含みthanks/会話の区切りだけの行為、明確な終話・境界・連投・実務義務・連絡制約なし。送信件数nullは0へ書き換えず、単独で拒否理由にもしない。語調・絵文字だけの制約は許容する。他の制約や組み合わせ依頼はV17へ委ね、新しく禁止しない。

`other/unknown`、質問項目だけからの目的推定、好意確認、返事要求、初回の誘い、送信済み未返信への追送、拒否後の再勧誘、SNSだけ、既返信、明確な会話終了は、この例外の対象外。文字列「ありがとう」を判定する正規表現やcase ID分岐はない。

## なぜ他ケースへ広がらないか

| Case | 保持するもの | 検証の意味 |
| --- | --- | --- |
| GQ05 | 保存V17の追加確認。誘いには今回の受信お礼条件がない | 確認消失を成功条件にしない。Human accepted behaviorを再評価しない |
| GQ13 | 相手の境界尊重と、相談者の気遣いを受け止める文章 | 保存V17のPlan/Report/customer projectionをV19でも同一に再生する。温かい文章を新たに生成した証明ではない |
| GQ29-P3 | 自分の予定を進める、返信が来たら内容に応じて返す等、生活に落とせる3日間の方針 | 保存V17のPlan/Report/customer projectionを同一に再生。V18の抽象的な表現や任意化を移植しない |
| GQ24 | 目の前のお礼への任意の返信という相談の焦点 | 分類を固定したfakeで入口→判断→文面/回答→検証→projectionが成立することを確認する |

PB04/PB06・全schema・renderingはV17と同じhash/実装。PB05は上記一語句と候補タイトル以外、V17に完全一致。入力例外が不成立ならV17の結果を返す（候補の外側identityだけ分離）。Safety・事実/文面由来・行動矛盾の検証、既存の限定修復は変更しない。F007の検出能力やF008の回復能力を増減させる実装は含まない。

## Candidate identity / compatibility

| 項目 | V19-L1 |
| --- | --- |
| Catalog | `runtime-stage-catalog-v19.0.0` |
| Prompt bundle | `prompt-bundle-runtime-v19.0.0` |
| Schema set | `pipeline-schema-runtime-v6.0.0`（V17と同形） |
| PB01 prompt | `v5.0.0` |
| PB01 source SHA256（UTF-8/LF） | `61bcbe62214dc161879bebbb8129268bc595bb3a9d6edd95d3b58b326f34e7bd` |
| PB05 prompt / source SHA256 | `v10.0.0` / `28c0c6f851f357eea2e7152ebbd0181b630e926519295113b6ae040845ab5f49` |
| Input result identity | `m2-p4-jpy980-input-sufficiency-result-v19-l1` |
| Effective policy identity | `m2-p4-effective-decision-policy-v19-l1` |

[候補catalog](../../lib/assessment/runtime/contracts/runtime-stage-catalog-v19.json)と[明示loader](../../lib/assessment/runtime/v19-l1-stage-catalog.ts)がV17のmanifestと照合する。差分はcandidate identity/baseline/PB01 source/PB05 sourceだけ。common、他5stage、全schemaは一致必須。PB01/PB05とbundleの混在、v7との混在はexecutorで拒否する。

共有pipelineへの変更は候補identityによるdispatchとV17検証経路への接続、fake repositoryの候補/attempt2認識だけ。既存のselected-request validatorは候補の外側policy identityを受け付ける型/identity分岐のみ追加し、defect条件は不変。

Production selector・購入準備・既存Paid snapshot契約はV17固定。候補はlocal loaderを明示選択する。多世代executorや別pipelineの複製、Production budget/DBへの接続は作らない。

## 検証と残る境界

検証コマンド・根拠は[offline資産](../../evals/guidance-quality-v19-l1/README.md)に記録する。保存実出力のfake再生、編集fixture、fake PB06、実モデル出力を区別する。凍結30ケースとHuman回答・実pilot evidenceは不変。

| Local check | 結果 |
| --- | --- |
| `node evals/guidance-quality-v19-l1/verify-offline.mjs` | 57/57 assertion一致。下記の既存不整合を再現する診断1件を含み、57件の品質合格を意味しない |
| 既存Wave1 `verify-ab.mjs` / `verify-runtime.mjs` | 12/12、24/24。旧V17/V18の接続・契約回帰を維持 |
| `npm run typecheck` | PASS |
| source lint | Git tracked/non-ignored source 609ファイル、error/warning 0。既存ESLint設定が対象にするファイルを使用、設定/ignore変更なし |
| 全体`npm run lint` | 既存`.tmp/r1-resume-write-report.mjs:2:9`の未使用`readFileSync` warning 1でFAIL。今回の候補と無関係な一時ファイルは変更・削除していない |
| `npm run build` | PASS、static generation 47/47。local buildでありdeployなし |
| 独立review | core/期待値/否定例を別agentがread-only確認。PB01の明示「返信不要」の除外とPB05の使用時点を修正後、新規blockerなし |

GQ24はfixed fakeで6stageを完了し、送信文面の出所とoptional本文がprojectionまで残る。GQ05は同一確認、GQ13/P3は保存Plan/Report/DecisionCardと2種のcustomer projectionが完全一致。明確な拒否、未返信追送、再勧誘、返信不要、異なるthanks文脈は例外に入らない。候補/旧版混在は拒否し、V19の購入準備はstage呼出し0で拒否する。report-onlyとplan-and-reportの一回修復、および仮定のGQ05確認回答の再開もlocal fakeでV17の契約を維持する。Humanが実際に追加回答した記録ではない。

**既存の提供判定の限界**：別の通常返信fixtureで`generated_without_candidate`なのに`preserved_meaning=true`を注入すると、V17/V19の両方でlocal `DRAFT_SOURCE_INTEGRITY` findingと正しい修復指示が出る。しかし一回修復後も同じ不整合が残り、fake PB06が無findingならreadyへ進む。これは未検出ではなく、検出後の提供可否に残る既存の問題である。[診断trace](../../evals/guidance-quality-v19-l1/verification-results.json)に最初のfinding、directive、残存値を保存した。今回の新規回帰ではなく、F007/F008の禁止範囲を広げて修正していない。この再現をintegrity品質PASSと扱わない。

V19のPB01が実モデルで意図した分類を返すか、V17を継承する回答経路が任意性を自然に扱うかは未検証。固定fakeで通ることは、その実モデル品質やProduction適合の証明ではない。特に旧PB04の「意味のある受信には返信義務がある」という説明が、optionalなお礼にも過度に適用されないかは将来の限定比較の観察点。今回これを理由にPB04を書き換えない。

実API追加評価・Production反映は未承認。Technical PASS ≠ 実モデル品質確認 ≠ Production Authorized。

## 変更ファイル

- 候補固有source: `lib/assessment/runtime/v19-l1-runtime-identity.ts`、`v19-l1-acknowledgement-policy.ts`、`v19-l1-stage-catalog.ts`。
- 候補契約: `lib/assessment/runtime/contracts/runtime-stage-catalog-v19.json`、`pb-01-v19-l1-acknowledgement.developer.md`、`pb-05-v19-l1-draft-timing.developer.md`。
- 最小接続: `lib/assessment/runtime/pipeline.ts`、`fakes.ts`、`selected-request-product-completeness-v2.ts`。
- Local検証: `evals/guidance-quality-v19-l1/fixtures.mjs`、`verify-offline.mjs`、`verification-results.json`、`README.md`。
- 記録: 本書、`docs/CURRENT_FOCUS.md`、`docs/CODEX_HANDOFF.md`。

計16ファイル。一つのcoherentなlocal commitにまとめる。commit/最終HEADはTask最終報告を参照。既存schema、V17/V18のprompt/catalog、Production、Payment/Auth、通知、設定、DB、別worktree、global設定の変更はない。
