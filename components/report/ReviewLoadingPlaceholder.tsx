export function ReviewLoadingPlaceholder() {
  return (
    <div className="rounded-xl border border-[#cdbb91] bg-[#fffdf5] p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-2 text-sm font-bold text-[#765e2d]">
          静的なローディング状態プレビュー
        </span>
        <span className="font-mono text-sm text-[#67596b]">no network / no transition</span>
      </div>
      <div role="status" className="mt-6 rounded-lg border border-[#d8c596] bg-[#f8f0e2] p-5">
        <p className="m-0 font-serif text-2xl font-semibold leading-[1.5]">審査用表示を準備しています</p>
        <p className="mt-3 leading-8 text-[#67596b]">表示だけを確認する固定状態です。待機処理、fetch、自動遷移、隠れたリクエストはありません。</p>
        <div className="mt-5 grid gap-3" aria-hidden="true">
          <span className="h-3 w-2/3 rounded-full bg-[#d8c596]" />
          <span className="h-3 w-full rounded-full bg-[#e3d6b9]" />
          <span className="h-3 w-5/6 rounded-full bg-[#e3d6b9]" />
        </div>
      </div>
    </div>
  );
}
