import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthenticatedCheckoutButton } from "@/components/payment/AuthenticatedCheckoutButton";
import { AuthenticatedPreparationContinuation } from "@/components/request/AuthenticatedPreparationContinuation";
import { continueAuthenticatedProductionPreparation } from "@/lib/assessment/production/service";
import { isPrepaymentComputeBudgetEnabled } from "@/lib/assessment/production/prepayment-compute-policy";
import {
  AUTH_CONTINUATION_COOKIE,
  AUTH_SESSION_CSRF_COOKIE,
} from "@/lib/customer-auth/cookies";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "購入前の最終確認 | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default async function AuthenticatedPurchaseContinuationPage() {
  if (!isCustomerAuthFoundationEnabled()) redirect("/account");
  const cookieStore = await cookies();
  const continuation = cookieStore.get(AUTH_CONTINUATION_COOKIE)?.value;
  const csrfToken = cookieStore.get(AUTH_SESSION_CSRF_COOKIE)?.value;
  if (!continuation || !csrfToken) redirect("/account");
  try {
    await (await createCustomerIdentityAuthApplication()).getFreshIdentity();
  } catch {
    redirect("/account");
  }
  let prepaymentOutcome = null;
  if (isPrepaymentComputeBudgetEnabled()) {
    prepaymentOutcome = await continueAuthenticatedProductionPreparation({
      continuationToken: continuation,
    });
  }

  return (
    <main className="request-page">
      <section className="page-shell request-local-complete">
        <p>お申し込み前の最終確認</p>
        <h1>恋のメッセージ鑑定ノート</h1>
        <dl>
          <div><dt>サービス</dt><dd>月の返事</dd></div>
          <div><dt>内容</dt><dd>1相談 / 1鑑定ノート</dd></div>
          <div><dt>料金</dt><dd>税込980円</dd></div>
          <div><dt>購入形式</dt><dd>都度払い</dd></div>
          <div><dt>自動更新</dt><dd>なし</dd></div>
          <div><dt>受け取り</dt><dd>確認済みアカウント</dd></div>
        </dl>
        <p>
          入力内容をAIが整理・分析し、判断材料となる鑑定ノートを作成します。
          相手の本心、返信、復縁、将来の結果を断定・保証しません。
        </p>
        <nav className="request-purchase-links" aria-label="購入前に確認できる情報">
          <Link href="/legal/terms">利用規約</Link>
          <Link href="/legal/privacy">プライバシー</Link>
          <Link href="/legal/refund">返金方針</Link>
          <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
        </nav>
        {prepaymentOutcome ? (
          <AuthenticatedPreparationContinuation
            initialOutcome={prepaymentOutcome}
            csrfToken={csrfToken}
          />
        ) : (
          <AuthenticatedCheckoutButton csrfToken={csrfToken} />
        )}
      </section>
    </main>
  );
}
