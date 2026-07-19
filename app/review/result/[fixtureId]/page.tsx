import type { Metadata } from "next";
import { ReviewReportError } from "@/components/report/ReviewReportError";
import { ReviewWebReport } from "@/components/report/ReviewWebReport";
import { REVIEW_REPORT_ERRORS } from "@/fixtures/review/errors";
import { getRequestFixture } from "@/fixtures/review/requests";
import { getReportFixture, REPORT_FIXTURES } from "@/fixtures/review/reports";

export const metadata: Metadata = {
  title: "Web鑑定ノート（審査用見本） | 月の返事",
  description: "固定架空ケースを14部構成で表示する、購入・AI生成・保存・メール送信のないWeb鑑定ノートの審査用見本です。",
};

export function generateStaticParams() {
  return Object.keys(REPORT_FIXTURES).map((fixtureId) => ({ fixtureId }));
}

export default async function ReviewResultPage({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params;
  const report = getReportFixture(fixtureId);

  if (!report) {
    return <ReviewReportError error={REVIEW_REPORT_ERRORS.missingFixture} />;
  }

  const request = getRequestFixture(report.requestFixtureId);
  return request
    ? <ReviewWebReport report={report} request={request} />
    : <ReviewReportError error={REVIEW_REPORT_ERRORS.unavailableReport} />;
}
