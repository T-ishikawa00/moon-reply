import Link from "next/link";
import type { ReactNode } from "react";

export function PurchaseConfirmation({ children }: { children: ReactNode }) {
  return (
    <section className="page-shell request-local-complete">
      <p role="status">お申し込み前の最終確認</p>
      <h1>恋のメッセージ鑑定ノート</h1>
      <dl>
        <div><dt>サービス</dt><dd>月の返事</dd></div>
        <div><dt>内容</dt><dd>1相談 / 1鑑定ノート</dd></div>
        <div><dt>料金</dt><dd>税込980円</dd></div>
        <div><dt>購入形式</dt><dd>都度払い</dd></div>
        <div><dt>自動更新</dt><dd>なし</dd></div>
        <div><dt>受け取り</dt><dd>確認済みアカウント</dd></div>
      </dl>
      <p>
        入力内容をAIが整理・分析し、判断材料となる鑑定ノートを作成します。
        相手の本心、返信、復縁、未来、関係改善を断定・保証しません。
      </p>
      {children}
      <nav className="request-purchase-links" aria-label="購入前に確認できる情報">
        <Link href="/legal/terms">利用規約</Link>
        <Link href="/legal/privacy">プライバシー</Link>
        <Link href="/legal/refund">返金方針</Link>
        <Link href="/legal/tokushoho">特定商取引法に基づく表記</Link>
        <Link href="/legal/ai-disclosure">AI利用について</Link>
      </nav>
    </section>
  );
}
