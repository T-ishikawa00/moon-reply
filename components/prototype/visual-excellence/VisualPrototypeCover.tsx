import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type { ReviewReportFixture } from "@/fixtures/review/reports";
import styles from "./VisualPrototype.module.css";

export function VisualPrototypeCover({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const isA = variant === "a";

  return (
    <header className={[styles.cover, isA ? styles.coverA : styles.coverB].join(" ")}>
      {!isA && <LunarArc tone="night" position="top-right" className={styles.coverArc} />}

      <div className={styles.coverBrand}>
        <MoonSeal size={isA ? "small" : "medium"} className={styles.coverSeal} />
        <span>月の返事</span>
      </div>

      <p className={styles.productLabel}>恋のメッセージ鑑定ノート</p>
      <h1>{report.consultationTheme}</h1>

      <dl className={styles.coverMetadata}>
        <div><dt>相談者</dt><dd>{report.clientNickname}さん</dd></div>
        <div><dt>鑑定日</dt><dd>{report.readingDateLabel}</dd></div>
      </dl>

      <EditorialDivider variant={isA ? "paper" : "night"} className={styles.coverDivider} />
      <p className={styles.coverLine}>{report.coverLine}</p>

      <div className={styles.coverAnswer} aria-label="今夜の答え">
        <p>今夜の答え</p>
        <strong>{report.judgmentLabel}</strong>
      </div>
    </header>
  );
}
