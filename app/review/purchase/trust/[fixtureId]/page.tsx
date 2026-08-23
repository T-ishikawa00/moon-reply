import type { Metadata } from "next";
import {
  isPurchaseTrustReviewFixture,
  PURCHASE_TRUST_REVIEW_FIXTURES,
  ReviewPurchaseTrust,
} from "@/components/review/ReviewPurchaseTrust";

export const metadata: Metadata = {
  title: "購入Trust UX（審査用） | 月の返事",
  description: "固定fixtureを使った購入前後のTrust UXプレビューです。",
};

export function generateStaticParams() {
  return PURCHASE_TRUST_REVIEW_FIXTURES.map((fixtureId) => ({ fixtureId }));
}

export default async function ReviewPurchaseTrustPage({
  params,
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  const { fixtureId } = await params;
  if (!isPurchaseTrustReviewFixture(fixtureId)) {
    return (
      <main className="request-state-page">
        <section className="request-state-note">
          <header>
            <p>審査用fixture</p>
            <h1>指定された購入Trust状態はありません</h1>
          </header>
        </section>
      </main>
    );
  }
  return <ReviewPurchaseTrust fixtureId={fixtureId} />;
}
