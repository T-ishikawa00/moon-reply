import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/components/request/RequestForm";

export const metadata: Metadata = {
  title: "鑑定依頼フォーム | 月の返事",
  description:
    "月の返事の3ステップ鑑定依頼フォームです。入力・安全確認・同意・ローカル確認までを外部送信なしで確認できます。",
};

export default function RequestPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_82%_4%,rgba(229,196,109,0.22),transparent_22rem),linear-gradient(160deg,#090d1e_0%,#15132f_48%,#2c2143_100%)] text-[#fff7e8]">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#efd58c]/30 bg-[#f7df95]/15 shadow-[0_0_78px_rgba(239,213,140,0.25)]" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8 sm:py-16">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-[#f4ead7]/20 px-4 py-2 text-sm font-semibold text-[#efe5d0] transition hover:border-[#f4ead7]/50 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#f6de9f] focus:ring-offset-2 focus:ring-offset-[#111028]">
            LPへ戻る
          </Link>
          <p className="mt-10 text-sm font-semibold tracking-[0.2em] text-[#d9bb75]">月の返事</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-[1.35] sm:text-5xl">今の状況を、3つのステップで整理します</h1>
          <p className="mt-5 max-w-3xl text-lg leading-9 text-[#efe5d0]">
            あなたと相手の状況、実際のメッセージ、受け取り先と安全確認を順に入力してください。相手の本心・返信・復縁・将来などを保証するサービスではありません。
          </p>
          <div className="mt-6 rounded-lg border border-[#d6b86d]/35 bg-[#18152e]/80 p-5 leading-8 text-[#f5e8cc]" role="note">
            現在は審査用のローカル確認です。入力内容は外部へ送信されず、保存・決済・AI生成も行われません。ブラウザを再読み込みすると入力内容はリセットされます。
          </div>
        </div>
      </section>
      <RequestForm />
    </main>
  );
}
