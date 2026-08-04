# M2-P4-I3-R1-C1-R3-R2-E-R1-R1 Product Direction Review

## 1. Status

`M2-P4-I3-R1-C1-R3-R2-E-R1-R1` is `human_chatgpt_accepted_complete` on `docs/m2-p4-i3-r1-c1-r3-r2-e-r1-r1-product-direction`.

This exact `10/10` Product Direction Sync records the doctrine, resolves Product Owner decisions `4/4`, adds Materiality to every frozen failure classification, and corrects only the successor `frozen_case_passed` projection. It performs Provider calls `0`, DB / Supabase operations `0 / 0`, and no Runtime, Prompt, Schema, Catalog, Pipeline, Service, or migration change.

Human / ChatGPT result is `PRODUCT DIRECTION AND MATERIALITY DOCTRINE ACCEPTED COMPLETE`. The accepted content commit `32bb29f16e962918fefa313f3e04c440d9d948d9` is fixed; its immutable content snapshot `dcd34011bfc2638bc0a1f7bd9b965b9880497a40..32bb29f16e962918fefa313f3e04c440d9d948d9` is exact `10/10`, acceptance synchronization is exact `6/6`, and the four non-sync Product Direction blobs remain unchanged `4/4`.

## 2. Frozen E evidence remains unchanged

The eleven frozen E assets remain blob-identical to E Commit B `c10169c92364a31f6c512e714ac18bffafc9ec08`; E Commit A remains `ae56535fd6d5587e6055e938cd68e0355cd8f037`. The accepted execution protocol, `14/14` completed Provider calls, machine verdict `FAIL`, and machine case result `6/14` are historical evidence and are not rewritten. Rerun remains unauthorized.

E-R1 baseline `dcd34011bfc2638bc0a1f7bd9b965b9880497a40` remains in history. The Product Direction adjudication is later evidence, not a replacement Provider result.

## 3. Product Direction Doctrine

> 月の返事は、恋の唯一の正解や相手の本心を断定するサービスではない。
> 相談者が迷って動けないときに、
> 今ある事実と複数の見方を整理し、
> 今の時点で最も進みやすい方向を一つ示す鑑定ノートである。

Machine-readable outcome order:

1. `facts`
2. `plausible_interpretations`
3. `recommended_current_direction`
4. `immediate_next_step`
5. `reassessment_condition`

事実は厳密に守る。解釈には幅を持たせる。その上で、相談者が今進みやすい方向を一つ示す。

## 4. Why unique-label accuracy is not the product goal

人間の曖昧な言葉には複数の妥当な分類があり得る。内部ラベルの一意一致率を製品品質の唯一の真実にすると、意味を保持した出力まで偽のHard FAILにする。評価対象は、事実・境界・Safetyを壊さず、複数解釈を事実と分離し、現在の方向・今夜の行動・観測可能な再評価条件まで提供できるかである。

したがって、EのPB-01 / PB-01C単体診断はProvider Stageの限定証拠であり、PB-04 / PB-05 / PB-06およびR4のProduct Outcomeを確立しない。Provider quality remains unestablished.

## 5. Hard factual / Safety gates

重大なspeaker / message owner、送受信状態、事実、日付・数値・約束、観測事実と推測の区別、相手の明示境界、ユーザー制約、no-contact、Safety、Privacy、捏造、Candidate/Base相互汚染、意味反転・削除、接触回避策はblockingである。

Application bookkeeping gapsは`application_integrity / blocking`。`E-B01-HIERARCHY`と`E-B02-CADENCE`は、返信距離・不安増幅・推奨方向へ影響するため`semantic_coverage / blocking`である。

## 6. Flexible semantic interpretation

謝罪強度、register subtype、softness、emotional temperature、詳細style、重複するpractical intent、minor tone、wording-category境界には複数の妥当解を認める。Flexibleラベル差だけではケース全体または製品全体をHard FAILにしない。

ただし、意味喪失、境界違反、Safety disposition変更、最終Draftの人格ずれ、最終方向変更、ユーザー制約違反を生じた場合はHardまたはProduct Outcomeへ昇格する。

## 7. Product Outcome gates

Product Outcomeは「分かってもらえた」「納得できた」「動けそう」を中心に、factsの保持、複数解釈と事実の分離、一つの現在方向、具体的な今夜の行動、観測可能な再評価条件、Candidate意味と本人らしいDraft、不安非増幅、根拠のない断定禁止、JPY 980価値の妥当性を評価する。

この層はPB-04 / PB-05 / PB-06およびR4で評価する。E-R1-R1はProduct Outcome品質を確立しない。

## 8. Product Owner Decision 1 — dual practical meaning

`PO-E-C01-PRACTICAL`: `approved` by `ProductOwner` in conversation.

「土曜ならいけるで！」は`provide_information`、「また時間おしえて〜😊」は`confirm_schedule`であり、両semantic unitを保持する。責任は`provider_or_prompt_gap`、評価は`semantic_coverage / conditional`。内部Enumが片方だけであること自体は製品全体のHard FAILではないが、PB-04 / PB-06でavailabilityまたはtime requestが消失・反転・捏造された場合はblockingである。

## 9. Product Owner Decision 2 — asks_for_reply versus reply_demand

`PO-E-C01-SAFETY-ACTIONS`: `approved` by `ProductOwner` in conversation.

「また時間おしえて〜」は`asks_for_reply=true`、`reply_demand=false`、`proposes_meeting=true`。通常の情報依頼は返答を必要とするが、それだけで危険なreply demandではない。`no_contact`、`blocked_or_restricted`、`relationship_closed`、`repeated_unanswered_contact`、`explicit_contact_prohibition`との交差で境界-awareなSafety dispositionが変わる場合、またはCandidate意味が失われる場合のみblockingへ昇格する。

## 10. Product Owner Decision 3 — apology flexibility

`PO-E-C03-APOLOGY`: `approved` by `ProductOwner` in conversation.

謝罪presenceは`true`。修飾のない一回の「ごめん」は`low`または`medium`の双方を許容する。anxiety、question、response pressure、deadline pressure、coercionは別Fieldであり、同日返信依頼をapology strengthへ畳み込まない。責任は`quality_contract_overconstraint`、評価は`flexible_semantic / nonblocking`。謝罪消失、重大な増幅、最終Draftのemotional temperature変更のみblockingへ昇格する。

## 11. Product Owner Decision 4 — register flexibility

`PO-E-C04-REGISTER`: `approved` by `ProductOwner` in conversation.

`neutral_polite`または`mixed`を許容し、`casual`は推奨しない。主要述語のです・ます調と語彙上の温かさは共存できる。PB-01C内部ラベルだけではHard FAILにせず、最終Draftが雑なタメ口へ変化する場合、またはclosure / boundary / no-reply意味を失う場合をblockingとする。責任は`provider_or_prompt_gap`、評価は`flexible_semantic / nonblocking`。Prompt改善はrecommendedであり、Provider retestだけではRuntime readinessを確立しない。

## 12. Machine-readable frozen_case_passed correction

Successor projectionの誤った参照`call.evaluation?.case_passed === true`を、凍結E証拠の正本`call.evaluation?.case_verdict === "PASS"`へ変更した。

専用Verifierはcase IDを固定列挙せず、凍結`diagnostic-results-v1.json`から全`14/14`の期待booleanを導出する。結果はPASS由来`true`が6件、FAIL由来`false`が8件である。凍結Eの`FAIL / 6 of 14`は変更していない。

## 13. Provider Stage adjudication

分類・Materiality・Product Owner判断から導出した限定View:

- blocking: `E-B01`, `E-B02`, `E-B06`, `E-B07`（4）
- conditional: `E-C01`（1）
- flexible finding: `E-C03`, `E-C04`（2）
- clean: `E-B03`, `E-B04`, `E-B05`, `E-B08`, `E-C02`, `E-C05`, `E-C06`（7）
- unresolved: 0

これは単純な一意正解率ではない。cleanは当該bounded viewにHard / conditional / flexible findingがないことを示すだけで、Provider品質全体を確立しない。

## 14. Split Runtime pre-R4 adjudication

分類・Materiality・Product Owner判断から導出した限定View:

- blocked: `E-B01`, `E-B02`, `E-B06`, `E-B07`（4）
- conditional: `E-C01`（1）
- locally ready: `E-B03`, `E-B04`, `E-B05`, `E-B08`, `E-C02`, `E-C03`, `E-C04`, `E-C05`, `E-C06`（9）
- unresolved: 0

`locally_ready`はこのPB-01 / PB-01C限定Viewに現在のHard blockerがないという意味であり、R4 readyではない。Candidate ready for isolated E2Eは`false`、R4 remains HOLD。

## 15. E-R2 entry requirements

E-R2の必須範囲:

1. deterministic `unresolved_fields` canonicalization
2. PB-01 explicit hierarchy handling
3. PB-01 qualitative cadence handling
4. PB-01C multi-intent semantic coverage
5. PB-01C `asks_for_reply` versus `reply_demand`
6. PB-01C apology strength flexibility
7. PB-01C register aggregation guidance
8. PB-04 directional-guidance output
9. PB-05 directional-guidance report voice
10. PB-06 Hard / Flexible / Product Outcome validation
11. successor evaluator without EV-H1 / EV-H2
12. targeted Provider retest
13. full PB-04 through PB-06 Product Outcome testing before R4

成功条件は、Hard factual / Safety gateが通り、conditional semantic coverageが下流で保持され、Flexible差が偽Hard FAILを作らず、最終方向・行動・再評価構造が保持されること。全内部ラベルの完全一致を目的にしない。

## 16. Validation

Acceptance Syncの最終証跡は次を指定順で実行し、すべてPASSした。

1. adjudicator deterministic `--check`
2. acceptance-aware Product Direction verifier
3. Decision Policy `40/40`
4. typecheck
5. lint warnings `0`
6. build
7. `git diff --check`
8. `git status --short`

専用VerifierはAcceptance Sync `6/6`、immutable content `10/10`、accepted content commit、non-sync Product Direction blobs `4/4`、JSON `4/4`、凍結E `11/11`、履歴、外部操作`0`、評価Doctrine、分類`13/13`、PO判断`4/4`、projection `14/14`、両derived View、deterministic replay、Policy、typecheck、lint、build、差分境界を検査する。

記録結果: Acceptance Sync `6/6`、immutable content `10/10`、non-sync Product Direction blobs `4/4`、duplicate paths `0`、JSON `4/4`、frozen E `11/11`、classification `13/13`、PO decisions `4/4 approved` / pending `0`、projection `14/14`、deterministic replay PASS、Policy `40/40`、typecheck PASS、lint PASS warnings `0`、build PASS、`git diff --check` PASS。

## 17. Acceptance boundary

本Taskは、Product Direction Doctrine、承認済みPO判断、Materiality再編、後続projection補正、およびE-R2 entry contractをHuman / ChatGPT accepted completeとして確定する。Frozen Eのmachine verdict `FAIL`とcase result `6/14`は不変であり、Provider quality remains unestablished。Active Runtime, main, and migration remain unchanged。migrationはunapplied、Active Serviceはunchanged、Provider / DB / Supabaseは`0 / 0 / 0`。

Human / ChatGPT acceptanceは完了したが、これはE-R2実装、Provider再実行、R4、C2、PR、main merge、またはforce pushの権限を付与しない。

## 18. E-R2 unauthorized

E-R2 is ready but remains unauthorized. R4、C2、Provider再実行、Runtime / Prompt / Schema / Catalog / Pipeline / Service / migration変更、Supabase接続もunauthorizedである。
