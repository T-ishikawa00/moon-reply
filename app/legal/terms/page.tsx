import type { Metadata } from "next";
import {
  LegalPageHeader,
  LegalReviewScaffold,
  LegalSectionList,
  ReviewCallout,
} from "@/components/legal/LegalReview";
import { termsReviewSections } from "@/lib/legal/review-content";

export const metadata: Metadata = {
  title: "利用規約 審査表示 | 月の返事",
  description: "既存の利用規約ドラフトだけを基礎に、条項構造と未決定事項を確認する公開前の審査表示です。",
};

export default function TermsReviewPage() {
  return (
    <LegalReviewScaffold currentPath="/legal/terms">
      <LegalPageHeader
        eyebrow="TERMS REVIEW"
        title="利用規約 審査表示"
        description="既存の利用規約ドラフトの順序と意味を、確定条項に見せない形で確認します。現在拘束力のある利用条件ではありません。"
        showDates
      />
      <div className="legal-document-body">
        <ReviewCallout strong="このページは現在の利用契約条件ではありません。">
          支払、提供、返金、問い合わせ、管轄その他の未確定事項を、運営者判断・外部証拠・専門家確認の各状態として明示しています。同意checkboxや同意記録はありません。
        </ReviewCallout>
        <LegalSectionList sections={termsReviewSections} />
      </div>
    </LegalReviewScaffold>
  );
}
