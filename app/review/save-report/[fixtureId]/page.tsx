import type { Metadata } from "next";
import { ReviewReportError } from "@/components/report/ReviewReportError";
import { ReviewSaveReport } from "@/components/report/ReviewSaveReport";
import { REVIEW_REPORT_ERRORS } from "@/fixtures/review/errors";
import { getReportFixture, REPORT_FIXTURES } from "@/fixtures/review/reports";

export const metadata: Metadata = {
  title: "保存用判断カード（審査用見本） | 月の返事",
  description: "Web鑑定ノートと同じ固定判断を30秒で見返すために再構成した、ファイル生成やダウンロードのない保存向け審査用見本です。",
};

export function generateStaticParams() {
  return Object.keys(REPORT_FIXTURES).map((fixtureId) => ({ fixtureId }));
}

export default async function ReviewSaveReportPage({ params }: { params: Promise<{ fixtureId: string }> }) {
  const { fixtureId } = await params;
  const report = getReportFixture(fixtureId);
  return report
    ? <ReviewSaveReport report={report} />
    : <ReviewReportError error={REVIEW_REPORT_ERRORS.missingFixture} />;
}
