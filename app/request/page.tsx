import type { Metadata } from "next";
import Link from "next/link";
import { LunarArc } from "@/components/brand/LunarArc";
import { MoonSeal } from "@/components/brand/MoonSeal";
import { RequestForm } from "@/components/request/RequestForm";
import requestStyles from "@/components/request/RequestForm.module.css";
import { isCustomerPaymentFlowVisible } from "@/lib/payment/production/environment";
import { isCustomerAuthCutoverSelected } from "@/lib/customer-auth/cutover";
import { isPrepaymentComputeBudgetEnabled } from "@/lib/assessment/production/prepayment-compute-policy";

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
          <div
            className={`page-shell request-page__intro-inner ${requestStyles.requestIntroInner}`}
          >
          <Link href="/" className="text-link request-page__back">
            ← 月の返事へ戻る
          </Link>
          <div className="request-page__brand">
            <MoonSeal />
            <span>月の返事</span>
          </div>
          <p>鑑定依頼シート</p>
          <h1 id="request-title">いま迷っていることを、あなたの言葉で。</h1>
          <span>
            短い文章でも大丈夫です。今の関係と知りたいことを選び、状況を教えてください。
          </span>
          <span>
            入力された関係・状況・文面をAIが整理し、判断材料にまとめます。相手の本心・返信・復縁・未来・関係改善を断定・保証しません。
          </span>
          <div className="request-page__boundary" role="note">
            <strong>鑑定ノートは1相談・税込980円。都度払い・自動更新なし。</strong>
            <span>この画面では支払いは発生しません。</span>
          </div>
          <div className="request-page__boundary" role="note">
            {paymentEnabled ? (
              <>
                入力内容を確認し、必要な確認を経て、受け取り方法と税込980円の最終確認へ進みます。
              </>
            ) : (
              <>
                現在は公開前の審査モードで、有料販売は開始していません。決済、外部AIによる生成、
                入力内容の継続保存、メール送信は行われません。再読み込みすると入力は失われます。
              </>
            )}
          </div>
        </div>
      </section>
      <RequestForm
        paymentEnabled={paymentEnabled}
        customerAuthEnabled={
          paymentEnabled && isCustomerAuthCutoverSelected()
        }
        prepaymentComputeEnabled={isPrepaymentComputeBudgetEnabled()}
      />
    </main>
  );
}
