import Link from "next/link";
import type { ReactNode } from "react";
import {
  currentCustomerLegalNavigation,
  type CustomerLegalSection,
} from "@/lib/legal/current-content";

export function CustomerLegalScaffold({
  currentPath,
  children,
}: {
  currentPath: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-review-scaffold" data-customer-legal-document>
      <CustomerLegalNavigation currentPath={currentPath} />
      {children}
    </main>
  );
}

export function CustomerLegalNavigation({ currentPath }: { currentPath: string }) {
  return (
    <nav className="legal-document-nav" aria-label="ご利用に関する文書">
      <div className="page-shell">
        <p>ご利用に関する情報</p>
        <ul>
          {currentCustomerLegalNavigation.map((item) => {
            const isCurrent = currentPath === item.href;
            return (
              <li key={item.href}>
                <Link href={item.href} aria-current={isCurrent ? "page" : undefined}>
                  <span>{item.label}</span>
                  <small aria-hidden="true">{isCurrent ? "このページ" : "→"}</small>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function CustomerLegalHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="legal-page-header">
      <div className="legal-page-header__inner">
        <nav aria-label="パンくず">
          <ol>
            <li><Link href="/">月の返事</Link></li>
            <li><Link href="/legal">ご利用にあたって</Link></li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

export function LegalContentSection({
  title,
  intro,
  children,
  tone = "paper",
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  tone?: "paper" | "ivory" | "night";
}) {
  return (
    <section className={`legal-content-section legal-content-section--${tone}`}>
      <h2>{title}</h2>
      {intro ? <p className="legal-content-section__intro">{intro}</p> : null}
      <div className="legal-content-section__body">{children}</div>
    </section>
  );
}

export function LegalFactRows({
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
  sections: readonly CustomerLegalSection[];
}) {
  return (
    <article className="legal-section-list" aria-label="文書本文">
      {sections.map((section, index) => {
        const headingId = `legal-section-${index + 1}`;
        return (
          <section key={section.title} aria-labelledby={headingId}>
            <div className="legal-section-list__heading">
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <h2 id={headingId}>{section.title}</h2>
            </div>
            <div className="legal-section-list__copy">
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
            {section.bullets?.length ? (
              <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : null}
          </section>
        );
      })}
    </article>
  );
}

export function CustomerNotice({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="legal-review-callout" role="note">
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  );
}
