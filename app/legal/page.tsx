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
    "月の返事の受入済みB3レビュー実装・B4a Hosting方向・B4b Private Review technical scopeと、未承認のProduction・法務公開・Provider・Payment状態を分けて確認する審査用索引です。",
};

const closureEvidence =
  stripeLaneB4bStableReviewDeploymentAuthority.finalPrivateReviewHardGateClosureEvidence;
const acceptance =
  stripeLaneB4bStableReviewDeploymentAuthority.finalPrivateReviewHardGateAcceptance;

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
    label: "B4b Private Review technical evidence closure",
    value: `${stripeLaneB4bStableReviewDeploymentAuthority.currentStatus}・technical evidence complete・Human + ChatGPT受入済み`,
  },
  {
    label: "Technical Evidence Closure SHA",
    value: acceptance.technicalClosureSha,
  },
  {
    label: "Product runtime Correction SHA",
    value: closureEvidence.productCorrection.gitSha,
  },
  {
    label: "Product Correction",
    value: "next.config.ts only・runtime assets 11/15 → 15/15 traced",
  },
  {
    label: "QA-only probe evidence",
    value: `${closureEvidence.qaProbeEvidence.gitSha}・temporary evidence only・Product lineageから除外`,
  },
  {
    label: "Authenticated HTTP",
    value: closureEvidence.technicalEvidence.authenticatedHttp,
  },
  {
    label: "Unauthenticated HTTP",
    value: closureEvidence.technicalEvidence.unauthenticatedHttp,
  },
  {
    label: "Runtime contract asset inclusion",
    value: closureEvidence.technicalEvidence.runtimeContractAssets,
  },
  {
    label: "Preview / Production separation",
    value: "complete・Private Branch context / locked Production B4a",
  },
  {
    label: "Private rollback / republication",
    value: closureEvidence.technicalEvidence.privateRollbackRepublication,
  },
  {
    label: "Deploy removal / offline",
    value: closureEvidence.technicalEvidence.removalOffline,
  },
  {
    label: "Private protection・route rendering・Safety fail-closed",
    value: "complete・complete・complete",
  },
  {
    label: "Technical evidence",
    value: closureEvidence.technicalEvidence.overall,
  },
  {
    label: "Production branch / SHA",
    value: `${closureEvidence.productionPreservation.branch}・${closureEvidence.productionPreservation.gitSha}`,
  },
  {
    label: "Production state / operations",
    value: "unchanged / locked・Publish 0・unlock 0・visibility 0・domain/DNS 0・env/secrets 0",
  },
  {
    label: "Historical B4b evidence",
    value: "B4a・Candidate・R1・Final Evidence Sync snapshots preserved",
  },
  {
    label: "Technical closure source role",
    value: "prior Human-supplied evidenceを記録・historical predecessorとして不変",
  },
  {
    label: "ChatGPT final review",
    value: `${acceptance.chatgptFinalReviewOutcome} / ${acceptance.chatgptFinalReview}`,
  },
  {
    label: "Human final review",
    value: `${acceptance.humanFinalReviewOutcome} / ${acceptance.humanFinalReview}`,
  },
  {
    label: "B4b acceptance",
    value: acceptance.b4bAcceptance,
  },
  {
    label: "Netlify Hard Gate",
    value: `Private Review scopeでaccepted complete（${acceptance.netlifyHardGate}）`,
  },
  {
    label: "Paid Production Hosting",
    value: `${acceptance.paidProductionHosting}・performance / secrets / observability / cost / plan evidence未完了`,
  },
  {
    label: "Production readiness",
    value: "not established",
  },
  {
    label: "今後の外部操作",
    value: "追加Provider操作・public visibility・domain/DNSは未承認",
  },
  { label: "Production Runtime", value: "未承認・未有効化" },
  { label: "法務公開", value: "未承認" },
  { label: "Public Launch", value: "未承認" },
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
        description="受入済みのB2方針・B3レビュー実装・B4a Hosting方向・B4b Private Review technical scopeと、Paid Production・法務公開・Stripe・Paymentの未承認状態を混同せず確認します。"
      />

      <div className="legal-document-body">
        <section className="legal-content-section legal-content-section--night" aria-labelledby="legal-authority-title">
          <h2 id="legal-authority-title">現在のレビュー状態</h2>
          <p className="legal-content-section__intro">
            これは公開前のPrivate審査表示です。Technical Evidence Closure SHA ae20d3540a890f0a0b567695fd982b1d5a57d7f9に記録されたB4b Private Review technical evidenceはcompleteです。ChatGPT final reviewとHuman final reviewはPASS / complete、B4b acceptanceはcomplete、Netlify Hard GateはPrivate Review scopeでaccepted completeです。Product runtime CorrectionはSHA 004c3fbf6efcc0914cccb1d8ff08b41de7f655a6で、変更はnext.config.tsだけです。QA probe SHA 68e16cebb1eccd0966e3a6e11aedef030cab87aaは一時的なPrivate QA証拠だけに使用され、Product lineageから除外されています。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={reviewAuthorityFacts} />
            <ReviewCallout strong="B4b Private Review technical evidence、ChatGPT / Human final review、B4b acceptanceはcompleteです。">
              この受入はPrivate Review technical scopeだけです。ProductionはB4a SHAのまま unchanged / lockedで、Paid Production Hostingはprovisional、Production readinessはnot establishedです。Production Runtime未承認、Production Payment未承認、Stripe未承認・未正式選定、public visibility未承認、domain/DNS未承認、法務公開未承認、Public Launch未承認です。Paymentは未実装です。追加Provider操作、Publish・unlock・env/secrets操作、返金実行、メール送信、問い合わせ受付、販売事業者情報の開示運用には新たな権限が必要です。次candidateのPaid Production Readiness Planningはplanning only / not started / no external authority createdであり、まだ開始していません。
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
