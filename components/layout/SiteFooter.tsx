import Link from "next/link";

const availableLinks = [
  { href: "/request", label: "鑑定ノートを依頼する" },
  { href: "/sample-report", label: "架空サンプル鑑定書" },
  { href: "/review", label: "公開準備プレビュー" },
  { href: "/#service", label: "鑑定ノートについて" },
  { href: "/#safety", label: "AI利用・安全範囲" },
  { href: "/#faq", label: "FAQ" },
];

const legalReviewLinks = [
  { href: "/legal", label: "法務情報", status: "審査用" },
  { href: "/legal/ai-disclosure", label: "AI利用説明", status: "審査用" },
  { href: "/legal/unsupported-cases", label: "通常鑑定対象外", status: "審査用" },
  { href: "/contact", label: "お問い合わせ", status: "受付準備中" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <p className="site-footer__brand">月の返事</p>
          <p className="site-footer__definition">
            AIを活用した恋愛メッセージ分析・判断支援デジタルレポート。
            ユーザー向けには「恋のメッセージ鑑定ノート」として提供予定です。
          </p>
          <p className="site-footer__note">
            AIを利用します。相手の本心、返信、復縁、将来の結果を断定・保証するものではありません。
          </p>
        </div>

        <nav aria-label="フッターナビゲーション">
          <p className="site-footer__heading">現在利用できるページ</p>
          <ul className="site-footer__links">
            {availableLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="法務・お問い合わせ審査ページ">
          <p className="site-footer__heading">法務・お問い合わせ</p>
          <ul className="site-footer__future">
            {legalReviewLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
                <span className="status-chip">{item.status}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <span>月の返事</span>
        <span>2026 · サービス準備中</span>
      </div>
    </footer>
  );
}
