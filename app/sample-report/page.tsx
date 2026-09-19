import type { Metadata } from "next";
import { SampleViewMeasurement } from "@/components/measurement/SampleViewMeasurement";
import { PublicSampleReport } from "@/components/report/PublicSampleReport";
import { PUBLIC_SAMPLE_SEND_CASE } from "@/fixtures/public/public-sample-cases";
import { PUBLIC_SAMPLE_WAIT_REPORT } from "@/fixtures/public/public-sample-wait-report";

export const metadata: Metadata = {
  title: "送るか、待つか｜恋のメッセージ鑑定ノート全文見本 | 月の返事",
  description:
    "送る場合と待つ場合を読み比べられる、月の返事「恋のメッセージ鑑定ノート」の架空の編集見本です。1相談税込980円、都度払い・自動更新なし。",
};

export default function SampleReportPage() {
  return (
    <>
      <SampleViewMeasurement />
      <PublicSampleReport
        initialSample={PUBLIC_SAMPLE_WAIT_REPORT}
        alternateSample={PUBLIC_SAMPLE_SEND_CASE}
      />
    </>
  );
}
