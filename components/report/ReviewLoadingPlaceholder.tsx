import {
  ArtifactRule,
  ArtifactSectionLabel,
  ArtifactStamp,
  ArtifactSurface,
} from "@/components/artifact";

export function ReviewLoadingPlaceholder() {
  return (
    <ArtifactSurface className="review-loading-placeholder">
      <div className="review-loading-placeholder__header">
        <ArtifactStamp>静的なローディング状態プレビュー</ArtifactStamp>
        <ArtifactSectionLabel>NO NETWORK · NO TRANSITION</ArtifactSectionLabel>
      </div>
      <ArtifactRule />
      <div role="status" className="review-loading-placeholder__status">
        <p className="review-loading-placeholder__title">審査用表示を準備しています</p>
        <p>表示だけを確認する固定状態です。待機処理、fetch、自動遷移、隠れたリクエストはありません。</p>
        <ul aria-label="固定状態の実行境界">
          <li>通信なし</li>
          <li>timerなし</li>
          <li>自動遷移なし</li>
        </ul>
      </div>
    </ArtifactSurface>
  );
}
