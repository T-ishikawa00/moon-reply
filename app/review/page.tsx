import type { Metadata } from "next";
import Link from "next/link";
import { ReportComparisonNavigation } from "@/components/report/ReportComparisonNavigation";
import { ReviewLoadingPlaceholder } from "@/components/report/ReviewLoadingPlaceholder";

export const metadata: Metadata = {
  title: "審査用プレビュー一覧 | 月の返事",
  description: "月の返事 Milestone 1 の実装済み審査画面と後続予定を確認する静的な一覧です。",
};

const availableRoutes = [
  { route: "/", title: "ランディングページ", description: "商品、価格、出力、AI利用と安全範囲を確認できます。" },
  { route: "/request", title: "3ステップ鑑定依頼フォーム", description: "入力、ローカル安全確認、単一の必須同意、通常確認を確認できます。" },
  { route: "/sample-report", title: "架空サンプル鑑定書", description: "購入検討と期待形成のための、実在相談・購入・レビュー・AI生成実績ではない文章見本です。" },
  { route: "/review/result/result-normal-001", title: "Web鑑定ノート fixture", description: "固定された一つの判定を九つの章で深く読む、本番形状の長文審査用見本です。" },
  { route: "/review/save-report/result-normal-001", title: "保存用鑑定書 fixture", description: "Web版と同じ構造化結果を、後で短時間に見返す目的で再構成した見本です。" },
  { route: "/review/error/missing-fixture", title: "fixtureなし", description: "許可リスト外IDを通常結果へ置き換えず、安全に停止する固定状態です。" },
  { route: "/review/error/unavailable-report", title: "レポート表示不可", description: "外部処理や購入の失敗を装わない、固定された表示不可状態です。" },
  { route: "/review/request/normal-allowed", title: "通常確認可能", description: "normal_allowed だけが依頼内容確認へ進めます。" },
  { route: "/review/request/needs-review", title: "慎重な確認が必要", description: "通常確認・購入・通常レポートへ進まない停止状態です。" },
  { route: "/review/request/rejected", title: "通常鑑定対象外", description: "非難や未確認の緊急案内を行わない停止状態です。" },
  { route: "/review/request/contradictory-selection", title: "Safety選択の矛盾", description: "危険項目と非該当の同時選択を修正する状態です。" },
  { route: "/review/request/invalid-age", title: "対象年齢外", description: "18歳以上を確認できない場合に fail closed します。" },
  { route: "/review/request/missing-consent", title: "必須同意なし", description: "単一の必須チェックがない場合に Step 3へ戻します。" },
  { route: "/review/request/unknown-error", title: "不明・エラー", description: "不明状態を通常扱いせず、安全に停止します。" },
  { route: "/review/request/confirmation/normal-001", title: "依頼内容確認", description: "3ステップ別の本番相当ローカル確認です。購入前プレビューへ進めますが、取引は行いません。" },
  { route: "/review/purchase/confirmation/normal-001", title: "購入前の最終確認", description: "税込980円の商品・相談・受け取り条件を、取引なしで最終確認します。" },
  { route: "/legal", title: "法務・開示 審査ハブ", description: "固定事実、全ページ一覧、公開準備の未完了カテゴリを確認します。" },
  { route: "/legal/terms", title: "利用規約 審査表示", description: "規約ドラフトの条項順序とDecision状態を、拘束力のある条件に見せず確認します。" },
  { route: "/legal/privacy", title: "プライバシー 審査表示", description: "将来のdata planと現在の非送信挙動を区別して確認します。" },
  { route: "/legal/tokushoho", title: "特商法表記 審査表示", description: "固定値と未確定開示項目を、完成表示に見せず確認します。" },
  { route: "/legal/refund", title: "返金方針 審査表示", description: "ケース別の現時点の方針案と未確定条件を確認します。" },
  { route: "/legal/ai-disclosure", title: "AI利用説明 審査表示", description: "AIの予定役割、限界、payload最小化、現在の非稼働を確認します。" },
  { route: "/legal/unsupported-cases", title: "通常鑑定対象外 審査表示", description: "Safety-firstの停止境界とM1のblocked状態を確認します。" },
  { route: "/contact", title: "お問い合わせ 準備表示", description: "受付機能なしで、予定カテゴリと未決定の運用項目を確認します。" },
];

const plannedRoutes = [
  { title: "レスポンシブ・アクセシビリティ・Visual QA", route: "Milestone 1 全画面", slice: "M1-I6" },
];

export default function ReviewIndexPage() {
  return (
    <main className="review-hub">
      <section className="review-hub__hero">
        <div className="page-shell">
          <p className="eyebrow">Milestone 1 review</p>
          <h1>審査用プレビュー一覧</h1>
          <p className="review-hub__intro">
            月の返事の画面と導線を、実装状況ごとに確認するための静的な案内です。依頼・Safety、購入前確認、架空サンプル、Web鑑定ノート、保存用鑑定書、エラー状態、法務・開示・お問い合わせ構成を確認できます。
          </p>
          <div className="review-hub__boundary" role="note">
            <strong>ここで確認できるのは表示とローカル UI です。</strong>
            <span>決済、外部送信、AI生成、メール配信、データ保存、ファイル生成は動作しません。</span>
          </div>
        </div>
      </section>

      <section className="review-hub__section" aria-labelledby="available-heading">
        <div className="page-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Available now</p><h2 id="available-heading">現在確認できる画面</h2></div>
            <span className="status-chip status-chip--available">実装済み</span>
          </div>
          <div className="review-route-grid">
            {availableRoutes.map((item) => (
              <Link key={item.route} href={item.route} className="review-route-card review-route-card--available">
                <span className="review-route-card__status">利用可能</span>
                <code>{item.route}</code>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="review-route-card__action">画面を開く <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="review-hub__section review-hub__section--paper" aria-labelledby="comparison-heading">
        <div className="page-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Sample / Web / Save</p><h2 id="comparison-heading">三つの結果体験を比較する</h2></div>
            <span className="status-chip status-chip--available">固定表示</span>
          </div>
          <div className="mt-10"><ReportComparisonNavigation /></div>
        </div>
      </section>

      <section className="review-hub__section" aria-labelledby="loading-heading">
        <div className="page-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Static state</p><h2 id="loading-heading">ローディング状態の固定見本</h2></div>
            <span className="status-chip status-chip--available">静的</span>
          </div>
          <p className="review-hub__section-copy">本番の通信契約を定義せず、待機中の表示だけを審査するコンポーネントです。</p>
          <div className="mt-8"><ReviewLoadingPlaceholder /></div>
        </div>
      </section>

      <section className="review-hub__section review-hub__section--paper" aria-labelledby="planned-heading">
        <div className="page-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Planned later in Milestone 1</p><h2 id="planned-heading">後続 slice の審査項目</h2></div>
            <span className="status-chip">未実装</span>
          </div>
          <p className="review-hub__section-copy">以下は後続のQA inventoryです。M1-I6は計画のみで、実装・開始していません。</p>
          <ul className="planned-route-list">
            {plannedRoutes.map((item) => (
              <li key={item.slice + "-" + item.route} className="planned-route-card">
                <div>
                  <span className="planned-route-card__status">未実装 · 後続 slice</span>
                  <h3>{item.title}</h3>
                  <code>{item.route}</code>
                </div>
                <span className="planned-route-card__slice">{item.slice}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="review-hub__next">
        <div className="page-shell review-hub__next-inner">
          <div>
            <p className="eyebrow">Current gate</p>
            <h2>M1-I5 の Human review 待ち</h2>
            <p>M1-I5は表示と導線の自動検証段階です。法務ページは公開未承認で、お問い合わせ受付も稼働していません。M1-I6は未認可です。</p>
          </div>
          <Link href="/review/result/result-normal-001" className="button button--secondary">Web鑑定ノートを開く</Link>
        </div>
      </section>
    </main>
  );
}
