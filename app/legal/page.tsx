import type { Metadata } from "next";
import Link from "next/link";
import {
  DecisionGrid,
  FactRows,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import {
  fixedProductFacts,
  legalPageInventory,
  publicationReadiness,
  stripeLaneB4aDeploymentReadinessAuthority,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "法務・Safety 文書索引 | 月の返事",
  description:
    "月の返事の受入済みB3レビュー実装とB4a Hosting方向、未証明のB4b Hosting実行、未承認の法務公開・Provider・Payment状態を分けて確認する審査用索引です。",
};

const reviewAuthorityFacts = [
  { label: "B2 文書・仕様・法務方針", value: "Human + ChatGPT受入済み（2026-08-13）" },
  { label: "B3 画面実装", value: "受入済み（2026-08-14）" },
  { label: "Human Visual QA", value: "PASS・complete" },
  { label: "B3 ChatGPT review", value: "PASS・complete" },
  { label: "B3 Human acceptance / B3 acceptance", value: "complete / complete" },
  {
    label: "B4a Hosting方向",
    value: "Human + ChatGPT受入済み・Netlifyを最初のB4bレビュー配備試行先として選定",
  },
  {
    label: "B4a ChatGPT review / Human acceptance / B4a acceptance",
    value: "PASS・complete / complete / complete",
  },
  {
    label: "Netlify初期レビュー計画",
    value: `${stripeLaneB4aDeploymentReadinessAuthority.initialReviewPlan}・実build／配備は未実施`,
  },
  {
    label: "Hard Gate・Production方向",
    value: "未証明・Paid Productionはprovisional",
  },
  {
    label: "現在の作業",
    value: stripeLaneB4aDeploymentReadinessAuthority.currentWork,
  },
  {
    label: "B4b external work authority",
    value: "separately_authorized_external_work・未承認",
  },
  { label: "法務公開", value: "未承認" },
  { label: "Stripe feasibility・承認・正式選定", value: "未確立・未承認・未選定" },
  { label: "Payment実装", value: "未実装" },
  { label: "Production Payment", value: "未承認" },
  { label: "Contact・メール・販売事業者情報開示", value: "運用未解決" },
] as const;

const publicationBlockers = publicationReadiness.slice(0, 6);
const operationalReadiness = [publicationReadiness[6]];
const finalHumanApproval = [publicationReadiness[7]];

export default function LegalIndexPage() {
  return (
    <LegalReviewScaffold currentPath="/legal">
      <LegalPageHeader
        eyebrow="LEGAL DOCUMENT INDEX"
        title="法務・Safety 文書索引"
        description="受入済みのB2方針・B3レビュー実装・B4a Hosting方向と、未実施のB4b、法務公開・Stripe・Paymentの未完了状態を混同せず確認します。"
      />

      <div className="legal-document-body">
        <section className="legal-content-section legal-content-section--night" aria-labelledby="legal-authority-title">
          <h2 id="legal-authority-title">現在のレビュー状態</h2>
          <p className="legal-content-section__intro">
            これは公開判断のための審査表示です。B3とB4a Hosting方向は受入済みです。現在の段階はB4bですが、Netlifyの実build・配備は行われておらず、外部操作には別途承認が必要です。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={reviewAuthorityFacts} />
            <ReviewCallout strong="B3のReview-ready Website/Public Surface実装は受入済みです。">
              B4aのChatGPT reviewはPASS・complete、Human acceptanceとB4a acceptanceはcompleteです。現在の作業はStripe Lane B stable review URL deployment (B4b)ですが、B4b external workは未承認です。Netlify account/site・Provider URL作成・実build・deployment、法務公開、domain購入、DNS変更、Stripe承認・提出・有効化、Payment実装、Production Payment、Production Runtime、返金実行、メール送信、問い合わせ受付、販売事業者情報の開示運用は開始または承認されていません。
            </ReviewCallout>
          </div>
        </section>

        <section className="legal-content-section legal-content-section--paper" aria-labelledby="legal-fixed-title">
          <h2 id="legal-fixed-title">固定済みの商品事実</h2>
          <p className="legal-content-section__intro">
            B2でHuman + ChatGPTが受け入れた事実だけを通常値として表示し、未確定の運営者・外部事業者情報と混在させません。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={fixedProductFacts} />
          </div>
        </section>

        <section className="legal-content-section legal-content-section--ivory" aria-labelledby="legal-index-title">
          <h2 id="legal-index-title">文書一覧</h2>
          <p className="legal-content-section__intro">
            全ページが公開前のReview modeです。リンクが開くことは公開承認、利用契約への同意、購入、問い合わせ受付を意味しません。
          </p>
          <ol className="legal-index-list">
            {legalPageInventory.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.purpose}</small>
                  </span>
                  <span className="legal-page-status">公開前</span>
                  <b aria-hidden="true">→</b>
                </Link>
                <details>
                  <summary>公開前確認事項</summary>
                  <p>{item.unresolved}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>

        <section className="legal-readiness" aria-labelledby="legal-readiness-title">
          <h2 id="legal-readiness-title">公開準備</h2>
          <ReviewCallout strong="現在の文書群は販売開始または公開承認に使用できません。">
            運営者・販売事業者情報の開示経路・外部事業者・商取引・プライバシー・日付・最終Human承認が未完了です。専門家相談は必要に応じた任意のエスカレーションであり、未実施という事実だけを公開停止理由にはしません。
          </ReviewCallout>

          <section aria-labelledby="legal-blockers-title">
            <h3 id="legal-blockers-title">公開を止める項目</h3>
            <DecisionGrid decisions={publicationBlockers} />
          </section>

          <section aria-labelledby="legal-operations-title">
            <h3 id="legal-operations-title">運用開始前に決める項目</h3>
            <DecisionGrid decisions={operationalReadiness} />
          </section>

          <section aria-labelledby="legal-human-title">
            <h3 id="legal-human-title">最終公開判断</h3>
            <DecisionGrid decisions={finalHumanApproval} />
          </section>
        </section>
      </div>
    </LegalReviewScaffold>
  );
}
