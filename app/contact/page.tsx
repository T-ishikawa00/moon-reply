import type { Metadata } from "next";
import Link from "next/link";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "お問い合わせ | 月の返事",
  description: "月の返事のお問い合わせ窓口の現在の状態をご案内します。",
};

export default function ContactPage() {
  return (
    <CustomerLegalScaffold currentPath="/contact">
      <CustomerLegalHeader
        title="お問い合わせ"
        description="月の返事へのお問い合わせ方法についてのご案内です。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="お問い合わせ窓口は現在準備中です">
          <p>
            現在、このページからメッセージを送信することはできません。受付可能なメールアドレスやフォームを用意した後、このページで案内します。
          </p>
        </CustomerNotice>

        <LegalContentSection title="現在できないこと">
          <ul className="legal-plain-list">
            <li>お問い合わせの送信</li>
            <li>結果URLや通知メールの再送依頼</li>
            <li>取消し、返金、誤請求の申出</li>
            <li>プライバシーに関する開示・訂正・削除等の申出</li>
            <li>販売事業者情報の開示請求</li>
          </ul>
          <p>
            送信済みと表示する機能、実在しない連絡先、返信までの所要時間は案内していません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="返金・誤請求について" tone="ivory">
          <p>
            支払済みの購入については、同じ購入の範囲で安全な回復と提供を試み、重複して請求しないことが基本です。重複・誤額などの意図しない請求や、最終的に提供できない場合の考え方は返金方針で説明しています。
          </p>
          <Link href="/legal/refund" className="legal-document-action">返金方針を確認する</Link>
        </LegalContentSection>

        <LegalContentSection title="ご利用に関する情報">
          <p>利用条件、情報の取扱い、AI利用、安全上の境界は、次のページから確認できます。</p>
          <div className="legal-inline-links">
            <Link href="/legal/terms">利用規約</Link>
            <Link href="/legal/privacy">プライバシーポリシー</Link>
            <Link href="/legal/ai-disclosure">AI利用について</Link>
            <Link href="/legal/unsupported-cases">対応できない相談</Link>
          </div>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
