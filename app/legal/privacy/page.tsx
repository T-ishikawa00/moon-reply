import type { Metadata } from "next";
import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
  LegalFactRows,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "プライバシーポリシー | 月の返事",
  description: "月の返事が取り扱う情報、利用目的、AI・決済・配信事業者との関係を説明します。",
};

const informationCategories = [
  { label: "相談と鑑定", value: "相談本文、関係性・話題の選択、任意で入力したメッセージや下書き、必要な場合の1回の追加回答、成人確認、安全確認、鑑定ノート" },
  { label: "アカウント", value: "認証に用いるメールアドレス、認証・継続状態、本人の準備・結果へのアクセスを結び付ける記録" },
  { label: "購入と支払確認", value: "購入、金額・通貨、決済状態、Stripeから受け取る決済・Checkoutの識別情報。相談入力欄でカード情報は取得しません" },
  { label: "提供と運用", value: "準備、結果、配信、再試行、エラー、回復、不正利用防止に必要な状態・日時・識別情報" },
  { label: "技術情報", value: "アクセス日時、ブラウザ・端末・ネットワーク、Cookie、障害・セキュリティに関する一般的な技術記録が、ホスティングや安全管理のために扱われる場合があります" },
] as const;

const purposes = [
  "相談の受付、成人確認、安全確認、商品対象の判断",
  "相談内容の整理・分析、鑑定ノートの作成と提供",
  "本人認証、準備・購入・結果へのアクセス管理",
  "支払の確認、重複請求の防止、購入・返金・請求上の問題への対応",
  "結果の通知、配信、再開、回復、障害対応",
  "不正利用の防止、セキュリティ、サービスの保守・改善",
  "法令上必要な記録と対応",
] as const;

const serviceProviders = [
  { label: "OpenAI", value: "相談内容の整理・分析と鑑定ノート生成に必要な相談情報を処理します" },
  { label: "Stripe", value: "決済画面の提供、支払処理、支払状態の確認を行います" },
  { label: "Supabase", value: "データベースと認証の基盤を提供します" },
  { label: "Netlify", value: "Webサイトの配信とサーバー処理の基盤を提供します" },
  { label: "Resend", value: "アカウントや結果の受取りに必要な通知メールを配信します" },
] as const;

export default function PrivacyPage() {
  return (
    <CustomerLegalScaffold currentPath="/legal/privacy">
      <CustomerLegalHeader
        title="プライバシーポリシー"
        description="月の返事がサービス提供のために取り扱う情報と、その目的、外部サービスとの関係をご案内します。"
      />
      <div className="legal-document-body">
        <CustomerNotice title="相談には不要な個人情報を入力しないでください">
          <p>
            本名、住所、電話番号、勤務先・学校名、ログイン情報、正確な現在地、相手のフルネームや第三者の秘密など、分析に必要のない情報は入力しないでください。
          </p>
        </CustomerNotice>

        <LegalContentSection title="取り扱う情報">
          <LegalFactRows facts={informationCategories} />
        </LegalContentSection>

        <LegalContentSection title="利用目的" tone="ivory">
          <ol className="grid list-decimal gap-3 pl-6 leading-8 md:grid-cols-2">
            {purposes.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </LegalContentSection>

        <LegalContentSection title="AIによる処理">
          <p>
            OpenAIには、相談内容、関係性・話題の選択、任意で入力したメッセージや下書き、必要な場合の追加回答など、分析と鑑定ノート作成に必要な情報を送ります。
          </p>
          <p>
            システムが管理するメールアドレス、支払識別情報、認証情報、アクセス用の秘密、不正・過度な利用を防ぐための利用量記録は、AIによる相談分析の入力として付加しません。ただし、利用者自身が相談本文に不要な個人情報を記載すると、その記載部分も処理対象になり得ます。
          </p>
        </LegalContentSection>

        <LegalContentSection title="外部サービス" tone="ivory">
          <p>
            サービス提供に必要な範囲で、次の事業者が情報を処理します。各事業者では、そのサービス条件やプライバシー条件に基づく処理が行われます。
          </p>
          <LegalFactRows facts={serviceProviders} />
          <p>
            通知メールに相談本文は記載しません。決済用のカード情報はStripeの決済画面に入力し、月の返事の相談入力欄では取得しません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="Cookieと認証">
          <p>
            ログイン状態、安全な手続の継続、不正利用防止など、サービス提供に必要なCookieや同様の仕組みを使用します。ブラウザで無効にすると、認証や購入、結果へのアクセスを利用できない場合があります。
          </p>
        </LegalContentSection>

        <LegalContentSection title="保存期間と削除">
          <p>
            情報の種類ごとに、サービス提供、購入・会計、返金や請求上の問題、安全管理、障害回復、法令上の必要性を踏まえて必要な期間保存します。すべての情報が直ちに削除されること、保存されないこと、または一律の保存期間は約束していません。
          </p>
          <p>
            保存の必要がなくなった情報は、法令上または安全上保持が必要なものを除き、削除または利用できない状態にするための運用対象とします。
          </p>
        </LegalContentSection>

        <LegalContentSection title="安全管理">
          <p>
            情報へのアクセス制限、秘密情報の分離、通信の保護、操作権限の制限、障害や不正利用への対応など、必要な安全管理を行います。ただし、いかなる方法でも事故や不正アクセスを完全に防げるとは保証できません。
          </p>
        </LegalContentSection>

        <LegalContentSection title="開示・訂正・削除等のお申し出" tone="night">
          <p>
            本人確認と、法令・安全・購入記録上の必要性を確認したうえで対応します。現在利用できる受付方法は、お問い合わせページで案内します。
          </p>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
