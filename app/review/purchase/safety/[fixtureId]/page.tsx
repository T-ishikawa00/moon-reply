import type { Metadata } from "next";
import {
  ReviewPrePaymentSafetyConfirmation,
  UnavailablePrePaymentSafetyReview,
} from "@/components/review/ReviewPrePaymentSafetyConfirmation";
import {
  getPrePaymentSafetyReviewFixture,
  PREPAYMENT_SAFETY_REVIEW_FIXTURES,
} from "@/fixtures/review/prepayment-safety-states";

export const metadata: Metadata = {
  title: "決済前の利用確認（審査用） | 月の返事",
  description:
    "固定fixtureを使った、決済機能のない月の返事の利用確認プレビューです。",
};

export function generateStaticParams() {
  return Object.keys(PREPAYMENT_SAFETY_REVIEW_FIXTURES).map((fixtureId) => ({
    fixtureId,
  }));
}

function safeReviewId(fixtureId: string) {
  return /^[a-z0-9-]{1,80}$/u.test(fixtureId)
    ? fixtureId
    : "invalid-format";
}

export default async function PrePaymentSafetyReviewPage({
  params,
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  const { fixtureId } = await params;
  const fixture = getPrePaymentSafetyReviewFixture(fixtureId);

  return fixture ? (
    <ReviewPrePaymentSafetyConfirmation fixture={fixture} />
  ) : (
    <UnavailablePrePaymentSafetyReview requestedId={safeReviewId(fixtureId)} />
  );
}
