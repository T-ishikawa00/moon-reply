import type { Metadata } from "next";
import Link from "next/link";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { RequestForm } from "@/components/request/RequestForm";
import { isCustomerPaymentFlowVisible } from "@/lib/payment/production/environment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "鑑定依頼シート | 月の返事",
  description:
    "月の返事の鑑定依頼シートです。関係性やメッセージを入力し、AIによる整理・分析を次の行動の判断材料にする「恋のメッセージ鑑定ノート」の依頼内容を確認します。",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RequestPage() {
  const paymentEnabled = isCustomerPaymentFlowVisible();
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
            {paymentEnabled ? (
              <>
                入力後、サーバーで利用可否と鑑定ノートの適格性を確認します。購入へ進める場合だけ、
                受け取りメールの確認と税込980円の最終確認を行い、Stripeの安全な決済画面へ移動します。
              </>
            ) : (
              <>
                現在は公開前の審査モードで、有料販売は開始していません。入力後、このサイト内で
                利用可否を確認する通信が行われることがありますが、本番用の確認は完了せず、
                購入手続きには進みません。決済、外部AIによる生成、入力内容の継続保存、
                メール送信は行われません。再読み込みすると入力は失われます。
              </>
            )}
          </div>
        </div>
      </section>
      <RequestForm paymentEnabled={paymentEnabled} />
    </main>
  );
}
