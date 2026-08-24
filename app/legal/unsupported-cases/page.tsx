import type { Metadata } from "next";
import Link from "next/link";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";
import { unsupportedCaseCategories } from "@/lib/legal/current-content";

export const metadata: Metadata = {
  title: "対応できない相談 | 月の返事",
  description: "安全上、通常の恋愛メッセージ鑑定として対応できない相談を説明します。",
};

export default function UnsupportedCasesPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/unsupported-cases">
      <CustomerLegalHeader
        title="対応できない相談"
        description="相談した方を責めず、安全上の問題を恋愛の駆け引きや連絡の後押しに変えないための境界です。"
      />
      <div className="legal-document-body legal-document-body--care">
        <CustomerNotice title="安全に提供できることを支払前に確認します">
          <p>
            安全上の問題を含む場合は通常の鑑定を停止します。安全に提供できることを確認できないまま、通常の鑑定ノートやメッセージ案を作成したり、支払へ進めたりしません。
          </p>
        </CustomerNotice>

        <LegalContentSection title="通常の鑑定で対応できない内容">
          <ul className="legal-plain-list legal-plain-list--care">
            {unsupportedCaseCategories.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </LegalContentSection>

        <LegalContentSection title="追加確認が必要な場合" tone="ivory">
          <p>
            安全な判断に必要な情報が不足している場合は、最大1回だけ確認することがあります。確認が必要であることと、利用できないことは同じではありません。安全に再評価できれば通常の鑑定へ進める場合があります。
          </p>
          <p>
            待つこと、今は送らないこと、一時的に連絡を控えること、相手の境界を尊重することだけを理由に利用不可とは扱いません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="緊急時・専門的な判断" tone="night">
          <p>
            月の返事は緊急支援、警察、医療、心理支援、法律相談、公的相談窓口の代わりではなく、緊急対応を行いません。差し迫った危険がある場合は、このサービスの回答を待たず、身近な信頼できる人や地域の適切な緊急・専門窓口へ直接つながってください。
          </p>
          <p>
            対象地域や用途を確認できていない電話番号・リンクは掲載していません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="支払後に処理不備が判明した場合">
          <p>
            サービス側の処理不備により、対応できない相談について意図しない請求が発生した場合は、鑑定ノートの作成を停止し、購入記録を確認して実際の誤請求を是正します。
          </p>
          <Link href="/legal/refund" className="legal-document-action">返金方針を確認する</Link>
        </LegalContentSection>

        <LegalContentSection title="お問い合わせ">
          <p>現在利用できる受付方法は、お問い合わせページで案内します。</p>
          <Link href="/contact" className="legal-document-action">お問い合わせの案内を見る</Link>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
