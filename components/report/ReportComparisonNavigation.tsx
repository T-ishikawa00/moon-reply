import Link from "next/link";
import { ArtifactSectionLabel } from "@/components/artifact";

const comparisonItems = [
  {
    href: "/#note",
    label: "架空の短い見本",
    publicPurpose: "固定の「今日は送らない方がいい」ケースを、LP上で結論と要点だけ短く見る表示です。",
    reviewPurpose: "result-normal-001と同じ判断を、LP上で短く確認する表示です。",
  },
  {
    href: "/review/result/result-normal-001",
    label: "Web鑑定ノート",
    publicPurpose: "今夜の答えから理由、文面、3日間の方針までを一冊として深く読む本編の見本です。",
    reviewPurpose: "固定の架空ケースを14部構成で読む、長文の商品体験です。",
  },
  {
    href: "/review/save-report/result-normal-001",
    label: "保存用判断カード",
    publicPurpose: "迷った時に、今夜の答えと次の行動を30秒で見返す保存向け表示の見本です。",
    reviewPurpose: "同じ固定判断を、短時間の再確認だけに再構成した保存向け表示です。",
  },
] as const;

export function ReportComparisonNavigation({ audience = "review" }: { audience?: "public" | "review" }) {
  const isPublic = audience === "public";

  return (
    <nav aria-labelledby="report-comparison-heading" className="report-comparison">
      <ArtifactSectionLabel className="report-comparison__label">
        {isPublic ? "別ケースによる表示形式の比較" : "表示形式の比較"}
      </ArtifactSectionLabel>
      <h2 id="report-comparison-heading">
        {isPublic ? (
          <>別の固定ケースで、三つの表示形式を比べる</>
        ) : (
          <><span className="phrase-keep">同じ鑑定を、</span><span className="phrase-keep">三つの表示で比べる</span></>
        )}
      </h2>
      <p className="report-comparison__intro">
        {isPublic ? (
          <>
            ここからは、上の「送る」全文見本とは別の「今日は送らない方がいい」という固定架空ケースを使い、
            短い見本・Web鑑定ノート・保存用判断カードの表示目的と情報量を比べます。
            比較対象は判断の違いではなく表示形式の違いであり、三つの異なる鑑定結果ではありません。
            どの画面を開いても購入・AI生成・メール送信・保存は発生しません。
          </>
        ) : (
          <>
            ここで比べる三つは、同じ「今日は送らない方がいい」という固定架空ケースです。
            架空の短い見本、長く読むWeb鑑定ノート、後から短時間で見返す保存用判断カードで、読む目的と情報量だけを変えています。
            三つの異なる判断例ではありません。どの画面を開いても購入・AI生成・メール送信・保存は発生しません。
          </>
        )}
      </p>
      <ol className="report-comparison__list">
        {comparisonItems.map((item, index) => (
          <li key={item.href}>
            <Link href={item.href}>
              <span className="report-comparison__number">0{index + 1}</span>
              <span className="report-comparison__copy">
                <strong>{item.label}</strong>
                <small>{isPublic ? item.publicPurpose : item.reviewPurpose}</small>
              </span>
              <span className="report-comparison__action">
                {isPublic ? "見本を読む" : "固定表示を開く"} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {!isPublic ? (
        <Link href="/review" className="text-link">審査用プレビュー一覧へ戻る</Link>
      ) : null}
    </nav>
  );
}
