import Link from "next/link";
import {
  PrePaymentSafetyStop,
} from "@/components/request/PrePaymentSafetyStop";
import styles from "@/components/request/PrePaymentSafetyStop.module.css";
import type {
  ClarificationPrePaymentSafetyReviewFixture,
  PrePaymentSafetyReviewFixture,
} from "@/fixtures/review/prepayment-safety-states";

const clarificationCopy: Record<string, string> = {
  boundary_state_required: "現在の連絡状況を、もう一度選んでください。",
  boundary_state_conflict:
    "選択した連絡状況と相談文に食い違いがないか確認してください。",
  latest_inbound_message_required:
    "相手から届いた最新の文面を追加してください。",
  unsafe_execution_intent_required:
    "その方法を実行したいのか、やめたいのかを確認してください。",
  current_safety_status_required:
    "現在の安全に関わる状況かどうかを確認してください。",
  business_permission_required:
    "必要な実務連絡が明確に許可されているか確認してください。",
  business_scope_required:
    "今回の依頼が許可された実務上の用件だけか確認してください。",
  reply_invitation_required:
    "新しい文面が返答を明確に求めているか確認してください。",
  reply_scope_required:
    "予定する返答が最新の用件だけに限られているか確認してください。",
  professional_scope_required:
    "専門判断を含めず、気持ちや状況の整理だけにできるか確認してください。",
  structured_content_conflict:
    "選択内容または元の相談文を見直して、利用確認をやり直してください。",
};

function ReviewBoundary() {
  return (
    <aside className={styles.reviewBoundary} role="note">
      <strong>P6 利用確認・Product review</strong>
      <span>
        固定fixtureだけを表示します。API、AI、外部送信、保存、メール、決済は実行しません。
      </span>
    </aside>
  );
}

function ReviewNavigation() {
  return (
    <nav className={styles.reviewNav} aria-label="審査用ナビゲーション">
      <Link href="/request">実際の依頼シートを見る</Link>
      <Link href="/review">審査用一覧へ戻る</Link>
    </nav>
  );
}

function ReviewMetadata({ fixture }: { fixture: PrePaymentSafetyReviewFixture }) {
  const classification =
    fixture.kind === "eligible"
      ? fixture.classification
      : fixture.kind === "stop"
        ? fixture.stopKind
        : "needs_clarification";

  return (
    <details className={styles.reviewDisclosure}>
      <summary>審査用fixture情報を表示</summary>
      <dl>
        <div>
          <dt>fixture ID</dt>
          <dd>{fixture.id}</dd>
        </div>
        <div>
          <dt>server result</dt>
          <dd>{classification}</dd>
        </div>
        <div>
          <dt>purchase gate</dt>
          <dd>{fixture.purchaseGateSatisfied ? "satisfied" : "not satisfied"}</dd>
        </div>
        <div>
          <dt>payment</dt>
          <dd>implementation/session/authority = false/false/false</dd>
        </div>
      </dl>
    </details>
  );
}

function ClarificationReview({
  fixture,
}: {
  fixture: ClarificationPrePaymentSafetyReviewFixture;
}) {
  return (
    <article className={styles.reviewSheet} aria-labelledby="review-clarification-title">
      <header className={styles.reviewHeader}>
        <p className={styles.eyebrow}>決済前の利用確認</p>
        <h1 id="review-clarification-title">{fixture.heading}</h1>
        <span>{fixture.description}</span>
      </header>
      <section className={styles.reviewSection} aria-labelledby="review-questions-title">
        <h2 id="review-questions-title">必要なことだけ、短く確認します</h2>
        <ul className={styles.provideList}>
          {fixture.requiredClarificationCodes.map((code) => (
            <li key={code}>{clarificationCopy[code]}</li>
          ))}
        </ul>
        <p>
          確認は一度だけです。解消しない場合は購入へ進まず、連絡状況または元の相談文を修正して利用確認をやり直します。
        </p>
      </section>
      <section className={styles.reviewSection} aria-labelledby="review-no-payment-title">
        <h2 id="review-no-payment-title">この状態では購入へ進みません</h2>
        <p>この画面では決済は発生しません。</p>
      </section>
      <ReviewMetadata fixture={fixture} />
    </article>
  );
}

export function ReviewPrePaymentSafetyConfirmation({
  fixture,
}: {
  fixture: PrePaymentSafetyReviewFixture;
}) {
  if (fixture.kind === "stop") {
    return (
      <main className={styles.reviewPage}>
        <ReviewBoundary />
        <PrePaymentSafetyStop kind={fixture.stopKind} reviewMode />
        <ReviewMetadata fixture={fixture} />
        <ReviewNavigation />
      </main>
    );
  }

  if (fixture.kind === "clarification") {
    return (
      <main className={styles.reviewPage}>
        <ReviewBoundary />
        <ClarificationReview fixture={fixture} />
        <ReviewNavigation />
      </main>
    );
  }

  return (
    <main className={styles.reviewPage}>
      <ReviewBoundary />
      <article className={styles.reviewSheet} aria-labelledby="review-purchase-title">
        <header className={styles.reviewHeader}>
          <p className={styles.eyebrow}>お申し込み前の最終確認</p>
          <h1 id="review-purchase-title">{fixture.scopeLabel}</h1>
          <span>{fixture.heading}</span>
        </header>
        <section className={styles.reviewSection} aria-labelledby="review-product-title">
          <h2 id="review-product-title">この鑑定でお返しするもの</h2>
          <p>{fixture.description}</p>
          <ul className={styles.provideList}>
            {fixture.provides.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className={styles.reviewSection} aria-labelledby="review-draft-title">
          <h2 id="review-draft-title">文案について</h2>
          <p>{fixture.draftAvailability}</p>
        </section>
        <section className={styles.reviewSection} aria-labelledby="review-price-title">
          <div className={styles.offerRow}>
            <div>
              <h2 id="review-price-title">予定している料金</h2>
              <p>1相談 / 1鑑定ノート・都度払い・自動更新なし</p>
            </div>
            <strong>{fixture.plannedPrice}</strong>
          </div>
        </section>
        <section className={styles.reviewSection} aria-labelledby="review-payment-title">
          <h2 id="review-payment-title">決済機能は現在準備中です</h2>
          <p>
            決済機能は現在準備中です。{"\n"}
            この画面では料金は発生しません。
          </p>
          <button
            type="button"
            className={styles.disabledControl}
            disabled
            aria-disabled="true"
          >
            購入機能は現在準備中です
          </button>
        </section>
        <ReviewMetadata fixture={fixture} />
      </article>
      <ReviewNavigation />
    </main>
  );
}

export function UnavailablePrePaymentSafetyReview({
  requestedId,
}: {
  requestedId: string;
}) {
  return (
    <main className={styles.reviewPage}>
      <ReviewBoundary />
      <article className={styles.reviewSheet} aria-labelledby="review-unavailable-title">
        <header className={styles.reviewHeader}>
          <p className={styles.eyebrow}>決済前の利用確認</p>
          <h1 id="review-unavailable-title">審査用の表示を確認できません</h1>
          <span>
            指定されたIDは許可リストにありません。別の結果へ置き換えず、購入確認にも進めません。
          </span>
        </header>
        <details className={styles.reviewDisclosure}>
          <summary>審査用fixture情報を表示</summary>
          <dl>
            <div>
              <dt>requested ID</dt>
              <dd>{requestedId}</dd>
            </div>
            <div>
              <dt>allowlist</dt>
              <dd>denied</dd>
            </div>
          </dl>
        </details>
      </article>
      <ReviewNavigation />
    </main>
  );
}
