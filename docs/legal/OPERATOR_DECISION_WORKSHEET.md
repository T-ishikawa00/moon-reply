# OPERATOR_DECISION_WORKSHEET.md

> **FOR HUMAN COMPLETION**
>
> **DO NOT ENTER GUESSED PERSONAL INFORMATION**
>
> **NOT LEGAL OR TAX ADVICE**

## 記入ルール

- `Human Answer`はHuman本人が後で記入する。Task 18Cでは `[[HUMAN_DECISION_TBD]]` のままにする。
- 氏名、住所、電話番号、メールアドレスその他の実情報をCodexが推測しない。
- `Professional review required`は専門家確認済みという意味ではない。
- `Evidence required`は公式情報、provider回答、契約、設定または実装試験が必要という意味である。
- OP-034の初期MVP方針は決定済みであり、ここで未決定へ戻さない。回答欄は将来運用に関するHuman回答用である。

| ID | Question | Options | Recommendation | Human Answer | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| OP-001 | どの運営形態で契約・表示するか | 個人 / 個人事業主 / 法人 | 有料公開前にprovider契約と法務表示の主体を一致させ、必要に応じ法務・税務確認 | [[HUMAN_DECISION_TBD]] | provider申込資格、契約・届出、専門家確認 | Human decision; professional review may be required |
| OP-003 | 屋号をどうするか | 月の返事 / 別屋号 / 屋号なし | サービス名と契約・表示の関係を明確化。商標クリアランスは未確認 | [[HUMAN_DECISION_TBD]] | 実際の届出・契約、別途J-PlatPat検索 | Human decision; evidence required |
| OP-005 | 住所をどの方法で表示するか | 実住所 / 適法性を確認した別方法 / 運営形態確定後に判断 | 省略・virtual officeが常に可能と断定せず、公式情報と専門家で確認 | [[HUMAN_DECISION_TBD]] | 消費者庁公式情報、provider要件、住所利用根拠、専門家確認 | Professional review required |
| OP-006 | 電話番号をどの方法で表示するか | 事業用番号 / 適法性を確認した別方法 / 運営体制確定後に判断 | 実在し運用可能な方法を公式情報と専門家で確認 | [[HUMAN_DECISION_TBD]] | 消費者庁公式情報、provider要件、電話契約、専門家確認 | Professional review required |
| OP-007 | 問い合わせメールをどうするか | 独自domain / provider-hosted mailbox / その他の管理下にある事業用address | 私用と分離、operator管理、可能なら2FA、公開前に送受信試験 | [[HUMAN_DECISION_TBD]] | 契約、管理権限、2FA、送受信試験 | Human decision; evidence required |
| OP-008 | 問い合わせ窓口をどうするか | formのみ / emailのみ / 両方 | 決済・重複請求・生成失敗・誤email・結果URL・privacy/deletionを受付可能にする | [[HUMAN_DECISION_TBD]] | 実在URL、受信・振分け試験、privacy確認 | Human decision; implementation evidence required |
| OP-009 | 返信目安を何営業日にするか | 2営業日 / 3営業日 / 5営業日 | 実際の運営体制を確認してHumanが選択 | [[HUMAN_DECISION_TBD]] | 運営日程、担当体制、試験運用 | Human decision |
| OP-020 | 初期MVPでAnalyticsを使うか | 使わない / 最小構成 / 事前レビュー後に利用 | 明確な計測要件とprivacy設計が整うまで追加しない方向 | [[HUMAN_DECISION_TBD]] | 実装、network確認、provider設定・条件 | Human decision; evidence required |
| OP-021 | Cookie方針をどうするか | 必須のみ / 任意用途を選択可能 / 別Cookie Policy | 初期MVPは必須用途へ最小化し、実装事実に合わせる方向 | [[HUMAN_DECISION_TBD]] | browser確認、provider仕様、最新公式情報 | Human decision; professional review may be required |
| OP-026 | 結果URLを何日利用可能にするか | 7日 / 30日 / 90日 / 根拠を記録した別期間 | 無期限を避け、30日を初期候補として比較。最終決定ではない | [[HUMAN_DECISION_TBD]] | security設計、token失効試験、retention確認 | Human decision; implementation evidence required |
| OP-027 | 結果URLをどう失効・再発行するか | 再発行なし / email所有確認後 / 個別審査後 | email確認後に旧token失効・新token発行する案を検討 | [[HUMAN_DECISION_TBD]] | 本人確認、失効・再発行試験、監査記録 | Human decision; implementation evidence required |
| OP-029 | 初期MVPでmarketing emailを行うか | 行わない / 任意の分離opt-in | Humanが明示的に有効化しない限り行わない方向 | [[HUMAN_DECISION_TBD]] | Human決定、同意・解除記録、provider条件 | Human decision; evidence required if enabled |
| OP-034 | 初期MVP後の`needs_review`をどう扱うか | 初期MVPの停止を継続 / 別途Human review等を設計 | 初期MVPは決済不可・通常鑑定なし。将来運用は別承認 | [[HUMAN_DECISION_TBD]] | 既存Human承認、将来のserver-side試験・運用証拠 | Initial MVP internally decided; future handling requires separate approval |
| OP-035 | 鑑定書の共有をどこまで許可するか | 私的利用のみ / 限定的な抜粋共有 / 全文共有可 | 私的利用を基本とし、小さな抜粋共有は将来検討。転売・全文商用再配布は禁止方向 | [[HUMAN_DECISION_TBD]] | Human決定、利用規約、専門家確認 | Human decision; professional review required |
