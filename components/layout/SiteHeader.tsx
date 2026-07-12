import Link from "next/link";

const inPageLinks = [
  { href: "/#service", label: "鑑定ノート" },
  { href: "/#flow", label: "利用の流れ" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="月の返事 トップへ">
          <span className="site-brand__moon" aria-hidden="true" />
          <span>
            <span className="site-brand__name">月の返事</span>
            <span className="site-brand__tagline">恋のメッセージ鑑定ノート</span>
          </span>
        </Link>

        <nav className="site-nav" aria-label="メインナビゲーション">
          <div className="site-nav__anchors">
            {inPageLinks.map((item) => (
              <Link key={item.href} href={item.href} className="site-nav__link">
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/review" className="site-nav__link site-nav__review">
            公開準備
          </Link>
          <Link href="/request" className="site-nav__cta">
            鑑定ノートを依頼する
          </Link>
        </nav>
      </div>
    </header>
  );
}
