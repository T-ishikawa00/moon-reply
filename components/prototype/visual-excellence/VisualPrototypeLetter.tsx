import type { ReviewReportFixture } from "@/fixtures/review/reports";
import styles from "./VisualPrototype.module.css";

export function VisualPrototypeLetter({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const headingId = `visual-prototype-${variant}-letter`;

  return (
    <section className={[styles.section, styles.letterSection].join(" ")} aria-labelledby={headingId}>
      <div className={styles.sectionHeading}>
        <span aria-hidden="true">02</span>
        <h2 id={headingId}>月の返事からの短い手紙</h2>
      </div>
      <div className={styles.letterBody}>
        {report.shortLetter.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  );
}
