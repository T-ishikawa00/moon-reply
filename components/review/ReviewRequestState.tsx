import Link from "next/link";
import type { ReviewSafetyState } from "@/fixtures/review/safety-states";

export function ReviewRequestState({ state }: { state: ReviewSafetyState }) {
  return (
    <main className="min-h-screen bg-[#f4ead7] px-4 py-12 text-[#2b2335] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-4xl rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 shadow-[0_1.5rem_4rem_rgba(39,31,52,.12)] sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9caa8] pb-5">
          <div>
            <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">REQUEST SAFETY STATE</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-[1.45] sm:text-4xl">{state.userTitle}</h1>
          </div>
          <span className="rounded-full border border-[#8a6d2e] bg-[#f5e8bd] px-3 py-2 text-sm font-bold">{state.stateName}</span>
        </div>

        <dl className="mt-6 grid gap-3 rounded-lg border border-[#d8c596] bg-[#fffcf4] p-4 sm:grid-cols-[9rem_1fr]">
          <dt className="font-bold text-[#765e2d]">状態名</dt><dd className="m-0 break-words">{state.stateName}</dd>
          <dt className="font-bold text-[#765e2d]">fixture ID</dt><dd className="m-0 break-words font-mono text-sm">{state.fixtureId}</dd>
          <dt className="font-bold text-[#765e2d]">確認到達</dt><dd className="m-0">{state.canReachConfirmation ? "可能（normal_allowed のみ）" : "不可・ここで停止"}</dd>
        </dl>

        <section aria-labelledby="result-heading" className="mt-6 rounded-lg border border-[#b49242] bg-[#f5ead2] p-5">
          <h2 id="result-heading" className="text-xl font-semibold">利用者向け結果</h2>
          <p className="mt-3 leading-8">{state.userMessage}</p>
        </section>

        <section aria-labelledby="allowed-heading" className="mt-7">
          <h2 id="allowed-heading" className="text-xl font-semibold">許可された次の操作</h2>
          <Link href={state.allowedAction.href} className="mt-3 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#2a2440] px-5 py-3 font-semibold text-[#fff8e8] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
            {state.allowedAction.label}
          </Link>
        </section>

        <section aria-labelledby="prohibited-heading" className="mt-7">
          <h2 id="prohibited-heading" className="text-xl font-semibold">禁止される次の操作</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {state.prohibitedActions.map((action) => <li key={action} className="rounded-lg border border-[#cdbb91] bg-[#fffdf5] px-4 py-3"><span aria-hidden="true">×</span> {action}</li>)}
          </ul>
        </section>

        {state.correctionDestination ? (
          <p className="mt-7 border-l-4 border-[#8a6d2e] bg-[#f8f0e2] p-4 leading-7">
            <strong>修正先：</strong> <Link className="font-semibold underline underline-offset-4" href={state.correctionDestination.href}>{state.correctionDestination.label}</Link>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-[#d9caa8] pt-5">
          <Link href="/review" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">審査用一覧へ</Link>
          <Link href="/request" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">入力画面へ</Link>
        </div>
      </article>
    </main>
  );
}

export function UnknownReviewRequestState() {
  const state: ReviewSafetyState = {
    slug: "unknown",
    stateName: "unknown_error",
    fixtureId: "request-error-001",
    userTitle: "状態を確認できません",
    userMessage: "指定された状態は許可リストにありません。安全のため通常状態へ置き換えず、確認・購入・レポートには進めません。",
    allowedAction: { label: "審査用一覧へ戻る", href: "/review" },
    prohibitedActions: ["最初のfixtureへの代替", "通常確認への続行", "購入", "通常レポート"],
    correctionDestination: { label: "審査用一覧", href: "/review" },
    canReachConfirmation: false,
  };
  return <ReviewRequestState state={state} />;
}
