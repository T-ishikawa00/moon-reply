import Link from "next/link";

import styles from "./result.module.css";

export default function AccountResultNotFound() {
  return (
    <main className={styles.recoveryPage}>
      <section className={styles.recoveryCard}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>この鑑定ノートを確認できませんでした。</h1>
        <p>私の鑑定ノートから、確認できるノートをお選びください。</p>
        <Link className={styles.action} href="/account">
          私の鑑定ノートへ戻る
        </Link>
      </section>
    </main>
  );
}
