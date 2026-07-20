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

export function VisualPrototypeEvidence({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const relationshipId = `visual-prototype-${variant}-relationship`;
  const temperatureId = `visual-prototype-${variant}-temperature`;

  return (
    <>
      <section className={[styles.section, styles.evidenceSection].join(" ")} aria-labelledby={relationshipId}>
        <SectionHeading number="04" id={relationshipId}>今の関係と、確認できること</SectionHeading>
        <div className={styles.evidenceLayout}>
          <section aria-labelledby={`${relationshipId}-timeline`}>
            <h3 id={`${relationshipId}-timeline`}>関係の流れ</h3>
            <ol className={styles.relationshipTimeline}>
              {report.relationshipTimeline.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </section>
          <section aria-labelledby={`${relationshipId}-facts`}>
            <h3 id={`${relationshipId}-facts`}>確認できる事実</h3>
            <ul className={styles.plainList}>
              {report.observedFacts.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </section>

      <section className={[styles.section, styles.temperatureSection].join(" ")} aria-labelledby={temperatureId}>
        <SectionHeading number="05" id={temperatureId}>文面の温度</SectionHeading>
        <blockquote className={styles.temperatureQuote}>
          <span>送ろうとしている文面</span>
          <p>{report.messageTemperature.quote}</p>
        </blockquote>
        <dl className={styles.temperatureNotes}>
          <div><dt>柔らかさ</dt><dd>{report.messageTemperature.softness}</dd></div>
          <div><dt>好意</dt><dd>{report.messageTemperature.affection}</dd></div>
          <div><dt>圧力になり得る点</dt><dd>{report.messageTemperature.pressure}</dd></div>
          <div><dt>整え方</dt><dd>{report.messageTemperature.adjustment}</dd></div>
        </dl>
      </section>
    </>
  );
}
