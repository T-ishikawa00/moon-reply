import type { Metadata } from "next";
import {
  ContentSection,
  DecisionGrid,
  FactRows,
  LegalPageHeader,
  LegalReviewScaffold,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import {
  tokushohoFixedRows,
  tokushohoUnresolvedRows,
} from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "特商法表記 審査表示 | 月の返事",
  description: "固定値と未決定の開示項目を分離した、完成前の特定商取引法に基づく表記の審査表示です。",
};

export default function TokushohoReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/tokushoho">
      <LegalPageHeader
        eyebrow="COMMERCIAL DISCLOSURE REVIEW"
        title="特定商取引法に基づく表記 審査表示"
        description="固定済みの商品事実と、公開前に実情報・外部証拠・専門家確認が必要な項目を、phoneでも横scrollなしで確認する構成です。"
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8 sm:py-14">
        <ReviewCallout strong="この画面は、完成した特定商取引法に基づく表記ではありません。">
          運営者情報、連絡先、支払条件、提供時期、返金条件その他の必須項目が未完成です。購入時の正式表示として使用できません。
        </ReviewCallout>

        <ContentSection
          eyebrow="FIXED ROWS"
          title="固定済みの表示項目"
          intro="以下だけを通常値として表示します。提供方法は計画であり、提供時期の確定ではありません。"
        >
          <FactRows facts={tokushohoFixedRows} />
        </ContentSection>

        <ContentSection
          eyebrow="ADDITIONAL CHARGES"
          title="商品代金以外の必要料金"
          intro="インターネット接続に必要な通信費等は利用者負担とする方向ですが、商品代金以外のサービス料金を含む最終表示は公開前に確認します。"
          tone="ivory"
        >
          <DecisionGrid decisions={[
            { label: "追加費用の最終表示", summary: "現時点の方向を確定条件として扱いません。", status: "運営者判断待ち" },
          ]} />
        </ContentSection>

        <ContentSection
          eyebrow="UNRESOLVED DISCLOSURE ROWS"
          title="未確定の開示項目"
          intro="空欄、架空値、推測値は表示しません。Decision IDは審査専用メタデータです。"
        >
          <DecisionGrid decisions={tokushohoUnresolvedRows} />
        </ContentSection>

        <ContentSection
          eyebrow="PUBLICATION BLOCKERS"
          title="公開前に必要な確認"
          tone="night"
        >
          <ul className="list-disc space-y-3 pl-6 leading-8">
            <li>事業者名、責任者、所在地、電話、メールを実情報と運用証拠で完成させる</li>
            <li>住所・電話の表示方法を、最新の公式情報と専門家確認に基づいて決める</li>
            <li>特定の住所形態が利用可能、または住所・電話を省略できると推測で主張しない</li>
            <li>決済事業者のカテゴリ確認、支払方法、支払時期、返金条件を外部証拠で確認する</li>
            <li>購入前確認と価格・数量・支払・提供・返金条件を一致させる</li>
          </ul>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
