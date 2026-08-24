"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";

import {
  customerSupportCategories,
  customerSupportCategoryRequiresPurchase,
  type CustomerSupportCaseStatus,
  type CustomerSupportCategory,
} from "@/lib/support/types";
import styles from "./CustomerSupportForm.module.css";

type OwnedPurchase = Readonly<{
  purchaseIntentId: string;
  dateLabel: string;
  stateLabel: string;
}>;

type SubmittedCase = Readonly<{
  caseReference: string;
  category: CustomerSupportCategory;
  status: CustomerSupportCaseStatus;
  createdAt: string;
}>;

const safeStatuses = new Set<CustomerSupportCaseStatus>([
  "open",
  "in_review",
  "waiting_customer",
  "resolved",
  "closed",
]);
const safeCategories = new Set<CustomerSupportCategory>(
  customerSupportCategories.map((category) => category.value),
);

const statusLabels: Record<CustomerSupportCaseStatus, string> = {
  open: "受付済み",
  in_review: "確認中",
  waiting_customer: "追加確認待ち",
  resolved: "確認完了",
  closed: "終了",
};

function isSubmittedCase(value: unknown): value is { data: SubmittedCase } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const data = (value as { data?: unknown }).data;
  return (
    typeof data === "object" &&
    data !== null &&
    !Array.isArray(data) &&
    typeof (data as SubmittedCase).caseReference === "string" &&
    typeof (data as SubmittedCase).createdAt === "string" &&
    safeCategories.has((data as SubmittedCase).category) &&
    safeStatuses.has((data as SubmittedCase).status)
  );
}

export function CustomerSupportForm({
  purchases,
  initialPurchaseIntentId,
}: {
  purchases: readonly OwnedPurchase[];
  initialPurchaseIntentId: string | null;
}) {
  const initialPurchase =
    purchases.find(
      (purchase) => purchase.purchaseIntentId === initialPurchaseIntentId,
    )?.purchaseIntentId ?? purchases[0]?.purchaseIntentId ?? "";
  const [category, setCategory] = useState<CustomerSupportCategory>(
    purchases.length > 0 ? "result_delivery" : "account_login",
  );
  const [purchaseIntentId, setPurchaseIntentId] = useState(initialPurchase);
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedCase, setSubmittedCase] = useState<SubmittedCase | null>(null);
  const idempotency = useRef<{ fingerprint: string; key: string } | null>(null);
  const purchaseRequired = customerSupportCategoryRequiresPurchase(category);
  const selectedCategoryLabel = useMemo(
    () =>
      customerSupportCategories.find((candidate) => candidate.value === category)!
        .label,
    [category],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    if (purchaseRequired && purchaseIntentId === "") {
      setErrorMessage("対象の購入を選んでください。");
      return;
    }
    const payload = {
      category,
      purchaseIntentId: purchaseRequired ? purchaseIntentId : null,
      customerNote,
    };
    const fingerprint = JSON.stringify(payload);
    if (!idempotency.current || idempotency.current.fingerprint !== fingerprint) {
      idempotency.current = { fingerprint, key: crypto.randomUUID() };
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/support/cases", {
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
      if (!response.ok || !isSubmittedCase(body)) {
        if (response.status === 401) {
          setErrorMessage(
            "ログイン状態を確認できませんでした。ページを開き直してください。",
          );
        } else if (response.status === 409) {
          setErrorMessage(
            "送信内容が変わったため受付できませんでした。内容を確認して、もう一度送信してください。",
          );
        } else if (response.status === 404) {
          setErrorMessage(
            "購入または受付状態を確認できませんでした。アカウント画面から対象の購入を選び直してください。",
          );
        } else {
          setErrorMessage(
            "現在受付できません。お支払いや鑑定ノートの処理状態は変更されていません。",
          );
        }
        return;
      }
      setSubmittedCase(body.data);
    } catch {
      setErrorMessage(
        "現在受付できません。お支払いや鑑定ノートの処理状態は変更されていません。",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedCase) {
    return (
      <section className={styles.complete} aria-live="polite">
        <p className={styles.eyebrow}>受付が完了しました</p>
        <h2>お問い合わせを記録しました</h2>
        <dl className={styles.summary}>
          <div>
            <dt>受付番号</dt>
            <dd>{submittedCase.caseReference}</dd>
          </div>
          <div>
            <dt>種類</dt>
            <dd>{selectedCategoryLabel}</dd>
          </div>
          <div>
            <dt>状態</dt>
            <dd>{statusLabels[submittedCase.status]}</dd>
          </div>
        </dl>
        <p>
          この受付は問題を記録するものです。返金、再処理、支払状態の変更が自動で行われたことを意味しません。
        </p>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label htmlFor="support-category">お問い合わせの種類</label>
        <select
          id="support-category"
          value={category}
          onChange={(event) => {
            const next = event.target.value as CustomerSupportCategory;
            setCategory(next);
            if (!customerSupportCategoryRequiresPurchase(next)) {
              setPurchaseIntentId("");
            } else if (purchaseIntentId === "") {
              setPurchaseIntentId(initialPurchase);
            }
          }}
        >
          {customerSupportCategories.map((candidate) => (
            <option key={candidate.value} value={candidate.value}>
              {candidate.label}
            </option>
          ))}
        </select>
      </div>

      {purchaseRequired ? (
        <div className={styles.field}>
          <label htmlFor="support-purchase">対象の購入</label>
          <select
            id="support-purchase"
            value={purchaseIntentId}
            onChange={(event) => setPurchaseIntentId(event.target.value)}
            required
          >
            <option value="">購入を選んでください</option>
            {purchases.map((purchase) => (
              <option
                key={purchase.purchaseIntentId}
                value={purchase.purchaseIntentId}
              >
                {purchase.dateLabel}・鑑定ノート・{purchase.stateLabel}
              </option>
            ))}
          </select>
          <p className={styles.hint}>
            ログイン中のご本人に結び付いた購入だけを表示します。決済IDや結果URLの入力は不要です。
          </p>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="support-note">補足（任意・1000文字以内）</label>
        <textarea
          id="support-note"
          rows={6}
          maxLength={1_000}
          value={customerNote}
          onChange={(event) => setCustomerNote(event.target.value)}
          aria-describedby="support-note-warning"
        />
        <p className={styles.counter}>{customerNote.length} / 1000</p>
      </div>

      <aside id="support-note-warning" className={styles.warning}>
        <h2>補足欄に入力しないでください</h2>
        <p>
          カード番号、パスワード、OTP・ログインコード、結果URL、決済事業者のID、相談本文、第三者の秘密は入力しないでください。
        </p>
      </aside>

      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button type="submit" className="button button--primary" disabled={submitting}>
        {submitting ? "受付を記録しています" : "問い合わせを送信する"}
      </button>
      <p className={styles.hint}>
        送信しても、返金、決済、鑑定ノート生成、メール再送は自動では実行されません。
      </p>
    </form>
  );
}
