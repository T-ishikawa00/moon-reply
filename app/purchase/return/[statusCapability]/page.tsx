import type { Metadata } from "next";
import { PurchaseReturnStatus } from "@/components/payment/PurchaseReturnStatus";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { isCustomerSupportCasesEnabled } from "@/lib/support/environment";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ご購入後の確認 | 月の返事",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
  referrer: "no-referrer",
};

export default async function PurchaseReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ statusCapability: string }>;
  searchParams: Promise<{ cancelled?: string | string[] }>;
}) {
  const { statusCapability } = await params;
  const checkoutCancelled = (await searchParams).cancelled === "1";
  return (
    <main className="purchase-return-page">
      <PurchaseReturnStatus
        statusCapability={statusCapability}
        checkoutCancelled={checkoutCancelled}
        customerAuthEnabled={isCustomerAuthFoundationEnabled()}
        supportEnabled={isCustomerSupportCasesEnabled()}
      />
    </main>
  );
}
