import type { ReviewReportFixture } from "@/fixtures/review/reports";
import { VisualPrototypeAnswer } from "./VisualPrototypeAnswer";
import { VisualPrototypeClosing } from "./VisualPrototypeClosing";
import { VisualPrototypeCover } from "./VisualPrototypeCover";
import { VisualPrototypeEvidence } from "./VisualPrototypeEvidence";
import { VisualPrototypeLetter } from "./VisualPrototypeLetter";
import { VisualPrototypeMessage } from "./VisualPrototypeMessage";
import { VisualPrototypeNavigation } from "./VisualPrototypeNavigation";
import { VisualPrototypePlan } from "./VisualPrototypePlan";
import styles from "./VisualPrototype.module.css";

export function VisualPrototypeShell({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  return (
    <main className={[styles.page, variant === "a" ? styles.pageA : styles.pageB].join(" ")}>
      <VisualPrototypeNavigation variant={variant} report={report} />
      <div className={styles.stage}>
        <article className={[styles.artifact, variant === "a" ? styles.artifactA : styles.artifactB].join(" ")}>
          <VisualPrototypeCover variant={variant} report={report} />
          <VisualPrototypeLetter variant={variant} report={report} />
          <VisualPrototypeAnswer variant={variant} report={report} />
          <VisualPrototypeEvidence variant={variant} report={report} />
          <VisualPrototypeMessage variant={variant} report={report} />
          <VisualPrototypePlan variant={variant} report={report} />
          <VisualPrototypeClosing variant={variant} report={report} />
        </article>
      </div>
    </main>
  );
}
