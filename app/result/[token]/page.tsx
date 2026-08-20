import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";
import { resolveProductionResult } from "@/lib/assessment/production/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  referrer: "no-referrer",
};

export default async function ProductionResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let result;
  try {
    result = await resolveProductionResult(token);
  } catch {
    notFound();
  }
  return (
    <main>
      <CustomerAssessmentNote projection={result.projection} />
    </main>
  );
}
