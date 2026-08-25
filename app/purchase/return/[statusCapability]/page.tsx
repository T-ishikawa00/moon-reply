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
}: {
  params: Promise<{ statusCapability: string }>;
}) {
  const { statusCapability } = await params;
  return (
    <main className="purchase-return-page">
      <PurchaseReturnStatus
        statusCapability={statusCapability}
        customerAuthEnabled={isCustomerAuthFoundationEnabled()}
        supportEnabled={isCustomerSupportCasesEnabled()}
      />
    </main>
  );
}
