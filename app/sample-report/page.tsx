import type { Metadata } from "next";
import { SampleViewMeasurement } from "@/components/measurement/SampleViewMeasurement";
import { PublicSampleReport } from "@/components/report/PublicSampleReport";
import { PUBLIC_SAMPLE_SEND_CASE } from "@/fixtures/public/public-sample-cases";

export const metadata: Metadata = {
  title: "「送る」架空ケース｜恋のメッセージ鑑定ノート全文見本 | 月の返事",
  description:
    "月の返事「恋のメッセージ鑑定ノート」の固定された架空の全文見本です。実際の商品は入力された関係性やメッセージをAIが整理・分析し、次の行動の判断材料にしますが、この見本は実在事例でもAI生成実績でもありません。",
};

export default function SampleReportPage() {
  return (
    <>
      <SampleViewMeasurement />
      <PublicSampleReport sample={PUBLIC_SAMPLE_SEND_CASE} />
    </>
  );
}
