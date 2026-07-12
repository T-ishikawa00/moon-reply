import Link from "next/link";
import type { ReviewReportErrorFixture } from "@/fixtures/review/errors";

export function ReviewReportError({ error }: { error: ReviewReportErrorFixture }) {
  return (
    <main className="min-h-screen bg-[#f4ead7] px-4 py-12 text-[#2b2335] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 shadow-[0_1.5rem_4rem_rgba(39,31,52,.12)] sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0 text-sm font-bold tracking-[0.14em] text-[#80652d]">REVIEW REPORT ERROR</p>
          <span className="rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-2 text-sm font-bold text-[#765e2d]">{error.statusLabel}</span>
        </div>
        <h1 className="mt-4 break-words font-serif text-3xl font-semibold leading-[1.45] sm:text-4xl">{error.title}</h1>
        <div role="alert" className="mt-7 rounded-lg border border-[#b49242] bg-[#f5ead2] p-5 leading-8">
          {error.message}
        </div>
        <p className="mt-6 break-words leading-8 text-[#67596b]">{error.explanation}</p>
        <dl className="mt-7 grid gap-3 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="font-bold text-[#765e2d]">error fixture</dt>
          <dd className="m-0 break-words font-mono text-sm">{error.id}</dd>
          <dt className="font-bold text-[#765e2d]">report content</dt>
          <dd className="m-0">表示なし</dd>
          <dt className="font-bold text-[#765e2d]">fallback</dt>
          <dd className="m-0">なし</dd>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3 border-t border-[#d9caa8] pt-6">
          <Link href="/review" className="inline-flex min-h-12 items-center rounded-lg bg-[#2a2440] px-5 py-3 font-bold text-[#fff8e8] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
            審査用プレビュー一覧へ戻る
          </Link>
          <Link href="/" className="inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] px-5 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
            トップへ戻る
          </Link>
        </div>
      </article>
    </main>
  );
}
