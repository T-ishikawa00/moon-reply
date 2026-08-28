import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import styles from "./account.module.css";

export function AccountNoteHero() {
  return (
    <header className={styles.hero}>
      <LunarArc tone="night" position="top-right" />
      <div className={styles.heroInner}>
        <div className={styles.brand}>
          <MoonSeal size="medium" />
          <span>月の返事</span>
        </div>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>私の鑑定ノート</h1>
        <p className={styles.intro}>
          これまで届いた鑑定ノートを、ここからいつでも読み返せます。
        </p>
        <EditorialDivider variant="night" />
      </div>
    </header>
  );
}
