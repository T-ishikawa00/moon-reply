"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  decodeCustomerPurchaseStatusResponse,
  type CustomerPurchaseStatus,
} from "@/lib/payment/purchase-status-contract";
import { PurchaseStatusPoller } from "@/lib/payment/purchase-status-poller";
import { getPurchaseReturnPresentation } from "@/lib/payment/purchase-return-presentation";

export function PurchaseReturnStatus({
  statusCapability,
  customerAuthEnabled,
}: {
  statusCapability: string;
  customerAuthEnabled: boolean;
}) {
  const [status, setStatus] = useState<CustomerPurchaseStatus>({
    status: "confirming_payment",
    paymentVerified: false,
    accountFallback: customerAuthEnabled,
  });
  const [requestFailed, setRequestFailed] = useState(false);
  const [recoveryExhausted, setRecoveryExhausted] = useState(false);
  const [checkoutRestarting, setCheckoutRestarting] = useState(false);
  const [checkoutRestartFailed, setCheckoutRestartFailed] = useState(false);
  const pollerRef = useRef<PurchaseStatusPoller | null>(null);

  async function restartCheckout() {
    setCheckoutRestarting(true);
    setCheckoutRestartFailed(false);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusCapability }),
      });
      if (!response.ok) throw new Error("PAYMENT_CHECKOUT_RESTART_FAILED");
      const payload = (await response.json()) as unknown;
      if (typeof payload !== "object" || payload === null) {
        throw new Error("PAYMENT_CHECKOUT_RESTART_INVALID");
      }
      const data = (payload as { data?: unknown }).data;
      if (typeof data !== "object" || data === null) {
        throw new Error("PAYMENT_CHECKOUT_RESTART_INVALID");
      }
      const checkoutUrlValue = (data as { checkoutUrl?: unknown }).checkoutUrl;
      if (typeof checkoutUrlValue !== "string") {
        throw new Error("PAYMENT_CHECKOUT_RESTART_INVALID");
      }
      const checkoutUrl = new URL(checkoutUrlValue);
      if (
        checkoutUrl.origin !== "https://checkout.stripe.com" ||
        checkoutUrl.username !== "" ||
        checkoutUrl.password !== ""
      ) {
        throw new Error("PAYMENT_CHECKOUT_RESTART_INVALID");
      }
      window.location.assign(checkoutUrl.toString());
    } catch {
      setCheckoutRestarting(false);
      setCheckoutRestartFailed(true);
    }
  }

  useEffect(() => {
    const poller = new PurchaseStatusPoller({
      async fetchStatus(signal) {
        const response = await fetch("/api/payments/status", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusCapability }),
        });
        if (!response.ok) throw new Error("PURCHASE_STATUS_UNAVAILABLE");
        const next = decodeCustomerPurchaseStatusResponse(await response.json());
        if (!next) throw new Error("PURCHASE_STATUS_INVALID");
        return next;
      },
      onStatus: setStatus,
      onRecoveryState(next) {
        setRequestFailed(next.requestFailed);
        setRecoveryExhausted(next.recoveryExhausted);
      },
      onNavigate(resultPath) {
        window.location.replace(resultPath);
      },
    });
    pollerRef.current = poller;
    void poller.start();
    return () => {
      poller.stop();
      if (pollerRef.current === poller) pollerRef.current = null;
    };
  }, [statusCapability]);

  const presentation = getPurchaseReturnPresentation({
    status,
    requestFailed,
    recoveryExhausted,
    customerAuthEnabled,
  });
  return (
    <section
      className="purchase-return-card"
      aria-live="polite"
      aria-atomic="true"
    >
      <p>{presentation.eyebrow}</p>
      <h1>{presentation.heading}</h1>
      <span>{presentation.body}</span>
      {presentation.assurance ? (
        <strong className="purchase-return-assurance">
          {presentation.assurance}
        </strong>
      ) : null}
      {presentation.showManualRefresh ? (
        <button
          type="button"
          className="button button--secondary"
          onClick={() => void pollerRef.current?.manualRefresh()}
        >
          同じお申し込みを確認する
        </button>
      ) : null}
      {presentation.showAccountFallback ? (
        <Link href="/account" className="button button--secondary">
          私の鑑定ノートを確認する
        </Link>
      ) : null}
      {presentation.showCheckoutRestart ? (
        <>
          {checkoutRestartFailed ? (
            <p role="alert">
              決済画面を再開できませんでした。時間を置いて、同じお申し込みからもう一度お試しください。
            </p>
          ) : null}
          <button
            type="button"
            className="button button--primary"
            disabled={checkoutRestarting}
            onClick={() => void restartCheckout()}
          >
            {checkoutRestarting
              ? "安全な決済画面を準備しています"
              : "同じお申し込みで決済を再開する"}
          </button>
          <Link href="/request" className="button button--secondary">
            相談内容からやり直す
          </Link>
        </>
      ) : null}
    </section>
  );
}
