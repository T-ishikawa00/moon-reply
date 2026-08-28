import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { MoonSeal } from "@/components/brand/MoonSeal";
import { AuthenticatedCheckoutButton } from "@/components/payment/AuthenticatedCheckoutButton";
import { AuthenticatedPreparationContinuation } from "@/components/request/AuthenticatedPreparationContinuation";
import { isPrepaymentComputeBudgetEnabled } from "@/lib/assessment/production/prepayment-compute-policy";
import { continueAuthenticatedProductionPreparation } from "@/lib/assessment/production/service";
import { M2RuntimeError } from "@/lib/assessment/runtime/errors";
import {
  AUTH_CONTINUATION_COOKIE,
  AUTH_SESSION_CSRF_COOKIE,
} from "@/lib/customer-auth/cookies";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "鑑定のお申し込み | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

function PurchaseConfirmation({ children }: { children: ReactNode }) {
  return (
    <section className="page-shell request-local-complete">
      <p role="status">お申し込み前の最終確認</p>
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
        相手の本心、返信、復縁、未来、関係改善を断定・保証しません。
      </p>
      {children}
      <nav className="request-purchase-links" aria-label="購入前に確認できる情報">
        <Link href="/legal/terms">利用規約</Link>
        <Link href="/legal/privacy">プライバシー</Link>
        <Link href="/legal/refund">返金方針</Link>
        <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
        <Link href="/legal/ai-disclosure">AI利用について</Link>
      </nav>
    </section>
  );
}

function PreparingScreen() {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-title"
      aria-busy="true"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <div className="authenticated-preparing__moon" aria-hidden="true">
        <MoonSeal size="medium" />
      </div>
      <p>月の返事</p>
      <h1 id="authenticated-preparing-title">鑑定の準備をしています</h1>
      <span>
        ご相談内容を読みながら、今回の鑑定ノートを整えています。
        準備ができると、このまま次へ進みます。
      </span>
    </section>
  );
}

function FailedScreen() {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-error-title"
    >
      <p>月の返事</p>
      <h1 id="authenticated-preparing-error-title">準備状況を確認できませんでした</h1>
      <span role="alert">
        料金は発生していません。時間を置いて、同じお申し込みのままもう一度お試しください。
      </span>
      <form
        className="authenticated-preparing__retry"
        action="/purchase/auth/continue"
        method="get"
      >
        <button className="button button--secondary" type="submit">
          もう一度確認する
        </button>
      </form>
    </section>
  );
}

function InProgressScreen() {
  return (
    <section
      className="page-shell request-local-complete authenticated-preparing"
      aria-labelledby="authenticated-preparing-progress-title"
      aria-live="polite"
      role="status"
    >
      <div className="authenticated-preparing__moon" aria-hidden="true">
        <MoonSeal size="medium" />
      </div>
      <p>月の返事</p>
      <h1 id="authenticated-preparing-progress-title">鑑定の準備を続けています</h1>
      <span>
        同じお申し込みの鑑定ノートを、いま整えています。
        少し時間を置いてから、準備状況を確認してください。
      </span>
      <form
        className="authenticated-preparing__retry"
        action="/purchase/auth/continue"
        method="get"
      >
        <button className="button button--secondary" type="submit">
          準備状況を確認する
        </button>
      </form>
    </section>
  );
}

async function AuthenticatedPreparationResult({
  continuation,
  csrfToken,
}: {
  continuation: string;
  csrfToken: string;
}) {
  let outcome: Awaited<
    ReturnType<typeof continueAuthenticatedProductionPreparation>
  > = null;
  let inProgress = false;
  try {
    outcome = await continueAuthenticatedProductionPreparation({
      continuationToken: continuation,
    });
  } catch (error) {
    inProgress =
      error instanceof M2RuntimeError &&
      error.safeCode === "PRODUCTION_PREPARATION_IN_PROGRESS";
    outcome = null;
  }
  if (inProgress) return <InProgressScreen />;
  if (outcome === null) return <FailedScreen />;
  if (outcome.status === "purchase_ready") {
    return (
      <PurchaseConfirmation>
        <AuthenticatedPreparationContinuation
          initialOutcome={outcome}
          csrfToken={csrfToken}
        />
      </PurchaseConfirmation>
    );
  }
  return (
    <section
      className="page-shell request-local-complete authenticated-preparation-outcome"
      aria-label="鑑定の準備結果"
    >
      {outcome.status === "needs_one_clarifying_answer" ? (
        <p role="status">準備が整いました。確認を一つお願いします。</p>
      ) : null}
      <AuthenticatedPreparationContinuation
        initialOutcome={outcome}
        csrfToken={csrfToken}
      />
    </section>
  );
}

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
  return (
    <main className="request-page request-auth-continuation-page">
      {isPrepaymentComputeBudgetEnabled() ? (
        <Suspense fallback={<PreparingScreen />}>
          <AuthenticatedPreparationResult
            continuation={continuation}
            csrfToken={csrfToken}
          />
        </Suspense>
      ) : (
        <PurchaseConfirmation>
          <AuthenticatedCheckoutButton csrfToken={csrfToken} />
        </PurchaseConfirmation>
      )}
    </main>
  );
}
