export type CustomerLegalSection = Readonly<{
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}>;

export const currentCustomerLegalFacts = {
  serviceName: "月の返事",
  productName: "恋のメッセージ鑑定ノート",
  formalClassification:
    "AIを活用した恋愛メッセージ分析・判断支援デジタルレポート",
  price: "税込980円",
  quantity: "1相談 / 1鑑定ノート",
  purchaseType: "都度払い",
  renewal: "自動更新なし",
  minimumAge: "18歳以上",
  paymentProvider: "Stripe",
} as const;

export const currentCustomerLegalNavigation = [
  { href: "/legal/terms", label: "利用規約" },
  { href: "/legal/privacy", label: "プライバシーポリシー" },
  { href: "/legal/refund", label: "返金方針" },
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/ai-disclosure", label: "AI利用について" },
  { href: "/legal/unsupported-cases", label: "対応できない相談" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export const currentProductFactRows = [
  { label: "サービス名", value: currentCustomerLegalFacts.serviceName },
  { label: "商品名", value: currentCustomerLegalFacts.productName },
  {
    label: "商品区分",
    value: currentCustomerLegalFacts.formalClassification,
  },
  { label: "販売価格", value: currentCustomerLegalFacts.price },
  { label: "数量", value: currentCustomerLegalFacts.quantity },
  {
    label: "購入形態",
    value: `${currentCustomerLegalFacts.purchaseType}・${currentCustomerLegalFacts.renewal}`,
  },
  { label: "対象年齢", value: currentCustomerLegalFacts.minimumAge },
] as const;

export const nonGuaranteeFacts = [
  "相手の本心を知ること",
  "返信が来ること",
  "復縁すること",
  "未来の出来事",
  "関係が改善すること",
] as const;

export const unusedMethods = [
  "タロット",
  "占星術",
  "霊感その他の超自然的な手法",
  "相手の心を読んだとする主張",
] as const;

export const termsSections: readonly CustomerLegalSection[] = [
  {
    title: "適用",
    paragraphs: [
      "この利用規約は、月の返事が提供する恋のメッセージ鑑定ノートの利用条件を定めます。申込みの前に、商品確認画面、返金方針、プライバシーポリシー、特定商取引法に基づく表記も確認してください。",
      "提供開始前、保守、障害その他の事情により、サービスの全部または一部を利用できない場合があります。利用できない状態は、購入や支払の完了を意味しません。",
    ],
  },
  {
    title: "サービスと商品",
    paragraphs: [
      `月の返事は、${currentCustomerLegalFacts.formalClassification}である「${currentCustomerLegalFacts.productName}」を提供するサービスです。利用者が入力した恋愛関係の状況やメッセージを整理・分析し、判断材料、文面案、短期的な行動案をデジタルレポートとしてまとめます。`,
      `商品は${currentCustomerLegalFacts.quantity}です。入力が短いことだけを理由に利用不可とはせず、追加確認は通常0回、本当に必要な場合のみ最大1回です。`,
    ],
  },
  {
    title: "利用資格",
    paragraphs: [
      `申込み時点で${currentCustomerLegalFacts.minimumAge}の方が利用できます。申込みでは、18歳以上であることを確認してください。`,
      "他人になりすました利用、他人のアカウントや決済手段の無断利用はできません。",
    ],
  },
  {
    title: "料金・支払・購入",
    paragraphs: [
      `販売価格は${currentCustomerLegalFacts.price}です。${currentCustomerLegalFacts.purchaseType}で、${currentCustomerLegalFacts.renewal}です。サブスクリプション、ポイント、回数券ではありません。`,
      `${currentCustomerLegalFacts.paymentProvider}の決済画面で支払手続きを行います。サーバーで支払完了を確認できた場合にのみ、支払済みの購入として扱います。同じ購入の回復・再開で再度の支払を求めることはありません。`,
      "インターネット接続に必要な通信費等は利用者の負担です。",
    ],
  },
  {
    title: "AIの利用と限界",
    paragraphs: [
      "相談内容の整理・分析と鑑定ノートの作成にAIを利用します。AIの出力には、誤り、不完全な内容、矛盾、利用者の状況に合わない内容が含まれることがあります。",
      "相手の本心、返信、復縁、未来、関係改善を断定・保証しません。タロット、占星術、霊感その他の超自然的な手法を使用せず、相手の心を読めるとは主張しません。",
      "出力は判断材料であり、最終的な判断と行動は利用者自身が行います。医療・心理・法律の専門家による助言の代わりではありません。",
    ],
  },
  {
    title: "入力内容と利用者の責任",
    paragraphs: [
      "相談に必要な範囲で、正確かつ自分が提供できる情報を入力してください。本名、住所、電話番号、勤務先・学校名、ログイン情報、正確な現在地、第三者の秘密など、分析に不要な情報は入力しないでください。",
      "鑑定ノートを参考にする場合も、相手の意思、プライバシー、明示された境界を尊重してください。",
    ],
  },
  {
    title: "禁止事項",
    paragraphs: [
      "安全、他者の権利、決済およびサービス運営を守るため、次の行為を禁止します。",
    ],
    bullets: [
      "自傷・他害、暴力、脅迫、強要、待ち伏せ、ストーカー行為を促進する利用",
      "監視、不正ログイン、位置やアカウントの特定、個人情報のさらし、明示された連絡拒否の回避を目的とする利用",
      "違法行為、第三者の権利侵害、未成年者との不適切な関係を目的とする利用",
      "不正決済、他人名義の決済、サービスへの不正アクセス、過度な自動送信その他の運営妨害",
      "鑑定ノートの販売、無断の全文再配布、秘密情報やセキュリティ情報の抽出",
    ],
  },
  {
    title: "安全上対応できない相談",
    paragraphs: [
      "緊急性、自傷・他害、暴力、強い恐怖、嫌がらせ、ストーカー行為、明示された境界の回避、違法行為などを含む相談は、通常の恋愛メッセージ鑑定として扱いません。安全に提供できることを確認できない場合は、支払前に停止します。",
      "月の返事は緊急支援、医療、心理支援、警察、法律相談その他の専門サービスの代わりではありません。",
    ],
  },
  {
    title: "鑑定ノートの受取りと利用",
    paragraphs: [
      "支払確認後の鑑定ノートは、利用者本人に結び付いた保護された結果画面で提供し、必要な場合は確認済みのメールアドレスへ受取りに関する通知を送ります。アカウントや結果へのアクセス情報を第三者と共有しないでください。",
      "鑑定ノートは個人の判断材料として利用してください。法令上認められる引用等を除き、販売や無断の全文再配布はできません。",
    ],
  },
  {
    title: "提供の停止・制限",
    paragraphs: [
      "保守、障害、セキュリティ上の必要、外部サービスの停止、法令への対応、禁止事項への対応など合理的な理由がある場合、サービスの全部または一部を停止・制限することがあります。",
      "支払済みの購入がある場合は、同じ購入の範囲で安全な回復と履行を試み、重複して請求しません。安全かつ有効な履行ができない場合は、返金方針に従って個別に対応します。",
    ],
  },
  {
    title: "返金・取消し",
    paragraphs: [
      "決済が完了していない場合は料金は発生しません。重複請求、誤額、誤った購入への請求、または支払後に鑑定ノートを安全に提供できない場合は、購入記録と処理状況を確認して回復または是正します。",
      "自動返金や固定の処理日数は約束していません。詳細は返金方針を確認してください。法令上排除できない利用者の権利を制限しません。",
    ],
  },
  {
    title: "プライバシー",
    paragraphs: [
      "相談内容、アカウント、支払確認、鑑定ノート、配信などに関する情報は、プライバシーポリシーに従って取り扱います。相談入力欄には、分析に不要な個人情報や第三者の秘密を入力しないでください。",
    ],
  },
  {
    title: "規約の変更とお問い合わせ",
    paragraphs: [
      "サービス内容や法令等の変更に応じて、この規約を変更することがあります。利用者に重要な影響がある変更は、内容と適用時期が分かる方法で案内し、合理的な理由なく遡って不利益に適用しません。",
      "現在利用できる受付方法は、お問い合わせページで案内します。",
    ],
  },
];

export const unsupportedCaseCategories = [
  "今すぐの危険、自傷・他害、暴力、DV、強い恐怖がある相談",
  "脅迫、強要、待ち伏せ、嫌がらせ、ストーカー行為を助ける相談",
  "相手が示した連絡拒否や境界を回避・突破する方法を求める相談",
  "監視、不正ログイン、位置やアカウントの特定、個人情報のさらしを求める相談",
  "未成年者との不適切な関係、違法行為、第三者の権利侵害を含む相談",
  "診断、治療、法的判断その他、医療・心理・法律等の専門的判断を求める相談",
] as const;
