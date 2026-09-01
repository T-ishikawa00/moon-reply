"use client";

import { useRef, useState, type FormEvent } from "react";

import {
  purchaseSupportInquiryCategories,
  type PurchaseSupportInquiryCategory,
} from "@/lib/support/types";
import styles from "./CustomerSupportForm.module.css";

function isAccepted(value: unknown): value is { data: { status: "accepted" } } {
  return (value as { data?: { status?: unknown } } | null)?.data?.status ===
    "accepted";
}

const failureMessages: Readonly<Record<number, string>> = {
  401: "ログイン状態を確認できませんでした。ページを開き直してください。",
  404: "対象の購入を確認できませんでした。アカウント画面から選び直してください。",
  429: "短時間に送信が続きました。時間を置いて、もう一度お試しください。",
};

export function PurchaseLinkedSupportForm({
  purchaseIntentId,
  purchaseDateLabel,
}: {
  purchaseIntentId: string;
  purchaseDateLabel: string;
}) {
  const [category, setCategory] = useState<PurchaseSupportInquiryCategory>(
    "missing_delivery",
  );
  const [customerMessage, setCustomerMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const payload = { category, purchaseIntentId, customerMessage };
    const fingerprint = JSON.stringify(payload);
    if (idempotency.current?.fingerprint !== fingerprint) {
      idempotency.current = { fingerprint, key: crypto.randomUUID() };
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/support/purchase-inquiries", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          idempotencyKey: idempotency.current.key,
        }),
      });
      const body = (await response.json()) as unknown;
      if (!response.ok || !isAccepted(body)) {
        setErrorMessage(failureMessages[response.status] ??
          "現在お問い合わせを受け付けられません。時間を置いて、もう一度お試しください。");
        return;
      }
      setAccepted(true);
    } catch {
      setErrorMessage(
        "現在お問い合わせを受け付けられません。時間を置いて、もう一度お試しください。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (accepted) {
    return (
      <section className={styles.complete} aria-live="polite">
        <h2>お問い合わせを受け付けました</h2>
        <p>
          内容を確認します。返金や鑑定ノートの処理、決済、メール再送は自動では行われません。
        </p>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <section aria-labelledby="purchase-summary">
        <h2 id="purchase-summary">この購入について</h2>
        <p>
          購入日時：{purchaseDateLabel}<br />
          恋のメッセージ鑑定ノート<br />
          ¥980
        </p>
      </section>

      <fieldset className={styles.field}>
        <legend>お問い合わせ内容</legend>
        {purchaseSupportInquiryCategories.map((candidate) => (
          <label key={candidate.value}>
            <input type="radio" name="purchase-support-category"
              value={candidate.value} checked={category === candidate.value}
              onChange={() => setCategory(candidate.value)} />
            <span>{candidate.label}</span>
          </label>
        ))}
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="purchase-support-message">詳細（任意）</label>
        <textarea
          id="purchase-support-message"
          rows={7}
          maxLength={1_000}
          value={customerMessage}
          onChange={(event) => setCustomerMessage(event.target.value)}
          aria-describedby="purchase-support-warning purchase-support-count"
        />
        <p id="purchase-support-count" className={styles.counter}>
          {customerMessage.length} / 1000
        </p>
      </div>

      <aside id="purchase-support-warning" className={styles.warning}>
        <h2>秘密情報や鑑定内容は入力しないでください</h2>
        <p>
          カード番号、パスワード、OTP・ログインコード、決済事業者のID、相談本文、鑑定本文は入力しないでください。
        </p>
      </aside>

      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className="button button--primary" disabled={submitting}>
        {submitting ? "送信しています" : "送信する"}
      </button>
      <p className={styles.hint}>
        送信しても、返金、再生成、再決済、完成メールの再送は行われません。
      </p>
    </form>
  );
}
