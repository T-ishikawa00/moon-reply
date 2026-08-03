# M2-P4-I3-R1-C1-R3-R2-E-R1 Review

## 1. Status

- Status: `offline_postmortem_completed_pending_human_chatgpt_review`
- Branch: `docs/m2-p4-i3-r1-c1-r3-r2-e-r1-postmortem`
- Baseline / E Commit B: `c10169c92364a31f6c512e714ac18bffafc9ec08`
- Exact scope: `10/10`
- Provider calls / rerun: `0 / unauthorized`
- DB / Supabase operations: `0 / 0`
- Provider quality established: `false`
- Candidate ready for isolated E2E: `false`
- E-R2 / R4 / C2 authorized: `false / false / false`

E-R1 は保存済み E 証拠だけを読む offline postmortem である。Production Runtime、Prompt、Schema、Catalog、Pipeline、Migration、Active Service は変更していない。

## 2. Frozen E execution authority

E の実行手続と実行証拠は有効である。Commit A `ae56535fd6d5587e6055e938cd68e0355cd8f037` と Commit B `c10169c92364a31f6c512e714ac18bffafc9ec08`、凍結 11 資産の blob を維持した。E は Provider calls `14/14`、PB-01 `8/8`、PB-01C `6/6` を完了し、authorization は consumed、rerun は unauthorized のままである。

## 3. Why the frozen 6/14 is not overwritten

凍結 machine verdict は `FAIL`、machine case result は `6/14` のまま変更しない。Evaluator defect、Quality Contract responsibility、Application bookkeeping、Provider / Prompt responsibility の再整理は後続の別証拠であり、過去の実行結果の改ざんではない。E-R1 の二つの view は「修正版の E スコア」ではない。

## 4. Independence / no-oracle statement

Human / ChatGPT が事前に示した件数、分類、残存 case ID は Oracle に使用していない。凍結 `evaluation.hard_failures` の 13 code を起点に、各 assertion の expected / actual、JSON Pointer、synthetic evaluator reproducer、凍結 Prompt / Schema 境界、Contextual Integrity の決定論的条件から一件ずつ分類した。case ID または failure code による結果上書きはない。件数と case list は分類 mapping から計算する。

| Responsibility | Derived count |
|---|---:|
| Evaluator implementation defect | 4 |
| Quality Contract overconstraint | 2 |
| Application bookkeeping gap | 3 |
| Provider / Prompt gap | 4 |
| Unresolved requiring Human / ChatGPT review | 0 |

## 5. Evaluator hypothesis results

### EV-H1 — confirmed

1 件だけ一致する wildcard selection は凍結 Evaluator で scalar に潰れる。`contains_all` は期待値が存在するのに `FAIL` となった。array-preserving successor は同じ synthetic data を `PASS` とする。該当する凍結 failure は `E-B01-CONSTRAINT`、`E-B02-CONSTRAINT`、`E-B05-CONSTRAINT` である。

### EV-H2 — confirmed

`E-B02-NOT-OBSERVED` の scoped assertion は `observed_facts` 上で `PASS` している。一方、runner の global scan は許可された `user_assumptions` 内の同一 literal を raw / grounded 各 1 件、合計 2 件として数え、`E-B02-LITERAL-LEAKAGE` を追加した。successor は assertion が指定した surface / path のみを評価する。

Successor self-tests は wildcard 0 / 1 / 2+、contains-all、scoped literal、raw / grounded 明示評価、不変性、expected injection 防止、case-ID override 防止の `12/12 PASS` である。凍結 Evaluator 自体は変更していない。

## 6. Quality Contract responsibility results

| Failure | Review | Evidence-based conclusion |
|---|---|---|
| `E-B01-HIERARCHY` | justified | 「職場の先輩」は bounded hierarchy を直接支持し、`unknown` は根拠を失っている。 |
| `E-B02-CADENCE` | justified | ユーザー自身が現在の遅延を通常範囲と明示しており、exact elapsed time の不明とは分離できる。 |
| `E-C01-PRACTICAL` | too_narrow | 「土曜ならいける」は情報提供、「時間おしえて」は予定調整の両解釈を持つ。Schema は複数 label を許容し、Prompt は排他的規則を定義していない。 |
| `E-C01-SAFETY-ACTIONS` | justified | 「時間おしえて」は直接の応答依頼であり、Prompt は directly supported な contact-action signal を全て出すよう要求する。 |
| `E-C03-APOLOGY` | too_narrow | 修飾のない一回の「ごめん」を `low` とする解釈は妥当で、同日返信要求の圧力は別 field で既に捕捉される。 |
| `E-C04-REGISTER` | justified | 三文中二文がです・ます調であり、全体を `casual` とする根拠は弱い。Quality Contract は `neutral_polite` を許容している。 |

Schema-valid であることだけを過剰制約の根拠にはしていない。入力意味、Prompt の責任定義、Product behavior への影響を併せて評価した。

## 7. Application bookkeeping findings

Contextual Integrity failure は全 `3/3` を分析した。いずれも `context_inferences=[]`、`used_context_inference=false` であり、duplicate inference、unsupported fact reference、forbidden inference field、inference/unresolved conflict、used flag mismatch はない。

| Case | Deterministic root cause | Count | Natural-language reinterpretation |
|---|---|---:|---|
| `E-B01` | resolved value remains in `unresolved_fields` (`practical_reason.deadline=later`, `usual_cadence_relation=not_applicable`) | 2 | 不要 |
| `E-B06` | resolved value remains in `unresolved_fields` (`response_expectation=optional`) | 1 | 不要 |
| `E-B07` | resolved value remains in `unresolved_fields` (`sender/kind/response_expectation=none`) | 3 | 不要 |

semantic value 自体は凍結入力と整合し、矛盾は canonical unresolved representation との bookkeeping だけである。この Task では Production correction を実装しない。

## 8. Provider / Prompt findings

| Case / failure | Actual | Justified expected | Impact | E-R2 candidate |
|---|---|---|---|---|
| `E-B01-HIERARCHY` | `unknown` | `user_is_junior` | 敬語・距離感の調整を弱める | 明示された先輩・後輩語と hierarchy の対応を Prompt で固定 |
| `E-B02-CADENCE` | `unknown` | `within_usual` | 通常の遅延を異常視しやすい | elapsed time と定性的 cadence relation を分離 |
| `E-C01-SAFETY-ACTIONS` | `proposes_meeting` のみ | `asks_for_reply` も必要 | Base boundary と結合する連絡行為 signal が欠落 | 情報依頼と `asks_for_reply` の発火境界を明文化 |
| `E-C04-REGISTER` | `casual` | `polite` または `neutral_polite` | 終了文の丁寧さを最終 draft が失う | 文全体の register aggregation を明文化 |

4 件とも既存 Schema に必要値があり、Schema change は不要である。Prompt correction 後の Provider retest は必要だが、現時点では unauthorized である。

## 9. Unresolved findings

責任分類上の unresolved failure code は `0`、unresolved case ID は `[]` である。ただし、下記 4 点の Product Owner decision は pending であり、E-R2 authorization を意味しない。

## 10. Provider semantic adjudication

Provider の意味分類品質だけを見る view は `pass 10 / fail 4 / unresolved 0` である。

- Fail: `E-B01`, `E-B02`, `E-C01`, `E-C04`
- Pass in this view: `E-B03`, `E-B04`, `E-B05`, `E-B06`, `E-B07`, `E-B08`, `E-C02`, `E-C03`, `E-C05`, `E-C06`

Evaluator-only、Quality-Contract-only、Application-bookkeeping-only failure は Provider へ直接帰責していない。この view も Provider quality established を `true` にしない。

## 11. Split Runtime readiness adjudication

Split Runtime readiness view は `ready 8 / blocked 6 / unresolved 0` である。

- Blocked: `E-B01`, `E-B02`, `E-B06`, `E-B07`, `E-C01`, `E-C04`
- Ready in this bounded view: `E-B03`, `E-B04`, `E-B05`, `E-B08`, `E-C02`, `E-C03`, `E-C05`, `E-C06`

Application bookkeeping または Provider / Prompt gap が残る case は blocked とした。confirmed Evaluator-only defect と confirmed Quality-Contract-only overconstraint は Runtime blocker に数えていない。これは R4 readiness または authorization ではない。

## 12. Candidate source-isolation boundary

凍結 metrics から Provider input isolation `14/14`、Base Candidate field `0`、Base optional-message source ref `0`、Candidate Base-fact field `0`、raw Candidate echo `0`、operational metadata `0`、Schema / Source Integrity PASS、Provider output immutability `14/14`、expected injection `0`、secret leakage `0` を確認した。

したがって `candidate_source_isolation_provider_boundary_confirmed=true` と独立導出する。ただし、これは意味分類品質を証明しないため `provider_quality_established=false`、`candidate_ready_for_isolated_e2e=false` のままである。

## 13. Product Owner Decision Required Before E-R2

### PO-E-C01-PRACTICAL

- ケース: `E-C01`
- 元入力の短い引用: 「土曜ならいけるで！ また時間おしえて」
- Luna の実際の分類: `provide_information`
- 現在の Quality Contract 期待値: `confirm_schedule` を必須
- 選択肢A: `provide_information` を妥当とし、`confirm_schedule` は任意の追加 label とする。
- 選択肢B: 時間提示の依頼があるため `confirm_schedule` を必須とし、必要なら両方を付ける。
- 返信案・鑑定文への影響: practical intent の維持判定と不要な修正量が変わる。
- ChatGPT 推奨: 選択肢A。複数 label は許容するが、単一の正解を強制しない。
- Product Owner の回答欄: `pending`

### PO-E-C01-SAFETY-ACTIONS

- ケース: `E-C01`
- 元入力の短い引用: 「また時間おしえて」
- Luna の実際の分類: `proposes_meeting` のみ
- 現在の Quality Contract 期待値: `asks_for_reply` と `proposes_meeting`
- 選択肢A: 通常の情報依頼も `asks_for_reply` として記録し、`reply_demand` と分離する。
- 選択肢B: `asks_for_reply` は返答そのものを明示要求する表現だけに限定する。
- 返信案・鑑定文への影響: Base の連絡禁止境界と結合した時の contact-action Safety 判定が変わる。
- ChatGPT 推奨: 選択肢A。descriptive signal と最終 Safety disposition は別である。
- Product Owner の回答欄: `pending`

### PO-E-C03-APOLOGY

- ケース: `E-C03`
- 元入力の短い引用: 「ごめん、何か嫌だった？」
- Luna の実際の分類: `low`
- 現在の Quality Contract 期待値: `medium` または `high`
- 選択肢A: 修飾のない一回の「ごめん」は `low` とし、返信圧力は別 field で評価する。
- 選択肢B: 関係不安を伴う冒頭謝罪は `medium` とする。
- 返信案・鑑定文への影響: Candidate の感情温度と修正強度が変わる。
- ChatGPT 推奨: 選択肢A。apology strength と response pressure を混同しない。
- Product Owner の回答欄: `pending`

### PO-E-C04-REGISTER

- ケース: `E-C04`
- 元入力の短い引用: 「今までありがとう。これで連絡は終わりにします。」
- Luna の実際の分類: `casual`
- 現在の Quality Contract 期待値: `polite` または `neutral_polite`
- 選択肢A: 主要な述語終止がです・ます調なら `neutral_polite` とする。
- 選択肢B: 常体語句とです・ます調が混在すれば `mixed` とする。
- 返信案・鑑定文への影響: 終了文の距離感と丁寧さの維持基準が変わる。
- ChatGPT 推奨: 選択肢A。`casual` は不採用とし、dominant ending を優先する。
- Product Owner の回答欄: `pending`

4 項目が解決するまで E-R2 implementation は `authorized=false` である。

## 14. Validation

- Adjudicator write / deterministic `--check`: PASS
- Dedicated postmortem verifier: PASS
- Evaluator successor self-tests: `12/12 PASS`
- Frozen failure classification: `13/13`, duplicate `0`
- Frozen E assets: `11/11` unchanged
- Decision Policy: `40/40 PASS`
- Typecheck / lint warnings / build: PASS / `0` / PASS
- `git diff --check`: PASS

## 15. Acceptance boundary

自動検証 PASS は Human / ChatGPT review、Product Owner decision、E-R2 acceptance、Provider retest、Runtime readiness、R4、C2、main integration、release を意味しない。Provider quality は未確立であり、frozen E verdict は `FAIL / 6 of 14` のままである。Migration は unapplied、Active Service / Active Runtime / main は不変である。

## 16. Next candidate unauthorized

次候補は `M2-P4-I3-R1-C1-R3-R2-E-R2 Semantic Responsibility Revision` だが、Product Owner decision が未解決のため unauthorized である。Provider rerun、R4、C2、PR、main merge、force push も unauthorized のままである。
