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
    "安全確認を通常の有料鑑定より前に行う停止境界と、確認が必要な場合の扱いを説明する公開前文書です。",
};

export default function UnsupportedCasesReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/unsupported-cases">
      <LegalPageHeader
        eyebrow="SAFETY AND UNSUPPORTED CASES REVIEW"
        title="通常鑑定として扱わないご相談"
        description="相談した方を責めず、安全上の問題を恋愛の継続や連絡の後押しへ変換しないための停止境界です。"
        status="公開前・安全方針の審査用"
      />
      <div className="legal-document-body legal-document-body--care">
        <ReviewCallout strong="安全確認は必ず決済より前に行います。">
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
            そのため、危険、緊急、通常鑑定で扱えない内容、無効・矛盾・不明な入力、技術的なエラーがある場合は通常の有料鑑定へ進めません。通常の有料鑑定を安全に提供できることが確認されない間は、鑑定ノートやメッセージ案も生成しません。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="CLARIFICATION"
          title="追加情報や確認が必要な場合"
          intro="確認が必要であることと、利用できないことを同一視しません。"
          tone="ivory"
        >
          <p>
            相談内容を安全に評価するため追加情報や確認が必要な場合は、その確認が完了するまで決済、通常の鑑定ノート、メッセージ案へ進みません。安全に再評価できれば、通常の有料鑑定へ進める場合があります。
          </p>
          <p>
            待つこと、今は送らないこと、一時的に連絡を控えること、相手の境界を尊重することだけを理由に、自動的に利用不可とは扱いません。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="UNINTENDED CHARGE"
          title="停止前に意図せず請求された場合"
          intro="通常の取消ではなく、意図しない請求の是正として扱う方向です。"
        >
          <p>
            サービス側の検知漏れや処理不備により、通常鑑定として扱えない相談が停止前に意図せず請求された場合は、鑑定ノートとメッセージ案の生成を停止し、Payment Integrityとして実際の経済的な誤りを980円を上限とせず是正します。決済・是正機能は未実装です。
          </p>
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
