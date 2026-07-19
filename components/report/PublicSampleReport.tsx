import Link from "next/link";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type { PublicSampleReportCase } from "@/fixtures/public/public-sample-cases";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

export function PublicSampleReport({ sample }: { sample: PublicSampleReportCase }) {
  const { report } = sample;

  return (
    <main className="public-sample-page">
      <section className="public-sample-intro" aria-labelledby="sample-page-title">
        <div className="page-shell public-sample-intro__inner">
          <div>
            <span className="status-label status-label--review">架空ケース</span>
            <h1 id="sample-page-title">{report.title}</h1>
            <p>
              この全文見本は、文章の雰囲気と鑑定ノートの構成をご確認いただくための固定架空ケースです。
              実在の相談者・購入者の事例でも、AI生成実績でもありません。
            </p>
          </div>
          <Link href="/request" className="button button--primary">鑑定ノートを依頼する</Link>
        </div>
      </section>

      <div className="public-sample-stage">
        <article className="public-sample-note paper-grain">
          <header className="public-sample-note__cover">
            <LunarArc tone="night" position="top-right" />
            <div className="public-sample-note__brand"><MoonSeal size="medium" /><span>月の返事</span></div>
            <p>恋のメッセージ鑑定ノート・架空の全文見本</p>
            <h2>{sample.relationshipContext}</h2>
            <EditorialDivider variant="night" />
            <span>{report.coverLine}</span>
          </header>

          <section className="public-sample-answer" aria-labelledby="public-sample-answer-heading">
            <p>今夜の答え</p>
            <h2 id="public-sample-answer-heading">{sample.conclusion}</h2>
          </section>

          <div className="public-sample-note__body">
            <section aria-labelledby="sample-section-1">
              <span aria-hidden="true">01</span>
              <h2 id="sample-section-1">月の返事からの短い手紙</h2>
              <div>{report.shortLetter.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            </section>

            <section aria-labelledby="sample-section-2">
              <span aria-hidden="true">02</span>
              <h2 id="sample-section-2">判断を分けた事実</h2>
              <div>
                <p>{sample.relationshipContext}</p>
                <dl className="public-sample-fact-list">
                  <div>
                    <dt>相手の最後の文面</dt>
                    <dd>「{sample.lastReceivedMessage}」</dd>
                  </div>
                  <div>
                    <dt>今夜返す文面案</dt>
                    <dd>「{sample.intendedMessage}」</dd>
                  </div>
                </dl>
                <ul className="public-sample-detail-list">
                  {sample.confirmedFacts.map((fact) => <li key={fact}>{fact}</li>)}
                </ul>
              </div>
            </section>

            <section aria-labelledby="sample-section-3">
              <span aria-hidden="true">03</span>
              <h2 id="sample-section-3">この鑑定の理由</h2>
              <div>
                <ul className="public-sample-detail-list">
                  {sample.reason.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </div>
            </section>

            <section className="public-sample-temperature" aria-labelledby="sample-section-4">
              <span aria-hidden="true">04</span>
              <h2 id="sample-section-4">文面の温度</h2>
              <div>
                <blockquote>「{report.messageTemperature.quote}」</blockquote>
                <dl>
                  {report.messageTemperature.readings.map((reading) => (
                    <div key={reading.label}>
                      <dt>{reading.label}</dt>
                      <dd>{reading.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </section>

            <section aria-labelledby="sample-section-5">
              <span aria-hidden="true">05</span>
              <h2 id="sample-section-5">今夜の行動案</h2>
              <div>
                <ul className="public-sample-detail-list">
                  {sample.immediateAction.map((action) => <li key={action}>{action}</li>)}
                </ul>
              </div>
            </section>

            <section aria-labelledby="sample-section-6">
              <span aria-hidden="true">06</span>
              <h2 id="sample-section-6">3日間の方向</h2>
              <div>
                <ol className="public-sample-plan">
                  {report.threeDayDirection.map((day) => (
                    <li key={day.label}>
                      <strong>{day.label}</strong>
                      <p>{day.direction}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section aria-labelledby="sample-section-7">
              <span aria-hidden="true">07</span>
              <h2 id="sample-section-7">次に判断を見直す条件</h2>
              <div>
                <ul className="public-sample-detail-list">
                  {sample.nextReviewCondition.map((condition) => <li key={condition}>{condition}</li>)}
                </ul>
              </div>
            </section>

            <section aria-labelledby="sample-section-8">
              <span aria-hidden="true">08</span>
              <h2 id="sample-section-8">まだ断定できないこと</h2>
              <div>
                <ul className="public-sample-detail-list">
                  {sample.uncertaintyLimitation.map((limitation) => <li key={limitation}>{limitation}</li>)}
                </ul>
              </div>
            </section>

            <blockquote className="public-sample-closing">{report.closingLine}</blockquote>

            <aside className="public-sample-limitation" aria-label="見本の固定注意">
              <strong>この見本で断定しないこと</strong>
              <p>
                相手の本心、返信の有無や時期、交際結果、将来を断定・保証しません。
                医療・心理・法律上の助言でもありません。
              </p>
              <p>{report.fixedDisclosure}</p>
            </aside>
          </div>
        </article>

        <details className="public-sample-metadata">
          <summary>審査メタデータを表示</summary>
          <dl><dt>sample ID</dt><dd>{sample.id}</dd></dl>
          <p>公開表示専用の固定架空データです。Safety fixture、結果 fixture、購入・レビュー・AI生成実績ではありません。</p>
        </details>

        <div className="public-sample-stage__navigation">
          <ReportComparisonNavigation audience="public" />
        </div>
      </div>
    </main>
  );
}
