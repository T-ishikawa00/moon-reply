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
          架空の固定データによるレビュー表示です。実際の購入、外部送信、保存、AI生成、メール送信は行いません。
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

        <section aria-labelledby="review-eligibility-title">
          <div className="request-memo__heading">
            <h2 id="review-eligibility-title">申込み前の確認</h2>
            <Link href="/request#adultConfirmed">成人確認を修正</Link>
          </div>
          <dl>
            <Row
              label="成人確認"
              value={fixture.adultConfirmed ? "「私は18歳以上です」確認済み" : "未確認"}
            />
            <Row
              label="通常の有料鑑定へ進む条件"
              value="安全確認済みの固定レビュー例です。実際の有料フローに進めるサーバー側確認は未実装です。"
            />
          </dl>
        </section>

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
            <h2 id="review-safety-title">安全確認</h2>
            <Link href="/request#safety">安全確認を修正</Link>
          </div>
          <p className="request-memo__safety">
            この固定レビュー例では、通常の有料鑑定の最終確認へ進める内容として確認済みです。
          </p>
        </section>

        <section aria-labelledby="review-delivery-title">
          <div className="request-memo__heading">
            <h2 id="review-delivery-title">受け取り予定</h2>
            <Link href="/request#email">メールを修正</Link>
          </div>
          <dl>
            <Row label="配信・回復用メール" value={fixture.email} />
            <Row
              label="利用目的"
              value="鑑定結果の配信と、同じ購入の安全な回復に使用する予定"
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
