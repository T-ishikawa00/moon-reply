import styles from "./account.module.css";

export default function AccountLoading() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <p className={styles.eyebrow}>月の返事</p>
        <h1>私の鑑定ノート</h1>
        <section className={styles.login} aria-live="polite">
          <h2>鑑定ノートを確認しています。</h2>
          <p>このまま少しお待ちください。</p>
        </section>
      </div>
    </main>
  );
}
