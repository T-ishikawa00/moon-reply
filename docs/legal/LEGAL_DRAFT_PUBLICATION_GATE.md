# 法務ドラフト公開前承認ゲート（ドラフト）

> **CURRENT Stripe Lane B B4b Private Review Hard Gate technical evidence closure:** `stripe_lane_b_b4b_private_review_hard_gate_technical_evidence_complete_pending_human_chatgpt_final_review_b4b_acceptance`; Product parent / Runtime asset Correction `004c3fbf6efcc0914cccb1d8ff08b41de7f655a6` (`next.config.ts` only); QA-only probe `68e16cebb1eccd0966e3a6e11aedef030cab87aa` is temporary evidence only and excluded from Product lineage. Authenticated HTTP `PASS_13_of_13_authenticated_http_200`; unauthenticated HTTP `PASS_13_of_13_unauthenticated_http_401`; `technicalEvidence = complete`.
>
> Runtime contract assets `PASS_active_runtime_assets_read_and_hash_verified_in_netlify_function`; private rollback/republication `PASS_private_branch_context_rollback_via_git_republication`; deploy removal/offline `PASS_deploy_removal_offline_via_deleted_probe_permalink`; Private protection / route rendering / Safety fail-closed / Preview-Production separation `complete / complete / complete / complete`; Netlify Hard Gate `technical_evidence_complete_pending_final_review_acceptance`; ChatGPT final review / Human final review / B4b acceptance `pending / pending / pending`; Production B4a SHA `025e28a82c0b773d21ececfd8064af045922079d` remains `unchanged / locked`; Paid Production Hosting `provisional`. This source records prior Human-supplied Private Review evidence and does not claim its own deployment, B4b acceptance, Netlify Hard Gate acceptance, Production readiness, public launch, or Paid Production approval. Future Provider operations remain separately authorized; raw Provider URLs/IDs remain prohibited; historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md.

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

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. `NOT APPROVED FOR PUBLICATION` remains controlling, and B3 acceptance completes none of this gate's publication checkboxes. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

---

## 0. ゲート規則

- 以下の項目がすべて完了し、証拠が記録されるまで法務ドラフトを公開承認しない
- B2 Candidateではpublication checklistを一つも完了扱いにしない
- `[ ]`を`[x]`へ変更する場合は、判断者、確認日、証拠および反映先を記録する
- 本ゲートの完了は、決済実装を自動的に承認するものではない
- 決済実装は引き続き禁止します（Payment implementation remains prohibited.）
- Task 18Cのprovider inquiry artifactsはhistorical preparationであり、本ゲートのチェックを完了しない。現在のPAY.JP readiness planningも本ゲート、申請、承認または公開承認を完了しない
- 最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言およびCustomer-rightsのreviewは必須とし、materialな未解決法的義務はblockerとして残す
- 専門家相談は任意のescalationであり、未実施それ自体は公開、Paid LaunchまたはProduction Paymentのblockerではない。内部reviewは法的適合性を保証しない

Current strategy boundary on `2026-08-12`: Stripe Checkout is the Human + ChatGPT accepted strategic primary direction to investigate and prepare. Stripe feasibility is not established; account/contact/approval/activation are absent; formal selection is incomplete; and method eligibility is unverified. PAY.JP is paused fallback. PAY.JP-specific operator/address/opening-notification/security preparation is not current work, but every remaining operator, address, phone, support-email, Tokushoho, and publication completion item below remains unresolved and must be completed before the applicable future review or Paid Launch. Stripe does not remove these obligations.

Human address/privacy direction is recorded but does not complete this gate: truthful private home/business-address disclosure to legitimate non-public counterparties is acceptable; routine public display of the Human's home address to general Customers is not desired as the default; and a legally valid request-based or otherwise non-routine-public method is preferred where current law and actual Provider requirements allow. Exact Tokushoho implementation remains unresolved and current-source/evidence-gated. Virtual-office use is not currently required by Human preference; GMO remains on hold, not rejected, and may be reconsidered if actual evidence makes it useful or necessary.

The request-based Candidate direction applies only to legally eligible fields where current law and actual Stripe requirements permit. A Customer must be able to request the applicable seller information before Payment without login, completed purchase, or Purchase ID solely for the request; an operational route and logs must exist and actual information must be provided without delay. This does not complete the gate or establish Stripe approval.

## Provider and readiness supporting documents

- Operator decision guide: `OPERATOR_DECISION_GUIDE.md`
- Operator worksheet: `OPERATOR_DECISION_WORKSHEET.md`
- Stripe strategy Candidate: `../payment/STRIPE_FEASIBILITY_AND_WEB_PAYMENT_STRATEGY_PIVOT_CANDIDATE.md`
- Provider comparison: `../payment/PROVIDER_COMPARISON.md`
- PAY.JP production-application readiness: `../payment/PAYJP_PRODUCTION_APPLICATION_READINESS.md`
- PAY.JP historical/optional support clarification draft: `../payment/PAYJP_INQUIRY_DRAFT.md`
- KOMOJU inquiry draft: `../payment/KOMOJU_INQUIRY_DRAFT.md`
- STORES inquiry draft: `../payment/STORES_INQUIRY_DRAFT.md`
- Inquiry evidence log: `../payment/PROVIDER_INQUIRY_EVIDENCE_LOG.md`
- Provider scorecard: `../payment/PROVIDER_DECISION_SCORECARD.md`
- Provider selection gate: `../payment/PAYMENT_PROVIDER_DECISION_GATE.md`

Stripe strategyはHuman + ChatGPT acceptedだが、feasibility not established / account absent / contact none / approval・activation absent / formal selection incomplete / method eligibility unverifiedである。PAY.JP production-use applicationはNot submittedで、PAY.JPはpaused fallback / Not approved / Not selected / Not scoredである。既存Provider artifactsまたはstrategy acceptanceはlegal publication approvalではない。

## 1. Operator completion

- [ ] 法的氏名を実情報で確定
- [ ] 運営責任者を実情報で確定
- [ ] 住所の公開方法を確定
- [ ] 電話番号の公開方法を確定
- [ ] 問い合わせメールを確定し受信確認
- [ ] 問い合わせフォームを確定し動作確認
- [ ] 問い合わせ返信目安を確定

## 2. Provider decisions

- [ ] 決済事業者固有の正式な審査経路からauthoritative category/application approval evidenceとconditionsを取得
- [ ] Stripeの場合、actual account/business/site/category/Live Payment outcomeとcards・Apple Pay・Google Pay・PayPayのmethod-specific evidenceを保存
- [ ] desired methodが不足する場合はHuman launch reviewへ戻し、PayPayなしLaunchを自動承認しない
- [ ] PAY.JPの場合、production-use application/review outcomeおよびapplicableなPAY.JP/card-company conditionsを保存
- [ ] PAY.JP security-measures declarationのactual questionsと回答根拠を確認
- [ ] EMV 3-D Secureを含むapplicableなsecurity requirementsの実装・試験証拠を確認
- [ ] 決済事業者をHumanが正式承認・選定
- [ ] AI providerを確定
- [ ] AI endpointを確定
- [ ] AI organization/projectのdata-control settingsを確認
- [ ] Supabase regionを確認
- [ ] Email providerを確定
- [ ] Analytics導入有無とproviderを確認

## 3. Commercial decisions

- [ ] 支払方法を確定
- [ ] 支払時期を確定
- [ ] 提供時間を確定
- [ ] 返金処理時間を確定
- [ ] 追加情報・clarificationが必要で通常の有料鑑定の適格性が未成立の場合の本番運用を別途承認（安全に解消され、server-owned Purchase authorityが再評価されるまで決済不可・通常鑑定なし）
- [ ] 誤ったメールアドレスへの訂正・再送方法を確定
- [ ] 結果URLの失効・再発行方法を確定

## 4. Privacy decisions

- [ ] 相談本文の保存期間を確定
- [ ] 安全確認記録の保存期間を確定
- [ ] 鑑定結果の保存期間を確定
- [ ] 購入・会計記録の保存期間を確定
- [ ] AIログの保存期間を確定
- [ ] メール・問い合わせ記録の保存期間を確定
- [ ] 開示・訂正・削除手順を確定
- [ ] 国外処理・国外移転の文言を確認
- [ ] Cookie・analytics方針を確定
- [ ] 外部委託先およびデータフロー一覧を確定

## 5. Review evidence

- [ ] 公開直前に最新の公式情報を再確認
- [ ] 特定商取引法に基づく表示項目と表示方法を確認
- [ ] 消費者契約法に関係する免責・責任制限・返金文言を確認
- [ ] Privacyの国外処理、委託、第三者提供、保存・削除文言を最新の公式一次情報、実際のデータフローおよび最終公開文言に照らして確認
- [ ] 利用規約の責任制限および変更条項を最新の公式一次情報、実際のサービス挙動およびCustomer-rightsに照らして確認
- [ ] 返金ポリシーの法令・provider整合を確認
- [ ] 決済事業者の契約・禁止業種・運用条件を確認
- [ ] J-PlatPatで`月の返事`を検索し、日付・区分・結果・証拠を記録
- [ ] 公式の相談先をsource・jurisdiction・用途・確認日とともに確認

## 6. Implementation consistency

- [ ] 最終確認画面と特定商取引法に基づく表記の価格・数量・支払・提供・返金条件が一致
- [ ] LPと禁止表現ポリシーが一致
- [ ] AI promptと禁止表現ポリシーが一致
- [ ] Safety gateがサーバー側で強制される
- [ ] server-owned Purchase authorityが必須boolean成人確認 `私は18歳以上です` を実決済前に要求する
- [ ] 現在のserver-owned eligibilityが`purchaseGateSatisfied=true`を確立した場合だけ実決済へ到達できる
- [ ] clarification、unsafe、urgent、unsupported professional-assistance、invalid、contradictory、unknownおよびtechnical-errorがfail closedで実決済へ到達しない
- [ ] waiting、not-sending-now、temporary pauseまたはboundary-respecting supportを、それだけで購入不適格とせず、別個のassistance eligibilityをserver側で評価する
- [ ] browser、clientまたはlocalStorageがPurchase authorityを確立できない
- [ ] 初回または有効なtrusted sessionがない購入では、実決済前にdelivery/recovery mailbox ownership verificationがserver-sideで強制される
- [ ] trusted delivery/recovery verification stateがserver-authoritativeであり、browser/client/localStorageから自己申告できない
- [ ] delivery/recovery email変更またはtrusted sessionの失効・取消・無効・不在時に再検証され、Request flow・最終確認・結果配信・recoveryで同じbindingが使われる
- [ ] AI payloadにemail、payment ID、internal token等が含まれない
- [ ] マーケティング同意が任意で結果通知と分離される
- [ ] 法務ページのリンク切れがない
- [ ] すべての公開ページ・画面・メールに最終承認された文言が反映される

## 7. Publication decision

- [ ] Humanが公開対象ファイルと最終文言を明示的に承認
- [ ] 公開日を[[EFFECTIVE_DATE_TBD]]として確定
- [ ] 最終更新日を[[LAST_UPDATED_DATE_TBD]]として確定

B3 acceptance完了後も、公開判断は`NOT APPROVED FOR PUBLICATION`のままです。B3 Human Visual QA / ChatGPT reviewは`PASS / complete`、Human acceptance / B3 acceptanceは`complete / complete`です。次の作業はStripe Lane B deployment readiness (B4a)ですが、planning/readiness onlyであり、本ゲートのcheckboxを一つも完了しません。
