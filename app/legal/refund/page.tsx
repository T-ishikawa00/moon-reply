import type { Metadata } from "next";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "返金方針 | 月の返事",
  description: "支払未完了、誤請求、支払後に提供できない場合などの対応方針です。",
};

export default function RefundPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/refund">
      <CustomerLegalHeader
        title="返金方針"
        description="税込980円の都度払いについて、支払状況や問題の種類ごとの対応を説明します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="支払済みの購入を放置しません">
          <p>
            支払を確認した購入は、同じ購入の範囲で鑑定ノートの回復・提供を試み、再度の支払を求めません。安全かつ有効に提供できない場合は、購入記録を確認して返金その他の必要な対応を行います。
          </p>
        </CustomerNotice>

        <LegalContentSection title="支払が完了していない場合">
          <p>
            Stripeの画面を閉じた場合や、サーバーで支払完了を確認できない場合は、支払済みの購入として扱いません。料金が確定していなければ返金は発生しません。金融機関の表示に不明な点がある場合は、確定した請求かどうかを確認する必要があります。
          </p>
        </LegalContentSection>

        <LegalContentSection title="重複・誤額・誤った購入への請求" tone="ivory">
          <p>
            重複請求、980円と異なる誤額、別の利用者や相談に結び付いた請求その他の意図しない請求は、通常の都合による取消しとは分けて扱います。購入と決済の記録を確認し、実際に誤って発生した金額を是正します。
          </p>
          <p>
            複数の請求や誤額がある場合、是正する金額を980円で打ち切りません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="支払後に鑑定ノートを提供できない場合">
          <p>
            支払完了後に生成、保存、配信、結果へのアクセスで問題が起きた場合は、まず同じ購入の範囲で安全な回復と提供を試みます。回復のために再課金しません。
          </p>
          <p>
            安全かつ有効な鑑定ノートを最終的に提供できない場合は、税込980円の全額返金その他、状況と法令に応じて必要な対応を行います。
          </p>
        </LegalContentSection>

        <LegalContentSection title="利用者の希望による取消し・返金" tone="ivory">
          <p>
            支払後の希望による取消しや、正常に提供された鑑定ノートの内容に対する好みだけを理由とする返金は、自動ではありません。生成・提供の状態、デジタル商品の性質、申出の理由、法令上の権利を確認して個別に扱います。
          </p>
          <p>
            固定の申出期限や自動返金を約束していません。法令上排除できない利用者の権利や、重大な不具合に対する救済を制限しません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="外部サービス・システムの障害">
          <p>
            AI、決済、データベース、ホスティング、メール等の障害がある場合も、支払記録と処理状態を確認し、再開、再送、結果への安全なアクセス回復などを試みます。障害が起きただけで直ちに自動返金となるわけではありませんが、提供不能のまま放置しません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="確認と手続" tone="night">
          <p>
            返金・誤請求の是正には、本人確認、購入とStripe決済の特定、鑑定ノートの処理状態の確認が必要です。自動の返金申請機能や固定の処理日数は案内していません。お問い合わせ窓口は現在準備中で、実在する受付方法を用意した後に案内します。
          </p>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
