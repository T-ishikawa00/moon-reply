import type { Metadata } from "next";

import { AccountLoginPanel } from "@/components/auth/AccountLoginPanel";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "ログイン | 月の返事",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>月の返事にログイン</h1>
        <p className={styles.intro}>過去の鑑定ノートを確認できます。</p>
        <AccountLoginPanel />
      </div>
    </main>
  );
}
