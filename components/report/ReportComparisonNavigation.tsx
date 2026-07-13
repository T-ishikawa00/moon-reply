import Link from "next/link";

const reviewComparisonItems = [
  {
    href: "/sample-report",
    label: "架空サンプル",
    purpose: "購入検討と期待形成のために、文章の温度とサービス方針を確かめる無料見本です。",
  },
  {
    href: "/review/result/result-normal-001",
    label: "Web鑑定ノート・審査用見本",
    purpose: "有料成果物を深く読む形を、長文と九つの章で確認する固定fixtureです。",
  },
  {
    href: "/review/save-report/result-normal-001",
    label: "保存用鑑定書・審査用見本",
    purpose: "結論、再判断、文面、短期方針を後で短時間に見返す表示形です。",
  },
] as const;

const publicComparisonItems = [
  {
    href: "/sample-report",
    label: "架空サンプル",
    purpose: "購入前に、文章の温度とサービス方針を確かめるための無料見本です。",
  },
  {
    href: "/review/result/result-normal-001",
    label: "Web鑑定ノートの見本",
    purpose: "理由と九つの章を通して、判断材料を深く読む長文の見本です。",
  },
  {
    href: "/review/save-report/result-normal-001",
    label: "保存用鑑定書の見本",
    purpose: "結論、再判断、文面、短期方針を後で短時間に見返す表示の見本です。",
  },
] as const;

export function ReportComparisonNavigation({ audience = "review" }: { audience?: "public" | "review" }) {
  const comparisonItems = audience === "public" ? publicComparisonItems : reviewComparisonItems;

  return (
    <nav aria-labelledby="report-comparison-heading" className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 text-[#2b2335] sm:p-8">
      <p className="m-0 text-sm font-bold tracking-[0.14em] text-[#80652d]">COMPARE THE EXPERIENCES</p>
      <h2 id="report-comparison-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-3xl">
        目的の違う三つの表示を比べる
      </h2>
      <p className="mt-4 max-w-3xl leading-8 text-[#67596b]">
        {audience === "public"
          ? "サンプルは購入検討用、Web版は深く読む形、保存版は短時間で見返す形です。見本を開いても購入、AI生成、メール送信、保存は発生しません。"
          : "サンプルは購入検討用、Web版は深く読む成果物の形、保存版は短時間で見返す形です。審査用routeを開いても購入や生成は発生しません。"}
      </p>
      <ul className="mt-6 grid gap-3 p-0 lg:grid-cols-2">
        {comparisonItems.map((item) => (
          <li key={item.href} className="list-none">
            <Link
              href={item.href}
              className="flex min-h-32 flex-col rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 transition hover:border-[#8a6d2e] hover:bg-[#f8f0e2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none"
            >
              <strong className="break-words text-[#4a3820]">{item.label}</strong>
              <span className="mt-2 leading-7 text-[#67596b]">{item.purpose}</span>
              <span className="mt-auto pt-3 font-semibold text-[#6b511e]">
                表示を開く <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {audience === "review" ? (
        <Link href="/review" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-[#8a6d2e] px-4 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">
          審査用プレビュー一覧へ戻る
        </Link>
      ) : null}
    </nav>
  );
}
