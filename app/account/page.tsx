import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { AccountLogoutButton } from "@/components/account/AccountLogoutButton";
import { AUTH_SESSION_CSRF_COOKIE } from "@/lib/customer-auth/cookies";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import { isCustomerSupportCasesEnabled } from "@/lib/support/environment";
import styles from "./account.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "私の鑑定ノート | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const query = await searchParams;
  let history = null;
  if (isCustomerAuthFoundationEnabled()) {
    try {
      history = await (
        await createCustomerIdentityAuthApplication()
      ).listAccountHistory();
    } catch {
      history = null;
    }
  }
  const cookieStore = await cookies();
  const sessionCsrf = cookieStore.get(AUTH_SESSION_CSRF_COOKIE)?.value ?? null;
  const supportEnabled = isCustomerSupportCasesEnabled();

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>私の鑑定ノート</h1>
        <p className={styles.intro}>
          ご本人として確認できた鑑定ノートだけを表示します。
        </p>
        {query.auth === "failed" ? (
          <p className={styles.notice} role="alert">
            ログインを完了できませんでした。ログイン画面からもう一度お試しください。
          </p>
        ) : null}
        {!isCustomerAuthFoundationEnabled() ? (
          <section className={styles.login}>
            <h2>現在ログインを利用できません</h2>
            <p>時間を置いてもう一度お試しください。</p>
            <Link href="/login">ログイン画面へ</Link>
          </section>
        ) : history === null ? (
          <section className={styles.login}>
            <h2>ログインが必要です</h2>
            <p>Googleまたはメールでログインすると、過去の鑑定ノートを確認できます。</p>
            <Link href="/login">ログインする</Link>
          </section>
        ) : history.length === 0 ? (
          <section className={styles.empty}>
            <h2>表示できる鑑定ノートはまだありません</h2>
            <p>処理中または完了した購入がここに表示されます。</p>
          </section>
        ) : (
          <ul className={styles.history}>
            {history.map((item) => (
              <li key={item.purchaseIntentId} className={styles.item}>
                <dl>
                  <dt>日付</dt>
                  <dd>{formatDate(item.date)}</dd>
                  <dt>内容</dt>
                  <dd>鑑定ノート</dd>
                  <dt>状態</dt>
                  <dd>{item.state === "completed" ? "完了" : "処理中"}</dd>
                </dl>
                {item.state === "completed" && item.deliveryId ? (
                  <Link href={`/account/results/${item.deliveryId}`}>
                    鑑定ノートを開く
                  </Link>
                ) : null}
                {supportEnabled ? (
                  <Link
                    href={`/contact?purchase=${encodeURIComponent(item.purchaseIntentId)}`}
                  >
                    この購入について問い合わせる
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.actions}>
          <Link href="/">月の返事へ戻る</Link>
          <Link href="/request">新しく鑑定ノートを依頼する</Link>
          {history !== null && sessionCsrf ? (
            <AccountLogoutButton csrfToken={sessionCsrf} />
          ) : null}
        </div>
      </div>
    </main>
  );
}
