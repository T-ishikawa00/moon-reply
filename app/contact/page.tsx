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
  description: "受付機能や連絡先を提供せず、予定カテゴリと未決定項目だけを確認するお問い合わせ準備ページです。",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function ContactReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/contact">
      <LegalPageHeader
        eyebrow="CONTACT REVIEW"
        title="お問い合わせ 準備表示"
        description="受付予定カテゴリ、送らない情報、未決定の運用項目を確認するだけの非稼働ページです。"
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ReviewCallout strong="お問い合わせ受付機能は現在準備中です">
          このページには送信欄、送信操作、稼働するメール窓口、外部受付先がありません。問い合わせを受け付けた証拠にはなりません。
        </ReviewCallout>

        <ContentSection
          eyebrow="UNRESOLVED CONTACT ROWS"
          title="未確定の受付・運用項目"
          intro="空欄や架空値は表示せず、公開前のDecision状態だけを示します。"
        >
          <DecisionGrid decisions={contactUnresolvedRows} />
        </ContentSection>

        <ContentSection
          eyebrow="PLANNED CATEGORIES"
          title="対応予定カテゴリ"
          intro="以下は将来の受付設計候補です。現在supportが稼働していること、対応できること、SLAがあることを示しません。"
          tone="ivory"
        >
          <ul className="grid gap-3 md:grid-cols-2">
            {plannedContactCategories.map((item) => (
              <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fff8e9] p-4 leading-7">
                <strong className="block">予定カテゴリ</strong>
                <span className="mt-1 block text-[#67596b]">{item}</span>
              </li>
            ))}
          </ul>
        </ContentSection>

        <ContentSection eyebrow="DO NOT SEND" title="送らないでください">
          <p className="leading-8 text-[#67596b]">将来受付が開始された場合も、問い合わせ特定に不要な情報は送らないでください。</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {contactDoNotSend.map((item) => (
              <li key={item} className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-7">{item}</li>
            ))}
          </ul>
        </ContentSection>

        <ContentSection eyebrow="EMERGENCY BOUNDARY" title="緊急・専門支援との境界" tone="night">
          <p className="leading-8">
            このページは緊急、医療、警察、心理支援、法律相談の窓口ではなく、緊急対応を行いません。
          </p>
          <p className="mt-4 leading-8 text-[#d5cab9]">
            未検証の公的支援情報、リンク、電話番号は掲載しません。公開する場合は公式情報、対象地域、用途、確認日の証拠が必要です。
          </p>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
