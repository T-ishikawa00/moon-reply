import Link from "next/link";

const availableLinks = [
  { href: "/request", label: "鑑定ノートを依頼する" },
  { href: "/sample-report", label: "架空の鑑定ノート見本" },
  { href: "/#note", label: "鑑定ノートについて" },
  { href: "/#flow", label: "利用の流れ" },
  { href: "/#price", label: "料金" },
  { href: "/#boundaries", label: "できること・できないこと" },
  { href: "/#faq", label: "FAQ" },
];

const legalLinks = [
  { href: "/legal", label: "ご利用にあたって" },
  { href: "/legal/terms", label: "利用規約" },
  { href: "/legal/privacy", label: "プライバシーポリシー" },
  { href: "/legal/refund", label: "返金方針" },
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
  { href: "/legal/ai-disclosure", label: "AI利用について" },
  { href: "/legal/unsupported-cases", label: "対応できない相談" },
  { href: "/contact", label: "お問い合わせ" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <p className="site-footer__brand">月の返事</p>
          <p className="site-footer__definition">
            恋愛メッセージの状況と言葉を整理し、今夜の答え、文面案、
            3日間の行動方針をまとめる「恋のメッセージ鑑定ノート」です。
          </p>
          <p className="site-footer__note">
            AIを利用します。相手の本心、返信、復縁、未来、関係改善を断定・保証するものではありません。
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

        <nav aria-label="ご利用に関するページ">
          <p className="site-footer__heading">ご利用に関する情報</p>
          <ul className="site-footer__links">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
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
