import type { ReviewReportFixture } from "@/fixtures/review/reports";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

function CompactList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-4 grid gap-2 p-0">
      {items.map((item) => (
        <li key={item} className="flex list-none items-start gap-3 leading-8 text-[#554a59]">
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8a6d2e]" aria-hidden="true" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ReviewSaveReport({ report }: { report: ReviewReportFixture }) {
  return (
    <main className="bg-[linear-gradient(145deg,#0b1025,#241b38)] px-4 py-12 text-[#fff8e8] sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#d7bd77] bg-[#e5c46d] px-3 py-2 text-sm font-bold text-[#171226]">審査用fixture</span>
          <span className="rounded-full border border-[#d7bd77]/55 px-3 py-2 text-sm font-bold text-[#f2d98f]">架空・未購入</span>
        </div>
        <p className="mt-6 max-w-3xl leading-8 text-[#d8cebd]">
          Web鑑定ノートと同じ構造化fixtureから、後で見返す要点だけを選び直したA4指向の表示です。Web画面のスクリーンショットではありません。
        </p>

        <article className="mx-auto mt-8 max-w-[52rem] border border-[#cdbb91] bg-[#fffaf0] text-[#2b2335] shadow-[0_2.5rem_7rem_rgba(0,0,0,.32)]">
          <header className="border-b-2 border-[#92743a] px-5 py-8 sm:px-10 sm:py-11">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="m-0 text-sm font-bold tracking-[0.14em] text-[#80652d]">月の返事</p>
                <h1 className="mt-2 break-words font-serif text-3xl font-semibold leading-[1.45] sm:text-5xl">月の返事 保存用鑑定書</h1>
              </div>
              <span className="rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-2 text-sm font-bold text-[#765e2d]">
                {report.presentationMetadata.save.label}
              </span>
            </div>
            <dl className="mt-7 grid gap-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
              <dt className="font-bold text-[#765e2d]">fixture ID</dt>
              <dd className="m-0 break-words font-mono">{report.id}</dd>
              <dt className="font-bold text-[#765e2d]">相談テーマ</dt>
              <dd className="m-0 break-words leading-7">{report.consultationTheme}</dd>
              <dt className="font-bold text-[#765e2d]">表示日付</dt>
              <dd className="m-0 break-words leading-7">{report.presentationMetadata.reviewDateLabel}</dd>
            </dl>
          </header>

          <div className="space-y-8 px-5 py-8 sm:px-10 sm:py-11">
            <section aria-labelledby="save-conclusion-heading" className="rounded-xl border-2 border-[#9b7b3a] bg-[#f5ead2] p-5 sm:p-8">
              <h2 id="save-conclusion-heading" className="text-sm font-bold tracking-[0.12em] text-[#765e2d]">今夜の結論</h2>
              <p className="mt-3 break-words font-serif text-3xl font-semibold leading-[1.5] sm:text-4xl">{report.judgmentLabel}</p>
              <p className="mt-4 break-words leading-8 text-[#554a59]">{report.conclusionReasonSummary}</p>
            </section>

            <section aria-labelledby="save-reasons-heading" className="border-b border-[#d9caa8] pb-7">
              <h2 id="save-reasons-heading" className="font-serif text-2xl font-semibold">判断理由・三つの要点</h2>
              <ol className="mt-5 grid gap-3 p-0 sm:grid-cols-3">
                {report.reasonPoints.map((reason, index) => (
                  <li key={reason} className="list-none rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4">
                    <span className="text-sm font-bold text-[#80652d]">0{index + 1}</span>
                    <p className="mt-2 break-words leading-7 text-[#554a59]">{reason}</p>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <section aria-labelledby="save-now-heading" className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5">
                <h2 id="save-now-heading" className="font-serif text-xl font-semibold">今できること</h2>
                <CompactList items={report.recommendedAction} />
              </section>
              <section aria-labelledby="save-review-heading" className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5">
                <h2 id="save-review-heading" className="font-serif text-xl font-semibold">再判断の目安</h2>
                <p className="mt-4 break-words leading-8 text-[#554a59]">{report.reviewTiming}</p>
              </section>
              <section aria-labelledby="save-change-heading" className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5">
                <h2 id="save-change-heading" className="font-serif text-xl font-semibold">方針を変える条件</h2>
                <CompactList items={report.recommendationChangeConditions} />
              </section>
              <section aria-labelledby="save-wait-heading" className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5">
                <h2 id="save-wait-heading" className="font-serif text-xl font-semibold">待っている間の行動</h2>
                <CompactList items={report.waitingAction} />
              </section>
            </div>

            <section aria-labelledby="save-no-contact-heading" className="rounded-lg border border-[#d8c596] bg-[#f8f0e2] p-5 sm:p-7">
              <h2 id="save-no-contact-heading" className="font-serif text-xl font-semibold">連絡がない場合の次の選択肢</h2>
              <p className="mt-4 break-words leading-8 text-[#554a59]">{report.noContactNextOption}</p>
            </section>

            <section aria-labelledby="save-message-heading" className="rounded-lg border border-[#b99a4f] bg-[#f5ead2] p-5 sm:p-7">
              <h2 id="save-message-heading" className="font-serif text-xl font-semibold">後で送る場合の文面案</h2>
              <blockquote className="mt-4 border-l-4 border-[#8a6d2e] bg-[#fffdf5] p-5 font-serif text-lg leading-9">
                {report.laterMessageDraft}
              </blockquote>
            </section>

            <section aria-labelledby="save-plan-heading">
              <h2 id="save-plan-heading" className="font-serif text-2xl font-semibold">3日間の方針</h2>
              <ol className="mt-5 grid gap-3 p-0">
                {report.threeDayPlan.map((item) => (
                  <li key={item.label} className="grid list-none gap-2 border-b border-[#d9caa8] pb-4 sm:grid-cols-[5rem_minmax(0,1fr)]">
                    <strong className="text-[#765e2d]">{item.label}</strong>
                    <span className="min-w-0 break-words leading-8 text-[#554a59]">{item.direction}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="save-unknown-heading" className="rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5 sm:p-7">
              <h2 id="save-unknown-heading" className="font-serif text-xl font-semibold">断定できないこと</h2>
              <CompactList items={report.materialUnknowns} />
            </section>

            <aside aria-labelledby="save-caution-heading" className="border-t-2 border-[#92743a] pt-7">
              <h2 id="save-caution-heading" className="text-base font-bold text-[#765e2d]">固定の注意事項</h2>
              <p className="mt-3 break-words leading-8 text-[#554a59]">{report.fixedLimitationDisclaimer}</p>
            </aside>
          </div>
        </article>

        <aside aria-label="保存表示の利用状態" className="mx-auto mt-8 max-w-[52rem] rounded-xl border border-[#d6b86d]/45 bg-[#fff8e8]/5 p-5 sm:p-7">
          <strong className="text-[#f2d98f]">保存向けに再構成した審査用見本</strong>
          <ul className="mt-3 grid gap-2 leading-8 text-[#d8cebd]">
            <li>PDF・画像・ダウンロードはまだ利用できません</li>
            <li>ファイルは生成されていません</li>
            <li>購入、AI API呼び出し、メール送信、データ保存は発生していません</li>
          </ul>
        </aside>

        <div className="mt-10">
          <ReportComparisonNavigation />
        </div>
      </div>
    </main>
  );
}
