"use client";

import Link from "next/link";
import { PurchasePaymentPanel } from "@/components/payment/PurchasePaymentPanel";
import { PurchaseReturnStatusCard } from "@/components/payment/PurchaseReturnStatus";
import type { CustomerPurchaseStatus } from "@/lib/payment/purchase-status-contract";

export const CUSTOMER_TRUST_REVIEW_FIXTURES = [
  "checkout",
  "confirming-payment",
  "payment-not-completed",
  "preparing",
  "temporary-problem",
  "unverified-review",
  "verified-review",
  "completed-email",
  "completed",
] as const;

export type CustomerTrustReviewFixture =
  (typeof CUSTOMER_TRUST_REVIEW_FIXTURES)[number];

type StatusFixture = Readonly<{
  status: CustomerPurchaseStatus;
  requestFailed?: boolean;
  recoveryExhausted?: boolean;
}>;

const statusFixtures: Record<
  Exclude<CustomerTrustReviewFixture, "checkout">,
  StatusFixture
> = {
  "confirming-payment": {
    status: {
      status: "confirming_payment",
      paymentVerified: false,
      accountFallback: true,
    },
  },
  "payment-not-completed": {
    status: {
      status: "payment_not_completed",
      paymentVerified: false,
      accountFallback: true,
    },
  },
  preparing: {
    status: {
      status: "preparing_assessment",
      paymentVerified: true,
      accountFallback: true,
    },
  },
  "temporary-problem": {
    status: {
      status: "temporary_problem",
      paymentVerified: true,
      accountFallback: true,
      retryable: true,
    },
    requestFailed: true,
    recoveryExhausted: true,
  },
  "unverified-review": {
    status: {
      status: "confirmation_pending",
      paymentVerified: false,
      accountFallback: true,
    },
  },
  "verified-review": {
    status: {
      status: "confirmation_pending",
      paymentVerified: true,
      accountFallback: true,
    },
  },
  "completed-email": {
    status: {
      status: "completed_check_verified_email",
      paymentVerified: true,
      accountFallback: false,
    },
  },
  completed: {
    status: {
      status: "completed",
      paymentVerified: true,
      accountFallback: true,
      resultPath: "/account/results/123e4567-e89b-42d3-a456-426614174000",
    },
  },
};

function ReviewBoundary({ fixtureId }: { fixtureId: string }) {
  return (
    <aside className="request-review-boundary" role="note">
      <strong>F1/F2 Customer Trust fixture</strong>
      <span>
        {fixtureId}：固定された架空状態です。決済、保存、AI生成、メール送信、外部通信は行いません。
      </span>
    </aside>
  );
}

function CheckoutReview() {
  return (
    <main className="purchase-review-page">
      <ReviewBoundary fixtureId="checkout" />
      <article
        className="request-local-complete purchase-trust-review"
        aria-labelledby="customer-trust-checkout-title"
      >
        <p>お申し込み前の最終確認</p>
        <h1 id="customer-trust-checkout-title">恋のメッセージ鑑定ノート</h1>
        <span>
          入力された状況と文面を整理し、次にどう動くかを考える判断材料としてまとめます。
        </span>
        <PurchasePaymentPanel
          checkoutBusy={false}
          checkoutDisabled={false}
          checkoutError={null}
          onCheckout={() => undefined}
        />
        <nav className="request-purchase-links" aria-label="購入条件の確認">
          <Link href="/legal/terms">利用規約</Link>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal/refund">返金方針</Link>
          <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
          <Link href="/legal/ai-disclosure">AI利用について</Link>
        </nav>
      </article>
    </main>
  );
}

export function ReviewCustomerTrustClosure({
  fixtureId,
}: {
  fixtureId: CustomerTrustReviewFixture;
}) {
  if (fixtureId === "checkout") return <CheckoutReview />;
  const fixture = statusFixtures[fixtureId];
  return (
    <main className="purchase-review-page">
      <ReviewBoundary fixtureId={fixtureId} />
      <div className="purchase-trust-review">
        <PurchaseReturnStatusCard
          status={fixture.status}
          requestFailed={fixture.requestFailed}
          recoveryExhausted={fixture.recoveryExhausted}
          customerAuthEnabled
          supportEnabled
          onManualRefresh={() => undefined}
          restartCheckout={() => undefined}
        />
      </div>
    </main>
  );
}

export function isCustomerTrustReviewFixture(
  value: string,
): value is CustomerTrustReviewFixture {
  return CUSTOMER_TRUST_REVIEW_FIXTURES.some((fixture) => fixture === value);
}
