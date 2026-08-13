import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import {
  contactDoNotSend,
  contactUnresolvedRows,
  plannedContactCategories,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "お問い合わせ 準備表示 | 月の返事",
  description:
    "一つの事業用メールと一つの6分類フォームという受入済み方針を、受付機能なしで確認するお問い合わせ準備ページです。",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ContactReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/contact">
      <LegalPageHeader
        eyebrow="CONTACT REVIEW"
        title="お問い合わせ 準備表示"
        description="将来の窓口構成と6つの受付カテゴリ、受付開始前に必要な判断を確認する非稼働ページです。"
        status="受付準備中・送信不可"
      />
      <div className="legal-document-body">
        <ReviewCallout strong="お問い合わせ受付は稼働していません。">
          実在する事業用メール、送信フォーム、mailto、外部送信、受付済み表示、返信目安はありません。このページを開いても問い合わせは送信されません。
        </ReviewCallout>

        <ContentSection
          eyebrow="ACCEPTED PLANNED MODEL"
          title="予定する窓口構成"
          intro="B2で受け入れた構成方針であり、運用開始を示しません。"
          tone="ivory"
        >
          <p>
            一つの運用可能な事業用メールボックスと、一つのカテゴリ分けされた問い合わせフォームを用意する方向です。実際の連絡先、送信先、本人確認、受付記録、対応体制は未実装です。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="PLANNED CATEGORIES"
          title="6つの対応予定カテゴリ"
          intro="受入済みの機能分類です。現在対応できること、送信できること、返信目安を示すものではありません。"
        >
          <ol className="legal-category-list">
            {plannedContactCategories.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
                <small>受付準備中</small>
              </li>
            ))}
          </ol>
        </ContentSection>

        <ContentSection
          eyebrow="UNRESOLVED CONTACT ROWS"
          title="受付開始前に決めること"
          intro="空欄や架空値は埋めず、公開前のDecision状態だけを示します。"
        >
          <DecisionGrid decisions={contactUnresolvedRows} />
        </ContentSection>

        <ContentSection
          eyebrow="SELLER DISCLOSURE PUBLICATION BLOCKER"
          title="販売事業者情報の開示請求"
          tone="night"
        >
          <p>
            法令と実際のStripe要件が許す場合に限り、購入前に利用できる開示請求経路を設ける条件付き方向です。現在は実在する受付経路がないため、法務公開を止める項目です。このページから開示請求はできません。
          </p>
        </ContentSection>

        <ContentSection eyebrow="DO NOT SEND" title="送らないでください">
          <p>
            将来受付が開始された場合も、問い合わせの特定に不要な情報は送らないでください。
          </p>
          <ul className="legal-plain-list">
            {contactDoNotSend.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </ContentSection>

        <ContentSection
          eyebrow="EMERGENCY BOUNDARY"
          title="緊急・専門支援との境界"
          tone="night"
        >
          <p>
            このページは緊急、医療、警察、心理支援、法律相談の窓口ではなく、緊急対応を行いません。
          </p>
          <p>
            未検証の公的支援情報、リンク、電話番号は掲載しません。公開する場合は公式情報、対象地域、用途、確認日の証拠が必要です。
          </p>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
