import type { ReactNode } from "react";
import type { ReviewRequestFixture } from "@/fixtures/review/requests";
import type { ReviewReportFixture } from "@/fixtures/review/reports";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

function Paragraphs({ items }: { items: readonly string[] }) {
  return (
    <div className="mt-5 space-y-4">
      {items.map((item) => (
        <p key={item} className="m-0 break-words leading-9 text-[#564b5d]">{item}</p>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 grid gap-3 p-0">
      {items.map((item) => (
        <li key={item} className="flex list-none items-start gap-3 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-8 text-[#564b5d]">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#8a6d2e]" aria-hidden="true" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  const headingId = "web-report-section-" + number;
  return (
    <section aria-labelledby={headingId} className="border-t border-[#d9caa8] px-5 py-10 sm:px-10 sm:py-14">
      <div className="flex items-start gap-4">
        <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#9b7b3a] bg-[#f5ead2] text-sm font-bold text-[#765e2d]" aria-hidden="true">
          {number}
        </span>
        <h2 id={headingId} className="m-0 break-words font-serif text-2xl font-semibold leading-[1.5] text-[#3d3045] sm:text-3xl">
          {title}
        </h2>
      </div>
      <div className="mt-6">{children}</div>
    </section>
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
    <main className="bg-[#121329] text-[#fff8e8]">
      <section className="bg-[radial-gradient(circle_at_78%_12%,rgba(229,196,109,.15),transparent_25rem),linear-gradient(145deg,#0b1025,#2b2140)] px-4 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-[#d7bd77] bg-[#e5c46d] px-3 py-2 text-sm font-bold text-[#171226]">審査用fixture</span>
            <span className="rounded-full border border-[#d7bd77]/55 px-3 py-2 text-sm font-bold text-[#f2d98f]">架空データ</span>
            <span className="rounded-full border border-[#d7bd77]/55 px-3 py-2 text-sm font-bold text-[#f2d98f]">購入・納品なし</span>
          </div>
          <p className="mt-8 text-sm font-bold tracking-[0.15em] text-[#d9bb75]">{report.presentationMetadata.web.label}</p>
          <h1 className="mt-3 max-w-4xl break-words font-serif text-4xl font-semibold leading-[1.45] sm:text-6xl">{report.reportTitle}</h1>
          <p className="mt-6 max-w-3xl text-base leading-9 text-[#ded3c2] sm:text-lg">{report.consultationTheme}</p>
          <dl className="mt-8 grid max-w-4xl gap-3 rounded-xl border border-[#d6b86d]/35 bg-[#fff8e8]/5 p-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:p-7">
            <dt className="font-bold text-[#d9bb75]">result fixture ID</dt>
            <dd className="m-0 break-words font-mono text-sm">{report.id}</dd>
            <dt className="font-bold text-[#d9bb75]">request fixture reference</dt>
            <dd className="m-0 break-words font-mono text-sm">{request.id}</dd>
            <dt className="font-bold text-[#d9bb75]">入力状態の要点</dt>
            <dd className="m-0 break-words">{request.relationship}・返信待ち {request.replyWait}・今夜送るか迷っている固定ケース</dd>
          </dl>
        </div>
      </section>

      <div className="bg-[#f0e6d4] px-4 py-10 text-[#2b2335] sm:px-8 sm:py-16">
        <aside aria-labelledby="fixture-boundary-heading" className="mx-auto max-w-[50rem] rounded-xl border border-[#9b7b3a] bg-[#fff8e9] p-5 sm:p-8">
          <p className="m-0 text-sm font-bold tracking-[0.14em] text-[#80652d]">REVIEW FIXTURE BOUNDARY</p>
          <h2 id="fixture-boundary-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.5]">審査fixtureの実行境界</h2>
          <p className="mt-4 leading-8 text-[#67596b]">以下は商品レポートの注意書きとは別の、審査環境に関する事実です。</p>
          <ul className="mt-5 grid gap-2 leading-8 sm:grid-cols-2">
            <li>決定論的な固定fixtureです</li>
            <li>AI APIは呼び出していません</li>
            <li>購入は発生していません</li>
            <li>メールは送信していません</li>
            <li>データは保存していません</li>
            <li>実在する結果トークンはありません</li>
          </ul>
        </aside>

        <article className="mx-auto mt-8 max-w-[50rem] overflow-hidden border border-[#cdbb91] bg-[#fffaf0] shadow-[0_2rem_5rem_rgba(31,24,43,.14)]">
          <ReportSection number="1" title="今夜の結論">
            <div className="rounded-xl border border-[#b99a4f] bg-[#f5ead2] p-5 sm:p-7">
              <p className="m-0 text-sm font-bold tracking-[0.12em] text-[#765e2d]">FIXED JUDGMENT</p>
              <p className="mt-2 break-words font-serif text-3xl font-semibold leading-[1.5] sm:text-4xl">{report.judgmentLabel}</p>
            </div>
            <Paragraphs items={report.currentConclusion} />
            <p className="mt-5 break-words border-l-4 border-[#8a6d2e] bg-[#f8f0e2] p-5 leading-9 text-[#564b5d]">{report.conclusionReasonSummary}</p>
            <BulletList items={report.reasonPoints} />
          </ReportSection>

          <ReportSection number="2" title="今の関係の整理">
            <h3 className="text-lg font-bold text-[#765e2d]">入力から確認できること</h3>
            <Paragraphs items={report.observedFacts} />
          </ReportSection>

          <ReportSection number="3" title="相手側にあり得る受け止め方">
            <h3 className="text-lg font-bold text-[#765e2d]">考えられる可能性</h3>
            <Paragraphs items={report.possibleInterpretations} />
          </ReportSection>

          <ReportSection number="4" title="あなたが不安になっている核心">
            <Paragraphs items={report.anxietyCore} />
          </ReportSection>

          <ReportSection number="5" title="この文面がどう伝わる可能性があるか">
            <Paragraphs items={report.plannedMessageAnalysis} />
          </ReportSection>

          <ReportSection number="6" title="今夜の推奨アクション">
            <BulletList items={report.recommendedAction} />
            <div className="mt-8 grid gap-5">
              <div className="rounded-xl border border-[#d8c596] bg-[#fffdf5] p-5">
                <h3 className="text-lg font-bold text-[#765e2d]">再判断の目安</h3>
                <p className="mt-3 break-words leading-8 text-[#564b5d]">{report.reviewTiming}</p>
              </div>
              <div className="rounded-xl border border-[#d8c596] bg-[#fffdf5] p-5">
                <h3 className="text-lg font-bold text-[#765e2d]">方針を変える条件</h3>
                <BulletList items={report.recommendationChangeConditions} />
              </div>
              <div className="rounded-xl border border-[#d8c596] bg-[#fffdf5] p-5">
                <h3 className="text-lg font-bold text-[#765e2d]">待っている間にすること</h3>
                <BulletList items={report.waitingAction} />
              </div>
              <div className="rounded-xl border border-[#d8c596] bg-[#fffdf5] p-5">
                <h3 className="text-lg font-bold text-[#765e2d]">連絡がない場合の次の選択肢</h3>
                <p className="mt-3 break-words leading-8 text-[#564b5d]">{report.noContactNextOption}</p>
              </div>
            </div>
          </ReportSection>

          <ReportSection number="7" title="送る場合の文面案">
            <blockquote className="m-0 rounded-xl border border-[#b99a4f] bg-[#f5ead2] p-5 font-serif text-xl leading-9 text-[#3d3045] sm:p-7">
              {report.laterMessageDraft}
            </blockquote>
            <p className="mt-4 leading-8 text-[#67596b]">今夜の送信案ではありません。気持ちが落ち着いて再判断し、後で一度送る場合の低圧な方向です。</p>
          </ReportSection>

          <ReportSection number="8" title="3日間の行動プラン">
            <ol className="grid gap-4 p-0">
              {report.threeDayPlan.map((item) => (
                <li key={item.label} className="grid list-none gap-2 rounded-xl border border-[#d8c596] bg-[#fffdf5] p-5 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <strong className="text-[#765e2d]">{item.label}</strong>
                  <span className="min-w-0 break-words leading-8 text-[#564b5d]">{item.direction}</span>
                </li>
              ))}
            </ol>
          </ReportSection>

          <ReportSection number="9" title="この分析の限界と注意点">
            <h3 className="text-lg font-bold text-[#765e2d]">断定できないこと</h3>
            <BulletList items={report.materialUnknowns} />
            <aside className="mt-8 rounded-xl border-2 border-[#8a6d2e] bg-[#f5ead2] p-5 sm:p-7" aria-label="商品レポートの固定注意">
              <strong className="text-[#765e2d]">商品レポートの固定注意</strong>
              <p className="mt-3 break-words leading-8 text-[#4e4354]">{report.fixedLimitationDisclaimer}</p>
            </aside>
          </ReportSection>
        </article>

        <div className="mx-auto mt-10 max-w-5xl">
          <ReportComparisonNavigation />
        </div>
      </div>
    </main>
  );
}
