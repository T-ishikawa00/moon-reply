"use client";

export function PurchasePaymentPanel({
  checkoutBusy,
  checkoutDisabled,
  checkoutError,
  onCheckout,
}: {
  checkoutBusy: boolean;
  checkoutDisabled: boolean;
  checkoutError: string | null;
  onCheckout: () => void;
}) {
  return (
    <section
      className="request-payment-panel"
      aria-labelledby="request-payment-title"
    >
      <div className="request-payment-summary">
        <p>お支払い</p>
        <h3 id="request-payment-title">税込 980円</h3>
        <ul aria-label="お支払い条件">
          <li>1相談 / 1鑑定ノート</li>
          <li>都度払い・自動更新なし</li>
        </ul>
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
        aria-describedby="request-payment-next-step"
        aria-busy={checkoutBusy}
        onClick={onCheckout}
      >
        {checkoutBusy ? "決済画面を準備しています…" : "お支払いに進む"}
      </button>
      <p id="request-payment-next-step" className="request-payment-next-step">
        次の画面でStripeの安全な決済ページが開きます。
        <br />
        決済内容を確認してからお支払いいただけます。
      </p>
    </section>
  );
}
