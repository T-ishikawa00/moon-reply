"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./PrePaymentSafetyStop.module.css";

export type PrePaymentSafetyStopKind =
  | "blocked_unsafe_assistance"
  | "urgent_safety_redirect"
  | "unsupported_professional_request";

type StopCopy = {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  actionLabel?: string;
};

const STOP_COPY: Record<PrePaymentSafetyStopKind, StopCopy> = {
  blocked_unsafe_assistance: {
    eyebrow: "このご依頼でお手伝いできる範囲",
    title: "その目的のお手伝いはできません",
    paragraphs: [
      "月の返事では、\n相手から示された拒否や連絡制限を回避する方法、\n別の手段や第三者を使う方法、\n監視・追跡、\n脅しや強い圧力を使う方法は提案しません。",
      "相手の境界を尊重しながら、\nご自身の気持ちを整理する相談へ\n切り替えることはできます。",
    ],
    actionLabel: "気持ちを整理する相談に切り替える",
  },
  urgent_safety_redirect: {
    eyebrow: "いま優先してほしいこと",
    title: "いまは鑑定より、安全を優先してください",
    paragraphs: [
      "現在の安全に関わる可能性があるため、\n月の返事では関係を進めるための文案や方針を\nお返しできません。",
      "安全な場所へ移ること、\n信頼できる人や適切な支援先につながることを\n優先してください。",
    ],
  },
  unsupported_professional_request: {
    eyebrow: "月の返事で扱える範囲",
    title: "この内容は、月の返事の対応範囲外です",
    paragraphs: [
      "法律、医療、契約、金銭等の専門判断は\n月の返事ではお受けできません。",
      "専門判断を含めず、\n気持ちや状況の整理だけに限定できる場合は、\n相談内容を切り替えて確認できます。",
    ],
    actionLabel: "気持ちの整理だけに切り替える",
  },
};

export function PrePaymentSafetyStop({
  kind,
  onSwitchToOrganization,
  reviewMode = false,
}: {
  kind: PrePaymentSafetyStopKind;
  onSwitchToOrganization?: () => void;
  reviewMode?: boolean;
}) {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const copy = STOP_COPY[kind];
  const role = kind === "urgent_safety_redirect" ? "alert" : "status";
  const variant =
    kind === "blocked_unsafe_assistance"
      ? styles.blocked
      : kind === "urgent_safety_redirect"
        ? styles.urgent
        : styles.professional;

  useEffect(() => {
    headingRef.current?.focus();
  }, [kind]);

  return (
    <section
      className={`${styles.resultCard} ${variant}`}
      role={role}
      aria-labelledby={headingId}
    >
      <p className={styles.eyebrow}>{copy.eyebrow}</p>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        {copy.title}
      </h2>
      <div className={styles.body}>
        {copy.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className={styles.paymentNote}>この画面では決済は発生しません。</p>
      {copy.actionLabel && onSwitchToOrganization ? (
        <button
          type="button"
          className={styles.resultAction}
          onClick={onSwitchToOrganization}
        >
          {copy.actionLabel}
        </button>
      ) : null}
      {copy.actionLabel && reviewMode ? (
        <span className={styles.reviewAction}>
          操作表示：{copy.actionLabel}
          <br />
          審査用fixtureでは入力を変更せず、実画面では選択変更後に利用確認をやり直します。
        </span>
      ) : null}
    </section>
  );
}
