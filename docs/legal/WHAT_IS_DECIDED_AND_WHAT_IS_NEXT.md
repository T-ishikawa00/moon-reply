# WHAT_IS_DECIDED_AND_WHAT_IS_NEXT.md

> **CURRENT Stripe Lane B B4b Private Review Hard Gate technical evidence closure:** `stripe_lane_b_b4b_private_review_hard_gate_technical_evidence_complete_pending_human_chatgpt_final_review_b4b_acceptance`; Product parent / Runtime asset Correction `004c3fbf6efcc0914cccb1d8ff08b41de7f655a6` (`next.config.ts` only); QA-only probe `68e16cebb1eccd0966e3a6e11aedef030cab87aa` is temporary evidence only and excluded from Product lineage. Authenticated HTTP `PASS_13_of_13_authenticated_http_200`; unauthenticated HTTP `PASS_13_of_13_unauthenticated_http_401`; `technicalEvidence = complete`.
>
> Runtime contract assets `PASS_active_runtime_assets_read_and_hash_verified_in_netlify_function`; private rollback/republication `PASS_private_branch_context_rollback_via_git_republication`; deploy removal/offline `PASS_deploy_removal_offline_via_deleted_probe_permalink`; Private protection / route rendering / Safety fail-closed / Preview-Production separation `complete / complete / complete / complete`; Netlify Hard Gate `technical_evidence_complete_pending_final_review_acceptance`; ChatGPT final review / Human final review / B4b acceptance `pending / pending / pending`; Production B4a SHA `025e28a82c0b773d21ececfd8064af045922079d` remains `unchanged / locked`; Paid Production Hosting `provisional`. This source records prior Human-supplied Private Review evidence and does not claim its own deployment, B4b acceptance, Netlify Hard Gate acceptance, Production readiness, public launch, or Paid Production approval. Future Provider operations remain separately authorized; raw Provider URLs/IDs remain prohibited; historical B3/B4a/B4b snapshots remain unchanged. Detailed evidence: docs/payment/STRIPE_LANE_B_B4B_STABLE_REVIEW_URL_DEPLOYMENT.md.

## この文書の目的

月の返事について、

- すでに決まったこと
- これから運営者が決めること
- 外部の回答が必要なこと
- current-source/evidence reviewが必要なこと

を分かりやすく整理する。

この文書は内部検討用であり、法的助言、公開承認、決済事業者の承認または実装承認ではない。

> **Stripe Lane B B3 accepted current overlay:** `stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete` on `2026-08-14`; Human Visual QA `PASS / complete`; ChatGPT review `PASS / complete`; Human acceptance / B3 acceptance `complete / complete`. B3 means only `Review-ready Website/Public Surface implementation accepted`. Exact next work is **Stripe Lane B deployment readiness (B4a)**, planning/readiness only. B4a does not authorize domain purchase, DNS mutation, deployment, public publication, Stripe submission, Provider activation, or Production Payment; B4b stable-URL deployment requires separate authority.

---

## すでに決まったこと

### 対象・価格・販売方法

- 初期MVPは18歳以上のみを対象とする
- Customer-facing controlは必須boolean自己申告 `私は18歳以上です` とし、年齢適格性だけのための年齢層、DOBまたは本人確認書類を収集しない
- 価格は1件あたり税込980円とする
- 1購入 = 1相談 = 1鑑定書とする
- 単発販売のみとする
- サブスクリプション、コイン、ポイント、回数券、自動更新は行わない

### サービスの位置づけ

- 公式定義を「AIを活用した恋愛メッセージ分析・判断支援デジタルレポート」とする
- ユーザー向け定義を「恋のメッセージ鑑定ノート」とし、`鑑定`はレポート形式とブランドを表す
- エンターテインメントおよび情報提供、感情の整理、メッセージ分析ならびに意思決定の支援を目的とする
- タロット、占星術、生年月日、数秘術、霊感その他の占術・超自然的手法または外部調査を使用しない
- 相手の本心、返信、復縁、未来または関係改善を保証しない
- 医療、心理または法律サービスとして提供しない
- AI利用と結果の不確実性を明示する

### Safetyと入力情報

- Safety screeningは決済前に行う
- current server-owned eligibilityが`purchaseGateSatisfied=true`を確立した場合だけ実決済へ進める
- clarification、unsafe、urgent、unsupported professional-assistance、invalid、contradictory、unknownおよびtechnical-errorはfail closedとする
- waiting、not-sending-now、temporary pauseまたはboundary-respecting supportは、それだけで不適格とせず、別個のassistance eligibilityを評価する
- 通常の有料鑑定の適格性が成立しないケースには鑑定書やメッセージ案を生成しない
- browser、clientまたはlocalStorageはPurchase authorityを確立できない
- スクリーンショットは受け付けない
- 実名、住所、電話番号、相手のフルネーム等の入力を禁止する
- AI payloadからemail、決済ID、内部token等を除外する

### 同意・販売表現・決済事業者

- 結果通知とマーケティング同意を分離する
- 不安を煽る販売、結果保証、架空レビュー、架空実績を禁止する
- 決済事業者は、実際の事業内容をtruthfully開示し、provider-specific authoritative approval/review evidenceを取得した後にHumanが正式選定する
- Stripe Checkoutは`2026-08-12`にHuman + ChatGPT accepted strategic primary Web directionとなった。ただしProduct/strategy acceptanceであり、feasibility、account/contact、approval/activation、formal selectionおよびmethod eligibilityを確立しない
- desired initial methodsはcredit/debit cards、Apple Pay、Google Pay、PayPay。いずれもunverifiedで、PayPayはdesired / not enabled / not approved、lifecycleは`not_frozen_recheck_required`。PayPay unavailableはPayPayなしLaunchの自動承認ではない
- RevenueCatはinitial Webに必須ではなく、future synchronizationはdesired / unresolved。PAY.JPはpaused fallback
- Providerまたは第三者の業種区分は未確定であり、文言変更だけで承認・免除を得られるとは扱わない
- Stripe Feasibility Evidence Preparationは`2026-08-12`に`stripe_feasibility_evidence_preparation_human_chatgpt_accepted_complete`としてHuman + ChatGPT accepted complete。Lane A preparationは`preparation_human_approved`だが、external actionはnot authorized、acquisitionはnot submitted、outcomeは`null`であり、Stripe feasibility、account/contact/submission、approval/activationまたはformal selectionを確立しない
- Stripe Lane B Human Decision Packageは`2026-08-13`に`stripe_lane_b_human_decision_package_human_chatgpt_accepted_complete`としてHuman + ChatGPT accepted complete。専用18+ self-attestation、individual/sole-proprietor applicable Stripe route、許容されるfieldのrequest-based disclosure優先、1 business mailbox + 1 categorized form、refund/Payment Integrity policy、具体的durationを置かないfulfillment skeleton、Stripe Account/Site review前のintended final production domain選定方針をacceptedとする
- このpolicy acceptanceはdownstream specs/legal drafts、actual entity labels、mailbox/SLA、domain availability/purchase、Stripe evidence、legal publicationまたはPayment implementationを完成・承認しない
- accepted B2 docs/spec/legal authorityではaccepted policyをCURRENT drafts/specsへ同期した。`AGE-GATE-001 = accepted_direction_legal_spec_alignment_human_chatgpt_accepted_complete`だが、B2 docs/spec/legal acceptanceはcompleteだが、Production server enforcement、Lane B readinessまたはPayment authorityを意味しない
- 通常Product返金とPayment Integrity remediationを区別し、Product/technical failureはsame-Purchase recovery / no recharge / impossible fulfillment時の税込980円全額返金、Safety bypass等はactual economic errorのuncapped remediationとする
- fulfillment skeletonはverified email、server-authoritative Payment success、protected result page、same-Purchase recovery、no rechargeを要求し、具体的delivery durationは未確定のままにする
- Contact modelは1 operating business mailbox + 1 categorized form、6 functional categoriesとし、販売事業者情報開示はPayment前・no login/purchase/Purchase IDで請求可能にする

Product、価格、Safety、truthful positioningおよびStripe-first strategyのaccepted内部方針は維持する。Stripe strategy acceptanceはfeasibility、approval/activation、formal selectionまたはimplementation authorityではない。

---

## 運営者が決めること

- actual Stripe onboarding entity label、opening-notification/tax timing、および運営・契約・表示主体の最終事実
- 「月の返事」を屋号として使うか、別屋号または屋号なしにするか
- accepted request-based disclosure方向に沿ったlegal name/address/phoneのexact Tokushoho wordingと実情報。全fieldを非公開にできるとは扱わない
- accepted 1 business mailbox + 1 categorized form modelに使用するactual mailbox address、form URL、access control、記録方法およびSLA
- 問い合わせの返信目安を2営業日、3営業日、5営業日等のどれにするか
- Analyticsを利用するか
- Cookieをどの範囲で利用し、どのように説明・選択可能にするか
- 結果ページを何日利用可能にするか
- 結果URLの失効・再発行と誤メール訂正をどう扱うか
- 初期MVPでマーケティングメールを行うか
- 鑑定書の共有を私的利用のみ、一部共有可、全文共有可のどこまで許可するか
- intended final production domainの候補、availabilityおよび購入判断。temporary review URLをdefault strategyにしないpolicyのみacceptedで、domain purchase/DNS/deploymentは未承認

判断は `OPERATOR_DECISION_GUIDE.md` を読み、`OPERATOR_DECISION_WORKSHEET.md` に回答して記録する。個人情報はこの段階で推測または仮入力しない。

---

## 外部から証拠を得ること

- 決済事業者固有の正式な審査経路によるauthoritative category/application acceptance、条件および追加対応
- Stripeの場合、actual account/business/site/category/Live Payment outcome、accurate submitted descriptionおよびconditions
- `STRIPE-FEAS-001` Preliminary Category Clarification、`STRIPE-ACCOUNT-001` Account/Business/Site/Live Payment Review、`STRIPE-PAYPAY-001` PayPay-specific Onboarding Reviewのlane別authoritative evidence。Lane A preliminary evidenceだけではformal selectionまたはapprovalに足りず、Lane CはLane Bを自動継承しない
- cards、Apple Pay、Google Pay、PayPayのaccount/category/method-specific eligibilityと追加条件
- Webhookイベント、署名検証、再送仕様および冪等性に必要な実装証拠
- 手数料、入金サイクル、返金、チャージバック、保留金、契約終了時の未精算金条件
- 単発デジタルコンテンツの決済・納品条件
- AI providerの契約、endpoint、data controls、処理地域および保持条件
- Supabaseの実project regionと利用機能
- Email providerの送信方式、処理地域、保持・削除条件
- Safety gateとAI payloadが設計どおりに動くことを示す実装・試験証拠

公式サイトの一般的なマーケティング説明、blank application form、generic support answer、optional clarificationだけでは、月の返事のカテゴリ承認の証拠にならない。

---

## Current-source / Evidence Reviewが必要なこと

- 特定商取引法上の住所・電話番号の表示方法
- 個人、個人事業主または法人という運営形態に関する法務・税務上の整理
- AI、決済、データ保管、メールに伴う国外処理・国外移転の文言
- 利用規約の免責、責任制限、変更およびサービス終了条項
- 返金・キャンセル文言とprovider条件・法令の整合
- 相談本文、鑑定結果、購入記録、AIログ等の保存期間
- 開示、訂正、削除請求、本人確認および保存例外の手順
- AI生成物の権利帰属と利用許諾
- 準拠法・管轄裁判所の最終文言

これらは最新の公式一次情報、実際のProduct/Provider挙動、最終公開文言およびCustomer-rightsとの整合確認が必要な事項である。ApplicableなHuman/operator判断も完了させ、materialな未解決法的義務はblockerとして残す。内部reviewは法的適合性を保証しない。

専門家相談は`2026-08-11` Human decisionにより任意であり、Payment Charter受入、公開、Paid LaunchまたはProduction Paymentの必須条件ではない。現時点で専門家reviewは実施・完了していない。

---

## 次の順番

現在の全体Roadmapは`docs/ROADMAP.md`が制御し、Stripe Lane Bに関するHuman decision、Legal、Website、deployment、KYCおよびaccount準備の前提順序は`docs/payment/STRIPE_LANE_B_HUMAN_DECISION_PACKAGE.md`のB0–B7が制御する。法務・provider準備文書の旧Task順序はこれらを上書きしない。

1. Milestone 1 Reviewable Web MVPは`docs/ROADMAP.md`に記録された受入状態を維持する
2. Milestone 2は現行RoadmapどおりInternal Automated AI / DB Vertical Sliceの内部作業線であり、運営者情報、公開条件、Stripe readinessまたはlegal publicationを完成させるMilestoneではない
3. Stripe-first strategy Acceptance Sync、truthful Customer-facing/public-copy alignmentおよびStripe Feasibility Evidence Preparationは`2026-08-12`にaccepted complete。Lane Aは`preparation_human_approved / external_action_not_authorized / not_submitted / null`のままpreserved inactive
4. `2026-08-13`のHuman workflow decisionによりStripe Sales routeは`not_used_by_human_direction`となったが、これはStripe Provider outcomeではない
5. B0 Stripe Lane B Human Decision Package Candidateはcommit `223a2746f72ae8faa90b4df198f998a8132f2f3a`でformulated
6. B1 Human + ChatGPT decision review and acceptance syncは`2026-08-13`にcomplete。7件のpolicy decisionはすべてaccepted
7. B2 Stripe Lane B Legal Draft Finalization Candidateは`stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete`。Human + ChatGPT review / acceptanceは`complete / complete`
8. B3 Review-ready Website/Public Surface implementationは`stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete`（`2026-08-14`）。Human Visual QA / ChatGPT reviewは`PASS / complete`、Human acceptance / B3 acceptanceは`complete / complete`
9. **現在のexact next workはStripe Lane B deployment readiness (B4a)**。B4aはplanning/readiness onlyで、B4b stable URL deploymentには別個のHuman external-action authorityを必須とする
10. B5 private KYC readinessではactual Human valueをGitへ入れず、B6 Stripe Account/Activation Authorization Packageはaccount creation/submissionを承認しない
11. B7 actual Stripe account creation/KYC/activation submissionは、さらに別の明示的Human external-action authorization後にのみ実行できる
12. PayPay Lane Cはseparate and later。Lane A preliminary evidenceだけでStripeをformal selectionせず、Lane BをStripe account/Live supportability evidenceに必須とし、PayPayをenabled/approvedと扱う場合はLane C evidenceを必須とする
13. authoritative evidenceに基づくHuman formal Provider selectionと別個のimplementation authorization後にのみ、選定済みproviderのsandbox/test実装へ進む。Production QAはProduction Payment authorizationではなく、別個のProduction Payment authorization後にのみSoft Launchへ進む

predecessor acceptance前にexact future branchまたはmutation manifestを割り当てない。

Actual operator identity labels、exact legal name/address/phone wording、support mailbox/SLA、Tokushoho publicationおよびopening notificationは未解決のまま維持する。request-based disclosure方向はacceptedだが、exact Tokushoho implementationは未解決・current-source/evidence-gatedである。truthful private disclosureとCustomer-facing public disclosureを混同しない。Virtual-office useはcurrently not required、GMOはon hold / not rejectedである。`AGE-GATE-001`のaccepted Human directionはaccepted B2 docs/spec/legal authorityのCURRENT specs/legal draftsへ同期済みだが、Production server enforcementは未実装である。RequestFormは既に整合し、B2では変更しない。Lane B/Cはdownstream requirements完了までblockedである。PAY.JPはpaused fallbackで、Stripeも法務・公開義務を除去しない。Provider-specific Payment implementation must not begin before Human formal selection and separate implementation authorization.
