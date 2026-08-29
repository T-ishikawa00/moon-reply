import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthenticatedCheckoutButton } from "@/components/payment/AuthenticatedCheckoutButton";
import { HostedAuthenticatedPreparation } from "@/components/request/HostedAuthenticatedPreparation";
import { PurchaseConfirmation } from "@/components/request/PurchaseConfirmation";
import { isPrepaymentComputeBudgetEnabled } from "@/lib/assessment/production/prepayment-compute-policy";
import {
  AUTH_CONTINUATION_COOKIE,
  AUTH_SESSION_CSRF_COOKIE,
} from "@/lib/customer-auth/cookies";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "鑑定のお申し込み | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AuthenticatedPurchaseContinuationPage() {
  if (!isCustomerAuthFoundationEnabled()) redirect("/account");
  const cookieStore = await cookies();
  const continuation = cookieStore.get(AUTH_CONTINUATION_COOKIE)?.value;
  const csrfToken = cookieStore.get(AUTH_SESSION_CSRF_COOKIE)?.value;
  if (!continuation || !csrfToken) redirect("/account");
  return (
    <main className="request-page request-auth-continuation-page">
      {isPrepaymentComputeBudgetEnabled() ? (
        <HostedAuthenticatedPreparation csrfToken={csrfToken} />
      ) : (
        <PurchaseConfirmation>
          <AuthenticatedCheckoutButton csrfToken={csrfToken} />
        </PurchaseConfirmation>
      )}
    </main>
  );
}
