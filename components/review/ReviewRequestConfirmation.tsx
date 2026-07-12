import Link from "next/link";
import type { ReviewRequestFixture } from "@/fixtures/review/requests";

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 border-t border-[#d9caa8] py-3 sm:grid-cols-[12rem_1fr] sm:gap-4"><dt className="font-semibold text-[#765e2d]">{label}</dt><dd className="m-0 whitespace-pre-wrap break-words leading-7">{value || "未入力（任意）"}</dd></div>;
}

function excerpt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "未入力（任意）";
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

export function ReviewRequestConfirmation({ fixture }: { fixture: ReviewRequestFixture }) {
  return (
    <main className="min-h-screen bg-[#f4ead7] px-4 py-12 text-[#2b2335] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-5xl rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 shadow-[0_1.5rem_4rem_rgba(39,31,52,.12)] sm:p-9">
        <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">REQUEST CONFIRMATION</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-[1.45] sm:text-4xl">入力内容を確認してください</h1>
        <p className="mt-4 font-mono text-sm text-[#67596b]">fixture ID: {fixture.id}</p>
        <div className="mt-5 rounded-lg border border-[#b99a4f] bg-[#f5e8bd] p-4 leading-7">
          これは審査段階のローカル確認です。外部送信、データ保存、決済開始、AI生成は行われていません。
        </div>

        <div className="mt-8 space-y-8">
          <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Step 1・あなたと相手の状況</h2><Link href="/request#step-1" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">Step 1を修正</Link></div><dl className="mt-3"><Row label="年齢層" value={fixture.ageGroup} /><Row label="ニックネーム" value={fixture.nickname} /><Row label="相手との関係" value={fixture.relationship} /><Row label="相手との状況" value={fixture.relationshipStatus.join("、")} /><Row label="返信待ち期間" value={fixture.replyWait} /></dl></section>
          <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Step 2・実際のやり取りと今夜の相談</h2><Link href="/request#step-2" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">Step 2を修正</Link></div><dl className="mt-3"><Row label="相手の最後の文面" value={excerpt(fixture.lastPartnerMessage)} /><Row label="自分の最後の文面" value={excerpt(fixture.lastOwnMessage)} /><Row label="送信予定の文面" value={excerpt(fixture.draftMessage)} /><Row label="直近の流れ" value={excerpt(fixture.recentFlow)} /><Row label="主な不安" value={excerpt(fixture.mainConcern)} /><Row label="希望する行動" value={excerpt(fixture.desiredAction)} /><Row label="一番の質問" value={excerpt(fixture.mainQuestion)} /><Row label="今夜送る意向" value={fixture.sendTonight} /></dl></section>
          <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Step 3・受け取り・安全確認・同意</h2><Link href="/request#step-3" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">Step 3を修正</Link></div><dl className="mt-3"><Row label="メールアドレス" value={fixture.email} /><Row label="安全確認" value="通常鑑定の確認に進める内容" /><Row label="同意事項" value="確認済み" /></dl><p className="mt-4 font-semibold">同意事項：確認済み</p></section>
        </div>

        <div className="mt-8 rounded-lg border border-[#d6b86d]/40 bg-[#18152e] p-5 text-[#efe5d0]">
          <p className="leading-8">購入確認はこのタスクの範囲外です。ここから先へ進む操作、決済リンク、レポートリンクはありません。</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-3"><Link href="/review/request/normal-allowed" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">通常状態へ戻る</Link><Link href="/review" className="inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold">審査用一覧へ</Link></div>
      </article>
    </main>
  );
}
