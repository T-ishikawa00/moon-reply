import type { ReviewReportFixture } from "@/fixtures/review/reports";
import styles from "./VisualPrototype.module.css";

export function VisualPrototypeAnswer({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const headingId = `visual-prototype-${variant}-answer`;

  return (
    <section
      className={[styles.section, styles.answerSection, variant === "a" ? styles.answerA : styles.answerB].join(" ")}
      aria-labelledby={headingId}
    >
      <div className={styles.sectionHeading}>
        <span aria-hidden="true">03</span>
        <h2 id={headingId}>今夜の答え</h2>
      </div>

      <div className={styles.answerBody}>
        <p className={styles.answerLabel}>詳細な判断</p>
        <p className={styles.answerStatement}>{report.judgmentLabel}</p>
        <p className={styles.answerReason}>{report.conclusionReasonSummary}</p>
        <p className={styles.answerContext}>{report.currentConclusion[1]}</p>

        <dl className={styles.nowNext}>
          <div><dt>今夜やること</dt><dd>{report.tonightActions[0]}</dd></div>
          <div><dt>次に見直す時期</dt><dd>{report.reviewTiming}</dd></div>
        </dl>
      </div>
    </section>
  );
}
