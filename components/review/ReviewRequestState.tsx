import Link from "next/link";
import type { ReviewSafetyState } from "@/fixtures/review/safety-states";

export function ReviewRequestState({ state }: { state: ReviewSafetyState }) {
  const isNormal = state.stateName === "normal_allowed";
  const showsUnsupportedCasesLink =
    state.stateName === "needs_review" || state.stateName === "rejected";

  return (
    <main className="request-state-page">
      <article
        className={`request-state-note ${
          isNormal ? "request-state-note--normal" : "request-state-note--stop"
        }`}
        aria-labelledby="request-state-title"
      >
        <header>
          <p>Safety確認</p>
          <span className="status-label status-label--review">
            {isNormal ? "通常確認可能" : "ここで停止"}
          </span>
          <h1 id="request-state-title">{state.userTitle}</h1>
          <p>{state.userMessage}</p>
        </header>

        <section aria-labelledby="request-state-next-title">
          <h2 id="request-state-next-title">次にできること</h2>
          <Link href={state.allowedAction.href} className="button button--primary">
            {state.allowedAction.label}
          </Link>
          {!isNormal ? (
            <p>
              normal_allowed 以外は、依頼メモ、購入確認、決済、通常レポートへ進めません。
            </p>
          ) : null}
        </section>

        {showsUnsupportedCasesLink ? (
          <section aria-labelledby="request-state-unsupported-title">
            <h2 id="request-state-unsupported-title">通常鑑定として扱わない理由</h2>
            <p>
              危険を恋愛として美化せず、Safetyを決済より前に確認する方針を説明しています。
            </p>
            <Link href="/legal/unsupported-cases" className="text-link">
              通常鑑定として扱わない相談を確認する
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="request-state-prohibited-title">
          <h2 id="request-state-prohibited-title">この状態から行わないこと</h2>
          <ul>
            {state.prohibitedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        {state.correctionDestination ? (
          <p className="request-state-note__correction">
            修正先：
            <Link href={state.correctionDestination.href}>
              {state.correctionDestination.label}
            </Link>
          </p>
        ) : null}

        <details className="request-review-metadata">
          <summary>審査用fixture情報</summary>
          <dl>
            <div><dt>state</dt><dd>{state.stateName}</dd></div>
            <div><dt>fixture ID</dt><dd>{state.fixtureId}</dd></div>
            <div>
              <dt>依頼メモ到達</dt>
              <dd>{state.canReachConfirmation ? "allowed" : "denied"}</dd>
            </div>
          </dl>
        </details>

        <nav className="request-review-links" aria-label="審査用ナビゲーション">
          <Link href="/review">審査用一覧へ</Link>
          <Link href="/request">鑑定依頼シートへ</Link>
        </nav>
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
    userMessage:
      "指定された状態は許可リストにありません。安全のため通常状態へ置き換えず、依頼メモ・購入確認・通常レポートには進めません。",
    allowedAction: { label: "審査用一覧へ戻る", href: "/review" },
    prohibitedActions: [
      "最初のfixtureへの代替",
      "通常確認への続行",
      "購入",
      "通常レポート",
    ],
    correctionDestination: { label: "鑑定依頼シート", href: "/request" },
    canReachConfirmation: false,
  };
  return <ReviewRequestState state={state} />;
}
