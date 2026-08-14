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
  stripeLaneB4bStableReviewDeploymentAuthority,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "法務・Safety 文書索引 | 月の返事",
  description:
    "月の返事の受入済みB3レビュー実装・B4a Hosting方向、訂正CandidateのPrivate build・配備・26/26再QA証拠、未配備のR1と未承認の法務公開・Provider・Payment状態を分けて確認する審査用索引です。",
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
    label: "B4b Remaining Review Wording + External Evidence R1",
    value: `${stripeLaneB4bStableReviewDeploymentAuthority.currentStatus}・未受入`,
  },
  {
    label: "Original deployed B4a SHA",
    value:
      stripeLaneB4bStableReviewDeploymentAuthority.originalDeployedB4aEvidence.gitSha,
  },
  {
    label: "Original B4a technical / overall QA",
    value: "20/20 PASS・FAIL_truthfulness_blockers_on_deployed_b4a_sha",
  },
  {
    label: "Corrected Candidate SHA",
    value:
      stripeLaneB4bStableReviewDeploymentAuthority.correctedCandidateEvidence.gitSha,
  },
  {
    label: "Corrected Candidate build・Private Branch Deploy",
    value: "success・success",
  },
  {
    label: "Private protection・Production Deploy",
    value: "maintained・unchanged / locked",
  },
  {
    label: "Corrected Candidate rendered technical re-QA",
    value: "26/26 PASS",
  },
  {
    label: "Corrected Candidate overall re-QA",
    value: "FAIL・RequestMemo source blocker 1件",
  },
  {
    label: "/request robots・safety-stop",
    value: "PASS・PASS_expected_fail_closed",
  },
  {
    label: "R1 source correction・Private deployment・external re-QA",
    value: "present・not_performed・pending",
  },
  {
    label: "R1 review / B4b acceptance",
    value: "ChatGPT pending・Human pending・B4b pending",
  },
  {
    label: "Netlify Hard Gate・Paid Production Hosting",
    value: "not passed・provisional",
  },
  {
    label: "今後の外部操作",
    value: "追加Provider操作・public visibility・domain/DNSは未承認",
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
        description="受入済みのB2方針・B3レビュー実装・B4a Hosting方向、Humanが取得したB4aと訂正Candidateの限定Private配備証拠、未配備・再QA待ちのR1、法務公開・Stripe・Paymentの未完了状態を混同せず確認します。"
      />

      <div className="legal-document-body">
        <section className="legal-content-section legal-content-section--night" aria-labelledby="legal-authority-title">
          <h2 id="legal-authority-title">現在のレビュー状態</h2>
          <p className="legal-content-section__intro">
            これは公開前のPrivate審査表示です。B3とB4a Hosting方向は受入済みです。受入済みB4a SHAの20/20技術QAとoverall FAILを履歴として維持し、訂正Candidate SHAのNetlify build・Private Branch Deploy・26/26技術再QAも完了しています。訂正Candidateのoverall再QAはRequestMemoのsource blocker 1件によりFAILで、R1ではsource訂正だけがリポジトリに存在し、R1配備・外部再QA・B4b受入は未完了です。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={reviewAuthorityFacts} />
            <ReviewCallout strong="B4bは未受入で、Netlify Hard Gateも通過していません。">
              Human管理下で実施済みなのは、限定されたNetlify接続・Private project作成・受入済みB4a SHAと訂正Candidate SHAのbuild／Private配備・可視性確認・deploy lock・外部QAです。R1のPrivate配備・外部再QA、追加Provider操作、public visibility、domain購入、DNS変更、法務公開、Stripe承認・提出・有効化、Payment実装、Production Payment、Production Runtime、返金実行、メール送信、問い合わせ受付、販売事業者情報の開示運用には新たな権限が必要です。
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
