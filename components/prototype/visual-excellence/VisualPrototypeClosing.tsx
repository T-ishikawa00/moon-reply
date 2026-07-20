import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { MoonSeal } from "@/components/brand/MoonSeal";
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

export function VisualPrototypeClosing({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const limitsId = `visual-prototype-${variant}-limits`;
  const closingId = `visual-prototype-${variant}-closing`;

  return (
    <>
      <section className={[styles.section, styles.limitsSection].join(" ")} aria-labelledby={limitsId}>
        <SectionHeading number="10" id={limitsId}>まだ断定できないこと</SectionHeading>
        <div className={styles.limitColumns}>
          <section aria-labelledby={`${limitsId}-unknown`}>
            <h3 id={`${limitsId}-unknown`}>分からないこと</h3>
            <ul className={styles.plainList}>
              {report.materialUnknowns.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
          <section aria-labelledby={`${limitsId}-can`}>
            <h3 id={`${limitsId}-can`}>このノートができること</h3>
            <ul className={styles.plainList}>
              {report.reportCapabilities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>
        <aside className={styles.disclaimer} aria-label="不確実性と非保証">
          <strong>不確実性と非保証</strong>
          <p>{report.fixedLimitationDisclaimer}</p>
        </aside>
      </section>

      <section
        className={[styles.section, styles.closingSection, variant === "a" ? styles.closingA : styles.closingB].join(" ")}
        aria-labelledby={closingId}
      >
        <SectionHeading number="11" id={closingId}>月の返事からの締め</SectionHeading>
        <blockquote className={styles.rememberTonight}>{report.rememberTonight}</blockquote>
        <div className={styles.closingLetter}>
          {report.closingLetter.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <EditorialDivider variant={variant === "a" ? "paper" : "night"} className={styles.closingDivider} />
        <div className={styles.closingSignature}>
          <MoonSeal size="small" />
          <span>月の返事</span>
        </div>
      </section>
    </>
  );
}
