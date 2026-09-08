import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PaidAssessmentNote } from "@/components/runtime/PaidAssessmentNote";
import { resolveCustomerAccountResult } from "@/lib/customer-auth/account-result-resolution";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import styles from "./result.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "鑑定ノート | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AccountResultPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  const resolution = await resolveCustomerAccountResult({
    authEnabled: isCustomerAuthFoundationEnabled(),
    deliveryId,
    getSessionState: async () =>
      (await createCustomerAccountAuthApplication()).getFreshSessionState(),
    resolveOwnedResult: async (selector) =>
      (await createCustomerIdentityAuthApplication()).resolveOwnedResult(
        selector,
      ),
  });
  if (resolution.state === "auth_required") redirect("/login");
  if (resolution.state === "not_found") notFound();
  return (
    <main className={styles.page}>
      <nav className={styles.navigation} aria-label="鑑定ノートのナビゲーション">
        <Link href="/account">私の鑑定ノートへ戻る</Link>
      </nav>
      <PaidAssessmentNote projection={resolution.result.projection} />
      <nav className={styles.navigation} aria-label="鑑定ノートのナビゲーション">
        <Link href="/account">私の鑑定ノートへ戻る</Link>
      </nav>
    </main>
  );
}
