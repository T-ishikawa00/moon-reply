"use client";

import { useState } from "react";
import styles from "./CustomerAssessmentNote.module.css";

type CopyState = "idle" | "success" | "failure";

export function CustomerDraftCopyButton({ text }: { text: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  async function copyDraft() {
    try {
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
        : null;

  return (
    <div className={styles.copyAction}>
      <button className={styles.copyButton} type="button" onClick={copyDraft}>
        {copyState === "success" ? "コピーしました" : "文案をコピー"}
      </button>
      {statusMessage ? (
        <p className={styles.copyStatus} role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
