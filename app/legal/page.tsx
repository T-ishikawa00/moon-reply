import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DecisionGrid,
  FactRows,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import {
  fixedProductFacts,
  legalPageInventory,
  publicationReadiness,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "法務・開示 審査ハブ | 月の返事",
  description: "月の返事の法務、AI、安全、返金、特商法、お問い合わせ構成を公開前に確認する審査用ページです。",
};

export default function LegalIndexPage() {
  return (
    <LegalReviewScaffold currentPath="/legal">
      <LegalPageHeader
        eyebrow="LEGAL, DISCLOSURE & CONTACT REVIEW"
        title="法務・開示・お問い合わせ 審査ハブ"
        description="固定済みの商品事実と、公開前に解決すべき運営者・外部事業者・商取引・プライバシー上の判断を分けて確認するための静的な審査表示です。"
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ContentSection
          eyebrow="FIXED PRODUCT FACTS"
          title="固定済みの商品事実"
          intro="以下はHuman承認済みの固定事実です。未確定の運営者情報や外部事業者情報とは混在させません。"
        >
          <FactRows facts={fixedProductFacts} />
        </ContentSection>

        <ContentSection
          eyebrow="PAGE INVENTORY"
          title="法務・開示ページ一覧"
          intro="全て審査用ドラフトまたは準備表示です。リンクが開くことは、公開承認、利用契約への同意、購入、問い合わせ受付を意味しません。"
          tone="ivory"
        >
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {legalPageInventory.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 flex-col rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 transition hover:-translate-y-0.5 hover:border-[#8a6d2e] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-1 text-xs font-bold">審査用ドラフト</span>
                  <span className="rounded-full border border-[#9b7b3a] bg-[#fffdf5] px-3 py-1 text-xs font-bold">公開：未承認</span>
                </div>
                <h3 className="mt-4 break-words font-serif text-2xl font-semibold leading-[1.45]">{item.name}</h3>
                <p className="mt-3 leading-7 text-[#5f5363]">{item.purpose}</p>
                <dl className="mt-5 rounded-lg border border-dashed border-[#bca66f] bg-[#f8f0e2] p-4 text-sm leading-6">
                  <dt className="font-semibold text-[#765e2d]">未解決カテゴリ</dt>
                  <dd className="m-0 mt-1 break-words">{item.unresolved}</dd>
                </dl>
                <span className="mt-5 inline-flex min-h-11 items-center font-semibold text-[#6d5421]">
                  審査表示を開く <span className="ml-2" aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </ContentSection>

        <ContentSection
          eyebrow="PUBLICATION READINESS"
          title="公開準備の未完了カテゴリ"
          intro="Decision IDは顧客向け法務文言ではなく、公開前の審査専用メタデータとして表示します。"
        >
          <ReviewCallout strong="現在の法務ページ群は販売開始または公開承認に使用できません。">
            運営者・外部事業者・商取引・プライバシー・専門家確認・日付・最終Human承認が未完了です。
          </ReviewCallout>
          <div className="mt-6">
            <DecisionGrid decisions={publicationReadiness} />
          </div>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
