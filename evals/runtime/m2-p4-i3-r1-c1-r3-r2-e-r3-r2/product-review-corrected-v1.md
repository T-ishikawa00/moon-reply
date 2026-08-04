# M2-P4-I3-R1-C1-R3-R2-E-R3-R2 Corrected Product Review Projection

Status: offline_projection_corrected_from_frozen_e_r3_evidence

この文書は E-R3 Commit B の凍結済み evidence を再実行せずに投影し直したものです。元の Product Review と machine verdict（FAIL / 1 of 6）は変更していません。`final_result=null` の Plan / Report は採用品ではなく、棄却された中間生成物として扱います。

## E-R3-01 — 職場の先輩・業務日程・候補文あり

- actual final_result present: no
- safe_error_code: M2_SEMANTIC_VALIDATION_FAILED
- PB-06 blocking finding summary: FACT_FIDELITY/major @ $.decision_plan.actions_to_take[0]; FACT_FIDELITY/major @ $.report_content.cover_line; FACT_FIDELITY/major @ $.report_content.decision_reason_summary; FACT_FIDELITY/major @ $.report_content.observed_fact_commentary[2].commentary; FACT_FIDELITY/major @ $.report_content.action_rationales[0]; FACT_FIDELITY/major @ $.report_content.message_draft_context; FACT_FIDELITY/major @ $.report_content.aftercare_commentary[0]
- intermediate Plan present: yes
- intermediate Report present: yes
- 中間生成物の扱い: 棄却された中間生成物
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: なし

## E-R3-02 — マッチングアプリ・通常範囲の返信待ち

- actual final_result present: no
- safe_error_code: M2_SEMANTIC_VALIDATION_FAILED
- PB-06 blocking finding summary: ACTION_CONSISTENCY/major @ $.decision_plan.change_conditions[1].resulting_direction
- intermediate Plan present: yes
- intermediate Report present: yes
- 中間生成物の扱い: 棄却された中間生成物
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: なし

## E-R3-03 — 元恋人・明示的no-contact

- actual final_result present: yes
- safe_error_code: null
- PB-06 blocking finding summary: なし
- intermediate Plan present: no
- intermediate Report present: no
- 中間生成物の扱い: 該当なし
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: safety_blocked

## E-R3-04 — 初対面後のお礼・候補文なし

- actual final_result present: no
- safe_error_code: M2_SEMANTIC_VALIDATION_FAILED
- PB-06 blocking finding summary: FACT_FIDELITY/major @ decision_plan.actions_to_take[0]; ACTION_CONSISTENCY/major @ report_content.cover_line
- intermediate Plan present: yes
- intermediate Report present: yes
- 中間生成物の扱い: 棄却された中間生成物
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: なし

## E-R3-05 — 交際相手・距離の要請・謝罪と返信圧力

- actual final_result present: no
- safe_error_code: M2_SEMANTIC_VALIDATION_FAILED
- PB-06 blocking finding summary: FACT_FIDELITY/minor @ $.report_content.cover_line
- intermediate Plan present: yes
- intermediate Report present: yes
- 中間生成物の扱い: 棄却された中間生成物
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: なし

## E-R3-06 — 親友・方言・複数意味の候補文

- actual final_result present: no
- safe_error_code: M2_SEMANTIC_VALIDATION_FAILED
- PB-06 blocking finding summary: FACT_FIDELITY/major @ $.decision_plan.actions_to_take[0]; FACT_FIDELITY/major @ $.report_content.cover_line
- intermediate Plan present: yes
- intermediate Report present: yes
- 中間生成物の扱い: 棄却された中間生成物
- 採用済み返信文: なし
- 採用済み鑑定レポート: なし
- 確定した Runtime eligibility: なし
