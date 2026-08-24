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
  description: "月の返事の現在の販売条件と、提供開始前に掲載する販売事業者情報についての案内です。",
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
        description="月の返事の販売条件と、販売事業者情報の現在の掲載状態をご案内します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="販売事業者情報の掲載は完了していません">
          <p>
            販売事業者名、代表者、所在地、電話番号、事業用の問い合わせ先は現在掲載していません。実在する情報と受付方法を整え、提供開始前にこのページへ掲載します。
          </p>
          <p>
            架空の情報や、個人情報を守る目的だけで法令上必要な表示を省略できるという説明は行いません。
          </p>
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
            現在利用できる受付方法は、お問い合わせページで案内します。販売事業者情報に必要な連絡先は、実在する情報を整えた後、このページにも掲載します。
          </p>
          <Link href="/contact" className="legal-document-action">お問い合わせの案内を見る</Link>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
