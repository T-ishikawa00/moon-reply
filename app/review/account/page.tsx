import type { Metadata } from "next";
import Link from "next/link";

import type { CustomerAccountHistoryPresentation } from "@/lib/customer-auth/account-history";
import styles from "@/app/account/account.module.css";
import reviewStyles from "./review-account.module.css";

export const metadata: Metadata = {
  title: "私の鑑定ノート E3 審査用 | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

const syntheticHistory: readonly CustomerAccountHistoryPresentation[] = [
  {
    purchaseIntentId: "11111111-1111-4111-8111-111111111111",
    deliveryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    date: "2026-08-25T09:42:00Z",
    title: "あなたに届いた鑑定ノート",
    dateTimeLabel: "8月25日 18:42（日本時間）",
    statusLabel: null,
    summary: "迷った夜に受け取った言葉を、ここからいつでも読み返せます。",
    canOpenResult: true,
  },
  {
    purchaseIntentId: "22222222-2222-4222-8222-222222222222",
    deliveryId: null,
    date: "2026-08-25T01:05:00Z",
    title: "鑑定ノートを準備しています",
    dateTimeLabel: "8月25日 10:05（日本時間）",
    statusLabel: "準備中",
    summary: "言葉が届くまで、もう少しだけお待ちください。",
    canOpenResult: false,
  },
];

function ReviewHistory({ viewport }: { viewport: "320" | "390" | "1280" }) {
  return (
    <section
      className={[reviewStyles.frame, reviewStyles[`width${viewport}`]].join(
        " ",
      )}
      data-e3-viewport={viewport}
      aria-label={`${viewport}px幅の鑑定ノート一覧`}
    >
      <div className={styles.shell}>
        <p className={reviewStyles.viewportLabel}>{viewport}px</p>
        <ol className={styles.history} aria-label="鑑定ノート一覧">
          {syntheticHistory.map((item, index) => (
            <li key={item.purchaseIntentId} className={styles.item}>
              <article
                aria-labelledby={`review-${viewport}-account-note-${index}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.noteHeading}>
                    <time className={styles.dateLabel} dateTime={item.date}>
                      {item.dateTimeLabel}
                    </time>
                    <h2 id={`review-${viewport}-account-note-${index}`}>
                      {item.title}
                    </h2>
                  </div>
                  {item.statusLabel ? (
                    <span className={styles.status}>{item.statusLabel}</span>
                  ) : null}
                </div>
                <p className={styles.summary}>{item.summary}</p>
                <div className={styles.cardActions}>
                  {item.canOpenResult && item.deliveryId !== null ? (
                    <Link
                      className={styles.primaryAction}
                      href={`/account/results/${item.deliveryId}`}
                    >
                      ノートをひらく
                    </Link>
                  ) : null}
                  <Link
                    className={styles.secondaryAction}
                    href={`/contact?purchase=${encodeURIComponent(item.purchaseIntentId)}`}
                  >
                    この購入について問い合わせる
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function ReviewAccountPage() {
  return (
    <main className={reviewStyles.page}>
      <header className={reviewStyles.header}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>私の鑑定ノート E3 審査用</h1>
        <p>
          同日表示・状態・操作配置を、架空データのみで3つの幅に固定して確認します。
        </p>
      </header>
      <div className={reviewStyles.stack}>
        <ReviewHistory viewport="320" />
        <ReviewHistory viewport="390" />
        <ReviewHistory viewport="1280" />
      </div>
    </main>
  );
}
