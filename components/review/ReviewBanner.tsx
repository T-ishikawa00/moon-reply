import Link from "next/link";

export function ReviewBanner() {
  return (
    <aside className="review-banner" aria-label="審査用プレビューの注意">
      <div className="review-banner__inner">
        <div className="review-banner__lead">
          <span className="review-banner__icon" aria-hidden="true">i</span>
          <span>
            <strong>審査用プレビュー</strong>
            <small>実際の決済・送信は行われません</small>
          </span>
        </div>
        <details className="review-banner__details">
          <summary>実行境界</summary>
          <p>この画面は架空データを使用しています。AI生成、メール配信、データ保存も動作しません。</p>
          <Link href="/review">審査用プレビュー一覧へ</Link>
        </details>
      </div>
    </aside>
  );
}
