import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaidAssessmentNote } from "@/components/runtime/PaidAssessmentNote";
import { isProductionResultNotFoundError } from "@/lib/assessment/production/capabilities";
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
  } catch (error) {
    if (isProductionResultNotFoundError(error)) {
      notFound();
    }
    throw error;
  }
  return (
    <main>
      <PaidAssessmentNote projection={result.projection} />
    </main>
  );
}
