import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { AccountLogoutButton } from "@/components/account/AccountLogoutButton";
import { EditorialDivider } from "@/components/brand/EditorialDivider";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { presentCustomerAccountHistory } from "@/lib/customer-auth/account-history";
import { resolveCustomerAccountPage } from "@/lib/customer-auth/account-page-resolution";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
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

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const query = await searchParams;
  const authEnabled = isCustomerAuthFoundationEnabled();
  const resolution = await resolveCustomerAccountPage({
    authEnabled,
    getSessionState: async () =>
      (await createCustomerAccountAuthApplication()).getFreshSessionState(),
    listHistory: async () =>
      (await createCustomerIdentityAuthApplication()).listAccountHistory(),
  });
  const history =
    resolution.state === "history"
      ? presentCustomerAccountHistory(resolution.history)
      : [];
  const cookieStore = await cookies();
  const sessionCsrf = cookieStore.get(AUTH_SESSION_CSRF_COOKIE)?.value ?? null;
  const supportEnabled = isCustomerSupportCasesEnabled();
  const hasFreshSignedInState =
    resolution.state === "history" ||
    resolution.state === "empty" ||
    resolution.state === "load_failed";

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <LunarArc tone="night" position="top-right" />
        <div className={styles.heroInner}>
          <div className={styles.brand}>
            <MoonSeal size="medium" />
            <span>月の返事</span>
          </div>
          <p className={styles.eyebrow}>私の鑑定ノート</p>
          <h1>これまで届いた鑑定ノート</h1>
          <p className={styles.intro}>
            迷った夜に受け取った言葉を、ここからいつでも読み返せます。
          </p>
          <EditorialDivider variant="night" />
        </div>
      </header>
      <div className={styles.shelfSurface}>
        <div className={styles.shell}>
          {query.auth === "failed" ? (
            <p className={styles.notice} role="alert">
              ログインを完了できませんでした。ログイン画面からもう一度お試しください。
            </p>
          ) : null}
          {resolution.state === "auth_unavailable" ? (
            <section className={styles.login}>
              <h2>現在、ログイン状態を確認できません</h2>
              <p>時間を置いて、もう一度ご確認ください。</p>
              <Link className={styles.secondaryAction} href="/account">
                もう一度確認する
              </Link>
            </section>
          ) : resolution.state === "signed_out" ? (
            <section className={styles.login}>
              <h2>ログインが必要です</h2>
              <p>
                Googleまたはメールでログインすると、過去の鑑定ノートを確認できます。
              </p>
              <Link href="/login">ログインする</Link>
            </section>
          ) : resolution.state === "load_failed" ? (
            <section className={styles.login}>
              <h2>鑑定ノートの一覧を読み込めませんでした</h2>
              <p>
                ログイン状態は確認できています。時間を置いて、もう一度ご確認ください。
              </p>
              <Link className={styles.secondaryAction} href="/account">
                もう一度確認する
              </Link>
            </section>
          ) : resolution.state === "empty" ? (
            <section className={styles.empty}>
              <p className={styles.stateKicker}>まだ静かな本棚です</p>
              <h2>まだ届いた鑑定ノートはありません</h2>
              <p>
                新しい鑑定ノートが届くと、この場所からいつでも読み返せます。
              </p>
              <Link href="/request">鑑定ノートを依頼する</Link>
            </section>
          ) : (
            <ol className={styles.history} aria-label="鑑定ノート一覧">
              {history.map((item, index) => (
                <li key={item.purchaseIntentId} className={styles.item}>
                  <article aria-labelledby={`account-note-${index}`}>
                    <div className={styles.cardHeader}>
                      <div className={styles.noteHeading}>
                        <time className={styles.dateLabel} dateTime={item.date}>
                          {item.dateTimeLabel}
                        </time>
                        <h2 id={`account-note-${index}`}>{item.title}</h2>
                      </div>
                      {item.statusLabel ? (
                        <span className={styles.status}>{item.statusLabel}</span>
                      ) : null}
                    </div>
                    <p className={styles.summary}>{item.summary}</p>
                    <div className={styles.cardActions}>
                      {item.canOpenResult && item.deliveryId !== null ? (
                        <Link
                          className={styles.primaryAction}
                          href={`/account/results/${item.deliveryId}`}
                        >
                          ノートをひらく
                        </Link>
                      ) : null}
                      {supportEnabled ? (
                        <Link
                          className={styles.secondaryAction}
                          href={`/contact?purchase=${encodeURIComponent(item.purchaseIntentId)}`}
                        >
                          この購入について問い合わせる
                        </Link>
                      ) : null}
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}
          <div className={styles.actions}>
            <Link href="/">月の返事へ戻る</Link>
            <Link href="/request">新しく鑑定ノートを依頼する</Link>
            {hasFreshSignedInState && sessionCsrf ? (
              <AccountLogoutButton csrfToken={sessionCsrf} />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
