import type { Metadata } from "next";
import Link from "next/link";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { RequestForm } from "@/components/request/RequestForm";

export const metadata: Metadata = {
  title: "鑑定依頼シート | 月の返事",
  description:
    "月の返事の鑑定依頼シートです。関係性やメッセージを入力し、AIによる整理・分析を次の行動の判断材料にする「恋のメッセージ鑑定ノート」の依頼内容を確認します。",
};

export default function RequestPage() {
  return (
    <main className="request-page">
      <section className="request-page__intro" aria-labelledby="request-title">
        <LunarArc tone="night" position="top-right" />
        <div className="page-shell request-page__intro-inner">
          <Link href="/" className="text-link request-page__back">
            ← 月の返事へ戻る
          </Link>
          <div className="request-page__brand">
            <MoonSeal />
            <span>月の返事</span>
          </div>
          <p>鑑定依頼シート</p>
          <h1 id="request-title">
            うまくまとめなくて大丈夫。<br />
            今の状況を、そのまま置いていける依頼シート。
          </h1>
          <span>
            必須の長文欄は一つだけです。相談入力のあと、決済より前にSafetyを確認し、
            一枚の依頼メモで受け取り方を確かめます。
          </span>
          <span>
            恋のメッセージ鑑定ノートでは、入力された関係性・状況・メッセージをAIが整理・分析し、
            次にどう動くかを考えるための判断材料にまとめます。相手の本心や未来を断定するものではありません。
          </span>
          <div className="request-page__boundary" role="note">
            現在は審査用のローカル確認です。入力内容は外部へ送信・保存されず、
            決済、AI生成、メール送信も行われません。再読み込みすると入力は失われます。
          </div>
        </div>
      </section>
      <RequestForm />
    </main>
  );
}
