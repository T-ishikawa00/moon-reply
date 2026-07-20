import type { Metadata } from "next";
import { VisualPrototypeShell } from "@/components/prototype/visual-excellence/VisualPrototypeShell";
import { getReportFixture } from "@/fixtures/review/reports";

export const metadata: Metadata = {
  title: "B案 Lunar Contrast Edition | M1-P3 prototype",
  description: "同一固定fixtureを月夜と紙のコントラストで構成する非本番coded prototypeです。",
};

export default function VisualExcellencePrototypeBPage() {
  const report = getReportFixture("result-normal-001");
  if (!report) throw new Error("M1-P3 prototype fixed fixture is unavailable.");

  return <VisualPrototypeShell variant="b" report={report} />;
}
