import type { Metadata } from "next";
import { ReviewReportError } from "@/components/report/ReviewReportError";
import { REVIEW_REPORT_ERRORS } from "@/fixtures/review/errors";

export const metadata: Metadata = {
  title: "レポート表示不可（審査用） | 月の返事",
  description: "購入や外部処理の失敗を示さない、審査用の固定されたレポート表示不可状態です。",
};

export default function UnavailableReportPage() {
  return <ReviewReportError error={REVIEW_REPORT_ERRORS.unavailableReport} />;
}
