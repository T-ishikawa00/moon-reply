import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { CustomerDraftCopyButton } from "@/components/runtime/CustomerDraftCopyButton";
import type { V19L5MessageProjection } from "@/lib/assessment/runtime/v19-l5-customer-projection";
import styles from "./CustomerAssessmentNote.module.css";

// Imported only by the local candidate preview. Production selection is unchanged.
export function V19L5MessageAssessmentNote({ projection }: { projection: V19L5MessageProjection }) {
  return (
    <article className={styles.note} aria-label="文面の鑑定ノート">
      <header className={styles.noteHeader}>
        <LunarArc tone="night" position="top-right" className={styles.headerArc} />
        <div className={styles.brand}><MoonSeal /><span>月の返事</span></div>
        <p className={styles.documentType}>恋のメッセージ鑑定ノート</p>
        <p className={styles.sectionKicker}>この相談への返事</p>
        <h1>{projection.opening}</h1>
        <EditorialDivider variant="night" className={styles.headerDivider} />
      </header>
      <section className={[styles.section, styles.draftSection].join(" ")}>
        <p className={styles.sectionKicker}>文面のご提案</p>
        <h2>{projection.kind === "message_edit" ? "整えた文面" : "伝えたいことを文面に"}</h2>
        <p className={styles.draftText}>{projection.draft}</p>
        <CustomerDraftCopyButton text={projection.draft} />
      </section>
      <section className={styles.section}>
        <h2>{projection.kind === "message_edit" ? "整え方について" : "この文面について"}</h2>
        <p className={styles.situationLead}>{projection.explanation}</p>
      </section>
      <section className={[styles.section, styles.closingSection].join(" ")}>
        <p className={styles.sectionKicker}>結びに</p><p>{projection.closing}</p>
      </section>
    </article>
  );
}
