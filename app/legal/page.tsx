import type { Metadata } from "next";
import Link from "next/link";
import {
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
  title: "法務・Safety 文書索引 | 月の返事",
  description:
    "月の返事の法務、AI、Safety、返金、特商法、お問い合わせ文書を公開前に確認する索引です。",
};

const publicationBlockers = [
  ...publicationReadiness.slice(0, 6),
  publicationReadiness[7],
];

export default function LegalIndexPage() {
  return (
    <LegalReviewScaffold currentPath="/legal">
      <LegalPageHeader
        eyebrow="LEGAL DOCUMENT INDEX"
        title="法務・Safety 文書索引"
        description="人が読む本文を中心に、公開前の確認事項と審査メタデータを三つの層へ分けて確認します。"
      />

      <div className="legal-document-body">
        <section className="legal-content-section legal-content-section--paper" aria-labelledby="legal-fixed-title">
          <h2 id="legal-fixed-title">固定済みの商品事実</h2>
          <p className="legal-content-section__intro">
            Human承認済みの事実だけを通常値として表示し、未確定の運営者・外部事業者情報と混在させません。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={fixedProductFacts} />
          </div>
        </section>

        <section className="legal-content-section legal-content-section--ivory" aria-labelledby="legal-index-title">
          <h2 id="legal-index-title">文書一覧</h2>
          <p className="legal-content-section__intro">
            全ページが公開前のReview modeです。リンクが開くことは公開承認、利用契約への同意、購入、問い合わせ受付を意味しません。
          </p>
          <ol className="legal-index-list">
            {legalPageInventory.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.purpose}</small>
                  </span>
                  <span className="legal-page-status">公開前</span>
                  <b aria-hidden="true">→</b>
                </Link>
                <details>
                  <summary>公開前確認事項</summary>
                  <p>{item.unresolved}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className="legal-readiness" aria-labelledby="legal-readiness-title">
          <h2 id="legal-readiness-title">公開準備</h2>
          <ReviewCallout strong="現在の文書群は販売開始または公開承認に使用できません。">
            運営者・外部事業者・商取引・プライバシー・専門家確認・日付・最終Human承認が未完了です。
          </ReviewCallout>

          <section aria-labelledby="legal-blockers-title">
            <h3 id="legal-blockers-title">公開を止める項目</h3>
            <DecisionGrid decisions={publicationBlockers} />
          </section>

          <section aria-labelledby="legal-operations-title">
            <h3 id="legal-operations-title">運用開始前に決める項目</h3>
            <DecisionGrid decisions={[publicationReadiness[6]]} />
          </section>

          <section aria-labelledby="legal-future-title">
            <h3 id="legal-future-title">将来の改善候補</h3>
            <p>
              現時点では個別候補を登録していません。公開を止める項目を解消する前に、改善候補と必須事項を混在させません。
            </p>
          </section>
        </section>
      </div>
    </LegalReviewScaffold>
  );
}
