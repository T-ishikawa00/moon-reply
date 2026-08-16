"use client";

import { useId, useState } from "react";
import styles from "./CustomerAssessmentNote.module.css";

type CopyState = "idle" | "success" | "failure";

export function CustomerDraftCopyButton({ text }: { text: string }) {
  const statusId = useId();
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyDraft() {
    setCopyState("idle");
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(text);
      setCopyState("success");
    } catch {
      setCopyState("failure");
    }
  }

  const statusMessage =
    copyState === "success"
      ? "コピーしました"
      : copyState === "failure"
        ? "コピーできませんでした。文面を選択してコピーしてください。"
        : "";

  return (
    <div className={styles.copyAction}>
      <button
        className={styles.copyButton}
        type="button"
        onClick={copyDraft}
        aria-describedby={copyState === "idle" ? undefined : statusId}
      >
        {copyState === "success" ? "コピー済み" : "文案をコピー"}
      </button>
      <p
        id={statusId}
        className={styles.copyStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </p>
    </div>
  );
}
