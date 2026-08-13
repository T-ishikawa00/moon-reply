# OPERATOR_DECISION_WORKSHEET.md

> **FOR HUMAN COMPLETION**
>
> **DO NOT ENTER GUESSED PERSONAL INFORMATION**
>
> **NOT LEGAL OR TAX ADVICE**

> B2 accepted status: `stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`（`2026-08-13`）。Human + ChatGPT review / acceptance は `complete / complete`。accepted Lane B directionは再回答対象ではなく、Human Answerはactual private valueまたは残る運用判断だけに使用する。

## 記入ルール

- `Human Answer`はHuman本人が後で記入する。B2ではactual PIIを入れず `[[HUMAN_DECISION_TBD]]` のままにする。
- 氏名、住所、電話番号、メールアドレスその他の実情報をCodexが推測しない。
- `Current-source review required`は最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言およびCustomer-rightsとの整合確認が必要という意味である。
- `Evidence required`は公式情報、provider回答、契約、設定または実装試験が必要という意味である。
- OP-032のprofessional legal reviewは`2026-08-11` Human decisionにより任意・未実施・必須gateではない。任意に実施した場合だけ証拠を記録する。
- OP-034の初期MVP方針は決定済みであり、ここで未決定へ戻さない。回答欄は将来運用に関するHuman回答用である。

| ID | Question | Options | Recommendation | Human Answer | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OP-001 | accepted individual / sole-proprietor routeのactual onboarding labelと契約・表示主体をどう一致させるか | applicable individual / sole-proprietor Provider label | 受入済みrouteを再選択せず、有料公開前にactual provider label、契約、税務、表示主体を一致させる | [[HUMAN_DECISION_TBD]] | provider申込資格、契約・届出、最新の税務・法務公式情報。専門家相談は任意 | Direction internally decided; actual evidence required |
| OP-003 | 屋号をどうするか | 月の返事 / 別屋号 / 屋号なし | サービス名と契約・表示の関係を明確化。商標クリアランスは未確認 | [[HUMAN_DECISION_TBD]] | 実際の届出・契約、別途J-PlatPat検索 | Human decision; evidence required |
| OP-005 | accepted request-based preferenceを使えるeligible fieldとactual住所表示をどう確定するか | 許容されるfieldはrequest-based / 必要なfieldはactual public display | Payment前、no login/purchase/Purchase ID、遅滞のないactual disclosureとlogsを実現し、全field非公開と断定しない | [[HUMAN_DECISION_TBD]] | 消費者庁公式情報、provider要件、実住所、運用試験。専門家相談は任意 | Direction internally decided; exact method/evidence required |
| OP-006 | accepted request-based preferenceを使えるeligible fieldとactual電話表示をどう確定するか | 許容されるfieldはrequest-based / 必要なfieldはactual public display | 実在し運用可能な番号、Payment前request、no login/purchase/Purchase ID、遅滞のないactual disclosureとlogsを確認 | [[HUMAN_DECISION_TBD]] | 消費者庁公式情報、provider要件、実番号、運用試験。専門家相談は任意 | Direction internally decided; exact method/evidence required |
| OP-007 | accepted 1 business mailbox modelのactual addressを何にするか | 独自domain / provider-hosted mailbox / その他の管理下にある事業用address | 私用と分離、operator管理、可能なら2FA、公開前に送受信試験 | [[HUMAN_DECISION_TBD]] | 契約、管理権限、2FA、送受信試験 | Model internally decided; actual value/evidence required |
| OP-008 | accepted 1 categorized form modelをどのactual URL/backendで実現するか | one form with six fixed functional categories | delivery、ordinary refund、Payment Integrity、Privacy、seller disclosure、otherを受信・記録できること | [[HUMAN_DECISION_TBD]] | 実在URL、通知、access control、6分類の受信試験、privacy確認 | Model internally decided; implementation evidence required |
| OP-009 | 返信目安を何営業日にするか | 2営業日 / 3営業日 / 5営業日 | 実際の運営体制を確認してHumanが選択 | [[HUMAN_DECISION_TBD]] | 運営日程、担当体制、試験運用 | Human decision |
| OP-020 | 初期MVPでAnalyticsを使うか | 使わない / 最小構成 / 事前レビュー後に利用 | 明確な計測要件とprivacy設計が整うまで追加しない方向 | [[HUMAN_DECISION_TBD]] | 実装、network確認、provider設定・条件 | Human decision; evidence required |
| OP-021 | Cookie方針をどうするか | 必須のみ / 任意用途を選択可能 / 別Cookie Policy | 初期MVPは必須用途へ最小化し、実装事実に合わせる方向 | [[HUMAN_DECISION_TBD]] | browser確認、provider仕様、最新公式情報 | Human decision; current-source review required |
| OP-026 | 結果URLを何日利用可能にするか | 7日 / 30日 / 90日 / 根拠を記録した別期間 | 無期限を避け、30日を初期候補として比較。最終決定ではない | [[HUMAN_DECISION_TBD]] | security設計、token失効試験、retention確認 | Human decision; implementation evidence required |
| OP-027 | 結果URLをどう失効・再発行するか | 再発行なし / email所有確認後 / 個別審査後 | email確認後に旧token失効・新token発行する案を検討 | [[HUMAN_DECISION_TBD]] | 本人確認、失効・再発行試験、監査記録 | Human decision; implementation evidence required |
| OP-029 | 初期MVPでmarketing emailを行うか | 行わない / 任意の分離opt-in | Humanが明示的に有効化しない限り行わない方向 | [[HUMAN_DECISION_TBD]] | Human決定、同意・解除記録、provider条件 | Human decision; evidence required if enabled |
| OP-034 | 追加情報・clarificationにより安全に再評価できるfail-closed状態を初期MVP後にどう扱うか | 初期MVPの停止を継続 / server-side再評価・別途Human review等を設計 | `purchaseGateSatisfied=true`がserver側で成立するまで決済不可・通常鑑定なし。waiting、temporary pause、boundary-respecting supportは単独では不適格にしない。将来運用は別承認 | [[HUMAN_DECISION_TBD]] | 既存Human承認、将来のserver-owned eligibility試験・運用証拠。browser/client/localStorageはauthorityにならない | Initial MVP internally decided; future handling requires separate approval |
| OP-035 | 鑑定書の共有をどこまで許可するか | 私的利用のみ / 限定的な抜粋共有 / 全文共有可 | 私的利用を基本とし、小さな抜粋共有は将来検討。転売・全文商用再配布は禁止方向 | [[HUMAN_DECISION_TBD]] | Human決定、利用規約、最新公式情報。専門家相談は任意 | Human decision; current-source review required |
