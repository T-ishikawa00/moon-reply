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
        description="固定済みの商品事実と、公開前に実情報・外部証拠が必要な項目を、スマートフォンでも横スクロールなく確認する構成です。"
      />
      <div className="legal-document-body">
        <ReviewCallout strong="この画面は、完成した特定商取引法に基づく表記ではありません。">
          運営者情報、連絡先、支払条件、提供時期、返金条件その他の必須項目が未完成です。購入時の正式表示として使用できません。
        </ReviewCallout>

        <ContentSection
          eyebrow="FIXED ROWS"
          title="固定済みの表示項目"
          intro="価格、数量、一度きりの購入、自動更新なし、18歳以上の必須確認、商品・AI・非保証の説明だけを固定値として表示します。"
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
          intro="空欄、架空値、推測値は表示しません。内部の審査情報は各項目の折りたたみ内に隔離します。"
        >
          <DecisionGrid decisions={tokushohoUnresolvedRows} />
        </ContentSection>

        <ContentSection
          eyebrow="CONDITIONAL SELLER DISCLOSURE DIRECTION"
          title="請求に応じた販売事業者情報の開示"
          intro="採用済みの条件付き方向であり、現在利用できる制度や受付経路ではありません。"
          tone="ivory"
        >
          <p className="leading-8">
            法令と実際のStripe要件の双方が許す場合に限り、購入前に利用できる請求経路を設け、必要な販売事業者情報を遅滞なく開示する方向です。現在は事業用メール、問い合わせフォーム、受付処理がなく、利用者が請求できる状態ではありません。
          </p>
        </ContentSection>

        <ContentSection
          eyebrow="PUBLICATION BLOCKERS"
          title="公開前に必要な確認"
          tone="night"
        >
          <ul className="list-disc space-y-3 pl-6 leading-8">
            <li>事業者名、責任者、所在地、電話、事業用メールを実情報と運用証拠で完成させる</li>
            <li>住所・電話の表示方法を、最新の公式情報、実情報、実際の外部事業者要件に基づいて決める</li>
            <li>特定の住所形態が利用可能、または住所・電話を省略できると推測で主張しない</li>
            <li>販売事業者情報の開示請求を採用する場合は、実在する購入前の受付経路を用意する</li>
            <li>決済事業者のカテゴリ確認、支払方法、支払時期、返金条件を外部証拠で確認する</li>
            <li>購入前確認と価格・数量・支払・提供・返金条件を一致させる</li>
          </ul>
        </ContentSection>
      </div>
    </LegalReviewScaffold>
  );
}
