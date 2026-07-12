import type { Metadata } from "next";
import { ReviewReportError } from "@/components/report/ReviewReportError";
import { REVIEW_REPORT_ERRORS } from "@/fixtures/review/errors";

export const metadata: Metadata = {
  title: "指定fixtureなし（審査用） | 月の返事",
  description: "許可リストにない審査用fixtureを代替表示せず、安全に停止する固定エラー見本です。",
};

export default function MissingFixturePage() {
  return <ReviewReportError error={REVIEW_REPORT_ERRORS.missingFixture} />;
}
