"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  decodeCustomerPurchaseStatusResponse,
  type CustomerPurchaseStatus,
} from "@/lib/payment/purchase-status-contract";
import { PurchaseStatusPoller } from "@/lib/payment/purchase-status-poller";
import {
  getPurchaseReturnPresentation,
  type PurchaseProgress,
  type PurchaseProgressState,
} from "@/lib/payment/purchase-return-presentation";

function PurchaseProgressSteps({ states }: { states: PurchaseProgress }) {
  const steps = ["お支払い確認", "鑑定ノート準備", "お受け取り"] as const;
  const stateLabels: Record<PurchaseProgressState, string> = {
    complete: "完了",
    current: "現在",
    next: "次",
  };

  return (
    <ol className="purchase-return-progress" aria-label="お申し込みの現在地">
      {steps.map((label, index) => {
        const state = states[index];
        return (
          <li
            key={label}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="purchase-return-progress__mark" aria-hidden="true">
              {state === "complete" ? "✓" : index + 1}
            </span>
            <span className="purchase-return-progress__copy">
              <strong>{label}</strong>
              <span>{stateLabels[state]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function PurchaseReturnStatusCard({
  status,
  requestFailed = false,
  recoveryExhausted = false,
  customerAuthEnabled,
  supportEnabled = false,
  checkoutRestarting = false,
  checkoutRestartFailed = false,
  checkoutCancelled = false,
  onManualRefresh,
  restartCheckout = () => undefined,
}: {
  status: CustomerPurchaseStatus;
  requestFailed?: boolean;
  recoveryExhausted?: boolean;
  customerAuthEnabled: boolean;
  supportEnabled?: boolean;
  checkoutRestarting?: boolean;
  checkoutRestartFailed?: boolean;
  checkoutCancelled?: boolean;
  onManualRefresh?: () => void;
  restartCheckout?: () => void;
}) {
  const presentation = getPurchaseReturnPresentation({
    status,
    requestFailed,
    recoveryExhausted,
    customerAuthEnabled,
  });
  const hasActions =
    presentation.showManualRefresh ||
    presentation.showAccountFallback ||
    presentation.showCheckoutRestart ||
    (presentation.showSupportFallback && supportEnabled);

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
        <strong className="purchase-return-trust purchase-return-trust--verified">
          {presentation.assurance}
        </strong>
      ) : null}

      <PurchaseProgressSteps states={presentation.progress} />

      {presentation.detailHeading ? (
        <div className="purchase-return-status-detail">
          <h2>{presentation.detailHeading}</h2>
          {presentation.assurances.length > 0 ? (
            <ul className="purchase-return-assurances">
              {presentation.assurances.map((assurance) => (
                <li key={assurance}>{assurance}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {checkoutRestartFailed ? (
        <p className="purchase-return-error" role="alert">
          決済画面を再開できませんでした。同じお申し込みのまま、もう一度お試しください。
        </p>
      ) : null}

      {hasActions ? (
        <div className="purchase-return-actions">
          {presentation.showManualRefresh ? (
            <button
              type="button"
              className="button button--secondary"
              onClick={onManualRefresh}
            >
              同じお申し込みを確認する
            </button>
          ) : null}
          {presentation.showAccountFallback ? (
            <Link href="/account" className="button button--primary">
              私の鑑定ノートを確認する
            </Link>
          ) : null}
          {presentation.showCheckoutRestart ? (
            checkoutCancelled ? (
              <Link
                href={customerAuthEnabled ? "/purchase/auth/continue" : "/request"}
                className="button button--primary"
              >
                購入確認へ戻る
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="button button--primary"
                  disabled={checkoutRestarting}
                  onClick={() => void restartCheckout()}
                >
                  {checkoutRestarting
                    ? "決済画面を準備しています…"
                    : "同じお申し込みで決済を再開する"}
                </button>
                <Link href="/request" className="text-link">
                  相談内容からやり直す
                </Link>
              </>
            )
          ) : null}
          {presentation.showSupportFallback && supportEnabled ? (
            <Link href="/contact" className="text-link">
              お問い合わせへ進む
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function PurchaseReturnStatus({
  statusCapability,
  checkoutCancelled,
  customerAuthEnabled,
  supportEnabled,
}: {
  statusCapability: string;
  checkoutCancelled: boolean;
  customerAuthEnabled: boolean;
  supportEnabled: boolean;
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
  const inspectedCancelledCheckoutRef = useRef<string | null>(null);

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
        const inspectCancelledCheckout =
          checkoutCancelled &&
          inspectedCancelledCheckoutRef.current !== statusCapability;
        if (inspectCancelledCheckout) {
          inspectedCancelledCheckoutRef.current = statusCapability;
        }
        const response = await fetch("/api/payments/status", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statusCapability,
            ...(inspectCancelledCheckout ? { checkoutCancelled: true } : {}),
          }),
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
  }, [checkoutCancelled, statusCapability]);

  return (
    <PurchaseReturnStatusCard
      status={status}
      requestFailed={requestFailed}
      recoveryExhausted={recoveryExhausted}
      customerAuthEnabled={customerAuthEnabled}
      supportEnabled={supportEnabled}
      checkoutRestarting={checkoutRestarting}
      checkoutRestartFailed={checkoutRestartFailed}
      checkoutCancelled={checkoutCancelled}
      onManualRefresh={() => void pollerRef.current?.manualRefresh()}
      restartCheckout={restartCheckout}
    />
  );
}
