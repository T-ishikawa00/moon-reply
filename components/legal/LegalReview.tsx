import Link from "next/link";
import type { ReactNode } from "react";
import {
  legalNavigationItems,
  reviewContextLinks,
  type LegalReviewSection,
  type ReviewDecision,
  type ReviewStatusCategory,
} from "@/lib/legal/review-content";

type LegalDisplayMode = "review" | "public";

export function LegalReviewScaffold({
  currentPath,
  children,
  mode = "review",
}: {
  currentPath: string;
  children: ReactNode;
  mode?: LegalDisplayMode;
}) {
  return (
    <main className="legal-review-scaffold" data-legal-mode={mode}>
      {mode === "review" ? <LegalReviewBoundary /> : null}
      {mode === "review" ? <LegalNavigation currentPath={currentPath} /> : null}
      {children}
    </main>
  );
}

export function LegalReviewBoundary() {
  return (
    <aside className="legal-review-boundary" aria-label="公開前の審査境界">
      <div className="page-shell">
        <strong>公開前の Review mode</strong>
        <span>
          構成と未確定事項を確認する表示です。現在の利用契約条件、正式な法務表示、公開承認ではありません。
        </span>
      </div>
    </aside>
  );
}

export function LegalNavigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="legal-document-nav" aria-label="法務・Safety文書ナビゲーション">
      <div className="page-shell">
        <p>文書を移動</p>
        <ul>
          {legalNavigationItems.map((item) => {
            const isCurrent = currentPath === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent ? "page" : undefined}>
                  <span>{item.label}</span>
                  <small>{isCurrent ? "現在の文書" : "→"}</small>
                </Link>
              </li>
            );
          })}
        </ul>
        <details>
          <summary>関連する審査画面</summary>
          <div>
            {reviewContextLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <p>
            開いても、購入、同意、公開承認、問い合わせ送信は発生しません。
          </p>
        </details>
      </div>
    </nav>
  );
}

export function LegalPageHeader({
  eyebrow,
  title,
  description,
  showDates = false,
  status = "公開前・審査用ドラフト",
}: {
  eyebrow: string;
  title: string;
  description: string;
  showDates?: boolean;
  status?: string;
}) {
  return (
    <header className="legal-page-header" data-review-label={eyebrow}>
      <div className="legal-page-header__inner">
        <nav aria-label="パンくず">
          <ol>
            <li><Link href="/">月の返事</Link></li>
            <li><Link href="/legal">法務・Safety</Link></li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <span className="legal-page-status">{status}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {showDates ? <ReviewDates /> : null}
      </div>
    </header>
  );
}

export function ReviewDates() {
  return (
    <dl className="legal-review-dates" aria-label="未確定の日付">
      <div><dt>施行日</dt><dd>未確定</dd></div>
      <div><dt>最終更新日</dt><dd>未確定</dd></div>
    </dl>
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
  return (
    <section
      className={`legal-content-section legal-content-section--${tone}`}
      data-review-section={eyebrow}
    >
      <h2>{title}</h2>
      {intro ? <p className="legal-content-section__intro">{intro}</p> : null}
      <div className="legal-content-section__body">{children}</div>
    </section>
  );
}

export function StatusPill({ status }: { status: ReviewStatusCategory }) {
  return <span className="legal-decision-status">{status}</span>;
}

export function DecisionCard({ decision }: { decision: ReviewDecision }) {
  return (
    <article className="legal-decision-row">
      <div>
        <h3>{decision.label}</h3>
        <StatusPill status={decision.status} />
      </div>
      <p>{decision.summary}</p>
      {decision.decisionIds?.length ? (
        <details>
          <summary>審査メタデータを表示</summary>
          <dl>
            <div><dt>Decision ID</dt><dd>{decision.decisionIds.join(" / ")}</dd></div>
            <div><dt>Status</dt><dd>{decision.status}</dd></div>
            <div><dt>Publication gate</dt><dd>未通過</dd></div>
          </dl>
        </details>
      ) : null}
    </article>
  );
}

export function DecisionGrid({
  decisions,
}: {
  decisions: readonly ReviewDecision[];
}) {
  return (
    <div className="legal-decision-list">
      {decisions.map((decision) => (
        <DecisionCard
          key={`${decision.label}-${
            decision.decisionIds?.join("-") ?? decision.status
          }`}
          decision={decision}
        />
      ))}
    </div>
  );
}

export function FactRows({
  facts,
}: {
  facts: readonly { label: string; value: string }[];
}) {
  return (
    <dl className="legal-fact-rows">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LegalSectionList({
  sections,
}: {
  sections: readonly LegalReviewSection[];
}) {
  return (
    <article className="legal-section-list" aria-label="文書本文">
      {sections.map((section, index) => {
        const headingId = `legal-section-${index + 1}`;
        return (
          <section key={section.title} aria-labelledby={headingId}>
            <div className="legal-section-list__heading">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2 id={headingId}>{section.title}</h2>
            </div>
            <div className="legal-section-list__copy">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
            {section.decisions?.length ? (
              <DecisionGrid decisions={section.decisions} />
            ) : null}
          </section>
        );
      })}
    </article>
  );
}

export function ReviewCallout({
  children,
  strong,
}: {
  children: ReactNode;
  strong?: string;
}) {
  return (
    <aside className="legal-review-callout" role="note">
      {strong ? <strong>{strong}</strong> : null}
      <div>{children}</div>
    </aside>
  );
}
