import type { Metadata } from "next";
import {
  ReviewCustomerTrustClosure,
  type CustomerTrustReviewFixture,
} from "@/components/review/ReviewCustomerTrustClosure";

const customerTrustReviewFixtures = [
  "checkout",
  "confirming-payment",
  "payment-not-completed",
  "preparing",
  "temporary-problem",
  "unverified-review",
  "verified-review",
  "completed-email",
  "completed",
] as const satisfies readonly CustomerTrustReviewFixture[];

export const metadata: Metadata = {
  title: "F1/F2 Customer Trust（審査用） | 月の返事",
  description: "購入前後のCustomer Trust UXを固定状態で確認する審査用ページです。",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export function generateStaticParams() {
  return customerTrustReviewFixtures.map((fixtureId) => ({ fixtureId }));
}

export default async function CustomerTrustReviewPage({
  params,
}: {
  params: Promise<{ fixtureId: string }>;
}) {
  const { fixtureId } = await params;
  if (
    !customerTrustReviewFixtures.includes(
      fixtureId as CustomerTrustReviewFixture,
    )
  ) {
    return (
      <main className="request-state-page">
        <section className="request-state-note">
          <header>
            <p>審査用fixture</p>
            <h1>指定されたCustomer Trust状態はありません</h1>
          </header>
        </section>
      </main>
    );
  }
  return (
    <ReviewCustomerTrustClosure
      fixtureId={fixtureId as CustomerTrustReviewFixture}
    />
  );
}
