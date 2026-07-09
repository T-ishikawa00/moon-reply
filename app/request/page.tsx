import type { Metadata } from "next";
import Link from "next/link";
import { RequestForm } from "@/components/request/RequestForm";

export const metadata: Metadata = {
  title: "鑑定依頼フォーム | 月の返事",
  description:
    "月の返事の鑑定依頼フォームUIです。Stage 2では送信・保存・決済・AI生成は行いません。",
};

export default function RequestPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_82%_4%,rgba(229,196,109,0.22),transparent_22rem),linear-gradient(160deg,#090d1e_0%,#15132f_48%,#2c2143_100%)] text-[#fff7e8]">
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute right-8 top-8 h-24 w-24 rounded-full border border-[#efd58c]/30 bg-[#f7df95]/15 shadow-[0_0_78px_rgba(239,213,140,0.25)]"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-16">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-lg border border-[#f4ead7]/20 px-4 py-2 text-sm font-semibold text-[#efe5d0] transition hover:border-[#f4ead7]/50 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#f6de9f] focus:ring-offset-2 focus:ring-offset-[#111028]"
          >
            LPへ戻る
          </Link>
          <p className="mt-10 text-sm font-semibold tracking-[0.2em] text-[#d9bb75]">
            月の返事
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.35] sm:text-5xl">
            鑑定依頼フォーム
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-9 text-[#efe5d0]">
            送る前の言葉、今の関係、今夜の不安を入力してください。このStageでは、入力内容の確認UIまでを実装しています。
          </p>
          <div className="mt-6 rounded-lg border border-[#d6b86d]/35 bg-[#18152e]/80 p-5 leading-8 text-[#f5e8cc]">
            Stage 2では、送信・保存・決済・AI生成は行いません。フォームの入力は外部送信されず、画面上の確認表示だけで完結します。
          </div>
        </div>
      </section>

      <RequestForm />
    </main>
  );
}
