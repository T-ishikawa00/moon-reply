import type { Metadata } from "next";
import { ReviewPurchaseConfirmation, UnavailableReviewPurchaseConfirmation } from "@/components/review/ReviewPurchaseConfirmation";
import { getPurchaseConfirmationFixture, PURCHASE_CONFIRMATION_FIXTURES } from "@/fixtures/review/purchase-confirmations";

export const metadata: Metadata = {
  title: "購入前の最終確認（審査用） | 月の返事",
  description: "固定fixtureを使った、決済機能のない月の返事の購入確認プレビューです。",
};

export function generateStaticParams() {
  return Object.keys(PURCHASE_CONFIRMATION_FIXTURES).map((fixtureId) => ({ fixtureId }));
}

function safeReviewId(fixtureId: string) {
  return /^[a-z0-9-]{1,80}$/.test(fixtureId) ? fixtureId : "invalid-format";
}

export default async function ReviewPurchaseConfirmationPage({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params;
  const data = getPurchaseConfirmationFixture(fixtureId);
  return data ? <ReviewPurchaseConfirmation data={data} /> : <UnavailableReviewPurchaseConfirmation requestedId={safeReviewId(fixtureId)} />;
}
