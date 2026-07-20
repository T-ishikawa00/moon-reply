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

export function VisualPrototypeMessage({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const draftId = `visual-prototype-${variant}-draft`;
  const actionId = `visual-prototype-${variant}-actions`;

  return (
    <>
      <section className={[styles.section, styles.messageSection].join(" ")} aria-labelledby={draftId}>
        <SectionHeading number="06" id={draftId}>送る場合の文面案</SectionHeading>
        <blockquote className={styles.messageDraft}>
          <p>{report.laterMessageDraft}</p>
        </blockquote>
      </section>

      <section className={[styles.section, styles.actionsSection].join(" ")} aria-labelledby={actionId}>
        <SectionHeading number="07" id={actionId}>今夜やること／やらないこと</SectionHeading>
        <div className={styles.actionColumns}>
          <section aria-labelledby={`${actionId}-do`}>
            <h3 id={`${actionId}-do`}>今夜やること</h3>
            <ul className={styles.plainList}>
              {report.tonightActions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section aria-labelledby={`${actionId}-not`}>
            <h3 id={`${actionId}-not`}>今夜やらないこと</h3>
            <ul className={styles.plainList}>
              {report.notTonightActions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
      </section>
    </>
  );
}
