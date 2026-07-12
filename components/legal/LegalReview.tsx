import Link from "next/link";
import type { ReactNode } from "react";
import {
  legalNavigationItems,
  reviewContextLinks,
  type LegalReviewSection,
  type ReviewDecision,
  type ReviewStatusCategory,
} from "@/lib/legal/review-content";

export function LegalReviewScaffold({
  currentPath,
  children,
}: {
  currentPath: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3ead8] text-[#2b2335]">
      <LegalReviewBoundary />
      <LegalNavigation currentPath={currentPath} />
      {children}
    </main>
  );
}

export function LegalReviewBoundary() {
  return (
    <aside
      aria-label="法務ページの審査境界"
      className="border-b border-[#e0c987]/35 bg-[#12142b] text-[#fff8e8]"
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap gap-2" aria-label="審査状態">
          {[
            "審査用ドラフト表示",
            "公開承認前・運営者情報未完了",
            "法的助言ではありません",
          ].map((label) => (
            <strong
              key={label}
              className="inline-flex min-h-11 items-center rounded-full border border-[#e4c875]/55 bg-white/5 px-4 py-2 text-sm leading-6 text-[#f5df9d]"
            >
              {label}
            </strong>
          ))}
        </div>
        <p className="mt-4 max-w-4xl border-l-4 border-[#e4c875] pl-4 leading-8 text-[#eee5d6]">
          この画面は公開前の構成確認用です。現在の利用契約条件または正式な法務表示ではありません。
        </p>
      </div>
    </aside>
  );
}

export function LegalNavigation({ currentPath }: { currentPath: string }) {
  return (
    <div className="border-b border-[#cdbb91] bg-[#fff8e9]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
        <nav aria-label="法務・開示ページ間ナビゲーション">
          <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">LEGAL REVIEW PAGES</p>
          <ul className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {legalNavigationItems.map((item) => {
              const isCurrent = currentPath === item.href;
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-lg border px-4 py-3 font-semibold leading-6 transition focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none ${
                      isCurrent
                        ? "border-[#80652d] bg-[#2a2440] text-[#fff8e8]"
                        : "border-[#d8c596] bg-[#fffdf5] hover:bg-[#f5ead2]"
                    }`}
                  >
                    <span className="min-w-0 break-words">{item.label}</span>
                    <span className="shrink-0 text-xs font-bold" aria-hidden={isCurrent ? undefined : "true"}>{isCurrent ? "現在" : "→"}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label="関連する審査画面" className="mt-6 border-t border-[#d9caa8] pt-5">
          <p className="text-sm font-semibold text-[#67596b]">関連する審査画面</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {reviewContextLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg border border-[#bca66f] bg-[#fffdf5] px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-7 text-[#67596b]">
            これらのページを開いても、購入、同意、公開承認、問い合わせ送信は発生しません。
          </p>
        </nav>
      </div>
    </div>
  );
}

export function LegalPageHeader({
  eyebrow,
  title,
  description,
  showDates = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  showDates?: boolean;
}) {
  return (
    <header className="border-b border-[#d8c596]/30 bg-[radial-gradient(circle_at_82%_16%,rgba(229,196,109,0.18),transparent_20rem),linear-gradient(145deg,#0d1127,#29203e)] text-[#fff8e8]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-bold tracking-[0.18em] text-[#d9bb75]">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl break-words font-serif text-3xl font-semibold leading-[1.45] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#e6dccb] sm:text-lg sm:leading-9">
          {description}
        </p>
        {showDates ? <ReviewDates /> : null}
      </div>
    </header>
  );
}

export function ReviewDates() {
  return (
    <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-2" aria-label="未確定の日付">
      {[
        "施行日：未確定",
        "最終更新日：未確定",
      ].map((label) => (
        <div key={label} className="rounded-lg border border-[#e4c875]/45 bg-white/5 p-4">
          <strong className="block">{label}</strong>
          <span className="mt-1 block text-sm text-[#d9ccba]">Status: 運営者判断待ち</span>
        </div>
      ))}
    </div>
  );
}

export function ContentSection({
  eyebrow,
  title,
  intro,
  children,
  tone = "paper",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  tone?: "paper" | "ivory" | "night";
}) {
  const toneClass = tone === "night"
    ? "border-[#d6b86d]/40 bg-[#18152e] text-[#efe5d0]"
    : tone === "ivory"
      ? "border-[#cdbb91] bg-[#fffdf5]"
      : "border-[#cdbb91] bg-[#fff8e9]";
  return (
    <section className={`rounded-xl border p-5 shadow-[0_1rem_3rem_rgba(39,31,52,.08)] sm:p-8 ${toneClass}`}>
      {eyebrow ? <p className={`text-sm font-bold tracking-[0.14em] ${tone === "night" ? "text-[#d9bb75]" : "text-[#80652d]"}`}>{eyebrow}</p> : null}
      <h2 className={`mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-3xl ${tone === "night" ? "text-[#fff8e8]" : ""}`}>{title}</h2>
      {intro ? <p className={`mt-4 max-w-4xl leading-8 ${tone === "night" ? "text-[#d5cab9]" : "text-[#67596b]"}`}>{intro}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: ReviewStatusCategory }) {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-1 text-xs font-bold leading-5 text-[#493a20]">
      Status: {status}
    </span>
  );
}

export function DecisionCard({ decision }: { decision: ReviewDecision }) {
  return (
    <article className="min-w-0 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h3 className="min-w-0 break-words text-lg font-semibold leading-7">{decision.label}</h3>
        <StatusPill status={decision.status} />
      </div>
      <p className="mt-3 break-words leading-7 text-[#5f5363]">{decision.summary}</p>
      {decision.decisionIds?.length ? (
        <div className="mt-4 rounded-md border border-dashed border-[#bca66f] bg-[#f8f0e2] p-3 text-sm leading-6">
          <span className="block font-semibold text-[#765e2d]">審査専用メタデータ</span>
          <span className="mt-1 block break-words font-mono">Decision: {decision.decisionIds.join(" / ")}</span>
        </div>
      ) : null}
    </article>
  );
}

export function DecisionGrid({ decisions }: { decisions: readonly ReviewDecision[] }) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      {decisions.map((decision) => (
        <DecisionCard key={`${decision.label}-${decision.decisionIds?.join("-") ?? decision.status}`} decision={decision} />
      ))}
    </div>
  );
}

export function FactRows({ facts }: { facts: readonly { label: string; value: string }[] }) {
  return (
    <dl className="grid min-w-0 gap-3">
      {facts.map((fact) => (
        <div key={fact.label} className="grid min-w-0 gap-2 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5">
          <dt className="font-semibold text-[#765e2d]">{fact.label}</dt>
          <dd className="m-0 min-w-0 break-words leading-7">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LegalSectionList({ sections }: { sections: readonly LegalReviewSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold leading-[1.45]">{section.title}</h2>
          <div className="mt-5 space-y-4 leading-8 text-[#4e4353]">
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          {section.bullets?.length ? (
            <ul className="mt-5 list-disc space-y-2 pl-6 leading-8">
              {section.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
          {section.decisions?.length ? <div className="mt-6"><DecisionGrid decisions={section.decisions} /></div> : null}
        </section>
      ))}
    </div>
  );
}

export function ReviewCallout({ children, strong }: { children: ReactNode; strong?: string }) {
  return (
    <div className="rounded-lg border border-[#b49242] bg-[#f5ead2] p-5 leading-8" role="note">
      {strong ? <strong className="block text-lg">{strong}</strong> : null}
      <div className={strong ? "mt-2" : ""}>{children}</div>
    </div>
  );
}
