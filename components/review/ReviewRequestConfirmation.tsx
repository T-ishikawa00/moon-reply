import Link from "next/link";
import type { ReviewRequestFixture } from "@/fixtures/review/requests";

function excerpt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "未入力（任意）";
  return trimmed.length > 180 ? `${trimmed.slice(0, 180)}…` : trimmed;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function ReviewRequestConfirmation({
  fixture,
}: {
  fixture: ReviewRequestFixture;
}) {
  return (
    <main className="request-review-page">
      <aside className="request-review-boundary" role="note">
        <strong>審査用の固定依頼メモ</strong>
        <span>
          外部送信、保存、決済、AI処理は行われていません。normal_allowed fixture
          の表示だけを確認します。
        </span>
      </aside>

      <article className="request-memo request-memo--review" aria-labelledby="review-request-title">
        <header>
          <p>このように受け取りました</p>
          <h1 id="review-request-title">あなたの鑑定依頼メモ</h1>
          <span>
            機械的な項目表ではなく、依頼者が相談内容を落ち着いて読み直せる一枚として構成しています。
          </span>
        </header>

        <section aria-labelledby="review-consultation-title">
          <div className="request-memo__heading">
            <h2 id="review-consultation-title">あなたの相談</h2>
            <Link href="/request#sheet">相談を修正</Link>
          </div>
          <dl>
            <Row label="今の状況" value={fixture.currentSituation} />
            <Row label="今の関係" value={fixture.relationship} />
            <Row
              label="今夜知りたいこと"
              value={fixture.whatToKnow.join("、")}
            />
            <Row label="ニックネーム" value={excerpt(fixture.nickname)} />
          </dl>
        </section>

        <section aria-labelledby="review-messages-title">
          <div className="request-memo__heading">
            <h2 id="review-messages-title">実際の文面</h2>
            <Link href="/request#sheet">文面を修正</Link>
          </div>
          <dl>
            <Row
              label="相手から届いた文面"
              value={excerpt(fixture.partnerMessage)}
            />
            <Row
              label="自分が送ろうとしている文面"
              value={excerpt(fixture.draftMessage)}
            />
          </dl>
        </section>

        <section aria-labelledby="review-safety-title">
          <div className="request-memo__heading">
            <h2 id="review-safety-title">Safety確認</h2>
            <Link href="/request#safety">Safetyを修正</Link>
          </div>
          <p className="request-memo__safety">
            normal_allowed / 通常鑑定の確認に進める内容 / 必須確認済み
          </p>
        </section>

        <section aria-labelledby="review-delivery-title">
          <div className="request-memo__heading">
            <h2 id="review-delivery-title">受け取り予定</h2>
            <Link href="/request#email">メールを修正</Link>
          </div>
          <dl>
            <Row label="受け取りメール" value={fixture.email} />
            <Row
              label="利用目的"
              value="鑑定結果の送付と、ご購入に関する重要な連絡に使用する予定"
            />
          </dl>
        </section>

        <div className="request-memo__next">
          <strong>次は、購入前の最終確認です。</strong>
          <span>
            表示確認だけが可能です。実際の購入、外部送信、保存、レポート生成は行われません。
          </span>
          <Link
            href="/review/purchase/confirmation/normal-001"
            className="button button--primary"
          >
            購入前の最終確認を見る
          </Link>
        </div>

        <details className="request-review-metadata">
          <summary>審査用fixture情報</summary>
          <dl>
            <Row label="fixture ID" value={fixture.id} />
            <Row label="Safety state" value="normal_allowed" />
          </dl>
        </details>

        <nav className="request-review-links" aria-label="審査用ナビゲーション">
          <Link href="/review/request/normal-allowed">通常状態へ戻る</Link>
          <Link href="/review">審査用一覧へ</Link>
        </nav>
      </article>
    </main>
  );
}
