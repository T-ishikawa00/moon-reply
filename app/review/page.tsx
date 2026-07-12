import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "審査用プレビュー一覧 | 月の返事",
  description: "月の返事 Milestone 1 の実装済み審査画面と後続予定を確認する静的な一覧です。",
};

const availableRoutes = [
  { route: "/", title: "ランディングページ", description: "商品、価格、出力、AI利用と安全範囲を確認できます。" },
  { route: "/request", title: "3ステップ鑑定依頼フォーム", description: "入力、ローカル安全確認、単一の必須同意、通常確認を確認できます。" },
  { route: "/review/request/normal-allowed", title: "通常確認可能", description: "normal_allowed だけが依頼内容確認へ進めます。" },
  { route: "/review/request/needs-review", title: "慎重な確認が必要", description: "通常確認・購入・通常レポートへ進まない停止状態です。" },
  { route: "/review/request/rejected", title: "通常鑑定対象外", description: "非難や未確認の緊急案内を行わない停止状態です。" },
  { route: "/review/request/contradictory-selection", title: "Safety選択の矛盾", description: "危険項目と非該当の同時選択を修正する状態です。" },
  { route: "/review/request/invalid-age", title: "対象年齢外", description: "18歳以上を確認できない場合に fail closed します。" },
  { route: "/review/request/missing-consent", title: "必須同意なし", description: "単一の必須チェックがない場合に Step 3へ戻します。" },
  { route: "/review/request/unknown-error", title: "不明・エラー", description: "不明状態を通常扱いせず、安全に停止します。" },
  { route: "/review/request/confirmation/normal-001", title: "依頼内容確認", description: "3ステップ別の本番相当ローカル確認です。購入には進みません。" },
];

const plannedRoutes = [
  { title: "購入前の最終確認", route: "/review/purchase/**", slice: "M1-I3" },
  { title: "架空サンプル鑑定書", route: "/sample-report", slice: "M1-I4" },
  { title: "Web鑑定ノート fixture", route: "/review/result/result-normal-001", slice: "M1-I4" },
  { title: "保存用鑑定書 fixture", route: "/review/save-report/result-normal-001", slice: "M1-I4" },
  { title: "法務・お問い合わせ審査ページ", route: "/legal/** ・ /contact", slice: "M1-I5" },
  { title: "レスポンシブ・アクセシビリティ・Visual QA", route: "Milestone 1 全画面", slice: "M1-I6" },
];

export default function ReviewIndexPage() {
  return (
    <main className="review-hub">
      <section className="review-hub__hero"><div className="page-shell"><p className="eyebrow">Milestone 1 review</p><h1>審査用プレビュー一覧</h1><p className="review-hub__intro">月の返事の画面と導線を、実装状況ごとに確認するための静的な案内です。M1-I2 の依頼・Safety 状態はすべて固定fixtureで確認できます。</p><div className="review-hub__boundary" role="note"><strong>ここで確認できるのは表示とローカル UI です。</strong><span>決済、外部送信、AI生成、メール配信、データ保存は動作しません。</span></div></div></section>

      <section className="review-hub__section" aria-labelledby="available-heading"><div className="page-shell"><div className="section-heading-row"><div><p className="eyebrow">Available now</p><h2 id="available-heading">現在確認できる画面</h2></div><span className="status-chip status-chip--available">実装済み</span></div><div className="review-route-grid">{availableRoutes.map((item) => <Link key={item.route} href={item.route} className="review-route-card review-route-card--available"><span className="review-route-card__status">利用可能</span><code>{item.route}</code><h3>{item.title}</h3><p>{item.description}</p><span className="review-route-card__action">画面を開く <span aria-hidden="true">→</span></span></Link>)}</div></div></section>

      <section className="review-hub__section review-hub__section--paper" aria-labelledby="planned-heading"><div className="page-shell"><div className="section-heading-row"><div><p className="eyebrow">Planned later in Milestone 1</p><h2 id="planned-heading">後続 slice の審査項目</h2></div><span className="status-chip">未実装</span></div><p className="review-hub__section-copy">以下は route inventory です。リンク、route body、fixture はまだ存在しません。</p><ul className="planned-route-list">{plannedRoutes.map((item) => <li key={`${item.slice}-${item.route}`} className="planned-route-card"><div><span className="planned-route-card__status">未実装 · 後続 slice</span><h3>{item.title}</h3><code>{item.route}</code></div><span className="planned-route-card__slice">{item.slice}</span></li>)}</ul></div></section>

      <section className="review-hub__next"><div className="page-shell review-hub__next-inner"><div><p className="eyebrow">Current gate</p><h2>M1-I2 の Human review 待ち</h2><p>M1-I3 の購入確認は未認可です。M1-I2 の受入れ前には開始できません。</p></div><Link href="/request" className="button button--secondary">依頼フォームを確認する</Link></div></section>
    </main>
  );
}
