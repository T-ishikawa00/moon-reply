"use client";

import { useState } from "react";

import { trackClientMeasurement } from "@/lib/measurement/client";

export function AuthenticatedCheckoutButton({
  csrfToken,
  preparationCapability,
}: {
  csrfToken: string;
  preparationCapability?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function startCheckout() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          preparationCapability
            ? { preparationCapability }
            : { authContinuation: true, csrfToken },
        ),
      });
      if (!response.ok) throw new Error("checkout failed");
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("data" in payload) ||
        typeof payload.data !== "object" ||
        payload.data === null ||
        !("checkoutUrl" in payload.data) ||
        typeof payload.data.checkoutUrl !== "string"
      ) {
        throw new Error("invalid checkout response");
      }
      const checkoutUrl = new URL(payload.data.checkoutUrl);
      if (
        checkoutUrl.origin !== "https://checkout.stripe.com" ||
        checkoutUrl.username !== "" ||
        checkoutUrl.password !== ""
      ) {
        throw new Error("invalid checkout URL");
      }
      trackClientMeasurement("checkout_start", { provider: "stripe" });
      window.location.assign(checkoutUrl.toString());
    } catch {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <div>
      {failed ? (
        <p role="alert">
          決済画面を準備できませんでした。料金は発生していません。時間を置いてお試しください。
        </p>
      ) : null}
      <button type="button" disabled={busy} onClick={() => void startCheckout()}>
        {busy ? "安全な決済画面を準備しています" : "980円を支払い、鑑定を申し込む"}
      </button>
    </div>
  );
}
