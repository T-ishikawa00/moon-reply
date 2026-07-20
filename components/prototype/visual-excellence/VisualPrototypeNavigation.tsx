import Link from "next/link";
import type { ReviewReportFixture } from "@/fixtures/review/reports";
import styles from "./VisualPrototype.module.css";

export function VisualPrototypeNavigation({
  variant,
  report,
}: {
  variant: "a" | "b";
  report: ReviewReportFixture;
}) {
  const isA = variant === "a";

  return (
    <header className={styles.reviewHeader}>
      <div className={styles.reviewHeaderInner}>
        <div className={styles.reviewIdentity}>
          <p>M1-P3 coded visual prototype</p>
          <strong>{isA ? "A案 — Quiet Editorial Letter" : "B案 — Lunar Contrast Edition"}</strong>
          <div className={styles.reviewFacts} aria-label="prototype条件">
            <span>{isA ? "A案" : "B案"}</span>
            <span>同一fixture</span>
            <span>非本番</span>
            <span>購入・AI・保存・メール・送信なし</span>
          </div>
        </div>

        <nav className={styles.prototypeNav} aria-label="A/B coded prototype切替">
          <Link href="/review/visual-excellence">比較index</Link>
          <Link href="/review/visual-excellence/a" aria-current={isA ? "page" : undefined}>A案</Link>
          <Link href="/review/visual-excellence/b" aria-current={isA ? undefined : "page"}>B案</Link>
        </nav>

        <details className={styles.fixtureDetails}>
          <summary>審査条件</summary>
          <dl>
            <div><dt>result fixture</dt><dd>{report.id}</dd></div>
            <div><dt>request fixture</dt><dd>{report.requestFixtureId}</dd></div>
            <div><dt>購入</dt><dd>なし</dd></div>
            <div><dt>AI実行</dt><dd>なし</dd></div>
            <div><dt>保存・メール・外部送信</dt><dd>なし</dd></div>
          </dl>
        </details>
      </div>
    </header>
  );
}
