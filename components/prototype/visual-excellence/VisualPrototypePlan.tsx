import type { ReviewReportFixture } from "@/fixtures/review/reports";
import styles from "./VisualPrototype.module.css";

function SectionHeading({ number, id, children }: { number: string; id: string; children: string }) {
  return (
    <div className={styles.sectionHeading}>
      <span aria-hidden="true">{number}</span>
      <h2 id={id}>{children}</h2>
    </div>
  );
}

export function VisualPrototypePlan({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const planId = `visual-prototype-${variant}-plan`;
  const reviewId = `visual-prototype-${variant}-review`;

  return (
    <>
      <section className={[styles.section, styles.planSection].join(" ")} aria-labelledby={planId}>
        <SectionHeading number="08" id={planId}>3日間の月明かりプラン</SectionHeading>
        <ol className={styles.threeDayPlan}>
          {report.threeDayPlan.map((item, index) => (
            <li key={item.label}>
              <span className={[styles.phaseMark, styles[`phaseMark${index + 1}`]].join(" ")} aria-hidden="true" />
              <strong>{item.label}</strong>
              <p>{item.direction}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={[styles.section, styles.reevaluationSection].join(" ")} aria-labelledby={reviewId}>
        <SectionHeading number="09" id={reviewId}>再判断する条件</SectionHeading>
        <p className={styles.reviewTiming}>{report.reviewTiming}</p>
        <div className={styles.conditionColumns}>
          <section aria-labelledby={`${reviewId}-change`}>
            <h3 id={`${reviewId}-change`}>方針を変えられる条件</h3>
            <ul className={styles.plainList}>
              {report.recommendationChangeConditions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section aria-labelledby={`${reviewId}-hold`}>
            <h3 id={`${reviewId}-hold`}>送らない方針を保つ条件</h3>
            <ul className={styles.plainList}>
              {report.holdDirectionConditions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </section>
    </>
  );
}
