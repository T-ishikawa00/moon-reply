import Link from "next/link";
import {
  ArtifactRule,
  ArtifactSectionLabel,
  ArtifactStamp,
  ArtifactSurface,
} from "@/components/artifact";
import type { ReviewReportErrorFixture } from "@/fixtures/review/errors";

export function ReviewReportError({ error }: { error: ReviewReportErrorFixture }) {
  return (
    <main className="review-report-error-page">
      <ArtifactSurface className="review-report-error-card">
        <header className="review-report-error-card__header">
          <ArtifactSectionLabel>REVIEW REPORT ERROR</ArtifactSectionLabel>
          <ArtifactStamp>{error.statusLabel}</ArtifactStamp>
        </header>
        <h1>{error.title}</h1>
        <div role="alert" className="review-report-error-card__alert">
          {error.message}
        </div>
        <p className="review-report-error-card__explanation">{error.explanation}</p>
        <dl className="review-report-error-card__state">
          <div><dt>report content</dt><dd>表示なし</dd></div>
          <div><dt>fallback</dt><dd>なし</dd></div>
        </dl>
        <ArtifactRule />
        <div className="review-report-error-card__actions">
          <Link href="/review" className="button button--primary">
            審査用プレビュー一覧へ戻る
          </Link>
          <Link href="/" className="button button--outline">
            トップへ戻る
          </Link>
        </div>
      </ArtifactSurface>
    </main>
  );
}
