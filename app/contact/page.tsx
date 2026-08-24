import type { Metadata } from "next";
import Link from "next/link";

import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";
import { CustomerSupportForm } from "@/components/support/CustomerSupportForm";
import { M2RuntimeError } from "@/lib/assessment/runtime/errors";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import { isCustomerSupportCasesEnabled } from "@/lib/support/environment";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "お問い合わせ | 月の返事",
  description: "月の返事のお問い合わせ窓口の現在の状態をご案内します。",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const supportEnabled = isCustomerSupportCasesEnabled();
  const authEnabled = isCustomerAuthFoundationEnabled();
  let history = null;
  let historyState: "authenticated" | "signed_out" | "unavailable" =
    "signed_out";
  if (supportEnabled && authEnabled) {
    try {
      history = await (
        await createCustomerIdentityAuthApplication()
      ).listAccountHistory();
      historyState = "authenticated";
    } catch (error) {
      history = null;
      historyState =
        error instanceof M2RuntimeError &&
        error.safeCode === "CUSTOMER_AUTH_REQUIRED"
          ? "signed_out"
          : "unavailable";
    }
  }
  const query = await searchParams;
  const purchases =
    history?.map((item) => ({
      purchaseIntentId: item.purchaseIntentId,
      dateLabel: formatDate(item.date),
      stateLabel: item.state === "completed" ? "完了" : "処理中",
    })) ?? [];
  const initialPurchaseIntentId =
    purchases.find(
      (purchase) => purchase.purchaseIntentId === query.purchase,
    )?.purchaseIntentId ?? null;

  return (
    <CustomerLegalScaffold currentPath="/contact">
      <CustomerLegalHeader
        title="お問い合わせ"
        description="月の返事へのお問い合わせ方法についてのご案内です。"
      />
      <div className="legal-document-body">
        {!supportEnabled || !authEnabled ? (
          <>
            <CustomerNotice title="お問い合わせ窓口は現在準備中です">
              <p>
                現在、このページからメッセージを送信することはできません。安全な受付方法と運用体制を用意した後、このページで案内します。
              </p>
            </CustomerNotice>
            <LegalContentSection title="現在できないこと">
              <ul className="legal-plain-list">
                <li>お問い合わせの送信</li>
                <li>結果や通知メールに関する依頼</li>
                <li>取消し、返金、誤請求の申出</li>
                <li>プライバシーに関する開示・訂正・削除等の申出</li>
              </ul>
              <p>
                送信済みと表示する機能、実在しない連絡先、返信までの所要時間は案内していません。
              </p>
            </LegalContentSection>
          </>
        ) : historyState === "signed_out" ? (
          <>
            <CustomerNotice title="購入に関するお問い合わせにはログインが必要です">
              <p>
                支払い・請求・返金・鑑定ノートについては、購入時のご本人であることをサーバーで確認してから受け付けます。決済ID、結果URL、ログインコードを貼り付けて本人確認することはありません。
              </p>
            </CustomerNotice>
            <LegalContentSection title="ログインできない場合">
              <p>
                認証自体に問題がある場合の外部受付方法は現在準備中です。安全な連絡先を掲載するまでは、決済情報を本文に記載して送る方法は案内しません。
              </p>
              <Link href="/account" className="legal-document-action">
                ログイン済みのアカウント画面を確認する
              </Link>
            </LegalContentSection>
          </>
        ) : historyState === "unavailable" ? (
          <CustomerNotice title="現在、お問い合わせを受け付けられません">
            <p>
              本人確認または受付状態を安全に確認できませんでした。お支払い、返金、鑑定ノートの処理状態は、この表示によって変更されていません。時間をおいて、このページを確認してください。
            </p>
          </CustomerNotice>
        ) : (
          <LegalContentSection title="お問い合わせを送信する">
            <p>
              購入に関する内容は、ログイン中のご本人に結び付いた購入を選んで送信できます。受付は問題を記録するもので、返金や再処理を自動で実行するものではありません。
            </p>
            <CustomerSupportForm
              purchases={purchases}
              initialPurchaseIntentId={initialPurchaseIntentId}
            />
          </LegalContentSection>
        )}

        <LegalContentSection title="返金・誤請求について" tone="ivory">
          <p>
            支払済みの購入については、同じ購入の範囲で安全な回復と提供を試み、重複して請求しないことが基本です。重複・誤額などの意図しない請求や、最終的に提供できない場合の考え方は返金方針で説明しています。
          </p>
          <Link href="/legal/refund" className="legal-document-action">
            返金方針を確認する
          </Link>
        </LegalContentSection>

        <LegalContentSection title="ご利用に関する情報">
          <p>
            利用条件、情報の取扱い、AI利用、安全上の境界は、次のページから確認できます。
          </p>
          <div className="legal-inline-links">
            <Link href="/legal/terms">利用規約</Link>
            <Link href="/legal/privacy">プライバシーポリシー</Link>
            <Link href="/legal/ai-disclosure">AI利用について</Link>
            <Link href="/legal/unsupported-cases">対応できない相談</Link>
          </div>
        </LegalContentSection>
      </div>
    </CustomerLegalScaffold>
  );
}
