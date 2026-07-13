import Link from "next/link";
import type { ResolvedReviewPurchaseConfirmation } from "@/fixtures/review/purchase-confirmations";

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 gap-1 border-t border-[#d9caa8] py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-semibold text-[#765e2d]">{label}</dt>
      <dd className="m-0 min-w-0 whitespace-pre-wrap break-words leading-7">{value}</dd>
    </div>
  );
}

function excerpt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "未入力（任意）";
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

function localizeCustomerAbsence(value: string) {
  return value === "none" ? "なし" : value;
}

const legalReviewItems = [
  { label: "利用規約", href: "/legal/terms" },
  { label: "プライバシーポリシー", href: "/legal/privacy" },
  { label: "特定商取引法に基づく表記", href: "/legal/tokushoho" },
  { label: "返金方針", href: "/legal/refund" },
  { label: "AI利用説明", href: "/legal/ai-disclosure" },
  { label: "対応できない相談", href: "/legal/unsupported-cases" },
  { label: "お問い合わせ", href: "/contact" },
] as const;

const futureConfirmationItems = [
  "AIが入力情報を整理・分析する鑑定ノートであること",
  "医療、診断、カウンセリングではないこと",
  "相手の本心、返信、復縁、将来、その他の結果を保証しないこと",
  "返金条件は正式表示後に確認すること",
  "利用規約は正式公開後に確認すること",
  "プライバシーポリシーは正式公開後に確認すること",
] as const;

export function ReviewPurchaseConfirmation({ data }: { data: ResolvedReviewPurchaseConfirmation }) {
  const { purchase, request } = data;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4ead7] text-[#2b2335]">
      <section className="border-b border-[#d8c596]/30 bg-[radial-gradient(circle_at_82%_12%,rgba(229,196,109,0.18),transparent_21rem),linear-gradient(145deg,#0d1127,#29203e)] text-[#fff8e8]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-20">
          <p className="text-sm font-bold tracking-[0.18em] text-[#d9bb75]">FINAL NOTE ORDER REVIEW</p>
          <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold leading-[1.45] sm:text-5xl">お申し込み前の内容を、最後にご確認ください</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#e6dccb] sm:text-lg sm:leading-9">
            恋のメッセージ鑑定ノートの内容、受け取り予定、注意事項を一冊の注文票のように整理しています。
          </p>
          <div className="mt-7 max-w-3xl border-l-4 border-[#e5c46d] bg-white/5 px-5 py-4 leading-8" role="note">
            これは審査用プレビューです。結果生成、決済、メール送信、データ保存は行われません。
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <article aria-labelledby="product-heading" className="overflow-hidden rounded-xl border border-[#cdbb91] bg-[#fff8e9] shadow-[0_1.5rem_4rem_rgba(39,31,52,.12)]">
          <div className="border-b border-[#d9caa8] bg-[#fbf2df] p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">PRODUCT &amp; PRICE</p>
                <h2 id="product-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-4xl">{purchase.product.name}</h2>
                <p className="mt-2 leading-7 text-[#67596b]">{purchase.product.userFacingLabel}</p>
              </div>
              <div className="shrink-0 rounded-lg border border-[#9f7c31] bg-[#18152e] px-5 py-4 text-right text-[#fff8e8]">
                <span className="block text-xs font-bold tracking-[0.12em] text-[#d9bb75]">お支払い予定額</span>
                <strong className="mt-1 block font-serif text-3xl">{purchase.product.price}</strong>
              </div>
            </div>
          </div>
          <dl className="p-5 sm:p-8">
            <SummaryRow label="正式なサービス分類" value={purchase.product.officialClassification} />
            <SummaryRow label="表示名" value={purchase.product.userFacingLabel} />
            <SummaryRow label="数量" value={purchase.product.quantity} />
            <SummaryRow label="購入形態" value={purchase.product.purchaseType} />
            <SummaryRow label="更新" value={purchase.product.renewal} />
            <SummaryRow label="サブスクリプション：" value={localizeCustomerAbsence(purchase.product.subscription)} />
            <SummaryRow label="コイン・ポイント・チケット：" value={localizeCustomerAbsence(purchase.product.coinsPointsTickets)} />
          </dl>
        </article>

        <section aria-labelledby="request-summary-heading" className="rounded-xl border border-[#cdbb91] bg-[#fffdf5] p-5 sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">YOUR REQUEST</p>
          <h2 id="request-summary-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-3xl">ご相談内容の要約</h2>
          <p className="mt-3 leading-7 text-[#67596b]">入力された内容のうち、鑑定ノートの整理に使う要点を確認します。</p>

          <div className="mt-7 grid gap-7 lg:grid-cols-2">
            <section aria-labelledby="request-situation-heading" className="min-w-0">
              <h3 id="request-situation-heading" className="text-lg font-semibold">あなたと相手の状況</h3>
              <dl className="mt-3">
                <SummaryRow label="年齢層" value={request.ageGroup} />
                <SummaryRow label="ニックネーム" value={request.nickname} />
                <SummaryRow label="メールアドレス" value={request.email} />
                <SummaryRow label="相手との関係" value={request.relationship} />
                <SummaryRow label="相手との状況" value={request.relationshipStatus.join("、")} />
                <SummaryRow label="返信待ち期間" value={request.replyWait} />
                <SummaryRow label="今夜送る意向" value={request.sendTonight} />
              </dl>
            </section>

            <section aria-labelledby="request-message-heading" className="min-w-0">
              <h3 id="request-message-heading" className="text-lg font-semibold">やり取りと相談の要点</h3>
              <dl className="mt-3">
                <SummaryRow label="実際の会話" value={`${excerpt(request.lastPartnerMessage)}\n${excerpt(request.lastOwnMessage)}`} />
                <SummaryRow label="送信予定文面" value={excerpt(request.draftMessage)} />
                <SummaryRow label="直近の流れ" value={excerpt(request.recentFlow)} />
                <SummaryRow label="主な不安" value={excerpt(request.mainConcern)} />
                <SummaryRow label="希望する行動" value={excerpt(request.desiredAction)} />
                <SummaryRow label="一番の質問" value={excerpt(request.mainQuestion)} />
              </dl>
            </section>
          </div>

          <div className="mt-7 grid gap-3 rounded-lg border border-[#b49242] bg-[#f5ead2] p-4 sm:grid-cols-2">
            <p className="m-0 leading-7"><strong>Safety state：</strong> {purchase.safetyState}</p>
            <p className="m-0 leading-7"><strong>同意事項：</strong>確認済み</p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="delivery-heading" className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:p-8">
            <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">PLANNED DELIVERY</p>
            <h2 id="delivery-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">受け取り予定</h2>
            <ul className="mt-5 space-y-3 leading-8">
              <li>鑑定ノートは、Webの結果ページで読む形を予定しています。</li>
              <li>結果URLは、入力されたメールアドレスへ送る予定です。</li>
              <li>AIが入力情報を整理・分析する予定です。</li>
            </ul>
            <div className="mt-6 rounded-lg border border-[#a89350] bg-[#f5ead2] p-4 leading-8">
              <p className="m-0 font-semibold">この審査環境では未実行です。</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>結果は生成されていません。</li>
                <li>メールは送信されていません。</li>
                <li>データは保存されていません。</li>
                <li>正確な提供時期は未確定です。</li>
                <li>決済事業者は未選定です。</li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="ai-heading" className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:p-8">
            <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">AI &amp; LIMITATIONS</p>
            <h2 id="ai-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">AI利用と、保証しないこと</h2>
            <p className="mt-5 leading-8">AIは、送信された情報を整理・分析し、判断材料を組み立てるために利用する予定です。</p>
            <ul className="mt-5 space-y-3 border-l-4 border-[#8a6d2e] bg-[#f8f0e2] p-5 leading-8">
              <li>相手の本心を断定しません。</li>
              <li>返信を保証しません。</li>
              <li>復縁を保証しません。</li>
              <li>将来を予測・保証しません。</li>
              <li>医療、診断、カウンセリングではありません。</li>
            </ul>
          </section>
        </div>

        <section aria-labelledby="safety-boundary-heading" className="rounded-xl border border-[#d6b86d]/45 bg-[#18152e] p-5 text-[#efe5d0] sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-[#d9bb75]">SAFETY ACCESS BOUNDARY</p>
          <h2 id="safety-boundary-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45] text-[#fff8e8]">通常確認できる相談だけの画面です</h2>
          <p className="mt-4 max-w-4xl leading-8">この購入確認プレビューは、許可リストにある <strong>normal_allowed</strong> fixture だけを表示します。needs_review、rejected、対象年齢外、同意不足、矛盾した選択、不明・エラー状態からは購入確認、決済、通常レポートへ進めません。</p>
          <p className="mt-3 leading-8 text-[#cfc4b4]">この画面から取引、結果生成、決済記録の作成はできません。</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section aria-labelledby="conditions-heading" className="rounded-xl border border-[#cdbb91] bg-[#fffdf5] p-5 sm:p-8">
            <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">TRANSACTION CONDITIONS</p>
            <h2 id="conditions-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">取引条件は準備中です</h2>
            <p className="mt-5 rounded-lg border border-[#b49242] bg-[#f5ead2] p-4 leading-8">返金・提供不能時の取り扱いは、決済事業者と提供条件の確定後に正式表示します。</p>
            <p className="mt-4 leading-8 text-[#67596b]">この画面では返金条件への同意を取得しません。取引固有の条件、決済方法、支払時期、提供時期はいずれも未確定です。</p>
          </section>

          <section aria-labelledby="correction-heading" className="rounded-xl border border-[#cdbb91] bg-[#fffdf5] p-5 sm:p-8">
            <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">CORRECTIONS</p>
            <h2 id="correction-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">入力内容を見直す</h2>
            <p className="mt-4 leading-7 text-[#67596b]">公開フォームの該当ステップを開きます。審査用fixtureの内容はフォームへ自動入力されません。</p>
            <nav aria-label="入力内容の修正" className="mt-5 grid gap-3">
              <Link href="/request#step-1" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-[#8a6d2e] px-4 py-3 font-semibold transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none"><span>Step 1を見直す</span><span aria-hidden="true">→</span></Link>
              <Link href="/request#step-2" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-[#8a6d2e] px-4 py-3 font-semibold transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none"><span>Step 2を見直す</span><span aria-hidden="true">→</span></Link>
              <Link href="/request#step-3" className="inline-flex min-h-12 items-center justify-between rounded-lg border border-[#8a6d2e] px-4 py-3 font-semibold transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none"><span>Step 3を見直す</span><span aria-hidden="true">→</span></Link>
            </nav>
          </section>
        </div>

        <section aria-labelledby="future-confirmations-heading" className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">FUTURE CONFIRMATIONS</p>
          <h2 id="future-confirmations-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">将来の購入前確認事項</h2>
          <p className="mt-4 leading-8 text-[#67596b]">審査のための非取引リストです。チェック操作はなく、この画面では確認・同意を記録しません。最終条件の確定後に正式表示します。</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {futureConfirmationItems.map((item) => (
              <li key={item} className="flex min-w-0 items-start gap-3 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 leading-7">
                <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#8a6d2e] text-xs font-bold" aria-hidden="true">—</span>
                <span className="min-w-0"><strong className="block break-words">{item}</strong><small className="mt-1 block text-[#67596b]">確認・同意は未記録</small></span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="legal-heading" className="rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">LEGAL &amp; CONTACT</p>
              <h2 id="legal-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45]">公開情報の準備状況</h2>
            </div>
            <span className="rounded-full border border-[#9b7b3a] bg-[#f5ead2] px-3 py-2 text-sm font-bold">審査用ドラフト・公開未承認</span>
          </div>
          <p className="mt-4 leading-8 text-[#67596b]">以下は公開前の構成確認リンクです。開いても同意は記録されず、最終本文・運営者情報・問い合わせ先を公開済みとは扱いません。</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {legalReviewItems.map((item) => (
              <li key={item.href} className="min-w-0">
                <Link href={item.href} className="flex min-h-20 min-w-0 flex-col justify-center rounded-lg border border-[#d8c596] bg-[#fffdf5] px-4 py-3 transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none">
                  <strong className="break-words">{item.label}</strong>
                  <span className="mt-1 text-sm text-[#67596b]">審査用表示を確認・同意は未記録</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="purchase-control-heading" className="rounded-xl border border-[#b99a4f] bg-[#fbf0d7] p-5 text-center sm:p-9">
          <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">REVIEW-ONLY CONTROL</p>
          <h2 id="purchase-control-heading" className="mt-2 font-serif text-2xl font-semibold leading-[1.45] sm:text-3xl">お申し込み操作はまだ利用できません</h2>
          <p id="purchase-control-description" className="mx-auto mt-4 max-w-3xl leading-8 text-[#67596b]">これは審査用プレビューのため、支払いは発生しません。決済事業者と購入機能は、後続のマイルストーンで接続します。</p>
          <button type="button" disabled aria-disabled="true" aria-describedby="purchase-control-description" className="mt-6 min-h-14 w-full max-w-xl cursor-not-allowed rounded-lg border border-[#8c7d66] bg-[#d7d0c3] px-6 py-4 text-base font-bold text-[#514b43] opacity-100 disabled:pointer-events-none">
            購入機能は現在準備中です
          </button>
          <p className="mt-3 text-sm font-semibold text-[#6a5c4d]">決済・外部送信・保存は開始されません。</p>
        </section>

        <aside aria-labelledby="review-metadata-heading" className="rounded-xl border border-[#d6b86d]/45 bg-[#18152e] p-5 text-[#efe5d0] sm:p-8">
          <p className="text-sm font-bold tracking-[0.14em] text-[#d9bb75]">REVIEW METADATA</p>
          <h2 id="review-metadata-heading" className="mt-2 font-serif text-2xl font-semibold text-[#fff8e8]">審査専用メタデータ</h2>
          <p className="mt-3 leading-7 text-[#cfc4b4]">以下は顧客向けの商品説明ではなく、固定fixtureの審査情報です。</p>
          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <dt className="font-semibold text-[#d9bb75]">fixture ID</dt><dd className="m-0 break-words font-mono text-sm">{purchase.id}</dd>
            <dt className="font-semibold text-[#d9bb75]">request fixture reference</dt><dd className="m-0 break-words font-mono text-sm">{purchase.requestFixtureId}</dd>
            <dt className="font-semibold text-[#d9bb75]">Safety state</dt><dd className="m-0 font-mono text-sm">{purchase.safetyState}</dd>
            <dt className="font-semibold text-[#d9bb75]">transaction state</dt><dd className="m-0 font-mono text-sm">{purchase.transactionState}</dd>
            <dt className="font-semibold text-[#d9bb75]">provider</dt><dd className="m-0 font-mono text-sm">{purchase.provider}</dd>
            <dt className="font-semibold text-[#d9bb75]">delivery timing</dt><dd className="m-0 font-mono text-sm">{purchase.deliveryTiming}</dd>
          </dl>
        </aside>

        <div className="flex flex-wrap gap-3 pb-4">
          <Link href="/review/request/confirmation/normal-001" className="inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] bg-[#fff8e9] px-5 py-3 font-semibold transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none">依頼内容確認へ戻る</Link>
          <Link href="/review" className="inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] bg-[#fff8e9] px-5 py-3 font-semibold transition hover:bg-[#f5ead2] focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2 motion-reduce:transition-none">審査用プレビュー一覧へ</Link>
        </div>
      </div>
    </main>
  );
}

export function UnavailableReviewPurchaseConfirmation({ requestedId }: { requestedId: string }) {
  return (
    <main className="min-h-screen bg-[#f4ead7] px-4 py-12 text-[#2b2335] sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-xl border border-[#cdbb91] bg-[#fff8e9] p-5 shadow-[0_1.5rem_4rem_rgba(39,31,52,.12)] sm:p-9">
        <p className="text-sm font-bold tracking-[0.14em] text-[#80652d]">PURCHASE CONFIRMATION UNAVAILABLE</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold leading-[1.45] sm:text-4xl">購入確認を表示できません</h1>
        <div role="alert" className="mt-6 rounded-lg border border-[#b49242] bg-[#f5ead2] p-5 leading-8">
          指定されたIDは、購入確認の許可リストにありません。安全のため通常fixtureへ置き換えず、購入確認・決済・通常レポートには進めません。
        </div>
        <dl className="mt-6 grid min-w-0 gap-3 rounded-lg border border-[#d8c596] bg-[#fffdf5] p-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="font-semibold text-[#765e2d]">指定されたID</dt><dd className="m-0 min-w-0 break-words font-mono text-sm">{requestedId}</dd>
          <dt className="font-semibold text-[#765e2d]">allowlist status</dt><dd className="m-0 font-mono text-sm">denied</dd>
        </dl>
        <p className="mt-6 leading-8 text-[#67596b]">入力内容を見直す場合は公開フォームへ戻ってください。審査用fixtureの内容は自動入力されません。</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/request" className="inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] px-5 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">入力画面へ戻る</Link>
          <Link href="/review" className="inline-flex min-h-12 items-center rounded-lg border border-[#8a6d2e] px-5 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8a6d2e] focus:ring-offset-2">審査用プレビュー一覧へ</Link>
        </div>
      </article>
    </main>
  );
}
