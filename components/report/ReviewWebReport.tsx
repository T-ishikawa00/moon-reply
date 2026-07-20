import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArtifactAnswer,
  ArtifactClosing,
  ArtifactComparison,
  ArtifactCover,
  ArtifactLetter,
  ArtifactLimitation,
  ArtifactMessageDraft,
  ArtifactMetadata,
  ArtifactSectionLabel,
  ArtifactShell,
  ArtifactTimeline,
} from "@/components/artifact";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import type { ReviewRequestFixture } from "@/fixtures/review/requests";
import type { ReviewReportFixture } from "@/fixtures/review/reports";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

function NoteSection({
  number,
  title,
  children,
  className = "",
}: {
  number: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `reading-note-section-${number}`;

  return (
    <section
      className={["reading-note-section", className].filter(Boolean).join(" ")}
      aria-labelledby={headingId}
    >
      <div className="reading-note-section__heading">
        <ArtifactSectionLabel aria-hidden="true">{number}</ArtifactSectionLabel>
        <h2 id={headingId}>{title}</h2>
      </div>
      <div className="reading-note-section__body">{children}</div>
    </section>
  );
}

function NoteList({ items }: { items: readonly string[] }) {
  return (
    <ul className="reading-note-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ReviewBoundary({
  report,
  request,
}: {
  report: ReviewReportFixture;
  request: ReviewRequestFixture;
}) {
  return (
    <aside className="artifact-review-boundary" aria-label="審査用表示の実行境界">
      <div className="artifact-review-boundary__inner">
        <div className="artifact-review-boundary__lead">
          <strong>固定架空ケースの審査表示</strong>
          <span>購入・AI生成・メール送信・データ保存なし</span>
        </div>
        <details>
          <summary>実行境界とfixture</summary>
          <p>
            表示を開いても、購入・AI実行・メール送信・データ保存・納品は発生しません。
          </p>
          <dl>
            <div><dt>result fixture</dt><dd>{report.id}</dd></div>
            <div><dt>request fixture</dt><dd>{request.id}</dd></div>
            <div><dt>購入</dt><dd>なし</dd></div>
            <div><dt>AI実行</dt><dd>なし</dd></div>
            <div><dt>保存・配信</dt><dd>なし</dd></div>
          </dl>
        </details>
      </div>
    </aside>
  );
}

export function ReviewWebReport({
  report,
  request,
}: {
  report: ReviewReportFixture;
  request: ReviewRequestFixture;
}) {
  return (
    <main className="reading-note-page">
      <ReviewBoundary report={report} request={request} />

      <div className="reading-note-stage">
        <ArtifactShell as="article" className="reading-note paper-grain">
          <ArtifactCover as="header" className="reading-note-cover">
            <LunarArc tone="night" position="top-right" />
            <div className="reading-note-cover__brand">
              <MoonSeal size="medium" />
              <span>月の返事</span>
            </div>
            <p className="reading-note-cover__type">恋のメッセージ鑑定ノート</p>
            <h1>{report.consultationTheme}</h1>
            <ArtifactMetadata className="reading-note-cover__facts">
              <div><dt>相談者</dt><dd>{report.clientNickname}さん</dd></div>
              <div><dt>鑑定日</dt><dd>{report.readingDateLabel}</dd></div>
            </ArtifactMetadata>
            <EditorialDivider variant="night" />
            <p className="reading-note-cover__line">{report.coverLine}</p>
            <ArtifactAnswer className="reading-note-cover__answer" aria-label="今夜の答え">
              <ArtifactSectionLabel>今夜の答え</ArtifactSectionLabel>
              <strong>{report.judgmentLabel}</strong>
            </ArtifactAnswer>
          </ArtifactCover>

          <NoteSection number="02" title="月の返事からの短い手紙" className="reading-note-letter">
            <ArtifactLetter className="reading-note-letter__body">
              {report.shortLetter.map((line) => <p key={line}>{line}</p>)}
            </ArtifactLetter>
          </NoteSection>

          <NoteSection number="03" title="今夜の答え" className="reading-note-answer-section">
            <ArtifactAnswer className="reading-note-answer">
              <p className="reading-note-answer__label">結論</p>
              <p className="reading-note-answer__judgment">{report.judgmentLabel}</p>
              <p className="reading-note-answer__reason">{report.conclusionReasonSummary}</p>
              <div className="reading-note-answer__next">
                <div><span>今夜やること</span><strong>{report.tonightActions[0]}</strong></div>
                <div><span>次に見直す時期</span><strong>{report.reviewTiming}</strong></div>
              </div>
            </ArtifactAnswer>
            <p className="reading-note-answer__context">{report.currentConclusion[1]}</p>
          </NoteSection>

          <NoteSection number="04" title="この鑑定の読み方">
            <dl className="reading-guide-grid">
              {report.readingGuide.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.explanation}</dd>
                </div>
              ))}
            </dl>
          </NoteSection>

          <NoteSection number="05" title="今の関係をほどく">
            <ArtifactTimeline as="ol" className="relationship-timeline" aria-label="現在までの短い流れ">
              {report.relationshipTimeline.map((item) => <li key={item}>{item}</li>)}
            </ArtifactTimeline>
            <ArtifactComparison className="reading-note-split">
              <section aria-labelledby="confirmed-facts-heading">
                <h3 id="confirmed-facts-heading">確認できること</h3>
                <NoteList items={report.observedFacts} />
              </section>
              <section aria-labelledby="relationship-unknown-heading">
                <h3 id="relationship-unknown-heading">まだ分からないこと</h3>
                <NoteList items={report.materialUnknowns.slice(0, 2)} />
              </section>
            </ArtifactComparison>
          </NoteSection>

          <NoteSection number="06" title="相手にどう届く可能性があるか">
            <p className="reading-note-intro">
              どれか一つを正解とせず、現在の文面とタイミングから考えられる受け止め方を並べます。
            </p>
            <ol className="possibility-list">
              {report.possibleInterpretations.map((item, index) => (
                <li key={item}><span>0{index + 1}</span><p>{item}</p></li>
              ))}
            </ol>
          </NoteSection>

          <NoteSection number="07" title="不安の核">
            <div className="anxiety-grid">
              <section>
                <h3>実際に起きていること</h3>
                <p>相手からの返信が一日なく、次の連絡を待っている状態です。</p>
              </section>
              <section>
                <h3>不安が補っている想像</h3>
                <p>{report.anxietyCore[0]}</p>
              </section>
              <section>
                <h3>今夜切り離したいもの</h3>
                <p>{report.anxietyCore[1]}</p>
              </section>
            </div>
          </NoteSection>

          <NoteSection number="08" title="文面の温度">
            <blockquote className="message-temperature__quote">
              <span>入力された文面</span>
              <p>{report.messageTemperature.quote}</p>
            </blockquote>
            <dl className="message-temperature__notes">
              <div><dt>柔らかさ</dt><dd>{report.messageTemperature.softness}</dd></div>
              <div><dt>好意</dt><dd>{report.messageTemperature.affection}</dd></div>
              <div><dt>圧力</dt><dd>{report.messageTemperature.pressure}</dd></div>
              <div><dt>調整点</dt><dd>{report.messageTemperature.adjustment}</dd></div>
            </dl>
          </NoteSection>

          <NoteSection number="09" title="今夜の推奨アクション">
            <ArtifactComparison className="action-columns">
              <section>
                <h3><span aria-hidden="true">○</span> 今夜やること</h3>
                <NoteList items={report.tonightActions} />
              </section>
              <section>
                <h3><span aria-hidden="true">—</span> 今夜やらないこと</h3>
                <NoteList items={report.notTonightActions} />
              </section>
            </ArtifactComparison>
          </NoteSection>

          <NoteSection number="10" title="送る場合の文面案">
            <ArtifactMessageDraft as="blockquote" className="message-letter">
              <p>{report.laterMessageDraft}</p>
            </ArtifactMessageDraft>
            <ul className="message-letter__conditions">
              <li>今夜送る文面ではありません。</li>
              <li>明日以降、落ち着いて再判断した場合の候補です。</li>
              <li>相手から連絡が来た場合は、この文面をそのまま使いません。</li>
            </ul>
          </NoteSection>

          <NoteSection number="11" title="3日間の月明かりプラン">
            <ArtifactTimeline as="ol" className="lunar-plan">
              {report.threeDayPlan.map((item, index) => (
                <li key={item.label}>
                  <span className={`lunar-plan__moon lunar-plan__moon--${index + 1}`} aria-hidden="true" />
                  <strong>{index === 0 ? "今夜" : index === 1 ? "明日" : "3日目"}</strong>
                  <p>{item.direction}</p>
                </li>
              ))}
            </ArtifactTimeline>
          </NoteSection>

          <NoteSection number="12" title="方針を変える条件">
            <ArtifactComparison className="condition-columns">
              <section>
                <h3>送る方向へ変えてよい条件</h3>
                <NoteList items={report.recommendationChangeConditions} />
              </section>
              <section>
                <h3>送らない方がよい条件</h3>
                <NoteList items={report.holdDirectionConditions} />
              </section>
            </ArtifactComparison>
          </NoteSection>

          <NoteSection number="13" title="まだ断定できないこと">
            <ArtifactComparison className="capability-columns">
              <section>
                <h3>この鑑定で分からないこと</h3>
                <NoteList items={report.materialUnknowns} />
              </section>
              <section>
                <h3>この鑑定でできること</h3>
                <NoteList items={report.reportCapabilities} />
              </section>
            </ArtifactComparison>
            <ArtifactLimitation as="aside" className="reading-note-fixed-caution" aria-label="鑑定ノートの固定注意">
              {report.fixedLimitationDisclaimer}
            </ArtifactLimitation>
          </NoteSection>

          <ArtifactClosing
            as="section"
            className="reading-note-closing"
            aria-labelledby="reading-note-section-14"
          >
            <div className="reading-note-section__heading">
              <ArtifactSectionLabel aria-hidden="true">14</ArtifactSectionLabel>
              <h2 id="reading-note-section-14">月の返事からの締め</h2>
            </div>
            <div className="reading-note-section__body">
              <blockquote>{report.rememberTonight}</blockquote>
              <div className="reading-note-closing__letter">
                {report.closingLetter.map((line) => <p key={line}>{line}</p>)}
              </div>
              <p className="reading-note-closing__timing"><strong>次に判断する条件：</strong>{report.reviewTiming}</p>
              <Link href={`/review/save-report/${report.id}`} className="button button--secondary">
                保存用判断カードの見本を開く
              </Link>
            </div>
          </ArtifactClosing>
        </ArtifactShell>

        <div className="reading-note-stage__navigation">
          <ReportComparisonNavigation />
        </div>
      </div>
    </main>
  );
}
