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
    "月の返事の受入済みB3レビュー実装・B4a Hosting方向、R1のPrivate build・配備・26/26外部QA証拠、未完了のHard Gateと未承認の法務公開・Provider・Payment状態を分けて確認する審査用索引です。",
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
    label: "B4b Final R1 external QA evidence",
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
    label: "Latest externally verified artifact",
    value: `R1 ${stripeLaneB4bStableReviewDeploymentAuthority.latestExternallyVerifiedArtifact.gitSha}`,
  },
  {
    label: "R1 build・Private Branch Deploy",
    value: "success・success",
  },
  {
    label: "Private protection・Production Deploy",
    value:
      "maintained・B4a 025e28a82c0b773d21ececfd8064af045922079d unchanged / locked",
  },
  {
    label: "R1 rendered technical QA",
    value: "PASS_26_of_26_on_r1_sha",
  },
  {
    label: "RequestMemo blocker・/request robots・safety-stop",
    value: "resolved・PASS・PASS_expected_fail_closed",
  },
  {
    label: "R1 truthfulness QA",
    value: "FAIL_stale_r1_self_evidence_state_only",
  },
  {
    label: "Unauthenticated HTTP",
    value: "PASS_13_of_13_unauthenticated_http_401",
  },
  {
    label: "Authenticated HTTP numeric status",
    value:
      "partial_rendered_pages_confirmed_exact_numeric_http_status_unconfirmed",
  },
  {
    label: "Preview / Production separation",
    value: "PASS・R1 Branch Deploy / Production B4a / Auto Publishing Locked",
  },
  {
    label: "Runtime contract asset inclusion",
    value: "not_fully_proven",
  },
  {
    label: "Rollback / republication・removal / offline",
    value: "not_executed_not_proven・not_executed_not_proven",
  },
  {
    label: "Evidence Sync role",
    value:
      "completed R1 evidenceの記録のみ・追加Provider deployment evidenceを主張しない",
  },
  {
    label: "Final review / B4b acceptance",
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
        description="受入済みのB2方針・B3レビュー実装・B4a Hosting方向、B4a・訂正Candidateの履歴証拠、最新の外部検証済みartifactであるR1のPrivate配備・QA証拠、未完了のHard Gate、法務公開・Stripe・Paymentの未承認状態を混同せず確認します。"
      />

      <div className="legal-document-body">
        <section className="legal-content-section legal-content-section--night" aria-labelledby="legal-authority-title">
          <h2 id="legal-authority-title">現在のレビュー状態</h2>
          <p className="legal-content-section__intro">
            これは公開前のPrivate審査表示です。B3とB4a Hosting方向は受入済みです。受入済みB4a SHAの20/20技術QAとoverall FAIL、訂正Candidate SHAの26/26技術QAとRequestMemo blocker 1件によるoverall FAILを履歴として維持します。最新の外部検証済みartifactはR1 SHA 3f45d40d89660223030bfa1b881e4c04ae394445で、build・Private Branch Deploy・26/26技術QAは成功し、RequestMemo blockerは解消済みです。R1のtruthfulness QAは、配備後に自己証拠表示だけが古くなったためFAILであり、Hosting・Runtime・Safety・Payment・layoutの失敗ではありません。
          </p>
          <div className="legal-content-section__body">
            <FactRows facts={reviewAuthorityFacts} />
            <ReviewCallout strong="B4bは未受入で、Netlify Hard Gateも通過していません。">
              Human管理下で実施済みなのは、限定されたNetlify接続・Private project作成、B4a・訂正Candidate・R1のbuild／Private配備証拠、可視性確認、deploy lock、外部QAです。このEvidence Sync sourceは完了済みR1証拠を記録するだけで、自身について追加のProvider deployment evidenceを主張しません。認証済みHTTP数値status、runtime contract asset全件、rollback／republication、removal／offlineは未証明です。追加Provider操作、public visibility、domain購入、DNS変更、法務公開、Stripe承認・提出・有効化、Payment実装、Production Payment、Production Runtime、返金実行、メール送信、問い合わせ受付、販売事業者情報の開示運用には新たな権限が必要です。
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
