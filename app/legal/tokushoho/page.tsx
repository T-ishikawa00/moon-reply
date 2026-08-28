import type { Metadata } from "next";
import Link from "next/link";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
  LegalFactRows,
} from "@/components/legal/LegalDocument";
import { currentCustomerLegalFacts } from "@/lib/legal/current-content";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | 月の返事",
  description: "月の返事の販売条件と、販売事業者情報の開示方法についての案内です。",
};

const salesFacts = [
  { label: "サービス名", value: currentCustomerLegalFacts.serviceName },
  { label: "商品名", value: currentCustomerLegalFacts.productName },
  { label: "商品区分", value: currentCustomerLegalFacts.formalClassification },
  { label: "販売価格", value: `${currentCustomerLegalFacts.price}（${currentCustomerLegalFacts.quantity}）` },
  { label: "購入形態", value: `${currentCustomerLegalFacts.purchaseType}・${currentCustomerLegalFacts.renewal}` },
  { label: "支払方法", value: "Stripeの決済画面で表示される方法。クレジットカードに対応し、利用可能な場合は他の方法も決済画面に表示します" },
  { label: "支払時期", value: "購入内容を確認した後の一括前払い。サーバーで支払完了を確認できた場合に購入完了として扱います" },
  { label: "商品代金以外の費用", value: "インターネット接続に必要な通信費等は利用者負担です" },
  { label: "提供方法", value: "支払確認後、利用者本人に結び付いた保護された結果画面で鑑定ノートを提供します" },
  { label: "提供時期", value: "支払確認後に作成・提供します。保守、障害、安全確認等により時間を要する場合があり、固定の完了時間は約束していません" },
  { label: "対象年齢", value: currentCustomerLegalFacts.minimumAge },
] as const;

export default function TokushohoPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/tokushoho">
      <CustomerLegalHeader
        title="特定商取引法に基づく表記"
        description="月の返事の販売条件と、販売事業者情報の開示方法をご案内します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="販売事業者情報について">
          <p>
            販売業者の氏名（名称）、住所および電話番号は、請求があった場合、遅滞なく開示します。
          </p>
          <Link href="/contact" className="legal-document-action">
            販売事業者情報の開示を請求する
          </Link>
        </CustomerNotice>

        <LegalContentSection title="現在確定している販売条件">
          <LegalFactRows facts={salesFacts} />
        </LegalContentSection>

        <LegalContentSection title="AI利用と商品の性質" tone="ivory">
          <p>
            恋のメッセージ鑑定ノートの作成にAIを利用します。相手の本心、返信、復縁、未来、関係改善を保証しません。医療・心理・法律の専門家による助言の代わりではありません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="取消し・返金">
          <p>
            支払未完了、重複・誤額などの意図しない請求、支払後に安全かつ有効な鑑定ノートを提供できない場合、利用者の希望による取消しでは取扱いが異なります。固定の自動返金期限は案内していません。
          </p>
          <Link href="/legal/refund" className="legal-document-action">返金方針を確認する</Link>
        </LegalContentSection>

        <LegalContentSection title="お問い合わせ" tone="night">
          <p>
            販売事業者情報の開示請求を含むお問い合わせは、お問い合わせページで受け付けています。
          </p>
          <Link href="/contact" className="legal-document-action">お問い合わせ窓口を確認する</Link>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
