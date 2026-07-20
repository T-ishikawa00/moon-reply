import type { Metadata } from "next";
import Link from "next/link";
import { getReportFixture } from "@/fixtures/review/reports";
import styles from "@/components/prototype/visual-excellence/VisualPrototype.module.css";

export const metadata: Metadata = {
  title: "M1-P3 coded visual prototype比較 | 月の返事",
  description: "同一の固定fixtureを使ったA/B coded visual prototypeの非本番比較indexです。",
};

export default function VisualExcellencePrototypeIndexPage() {
  const report = getReportFixture("result-normal-001");
  if (!report) throw new Error("M1-P3 prototype fixed fixture is unavailable.");

  return (
    <main className={styles.indexPage}>
      <div className={styles.indexInner}>
        <p className={styles.indexEyebrow}>M1-P3 · CODED VISUAL PROTOTYPE</p>
        <h1>同じ内容を、二つの編集方針で比較する</h1>
        <p className={styles.indexLead}>
          A/Bは同じ固定fixture、同じ判断、同じcontent subset、同じsemantic orderを使います。
          比較するのは、長い日本語の読み心地、答えへの到達、章の切り替え、月の意匠の強さ、そして読了後の余韻です。
        </p>

        <dl className={styles.indexBoundary}>
          <div><dt>状態</dt><dd>非本番のHuman比較用prototype</dd></div>
          <div><dt>固定判断</dt><dd>{report.judgmentLabel}</dd></div>
          <div><dt>実行境界</dt><dd>購入・AI・保存・メール・外部送信なし</dd></div>
        </dl>

        <div className={styles.variantLinks}>
          <Link className={styles.variantLink} href="/review/visual-excellence/a">
            <span>A案</span>
            <div>
              <strong>Quiet Editorial Letter</strong>
              <p>紙とタイポグラフィを主役にした、静かな高級編集誌・私的な手紙。</p>
            </div>
            <b>A案を開く</b>
          </Link>
          <Link className={styles.variantLink} href="/review/visual-excellence/b">
            <span>B案</span>
            <div>
              <strong>Lunar Contrast Edition</strong>
              <p>月夜と紙の場面転換を強めた、鑑定ノートとしての印象が明確な案。</p>
            </div>
            <b>B案を開く</b>
          </Link>
        </div>

        <section className={styles.comparisonPoints} aria-labelledby="prototype-comparison-title">
          <h2 id="prototype-comparison-title">Human比較ポイント</h2>
          <ol>
            <li>最初の画面で答えが自然に見つかるか</li>
            <li>長文を最後まで読み続けられるか</li>
            <li>6 archetypeの役割が見た目だけでなく意味として区別できるか</li>
            <li>Aの抑制とBのNight/Paper contrastのどちらが商品価値に合うか</li>
            <li>文面案と3日間プランを後から見つけ直しやすいか</li>
            <li>不確実性と締めが、判断を弱めず誠実に終わるか</li>
          </ol>
        </section>

        <details className={styles.indexDetails}>
          <summary>固定sourceを確認</summary>
          <p>{report.id} / {report.requestFixtureId}</p>
        </details>
      </div>
    </main>
  );
}
