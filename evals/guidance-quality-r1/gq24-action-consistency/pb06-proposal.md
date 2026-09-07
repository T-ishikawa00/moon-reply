# PB06 temporal action amendment — proposal only

未接続の最小改訂案。現行prompt/catalog/hash/schema/classifier/runnerは変更しない。既存PB06は既に現在行動と将来条件の区別を指示しているため、新原則の追加ではなく、この既存原則を判定手順として具体化する。新しい必須Product sectionやfinding codeは作らない。

将来採用する場合は、既存のcurrent action-window authority説明の直後、明示的連絡制約の段落の前へ、以下の一節だけを新しい候補prompt/versionとして追加する。既存契約は上書きしない。以下にはcase ID、A/B、Human回答、編集上の目標回答を含めない。

---

## Temporal scope of ACTION_CONSISTENCY

Evaluate the current action and post-action behavior as separate instructions. Compare the actor, the message or contact action involved, the triggering condition, and the time relative to that action. A shared current-day label in `action_context` does not make a first reply and an additional message after that reply the same action.

The current `allowed_decisions` apply to `selected_decision` and instructions carrying out that current decision. Do not require every conditional `change_conditions[*].resulting_direction` to be a currently allowed Decision. A future condition is a reason to reassess the facts then; it does not change the current Decision by itself. Application-owned neutral reassessment commentary does not promise that a future message must be sent.

A single send or reply followed by waiting without additional contact is sequentially consistent. Its primary direction remains send or reply. A current no-send instruction followed by waiting is also consistent. Waiting now and considering a reply only after a new incoming message is consistent when that reply remains permitted by the applicable contact constraints. Read the whole Plan and Report for the event sequence; the word "wait", or its position in an aftercare field, is not sufficient evidence either to report or to dismiss a defect.

Continue to report an instruction to send and an instruction not to send the same message under the same conditions at the same time. Also continue to report an unjustified immediate additional send, pressure for a reaction, or a contact-boundary violation even if the text calls it aftercare or a future condition. An explicit contact restriction remains authoritative across time; the passage of time, a condition field, or `action_context` never creates an exception.

For a contradiction finding, use the existing `detail` and precise paths to identify the two incompatible instructions and briefly explain their common action and temporal scope. For a policy violation, identify the actual instruction and the applicable restriction instead. Cite `policy:action_context` only when its specific horizon or structured constraint is relevant; that reference alone does not make future waiting incompatible with the current Decision. If temporal scope is materially ambiguous, identify the exact ambiguity rather than inventing a same-time contradiction.

Do not change Safety, factual/source fidelity, draft meaning/ownership, nullability, or contact-boundary checks. Return the existing findings-only schema. Do not rewrite the answer or choose a repair.

---

## 採用しない短絡修正

- `currentPolicyEvidenceRefs`へ`policy:action_context`を一括追加しない。
- future pathの`ACTION_CONSISTENCY`を一括ignoredにしない。
- finding code / severity / waitという語だけで許容しない。
- `change_conditions.resulting_direction`を削除・書換えしない。
- 既存のSTOPを取消し、保存候補を納品可能に変更しない。

これらは本物の同時点矛盾・即時追送・境界侵害も隠し得る。今回の7 fixtureは期待する意味を固定する評価資産で、モデルによる検出性能を証明するものではない。runtime接続や新APIは今回実施しない。
