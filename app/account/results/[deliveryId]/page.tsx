import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerAssessmentNote } from "@/components/runtime/CustomerAssessmentNote";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AccountResultPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  if (!isCustomerAuthFoundationEnabled()) notFound();
  const { deliveryId } = await params;
  let result = null;
  try {
    result = await (
      await createCustomerIdentityAuthApplication()
    ).resolveOwnedResult(deliveryId);
  } catch {
    result = null;
  }
  if (!result) notFound();
  return (
    <main>
      <CustomerAssessmentNote projection={result.projection} />
    </main>
  );
}
