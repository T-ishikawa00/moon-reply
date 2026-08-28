import Link from "next/link";

import { MoonSeal } from "@/components/brand/MoonSeal";
import type {
  CustomerAccountCoverVariant,
  CustomerAccountHistoryPresentation,
} from "@/lib/customer-auth/account-history";
import styles from "./account.module.css";

const coverVariantClasses: Readonly<Record<CustomerAccountCoverVariant, string>> = {
  night: styles.coverNight,
  ivory: styles.coverIvory,
  violet: styles.coverViolet,
  processing: styles.coverProcessing,
};

function CoverArtwork({
  headingId,
  item,
}: {
  headingId: string;
  item: CustomerAccountHistoryPresentation;
}) {
  return (
    <div
      className={[styles.coverArtwork, coverVariantClasses[item.coverVariant]].join(
        " ",
      )}
    >
      <span className={styles.coverFrame} aria-hidden="true" />
      <span className={styles.coverStars} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <div className={styles.coverContent}>
        <p className={styles.coverBrand}>月の返事</p>
        <MoonSeal className={styles.coverSeal} size="medium" />
        {item.statusLabel ? (
          <span className={styles.coverStatus}>{item.statusLabel}</span>
        ) : null}
        <p className={styles.coverDate}>{item.coverDateLabel}の</p>
        <h2 id={headingId}>{item.title}</h2>
        <span className={styles.coverRule} aria-hidden="true" />
        <p className={styles.coverCopy}>{item.summary}</p>
        <span className={styles.coverOrnament} aria-hidden="true" />
      </div>
    </div>
  );
}

export function AccountNoteGallery({
  history,
  idPrefix = "account-note",
  supportEnabled,
}: {
  history: readonly CustomerAccountHistoryPresentation[];
  idPrefix?: string;
  supportEnabled: boolean;
}) {
  return (
    <ol className={styles.history} aria-label="鑑定ノート一覧">
      {history.map((item, index) => {
        const headingId = `${idPrefix}-${index}`;
        const noteContent = (
          <>
            <CoverArtwork headingId={headingId} item={item} />
            <span className={styles.noteMeta}>
              <time dateTime={item.date}>{item.dateTimeLabel}</time>
              <span className={styles.openLabel}>
                {item.canOpenResult ? "ノートをひらく" : item.statusLabel}
              </span>
            </span>
          </>
        );

        return (
          <li key={item.purchaseIntentId} className={styles.item}>
            <article aria-labelledby={headingId}>
              {item.canOpenResult && item.deliveryId !== null ? (
                <Link
                  className={styles.notePrimary}
                  href={`/account/results/${item.deliveryId}`}
                >
                  {noteContent}
                </Link>
              ) : (
                <div className={styles.notePrimary}>{noteContent}</div>
              )}
              {supportEnabled ? (
                <Link
                  className={styles.supportAction}
                  href={`/contact?purchase=${encodeURIComponent(item.purchaseIntentId)}`}
                >
                  この鑑定について問い合わせる
                </Link>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
