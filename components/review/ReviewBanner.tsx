import Link from "next/link";

export function ReviewBanner() {
  return (
    <aside className="review-banner" aria-label="審査用プレビューの注意">
      <div className="review-banner__inner">
        <div className="review-banner__lead">
          <span className="review-banner__icon" aria-hidden="true">i</span>
          <strong>審査用プレビュー｜実際の決済・送信は行われません</strong>
        </div>
        <details className="review-banner__details">
          <summary>審査条件の詳細</summary>
          <p>この画面は架空データを使用しています。AI生成、メール配信、データ保存も動作しません。</p>
          <Link href="/review">審査用プレビュー一覧へ</Link>
        </details>
      </div>
    </aside>
  );
}
