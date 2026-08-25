"use client";

import { currentCustomerLegalFacts } from "@/lib/legal/current-content";

export function PurchasePaymentPanel({
  checkoutBusy,
  checkoutDisabled,
  checkoutError,
  checkoutAriaLabel = "980円を支払い、鑑定を申し込む",
  onCheckout,
}: {
  checkoutBusy: boolean;
  checkoutDisabled: boolean;
  checkoutError: string | null;
  checkoutAriaLabel?: string;
  onCheckout: () => void;
}) {
  return (
    <section
      className="request-payment-panel"
      aria-labelledby="request-payment-title"
    >
      <div className="request-payment-summary">
        <p>お支払いの最終確認</p>
        <h3 id="request-payment-title">{currentCustomerLegalFacts.price}</h3>
        <ul aria-label="購入条件">
          <li>{currentCustomerLegalFacts.quantity}</li>
          <li>{currentCustomerLegalFacts.purchaseType}</li>
          <li>{currentCustomerLegalFacts.renewal}</li>
        </ul>
      </div>

      <div className="request-payment-trust" role="note">
        <strong>{currentCustomerLegalFacts.paymentProvider}による決済</strong>
        <span>
          入力内容の整理・分析と鑑定ノートの作成にAIを使用します。相手の本心、返信、復縁、未来、関係改善を保証しません。
        </span>
      </div>

      {checkoutError ? (
        <p className="request-field-error" role="alert">
          {checkoutError}
        </p>
      ) : null}

      <button
        type="button"
        className="button button--primary request-checkout-button"
        disabled={checkoutDisabled}
        aria-label={checkoutAriaLabel}
        aria-describedby="request-payment-next-step"
        aria-busy={checkoutBusy}
        onClick={onCheckout}
      >
        {checkoutBusy ? "決済画面を準備しています…" : "お支払いに進む"}
      </button>
      <p id="request-payment-next-step" className="request-payment-next-step">
        次の画面でStripeの決済ページが開きます。内容を確認してからお支払いいただけます。
      </p>
    </section>
  );
}
