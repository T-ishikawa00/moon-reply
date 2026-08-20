"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SafeStatus =
  | { status: "confirming_payment" }
  | { status: "preparing_assessment" }
  | { status: "temporary_problem"; retryable: true }
  | { status: "payment_not_completed" }
  | { status: "completed_check_verified_email" }
  | { status: "completed"; resultPath: string };

function decode(value: unknown): SafeStatus | null {
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
  if (data.status === "temporary_problem" && data.retryable === true) {
    return { status: data.status, retryable: true };
  }
  if (
    data.status === "completed" &&
    typeof data.resultPath === "string" &&
    /^\/result\/[A-Za-z0-9_-]{43}$/u.test(data.resultPath)
  ) {
    return { status: data.status, resultPath: data.resultPath };
  }
  return null;
}

const copy: Record<Exclude<SafeStatus["status"], "completed">, {
  heading: string;
  body: string;
}> = {
  confirming_payment: {
    heading: "決済を確認しています",
    body: "画面を閉じずにお待ちください。再読み込みしても、同じお申し込みを確認します。",
  },
  preparing_assessment: {
    heading: "鑑定を準備しています",
    body: "お支払い済みの同じ鑑定ノートを準備しています。追加の決済は行いません。",
  },
  temporary_problem: {
    heading: "確認に少し時間がかかっています",
    body: "同じお申し込みを安全に確認しています。再決済せず、この画面からもう一度確認できます。",
  },
  payment_not_completed: {
    heading: "決済は完了していません",
    body: "料金は確定していません。再開する場合も、同じ相談内容から安全にお手続きください。",
  },
  completed_check_verified_email: {
    heading: "鑑定が完成しました",
    body: "確認済みのメールアドレスへ結果をご案内しています。このブラウザで開けない場合は、メールをご確認ください。",
  },
};

export function PurchaseReturnStatus({
  statusCapability,
}: {
  statusCapability: string;
}) {
  const [status, setStatus] = useState<SafeStatus>({
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
        const next = decode(await response.json());
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
          next.status !== "completed_check_verified_email"
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

  if (status.status === "completed") {
    return (
      <section className="purchase-return-card" aria-live="polite">
        <p>鑑定が完成しました</p>
        <h1>結果を開いています</h1>
      </section>
    );
  }

  const current = requestFailed ? copy.temporary_problem : copy[status.status];
  return (
    <section className="purchase-return-card" aria-live="polite">
      <p>月の返事 / ご購入後の確認</p>
      <h1>{current.heading}</h1>
      <span>{current.body}</span>
      {requestFailed ? (
        <button type="button" onClick={() => window.location.reload()}>
          同じお申し込みを確認する
        </button>
      ) : null}
      {status.status === "payment_not_completed" ? (
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
