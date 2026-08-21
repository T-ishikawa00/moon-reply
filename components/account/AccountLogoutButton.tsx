"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountLogoutButton({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrfToken, scope: "local" }),
      });
      if (!response.ok) throw new Error("logout failed");
      router.replace("/account");
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void logout()} disabled={busy}>
        {busy ? "ログアウトしています" : "ログアウト"}
      </button>
      {failed ? <p role="alert">ログアウトできませんでした。もう一度お試しください。</p> : null}
    </div>
  );
}
