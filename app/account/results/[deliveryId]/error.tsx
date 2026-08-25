"use client";

import Link from "next/link";

import styles from "./result.module.css";

export default function AccountResultError({ reset }: { reset: () => void }) {
  return (
    <main className={styles.recoveryPage}>
      <section className={styles.recoveryCard}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>現在、鑑定ノートを表示できません。</h1>
        <p>時間を置いてもう一度試すか、私の鑑定ノートへお戻りください。</p>
        <div className={styles.recoveryActions}>
          <button type="button" onClick={() => reset()}>
            もう一度試す
          </button>
          <Link className={styles.action} href="/account">
            私の鑑定ノートへ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
