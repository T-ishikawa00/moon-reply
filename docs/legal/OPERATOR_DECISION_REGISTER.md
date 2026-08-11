# 運営者判断事項一覧（ドラフト）

> **DRAFT**
>
> **NOT LEGAL ADVICE**
>
> **NOT APPROVED FOR PUBLICATION**
>
> **REQUIRES OPERATOR COMPLETION**
>
> **REQUIRES FINAL SOURCE REVIEW**
>
> この文書は月の返事の内部検討用ドラフトです。運営者情報、利用する外部事業者、保存期間、提供条件等が未確定であり、公開前に最新の公式一次情報、実際のサービス仕様、決済事業者の条件および必要に応じた任意の専門家相談を反映する必要があります。

---

## 状態の意味

- `Not decided`: 運営者による判断が未完了
- `Evidence required`: 公式情報、契約、設定、実装その他の証拠が必要
- `Current-source review required`: 最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言およびCustomer-rightsとの整合確認が必要。materialな未解決法的義務はblockerとして残す
- `Internally decided`: Human承認済みの内部方針。外部承認または実装完了を意味しない

`2026-08-11` Human decisionにより、専門家相談は任意であり、Payment Charter受入、公開、Paid LaunchまたはProduction Paymentの必須条件ではありません。専門家reviewは未実施であり、内部reviewが法的適合性を保証するものではありません。

Task 18Bでは判断事項を一つも完了扱いにしませんでした。Task 18Cでは、すでにHuman承認済みの初期MVP方針と一致するOP-034を`Internally decided`として記録しました。その後の`2026-08-11` Human decisionにより、OP-032の「専門家相談は任意」というgate policyだけを`Internally decided`として追加します。専門家reviewの実施を完了扱いにはしません。その他の担当、期限、実情報および外部証拠は未決定であり、placeholderを維持します。

`2026-08-12` current sequencing: Stripe Checkout is the desired strategic primary direction under a Candidate pending Human + ChatGPT integrated review; feasibility/account/approval/activation/formal selection and method eligibility are unestablished. PAY.JP is paused fallback. OP-001/005/006/007 and opening-notification or virtual-office preparation remain unresolved, but PAY.JP-specific completion is not current next work and does not block the Candidate review. Stripe does not waive operator, Tokushoho, address, phone, support, or publication obligations; their exact disclosure method remains a later current-source and actual-Provider decision.

## 判断・証拠管理の関連文書

- 分かりやすい全体整理：`WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md`
- 判断方法と選択肢：`OPERATOR_DECISION_GUIDE.md`
- Human回答欄：`OPERATOR_DECISION_WORKSHEET.md`
- provider事実の比較：`../payment/PROVIDER_COMPARISON.md`
- Stripe strategy Candidate：`../payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`
- PAY.JP production application readiness：`../payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`
- provider application/review/inquiry証拠：`../payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md`
- provider選定ゲート：`../payment/PAYMENT_PROVIDER_DECISION_GATE.md`

| Decision ID | 項目 | 現在値 | 必要な判断・証拠 | 担当 | 期限 | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| OP-001 | 運営形態：個人 / 個人事業主 / 法人 | [[OPERATOR_DECISION_REQUIRED]] | 契約、税務、表示上の運営主体を決定。PAY.JPを将来再開する場合の開業届/equivalent evidenceはfallback-specific requirementとして再確認 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / current Candidate reviewでは保留 |
| OP-002 | 法的氏名 | [[OPERATOR_LEGAL_NAME_TBD]] | 公開・契約に使用する実情報 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-003 | 屋号 | [[OPERATOR_TRADE_NAME_TBD]] | 使用有無および実情報 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-004 | 運営責任者 | [[RESPONSIBLE_PERSON_TBD]] | 公開する責任者の実情報 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-005 | 住所公開方法 | [[OPERATOR_ADDRESS_DISCLOSURE_TBD]] | 最新の公式情報、実住所、採用する表示方法 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-006 | 電話番号公開方法 | [[OPERATOR_PHONE_DISCLOSURE_TBD]] | 最新の公式情報、実番号、採用する表示方法 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-007 | 問い合わせメール | [[SUPPORT_EMAIL_TBD]] | 実在性、受信、権限、運用確認 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-008 | 問い合わせフォーム | [[CONTACT_FORM_URL_TBD]] | 実在URL、入力項目、個人情報取扱い | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-009 | 問い合わせ対応時間 | [[SUPPORT_RESPONSE_TIME_TBD]] | 対応体制と実現可能な返信目安 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-010 | 決済プロバイダ | [[PAYMENT_PROVIDER_TBD]] | Stripe desired directionのactual feasibility/account/business/site/category/method evidenceとHuman formal selection。PAY.JPはpaused fallback | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required / no provider selected |
| OP-011 | 支払方法 | [[PAYMENT_METHODS_TBD]] | provider機能、契約、実装方式 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-012 | 支払時期 | [[PAYMENT_TIMING_TBD]] | 契約成立・売上確定・表示条件 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-013 | 提供時間 | [[DELIVERY_TIMING_TBD]] | 生成・保存・通知フローの実測と運用判断 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-014 | 返金処理時間 | [[REFUND_PROCESSING_TIME_TBD]] | provider仕様と運用SLA | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-015 | AI provider | [[AI_PROVIDER_TBD]] | 契約、privacy、安全性、利用可否 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-016 | AI endpoint | [[AI_ENDPOINT_TBD]] | 実際に利用するAPI endpoint | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-017 | AI account data-control settings | [[OPERATOR_DECISION_REQUIRED]] | organization/project設定の画面・設定証拠 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-018 | Supabase region | [[DATA_HOSTING_REGION_TBD]] | project regionと実際の処理構成 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-019 | Email provider | [[EMAIL_PROVIDER_TBD]] | 契約、送信方式、処理地域、保持条件 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-020 | Analytics有無 | [[ANALYTICS_PROVIDER_TBD]] | 導入有無、provider、取得情報、拒否方法 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-021 | Cookie方針 | [[OPERATOR_DECISION_REQUIRED]] | 必須・任意Cookie、同意・拒否設計 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-022 | consultation text retention | [[DATA_RETENTION_PERIOD_TBD]] | 必要性、削除、安全、運用根拠 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-023 | reading result retention | [[DATA_RETENTION_PERIOD_TBD]] | 再アクセス期間と削除方針 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-024 | purchase/accounting retention | [[DATA_RETENTION_PERIOD_TBD]] | 税務・会計・返金・チャージバック根拠 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-025 | AI log retention | [[DATA_RETENTION_PERIOD_TBD]] | raw content最小化、品質・障害調査との調整 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-026 | result token expiry | [[OPERATOR_DECISION_REQUIRED]] | アクセス期間、セキュリティ、利用者通知 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-027 | result token revocation/reissue | [[OPERATOR_DECISION_REQUIRED]] | 失効・再発行・本人確認手順 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-028 | deletion request workflow | [[OPERATOR_DECISION_REQUIRED]] | 受付、本人確認、例外、provider削除、監査 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-029 | marketing email有無 | [[OPERATOR_DECISION_REQUIRED]] | 実施有無、任意同意、解除、証拠管理 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided |
| OP-030 | governing court | [[GOVERNING_COURT_TBD]] | 運営主体・所在地と条項の妥当性 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |
| OP-031 | trademark search | 未実施 | J-PlatPat検索日、区分、結果、証拠 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-032 | professional legal review | 任意・未実施 | `2026-08-11` Human decisionにより必須gateではない。将来任意に実施する場合のみreviewer、対象文書、指摘、対応記録を保存 | Human | 任意 | Internally decided |
| OP-033 | public support-resource verification | 未確認 | 公式source、jurisdiction、用途、確認日 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Evidence required |
| OP-034 | `needs_review` production treatment | 初期MVPは決済不可。通常の恋愛鑑定書・メッセージ案を生成しない。将来の取扱いは別途承認 | 初期MVP方針はHuman承認済み。将来運用にはserver-side処理、Human review、返金・停止条件の別承認と実装証拠が必要 | Human | 初期MVP方針は決定済み / 将来取扱いは未定 | Internally decided |
| OP-035 | user sharing/quotation rules for readings | [[OPERATOR_DECISION_REQUIRED]] | 個人的利用、引用、一部共有、公開範囲 | [[OPERATOR_DECISION_REQUIRED]] | [[OPERATOR_DECISION_REQUIRED]] | Not decided / Current-source review required |

## 更新規則

- 判断または証拠がない項目を完了にしない
- providerのマーケティングページ、blank application form、generic support answerまたはsilenceだけでカテゴリ承認と扱わない。Stripeはfeasibility not established / account absent / approval・activation absent / formal selection incomplete、PAY.JPはpaused fallback / application Not submitted / Not approved / Not selectedのまま
- 任意の専門家相談を実施した場合は対象文書、確認者、確認日および対応結果を記録する。未実施それ自体を公開・Paid Launchのblockerにしない
- 値を確定した場合は、整合性表に従ってすべての関連文書・画面へ反映する
- Human承認済みの初期MVP方針を、将来運用が未決定であることを理由に未決定へ戻さない
