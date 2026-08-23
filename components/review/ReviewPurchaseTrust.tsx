"use client";

import Link from "next/link";
import { PurchasePaymentPanel } from "@/components/payment/PurchasePaymentPanel";
import {
  PurchaseReturnStatusCard,
  type PurchaseReturnSafeStatus,
} from "@/components/payment/PurchaseReturnStatus";

export const PURCHASE_TRUST_REVIEW_FIXTURES = [
  "checkout",
  "confirming-payment",
  "preparing-assessment",
  "delayed",
  "completed",
] as const;

export type PurchaseTrustReviewFixture =
  (typeof PURCHASE_TRUST_REVIEW_FIXTURES)[number];

function ReviewBoundary({ label }: { label: string }) {
  return (
    <aside className="request-review-boundary" role="note">
      <strong>{label}</strong>
      <span>
        架空の固定状態によるTrust UXレビューです。決済、API、AI生成、保存、メール送信は行いません。
      </span>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CheckoutReview() {
  return (
    <main className="purchase-review-page">
      <ReviewBoundary label="購入CTA / 固定fixture" />
      <article
        className="request-local-complete purchase-trust-review-checkout"
        aria-labelledby="purchase-trust-checkout-title"
      >
        <p>お申し込み前の最終確認</p>
        <h2 id="purchase-trust-checkout-title">恋のメッセージ鑑定ノート</h2>
        <span>今夜どう動くかを考えるための、あなただけの鑑定ノートです。</span>
        <dl>
          <Row label="サービス" value="月の返事" />
          <Row label="商品" value="恋のメッセージ鑑定ノート" />
          <Row label="受け取り" value="確認済みアカウント" />
          <Row label="ご本人確認" value="確認済みアカウント" />
          <Row label="数量" value="1相談 / 1鑑定ノート" />
          <Row label="料金" value="税込 980円" />
          <Row label="購入形式" value="都度払い" />
          <Row label="自動更新" value="なし" />
        </dl>
        <PurchasePaymentPanel
          checkoutBusy={false}
          checkoutDisabled={false}
          checkoutError={null}
          onCheckout={() => undefined}
        />
        <nav className="request-purchase-links" aria-label="購入前に確認できる情報">
          <Link href="/legal/terms">利用規約</Link>
          <Link href="/legal/privacy">プライバシー</Link>
          <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
          <Link href="/legal/refund">返金方針</Link>
          <Link href="/legal/ai-disclosure">AI利用について</Link>
        </nav>
      </article>
    </main>
  );
}

const STATUS_FIXTURES: Record<
  Exclude<PurchaseTrustReviewFixture, "checkout">,
  PurchaseReturnSafeStatus
> = {
  "confirming-payment": { status: "confirming_payment" },
  "preparing-assessment": { status: "preparing_assessment" },
  delayed: { status: "confirmation_pending", paymentVerified: true },
  completed: { status: "completed_check_verified_email" },
};

export function ReviewPurchaseTrust({
  fixtureId,
}: {
  fixtureId: PurchaseTrustReviewFixture;
}) {
  if (fixtureId === "checkout") return <CheckoutReview />;
  return (
    <main className="purchase-review-page purchase-trust-status-review">
      <ReviewBoundary label={`購入後ステータス / ${fixtureId}`} />
      <PurchaseReturnStatusCard
        status={STATUS_FIXTURES[fixtureId]}
        customerAuthEnabled
      />
    </main>
  );
}

export function isPurchaseTrustReviewFixture(
  value: string,
): value is PurchaseTrustReviewFixture {
  return PURCHASE_TRUST_REVIEW_FIXTURES.some((fixture) => fixture === value);
}
