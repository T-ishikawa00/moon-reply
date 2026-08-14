export type ReviewStatusCategory =
  | "運営者判断待ち"
  | "外部証拠待ち"
  | "専門家確認待ち"
  | "内部方針決定済み・実装証拠待ち";

export type ReviewDecision = {
  label: string;
  summary: string;
  status: ReviewStatusCategory;
  decisionIds?: readonly string[];
};

export type LegalReviewSection = {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
  decisions?: readonly ReviewDecision[];
};

export const stripeLaneBReviewAuthority = {
  acceptedB2Status:
    "stripe_lane_b_legal_draft_finalization_human_chatgpt_accepted_complete",
  acceptedB3Status:
    "stripe_lane_b_b3_review_ready_website_public_surface_human_visual_chatgpt_accepted_complete",
  acceptanceDate: "2026-08-14",
  humanVisualQa: "complete",
  humanVisualQaOutcome: "PASS",
  chatgptReview: "complete",
  chatgptReviewOutcome: "PASS",
  humanAcceptance: "complete",
  b3Acceptance: "complete",
  nextWork: "Stripe Lane B deployment readiness (B4a)",
  nextWorkScope: "planning/readiness only",
  legalPublicationApproved: false,
  stripeApprovalEstablished: false,
  paymentImplemented: false,
  productionPaymentAuthorized: false,
} as const;

export const stripeLaneB4aDeploymentReadinessAuthority = {
  acceptedStatus:
    "stripe_lane_b_b4a_netlify_primary_hosting_direction_human_chatgpt_accepted_complete",
  acceptanceDate: "2026-08-14",
  baseline: "40fcd2dea5328f690451b46ef0613655f1c9fd04",
  acceptedB3Status: stripeLaneBReviewAuthority.acceptedB3Status,
  hostingDirectionState: "human_chatgpt_accepted_complete",
  chatgptReview: "complete",
  chatgptReviewOutcome: "PASS",
  humanAcceptance: "complete",
  b4aAcceptance: "complete",
  reviewDeploymentProvider: "Netlify",
  firstB4bReviewDeploymentAttempt: "Netlify",
  initialReviewPlan: "Netlify Free",
  staticHostingCompatibility: "A",
  netlifyBuildRuntimeCompatibility: "unproven",
  hardGate: "not_proven",
  b4bEvidence: "not_acquired",
  freePlanScope: "review_evidence_only",
  paidProductionHostingDirection: "provisional",
  paidProductionPlan: "unresolved",
  cloudflareFallback:
    "low_cost_infrastructure_fallback_pending_runtime_proof",
  vercelFallback: "paid_simplicity_fallback",
  domainSelection: "none",
  legalPublicationApproved: false,
  deploymentAuthorized: false,
  b4bExternalWorkAuthorized: false,
  productionAssessmentRuntimeEnabled: false,
  productionPurchaseEligibilityRuntimeEnabled: false,
  paymentImplemented: false,
  productionPaymentAuthorized: false,
  stripeFeasibility: "not_established",
  stripeAccountContactSubmission: "absent / none / none",
  stripeApprovalActivation: "absent / absent",
  formalStripeSelection: "incomplete",
  currentWork: "Stripe Lane B stable review URL deployment (B4b)",
  currentWorkAuthority: "separately_authorized_external_work",
} as const;

export const legalNavigationItems = [
  { href: "/legal", label: "法務・開示 審査ハブ" },
  { href: "/legal/terms", label: "利用規約" },
  { href: "/legal/privacy", label: "プライバシー" },
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/refund", label: "返金方針" },
  { href: "/legal/ai-disclosure", label: "AI利用説明" },
  { href: "/legal/unsupported-cases", label: "通常鑑定対象外" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export const reviewContextLinks = [
  { href: "/", label: "トップ" },
  { href: "/review", label: "審査用プレビュー一覧" },
  { href: "/review/purchase/confirmation/normal-001", label: "購入前確認" },
  { href: "/sample-report", label: "架空サンプル" },
  { href: "/review/result/result-normal-001", label: "Web鑑定ノート見本" },
  { href: "/review/save-report/result-normal-001", label: "保存用鑑定書見本" },
] as const;

export const fixedProductFacts = [
  { label: "サービス名", value: "月の返事" },
  {
    label: "サービス分類",
    value: "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート",
  },
  { label: "利用者向け商品名", value: "恋のメッセージ鑑定ノート" },
  { label: "販売価格", value: "税込980円" },
  { label: "商品数量", value: "1相談 / 1鑑定ノート" },
  { label: "購入形態", value: "一度きりの購入・自動更新なし" },
  {
    label: "対象年齢",
    value: "18歳以上・必須確認「私は18歳以上です」",
  },
  { label: "AI利用", value: "AI利用を明示" },
  {
    label: "分析方法",
    value: "タロット、占星術、生年月日分析、霊感その他の占術・超自然的手法を使用しない",
  },
  {
    label: "非保証",
    value: "相手の本心、返信、復縁、未来または関係改善を保証しない",
  },
  { label: "専門サービスとの境界", value: "医療・心理・法律上の助言ではない" },
  {
    label: "安全確認",
    value:
      "安全確認を通常の有料鑑定より前に行い、利用資格を確認できない間は決済・通常鑑定ノート・メッセージ案へ進めない",
  },
] as const;

export const legalPageInventory = [
  {
    href: "/legal",
    name: "法務・開示 審査ハブ",
    purpose: "B2の受入済み方針、受入済みB3レビュー実装、未完了の公開準備を横断確認する",
    unresolved: "運営者・外部事業者・商取引・プライバシー・日付・Human公開承認",
  },
  {
    href: "/legal/terms",
    name: "利用規約 審査表示",
    purpose: "既存規約ドラフトの条項順序と未決定箇所を確認する",
    unresolved: "運営主体、契約成立、支払、提供、返金、権利、変更、管轄、問い合わせ",
  },
  {
    href: "/legal/privacy",
    name: "プライバシー 審査表示",
    purpose: "将来の取得・処理計画と、現在は内部レビュー処理が行われる場合がある一方、本番の外部処理は未稼働である境界を区別する",
    unresolved: "外部事業者、データフロー、処理地域、保存期間、請求手続、Cookie",
  },
  {
    href: "/legal/tokushoho",
    name: "特商法表記 審査表示",
    purpose: "完成前の開示項目、固定値、未決定値を行単位で確認する",
    unresolved: "販売事業者、責任者、所在地、電話、連絡先、支払、提供、返金、動作環境",
  },
  {
    href: "/legal/refund",
    name: "返金方針 審査表示",
    purpose: "通常返金と意図しない請求の是正を分けて確認する",
    unresolved: "決済事業者条件、最新の法的義務、処理方法、本人確認、実装",
  },
  {
    href: "/legal/ai-disclosure",
    name: "AI利用説明 審査表示",
    purpose: "AIの役割、限界、将来の最小化設計、現在の非稼働を確認する",
    unresolved: "AI事業者、エンドポイント、処理地域、保持条件、アカウント設定、送信内容の実装",
  },
  {
    href: "/legal/unsupported-cases",
    name: "通常鑑定対象外 審査表示",
    purpose: "安全を優先する停止境界と落ち着いた説明を確認する",
    unresolved: "公式支援情報の検証、将来運用、サーバー側強制、障害時対応",
  },
  {
    href: "/contact",
    name: "お問い合わせ 準備表示",
    purpose: "6分類の予定窓口と送信禁止情報を、受付機能なしで確認する",
    unresolved: "事業用メール、フォームURL、返信目安、運営者、本人確認、販売事業者情報の開示経路",
  },
] as const;

export const publicationReadiness: readonly ReviewDecision[] = [
  {
    label: "運営者情報",
    summary: "運営形態、法的氏名、屋号、責任者、連絡先が未確定です。",
    status: "運営者判断待ち",
    decisionIds: ["OP-001", "OP-002", "OP-003", "OP-004", "OP-007", "OP-008", "OP-009"],
  },
  {
    label: "販売事業者情報の表示・開示経路",
    summary: "住所・電話を含む実情報と、購入前に利用できる適法な表示または開示経路が未完成です。",
    status: "運営者判断待ち",
    decisionIds: ["OP-005", "OP-006", "OP-007", "OP-008"],
  },
  {
    label: "Stripe・決済条件",
    summary: "Stripeの承認・正式選定は確認されておらず、支払方法、支払時期、提供時間、返金実行方法の外部証拠もありません。",
    status: "外部証拠待ち",
    decisionIds: ["OP-010", "OP-011", "OP-012", "OP-013", "OP-014"],
  },
  {
    label: "商取引条件",
    summary: "契約成立、提供、返金、再送、結果URLの条件は公開用に確定していません。",
    status: "運営者判断待ち",
    decisionIds: ["OP-013", "OP-014", "OP-026", "OP-027"],
  },
  {
    label: "プライバシー・データフロー",
    summary: "処理地域、保存期間、削除、外部処理、Cookie・analyticsを実装証拠と照合できていません。",
    status: "外部証拠待ち",
    decisionIds: ["OP-018", "OP-020", "OP-021", "OP-022", "OP-023", "OP-024", "OP-025", "OP-028"],
  },
  {
    label: "最新の公式情報・実仕様との照合",
    summary: "適用される法的義務、公式一次情報、実際のサービス・外部事業者仕様との最終照合が未完了です。専門家相談は必要に応じた任意のエスカレーションです。",
    status: "外部証拠待ち",
    decisionIds: ["OP-032"],
  },
  {
    label: "施行日・最終更新日",
    summary: "施行日と最終更新日は未確定です。画面実装日を代用しません。",
    status: "運営者判断待ち",
  },
  {
    label: "最終Human公開承認",
    summary: "公開対象ファイルと最終文言の明示承認はありません。",
    status: "運営者判断待ち",
  },
];

export const termsReviewSections: readonly LegalReviewSection[] = [
  {
    title: "第1条・適用",
    paragraphs: [
      "この表示は、月の返事の利用条件を検討するための公開前構成です。現時点で利用契約の条件として公開・適用されるものではありません。",
      "利用規約、申込画面、最終確認画面、特商法表記、プライバシー、返金方針その他の個別表示の関係と優先順位は、実際の申込フロー確定後に最終化します。",
    ],
    decisions: [
      { label: "運営主体", summary: "契約主体となる法的氏名と屋号は未確定です。", status: "運営者判断待ち", decisionIds: ["OP-001", "OP-002", "OP-003"] },
      { label: "文書間の優先順位", summary: "最新の公式情報、実際の申込フロー、他文書との整合確認が必要です。専門家相談は必要に応じた任意のエスカレーションです。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
    ],
  },
  {
    title: "第2条・サービス内容",
    paragraphs: [
      "月の返事は、AIを活用して利用者が入力した恋愛関係の状況とメッセージを整理・分析し、判断材料、文面案、短期的な行動案を恋のメッセージ鑑定ノートとして提供する予定のデジタルレポートです。",
      "エンターテインメントおよび情報提供、感情整理、メッセージ分析、意思決定支援を目的とし、1相談につき1鑑定ノートを提供します。相手の本心、返信、復縁、未来、関係改善を保証せず、医療・心理・法律上の助言ではありません。",
      "タロット、占星術、生年月日分析、数秘術、霊感その他の占術・超自然的手法または外部調査は使用しません。",
    ],
  },
  {
    title: "第3条・利用資格",
    paragraphs: [
      "初期提供の対象は申込み時点で18歳以上の方です。必須の専用チェックボックス「私は18歳以上です」により、18歳以上であることを自己申告します。",
      "年齢適格性の確認だけを目的として年齢層、生年月日または身分証明書を収集しません。将来の有料フローでは、この成人確認が有効であることをサーバー側でも支払操作より前に確認する必要がありますが、現在は未実装です。この方式は厳格な本人確認ではありません。",
    ],
    decisions: [
      { label: "本番年齢ゲート", summary: "内部方針は決定済みですが、サーバー側の実装証拠はありません。", status: "内部方針決定済み・実装証拠待ち" },
    ],
  },
  {
    title: "第4条・申込み",
    paragraphs: [
      "申込前に、入力内容、成人確認、安全確認結果、商品内容、料金、提供条件、返金条件、同意事項を確認する構成です。入力、成人確認、安全確認、通常鑑定対象外ケースの停止、配信・回復用メールアドレスの確認、購入内容確認、最終確認、支払操作の順を予定しています。",
      "通常の有料鑑定を安全に提供できることが確認されない相談は決済へ進めず、通常の恋愛鑑定ノートやメッセージ案を生成しません。追加情報や確認が必要な場合も、確認が完了するまでは同様です。待つこと、今は送らないこと、一時的に連絡を控えること、相手の境界を尊重することだけを理由に、当然に利用不可とは扱いません。支払前は入力修正または中止ができる構成です。",
    ],
    decisions: [
      { label: "契約成立時点", summary: "決済仕様と実装方式の外部証拠がなく、確定していません。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-012"] },
      { label: "有料鑑定へ進む条件", summary: "成人確認、配信・回復用メールの確認、安全上の利用資格をサーバー側で確認する方針は受入済みですが、本番実装は未完了です。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-034"] },
    ],
  },
  {
    title: "第5条・料金および支払",
    paragraphs: [
      "販売価格は税込980円、1購入は1相談に対する1鑑定ノート、一度きりの購入で自動更新はありません。サブスクリプション、コイン、ポイント、回数券は初期提供では扱いません。",
      "商品代金以外の必要料金は、通信費等の利用者負担を含め、公開前の最終表示確認が必要です。",
    ],
    decisions: [
      { label: "支払方法・支払時期・決済事業者", summary: "いずれも未選定・未確定です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-011", "OP-012"] },
    ],
  },
  {
    title: "第6条・提供および納品",
    paragraphs: [
      "保護されたWeb上の結果ページで鑑定ノートを提供し、適用される確認済みの配信・回復用メールアドレスへ結果ページURLを通知する方法を予定しています。現在の審査環境では生成、保存、通知、納品を行いません。",
      "結果URLの有効期限・失効・再発行、誤ったメールアドレスの所有確認・訂正・安全な再送方法は未決定です。商品または技術上の障害では同じ購入の範囲で限定的に復旧し、再課金しません。安全かつ有効な履行が不可能な場合は税込980円を全額返金する方向ですが、いずれも未実装です。結果通知と任意のマーケティングメールは区別し、マーケティング同意を購入条件にしません。",
    ],
    decisions: [
      { label: "提供時期", summary: "実測と運用判断がなく、確定した時間はありません。", status: "外部証拠待ち", decisionIds: ["OP-013"] },
      { label: "結果URL・再送", summary: "失効、再発行、本人確認、訂正手続が未決定です。", status: "運営者判断待ち", decisionIds: ["OP-026", "OP-027", "OP-028"] },
    ],
  },
  {
    title: "第7条・入力内容",
    paragraphs: [
      "相談本文には、本名、住所、電話番号、メールアドレス、勤務先・学校名、相手のフルネーム、SNS ID、ログイン情報、パスワード、正確な現在地、第三者の秘密情報、スクリーンショットを入力しないよう求めます。",
      "入力検知は個人情報が含まれないことを保証しません。検知結果を示さずに入力文を自動改変する設計は採用しません。第三者の権利とプライバシーに配慮する条文は、利用者へ過度な保証を求めず、運営者の責任を全面的に転嫁しない形で最終確認します。",
    ],
    decisions: [
      { label: "入力責任条項", summary: "最新の公式情報と利用者の権利に照らし、責任転嫁にならない最終文言の確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
    ],
  },
  {
    title: "第8条・禁止事項",
    paragraphs: ["安全、権利保護、サービス保全のため、次の行為を禁止する構成です。"],
    bullets: [
      "自傷・他害の促進、脅迫、強要、待ち伏せ、ストーカー行為、相手の家・職場への押しかけ",
      "監視、不正ログイン、アカウント・居場所の確認、個人情報晒し、第三者の秘密情報の不当利用",
      "未成年との不適切な恋愛・面会、違法行為、第三者の権利侵害、不正決済・他人名義決済・チャージバック濫用。ただし、正当な返金請求、意図しない請求の申告、適法な異議申立てを妨げません",
      "サービス運営の妨害、鑑定ノートの販売・再配布、自動収集、リバースエンジニアリング、内部プロンプト・秘密情報・セキュリティ情報の抽出",
    ],
  },
  {
    title: "第9条・通常鑑定対象外",
    paragraphs: [
      "自傷、他害、DV・暴力・強い恐怖、待ち伏せ、脅迫、監視、不正ログイン、個人情報晒し、未成年との不適切な恋愛・面会、違法行為その他の安全上の問題を含む相談は通常鑑定の対象外です。",
      "原則として決済前に停止し、通常の恋愛鑑定ノートやメッセージ案を生成しません。サービス側の検知漏れ等により決済後に判明した場合は生成を停止し、通常の取消ではなく意図しない請求の是正（Payment Integrity）として、実際の経済的な誤りを980円を上限とせず是正する方向です。この処理は未実装です。月の返事は緊急支援サービスではありません。",
    ],
    decisions: [
      { label: "公式支援情報", summary: "対象地域、用途、公式source、確認日の証拠がありません。", status: "外部証拠待ち", decisionIds: ["OP-033"] },
    ],
  },
  {
    title: "第10条・AI利用",
    paragraphs: [
      "鑑定ノートの生成にAIを利用する予定です。AI出力には誤り、不完全な内容、状況に適さない内容が含まれる可能性があります。",
      "AIは相手の真意を確認できず、人間の専門家による診断、治療、心理支援、法律上の助言を提供しません。重要な判断を出力だけに依存せず、最終判断は利用者自身が行う構成です。",
      "将来AIへ送る情報は生成に必要な最小限とし、メールアドレス、決済識別子、内部トークン等の直接識別子を送らない方針です。入力上の事実、推論、不確実性を区別する方針です。",
    ],
    decisions: [
      { label: "AI事業者・利用経路", summary: "事業者、エンドポイント、契約、アカウント設定は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-015", "OP-016", "OP-017"] },
    ],
  },
  {
    title: "第11条・鑑定書の利用",
    paragraphs: [
      "鑑定ノートは個人的かつ非商用の目的で閲覧・保存できる方向です。販売、再配布、全文の公開を禁止する構成を検討しています。",
      "AI生成物に権利が必ず発生すると断定しません。権利が存在する範囲で個人的利用を許諾する構成を検討し、引用・一部共有の範囲と権利帰属は確定前です。",
    ],
    decisions: [
      { label: "引用・共有・権利", summary: "許可範囲と法的構成は、最新の公式情報と実際の提供条件との照合前です。", status: "外部証拠待ち", decisionIds: ["OP-035", "OP-032"] },
    ],
  },
  {
    title: "第12条・返金およびキャンセル",
    paragraphs: [
      "決済前は料金が発生しません。決済成功後でも、鑑定ノートの生成開始前であることをシステム上の記録から客観的に確認できる取消は、税込980円を全額返金する通常返金の方向です。生成、保存または配信の失敗では同じ購入の範囲で復旧し、再課金せず、安全かつ有効な履行が不可能なら税込980円を全額返金します。これらの判定と実行は未実装です。",
      "正常に提供した後は内容への不満だけを理由とする返金を原則対象外とする方向ですが、法令上の権利や重大な商品・サービス上の不具合への救済を排除しません。重複請求、誤額、誤った利用者・相談への請求、安全確認のすり抜けその他の意図しない請求は通常返金とは分け、Payment Integrityとして実際の経済的な誤りを980円を上限とせず是正します。全面免責や一切返金しない条項は設けません。",
    ],
    decisions: [
      { label: "返金条件・実行方法", summary: "最新の法的義務と決済事業者の実仕様を確認後に最終化します。返金実行機能はありません。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014", "OP-032"] },
    ],
  },
  {
    title: "第13条・サービス停止・変更・終了",
    paragraphs: [
      "保守、障害、外部事業者の停止、セキュリティ、法令・規約対応その他の合理的理由がある場合に、全部または一部を停止・変更する構成です。",
      "支払済みの申込みを安全かつ有効に履行できない場合は、同じ購入の範囲で復旧し、再課金せず、復旧不能なら税込980円を全額返金する方向です。終了時の告知、未履行申込み、保存済み結果の取扱いは未決定です。利用者の利益を不当に害する一方的な条項とならないよう確認します。",
    ],
    decisions: [
      { label: "停止・終了時の取扱い", summary: "告知と未履行・保存結果の扱いが未決定です。", status: "運営者判断待ち" },
      { label: "条項の妥当性", summary: "最新の公式情報、実際のサービス挙動、利用者の権利との整合確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
    ],
  },
  {
    title: "第14条・非保証および責任制限",
    paragraphs: [
      "相手の本心、返信、復縁、未来、関係改善、意思決定結果または特定の効果を保証しません。出力は利用者の意思決定を代替しません。",
      "故意または重過失を含めた全面免責は設けません。責任制限の範囲、損害区分、強行法規との関係は確定していません。",
    ],
    decisions: [
      { label: "責任制限", summary: "消費者契約法等の最新の公式情報との整合確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
    ],
  },
  {
    title: "第15条・個人情報",
    paragraphs: ["個人情報等の取扱いはプライバシー審査表示を基礎とし、実装、外部事業者、保存期間、法的整理を確定した後に公開用文面を作成します。"],
    decisions: [
      { label: "プライバシー実装照合", summary: "現在は計画表示で、本番データフローの証拠はありません。", status: "外部証拠待ち", decisionIds: ["OP-018", "OP-022", "OP-023", "OP-024", "OP-025", "OP-028"] },
    ],
  },
  {
    title: "第16条・規約変更",
    paragraphs: ["変更条件、告知方法、効力発生時期、重大な変更の取扱いは未決定です。利用者へ不利益となる変更を合理的根拠なく遡って適用しない方針とし、実装と最新の法的義務を確認後に最終化します。"],
    decisions: [
      { label: "変更条項", summary: "利用者の権利義務への影響を含め、最新の公式情報との整合確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
    ],
  },
  {
    title: "第17条・準拠法・管轄",
    paragraphs: ["準拠法は日本法とする方向です。第一審の管轄裁判所は確定しておらず、確定条項として表示しません。"],
    decisions: [
      { label: "管轄裁判所", summary: "運営主体、所在地、最新の法的義務を踏まえた最終確認が必要です。", status: "外部証拠待ち", decisionIds: ["OP-030", "OP-032"] },
    ],
  },
  {
    title: "第18条・問い合わせ",
    paragraphs: ["一つの運用可能な事業用メールボックスと、一つのカテゴリ分けされた問い合わせフォームを使用する方向です。カテゴリは、結果URL・未着・配信、通常の取消・返金、意図しない請求の是正（Payment Integrity）、プライバシー・削除・開示、販売事業者情報の開示請求、その他の6分類です。実際のメール、フォームURL、返信目安は未決定で、現在は受付機能や連絡先を提供しません。"],
    decisions: [
      { label: "問い合わせ窓口", summary: "実在性、受信可否、権限、運用体制を確認できていません。", status: "運営者判断待ち", decisionIds: ["OP-007", "OP-008", "OP-009"] },
    ],
  },
];

export const tokushohoFixedRows = [
  { label: "販売価格", value: "1鑑定につき税込980円" },
  { label: "商品数量", value: "1相談につき1鑑定ノート" },
  { label: "購入形態", value: "一度きりの購入" },
  { label: "自動更新", value: "なし" },
  {
    label: "対象年齢",
    value: "18歳以上・必須確認「私は18歳以上です」",
  },
  {
    label: "商品・AI利用・非保証",
    value: "AIを活用した恋愛メッセージ分析・判断支援デジタルレポートです。AI利用を明示し、相手の本心、返信、復縁、未来、関係改善を保証せず、医療・心理・法律上の助言ではありません。",
  },
] as const;

export const tokushohoUnresolvedRows: readonly ReviewDecision[] = [
  { label: "販売事業者の法的名称", summary: "実在する契約主体の名称が未確定です。", status: "運営者判断待ち", decisionIds: ["OP-001", "OP-002", "OP-003"] },
  { label: "運営責任者", summary: "公開する責任者の実情報が未確定です。", status: "運営者判断待ち", decisionIds: ["OP-004"] },
  { label: "所在地", summary: "実情報と表示方法が未確定です。省略可否や特定の住所形態の利用可否を断定しません。", status: "運営者判断待ち", decisionIds: ["OP-005"] },
  { label: "電話番号", summary: "実番号と表示方法が未確定です。省略できるとの主張はしません。", status: "運営者判断待ち", decisionIds: ["OP-006"] },
  { label: "サポート用メール", summary: "実在性・受信可否・権限を確認した事業用メールボックスはありません。", status: "運営者判断待ち", decisionIds: ["OP-007"] },
  { label: "問い合わせフォームURL", summary: "稼働する受付URLと入力・プライバシー設計は未確定です。", status: "運営者判断待ち", decisionIds: ["OP-008"] },
  { label: "返信目安", summary: "対応体制と実現可能な目安が未確定です。", status: "運営者判断待ち", decisionIds: ["OP-009"] },
  { label: "決済事業者", summary: "選定・承認済みの事業者はありません。", status: "外部証拠待ち", decisionIds: ["OP-010"] },
  { label: "支払方法", summary: "利用可能な方法を示す外部証拠がありません。", status: "外部証拠待ち", decisionIds: ["OP-011"] },
  { label: "支払時期", summary: "契約成立・売上確定・画面表示との関係が未確定です。", status: "外部証拠待ち", decisionIds: ["OP-012"] },
  { label: "提供時期", summary: "生成・保存・通知フローの実測がなく、確定していません。", status: "外部証拠待ち", decisionIds: ["OP-013"] },
  { label: "決済事業者による返金実行方法", summary: "通常返金と意図しない請求の是正について、利用可能な操作、条件、完了時点はいずれも未確認です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014", "OP-032"] },
];

export const ordinaryRefundCases: readonly ReviewDecision[] = [
  { label: "決済前", summary: "料金は発生せず、申込みを中止できます。実際の決済機能はありません。", status: "内部方針決定済み・実装証拠待ち" },
  { label: "決済成功後・鑑定ノートの生成開始前", summary: "生成開始前であることをシステム上の記録から客観的に確認できる取消は、税込980円を全額返金する方向です。判定・実行機能は未実装です。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-010", "OP-014"] },
  { label: "生成・保存・配信などの商品／技術上の障害", summary: "同じ購入の範囲で限定的に復旧し、再課金しません。安全かつ有効な履行が不可能なら税込980円を全額返金する方向です。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-014"] },
  { label: "正常に提供済み", summary: "内容への不満だけは原則として通常返金の対象外とする方向です。ただし、法令上の権利や重大な商品・サービス上の不具合への救済を排除しません。", status: "外部証拠待ち", decisionIds: ["OP-032"] },
  { label: "メール誤り・結果URL紛失", summary: "所有確認後、同じ購入の範囲で安全な訂正・再発行を優先する方向です。本人確認と再発行の方法は未決定です。", status: "運営者判断待ち", decisionIds: ["OP-026", "OP-027", "OP-028"] },
];

export const paymentIntegrityCases: readonly ReviewDecision[] = [
  { label: "重複請求", summary: "重複した意図しない実際の経済額を是正します。税込980円を是正の上限にしません。実行方法は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014"] },
  { label: "誤った金額", summary: "正しい購入条件との差額を含め、実際の経済的な誤りを是正します。通常返金の上限は適用しません。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014"] },
  { label: "誤った利用者・相談への請求", summary: "対象を取り違えた意図しない請求を特定し、実際の経済的な誤りを是正する方向です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014"] },
  { label: "安全確認のすり抜け", summary: "通常鑑定ノートとメッセージ案の生成を停止し、通常の取消候補ではなく、意図しない請求として実際の経済的な誤りを是正します。税込980円を是正の上限にしません。", status: "内部方針決定済み・実装証拠待ち", decisionIds: ["OP-034"] },
  { label: "その他の意図しない請求", summary: "原因と実際の影響額を確認し、利用者を正当な購入額を超える負担に残さない方向です。返金・取消等の具体的な操作は未確定です。", status: "外部証拠待ち", decisionIds: ["OP-010", "OP-014"] },
];

export const unsupportedCaseCategories = [
  "自分を傷つけたい気持ちがある相談",
  "相手を傷つけたい気持ちがある相談",
  "DV、暴力、強い恐怖または虐待を含む相談",
  "待ち伏せを考えている相談",
  "相手の家や職場へ行こうとしている相談",
  "脅迫または強要を含む相談",
  "相手を監視しようとする相談",
  "相手のアカウントへの不正ログインまたはログイン確認を含む相談",
  "相手の居場所を確認または追跡しようとする相談",
  "本名、住所その他の個人情報を晒そうとする相談",
  "未成年との不適切な恋愛または面会を進める相談",
  "違法行為を含み、または助長する相談",
  "第三者の秘密情報を含む相談",
] as const;

export const contactUnresolvedRows: readonly ReviewDecision[] = [
  { label: "一つの事業用メールボックス", summary: "実在性、受信可否、権限を確認した事業用メールはありません。", status: "運営者判断待ち", decisionIds: ["OP-007"] },
  { label: "一つのカテゴリ分けされたフォーム", summary: "稼働URL、入力項目、プライバシー取扱い、送信先は未確定です。", status: "運営者判断待ち", decisionIds: ["OP-008"] },
  { label: "返信目安", summary: "対応体制と実現可能な返信目安が未確定です。", status: "運営者判断待ち", decisionIds: ["OP-009"] },
  { label: "運営者", summary: "運営形態と法的氏名は未確定です。", status: "運営者判断待ち", decisionIds: ["OP-001", "OP-002"] },
  { label: "本人確認方法", summary: "結果URL再発行、メール訂正、プライバシー請求時の本人確認と監査方法は未決定です。", status: "運営者判断待ち", decisionIds: ["OP-027", "OP-028"] },
  { label: "販売事業者情報の開示経路", summary: "実在する購入前の受付経路がないため、法務公開を止める項目です。法令と実際のStripe要件が許す場合に限る条件付き方向で、現在は利用できません。", status: "運営者判断待ち", decisionIds: ["OP-005", "OP-006", "OP-008"] },
];

export const plannedContactCategories = [
  "結果URL・配信・未着",
  "通常の取消・返金",
  "Payment Integrity・意図しない請求",
  "プライバシー・削除・開示",
  "販売事業者情報の開示請求",
  "その他",
] as const;

export const contactDoNotSend = [
  "パスワード",
  "ログイン情報",
  "カード番号全文・セキュリティコード",
  "鑑定本文の全文",
  "不要な本名・住所・電話番号",
  "第三者の秘密情報",
] as const;
