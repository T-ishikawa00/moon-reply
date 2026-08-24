import type { Metadata } from "next";
import Link from "next/link";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
  LegalFactRows,
} from "@/components/legal/LegalDocument";
import {
  currentCustomerLegalNavigation,
  currentProductFactRows,
} from "@/lib/legal/current-content";

export const metadata: Metadata = {
  title: "ご利用にあたって | 月の返事",
  description: "月の返事の利用規約、プライバシー、返金、AI利用などのご案内です。",
};

const descriptions: Record<(typeof currentCustomerLegalNavigation)[number]["href"], string> = {
  "/legal/terms": "サービスの内容、料金、利用条件、安全上の境界を説明します。",
  "/legal/privacy": "相談、アカウント、決済、AI処理などの情報の取扱いを説明します。",
  "/legal/refund": "支払状況、誤請求、提供できない場合などの対応を説明します。",
  "/legal/tokushoho": "販売価格、支払方法など現在の販売条件を案内します。",
  "/legal/ai-disclosure": "AIの役割、限界、利用者自身の判断との関係を説明します。",
  "/legal/unsupported-cases": "安全上、通常の恋愛メッセージ鑑定として対応できない相談を説明します。",
  "/contact": "現在のお問い合わせ窓口の状態を案内します。",
};

export default function LegalIndexPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal">
      <CustomerLegalHeader
        title="ご利用にあたって"
        description="月の返事の利用条件、情報の取扱い、返金、AI利用、安全上の境界をご案内します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="購入の前にご確認ください">
          <p>
            月の返事は、税込980円の都度払いで、1相談につき1鑑定ノートを提供します。自動更新はありません。
          </p>
          <p>
            提供開始前、保守、障害その他の事情により利用できない場合があります。利用できない状態は購入や支払の完了を意味しません。
          </p>
        </CustomerNotice>

        <LegalContentSection title="商品について">
          <LegalFactRows facts={currentProductFactRows} />
        </LegalContentSection>

        <LegalContentSection title="文書一覧" tone="ivory">
          <ol className="legal-index-list">
            {currentCustomerLegalNavigation.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{descriptions[item.href]}</small>
                  </span>
                  <b aria-hidden="true">→</b>
                </Link>
              </li>
            ))}
          </ol>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
