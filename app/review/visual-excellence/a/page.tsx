import type { Metadata } from "next";
import { VisualPrototypeShell } from "@/components/prototype/visual-excellence/VisualPrototypeShell";
import { getReportFixture } from "@/fixtures/review/reports";

export const metadata: Metadata = {
  title: "A案 Quiet Editorial Letter | M1-P3 prototype",
  description: "同一固定fixtureを静かな高級編集誌・私的な手紙として構成する非本番coded prototypeです。",
};

export default function VisualExcellencePrototypeAPage() {
  const report = getReportFixture("result-normal-001");
  if (!report) throw new Error("M1-P3 prototype fixed fixture is unavailable.");

  return <VisualPrototypeShell variant="a" report={report} />;
}
