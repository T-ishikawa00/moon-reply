import type { Metadata } from "next";
import Link from "next/link";

import { AccountNoteGallery } from "@/app/account/AccountNoteGallery";
import { AccountNoteHero } from "@/app/account/AccountNoteHero";
import styles from "@/app/account/account.module.css";
import { presentCustomerAccountHistory } from "@/lib/customer-auth/account-history";
import reviewStyles from "./review-account.module.css";

export const metadata: Metadata = {
  title: "私の鑑定ノート Cover Gallery R2 審査用 | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

const syntheticHistory = presentCustomerAccountHistory([
  {
    purchaseIntentId: "11111111-1111-4111-8111-111111111111",
    deliveryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    date: "2026-08-27T10:18:00Z",
    state: "completed",
  },
  {
    purchaseIntentId: "11111111-1111-4111-8111-111111111112",
    deliveryId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
    date: "2026-08-26T13:42:00Z",
    state: "completed",
  },
  {
    purchaseIntentId: "11111111-1111-4111-8111-111111111113",
    deliveryId: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
    date: "2026-08-25T09:05:00Z",
    state: "completed",
  },
  {
    purchaseIntentId: "11111111-1111-4111-8111-111111111114",
    deliveryId: null,
    date: "2026-08-24T01:05:00Z",
    state: "processing",
  },
]);

function ReviewGallery({ viewport }: { viewport: "390" | "1280" }) {
  return (
    <section
      className={[reviewStyles.frame, reviewStyles[`width${viewport}`]].join(
        " ",
      )}
      data-r2-viewport={viewport}
      aria-label={`${viewport}px幅のCover Gallery`}
    >
      <p className={reviewStyles.viewportLabel}>{viewport}px</p>
      <div className={styles.shell}>
        <AccountNoteGallery
          history={syntheticHistory}
          idPrefix={`review-${viewport}-account-note`}
          supportEnabled
        />
      </div>
    </section>
  );
}

function ReviewEmptyState() {
  return (
    <section
      className={[reviewStyles.frame, reviewStyles.width390].join(" ")}
      aria-label="空の鑑定ノート表示"
    >
      <p className={reviewStyles.viewportLabel}>Empty · 390px</p>
      <section className={styles.empty}>
        <p className={styles.stateKicker}>私の鑑定ノート</p>
        <h2>まだ届いた鑑定ノートはありません</h2>
        <p>新しい鑑定ノートが届くと、この場所からいつでも読み返せます。</p>
        <Link href="/request">新しい鑑定を依頼する</Link>
      </section>
    </section>
  );
}

export default function ReviewAccountPage() {
  return (
    <main className={reviewStyles.page}>
      <AccountNoteHero />
      <div className={reviewStyles.reviewBody}>
        <header className={reviewStyles.header}>
          <p className={reviewStyles.kicker}>Human Visual QA Surface</p>
          <h2>Cover Gallery R2 審査用</h2>
          <p>
            完了ノート3種、準備中、空状態を架空データだけで確認します。
          </p>
        </header>
        <div className={reviewStyles.stack}>
          <ReviewGallery viewport="1280" />
          <ReviewGallery viewport="390" />
          <ReviewEmptyState />
        </div>
      </div>
    </main>
  );
}
