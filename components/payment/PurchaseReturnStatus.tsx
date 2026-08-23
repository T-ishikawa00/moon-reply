"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type PurchaseReturnSafeStatus =
  | { status: "confirming_payment" }
  | { status: "preparing_assessment" }
  | { status: "confirmation_pending"; paymentVerified: boolean }
  | { status: "temporary_problem"; retryable: true }
  | { status: "payment_not_completed" }
  | { status: "completed_check_verified_email" }
  | { status: "completed"; resultPath: string };

type PurchaseProgressState = "complete" | "current" | "next";
type PurchaseProgress = readonly [
  PurchaseProgressState,
  PurchaseProgressState,
  PurchaseProgressState,
];

const authenticatedResultPathPattern =
  /^\/account\/results\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const legacyResultPathPattern = /^\/result\/[A-Za-z0-9_-]{43}$/u;

export function decodePurchaseReturnStatus(
  value: unknown,
): PurchaseReturnSafeStatus | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const payload = value as Record<string, unknown>;
  if (typeof payload.data !== "object" || payload.data === null) return null;
  const data = payload.data as Record<string, unknown>;
  if (
    data.status === "confirming_payment" ||
    data.status === "preparing_assessment" ||
    data.status === "payment_not_completed" ||
    data.status === "completed_check_verified_email"
  ) {
    return { status: data.status };
  }
  if (
    data.status === "confirmation_pending" &&
    typeof data.paymentVerified === "boolean"
  ) {
    return {
      status: data.status,
      paymentVerified: data.paymentVerified,
    };
  }
  if (data.status === "temporary_problem" && data.retryable === true) {
    return { status: data.status, retryable: true };
  }
  if (
    data.status === "completed" &&
    typeof data.resultPath === "string" &&
    (legacyResultPathPattern.test(data.resultPath) ||
      authenticatedResultPathPattern.test(data.resultPath))
  ) {
    return { status: data.status, resultPath: data.resultPath };
  }
  return null;
}

function isPaymentVerified(status: PurchaseReturnSafeStatus) {
  if (status.status === "confirmation_pending") {
    return status.paymentVerified;
  }
  return (
    status.status === "preparing_assessment" ||
    status.status === "temporary_problem" ||
    status.status === "completed_check_verified_email" ||
    status.status === "completed"
  );
}

function PurchaseProgressSteps({
  states,
}: {
  states: PurchaseProgress;
}) {
  const steps = ["お支払い確認", "鑑定ノート作成", "お受け取り"] as const;
  const stateLabels: Record<PurchaseProgressState, string> = {
    complete: "完了",
    current: "現在",
    next: "次",
  };

  return (
    <ol className="purchase-return-progress" aria-label="お申し込みの進行状況">
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

function PurchaseAssurances({
  customerAuthEnabled,
}: {
  customerAuthEnabled: boolean;
}) {
  return (
    <ul className="purchase-return-assurances">
      <li>この画面を閉じても大丈夫です。</li>
      {customerAuthEnabled ? (
        <li>鑑定ノートはアカウントに保存されます。</li>
      ) : null}
      <li>完成したらメールでもお知らせします。</li>
    </ul>
  );
}

export function PurchaseReturnStatusCard({
  status,
  customerAuthEnabled,
  requestFailed = false,
  checkoutRestarting = false,
  checkoutRestartFailed = false,
  onReload,
  onRestartCheckout,
}: {
  status: PurchaseReturnSafeStatus;
  customerAuthEnabled: boolean;
  requestFailed?: boolean;
  checkoutRestarting?: boolean;
  checkoutRestartFailed?: boolean;
  onReload?: () => void;
  onRestartCheckout?: () => void;
}) {
  const paymentVerified = isPaymentVerified(status);

  if (status.status === "completed") {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>月の返事 / ご購入後の確認</p>
        <h1>鑑定ノートを開いています</h1>
        <PurchaseProgressSteps states={["complete", "complete", "complete"]} />
      </section>
    );
  }

  if (status.status === "payment_not_completed" && !requestFailed) {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>月の返事 / ご購入後の確認</p>
        <h1>決済は完了していません</h1>
        <span>料金は確定していません。同じ相談内容から安全にお手続きを再開できます。</span>
        <PurchaseProgressSteps states={["current", "next", "next"]} />
        {checkoutRestartFailed ? (
          <p className="purchase-return-error" role="alert">
            決済画面を再開できませんでした。時間を置いて、同じお申し込みからもう一度お試しください。
          </p>
        ) : null}
        <div className="purchase-return-actions">
          <button
            type="button"
            className="button button--primary"
            disabled={checkoutRestarting}
            onClick={onRestartCheckout}
          >
            {checkoutRestarting
              ? "決済画面を準備しています…"
              : "同じお申し込みで決済を再開する"}
          </button>
          <Link href="/request" className="text-link">
            相談内容からやり直す
          </Link>
        </div>
      </section>
    );
  }

  if (requestFailed && !paymentVerified) {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>月の返事 / ご購入後の確認</p>
        <h1>決済情報を確認しています</h1>
        <span>Stripeからのお支払い情報を安全に確認しています。</span>
        <strong className="purchase-return-trust">
          この段階で追加のお支払い操作はしないでください。
        </strong>
        <PurchaseProgressSteps states={["current", "next", "next"]} />
        <button type="button" className="text-link" onClick={onReload}>
          同じお申し込みを確認する
        </button>
      </section>
    );
  }

  if (
    status.status === "confirming_payment" ||
    (status.status === "confirmation_pending" && !status.paymentVerified)
  ) {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>月の返事 / ご購入後の確認</p>
        <h1>決済情報を確認しています</h1>
        <span>Stripeからのお支払い情報を安全に確認しています。</span>
        <strong className="purchase-return-trust">
          この段階で追加のお支払い操作はしないでください。
        </strong>
        <PurchaseProgressSteps states={["current", "next", "next"]} />
      </section>
    );
  }

  if (status.status === "preparing_assessment" && !requestFailed) {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>お支払い確認済み</p>
        <h1>お支払いを確認しました</h1>
        <strong className="purchase-return-trust purchase-return-trust--verified">
          税込980円のお支払いは正常に確認されています。追加のお支払いは必要ありません。
        </strong>
        <PurchaseProgressSteps states={["complete", "current", "next"]} />
        <div className="purchase-return-status-detail">
          <h2>鑑定ノートを作成しています</h2>
          <p>今夜の答えをまとめています。</p>
        </div>
        <PurchaseAssurances customerAuthEnabled={customerAuthEnabled} />
      </section>
    );
  }

  if (status.status === "completed_check_verified_email" && !requestFailed) {
    return (
      <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
        <p>お支払い確認済み</p>
        <h1>鑑定ノートが完成しました</h1>
        <strong className="purchase-return-trust purchase-return-trust--verified">
          追加のお支払いは必要ありません。
        </strong>
        <PurchaseProgressSteps states={["complete", "complete", "complete"]} />
        <div className="purchase-return-status-detail">
          <h2>確認済みのメールをご確認ください</h2>
          <p>このブラウザで開けない場合も、メールから安全にお受け取りいただけます。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="purchase-return-card" aria-live="polite" aria-atomic="true">
      <p>お支払い確認済み</p>
      <h1>お支払いは確認済みです。</h1>
      <strong className="purchase-return-trust purchase-return-trust--verified">
        追加のお支払いは必要ありません。
      </strong>
      <PurchaseProgressSteps states={["complete", "current", "next"]} />
      <div className="purchase-return-status-detail">
        <h2>鑑定ノートの作成に少し時間がかかっています。</h2>
        <p>お申し込みは保存されています。</p>
      </div>
      <PurchaseAssurances customerAuthEnabled={customerAuthEnabled} />
      {requestFailed ? (
        <button type="button" className="text-link" onClick={onReload}>
          同じお申し込みを確認する
        </button>
      ) : null}
    </section>
  );
}

export function PurchaseReturnStatus({
  statusCapability,
  customerAuthEnabled,
}: {
  statusCapability: string;
  customerAuthEnabled: boolean;
}) {
  const [status, setStatus] = useState<PurchaseReturnSafeStatus>({
    status: "confirming_payment",
  });
  const [requestFailed, setRequestFailed] = useState(false);
  const [checkoutRestarting, setCheckoutRestarting] = useState(false);
  const [checkoutRestartFailed, setCheckoutRestartFailed] = useState(false);

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
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function refresh() {
      try {
        const response = await fetch("/api/payments/status", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusCapability }),
        });
        if (!response.ok) throw new Error("PURCHASE_STATUS_UNAVAILABLE");
        const next = decodePurchaseReturnStatus(await response.json());
        if (!next) throw new Error("PURCHASE_STATUS_INVALID");
        if (!active) return;
        setRequestFailed(false);
        setStatus(next);
        if (next.status === "completed") {
          window.location.replace(next.resultPath);
          return;
        }
        if (
          next.status !== "payment_not_completed" &&
          next.status !== "completed_check_verified_email" &&
          next.status !== "confirmation_pending"
        ) {
          timeout = setTimeout(refresh, 2_500);
        }
      } catch {
        if (!active) return;
        setRequestFailed(true);
      }
    }

    void refresh();
    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [statusCapability]);

  return (
    <PurchaseReturnStatusCard
      status={status}
      customerAuthEnabled={customerAuthEnabled}
      requestFailed={requestFailed}
      checkoutRestarting={checkoutRestarting}
      checkoutRestartFailed={checkoutRestartFailed}
      onReload={() => window.location.reload()}
      onRestartCheckout={() => void restartCheckout()}
    />
  );
}
