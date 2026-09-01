import type { Metadata } from "next";
import Link from "next/link";

import {
  CustomerLegalHeader,
  CustomerLegalScaffold,
  CustomerNotice,
  LegalContentSection,
} from "@/components/legal/LegalDocument";
import { PurchaseLinkedSupportForm } from "@/components/support/PurchaseLinkedSupportForm";
import { resolveCustomerAccountPage } from "@/lib/customer-auth/account-page-resolution";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import type { CustomerAccountHistoryItem } from "@/lib/customer-auth/types";
import { isPurchaseSupportEmailEnabled } from "@/lib/support/environment";

const publicContactEmail = "t.ishi1323@gmail.com";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "お問い合わせ | 月の返事",
  description: "月の返事のお問い合わせ窓口をご案内します。",
  referrer: "no-referrer",
};

function formatPurchaseTimestampJst(value: string) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value;
  return `${part("year")}年${part("month")}月${part("day")}日 ${part("hour")}:${part("minute")}`;
}

export default async function ContactPage({ searchParams }: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const purchaseSelector = (await searchParams).purchase;
  let purchase: CustomerAccountHistoryItem | null = null;
  let signedOut = false;
  if (typeof purchaseSelector === "string" && isPurchaseSupportEmailEnabled()) {
    const resolution = await resolveCustomerAccountPage({
      authEnabled: isCustomerAuthFoundationEnabled(),
      getSessionState: async () =>
        (await createCustomerAccountAuthApplication()).getFreshSessionState(),
      listHistory: async () =>
        (await createCustomerIdentityAuthApplication()).listAccountHistory(),
    });
    signedOut = resolution.state === "signed_out";
    purchase = resolution.state === "history"
      ? resolution.history.find((item) => item.purchaseIntentId === purchaseSelector) ?? null
      : null;
  }

  return (
    <CustomerLegalScaffold currentPath="/contact">
      <CustomerLegalHeader
        title="お問い合わせ"
        description="月の返事へのお問い合わせ窓口をご案内します。"
      />
      <div className="legal-document-body">
        {typeof purchaseSelector === "string" ? (
          purchase ? (
            <LegalContentSection title="購入に関するお問い合わせ" tone="ivory">
              <PurchaseLinkedSupportForm
                purchaseIntentId={purchase.purchaseIntentId}
                purchaseDateLabel={formatPurchaseTimestampJst(purchase.date)}
              />
            </LegalContentSection>
          ) : (
            <CustomerNotice title={signedOut ? "ログインが必要です" : "対象の購入を確認できませんでした"}>
              <p>購入を確認するため、Accountから対象の購入を選び直してください。</p>
              <Link
                href={signedOut ? "/login" : "/account"}
                className="legal-document-action"
              >
                {signedOut ? "ログインする" : "私の鑑定ノートへ戻る"}
              </Link>
            </CustomerNotice>
          )
        ) : (
          <>
            <CustomerNotice title="メールでお問い合わせいただけます">
              <p>お問い合わせは、次のメールアドレスで受け付けています。</p>
              <a href={`mailto:${publicContactEmail}`} className="legal-document-action">
                {publicContactEmail}
              </a>
              <p>
                カード番号、パスワード、ログインコードなどの秘密情報は、メールに記載しないでください。
              </p>
            </CustomerNotice>

            <LegalContentSection title="お問い合わせ内容">
              <ul className="legal-plain-list">
                <li>鑑定ノートについて</li>
                <li>決済・返金について</li>
                <li>メール通知について</li>
                <li>プライバシーについて</li>
                <li>特定商取引法に基づく販売事業者情報の開示請求</li>
                <li>その他サービスについて</li>
              </ul>
            </LegalContentSection>

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
          </>
        )}
      </div>
    </CustomerLegalScaffold>
  );
}
