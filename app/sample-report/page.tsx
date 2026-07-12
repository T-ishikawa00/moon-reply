import type { Metadata } from "next";
import { PublicSampleReport } from "@/components/report/PublicSampleReport";
import { PUBLIC_SAMPLE_REPORT } from "@/fixtures/review/reports";

export const metadata: Metadata = {
  title: "架空サンプル鑑定書 | 月の返事",
  description: "実在の相談、購入、レビュー、AI生成実績ではない、月の返事の文章品質と判断支援方針を確認する架空サンプルです。",
};

export default function SampleReportPage() {
  return <PublicSampleReport sample={PUBLIC_SAMPLE_REPORT} />;
}
