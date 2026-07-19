import type { Metadata } from "next";
import { PublicSampleReport } from "@/components/report/PublicSampleReport";
import { PUBLIC_SAMPLE_SEND_CASE } from "@/fixtures/public/public-sample-cases";

export const metadata: Metadata = {
  title: "「送る」架空ケースの鑑定ノート見本 | 月の返事",
  description: "具体的な日程の質問へ短く返信する判断を示す、実在の相談者・購入者の事例ではない固定架空ケースです。",
};

export default function SampleReportPage() {
  return <PublicSampleReport sample={PUBLIC_SAMPLE_SEND_CASE} />;
}
