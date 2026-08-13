import Link from "next/link";
import type { ResolvedReviewPurchaseConfirmation } from "@/fixtures/review/purchase-confirmations";

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

export function ReviewPurchaseConfirmation({
  data,
}: {
  data: ResolvedReviewPurchaseConfirmation;
}) {
  const { purchase, request } = data;

  return (
    <main className="purchase-review-page">
      <aside className="request-review-boundary" role="note">
        <strong>購入前の最終確認プレビュー</strong>
        <span>
          架空の固定データによるレビュー表示です。決済、外部送信、保存、結果生成、メール送信は行いません。
        </span>
      </aside>

      <article className="purchase-sheet" aria-labelledby="purchase-review-title">
        <header className="purchase-sheet__header">
          <p>お申し込み前の最終確認</p>
          <h1 id="purchase-review-title">{purchase.product.userFacingLabel}</h1>
          <span>1相談につき一冊の鑑定ノートを受け取る、一度きりの購入です。自動更新はありません。</span>
        </header>

        <section className="purchase-sheet__offer" aria-labelledby="purchase-offer-title">
          <div>
            <p>商品と料金</p>
            <h2 id="purchase-offer-title">{purchase.product.name}</h2>
            <strong>{purchase.product.price}</strong>
          </div>
          <dl>
            <Row label="サービス" value={purchase.product.serviceName} />
            <Row label="商品" value={purchase.product.userFacingLabel} />
            <Row label="商品説明" value={purchase.product.officialClassification} />
            <Row label="数量" value={purchase.product.quantity} />
            <Row label="購入形態" value={purchase.product.purchaseType} />
            <Row label="自動更新" value={purchase.product.renewal} />
            <Row label="コイン等" value="なし" />
          </dl>
        </section>

        <section className="purchase-sheet__included" aria-labelledby="purchase-included-title">
          <p>含まれるもの</p>
          <h2 id="purchase-included-title">今夜の判断を、読む本編と見返すカードに。</h2>
          <ul>
            {purchase.product.included.map((item) => (
              <li key={item}>{item}</li>
            ))}
            <li>今夜の答え</li>
            <li>送る場合の文面案</li>
            <li>3日間の行動方針</li>
          </ul>
        </section>

        <section className="purchase-sheet__request" aria-labelledby="purchase-request-title">
          <div className="purchase-sheet__section-heading">
            <div>
              <p>依頼内容</p>
              <h2 id="purchase-request-title">この相談で申し込む予定です</h2>
            </div>
            <Link href="/request#sheet">
              成人確認・相談・メールを修正
            </Link>
          </div>
          <dl>
            <Row label="今の状況" value={request.currentSituation} />
            <Row label="今の関係" value={request.relationship} />
            <Row
              label="今夜知りたいこと"
              value={request.whatToKnow.join("、")}
            />
            <Row
              label="相手から届いた文面"
              value={excerpt(request.partnerMessage)}
            />
            <Row
              label="自分が送ろうとしている文面"
              value={excerpt(request.draftMessage)}
            />
            <Row
              label="成人確認「私は18歳以上です」"
              value={purchase.adultConfirmation.confirmed ? "確認済み" : "未確認"}
            />
            <Row label="配信・回復用メール" value={request.email} />
            <Row
              label="メール確認状態"
              value={purchase.deliveryRecoveryEmail.verificationStatus}
            />
            <Row label="安全上の利用資格" value={purchase.safetyEligibility} />
            <Row label="支払方法" value={purchase.paymentMethod} />
            <Row label="支払時期" value={purchase.paymentTiming} />
            <Row label="提供方法" value={purchase.deliveryMethod} />
            <Row label="提供時期" value={purchase.deliveryTiming} />
          </dl>
        </section>

        <section className="purchase-sheet__boundaries" aria-labelledby="purchase-boundaries-title">
          <p>AI利用と非保証</p>
          <h2 id="purchase-boundaries-title">できることと、保証しないこと</h2>
          <div>
            <section>
              <h3>利用するもの</h3>
              <p>
                入力された情報を整理・分析し、判断材料を鑑定ノートにまとめるため、AIを利用する予定です。
              </p>
            </section>
            <section>
              <h3>保証・代替しないもの</h3>
              <ul>
                <li>相手の本心、返信、復縁、交際、将来の断定・保証</li>
                <li>医療、診断、心理カウンセリング、法律相談の代替</li>
              </ul>
            </section>
          </div>
        </section>

        <section className="purchase-sheet__boundaries" aria-labelledby="purchase-refund-title">
          <p>取消・返金・意図しない請求</p>
          <h2 id="purchase-refund-title">通常返金とPayment Integrityを分けて確認</h2>
          <div>
            <section>
              <h3>通常の取消・返金</h3>
              <ul>
                <li>決済前は料金が発生せず、中止できます。</li>
                <li>決済成功後でも、生成開始前と客観的に確認できる取消は税込980円を全額返金する方向です。</li>
                <li>商品・技術上の障害は同じ購入の範囲で復旧し、再課金せず、安全な履行が不可能なら税込980円を全額返金する方向です。</li>
                <li>正常な提供後は不満だけでは原則対象外ですが、法令上の権利や重大な不具合への救済を排除しません。</li>
              </ul>
            </section>
            <section>
              <h3>意図しない請求の是正</h3>
              <p>
                重複、誤額、誤った利用者・相談、安全確認のすり抜けその他の意図しない請求は、Payment Integrityとして実際の経済的な誤りを是正します。税込980円を是正の上限にしません。実行機能は未実装です。
              </p>
            </section>
          </div>
        </section>

        <section className="purchase-sheet__legal" aria-labelledby="purchase-legal-title">
          <p>購入条件の確認</p>
          <h2 id="purchase-legal-title">返金・利用条件は正式公開前です</h2>
          <span>
            返金条件、決済方法、支払時期、提供時期には未確定事項があります。この画面では同意を取得しません。
          </span>
          <nav aria-label="購入条件の確認リンク">
            <Link href="/legal/terms">利用規約を確認する</Link>
            <Link href="/legal/privacy">プライバシー方針を確認する</Link>
            <Link href="/legal/tokushoho">特定商取引法に基づく表記を確認する</Link>
            <Link href="/legal/refund">返金方針を確認する</Link>
            <Link href="/contact">お問い合わせ準備を確認する</Link>
            <Link href="/legal/ai-disclosure">AI利用説明を確認する</Link>
            <Link href="/legal/unsupported-cases">通常鑑定として扱わない相談を確認する</Link>
          </nav>
        </section>

        <section className="purchase-sheet__control" aria-labelledby="purchase-control-title">
          <p>現在の操作状態</p>
          <h2 id="purchase-control-title">購入機能は現在準備中です</h2>
          <span id="purchase-control-description">
            支払いは発生しません。決済事業者と取引機能は接続されていません。
          </span>
          <button
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby="purchase-control-description"
          >
            購入機能は現在準備中です
          </button>
        </section>

        <details className="request-review-metadata">
          <summary>審査用fixture情報</summary>
          <dl>
            <Row label="fixture ID" value={purchase.id} />
            <Row label="request fixture" value={purchase.requestFixtureId} />
            <Row label="Safety state" value={purchase.safetyState} />
            <Row label="transaction" value={purchase.transactionState} />
            <Row label="provider" value={purchase.provider} />
            <Row label="delivery timing" value={purchase.deliveryTiming} />
            <Row
              label="service classification"
              value={purchase.product.officialClassification}
            />
          </dl>
        </details>

        <nav className="request-review-links" aria-label="審査用ナビゲーション">
          <Link href="/review/request/confirmation/normal-001">依頼メモへ戻る</Link>
          <Link href="/review">審査用一覧へ</Link>
        </nav>
      </article>
    </main>
  );
}

export function UnavailableReviewPurchaseConfirmation({
  requestedId,
}: {
  requestedId: string;
}) {
  return (
    <main className="request-state-page">
      <article className="request-state-note request-state-note--stop">
        <header>
          <p>購入前確認</p>
          <span className="status-label status-label--review">ここで停止</span>
          <h1>購入確認を表示できません</h1>
          <p>
            指定されたレビューIDは許可されていません。別の固定例へ置き換えず、購入確認・決済・通常レポートには進めません。
          </p>
        </header>
        <details className="request-review-metadata">
          <summary>審査用fixture情報</summary>
          <dl>
            <div><dt>指定されたID</dt><dd>{requestedId}</dd></div>
            <div><dt>allowlist</dt><dd>denied</dd></div>
          </dl>
        </details>
        <nav className="request-review-links" aria-label="戻り先">
          <Link href="/request">鑑定依頼シートへ</Link>
          <Link href="/review">審査用一覧へ</Link>
        </nav>
      </article>
    </main>
  );
}
