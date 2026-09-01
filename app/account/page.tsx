import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { AccountLogoutButton } from "@/components/account/AccountLogoutButton";
import { presentCustomerAccountHistory } from "@/lib/customer-auth/account-history";
import { resolveCustomerAccountPage } from "@/lib/customer-auth/account-page-resolution";
import { createCustomerAccountAuthApplication } from "@/lib/customer-auth/account-service";
import { AUTH_SESSION_CSRF_COOKIE } from "@/lib/customer-auth/cookies";
import { isCustomerAuthFoundationEnabled } from "@/lib/customer-auth/environment";
import { createCustomerIdentityAuthApplication } from "@/lib/customer-auth/service";
import { isPurchaseSupportEmailEnabled } from "@/lib/support/environment";
import { AccountNoteGallery } from "./AccountNoteGallery";
import { AccountNoteHero } from "./AccountNoteHero";
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
  const supportEnabled = isPurchaseSupportEmailEnabled();
  const hasFreshSignedInState =
    resolution.state === "history" ||
    resolution.state === "empty" ||
    resolution.state === "load_failed";

  return (
    <main className={styles.page}>
      <AccountNoteHero />
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
              <p className={styles.stateKicker}>私の鑑定ノート</p>
              <h2>まだ届いた鑑定ノートはありません</h2>
              <p>
                新しい鑑定ノートが届くと、この場所からいつでも読み返せます。
              </p>
              <Link href="/request">新しい鑑定を依頼する</Link>
            </section>
          ) : (
            <AccountNoteGallery
              history={history}
              supportEnabled={supportEnabled}
            />
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
