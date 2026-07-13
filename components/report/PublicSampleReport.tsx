import Link from "next/link";
import type { PublicSampleReportFixture } from "@/fixtures/review/reports";
import { ReportComparisonNavigation } from "./ReportComparisonNavigation";

export function PublicSampleReport({ sample }: { sample: PublicSampleReportFixture }) {
  return (
    <main className="bg-[#10132b] text-[#fff8e8]">
      <section className="bg-[radial-gradient(circle_at_75%_12%,rgba(229,196,109,.18),transparent_22rem),linear-gradient(145deg,#0c1128,#2a203e)] px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2" aria-label="サンプルの状態">
            <span className="rounded-full border border-[#d7bd77]/55 bg-[#fff8e8]/5 px-3 py-2 text-sm font-bold text-[#f2d98f]">
              {sample.visibleLabels[0]}
            </span>
          </div>
          <p className="mt-8 text-sm font-bold tracking-[0.16em] text-[#d9bb75]">FICTIONAL WRITING SAMPLE</p>
          <h1 className="mt-3 max-w-4xl break-words font-serif text-4xl font-semibold leading-[1.45] sm:text-6xl">
            {sample.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-9 text-[#ded3c2] sm:text-lg">
            購入前に文章の温度と、月の返事がどのように不確実性を扱うかを確認するための架空ケースです。これは実在相談者の事例ではなく、実際の購入・レビューやAI生成実績を示すものではありません。
          </p>
          <dl className="mt-8 grid max-w-4xl gap-3 rounded-xl border border-[#d6b86d]/35 bg-[#fff8e8]/5 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-7">
            <dt className="font-bold text-[#d9bb75]">相談テーマ</dt>
            <dd className="m-0 break-words leading-8">{sample.consultationTheme}</dd>
          </dl>
        </div>
      </section>

      <section className="bg-[#f2e7d4] px-4 py-12 text-[#2b2335] sm:px-8 sm:py-20">
        <article className="mx-auto max-w-[50rem] overflow-hidden rounded-sm border border-[#cdbb91] bg-[#fffaf0] shadow-[0_2rem_5rem_rgba(31,24,43,.14)]">
          <header className="border-b border-[#d9caa8] px-5 py-8 sm:px-10 sm:py-12">
            <p className="m-0 text-sm font-bold tracking-[0.16em] text-[#80652d]">月の返事・架空サンプル</p>
            <p className="mt-5 text-sm font-bold text-[#765e2d]">今夜の方向</p>
            <p className="mt-2 break-words font-serif text-3xl font-semibold leading-[1.5] sm:text-4xl">{sample.judgmentLabel}</p>
          </header>

          <div className="space-y-10 px-5 py-9 sm:px-10 sm:py-12">
            {sample.sections.map((section) => (
              <section key={section.heading} aria-labelledby={"sample-" + section.heading}>
                <h2 id={"sample-" + section.heading} className="font-serif text-2xl font-semibold leading-[1.5] text-[#3d3045]">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="m-0 break-words leading-9 text-[#564b5d]">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section aria-labelledby="sample-message-heading" className="rounded-xl border border-[#b99a4f] bg-[#f5ead2] p-5 sm:p-7">
              <h2 id="sample-message-heading" className="font-serif text-2xl font-semibold leading-[1.5]">後で送るなら、このくらいの温度で</h2>
              <blockquote className="mt-5 border-l-4 border-[#8a6d2e] bg-[#fffdf5] p-5 text-lg leading-9">
                {sample.laterMessageDraft}
              </blockquote>
              <p className="mt-4 leading-8 text-[#67596b]">返信を強制せず、説明を求めず、送った後に重ねて確認しない方向の文面例です。</p>
            </section>

            <aside aria-labelledby="sample-limitation-heading" className="border-t border-[#d9caa8] pt-7">
              <h2 id="sample-limitation-heading" className="text-base font-bold text-[#765e2d]">サービスの固定注意</h2>
              <p className="mt-3 break-words leading-8 text-[#67596b]">{sample.fixedLimitationDisclaimer}</p>
            </aside>

            <details className="border-t border-[#d9caa8] pt-4 text-[#67596b]">
              <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-[#765e2d]">
                審査専用メタデータ
              </summary>
              <dl className="grid min-w-0 gap-2 rounded-lg border border-dashed border-[#bca66f] bg-[#f8f0e2] p-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                <dt className="font-semibold">sample ID</dt>
                <dd className="m-0 min-w-0 break-words font-mono text-sm">{sample.id}</dd>
              </dl>
            </details>
          </div>
        </article>

        <div className="mx-auto mt-10 flex max-w-[50rem] flex-col gap-4 rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <strong className="text-lg">自分の相談を入力する画面を確認できます。</strong>
            <p className="mt-2 leading-7 text-[#67596b]">現在はローカル確認のみで、決済・AI生成・メール送信・保存は行われません。</p>
          </div>
          <Link href="/request" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg bg-[#2a2440] px-5 py-3 font-bold text-[#fff8e8] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
            鑑定依頼フォームを見る
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <ReportComparisonNavigation audience="public" />
        </div>
      </section>
    </main>
  );
}
