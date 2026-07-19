import type { Metadata } from "next";
import Link from "next/link";
import {
  ContentSection,
  DecisionGrid,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import { unsupportedCaseCategories } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "通常鑑定として扱わない相談 審査表示 | 月の返事",
  description:
    "Safety-firstの通常鑑定停止境界とM1のrejected・needs_review処理を確認する公開前文書です。",
};

const m1StopDecisions = [
  {
    label: "rejected",
    summary:
      "決済へ進めず、通常鑑定ノートやメッセージ案を生成しません。",
    status: "内部方針決定済み・実装証拠待ち" as const,
    decisionIds: ["OP-034"],
  },
  {
    label: "needs_review",
    summary:
      "本番取扱いが別途承認されるまで決済へ進めず、通常鑑定ノートやメッセージ案を生成しません。",
    status: "内部方針決定済み・実装証拠待ち" as const,
    decisionIds: ["OP-034"],
  },
];

export default function UnsupportedCasesReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/unsupported-cases">
      <LegalPageHeader
        eyebrow="SAFETY AND UNSUPPORTED CASES REVIEW"
        title="通常鑑定として扱わないご相談"
        description="相談した方を責めず、安全上の問題を恋愛の継続や連絡の後押しへ変換しないための停止境界です。"
        status="公開前・Safety審査用"
      />
      <div className="legal-document-body legal-document-body--care">
        <ReviewCallout strong="Safetyは必ず決済より前に確認します。">
          全ての相談を通常の恋愛鑑定として扱うわけではありません。安全上の問題を含む場合は、安全を優先して通常鑑定を停止します。これは相談した方を非難・侮辱する対応ではありません。
        </ReviewCallout>

        <ContentSection
          eyebrow="UNSUPPORTED CATEGORIES"
          title="月の返事で扱わない相談"
        >
          <ul className="legal-plain-list legal-plain-list--care">
            {unsupportedCaseCategories.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </ContentSection>

        <ContentSection
          eyebrow="WHY WE STOP"
          title="なぜ通常鑑定を行わないのか"
        >
          <p>
            危険や強い恐怖が関わる状況を、恋愛の駆け引きや「送るべき文面」へ置き換えると、相談した方や相手の安全を損なうおそれがあります。
          </p>
          <p>
            そのため、決定的なSafety ruleで通常鑑定の前に分類し、normal_allowed だけを依頼メモと購入前確認へ進めます。needs_review と rejected は fail closed で停止します。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="CURRENT M1 HANDLING"
          title="現在のM1停止処理"
          intro="既存の分類語彙とseverityを変更せず、固定fixtureとlocal deterministic ruleの結果を確認します。"
          tone="ivory"
        >
          <DecisionGrid decisions={m1StopDecisions} />
          <nav className="legal-inline-links" aria-label="Safety審査状態">
            <Link href="/review/request/rejected">
              rejected 審査状態 <span aria-hidden="true">→</span>
            </Link>
            <Link href="/review/request/needs-review">
              needs_review 審査状態 <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </ContentSection>

        <ContentSection
          eyebrow="EMERGENCY BOUNDARY"
          title="緊急支援との境界"
          tone="night"
        >
          <p>
            月の返事は、緊急支援、警察、医療、心理支援、法律相談、公的相談窓口の代替ではなく、緊急対応を行いません。
          </p>
          <p>
            相談先の名称、リンク、電話番号は、公式情報、対象地域、用途、確認日を検証した後にのみ掲載します。現在は未検証の支援情報を掲載しません。
          </p>
          <DecisionGrid
            decisions={[
              {
                label: "公式支援情報",
                summary:
                  "検証済みの公式支援情報はまだ登録されていません。",
                status: "外部証拠待ち",
                decisionIds: ["OP-033"],
              },
            ]}
          />
        </ContentSection>

        <ContentSection eyebrow="CONTACT PREPARATION" title="問い合わせ準備">
          <p>
            お問い合わせ受付は稼働していません。form、mailto、外部送信、受付済み表示はなく、構成だけを確認できます。
          </p>
          <Link href="/contact" className="legal-document-action">
            非稼働のお問い合わせ準備ページを確認する
          </Link>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
